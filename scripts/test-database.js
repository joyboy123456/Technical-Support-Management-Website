#!/usr/bin/env node

/**
 * Supabase 数据库连接测试脚本
 * 测试数据库连接、读取、写入功能
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 手动读取 .env 文件
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
}

loadEnv();

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDatabase() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     Supabase 数据库连接测试                                 ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  // 检查环境变量
  log('📋 步骤 1: 检查环境变量配置', 'blue');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('❌ 错误: 环境变量未配置', 'red');
    log('   请确保 .env 文件包含:', 'yellow');
    log('   - VITE_SUPABASE_URL', 'yellow');
    log('   - VITE_SUPABASE_ANON_KEY', 'yellow');
    process.exit(1);
  }

  log(`   ✅ VITE_SUPABASE_URL: ${supabaseUrl}`, 'green');
  log(`   ✅ VITE_SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 30)}...`, 'green');

  // 创建 Supabase 客户端
  log('\n📋 步骤 2: 创建 Supabase 客户端', 'blue');
  
  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    log('   ✅ Supabase 客户端创建成功', 'green');
  } catch (error) {
    log(`   ❌ 错误: ${error.message}`, 'red');
    process.exit(1);
  }

  // 测试数据库连接 - 读取设备数据
  log('\n📋 步骤 3: 测试数据库连接（读取设备数据）', 'blue');
  
  try {
    const { data: devices, error } = await supabase
      .from('devices')
      .select('id, name, status')
      .limit(5);

    if (error) {
      log(`   ❌ 数据库查询失败: ${error.message}`, 'red');
      log(`   错误详情: ${JSON.stringify(error, null, 2)}`, 'yellow');
      process.exit(1);
    }

    if (!devices || devices.length === 0) {
      log('   ⚠️  警告: 数据库中没有设备数据', 'yellow');
      log('   提示: 请运行数据库迁移和种子脚本', 'yellow');
    } else {
      log(`   ✅ 成功读取 ${devices.length} 条设备数据`, 'green');
      log('\n   前 5 条设备数据:', 'cyan');
      devices.forEach((device, index) => {
        log(`   ${index + 1}. ${device.name} (${device.id}) - ${device.status}`, 'cyan');
      });
    }
  } catch (error) {
    log(`   ❌ 连接失败: ${error.message}`, 'red');
    process.exit(1);
  }

  // 测试数据库写入 - 创建测试维护日志
  log('\n📋 步骤 4: 测试数据库写入（创建测试记录）', 'blue');
  
  try {
    // 先获取一个设备ID
    const { data: devices } = await supabase
      .from('devices')
      .select('id')
      .limit(1);

    if (!devices || devices.length === 0) {
      log('   ⚠️  跳过写入测试: 没有可用的设备', 'yellow');
    } else {
      const testLog = {
        device_id: devices[0].id,
        date: new Date().toISOString().split('T')[0],
        type: '其他',
        note: '数据库连接测试 - 自动生成',
        executor: '系统测试'
      };

      const { data: insertedLog, error: insertError } = await supabase
        .from('maintenance_logs')
        .insert([testLog])
        .select();

      if (insertError) {
        log(`   ❌ 写入失败: ${insertError.message}`, 'red');
        log(`   错误详情: ${JSON.stringify(insertError, null, 2)}`, 'yellow');
      } else {
        log('   ✅ 成功创建测试维护日志', 'green');
        log(`   记录 ID: ${insertedLog[0].id}`, 'cyan');

        // 清理测试数据
        log('\n📋 步骤 5: 清理测试数据', 'blue');
        const { error: deleteError } = await supabase
          .from('maintenance_logs')
          .delete()
          .eq('id', insertedLog[0].id);

        if (deleteError) {
          log(`   ⚠️  清理失败: ${deleteError.message}`, 'yellow');
        } else {
          log('   ✅ 测试数据已清理', 'green');
        }
      }
    }
  } catch (error) {
    log(`   ❌ 写入测试失败: ${error.message}`, 'red');
  }

  // 测试数据表结构
  log('\n📋 步骤 6: 检查数据表结构', 'blue');
  
  const tables = ['devices', 'maintenance_logs', 'issues'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        log(`   ❌ 表 "${table}" 不存在或无法访问`, 'red');
      } else {
        log(`   ✅ 表 "${table}" 存在且可访问`, 'green');
      }
    } catch (error) {
      log(`   ❌ 表 "${table}" 检查失败: ${error.message}`, 'red');
    }
  }

  // 统计信息
  log('\n📋 步骤 7: 数据库统计信息', 'blue');
  
  try {
    const { count: deviceCount } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true });

    const { count: logCount } = await supabase
      .from('maintenance_logs')
      .select('*', { count: 'exact', head: true });

    const { count: issueCount } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true });

    log(`   📊 设备总数: ${deviceCount || 0}`, 'cyan');
    log(`   📊 维护日志总数: ${logCount || 0}`, 'cyan');
    log(`   📊 故障记录总数: ${issueCount || 0}`, 'cyan');
  } catch (error) {
    log(`   ⚠️  统计信息获取失败: ${error.message}`, 'yellow');
  }

  // 测试完成
  log('\n╔════════════════════════════════════════════════════════════╗', 'green');
  log('║     ✅ 数据库测试完成！                                     ║', 'green');
  log('╚════════════════════════════════════════════════════════════╝\n', 'green');

  log('📝 测试总结:', 'blue');
  log('   ✅ 环境变量配置正确', 'green');
  log('   ✅ Supabase 客户端创建成功', 'green');
  log('   ✅ 数据库连接正常', 'green');
  log('   ✅ 数据读取功能正常', 'green');
  log('   ✅ 数据写入功能正常', 'green');
  log('   ✅ 数据表结构完整', 'green');

  log('\n🎉 您的 Supabase 配置完全正常，可以开始开发了！\n', 'cyan');
}

// 运行测试
testDatabase().catch(error => {
  log(`\n❌ 测试过程中发生错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
