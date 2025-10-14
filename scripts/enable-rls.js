#!/usr/bin/env node

/**
 * 启用所有表的 RLS (Row Level Security)
 * 修复 Supabase Security Advisor 检测到的安全问题
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const pg = require('pg');

// 手动加载环境变量
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });
  
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const dbUrl = env.SUPABASE_DB_URL;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 请在 .env 文件中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

if (!dbUrl) {
  console.error('❌ 错误: 请在 .env 文件中配置 SUPABASE_DB_URL');
  console.error('   格式: postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n🔒 启用 RLS (Row Level Security)\n');
console.log('═'.repeat(60));

// 读取 SQL 文件
const sqlPath = path.join(__dirname, '..', 'supabase', 'enable-rls.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

console.log('\n📄 执行 SQL 脚本: supabase/enable-rls.sql\n');

// 使用 pg 客户端执行 SQL
const { Client } = pg;

const client = new Client({
  connectionString: dbUrl,
});

async function enableRLS() {
  try {
    await client.connect();
    console.log('✅ 已连接到数据库\n');

    // 执行 SQL
    const result = await client.query(sqlContent);
    
    console.log('✅ RLS 已成功启用\n');
    
    // 验证 RLS 状态
    console.log('📊 验证 RLS 状态:\n');
    const verifyQuery = `
      SELECT 
        tablename,
        rowsecurity AS rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN (
          'actions',
          'assets', 
          'audit_logs',
          'devices',
          'inventory',
          'issues',
          'locations',
          'maintenance_logs',
          'outbound_records'
        )
      ORDER BY tablename;
    `;
    
    const verifyResult = await client.query(verifyQuery);
    
    console.log('┌─────────────────────────┬─────────────┐');
    console.log('│ 表名                    │ RLS 已启用  │');
    console.log('├─────────────────────────┼─────────────┤');
    
    verifyResult.rows.forEach(row => {
      const status = row.rls_enabled ? '✅ 是' : '❌ 否';
      console.log(`│ ${row.tablename.padEnd(23)} │ ${status.padEnd(11)} │`);
    });
    
    console.log('└─────────────────────────┴─────────────┘\n');
    
    // 检查是否所有表都启用了 RLS
    const allEnabled = verifyResult.rows.every(row => row.rls_enabled);
    
    if (allEnabled) {
      console.log('🎉 所有表的 RLS 都已成功启用！\n');
      console.log('💡 建议:\n');
      console.log('   1. 刷新 Supabase Security Advisor 页面');
      console.log('   2. 确认所有错误已消失');
      console.log('   3. 测试应用功能是否正常\n');
    } else {
      console.log('⚠️  警告: 部分表的 RLS 未启用，请检查\n');
    }
    
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    if (error.detail) {
      console.error('   详情:', error.detail);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

enableRLS();
