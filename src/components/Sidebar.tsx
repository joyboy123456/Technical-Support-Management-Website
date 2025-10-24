import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Settings,
  HelpCircle,
  AlertTriangle,
  Printer,
  Megaphone,
  Package,
  Home,
  BarChart3,
  FileSearch,
  Wrench,
  Plus,
  Edit2,
  Check,
  X,
  PackageMinus
} from 'lucide-react';
import { sidebarItems, getDevices, createDevice, updateDevice, Device } from '../data/devices';
import { CreateDeviceDialog } from './CreateDeviceDialog';

interface SidebarProps {
  currentPage?: string;
  onPageChange?: (pageId: string, type: 'page' | 'device') => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    'device-list': true
  });
  const [devices, setDevices] = React.useState<any[]>([]);
  const [editingDeviceId, setEditingDeviceId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  // 扩展的导航项目（包含新功能）
  const extendedSidebarItems = [
    { id: 'home', type: 'page', title: '首页', path: '/' },
    { id: 'dashboard', type: 'page', title: '统计看板', path: '/dashboard' },
    { id: 'inventory-management', type: 'page', title: '库存管理', path: '/inventory' },
    { id: 'outbound', type: 'page', title: '出库管理', path: '/outbound' },
    { id: 'audit', type: 'page', title: '审计日志', path: '/audit' },
    ...sidebarItems.filter(item => !['home', 'inventory-management'].includes(item.id))
  ];

  // 刷新设备列表
  const refreshDevices = React.useCallback(async () => {
    const data = await getDevices();

    // 统一排序规则：
    // - 含数字的中文名称按数字升序（魔镜1号 < 魔镜10号）
    // - 英文名按创建时间排序（使用 createdAt 或 id 中的时间戳）
    // - 其他名称使用中文自然排序
    const extractNumber = (s: string): number | null => {
      const m = s.match(/(\d+)/);
      return m ? parseInt(m[1], 10) : null;
    };
    const isEnglishName = (s: string): boolean => /[A-Za-z]/.test(s) && /^[\x00-\x7F]+$/.test(s);
    const getCreatedTs = (d: any): number => {
      if (d.createdAt) {
        const t = new Date(d.createdAt).getTime();
        if (!isNaN(t)) return t;
      }
      if (typeof d.id === 'string') {
        const m = d.id.match(/^dev-(\d+)$/);
        if (m) return parseInt(m[1], 10);
      }
      return 0;
    };
    const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });

    const sorted = [...data].sort((a: any, b: any) => {
      const numA = extractNumber(a.name);
      const numB = extractNumber(b.name);
      const engA = isEnglishName(a.name);
      const engB = isEnglishName(b.name);

      const rank = (n: number | null, eng: boolean) => (n !== null ? 0 : (eng ? 1 : 2));
      const ra = rank(numA, engA);
      const rb = rank(numB, engB);

      if (ra !== rb) return ra - rb;
      if (ra === 0) return (numA! - numB!);              // 数字名：按数字升序
      if (ra === 1) return (getCreatedTs(a) - getCreatedTs(b)); // 英文名：按创建时间升序

      return collator.compare(a.name, b.name);           // 其他名称：自然排序
    });

    setDevices(sorted);
  }, []);

  // 创建新设备
  const handleCreateDevice = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => setCreateDialogOpen(false);

  const handleCreateDeviceSubmit = React.useCallback(async (deviceInput: Omit<Device, 'id'>) => {
    const newDevice = await createDevice(deviceInput);
    if (newDevice) {
      await refreshDevices();
    } else {
      throw new Error('创建设备失败');
    }
  }, [refreshDevices]);

  // 开始编辑设备名称
  const startEditingDevice = (deviceId: string, currentName: string) => {
    setEditingDeviceId(deviceId);
    setEditingName(currentName);
  };

  // 保存设备名称
  const saveDeviceName = async () => {
    if (editingDeviceId && editingName.trim()) {
      await updateDevice(editingDeviceId, { name: editingName.trim() });
      await refreshDevices();
      setEditingDeviceId(null);
      setEditingName('');
    }
  };


  // 取消编辑
  const cancelEditing = () => {
    setEditingDeviceId(null);
    setEditingName('');
  };

  React.useEffect(() => {
    refreshDevices();

    // 监听窗口焦点事件来刷新设备列表
    window.addEventListener('focus', refreshDevices);
    return () => window.removeEventListener('focus', refreshDevices);
  }, [refreshDevices]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'announcements':
        return <Megaphone className="w-4 h-4" />;
      case 'inventory-management':
        return <Package className="w-4 h-4" />;
      case 'outbound':
        return <PackageMinus className="w-4 h-4" />;
      case 'home':
        return <Home className="w-4 h-4" />;
      case 'dashboard':
        return <BarChart3 className="w-4 h-4" />;
      case 'audit':
        return <FileSearch className="w-4 h-4" />;
      case 'install':
        return <Wrench className="w-4 h-4" />;
      case 'software-guide':
        return <Settings className="w-4 h-4" />;
      case 'device-guide':
        return <Settings className="w-4 h-4" />;
      case 'printer-guide':
        return <Printer className="w-4 h-4" />;
      case 'troubleshooting':
        return <AlertTriangle className="w-4 h-4" />;
      case 'faq':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // 处理导航
  const handleNavigation = (item: any) => {
    if (item.path) {
      navigate(item.path);
    } else if (onPageChange) {
      onPageChange(item.id, item.type);
    }
  };

  // 处理设备点击
  const handleDeviceClick = (deviceId: string) => {
    navigate(`/device?id=${deviceId}`);
  };

  // 检查当前路径是否激活
  const isActive = (item: any) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    return currentPage === item.id;
  };

  return (
    <>
      <div className="w-60 bg-[rgba(250,250,250,1)] border-r border-sidebar-border h-screen overflow-y-auto">
        <div className="p-6">
          <h2 className="text-sidebar-foreground mb-6">设备管理中心</h2>
          
          <nav className="space-y-1">
            {extendedSidebarItems.map((item) => (
              <div key={item.id}>
                {item.type === 'group' ? (
                  <div>
                    <button
                      onClick={() => toggleGroup(item.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {getIcon(item.id)}
                        <span>{item.title}</span>
                      </div>
                      {expandedGroups[item.id] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {expandedGroups[item.id] && item.id === 'device-list' && (
                      <div className="ml-6 mt-1 space-y-1">
                        <button
                          onClick={handleCreateDevice}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-dashed border-sidebar-border"
                        >
                          <Plus className="w-3 h-3" />
                          <span>新建设备</span>
                        </button>
                        {devices.map((device) => (
                          <div
                            key={device.id}
                            className="relative"
                          >
                            <div
                              className={`group flex items-center gap-1 px-3 py-2 rounded-md transition-colors text-sm ${
                                location.pathname === '/device' && new URLSearchParams(location.search).get('id') === device.id
                                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                              }`}
                            >
                              {editingDeviceId === device.id ? (
                                <>
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveDeviceName();
                                      if (e.key === 'Escape') cancelEditing();
                                    }}
                                    className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
                                    autoFocus
                                  />
                                  <button
                                    onClick={saveDeviceName}
                                    className="p-1 hover:bg-green-100 rounded"
                                  >
                                    <Check className="w-3 h-3 text-green-600" />
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="p-1 hover:bg-red-100 rounded"
                                  >
                                    <X className="w-3 h-3 text-red-600" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleDeviceClick(device.id)}
                                    className="flex-1 text-left"
                                  >
                                    {device.name}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingDevice(device.id, device.name);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-sidebar-accent rounded transition-opacity"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleNavigation(item)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      isActive(item)
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    {getIcon(item.id)}
                    <span>{item.title}</span>
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
      <CreateDeviceDialog
        open={createDialogOpen}
        onClose={handleCreateDialogClose}
        onCreate={async (device) => {
          await handleCreateDeviceSubmit(device);
        }}
      />
    </>
  );
}
