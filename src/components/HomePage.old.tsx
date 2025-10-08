import React from 'react';
import { Search, Plus, Download, Upload, RefreshCw, Filter, X, Grid3x3, List } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getDevices, Device } from '../data/devices';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { DeviceCardSkeleton } from './DeviceCardSkeleton';
import { toast } from 'sonner';

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
  const [refreshing, setRefreshing] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = React.useState(false);

  // 刷新设备列表
  const refreshDevices = React.useCallback(async (showToast = false) => {
    setLoading(true);
    try {
      const data = await getDevices();
      setDevices(data);
      if (showToast) {
        toast.success(`已刷新，共 ${data.length} 台设备`);
      }
    } catch (error) {
      toast.error('刷新失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 手动刷新
  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshDevices(true);
    setRefreshing(false);
  }, [refreshDevices]);
  
  // 清除所有筛选
  const clearFilters = React.useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setLocationFilter('all');
    setSortBy('name');
    toast.success('已清除所有筛选条件');
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
      '运行中': 'success' as const,
      '离线': 'inactive' as const,
      '维护': 'warning' as const
    };

    return (
      <Badge variant={variants[status]}>
        {status}
      </Badge>
    );
  };

  const locations = [...new Set(devices.map(d => d.location))];
  
  // 统计数据
  const stats = React.useMemo(() => {
    const total = filteredDevices.length;
    const running = filteredDevices.filter(d => d.status === '运行中').length;
    const maintenance = filteredDevices.filter(d => d.status === '维护').length;
    const offline = filteredDevices.filter(d => d.status === '离线').length;
    
    return { total, running, maintenance, offline };
  }, [filteredDevices]);
  
  // 是否有活跃筛选
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || locationFilter !== 'all' || sortBy !== 'name';

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto fade-in">
      {/* 页面标题和操作区 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8">
        <div>
          <h1 className="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight">设备管理中心</h1>
          <p className="text-muted-foreground text-sm sm:text-base">管理和监控所有技术支持设备</p>
        </div>
        <div className="flex gap-2 flex-wrap no-print">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="button-press"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button variant="outline" size="sm" className="button-press hidden sm:flex">
            <Upload className="w-4 h-4 mr-2" />
            批量导入
          </Button>
          <Button variant="outline" size="sm" className="button-press hidden sm:flex">
            <Download className="w-4 h-4 mr-2" />
            导出 CSV
          </Button>
          <Button size="sm" className="button-press">
            <Plus className="w-4 h-4 mr-2" />
            新建设备
          </Button>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 mb-8">
        <Card className="border-l-4 border-l-primary transition-smooth hover:-translate-y-0.5 anthropic-card-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1 font-sans">设备总数</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#52A67D] transition-smooth hover:-translate-y-0.5 anthropic-card-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-[#52A67D]">{stats.running}</div>
            <div className="text-xs text-muted-foreground mt-1 font-sans">运行中</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#E6A23C] transition-smooth hover:-translate-y-0.5 anthropic-card-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-[#E6A23C]">{stats.maintenance}</div>
            <div className="text-xs text-muted-foreground mt-1 font-sans">维护中</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#9CA3AF] transition-smooth hover:-translate-y-0.5 anthropic-card-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-[#9CA3AF]">{stats.offline}</div>
            <div className="text-xs text-muted-foreground mt-1 font-sans">离线</div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选区 */}
      <div className="space-y-4 mb-8">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <Input
              placeholder="搜索设备名称、序列号、位置..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 focus-ring"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="清除搜索"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`button-press ${hasActiveFilters ? 'border-primary text-primary' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            筛选 {hasActiveFilters && `(${[searchTerm, statusFilter !== 'all', locationFilter !== 'all'].filter(Boolean).length})`}
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="button-press text-muted-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              清除
            </Button>
          )}
          
          <div className="flex gap-1 ml-auto border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
              aria-label="网格视图"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
              aria-label="列表视图"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* 展开的筛选器 */}
        {showFilters && (
          <div className="flex gap-3 flex-wrap p-5 bg-muted/40 rounded-[10px] border scale-in">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1.5 block">状态</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="focus-ring">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  <SelectItem value="运行中">运行中</SelectItem>
                  <SelectItem value="离线">离线</SelectItem>
                  <SelectItem value="维护">维护</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1.5 block">位置</label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="focus-ring">
                  <SelectValue placeholder="位置" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有位置</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1.5 block">排序方式</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="focus-ring">
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
          </div>
        )}
      </div>

      {/* 设备网格/列表 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <DeviceCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center py-16 fade-in">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">没有找到符合条件的设备</h3>
          <p className="text-muted-foreground mb-6">
            {hasActiveFilters ? '尝试调整筛选条件' : '开始添加您的第一台设备'}
          </p>
          {hasActiveFilters ? (
            <Button onClick={clearFilters} variant="outline" className="button-press">
              清除筛选
            </Button>
          ) : (
            <Button className="button-press">
              <Plus className="w-4 h-4 mr-2" />
              新建设备
            </Button>
          )}
        </div>
      ) : (
        <div 
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'flex flex-col gap-3'
          }
        >
          {filteredDevices.map((device, index) => (
            <Card 
              key={device.id} 
              className="cursor-pointer overflow-hidden card-hover fade-in"
              style={{
                animationDelay: `${index * 30}ms`,
                animationFillMode: 'backwards'
              }}
              onClick={() => onDeviceClick(device.id)}
            >
              {device.coverImage && (
                <div className="w-full h-40 overflow-hidden" style={{ borderRadius: '10px 10px 0 0' }}>
                  <ImageWithFallback 
                    src={device.coverImage}
                    alt={device.name}
                    className="w-full h-full object-cover image-zoom"
                  />
                </div>
              )}
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-base font-semibold leading-tight">{device.name}</CardTitle>
                {getStatusBadge(device.status)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{device.model}</p>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-2">
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">位置:</span>
                  <span className="text-foreground font-medium">{device.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">负责人:</span>
                  <span className="text-foreground font-medium">{device.owner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">打印机:</span>
                  <span className="text-foreground font-medium">{device.printer.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">下次维护:</span>
                  <span className="text-foreground font-medium">{device.nextMaintenance}</span>
                </div>
              </div>
              
              {/* 墨水余量指示器 */}
              <div className="pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground mb-2">墨水余量</div>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(device.printer.ink).map(([color, level]) => {
                    const inkColors = {
                      'C': '#00C7BE',
                      'M': '#FF2D55',
                      'Y': '#FFCC00',
                      'K': '#000000'
                    };
                    return (
                      <div key={color} className="flex flex-col items-center">
                        <div className="text-[11px] text-muted-foreground mb-1">{color}</div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full transition-all duration-200"
                            style={{ 
                              width: `${level}%`,
                              backgroundColor: inkColors[color as keyof typeof inkColors]
                            }}
                          />
                        </div>
                        <div className="text-[11px] text-foreground mt-1 font-medium">{level}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}