-- 完整的权限修复脚本
-- 适用于阿里云 Supabase

-- 1. 禁用所有表的 RLS（内部系统，暂时禁用）
ALTER TABLE IF EXISTS locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS printer_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS consumables DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS compatibilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sim_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maintenance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sops DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS outbound_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- 2. 授予 anon 角色所有表的完整权限
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- 3. 授予 authenticated 角色所有表的完整权限
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 4. 授予 service_role 角色所有权限
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 5. 确保视图的访问权限
GRANT SELECT ON v_printer_counts TO anon, authenticated;
GRANT SELECT ON v_router_counts TO anon, authenticated;
GRANT SELECT ON v_sim_counts TO anon, authenticated;
GRANT SELECT ON v_sim_public TO anon, authenticated;
GRANT SELECT ON v_stock_levels TO anon, authenticated;
GRANT SELECT ON v_outbound_stats TO anon, authenticated;
GRANT SELECT ON v_low_stock_alerts TO anon, authenticated;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '✅ 权限修复完成！';
  RAISE NOTICE '📊 所有表已禁用 RLS';
  RAISE NOTICE '🔑 anon, authenticated, service_role 角色已授予完整权限';
END $$;
