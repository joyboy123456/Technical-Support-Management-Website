/**
 * 执行 0004 迁移：添加 original_location 和 original_owner 字段
 * 使用 PostgreSQL 连接直接执行 SQL
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 数据库连接配置
const connectionString = 'postgresql://postgres:Yxmsx123321.@sbp-a2e2xuudcasoe44t.supabase.opentrust.net:5432/postgres';

async function executeMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 正在连接到 Supabase 数据库...');
    await client.connect();
    console.log('✅ 数据库连接成功！');
    console.log('');

    // 读取 SQL 文件
    const sqlFilePath = path.join(__dirname, '../supabase/migrations/0004_add_original_fields.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    console.log('📄 已读取 SQL 文件: 0004_add_original_fields.sql');
    console.log('');

    // 执行 SQL
    console.log('⏳ 正在执行迁移脚本...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await client.query(sqlContent);
    console.log('✅ SQL 脚本执行成功！');
    console.log('');

    // 验证字段是否添加成功
    console.log('🔍 验证字段是否添加成功...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'outbound_records'
        AND column_name IN ('original_location', 'original_owner')
      ORDER BY column_name;
    `);

    if (columnsResult.rows.length === 2) {
      console.log('✅ 字段验证成功！');
      columnsResult.rows.forEach(col => {
        console.log(`   ✓ ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.warn('⚠️ 字段验证异常，请手动检查');
    }
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 数据库迁移完成！');
    console.log('');
    console.log('📝 下一步：');
    console.log('   1. 刷新您的出库管理页面（Ctrl+F5）');
    console.log('   2. 测试创建出库记录功能');
    console.log('   3. 测试归还功能，验证位置和负责人能否正确恢复');
    console.log('');

  } catch (error) {
    console.error('❌ 执行失败：', error.message);
    console.error('');
    console.error('详细错误信息：', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 数据库连接已关闭');
  }
}

// 执行迁移
executeMigration();
