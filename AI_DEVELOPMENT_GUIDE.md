# AI 开发指南

本文档为 AI 编程助手（如 GitHub Copilot、Claude、Cursor、Windsurf 等）提供项目开发规范。

## 数据库操作规范

### Supabase 连接方式
- ✅ 通过创建 Node.js 脚本连接数据库
- ✅ 使用 `.env` 中的凭据（`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`）
- ✅ 使用 `@supabase/supabase-js` SDK 进行操作
- ❌ 不直接使用 PostgreSQL 连接字符串

### 临时脚本管理规范
**重要：所有临时测试脚本用完后必须立即删除**

1. **一次性测试脚本** - 执行完立即删除
   ```bash
   # 创建临时脚本
   scripts/test-xxx.js
   
   # 执行测试
   node scripts/test-xxx.js
   
   # 删除脚本
   rm scripts/test-xxx.js
   ```

2. **可能重复使用的工具脚本** - 询问用户是否保留
   - 如果是诊断、检查类的工具脚本，可能有复用价值
   - 创建前先检查 `scripts/` 目录是否已有类似脚本
   - 询问用户是否需要保留

3. **Git 提交规范**
   - 如果临时脚本已提交到 Git，删除后需要提交删除操作
   ```bash
   git add scripts/xxx.js
   git commit -m "chore: remove temporary test script"
   git push origin main
   ```

### 现有数据库脚本
项目中已有的持久化脚本（**不要删除**）：
- `scripts/setup-env.js` - 环境配置
- `scripts/test-database.js` - 数据库连接测试
- `scripts/test-supabase-sync.js` - Supabase 同步测试
- `scripts/diagnose-connection.js` - 连接诊断
- `scripts/backup-database.js` - 数据库备份
- `scripts/db-execute.js` - SQL 执行工具
- `scripts/db-migrate.js` - 数据库迁移

## 代码规范

### 删除数据库字段
- ✅ 使用 `null` 清空可选字段
  ```typescript
  await updateDevice(deviceId, { coverImage: null as any });
  ```
- ❌ 不使用 `undefined`（会被 Supabase 忽略）
- ❌ 不使用空字符串 `''`（对某些字段无效）

### Git 提交规范
遵循 Conventional Commits：
- `feat:` 新功能
- `fix:` 错误修复
- `chore:` 杂项（如删除临时文件）
- `refactor:` 重构
- `docs:` 文档更新
- `test:` 测试相关

每次提交都要添加 co-author：
```
Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
```

## 测试规范

### 运行测试前
1. 检查数据库连接：`npm run test:db`
2. 运行构建验证：`npm run build`
3. 运行 E2E 测试：`npm run test:e2e`

### 数据库操作测试
- 对数据库写操作前，先在测试脚本中验证
- 使用测试数据，不影响生产数据
- 测试完成后清理测试数据

## 安全注意事项

### 敏感信息
- ❌ 永远不要在代码中硬编码凭据
- ❌ 不要将 `.env` 文件提交到 Git
- ✅ 使用环境变量读取敏感配置
- ✅ `.env.example` 只包含示例值

### 数据库权限
- 当前使用的是 `anon key`（匿名密钥），受 RLS 策略限制
- 不要尝试访问或修改超出权限范围的数据

## 开发流程

### 修复 Bug 流程
1. 创建测试脚本验证问题
2. 修复代码
3. 运行测试脚本验证修复
4. 删除临时测试脚本
5. 提交代码（包含删除脚本的操作）

### 添加新功能流程
1. 检查现有代码和数据库结构
2. 实现功能
3. 运行 `npm run build` 验证编译
4. 创建测试验证功能
5. 提交代码

## 常用命令

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 测试数据库连接
npm run test:db

# E2E 测试
npm run test:e2e

# 数据库迁移
npm run migrate

# 检查迁移状态
npm run migrate:status
```

## AI 助手使用建议

当你作为 AI 助手在本项目工作时：
1. 首先阅读本文档了解项目规范
2. 查看 `package.json` 了解可用脚本
3. 查看 `README.md` 和其他文档了解项目结构
4. 遵循本文档的所有规范
5. 有疑问时询问用户，不要擅自决定

---

最后更新：2025-10-24
