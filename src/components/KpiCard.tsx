import React from 'react';
import { Device } from '../data/devices';

interface KpiCardProps {
  /**
   * KPI 标签文本
   */
  label: string;
  /**
   * KPI 数值
   */
  value: number;
  /**
   * 筛选键值 (用于点击筛选)
   */
  filterKey: 'all' | Device['status'];
  /**
   * 点击回调
   */
  onClick?: (filterKey: string) => void;
  /**
   * 是否处于活跃状态 (已选中)
   */
  isActive?: boolean;
  /**
   * 可选的趋势数据 (相比上周/上月的变化百分比)
   */
  trend?: number;
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * KpiCard - KPI 统计卡片组件
 *
 * 根据 Anthropic-like 设计原则:
 * - 白底 + 1px 细边框 (无彩底)
 * - 大号数值 (32-36px) + 小标签 (12-13px)
 * - 可点击触发筛选
 * - 悬浮效果微妙
 *
 * @example
 * ```tsx
 * <KpiCard
 *   label="设备总数"
 *   value={42}
 *   filterKey="all"
 *   onClick={(key) => handleFilter(key)}
 * />
 * ```
 */
export function KpiCard({
  label,
  value,
  filterKey,
  onClick,
  isActive = false,
  trend,
  className = ''
}: KpiCardProps) {
  const handleClick = () => {
    onClick?.(filterKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`筛选 ${label}: ${value} 台设备`}
      aria-pressed={isActive}
      className={`
        kpi-card
        ${isActive ? 'border-interactive-primary shadow-sm' : ''}
        ${className}
      `}
      style={{
        background: 'var(--surface-1)',
        border: isActive
          ? '1px solid var(--interactive-primary)'
          : '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5) var(--space-4)', /* 移动端增加垂直内边距 */
        cursor: 'pointer',
        transition: 'all var(--transition-normal)',
        outline: 'none'
      }}
    >
      {/* 数值区域 */}
      <div className="flex items-baseline gap-2">
        <div
          className="tabular-nums text-3xl sm:text-4xl"
          style={{
            fontWeight: 'var(--font-weight-semibold)',
            lineHeight: 'var(--line-height-tight)',
            color: 'var(--text-1)'
          }}
        >
          {value}
        </div>

        {/* 趋势指示 (可选) */}
        {trend !== undefined && trend !== 0 && (
          <span
            className="text-xs"
            style={{
              color: trend > 0 ? 'var(--status-positive)' : 'var(--status-error)'
            }}
            aria-label={`${trend > 0 ? '增长' : '下降'} ${Math.abs(trend)}%`}
          >
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* 标签 */}
      <div
        className="mt-2 text-sm sm:text-xs"
        style={{
          color: 'var(--text-2)',
          fontWeight: 'var(--font-weight-medium)'
        }}
      >
        {label}
      </div>

      {/* 焦点环样式 */}
      <style jsx>{`
        .kpi-card:focus-visible {
          outline: 2px solid var(--focus);
          outline-offset: var(--focus-offset);
        }

        .kpi-card:hover {
          border-color: var(--border-medium);
          box-shadow: var(--shadow-sm);
          transform: translateY(-1px);
        }

        .kpi-card:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

/**
 * KpiCardGroup - KPI 卡片组容器
 * 提供响应式栅格布局
 */
interface KpiCardGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function KpiCardGroup({ children, className = '' }: KpiCardGroupProps) {
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 ${className}`}
      role="group"
      aria-label="设备统计概览"
    >
      {children}
    </div>
  );
}
