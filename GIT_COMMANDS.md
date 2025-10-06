# Git 推送到 GitHub 命令清单

## 🚀 快速开始（复制粘贴即可）

### 步骤 1: 初始化 Git（如果还没有）

```bash
git init
```

### 步骤 2: 添加所有文件

```bash
git add .
```

### 步骤 3: 查看将要提交的文件（可选）

```bash
git status
```

你应该看到：
- ✅ 绿色的文件：将要提交的文件
- ❌ `.env` 文件**不应该**出现（已被 .gitignore 忽略）

### 步骤 4: 创建首次提交

```bash
git commit -m "feat: 初始化设备管理系统，集成 Supabase 数据持久化"
```

### 步骤 5: 在 GitHub 创建仓库

1. 访问：https://github.com/new
2. 填写：
   - Repository name: `tech-support-device-management`（或其他名字）
   - Description: `技术支持设备管理网站`
   - 选择 Private（推荐）
3. **不要**勾选任何初始化选项
4. 点击 "Create repository"

### 步骤 6: 关联远程仓库

**复制 GitHub 显示的命令，或使用以下模板：**

```bash
# 替换 YOUR_USERNAME 和 YOUR_REPO_NAME
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**实际示例**：
```bash
git remote add origin https://github.com/zhangsan/tech-support-device-management.git
git branch -M main
git push -u origin main
```

### 步骤 7: 验证推送成功

刷新 GitHub 页面，你应该看到所有文件已上传！

---

## 📋 推送前检查清单

在执行 `git push` 之前，确认：

- [ ] `.gitignore` 文件存在
- [ ] `.env` 文件**不会**被提交（已在 .gitignore 中）
- [ ] `node_modules` 文件夹**不会**被提交
- [ ] 所有源代码文件都已添加
- [ ] GitHub 仓库已创建

---

## 🔐 如果需要使用 Personal Access Token

如果推送时要求输入密码，GitHub 现在需要使用 Token：

### 创建 Token

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" > "Generate new token (classic)"
3. 设置：
   - Note: `Vercel Deployment`
   - Expiration: `90 days` 或 `No expiration`
   - 勾选：`repo` (完整权限)
4. 点击 "Generate token"
5. **复制并保存 token**（只显示一次！）

### 使用 Token 推送

```bash
# 方法 1: 在 URL 中包含 token
git remote set-url origin https://YOUR_TOKEN@github.com/USERNAME/REPO.git
git push

# 方法 2: 推送时输入
# Username: 你的 GitHub 用户名
# Password: 粘贴你的 token（不是密码）
git push
```

---

## 🔄 后续更新流程

每次修改代码后：

```bash
# 1. 查看更改
git status

# 2. 添加更改
git add .

# 3. 提交更改
git commit -m "描述你的更改"

# 4. 推送到 GitHub
git push
```

**提交信息示例**：
```bash
git commit -m "feat: 添加设备批量导入功能"
git commit -m "fix: 修复设备编辑保存失败问题"
git commit -m "docs: 更新部署文档"
git commit -m "style: 优化设备卡片样式"
```

---

## 🆘 常见问题

### Q: 推送时提示 "fatal: remote origin already exists"

```bash
# 删除现有的 origin
git remote remove origin

# 重新添加
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Q: 推送时提示 "Updates were rejected"

```bash
# 先拉取远程更改
git pull origin main --allow-unrelated-histories

# 再推送
git push -u origin main
```

### Q: 不小心提交了 .env 文件

```bash
# 从 Git 中移除（但保留本地文件）
git rm --cached .env

# 提交更改
git commit -m "chore: 移除 .env 文件"

# 推送
git push
```

### Q: 想撤销最后一次提交

```bash
# 撤销提交但保留更改
git reset --soft HEAD~1

# 撤销提交并丢弃更改（危险！）
git reset --hard HEAD~1
```

### Q: 查看提交历史

```bash
git log --oneline
```

---

## 📊 Git 状态说明

运行 `git status` 后：

- **红色文件**: 未添加到暂存区
- **绿色文件**: 已添加，等待提交
- **Untracked files**: 新文件，Git 还不知道
- **Modified**: 已修改的文件
- **Deleted**: 已删除的文件

---

## ✅ 推送成功的标志

推送成功后，你会看到类似输出：

```
Enumerating objects: 100, done.
Counting objects: 100% (100/100), done.
Delta compression using up to 8 threads
Compressing objects: 100% (85/85), done.
Writing objects: 100% (100/100), 50.00 KiB | 5.00 MiB/s, done.
Total 100 (delta 20), reused 0 (delta 0)
To https://github.com/username/repo.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## 🎯 下一步

推送成功后：

1. ✅ 刷新 GitHub 页面确认文件已上传
2. ✅ 前往 Vercel 导入仓库
3. ✅ 配置环境变量
4. ✅ 部署！

详细步骤请查看 [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
