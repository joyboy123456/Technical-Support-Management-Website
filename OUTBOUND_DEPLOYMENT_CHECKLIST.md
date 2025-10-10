# 出库系统部署检查清单

## 📋 系统现状总结

### ✅ 已完成的功能

1. **前端界面** (`OutboundManagement.tsx`)
   - ✅ 出库表单（设备选择、目的地、操作员）
   - ✅ 物资管理（相纸、墨水、路由器、配件等）
   - ✅ 出库历史记录查看
   - ✅ 归还功能（含损坏记录、归还备注）
   - ✅ UI组件完整（基于 shadcn/ui）
   - ✅ 路由配置 (`/outbound`)
   - ✅ 侧边栏导航入口

2. **服务层** (`outboundService.ts`)
   - ✅ Supabase 数据持久化集成
   - ✅ 出库记录创建 (`createOutboundRecord`)
   - ✅ 归还记录处理 (`returnOutboundItems`)
   - ✅ 库存充足性检查 (`checkStock`)
   - ✅ 库存自动扣减/归还
   - ✅ 审计日志记录
   - ✅ 错误处理和事务回滚

3. **数据库设计** (`0002_outbound_inventory.sql`)
   - ✅ `outbound_records` 表（出库记录）
   - ✅ `inventory` 表（库存管理）
   - ✅ `audit_logs` 表（审计日志）
   - ✅ 索引优化
   - ✅ RLS 行级安全策略
   - ✅ 统计视图（出库统计、低库存告警）
   - ✅ 事务安全函数

### 🔴 需要完成的工作

#### 1. 数据库迁移（必需）

**优先级：🔥 最高**

```bash
# 在 Supabase SQL Editor 中执行
# 1. 执行 0002_outbound_inventory.sql
# 2. 验证表创建成功
```

**检查项**：
- [ ] `inventory` 表已创建
- [ ] `outbound_records` 表已创建
- [ ] `audit_logs` 表已创建
- [ ] 初始库存数据已插入
- [ ] RLS 策略已启用
- [ ] 索引已创建

**验证 SQL**：
```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('inventory', 'outbound_records', 'audit_logs');

-- 检查初始库存
SELECT * FROM inventory;

-- 检查 RLS 策略
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('inventory', 'outbound_records', 'audit_logs');
```

---

#### 2. 环境变量配置（必需）

**优先级：🔥 最高**

在 Vercel 部署设置中配置：

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase 匿名密钥 |

**检查项**：
- [ ] Vercel 环境变量已配置
- [ ] 变量名前缀为 `VITE_`
- [ ] 值没有多余空格或引号
- [ ] 重新部署后环境变量生效

---

#### 3. 库存数据初始化（推荐）

**优先级：⚠️ 高**

根据实际情况调整初始库存数据：

```sql
-- 更新库存数据（根据实际情况修改）
UPDATE inventory SET
  paper_stock = '{
    "DNP DS620": {"4x6": 500, "5x7": 200, "6x8": 100},
    "DNP DS820": {"8x10": 150, "8x12": 100},
    "诚研 CP3800DW": {"4x6": 300, "5x7": 150},
    "西铁城 CX-02": {"4x6": 250}
  }'::jsonb,
  epson_ink_stock = '{"C": 10, "M": 10, "Y": 10, "K": 10}'::jsonb,
  equipment_stock = '{
    "routers": 20,
    "powerStrips": 30,
    "usbCables": 50,
    "networkCables": 40,
    "adapters": 25
  }'::jsonb,
  last_updated = NOW();
```

**检查项**：
- [ ] 相纸库存数据准确
- [ ] 墨水库存数据准确
- [ ] 设备配件库存数据准确
- [ ] 打印机型号与前端一致

---

#### 4. 数据库类型定义（可选但推荐）

**优先级：📝 中**

更新 TypeScript 类型定义：

```typescript
// src/lib/database.types.ts
export interface Database {
  public: {
    Tables: {
      inventory: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          paper_stock: Record<string, Record<string, number>>;
          epson_ink_stock: { C: number; M: number; Y: number; K: number };
          equipment_stock: {
            routers: number;
            powerStrips: number;
            usbCables: number;
            networkCables: number;
            adapters: number;
          };
          last_updated: string;
          remark?: string;
        };
        Insert: Omit<Database['public']['Tables']['inventory']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['inventory']['Insert']>;
      };
      outbound_records: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          device_id: string;
          device_name: string;
          destination: string;
          operator: string;
          items: any;
          notes?: string;
          status: 'outbound' | 'returned';
          return_info?: any;
        };
        Insert: Omit<Database['public']['Tables']['outbound_records']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['outbound_records']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          created_at: string;
          action_type: string;
          entity_type: string;
          entity_id: string;
          operator: string;
          details: any;
          ip_address?: string;
          user_agent?: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
}
```

---

## 🚀 部署步骤

### 第一步：准备数据库

1. **登录 Supabase Dashboard**
   - 访问 https://supabase.com/dashboard
   - 选择你的项目

2. **执行数据库迁移**
   ```
   SQL Editor → New Query → 粘贴 0002_outbound_inventory.sql → Run
   ```

3. **验证表创建**
   ```sql
   SELECT * FROM inventory;
   SELECT * FROM outbound_records LIMIT 10;
   SELECT * FROM audit_logs LIMIT 10;
   ```

4. **检查 RLS 策略**
   ```
   Authentication → Policies → 查看三个表的策略
   ```

---

### 第二步：配置 Vercel

1. **进入项目设置**
   ```
   Vercel Dashboard → 你的项目 → Settings → Environment Variables
   ```

2. **添加环境变量**
   - `VITE_SUPABASE_URL`: 从 Supabase Settings → API 复制
   - `VITE_SUPABASE_ANON_KEY`: 从 Supabase Settings → API 复制

3. **重新部署**
   ```
   Deployments → 最新部署 → ⋯ → Redeploy
   ```

---

### 第三步：代码推送

```bash
# 1. 提交代码
git add .
git commit -m "feat: 集成出库系统 Supabase 数据持久化"

# 2. 推送到 GitHub
git push origin main

# 3. Vercel 会自动检测并部署
```

---

### 第四步：功能测试

#### 测试检查清单

**基础功能**：
- [ ] 访问 `/outbound` 页面正常加载
- [ ] 能看到设备列表
- [ ] 能看到库存数据

**出库功能**：
- [ ] 选择设备和目的地
- [ ] 选择打印机型号和相纸类型
- [ ] 显示当前库存数量
- [ ] 输入出库数量
- [ ] 点击"提交出库记录"成功
- [ ] 刷新页面，出库记录仍然存在 ✅ **关键测试**
- [ ] 库存数量正确扣减

**库存不足测试**：
- [ ] 输入超过库存的数量
- [ ] 显示"库存不足"错误提示
- [ ] 库存未被扣减

**归还功能**：
- [ ] 在"出库历史"中点击"归还"按钮
- [ ] 填写归还操作员
- [ ] 调整归还数量
- [ ] 填写损坏情况（可选）
- [ ] 点击"提交归还"成功
- [ ] 记录状态变为"已归还"
- [ ] 库存正确增加

**审计日志**（可选）：
- [ ] 出库操作有审计日志
- [ ] 归还操作有审计日志
- [ ] 日志包含操作员、时间、详情

---

## 🔍 故障排查

### 问题 1: "Supabase not configured" 警告

**现象**：浏览器控制台显示警告，数据未保存

**解决方案**：
1. 检查 Vercel 环境变量是否配置
2. 变量名必须以 `VITE_` 开头
3. 重新部署 Vercel 项目
4. 清除浏览器缓存

---

### 问题 2: "relation does not exist" 错误

**现象**：点击出库按钮报错 `relation "outbound_records" does not exist`

**解决方案**：
1. 在 Supabase SQL Editor 执行迁移脚本
2. 检查表是否创建成功：
   ```sql
   \dt outbound_records
   ```
3. 如果表不存在，手动执行建表语句

---

### 问题 3: 出库成功但库存未扣减

**现象**：出库记录创建成功，但库存数量没有变化

**解决方案**：
1. 检查 `updateInventoryStock` 函数是否执行
2. 查看浏览器控制台错误
3. 检查 `inventory` 表的数据结构是否正确：
   ```sql
   SELECT paper_stock, equipment_stock FROM inventory;
   ```
4. 确认 JSON 字段格式正确

---

### 问题 4: 归还操作失败

**现象**：点击"提交归还"按钮没有反应或报错

**解决方案**：
1. 检查出库记录的 `status` 字段
2. 确认 `return_info` 字段可写入 JSONB
3. 查看审计日志是否记录了错误

---

### 问题 5: 页面刷新后数据丢失

**现象**：出库记录创建成功，但刷新页面后消失

**可能原因**：
- 数据只保存在内存中，未写入数据库
- 前端仍在使用 `inventory.ts` 而不是 `outboundService.ts`

**解决方案**：
1. 确认 `OutboundManagement.tsx` 已更新，导入了 `outboundService`
2. 检查 Network 标签，是否有 Supabase API 调用
3. 查看 Supabase Dashboard → Table Editor → outbound_records

---

## 📊 数据验证 SQL

```sql
-- 1. 查看所有出库记录
SELECT 
  id, 
  device_name, 
  destination, 
  operator, 
  status, 
  created_at 
FROM outbound_records 
ORDER BY created_at DESC;

-- 2. 查看当前库存
SELECT 
  paper_stock, 
  epson_ink_stock, 
  equipment_stock, 
  last_updated 
FROM inventory;

-- 3. 查看审计日志
SELECT 
  action_type, 
  entity_type, 
  operator, 
  details, 
  created_at 
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- 4. 统计出库次数
SELECT 
  status, 
  COUNT(*) as count 
FROM outbound_records 
GROUP BY status;

-- 5. 查看低库存告警
SELECT * FROM v_low_stock_alerts;

-- 6. 查看出库统计
SELECT * FROM v_outbound_stats LIMIT 7;
```

---

## 🎯 性能优化建议

### 1. 索引优化
```sql
-- 已在迁移脚本中创建，检查是否存在
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('outbound_records', 'audit_logs', 'inventory');
```

### 2. 查询缓存
在 `outboundService.ts` 中使用 React Query 缓存：
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['outboundRecords'],
  queryFn: getOutboundRecords,
  staleTime: 5 * 60 * 1000, // 5分钟
  cacheTime: 10 * 60 * 1000  // 10分钟
});
```

### 3. 批量操作
如果需要批量出库，考虑使用 Supabase 的批量插入：
```typescript
const { data, error } = await supabase
  .from('outbound_records')
  .insert(records); // 数组
```

---

## ✅ 最终检查清单

### 数据库层
- [ ] `0002_outbound_inventory.sql` 已执行
- [ ] 三个表创建成功
- [ ] 初始库存数据已插入
- [ ] RLS 策略已启用
- [ ] 索引已创建
- [ ] 触发器正常工作

### 代码层
- [ ] `outboundService.ts` 已创建
- [ ] `OutboundManagement.tsx` 已更新，使用新服务
- [ ] 导入语句正确
- [ ] 错误处理完善
- [ ] TypeScript 无编译错误

### 部署层
- [ ] 代码已推送到 GitHub
- [ ] Vercel 环境变量已配置
- [ ] Vercel 部署成功
- [ ] 可以访问 `/outbound` 页面
- [ ] 无 404 或 500 错误

### 功能层
- [ ] 出库功能正常
- [ ] 归还功能正常
- [ ] 库存自动扣减/增加
- [ ] 数据持久化（刷新不丢失）
- [ ] 库存不足提示
- [ ] 审计日志记录

---

## 📞 支持资源

- **Supabase 文档**: https://supabase.com/docs
- **Vercel 文档**: https://vercel.com/docs
- **React Query 文档**: https://tanstack.com/query/latest
- **项目部署指南**: `DEPLOY_GUIDE.md`
- **Supabase 配置指南**: `SUPABASE_SETUP.md`

---

## 🎉 完成标志

当以下所有条件满足时，出库系统部署完成：

✅ 可以在 Vercel 生产环境创建出库记录  
✅ 刷新页面后出库记录仍然存在  
✅ 库存数量正确扣减和归还  
✅ 可以查看出库历史  
✅ 可以归还出库物资  
✅ 审计日志正确记录操作  
✅ 没有 JavaScript 控制台错误  
✅ 数据库表中有真实数据  

---

**最后更新**: 2024-01-XX  
**版本**: 1.0.0  
**状态**: ✅ 代码已完成，待部署