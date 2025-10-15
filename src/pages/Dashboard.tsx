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
  Router,
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
    refetchInterval: 5 * 60 * 1000, // 每5分钟刷新
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        加载仪表盘数据失败，请稍后重试
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
      const key = `${item.brand} ${item.model}`
      const existing = acc.find(x => x.name === key)
      if (existing) {
        existing.count += item.count
      } else {
        acc.push({ name: key, count: item.count })
      }
      return acc
    }, [] as { name: string; count: number }[])
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题和控制 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">统计看板</h1>
          <p className="text-gray-600 mt-1">设备和库存统计概览</p>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">最近7天</SelectItem>
              <SelectItem value="30d">最近30天</SelectItem>
              <SelectItem value="90d">最近90天</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => window.location.reload()}>
            刷新数据
          </Button>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总资产</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="dashboard-total-assets">{assets.total}</div>
            <p className="text-xs text-muted-foreground">
              可用: {assets.available} | 维修: {assets.maintenance}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">使用率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="dashboard-utilization">{assets.utilizationRate}%</div>
            <p className="text-xs text-muted-foreground">
              设备整体使用率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">低库存告警</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500" data-testid="dashboard-low-stock">{inventory.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              需要补充的耗材项目
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">维护记录</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="dashboard-maintenance">{maintenance.totalRecords}</div>
            <p className="text-xs text-muted-foreground">
              本月维护操作次数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计标签页 */}
      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">设备统计</TabsTrigger>
          <TabsTrigger value="inventory">库存管理</TabsTrigger>
          <TabsTrigger value="trends">操作趋势</TabsTrigger>
          <TabsTrigger value="maintenance">维护分析</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 打印机状态分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  打印机状态分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={printerStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
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
              </CardContent>
            </Card>

            {/* 路由器状态分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Router className="h-5 w-5" />
                  路由器状态分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={routerStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#82ca9d"
                      dataKey="count"
                    >
                      {routerStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 打印机品牌型号分布 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>打印机品牌型号分布</CardTitle>
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

            {/* SIM卡状态 */}
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

            {/* 设备位置分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  打印机位置分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {printers.byLocation.map(location => (
                    <div key={location.locationId} className="flex justify-between items-center">
                      <span>{location.locationName}</span>
                      <Badge variant="outline">{location.count}</Badge>
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
