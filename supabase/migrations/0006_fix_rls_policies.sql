-- ========================================
-- 修复 RLS 策略 - 开发环境配置
-- ========================================
-- 创建时间: 2025-10-14
-- 用途: 为 devices, maintenance_logs, issues 表配置访问权限
--
-- 执行方式:
-- 方式 1: 使用 db-migrate.js
--   将此文件复制到 supabase/migrations/ 目录并重命名为 0006_fix_rls.sql
--   然后运行: npm run migrate
--
-- 方式 2: 在 Supabase 控制台手动执行
--   访问 https://supabase.opentrust.net
--   进入 SQL Editor，粘贴并执行此文件内容
-- ========================================

-- ========================================
-- 方案 1: 禁用 RLS（开发环境快速方案）
-- ========================================
-- 适用于开发环境，允许所有访问
-- ⚠️ 生产环境不推荐使用

ALTER TABLE IF EXISTS devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maintenance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS issues DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 方案 2: 配置 RLS 策略（生产环境推荐）
-- ========================================
-- 如果你想使用 RLS 策略而不是完全禁用，请注释掉上面的方案 1
-- 然后取消注释下面的方案 2

/*
-- 先删除可能存在的旧策略
DROP POLICY IF EXISTS "Enable all access for devices" ON devices;
DROP POLICY IF EXISTS "Enable all access for maintenance_logs" ON maintenance_logs;
DROP POLICY IF EXISTS "Enable all access for issues" ON issues;

-- 创建新的 RLS 策略（允许所有操作）
CREATE POLICY "Enable all access for devices" ON devices
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for maintenance_logs" ON maintenance_logs
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for issues" ON issues
FOR ALL
USING (true)
WITH CHECK (true);

-- 启用 RLS
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
*/

-- ========================================
-- 验证配置
-- ========================================
-- 查看当前 RLS 状态
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('devices', 'maintenance_logs', 'issues', 'inventory', 'outbound_records', 'audit_logs')
ORDER BY tablename;

-- 查看现有策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('devices', 'maintenance_logs', 'issues', 'inventory', 'outbound_records', 'audit_logs')
ORDER BY tablename, policyname;
