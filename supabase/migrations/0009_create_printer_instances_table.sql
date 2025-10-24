-- 创建打印机设备实例表
CREATE TABLE IF NOT EXISTS printer_instances (
  id TEXT PRIMARY KEY,
  printer_model TEXT NOT NULL,
  serial_number TEXT,
  status TEXT NOT NULL CHECK (status IN ('in-house', 'deployed', 'idle')),
  location TEXT NOT NULL,
  deployed_date TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_printer_instances_model ON printer_instances(printer_model);
CREATE INDEX IF NOT EXISTS idx_printer_instances_status ON printer_instances(status);

-- 启用 RLS
ALTER TABLE printer_instances ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（允许所有人读写，适用于内部管理系统）
CREATE POLICY "Allow all read access" ON printer_instances
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert access" ON printer_instances
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update access" ON printer_instances
  FOR UPDATE USING (true);

CREATE POLICY "Allow all delete access" ON printer_instances
  FOR DELETE USING (true);

-- 插入初始数据（从硬编码数据迁移）
INSERT INTO printer_instances (id, printer_model, serial_number, status, location, deployed_date, notes) VALUES
  -- DNP DS-RX1HS (自购)
  ('自购DNP_01', 'DNP-自购', NULL, 'deployed', '绝缘客户', NULL, '外放中'),
  ('无界DNP-1', 'DNP-自购', NULL, 'deployed', '2号影视频（横店）', '2024-09-24', '原自购DNP'),
  ('无界DNP-2', 'DNP-自购', NULL, 'deployed', '西安', '2024-08-22', '原自购DNP'),
  ('无界DNP-3', 'DNP-自购', NULL, 'deployed', '上海', '2024-10-16', '10/15采购'),
  ('DNP黑色', 'DNP-自购', NULL, 'deployed', '投放点', '2024-07-17', '黑色机'),
  
  -- DNP DS-RX1HS (锦联)
  ('DNP 2号机', 'DNP-锦联', NULL, 'deployed', '锦联', NULL, '外放锦联厂商'),
  
  -- DNP DS-RX1HS (微印创)
  ('DNP 5号机', 'DNP-微印创', NULL, 'deployed', '微印创', NULL, '外放微印创厂商'),
  
  -- EPSON L8058
  ('EPSON-05', 'EPSON-L8058', NULL, 'deployed', '西溪湿地', '2024-09-26', '魔镜6号机'),
  ('EPSON-06', 'EPSON-L8058', NULL, 'deployed', '海南投放', NULL, '外放中'),
  ('DYJ01', 'EPSON-L8058', NULL, 'in-house', '展厅/调试间', NULL, '在库可用'),
  ('DYJ02', 'EPSON-L8058', NULL, 'in-house', '展厅/调试间', NULL, '在库可用'),
  ('DYJ03', 'EPSON-L8058', NULL, 'in-house', '展厅/调试间', NULL, '在库可用'),
  ('DYJ04', 'EPSON-L8058', NULL, 'in-house', '展厅/调试间', NULL, '在库可用'),
  
  -- EPSON L18058
  ('EPSON-L18058-1', 'EPSON-L18058', NULL, 'deployed', '锦联（海报机用）', NULL, '寄出给锦联'),
  ('EPSON-L18058-2', 'EPSON-L18058', NULL, 'idle', '调试间', NULL, '闲置'),
  ('EPSON-L18058-3', 'EPSON-L18058', NULL, 'idle', '调试间', NULL, '闲置'),
  
  -- 西铁城 CX-02
  ('CX-02-1', '西铁城CX-02', NULL, 'in-house', '调试间AOC机器', NULL, '在库使用'),
  ('CX-02-2', '西铁城CX-02', NULL, 'in-house', '调试间旧5号机', NULL, '在库使用'),
  ('CX-02-3', '西铁城CX-02', NULL, 'in-house', '调试间', NULL, '8/22寄回未开箱'),
  ('CX-02-4', '西铁城CX-02', NULL, 'in-house', '展厅7号机', NULL, '在库使用'),
  ('CX-02-5', '西铁城CX-02', NULL, 'deployed', '锦联', NULL, '用于卡死问题复现'),
  
  -- HITI 诚研 P525L
  ('HITI-01', 'HITI诚研P525L', NULL, 'in-house', '展厅/调试间', NULL, '在库'),
  ('HITI-02', 'HITI诚研P525L', NULL, 'idle', '调试间', NULL, '闲置'),
  ('HITI-03', 'HITI诚研P525L', NULL, 'in-house', '展厅/调试间', NULL, '在库')
ON CONFLICT (id) DO NOTHING;
