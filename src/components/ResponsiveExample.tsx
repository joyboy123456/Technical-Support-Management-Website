import React from 'react';
import { useMobile, useBreakpoint, useTouchDevice, useOrientation } from '../hooks/useMediaQuery';
import { MOBILE_CLASSES, TOUCH_TARGET, MOBILE_LAYOUT } from '../constants/responsive';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Menu,
  Search,
  Bell,
  Settings,
  ChevronRight,
  Grid,
  List,
  Filter
} from 'lucide-react';

/**
 * 响应式组件示例
 * 展示移动端优化的最佳实践
 */
export function ResponsiveExample() {
  const isMobile = useMobile();
  const { isDesktop, isTablet } = useBreakpoint();
  const isTouchDevice = useTouchDevice();
  const { orientation, isPortrait } = useOrientation();

  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = React.useState(false);

  // 示例数据
  const items = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `设备 ${i + 1}`,
    status: ['在线', '离线', '维护'][i % 3],
    location: `位置 ${Math.floor(i / 3) + 1}`,
    lastUpdate: '2小时前',
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case '在线': return 'bg-green-100 text-green-800';
      case '离线': return 'bg-red-100 text-red-800';
      case '维护': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 移动端头部 */}
      {isMobile && (
        <header
          className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border"
          style={{ height: MOBILE_LAYOUT.headerHeight }}
        >
          <div className="flex items-center justify-between px-4 h-full">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${MOBILE_CLASSES.touchOptimized}`}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold truncate">响应式示例</h1>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${MOBILE_CLASSES.touchOptimized}`}
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 relative ${MOBILE_CLASSES.touchOptimized}`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* 主内容区 */}
      <main className={`${MOBILE_CLASSES.mobileContainer} ${MOBILE_CLASSES.mobilePadding} py-6`}>
        {/* 桌面端标题 */}
        {isDesktop && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">响应式组件示例</h1>
            <p className="text-muted-foreground">展示移动端优化的最佳实践</p>
          </div>
        )}

        {/* 设备信息展示 */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">设备信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">设备类型:</span>
                  <span className="ml-2 font-medium">
                    {isMobile ? '移动端' : '桌面端'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">触摸设备:</span>
                  <span className="ml-2 font-medium">
                    {isTouchDevice ? '是' : '否'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">屏幕方向:</span>
                  <span className="ml-2 font-medium">
                    {isPortrait ? '竖屏' : '横屏'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">断点:</span>
                  <span className="ml-2 font-medium">
                    {isMobile ? (isPortrait ? 'Mobile' : 'Mobile-L') :
                     isTablet ? 'Tablet' : 'Desktop'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 工具栏 */}
        <div className="mb-6">
          {isMobile ? (
            // 移动端简化工具栏
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 ${MOBILE_CLASSES.touchOptimized}`}
              >
                <Filter className="w-4 h-4" />
                筛选
              </Button>

              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="p-2"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="p-2"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            // 桌面端完整工具栏
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="搜索设备..."
                  className="px-3 py-2 border border-border rounded-lg bg-background w-64"
                />
                <select className="px-3 py-2 border border-border rounded-lg bg-background">
                  <option value="all">全部状态</option>
                  <option value="online">在线</option>
                  <option value="offline">离线</option>
                  <option value="maintenance">维护</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="p-2"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="p-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  设置
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 移动端筛选面板 */}
        {isMobile && showFilters && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="搜索设备..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                style={{ fontSize: '16px' }} // 防止 iOS 缩放
              />
              <select
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                style={{ fontSize: '16px' }}
              >
                <option value="all">全部状态</option>
                <option value="online">在线</option>
                <option value="offline">离线</option>
                <option value="maintenance">维护</option>
              </select>
            </div>
          </div>
        )}

        {/* 内容展示区 */}
        <div className={
          viewMode === 'grid'
            ? `grid gap-4 ${
                isMobile
                  ? 'grid-cols-1'
                  : isTablet
                    ? 'grid-cols-2'
                    : 'grid-cols-3 xl:grid-cols-4'
              }`
            : 'space-y-3'
        }>
          {items.map((item) => (
            <Card
              key={item.id}
              className={`transition-all duration-200 ${
                isTouchDevice
                  ? 'active:scale-98 active:bg-muted/50'
                  : 'hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <CardContent className={`p-4 ${viewMode === 'list' ? 'flex items-center justify-between' : ''}`}>
                <div className={viewMode === 'list' ? 'flex items-center gap-4' : 'space-y-3'}>
                  <div>
                    <h3 className="font-medium text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.location}</p>
                  </div>

                  <div className={viewMode === 'list' ? 'flex items-center gap-3' : 'flex items-center justify-between'}>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.lastUpdate}</span>
                  </div>
                </div>

                {viewMode === 'list' && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 加载更多按钮 */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            className={`${MOBILE_CLASSES.touchOptimized} ${isMobile ? 'w-full' : ''}`}
          >
            加载更多
          </Button>
        </div>
      </main>

      {/* 移动端底部导航 */}
      {isMobile && (
        <nav
          className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border"
          style={{
            height: MOBILE_LAYOUT.bottomNavHeight,
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <div className="flex items-center justify-around h-full px-4">
            {['首页', '统计', '库存', '设置'].map((label, index) => (
              <button
                key={label}
                className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 transition-colors ${MOBILE_CLASSES.touchOptimized}`}
              >
                <div className="w-6 h-6 bg-muted rounded mb-1" />
                <span className="text-xs text-muted-foreground truncate">{label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
