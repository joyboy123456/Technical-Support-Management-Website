import React from 'react';
import { ChevronDown, ChevronRight, FileText, Settings, HelpCircle, AlertTriangle, Printer, Megaphone, Package } from 'lucide-react';
import { sidebarItems, getDevices } from '../data/devices';

interface SidebarProps {
  currentPage: string;
  onPageChange: (pageId: string, type: 'page' | 'device') => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    'device-list': true
  });
  const [devices, setDevices] = React.useState<any[]>([]);

  // 刷新设备列表
  const refreshDevices = React.useCallback(async () => {
    const data = await getDevices();
    setDevices(data);
  }, []);

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

  return (
    <div className="w-60 bg-[rgba(250,250,250,1)] border-r border-sidebar-border h-screen overflow-y-auto">
      <div className="p-6">
        <h2 className="text-sidebar-foreground mb-6">设备管理中心</h2>
        
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
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
                      {devices.map((device) => (
                        <button
                          key={device.id}
                          onClick={() => onPageChange(device.id, 'device')}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                            currentPage === device.id
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                        >
                          {device.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onPageChange(item.id, item.type)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    currentPage === item.id
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
  );
}