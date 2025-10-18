import { test, expect } from '@playwright/test'

test.describe('出库与归还流程', () => {
  test('LOAN-001/RET-001 出库 + 归还全链路', async ({ page }) => {
    const deviceName = '魔镜10号'

    await page.goto('/outbound')
    await page.waitForLoadState('networkidle')

    // 填写出库单
    await page.getByTestId('outbound-device-select').click()
    const deviceOption = page.getByRole('option', { name: new RegExp(deviceName) })
    await deviceOption.waitFor({ timeout: 15000 })
    await deviceOption.click()

    await page.getByTestId('outbound-destination').fill('成都展会')
    await page.getByTestId('outbound-operator').fill('李借出')
    await page.getByTestId('outbound-notes').fill('E2E 自动化出库测试')

    await page.getByTestId('outbound-printer-select').click()
    await page.getByRole('option').first().click()
    await page.getByTestId('outbound-paper-type').click()
    await page.getByRole('option').first().click()
    await page.getByTestId('outbound-paper-qty').fill('20')

    await page.getByTestId('outbound-submit').click()
    await expect(page.getByText('出库记录已创建')).toBeVisible()

    // 再次尝试出库同一设备应失败
    await page.getByTestId('outbound-device-select').click()
    await page.getByRole('option', { name: new RegExp(deviceName) }).click()
    await page.getByTestId('outbound-destination').fill('重复测试目的地')
    await page.getByTestId('outbound-operator').fill('重复操作员')
    await page.getByTestId('outbound-submit').click()
    await expect(page.getByText(/已有未归还的出库记录/)).toBeVisible()

    // 查看出库历史并执行归还
    await page.getByRole('button', { name: '出库历史' }).click()
    const recordLocator = page
      .getByTestId('outbound-record-card')
      .filter({ hasText: deviceName })
    await expect(recordLocator.first()).toBeVisible()
    await recordLocator.first().getByTestId('outbound-return-button').first().click()

    await page.getByTestId('return-operator').fill('王归还')
    await page.getByTestId('return-paper-qty').fill('20')
    await page.getByTestId('return-submit').click()
    await expect(page.getByText('归还记录已创建')).toBeVisible()

    // 归还后状态更新
    await expect(recordLocator.getByText('已归还').first()).toBeVisible()
    await expect(recordLocator.getByText('归还操作员: 王归还').first()).toBeVisible()

    // 删除记录
    await recordLocator.first().getByTestId('outbound-delete-button').click()
    await page.getByTestId('outbound-delete-confirm').click()
    await expect(page.getByText('出库记录已删除')).toBeVisible()
    await expect(recordLocator).toHaveCount(0)
  })
})
