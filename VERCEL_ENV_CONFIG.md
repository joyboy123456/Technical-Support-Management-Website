# Vercel 环境变量配置指南

本指南帮助您在 Vercel 上配置环境变量，确保生产环境与本地开发环境使用相同的 Supabase 数据库。

---

## 🎯 配置目标

- ✅ Vercel 生产环境连接到 Supabase 数据库
- ✅ 与本地开发环境使用相同的数据库
- ✅ 代码推送到 GitHub 后自动部署
- ✅ 环境变量自动注入到构建过程

---

## 📋 配置步骤

### 步骤 1: 登录 Vercel Dashboard

访问：https://vercel.com/dashboard

### 步骤 2: 找到项目

找到并点击 `Technical-Support-Management-Website` 项目

### 步骤 3: 进入环境变量设置

1. 点击 **Settings** 标签
2. 左侧菜单选择 **Environment Variables**

### 步骤 4: 添加环境变量

点击 **Add New** 按钮，添加以下两个变量：

---

## 🔑 环境变量配置（复制粘贴）

### 变量 1: Supabase URL

```
Name: VITE_SUPABASE_URL
Value: https://your-project-id.supabase.co
Environments: ✓ Production  ✓ Preview  ✓ Development
```

**说明：** Supabase 项目的 API 端点地址

---

### 变量 2: Supabase ANON KEY

```
Name: VITE_SUPABASE_ANON_KEY
Value: your_actual_supabase_anon_key_here
Environments: ✓ Production  ✓ Preview  ✓ Development
```

**说明：** Supabase 匿名访问密钥（公开密钥，可安全暴露在前端）

---

## ⚠️ 重要提示

### 1. 环境变量前缀

本项目使用 **Vite** 构建工具，必须使用 `VITE_` 前缀：

- ❌ **错误：** `NEXT_PUBLIC_SUPABASE_URL`（Next.js 项目使用）
- ✅ **正确：** `VITE_SUPABASE_URL`（Vite 项目使用）

### 2. 环境选择

确保勾选所有三个环境：
- ✅ **Production** - 生产环境（www.joyboyjoyboy588.me）
- ✅ **Preview** - 预览环境（PR 部署）
- ✅ **Development** - 开发环境（本地构建）

### 3. 添加后必须重新部署

环境变量不会自动应用到现有部署，必须：

**方法 1：手动重新部署**
1. 进入 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧 "..." 菜单
4. 选择 **Redeploy**

**方法 2：推送代码触发自动部署**
```bash
git add .
git commit -m "更新环境变量配置"
git push origin main
```

---

## ✅ 验证配置是否生效

### 1. 等待部署完成

- 在 Vercel Dashboard 的 **Deployments** 标签查看进度
- 通常需要 2-3 分钟

### 2. 访问生产网站

访问：https://www.joyboyjoyboy588.me

### 3. 强制刷新浏览器

- **Windows:** Ctrl + F5
- **Mac:** Cmd + Shift + R

### 4. 验证数据加载

- ✅ 应该看到真实的 10 台设备数据
- ✅ 设备信息应该与本地开发环境一致
- ✅ 浏览器控制台（F12）没有 Supabase 配置警告

### 5. 测试功能

- ✅ 编辑设备信息
- ✅ 添加维护记录
- ✅ 测试出库功能
- ✅ 刷新页面后数据保持

---

## 📊 配置完成检查清单

使用此清单确保所有步骤都已完成：

- [ ] 在 Vercel 添加 `VITE_SUPABASE_URL`
- [ ] 在 Vercel 添加 `VITE_SUPABASE_ANON_KEY`
- [ ] 两个变量都勾选了 Production, Preview, Development
- [ ] 变量名使用 `VITE_` 前缀（不是 `NEXT_PUBLIC_`）
- [ ] 点击保存
- [ ] 重新部署项目
- [ ] 等待部署完成
- [ ] 访问网站并强制刷新
- [ ] 验证数据正确加载
- [ ] 测试核心功能正常

---

## 🔄 自动部署工作流

配置完成后，您的工作流程将是：

```
┌──────────────┐
│  本地开发     │
│  修改代码     │
└──────┬───────┘
       │
       │ git push
       ↓
┌──────────────┐
│   GitHub     │
│   代码仓库    │
└──────┬───────┘
       │
       │ 自动触发
       ↓
┌──────────────┐
│   Vercel     │
│   自动构建    │ ← 注入环境变量
└──────┬───────┘
       │
       │ 部署完成
       ↓
┌──────────────┐
│  生产网站     │
│  自动更新     │
└──────────────┘
```

**关键点：**
1. 推送代码到 GitHub → Vercel 自动检测
2. Vercel 自动构建项目 → 注入环境变量
3. 构建完成后自动部署 → 网站更新
4. 整个过程无需手动干预

---

## 🔧 故障排除

### 问题 1: 网站仍显示演示数据

**可能原因：**
- 环境变量名称错误（使用了 `NEXT_PUBLIC_` 而不是 `VITE_`）
- 没有重新部署
- 浏览器缓存

**解决方案：**
```bash
# 1. 检查 Vercel 环境变量名称
# Settings > Environment Variables
# 确认是 VITE_SUPABASE_URL 而不是 NEXT_PUBLIC_SUPABASE_URL

# 2. 重新部署
# Deployments > 最新部署 > ... > Redeploy

# 3. 清除浏览器缓存
# Chrome: Ctrl + Shift + Delete
# 或使用无痕模式访问
```

### 问题 2: 部署成功但功能报错

**可能原因：**
- Supabase 数据库未正确配置
- 环境变量值有误（多余空格、引号等）
- RLS 策略未配置

**解决方案：**
```bash
# 1. 检查浏览器控制台错误
# F12 > Console 标签
# 查看具体错误信息

# 2. 验证环境变量值
# 确保 URL 和 KEY 没有多余的空格或引号
# 正确：https://your-project-id.supabase.co
# 错误："https://your-project-id.supabase.co"

# 3. 检查 Supabase 数据库配置
# 参考 SUPABASE_SETUP.md 确认 RLS 策略已配置
```

### 问题 3: 部署失败

**可能原因：**
- 构建错误
- 依赖安装失败
- 环境变量在构建时未正确注入

**解决方案：**
```bash
# 1. 查看 Vercel 部署日志
# Deployments > 失败的部署 > 点击查看详细日志

# 2. 本地测试构建
npm run build

# 3. 检查 package.json 和依赖
npm install

# 4. 如果本地构建成功，重新推送
git push origin main
```

### 问题 4: Preview 环境正常，Production 环境异常

**可能原因：**
- Production 环境变量未配置
- 环境变量只选择了 Preview 而没有选择 Production

**解决方案：**
1. 进入 Vercel Settings > Environment Variables
2. 编辑每个环境变量
3. 确保 **Production** 已勾选
4. 保存并重新部署

---

## 🔐 安全注意事项

### ANON KEY 是否安全？

✅ **是的，ANON KEY 可以安全暴露在前端代码中**

原因：
1. ANON KEY 是公开密钥，设计用于客户端
2. 真正的安全由 Supabase 的 RLS（Row Level Security）策略控制
3. ANON KEY 只能执行您在 RLS 策略中允许的操作

### 不应该暴露的密钥

❌ **这些密钥绝不能暴露在前端或 Git 仓库中：**
- `SERVICE_ROLE_KEY` - 服务端密钥，拥有完全权限
- 数据库密码 - 用于直接连接数据库
- API 密钥 - 第三方服务的密钥

### 最佳实践

1. ✅ 将 `.env` 文件添加到 `.gitignore`（已配置）
2. ✅ 使用 `.env.example` 作为模板（已创建）
3. ✅ 在 Vercel 中配置环境变量，不要硬编码
4. ✅ 定期检查 Supabase RLS 策略

---

## 📚 相关文档

- [LOCAL_SETUP.md](./LOCAL_SETUP.md) - 本地开发环境配置
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase 详细配置
- [GIT_COMMANDS.md](./GIT_COMMANDS.md) - Git 常用命令
- [README.md](./README.md) - 项目概述

---

## 🆘 需要帮助？

如果遇到问题：
1. 查看 Vercel 部署日志
2. 查看浏览器控制台错误信息（F12）
3. 查看 Supabase 项目日志
4. 参考上述故障排查部分

---

**配置完成时间：** 2025-10-14
**最后更新：** 2025-10-14
