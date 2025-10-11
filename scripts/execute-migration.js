/**
 * 执行 Supabase 数据库迁移
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
    const sqlFilePath = path.join(__dirname, '../supabase/migrations/0003_devices_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    console.log('📄 已读取 SQL 文件');
    console.log('');

    // 执行 SQL
    console.log('⏳ 正在执行迁移脚本...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const result = await client.query(sqlContent);
    console.log('✅ SQL 脚本执行成功！');
    console.log('');

    // 显示结果
    if (result.rows && result.rows.length > 0) {
      console.log('📊 执行结果：');
      console.log(result.rows[0].result);
    }
    console.log('');

    // 验证数据
    console.log('🔍 验证导入的数据...');
    const countResult = await client.query('SELECT COUNT(*) as count FROM devices');
    console.log(`✅ 设备表记录数：${countResult.rows[0].count}`);
    console.log('');

    const devicesResult = await client.query('SELECT id, name, location, status FROM devices ORDER BY name');
    console.log('📋 设备列表：');
    devicesResult.rows.forEach(device => {
      console.log(`   ${device.id} - ${device.name} (${device.location}) [${device.status}]`);
    });
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 数据库迁移完成！');
    console.log('');
    console.log('📝 下一步：');
    console.log('   1. 刷新您的网站（Ctrl+F5）');
    console.log('   2. 查看设备列表（应该显示 10 台设备）');
    console.log('   3. 测试编辑和删除图片功能');
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
