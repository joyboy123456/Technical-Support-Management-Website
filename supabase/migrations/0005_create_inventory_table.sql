-- 更新库存表，添加缺失字段
-- inventory 表已存在，只添加新字段

-- 添加 location 字段（如果不存在）
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '杭州调试间';

-- 添加 notes 字段（如果不存在）
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 添加注释
COMMENT ON TABLE inventory IS '调试间库存管理表';
COMMENT ON COLUMN inventory.location IS '位置/调试间名称';
COMMENT ON COLUMN inventory.paper_stock IS '按打印机型号分类的相纸库存';
COMMENT ON COLUMN inventory.epson_ink_stock IS 'EPSON 墨水库存（通用）';
COMMENT ON COLUMN inventory.equipment_stock IS '设备配件库存';
COMMENT ON COLUMN inventory.notes IS '备注信息';

-- 创建更新时间触发器（如果不存在）
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location);
CREATE INDEX IF NOT EXISTS idx_inventory_last_updated ON inventory(last_updated);

-- 更新现有数据，确保有默认值
UPDATE inventory
SET location = '杭州调试间'
WHERE location IS NULL;

-- 如果表中没有数据，插入默认库存
INSERT INTO inventory (
  location,
  last_updated,
  paper_stock,
  epson_ink_stock,
  equipment_stock,
  notes
)
SELECT
  '杭州调试间',
  CURRENT_TIMESTAMP,
  '{
    "EPSON-L18058": {"A3": 280},
    "EPSON-L8058": {"A4": 450},
    "DNP-微印创": {"6寸": 300, "8寸": 200},
    "DNP-自购": {"6寸": 250, "8寸": 180},
    "DNP-锦联": {"6寸": 320, "8寸": 220}
  }'::jsonb,
  '{
    "C": 8,
    "M": 6,
    "Y": 7,
    "K": 12
  }'::jsonb,
  '{
    "routers": 15,
    "powerStrips": 20,
    "usbCables": 25,
    "networkCables": 30,
    "adapters": 18
  }'::jsonb,
  '库存充足，定期检查有效期'
WHERE NOT EXISTS (SELECT 1 FROM inventory LIMIT 1);
