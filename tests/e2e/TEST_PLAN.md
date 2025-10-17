# Playwright E2E Test Strategy & Plan

## Table of Contents
1. [Overview](#overview)
2. [Objectives](#objectives)
3. [Scope](#scope)
4. [Environment Setup](#environment-setup)
5. [Test Data Prerequisites](#test-data-prerequisites)
6. [Authentication & Authorization](#authentication--authorization)
7. [Feature Test Suites](#feature-test-suites)
8. [Selector Catalogue](#selector-catalogue)
9. [Test Execution Strategy](#test-execution-strategy)
10. [Reporting & Debugging](#reporting--debugging)

---

## Overview

This document outlines the comprehensive end-to-end testing strategy for the Technical Support Equipment Management System using Playwright. The system is a React + TypeScript SPA built on Vite, with Tailwind CSS, shadcn/Radix UI components, TanStack Query for data fetching, and Supabase as the backend.

**Key Features:**
- Device Management (CRUD, search, filters, detail views)
- Inventory Management (stock tracking, adjustments)
- Outbound Management (outbound/return workflows with stock integration)
- Operations Dashboard (KPIs, charts, multi-tab analytics)
- Audit Log (search, filter, export)
- Knowledge Base (SOPs, guides, troubleshooting)

---

## Objectives

### Primary Goals
1. **Coverage**: Verify all critical user flows across 5 core feature areas
2. **Reliability**: Ensure data consistency across device/inventory/outbound operations
3. **Regression Prevention**: Catch breaking changes before deployment
4. **Documentation**: Maintain a living catalogue of selectors and flows

### Quality Gates
- **Smoke Tests**: 100% pass rate (core happy paths)
- **Feature Tests**: ≥95% pass rate with no P0/P1 defects
- **Data Integrity**: Zero negative stock, zero duplicate serial numbers, zero orphaned records
- **Performance**: Page load <3s, operation response <1s

---

## Scope

### In Scope
✅ Device Management: Create, search, filter, view details, edit, maintenance logs  
✅ Inventory Management: Stock adjustments, paper/ink/equipment tracking  
✅ Outbound Management: Create outbound, return workflow, duplicate prevention, stock validation  
✅ Operations Dashboard: KPIs, tab navigation, chart rendering  
✅ Audit Log: Search, filter, detail view, export  
✅ Knowledge Base: Navigation, content display (smoke test level)  
✅ Sidebar Navigation: Route transitions, device list  
✅ Positive Scenarios: Happy paths for all features  
✅ Negative Scenarios: Validation, error handling, duplicate prevention  
✅ Edge Cases: Empty states, boundary values, concurrent operations  

### Out of Scope
❌ Unit/Integration tests (covered separately)  
❌ Performance/Load testing (>100 concurrent users)  
❌ Mobile-specific gestures (PWA testing)  
❌ Visual regression testing (screenshots only for debugging)  
❌ Deep database migrations/schema validation  
❌ Third-party integrations (if any)  

---

## Environment Setup

### Prerequisites
```bash
# 1. Node.js & Dependencies
node --version  # v20+
npm install

# 2. Install Playwright browsers
npx playwright install chromium firefox

# 3. Environment Variables
cp .env.example .env
```

### Environment Configuration

#### 1. Remote Testing (Deployed Environment)
```env
# .env
PLAYWRIGHT_BASE_URL=https://your-app.vercel.app
VITE_SUPABASE_URL=https://sbp-a2e2xuudcasoe44t.supabase.opentrust.net
VITE_SUPABASE_ANON_KEY=eyJ0eXAi...your_key_here
```

#### 2. Local Testing (Development)
```env
# .env
# PLAYWRIGHT_BASE_URL not set (will use local dev server)
VITE_SUPABASE_URL=https://sbp-a2e2xuudcasoe44t.supabase.opentrust.net
VITE_SUPABASE_ANON_KEY=eyJ0eXAi...your_key_here
```

### Playwright Configuration
- **Base URL**: `process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173'`
- **Timeout**: 60s per test, 15s per expect
- **Retries**: 0 (fail fast to surface real issues)
- **Parallel**: `fullyParallel: false` (prevent data conflicts)
- **Browsers**: Chromium (primary), Firefox (cross-browser verification)
- **Video**: Retained on failure
- **Screenshots**: Only on failure
- **Trace**: On first retry

### Local Dev Server
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
npm run test:e2e

# Alternative: Tests auto-start server if PLAYWRIGHT_BASE_URL not set
```

### Remote Testing
```bash
# Set remote URL and run
PLAYWRIGHT_BASE_URL=https://your-app.vercel.app npm run test:e2e
```

### Storage State & Sessions
- **Current**: No authentication required (single-user admin mode)
- **Future**: When RBAC is enabled, use `storageState` for session persistence:
  ```typescript
  // tests/e2e/auth.setup.ts (future)
  await page.goto('/login')
  await page.fill('[name="username"]', 'admin')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  await page.context().storageState({ path: 'auth.json' })
  ```

---

## Test Data Prerequisites

### Database Seeding (Required)
Tests assume a baseline dataset in Supabase. Run seed scripts before first test execution:

```bash
# Check database connection
npm run diagnose

# Execute seed data (if available)
npm run db:exec -- supabase/seed.sql
```

### Required Seed Data

#### 1. Devices
- At least 3 devices with varied status: `运行中`, `维护`, `离线`
- Device with name containing `魔镜` (for search tests)
- Unique `serial` numbers (no duplicates)
- Example:
  ```json
  {
    "name": "魔镜6号-红色",
    "serial": "MM6-R-0001",
    "location": "杭州展厅",
    "owner": "张三",
    "status": "运行中"
  }
  ```

#### 2. Inventory
- Paper stock: `DNP-DS620-4x6` with qty ≥20
- Ink stock: C/M/Y/K with qty ≥10 each
- Equipment: routers, powerStrips, usbCables with qty ≥5

#### 3. Outbound Records
- Historical records for "Outbound History" tab tests
- Mix of `outbound` and `returned` statuses

#### 4. Audit Logs
- At least 10 audit entries with varied `action_type` and timestamps
- Searchable content (device names, operators)

### Test Data Isolation
- **Naming Convention**: Test-generated data uses `E2E` prefix (e.g., `E2E设备-{timestamp}`)
- **Cleanup**: Tests do NOT auto-delete data (manual cleanup or periodic wipe)
- **Conflicts**: Test suite designed to avoid conflicts via unique timestamps

---

## Authentication & Authorization

### Current State (v1.x)
- **Mode**: Single-user admin (no authentication)
- **Access**: All features accessible without login
- **RLS**: Row-Level Security disabled or using `anon` key with full permissions

### Test Implications
- No login step required in tests
- No `beforeEach` auth setup needed
- All routes directly accessible

### Future State (v2.x+)
When RBAC is implemented:
1. Add `tests/e2e/auth.setup.ts` to login and save `storageState`
2. Configure projects in `playwright.config.ts`:
   ```typescript
   projects: [
     { name: 'setup', testMatch: /auth.setup\.ts/ },
     { 
       name: 'chromium',
       use: { ...devices['Desktop Chrome'], storageState: 'auth.json' },
       dependencies: ['setup']
     }
   ]
   ```
3. Add role-specific test variants (admin, viewer, technician)

---

## Feature Test Suites

### 1. Device Management (`home.spec.ts`)

#### User Flows
1. **DEV-001**: Search devices by name/serial/location
2. **DEV-002**: Filter by status (运行中/维护/离线)
3. **DEV-003**: Filter by location
4. **DEV-004**: Toggle grid/list view
5. **DEV-005**: Create new device ✅ (implemented)
6. **DEV-006**: View device details ✅ (implemented)
7. **DEV-007**: Edit device information
8. **DEV-008**: Add maintenance record
9. **DEV-009**: View maintenance history
10. **DEV-010**: Device action buttons (借用/调拨)

#### Positive Scenarios
```typescript
// ✅ Implemented: DEV-005 + DEV-006
test('DEV-005 创建设备并查看详情', async ({ page }) => {
  // Creates device → verifies in list → navigates to detail → checks actions
})
```

**TODO**:
- DEV-001: Search functionality (partial impl in DEV-005)
- DEV-002-003: Filter interactions with KPI cards
- DEV-007: Edit device dialog
- DEV-008-009: Maintenance records CRUD

#### Negative Scenarios
- **DEV-NEG-001**: Create device with duplicate serial number (should fail)
- **DEV-NEG-002**: Create device with empty required fields (validation)
- **DEV-NEG-003**: Search with no results (empty state)
- **DEV-NEG-004**: Filter combinations yielding no results

#### Edge Cases
- Create device with special characters in name
- Search with very long query string
- Rapid filter toggling (debounce/throttle behavior)
- Device list with >100 items (pagination/virtualization)

#### Selectors
```typescript
// Toolbar
'[data-testid="toolbar-create-device"]'
'.device-grid'  // Grid view
'.device-list'  // List view (component: ListView)

// Create Dialog
'[data-testid="create-device-name"]'
'[data-testid="create-device-location"]'
'[data-testid="create-device-owner"]'
'[data-testid="create-device-submit"]'

// Device Cards
'article[aria-label*="设备"]'  // DeviceCard wrapper
'[role="heading"][level="1"]'  // Device detail title

// Search & Filters
'input[placeholder*="搜索设备名称、序列号、位置"]'
'[data-testid="filter-status"]'
'[data-testid="filter-location"]'

// Detail Actions
'button:has-text("借用")'
'button:has-text("调拨")'
'button:has-text("返回")'
```

---

### 2. Inventory Management (`inventory.spec.ts`)

#### User Flows
1. **STK-001**: Adjust paper stock ✅ (implemented)
2. **STK-002**: Adjust ink stock (C/M/Y/K)
3. **STK-003**: Adjust equipment stock (routers, cables, etc.)
4. **STK-004**: Save inventory changes
5. **STK-005**: View low stock warnings
6. **STK-006**: Bulk inventory import (if exists)

#### Positive Scenarios
```typescript
// ✅ Implemented: STK-001
test('STK-001/STK-020 调整库存并保存', async ({ page }) => {
  // Adjusts paper stock → saves → verifies toast → checks updated value
})
```

**TODO**:
- STK-002: Ink stock adjustments (CMYK)
- STK-003: Equipment stock (routers, powerStrips, etc.)
- STK-005: Low stock warning display

#### Negative Scenarios
- **STK-NEG-001**: Set negative stock value (should prevent or warn)
- **STK-NEG-002**: Set stock to non-numeric value (validation)
- **STK-NEG-003**: Attempt to save without changes (button disabled)
- **STK-NEG-004**: Concurrent stock updates (race condition)

#### Edge Cases
- Stock value at boundary: 0, MAX_INT
- Rapid increment/decrement clicks
- Navigation away with unsaved changes (dirty state warning)

#### Selectors
```typescript
// Inventory Inputs
'[data-testid="inventory-paper-DNP-DS620-4x6"]'
'[data-testid="inventory-ink-C"]'
'[data-testid="inventory-ink-M"]'
'[data-testid="inventory-ink-Y"]'
'[data-testid="inventory-ink-K"]'
'[data-testid="inventory-equipment-routers"]'

// Actions
'[data-testid="inventory-save"]'
'[data-testid="inventory-reset"]'

// Alerts
'.toast:has-text("库存已更新")'
'[data-testid="low-stock-warning"]'
```

---

### 3. Outbound Management (`outbound.spec.ts`)

#### User Flows
1. **LOAN-001**: Create outbound record ✅ (implemented)
2. **LOAN-002**: Prevent duplicate outbound for same device ✅ (implemented)
3. **RET-001**: Return outbound items ✅ (implemented)
4. **RET-002**: Verify stock restoration on return ✅ (implemented)
5. **LOAN-003**: View outbound history
6. **LOAN-004**: Filter outbound records (status, date range)
7. **LOAN-005**: Outbound with low stock warning

#### Positive Scenarios
```typescript
// ✅ Implemented: LOAN-001 + LOAN-002 + RET-001 + RET-002
test('LOAN-001/RET-001 出库 + 归还全链路', async ({ page }) => {
  // Creates device → outbounds with stock → attempts duplicate (fails) →
  // returns via history → verifies status update
})
```

**TODO**:
- LOAN-003: Outbound history tab interactions (filters, sorting)
- LOAN-004: Date range picker for filtering
- LOAN-005: Low stock warning during outbound creation

#### Negative Scenarios
- **LOAN-NEG-001**: Outbound non-existent device ✅ (device creation prerequisite)
- **LOAN-NEG-002**: Outbound with insufficient stock (should fail)
- **LOAN-NEG-003**: Return without selecting items (validation)
- **LOAN-NEG-004**: Return already returned record (idempotency)

#### Edge Cases
- Outbound with 0 quantity items
- Return with partial quantities (damage/loss)
- Concurrent outbound attempts for same device
- Outbound immediately after device creation (race condition)

#### Selectors
```typescript
// Outbound Form
'[data-testid="outbound-device-select"]'
'[role="option"][name*="..."]'  // Device dropdown options
'[data-testid="outbound-destination"]'
'[data-testid="outbound-operator"]'
'[data-testid="outbound-notes"]'

// Stock Items
'[data-testid="outbound-printer-select"]'
'[data-testid="outbound-paper-type"]'
'[data-testid="outbound-paper-qty"]'
'[data-testid="outbound-ink-C"]'  // etc. for M/Y/K
'[data-testid="outbound-routers"]'

// Actions
'[data-testid="outbound-submit"]'
'button:has-text("出库历史")'

// History Tab
'[data-testid="outbound-record-card"]'
'[data-testid="outbound-return-button"]'
'[data-testid="return-operator"]'
'[data-testid="return-paper-qty"]'
'[data-testid="return-submit"]'

// Status & Validation
'.toast:has-text("出库记录已创建")'
'.toast:has-text("归还记录已创建")'
'.toast:has-text("已有未归还的出库记录")'
'text=/已归还/'
'text=/归还操作员:/'
```

---

### 4. Operations Dashboard (`dashboard.spec.ts`)

#### User Flows
1. **DASH-001**: View KPI metrics (total assets, utilization, low stock, maintenance) ✅ (implemented)
2. **DASH-002**: Navigate between tabs (设备统计/库存管理/操作趋势/维护分析) ✅ (implemented)
3. **DASH-003**: Verify chart rendering ✅ (implemented)
4. **DASH-004**: Refresh dashboard data
5. **DASH-005**: Date range selector (if exists)
6. **DASH-006**: Export dashboard report

#### Positive Scenarios
```typescript
// ✅ Implemented: DASH-001 + DASH-002 + DASH-003
test('DASH-150 关键指标与标签页展示', async ({ page }) => {
  // Verifies 4 KPI cards visible → switches tabs → checks chart titles
})
```

**TODO**:
- DASH-004: Refresh button interaction
- DASH-005: Date range filtering
- DASH-006: Export functionality (CSV/PDF)

#### Negative Scenarios
- **DASH-NEG-001**: Dashboard with no data (empty state)
- **DASH-NEG-002**: Chart rendering with null/invalid data
- **DASH-NEG-003**: Rapid tab switching (debounce/race conditions)

#### Edge Cases
- Dashboard with >1000 data points (chart performance)
- Single-device scenario (edge case for percentages)
- Date range spanning multiple years

#### Selectors
```typescript
// KPI Cards
'[data-testid="dashboard-total-assets"]'
'[data-testid="dashboard-utilization"]'
'[data-testid="dashboard-low-stock"]'
'[data-testid="dashboard-maintenance"]'

// Tabs
'[role="tab"]:has-text("设备统计")'
'[role="tab"]:has-text("库存管理")'
'[role="tab"]:has-text("操作趋势")'
'[role="tab"]:has-text("维护分析")'

// Charts (by title text)
'text=/打印机状态分布/'
'text=/库存水平监控/'
'text=/操作趋势图/'
'text=/问题类型分布/'

// Actions
'[data-testid="dashboard-refresh"]'
'[data-testid="dashboard-export"]'
```

---

### 5. Audit Log (`audit.spec.ts`)

#### User Flows
1. **AUD-001**: View audit log table ✅ (implemented)
2. **AUD-002**: Search audit logs ✅ (implemented)
3. **AUD-003**: Filter by action type
4. **AUD-004**: Filter by date range
5. **AUD-005**: View audit detail ✅ (implemented)
6. **AUD-006**: Export audit logs ✅ (implemented)

#### Positive Scenarios
```typescript
// ✅ Implemented: AUD-001 + AUD-002 + AUD-005 + AUD-006
test('AUD-001 审计过滤与导出', async ({ page }) => {
  // Verifies table visible → searches (no results) → clears →
  // opens detail → exports CSV
})
```

**TODO**:
- AUD-003: Action type dropdown filter
- AUD-004: Date range picker

#### Negative Scenarios
- **AUD-NEG-001**: Search with no matches (empty state) ✅ (implemented)
- **AUD-NEG-002**: Export with >10,000 records (pagination/chunk)
- **AUD-NEG-003**: Filter combinations with zero results

#### Edge Cases
- Audit log with JSON/binary in details field
- Very long search query (>255 chars)
- Export immediately after page load (data not ready)

#### Selectors
```typescript
// Table & Search
'[data-testid="audit-table"]'
'[data-testid="audit-search-input"]'
'[data-testid="audit-filter-action"]'
'[data-testid="audit-filter-date"]'

// Actions
'[data-testid="audit-detail-button"]'
'[data-testid="audit-export"]'

// Detail Modal
'text=/审计详情/'
'[role="dialog"]'  // Detail dialog
'button:has-text("关闭")'  // Close button (or Escape key)

// Results
'text=/没有找到符合条件的记录/'  // Empty state
'.download'  // Download event
```

---

### 6. Knowledge Base (`knowledge.spec.ts`)

#### User Flows (Smoke Test Level)
1. **KB-001**: Navigate to announcements
2. **KB-002**: Navigate to software guide
3. **KB-003**: Navigate to printer guide
4. **KB-004**: Navigate to troubleshooting
5. **KB-005**: Navigate to FAQ
6. **KB-006**: Sidebar navigation between knowledge pages

#### Positive Scenarios
```typescript
// TODO: Implement smoke tests
test('KB-001 公告页面加载', async ({ page }) => {
  await page.goto('/knowledge?id=announcements')
  await expect(page.getByRole('heading', { name: '公告' })).toBeVisible()
})
```

#### Negative Scenarios
- **KB-NEG-001**: Navigate to non-existent page ID (should redirect)

#### Selectors
```typescript
// Sidebar Links (via Sidebar component)
'a[href="/knowledge?id=announcements"]'
'a[href="/knowledge?id=software-guide"]'
'a[href="/knowledge?id=printer-guide"]'
'a[href="/knowledge?id=troubleshooting"]'
'a[href="/knowledge?id=faq"]'

// Page Titles
'h1:has-text("公告")'
'h1:has-text("软件操作指南")'
'h1:has-text("打印机操作指南")'
'h1:has-text("故障处理与应急")'
'h1:has-text("常见问题")'
```

---

## Selector Catalogue

### Global Selectors

#### Navigation
```typescript
// Sidebar
'.sidebar'
'nav.space-y-1'
'button:has-text("首页")'
'button:has-text("统计看板")'
'button:has-text("库存管理")'
'button:has-text("出库管理")'
'button:has-text("审计日志")'

// Device List in Sidebar
'.device-list'
'button:has-text("新建设备")'  // Plus icon button
'button:has-text("{device.name}")'  // Dynamic device links

// Active State
'.bg-sidebar-primary'  // Active nav item
```

#### Toast Notifications
```typescript
'.sonner-toast'
'.toast:has-text("...")'  // Generic toast selector
'[data-sonner-toast]'  // Sonner-specific
```

#### Common UI Elements
```typescript
// Buttons
'button[type="submit"]'
'button:has-text("刷新")'
'button:has-text("导出")'
'button:has-text("取消")'
'button:has-text("确认")'

// Dialogs
'[role="dialog"]'
'[role="alertdialog"]'
'button[aria-label="Close"]'

// Empty States
'text=/没有找到符合条件/'
'text=/暂无数据/'
```

### Feature-Specific Selectors
See each feature section above for detailed selectors.

### Selector Best Practices
1. **Prefer `data-testid`**: Most stable, explicit test hooks
2. **Use semantic roles**: `[role="button"]`, `[role="heading"]` for accessibility
3. **Avoid CSS classes**: Too brittle, change frequently with styling
4. **Text content**: Use `text=` or `:has-text()` for user-facing labels (OK for stable text)
5. **Unique identifiers**: Combine selectors for uniqueness (e.g., `article[aria-label*="${deviceName}"]`)

---

## Test Execution Strategy

### Run Order & Dependencies

#### 1. Smoke Test Suite (Priority 1)
**Purpose**: Verify critical paths before full suite  
**Duration**: ~2-3 minutes  
**Tests**:
- `home.spec.ts` - Device creation & detail
- `inventory.spec.ts` - Stock adjustment
- `outbound.spec.ts` - Outbound/return flow
- `dashboard.spec.ts` - KPIs & tabs
- `audit.spec.ts` - Search & export

**Run**:
```bash
npm run test:e2e -- --grep "@smoke"  # If tests tagged
# OR run specific files:
npm run test:e2e -- home.spec.ts inventory.spec.ts
```

#### 2. Full Feature Suite (Priority 2)
**Purpose**: Comprehensive coverage  
**Duration**: ~10-15 minutes  
**Run**:
```bash
npm run test:e2e
```

#### 3. Cross-Browser Suite (Priority 3)
**Purpose**: Firefox compatibility  
**Duration**: ~20 minutes  
**Run**:
```bash
npm run test:e2e -- --project=firefox
```

### Suite Independence

Each spec file MUST be independently runnable:

```bash
# Run single suite
npm run test:e2e -- home.spec.ts
npm run test:e2e -- outbound.spec.ts
npm run test:e2e -- dashboard.spec.ts
```

**Independence Guidelines**:
- ✅ Each test creates its own data (unique device names via timestamp)
- ✅ Tests do NOT rely on data from other tests
- ✅ No shared state between tests (each test uses `test()` not `test.serial()`)
- ❌ Do NOT assume specific database state (beyond seed data)
- ❌ Do NOT hard-code IDs from other tests

### Parallel Execution

**Current**: `fullyParallel: false` (sequential within worker)  
**Reason**: Prevent race conditions on shared Supabase data

**Future Optimization** (when data volume grows):
- Enable `fullyParallel: true`
- Use worker-specific test users or namespaces
- Implement database transaction rollback per test (if Supabase supports)

### CI/CD Integration

#### GitHub Actions (Recommended)
```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - name: Run E2E Tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: ${{ secrets.STAGING_URL }}
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

#### Pre-Deployment Gate
```bash
# Deploy script
npm run test:e2e -- --project=chromium || exit 1
vercel deploy --prod
```

---

## Reporting & Debugging

### Built-in Reports

#### 1. HTML Report (Default)
```bash
npm run test:e2e
# Open report: npx playwright show-report
```

**Features**:
- Test results by file
- Step-by-step traces
- Screenshots on failure
- Video recordings
- Network logs

#### 2. List Reporter (Terminal)
Console output with pass/fail status in real-time.

### Failure Artifacts

**Location**: `playwright-report/` and `test-results/`

**Contents**:
- `screenshot.png` - Final state before failure
- `video.webm` - Full test recording
- `trace.zip` - Interactive trace (view with `npx playwright show-trace trace.zip`)

### Debugging Workflows

#### 1. Local Debugging (UI Mode)
```bash
npm run test:e2e:ui
```

**Features**:
- Step through tests
- Time travel debugging
- Pick selectors interactively
- Watch mode for TDD

#### 2. Headed Browser Debugging
```bash
npx playwright test --headed --debug
```

**Features**:
- Pause before actions
- Inspect elements
- Console logs visible

#### 3. Playwright Inspector
```bash
npx playwright test --debug home.spec.ts
```

**Features**:
- Playwright Inspector window
- Step-by-step execution
- Selector playground

#### 4. VSCode Extension
Install: "Playwright Test for VSCode"

**Features**:
- Run tests from editor
- Inline test status
- Debug from breakpoints

### Trace Viewer
```bash
npx playwright show-trace test-results/.../trace.zip
```

**Features**:
- DOM snapshot at each step
- Network waterfall
- Console logs
- Action timeline

### Common Issues & Solutions

#### Issue: "Timeout waiting for selector"
**Cause**: Element not rendered or selector wrong  
**Debug**:
1. Check `page.screenshot()` before failure
2. Use `page.locator(...).screenshot()` to isolate element
3. Verify selector in Playwright Inspector
4. Check if element is hidden/disabled (use `.isVisible()`)

#### Issue: "Element not clickable"
**Cause**: Overlapping elements, not in viewport  
**Debug**:
1. Use `.scrollIntoViewIfNeeded()`
2. Wait for animations: `await page.waitForTimeout(500)`
3. Check z-index conflicts in screenshot
4. Try `.click({ force: true })` for testing only

#### Issue: "Data not updated after operation"
**Cause**: Race condition, missing await, optimistic UI  
**Debug**:
1. Add explicit waits: `await page.waitForTimeout(1000)`
2. Wait for network idle: `await page.waitForLoadState('networkidle')`
3. Check if operation is async (verify toast appears)
4. Inspect database directly (Supabase dashboard)

#### Issue: "Test passes locally, fails in CI"
**Cause**: Timing differences, data state  
**Debug**:
1. Check CI artifacts (screenshots/videos)
2. Add longer timeouts in CI (slower machines)
3. Verify seed data in CI database
4. Check environment variables in CI

---

## Maintenance & Evolution

### When to Update This Plan
- ✅ New feature added (add suite section + selectors)
- ✅ Selector changed (update catalogue)
- ✅ Test fails consistently (update scenario or mark as known issue)
- ✅ Environment setup changes (update prerequisites)
- ✅ New edge case discovered (add to edge cases)

### Test Naming Convention
```typescript
// Format: {MODULE}-{NUMBER} {Description}
test('DEV-005 创建设备并查看详情', async ({ page }) => { ... })
test('LOAN-NEG-002 出库库存不足应失败', async ({ page }) => { ... })
```

**Prefixes**:
- `DEV` - Device Management
- `STK` - Inventory/Stock
- `LOAN` - Outbound/Loans
- `RET` - Returns
- `DASH` - Dashboard
- `AUD` - Audit Log
- `KB` - Knowledge Base
- `NEG` - Negative test
- `EDGE` - Edge case

### Review Cadence
- **Weekly**: Review failing tests, update selectors
- **Monthly**: Audit coverage gaps, add new scenarios
- **Quarterly**: Full regression suite run on all browsers
- **Pre-Release**: Smoke test + full suite + manual exploratory testing

---

## Appendix

### Useful Commands
```bash
# Run all tests
npm run test:e2e

# Run specific file
npm run test:e2e -- home.spec.ts

# Run with UI
npm run test:e2e:ui

# Run in headed mode
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Update snapshots (if using)
npx playwright test --update-snapshots

# Generate code (record interactions)
npx playwright codegen http://localhost:5173

# Show report
npx playwright show-report

# Show trace
npx playwright show-trace test-results/.../trace.zip

# Run on specific browser
npm run test:e2e -- --project=firefox
```

### Reference Documentation
- [Playwright Docs](https://playwright.dev/)
- [Project README](../../README.md)
- [Functional Test Requirements](../../FUNCTIONAL_TEST_REQUIREMENTS_V1.2.md)
- [Supabase Setup](../../SUPABASE_SETUP.md)

### Contact & Support
- **Test Issues**: Check this plan first, then open GitHub issue
- **Selector Questions**: Refer to Selector Catalogue section
- **CI Failures**: Check artifacts in Actions tab
- **Environment Setup**: See SUPABASE_SETUP.md

---

**Version**: 1.0  
**Last Updated**: 2025-10-17  
**Maintained By**: Development Team
