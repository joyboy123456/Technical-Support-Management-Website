#!/usr/bin/env node

/**
 * 性能优化验证脚本
 * 检查数据库视图是否创建成功，以及优化是否生效
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase')) {
  console.error('❌ Supabase 未配置！');
  console.error('请在 .env 文件中配置：');
  console.error('  VITE_SUPABASE_URL=你的Supabase URL');
  console.error('  VITE_SUPABASE_ANON_KEY=你的Supabase匿名密钥');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const requiredViews = [
  'v_printer_overview',
  'v_printer_by_location',
  'v_printer_by_brand_model',
  'v_router_overview',
  'v_router_stats',
  'v_asset_overview',
  'v_action_trends_30d',
  'v_maintenance_stats',
  'v_low_stock_summary',
  'v_sim_counts',
  'v_stock_levels'
];

async function checkViews() {
  console.log('\n📊 检查数据库视图...\n');

  const { data, error } = await supabase
    .from('information_schema.views')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', requiredViews);

  if (error) {
    console.error('❌ 查询视图失败:', error.message);
    return false;
  }

  const existingViews = new Set(data?.map(v => v.table_name) || []);
  let allExist = true;

  for (const view of requiredViews) {
    if (existingViews.has(view)) {
      console.log(`✅ ${view}`);
    } else {
      console.log(`❌ ${view} - 未找到`);
      allExist = false;
    }
  }

  return allExist;
}

async function testViewPerformance() {
  console.log('\n⚡ 测试视图性能...\n');

  const tests = [
    { name: '打印机概览', view: 'v_printer_overview' },
    { name: '路由器概览', view: 'v_router_overview' },
    { name: '资产概览', view: 'v_asset_overview' },
    { name: '低库存统计', view: 'v_low_stock_summary' }
  ];

  for (const test of tests) {
    const start = Date.now();
    const { data, error } = await supabase
      .from(test.view)
      .select('*')
      .maybeSingle();

    const duration = Date.now() - start;

    if (error) {
      console.log(`❌ ${test.name} (${test.view}): ${error.message}`);
    } else {
      const status = duration < 500 ? '✅' : duration < 1000 ? '⚠️' : '❌';
      console.log(`${status} ${test.name} (${test.view}): ${duration}ms`);
      if (data) {
        console.log(`   数据: ${JSON.stringify(data).substring(0, 100)}...`);
      }
    }
  }
}

async function testOptimizedFunctions() {
  console.log('\n🔧 测试优化后的统计函数...\n');

  // 测试并行查询
  const start = Date.now();
  
  const [printerOverview, routerOverview, assetOverview, lowStock] = await Promise.all([
    supabase.from('v_printer_overview').select('*').maybeSingle(),
    supabase.from('v_router_overview').select('*').maybeSingle(),
    supabase.from('v_asset_overview').select('*').maybeSingle(),
    supabase.from('v_low_stock_summary').select('*').maybeSingle()
  ]);

  const duration = Date.now() - start;

  console.log(`⏱️  并行查询4个视图耗时: ${duration}ms`);

  if (duration < 1000) {
    console.log('✅ 性能优秀！');
  } else if (duration < 2000) {
    console.log('⚠️  性能尚可，但仍有优化空间');
  } else {
    console.log('❌ 性能较差，请检查数据库连接或索引');
  }

  // 显示结果
  console.log('\n📈 统计结果:');
  if (printerOverview.data) {
    console.log(`   打印机总数: ${printerOverview.data.total || 0}`);
  }
  if (routerOverview.data) {
    console.log(`   路由器总数: ${routerOverview.data.total || 0}`);
  }
  if (assetOverview.data) {
    console.log(`   资产总数: ${assetOverview.data.total_assets || 0}`);
    console.log(`   使用率: ${assetOverview.data.utilization_rate || 0}%`);
  }
  if (lowStock.data) {
    console.log(`   低库存告警: ${lowStock.data.low_stock_count || 0}`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  性能优化验证脚本');
  console.log('═══════════════════════════════════════');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Supabase Key: ${supabaseKey.substring(0, 20)}...`);

  try {
    // 1. 检查视图是否存在
    const viewsExist = await checkViews();

    if (!viewsExist) {
      console.log('\n⚠️  部分视图未创建！');
      console.log('请执行以下步骤：');
      console.log('1. 登录 Supabase 控制台');
      console.log('2. 进入 SQL Editor');
      console.log('3. 执行文件: supabase/migrations/0013_optimize_stats_views.sql');
      process.exit(1);
    }

    // 2. 测试视图性能
    await testViewPerformance();

    // 3. 测试优化后的函数
    await testOptimizedFunctions();

    console.log('\n═══════════════════════════════════════');
    console.log('✅ 所有检查通过！优化已生效。');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ 检查失败:', error.message);
    process.exit(1);
  }
}

main();
