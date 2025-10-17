import { test, expect } from '@playwright/test'
import {
  cleanupSeededActions,
  fetchAnyLocation,
  hasSupabaseAdminConfig,
  seedCheckoutActions
} from './utils/supabase-admin'

const describeOperations = hasSupabaseAdminConfig ? test.describe : test.describe.skip

describeOperations('运营看板出库回归', () => {
  test.describe.configure({ mode: 'serial' })

  let seededActions: Awaited<ReturnType<typeof seedCheckoutActions>>['actions'] = []
  let seededActionIds: string[] = []
  let seededMarker = ''
  let seededLocation: Awaited<ReturnType<typeof fetchAnyLocation>> | undefined

  test.beforeAll(async () => {
    seededLocation = (await fetchAnyLocation()) ?? undefined

    const seedResult = await seedCheckoutActions({ location: seededLocation ?? undefined })
    seededActions = seedResult.actions
    seededActionIds = seedResult.actions.map(action => action.id)
    seededMarker = seedResult.marker
  })

  test.afterAll(async () => {
    await cleanupSeededActions(seededActionIds)
  })

  test('OPS-DASH-201 指标、图表、筛选展示出库趋势', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // KPI 关键指标
    const totalAssets = page.getByTestId('dashboard-total-assets')
    const utilization = page.getByTestId('dashboard-utilization')
    const lowStock = page.getByTestId('dashboard-low-stock')
    const maintenance = page.getByTestId('dashboard-maintenance')

    await expect(totalAssets).toBeVisible()
    await expect(utilization).toBeVisible()
    await expect(lowStock).toBeVisible()
    await expect(maintenance).toBeVisible()

    await expect(totalAssets).toHaveText(/\d+/)
    await expect(utilization).toHaveText(/\d+(\.\d+)?%/)
    await expect(lowStock).toHaveText(/\d+/)
    await expect(maintenance).toHaveText(/\d+/)

    // 标签页与图表切换
    await page.getByRole('tab', { name: '设备统计' }).click()
    await expect(page.getByRole('heading', { name: '打印机状态分布' })).toBeVisible()

    await page.getByRole('tab', { name: '库存管理' }).click()
    await expect(page.getByRole('heading', { name: '库存水平监控' })).toBeVisible()

    await page.getByRole('tab', { name: '维护分析' }).click()
    await expect(page.getByRole('heading', { name: '问题类型分布' })).toBeVisible()

    await page.getByRole('tab', { name: '操作趋势' }).click()
    const trendCard = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByRole('heading', { name: '操作趋势图' }) })
    await expect(trendCard).toBeVisible()

    const trendPath = trendCard.locator('path.recharts-line-curve').first()
    const trendPathData = await trendPath.getAttribute('d')
    if (!trendPathData || !/C/.test(trendPathData)) {
      console.warn('出库趋势曲线未按预期生成', {
        marker: seededMarker,
        seededActions,
        trendPathData
      })
    }
    expect(trendPathData).toBeTruthy()

    const trendDots = trendCard.locator('circle.recharts-dot')
    const dotCount = await trendDots.count()
    if (dotCount === 0) {
      console.warn('出库趋势图缺少数据点', {
        marker: seededMarker,
        seededActions
      })
    }
    expect(dotCount).toBeGreaterThan(0)

    const chartSurface = trendCard.locator('svg.recharts-surface').first()
    const chartBox = await chartSurface.boundingBox()
    if (chartBox) {
      await page.mouse.move(chartBox.x + chartBox.width / 2, chartBox.y + chartBox.height / 2)
      const tooltip = page.locator('.recharts-tooltip-wrapper')
      try {
        await expect(tooltip).toBeVisible({ timeout: 2000 })
        const tooltipText = (await tooltip.innerText()).replace(/\s+/g, ' ')
        if (!/count/i.test(tooltipText)) {
          console.warn('出库趋势图提示信息缺少计数字段', {
            marker: seededMarker,
            tooltipText,
            seededActions
          })
        }
        expect(tooltipText).toMatch(/\d/)
      } catch (error) {
        console.warn('未能在出库趋势图中触发提示信息', {
          marker: seededMarker,
          seededActions,
          chartBox
        })
        throw error
      }
    } else {
      console.warn('无法获取操作趋势图尺寸信息', {
        marker: seededMarker,
        seededActions
      })
    }

    // 时间范围切换
    const comboboxes = page.getByRole('combobox')
    const timeRangeTrigger = comboboxes.first()
    await timeRangeTrigger.click()
    await page.getByRole('option', { name: '最近30天' }).click()
    await expect(timeRangeTrigger).toContainText('最近30天')
    await timeRangeTrigger.click()
    await page.getByRole('option', { name: '最近7天' }).click()
    await expect(timeRangeTrigger).toContainText('最近7天')

    // 地点筛选 (若提供)
    const comboboxCount = await comboboxes.count()
    if (comboboxCount > 1) {
      const locationTrigger = comboboxes.nth(1)
      await locationTrigger.click()

      let locationSelected = false
      if (seededLocation?.name) {
        const locationOption = page.getByRole('option', { name: new RegExp(seededLocation.name) })
        if (await locationOption.count()) {
          await locationOption.first().click()
          await expect(locationTrigger).toContainText(seededLocation.name)
          locationSelected = true
        } else {
          const availableOptions = await page.getByRole('option').allTextContents()
          console.warn('地点筛选未包含种子数据地点', {
            marker: seededMarker,
            expected: seededLocation.name,
            availableOptions
          })
        }
      }

      if (!locationSelected) {
        const fallbackOption = page.getByRole('option').first()
        const fallbackText = (await fallbackOption.innerText()).trim()
        await fallbackOption.click()
        const fallbackPattern = new RegExp(fallbackText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        await expect(locationTrigger).toContainText(fallbackPattern)
      }
    } else {
      console.warn('统计看板未呈现地点筛选控件', {
        marker: seededMarker,
        seededLocation
      })
    }
  })

  test('OPS-DASH-202 数据加载时显示骨架/加载态', async ({ page }) => {
    await page.route('**/rest/v1/**', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.continue()
        return
      }

      await new Promise(resolve => setTimeout(resolve, 1500))
      await route.continue()
    })

    await page.goto('/dashboard')
    const spinner = page.locator('.animate-spin')
    await expect(spinner).toBeVisible({ timeout: 2000 })
    await expect(spinner).toBeHidden()
    await expect(page.getByTestId('dashboard-total-assets')).toBeVisible()
  })

  test('OPS-DASH-203 数据接口失败时展示错误提示', async ({ page }) => {
    await page.route('**/rest/v1/**', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, body: '' })
        return
      }

      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Injected failure for E2E' })
      })
    })

    await page.goto('/dashboard')
    await expect(page.getByText('加载仪表盘数据失败，请稍后重试')).toBeVisible()
  })
})
