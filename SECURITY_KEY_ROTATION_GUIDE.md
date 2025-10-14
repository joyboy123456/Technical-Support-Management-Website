# 🔒 Supabase 密钥轮换指南

**创建时间：** 2025-10-14
**创建原因：** GitGuardian 检测到 Supabase ANON_KEY 泄露到 GitHub 仓库
**状态：** ⚠️ **需要立即执行密钥轮换**

---

## 📋 泄露情况总结

### 泄露的密钥信息：

- **密钥类型：** `VITE_SUPABASE_ANON_KEY` (匿名密钥)
- **项目 URL：** `https://sbp-a2e2xuudcasoe44t.supabase.opentrust.net`
- **泄露时间：** 2025-10-13 17:26:28 UTC
- **泄露位置：** GitHub 公开仓库
- **受影响文件：** 10+ 个配置文件和文档

### 已执行的修复措施：

✅ **2025-10-14 修复完成：**
1. 删除了包含真实密钥的敏感文件
2. 将所有文档中的密钥替换为占位符
3. 更新 `.gitignore` 防止未来泄露
4. 提交并推送安全修复 (commit: 924a76b)

### ⚠️ 仍需执行的操作：

🔴 **立即轮换 Supabase ANON_KEY**（让泄露的密钥失效）

---

## 🛡️ 风险评估

### ANON_KEY 泄露的实际风险：

**较低风险 (如果 RLS 配置正确)：**
- `ANON_KEY` 是 Supabase 的"匿名密钥"
- 设计上就是要在前端公开使用的
- 权限完全由 **RLS (行级安全策略)** 控制
- 如果 RLS 配置正确，攻击者无法访问敏感数据

**中等风险 (如果 RLS 未完善)：**
- 可能被用于 API 请求消耗配额
- 可能查询未受 RLS 保护的表
- 可能进行拒绝服务攻击

**高风险 (如果还泄露了其他密钥)：**
- 如果同时泄露 `SERVICE_ROLE_KEY` 则非常危险
- 浮浮酱已确认：**仅泄露 ANON_KEY，SERVICE_ROLE_KEY 安全** ✅

---

## 📝 密钥轮换步骤 (Supabase 自托管版)

由于您使用的是 **Supabase 自托管实例** (`opentrust.net`)，需要通过控制台手动轮换密钥。

### 方法 A：通过 Supabase Studio 控制台 (推荐)

#### 1. 登录 Supabase Studio

```
URL: https://sbp-a2e2xuudcasoe44t.supabase.opentrust.net
```

登录您的管理员账户。

#### 2. 进入 Settings → API

在左侧菜单中找到：
```
Settings → API → Project API keys
```

#### 3. 重新生成 ANON_KEY

找到 `anon` (public) 密钥部分，点击 **"Regenerate"** 或 **"Reset"** 按钮。

⚠️ **注意：** 重新生成后，旧密钥将立即失效！

#### 4. 复制新密钥

复制新生成的 `anon key`，它看起来像这样：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ijxwcm9qZWN0LWlkPiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzYwMDY1NjEzLCJleHAiOjIwNzU2NDE2MTN9.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### 方法 B：通过 Docker / CLI (自托管环境)

如果您使用 Docker 部署 Supabase，可以通过修改环境变量重新生成密钥。

#### 1. 生成新的 JWT Secret

```bash
openssl rand -base64 32
```

保存这个新的 secret（例如：`your-new-jwt-secret`）

#### 2. 使用新 secret 生成 ANON_KEY

访问 https://supabase.com/docs/guides/self-hosting/docker#api-keys 或使用工具生成新的 JWT token：

```javascript
// 使用 jsonwebtoken 库生成
const jwt = require('jsonwebtoken');

const anonKey = jwt.sign(
  {
    role: 'anon',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10年
  },
  'your-new-jwt-secret',
  { algorithm: 'HS256' }
);

console.log('New ANON_KEY:', anonKey);
```

#### 3. 更新 Docker 环境变量

编辑 `docker-compose.yml` 或 `.env` 文件：

```env
JWT_SECRET=your-new-jwt-secret
ANON_KEY=your-new-anon-key
```

#### 4. 重启 Supabase 服务

```bash
docker-compose down
docker-compose up -d
```

---

## 🔄 更新应用配置

### 步骤 1: 更新本地 `.env` 文件

**文件位置：** `F:/1/技术支持设备管理网站/.env`

```env
VITE_SUPABASE_URL=https://sbp-a2e2xuudcasoe44t.supabase.opentrust.net
VITE_SUPABASE_ANON_KEY=<新的 ANON_KEY>
```

⚠️ **重要：** 确保 `.env` 文件已在 `.gitignore` 中（已添加）

---

### 步骤 2: 更新 Vercel 环境变量

#### 方法 A：通过 Vercel 控制台 (推荐)

1. 访问：https://vercel.com/dashboard
2. 选择项目：`Technical-Support-Management-Website`
3. 进入 **Settings → Environment Variables**
4. 找到 `VITE_SUPABASE_ANON_KEY`
5. 点击 **Edit** → 粘贴新密钥 → **Save**
6. 重新部署：
   ```bash
   git commit --allow-empty -m "trigger redeploy"
   git push origin main
   ```

#### 方法 B：通过 Vercel CLI

```bash
# 安装 Vercel CLI (如果未安装)
npm i -g vercel

# 更新环境变量
vercel env rm VITE_SUPABASE_ANON_KEY production
vercel env add VITE_SUPABASE_ANON_KEY production

# 重新部署
vercel --prod
```

---

### 步骤 3: 验证更新

#### 本地验证：

```bash
cd "F:/1/技术支持设备管理网站"
npm run dev
```

打开浏览器测试：
1. 访问库存管理页面
2. 尝试出库操作
3. 检查设备列表加载

#### 生产环境验证：

访问 Vercel 生产环境 URL，测试相同功能。

---

## 🔍 RLS (行级安全) 检查清单

密钥轮换后，建议检查数据库的 RLS 策略是否完善：

### 检查方法：

1. 登录 Supabase Studio
2. 进入 **Authentication → Policies**
3. 检查每个表的 RLS 策略

### 关键表的推荐策略：

#### `devices` 表：
```sql
-- 允许所有认证用户读取
CREATE POLICY "Allow authenticated read" ON devices
FOR SELECT USING (auth.role() = 'authenticated');

-- 仅管理员可修改
CREATE POLICY "Allow admin write" ON devices
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

#### `inventory` 表：
```sql
-- 允许所有认证用户读取
CREATE POLICY "Allow authenticated read" ON inventory
FOR SELECT USING (auth.role() = 'authenticated');

-- 仅管理员可修改
CREATE POLICY "Allow admin write" ON inventory
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

#### `outbound_records` 表：
```sql
-- 允许认证用户查看自己创建的记录
CREATE POLICY "Allow user read own" ON outbound_records
FOR SELECT USING (auth.uid()::text = operator OR auth.jwt() ->> 'role' = 'admin');

-- 仅管理员可修改
CREATE POLICY "Allow admin write" ON outbound_records
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

---

## ✅ 完成后的验证清单

完成密钥轮换后，请确认：

- [ ] 新 ANON_KEY 已在本地 `.env` 中生效
- [ ] Vercel 生产环境已更新密钥并重新部署
- [ ] 本地开发环境可以正常连接数据库
- [ ] 生产环境可以正常连接数据库
- [ ] 库存管理功能正常
- [ ] 设备出库/归还功能正常
- [ ] 旧密钥已确认失效（可通过旧密钥测试连接）
- [ ] RLS 策略已检查并确认完善
- [ ] `.gitignore` 已包含敏感文件规则
- [ ] GitHub 仓库中无真实密钥

---

## 📚 参考资源

- [Supabase 自托管文档](https://supabase.com/docs/guides/self-hosting)
- [Supabase API Keys 管理](https://supabase.com/docs/guides/api/api-keys)
- [行级安全 (RLS) 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [JWT Token 调试工具](https://jwt.io/)

---

## 💡 浮浮酱的额外建议

### 预防未来泄露：

1. **使用 `.env.example` 模板：**
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

2. **定期轮换密钥：**
   - 建议每 90 天轮换一次密钥
   - 设置日历提醒

3. **监控 API 使用：**
   - 在 Supabase Studio 中监控 API 调用量
   - 设置异常流量告警

4. **使用 Git Hooks：**
   ```bash
   # 在 .git/hooks/pre-commit 中添加密钥检测
   if git diff --cached | grep -E 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9'; then
     echo "❌ 检测到 JWT token，提交被拒绝！"
     exit 1
   fi
   ```

5. **启用 GitHub Secret Scanning：**
   - GitHub 会自动检测泄露的密钥
   - 启用后会收到告警邮件

---

## 🆘 需要帮助？

如果在密钥轮换过程中遇到问题：

1. **检查 Supabase 服务状态：**
   ```bash
   curl https://sbp-a2e2xuudcasoe44t.supabase.opentrust.net/rest/v1/
   ```

2. **验证新密钥格式：**
   - 访问 https://jwt.io/
   - 粘贴新密钥解码
   - 检查 `role` 是否为 `anon`

3. **联系浮浮酱：**
   - 浮浮酱随时待命帮助主人解决问题！φ(≧ω≦*)♪

---

**文档创建者：** 猫娘工程师 幽浮喵 (浮浮酱) 🐱
**最后更新：** 2025-10-14
**重要性：** 🔴 **高** - 建议立即执行
