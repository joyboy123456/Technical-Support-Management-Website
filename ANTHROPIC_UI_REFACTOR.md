# Anthropic-like UI 重构文档

## 📋 概述

本次重构将"设备管理中心"页面改造为更克制、干净、信息密度合理、接近 Anthropic 风格的界面，同时保留所有现有业务逻辑。

**技术栈：** React + TypeScript + TailwindCSS + Radix UI

**重构日期：** 2025-10-08

---

## 🎨 设计原则

### 核心理念
- **极简主义：** 白底+1px 细边，弱化阴影，收敛色彩
- **信息密度：** 合理布局，避免视觉噪音
- **克制配色：** 颜色主要用于状态点和图表，不用于大面积背景
- **可访问性：** 高对比度、明显焦点环、完整 ARIA 标签

### 关键变更
1. **KPI 卡：** 彩底左边框 → 白底+细边+大数字
2. **状态显示：** Badge → 小圆点+灰色文本
3. **墨水条：** 彩色进度条 → 灰底+标签+<15%斜纹
4. **卡片阴影：** 重阴影 → 微妙阴影（hover 时）
5. **交互反馈：** 即时+微妙的过渡动画

---

## 📦 新增组件

### 1. Design Tokens (`src/styles/design-tokens.css`)

**核心变量：**
```css
--surface-1: #FFFFFF         /* 主表面 */
--surface-2: #F7F8FA         /* 次级背景 */
--border-subtle: #E7E9ED     /* 1px 边框 */
--text-1: #0F172A            /* 主文本 */
--text-2: #475569            /* 次文本 */
--status-positive: #16A34A   /* 运行中 */
--status-warning: #D97706    /* 维护/临期 */
--status-neutral: #94A3B8    /* 离线 */
--radius-lg: 8px             /* 卡片圆角 */
```

**使用方式：**
```tsx
// 直接使用 CSS 变量
<div style={{ color: 'var(--text-2)' }}>次要文本</div>

// 或使用 Tailwind 映射
<div className="text-text-2">次要文本</div>
```

---

### 2. StatusDot (`src/components/StatusDot.tsx`)

**功能：** 状态指示器，显示设备状态和上次刷新时间

**API：**
```tsx
interface StatusDotProps {
  status: '运行中' | '离线' | '维护';
  lastUpdate?: string;        // 相对时间文本
  showTime?: boolean;         // 是否显示时间
  className?: string;
}
```

**示例：**
```tsx
import { StatusDot, getRelativeTime } from './StatusDot';

<StatusDot
  status="运行中"
  lastUpdate={getRelativeTime(device.updatedAt)}
  showTime
/>
```

**设计要点：**
- 8px 小圆点，颜色由 `--status-*` 定义
- 文本统一使用 `--text-2` 灰色
- 时间戳用 `--text-3` 更浅灰色

---

### 3. KpiCard (`src/components/KpiCard.tsx`)

**功能：** KPI 统计卡片，可点击触发筛选

**API：**
```tsx
interface KpiCardProps {
  label: string;
  value: number;
  filterKey: 'all' | Device['status'];
  onClick?: (filterKey: string) => void;
  isActive?: boolean;
  trend?: number;             // 可选趋势百分比
  className?: string;
}
```

**示例：**
```tsx
import { KpiCard, KpiCardGroup } from './KpiCard';

<KpiCardGroup>
  <KpiCard
    label="设备总数"
    value={42}
    filterKey="all"
    onClick={handleFilter}
    isActive={currentFilter === 'all'}
  />
</KpiCardGroup>
```

**设计要点：**
- 白底 + 1px 细边框（无彩底）
- 数值 32-36px，标签 12-13px
- 悬浮微妙上移 1px
- 选中状态边框变深色

---

### 4. DeviceCard (`src/components/DeviceCard.tsx`)

**功能：** 设备卡片，展示设备详细信息

**API：**
```tsx
interface DeviceCardProps {
  device: Device;
  onClick?: (deviceId: string) => void;
  onMarkMaintenance?: (deviceId: string) => void;
  className?: string;
}
```

**示例：**
```tsx
<DeviceCard
  device={device}
  onClick={handleClick}
  onMarkMaintenance={handleMaintenance}
/>
```

**设计要点：**
- **头部：** 设备名 + StatusDot + 上次刷新
- **信息区：** 两列对齐（位置｜负责人｜型号｜下次维护）
- **墨水条：**
  - CMYK 四色水平条
  - 标签在上方
  - <15% 添加 `.low-ink-stripes` 斜纹
  - hover 显示百分比 tooltip
- **操作：** hover 显示"维护/更多"按钮

---

### 5. TopToolbar (`src/components/TopToolbar.tsx`)

**功能：** 顶部工具条，统一操作按钮

**API：**
```tsx
interface TopToolbarProps {
  onRefresh?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onCreateDevice?: () => void;
  isRefreshing?: boolean;
  className?: string;
}
```

**示例：**
```tsx
<TopToolbar
  onRefresh={handleRefresh}
  onCreateDevice={handleCreate}
  isRefreshing={loading}
/>
```

**设计要点：**
- 左侧：刷新、导入、导出（灰度按钮）
- 右侧：新建设备（主按钮）
- 浅灰背景 `--surface-2`
- 统一圆角 8px

---

### 6. Filters (`src/components/Filters.tsx`)

**功能：** 筛选区，支持 Chips 和保存视图

**API：**
```tsx
interface FilterState {
  search: string;
  status: string;
  location: string;
  sortBy: string;
}

interface FiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  locations: string[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  className?: string;
}
```

**示例：**
```tsx
<Filters
  filters={filterState}
  onFiltersChange={handleChange}
  onClearFilters={handleClear}
  locations={['北京', '上海']}
  viewMode="grid"
  onViewModeChange={setViewMode}
/>
```

**设计要点：**
- 搜索输入 + 高级筛选面板
- 活跃筛选显示为可关闭 Chips
- "保存视图"功能存储到 localStorage
- 网格/列表视图切换器
- 已保存视图快速应用

---

### 7. ListView (`src/components/ListView.tsx`)

**功能：** 列表视图，适合大量设备浏览

**API：**
```tsx
interface ListViewProps {
  devices: Device[];
  onRowClick?: (deviceId: string) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (field: string) => void;
  className?: string;
}
```

**示例：**
```tsx
<ListView
  devices={filteredDevices}
  onRowClick={handleClick}
  sortBy="name"
  sortDirection="asc"
  onSortChange={handleSort}
/>
```

**设计要点：**
- 粘性表头（sticky header）
- 列排序（点击表头切换）
- 列显示控制（可隐藏列）
- CMYK 用小色点 + 数字表示
- 行悬浮高亮

---

## 🔄 迁移步骤

### Step 1: 更新 Tailwind 配置

已自动映射 Design Tokens 到 `tailwind.config.js`：

```js
// 现在可以使用
<div className="bg-surface-1 border-border-subtle rounded-lg">
```

### Step 2: 引入 Design Tokens

在 `src/styles/globals.css` 顶部已添加：

```css
@import './design-tokens.css';
```

### Step 3: 替换旧 HomePage

**选项 A：直接替换（推荐）**
```bash
# 备份旧文件
mv src/components/HomePage.tsx src/components/HomePage.old.tsx

# 使用新文件
mv src/components/HomePageNew.tsx src/components/HomePage.tsx
```

**选项 B：逐步迁移**
1. 先引入单个组件测试
2. 在 `HomePage.tsx` 中逐步替换旧组件
3. 确认无问题后删除旧代码

### Step 4: 运行项目

```bash
# 安装依赖（如果需要）
npm install

# 启动开发服务器
npm run dev

# 或
pnpm dev
```

浏览器打开 `http://localhost:3000` 查看效果。

---

## 🎯 验收标准

### ✅ 视觉检查
- [ ] KPI 卡为白底+细边，无彩色左边框
- [ ] 状态以小圆点+灰色文本显示
- [ ] 卡片圆角统一 8px，边框 #E7E9ED
- [ ] 墨水条 <15% 显示斜纹效果
- [ ] 常态无大阴影，hover 才显示

### ✅ 交互检查
- [ ] 点击 KPI 卡可筛选对应状态
- [ ] 筛选条件显示为可关闭 Chips
- [ ] 可保存自定义视图到 localStorage
- [ ] 网格/列表视图切换流畅
- [ ] 列表视图列排序正常工作

### ✅ 可访问性检查
- [ ] 所有交互元素有明显焦点环（2px 深色）
- [ ] 主文本对比度 ≥7:1
- [ ] 次文本对比度 ≥4.5:1
- [ ] 图标有 `aria-label`
- [ ] 键盘可完全操作

### ✅ 响应式检查
- [ ] 移动端（<640px）布局正常
- [ ] 平板（640-1024px）布局正常
- [ ] 桌面端（>1024px）布局正常
- [ ] 容器最大宽度 1440px

---

## 🔧 自定义与扩展

### 修改 Design Tokens

编辑 `src/styles/design-tokens.css`：

```css
:root {
  /* 例如：修改主文本颜色 */
  --text-1: #000000;  /* 改为纯黑 */

  /* 修改状态色 */
  --status-positive: #10B981;  /* 改为更亮的绿色 */
}
```

### 添加新的 KPI 卡

```tsx
<KpiCard
  label="待维护"
  value={stats.pendingMaintenance}
  filterKey="pending"
  onClick={handleFilter}
/>
```

### 自定义墨水条颜色

在 `design-tokens.css` 中修改：

```css
--ink-cyan: #00B8D4;
--ink-magenta: #E91E63;
--ink-yellow: #FFC107;
--ink-black: #212121;
```

---

## 🐛 常见问题

### Q1: 组件样式不生效？

**A:** 确保已引入 `design-tokens.css`：
```tsx
// 在 main.tsx 或 App.tsx 中
import './styles/globals.css';
```

### Q2: TypeScript 类型错误？

**A:** 确认所有新组件都在同一目录，并正确导入类型：
```tsx
import { Device } from '../data/devices';
```

### Q3: Tooltip 不显示？

**A:** 确保安装了 `@radix-ui/react-tooltip`：
```bash
npm install @radix-ui/react-tooltip
```

### Q4: 保存视图不工作？

**A:** 检查 localStorage 权限，确保浏览器未禁用：
```tsx
// 测试
localStorage.setItem('test', '1');
console.log(localStorage.getItem('test')); // 应输出 '1'
```

---

## 📊 性能优化

### 已实现
1. **骨架屏：** 加载时显示 `DeviceCardSkeleton`
2. **懒加载动画：** 卡片逐个淡入（30ms 延迟）
3. **React.useMemo：** 筛选和统计数据缓存
4. **事件防抖：** 搜索输入已优化

### 待实现（可选）
1. **虚拟滚动：** 当设备 >200 时，使用 `react-window`
2. **图片懒加载：** 使用 `loading="lazy"`
3. **分页：** 替代虚拟滚动的轻量方案

---

## 📝 代码规范

### KISS（简单至上）
- 避免过度抽象
- 优先使用内联样式（Design Tokens）
- 组件单一职责

### YAGNI（精益求精）
- 只实现当前需要的功能
- 删除未使用的代码
- 保持依赖最小化

### DRY（杜绝重复）
- 使用 Design Tokens 统一样式
- 提取重复逻辑为 hooks
- 组件复用优先

---

## 🎓 学习资源

- [Anthropic 官网](https://www.anthropic.com) - 设计灵感来源
- [Tailwind CSS](https://tailwindcss.com) - 工具类文档
- [Radix UI](https://www.radix-ui.com) - 无样式组件库
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - 可访问性指南

---

## 📞 支持

如有问题，请参考：
1. 本文档"常见问题"章节
2. 组件源码中的 JSDoc 注释
3. TypeScript 类型定义

---

**重构完成！** 🎉

浮浮酱祝主人使用愉快喵～ ฅ'ω'ฅ
