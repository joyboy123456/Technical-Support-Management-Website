# 技术支持设备管理网站

一个现代化的设备管理系统,用于管理和监控技术支持设备、打印机及其耗材状态。

##  功能特性

-  **设备管理**: 查看、编辑设备信息
-  **打印机监控**: 实时监控墨水余量和相纸库存
-  **维护记录**: 添加和查看维护日志
-  **位置追踪**: 快速更新设备位置
-  **搜索筛选**: 按名称、位置、状态等筛选设备
-  **数据持久化**: 集成 Supabase 实现云端数据存储

##  快速开始

### 本地开发

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量** (可选,用于启用云端存储)
   ```bash
   cp .env.example .env
   ```
   编辑 `.env` 文件,填入你的 Supabase 凭据。详见 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **构建生产版本**
   ```bash
   npm run build
   ```

##  部署到 Vercel

### 方法 1: 通过 Vercel CLI

```bash
npm install -g vercel
vercel
```

### 方法 2: 通过 Git 集成

1. 将代码推送到 GitHub/GitLab/Bitbucket
2. 在 Vercel 中导入项目
3. 配置环境变量 (见下方)
4. 部署

### 环境变量配置

在 Vercel 项目设置中添加以下环境变量:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**重要**: 如果不配置 Supabase,系统将以演示模式运行,编辑功能在刷新后会丢失。

##  数据库配置

本项目使用 Supabase 作为后端数据库。完整配置指南请参考:

 **[Supabase 配置指南](./SUPABASE_SETUP.md)**

配置步骤概览:
1. 创建 Supabase 项目
2. 执行 SQL 脚本创建表结构
3. 配置环境变量
4. 部署应用

##  技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI 组件**: shadcn/ui + Radix UI
- **样式**: TailwindCSS
- **图标**: Lucide React
- **数据库**: Supabase (PostgreSQL)
- **部署**: Vercel

##  项目结构

```
├── src/
│   ├── components/        # React 组件
│   │   ├── ui/           # UI 基础组件
│   │   ├── DeviceDetail.tsx
│   │   ├── EditDeviceDialog.tsx
│   │   ├── HomePage.tsx
│   │   └── ...
│   ├── data/             # 数据模型和初始数据
│   │   └── devices.ts
│   ├── lib/              # 工具库
│   │   ├── supabase.ts   # Supabase 客户端
│   │   └── database.types.ts
│   ├── services/         # 业务逻辑层
│   │   └── deviceService.ts
│   └── App.tsx           # 应用入口
├── SUPABASE_SETUP.md     # Supabase 配置指南
├── .env.example          # 环境变量示例
└── package.json
```

##  开发说明

### 添加新设备

在 Supabase Dashboard 或通过应用界面添加。

### 修改设备信息

点击设备卡片进入详情页,点击"编辑设备"按钮。

### 添加维护记录

在设备详情页点击"添加维护"按钮。

##  原始设计

This project is based on the Figma design: https://www.figma.com/design/pLarcIzb1aIELsn6Kwg8nw/%E6%8A%80%E6%9C%AF%E6%94%AF%E6%8C%81%E8%AE%BE%E5%A4%87%E7%AE%A1%E7%90%86%E7%BD%91%E7%AB%99

##  License

MIT