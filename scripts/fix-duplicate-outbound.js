/**
 * 修复重复出库记录的脚本
 * 
 * 问题：同一设备有多条未归还的出库记录
 * 解决方案：
 * 1. 保留最新的一条出库记录
 * 2. 将其他旧的出库记录标记为已归还（自动归还）
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Yxmsx123321.@sbp-a2e2xuudcasoe44t.supabase.opentrust.net:5432/postgres';

async function fixDuplicateOutbound() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 正在连接到数据库...');
    await client.connect();
    console.log('✅ 连接成功！\n');

    // 开始事务
    await client.query('BEGIN');

    console.log('🔍 查找有重复出库记录的设备...\n');

    // 查找所有有多条未归还记录的设备
    const duplicateDevices = await client.query(`
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

    if (duplicateDevices.rows.length === 0) {
      console.log('✅ 没有发现重复出库记录，数据正常！');
      await client.query('ROLLBACK');
      return;
    }

    console.log(`⚠️  发现 ${duplicateDevices.rows.length} 台设备有重复出库记录:\n`);
    duplicateDevices.rows.forEach(row => {
      console.log(`  - ${row.device_name} (${row.device_id}): ${row.outbound_count} 条未归还记录`);
    });
    console.log('');

    let totalFixed = 0;

    // 对每个有重复记录的设备进行修复
    for (const device of duplicateDevices.rows) {
      console.log(`📝 处理设备: ${device.device_name} (${device.device_id})`);

      // 获取该设备的所有未归还记录，按创建时间排序
      const records = await client.query(`
        SELECT id, created_at, destination, operator
        FROM outbound_records
        WHERE device_id = $1 AND status = 'outbound'
        ORDER BY created_at DESC
      `, [device.device_id]);

      // 保留最新的一条，其他的标记为已归还
      const [latestRecord, ...oldRecords] = records.rows;

      console.log(`  ✓ 保留最新记录: ${new Date(latestRecord.created_at).toLocaleString('zh-CN')}`);

      for (const oldRecord of oldRecords) {
        console.log(`  → 自动归还旧记录: ${new Date(oldRecord.created_at).toLocaleString('zh-CN')}`);
        
        // 将旧记录标记为已归还
        await client.query(`
          UPDATE outbound_records
          SET 
            status = 'returned',
            return_info = jsonb_build_object(
              'returnDate', NOW(),
              'returnOperator', '系统自动归还',
              'returnedItems', items,
              'returnNotes', '系统自动归还：修复重复出库记录'
            ),
            updated_at = NOW()
          WHERE id = $1
        `, [oldRecord.id]);

        totalFixed++;
      }

      console.log('');
    }

    console.log(`✅ 修复完成！共处理 ${totalFixed} 条重复记录\n`);

    // 提交事务
    await client.query('COMMIT');
    console.log('💾 事务已提交\n');

    // 验证修复结果
    console.log('🔍 验证修复结果...\n');
    const verifyResult = await client.query(`
      SELECT 
        device_id,
        device_name,
        COUNT(*) as outbound_count
      FROM outbound_records
      WHERE status = 'outbound'
      GROUP BY device_id, device_name
      HAVING COUNT(*) > 1
    `);

    if (verifyResult.rows.length === 0) {
      console.log('✅ 验证通过！所有设备都只有一条或零条未归还记录');
    } else {
      console.log('⚠️  警告：仍有设备存在重复出库记录');
      verifyResult.rows.forEach(row => {
        console.log(`  - ${row.device_name}: ${row.outbound_count} 条`);
      });
    }

  } catch (error) {
    console.error('❌ 错误：', error.message);
    console.log('🔄 正在回滚事务...');
    await client.query('ROLLBACK');
    console.log('✅ 事务已回滚');
  } finally {
    await client.end();
  }
}

// 运行修复
console.log('═══════════════════════════════════════════════════════');
console.log('  修复重复出库记录脚本');
console.log('═══════════════════════════════════════════════════════\n');

fixDuplicateOutbound();
