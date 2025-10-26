// src/server/stats.ts
// 统计数据服务

import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getDevices } from '../data/devices'
import type { Device } from '../data/devices'

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

/**
 * 获取打印机统计数据
 */
export async function getPrinterStats(): Promise<{
  overview: AssetStats
  byLocation: LocationStats[]
  byBrandModel: BrandModelStats[]
}> {
  // 优先从 Supabase 获取真实数据
  if (isSupabaseConfigured) {
    try {
      const supabaseStats = await fetchPrinterStatsFromSupabase()
      // 无论有没有数据，都返回 Supabase 的结果（包括空数据）
      console.log(`📊 从 Supabase 获取到 ${supabaseStats.overview.total} 台打印机数据`)
      return supabaseStats
    } catch (error) {
      console.error('从 Supabase 获取打印机统计失败，使用本地数据:', error)
    }
  }
  
  // 降级使用本地设备数据（仅用于演示）
  console.warn('⚠️ 使用本地模拟数据，请添加真实打印机到数据库')
  return buildPrinterStatsFromDevices()
}

/**
 * 获取路由器统计数据
 */
export async function getRouterStats(): Promise<{
  overview: AssetStats
  byLocation: LocationStats[]
}> {
  const fallbackStats = await buildRouterStatsFromDevices()

  if (fallbackStats.overview.total > 0) {
    return fallbackStats
  }

  if (isSupabaseConfigured) {
    const supabaseStats = await fetchRouterStatsFromSupabase()
    if (supabaseStats.overview.total > 0 || supabaseStats.byLocation.length > 0) {
      return supabaseStats
    }
  }

  return fallbackStats
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
 * 
 * ⚠️ 性能优化：优先使用优化版本 getDashboardSummaryOptimized()
 * 该函数使用数据库视图，性能提升 60-80%
 */
export async function getDashboardSummary() {
  // 优先使用优化版本
  if (isSupabaseConfigured) {
    try {
      // 动态导入优化版本以避免循环依赖
      const { getDashboardSummaryOptimized } = await import('./stats-optimized')
      const result = await getDashboardSummaryOptimized()
      console.log('✅ 使用优化版本的 Dashboard 汇总')
      return result
    } catch (error) {
      console.warn('⚠️ 优化版本失败，降级到标准版本:', error)
      // 降级到下面的标准实现
    }
  }

  // 降级版本：标准实现
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

/**
 * 使用设备数据生成打印机统计（适用于本地/降级模式）
 */
async function buildPrinterStatsFromDevices(): Promise<{
  overview: AssetStats
  byLocation: LocationStats[]
  byBrandModel: BrandModelStats[]
}> {
  const devices = await getDevices()
  const printerDevices = devices.filter(device => !!device.printerModel && !isRouterDevice(device))

  const overview: AssetStats = {
    total: printerDevices.length,
    available: 0,
    inUse: 0,
    maintenance: 0,
    borrowed: 0
  }

  const locationCounts = new Map<string, number>()
  const locationModels = new Map<string, Map<string, { brand: string; model: string; count: number }>>()
  const brandModelCounts = new Map<string, { brand: string; model: string; count: number }>()

  printerDevices.forEach(device => {
    switch (device.status) {
      case '运行中':
      case '使用中':
        overview.inUse++
        break
      case '维护':
      case '维修中':
        overview.maintenance++
        break
      case '离线':
      case '可用':
        overview.available++
        break
      default:
        overview[device.status] = (overview[device.status] || 0) + 1
    }

    const locationKey = device.location || '未指定位置'
    locationCounts.set(locationKey, (locationCounts.get(locationKey) ?? 0) + 1)

    const brand = device.printerModel || '未知品牌'
    const model = device.model || '未知型号'
    const brandModelKey = `${brand}|${model}`
    const existingBrandModel = brandModelCounts.get(brandModelKey)
    if (existingBrandModel) {
      existingBrandModel.count++
    } else {
      brandModelCounts.set(brandModelKey, { brand, model, count: 1 })
    }

    // 记录每个位置的型号信息
    if (!locationModels.has(locationKey)) {
      locationModels.set(locationKey, new Map())
    }
    const locationModelMap = locationModels.get(locationKey)!
    const existing = locationModelMap.get(brandModelKey)
    if (existing) {
      existing.count++
    } else {
      locationModelMap.set(brandModelKey, { brand, model, count: 1 })
    }
  })

  const byLocation: LocationStats[] = Array.from(locationCounts.entries()).map(([locationName, count]) => ({
    locationId: locationName,
    locationName,
    count,
    models: Array.from(locationModels.get(locationName)?.values() || []).sort((a, b) => b.count - a.count)
  }))

  const byBrandModel: BrandModelStats[] = Array.from(brandModelCounts.values())
    .sort((a, b) => b.count - a.count)

  return {
    overview,
    byLocation,
    byBrandModel
  }
}

/**
 * 使用设备数据生成路由器统计（适用于本地/降级模式）
 */
async function buildRouterStatsFromDevices(): Promise<{
  overview: AssetStats
  byLocation: LocationStats[]
}> {
  const devices = await getDevices()
  const routerDevices = devices.filter(device => isRouterDevice(device))

  const overview: AssetStats = {
    total: routerDevices.length,
    available: 0,
    inUse: 0,
    maintenance: 0,
    borrowed: 0
  }

  const locationCounts = new Map<string, number>()

  routerDevices.forEach(device => {
    switch (device.status) {
      case '运行中':
      case '使用中':
        overview.inUse++
        break
      case '维护':
      case '维修中':
        overview.maintenance++
        break
      case '离线':
      case '可用':
        overview.available++
        break
      default:
        overview[device.status] = (overview[device.status] || 0) + 1
    }

    const locationKey = device.location || '未指定位置'
    locationCounts.set(locationKey, (locationCounts.get(locationKey) ?? 0) + 1)
  })

  const byLocation: LocationStats[] = Array.from(locationCounts.entries()).map(([locationName, count]) => ({
    locationId: locationName,
    locationName,
    count
  }))

  return {
    overview,
    byLocation
  }
}

/**
 * 从 Supabase 获取路由器统计（用于无本地数据时）
 */
async function fetchRouterStatsFromSupabase(): Promise<{
  overview: AssetStats
  byLocation: LocationStats[]
}> {
  const overview: AssetStats = {
    total: 0,
    available: 0,
    inUse: 0,
    maintenance: 0,
    borrowed: 0
  }

  try {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        status,
        location_id,
        locations!inner(name)
      `)
      .eq('asset_type', '路由器')

    if (error) throw error

    const locationCounts = new Map<string, number>()

    data?.forEach(item => {
      overview.total++
      switch (item.status) {
        case '运行中':
        case '使用中':
          overview.inUse++
          break
        case '维护':
        case '维修中':
          overview.maintenance++
          break
        case '离线':
        case '可用':
          overview.available++
          break
        case '借出':
          overview.borrowed++
          break
        default:
          overview[item.status] = (overview[item.status] || 0) + 1
      }

      const locationName = item.locations?.name ?? '未指定位置'
      locationCounts.set(locationName, (locationCounts.get(locationName) ?? 0) + 1)
    })

    const byLocation: LocationStats[] = Array.from(locationCounts.entries()).map(([locationName, count]) => ({
      locationId: locationName,
      locationName,
      count
    }))

    return {
      overview,
      byLocation
    }
  } catch (error) {
    console.error('获取路由器统计错误:', error)
    return {
      overview,
      byLocation: []
    }
  }
}

/**
 * 从 Supabase 获取打印机统计（用于获取真实数据）
 */
async function fetchPrinterStatsFromSupabase(): Promise<{
  overview: AssetStats
  byLocation: LocationStats[]
  byBrandModel: BrandModelStats[]
}> {
  const overview: AssetStats = {
    total: 0,
    available: 0,
    inUse: 0,
    maintenance: 0,
    borrowed: 0
  }

  // 从 printer_instances 表查询打印机实例数据
  const { data, error } = await supabase
    .from('printer_instances')
    .select('id, printer_model, status, location')

  if (error) throw error

  const locationCounts = new Map<string, number>()
  const locationModels = new Map<string, Map<string, { brand: string; model: string; count: number }>>()
  const brandModelCounts = new Map<string, { brand: string; model: string; count: number }>()

  data?.forEach(item => {
    overview.total++
    
    // printer_instances 的 status: 'in-house' | 'deployed' | 'idle'
    switch (item.status) {
      case 'in-house':
        overview.available++
        break
      case 'deployed':
        overview.inUse++
        break
      case 'idle':
        overview.maintenance++
        break
      default:
        overview[item.status] = (overview[item.status] || 0) + 1
    }

    const locationName = item.location || '未指定位置'
    locationCounts.set(locationName, (locationCounts.get(locationName) ?? 0) + 1)

    // printer_model 格式如: "EPSON-L8058", "DNP-自购", "西铁城CX-02", "HITI诚研P525L"
    const printerModel = item.printer_model || '未知型号'
    // 用连字符或空格分割，取第一个作为品牌
    const parts = printerModel.split(/[-\s]/)
    const brand = parts[0] || '未知品牌'
    const model = parts.slice(1).join('-') || '未知型号'
    const brandModelKey = `${brand}|${model}`
    
    const existingBrandModel = brandModelCounts.get(brandModelKey)
    if (existingBrandModel) {
      existingBrandModel.count++
    } else {
      brandModelCounts.set(brandModelKey, { brand, model, count: 1 })
    }

    // 记录每个位置的型号信息
    if (!locationModels.has(locationName)) {
      locationModels.set(locationName, new Map())
    }
    const locationModelMap = locationModels.get(locationName)!
    const existing = locationModelMap.get(brandModelKey)
    if (existing) {
      existing.count++
    } else {
      locationModelMap.set(brandModelKey, { brand, model, count: 1 })
    }
  })

  const byLocation: LocationStats[] = Array.from(locationCounts.entries()).map(([locationName, count]) => ({
    locationId: locationName,
    locationName,
    count,
    models: Array.from(locationModels.get(locationName)?.values() || []).sort((a, b) => b.count - a.count)
  }))

  const byBrandModel: BrandModelStats[] = Array.from(brandModelCounts.values())
    .sort((a, b) => b.count - a.count)

  return {
    overview,
    byLocation,
    byBrandModel
  }
}

/**
 * 判断设备是否为路由器
 */
function isRouterDevice(device: Device): boolean {
  const type = device.deviceType?.trim()
  if (type && type === '路由器') {
    return true
  }

  const keywords = ['router', '路由', 'wifi', 'wi-fi']
  const target = `${device.name ?? ''} ${device.model ?? ''} ${device.printer?.model ?? ''}`.toLowerCase()
  return keywords.some(keyword => target.includes(keyword))
}
