#!/usr/bin/env node
/**
 * 数据库迁移脚本 - 使用原生 PostgreSQL 连接
 * 直接连接到 Supabase 数据库并执行迁移 SQL
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 数据库连接配置
const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:Yxmsx123321.@sbp-a2e2xuudcasoe44t.supabase.opentrust.net:5432/postgres';

console.log('🚀 数据库迁移工具启动...\n');

// 创建数据库客户端
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: false // 禁用 SSL，因为服务器不支持
});

// 读取迁移文件
const migrationFile = path.join(__dirname, '../supabase/migrations/0004_add_original_fields.sql');

async function runMigration() {
  try {
    console.log('📡 正在连接到数据库...');
    console.log('🔗 目标: sbp-a2e2xuudcasoe44t.supabase.opentrust.net\n');

    await client.connect();
    console.log('✅ 数据库连接成功！\n');

    // 读取迁移 SQL
    console.log('📄 读取迁移文件: 0004_add_original_fields.sql');
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    console.log('📝 迁移内容:\n');
    console.log('---');
    console.log(migrationSQL);
    console.log('---\n');

    // 执行迁移
    console.log('⚙️  正在执行迁移...');
    await client.query(migrationSQL);
    console.log('✅ 迁移执行成功！\n');

    // 验证迁移结果
    await verifyMigration();

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    console.error('\n详细错误信息:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 数据库连接已关闭');
  }
}

async function verifyMigration() {
  console.log('🔍 验证迁移结果...\n');

  try {
    // 查询表结构
    const result = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'outbound_records'
      AND column_name IN ('original_location', 'original_owner')
      ORDER BY column_name;
    `);

    if (result.rows.length === 0) {
      console.log('⚠️  警告: 未找到新增字段，迁移可能失败');
      return false;
    }

    console.log('✅ 字段验证成功！');
    console.log('\n📋 新增字段详情:');
    console.log('┌─────────────────────┬───────────┬──────────┬─────────┐');
    console.log('│ 字段名              │ 类型      │ 可空     │ 默认值  │');
    console.log('├─────────────────────┼───────────┼──────────┼─────────┤');

    result.rows.forEach(row => {
      const name = row.column_name.padEnd(20);
      const type = row.data_type.padEnd(10);
      const nullable = (row.is_nullable === 'YES' ? '是' : '否').padEnd(9);
      const defaultVal = (row.column_default || 'NULL').padEnd(8);
      console.log(`│ ${name}│ ${type}│ ${nullable}│ ${defaultVal}│`);
    });

    console.log('└─────────────────────┴───────────┴──────────┴─────────┘');

    // 测试查询
    console.log('\n🧪 测试查询新字段...');
    const testResult = await client.query(`
      SELECT id, original_location, original_owner
      FROM outbound_records
      LIMIT 1;
    `);

    console.log('✅ 查询测试成功！字段已可用');

    if (testResult.rows.length > 0) {
      console.log('📊 示例数据:');
      console.log(testResult.rows[0]);
    } else {
      console.log('📊 表中暂无数据');
    }

    return true;
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  数据库迁移工具 - outbound_records 表字段添加  ');
  console.log('═══════════════════════════════════════════════════\n');

  if (!fs.existsSync(migrationFile)) {
    console.error('❌ 错误: 迁移文件不存在');
    console.error('路径:', migrationFile);
    process.exit(1);
  }

  await runMigration();

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  🎉 迁移完成！现在可以正常使用出库功能了！  ');
  console.log('═══════════════════════════════════════════════════\n');
}

// 执行
main().catch(error => {
  console.error('致命错误:', error);
  process.exit(1);
});
