import React from 'react';
import { Search, X, Grid3x3, List, Save } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Device } from '../data/devices';

export interface FilterState {
  search: string;
  status: string;
  location: string;
  sortBy: string;
}

export interface SavedView {
  id: string;
  name: string;
  filters: FilterState;
}

interface FiltersProps {
  /**
   * 当前筛选状态
   */
  filters: FilterState;
  /**
   * 筛选变更回调
   */
  onFiltersChange: (filters: Partial<FilterState>) => void;
  /**
   * 清除所有筛选
   */
  onClearFilters: () => void;
  /**
   * 可用位置列表
   */
  locations: string[];
  /**
   * 视图模式
   */
  viewMode: 'grid' | 'list';
  /**
   * 视图模式变更回调
   */
  onViewModeChange: (mode: 'grid' | 'list') => void;
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * Filters - 筛选区组件
 *
 * 根据 Anthropic-like 设计原则:
 * - 搜索输入、排序、筛选 Chips
 * - 列表/卡片视图切换
 * - 支持"保存为视图"(localStorage)
 *
 * @example
 * ```tsx
 * <Filters
 *   filters={filterState}
 *   onFiltersChange={handleChange}
 *   locations={['北京', '上海']}
 *   viewMode="grid"
 *   onViewModeChange={setViewMode}
 * />
 * ```
 */
export function Filters({
  filters,
  onFiltersChange,
  onClearFilters,
  locations,
  viewMode,
  onViewModeChange,
  className = ''
}: FiltersProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [savedViews, setSavedViews] = React.useState<SavedView[]>([]);

  // 从 localStorage 加载保存的视图
  React.useEffect(() => {
    const stored = localStorage.getItem('device-saved-views');
    if (stored) {
      try {
        setSavedViews(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved views:', e);
      }
    }
  }, []);

  // 保存视图到 localStorage
  const saveCurrentView = () => {
    const viewName = prompt('请输入视图名称:');
    if (!viewName) return;

    const newView: SavedView = {
      id: Date.now().toString(),
      name: viewName,
      filters
    };

    const updated = [...savedViews, newView];
    setSavedViews(updated);
    localStorage.setItem('device-saved-views', JSON.stringify(updated));
  };

  // 删除保存的视图
  const deleteSavedView = (id: string) => {
    const updated = savedViews.filter(v => v.id !== id);
    setSavedViews(updated);
    localStorage.setItem('device-saved-views', JSON.stringify(updated));
  };

  // 是否有活跃筛选
  const hasActiveFilters =
    filters.search ||
    filters.status !== 'all' ||
    filters.location !== 'all' ||
    filters.sortBy !== 'name';

  // 活跃筛选 Chips
  const activeFilterChips = React.useMemo(() => {
    const chips: Array<{ key: string; label: string; value: string }> = [];

    if (filters.search) {
      chips.push({ key: 'search', label: '搜索', value: filters.search });
    }
    if (filters.status !== 'all') {
      chips.push({ key: 'status', label: '状态', value: filters.status });
    }
    if (filters.location !== 'all') {
      chips.push({ key: 'location', label: '位置', value: filters.location });
    }

    return chips;
  }, [filters]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 主筛选行 */}
      <div className="flex gap-2 flex-wrap items-center">
        {/* 搜索输入 */}
        <div className="relative flex-1 min-w-[240px]">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--text-3)' }}
            aria-hidden="true"
          />
          <Input
            placeholder="搜索设备名称、序列号、位置..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-10 pr-10 focus-ring"
            aria-label="搜索设备"
            style={{
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-1)'
            }}
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ search: '' })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:opacity-70 transition-opacity"
              aria-label="清除搜索"
              style={{ color: 'var(--text-3)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 高级筛选按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`focus-ring ${hasActiveFilters ? 'border-interactive-primary' : ''}`}
          aria-expanded={showAdvanced}
          aria-label="高级筛选"
        >
          筛选 {activeFilterChips.length > 0 && `(${activeFilterChips.length})`}
        </Button>

        {/* 清除筛选 */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="focus-ring"
            aria-label="清除所有筛选"
            style={{ color: 'var(--text-2)' }}
          >
            <X className="w-4 h-4 mr-1" aria-hidden="true" />
            清除
          </Button>
        )}

        {/* 保存视图 */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={saveCurrentView}
            className="focus-ring"
            aria-label="保存当前视图"
            style={{ color: 'var(--text-2)' }}
          >
            <Save className="w-4 h-4 mr-1" aria-hidden="true" />
            保存视图
          </Button>
        )}

        {/* 视图切换 */}
        <div
          className="flex gap-1 ml-auto border rounded-lg p-1"
          style={{ borderColor: 'var(--border-subtle)' }}
          role="group"
          aria-label="视图模式切换"
        >
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="h-8 w-8 p-0 focus-ring"
            aria-label="网格视图"
            aria-pressed={viewMode === 'grid'}
          >
            <Grid3x3 className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="h-8 w-8 p-0 focus-ring"
            aria-label="列表视图"
            aria-pressed={viewMode === 'list'}
          >
            <List className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 筛选 Chips */}
      {activeFilterChips.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          {activeFilterChips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              value={chip.value}
              onRemove={() => {
                if (chip.key === 'search') onFiltersChange({ search: '' });
                else if (chip.key === 'status') onFiltersChange({ status: 'all' });
                else if (chip.key === 'location') onFiltersChange({ location: 'all' });
              }}
            />
          ))}
        </div>
      )}

      {/* 高级筛选面板 */}
      {showAdvanced && (
        <div
          className="p-5 rounded-lg border scale-in"
          style={{
            background: 'var(--surface-2)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 状态筛选 */}
            <div>
              <label
                className="text-xs mb-1.5 block"
                style={{ color: 'var(--text-2)', fontWeight: 'var(--font-weight-medium)' }}
              >
                状态
              </label>
              <Select value={filters.status} onValueChange={(v) => onFiltersChange({ status: v })}>
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

            {/* 位置筛选 */}
            <div>
              <label
                className="text-xs mb-1.5 block"
                style={{ color: 'var(--text-2)', fontWeight: 'var(--font-weight-medium)' }}
              >
                位置
              </label>
              <Select value={filters.location} onValueChange={(v) => onFiltersChange({ location: v })}>
                <SelectTrigger className="focus-ring">
                  <SelectValue placeholder="位置" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有位置</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 排序方式 */}
            <div>
              <label
                className="text-xs mb-1.5 block"
                style={{ color: 'var(--text-2)', fontWeight: 'var(--font-weight-medium)' }}
              >
                排序方式
              </label>
              <Select value={filters.sortBy} onValueChange={(v) => onFiltersChange({ sortBy: v })}>
                <SelectTrigger className="focus-ring">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">按名称</SelectItem>
                  <SelectItem value="status">按状态</SelectItem>
                  <SelectItem value="location">按位置</SelectItem>
                  <SelectItem value="maintenance">按到期时间</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* 保存的视图 */}
      {savedViews.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span
            className="text-xs"
            style={{ color: 'var(--text-2)', fontWeight: 'var(--font-weight-medium)' }}
          >
            已保存视图:
          </span>
          {savedViews.map((view) => (
            <SavedViewChip
              key={view.id}
              view={view}
              onApply={() => onFiltersChange(view.filters)}
              onDelete={() => deleteSavedView(view.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * FilterChip - 筛选 Chip 组件
 */
interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

function FilterChip({ label, value, onRemove }: FilterChipProps) {
  return (
    <div
      className="filter-chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-3)',
        background: 'var(--surface-2)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-1)',
        transition: 'all var(--transition-fast)'
      }}
    >
      <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
        {label}: {value}
      </span>
      <button
        onClick={onRemove}
        className="filter-chip__close focus-ring"
        aria-label={`移除 ${label} 筛选`}
        style={{
          width: '16px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          transition: 'background var(--transition-fast)',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-2)'
        }}
      >
        <X className="w-3 h-3" aria-hidden="true" />
      </button>

      <style jsx>{`
        .filter-chip__close:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .filter-chip__close:focus-visible {
          outline: 2px solid var(--focus);
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}

/**
 * SavedViewChip - 已保存视图 Chip
 */
interface SavedViewChipProps {
  view: SavedView;
  onApply: () => void;
  onDelete: () => void;
}

function SavedViewChip({ view, onApply, onDelete }: SavedViewChipProps) {
  return (
    <div
      className="flex items-center gap-1 px-3 py-1.5 rounded-full border cursor-pointer hover:shadow-sm transition-all"
      style={{
        background: 'var(--surface-1)',
        borderColor: 'var(--border-subtle)',
        fontSize: 'var(--font-size-sm)'
      }}
      onClick={onApply}
      role="button"
      tabIndex={0}
      aria-label={`应用视图 ${view.name}`}
    >
      <span style={{ color: 'var(--text-1)', fontWeight: 'var(--font-weight-medium)' }}>
        {view.name}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="focus-ring"
        aria-label={`删除视图 ${view.name}`}
        style={{
          width: '16px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-full)',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-3)',
          cursor: 'pointer'
        }}
      >
        <X className="w-3 h-3" aria-hidden="true" />
      </button>
    </div>
  );
}
