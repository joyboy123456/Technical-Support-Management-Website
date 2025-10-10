// src/server/compatibility.ts
// 兼容性检查服务

import { supabase } from '../lib/supabase'

export interface CompatibilityRequest {
  printerModelId: string
  consumableId: string
  codeType: '专码' | '通码'
}

export interface CompatibilityResult {
  isCompatible: boolean
  reason?: string
  brand?: string
}

export interface CodeBindingRequest {
  codeId: string
  printerId: string
}

export interface CodeBindingResult {
  canBind: boolean
  reason?: string
  codeType?: string
}

/**
 * 检查打印机与耗材/码的兼容性
 */
export async function checkCompatibility({
  printerModelId,
  consumableId,
  codeType
}: CompatibilityRequest): Promise<CompatibilityResult> {
  try {
    // 使用数据库函数进行兼容性检查
    const { data, error } = await supabase.rpc('check_compatibility', {
      p_printer_model_id: printerModelId,
      p_consumable_id: consumableId,
      p_code_type: codeType
    })

    if (error) {
      console.error('兼容性检查错误:', error)
      return {
        isCompatible: false,
        reason: `检查失败: ${error.message}`
      }
    }

    // 获取品牌信息用于更详细的错误提示
    const { data: printerModel } = await supabase
      .from('printer_models')
      .select('brand, model')
      .eq('id', printerModelId)
      .single()

    const brand = printerModel?.brand

    if (!data) {
      let reason = '不兼容'

      if (brand === 'DNP' && codeType === '通码') {
        reason = 'DNP打印机只支持专码，不支持通码'
      } else if (!brand) {
        reason = '打印机型号不存在'
      } else {
        reason = '该耗材与打印机型号不兼容'
      }

      return {
        isCompatible: false,
        reason,
        brand
      }
    }

    return {
      isCompatible: true,
      brand
    }

  } catch (error) {
    console.error('兼容性检查异常:', error)
    return {
      isCompatible: false,
      reason: '检查服务异常'
    }
  }
}

/**
 * 检查码绑定是否可行
 */
export async function checkCodeBinding({
  codeId,
  printerId
}: CodeBindingRequest): Promise<CodeBindingResult> {
  try {
    // 使用数据库函数进行绑定检查
    const { data, error } = await supabase.rpc('check_code_binding', {
      p_code_id: codeId,
      p_printer_id: printerId
    })

    if (error) {
      console.error('码绑定检查错误:', error)
      return {
        canBind: false,
        reason: `检查失败: ${error.message}`
      }
    }

    // 获取码的详细信息
    const { data: codeInfo } = await supabase
      .from('codes')
      .select('code_type, status, bound_printer_id')
      .eq('id', codeId)
      .single()

    if (!data) {
      let reason = '无法绑定'

      if (codeInfo?.code_type === '专码') {
        if (codeInfo.bound_printer_id && codeInfo.bound_printer_id !== printerId) {
          reason = '该专码已绑定到其他打印机'
        } else {
          // 检查目标打印机是否已绑定其他专码
          const { data: existingBinding } = await supabase
            .from('codes')
            .select('id')
            .eq('bound_printer_id', printerId)
            .eq('code_type', '专码')
            .neq('id', codeId)
            .limit(1)

          if (existingBinding && existingBinding.length > 0) {
            reason = '目标打印机已绑定其他专码'
          }
        }
      }

      return {
        canBind: false,
        reason,
        codeType: codeInfo?.code_type
      }
    }

    return {
      canBind: true,
      codeType: codeInfo?.code_type
    }

  } catch (error) {
    console.error('码绑定检查异常:', error)
    return {
      canBind: false,
      reason: '检查服务异常'
    }
  }
}

/**
 * 获取打印机兼容的耗材列表
 */
export async function getCompatibleConsumables(printerModelId: string) {
  try {
    const { data, error } = await supabase
      .from('compatibilities')
      .select(`
        consumable_id,
        code_type,
        consumables (
          id,
          type,
          spec,
          unit
        )
      `)
      .eq('printer_model_id', printerModelId)

    if (error) {
      console.error('获取兼容耗材错误:', error)
      return []
    }

    return data?.map(item => ({
      id: item.consumable_id,
      type: item.consumables?.type,
      spec: item.consumables?.spec,
      unit: item.consumables?.unit,
      codeType: item.code_type
    })) || []

  } catch (error) {
    console.error('获取兼容耗材异常:', error)
    return []
  }
}

/**
 * 获取可用的码列表
 */
export async function getAvailableCodes(codeType?: '专码' | '通码') {
  try {
    let query = supabase
      .from('codes')
      .select('*')
      .eq('status', '未发')

    if (codeType) {
      query = query.eq('code_type', codeType)
    }

    // 专码额外检查：未绑定的
    if (codeType === '专码') {
      query = query.is('bound_printer_id', null)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('获取可用码错误:', error)
      return []
    }

    return data || []

  } catch (error) {
    console.error('获取可用码异常:', error)
    return []
  }
}

/**
 * 批量兼容性检查（用于安装模板）
 */
export async function batchCompatibilityCheck(
  printerModelId: string,
  items: { consumableId: string; codeType: '专码' | '通码' }[]
): Promise<{ compatible: boolean; details: CompatibilityResult[] }> {
  const results = await Promise.all(
    items.map(item =>
      checkCompatibility({
        printerModelId,
        consumableId: item.consumableId,
        codeType: item.codeType
      })
    )
  )

  const allCompatible = results.every(result => result.isCompatible)

  return {
    compatible: allCompatible,
    details: results
  }
}

/**
 * 检查库存是否足够
 */
export async function checkStockAvailability(
  consumableId: string,
  locationId: string,
  requiredQty: number
): Promise<{ available: boolean; currentStock: number; shortage?: number }> {
  try {
    // 获取最新库存余额
    const { data, error } = await supabase
      .from('stock_ledger')
      .select('balance')
      .eq('item_type', '耗材')
      .eq('item_id', consumableId)
      .eq('location_id', locationId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('检查库存错误:', error)
      return { available: false, currentStock: 0 }
    }

    const currentStock = data?.[0]?.balance || 0
    const available = currentStock >= requiredQty

    return {
      available,
      currentStock,
      shortage: available ? undefined : requiredQty - currentStock
    }

  } catch (error) {
    console.error('检查库存异常:', error)
    return { available: false, currentStock: 0 }
  }
}

/**
 * 获取低库存告警项目
 */
export async function getLowStockAlerts(threshold: number = 10) {
  try {
    const { data, error } = await supabase
      .from('v_stock_levels')
      .select('*')
      .lt('current_stock', threshold)
      .eq('item_type', '耗材')
      .order('current_stock', { ascending: true })

    if (error) {
      console.error('获取低库存告警错误:', error)
      return []
    }

    return data || []

  } catch (error) {
    console.error('获取低库存告警异常:', error)
    return []
  }
}