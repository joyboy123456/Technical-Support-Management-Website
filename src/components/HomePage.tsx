import React from 'react';
import { Search, Plus, Download, Upload } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getDevices, Device } from '../data/devices';

interface HomePageProps {
  onDeviceClick: (deviceId: string) => void;
}

export function HomePage({ onDeviceClick }: HomePageProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [locationFilter, setLocationFilter] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<string>('name');
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [loading, setLoading] = React.useState(true);

  // 刷新设备列表
  const refreshDevices = React.useCallback(async () => {
    setLoading(true);
    const data = await getDevices();
    setDevices(data);
    setLoading(false);
  }, []);

  // 初始加载和定期刷新数据
  React.useEffect(() => {
    refreshDevices();
    
    const handleFocus = () => refreshDevices();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshDevices]);

  const filteredDevices = React.useMemo(() => {
    let filtered = devices.filter(device => {
      const matchesSearch = 
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.printer.model.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
      const matchesLocation = locationFilter === 'all' || device.location.includes(locationFilter);
      
      return matchesSearch && matchesStatus && matchesLocation;
    });

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'location':
          return a.location.localeCompare(b.location);
        case 'maintenance':
          return new Date(a.nextMaintenance).getTime() - new Date(b.nextMaintenance).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [devices, searchTerm, statusFilter, locationFilter, sortBy]);

  const getStatusBadge = (status: Device['status']) => {
    const variants = {
      '运行中': 'default',
      '离线': 'secondary',
      '维护': 'destructive'
    } as const;
    
    const colors = {
      '运行中': 'bg-green-100 text-green-800 hover:bg-green-100',
      '离线': 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      '维护': 'bg-orange-100 text-orange-800 hover:bg-orange-100'
    };

    return (
      <Badge className={colors[status]}>
        {status}
      </Badge>
    );
  };

  const locations = [...new Set(devices.map(d => d.location))];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页面标题和操作区 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="mb-2">设备管理中心</h1>
          <p className="text-muted-foreground">管理和监控所有技术支持设备</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            批量导入
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            导出 CSV
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            新建设备
          </Button>
        </div>
      </div>

      {/* 搜索和筛选区 */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="按设备名/序列号/位置/打印机型号搜索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有状态</SelectItem>
            <SelectItem value="运行中">运行中</SelectItem>
            <SelectItem value="离线">离线</SelectItem>
            <SelectItem value="维护">维护</SelectItem>
          </SelectContent>
        </Select>

        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="位置" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有位置</SelectItem>
            {locations.map(location => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">按名称</SelectItem>
            <SelectItem value="status">按状态</SelectItem>
            <SelectItem value="location">按位置</SelectItem>
            <SelectItem value="maintenance">按维护日期</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 设备网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDevices.map((device) => (
          <Card 
            key={device.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onDeviceClick(device.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{device.name}</CardTitle>
                {getStatusBadge(device.status)}
              </div>
              <p className="text-sm text-muted-foreground">{device.model}</p>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-2">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">位置:</span>
                  <span>{device.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">负责人:</span>
                  <span>{device.owner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">打印机:</span>
                  <span>{device.printer.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">下次维护:</span>
                  <span>{device.nextMaintenance}</span>
                </div>
              </div>
              
              {/* 墨水余量指示器 */}
              <div className="pt-2">
                <div className="text-xs text-muted-foreground mb-1">墨水余量</div>
                <div className="flex gap-1">
                  {Object.entries(device.printer.ink).map(([color, level]) => (
                    <div key={color} className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{color}</span>
                        <span>{level}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            level > 50 ? 'bg-green-500' : 
                            level > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">没有找到符合条件的设备</p>
        </div>
      )}
    </div>
  );
}