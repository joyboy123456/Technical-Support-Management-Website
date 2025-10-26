# 📋 数据库迁移手动执行指南

## 快速开始（3分钟完成）

由于 API 权限限制，需要通过 Supabase SQL Editor 手动执行迁移。

---

## 步骤 1: 打开 Supabase 控制台

访问你的 Supabase 项目：

**方式A: 直接访问（推荐）**
```
https://app.supabase.opentrust.net/project/a2e2xuudcasoe44t
```

**方式B: 从主页进入**
1. 访问: https://supabase.opentrust.net
2. 登录你的账号
3. 选择你的项目

---

## 步骤 2: 进入 SQL Editor

1. 在左侧菜单找到 **SQL Editor** （SQL 编辑器）
2. 点击 **+ New query** （新建查询）

---

## 步骤 3: 复制 SQL 脚本

打开文件：
```
supabase/migrations/0013_optimize_stats_views.sql
```

**全选并复制** 文件内容（Ctrl+A → Ctrl+C 或 Cmd+A → Cmd+C）

---

## 步骤 4: 粘贴并执行

1. 在 SQL Editor 中 **粘贴** 刚才复制的内容
2. 点击右下角的 **Run** 按钮 ▶️
3. 等待执行完成（约 15-30 秒）

---

## 步骤 5: 验证执行结果

### 检查视图是否创建成功

在 SQL Editor 执行以下查询：

```sql
-- 查看所有视图
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE 'v_%'
ORDER BY table_name;
```

**预期结果**: 应该看到以下 12 个视图

✅ 必须有的视图：
- v_action_trends_30d
- v_asset_overview
- v_low_stock_summary
- v_maintenance_stats
- v_printer_by_brand_model
- v_printer_by_location
- v_printer_instance_stats
- v_printer_overview
- v_router_overview
- v_router_stats
- v_sim_counts (已有)
- v_stock_levels (已有)

---

## 步骤 6: 测试视图性能

执行以下查询测试视图是否工作：

```sql
-- 测试打印机概览
SELECT * FROM v_printer_overview;

-- 测试资产概览
SELECT * FROM v_asset_overview;

-- 测试低库存告警
SELECT * FROM v_low_stock_summary;
```

**预期结果**: 
- 每个查询应该在 < 1秒内返回结果
- 不应该有错误信息

---

## 常见问题

### Q1: 执行时报错 "permission denied"

**原因**: 当前用户权限不足

**解决**:
1. 确认你是项目的 Owner 或 Admin
2. 或者联系项目管理员执行

### Q2: 执行时报错 "relation does not exist"

**原因**: 某些表不存在（例如 printer_instances）

**解决**:
1. 检查数据库中是否有 `printer_instances` 表
2. 如果没有，可以跳过相关视图的创建
3. 或者先执行其他迁移脚本创建缺失的表

### Q3: 视图查询返回 0 行

**原因**: 数据库中暂无数据

**解决**: 这是正常的！视图已创建成功，等有数据后会自动显示

---

## 验证优化是否生效

### 方法 1: 使用验证脚本（推荐）

在项目目录执行：

```bash
npm install dotenv @supabase/supabase-js
node scripts/verify-views.js
```

### 方法 2: 手动验证

1. 部署前端代码: `git push origin main`
2. 访问网站: https://joyboyjoyboy588.me
3. 打开浏览器控制台（F12）
4. 查看 Console 日志，应该看到:
   ```
   ✅ 使用优化版本的 Dashboard 汇总
   ✅ 从数据库视图获取打印机统计: X 台
   📊 Dashboard 汇总统计完成（优化版）
   ```

---

## 回滚（如果需要）

如果迁移后出现问题，可以删除所有视图：

```sql
-- 删除所有优化视图
DROP VIEW IF EXISTS v_printer_instance_stats CASCADE;
DROP VIEW IF EXISTS v_printer_overview CASCADE;
DROP VIEW IF EXISTS v_printer_by_location CASCADE;
DROP VIEW IF EXISTS v_printer_by_brand_model CASCADE;
DROP VIEW IF EXISTS v_asset_overview CASCADE;
DROP VIEW IF EXISTS v_router_stats CASCADE;
DROP VIEW IF EXISTS v_router_overview CASCADE;
DROP VIEW IF EXISTS v_action_trends_30d CASCADE;
DROP VIEW IF EXISTS v_maintenance_stats CASCADE;
DROP VIEW IF EXISTS v_low_stock_summary CASCADE;
```

---

## 完成后的下一步

✅ 迁移完成后：

1. **提交代码**:
   ```bash
   git add .
   git commit -m "perf: add database views for performance optimization"
   git push origin main
   ```

2. **等待 Vercel 自动部署**（约 1-2 分钟）

3. **访问网站验证性能提升**

4. **运行压力测试对比优化效果**:
   ```bash
   ab -n 100 -c 10 https://joyboyjoyboy588.me/
   ```

---

## 需要帮助？

如遇到问题，请提供以下信息：
1. 执行 SQL 时的完整错误信息
2. Supabase 项目版本
3. 浏览器控制台的错误日志

---

**预计耗时**: 3-5 分钟  
**难度**: ⭐⭐☆☆☆（简单）
