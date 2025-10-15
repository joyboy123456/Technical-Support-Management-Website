// src/pages/Audit.tsx
// 审计日志页面

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import { Eye, Search, Filter, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AuditLogItem {
  id: string
  actor: string
  action: string
  table_name: string
  row_id: string
  before: any
  after: any
  at_time: string
}

interface FilterOptions {
  actor?: string
  action?: string
  table_name?: string
  startDate?: string
  endDate?: string
  searchTerm?: string
}

export function Audit() {
  const [filters, setFilters] = useState<FilterOptions>({})
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)

  const { data: auditLogs = [], isLoading, error } = useQuery({
    queryKey: ['audit-logs', filters, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('at_time', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      // 应用过滤器
      if (filters.actor) {
        query = query.ilike('actor', `%${filters.actor}%`)
      }
      if (filters.action) {
        query = query.eq('action', filters.action)
      }
      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name)
      }
      if (filters.startDate) {
        query = query.gte('at_time', new Date(filters.startDate).toISOString())
      }
      if (filters.endDate) {
        query = query.lte('at_time', new Date(filters.endDate).toISOString())
      }
      if (filters.searchTerm) {
        query = query.or(`actor.ilike.%${filters.searchTerm}%,table_name.ilike.%${filters.searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    }
  })

  const { data: tableCounts = [] } = useQuery({
    queryKey: ['audit-table-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('table_name')

      if (error) throw error

      const counts = data?.reduce((acc, item) => {
        acc[item.table_name] = (acc[item.table_name] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return Object.entries(counts || {})
        .map(([table, count]) => ({ table, count }))
        .sort((a, b) => b.count - a.count)
    }
  })

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setPage(1)
  }

  const exportAuditLogs = async () => {
    // 简化版导出功能
    const csvContent = [
      ['时间', '操作者', '操作', '表名', '记录ID'].join(','),
      ...auditLogs.map(log => [
        new Date(log.at_time).toLocaleString(),
        log.actor,
        log.action,
        log.table_name,
        log.row_id || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'default'
      case 'UPDATE':
        return 'secondary'
      case 'DELETE':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatJsonDiff = (before: any, after: any) => {
    if (!before && !after) return null

    return (
      <div className="space-y-4">
        {before && (
          <div>
            <h4 className="font-semibold text-red-600 mb-2">变更前:</h4>
            <pre className="bg-red-50 p-3 rounded text-sm overflow-auto max-h-60">
              {JSON.stringify(before, null, 2)}
            </pre>
          </div>
        )}
        {after && (
          <div>
            <h4 className="font-semibold text-green-600 mb-2">变更后:</h4>
            <pre className="bg-green-50 p-3 rounded text-sm overflow-auto max-h-60">
              {JSON.stringify(after, null, 2)}
            </pre>
          </div>
        )}
      </div>
    )
  }

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
        加载审计日志失败，请稍后重试
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题和统计 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">审计日志</h1>
          <p className="text-gray-600 mt-1">系统操作记录和数据变更追踪</p>
        </div>

        <Button data-testid="audit-export" onClick={exportAuditLogs} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          导出日志
        </Button>
      </div>

      {/* 表统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tableCounts.slice(0, 6).map(({ table, count }) => (
          <Card key={table} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleFilterChange('table_name', table)}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-gray-600">{table}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 过滤器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            过滤条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">搜索</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  data-testid="audit-search-input"
                  id="search"
                  placeholder="搜索操作者或表名"
                  className="pl-10"
                  value={filters.searchTerm || ''}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="action">操作类型</Label>
              <Select value={filters.action || 'all'} onValueChange={(value) => handleFilterChange('action', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="全部操作" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部操作</SelectItem>
                  <SelectItem value="INSERT">插入</SelectItem>
                  <SelectItem value="UPDATE">更新</SelectItem>
                  <SelectItem value="DELETE">删除</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="table">数据表</Label>
              <Select value={filters.table_name || 'all'} onValueChange={(value) => handleFilterChange('table_name', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="全部表" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部表</SelectItem>
                  {tableCounts.map(({ table }) => (
                    <SelectItem key={table} value={table}>{table}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="actor">操作者</Label>
              <Input
                id="actor"
                placeholder="操作者姓名"
                value={filters.actor || ''}
                onChange={(e) => handleFilterChange('actor', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="startDate">开始日期</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">结束日期</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                清除过滤器
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 审计日志表格 */}
      <Card>
        <CardHeader>
          <CardTitle>审计记录</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data-testid="audit-table">
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>操作者</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>表名</TableHead>
                <TableHead>记录ID</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.at_time).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.actor}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {log.table_name}
                    </code>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-gray-600">
                      {log.row_id ? log.row_id.slice(0, 8) + '...' : '-'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          data-testid="audit-detail-button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            审计详情 - {log.action} {log.table_name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <strong>操作者:</strong> {log.actor}
                            </div>
                            <div>
                              <strong>时间:</strong> {new Date(log.at_time).toLocaleString()}
                            </div>
                            <div>
                              <strong>操作:</strong> {log.action}
                            </div>
                            <div>
                              <strong>表名:</strong> {log.table_name}
                            </div>
                            <div className="col-span-2">
                              <strong>记录ID:</strong> <code>{log.row_id || '无'}</code>
                            </div>
                          </div>
                          {formatJsonDiff(log.before, log.after)}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 分页控制 */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              第 {page} 页，每页 {pageSize} 条记录
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={auditLogs.length < pageSize}
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
