import React from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface SupabaseGateProps {
  children: React.ReactNode;
}

/**
 * 严格模式入口守卫
 * - 如果 Supabase 未配置或连接失败，阻止应用加载，显示错误页面
 * - 通过一次轻量查询验证后端可用性与权限
 */
export function SupabaseGate({ children }: SupabaseGateProps) {
  const [status, setStatus] = React.useState<'checking' | 'ok' | 'error'>('checking');
  const [message, setMessage] = React.useState<string>('');

  React.useEffect(() => {
    async function check() {
      if (!isSupabaseConfigured) {
        setMessage('Supabase 未配置：请设置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY 后重试。');
        setStatus('error');
        return;
      }

      try {
        // 轻量验证：查询库存表是否可访问（也可换为 devices）
        const { error } = await supabase
          .from('inventory')
          .select('id')
          .limit(1);

        if (error) {
          setMessage(`无法连接后端或无权限访问：${error.message}`);
          setStatus('error');
          return;
        }

        setStatus('ok');
      } catch (err: any) {
        setMessage(`后端检查异常：${err?.message || String(err)}`);
        setStatus('error');
      }
    }

    check();
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="max-w-md text-center p-6">
          <h1 className="text-2xl font-semibold mb-2">后端不可用</h1>
          <p className="text-muted-foreground mb-4">{message}</p>
          <p className="text-sm text-muted-foreground">请联系管理员或稍后重试。</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}