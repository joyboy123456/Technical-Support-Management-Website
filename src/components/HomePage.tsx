import React from 'react';
import { getDevices, Device, createDevice, deleteDevice } from '../data/devices';
import { KpiCard, KpiCardGroup } from './KpiCard';
import { DeviceCard } from './DeviceCard';
import { TopToolbar } from './TopToolbar';
import { Filters, FilterState } from './Filters';
import { ListView } from './ListView';
import { DeviceCardSkeleton } from './DeviceCardSkeleton';
import { toast } from 'sonner';
import { CreateDeviceDialog } from './CreateDeviceDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from './ui/alert-dialog';

interface HomePageProps {
  onDeviceClick: (deviceId: string) => void;
}

/**
 * HomePage - 重构后的设备管理中心主页
 *
 * 根据 Anthropic-like 设计原则完全重构:
 * - KPI 卡: 白底+细边，可点击筛选
 * - 顶部工具条: 统一样式
 * - 筛选区: Chips + 保存视图
 * - 设备展示: 网格/列表视图切换
 * - 卡片: 极简设计，信息密度合理
 */
export function HomePage({ onDeviceClick }: HomePageProps) {
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [devicePendingDelete, setDevicePendingDelete] = React.useState<Device | null>(null);

  // 筛选状态
  const [filters, setFilters] = React.useState<FilterState>({
    search: '',
    status: 'all',
    location: 'all',
    sortBy: 'name'
  });

  // 排序方向 (用于列表视图)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

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

  // 初始加载
  React.useEffect(() => {
    refreshDevices();

    // 窗口聚焦时自动刷新
    const handleFocus = () => refreshDevices();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshDevices]);

  // 筛选后的设备列表
  const filteredDevices = React.useMemo(() => {
    let filtered = devices.filter((device) => {
      const matchesSearch =
        device.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        device.serial.toLowerCase().includes(filters.search.toLowerCase()) ||
        device.location.toLowerCase().includes(filters.search.toLowerCase()) ||
        device.printer.model.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = filters.status === 'all' || device.status === filters.status;
      const matchesLocation = filters.location === 'all' || device.location.includes(filters.location);

      return matchesSearch && matchesStatus && matchesLocation;
    });

    // 排序
    filtered.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;

      switch (filters.sortBy) {
        case 'name': {
          // 规则：
          // 1) 带数字的名称按数字从小到大排序（如：魔镜1号 → 魔镜10号）
          // 2) 英文名按“添加时间”从新到旧或旧到新（根据排序方向）；
          // 3) 其他名称使用自然排序（numeric: true）
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
            // 回退：从 id 中提取时间戳（如 id=dev-1699999999999）
            if (typeof d.id === 'string') {
              const m = d.id.match(/^dev-(\d+)$/);
              if (m) return parseInt(m[1], 10);
            }
            return 0;
          };

          const numA = extractNumber(a.name);
          const numB = extractNumber(b.name);
          const engA = isEnglishName(a.name);
          const engB = isEnglishName(b.name);

          // 排序优先级：数字名(0) → 英文名(1) → 其他(2)
          const rank = (n: number | null, eng: boolean) => (n !== null ? 0 : (eng ? 1 : 2));
          const ra = rank(numA, engA);
          const rb = rank(numB, engB);

          if (ra !== rb) return (ra - rb) * direction;
          if (ra === 0) return ((numA! - numB!) * direction); // 数字名：按数字排序
          if (ra === 1) return ((getCreatedTs(a) - getCreatedTs(b)) * direction); // 英文名：按创建时间排序

          // 其他名称：自然排序
          const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
          return collator.compare(a.name, b.name) * direction;
        }
        case 'status':
          return a.status.localeCompare(b.status) * direction;
        case 'location':
          return a.location.localeCompare(b.location) * direction;
        case 'maintenance':
          return (
            (new Date(a.nextMaintenance).getTime() - new Date(b.nextMaintenance).getTime()) *
            direction
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [devices, filters, sortDirection]);

  // 统计数据
  const stats = React.useMemo(() => {
    return {
      total: devices.length,
      running: devices.filter((d) => d.status === '运行中').length,
      maintenance: devices.filter((d) => d.status === '维护').length,
      offline: devices.filter((d) => d.status === '离线').length
    };
  }, [devices]);

  // 可用位置列表
  const locations = React.useMemo(() => {
    return [...new Set(devices.map((d) => d.location))];
  }, [devices]);

  // KPI 卡点击筛选
  const handleKpiClick = (filterKey: string) => {
    if (filterKey === 'all') {
      setFilters((prev) => ({ ...prev, status: 'all' }));
    } else {
      setFilters((prev) => ({ ...prev, status: filterKey }));
    }
    toast.success(`已筛选: ${filterKey === 'all' ? '全部设备' : filterKey}`);
  };

  // 清除所有筛选
  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      location: 'all',
      sortBy: 'name'
    });
    setSortDirection('asc');
    toast.success('已清除所有筛选条件');
  };

  const handleCreateDevice = React.useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleCreateDialogClose = () => setCreateDialogOpen(false);

  const handleCreateDeviceSubmit = React.useCallback(async (deviceInput: Omit<Device, 'id'>) => {
    const newDevice = await createDevice(deviceInput);
    if (newDevice) {
      await refreshDevices();
    } else {
      throw new Error('创建设备失败');
    }
  }, [refreshDevices]);

  const handleDeleteDeviceRequest = React.useCallback((device: Device) => {
    setDevicePendingDelete(device);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteDialogChange = React.useCallback((open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setDevicePendingDelete(null);
    }
  }, []);

  const handleConfirmDeleteDevice = React.useCallback(async () => {
    if (!devicePendingDelete) return;

    const success = await deleteDevice(devicePendingDelete.id);
    if (success) {
      toast.success('设备已删除');
      setDeleteDialogOpen(false);
      setDevicePendingDelete(null);
      await refreshDevices();
    } else {
      toast.error('删除失败，请稍后重试');
    }
  }, [devicePendingDelete, refreshDevices]);

  // 筛选变更
  const handleFiltersChange = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  // 列表视图排序
  const handleListSort = (field: string) => {
    if (filters.sortBy === field) {
      // 切换排序方向
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // 新字段，默认升序
      setFilters((prev) => ({ ...prev, sortBy: field }));
      setSortDirection('asc');
    }
  };

  return (
    <div
      className="container-constrained py-6"
      style={{ maxWidth: 'var(--container-max-width)' }}
    >
      {/* 页面标题 */}
      <div className="mb-6">
        <h1
          style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-1)',
            marginBottom: 'var(--space-2)',
            letterSpacing: '-0.02em'
          }}
        >
          设备管理中心
        </h1>
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-2)' }}>
          管理和监控所有技术支持设备
        </p>
      </div>

      {/* 顶部工具条 */}
      <TopToolbar
        onRefresh={handleRefresh}
        onImport={() => toast.info('导入功能开发中')}
        onExport={() => toast.info('导出功能开发中')}
        onCreateDevice={handleCreateDevice}
        isRefreshing={refreshing}
        className="mb-6"
      />

      {/* KPI 统计卡片 */}
      <KpiCardGroup className="mb-6">
        <KpiCard
          label="设备总数"
          value={stats.total}
          filterKey="all"
          onClick={handleKpiClick}
          isActive={filters.status === 'all'}
        />
        <KpiCard
          label="运行中"
          value={stats.running}
          filterKey="运行中"
          onClick={handleKpiClick}
          isActive={filters.status === '运行中'}
        />
        <KpiCard
          label="维护中"
          value={stats.maintenance}
          filterKey="维护"
          onClick={handleKpiClick}
          isActive={filters.status === '维护'}
        />
        <KpiCard
          label="离线"
          value={stats.offline}
          filterKey="离线"
          onClick={handleKpiClick}
          isActive={filters.status === '离线'}
        />
      </KpiCardGroup>

      {/* 筛选区 */}
      <Filters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        locations={locations}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        className="mb-6"
      />

      {/* 设备展示区 */}
      {loading ? (
        // 骨架屏
        <div className="device-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <DeviceCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredDevices.length === 0 ? (
        // 空状态
        <div
          className="text-center py-16 fade-in"
          style={{
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>🔍</div>
          <h3
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-1)',
              marginBottom: 'var(--space-2)'
            }}
          >
            没有找到符合条件的设备
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-2)' }}>
            尝试调整筛选条件或清除所有筛选
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        // 网格视图
        <div className="device-grid">
          {filteredDevices.map((device, index) => (
            <div
              key={device.id}
              className="fade-in"
              style={{
                animationDelay: `${index * 30}ms`,
                animationFillMode: 'backwards'
              }}
            >
              <DeviceCard
                device={device}
                onClick={onDeviceClick}
                onMarkMaintenance={(id) => toast.info(`标记设备 ${id} 为维护中`)}
                onDelete={handleDeleteDeviceRequest}
              />
            </div>
          ))}
        </div>
      ) : (
        // 列表视图
        <ListView
          devices={filteredDevices}
          onRowClick={onDeviceClick}
          sortBy={filters.sortBy}
          sortDirection={sortDirection}
          onSortChange={handleListSort}
          onDeleteDevice={handleDeleteDeviceRequest}
        />
      )}
      <CreateDeviceDialog
        open={createDialogOpen}
        onClose={handleCreateDialogClose}
        onCreate={handleCreateDeviceSubmit}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除设备</AlertDialogTitle>
            <AlertDialogDescription>
              {devicePendingDelete
                ? `确定要删除设备“${devicePendingDelete.name}”吗？相关的维护与故障记录将一并移除。`
                : '确定要删除该设备吗？'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              data-testid="device-delete-confirm"
              onClick={handleConfirmDeleteDevice}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
