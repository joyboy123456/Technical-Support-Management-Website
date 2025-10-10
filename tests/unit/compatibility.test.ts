// tests/unit/compatibility.test.ts
// 兼容性检查单元测试

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkCompatibility, checkCodeBinding } from '../../src/server/compatibility'

// Mock Supabase
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}))

describe('兼容性检查测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkCompatibility', () => {
    it('DNP打印机使用通码应该失败', async () => {
      const { supabase } = await import('../../src/lib/supabase')

      // Mock DNP品牌返回
      ;(supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { brand: 'DNP', model: 'DS40' },
              error: null
            })
          })
        })
      })

      // Mock 兼容性检查返回失败
      ;(supabase.rpc as any).mockResolvedValue({
        data: false,
        error: null
      })

      const result = await checkCompatibility({
        printerModelId: 'test-dnp-model',
        consumableId: 'test-consumable',
        codeType: '通码'
      })

      expect(result.isCompatible).toBe(false)
      expect(result.reason).toContain('DNP打印机只支持专码')
    })

    it('诚研打印机使用专码应该成功', async () => {
      const { supabase } = await import('../../src/lib/supabase')

      // Mock 诚研品牌返回
      ;(supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { brand: '诚研', model: 'PS25L' },
              error: null
            })
          })
        })
      })

      // Mock 兼容性检查返回成功
      ;(supabase.rpc as any).mockResolvedValue({
        data: true,
        error: null
      })

      const result = await checkCompatibility({
        printerModelId: 'test-chenyan-model',
        consumableId: 'test-consumable',
        codeType: '专码'
      })

      expect(result.isCompatible).toBe(true)
      expect(result.brand).toBe('诚研')
    })

    it('西铁城打印机使用通码应该成功', async () => {
      const { supabase } = await import('../../src/lib/supabase')

      // Mock 西铁城品牌返回
      ;(supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { brand: '西铁城', model: 'CX-02' },
              error: null
            })
          })
        })
      })

      // Mock 兼容性检查返回成功
      ;(supabase.rpc as any).mockResolvedValue({
        data: true,
        error: null
      })

      const result = await checkCompatibility({
        printerModelId: 'test-citizen-model',
        consumableId: 'test-consumable',
        codeType: '通码'
      })

      expect(result.isCompatible).toBe(true)
      expect(result.brand).toBe('西铁城')
    })
  })

  describe('checkCodeBinding', () => {
    it('专码重复绑定应该失败', async () => {
      const { supabase } = await import('../../src/lib/supabase')

      // Mock 码信息返回 - 已绑定其他打印机的专码
      ;(supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                code_type: '专码',
                status: '已发',
                bound_printer_id: 'other-printer-id'
              },
              error: null
            })
          })
        })
      })

      // Mock 绑定检查返回失败
      ;(supabase.rpc as any).mockResolvedValue({
        data: false,
        error: null
      })

      const result = await checkCodeBinding({
        codeId: 'test-code',
        printerId: 'test-printer'
      })

      expect(result.canBind).toBe(false)
      expect(result.reason).toContain('专码已绑定')
    })

    it('通码可以重复绑定', async () => {
      const { supabase } = await import('../../src/lib/supabase')

      // Mock 通码信息返回
      ;(supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                code_type: '通码',
                status: '未发',
                bound_printer_id: null
              },
              error: null
            })
          })
        })
      })

      // Mock 绑定检查返回成功
      ;(supabase.rpc as any).mockResolvedValue({
        data: true,
        error: null
      })

      const result = await checkCodeBinding({
        codeId: 'test-code',
        printerId: 'test-printer'
      })

      expect(result.canBind).toBe(true)
      expect(result.codeType).toBe('通码')
    })

    it('未绑定的专码可以绑定', async () => {
      const { supabase } = await import('../../src/lib/supabase')

      // Mock 未绑定专码信息返回
      ;(supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                code_type: '专码',
                status: '未发',
                bound_printer_id: null
              },
              error: null
            })
          })
        })
      })

      // Mock 绑定检查返回成功
      ;(supabase.rpc as any).mockResolvedValue({
        data: true,
        error: null
      })

      const result = await checkCodeBinding({
        codeId: 'test-code',
        printerId: 'test-printer'
      })

      expect(result.canBind).toBe(true)
      expect(result.codeType).toBe('专码')
    })
  })
})