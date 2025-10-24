-- 授予 anon 和 authenticated 用户对 printer_instances 表的权限
GRANT ALL ON TABLE printer_instances TO anon;
GRANT ALL ON TABLE printer_instances TO authenticated;
GRANT ALL ON TABLE printer_instances TO service_role;

-- 确保 RLS 已启用
ALTER TABLE printer_instances ENABLE ROW LEVEL SECURITY;

-- 删除所有现有策略
DROP POLICY IF EXISTS "Enable read access for all users" ON printer_instances;
DROP POLICY IF EXISTS "Enable insert access for all users" ON printer_instances;
DROP POLICY IF EXISTS "Enable update access for all users" ON printer_instances;
DROP POLICY IF EXISTS "Enable delete access for all users" ON printer_instances;

-- 创建新的宽松策略（适用于内部管理系统）
CREATE POLICY "Allow all operations for anon users" ON printer_instances
  FOR ALL USING (true) WITH CHECK (true);
