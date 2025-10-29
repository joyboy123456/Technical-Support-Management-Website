// src/pages/Dashboard.tsx
// 统计看板页面

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  Printer,
  Router as RouterIcon,
  Smartphone,
  Package,
  AlertTriangle,
  TrendingUp,
  Activity,
  MapPin
} from 'lucide-react'
import { getDashboardSummary } from '../server/stats'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function Dashboard() {
  const [timeRange, setTimeRange] = useState('7d')
  const [locationFilter, setLocationFilter] = useState('all')

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', timeRange, locationFilter],
    queryFn: getDashboardSummary,
    staleTime: 2 * 60 * 1000, // 2分钟内数据视为新鲜，不重新请求
    cacheTime: 5 * 60 * 1000, // 缓存5分钟
    refetchInterval: 5 * 60 * 1000, // 每5分钟刷新
  })

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">统计看板</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">正在加载数据...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-4 md:p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8 px-4">
        <p className="text-sm md:text-base">加载仪表盘数据失败，请稍后重试</p>
      </div>
    )
  }

  const { assets, printers, routers, sims, inventory, trends, maintenance } = dashboardData!

  // 准备图表数据
  const printerStatusData = Object.entries(printers.overview)
    .filter(([key]) => key !== 'total')
    .map(([status, count]) => ({
      status: status === 'available' ? '可用' :
              status === 'inUse' ? '使用中' :
              status === 'maintenance' ? '维修中' :
              status === 'borrowed' ? '借出' : status,
      count: count as number
    }))

  const routerStatusData = Object.entries(routers.overview)
    .filter(([key]) => key !== 'total')
    .map(([status, count]) => ({
      status: status === 'available' ? '可用' :
              status === 'inUse' ? '使用中' :
              status === 'maintenance' ? '维修中' :
              status === 'borrowed' ? '借出' : status,
      count: count as number
    }))

  const simStatusData = Object.entries(sims.overview).map(([status, count]) => ({
    status,
    count: count as number
  }))

  const brandModelData = printers.byBrandModel
    .reduce((acc, item) => {
      const existing = acc.find(x => x.name === item.brand)
      if (existing) {
        existing.count += item.count
      } else {
        acc.push({ name: item.brand, count: item.count })
      }
      return acc
    }, [] as { name: string; count: number }[])
    .sort((a, b) => b.count - a.count)

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* 页面标题和控制 */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">统计看板</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">设备和库存统计概览</p>
        </div>

        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">最近7天</SelectItem>
              <SelectItem value="30d">最近30天</SelectItem>
              <SelectItem value="90d">最近90天</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => window.location.reload()} className="w-full md:w-auto">
            刷新数据
          </Button>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm md:text-base font-medium">总资产</CardTitle>
            <Package className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl md:text-2xl font-bold" data-testid="dashboard-total-assets">{assets.total}</div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              可用: {assets.available} | 维修: {assets.maintenance}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm md:text-base font-medium">使用率</CardTitle>
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl md:text-2xl font-bold" data-testid="dashboard-utilization">{assets.utilizationRate}%</div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              设备整体使用率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm md:text-base font-medium">低库存告警</CardTitle>
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl md:text-2xl font-bold text-red-500" data-testid="dashboard-low-stock">{inventory.lowStockItems}</div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              需要补充的耗材项目
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm md:text-base font-medium">维护记录</CardTitle>
            <Activity className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl md:text-2xl font-bold" data-testid="dashboard-maintenance">{maintenance.totalRecords}</div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              本月维护操作次数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计标签页 */}
      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="assets" className="text-xs md:text-sm">设备统计</TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs md:text-sm">库存管理</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs md:text-sm">操作趋势</TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs md:text-sm">维护分析</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Printer className="w-4 h-4 md:w-5 md:h-5" />
                  打印机状态分布
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={printerStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                        outerRadius="70%"
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {printerStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <RouterIcon className="w-4 h-4 md:w-5 md:h-5" />
                  路由器状态分布
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={routerStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                        outerRadius="70%"
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {routerStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>打印机品牌分布</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={brandModelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  SIM卡状态统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(sims.overview).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span>{status}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  打印机位置分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {printers.byLocation.map(location => (
                    <div key={location.locationId} className="space-y-2 p-3 border rounded-lg">
                      <div className="text-xs text-gray-500 mb-2">{location.locationName}</div>
                      {location.models && location.models.length > 0 && (
                        <div className="space-y-2">
                          {location.models.map((modelInfo, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="font-medium">{modelInfo.brand} {modelInfo.model}</span>
                              <Badge variant="outline">{modelInfo.count} 台</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>库存水平监控</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory.stockLevels.map(item => (
                  <div key={`${item.itemId}-${item.locationId}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-sm text-gray-600">{item.locationName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.currentStock}</p>
                      <Badge
                        variant={
                          item.stockStatus === '低库存' ? 'destructive' :
                          item.stockStatus === '正常' ? 'default' : 'secondary'
                        }
                      >
                        {item.stockStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>操作趋势图</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>问题类型分布</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={maintenance.topIssueTypes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>最近维护记录</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenance.recentIssues.slice(0, 8).map((issue, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border-l-4 border-blue-500 bg-gray-50">
                      <div>
                        <p className="font-medium text-sm">{issue.title}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(issue.happenedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
