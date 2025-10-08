# Figma MCP 配置指南

本指南将帮助您配置 Figma Model Context Protocol (MCP) 连接，以便 AI 助手能够访问和理解您的 Figma 设计文件。

## 前提条件

- Node.js 和 npm 已安装
- 有权访问 Figma 文件：`pLarcIzb1aIELsn6Kwg8nw`（技术支持设备管理网站）

## 配置步骤

### 1. 获取 Figma Personal Access Token

1. 登录 [Figma](https://www.figma.com)
2. 点击右上角的头像，选择 **Settings**
3. 在左侧菜单中选择 **Account**
4. 滚动到 **Personal access tokens** 部分
5. 点击 **Generate new token**
6. 给 token 起一个描述性的名字（例如：`MCP Device Management`）
7. 复制生成的 token（这个 token 只会显示一次！）

### 2. 配置环境变量

1. 在项目根目录创建 `.env` 文件（如果还没有）：
   ```bash
   cp .env.example .env
   ```

2. 在 `.env` 文件中添加您的 Figma token：
   ```env
   FIGMA_PERSONAL_ACCESS_TOKEN=figd_your_actual_token_here
   ```

### 3. 安装 Figma MCP Server（可选）

如果您想要在本地测试 MCP 连接，可以全局安装：

```bash
npm install -g @modelcontextprotocol/server-figma
```

或者配置会在首次使用时通过 `npx` 自动下载。

### 4. 验证配置

MCP 配置文件位于 `.cascade/mcp-config.json`，其中包含：

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-figma"],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "YOUR_FIGMA_TOKEN_HERE"
      }
    }
  },
  "figma": {
    "defaultFileKey": "pLarcIzb1aIELsn6Kwg8nw",
    "description": "技术支持设备管理网站设计文件"
  }
}
```

## 使用方式

配置完成后，AI 助手将能够：

1. **读取设计规范**
   - 访问组件样式（颜色、字体、间距等）
   - 查看设计 tokens
   - 获取组件结构

2. **同步设计更新**
   - 检测 Figma 文件中的变化
   - 更新设计系统规则文档
   - 提示代码需要更新的部分

3. **生成代码**
   - 根据 Figma 组件生成 React 组件
   - 导出样式到 CSS/Tailwind
   - 创建 Storybook stories

## 当前 Figma 文件信息

- **文件名**: 技术支持设备管理网站
- **文件 Key**: `pLarcIzb1aIELsn6Kwg8nw`
- **设计系统规则**: `.cascade/design_system_rules.md`

## 常见问题

### Token 权限不足
确保您的 Figma token 有权访问目标文件。如果文件在团队中，确保您的账户有相应权限。

### npx 下载慢
如果 `npx` 下载 MCP server 很慢，可以：
1. 使用国内 npm 镜像：`npm config set registry https://registry.npmmirror.com`
2. 或预先全局安装：`npm install -g @modelcontextprotocol/server-figma`

### 环境变量未生效
确保：
1. `.env` 文件在项目根目录
2. 文件名正确（不是 `.env.txt`）
3. Token 格式正确（通常以 `figd_` 开头）
4. 重启了开发服务器或 AI 助手

## 安全提示

⚠️ **重要**：
- 永远不要将 `.env` 文件提交到 Git
- 不要在代码中硬编码 Figma token
- 定期轮换 Personal Access Token
- 如果 token 泄露，立即在 Figma 设置中撤销

## 下一步

配置完成后，您可以：

1. 要求 AI 助手读取最新的设计规范
2. 同步 Figma 中的设计变更
3. 根据 Figma 组件生成或更新代码

## 相关文档

- [Figma API 文档](https://www.figma.com/developers/api)
- [Model Context Protocol 规范](https://modelcontextprotocol.io/)
- [项目设计系统规则](./.cascade/design_system_rules.md)
