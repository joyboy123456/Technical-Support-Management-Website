// src/pages/InstallWizard.tsx
// 安装模板向导页面

import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Progress } from '../components/ui/progress'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Printer,
  Settings,
  Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { batchCompatibilityCheck, checkStockAvailability } from '../server/compatibility'

interface InstallTemplate {
  id: string
  name: string
  description: string
  printerBrand: string
  requiredItems: {
    consumableId: string
    codeType: '专码' | '通码'
    quantity: number
  }[]
  defaultCodeType: '专码' | '通码'
  steps: string[]
}

const installSchema = z.object({
  templateId: z.string().min(1, '请选择安装模板'),
  targetPrinterId: z.string().min(1, '请选择目标打印机'),
  locationId: z.string().min(1, '请选择安装位置'),
  operator: z.string().min(1, '请输入操作员姓名'),
  workOrder: z.string().optional()
})

type InstallFormData = z.infer<typeof installSchema>

export function InstallWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [compatibilityResults, setCompatibilityResults] = useState<any>(null)
  const [stockResults, setStockResults] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const { control, handleSubmit, watch, formState: { errors } } = useForm<InstallFormData>({
    resolver: zodResolver(installSchema),
    defaultValues: {
      operator: '技术员'
    }
  })

  const selectedTemplateId = watch('templateId')
  const targetPrinterId = watch('targetPrinterId')
  const locationId = watch('locationId')

  // 预定义的安装模板
  const installTemplates: InstallTemplate[] = [
    {
      id: 'dnp-standard',
      name: 'DNP 标准安装',
      description: 'DNP 打印机标准安装流程，包含专码配置',
      printerBrand: 'DNP',
      requiredItems: [
        { consumableId: 'consumable-dnp-ribbon', codeType: '专码', quantity: 1 },
        { consumableId: 'consumable-6inch-paper', codeType: '专码', quantity: 100 }
      ],
      defaultCodeType: '专码',
      steps: [
        '检查打印机包装完整性',
        '连接电源和数据线',
        '安装专用色带',
        '加载相纸',
        '配置专码',
        '打印测试页',
        '检查打印质量'
      ]
    },
    {
      id: 'epson-standard',
      name: 'EPSON 标准安装',
      description: 'EPSON 喷墨打印机标准安装流程',
      printerBrand: 'EPSON',
      requiredItems: [
        { consumableId: 'consumable-epson-ink', codeType: '通码', quantity: 1 }
      ],
      defaultCodeType: '通码',
      steps: [
        '开箱检查配件',
        '安装墨盒',
        '执行打印头清洗',
        '校准打印头',
        '打印测试页'
      ]
    },
    {
      id: 'citizen-standard',
      name: '西铁城标准安装',
      description: '西铁城打印机安装，支持专码或通码',
      printerBrand: '西铁城',
      requiredItems: [
        { consumableId: 'consumable-citizen-ribbon', codeType: '二选一', quantity: 1 },
        { consumableId: 'consumable-6inch-paper', codeType: '二选一', quantity: 50 }
      ],
      defaultCodeType: '专码',
      steps: [
        '检查设备外观',
        '安装色带和相纸',
        '配置打印参数',
        '设置码类型',
        '测试打印功能'
      ]
    }
  ]

  // 获取打印机列表
  const { data: printers = [] } = useQuery({
    queryKey: ['printers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          printer_models!inner(brand, model),
          locations(name)
        `)
        .eq('asset_type', '打印机')
        .eq('status', '可用')
        .order('serial_no')

      if (error) throw error
      return data
    }
  })

  // 获取位置列表
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name')

      if (error) throw error
      return data
    }
  })

  // 获取耗材列表
  const { data: consumables = [] } = useQuery({
    queryKey: ['consumables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables')
        .select('*')

      if (error) throw error
      return data
    }
  })

  const selectedTemplate = installTemplates.find(t => t.id === selectedTemplateId)
  const selectedPrinter = printers.find(p => p.id === targetPrinterId)

  // 预检函数
  const runPrecheck = async () => {
    if (!selectedTemplate || !selectedPrinter || !locationId) return

    setIsProcessing(true)
    try {
      // 兼容性检查
      const compatibilityItems = selectedTemplate.requiredItems.map(item => ({
        consumableId: item.consumableId,
        codeType: item.codeType === '二选一' ? selectedTemplate.defaultCodeType : item.codeType
      }))

      const compatibilityResult = await batchCompatibilityCheck(
        selectedPrinter.model_id,
        compatibilityItems
      )

      setCompatibilityResults(compatibilityResult)

      // 库存检查
      const stockChecks = await Promise.all(
        selectedTemplate.requiredItems.map(async (item) => {
          const result = await checkStockAvailability(
            item.consumableId,
            locationId,
            item.quantity
          )
          return {
            ...item,
            ...result,
            consumableName: consumables.find(c => c.id === item.consumableId)?.spec || '未知耗材'
          }
        })
      )

      setStockResults({
        allAvailable: stockChecks.every(check => check.available),
        items: stockChecks
      })

      setCurrentStep(3)
    } catch (error) {
      console.error('预检失败:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // 执行安装
  const executeInstallMutation = useMutation({
    mutationFn: async (data: InstallFormData) => {
      const actions = selectedTemplate!.requiredItems.map(item => ({
        action_type: '安装',
        asset_type: '打印机',
        asset_id: data.targetPrinterId,
        to_location_id: data.locationId,
        by_user: data.operator,
        work_order: data.workOrder,
        consumable_id: item.consumableId,
        code_type: item.codeType === '二选一' ? selectedTemplate!.defaultCodeType : item.codeType,
        qty: item.quantity,
        remark: `使用模板: ${selectedTemplate!.name}`
      }))

      // 顺序执行所有安装操作
      const results = []
      for (const action of actions) {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/perform_action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ action })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`安装步骤失败: ${error.error}`)
        }

        results.push(await response.json())
      }

      return results
    },
    onSuccess: () => {
      setCurrentStep(4)
    }
  })

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="templateId">选择安装模板</Label>
              <Controller
                name="templateId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择安装模板" />
                    </SelectTrigger>
                    <SelectContent>
                      {installTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.templateId && (
                <p className="text-sm text-red-500">{errors.templateId.message}</p>
              )}
            </div>

            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedTemplate.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>
                  <div className="space-y-2">
                    <div><strong>适用品牌:</strong> {selectedTemplate.printerBrand}</div>
                    <div><strong>默认码类型:</strong> {selectedTemplate.defaultCodeType}</div>
                    <div><strong>安装步骤:</strong></div>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      {selectedTemplate.steps.map((step, index) => (
                        <li key={index} className="text-sm">{step}</li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <Label htmlFor="targetPrinterId">目标打印机</Label>
              <Controller
                name="targetPrinterId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择目标打印机" />
                    </SelectTrigger>
                    <SelectContent>
                      {printers
                        .filter(printer =>
                          !selectedTemplate ||
                          printer.printer_models?.brand === selectedTemplate.printerBrand
                        )
                        .map(printer => (
                        <SelectItem key={printer.id} value={printer.id}>
                          {printer.serial_no} - {printer.printer_models?.brand} {printer.printer_models?.model}
                          ({printer.locations?.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.targetPrinterId && (
                <p className="text-sm text-red-500">{errors.targetPrinterId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="locationId">安装位置</Label>
              <Controller
                name="locationId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择安装位置" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} ({location.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.locationId && (
                <p className="text-sm text-red-500">{errors.locationId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="operator">操作员</Label>
              <Controller
                name="operator"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="输入操作员姓名" />
                )}
              />
              {errors.operator && (
                <p className="text-sm text-red-500">{errors.operator.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="workOrder">工单号（可选）</Label>
              <Controller
                name="workOrder"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="输入工单号" />
                )}
              />
            </div>

            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!selectedTemplate || !selectedPrinter || !locationId}
              className="w-full"
            >
              下一步：预检
            </Button>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">安装前预检</h3>
              <p className="text-gray-600">
                检查兼容性和库存可用性
              </p>
            </div>

            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle>将要安装的组件</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedTemplate.requiredItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span>
                          {consumables.find(c => c.id === item.consumableId)?.spec || '未知耗材'}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge>{item.codeType}</Badge>
                          <span>x{item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={runPrecheck}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              开始预检
            </Button>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">预检结果</h3>
            </div>

            {/* 兼容性检查结果 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {compatibilityResults?.compatible ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  兼容性检查
                </CardTitle>
              </CardHeader>
              <CardContent>
                {compatibilityResults?.compatible ? (
                  <p className="text-green-600">所有组件与目标打印机兼容</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-red-600">发现兼容性问题:</p>
                    {compatibilityResults?.details.map((detail: any, index: number) => (
                      !detail.isCompatible && (
                        <Alert key={index} variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{detail.reason}</AlertDescription>
                        </Alert>
                      )
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 库存检查结果 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {stockResults?.allAvailable ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  库存检查
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stockResults?.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span>{item.consumableName}</span>
                      <div className="flex items-center gap-2">
                        <span>需要: {item.quantity}</span>
                        <span>库存: {item.currentStock}</span>
                        {item.available ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex-1"
              >
                返回修改
              </Button>
              <Button
                onClick={handleSubmit(executeInstallMutation.mutate)}
                disabled={
                  !compatibilityResults?.compatible ||
                  !stockResults?.allAvailable ||
                  executeInstallMutation.isPending
                }
                className="flex-1"
              >
                {executeInstallMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                执行安装
              </Button>
            </div>

            {executeInstallMutation.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {executeInstallMutation.error.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-600">安装完成!</h3>
              <p className="text-gray-600 mt-2">
                所有组件已成功安装到目标打印机
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>安装摘要</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-left space-y-2">
                  <div><strong>模板:</strong> {selectedTemplate?.name}</div>
                  <div><strong>打印机:</strong> {selectedPrinter?.serial_no}</div>
                  <div><strong>位置:</strong> {locations.find(l => l.id === locationId)?.name}</div>
                  <div><strong>完成时间:</strong> {new Date().toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(1)
                  setCompatibilityResults(null)
                  setStockResults(null)
                }}
                className="flex-1"
              >
                继续安装其他设备
              </Button>
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1"
              >
                返回仪表盘
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">安装向导</h1>
        <p className="text-gray-600 mt-1">使用预定义模板快速安装和配置设备</p>
      </div>

      {/* 进度指示器 */}
      <div className="mb-8">
        <Progress value={(currentStep / 4) * 100} className="w-full" />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}>选择模板</span>
          <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>预检</span>
          <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}>确认</span>
          <span className={currentStep >= 4 ? 'text-blue-600 font-medium' : ''}>完成</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  )
}