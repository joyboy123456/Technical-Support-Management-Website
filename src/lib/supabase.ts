import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// 检查是否配置了真实的 Supabase 凭据
const disableSupabase = import.meta.env.VITE_DISABLE_SUPABASE === 'true';

const hasValidConfig = 
  !disableSupabase &&
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url';

// 如果没有配置，使用一个真实格式的占位符 URL（demo 模式下不会真正调用）
const supabaseUrl = hasValidConfig 
  ? import.meta.env.VITE_SUPABASE_URL 
  : 'https://xyzcompany.supabase.co';

const supabaseAnonKey = hasValidConfig
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.dGVzdA';

if (!hasValidConfig) {
  console.warn('⚠️ Supabase 未配置：正在使用本地模拟数据模式');
  console.warn('💡 要使用真实数据库，请配置 .env 文件中的 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// 导出配置状态，供其他模块判断
export const isSupabaseConfigured = hasValidConfig;
