-- supabase/migrations/0007_prevent_duplicate_outbound.sql
-- 防止同一设备有多条未归还的出库记录

-- 创建部分唯一索引：确保每个设备只能有一条状态为'outbound'的记录
-- 这个索引只对status='outbound'的记录生效，已归还的记录不受影响
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_device_outbound 
ON outbound_records(device_id) 
WHERE status = 'outbound';

-- 添加注释
COMMENT ON INDEX idx_unique_device_outbound IS '确保每个设备只能有一条未归还的出库记录';

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '✅ 已创建唯一索引防止重复出库';
  RAISE NOTICE '📋 索引名称: idx_unique_device_outbound';
  RAISE NOTICE '🔒 约束: 每个设备只能有一条status=outbound的记录';
END $$;
