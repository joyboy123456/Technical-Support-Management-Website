-- 添加 device_instance_id 字段到 outbound_records 表
ALTER TABLE outbound_records ADD COLUMN IF NOT EXISTS device_instance_id TEXT REFERENCES printer_instances(id);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_outbound_device_instance ON outbound_records(device_instance_id);

-- 添加注释
COMMENT ON COLUMN outbound_records.device_instance_id IS '关联的打印机设备实例ID（可选，用于自动同步设备状态）';
