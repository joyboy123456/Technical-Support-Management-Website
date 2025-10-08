# iOS 风格设计系统规则

> 基于 Figma 文件: `pLarcIzb1aIELsn6Kwg8nw` (技术支持设备管理网站)
> 生成时间: 2025-10-07

## 1. 设计令牌 (Design Tokens)

### 1.1 颜色系统

#### 语义化颜色
```css
/* 品牌色 - iOS 蓝 */
--primary: #007AFF;
--primary-hover: #0051D5;
--primary-light: #E5F2FF;

/* 状态色 - 从 Figma 观察到 */
--status-success: #34C759;  /* 绿色标签 - 运行中 */
--status-warning: #FF9500;  /* 橙色标签 - 维护 */
--status-inactive: #8E8E93; /* 灰色标签 - 离线 */

/* 中性色阶 - iOS 风格 */
--gray-50: #F9F9F9;   /* 背景 */
--gray-100: #F2F2F7;  /* 卡片背景 */
--gray-200: #E5E5EA;  /* 分隔线 */
--gray-300: #D1D1D6;  /* 边框 */
--gray-400: #C7C7CC;  /* 占位符 */
--gray-500: #AEAEB2;  /* 辅助文字 */
--gray-600: #8E8E93;  /* 次要文字 */
--gray-900: #1C1C1E;  /* 主要文字 */

/* 墨水颜色 - 从 Figma 卡片观察 */
--ink-cyan: #00C7BE;
--ink-magenta: #FF2D55;
--ink-yellow: #FFCC00;
--ink-black: #000000;
```

### 1.2 字体系统

#### 字体族
```css
--font-system: -apple-system, BlinkMacSystemFont, "SF Pro Text", 
               "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: "SF Mono", ui-monospace, Menlo, Monaco, monospace;
```

#### 字号层级 (iOS Human Interface Guidelines)
```css
--text-largeTitle: 34px;  /* 大标题 */
--text-title1: 28px;      /* 标题1 */
--text-title2: 22px;      /* 标题2 - 页面标题 */
--text-title3: 20px;      /* 标题3 */
--text-headline: 17px;    /* 强调文本 */
--text-body: 17px;        /* 正文 */
--text-callout: 16px;     /* 次要正文 */
--text-subheadline: 15px; /* 小标题 */
--text-footnote: 13px;    /* 脚注 */
--text-caption1: 12px;    /* 说明文字 */
--text-caption2: 11px;    /* 极小文字 */

/* 行高 */
--leading-tight: 1.2;
--leading-normal: 1.4;
--leading-relaxed: 1.5;
```

#### 字重
```css
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 1.3 间距系统 (8px 网格)

```css
--spacing-1: 4px;   /* 0.5 单位 */
--spacing-2: 8px;   /* 1 单位 - 基准 */
--spacing-3: 12px;  /* 1.5 单位 */
--spacing-4: 16px;  /* 2 单位 */
--spacing-5: 20px;  /* 2.5 单位 */
--spacing-6: 24px;  /* 3 单位 */
--spacing-8: 32px;  /* 4 单位 */
--spacing-10: 40px; /* 5 单位 */
--spacing-12: 48px; /* 6 单位 */
--spacing-16: 64px; /* 8 单位 */
```

### 1.4 圆角系统

```css
--radius-xs: 4px;   /* 极小元素 */
--radius-sm: 8px;   /* 标签、徽章 */
--radius-md: 12px;  /* 卡片、输入框 */
--radius-lg: 16px;  /* 大卡片 */
--radius-xl: 20px;  /* 特大卡片 */
--radius-full: 9999px; /* 圆形 */
```

### 1.5 阴影系统 (轻量层级)

```css
/* iOS 风格轻量阴影 */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.12);

/* 毛玻璃效果 */
--backdrop-blur-sm: blur(8px);
--backdrop-blur-md: blur(16px);
--backdrop-blur-lg: blur(24px);
```

### 1.6 动效参数

```css
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;

--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

---

## 2. 组件规范

### 2.1 设备卡片 (Device Card)

**Figma 参考**: Node `0:6` - 设备列表网格

#### 布局规范
```
尺寸: 最小宽度 280px, 自适应
间距: 外边距 16px, 内边距 16px
圆角: 12px
阴影: shadow-sm (悬停 shadow-md)
背景: white / gray-100
```

#### 内容结构
```
1. 封面图 (可选)
   - 高度: 160px
   - 圆角: 顶部 12px
   - 对象适配: cover
   - 悬停: scale(1.05), 200ms

2. 内容区
   - 顶部: 标题 + 状态标签
   - 中部: 信息列表 (4-6 行)
   - 底部: 墨水余量指示器

3. 文字层级
   - 标题: text-headline, font-semibold
   - 标签: text-footnote
   - 信息项: text-callout
```

#### 状态标签样式
```css
/* 运行中 - 绿色 */
background: var(--status-success);
color: white;
padding: 4px 12px;
border-radius: 8px;
font-size: 13px;
font-weight: 500;

/* 维护 - 橙色 */
background: var(--status-warning);
/* ... 同上 */

/* 离线 - 灰色 */
background: var(--status-inactive);
/* ... 同上 */
```

#### 墨水余量指示器
```css
/* 容器 */
height: 6px;
background: var(--gray-200);
border-radius: var(--radius-full);
overflow: hidden;

/* 进度条 */
height: 100%;
border-radius: inherit;
transition: width 200ms ease-out;

/* 颜色映射 */
C (青色): var(--ink-cyan)
M (品红): var(--ink-magenta)
Y (黄色): var(--ink-yellow)
K (黑色): var(--ink-black)

/* 状态色 */
> 50%: green-500
20-50%: yellow-500
< 20%: red-500
```

### 2.2 表单输入 (Form Input)

#### 尺寸规范
```
高度: 44px (符合 iOS 最小触控尺寸)
内边距: 12px 16px
圆角: 12px
边框: 1px solid var(--gray-300)
```

#### 状态样式
```css
/* 默认 */
border-color: var(--gray-300);
background: white;

/* 聚焦 */
border-color: var(--primary);
box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
outline: none;

/* 错误 */
border-color: var(--status-error);
box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.1);

/* 禁用 */
background: var(--gray-50);
color: var(--gray-400);
cursor: not-allowed;
```

### 2.3 按钮 (Button)

#### 主要按钮
```css
background: var(--primary);
color: white;
padding: 12px 24px;
border-radius: 10px;
font-size: 17px;
font-weight: 600;
min-height: 44px;
transition: all 150ms ease;

/* 悬停 */
background: var(--primary-hover);
transform: translateY(-1px);
box-shadow: var(--shadow-md);

/* 激活 */
transform: scale(0.98);
```

#### 次要按钮
```css
background: var(--gray-100);
color: var(--gray-900);
border: 1px solid var(--gray-300);
/* ... 其他同主按钮 */
```

### 2.4 图片上传组件

#### 上传区域
```css
border: 2px dashed var(--gray-300);
border-radius: 12px;
background: var(--gray-50);
padding: 32px;
min-height: 200px;
cursor: pointer;
transition: all 200ms;

/* 悬停 */
border-color: var(--primary);
background: var(--primary-light);

/* 拖拽中 */
border-color: var(--primary);
background: var(--primary-light);
transform: scale(1.02);
```

#### 图片预览网格
```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
gap: 12px;

/* 预览项 */
aspect-ratio: 1;
border-radius: 8px;
overflow: hidden;
position: relative;

/* 删除按钮 */
position: absolute;
top: 8px;
right: 8px;
width: 24px;
height: 24px;
border-radius: 50%;
background: rgba(0, 0, 0, 0.6);
backdrop-filter: blur(8px);
```

---

## 3. 页面布局规范

### 3.1 设备列表页

```
容器最大宽度: 1280px
内边距: 24px
网格: 4 列 (响应式: lg:4, md:3, sm:2, xs:1)
网格间距: 16px
```

### 3.2 设备详情页

```
容器最大宽度: 1200px
布局: 2/3 主内容 + 1/3 侧边栏
间距: 24px
```

---

## 4. 响应式断点

```css
--breakpoint-sm: 640px;   /* 手机 */
--breakpoint-md: 768px;   /* 平板 */
--breakpoint-lg: 1024px;  /* 笔记本 */
--breakpoint-xl: 1280px;  /* 桌面 */
--breakpoint-2xl: 1536px; /* 大屏 */
```

---

## 5. 可访问性规范

### 触控尺寸
- 所有交互元素最小 44×44px
- 表单输入高度 44px
- 按钮最小高度 44px

### 颜色对比度
- 正文文字: 4.5:1
- 大文字: 3:1
- 交互元素: 3:1

### 焦点指示
- 所有可聚焦元素必须有明显的焦点环
- 焦点环颜色: var(--primary)
- 焦点环宽度: 3px
- 焦点环偏移: 2px

---

## 6. Figma 节点映射

| 组件 | Figma Node ID | 文件路径 |
|------|---------------|----------|
| 设备列表主页 | 0:6 | src/components/HomePage.tsx |
| 设备卡片 | - | src/components/HomePage.tsx (Card) |
| 状态标签 | - | src/components/ui/badge.tsx |
| 表单输入 | - | src/components/ui/input.tsx |
| 按钮 | - | src/components/ui/button.tsx |

---

## 7. 实施检查清单

- [ ] 更新 CSS 变量为 iOS 风格令牌
- [ ] 调整卡片圆角为 12px
- [ ] 优化阴影为轻量级
- [ ] 确保所有按钮/输入高度 ≥44px
- [ ] 添加毛玻璃效果到模态框/悬浮层
- [ ] 优化动画时长为 150-300ms
- [ ] 统一间距为 8px 网格
- [ ] 调整字体为系统字体栈
- [ ] 添加图片上传/预览功能
- [ ] 实现图片排序/删除交互

---

> **注意**: 所有样式必须可追溯到本文档的设计令牌或 Figma 节点，禁止使用任意值。
