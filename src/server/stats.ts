// src/server/stats.ts
// 统计数据服务（Supabase-only 核心路径）

import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { normalizeStatus, type CanonicalStatus } from './status'

export interface AssetStats {
  total: number
  available: number
  inUse: number
  maintenance: number
  borrowed: number
  [key: string]: number
}

export interface LocationStats {
  locationId: string
  locationName: string
  count: number
  models?: { brand: string; model: string; count: number }[]
}

export interface BrandModelStats {
  brand: string
  model: string
  count: number
  status?: string
}

export interface StockLevelInfo {
  itemId: string
  itemType: string
  itemName?: string
  locationId: string
  locationName: string
  currentStock: number
  stockStatus: '低库存' | '正常' | '充足'
}

export interface ActionTrendData {
  date: string
  actionType: string
  count: number
}

export interface StatsMeta {
  source: 'server'
  generatedAt: string
}

function emptyOverview(): AssetStats {
  return {
    total: 0,
    available: 0,
    inUse: 0,
    maintenance: 0,
    borrowed: 0
  }
}

function bump(overview: AssetStats, status: CanonicalStatus) {
  switch (status) {
    case 'AVAILABLE':
      overview.available++
      break
    case 'IN_USE':
      overview.inUse++
      break
    case 'MAINTENANCE':
      overview.maintenance++
      break
    case 'BORROWED':
      overview.borrowed++
      break
    case 'OFFLINE':
      overview['OFFLINE'] = (overview['OFFLINE'] || 0) + 1
      break
    default:
      overview['OTHER'] = (overview['OTHER'] || 0) + 1
  }
}

/**
 * 获取打印机统计数据（仅 Supabase）
 */
export async function getPrinterStats(): Promise<{
  overview: AssetStats
  byLocation: LocationStats[]
  byBrandModel: BrandModelStats[]
} & StatsMeta> {
  const generatedAt = new Date().toISOString()

  if (!isSupabaseConfigured) {
    console.error('[PrinterStats] Supabase not configured. 请配置 Supabase 环境变量。')
    return {
      overview: emptyOverview(),
      byLocation: [],
      byBrandModel: [],
      source: 'server',
      generatedAt
    }
  }

  const data = await fetchPrinterStatsFromSupabase()
  return { ...data, source: 'server', generatedAt }
}

/**
 * 获取路由器统计数据（仅 Supabase）
 */
export async function getRouterStats(): Promise<{
  overview: AssetStats
  byLocation: LocationStats[]
} & StatsMeta> {
  const generatedAt = new Date().toISOString()

  if (!isSupabaseConfigured) {
    console.error('[RouterStats] Supabase not configured. 请配置 Supabase 环境变量。')
    return {
      overview: emptyOverview(),
      byLocation: [],
      source: 'server',
      generatedAt
    }
  }

  const data = await fetchRouterStatsFromSupabase()
  return { ...data, source: 'server', generatedAt }
}

/**
 * 获取SIM卡统计数据
 */
export async function getSimStats(): Promise<{
  overview: { [status: string]: number }
  byCarrier: { carrier: string; count: number; status: string }[]
}> {
  try {
    const { data, error } = await supabase
      .from('v_sim_counts')
      .select('*')

    if (error) throw error

    const overview: { [status: string]: number } = {}
    data?.forEach(item => {
      overview[item.status] = (overview[item.status] || 0) + item.count
    })

    const byCarrier = data?.map(item => ({
      carrier: item.carrier,
      count: item.count,
      status: item.status
    })) || []

    return {
      overview,
      byCarrier
    }

  } catch (error) {
    console.error('获取SIM卡统计错误:', error)
    return {
      overview: {},
      byCarrier: []
    }
  }
}

/**
 * 获取库存水平数据
 */
export async function getStockLevels(lowStockThreshold: number = 10): Promise<StockLevelInfo[]> {
  try {
    const { data, error } = await supabase
      .from('v_stock_levels')
      .select(`
        *,
        consumables!inner(type, spec)
      `)
      .eq('item_type', '耗材')
      .order('current_stock', { ascending: true })

    if (error) throw error

    return data?.map(item => ({
      itemId: item.item_id,
      itemType: item.item_type,
      itemName: `${item.consumables?.type} - ${item.consumables?.spec}`,
      locationId: item.location_id,
      locationName: item.location_name,
      currentStock: item.current_stock,
      stockStatus: item.stock_status as '低库存' | '正常' | '充足'
    })) || []

  } catch (error) {
    console.error('获取库存水平错误:', error)
    return []
  }
}

/**
 * 获取操作趋势数据
 */
export async function getActionTrends(days: number = 30): Promise<ActionTrendData[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('actions')
      .select('action_type, at_time')
      .gte('at_time', startDate.toISOString())
      .order('at_time', { ascending: true })

    if (error) throw error

    const groupedData = new Map<string, Map<string, number>>()

    data?.forEach(action => {
      const date = new Date(action.at_time).toISOString().split('T')[0]
      const actionType = action.action_type

      if (!groupedData.has(date)) {
        groupedData.set(date, new Map())
      }

      const dayData = groupedData.get(date)!
      dayData.set(actionType, (dayData.get(actionType) || 0) + 1)
    })

    const result: ActionTrendData[] = []
    groupedData.forEach((dayData, date) => {
      dayData.forEach((count, actionType) => {
        result.push({
          date,
          actionType,
          count
        })
      })
    })

    return result

  } catch (error) {
    console.error('获取操作趋势错误:', error)
    return []
  }
}

/**
 * 获取维护统计数据
 */
export async function getMaintenanceStats(days: number = 30): Promise<{
  totalRecords: number
  recentIssues: { assetId: string; title: string; happenedAt: string }[]
  topIssueTypes: { type: string; count: number }[]
}> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .gte('happened_at', startDate.toISOString())
      .order('happened_at', { ascending: false })

    if (error) throw error

    const totalRecords = data?.length || 0

    const recentIssues = data?.slice(0, 10).map(record => ({
      assetId: record.asset_id,
      title: record.title,
      happenedAt: record.happened_at
    })) || []

    const issueTypeCounts = new Map<string, number>()
    data?.forEach(record => {
      const title = record.title.toLowerCase()
      let type = '其他'

      if (title.includes('打印质量') || title.includes('条纹') || title.includes('模糊')) {
        type = '打印质量'
      } else if (title.includes('卡纸') || title.includes('进纸')) {
        type = '进纸问题'
      } else if (title.includes('墨') || title.includes('色带') || title.includes('耗材')) {
        type = '耗材问题'
      } else if (title.includes('网络') || title.includes('连接')) {
        type = '网络问题'
      } else if (title.includes('保养') || title.includes('清洁')) {
        type = '日常保养'
      }

      issueTypeCounts.set(type, (issueTypeCounts.get(type) || 0) + 1)
    })

    const topIssueTypes = Array.from(issueTypeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    return {
      totalRecords,
      recentIssues,
      topIssueTypes
    }

  } catch (error) {
    console.error('获取维护统计错误:', error)
    return {
      totalRecords: 0,
      recentIssues: [],
      topIssueTypes: []
    }
  }
}

/**
 * 获取仪表盘汇总数据
 *
 * ⚠️ 性能优化：优先使用优化版本 getDashboardSummaryOptimized()
 */
export async function getDashboardSummary() {
  const generatedAt = new Date().toISOString()

  if (isSupabaseConfigured) {
    try {
      const { getDashboardSummaryOptimized } = await import('./stats-optimized')
      const result = await getDashboardSummaryOptimized()
      return {
        ...result,
        source: 'server' as const,
        generatedAt
      }
    } catch (error) {
      console.warn('⚠️ 优化版本失败，降级到标准版本:', error)
    }
  }

  try {
    const [printerStats, routerStats, simStats, stockLevels, actionTrends, maintenanceStats] = await Promise.all([
      getPrinterStats(),
      getRouterStats(),
      getSimStats(),
      getStockLevels(),
      getActionTrends(7),
      getMaintenanceStats(30)
    ])

    const lowStockItems = stockLevels.filter(item => item.stockStatus === '低库存').length
    const totalAssets = printerStats.overview.total + routerStats.overview.total
    const availableAssets = printerStats.overview.available + routerStats.overview.available
    const maintenanceAssets = printerStats.overview.maintenance + routerStats.overview.maintenance

    return {
      assets: {
        total: totalAssets,
        available: availableAssets,
        maintenance: maintenanceAssets,
        utilizationRate: totalAssets > 0 ? ((totalAssets - availableAssets) / totalAssets * 100).toFixed(1) : '0'
      },
      printers: printerStats,
      routers: routerStats,
      sims: simStats,
      inventory: {
        lowStockItems,
        stockLevels: stockLevels.slice(0, 10)
      },
      trends: actionTrends,
      maintenance: maintenanceStats,
      source: 'server' as const,
      generatedAt
    }

  } catch (error) {
    console.error('获取仪表盘汇总错误:', error)
    throw error
  }
}

/** ---------- Supabase：打印机 ---------- */
async function fetchPrinterStatsFromSupabase(): Promise<{
  overview: AssetStats
  byLocation: LocationStats[]
  byBrandModel: BrandModelStats[]
}> {
  const overview = emptyOverview()
  const locationCounts = new Map<string, { name: string; count: number }>()
  const brandModelCounts = new Map<string, { brand: string; model: string; count: number }>()

  try {
    const { data: rows, error } = await supabase
      .from('assets')
      .select(`
        status,
        asset_type,
        location_id,
        locations!inner(name),
        brand,
        model
      `)
      .eq('asset_type', '打印机')

    if (error) throw error

    rows?.forEach((item: any) => {
      const status = normalizeStatus(item.status)
      overview.total++
      bump(overview, status)

      const locationId = String(item.location_id ?? item.locations?.name ?? 'unknown')
      const locationName = item.locations?.name ?? '未指定位置'
      const locationEntry = locationCounts.get(locationId) ?? { name: locationName, count: 0 }
      locationEntry.count += 1
      locationCounts.set(locationId, locationEntry)

      const brand = item.brand || '未知品牌'
      const model = item.model || '未知型号'
      const key = `${brand}|${model}`
      const existing = brandModelCounts.get(key)
      if (existing) {
        existing.count += 1
      } else {
        brandModelCounts.set(key, { brand, model, count: 1 })
      }
    })

    const byLocation: LocationStats[] = Array.from(locationCounts.entries()).map(([locationId, info]) => ({
      locationId,
      locationName: info.name,
      count: info.count
    }))

    const byBrandModel: BrandModelStats[] = Array.from(brandModelCounts.values()).sort((a, b) => b.count - a.count)

    console.log(`📊 从 Supabase 获取到 ${overview.total} 台打印机数据`)
    return { overview, byLocation, byBrandModel }

  } catch (error) {
    console.error('获取打印机统计错误:', error)
    return { overview, byLocation: [], byBrandModel: [] }
  }
}

/** ---------- Supabase：路由器 ---------- */
async function fetchRouterStatsFromSupabase(): Promise<{
  overview: AssetStats
  byLocation: LocationStats[]
}> {
  const overview = emptyOverview()
  const locationCounts = new Map<string, { name: string; count: number }>()

  try {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        status,
        asset_type,
        location_id,
        locations!inner(name)
      `)
      .eq('asset_type', '路由器')

    if (error) throw error

    data?.forEach((item: any) => {
      const status = normalizeStatus(item.status)
      overview.total++
      bump(overview, status)

      const locationId = String(item.location_id ?? item.locations?.name ?? 'unknown')
      const locationName = item.locations?.name ?? '未指定位置'
      const locationEntry = locationCounts.get(locationId) ?? { name: locationName, count: 0 }
      locationEntry.count += 1
      locationCounts.set(locationId, locationEntry)
    })

    const byLocation: LocationStats[] = Array.from(locationCounts.entries()).map(([locationId, info]) => ({
      locationId,
      locationName: info.name,
      count: info.count
    }))

    console.log(`📊 从 Supabase 获取到 ${overview.total} 台路由器数据`)
    return { overview, byLocation }

  } catch (error) {
    console.error('获取路由器统计错误:', error)
    return { overview, byLocation: [] }
  }
}
