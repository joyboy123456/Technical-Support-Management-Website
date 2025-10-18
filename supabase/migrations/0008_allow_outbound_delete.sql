-- 允许删除出库记录
ALTER TABLE outbound_records ENABLE ROW LEVEL SECURITY;

-- 删除旧策略以避免重复
DROP POLICY IF EXISTS "允许所有人删除出库记录" ON outbound_records;

-- 创建新的删除策略（仅限内部系统，无条件放行）
CREATE POLICY "允许所有人删除出库记录"
  ON outbound_records
  FOR DELETE
  USING (true);
