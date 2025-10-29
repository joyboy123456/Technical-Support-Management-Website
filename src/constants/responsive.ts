/**
 * 响应式设计常量配置
 * 统一管理断点、尺寸和移动端优化参数
 */

// 断点定义 (与 Tailwind CSS 保持一致)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// 媒体查询字符串
export const MEDIA_QUERIES = {
  smallMobile: `(max-width: ${BREAKPOINTS.sm - 1}px)`,
  mobile: `(max-width: ${BREAKPOINTS.lg - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.lg}px)`,
  largeDesktop: `(min-width: ${BREAKPOINTS.xl}px)`,
} as const;

// 移动端触控优化
export const TOUCH_TARGET = {
  minSize: 44, // iOS 推荐最小触控尺寸
  recommendedSize: 48, // Android 推荐尺寸
  spacing: 8, // 触控目标之间的最小间距
} as const;

// 移动端字体优化
export const MOBILE_TYPOGRAPHY = {
  minFontSize: 16, // 防止 iOS 自动缩放的最小字体
  baseLineHeight: 1.5,
  headingLineHeight: 1.2,
} as const;

// 移动端布局参数
export const MOBILE_LAYOUT = {
  headerHeight: 56, // 移动端头部高度
  bottomNavHeight: 80, // 底部导航高度
  safeAreaPadding: 'max(8px, env(safe-area-inset-bottom))', // 安全区域适配
  maxContentWidth: '100vw',
  sidebarWidth: 320, // 移动端侧边栏宽度
} as const;

// 桌面端布局参数
export const DESKTOP_LAYOUT = {
  sidebarWidth: 240, // 桌面端侧边栏宽度
  headerHeight: 64,
  maxContentWidth: '1400px',
} as const;

// 动画参数
export const ANIMATION = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// 移动端手势参数
export const GESTURE = {
  swipeThreshold: 50, // 滑动手势阈值
  tapDelay: 300, // 点击延迟
  longPressDelay: 500, // 长按延迟
} as const;

// Z-index 层级管理
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// 移动端性能优化参数
export const PERFORMANCE = {
  virtualScrollThreshold: 100, // 虚拟滚动阈值
  imageLoadingThreshold: 2, // 图片懒加载阈值
  debounceDelay: 300, // 防抖延迟
  throttleDelay: 100, // 节流延迟
} as const;

// 移动端特定的 CSS 类名
export const MOBILE_CLASSES = {
  hideOnMobile: 'lg:block hidden',
  showOnMobile: 'lg:hidden block',
  mobileOnly: 'lg:hidden',
  desktopOnly: 'hidden lg:block',
  touchOptimized: 'min-h-[44px] min-w-[44px]',
  mobileContainer: 'px-4 lg:px-6',
  mobilePadding: 'pb-20 lg:pb-6', // 为底部导航留出空间
} as const;

// 设备类型判断函数
export const isSmallMobile = (width: number) => width < BREAKPOINTS.sm;
export const isMobile = (width: number) => width < BREAKPOINTS.lg;
export const isTablet = (width: number) => width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
export const isDesktop = (width: number) => width >= BREAKPOINTS.lg;

// 获取当前设备类型
export const getDeviceType = (width: number): 'small-mobile' | 'mobile' | 'tablet' | 'desktop' => {
  if (isSmallMobile(width)) return 'small-mobile';
  if (isMobile(width)) return 'mobile';
  if (isTablet(width)) return 'tablet';
  return 'desktop';
};

// 移动端优化的网格配置
export const GRID_CONFIGS = {
  mobile: {
    kpiCards: 'grid-cols-2',
    deviceCards: 'grid-cols-1',
    imageGallery: 'grid-cols-2',
  },
  tablet: {
    kpiCards: 'grid-cols-4',
    deviceCards: 'grid-cols-2',
    imageGallery: 'grid-cols-3',
  },
  desktop: {
    kpiCards: 'grid-cols-4',
    deviceCards: 'grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
    imageGallery: 'grid-cols-3 xl:grid-cols-4',
  },
} as const;
