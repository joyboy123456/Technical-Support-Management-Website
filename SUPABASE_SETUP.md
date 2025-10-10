# Supabase 集成配置指南

本指南将帮助你配置 Supabase 数据库，包括新增的单据化操作系统、Edge Functions部署和安全配置。

## 📋 前置准备

1. 注册 Supabase 账号: https://supabase.com
2. 创建一个新项目
3. 安装 Supabase CLI: https://supabase.com/docs/guides/cli

## 🗄️ 数据库设置

### 步骤 1: 执行迁移脚本 (推荐)

**新增**: 使用我们提供的完整迁移脚本，支持单据化操作系统：

```bash
# 方法1: 使用npm脚本 (需要配置数据库连接)
npm run db:migrate

# 方法2: 直接在Supabase SQL Editor中执行
# 复制 supabase/migrations/0001_init.sql 文件内容并执行
```

**迁移脚本包含的功能**:
- 完整的数据表结构（locations, assets, actions, stock_ledger等）
- 业务逻辑函数（perform_action_transaction, check_compatibility等）
- 数据库视图（统计和监控视图）
- 行级安全策略（RLS）
- 审计触发器和日志系统
- 兼容性检查约束
- 索引优化

### 步骤 1(备选): 创建传统数据表

在 Supabase 项目的 SQL Editor 中,执行以下 SQL 语句创建所需的表:

```sql
-- 创建设备表
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  serial TEXT NOT NULL,
  os TEXT NOT NULL,
  location TEXT NOT NULL,
  owner TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('运行中', '离线', '维护')),
  printer_model TEXT NOT NULL,
  printer_paper TEXT NOT NULL CHECK (printer_paper IN ('A4', 'A3')),
  printer_connect TEXT NOT NULL CHECK (printer_connect IN ('USB', 'Wi-Fi')),
  printer_paper_stock INTEGER NOT NULL DEFAULT 0,
  printer_ink_c INTEGER NOT NULL DEFAULT 0,
  printer_ink_m INTEGER NOT NULL DEFAULT 0,
  printer_ink_y INTEGER NOT NULL DEFAULT 0,
  printer_ink_k INTEGER NOT NULL DEFAULT 0,
  next_maintenance TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 创建维护日志表
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('维护', '故障', '耗材', '其他')),
  note TEXT NOT NULL,
  executor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 创建故障记录表
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  desc TEXT NOT NULL,
  status TEXT CHECK (status IN ('处理中', '已解决')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 创建索引以提高查询性能
CREATE INDEX idx_maintenance_logs_device_id ON maintenance_logs(device_id);
CREATE INDEX idx_issues_device_id ON issues(device_id);
CREATE INDEX idx_devices_location ON devices(location);
CREATE INDEX idx_devices_status ON devices(status);

-- 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 步骤 2: 插入种子数据

**新增**: 使用完整的种子数据脚本：

```bash
# 方法1: 使用npm脚本
npm run db:seed

# 方法2: 直接在Supabase SQL Editor中执行
# 复制 supabase/seed/seed.sql 文件内容并执行
```

**种子数据包含**:
- 示例位置（仓库、展厅等）
- 打印机型号和品牌信息
- 样例设备资产
- 耗材和码资源
- SIM卡示例数据
- 兼容性规则配置

### 步骤 2(备选): 手动插入初始数据

如果需要手动插入基础数据，执行以下 SQL:

```sql
-- 插入设备数据
INSERT INTO devices (id, name, model, serial, os, location, owner, status, printer_model, printer_paper, printer_connect, printer_paper_stock, printer_ink_c, printer_ink_m, printer_ink_y, printer_ink_k, next_maintenance) VALUES
('dev-01', '设备01', '魔镜6号', 'SN-01-2025', 'Windows 11', '杭州展厅A区', '张三', '运行中', 'EPSON-L8058', 'A4', 'Wi-Fi', 120, 76, 64, 58, 83, '2025-11-15'),
('dev-02', '设备02', '魔镜6号', 'SN-02-2025', 'Windows 11', '杭州展厅B区', '李四', '维护', 'EPSON-L18058', 'A3', 'USB', 60, 40, 52, 47, 61, '2025-10-25'),
('dev-03', '设备03', '魔镜7号', 'SN-03-2025', 'Windows 11', '上海展厅A区', '王五', '运行中', 'EPSON-L8058', 'A4', 'Wi-Fi', 95, 88, 92, 76, 94, '2025-12-01'),
('dev-04', '设备04', '魔镜6号', 'SN-04-2025', 'Windows 11', '上海展厅B区', '赵六', '离线', 'EPSON-L18058', 'A3', 'USB', 25, 15, 23, 18, 31, '2025-10-30'),
('dev-05', '设备05', '魔镜7号', 'SN-05-2025', 'Windows 11', '北京展厅A区', '孙七', '运行中', 'EPSON-L8058', 'A4', 'Wi-Fi', 80, 65, 71, 58, 79, '2025-11-20'),
('dev-06', '设备06', '魔镜6号', 'SN-06-2025', 'Windows 11', '北京展厅B区', '周八', '维护', 'EPSON-L18058', 'A3', 'USB', 40, 35, 42, 38, 46, '2025-10-28'),
('dev-07', '设备07', '魔镜7号', 'SN-07-2025', 'Windows 11', '深圳展厅A区', '吴九', '运行中', 'EPSON-L8058', 'A4', 'Wi-Fi', 110, 82, 87, 73, 91, '2025-12-05'),
('dev-08', '设备08', '魔镜6号', 'SN-08-2025', 'Windows 11', '深圳展厅B区', '郑十', '运行中', 'EPSON-L18058', 'A3', 'USB', 75, 56, 63, 49, 72, '2025-11-25'),
('dev-09', '设备09', '魔镜7号', 'SN-09-2025', 'Windows 11', '广州展厅A区', '冯十一', '离线', 'EPSON-L8058', 'A4', 'Wi-Fi', 20, 12, 18, 15, 25, '2025-11-10'),
('dev-10', '设备10', '魔镜6号', 'SN-10-2025', 'Windows 11', '广州展厅B区', '陈十二', '运行中', 'EPSON-L18058', 'A3', 'USB', 85, 69, 74, 66, 81, '2025-12-10');

-- 插入维护日志
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

-- 插入故障记录
INSERT INTO issues (device_id, date, desc, status) VALUES
('dev-02', '2025-09-28', '卡纸', '已解决'),
('dev-04', '2025-09-25', '网络连接失败', '处理中'),
('dev-09', '2025-09-26', '设备无法开机', '处理中');
```

### 步骤 3: 配置 Row Level Security (RLS)

为了安全起见,建议启用 RLS。如果你的应用不需要用户认证,可以设置允许所有操作的策略:

```sql
-- 启用 RLS
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略(适用于内部管理系统)
CREATE POLICY "允许所有操作 devices" ON devices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "允许所有操作 maintenance_logs" ON maintenance_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "允许所有操作 issues" ON issues FOR ALL USING (true) WITH CHECK (true);
```

**注意**: 如果需要更严格的权限控制,请根据实际需求修改策略。

## 🔧 Edge Functions 部署

### 部署 perform_action 函数

本系统使用 Edge Functions 处理复杂的事务操作：

```bash
# 1. 安装 Supabase CLI
npm install -g supabase

# 2. 登录到 Supabase
supabase login

# 3. 链接到你的项目
supabase link --project-ref your-project-ref

# 4. 部署 Edge Functions
supabase functions deploy perform_action --project-ref your-project-ref
```

### 验证 Edge Functions

```bash
# 测试函数是否正常工作
curl -X POST 'https://your-project.supabase.co/functions/v1/perform_action' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "action_type": "调拨",
    "asset_id": "test-asset",
    "from_location_id": "warehouse",
    "to_location_id": "showroom",
    "by_user": "测试用户"
  }'
```

### 函数功能说明

**perform_action** Edge Function 提供:
- 事务化操作处理
- 兼容性验证
- 库存检查
- 审计日志记录
- 错误处理和回滚

## 🔑 获取 API 密钥

1. 在 Supabase 项目中,进入 **Settings** > **API**
2. 复制以下信息:
   - **Project URL** (类似: `https://xxxxx.supabase.co`)
   - **anon public** key (公开密钥)

## ⚙️ 本地开发配置

1. 复制 `.env.example` 为 `.env`:
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件,填入你的 Supabase 凭据:
   ```env
   # Supabase 连接配置
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here

   # 功能开关（可选）
   VITE_ENABLE_AUDIT=true
   VITE_ENABLE_ALERTS=true
   VITE_ENABLE_SOP=true

   # 性能配置（可选）
   VITE_QUERY_STALE_TIME=300000
   VITE_QUERY_CACHE_TIME=600000
   ```

3. 启动开发服务器:
   ```bash
   npm run dev
   ```

## 🚀 Vercel 部署配置

1. 在 Vercel 项目设置中,进入 **Settings** > **Environment Variables**

2. 添加以下环境变量:
   - `VITE_SUPABASE_URL`: 你的 Supabase 项目 URL
   - `VITE_SUPABASE_ANON_KEY`: 你的 Supabase anon key

3. 重新部署项目

## ✅ 验证配置

部署完成后,测试以下功能:

### 基础功能验证
- ✅ 查看设备列表
- ✅ 编辑设备信息
- ✅ 添加维护记录
- ✅ 快速更新设备位置
- ✅ 刷新页面后数据保持

### 新增功能验证
- ✅ 统计看板数据展示正常
- ✅ 单据化操作（借用、调拨、安装等）
- ✅ 兼容性检查（DNP只允许专码）
- ✅ 审计日志记录和查看
- ✅ SOP流程跟踪
- ✅ 安装向导功能
- ✅ 库存实时更新
- ✅ 告警和通知系统

### 数据库功能验证
```sql
-- 1. 验证迁移脚本执行成功
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- 2. 验证视图创建成功
SELECT viewname FROM pg_views WHERE schemaname = 'public';

-- 3. 验证函数创建成功
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- 4. 测试 perform_action_transaction 函数
SELECT perform_action_transaction(jsonb_build_object(
  'action_type', '调拨',
  'asset_id', 'test-asset',
  'by_user', '测试用户'
));
```

## 🔄 降级方案

如果未配置 Supabase 环境变量,系统会自动降级到本地内存模式:
- 可以正常查看和编辑数据
- 但刷新页面后编辑会丢失
- 控制台会显示警告信息

## 📊 数据库管理

你可以通过以下方式管理数据:

1. **Supabase Dashboard**: 在 Table Editor 中直接编辑
2. **SQL Editor**: 执行自定义 SQL 查询
3. **API**: 通过应用界面进行 CRUD 操作

## 🛠️ 故障排查

### 问题: 数据无法保存

**解决方案**:
1. 检查环境变量是否正确配置
2. 查看浏览器控制台是否有错误信息
3. 确认 Supabase RLS 策略已正确设置
4. 验证数据库迁移是否成功执行

### 问题: 连接超时

**解决方案**:
1. 检查 Supabase 项目是否处于活跃状态
2. 确认网络连接正常
3. 查看 Supabase 项目状态页面

### 问题: Edge Functions 调用失败

**解决方案**:
1. 检查 Edge Functions 是否成功部署
```bash
supabase functions list --project-ref your-project-ref
```
2. 查看函数日志
```bash
supabase functions logs perform_action --project-ref your-project-ref
```
3. 验证函数URL和权限配置

### 问题: 兼容性检查不工作

**解决方案**:
1. 确认 compatibilities 表数据已正确插入
2. 检查 check_compatibility 函数是否存在
3. 验证 printer_models 和 consumables 表的关联关系

### 问题: 统计数据不准确

**解决方案**:
1. 检查数据库视图是否创建成功
```sql
SELECT viewname FROM pg_views WHERE schemaname = 'public';
```
2. 验证 stock_ledger 表的数据完整性
3. 检查 audit_log 表的触发器是否正常工作

### 问题: SOP流程无法显示

**解决方案**:
1. 确认 sops 和 sop_steps 表已创建并包含数据
2. 检查资产类型、品牌、型号是否匹配
3. 验证 SOP 查询逻辑和权限设置

## 📚 相关资源

### 官方文档
- [Supabase 文档](https://supabase.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Vite 环境变量](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel 环境变量](https://vercel.com/docs/concepts/projects/environment-variables)

### 项目文档
- [DESIGN.md](./DESIGN.md) - 系统架构和设计决策
- [README.md](./README.md) - 项目概述和快速开始
- [package.json](./package.json) - NPM 脚本和依赖

### 开发工具
- [React Query 文档](https://tanstack.com/query/latest)
- [TailwindCSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 组件库](https://ui.shadcn.com)
