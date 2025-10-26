#!/usr/bin/env node
/**
 * 自动执行数据库迁移脚本
 * 创建性能优化所需的数据库视图
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase')) {
  console.error('❌ Supabase 未配置！');
  console.error('请检查 .env 文件中的配置');
  process.exit(1);
}

console.log('═══════════════════════════════════════');
console.log('  数据库迁移脚本');
console.log('═══════════════════════════════════════');
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`开始执行迁移...\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

// 读取迁移脚本
const migrationPath = path.join(__dirname, '../supabase/migrations/0013_optimize_stats_views.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// 将 SQL 拆分成独立的语句（按视图创建）
const statements = migrationSQL
  .split(/;[\s]*(?=CREATE|COMMENT|DROP)/gi)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

async function executeMigration() {
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    // 提取语句类型
    const match = stmt.match(/^(CREATE|COMMENT|DROP|ALTER)\s+/i);
    const type = match ? match[1].toUpperCase() : 'SQL';
    
    // 提取对象名称
    const nameMatch = stmt.match(/(?:VIEW|INDEX|FUNCTION)\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?(?:OR\s+REPLACE\s+)?(\w+)/i);
    const objectName = nameMatch ? nameMatch[1] : `statement ${i + 1}`;
    
    process.stdout.write(`[${i + 1}/${statements.length}] 执行 ${type} ${objectName}... `);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });
      
      if (error) {
        // 尝试直接通过 REST API 执行
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ query: stmt + ';' })
        });

        if (!response.ok) {
          throw new Error(error.message || 'Unknown error');
        }
      }
      
      console.log('✅');
      successCount++;
    } catch (error) {
      console.log(`❌ ${error.message}`);
      failCount++;
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`执行完成: ${successCount} 成功, ${failCount} 失败`);
  console.log('═══════════════════════════════════════\n');

  if (failCount > 0) {
    console.log('⚠️  部分语句执行失败，建议手动在 Supabase SQL Editor 中执行');
    console.log('迁移文件路径: supabase/migrations/0013_optimize_stats_views.sql\n');
  }

  return failCount === 0;
}

async function verifyViews() {
  console.log('🔍 验证视图创建...\n');

  const expectedViews = [
    'v_printer_overview',
    'v_printer_by_location',
    'v_printer_by_brand_model',
    'v_router_overview',
    'v_asset_overview',
    'v_low_stock_summary'
  ];

  let allExist = true;

  for (const viewName of expectedViews) {
    try {
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${viewName} - ${error.message}`);
        allExist = false;
      } else {
        console.log(`✅ ${viewName} - 工作正常`);
      }
    } catch (error) {
      console.log(`❌ ${viewName} - ${error.message}`);
      allExist = false;
    }
  }

  return allExist;
}

async function main() {
  try {
    // 执行迁移
    const success = await executeMigration();
    
    if (!success) {
      console.log('\n建议操作：');
      console.log('1. 登录 Supabase 控制台: ' + supabaseUrl.replace('/rest/v1', ''));
      console.log('2. 进入 SQL Editor');
      console.log('3. 复制粘贴文件内容: supabase/migrations/0013_optimize_stats_views.sql');
      console.log('4. 点击 Run 执行\n');
    }

    // 验证视图
    console.log('');
    const verified = await verifyViews();

    if (verified) {
      console.log('\n🎉 迁移成功！所有视图已创建并可正常工作。');
      console.log('\n下一步：');
      console.log('1. 部署前端代码: git push origin main');
      console.log('2. 访问网站验证优化效果\n');
    } else {
      console.log('\n⚠️  部分视图验证失败，请手动检查。\n');
    }

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.log('\n请手动在 Supabase SQL Editor 中执行迁移脚本。\n');
    process.exit(1);
  }
}

main();
