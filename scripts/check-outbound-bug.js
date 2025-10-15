/**
 * 检查魔镜1号机的出库记录问题
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Yxmsx123321.@sbp-a2e2xuudcasoe44t.supabase.opentrust.net:5432/postgres';

async function checkOutboundBug() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 正在连接到数据库...');
    await client.connect();
    console.log('✅ 连接成功！\n');

    console.log('🔍 检查魔镜1号机的出库记录...\n');

    // 查询所有魔镜1号机的出库记录
    const result = await client.query(`
      SELECT 
        id, 
        device_id, 
        device_name, 
        destination, 
        operator, 
        status, 
        created_at,
        return_info
      FROM outbound_records 
      WHERE device_name ILIKE '%魔镜1号%'
      ORDER BY created_at ASC
    `);

    if (result.rows.length === 0) {
      console.log('✅ 未找到魔镜1号机的出库记录');
      return;
    }

    console.log(`📊 找到 ${result.rows.length} 条魔镜1号机的出库记录:\n`);

    result.rows.forEach((record, index) => {
      console.log(`记录 ${index + 1}:`);
      console.log(`  ID: ${record.id}`);
      console.log(`  设备ID: ${record.device_id}`);
      console.log(`  设备名称: ${record.device_name}`);
      console.log(`  目的地: ${record.destination}`);
      console.log(`  操作员: ${record.operator}`);
      console.log(`  状态: ${record.status}`);
      console.log(`  创建时间: ${new Date(record.created_at).toLocaleString('zh-CN')}`);
      if (record.return_info) {
        console.log(`  归还时间: ${new Date(record.return_info.returnDate).toLocaleString('zh-CN')}`);
      }
      console.log('');
    });

    // 检查是否有多条未归还的记录
    const outboundRecords = result.rows.filter(r => r.status === 'outbound');
    
    if (outboundRecords.length > 1) {
      console.log(`⚠️  发现严重问题: 魔镜1号机有 ${outboundRecords.length} 条未归还的出库记录！`);
      console.log('这违反了业务逻辑：一台设备在未归还的情况下不应该被多次出库。\n');
    } else if (outboundRecords.length === 1) {
      console.log(`✅ 当前有 1 条未归还的出库记录（正常）\n`);
    } else {
      console.log(`✅ 所有出库记录都已归还\n`);
    }

    // 分析问题
    console.log('📋 问题分析:');
    console.log('当前系统在创建出库记录时，没有检查该设备是否已有未归还的出库记录。');
    console.log('这导致同一台设备可以被多次出库，造成数据混乱。\n');

    // 检查所有设备的重复出库问题
    console.log('🔍 检查所有设备的重复出库问题...\n');
    const duplicateCheck = await client.query(`
      SELECT 
        device_id,
        device_name,
        COUNT(*) as outbound_count
      FROM outbound_records
      WHERE status = 'outbound'
      GROUP BY device_id, device_name
      HAVING COUNT(*) > 1
      ORDER BY outbound_count DESC
    `);

    if (duplicateCheck.rows.length > 0) {
      console.log(`⚠️  发现 ${duplicateCheck.rows.length} 台设备有多条未归还的出库记录:\n`);
      duplicateCheck.rows.forEach(row => {
        console.log(`  - ${row.device_name} (${row.device_id}): ${row.outbound_count} 条未归还记录`);
      });
      console.log('');
    } else {
      console.log('✅ 没有发现其他设备有重复出库问题\n');
    }

  } catch (error) {
    console.error('❌ 错误：', error.message);
  } finally {
    await client.end();
  }
}

checkOutboundBug();
