import { test, expect } from '@playwright/test'

test.describe('库存管理', () => {
  test('STK-001/STK-020 调整库存并保存', async ({ page }) => {
    await page.goto('/inventory')
    await page.waitForLoadState('networkidle')

    const paperInput = page.getByTestId('inventory-paper-DNP-DS620-4x6')
    await expect(paperInput).toBeVisible()

    const originalValue = parseInt(await paperInput.inputValue(), 10)
    const updatedValue = originalValue > 10 ? originalValue - 5 : originalValue + 5
    await paperInput.fill(String(updatedValue))

    const saveButton = page.getByTestId('inventory-save')
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    await expect(page.getByText('库存已更新')).toBeVisible()
    await expect(paperInput).toHaveValue(String(updatedValue))
  })
})
