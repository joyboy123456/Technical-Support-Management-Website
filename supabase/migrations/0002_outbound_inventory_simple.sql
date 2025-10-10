-- supabase/migrations/0002_outbound_inventory_simple.sql
-- 出库管理和库存系统数据库迁移脚本（简化版，无外键约束）

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 相纸库存 (JSON格式: {"DNP DS620": {"4x6": 100, "5x7": 50}, ...})
  paper_stock JSONB DEFAULT '{}',

  -- Epson墨水库存
  epson_ink_stock JSONB DEFAULT '{"C": 0, "M": 0, "Y": 0, "K": 0}',

  -- 设备配件库存
  equipment_stock JSONB DEFAULT '{
    "routers": 0,
    "powerStrips": 0,
    "usbCables": 0,
    "networkCables": 0,
    "adapters": 0
  }',

  last_updated TIMESTAMPTZ DEFAULT NOW(),
  remark TEXT
);

-- 出库记录表
CREATE TABLE IF NOT EXISTS outbound_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 基本信息
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  operator TEXT NOT NULL,

  -- 出库物资 (JSON格式，包含打印机型号、相纸、配件等)
  items JSONB NOT NULL DEFAULT '{}',

  -- 备注
  notes TEXT,

  -- 状态
  status TEXT NOT NULL DEFAULT 'outbound' CHECK (status IN ('outbound', 'returned')),

  -- 归还信息 (JSON格式)
  return_info JSONB
);

-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 操作类型
  action_type TEXT NOT NULL,

  -- 实体类型和ID
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,

  -- 操作员
  operator TEXT NOT NULL,

  -- 详细信息
  details JSONB DEFAULT '{}',

  -- IP地址（可选）
  ip_address TEXT,

  -- 用户代理（可选）
  user_agent TEXT
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_outbound_records_device_id ON outbound_records(device_id);
CREATE INDEX IF NOT EXISTS idx_outbound_records_status ON outbound_records(status);
CREATE INDEX IF NOT EXISTS idx_outbound_records_created_at ON outbound_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outbound_records_operator ON outbound_records(operator);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operator ON audit_logs(operator);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);

-- 创建或替换更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新时间触发器
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_outbound_records_updated_at ON outbound_records;
CREATE TRIGGER update_outbound_records_updated_at
  BEFORE UPDATE ON outbound_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 初始化库存数据（如果表为空）
INSERT INTO inventory (paper_stock, epson_ink_stock, equipment_stock, last_updated)
SELECT
  '{
    "DNP DS620": {"4x6": 500, "5x7": 200, "6x8": 100},
    "DNP DS820": {"8x10": 150, "8x12": 100},
    "诚研 CP3800DW": {"4x6": 300, "5x7": 150},
    "西铁城 CX-02": {"4x6": 250}
  }'::jsonb,
  '{"C": 10, "M": 10, "Y": 10, "K": 10}'::jsonb,
  '{
    "routers": 20,
    "powerStrips": 30,
    "usbCables": 50,
    "networkCables": 40,
    "adapters": 25
  }'::jsonb,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM inventory LIMIT 1);

-- 行级安全策略 (RLS)
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "允许所有人读取库存" ON inventory;
DROP POLICY IF EXISTS "允许所有人更新库存" ON inventory;
DROP POLICY IF EXISTS "允许所有人插入库存" ON inventory;
DROP POLICY IF EXISTS "允许所有人读取出库记录" ON outbound_records;
DROP POLICY IF EXISTS "允许所有人创建出库记录" ON outbound_records;
DROP POLICY IF EXISTS "允许所有人更新出库记录" ON outbound_records;
DROP POLICY IF EXISTS "允许所有人读取审计日志" ON audit_logs;
DROP POLICY IF EXISTS "允许所有人创建审计日志" ON audit_logs;

-- 创建新策略（允许所有操作，适用于内部系统）
CREATE POLICY "允许所有人读取库存"
  ON inventory
  FOR SELECT
  USING (true);

CREATE POLICY "允许所有人更新库存"
  ON inventory
  FOR UPDATE
  USING (true);

CREATE POLICY "允许所有人插入库存"
  ON inventory
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "允许所有人读取出库记录"
  ON outbound_records
  FOR SELECT
  USING (true);

CREATE POLICY "允许所有人创建出库记录"
  ON outbound_records
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "允许所有人更新出库记录"
  ON outbound_records
  FOR UPDATE
  USING (true);

CREATE POLICY "允许所有人读取审计日志"
  ON audit_logs
  FOR SELECT
  USING (true);

CREATE POLICY "允许所有人创建审计日志"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- 出库统计视图
CREATE OR REPLACE VIEW v_outbound_stats AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  status,
  COUNT(*) as count,
  COUNT(DISTINCT device_id) as unique_devices,
  COUNT(DISTINCT operator) as unique_operators
FROM outbound_records
GROUP BY DATE_TRUNC('day', created_at), status
ORDER BY date DESC;

-- 低库存告警视图
CREATE OR REPLACE VIEW v_low_stock_alerts AS
WITH ink_levels AS (
  SELECT
    'Epson墨水' as category,
    key as item_name,
    (value#>>'{}')::int as current_stock,
    10 as threshold
  FROM inventory, jsonb_each(epson_ink_stock)
  WHERE (value#>>'{}')::int < 10
),
equipment_levels AS (
  SELECT
    '设备配件' as category,
    key as item_name,
    (value#>>'{}')::int as current_stock,
    CASE
      WHEN key = 'routers' THEN 5
      WHEN key = 'powerStrips' THEN 10
      WHEN key = 'usbCables' THEN 20
      WHEN key = 'networkCables' THEN 15
      WHEN key = 'adapters' THEN 8
      ELSE 10
    END as threshold
  FROM inventory, jsonb_each(equipment_stock)
  WHERE (value#>>'{}')::int < CASE
      WHEN key = 'routers' THEN 5
      WHEN key = 'powerStrips' THEN 10
      WHEN key = 'usbCables' THEN 20
      WHEN key = 'networkCables' THEN 15
      WHEN key = 'adapters' THEN 8
      ELSE 10
    END
)
SELECT * FROM ink_levels
UNION ALL
SELECT * FROM equipment_levels
ORDER BY category, item_name;

-- 注释
COMMENT ON TABLE inventory IS '库存表，存储相纸、墨水、设备配件等库存信息';
COMMENT ON TABLE outbound_records IS '出库记录表，记录设备和配件的出库、归还信息';
COMMENT ON TABLE audit_logs IS '审计日志表，记录所有重要操作';
COMMENT ON VIEW v_outbound_stats IS '出库统计视图，按日期和状态统计出库记录';
COMMENT ON VIEW v_low_stock_alerts IS '低库存告警视图，显示库存低于阈值的物资';

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '✅ 出库系统数据库迁移完成！';
  RAISE NOTICE '📦 已创建表: inventory, outbound_records, audit_logs';
  RAISE NOTICE '📊 已创建视图: v_outbound_stats, v_low_stock_alerts';
  RAISE NOTICE '🔒 已启用 RLS 安全策略';
  RAISE NOTICE '📝 初始库存数据已插入';
END $$;
