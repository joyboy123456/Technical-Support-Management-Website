import { test, expect } from '@playwright/test'

test.describe('统计看板', () => {
  test('DASH-150 关键指标与标签页展示', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('dashboard-total-assets')).toBeVisible()
    await expect(page.getByTestId('dashboard-utilization')).toBeVisible()
    await expect(page.getByTestId('dashboard-low-stock')).toBeVisible()
    await expect(page.getByTestId('dashboard-maintenance')).toBeVisible()

    // 切换标签页验证图表区域渲染
    await page.getByRole('tab', { name: '库存管理' }).click()
    await expect(page.getByText('库存水平监控')).toBeVisible()

    await page.getByRole('tab', { name: '操作趋势' }).click()
    await expect(page.getByText('操作趋势图')).toBeVisible()

    await page.getByRole('tab', { name: '维护分析' }).click()
    await expect(page.getByText('问题类型分布')).toBeVisible()

    await page.getByRole('tab', { name: '设备统计' }).click()
    await expect(page.getByText('打印机状态分布')).toBeVisible()
  })
})
