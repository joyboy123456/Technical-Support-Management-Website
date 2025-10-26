-- 优化统计查询的数据库视图
-- 目标：将前端的统计计算移到数据库层，提升性能

-- 1. 打印机实例统计视图（按状态、位置、品牌型号）
CREATE OR REPLACE VIEW v_printer_instance_stats AS
WITH printer_data AS (
  SELECT
    id,
    printer_model,
    status,
    location,
    -- 解析品牌和型号
    SPLIT_PART(printer_model, '-', 1) as brand,
    SUBSTRING(printer_model FROM POSITION('-' IN printer_model) + 1) as model
  FROM printer_instances
)
SELECT
  brand,
  model,
  status,
  location,
  COUNT(*) as count
FROM printer_data
GROUP BY brand, model, status, location;

-- 2. 打印机概览统计（总数、各状态数量）
CREATE OR REPLACE VIEW v_printer_overview AS
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'in-house') as available,
  COUNT(*) FILTER (WHERE status = 'deployed') as in_use,
  COUNT(*) FILTER (WHERE status = 'idle') as maintenance,
  0 as borrowed -- printer_instances 暂无借出状态
FROM printer_instances;

-- 3. 打印机按位置统计
CREATE OR REPLACE VIEW v_printer_by_location AS
WITH printer_data AS (
  SELECT
    id,
    printer_model,
    location,
    SPLIT_PART(printer_model, '-', 1) as brand,
    SUBSTRING(printer_model FROM POSITION('-' IN printer_model) + 1) as model
  FROM printer_instances
)
SELECT
  location as location_name,
  location as location_id,
  COUNT(*) as count,
  jsonb_agg(
    jsonb_build_object(
      'brand', brand,
      'model', model,
      'count', model_count
    )
    ORDER BY model_count DESC
  ) as models
FROM (
  SELECT
    location,
    brand,
    model,
    COUNT(*) as model_count
  FROM printer_data
  GROUP BY location, brand, model
) grouped
GROUP BY location;

-- 4. 打印机按品牌型号统计
CREATE OR REPLACE VIEW v_printer_by_brand_model AS
WITH printer_data AS (
  SELECT
    SPLIT_PART(printer_model, '-', 1) as brand,
    SUBSTRING(printer_model FROM POSITION('-' IN printer_model) + 1) as model
  FROM printer_instances
)
SELECT
  brand,
  model,
  COUNT(*) as count
FROM printer_data
GROUP BY brand, model
ORDER BY count DESC;

-- 5. 资产概览统计（打印机 + 路由器）
CREATE OR REPLACE VIEW v_asset_overview AS
WITH printer_stats AS (
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'in-house') as available,
    COUNT(*) FILTER (WHERE status = 'deployed') as in_use,
    COUNT(*) FILTER (WHERE status = 'idle') as maintenance
  FROM printer_instances
),
router_stats AS (
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = '可用') as available,
    COUNT(*) FILTER (WHERE status = '使用中' OR status = '运行中') as in_use,
    COUNT(*) FILTER (WHERE status = '维修中' OR status = '维护') as maintenance
  FROM assets
  WHERE asset_type = '路由器'
)
SELECT
  (p.total + r.total) as total_assets,
  (p.available + r.available) as available_assets,
  (p.maintenance + r.maintenance) as maintenance_assets,
  CASE
    WHEN (p.total + r.total) > 0
    THEN ROUND((((p.total + r.total) - (p.available + r.available))::numeric / (p.total + r.total)::numeric * 100), 1)
    ELSE 0
  END as utilization_rate
FROM printer_stats p, router_stats r;

-- 6. 路由器统计视图
CREATE OR REPLACE VIEW v_router_stats AS
SELECT
  status,
  location_id,
  l.name as location_name,
  COUNT(*) as count
FROM assets a
LEFT JOIN locations l ON a.location_id = l.id
WHERE a.asset_type = '路由器'
GROUP BY status, location_id, l.name;

-- 7. 路由器概览统计
CREATE OR REPLACE VIEW v_router_overview AS
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = '可用') as available,
  COUNT(*) FILTER (WHERE status = '使用中' OR status = '运行中') as in_use,
  COUNT(*) FILTER (WHERE status = '维修中' OR status = '维护') as maintenance,
  COUNT(*) FILTER (WHERE status = '借出') as borrowed
FROM assets
WHERE asset_type = '路由器';

-- 8. 操作趋势统计（最近30天按日期聚合）
CREATE OR REPLACE VIEW v_action_trends_30d AS
SELECT
  DATE(at_time) as date,
  COUNT(*) as count
FROM actions
WHERE at_time >= NOW() - INTERVAL '30 days'
GROUP BY DATE(at_time)
ORDER BY date;

-- 9. 维护记录统计
CREATE OR REPLACE VIEW v_maintenance_stats AS
WITH recent_records AS (
  SELECT *
  FROM maintenance_records
  WHERE happened_at >= NOW() - INTERVAL '30 days'
),
issue_types AS (
  SELECT
    CASE
      WHEN LOWER(title) LIKE '%打印质量%' OR LOWER(title) LIKE '%条纹%' OR LOWER(title) LIKE '%模糊%' THEN '打印质量'
      WHEN LOWER(title) LIKE '%卡纸%' OR LOWER(title) LIKE '%进纸%' THEN '进纸问题'
      WHEN LOWER(title) LIKE '%墨%' OR LOWER(title) LIKE '%色带%' OR LOWER(title) LIKE '%耗材%' THEN '耗材问题'
      WHEN LOWER(title) LIKE '%网络%' OR LOWER(title) LIKE '%连接%' THEN '网络问题'
      WHEN LOWER(title) LIKE '%保养%' OR LOWER(title) LIKE '%清洁%' THEN '日常保养'
      ELSE '其他'
    END as issue_type,
    title,
    asset_id,
    happened_at,
    ROW_NUMBER() OVER (ORDER BY happened_at DESC) as row_num
  FROM recent_records
),
issue_type_counts AS (
  SELECT issue_type, COUNT(*) as type_count
  FROM issue_types
  GROUP BY issue_type
)
SELECT
  (SELECT COUNT(*) FROM recent_records) as total_records,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'assetId', asset_id,
        'title', title,
        'happenedAt', happened_at
      )
      ORDER BY happened_at DESC
    )
    FROM issue_types
    WHERE row_num <= 10
  ) as recent_issues,
  (
    SELECT jsonb_agg(
      jsonb_build_object('type', issue_type, 'count', type_count)
      ORDER BY type_count DESC
    )
    FROM issue_type_counts
  ) as top_issue_types;

-- 10. 低库存告警统计
CREATE OR REPLACE VIEW v_low_stock_summary AS
SELECT
  COUNT(*) as low_stock_count
FROM v_stock_levels
WHERE stock_status = '低库存';

-- 创建索引以优化视图查询
CREATE INDEX IF NOT EXISTS idx_printer_instances_status ON printer_instances(status);
CREATE INDEX IF NOT EXISTS idx_printer_instances_location ON printer_instances(location);
CREATE INDEX IF NOT EXISTS idx_printer_instances_model ON printer_instances(printer_model);
CREATE INDEX IF NOT EXISTS idx_actions_at_time ON actions(at_time);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_happened_at ON maintenance_records(happened_at);

-- 添加注释
COMMENT ON VIEW v_printer_instance_stats IS '打印机实例统计：按品牌、型号、状态、位置分组';
COMMENT ON VIEW v_printer_overview IS '打印机概览：总数和各状态数量';
COMMENT ON VIEW v_printer_by_location IS '打印机按位置统计：包含每个位置的型号分布';
COMMENT ON VIEW v_printer_by_brand_model IS '打印机按品牌型号统计';
COMMENT ON VIEW v_asset_overview IS '资产概览：打印机+路由器的总体统计';
COMMENT ON VIEW v_router_stats IS '路由器统计：按状态和位置分组';
COMMENT ON VIEW v_router_overview IS '路由器概览：总数和各状态数量';
COMMENT ON VIEW v_action_trends_30d IS '操作趋势：最近30天按日期聚合';
COMMENT ON VIEW v_maintenance_stats IS '维护记录统计：包含总数、最近问题和问题类型分布';
COMMENT ON VIEW v_low_stock_summary IS '低库存告警统计';
