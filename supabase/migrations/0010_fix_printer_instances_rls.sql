-- 删除旧的 RLS 策略
DROP POLICY IF EXISTS "Allow all read access" ON printer_instances;
DROP POLICY IF EXISTS "Allow all insert access" ON printer_instances;
DROP POLICY IF EXISTS "Allow all update access" ON printer_instances;
DROP POLICY IF EXISTS "Allow all delete access" ON printer_instances;

-- 重新创建 RLS 策略（使用正确的语法）
CREATE POLICY "Enable read access for all users" ON printer_instances
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON printer_instances
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON printer_instances
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON printer_instances
  FOR DELETE USING (true);
