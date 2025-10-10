// src/components/ActionModal.tsx
// 单据操作对话框组件

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { checkCompatibility, getCompatibleConsumables, getAvailableCodes } from '../server/compatibility'

const actionSchema = z.object({
  action_type: z.enum(['入库', '出库', '借用', '归还', '调拨', '安装', '拆卸', '报修', '报废', '耗材领用', '耗材归还']),
  asset_type: z.enum(['机器', '打印机', '路由器', '物联网卡', '耗材']).optional(),
  asset_id: z.string().optional(),
  qty: z.number().min(1).optional(),
  from_location_id: z.string().optional(),
  to_location_id: z.string().optional(),
  by_user: z.string().min(1, '操作员不能为空'),
  related_person: z.string().optional(),
  work_order: z.string().optional(),
  consumable_id: z.string().optional(),
  code_id: z.string().optional(),
  code_type: z.enum(['专码', '通码']).optional(),
  remark: z.string().optional()
})

type ActionFormData = z.infer<typeof actionSchema>

interface ActionModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultValues?: Partial<ActionFormData>
  contextAsset?: {
    id: string
    type: string
    name: string
    model_id?: string
  }
}

export function ActionModal({
  open,
  onClose,
  onSuccess,
  defaultValues = {},
  contextAsset
}: ActionModalProps) {
  const queryClient = useQueryClient()
  const [compatibilityError, setCompatibilityError] = useState<string | null>(null)

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      by_user: '管理员',
      qty: 1,
      ...defaultValues,
      ...(contextAsset && {
        asset_id: contextAsset.id,
        asset_type: contextAsset.type as any
      })
    }
  })

  const actionType = watch('action_type')
  const assetId = watch('asset_id')
  const consumableId = watch('consumable_id')
  const codeType = watch('code_type')

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

  // 获取资产列表
  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          printer_models(brand, model),
          locations(name)
        `)
        .order('serial_no')
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
        .order('type', { ascending: true })
      if (error) throw error
      return data
    }
  })

  // 获取兼容的耗材（如果选择了打印机）
  const { data: compatibleConsumables = [] } = useQuery({
    queryKey: ['compatible-consumables', contextAsset?.model_id],
    queryFn: () => getCompatibleConsumables(contextAsset!.model_id!),
    enabled: !!contextAsset?.model_id && contextAsset.type === '打印机'
  })

  // 获取可用码列表
  const { data: availableCodes = [] } = useQuery({
    queryKey: ['available-codes', codeType],
    queryFn: () => getAvailableCodes(codeType),
    enabled: !!codeType
  })

  // 兼容性检查
  useEffect(() => {
    if (contextAsset?.model_id && consumableId && codeType) {
      checkCompatibility({
        printerModelId: contextAsset.model_id,
        consumableId,
        codeType
      }).then(result => {
        if (!result.isCompatible) {
          setCompatibilityError(result.reason || '兼容性检查失败')
        } else {
          setCompatibilityError(null)
        }
      })
    } else {
      setCompatibilityError(null)
    }
  }, [contextAsset?.model_id, consumableId, codeType])

  // 执行操作的mutation
  const performActionMutation = useMutation({
    mutationFn: async (data: ActionFormData) => {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/perform_action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ action: data })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '操作失败')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['actions'] })
      queryClient.invalidateQueries({ queryKey: ['stock_ledger'] })
      onSuccess?.()
      onClose()
      reset()
    }
  })

  const onSubmit = (data: ActionFormData) => {
    if (compatibilityError) {
      return
    }
    performActionMutation.mutate(data)
  }

  const shouldShowLocation = (field: 'from' | 'to') => {
    if (!actionType) return false

    const fromActions = ['出库', '借用', '调拨', '耗材领用']
    const toActions = ['入库', '借用', '归还', '调拨', '安装', '报修', '报废', '耗材领用', '耗材归还']

    return field === 'from' ? fromActions.includes(actionType) : toActions.includes(actionType)
  }

  const shouldShowAsset = () => {
    return !['耗材领用', '耗材归还'].includes(actionType || '')
  }

  const shouldShowConsumable = () => {
    return ['安装', '耗材领用', '耗材归还'].includes(actionType || '')
  }

  const shouldShowCode = () => {
    return actionType === '安装' && contextAsset?.type === '打印机'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contextAsset ? `${contextAsset.name} - ` : ''}创建操作单据
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 操作类型 */}
          <div>
            <Label htmlFor="action_type">操作类型</Label>
            <Controller
              name="action_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择操作类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="入库">入库</SelectItem>
                    <SelectItem value="出库">出库</SelectItem>
                    <SelectItem value="借用">借用</SelectItem>
                    <SelectItem value="归还">归还</SelectItem>
                    <SelectItem value="调拨">调拨</SelectItem>
                    <SelectItem value="安装">安装</SelectItem>
                    <SelectItem value="拆卸">拆卸</SelectItem>
                    <SelectItem value="报修">报修</SelectItem>
                    <SelectItem value="报废">报废</SelectItem>
                    <SelectItem value="耗材领用">耗材领用</SelectItem>
                    <SelectItem value="耗材归还">耗材归还</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.action_type && (
              <p className="text-sm text-red-500">{errors.action_type.message}</p>
            )}
          </div>

          {/* 资产选择 */}
          {shouldShowAsset() && !contextAsset && (
            <div>
              <Label htmlFor="asset_id">选择资产</Label>
              <Controller
                name="asset_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择资产" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map(asset => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.serial_no} - {asset.printer_models?.brand} {asset.printer_models?.model} ({asset.locations?.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* 数量 */}
          {['耗材领用', '耗材归还'].includes(actionType || '') && (
            <div>
              <Label htmlFor="qty">数量</Label>
              <Controller
                name="qty"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                )}
              />
              {errors.qty && (
                <p className="text-sm text-red-500">{errors.qty.message}</p>
              )}
            </div>
          )}

          {/* 来源位置 */}
          {shouldShowLocation('from') && (
            <div>
              <Label htmlFor="from_location_id">来源位置</Label>
              <Controller
                name="from_location_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择来源位置" />
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
            </div>
          )}

          {/* 目标位置 */}
          {shouldShowLocation('to') && (
            <div>
              <Label htmlFor="to_location_id">目标位置</Label>
              <Controller
                name="to_location_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择目标位置" />
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
            </div>
          )}

          {/* 耗材选择 */}
          {shouldShowConsumable() && (
            <div>
              <Label htmlFor="consumable_id">选择耗材</Label>
              <Controller
                name="consumable_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择耗材" />
                    </SelectTrigger>
                    <SelectContent>
                      {(compatibleConsumables.length > 0 ? compatibleConsumables : consumables).map(consumable => (
                        <SelectItem key={consumable.id} value={consumable.id}>
                          {consumable.type} - {consumable.spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* 码类型和码选择 */}
          {shouldShowCode() && (
            <>
              <div>
                <Label htmlFor="code_type">码类型</Label>
                <Controller
                  name="code_type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择码类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="专码">专码</SelectItem>
                        <SelectItem value="通码">通码</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {codeType && (
                <div>
                  <Label htmlFor="code_id">选择码</Label>
                  <Controller
                    name="code_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={`选择${codeType}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCodes.map(code => (
                            <SelectItem key={code.id} value={code.id}>
                              {code.code_value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
            </>
          )}

          {/* 操作员 */}
          <div>
            <Label htmlFor="by_user">操作员</Label>
            <Controller
              name="by_user"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="输入操作员姓名" />
              )}
            />
            {errors.by_user && (
              <p className="text-sm text-red-500">{errors.by_user.message}</p>
            )}
          </div>

          {/* 相关人员 */}
          {['借用', '归还'].includes(actionType || '') && (
            <div>
              <Label htmlFor="related_person">相关人员</Label>
              <Controller
                name="related_person"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="借用人/归还人姓名" />
                )}
              />
            </div>
          )}

          {/* 工单号 */}
          <div>
            <Label htmlFor="work_order">工单号（可选）</Label>
            <Controller
              name="work_order"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="输入工单号" />
              )}
            />
          </div>

          {/* 备注 */}
          <div>
            <Label htmlFor="remark">备注</Label>
            <Controller
              name="remark"
              control={control}
              render={({ field }) => (
                <Textarea {...field} placeholder="输入备注信息" />
              )}
            />
          </div>

          {/* 兼容性错误提示 */}
          {compatibilityError && (
            <Alert variant="destructive">
              <AlertDescription>
                兼容性检查失败: {compatibilityError}
              </AlertDescription>
            </Alert>
          )}

          {/* 操作失败错误提示 */}
          {performActionMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {performActionMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={performActionMutation.isPending || !!compatibilityError}
            >
              {performActionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              确认操作
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}