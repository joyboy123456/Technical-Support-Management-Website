-- ============================================
-- 修复函数 search_path 安全问题
-- ============================================
-- 创建时间: 2025-10-14
-- 用途: 修复 Supabase Database Linter 检测到的 search_path 安全警告
-- 参考: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
-- 
-- 问题: 函数的 search_path 是可变的，可能被攻击者利用
-- 解决: 设置 search_path = '' 强制使用完全限定的对象名称
-- ============================================

-- 1. 修复 audit_trigger_function
ALTER FUNCTION public.audit_trigger_function() SET search_path = '';

-- 2. 修复 check_compatibility
-- 注意: 参数类型是 UUID, UUID, code_type
ALTER FUNCTION public.check_compatibility(UUID, UUID, code_type) SET search_path = '';

-- 3. 修复 check_code_binding
-- 注意: 参数类型是 UUID, UUID
ALTER FUNCTION public.check_code_binding(UUID, UUID) SET search_path = '';

-- 4. 修复 update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

-- 5. 修复 update_devices_updated_at
ALTER FUNCTION public.update_devices_updated_at() SET search_path = '';

-- 6. 修复 perform_action_transaction
-- 注意: 只有一个 JSONB 参数
ALTER FUNCTION public.perform_action_transaction(JSONB) SET search_path = '';

-- ============================================
-- 验证修复结果
-- ============================================

-- 查询所有函数的 search_path 设置
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    CASE 
        WHEN p.proconfig IS NULL THEN 'NOT SET (默认)'
        WHEN array_to_string(p.proconfig, ', ') LIKE '%search_path=%' THEN 
            array_to_string(p.proconfig, ', ')
        ELSE 'NOT SET (其他配置)'
    END AS search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN (
        'audit_trigger_function',
        'check_compatibility',
        'check_code_binding',
        'update_updated_at_column',
        'update_devices_updated_at',
        'perform_action_transaction'
    )
ORDER BY p.proname;

-- ============================================
-- 预期结果
-- ============================================
-- 所有函数的 search_path_config 应该显示: search_path=
-- 这表示 search_path 被设置为空字符串，安全问题已修复
