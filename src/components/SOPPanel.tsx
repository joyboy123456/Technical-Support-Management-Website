// src/components/SOPPanel.tsx
// SOP（标准操作程序）面板组件

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from './ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from './ui/dialog'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  CheckCircle,
  Clock,
  Save
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SOPStep {
  step: string
  completed: boolean
  completedAt?: string
  completedBy?: string
  notes?: string
}

interface SOP {
  id: string
  title: string
  asset_type: string
  brand?: string
  model?: string
  steps: SOPStep[]
}

interface SOPPanelProps {
  assetId: string
  assetType: string
  brand?: string
  model?: string
}

export function SOPPanel({ assetId, assetType, brand, model }: SOPPanelProps) {
  const queryClient = useQueryClient()
  const [openSOP, setOpenSOP] = useState<string | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null)

  // 获取相关的SOP列表
  const { data: sops = [], isLoading } = useQuery({
    queryKey: ['sops', assetType, brand, model],
    queryFn: async () => {
      let query = supabase
        .from('sops')
        .select('*')
        .eq('asset_type', assetType)

      if (brand) {
        query = query.or(`brand.is.null,brand.eq.${brand}`)
      }

      if (model) {
        query = query.or(`model.is.null,model.eq.${model}`)
      }

      const { data, error } = await query.order('title')

      if (error) throw error
      return data || []
    }
  })

  // 完成步骤的mutation
  const completeStepMutation = useMutation({
    mutationFn: async ({
      sopId,
      stepIndex,
      notes
    }: {
      sopId: string
      stepIndex: number
      notes?: string
    }) => {
      // 获取当前SOP
      const { data: currentSOP, error: fetchError } = await supabase
        .from('sops')
        .select('steps')
        .eq('id', sopId)
        .single()

      if (fetchError) throw fetchError

      // 更新步骤状态
      const updatedSteps = [...currentSOP.steps]
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        completed: true,
        completedAt: new Date().toISOString(),
        completedBy: '当前用户', // 实际应用中应该从认证获取
        notes: notes || undefined
      }

      // 更新到数据库
      const { error: updateError } = await supabase
        .from('sops')
        .update({ steps: updatedSteps })
        .eq('id', sopId)

      if (updateError) throw updateError

      // 记录维护记录
      const { error: recordError } = await supabase
        .from('maintenance_records')
        .insert({
          asset_id: assetId,
          title: `SOP步骤完成: ${updatedSteps[stepIndex].step}`,
          detail: notes || `完成SOP步骤: ${updatedSteps[stepIndex].step}`,
          performed_by: '当前用户'
        })

      if (recordError) throw recordError

      return updatedSteps
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sops'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance_records', assetId] })
      setCompletionNotes('')
      setActiveStepIndex(null)
    }
  })

  // 重置SOP的mutation
  const resetSOPMutation = useMutation({
    mutationFn: async (sopId: string) => {
      const { data: currentSOP, error: fetchError } = await supabase
        .from('sops')
        .select('steps')
        .eq('id', sopId)
        .single()

      if (fetchError) throw fetchError

      // 重置所有步骤
      const resetSteps = currentSOP.steps.map((step: SOPStep) => ({
        step: step.step,
        completed: false
      }))

      const { error: updateError } = await supabase
        .from('sops')
        .update({ steps: resetSteps })
        .eq('id', sopId)

      if (updateError) throw updateError

      return resetSteps
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sops'] })
    }
  })

  const handleStepCompletion = (sopId: string, stepIndex: number) => {
    setActiveStepIndex(stepIndex)
  }

  const confirmStepCompletion = (sopId: string, stepIndex: number) => {
    completeStepMutation.mutate({
      sopId,
      stepIndex,
      notes: completionNotes
    })
  }

  const getSOPProgress = (sop: SOP) => {
    const totalSteps = sop.steps.length
    const completedSteps = sop.steps.filter(step => step.completed).length
    return { completed: completedSteps, total: totalSteps, percentage: (completedSteps / totalSteps) * 100 }
  }

  const getStepBadgeVariant = (step: SOPStep, index: number) => {
    if (step.completed) return 'default'
    if (index === 0 || sops[0]?.steps[index - 1]?.completed) return 'secondary'
    return 'outline'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            标准操作程序
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sops.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            标准操作程序
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            该设备类型暂无相关SOP
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sops.map((sop) => {
        const progress = getSOPProgress(sop)
        const isOpen = openSOP === sop.id

        return (
          <Card key={sop.id}>
            <Collapsible
              open={isOpen}
              onOpenChange={(open) => setOpenSOP(open ? sop.id : null)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <FileText className="h-5 w-5" />
                      <CardTitle className="text-base">{sop.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={progress.percentage === 100 ? 'default' : 'secondary'}>
                        {progress.completed}/{progress.total}
                      </Badge>
                      {progress.percentage === 100 && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {sop.steps.map((step, index) => (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg ${
                          step.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={step.completed}
                            disabled={step.completed}
                            onCheckedChange={() => handleStepCompletion(sop.id, index)}
                          />
                          <div className="flex-1">
                            <p className={`text-sm ${step.completed ? 'line-through text-gray-600' : ''}`}>
                              {index + 1}. {step.step}
                            </p>
                            {step.completed && (
                              <div className="mt-2 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  完成时间: {step.completedAt ? new Date(step.completedAt).toLocaleString() : '未知'}
                                </div>
                                {step.completedBy && (
                                  <div>完成人: {step.completedBy}</div>
                                )}
                                {step.notes && (
                                  <div className="mt-1 p-2 bg-white rounded border">
                                    备注: {step.notes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <Badge variant={getStepBadgeVariant(step, index)}>
                            {step.completed ? '已完成' : index === 0 || sop.steps[index - 1]?.completed ? '可执行' : '等待中'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      进度: {progress.completed}/{progress.total} ({progress.percentage.toFixed(0)}%)
                    </div>
                    <div className="flex gap-2">
                      {progress.percentage === 100 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resetSOPMutation.mutate(sop.id)}
                          disabled={resetSOPMutation.isPending}
                        >
                          重置
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )
      })}

      {/* 步骤完成确认对话框 */}
      <Dialog open={activeStepIndex !== null} onOpenChange={() => setActiveStepIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认完成步骤</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {activeStepIndex !== null && sops[0]?.steps[activeStepIndex] && (
              <div>
                <p className="font-medium">
                  步骤 {activeStepIndex + 1}: {sops[0].steps[activeStepIndex].step}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="notes">完成备注（可选）</Label>
              <Textarea
                id="notes"
                placeholder="输入执行过程中的注意事项或发现的问题..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveStepIndex(null)}>
              取消
            </Button>
            <Button
              onClick={() => {
                if (activeStepIndex !== null) {
                  confirmStepCompletion(sops[0].id, activeStepIndex)
                }
              }}
              disabled={completeStepMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              确认完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}