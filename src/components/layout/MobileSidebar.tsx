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
import { sidebarItems, getDevices, createDevice, updateDevice, Device } from '../../data/devices';
import { CreateDeviceDialog } from '../CreateDeviceDialog';

interface MobileSidebarProps {
  currentPage?: string;
  onPageChange?: (pageId: string, type: 'page' | 'device') => void;
  onNavigate?: () => void; // Callback to close drawer after navigation
}

export function MobileSidebar({ currentPage, onPageChange, onNavigate }: MobileSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    'device-list': false // Collapsed by default on mobile
  });
  const [devices, setDevices] = React.useState<any[]>([]);
  const [editingDeviceId, setEditingDeviceId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  // Extended navigation items
  const extendedSidebarItems = [
    { id: 'home', type: 'page', title: '首页', path: '/' },
    { id: 'dashboard', type: 'page', title: '统计看板', path: '/dashboard' },
    { id: 'inventory-management', type: 'page', title: '库存管理', path: '/inventory' },
    { id: 'outbound', type: 'page', title: '出库管理', path: '/outbound' },
    { id: 'audit', type: 'page', title: '审计日志', path: '/audit' },
    ...sidebarItems.filter(item => !['home', 'inventory-management'].includes(item.id))
  ];

  // Refresh devices list
  const refreshDevices = React.useCallback(async () => {
    const data = await getDevices();

    // Unified sorting rules
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
      if (ra === 0) return (numA! - numB!);
      if (ra === 1) return (getCreatedTs(a) - getCreatedTs(b));

      return collator.compare(a.name, b.name);
    });

    setDevices(sorted);
  }, []);

  // Create new device
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

  // Start editing device name
  const startEditingDevice = (deviceId: string, currentName: string) => {
    setEditingDeviceId(deviceId);
    setEditingName(currentName);
  };

  // Save device name
  const saveDeviceName = async () => {
    if (editingDeviceId && editingName.trim()) {
      await updateDevice(editingDeviceId, { name: editingName.trim() });
      await refreshDevices();
      setEditingDeviceId(null);
      setEditingName('');
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingDeviceId(null);
    setEditingName('');
  };

  React.useEffect(() => {
    refreshDevices();

    // Listen for window focus events to refresh device list
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
        return <Megaphone className="w-5 h-5" />;
      case 'inventory-management':
        return <Package className="w-5 h-5" />;
      case 'outbound':
        return <PackageMinus className="w-5 h-5" />;
      case 'home':
        return <Home className="w-5 h-5" />;
      case 'dashboard':
        return <BarChart3 className="w-5 h-5" />;
      case 'audit':
        return <FileSearch className="w-5 h-5" />;
      case 'install':
        return <Wrench className="w-5 h-5" />;
      case 'software-guide':
        return <Settings className="w-5 h-5" />;
      case 'device-guide':
        return <Settings className="w-5 h-5" />;
      case 'printer-guide':
        return <Printer className="w-5 h-5" />;
      case 'troubleshooting':
        return <AlertTriangle className="w-5 h-5" />;
      case 'faq':
        return <HelpCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  // Handle navigation
  const handleNavigation = (item: any) => {
    if (item.path) {
      navigate(item.path);
      onNavigate?.(); // Close drawer
    } else if (onPageChange) {
      onPageChange(item.id, item.type);
      onNavigate?.(); // Close drawer
    }
  };

  // Handle device click
  const handleDeviceClick = (deviceId: string) => {
    navigate(`/device?id=${deviceId}`);
    onNavigate?.(); // Close drawer
  };

  // Check if current path is active
  const isActive = (item: any) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    return currentPage === item.id;
  };

  return (
    <>
      <div className="p-4">
        <nav className="space-y-2">
          {extendedSidebarItems.map((item) => (
            <div key={item.id}>
              {item.type === 'group' ? (
                <div>
                  <button
                    onClick={() => toggleGroup(item.id)}
                    className="w-full flex items-center justify-between px-3 py-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors min-h-[44px]"
                  >
                    <div className="flex items-center gap-3">
                      {getIcon(item.id)}
                      <span className="text-base">{item.title}</span>
                    </div>
                    {expandedGroups[item.id] ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>

                  {expandedGroups[item.id] && item.id === 'device-list' && (
                    <div className="ml-6 mt-2 space-y-2">
                      <button
                        onClick={handleCreateDevice}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-dashed border-sidebar-border min-h-[44px]"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-base">新建设备</span>
                      </button>
                      {devices.map((device) => (
                        <div
                          key={device.id}
                          className="relative"
                        >
                          <div
                            className={`group flex items-center gap-2 px-3 py-3 rounded-md transition-colors min-h-[44px] ${
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
                                  className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-sidebar-primary min-h-[44px]"
                                  autoFocus
                                />
                                <button
                                  onClick={saveDeviceName}
                                  className="p-2 hover:bg-green-100 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                                >
                                  <Check className="w-4 h-4 text-green-600" />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="p-2 hover:bg-red-100 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                                >
                                  <X className="w-4 h-4 text-red-600" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleDeviceClick(device.id)}
                                  className="flex-1 text-left text-base py-1"
                                >
                                  {device.name}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingDevice(device.id, device.name);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-sidebar-accent rounded transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
                                >
                                  <Edit2 className="w-4 h-4" />
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
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors min-h-[44px] ${
                    isActive(item)
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  {getIcon(item.id)}
                  <span className="text-base">{item.title}</span>
                </button>
              )}
            </div>
          ))}
        </nav>
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
