#!/usr/bin/env node
/**
 * 验证数据库视图是否创建成功
 * 并测试性能
 */

const { createClient } = require('@supabase/supabase-js');

// 从命令行参数或环境变量读取配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.argv[2];
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.argv[3];

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 使用方法:');
  console.error('  node scripts/verify-views.js <SUPABASE_URL> <SUPABASE_KEY>');
  console.error('或者配置 .env 文件中的环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const EXPECTED_VIEWS = [
  'v_printer_overview',
  'v_printer_by_location',
  'v_printer_by_brand_model',
  'v_router_overview',
  'v_router_stats',
  'v_asset_overview',
  'v_action_trends_30d',
  'v_maintenance_stats',
  'v_low_stock_summary'
];

console.log('═══════════════════════════════════════');
console.log('  验证数据库视图');
console.log('═══════════════════════════════════════');
console.log(`Supabase URL: ${supabaseUrl}\n`);

async function checkViewExists(viewName) {
  const { data, error } = await supabase
    .from(viewName)
    .select('*')
    .limit(1);

  return { exists: !error, error };
}

async function measureQueryTime(viewName) {
  const start = Date.now();
  const { data, error } = await supabase
    .from(viewName)
    .select('*')
    .limit(10);
  const duration = Date.now() - start;

  return { duration, error, hasData: data && data.length > 0 };
}

async function main() {
  console.log('📊 检查视图是否存在...\n');

  let allExist = true;
  const results = [];

  for (const viewName of EXPECTED_VIEWS) {
    const { exists, error } = await checkViewExists(viewName);
    
    if (exists) {
      console.log(`✅ ${viewName}`);
      results.push({ view: viewName, exists: true });
    } else {
      console.log(`❌ ${viewName} - ${error?.message || '不存在'}`);
      results.push({ view: viewName, exists: false, error: error?.message });
      allExist = false;
    }
  }

  if (!allExist) {
    console.log('\n⚠️  部分视图未创建，请执行迁移脚本！');
    console.log('参考: MIGRATION_MANUAL.md\n');
    process.exit(1);
  }

  console.log('\n⚡ 测试视图查询性能...\n');

  const perfTests = [
    'v_printer_overview',
    'v_asset_overview',
    'v_low_stock_summary'
  ];

  for (const viewName of perfTests) {
    const { duration, error, hasData } = await measureQueryTime(viewName);
    
    if (error) {
      console.log(`❌ ${viewName}: ${error.message}`);
    } else {
      const status = duration < 500 ? '✅' : duration < 1000 ? '⚠️' : '❌';
      const dataStatus = hasData ? '有数据' : '无数据';
      console.log(`${status} ${viewName}: ${duration}ms (${dataStatus})`);
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('✅ 所有视图验证通过！');
  console.log('═══════════════════════════════════════\n');
  console.log('下一步:');
  console.log('1. 部署前端代码: git push origin main');
  console.log('2. 访问网站验证优化效果');
  console.log('3. 运行压力测试对比性能\n');
}

main().catch(err => {
  console.error('\n❌ 验证失败:', err.message);
  process.exit(1);
});
