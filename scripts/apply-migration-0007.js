/**
 * 应用迁移 0007: 防止重复出库
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:Yxmsx123321.@sbp-a2e2xuudcasoe44t.supabase.opentrust.net:5432/postgres';

async function applyMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 正在连接到数据库...');
    await client.connect();
    console.log('✅ 连接成功！\n');

    // 读取迁移文件
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0007_prevent_duplicate_outbound.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 读取迁移文件: 0007_prevent_duplicate_outbound.sql\n');
    console.log('🚀 执行迁移...\n');

    // 执行迁移
    await client.query(migrationSQL);

    console.log('\n✅ 迁移执行成功！\n');

    // 验证索引是否创建
    const indexCheck = await client.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'outbound_records'
        AND indexname = 'idx_unique_device_outbound'
    `);

    if (indexCheck.rows.length > 0) {
      console.log('✅ 唯一索引已创建:');
      console.log(`   名称: ${indexCheck.rows[0].indexname}`);
      console.log(`   定义: ${indexCheck.rows[0].indexdef}\n`);
    } else {
      console.log('⚠️  警告：未找到唯一索引\n');
    }

  } catch (error) {
    console.error('❌ 错误：', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  索引已存在，跳过创建');
    }
  } finally {
    await client.end();
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log('  应用数据库迁移 0007');
console.log('═══════════════════════════════════════════════════════\n');

applyMigration();
