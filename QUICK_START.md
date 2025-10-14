# 🚀 快速开始指南

本指南帮助您在 5 分钟内完成 Supabase 配置，实现本地和生产环境的数据同步。

---

## 📋 目标

配置完成后，您将实现：
- ✅ 本地开发直接使用 Supabase 云数据库
- ✅ 本地修改实时同步到云端
- ✅ 推送代码到 GitHub 自动部署到 Vercel
- ✅ 本地和生产环境数据完全一致

---

## ⚡ 一键配置（推荐）

### 步骤 1: 运行配置脚本

```bash
npm run setup
```

### 步骤 2: 按提示操作

1. 选择 **1. 使用默认配置（推荐）**
2. 按回车确认
3. 完成！

### 步骤 3: 启动开发服务器

```bash
npm run dev
```

访问：http://localhost:5173

---

## 🔧 手动配置（备选）

如果一键配置失败，可以手动配置：

### 1. 创建 .env 文件

在项目根目录创建 `.env` 文件：

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

### 2. 确认配置内容

打开 `.env` 文件，确认以下内容已存在：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
```

### 3. 启动开发服务器

```bash
npm run dev
```

---

## ✅ 验证配置

### 本地验证

1. 访问 http://localhost:5173
2. 打开浏览器控制台（F12）
3. 检查：
   - ✅ 没有 "Supabase 未配置" 警告
   - ✅ 能看到 10 台设备数据
   - ✅ 可以编辑设备信息

### 测试数据同步

1. 在本地修改一台设备的信息
2. 刷新页面，修改应该保持
3. 访问 Supabase 控制台：https://supabase.opentrust.net
4. 查看数据表，应该看到相同的修改

---

## 🌐 配置 Vercel（生产环境）

### 步骤 1: 登录 Vercel

访问：https://vercel.com/dashboard

### 步骤 2: 配置环境变量

1. 找到项目：`Technical-Support-Management-Website`
2. 进入 **Settings** > **Environment Variables**
3. 添加两个变量：

**变量 1:**
```
Name: VITE_SUPABASE_URL
Value: https://your-project-id.supabase.co
Environments: ✓ Production  ✓ Preview  ✓ Development
```

**变量 2:**
```
Name: VITE_SUPABASE_ANON_KEY
Value: your_actual_supabase_anon_key_here
Environments: ✓ Production  ✓ Preview  ✓ Development
```

### 步骤 3: 重新部署

1. 保存环境变量
2. 进入 **Deployments** 标签
3. 点击最新部署的 "..." 菜单 → **Redeploy**

### 步骤 4: 验证生产环境

1. 等待部署完成（约 2-3 分钟）
2. 访问：https://www.joyboyjoyboy588.me
3. 强制刷新（Ctrl + F5）
4. 应该看到与本地相同的数据

---

## 🔄 完整工作流程

配置完成后，您的日常工作流程：

```
1. 本地开发
   ├─ 修改代码
   ├─ 测试功能
   └─ 数据自动同步到 Supabase
   
2. 提交代码
   ├─ git add .
   ├─ git commit -m "描述"
   └─ git push origin main
   
3. 自动部署
   ├─ GitHub 接收推送
   ├─ Vercel 自动构建
   └─ 生产网站自动更新
   
4. 验证
   └─ 访问生产网站确认更新
```

---

## 🎯 关键点说明

### 为什么本地和生产环境数据一致？

因为两者使用**同一个** Supabase 数据库：

```
┌─────────────┐
│  本地开发    │ ───┐
└─────────────┘    │
                   ├──→ ┌─────────────┐
┌─────────────┐    │    │  Supabase   │
│  Vercel     │ ───┘    │  数据库      │
│  生产环境    │         └─────────────┘
└─────────────┘
```

### 为什么推送代码会自动部署？

Vercel 与 GitHub 集成：

1. 检测到代码推送
2. 自动拉取最新代码
3. 注入环境变量
4. 构建并部署

### 数据会丢失吗？

不会！因为：
- ✅ 数据存储在 Supabase 云端
- ✅ 本地只是连接到云端数据库
- ✅ 即使本地项目删除，数据仍在云端

---

## ⚠️ 常见问题

### Q1: 本地显示 "Supabase 未配置" 警告

**解决方案：**
```bash
# 1. 检查 .env 文件是否存在
ls .env

# 2. 如果不存在，运行配置脚本
npm run setup

# 3. 重启开发服务器
# Ctrl + C 停止
npm run dev
```

### Q2: Vercel 部署后仍显示演示数据

**解决方案：**
1. 检查环境变量名称是否为 `VITE_SUPABASE_URL`（不是 `NEXT_PUBLIC_`）
2. 确认已选择 Production 环境
3. 重新部署项目
4. 清除浏览器缓存（Ctrl + Shift + Delete）

### Q3: 本地能连接，生产环境报错

**解决方案：**
1. 检查 Vercel 环境变量是否正确配置
2. 查看 Vercel 部署日志（Deployments > 点击部署 > 查看日志）
3. 确认环境变量值没有多余空格或引号

### Q4: 数据修改后不同步

**解决方案：**
1. 检查网络连接
2. 打开浏览器控制台（F12）查看错误
3. 访问 Supabase 控制台确认项目状态

---

## 📚 详细文档

如需更多信息，请参考：

- **[LOCAL_SETUP.md](./LOCAL_SETUP.md)** - 本地开发环境详细配置
- **[VERCEL_ENV_CONFIG.md](./VERCEL_ENV_CONFIG.md)** - Vercel 环境变量详细配置
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Supabase 数据库详细配置
- **[GIT_COMMANDS.md](./GIT_COMMANDS.md)** - Git 常用命令参考

---

## 🆘 需要帮助？

遇到问题时的排查顺序：

1. **查看浏览器控制台**（F12 > Console）
2. **查看 Vercel 部署日志**（Deployments > 点击部署）
3. **查看 Supabase 项目状态**（https://supabase.opentrust.net）
4. **参考本文档的常见问题部分**

---

## ✨ 配置完成检查清单

- [ ] 本地 .env 文件已创建
- [ ] 本地开发服务器能正常启动
- [ ] 本地能看到 10 台设备数据
- [ ] 本地修改数据后刷新页面数据保持
- [ ] Vercel 环境变量已配置（VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY）
- [ ] Vercel 已重新部署
- [ ] 生产网站能正常访问
- [ ] 生产网站显示与本地相同的数据
- [ ] 推送代码到 GitHub 后 Vercel 自动部署

**全部完成？恭喜！🎉 您已成功配置 Supabase，可以开始开发了！**

---

**创建时间：** 2025-10-14  
**适用版本：** v0.1.0+
