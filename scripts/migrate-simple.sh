#!/bin/bash
# 简化版数据库迁移脚本 - 直接执行 SQL

set -e

echo "═══════════════════════════════════════"
echo "  数据库迁移脚本 - 创建优化视图"
echo "═══════════════════════════════════════"

# 读取环境变量
source .env 2>/dev/null || true

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "❌ Supabase 配置缺失"
  echo "请确保 .env 文件中包含:"
  echo "  VITE_SUPABASE_URL=..."
  echo "  VITE_SUPABASE_ANON_KEY=..."
  exit 1
fi

echo "Supabase URL: $VITE_SUPABASE_URL"
echo ""
echo "📝 开始执行 SQL 迁移脚本..."
echo ""

# SQL 迁移脚本路径
MIGRATION_FILE="supabase/migrations/0013_optimize_stats_views.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ 迁移文件不存在: $MIGRATION_FILE"
  exit 1
fi

# 读取 SQL 文件
SQL_CONTENT=$(cat "$MIGRATION_FILE")

# 创建临时 JSON payload
TEMP_PAYLOAD=$(mktemp)
cat > "$TEMP_PAYLOAD" <<EOF
{
  "query": $(echo "$SQL_CONTENT" | jq -Rs .)
}
EOF

# 提取 REST API endpoint
REST_URL="${VITE_SUPABASE_URL}"

# 使用 pg meta API 执行 SQL（Supabase 的管理 API）
# 注意：这个方法可能需要 service_role key，anon key 可能权限不足

echo "⚠️  注意: anon key 可能没有权限执行 DDL 语句"
echo "建议手动在 Supabase SQL Editor 中执行"
echo ""
echo "手动执行步骤："
echo "1. 访问: ${VITE_SUPABASE_URL/https:\/\//https://app.}" | sed 's/supabase\.opentrust\.net/supabase.co/'
echo "2. 进入 SQL Editor"
echo "3. 复制粘贴文件内容: $MIGRATION_FILE"
echo "4. 点击 Run 执行"
echo ""

# 清理临时文件
rm -f "$TEMP_PAYLOAD"

echo "═══════════════════════════════════════"
echo "迁移脚本准备完毕"
echo "═══════════════════════════════════════"
