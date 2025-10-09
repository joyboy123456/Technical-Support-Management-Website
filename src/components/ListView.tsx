import React from 'react';
import { Device } from '../data/devices';
import { StatusDot } from './StatusDot';
import { ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface ListViewProps {
  /**
   * 设备列表
   */
  devices: Device[];
  /**
   * 点击行回调
   */
  onRowClick?: (deviceId: string) => void;
  /**
   * 当前排序字段
   */
  sortBy?: string;
  /**
   * 排序方向
   */
  sortDirection?: 'asc' | 'desc';
  /**
   * 排序变更回调
   */
  onSortChange?: (field: string) => void;
  /**
   * 自定义类名
   */
  className?: string;
}

type ColumnKey = 'name' | 'status' | 'location' | 'owner' | 'model' | 'nextMaintenance';

interface Column {
  key: ColumnKey;
  label: string;
  sortable: boolean;
  visible: boolean;
  width?: string;
}

/**
 * ListView - 列表视图组件
 *
 * 根据 Anthropic-like 设计原则:
 * - 粘性表头
 * - 列排序
 * - 列显示控制
 * - CMYK 用小色点+数字表示
 *
 * @example
 * ```tsx
 * <ListView
 *   devices={devices}
 *   onRowClick={handleClick}
 *   sortBy="name"
 *   sortDirection="asc"
 *   onSortChange={handleSort}
 * />
 * ```
 */
export function ListView({
  devices,
  onRowClick,
  sortBy = 'name',
  sortDirection = 'asc',
  onSortChange,
  className = ''
}: ListViewProps) {
  const [columns, setColumns] = React.useState<Column[]>([
    { key: 'name', label: '设备名', sortable: true, visible: true, width: '180px' },
    { key: 'status', label: '状态', sortable: true, visible: true, width: '140px' },
    { key: 'location', label: '位置', sortable: true, visible: true, width: '150px' },
    { key: 'owner', label: '负责人', sortable: true, visible: true, width: '120px' },
    { key: 'model', label: '型号', sortable: false, visible: true, width: '140px' },
    { key: 'nextMaintenance', label: '下次维护', sortable: true, visible: true, width: '120px' }
  ]);

  const [showColumnConfig, setShowColumnConfig] = React.useState(false);

  const handleSort = (field: string) => {
    onSortChange?.(field);
  };

  const toggleColumnVisibility = (key: ColumnKey) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === key ? { ...col, visible: !col.visible } : col))
    );
  };

  const visibleColumns = columns.filter((col) => col.visible);

  return (
    <div className={`relative ${className}`}>
      {/* 列配置按钮 */}
      <div className="flex justify-end mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowColumnConfig(!showColumnConfig)}
          className="focus-ring"
          aria-label="列显示配置"
          style={{ color: 'var(--text-2)' }}
        >
          <Settings className="w-4 h-4 mr-2" aria-hidden="true" />
          列配置
        </Button>
      </div>

      {/* 列配置面板 */}
      {showColumnConfig && (
        <div
          className="absolute right-0 top-12 z-10 p-4 rounded-lg border shadow-lg scale-in"
          style={{
            background: 'var(--surface-1)',
            borderColor: 'var(--border-subtle)',
            minWidth: '200px'
          }}
        >
          <div className="space-y-2">
            {columns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80"
              >
                <input
                  type="checkbox"
                  checked={col.visible}
                  onChange={() => toggleColumnVisibility(col.key)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-1)' }}>
                  {col.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 列表容器 */}
      <div
        className="overflow-x-auto rounded-lg border"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <table
          className="w-full"
          style={{
            background: 'var(--surface-1)',
            borderCollapse: 'separate',
            borderSpacing: 0
          }}
        >
          {/* 粘性表头 */}
          <thead
            style={{
              position: 'sticky',
              top: 0,
              background: 'var(--surface-2)',
              zIndex: 10,
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={col.sortable ? 'cursor-pointer select-none' : ''}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    textAlign: 'left',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    width: col.width,
                    transition: 'background var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    if (col.sortable) {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortBy === col.key && (
                      <span aria-label={sortDirection === 'asc' ? '升序' : '降序'}>
                        {sortDirection === 'asc' ? (
                          <ChevronUp className="w-3 h-3" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-3 h-3" aria-hidden="true" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* 表体 */}
          <tbody>
            {devices.map((device, index) => (
              <tr
                key={device.id}
                onClick={() => onRowClick?.(device.id)}
                className="cursor-pointer"
                style={{
                  borderBottom:
                    index < devices.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {visibleColumns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-1)'
                    }}
                  >
                    {renderCell(device, col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * 渲染单元格内容
 */
function renderCell(device: Device, key: ColumnKey): React.ReactNode {
  switch (key) {
    case 'name':
      return (
        <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{device.name}</span>
      );

    case 'status':
      return <StatusDot status={device.status} showTime={false} />;

    case 'location':
      return device.location;

    case 'owner':
      return device.owner;

    case 'model':
      return device.model;

    case 'nextMaintenance':
      return device.nextMaintenance;

    default:
      return null;
  }
}


