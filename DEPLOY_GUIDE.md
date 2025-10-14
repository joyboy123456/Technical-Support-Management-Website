# 🚀 将数据迁移到阿里云 Supabase 操作指南

## 📋 概述

本指南将帮助您将设备数据从本地迁移到阿里云 Supabase，实现公司多人在线访问。

---

## ✅ 第一步：登录阿里云 Supabase 控制台

1. **打开浏览器**，访问您的 Supabase 项目：
   ```
   https://your-project-id.supabase.co
   ```

2. **使用您的账号登录**

---

## 📊 第二步：执行数据库迁移脚本

### 方法：通过 SQL Editor 执行

1. **进入 SQL Editor**
   - 在左侧菜单找到 `SQL Editor`
   - 点击 `New query` 创建新查询

2. **复制 SQL 脚本**
   - 打开项目文件：`supabase/migrations/0003_devices_table.sql`
   - 全选并复制所有内容（Ctrl+A → Ctrl+C）

3. **粘贴并执行**
   - 将复制的 SQL 粘贴到 SQL Editor
   - 点击右下角的 `Run` 按钮执行
   - ⏳ 等待执行完成（约 5-10 秒）

4. **查看执行结果**
   - ✅ 如果成功，会显示：`devices 表创建成功！共插入 10 台设备`
   - ❌ 如果失败，请查看错误信息并联系技术支持

---

## 🔍 第三步：验证数据

### 3.1 检查表是否创建成功

在 SQL Editor 中执行：

```sql
-- 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('devices', 'maintenance_logs', 'issues');
```

**预期结果**：应该看到 3 个表名
- `devices`
- `maintenance_logs`
- `issues`

### 3.2 检查设备数据

```sql
-- 查询所有设备
SELECT id, name, location, status, owner 
FROM devices 
ORDER BY name;
```

**预期结果**：应该看到 10 台魔镜设备（魔镜1号到魔镜10号）

### 3.3 检查维护日志

```sql
-- 查询维护日志统计
SELECT device_id, COUNT(*) as log_count 
FROM maintenance_logs 
GROUP BY device_id;
```

**预期结果**：应该看到多条维护记录

---

## 🌐 第四步：刷新前端网站

1. **回到您的网站**（开发环境或生产环境）

2. **强制刷新浏览器**
   - Windows: `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

3. **验证功能**
   - ✅ 设备列表应该显示 10 台设备
   - ✅ 点击设备可以查看详情
   - ✅ 可以编辑设备信息
   - ✅ 可以添加/删除设备图片
   - ✅ 刷新页面后修改保持不变

---

## 👥 第五步：分享给同事

### 5.1 如果是本地开发环境

**问题**：同事无法访问 `localhost:3000`

**解决方案A - 部署到 Vercel（推荐）**：

1. 将代码推送到 GitHub
2. 登录 Vercel：https://vercel.com
3. 导入 GitHub 项目
4. 配置环境变量（在 Vercel 项目设置中）：
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
   ```
5. 点击 `Deploy`
6. 部署完成后，获取网址（例如：`https://your-project.vercel.app`）
7. 分享网址给同事

**解决方案B - 局域网访问（临时方案）**：

1. 查看本机 IP 地址：
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```

2. 找到局域网 IP（例如：`192.168.1.100`）

3. 修改 Vite 配置（`vite.config.ts`）：
   ```typescript
   server: {
     host: '0.0.0.0',  // 允许局域网访问
     port: 3000,
   }
   ```

4. 重启开发服务器：`npm run dev`

5. 同事访问：`http://192.168.1.100:3000`

⚠️ **注意**：局域网方案仅适用于同一网络的设备，且需要保持您的电脑开机运行。

### 5.2 如果已部署到 Vercel

直接分享网址给同事即可！例如：
```
https://technical-support-management.vercel.app
```

---

## 🔐 数据安全说明

### 当前配置

- ✅ 数据存储在阿里云 Supabase（国内访问快）
- ✅ 启用了 Row Level Security (RLS)
- ✅ 允许所有操作（适用于内部系统）
- ⚠️ 没有用户认证（任何人都可以编辑）

### 如果需要加强安全性

未来可以添加：
1. **用户登录系统**（Supabase Auth）
2. **角色权限管理**（管理员、查看者）
3. **操作日志审计**
4. **IP 白名单**

---

## 🎯 功能验证清单

执行完迁移后，请验证以下功能：

- [ ] 设备列表正常显示
- [ ] 点击设备查看详情
- [ ] 编辑设备信息并保存
- [ ] 添加设备图片
- [ ] 删除设备图片（刷新后不重现）✨
- [ ] 添加维护记录
- [ ] 多个浏览器/设备同时访问
- [ ] 数据实时同步

---

## ❓ 常见问题

### Q1: 执行 SQL 报错："relation already exists"

**原因**：表已经存在

**解决**：
1. 如果确认要重新创建，先删除旧表：
   ```sql
   DROP TABLE IF EXISTS issues CASCADE;
   DROP TABLE IF EXISTS maintenance_logs CASCADE;
   DROP TABLE IF EXISTS devices CASCADE;
   ```
2. 然后重新执行迁移脚本

### Q2: 前端显示"数据库为空"

**原因**：SQL 脚本执行失败或数据未插入

**解决**：
1. 在 SQL Editor 检查设备数据：
   ```sql
   SELECT COUNT(*) FROM devices;
   ```
2. 如果返回 0，重新执行迁移脚本

### Q3: 图片删除后刷新又出现

**原因**：数据库连接失败，降级到本地数据

**解决**：
1. 检查 `.env` 文件配置是否正确
2. 在浏览器控制台查看错误信息
3. 确认 Supabase 服务正常运行

### Q4: 同事无法访问网站

**原因**：网站未部署到公网

**解决**：按照"第五步"部署到 Vercel 或配置局域网访问

---

## 📞 获取帮助

如遇到问题：
1. 查看浏览器控制台错误（F12 → Console）
2. 查看 Supabase 日志（Logs 菜单）
3. 查看项目 README.md 文档
4. 联系技术支持

---

## 🎉 完成！

恭喜！您已成功将数据迁移到云端，现在公司同事可以在线访问设备管理系统了！

**下一步建议**：
- 📊 定期备份数据库
- 🔐 添加用户认证系统
- 📈 监控数据库使用情况
- 🚀 优化网站性能
