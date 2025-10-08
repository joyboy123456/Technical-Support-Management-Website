import React from 'react';
import { RefreshCw, Upload, Download, Plus } from 'lucide-react';
import { Button } from './ui/button';

interface TopToolbarProps {
  /**
   * 刷新回调
   */
  onRefresh?: () => void;
  /**
   * 导入回调
   */
  onImport?: () => void;
  /**
   * 导出回调
   */
  onExport?: () => void;
  /**
   * 新建设备回调
   */
  onCreateDevice?: () => void;
  /**
   * 是否正在刷新
   */
  isRefreshing?: boolean;
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * TopToolbar - 顶部工具条组件
 *
 * 根据 Anthropic-like 设计原则:
 * - 左侧: 刷新、导入、导出 (灰度按钮)
 * - 右侧: 新建设备 (主按钮)
 * - 浅灰背景 (--surface-2)
 * - 统一圆角 8px
 *
 * @example
 * ```tsx
 * <TopToolbar
 *   onRefresh={handleRefresh}
 *   onCreateDevice={handleCreate}
 *   isRefreshing={loading}
 * />
 * ```
 */
export function TopToolbar({
  onRefresh,
  onImport,
  onExport,
  onCreateDevice,
  isRefreshing = false,
  className = ''
}: TopToolbarProps) {
  return (
    <div
      className={`toolbar no-print ${className}`}
      role="toolbar"
      aria-label="设备操作工具栏"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--surface-2)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        gap: 'var(--space-4)',
        flexWrap: 'wrap'
      }}
    >
      {/* 左侧操作组 */}
      <div
        className="flex gap-2 items-center"
        style={{
          borderRight: '1px solid var(--border-subtle)',
          paddingRight: 'var(--space-4)'
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="刷新设备列表"
          className="focus-ring"
          style={{
            color: 'var(--text-2)',
            transition: 'all var(--transition-fast)'
          }}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          刷新
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onImport}
          aria-label="批量导入设备"
          className="focus-ring hidden sm:flex"
          style={{
            color: 'var(--text-2)',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
          导入
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          aria-label="导出设备数据"
          className="focus-ring hidden sm:flex"
          style={{
            color: 'var(--text-2)',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Download className="w-4 h-4 mr-2" aria-hidden="true" />
          导出
        </Button>
      </div>

      {/* 右侧主操作 */}
      <Button
        size="sm"
        onClick={onCreateDevice}
        aria-label="新建设备"
        className="focus-ring ml-auto"
        style={{
          background: 'var(--interactive-primary)',
          color: 'var(--text-inverse)',
          transition: 'all var(--transition-fast)',
          fontWeight: 'var(--font-weight-medium)'
        }}
      >
        <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
        新建设备
      </Button>

      {/* 内联样式 */}
      <style jsx>{`
        .toolbar button:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        .toolbar button:active {
          transform: scale(0.98);
        }

        .toolbar button:focus-visible {
          outline: 2px solid var(--focus);
          outline-offset: var(--focus-offset);
        }
      `}</style>
    </div>
  );
}
