# 性能优化建议

## 数据库索引优化

为了提升统计看板的加载速度，建议在 Supabase 中添加以下索引：

### printer_instances 表索引

```sql
-- 为 status 字段添加索引（用于状态统计）
CREATE INDEX IF NOT EXISTS idx_printer_instances_status 
ON printer_instances(status);

-- 为 location 字段添加索引（用于位置分布统计）
CREATE INDEX IF NOT EXISTS idx_printer_instances_location 
ON printer_instances(location);

-- 为 printer_model 字段添加索引（用于品牌型号统计）
CREATE INDEX IF NOT EXISTS idx_printer_instances_printer_model 
ON printer_instances(printer_model);

-- 复合索引：同时按位置和型号查询
CREATE INDEX IF NOT EXISTS idx_printer_instances_location_model 
ON printer_instances(location, printer_model);
```

### 执行方法

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 复制上述 SQL 语句并执行
4. 验证索引创建成功：
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'printer_instances';
   ```

## 前端缓存优化

已实施的优化：
- ✅ React Query 缓存：2分钟 staleTime，5分钟 cacheTime
- ✅ 骨架屏加载状态，提升用户体验
- ✅ 单次查询 + 内存统计，避免多次数据库往返

## 预期效果

添加索引后，统计看板的加载时间应该从当前的 X 秒降低到 < 1 秒。

## 监控建议

可以在浏览器控制台查看实际查询时间：
1. 打开开发者工具 → Network 标签
2. 刷新统计看板页面
3. 查看 Supabase API 请求的响应时间

如果响应时间仍然较长（> 2秒），可能需要：
- 检查 Supabase 项目的地理位置（选择离用户最近的区域）
- 考虑升级 Supabase 套餐以获得更好的性能
