import React from 'react';
import { Device } from '../data/devices';
import { StatusDot, getRelativeTime } from './StatusDot';
import { MoreHorizontal, Wrench, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface DeviceCardProps {
  /**
   * 设备数据
   */
  device: Device;
  /**
   * 点击卡片回调
   */
  onClick?: (deviceId: string) => void;
  /**
   * 标记维护回调
   */
  onMarkMaintenance?: (deviceId: string) => void;
  /** 删除设备回调 */
  onDelete?: (device: Device) => void;
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * DeviceCard - 设备卡片组件
 *
 * 根据 Anthropic-like 设计原则:
 * - 头部: 设备名 + StatusDot + 上次刷新时间
 * - 信息区: 两列对齐 (位置｜负责人｜型号｜下次维护)
 * - 资源条: CMYK 水平条 + 标签, <15% 添加斜纹
 * - 尾部操作: hover 显示
 *
 * @example
 * ```tsx
 * <DeviceCard device={device} onClick={handleClick} />
 * ```
 */
export function DeviceCard({
  device,
  onClick,
  onMarkMaintenance,
  onDelete,
  className = ''
}: DeviceCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  // 计算下次维护是否临期 (7天内)
  const isMaintenanceDue = React.useMemo(() => {
    const today = new Date();
    const maintenanceDate = new Date(device.nextMaintenance);
    const diffDays = Math.floor(
      (maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 7 && diffDays >= 0;
  }, [device.nextMaintenance]);

  // 模拟上次更新时间 (实际应该从 device.updatedAt 获取)
  const lastUpdate = React.useMemo(() => {
    // 假设设备每5-30分钟更新一次
    const randomMinutes = Math.floor(Math.random() * 25) + 5;
    const updateTime = new Date(Date.now() - randomMinutes * 60 * 1000);
    return getRelativeTime(updateTime);
  }, [device.id]);

  const handleCardClick = () => {
    onClick?.(device.id);
  };

  const handleMaintenanceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkMaintenance?.(device.id);
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 打开更多操作菜单
  };

  return (
    <div
      className={`device-card cursor-pointer ${className}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="article"
      aria-label={`设备 ${device.name}`}
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'all var(--transition-normal)',
        position: 'relative'
      }}
    >
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-testid="device-card-delete"
          aria-label={`删除设备 ${device.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(device);
          }}
          style={{
            position: 'absolute',
            top: 'var(--space-3)',
            right: 'var(--space-3)',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity var(--transition-fast)'
          }}
        >
          <Trash2 className="w-4 h-4 text-red-500" aria-hidden="true" />
        </Button>
      )}
      {/* 头部 */}
      <div
        className="p-4 sm:p-4"
        style={{
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <h3
          className="text-lg sm:text-base mb-2"
          style={{
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-1)'
          }}
        >
          {device.name}
        </h3>
        <StatusDot
          status={device.status}
          lastUpdate={lastUpdate}
          showTime
        />
      </div>

      {/* 信息区 */}
      <div
        className="p-4 sm:p-4 flex gap-4"
      >
        {/* 左侧信息 */}
        <div
          className="flex-1 grid gap-3 text-base sm:text-sm"
          style={{
            gridTemplateColumns: 'auto 1fr'
          }}
        >
          <span className="text-muted-foreground">位置</span>
          <span className="text-foreground font-medium">
            {device.location}
          </span>

          <span className="text-muted-foreground">负责人</span>
          <span className="text-foreground font-medium">
            {device.owner}
          </span>

          <span className="text-muted-foreground">型号</span>
          <span className="text-foreground font-medium">
            {device.model}
          </span>

          <span className="text-muted-foreground">下次维护</span>
          <span
            className="text-foreground font-medium flex items-center gap-2"
          >
            {device.nextMaintenance}
            {isMaintenanceDue && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--status-warning)',
                        display: 'inline-block'
                      }}
                      aria-label="即将到期"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>建议预定维护</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </span>
        </div>

        {/* 右侧设备图片 (9:16 竖屏比例) */}
        {device.coverImage && (
          <div
            style={{
              width: '90px',
              height: '160px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-2)'
            }}
          >
            <img
              src={device.coverImage}
              alt={`${device.name}外观`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* 尾部操作 (hover 显示) */}
      {isHovered && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: 'var(--space-2)',
            justifyContent: 'flex-end',
            background: 'var(--surface-2)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMaintenanceClick}
            aria-label="标记维护"
            className="focus-ring"
          >
            <Wrench className="w-4 h-4 mr-1" aria-hidden="true" />
            维护
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleMoreClick}
            aria-label="更多操作"
            className="focus-ring"
          >
            <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* 内联动画 */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .device-card:hover {
          border-color: var(--border-medium);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}

