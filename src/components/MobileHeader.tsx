import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, ArrowLeft, Bell, Search } from 'lucide-react';
import { Button } from './ui/button';

interface MobileHeaderProps {
  onMenuToggle?: () => void;
}

export function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // 获取当前页面标题
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return '设备管理';
      case '/dashboard':
        return '统计看板';
      case '/inventory':
        return '库存管理';
      case '/outbound':
        return '出库管理';
      case '/audit':
        return '审计日志';
      case '/device':
        return '设备详情';
      case '/knowledge':
        return '知识库';
      default:
        return '设备管理中心';
    }
  };

  // 判断是否显示返回按钮
  const showBackButton = () => {
    return location.pathname.includes('/device') || location.pathname.includes('/knowledge');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
    onMenuToggle?.();
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 bg-background border-b border-border">
        {/* 左侧：菜单按钮或返回按钮 */}
        <div className="flex items-center">
          {showBackButton() ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMenuToggle}
              className="p-2 -ml-2"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* 中间：页面标题 */}
        <h1 className="text-lg font-semibold text-foreground truncate">
          {getPageTitle()}
        </h1>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => {
              // TODO: 实现搜索功能
            }}
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 relative"
            onClick={() => {
              // TODO: 实现通知功能
            }}
          >
            <Bell className="w-5 h-5" />
            {/* 通知小红点 */}
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>
      </header>

      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />

          {/* 侧边栏 */}
          <div
            className={`fixed top-0 left-0 h-full w-80 bg-background border-r border-border z-50 transform transition-transform duration-300 lg:hidden ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">设备管理中心</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>

            {/* 这里可以放置侧边栏内容 */}
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                侧边栏内容开发中...
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
