// src/server/stats.ts
// 统计数据服务

import { supabase } from '../lib/supabase'

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

/**
 * 获取打印机统计数据
 */
export async function getPrinterStats(): Promise<{
  overview: AssetStats
  byLocation: LocationStats[]
  byBrandModel: BrandModelStats[]
}> {
  try {
    // 总体统计
    const { data: overviewData, error: overviewError } = await supabase
      .from('assets')
      .select('status')
      .eq('asset_type', '打印机')

    if (overviewError) throw overviewError

    const overview: AssetStats = {
      total: overviewData?.length || 0,
      available: 0,
      inUse: 0,
      maintenance: 0,
      borrowed: 0
    }

    overviewData?.forEach(item => {
      switch (item.status) {
        case '可用':
          overview.available++
          break
        case '使用中':
          overview.inUse++
          break
        case '维修中':
          overview.maintenance++
          break
        case '借出':
          overview.borrowed++
          break
        default:
          overview[item.status] = (overview[item.status] || 0) + 1
      }
    })

    // 按位置统计
    const { data: locationData, error: locationError } = await supabase
      .from('assets')
      .select(`
        location_id,
        locations!inner(name)
      `)
      .eq('asset_type', '打印机')

    if (locationError) throw locationError

    const locationCounts = new Map<string, { name: string; count: number }>()
    locationData?.forEach(item => {
      const key = item.location_id
      const existing = locationCounts.get(key)
      if (existing) {
        existing.count++
      } else {
        locationCounts.set(key, {
          name: item.locations.name,
          count: 1
        })
      }
    })

    const byLocation: LocationStats[] = Array.from(locationCounts.entries()).map(([id, data]) => ({
      locationId: id,
      locationName: data.name,
      count: data.count
    }))

    // 按品牌型号统计 - 使用视图
    const { data: brandModelData, error: brandModelError } = await supabase
      .from('v_printer_counts')
      .select('*')

    if (brandModelError) throw brandModelError

    const byBrandModel: BrandModelStats[] = brandModelData?.map(item => ({
      brand: item.brand,
      model: item.model,
      count: item.count,
      status: item.status
    })) || []

    return {
      overview,
      byLocation,
      byBrandModel
    }

  } catch (error) {
    console.error('获取打印机统计错误:', error)
    return {
      overview: { total: 0, available: 0, inUse: 0, maintenance: 0, borrowed: 0 },
      byLocation: [],
      byBrandModel: []
    }
  }
}

/**
 * 获取路由器统计数据
 */
export async function getRouterStats(): Promise<{
  overview: AssetStats
  byLocation: LocationStats[]
}> {
  try {
    // 总体统计
    const { data: overviewData, error: overviewError } = await supabase
      .from('assets')
      .select('status')
      .eq('asset_type', '路由器')

    if (overviewError) throw overviewError

    const overview: AssetStats = {
      total: overviewData?.length || 0,
      available: 0,
      inUse: 0,
      maintenance: 0,
      borrowed: 0
    }

    overviewData?.forEach(item => {
      switch (item.status) {
        case '可用':
          overview.available++
          break
        case '使用中':
          overview.inUse++
          break
        case '维修中':
          overview.maintenance++
          break
        case '借出':
          overview.borrowed++
          break
        default:
          overview[item.status] = (overview[item.status] || 0) + 1
      }
    })

    // 使用视图获取按位置统计
    const { data: locationData, error: locationError } = await supabase
      .from('v_router_counts')
      .select('*')

    if (locationError) throw locationError

    const byLocation: LocationStats[] = locationData?.map(item => ({
      locationId: '', // 视图中不包含ID，这里置空
      locationName: item.location_name,
      count: item.count
    })) || []

    return {
      overview,
      byLocation
    }

  } catch (error) {
    console.error('获取路由器统计错误:', error)
    return {
      overview: { total: 0, available: 0, inUse: 0, maintenance: 0, borrowed: 0 },
      byLocation: []
    }
  }
}

/**
 * 获取SIM卡统计数据
 */
export async function getSimStats(): Promise<{
  overview: { [status: string]: number }
  byCarrier: { carrier: string; count: number; status: string }[]
}> {
  try {
    // 使用视图获取统计
    const { data, error } = await supabase
      .from('v_sim_counts')
      .select('*')

    if (error) throw error

    // 按状态汇总
    const overview: { [status: string]: number } = {}
    data?.forEach(item => {
      overview[item.status] = (overview[item.status] || 0) + item.count
    })

    // 按运营商和状态分组
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

    // 按日期和操作类型分组统计
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

    // 转换为数组格式
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

    // 分析标题中的关键词来分类问题类型
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
 */
export async function getDashboardSummary() {
  try {
    const [printerStats, routerStats, simStats, stockLevels, actionTrends, maintenanceStats] = await Promise.all([
      getPrinterStats(),
      getRouterStats(),
      getSimStats(),
      getStockLevels(),
      getActionTrends(7), // 最近7天的趋势
      getMaintenanceStats(30)
    ])

    // 计算一些关键指标
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
        stockLevels: stockLevels.slice(0, 10) // 前10项
      },
      trends: actionTrends,
      maintenance: maintenanceStats
    }

  } catch (error) {
    console.error('获取仪表盘汇总错误:', error)
    throw error
  }
}