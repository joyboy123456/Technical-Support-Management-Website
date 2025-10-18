import { test, expect } from '@playwright/test'

test.describe('设备管理主页', () => {
  test('DEV-005 创建设备并查看详情', async ({ page }) => {
    const deviceName = `E2E设备-${Date.now()}`

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 基础搜索功能验证
    const searchBox = page.getByPlaceholder('搜索设备名称、序列号、位置...')
    await searchBox.fill('魔镜')
    await expect(page.getByRole('article').first()).toBeVisible()
    await searchBox.fill('')

    // 打开创建设备弹窗
    await page.getByTestId('toolbar-create-device').click()
    await page.getByTestId('create-device-name').fill(deviceName)
    await page.getByTestId('create-device-location').fill('E2E测试仓库')
    await page.getByTestId('create-device-owner').fill('自动化用户')
    const submitButton = page.getByTestId('create-device-submit')
    await submitButton.scrollIntoViewIfNeeded()
    await submitButton.evaluate((btn: HTMLElement) => btn.click())

    await expect(page.getByText('设备创建成功')).toBeVisible()
    await page.getByRole('button', { name: '刷新' }).click()
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 新设备卡片应出现在列表
    await searchBox.fill(deviceName)
    const deviceCard = page.getByRole('article', { name: new RegExp(`设备 ${deviceName}`) })
    await expect(deviceCard).toBeVisible()

    // 进入详情页
    await deviceCard.click()
    await expect(page).toHaveURL(/\/device\?id=/)
    await expect(page.getByRole('heading', { level: 1, name: deviceName })).toBeVisible()

    // 快捷操作按钮可见
    await expect(page.getByRole('button', { name: '借用' })).toBeVisible()
    await expect(page.getByRole('button', { name: '调拨' })).toBeVisible()

    // 返回列表
    await page.getByRole('button', { name: '返回' }).click()
    await expect(page).toHaveURL('/')

    const searchAfter = page.getByPlaceholder('搜索设备名称、序列号、位置...')
    await searchAfter.fill(deviceName)
    const createdCard = page.getByRole('article', { name: new RegExp(`设备 ${deviceName}`) })
    await expect(createdCard).toBeVisible()

    await createdCard.hover()
    await createdCard.getByTestId('device-card-delete').click()
    await page.getByTestId('device-delete-confirm').click()
    await expect(page.getByText('设备已删除')).toBeVisible()
    await expect(page.getByRole('article', { name: new RegExp(`设备 ${deviceName}`) })).toHaveCount(0)
  })
})
