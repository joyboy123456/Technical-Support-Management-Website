import { useState, useEffect } from 'react';

/**
 * 媒体查询 Hook
 * @param query - CSS 媒体查询字符串
 * @returns 是否匹配媒体查询
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // 服务端渲染时返回 false
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 现代浏览器使用 addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // 兼容旧浏览器
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

/**
 * 移动端检测 Hook
 * @returns 是否为移动端 (< 1024px)
 */
export function useMobile(): boolean {
  return useMediaQuery('(max-width: 1023px)');
}

/**
 * 平板检测 Hook
 * @returns 是否为平板 (768px - 1023px)
 */
export function useTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * 桌面端检测 Hook
 * @returns 是否为桌面端 (>= 1024px)
 */
export function useDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * 小屏手机检测 Hook
 * @returns 是否为小屏手机 (< 640px)
 */
export function useSmallMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

/**
 * 响应式断点 Hook
 * @returns 当前断点信息
 */
export function useBreakpoint() {
  const isSmallMobile = useSmallMobile();
  const isMobile = useMobile();
  const isTablet = useTablet();
  const isDesktop = useDesktop();

  return {
    isSmallMobile,
    isMobile,
    isTablet,
    isDesktop,
    // 便捷属性
    isMobileOrTablet: isMobile,
    isTabletOrDesktop: isTablet || isDesktop,
  };
}

/**
 * 触摸设备检测 Hook
 * @returns 是否为触摸设备
 */
export function useTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const checkTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    setIsTouchDevice(checkTouchDevice());
  }, []);

  return isTouchDevice;
}

/**
 * 设备方向检测 Hook
 * @returns 设备方向信息
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    updateOrientation();

    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
}
