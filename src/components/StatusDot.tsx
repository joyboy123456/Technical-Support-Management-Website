import React from 'react';
import { Device } from '../data/devices';

interface StatusDotProps {
  /**
   * 设备状态
   */
  status: Device['status'];
  /**
   * 上次刷新时间 (相对时间文本，如 "3 分钟前")
   */
  lastUpdate?: string;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 是否显示时间戳
   */
  showTime?: boolean;
}

/**
 * StatusDot - 状态指示器组件
 *
 * 根据 Anthropic-like 设计原则:
 * - 使用小圆点表示状态 (8px)
 * - 文本统一使用灰色 (--text-2)
 * - 可选显示相对时间
 *
 * @example
 * ```tsx
 * <StatusDot status="运行中" lastUpdate="3 分钟前" showTime />
 * ```
 */
export function StatusDot({
  status,
  lastUpdate,
  className = '',
  showTime = true
}: StatusDotProps) {
  const statusConfig = {
    '运行中': {
      color: 'var(--status-positive)',
      label: '运行中'
    },
    '维护': {
      color: 'var(--status-warning)',
      label: '维护中'
    },
    '离线': {
      color: 'var(--status-neutral)',
      label: '离线'
    }
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-2 text-sm ${className}`}
      style={{ color: 'var(--text-2)' }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.color }}
        aria-hidden="true"
      />
      <span className="font-medium">{config.label}</span>
      {showTime && lastUpdate && (
        <>
          <span aria-hidden="true">·</span>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
            {lastUpdate}
          </span>
        </>
      )}
    </span>
  );
}

/**
 * 计算相对时间的辅助函数
 * @param date - ISO 时间字符串或 Date 对象
 * @returns 相对时间文本 (如 "3 分钟前")
 */
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours} 小时前`;
  } else if (diffDays < 30) {
    return `${diffDays} 天前`;
  } else {
    return past.toLocaleDateString('zh-CN');
  }
}
