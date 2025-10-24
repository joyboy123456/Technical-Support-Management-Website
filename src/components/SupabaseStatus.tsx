import React from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toast } from 'sonner';

export function SupabaseStatus() {
  React.useEffect(() => {
    async function runCheck() {
      if (!isSupabaseConfigured) {
        toast.warning('Supabase 未配置，当前使用本地内存数据');
        return;
      }

      try {
        const { data, error, count } = await supabase
          .from('devices')
          .select('id', { count: 'exact' })
          .limit(1);

        if (error) {
          toast.error(`Supabase 已配置但检查失败：${error.message}`);
          return;
        }

        // 连接正常，显示简要信息
        if (typeof count === 'number') {
          toast.success(`Supabase 已配置，连接正常（devices 表记录数：${count}）`);
        } else {
          toast.success('Supabase 已配置，连接正常');
        }
      } catch (err: any) {
        toast.error(`Supabase 检查异常：${err?.message || String(err)}`);
      }
    }

    runCheck();
  }, []);

  return null;
}