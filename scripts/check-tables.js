#!/usr/bin/env node
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 读取环境变量
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

async function checkTables() {
  const env = loadEnvFile();
  const client = new Client({
    connectionString: env.SUPABASE_DB_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功\n');

    // 查看所有表
    const tablesResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        tableowner
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('📊 数据库中的表：');
    console.log('─'.repeat(60));
    tablesResult.rows.forEach(row => {
      console.log(`  • ${row.tablename} (owner: ${row.tableowner})`);
    });

    // 查看 RLS 状态
    console.log('\n🔒 RLS 状态：');
    console.log('─'.repeat(60));
    const rlsResult = await client.query(`
      SELECT 
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    rlsResult.rows.forEach(row => {
      const status = row.rls_enabled ? '🔒 启用' : '🔓 禁用';
      console.log(`  ${status} ${row.tablename}`);
    });

    // 查看策略
    console.log('\n📋 RLS 策略：');
    console.log('─'.repeat(60));
    const policiesResult = await client.query(`
      SELECT 
        tablename,
        policyname,
        permissive,
        roles,
        cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);

    if (policiesResult.rows.length === 0) {
      console.log('  （无策略）');
    } else {
      policiesResult.rows.forEach(row => {
        console.log(`  • ${row.tablename}.${row.policyname}`);
        console.log(`    角色: ${row.roles}, 操作: ${row.cmd}`);
      });
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();
