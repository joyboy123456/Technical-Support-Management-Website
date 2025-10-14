-- ============================================
-- 启用所有表的行级安全 (RLS)
-- ============================================
-- 创建时间: 2025-10-14
-- 用途: 修复 Supabase Security Advisor 检测到的 RLS 未启用问题
-- 
-- 执行方式:
-- 1. 在 Supabase Studio 中打开 SQL Editor
-- 2. 复制粘贴此脚本并执行
-- 3. 或使用命令: npm run db:exec enable-rls.sql
-- ============================================

-- 启用 RLS
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_records ENABLE ROW LEVEL SECURITY;

-- 验证 RLS 已启用
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'actions',
        'assets', 
        'audit_logs',
        'devices',
        'inventory',
        'issues',
        'locations',
        'maintenance_logs',
        'outbound_records'
    )
ORDER BY tablename;

-- 显示所有表的 RLS 策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
