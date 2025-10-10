-- supabase/migrations/0001_init.sql
-- 技术支持管理网站数据库迁移脚本

-- 启用必要的扩展 (gen_random_uuid 是 PostgreSQL 内置函数，不需要额外扩展)

-- 枚举类型定义
CREATE TYPE location_type AS ENUM ('仓库', '展厅', '个人', '在途', '维修站');
CREATE TYPE asset_type AS ENUM ('机器', '打印机', '路由器', '物联网卡', '耗材');
CREATE TYPE consumable_type AS ENUM ('相纸', '色带', '墨盒', '其它');
CREATE TYPE code_type AS ENUM ('专码', '通码');
CREATE TYPE code_status AS ENUM ('未发', '已发', '作废');
CREATE TYPE sim_status AS ENUM ('未激活', '可用', '停机', '挂失');
CREATE TYPE action_type AS ENUM ('入库', '出库', '借用', '归还', '调拨', '安装', '拆卸', '报修', '报废', '耗材领用', '耗材归还');
CREATE TYPE compatibility_code_type AS ENUM ('专码', '通码', '二选一');
CREATE TYPE item_type AS ENUM ('资产', '耗材', '码');
CREATE TYPE price_item_type AS ENUM ('打印机', '耗材');

-- 位置表
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  type location_type NOT NULL,
  remark TEXT
);

-- 打印机型号表
CREATE TABLE printer_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  notes TEXT,
  remark TEXT,
  UNIQUE(brand, model)
);

-- 耗材表
CREATE TABLE consumables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  type consumable_type NOT NULL,
  spec TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '个',
  remark TEXT
);

-- 兼容性表
CREATE TABLE compatibilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  printer_model_id UUID NOT NULL REFERENCES printer_models(id) ON DELETE CASCADE,
  consumable_id UUID NOT NULL REFERENCES consumables(id) ON DELETE CASCADE,
  code_type compatibility_code_type NOT NULL,
  remark TEXT,
  UNIQUE(printer_model_id, consumable_id)
);

-- 统一资产表
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  asset_type asset_type NOT NULL,
  model_id UUID, -- 关联printer_models等
  serial_no TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT '可用',
  location_id UUID NOT NULL REFERENCES locations(id),
  owner_person TEXT,
  private_meta JSONB DEFAULT '{}', -- 敏感信息加密存储
  remark TEXT
);

-- 码表
CREATE TABLE codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  code_type code_type NOT NULL,
  code_value TEXT NOT NULL UNIQUE,
  status code_status NOT NULL DEFAULT '未发',
  bound_printer_id UUID UNIQUE REFERENCES assets(id) ON DELETE SET NULL,
  remark TEXT
);

-- SIM卡表
CREATE TABLE sim_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  iccid TEXT NOT NULL UNIQUE,
  carrier TEXT NOT NULL,
  status sim_status NOT NULL DEFAULT '未激活',
  plan TEXT,
  usage_mb NUMERIC DEFAULT 0,
  bound_router_id UUID UNIQUE REFERENCES assets(id) ON DELETE SET NULL,
  remark TEXT
);

-- 库存账簿表
CREATE TABLE stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  item_type item_type NOT NULL,
  item_id UUID NOT NULL,
  delta NUMERIC NOT NULL,
  balance NUMERIC NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  action_id UUID, -- 关联actions表
  remark TEXT
);

-- 单据表 (核心)
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  action_type action_type NOT NULL,
  asset_type asset_type,
  asset_id UUID REFERENCES assets(id),
  qty NUMERIC DEFAULT 1,
  from_location_id UUID REFERENCES locations(id),
  to_location_id UUID REFERENCES locations(id),
  by_user TEXT NOT NULL,
  at_time TIMESTAMPTZ DEFAULT NOW(),
  related_person TEXT,
  work_order TEXT,
  status TEXT DEFAULT 'completed', -- pending, completed, failed
  error_message TEXT,
  remark TEXT
);

-- 维护记录表
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  detail TEXT,
  happened_at TIMESTAMPTZ DEFAULT NOW(),
  performed_by TEXT,
  remark TEXT
);

-- 供应商表
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL UNIQUE,
  contact TEXT,
  remark TEXT
);

-- 价格历史表
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  item_type price_item_type NOT NULL,
  item_ref_id UUID NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'CNY',
  supplier_id UUID REFERENCES suppliers(id),
  happened_at TIMESTAMPTZ DEFAULT NOW(),
  remark TEXT
);

-- SOP表
CREATE TABLE sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  asset_type asset_type,
  brand TEXT,
  model TEXT,
  steps JSONB NOT NULL, -- [{"step": "步骤描述", "completed": false}]
  remark TEXT
);

-- 审计日志表
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  row_id UUID,
  before JSONB,
  after JSONB,
  at_time TIMESTAMPTZ DEFAULT NOW()
);

-- 索引创建
CREATE INDEX idx_assets_asset_type ON assets(asset_type);
CREATE INDEX idx_assets_location_id ON assets(location_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_codes_status ON codes(status);
CREATE INDEX idx_codes_bound_printer_id ON codes(bound_printer_id);
CREATE INDEX idx_stock_ledger_item ON stock_ledger(item_type, item_id);
CREATE INDEX idx_stock_ledger_location ON stock_ledger(location_id);
CREATE INDEX idx_actions_asset_id ON actions(asset_id);
CREATE INDEX idx_actions_type ON actions(action_type);
CREATE INDEX idx_actions_time ON actions(at_time);
CREATE INDEX idx_audit_log_table_time ON audit_log(table_name, at_time);
CREATE INDEX idx_sim_cards_status ON sim_cards(status);

-- 统计视图
CREATE OR REPLACE VIEW v_printer_counts AS
SELECT
  pm.brand,
  pm.model,
  a.status,
  l.name as location_name,
  COUNT(*) as count
FROM assets a
JOIN printer_models pm ON a.model_id = pm.id
JOIN locations l ON a.location_id = l.id
WHERE a.asset_type = '打印机'
GROUP BY pm.brand, pm.model, a.status, l.name;

CREATE OR REPLACE VIEW v_router_counts AS
SELECT
  a.status,
  l.name as location_name,
  COUNT(*) as count
FROM assets a
JOIN locations l ON a.location_id = l.id
WHERE a.asset_type = '路由器'
GROUP BY a.status, l.name;

CREATE OR REPLACE VIEW v_sim_counts AS
SELECT
  sc.status,
  sc.carrier,
  COUNT(*) as count
FROM sim_cards sc
GROUP BY sc.status, sc.carrier;

-- 脱敏视图 (仅显示ICCID后4位)
CREATE OR REPLACE VIEW v_sim_public AS
SELECT
  id,
  '****' || RIGHT(iccid, 4) as iccid_masked,
  carrier,
  status,
  plan,
  usage_mb,
  bound_router_id,
  created_at,
  updated_at
FROM sim_cards;

-- 库存水平视图
CREATE OR REPLACE VIEW v_stock_levels AS
WITH latest_balance AS (
  SELECT DISTINCT ON (item_type, item_id, location_id)
    item_type,
    item_id,
    location_id,
    balance
  FROM stock_ledger
  ORDER BY item_type, item_id, location_id, created_at DESC
)
SELECT
  lb.item_type,
  lb.item_id,
  lb.location_id,
  l.name as location_name,
  COALESCE(lb.balance, 0) as current_stock,
  CASE
    WHEN lb.item_type = '耗材' THEN
      CASE
        WHEN lb.balance < 10 THEN '低库存'
        WHEN lb.balance < 20 THEN '正常'
        ELSE '充足'
      END
    ELSE '不适用'
  END as stock_status
FROM latest_balance lb
JOIN locations l ON lb.location_id = l.id;

-- 更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_printer_models_updated_at BEFORE UPDATE ON printer_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consumables_updated_at BEFORE UPDATE ON consumables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compatibilities_updated_at BEFORE UPDATE ON compatibilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_codes_updated_at BEFORE UPDATE ON codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sim_cards_updated_at BEFORE UPDATE ON sim_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 审计触发器函数
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (actor, action, table_name, row_id, after)
    VALUES (COALESCE(current_setting('app.current_user', true), 'system'), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (actor, action, table_name, row_id, before, after)
    VALUES (COALESCE(current_setting('app.current_user', true), 'system'), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (actor, action, table_name, row_id, before)
    VALUES (COALESCE(current_setting('app.current_user', true), 'system'), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$ language 'plpgsql';

-- 为关键表添加审计触发器
CREATE TRIGGER assets_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON assets FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER codes_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON codes FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER actions_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON actions FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER stock_ledger_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON stock_ledger FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 兼容性检查函数
CREATE OR REPLACE FUNCTION check_compatibility(
  p_printer_model_id UUID,
  p_consumable_id UUID,
  p_code_type code_type
) RETURNS BOOLEAN AS $$
DECLARE
  v_brand TEXT;
  v_compatibility compatibility_code_type;
BEGIN
  -- 获取打印机品牌
  SELECT brand INTO v_brand
  FROM printer_models
  WHERE id = p_printer_model_id;

  -- 获取兼容性设置
  SELECT code_type INTO v_compatibility
  FROM compatibilities
  WHERE printer_model_id = p_printer_model_id
    AND consumable_id = p_consumable_id;

  -- 检查兼容性规则
  IF v_brand = 'DNP' AND p_code_type = '通码' THEN
    RETURN FALSE; -- DNP 不允许通码
  END IF;

  IF v_compatibility IS NULL THEN
    RETURN FALSE; -- 没有兼容性记录
  END IF;

  IF v_compatibility = '二选一' THEN
    RETURN TRUE; -- 二选一模式，允许专码和通码
  END IF;

  IF v_compatibility::TEXT = p_code_type::TEXT THEN
    RETURN TRUE; -- 完全匹配
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 专码绑定检查函数
CREATE OR REPLACE FUNCTION check_code_binding(
  p_code_id UUID,
  p_printer_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_binding UUID;
  v_code_type code_type;
BEGIN
  -- 获取码类型和当前绑定
  SELECT code_type, bound_printer_id
  INTO v_code_type, v_current_binding
  FROM codes
  WHERE id = p_code_id;

  -- 通码可以重复绑定
  IF v_code_type = '通码' THEN
    RETURN TRUE;
  END IF;

  -- 专码检查
  IF v_code_type = '专码' THEN
    -- 如果已经绑定到其他打印机，拒绝
    IF v_current_binding IS NOT NULL AND v_current_binding != p_printer_id THEN
      RETURN FALSE;
    END IF;

    -- 检查目标打印机是否已绑定其他专码
    IF EXISTS(
      SELECT 1 FROM codes
      WHERE bound_printer_id = p_printer_id
        AND code_type = '专码'
        AND id != p_code_id
    ) THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 主要事务处理函数
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
  v_action_id := gen_random_uuid();

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

-- RLS 启用
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_cards ENABLE ROW LEVEL SECURITY;

-- RLS 策略 (简化版本，实际应用中需要更细粒度的角色管理)
-- viewer 角色只能查看公共数据
CREATE POLICY "viewer_can_read_locations" ON locations FOR SELECT USING (auth.role() = 'viewer' OR auth.role() = 'tech_support' OR auth.role() = 'ops');
CREATE POLICY "viewer_can_read_assets_public" ON assets FOR SELECT USING (auth.role() = 'viewer' OR auth.role() = 'tech_support' OR auth.role() = 'ops');

-- tech_support 可以创建actions
CREATE POLICY "tech_support_can_create_actions" ON actions FOR INSERT WITH CHECK (auth.role() = 'tech_support' OR auth.role() = 'ops');
CREATE POLICY "tech_support_can_read_actions" ON actions FOR SELECT USING (auth.role() = 'tech_support' OR auth.role() = 'ops');

-- ops 有更多权限
CREATE POLICY "ops_can_all_locations" ON locations FOR ALL USING (auth.role() = 'ops');
CREATE POLICY "ops_can_all_assets" ON assets FOR ALL USING (auth.role() = 'ops');

-- 回滚脚本注释
/*
ROLLBACK SCRIPT:
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS sops CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS maintenance_records CASCADE;
DROP TABLE IF EXISTS actions CASCADE;
DROP TABLE IF EXISTS stock_ledger CASCADE;
DROP TABLE IF EXISTS sim_cards CASCADE;
DROP TABLE IF EXISTS codes CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS compatibilities CASCADE;
DROP TABLE IF EXISTS consumables CASCADE;
DROP TABLE IF EXISTS printer_models CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

DROP TYPE IF EXISTS item_type CASCADE;
DROP TYPE IF EXISTS compatibility_code_type CASCADE;
DROP TYPE IF EXISTS action_type CASCADE;
DROP TYPE IF EXISTS sim_status CASCADE;
DROP TYPE IF EXISTS code_status CASCADE;
DROP TYPE IF EXISTS code_type CASCADE;
DROP TYPE IF EXISTS consumable_type CASCADE;
DROP TYPE IF EXISTS asset_type CASCADE;
DROP TYPE IF EXISTS location_type CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS audit_trigger_function() CASCADE;
DROP FUNCTION IF EXISTS check_compatibility(UUID, UUID, code_type) CASCADE;
DROP FUNCTION IF EXISTS check_code_binding(UUID, UUID) CASCADE;
*/