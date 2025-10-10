// tests/e2e/dashboard.spec.ts
// Dashboard E2E 测试 - Action触发后仪表盘联动

import { test, expect } from '@playwright/test'

test.describe('仪表盘集成测试', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到主页
    await page.goto('/')

    // 等待页面加载完成
    await page.waitForLoadState('networkidle')
  })

  test('设备操作后仪表盘数据应该更新', async ({ page }) => {
    // 1. 首先记录初始仪表盘数据
    await page.goto('/dashboard')
    await page.waitForSelector('[data-testid="printer-total-count"]')

    const initialPrinterCount = await page.textContent('[data-testid="printer-total-count"]')
    const initialAvailableCount = await page.textContent('[data-testid="printer-available-count"]')

    // 2. 导航到设备详情页面执行操作
    await page.goto('/device?id=printer-001')
    await page.waitForSelector('[data-testid="device-detail-page"]')

    // 3. 点击"借用"快捷按钮
    await page.click('button:has-text("借用")')

    // 4. 填写借用信息
    await page.waitForSelector('[data-testid="action-modal"]')
    await page.selectOption('[data-testid="to-location-select"]', '个人')
    await page.fill('[data-testid="related-person-input"]', '测试用户')
    await page.fill('[data-testid="operator-input"]', 'E2E测试')

    // 5. 提交操作
    await page.click('button:has-text("确认操作")')

    // 6. 等待操作完成
    await page.waitForSelector('.sonner', { state: 'visible' })
    await expect(page.locator('.sonner')).toContainText('操作已成功完成')

    // 7. 返回仪表盘验证数据变化
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // 8. 验证可用设备数量减少
    const updatedAvailableCount = await page.textContent('[data-testid="printer-available-count"]')
    expect(parseInt(updatedAvailableCount!)).toBeLessThan(parseInt(initialAvailableCount!))

    // 9. 验证借出状态设备数量增加
    const borrowedCount = await page.textContent('[data-testid="printer-borrowed-count"]')
    expect(parseInt(borrowedCount!)).toBeGreaterThan(0)

    // 10. 验证总数保持不变
    const finalPrinterCount = await page.textContent('[data-testid="printer-total-count"]')
    expect(finalPrinterCount).toBe(initialPrinterCount)
  })

  test('耗材操作后库存统计应该更新', async ({ page }) => {
    // 1. 检查初始库存状态
    await page.goto('/dashboard')
    await page.click('[data-testid="inventory-tab"]')

    const initialStockLevel = await page.textContent('[data-testid="consumable-stock-level"]:first')

    // 2. 执行耗材领用操作
    await page.goto('/')
    await page.click('button:has-text("创建操作")')

    await page.waitForSelector('[data-testid="action-modal"]')
    await page.selectOption('[data-testid="action-type-select"]', '耗材领用')
    await page.selectOption('[data-testid="consumable-select"]', 'consumable-1')
    await page.fill('[data-testid="quantity-input"]', '5')
    await page.selectOption('[data-testid="from-location-select"]', '仓库')
    await page.selectOption('[data-testid="to-location-select"]', '展厅')
    await page.fill('[data-testid="operator-input"]', 'E2E测试')

    await page.click('button:has-text("确认操作")')

    // 3. 等待操作完成
    await page.waitForSelector('.sonner', { state: 'visible' })

    // 4. 返回仪表盘验证库存变化
    await page.goto('/dashboard')
    await page.click('[data-testid="inventory-tab"]')
    await page.waitForLoadState('networkidle')

    const updatedStockLevel = await page.textContent('[data-testid="consumable-stock-level"]:first')
    expect(parseInt(updatedStockLevel!)).toBeLessThan(parseInt(initialStockLevel!))
  })

  test('操作失败时应该显示错误信息', async ({ page }) => {
    // 1. 尝试执行不兼容的操作 (DNP + 通码)
    await page.goto('/device?id=dnp-printer-001')
    await page.click('button:has-text("更换耗材")')

    await page.waitForSelector('[data-testid="action-modal"]')
    await page.selectOption('[data-testid="consumable-select"]', 'ribbon-001')
    await page.selectOption('[data-testid="code-type-select"]', '通码')
    await page.fill('[data-testid="operator-input"]', 'E2E测试')

    // 2. 提交应该失败
    await page.click('button:has-text("确认操作")')

    // 3. 验证错误信息显示
    await page.waitForSelector('[data-testid="compatibility-error"]')
    await expect(page.locator('[data-testid="compatibility-error"]')).toContainText('DNP打印机只支持专码')

    // 4. 确认按钮应该被禁用
    const confirmButton = page.locator('button:has-text("确认操作")')
    await expect(confirmButton).toBeDisabled()
  })

  test('设备状态变化应该在仪表盘图表中反映', async ({ page }) => {
    // 1. 查看初始图表状态
    await page.goto('/dashboard')
    await page.waitForSelector('[data-testid="printer-status-chart"]')

    // 获取初始状态分布
    const initialMaintenanceCount = await page.textContent('[data-testid="maintenance-count"]')

    // 2. 执行报修操作
    await page.goto('/device?id=printer-002')
    await page.click('button:has-text("报修")')

    await page.waitForSelector('[data-testid="action-modal"]')
    await page.selectOption('[data-testid="to-location-select"]', '维修站')
    await page.fill('[data-testid="work-order-input"]', 'E2E-REPAIR-001')
    await page.fill('[data-testid="remark-input"]', '打印质量问题')
    await page.fill('[data-testid="operator-input"]', 'E2E测试')

    await page.click('button:has-text("确认操作")')

    // 3. 等待操作完成
    await page.waitForSelector('.sonner', { state: 'visible' })

    // 4. 返回仪表盘验证图表更新
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // 等待图表重新渲染
    await page.waitForTimeout(2000)

    const updatedMaintenanceCount = await page.textContent('[data-testid="maintenance-count"]')
    expect(parseInt(updatedMaintenanceCount!)).toBeGreaterThan(parseInt(initialMaintenanceCount!))
  })

  test('审计日志应该记录所有操作', async ({ page }) => {
    // 1. 执行一个设备调拨操作
    await page.goto('/device?id=printer-003')
    await page.click('button:has-text("调拨")')

    await page.waitForSelector('[data-testid="action-modal"]')
    await page.selectOption('[data-testid="from-location-select"]', '仓库')
    await page.selectOption('[data-testid="to-location-select"]', '展厅')
    await page.fill('[data-testid="operator-input"]', 'E2E审计测试')

    await page.click('button:has-text("确认操作")')
    await page.waitForSelector('.sonner', { state: 'visible' })

    // 2. 检查审计日志
    await page.goto('/audit')
    await page.waitForLoadState('networkidle')

    // 3. 搜索刚才的操作
    await page.fill('[data-testid="search-input"]', 'E2E审计测试')
    await page.waitForTimeout(1000)

    // 4. 验证审计记录存在
    const auditRows = page.locator('[data-testid="audit-table"] tbody tr')
    await expect(auditRows.first()).toContainText('E2E审计测试')
    await expect(auditRows.first()).toContainText('UPDATE')

    // 5. 查看详细信息
    await page.click('[data-testid="audit-detail-button"]:first')
    await page.waitForSelector('[data-testid="audit-detail-modal"]')

    // 验证包含变更前后的数据
    await expect(page.locator('[data-testid="audit-before"]')).toBeVisible()
    await expect(page.locator('[data-testid="audit-after"]')).toBeVisible()
  })

  test('SOP操作流程应该被正确记录', async ({ page }) => {
    // 1. 打开设备详情页的SOP面板
    await page.goto('/device?id=epson-printer-001')
    await page.waitForSelector('[data-testid="sop-panel"]')

    // 2. 展开SOP流程
    await page.click('[data-testid="sop-toggle"]:first')

    // 3. 完成第一个步骤
    await page.click('[data-testid="sop-step-checkbox"]:first')

    // 4. 填写完成备注
    await page.waitForSelector('[data-testid="completion-notes"]')
    await page.fill('[data-testid="completion-notes"]', 'E2E测试完成步骤1')
    await page.click('button:has-text("确认完成")')

    // 5. 验证步骤状态更新
    await expect(page.locator('[data-testid="sop-step"]:first')).toHaveClass(/completed/)

    // 6. 检查维护记录是否生成
    await page.waitForTimeout(1000)
    const maintenanceSection = page.locator('[data-testid="maintenance-section"]')
    await expect(maintenanceSection).toContainText('SOP步骤完成')
  })
})

// 测试清理函数
test.afterEach(async ({ page }) => {
  // 截图用于调试失败的测试
  if (test.info().status !== test.info().expectedStatus) {
    await page.screenshot({
      path: `test-results/dashboard-failure-${Date.now()}.png`,
      fullPage: true
    })
  }

  // 清理可能的模态框
  await page.keyboard.press('Escape')
})