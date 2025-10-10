// supabase/edge-functions/perform_action/index.ts
// 单据驱动的事务处理 Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ActionRequest {
  action_type: string
  asset_type?: string
  asset_id?: string
  qty?: number
  from_location_id?: string
  to_location_id?: string
  by_user: string
  related_person?: string
  work_order?: string
  consumable_id?: string
  code_id?: string
  code_type?: string
  remark?: string
}

interface CompatibilityCheck {
  printer_model_id: string
  consumable_id: string
  code_type: string
}

serve(async (req) => {
  // 处理 CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action }: { action: ActionRequest } = await req.json()

    // 参数验证
    if (!action.action_type || !action.by_user) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数: action_type, by_user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 开始事务处理
    const { data: transactionResult, error: transactionError } = await supabaseClient.rpc('perform_action_transaction', {
      p_action: action
    })

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      return new Response(
        JSON.stringify({ error: transactionError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        action_id: transactionResult?.action_id,
        message: '操作已成功完成'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: '服务器内部错误' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/*
对应的 SQL 函数需要添加到迁移文件中:

CREATE OR REPLACE FUNCTION perform_action_transaction(p_action JSONB)
RETURNS JSONB AS $$
DECLARE
  v_action_id UUID;
  v_asset RECORD;
  v_printer_model_id UUID;
  v_compatibility BOOLEAN;
  v_code_binding BOOLEAN;
  v_current_balance NUMERIC DEFAULT 0;
  v_new_balance NUMERIC;
  v_error_msg TEXT;
BEGIN
  -- 设置当前用户用于审计
  PERFORM set_config('app.current_user', p_action->>'by_user', true);

  -- 生成新的action ID
  v_action_id := uuid_generate_v4();

  -- 1. 插入 action 记录
  INSERT INTO actions (
    id, action_type, asset_type, asset_id, qty,
    from_location_id, to_location_id, by_user,
    related_person, work_order, remark
  ) VALUES (
    v_action_id,
    p_action->>'action_type',
    p_action->>'asset_type',
    NULLIF(p_action->>'asset_id', '')::UUID,
    COALESCE((p_action->>'qty')::NUMERIC, 1),
    NULLIF(p_action->>'from_location_id', '')::UUID,
    NULLIF(p_action->>'to_location_id', '')::UUID,
    p_action->>'by_user',
    p_action->>'related_person',
    p_action->>'work_order',
    p_action->>'remark'
  );

  -- 2. 根据操作类型执行相应的业务逻辑
  CASE p_action->>'action_type'
    WHEN '借用', '调拨', '安装', '拆卸', '报修', '报废' THEN
      -- 更新资产位置和状态
      IF (p_action->>'asset_id') IS NOT NULL THEN
        SELECT * INTO v_asset FROM assets WHERE id = (p_action->>'asset_id')::UUID;

        IF NOT FOUND THEN
          RAISE EXCEPTION '资产不存在: %', p_action->>'asset_id';
        END IF;

        -- 更新资产位置
        IF (p_action->>'to_location_id') IS NOT NULL THEN
          UPDATE assets
          SET location_id = (p_action->>'to_location_id')::UUID,
              owner_person = CASE
                WHEN p_action->>'action_type' = '借用' THEN p_action->>'related_person'
                WHEN p_action->>'action_type' = '归还' THEN NULL
                ELSE owner_person
              END,
              status = CASE
                WHEN p_action->>'action_type' = '报修' THEN '维修中'
                WHEN p_action->>'action_type' = '报废' THEN '已报废'
                WHEN p_action->>'action_type' = '借用' THEN '借出'
                WHEN p_action->>'action_type' = '归还' THEN '可用'
                ELSE status
              END
          WHERE id = (p_action->>'asset_id')::UUID;
        END IF;
      END IF;

    WHEN '安装' THEN
      -- 耗材/码安装需要兼容性检查
      IF (p_action->>'consumable_id') IS NOT NULL AND (p_action->>'asset_id') IS NOT NULL THEN
        -- 获取打印机型号
        SELECT model_id INTO v_printer_model_id
        FROM assets
        WHERE id = (p_action->>'asset_id')::UUID AND asset_type = '打印机';

        IF v_printer_model_id IS NULL THEN
          RAISE EXCEPTION '指定的资产不是打印机或不存在';
        END IF;

        -- 检查兼容性
        SELECT check_compatibility(
          v_printer_model_id,
          (p_action->>'consumable_id')::UUID,
          (p_action->>'code_type')::code_type
        ) INTO v_compatibility;

        IF NOT v_compatibility THEN
          RAISE EXCEPTION '兼容性检查失败: 该耗材/码类型与打印机不兼容';
        END IF;
      END IF;

      -- 码绑定检查
      IF (p_action->>'code_id') IS NOT NULL AND (p_action->>'asset_id') IS NOT NULL THEN
        SELECT check_code_binding(
          (p_action->>'code_id')::UUID,
          (p_action->>'asset_id')::UUID
        ) INTO v_code_binding;

        IF NOT v_code_binding THEN
          RAISE EXCEPTION '码绑定检查失败: 专码已绑定其他设备或设备已绑定其他专码';
        END IF;

        -- 更新码绑定关系
        UPDATE codes
        SET bound_printer_id = (p_action->>'asset_id')::UUID,
            status = '已发'
        WHERE id = (p_action->>'code_id')::UUID;
      END IF;

    WHEN '耗材领用', '耗材归还' THEN
      -- 处理耗材库存变化
      IF (p_action->>'consumable_id') IS NOT NULL THEN
        -- 获取当前库存
        SELECT COALESCE(balance, 0) INTO v_current_balance
        FROM stock_ledger
        WHERE item_type = '耗材'
          AND item_id = (p_action->>'consumable_id')::UUID
          AND location_id = COALESCE(
            (p_action->>'from_location_id')::UUID,
            (p_action->>'to_location_id')::UUID
          )
        ORDER BY created_at DESC
        LIMIT 1;

        -- 计算新库存
        IF p_action->>'action_type' = '耗材领用' THEN
          v_new_balance := v_current_balance - COALESCE((p_action->>'qty')::NUMERIC, 1);
          IF v_new_balance < 0 THEN
            RAISE EXCEPTION '库存不足: 当前库存 %, 需要 %', v_current_balance, p_action->>'qty';
          END IF;
        ELSE
          v_new_balance := v_current_balance + COALESCE((p_action->>'qty')::NUMERIC, 1);
        END IF;

        -- 记录库存变化
        INSERT INTO stock_ledger (
          item_type, item_id,
          delta, balance, location_id, action_id
        ) VALUES (
          '耗材',
          (p_action->>'consumable_id')::UUID,
          CASE
            WHEN p_action->>'action_type' = '耗材领用' THEN -(COALESCE((p_action->>'qty')::NUMERIC, 1))
            ELSE COALESCE((p_action->>'qty')::NUMERIC, 1)
          END,
          v_new_balance,
          COALESCE(
            (p_action->>'from_location_id')::UUID,
            (p_action->>'to_location_id')::UUID
          ),
          v_action_id
        );
      END IF;
  END CASE;

  -- 返回成功结果
  RETURN jsonb_build_object('action_id', v_action_id, 'success', true);

EXCEPTION WHEN OTHERS THEN
  -- 记录错误并回滚
  v_error_msg := SQLERRM;

  -- 更新action状态为失败
  UPDATE actions
  SET status = 'failed', error_message = v_error_msg
  WHERE id = v_action_id;

  RAISE EXCEPTION '%', v_error_msg;
END;
$$ LANGUAGE plpgsql;
*/