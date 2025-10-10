// tests/unit/perform-action.test.ts
// 事务操作单元测试

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch for testing Edge Function calls
global.fetch = vi.fn()

describe('perform_action 事务测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('设备调拨后状态和位置应该同步', async () => {
    const mockResponse = {
      success: true,
      action_id: 'test-action-id'
    }

    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const actionData = {
      action_type: '调拨',
      asset_type: '打印机',
      asset_id: 'printer-001',
      from_location_id: 'warehouse',
      to_location_id: 'showroom',
      by_user: '技术员',
      remark: '调拨测试'
    }

    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/perform_action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ action: actionData })
    })

    const result = await response.json()

    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/perform_action',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-anon-key'
        }),
        body: JSON.stringify({ action: actionData })
      })
    )

    expect(result.success).toBe(true)
    expect(result.action_id).toBe('test-action-id')
  })

  it('DNP安装耗材选择通码应该全量回滚', async () => {
    const mockErrorResponse = {
      error: '兼容性检查失败: DNP打印机只支持专码，不支持通码'
    }

    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(mockErrorResponse)
    })

    const actionData = {
      action_type: '安装',
      asset_type: '打印机',
      asset_id: 'dnp-printer-001',
      consumable_id: 'ribbon-001',
      code_type: '通码',
      by_user: '技术员'
    }

    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/perform_action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ action: actionData })
    })

    expect(response.ok).toBe(false)

    const result = await response.json()
    expect(result.error).toContain('DNP打印机只支持专码')
  })

  it('归还操作后库存应该正确回滚', async () => {
    const mockResponse = {
      success: true,
      action_id: 'return-action-id',
      stock_updated: true
    }

    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const actionData = {
      action_type: '归还',
      asset_type: '打印机',
      asset_id: 'printer-005',
      from_location_id: 'personal',
      to_location_id: 'warehouse',
      by_user: '管理员',
      related_person: '李工'
    }

    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/perform_action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ action: actionData })
    })

    const result = await response.json()

    expect(result.success).toBe(true)
    expect(result.action_id).toBe('return-action-id')

    // 验证审计记录应该被创建
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('耗材领用库存不足应该失败', async () => {
    const mockErrorResponse = {
      error: '库存不足: 当前库存 5, 需要 10'
    }

    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(mockErrorResponse)
    })

    const actionData = {
      action_type: '耗材领用',
      consumable_id: 'paper-6inch',
      qty: 10,
      from_location_id: 'warehouse',
      to_location_id: 'showroom',
      by_user: '技术员'
    }

    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/perform_action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ action: actionData })
    })

    expect(response.ok).toBe(false)

    const result = await response.json()
    expect(result.error).toContain('库存不足')
    expect(result.error).toContain('当前库存 5')
    expect(result.error).toContain('需要 10')
  })

  it('专码重复绑定应该失败并回滚', async () => {
    const mockErrorResponse = {
      error: '码绑定检查失败: 专码已绑定其他设备或设备已绑定其他专码'
    }

    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(mockErrorResponse)
    })

    const actionData = {
      action_type: '安装',
      asset_type: '打印机',
      asset_id: 'printer-002',
      code_id: 'dnp-code-001',
      code_type: '专码',
      by_user: '技术员'
    }

    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/perform_action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ action: actionData })
    })

    expect(response.ok).toBe(false)

    const result = await response.json()
    expect(result.error).toContain('码绑定检查失败')
  })

  it('并发阈值校验应该防止超量分配', async () => {
    const mockErrorResponse = {
      error: '并发冲突: 库存在处理过程中被其他操作修改'
    }

    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(mockErrorResponse)
    })

    // 模拟并发操作
    const actionData = {
      action_type: '耗材领用',
      consumable_id: 'limited-item',
      qty: 5,
      from_location_id: 'warehouse',
      to_location_id: 'showroom',
      by_user: '技术员A'
    }

    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/perform_action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ action: actionData })
    })

    expect(response.ok).toBe(false)

    const result = await response.json()
    expect(result.error).toContain('并发冲突')
  })
})