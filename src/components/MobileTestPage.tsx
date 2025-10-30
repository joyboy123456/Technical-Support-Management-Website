import React, { useState } from 'react';
import { useMobile, useBreakpoint, useTouchDevice, useOrientation } from '../hooks/useMediaQuery';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import {
  Smartphone,
  Tablet,
  Monitor,
  Touch,
  RotateCcw,
  Wifi,
  Battery,
  Signal,
  Camera,
  Mic,
  MapPin,
  Bell,
  Settings,
  Search,
  Menu,
  Home,
  User,
  Heart,
  Star,
  Share,
  Download,
  Upload,
  Edit,
  Trash2,
  Plus,
  Minus,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';

/**
 * 移动端测试页面
 * 用于测试各种移动端组件和交互
 */
export function MobileTestPage() {
  const isMobile = useMobile();
  const { isSmallMobile, isTablet, isDesktop } = useBreakpoint();
  const isTouchDevice = useTouchDevice();
  const { orientation, isPortrait } = useOrientation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    notifications: true,
    volume: [50],
    rating: 0
  });

  const [activeTab, setActiveTab] = useState('components');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const testButtons = [
    { icon: <Home className="w-4 h-4" />, label: '首页', variant: 'default' as const },
    { icon: <Search className="w-4 h-4" />, label: '搜索', variant: 'secondary' as const },
    { icon: <Bell className="w-4 h-4" />, label: '通知', variant: 'outline' as const },
    { icon: <Settings className="w-4 h-4" />, label: '设置', variant: 'ghost' as const },
    { icon: <User className="w-4 h-4" />, label: '用户', variant: 'destructive' as const }
  ];

  const actionButtons = [
    { icon: <Plus className="w-4 h-4" />, label: '添加' },
    { icon: <Edit className="w-4 h-4" />, label: '编辑' },
    { icon: <Share className="w-4 h-4" />, label: '分享' },
    { icon: <Download className="w-4 h-4" />, label: '下载' },
    { icon: <Trash2 className="w-4 h-4" />, label: '删除' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 移动端头部 */}
      {isMobile && (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold">移动端测试</h1>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="p-2">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* 主内容 */}
      <main className="px-4 py-6 pb-20 lg:pb-6">
        {/* 桌面端标题 */}
        {!isMobile && (
