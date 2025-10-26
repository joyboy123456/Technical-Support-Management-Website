-- 授予视图访问权限
-- 允许 anon 和 authenticated 角色查询优化视图

-- 授予 anon 角色访问权限
GRANT SELECT ON v_printer_instance_stats TO anon;
GRANT SELECT ON v_printer_overview TO anon;
GRANT SELECT ON v_printer_by_location TO anon;
GRANT SELECT ON v_printer_by_brand_model TO anon;
GRANT SELECT ON v_router_stats TO anon;
GRANT SELECT ON v_router_overview TO anon;
GRANT SELECT ON v_asset_overview TO anon;
GRANT SELECT ON v_action_trends_30d TO anon;
GRANT SELECT ON v_maintenance_stats TO anon;
GRANT SELECT ON v_low_stock_summary TO anon;

-- 授予 authenticated 角色访问权限
GRANT SELECT ON v_printer_instance_stats TO authenticated;
GRANT SELECT ON v_printer_overview TO authenticated;
GRANT SELECT ON v_printer_by_location TO authenticated;
GRANT SELECT ON v_printer_by_brand_model TO authenticated;
GRANT SELECT ON v_router_stats TO authenticated;
GRANT SELECT ON v_router_overview TO authenticated;
GRANT SELECT ON v_asset_overview TO authenticated;
GRANT SELECT ON v_action_trends_30d TO authenticated;
GRANT SELECT ON v_maintenance_stats TO authenticated;
GRANT SELECT ON v_low_stock_summary TO authenticated;
