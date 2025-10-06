# 🚀 部署指南

## Vercel 部署步骤

### 方法一：GitHub + Vercel（推荐）

1. **上传到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/device-management.git
   git push -u origin main
   ```

2. **Vercel 部署**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 导入 GitHub 仓库
   - 选择项目，点击 "Deploy"
   - 自动部署完成！

### 方法二：Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **部署**
   ```bash
   vercel
   # 按提示操作
   ```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 环境配置

- ✅ Node.js 18+
- ✅ React 18
- ✅ Vite 4+
- ✅ Tailwind CSS v4
- ✅ TypeScript

## 图片资源

本项目使用：
- Unsplash API 提供的高质量图片
- ImageWithFallback 组件确保图片加载失败时有备用方案
- 所有图片都是外部链接，无需本地存储

## 域名配置

部署后会自动获得：
- 免费域名：`your-project.vercel.app`
- 可在 Vercel 仪表板中添加自定义域名

## 功能特性

- ✅ 响应式设计
- ✅ 设备管理
- ✅ 维护记录
- ✅ 故障处理
- ✅ 图片加载优化
- ✅ 实时数据更新

## 支持

如有问题，请检查：
1. Node.js 版本是否兼容
2. 网络连接是否正常
3. 图片链接是否有效