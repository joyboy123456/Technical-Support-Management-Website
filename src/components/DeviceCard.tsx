import React from 'react';
import { Device } from '../data/devices';
import { StatusDot, getRelativeTime } from './StatusDot';
import { MoreHorizontal, Wrench } from 'lucide-react';
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
        transition: 'all var(--transition-normal)'
      }}
    >
      {/* 头部 */}
      <div
        style={{
          padding: 'var(--space-4)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <h3
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-1)',
            marginBottom: 'var(--space-2)'
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
        style={{
          padding: 'var(--space-4)',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 'var(--space-3)',
          fontSize: 'var(--font-size-sm)'
        }}
      >
        <span style={{ color: 'var(--text-2)' }}>位置</span>
        <span style={{ color: 'var(--text-1)', fontWeight: 'var(--font-weight-medium)' }}>
          {device.location}
        </span>

        <span style={{ color: 'var(--text-2)' }}>负责人</span>
        <span style={{ color: 'var(--text-1)', fontWeight: 'var(--font-weight-medium)' }}>
          {device.owner}
        </span>

        <span style={{ color: 'var(--text-2)' }}>型号</span>
        <span style={{ color: 'var(--text-1)', fontWeight: 'var(--font-weight-medium)' }}>
          {device.model}
        </span>

        <span style={{ color: 'var(--text-2)' }}>下次维护</span>
        <span
          style={{
            color: 'var(--text-1)',
            fontWeight: 'var(--font-weight-medium)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}
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

      {/* CMYK 墨水条 */}
      <div
        style={{
          padding: 'var(--space-4)',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-2)',
            marginBottom: 'var(--space-3)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          墨水余量
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--space-3)'
          }}
        >
          {Object.entries(device.printer.ink).map(([color, level]) => (
            <InkBar key={color} color={color as 'C' | 'M' | 'Y' | 'K'} level={level} />
          ))}
        </div>
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

/**
 * InkBar - 墨水条子组件
 */
interface InkBarProps {
  color: 'C' | 'M' | 'Y' | 'K';
  level: number;
}

function InkBar({ color, level }: InkBarProps) {
  const colorMap = {
    C: { name: '青', hex: 'var(--ink-cyan)' },
    M: { name: '品', hex: 'var(--ink-magenta)' },
    Y: { name: '黄', hex: 'var(--ink-yellow)' },
    K: { name: '黑', hex: 'var(--ink-black)' }
  };

  const config = colorMap[color];
  const isLow = level < 15;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-1">
            {/* 标签 */}
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-3)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              {color}
            </span>

            {/* 条 */}
            <div
              className={`ink-bar ${isLow ? 'low-ink-stripes' : ''}`}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div
                className="ink-bar__fill"
                style={{
                  height: '100%',
                  width: `${level}%`,
                  background: config.hex,
                  transition: 'width var(--transition-normal)'
                }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {config.name}色: {level}%
            {isLow && ' (低于 15%)'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
