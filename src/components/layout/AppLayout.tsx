import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  desktopSidebar: React.ReactNode;
  mobileSidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function AppLayout({
  desktopSidebar,
  mobileSidebar,
  children,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const mobileSidebarNode = React.isValidElement(mobileSidebar)
    ? React.cloneElement(mobileSidebar, {
        onNavigate: () => setSidebarOpen(false),
      })
    : mobileSidebar;

  // Close sidebar when clicking outside or pressing Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border md:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground min-w-[44px] min-h-[44px] transition-colors"
            aria-label="打开菜单"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="font-semibold text-foreground">设备管理中心</div>
          <div className="w-[44px]" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="mx-auto max-w-screen-2xl md:flex md:h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block md:w-60 md:flex-shrink-0 md:border-r md:border-border">
          <div className="sticky top-0 h-screen overflow-y-auto">
            {desktopSidebar}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:overflow-y-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-background shadow-xl transition-transform">
            {/* Drawer Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-border">
              <h2 id="drawer-title" className="font-semibold text-foreground">
                设备管理中心
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground min-w-[44px] min-h-[44px] transition-colors"
                aria-label="关闭菜单"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="h-[calc(100%-3.5rem)] overflow-y-auto">
              {mobileSidebarNode}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
