/**
 * 检查数据库现有结构
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Yxmsx123321.@sbp-a2e2xuudcasoe44t.supabase.opentrust.net:5432/postgres';

async function checkDatabase() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 正在连接到数据库...');
    await client.connect();
    console.log('✅ 连接成功！\n');

    // 检查现有的表
    console.log('📊 现有的表：');
    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    tablesResult.rows.forEach(row => {
      console.log(`   📋 ${row.tablename}`);
    });
    console.log('');

    // 检查现有的视图
    console.log('👁️  现有的视图：');
    const viewsResult = await client.query(`
      SELECT viewname
      FROM pg_views
      WHERE schemaname = 'public'
      ORDER BY viewname
    `);
    viewsResult.rows.forEach(row => {
      console.log(`   👁️  ${row.viewname}`);
    });
    console.log('');

    // 检查 devices 相关对象
    console.log('🔍 检查 devices 相关对象：');
    const objectsResult = await client.query(`
      SELECT
        n.nspname as schema,
        c.relname as name,
        CASE c.relkind
          WHEN 'r' THEN 'table'
          WHEN 'v' THEN 'view'
          WHEN 'm' THEN 'materialized view'
          WHEN 'i' THEN 'index'
          WHEN 'S' THEN 'sequence'
        END as type
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname LIKE '%device%' OR c.relname LIKE '%maintenance%' OR c.relname LIKE '%issue%'
      ORDER BY c.relname
    `);

    if (objectsResult.rows.length > 0) {
      objectsResult.rows.forEach(row => {
        console.log(`   ${row.type}: ${row.name}`);
      });
    } else {
      console.log('   未找到相关对象');
    }
    console.log('');

  } catch (error) {
    console.error('❌ 错误：', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();
