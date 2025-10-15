import { test, expect } from '@playwright/test'

test.describe('审计日志', () => {
  test('AUD-001 审计过滤与导出', async ({ page }) => {
    await page.goto('/audit')
    await page.waitForLoadState('networkidle')

    const table = page.getByTestId('audit-table')
    await expect(table).toBeVisible()

    const searchInput = page.getByTestId('audit-search-input')
    await searchInput.fill('不会存在的关键字E2E')
    await page.waitForTimeout(500)
    await expect(table).toBeVisible()

    await searchInput.fill('')

    const detailButtons = page.getByTestId('audit-detail-button')
    if (await detailButtons.count()) {
      await detailButtons.first().click()
      await expect(page.getByText('审计详情')).toBeVisible()
      await page.keyboard.press('Escape')
    }

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('audit-export').click()
    ])
    await expect(download.suggestedFilename()).toContain('audit_logs')
  })
})
