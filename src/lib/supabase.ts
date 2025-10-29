import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { postgres, shouldUsePostgres } from './postgres';

// 检查是否应该使用 PostgreSQL
const usePostgres = shouldUsePostgres();

// 检查是否配置了真实的 Supabase 凭据
const hasValidSupabaseConfig = 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url';

// 检查是否有有效的数据库配置（PostgreSQL 或 Supabase）
const hasValidConfig = usePostgres || hasValidSupabaseConfig;

// 如果没有配置，使用一个真实格式的占位符 URL（demo 模式下不会真正调用）
const supabaseUrl = hasValidSupabaseConfig 
  ? import.meta.env.VITE_SUPABASE_URL 
  : 'https://xyzcompany.supabase.co';

const supabaseAnonKey = hasValidSupabaseConfig
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.dGVzdA';

if (usePostgres) {
  console.log('🐘 使用 PostgreSQL 数据库连接');
} else if (!hasValidSupabaseConfig) {
  console.warn('⚠️ Supabase 未配置：正在使用本地模拟数据模式');
  console.warn('💡 要使用真实数据库，请配置 .env 文件中的 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
}

// 创建数据库客户端
export const supabase = usePostgres ? postgres : createClient<Database>(supabaseUrl, supabaseAnonKey);

// 导出配置状态，供其他模块判断
export const isSupabaseConfigured = hasValidSupabaseConfig;
export const isPostgresConfigured = usePostgres;
export const isDatabaseConfigured = hasValidConfig;
