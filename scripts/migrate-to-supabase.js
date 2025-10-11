/**
 * 自动执行 Supabase 数据库迁移脚本
 *
 * 使用方法：
 * 1. 确保 .env 文件配置正确
 * 2. 运行命令：node scripts/migrate-to-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 读取环境变量
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// 检查环境变量
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误：未找到 Supabase 配置！');
  console.error('请检查 .env 文件是否包含：');
  console.error('  VITE_SUPABASE_URL=...');
  console.error('  VITE_SUPABASE_ANON_KEY=...');
  process.exit(1);
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 开始执行数据库迁移...');
console.log(`📍 连接到：${supabaseUrl}`);
console.log('');

// 读取 SQL 文件
const sqlFilePath = path.join(__dirname, '../supabase/migrations/0003_devices_table.sql');
let sqlContent;

try {
  sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
  console.log('✅ 已读取 SQL 文件');
} catch (error) {
  console.error('❌ 读取 SQL 文件失败：', error.message);
  process.exit(1);
}

// 执行 SQL
async function executeMigration() {
  try {
    console.log('⏳ 正在执行 SQL 脚本...');
    console.log('');

    // 注意：Supabase JS 客户端不支持直接执行复杂 SQL
    // 需要使用 Supabase 的 REST API 或在控制台手动执行
    console.warn('⚠️  警告：Supabase JS 客户端不支持执行复杂的 SQL 脚本');
    console.warn('');
    console.log('📋 请按照以下步骤手动执行：');
    console.log('');
    console.log('1️⃣  访问 Supabase SQL Editor：');
    console.log(`   ${supabaseUrl.replace('/rest/v1', '')}/project/_/sql`);
    console.log('');
    console.log('2️⃣  创建新查询（New Query）');
    console.log('');
    console.log('3️⃣  复制以下 SQL 内容：');
    console.log('   文件位置：supabase/migrations/0003_devices_table.sql');
    console.log('');
    console.log('4️⃣  粘贴并点击 Run 执行');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('💡 或者，您可以使用 Supabase CLI：');
    console.log('   1. 安装 CLI：npm install -g supabase');
    console.log('   2. 登录：supabase login');
    console.log('   3. 链接项目：supabase link --project-ref <your-project-ref>');
    console.log('   4. 执行迁移：supabase db push');
    console.log('');

    // 验证连接
    console.log('🔍 验证数据库连接...');
    const { data, error } = await supabase.from('devices').select('count', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        console.log('');
        console.log('ℹ️  devices 表尚未创建');
        console.log('   请按照上述步骤在 SQL Editor 中执行迁移脚本');
      } else {
        console.error('❌ 数据库连接错误：', error.message);
      }
    } else {
      console.log('✅ 数据库连接成功！');
      console.log(`📊 当前 devices 表记录数：${data}`);
    }

  } catch (error) {
    console.error('❌ 执行失败：', error.message);
    process.exit(1);
  }
}

executeMigration();
