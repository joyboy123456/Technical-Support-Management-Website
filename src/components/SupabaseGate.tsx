import React from 'react';
import { supabase, isDatabaseConfigured, isPostgresConfigured } from '../lib/supabase';

interface SupabaseGateProps {
  children: React.ReactNode;
}

export default function SupabaseGate({ children }: SupabaseGateProps) {
  const [status, setStatus] = React.useState<'checking' | 'ok' | 'error'>('checking');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    async function check() {
      if (!isDatabaseConfigured) {
        if (isPostgresConfigured) {
          setMessage('PostgreSQL 连接失败：请检查数据库服务器是否运行。');
        } else {
          setMessage('数据库未配置：请设置 PostgreSQL 或 Supabase 连接参数。');
        }
        setStatus('error');
        return;
      }

      try {
        // 轻量验证：查询库存表是否可访问
        const queryBuilder = supabase
          .from('inventory')
          .select('id')
          .limit(1);

        let result: any;
        
        // 检查是否是 PostgreSQL 查询构建器
        if ('execute' in queryBuilder) {
          // PostgreSQL 模式
          result = await queryBuilder.execute();
          if (result.error) {
            setMessage(`PostgreSQL 连接失败：${result.error}`);
            setStatus('error');
            return;
          }
        } else {
          // Supabase 模式
          result = await queryBuilder;
          if (result.error) {
            setMessage(`无法连接后端或无权限访问：${result.error.message}`);
            setStatus('error');
            return;
          }
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