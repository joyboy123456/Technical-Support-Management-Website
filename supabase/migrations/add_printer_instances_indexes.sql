-- 为 printer_instances 表添加索引以提升查询性能
-- 执行时间: 2024-10-24
-- 用途: 优化统计看板的加载速度

-- 为 status 字段添加索引（用于状态统计）
CREATE INDEX IF NOT EXISTS idx_printer_instances_status 
ON printer_instances(status);

-- 为 location 字段添加索引（用于位置分布统计）
CREATE INDEX IF NOT EXISTS idx_printer_instances_location 
ON printer_instances(location);

-- 为 printer_model 字段添加索引（用于品牌型号统计）
CREATE INDEX IF NOT EXISTS idx_printer_instances_printer_model 
ON printer_instances(printer_model);

-- 复合索引：同时按位置和型号查询（用于位置分布详情）
CREATE INDEX IF NOT EXISTS idx_printer_instances_location_model 
ON printer_instances(location, printer_model);

-- 验证索引创建成功
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'printer_instances' 
-- AND schemaname = 'public';
