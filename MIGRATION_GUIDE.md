# 数据库迁移指南 - 迁移到阿里云 Supabase

## ✅ 已完成的准备工作

1. ✅ `.env` 文件已更新为阿里云 Supabase 配置
2. ✅ 数据库备份脚本已创建 (`scripts/backup-database.js`)
3. ✅ 数据库迁移 SQL 文件已准备好

---

## 📋 迁移步骤

### 第一步：备份旧数据库（可选）

如果你想保留旧 Supabase 实例的数据：

```bash
# 临时切换回旧配置
# 编辑 .env，改回旧的 URL 和 KEY

# 安装依赖（如果还没安装）
npm install

# 执行备份
npm run backup:db

# 备份文件会保存在 backups/ 目录
```

### 第二步：在阿里云 Supabase 执行数据库迁移

1. **登录阿里云 Supabase 控制台**
   - 访问：https://sbp-a2e2xuudcasoe44t.supabase.opentrust.net
   - 或从你的 Supabase 管理后台访问

2. **打开 SQL 编辑器**
   - 进入左侧菜单 `SQL Editor`
   - 点击 `New query`

3. **执行迁移脚本（按顺序）**

   **第一个脚本：** `supabase/migrations/0001_init.sql`
   - 复制整个文件内容
   - 粘贴到 SQL 编辑器
   - 点击 `Run` 执行
   - ✅ 确认执行成功（应该看到创建表、视图、函数等的消息）

   **第二个脚本：** `supabase/migrations/0002_outbound_inventory_simple.sql`
   - 复制整个文件内容
   - 粘贴到 SQL 编辑器
   - 点击 `Run` 执行
   - ✅ 确认执行成功

4. **（可选）插入种子数据**

   如果需要测试数据：
   - 复制 `supabase/seed/seed.sql` 的内容
   - 粘贴到 SQL 编辑器执行

### 第三步：验证迁移结果

在 SQL 编辑器中执行以下验证查询：

```sql
-- 检查所有表是否创建成功
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 应该看到以下表：
-- actions, assets, audit_log, audit_logs, codes,
-- compatibilities, consumables, inventory, locations,
-- maintenance_records, outbound_records, price_history,
-- printer_models, sim_cards, sops, stock_ledger, suppliers

-- 检查视图是否创建成功
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';

-- 应该看到：
-- v_low_stock_alerts, v_outbound_stats, v_printer_counts,
-- v_router_counts, v_sim_counts, v_sim_public, v_stock_levels
```

### 第四步：测试应用连接

```bash
# 确保 .env 使用阿里云配置（已完成）

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
# 尝试登录和基本操作，确认数据库连接正常
```

---

## 🔄 定期备份设置

### 手动备份

```bash
# 每周执行一次
npm run backup:db
```

备份文件会保存在 `backups/backup-YYYY-MM-DD.json`

### 自动备份（可选）

**Windows 任务计划程序：**

1. 创建批处理文件 `backup.bat`：
```batch
@echo off
cd /d "E:\1\技术支持网站\Technical-Support-Management-Website"
call npm run backup:db
```

2. 打开任务计划程序 → 创建基本任务
   - 名称：Supabase 数据库备份
   - 触发器：每周一次
   - 操作：启动程序 → 选择 `backup.bat`

---

## 🔍 监控资源使用

### 数据库容量监控

在 Supabase 控制台执行：

```sql
-- 查看数据库大小
SELECT
  pg_size_pretty(pg_database_size(current_database())) as total_size;

-- 查看各表大小
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 连接数监控

```sql
-- 查看当前连接数
SELECT count(*) FROM pg_stat_activity;

-- 查看最大连接数限制
SHOW max_connections;
```

---

## ⚠️ 注意事项

1. **不需要 Supabase CLI** - 所有操作都通过 Web 控制台完成
2. **数据隔离** - 阿里云实例和官方实例是完全独立的
3. **备份文件** - 保存在本地 `backups/` 目录，需手动管理
4. **环境变量** - `.env` 用于生产，`.env.local` 用于本地测试

---

## 🆘 故障排查

### 问题 1：执行 SQL 时报错 "权限不足"

**解决方案：**
- 确认你使用的是 `service_role` key（在数据库操作时）
- 或者在 Supabase 控制台中，确保 RLS 策略配置正确

### 问题 2：表已存在错误

**解决方案：**
```sql
-- 如果需要重新执行迁移，先删除所有表
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 然后重新执行迁移脚本
```

### 问题 3：前端连接失败

**检查清单：**
1. `.env` 文件配置是否正确
2. 重启开发服务器（`npm run dev`）
3. 检查浏览器控制台错误信息
4. 确认 Supabase RLS 策略已正确配置

### 问题 4：备份脚本失败

**解决方案：**
```bash
# 检查 Node.js 版本（需要 v18+）
node --version

# 重新安装依赖
npm install

# 检查环境变量
echo $VITE_SUPABASE_URL  # Linux/Mac
echo %VITE_SUPABASE_URL%  # Windows CMD
```

---

## 📞 技术支持

如遇到问题：
1. 检查 Supabase 控制台的错误日志
2. 查看浏览器开发者工具 Console
3. 参考 Supabase 官方文档：https://supabase.com/docs
4. 查看阿里云 Supabase 文档

---

## 📊 迁移完成检查清单

- [ ] 阿里云 Supabase 数据库结构已创建
- [ ] 所有表和视图创建成功
- [ ] `.env` 文件已更新为阿里云配置
- [ ] 前端应用能正常连接数据库
- [ ] 基本功能测试通过（登录、查询等）
- [ ] 备份脚本测试成功
- [ ] 设置了定期备份计划

---

**迁移完成后，你就可以开始使用阿里云 Supabase 了！🎉**
