# 本地开发环境配置指南

本指南将帮助您配置本地开发环境，确保与生产环境（Vercel + Supabase）完全一致。

## 🎯 配置目标

- ✅ 本地开发使用真实的 Supabase 数据库
- ✅ 本地修改直接同步到云端数据库
- ✅ 推送代码到 GitHub 后，Vercel 自动部署
- ✅ 消除本地与生产环境的差异

---

## 📋 前置准备

### 1. 确认已安装的工具
```bash
# 检查 Node.js 版本（需要 >= 18）
node --version

# 检查 npm 版本
npm --version

# 检查 Git
git --version
```

### 2. 安装 Supabase CLI（可选，用于数据库管理）
```bash
# Windows (PowerShell)
npm install -g supabase

# 验证安装
supabase --version
```

---

## 🔧 步骤 1: 配置本地环境变量

### 1.1 创建 .env 文件

在项目根目录创建 `.env` 文件（已在 .gitignore 中，不会提交到 Git）：

```bash
# 复制示例文件
copy .env.example .env
```

### 1.2 编辑 .env 文件

打开 `.env` 文件，确认以下配置（已预填）：

```env
# ========================================
# Supabase 数据库配置
# ========================================
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here

# ========================================
# Supabase 数据库连接（用于 CLI 和脚本）
# ========================================
# ⚠️ 需要替换 [YOUR-PASSWORD] 为实际密码
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
```

### 1.3 获取数据库密码（如需使用 CLI）

1. 访问 Supabase 控制台：https://supabase.opentrust.net
2. 选择项目：`sbp-a2e2xuudcasoe44t`
3. 进入 **Settings** > **Database**
4. 找到 **Connection String** 部分
5. 复制密码并替换 `.env` 文件中的 `[YOUR-PASSWORD]`

---

## 🚀 步骤 2: 启动本地开发服务器

```bash
# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

访问：http://localhost:5173

### 验证配置成功

打开浏览器控制台（F12），应该看到：
- ✅ **没有** "Supabase 未配置" 的警告
- ✅ 能看到真实的设备数据（10 台设备）
- ✅ 可以正常编辑、添加、删除数据

---

## 🔄 步骤 3: 配置 Git 和 GitHub 同步

### 3.1 确认 Git 仓库配置

```bash
# 查看远程仓库
git remote -v

# 应该显示：
# origin  https://github.com/joyboy123456/Technical-Support-Management-Website.git
```

### 3.2 推送代码到 GitHub

```bash
# 查看当前修改
git status

# 添加所有修改
git add .

# 提交修改
git commit -m "配置 Supabase 本地开发环境"

# 推送到 GitHub
git push origin main
```

---

## ☁️ 步骤 4: 配置 Vercel 环境变量

### 4.1 登录 Vercel

访问：https://vercel.com/dashboard

### 4.2 配置环境变量

1. 找到项目：`Technical-Support-Management-Website`
2. 进入 **Settings** > **Environment Variables**
3. 添加以下两个变量：

#### 变量 1: Supabase URL
```
Name: VITE_SUPABASE_URL
Value: https://your-project-id.supabase.co
Environments: ✓ Production  ✓ Preview  ✓ Development
```

#### 变量 2: Supabase ANON KEY
```
Name: VITE_SUPABASE_ANON_KEY
Value: your_actual_supabase_anon_key_here
Environments: ✓ Production  ✓ Preview  ✓ Development
```

### 4.3 重新部署

1. 保存环境变量后，Vercel 会提示重新部署
2. 点击 **Redeploy** 或推送新代码触发自动部署
3. 等待部署完成（约 2-3 分钟）

---

## ✅ 步骤 5: 验证完整工作流

### 5.1 本地测试

1. 在本地修改数据（例如：编辑设备信息）
2. 刷新页面，数据应该保持
3. 打开 Supabase 控制台，确认数据已同步

### 5.2 生产环境测试

1. 访问生产网站：https://www.joyboyjoyboy588.me
2. 强制刷新（Ctrl + F5）
3. 应该看到与本地相同的数据
4. 在生产环境修改数据
5. 回到本地刷新，应该看到相同的修改

### 5.3 完整部署流程测试

```bash
# 1. 本地修改代码（例如：修改 README.md）
echo "测试部署流程" >> README.md

# 2. 提交并推送
git add .
git commit -m "测试自动部署流程"
git push origin main

# 3. 观察 Vercel 自动部署
# 访问：https://vercel.com/dashboard
# 应该看到新的部署正在进行

# 4. 等待部署完成后访问生产网站
# 应该看到最新的代码变更
```

---

## 🎉 完成！工作流程说明

### 现在的工作流程

```
┌─────────────┐
│  本地开发    │
│  (Vite)     │
└──────┬──────┘
       │
       │ 读写数据
       ↓
┌─────────────┐
│  Supabase   │ ←─────────────┐
│  数据库      │                │
└──────┬──────┘                │
       │                       │
       │ 同步数据               │ 读写数据
       ↓                       │
┌─────────────┐                │
│   GitHub    │                │
│   仓库       │                │
└──────┬──────┘                │
       │                       │
       │ 自动触发部署            │
       ↓                       │
┌─────────────┐                │
│   Vercel    │                │
│   生产环境   │ ───────────────┘
└─────────────┘
```

### 关键点

1. **本地和生产使用同一个 Supabase 数据库**
   - 数据实时同步
   - 无需手动迁移数据

2. **代码推送自动部署**
   - 推送到 GitHub → Vercel 自动构建和部署
   - 无需手动操作

3. **环境变量一致**
   - 本地 `.env` 文件
   - Vercel 环境变量
   - 两者使用相同的 Supabase 凭据

---

## 🔧 常见问题排查

### 问题 1: 本地仍显示 "Supabase 未配置" 警告

**解决方案：**
```bash
# 1. 检查 .env 文件是否存在
ls .env

# 2. 检查环境变量是否正确
# 打开 .env 文件，确认：
# - 变量名是 VITE_SUPABASE_URL（不是 NEXT_PUBLIC_）
# - URL 和 KEY 没有多余的空格或引号

# 3. 重启开发服务器
# Ctrl + C 停止服务器
npm run dev
```

### 问题 2: 本地能连接，但 Vercel 部署后无法连接

**解决方案：**
1. 检查 Vercel 环境变量名称是否正确（必须是 `VITE_` 前缀）
2. 确认已选择 Production 环境
3. 重新部署项目
4. 清除浏览器缓存

### 问题 3: 数据不同步

**解决方案：**
```bash
# 1. 检查网络连接
ping supabase.opentrust.net

# 2. 检查 Supabase 项目状态
# 访问：https://supabase.opentrust.net

# 3. 查看浏览器控制台错误
# F12 > Console 标签
```

### 问题 4: Git 推送失败

**解决方案：**
```bash
# 1. 检查 Git 配置
git config --list

# 2. 检查远程仓库
git remote -v

# 3. 拉取最新代码后再推送
git pull origin main
git push origin main
```

---

## 📚 相关文档

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase 详细配置
- [VERCEL_ENV_CONFIG.md](./VERCEL_ENV_CONFIG.md) - Vercel 环境变量配置
- [GIT_COMMANDS.md](./GIT_COMMANDS.md) - Git 常用命令
- [README.md](./README.md) - 项目概述

---

## 🆘 需要帮助？

如果遇到问题：
1. 查看浏览器控制台错误信息（F12）
2. 查看 Supabase 项目日志
3. 查看 Vercel 部署日志
4. 参考上述故障排查部分

---

**配置完成时间：** 2025-10-14
**最后更新：** 2025-10-14
