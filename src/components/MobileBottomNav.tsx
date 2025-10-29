import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  BarChart3,
  Package,
  PackageMinus,
  FileSearch
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: '首页',
    path: '/',
    icon: <Home className="w-5 h-5" />
  },
  {
    id: 'dashboard',
    label: '统计',
    path: '/dashboard',
    icon: <BarChart3 className="w-5 h-5" />
  },
  {
    id: 'inventory',
    label: '库存',
    path: '/inventory',
    icon: <Package className="w-5 h-5" />
  },
  {
    id: 'outbound',
    label: '出库',
    path: '/outbound',
    icon: <PackageMinus className="w-5 h-5" />
  },
  {
    id: 'audit',
    label: '审计',
    path: '/audit',
    icon: <FileSearch className="w-5 h-5" />
  }
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="bg-background border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.path)}
            className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-colors duration-200 ${
              isActive(item.path)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`mb-1 transition-transform duration-200 ${
              isActive(item.path) ? 'scale-110' : 'scale-100'
            }`}>
              {item.icon}
            </div>
            <span className={`text-xs font-medium truncate ${
              isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {item.label}
            </span>
            {/* 活跃状态指示器 */}
            {isActive(item.path) && (
              <div className="absolute bottom-0 w-6 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
