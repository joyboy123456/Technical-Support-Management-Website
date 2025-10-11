-- 创建设备表（用于设备管理功能）
-- 先删除可能存在的视图，然后创建表

-- 1. 删除现有的视图（如果存在）
DROP VIEW IF EXISTS issues CASCADE;
DROP VIEW IF EXISTS maintenance_logs CASCADE;
DROP VIEW IF EXISTS devices CASCADE;

-- 2. 创建设备表
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  serial TEXT NOT NULL,
  printer_model_field TEXT, -- 打印机型号字段（用于兼容前端）
  location TEXT NOT NULL,
  owner TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('运行中', '离线', '维护')),
  cover_image TEXT, -- 封面图
  images JSONB DEFAULT '[]', -- 设备相册（JSON数组）
  printer_model TEXT NOT NULL,
  printer_paper TEXT NOT NULL CHECK (printer_paper IN ('A4', 'A3')),
  printer_connect TEXT NOT NULL CHECK (printer_connect IN ('USB', 'Wi-Fi')),
  printer_paper_stock INTEGER NOT NULL DEFAULT 0,
  printer_ink_c INTEGER NOT NULL DEFAULT 0,
  printer_ink_m INTEGER NOT NULL DEFAULT 0,
  printer_ink_y INTEGER NOT NULL DEFAULT 0,
  printer_ink_k INTEGER NOT NULL DEFAULT 0,
  next_maintenance TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建维护日志表
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('维护', '故障', '耗材', '其他')),
  note TEXT NOT NULL,
  executor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建故障记录表
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('处理中', '已解决')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 创建索引
CREATE INDEX idx_maintenance_logs_device_id ON maintenance_logs(device_id);
CREATE INDEX idx_issues_device_id ON issues(device_id);
CREATE INDEX idx_devices_location ON devices(location);
CREATE INDEX idx_devices_status ON devices(status);

-- 6. 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_devices_updated_at ON devices;
CREATE TRIGGER trigger_update_devices_updated_at
BEFORE UPDATE ON devices
FOR EACH ROW
EXECUTE FUNCTION update_devices_updated_at();

-- 7. 插入种子数据
INSERT INTO devices (id, name, model, serial, printer_model_field, location, owner, status, printer_model, printer_paper, printer_connect, printer_paper_stock, printer_ink_c, printer_ink_m, printer_ink_y, printer_ink_k, next_maintenance) VALUES
('dev-01', '魔镜1号', '魔镜1号', 'SN-01-2025', 'EPSON-L8058', '杭州展厅A区', '张三', '运行中', 'EPSON-L8058', 'A4', 'Wi-Fi', 120, 76, 64, 58, 83, '2025-11-15'),
('dev-02', '魔镜2号', '魔镜2号', 'SN-02-2025', 'EPSON-L8058', '杭州展厅B区', '李四', '维护', 'EPSON-L18058', 'A3', 'USB', 60, 40, 52, 47, 61, '2025-10-25'),
('dev-03', '魔镜3号', '魔镜3号', 'SN-03-2025', 'EPSON-L8058', '上海展厅A区', '王五', '运行中', 'EPSON-L8058', 'A4', 'Wi-Fi', 95, 88, 92, 76, 94, '2025-12-01'),
('dev-04', '魔镜4号', '魔镜4号', 'SN-04-2025', 'EPSON-L8058', '上海展厅B区', '赵六', '离线', 'EPSON-L18058', 'A3', 'USB', 25, 15, 23, 18, 31, '2025-10-30'),
('dev-05', '魔镜5号', '魔镜5号', 'SN-05-2025', 'EPSON-L8058', '北京展厅A区', '孙七', '运行中', 'EPSON-L8058', 'A4', 'Wi-Fi', 80, 65, 71, 58, 79, '2025-11-20'),
('dev-06', '魔镜6号', '魔镜6号', 'SN-06-2025', 'EPSON-L8058', '北京展厅B区', '周八', '维护', 'EPSON-L18058', 'A3', 'USB', 40, 35, 42, 38, 46, '2025-10-28'),
('dev-07', '魔镜7号', '魔镜7号', 'SN-07-2025', 'EPSON-L8058', '深圳展厅A区', '吴九', '运行中', 'EPSON-L8058', 'A4', 'Wi-Fi', 110, 82, 87, 73, 91, '2025-12-05'),
('dev-08', '魔镜8号', '魔镜8号', 'SN-08-2025', 'EPSON-L8058', '深圳展厅B区', '郑十', '运行中', 'EPSON-L18058', 'A3', 'USB', 75, 56, 63, 49, 72, '2025-11-25'),
('dev-09', '魔镜9号', '魔镜9号', 'SN-09-2025', 'EPSON-L8058', '广州展厅A区', '冯十一', '离线', 'EPSON-L8058', 'A4', 'Wi-Fi', 20, 12, 18, 15, 25, '2025-11-10'),
('dev-10', '魔镜10号', '魔镜10号', 'SN-10-2025', 'EPSON-L8058', '广州展厅B区', '陈十二', '运行中', 'EPSON-L18058', 'A3', 'USB', 85, 69, 74, 66, 81, '2025-12-10');

-- 8. 插入维护日志
INSERT INTO maintenance_logs (device_id, date, type, note, executor) VALUES
('dev-01', '2025-09-01', '维护', '清洁打印头', '张三'),
('dev-01', '2025-09-20', '耗材', '补充相纸 100 张', '李四'),
('dev-02', '2025-09-28', '故障', '走纸不顺；已清理导轨', '王五'),
('dev-03', '2025-09-15', '维护', '系统更新', '王五'),
('dev-04', '2025-09-25', '故障', '网络连接异常', '赵六'),
('dev-05', '2025-09-10', '耗材', '更换墨盒', '孙七'),
('dev-06', '2025-09-30', '维护', '定期保养检查', '周八'),
('dev-07', '2025-09-18', '维护', '清洁设备外壳', '吴九'),
('dev-08', '2025-09-22', '耗材', '补充A3相纸', '郑十'),
('dev-09', '2025-09-26', '故障', '电源故障', '冯十一'),
('dev-10', '2025-09-12', '维护', '软件升级', '陈十二');

-- 9. 插入故障记录
INSERT INTO issues (device_id, date, description, status) VALUES
('dev-02', '2025-09-28', '卡纸', '已解决'),
('dev-04', '2025-09-25', '网络连接失败', '处理中'),
('dev-09', '2025-09-26', '设备无法开机', '处理中');

-- 10. 配置 RLS 策略（允许所有操作，适用于内部系统）
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略
DROP POLICY IF EXISTS "允许所有操作 devices" ON devices;
CREATE POLICY "允许所有操作 devices" ON devices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "允许所有操作 maintenance_logs" ON maintenance_logs;
CREATE POLICY "允许所有操作 maintenance_logs" ON maintenance_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "允许所有操作 issues" ON issues;
CREATE POLICY "允许所有操作 issues" ON issues FOR ALL USING (true) WITH CHECK (true);

-- 完成
SELECT 'devices 表创建成功！共插入 ' || COUNT(*) || ' 台设备' AS result FROM devices;
