#!/usr/bin/env node
/**
 * 授予数据库视图访问权限
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 配置缺失！');
  process.exit(1);
}

console.log('═══════════════════════════════════════');
console.log('  授予视图访问权限');
console.log('═══════════════════════════════════════');
console.log(`Supabase URL: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

const views = [
  'v_printer_instance_stats',
  'v_printer_overview',
  'v_printer_by_location',
  'v_printer_by_brand_model',
  'v_router_stats',
  'v_router_overview',
  'v_asset_overview',
  'v_action_trends_30d',
  'v_maintenance_stats',
  'v_low_stock_summary'
];

async function grantPermissions() {
  console.log('🔐 授予视图访问权限...\n');

  // 方法 1: 通过查询来测试权限（如果能查询，说明有权限）
  let successCount = 0;
  let needGrant = [];

  for (const view of views) {
    const { data, error } = await supabase
      .from(view)
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('permission denied')) {
        console.log(`❌ ${view} - 需要授权`);
        needGrant.push(view);
      } else if (error.code === '42P01') {
        console.log(`⚠️  ${view} - 视图不存在`);
      } else {
        console.log(`❌ ${view} - ${error.message}`);
      }
    } else {
      console.log(`✅ ${view} - 已有权限`);
      successCount++;
    }
  }

  if (needGrant.length > 0) {
    console.log(`\n⚠️  ${needGrant.length} 个视图需要授权\n`);
    console.log('请在 Supabase SQL Editor 中执行以下 SQL：\n');
    
    needGrant.forEach(view => {
      console.log(`GRANT SELECT ON ${view} TO anon, authenticated;`);
    });

    console.log('\n或者一次性执行：\n');
    console.log('GRANT SELECT ON');
    needGrant.forEach((view, i) => {
      console.log(`  ${view}${i < needGrant.length - 1 ? ',' : ''}`);
    });
    console.log('TO anon, authenticated;\n');

    return false;
  }

  console.log(`\n✅ 所有视图权限正常 (${successCount}/${views.length})\n`);
  return true;
}

async function testViews() {
  console.log('⚡ 测试视图查询...\n');

  const tests = [
    { name: '打印机概览', view: 'v_printer_overview' },
    { name: '资产概览', view: 'v_asset_overview' },
    { name: '低库存', view: 'v_low_stock_summary' }
  ];

  for (const test of tests) {
    const start = Date.now();
    const { data, error } = await supabase
      .from(test.view)
      .select('*')
      .maybeSingle();

    const duration = Date.now() - start;

    if (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    } else {
      const status = duration < 500 ? '✅' : '⚠️';
      console.log(`${status} ${test.name}: ${duration}ms`);
      if (data) {
        console.log(`   ${JSON.stringify(data).substring(0, 80)}...`);
      }
    }
  }
}

async function main() {
  try {
    const hasPermissions = await grantPermissions();

    if (hasPermissions) {
      console.log('═══════════════════════════════════════');
      await testViews();
      console.log('\n═══════════════════════════════════════');
      console.log('✅ 权限验证完成！可以部署代码了。');
      console.log('═══════════════════════════════════════\n');
    } else {
      console.log('═══════════════════════════════════════');
      console.log('⚠️  请先授予权限后再部署');
      console.log('═══════════════════════════════════════\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    process.exit(1);
  }
}

main();
