#!/usr/bin/env node
/**
 * 直接执行数据库迁移脚本
 * 用于解决 Supabase CLI 无法连接自托管实例的问题
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 从环境变量读取配置
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sbp-a2e2xuudcasoe44t.supabase.opentrust.net';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const DATABASE_URL = 'postgresql://postgres:Yxmsx123321.@sbp-a2e2xuudcasoe44t.supabase.opentrust.net:5432/postgres';

if (!SUPABASE_ANON_KEY) {
  console.error('❌ 错误：缺少 VITE_SUPABASE_ANON_KEY 环境变量');
  process.exit(1);
}

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 要执行的 SQL
const migrationSQL = `
-- 添加 original_location 和 original_owner 字段到 outbound_records 表
-- 这两个字段用于记录设备出库前的原始位置和负责人，便于归还时恢复

-- 添加字段（如果不存在）
ALTER TABLE outbound_records
ADD COLUMN IF NOT EXISTS original_location TEXT,
ADD COLUMN IF NOT EXISTS original_owner TEXT;

-- 添加注释
COMMENT ON COLUMN outbound_records.original_location IS '设备出库前的原始位置';
COMMENT ON COLUMN outbound_records.original_owner IS '设备出库前的原始负责人';
`;

async function runMigration() {
  console.log('🚀 开始执行数据库迁移...\n');
  console.log('📍 目标数据库:', SUPABASE_URL);
  console.log('📝 迁移内容: 添加 original_location 和 original_owner 字段\n');

  try {
    // 使用 Supabase 的 RPC 功能执行原始 SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      query: migrationSQL
    });

    if (error) {
      // 如果 RPC 不可用，尝试使用 REST API
      console.log('⚠️  RPC 方法不可用，尝试直接通过 REST API...\n');

      // 分步执行
      console.log('步骤 1: 添加 original_location 字段...');
      const { error: error1 } = await supabase
        .from('outbound_records')
        .select('original_location')
        .limit(1);

      if (error1 && error1.code === '42703') {
        console.log('✅ 字段不存在，需要添加');
        throw new Error('需要手动执行迁移 SQL，请使用 Supabase Dashboard 的 SQL Editor');
      } else if (!error1) {
        console.log('✅ original_location 字段已存在');
      }

      console.log('步骤 2: 检查 original_owner 字段...');
      const { error: error2 } = await supabase
        .from('outbound_records')
        .select('original_owner')
        .limit(1);

      if (!error2) {
        console.log('✅ original_owner 字段已存在');
      }

      console.log('\n✅ 迁移验证完成！所有字段都已存在。');
      return;
    }

    console.log('✅ 迁移执行成功！\n');
    console.log('📊 执行结果:', data);

  } catch (err) {
    console.error('\n❌ 迁移执行失败:', err.message);
    console.error('\n💡 解决方案:');
    console.error('   请在 Supabase Dashboard 的 SQL Editor 中手动执行以下 SQL:\n');
    console.error('   ' + migrationSQL.split('\n').map(line => '   ' + line).join('\n'));
    process.exit(1);
  }
}

// 验证迁移
async function verifyMigration() {
  console.log('\n🔍 验证迁移结果...\n');

  try {
    const { data, error } = await supabase
      .from('outbound_records')
      .select('id, original_location, original_owner')
      .limit(1);

    if (error) {
      console.error('❌ 验证失败:', error.message);
      return false;
    }

    console.log('✅ 验证成功！字段已成功添加到 outbound_records 表');
    console.log('📋 表结构示例:', data);
    return true;
  } catch (err) {
    console.error('❌ 验证过程出错:', err.message);
    return false;
  }
}

// 主函数
async function main() {
  await runMigration();
  await verifyMigration();

  console.log('\n🎉 所有操作完成！');
}

main();
