# 部署指南：从 GitHub 到 Vercel

## 📋 部署流程概览

```
本地代码 → GitHub 仓库 → Vercel 部署 → 配置 Supabase → 上线
```

---

## 第一步：推送代码到 GitHub

### 1.1 初始化 Git 仓库（如果还没有）

```bash
# 在项目根目录执行
git init
```

### 1.2 添加所有文件到 Git

```bash
# 添加所有文件
git add .

# 查看将要提交的文件
git status
```

### 1.3 创建首次提交

```bash
git commit -m "feat: 初始化技术支持设备管理网站，集成 Supabase"
```

### 1.4 在 GitHub 上创建仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `tech-support-device-management` (或你喜欢的名字)
   - **Description**: `技术支持设备管理网站 - 设备监控与维护管理系统`
   - **Visibility**: Public 或 Private（推荐 Private）
3. **不要**勾选 "Add a README file"（我们已经有了）
4. 点击 "Create repository"

### 1.5 关联远程仓库并推送

复制 GitHub 显示的命令，或执行以下命令：

```bash
# 添加远程仓库（替换成你的 GitHub 用户名和仓库名）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 推送代码
git branch -M main
git push -u origin main
```

**示例**：
```bash
git remote add origin https://github.com/zhangsan/tech-support-device-management.git
git branch -M main
git push -u origin main
```

### 1.6 验证推送成功

刷新 GitHub 仓库页面，应该能看到所有文件已上传。

---

## 第二步：配置 Supabase 数据库

在部署到 Vercel 之前，先配置好 Supabase：

### 2.1 创建 Supabase 项目

1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 创建新项目：
   - **Name**: `device-management`
   - **Database Password**: 设置一个强密码（保存好）
   - **Region**: 选择离你最近的区域（如 Singapore）
4. 等待项目创建完成（约 2 分钟）

### 2.2 执行数据库脚本

1. 在 Supabase 项目中，进入 **SQL Editor**
2. 点击 "New query"
3. 复制 `SUPABASE_SETUP.md` 中的完整 SQL 脚本
4. 粘贴并点击 "Run" 执行

**重要**：确保执行以下三部分 SQL：
- ✅ 创建表结构（devices, maintenance_logs, issues）
- ✅ 插入初始数据
- ✅ 配置 RLS 策略

### 2.3 获取 API 密钥

1. 进入 **Settings** > **API**
2. 复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (很长的字符串)

**保存这两个值**，稍后在 Vercel 中需要用到！

---

## 第三步：部署到 Vercel

### 3.1 登录 Vercel

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录（推荐）

### 3.2 导入 GitHub 仓库

1. 点击 "Add New..." > "Project"
2. 选择 "Import Git Repository"
3. 找到你刚才推送的仓库，点击 "Import"

### 3.3 配置项目

**Framework Preset**: Vite（应该会自动检测）

**Root Directory**: `./` (默认)

**Build Command**: `npm run build` (默认)

**Output Directory**: `dist` (默认)

### 3.4 配置环境变量 ⚠️ 重要！

在 "Environment Variables" 部分添加：

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | 你的 Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | 你的 Supabase anon key |

**示例**：
```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.5 开始部署

1. 点击 "Deploy"
2. 等待构建完成（约 1-2 分钟）
3. 部署成功后会显示预览链接

---

## 第四步：验证部署

### 4.1 访问网站

点击 Vercel 提供的域名（如 `https://your-project.vercel.app`）

### 4.2 测试功能清单

- [ ] 页面正常加载
- [ ] 能看到设备列表
- [ ] 点击设备查看详情
- [ ] 编辑设备信息并保存
- [ ] 刷新页面，编辑的内容仍然存在 ✅ **关键测试**
- [ ] 添加维护记录
- [ ] 快速更新设备位置

### 4.3 检查控制台

打开浏览器开发者工具（F12），检查：
- ✅ 没有红色错误
- ✅ 没有 "Supabase not configured" 警告
- ✅ 网络请求正常（能看到 Supabase API 调用）

---

## 🎉 部署成功！

你的网站现在已经在线了！

### 获取永久域名

Vercel 会自动分配一个域名：`your-project.vercel.app`

如果想使用自定义域名：
1. 在 Vercel 项目设置中进入 "Domains"
2. 添加你的域名
3. 按照提示配置 DNS

---

## 📝 后续更新流程

每次修改代码后：

```bash
# 1. 提交更改
git add .
git commit -m "描述你的更改"

# 2. 推送到 GitHub
git push

# 3. Vercel 会自动检测并重新部署（约 1-2 分钟）
```

---

## 🔧 常见问题

### Q: 部署后显示 "Supabase not configured"

**A**: 检查 Vercel 环境变量是否正确配置：
1. 进入 Vercel 项目 Settings > Environment Variables
2. 确认变量名以 `VITE_` 开头
3. 确认值没有多余的空格或引号
4. 修改后需要重新部署（Settings > Deployments > Redeploy）

### Q: 数据无法保存

**A**: 检查 Supabase RLS 策略：
1. 进入 Supabase Dashboard
2. 进入 Authentication > Policies
3. 确认三个表都有允许操作的策略

### Q: 构建失败

**A**: 查看 Vercel 部署日志：
1. 进入 Deployments 页面
2. 点击失败的部署
3. 查看 "Building" 部分的错误信息
4. 常见原因：依赖安装失败、TypeScript 错误

### Q: 推送到 GitHub 失败

**A**: 可能的原因：
1. **认证问题**: 使用 GitHub Personal Access Token
   ```bash
   # 设置 token
   git remote set-url origin https://YOUR_TOKEN@github.com/USERNAME/REPO.git
   ```
2. **仓库不存在**: 确认 GitHub 仓库已创建
3. **分支名称**: 确认使用 `main` 而不是 `master`

---

## 📚 相关资源

- [GitHub 文档](https://docs.github.com)
- [Vercel 文档](https://vercel.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Git 基础教程](https://git-scm.com/book/zh/v2)

---

## 🎯 快速命令参考

```bash
# Git 基础命令
git status              # 查看文件状态
git add .              # 添加所有文件
git commit -m "消息"   # 提交更改
git push               # 推送到远程
git pull               # 拉取远程更改

# 查看远程仓库
git remote -v

# 撤销操作
git reset HEAD~1       # 撤销最后一次提交（保留更改）
git checkout -- file   # 撤销文件更改
```

---

**祝部署顺利！** 🚀

如有问题，请检查：
1. GitHub 仓库是否推送成功
2. Supabase 数据库是否配置完成
3. Vercel 环境变量是否正确
4. 浏览器控制台的错误信息
