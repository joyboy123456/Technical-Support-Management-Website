-- 添加 original_location 和 original_owner 字段到 outbound_records 表
-- 这两个字段用于记录设备出库前的原始位置和负责人，便于归还时恢复

-- 添加字段（如果不存在）
ALTER TABLE outbound_records
ADD COLUMN IF NOT EXISTS original_location TEXT,
ADD COLUMN IF NOT EXISTS original_owner TEXT;

-- 添加注释
COMMENT ON COLUMN outbound_records.original_location IS '设备出库前的原始位置';
COMMENT ON COLUMN outbound_records.original_owner IS '设备出库前的原始负责人';

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '✅ outbound_records 表已添加 original_location 和 original_owner 字段！';
END $$;
