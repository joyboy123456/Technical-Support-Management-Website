#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ 错误: 请在 .env 文件中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ 执行失败:', error.message);
      return false;
    }

    console.log('✅ 执行成功!');
    if (data) {
      console.log('📊 返回数据:', JSON.stringify(data, null, 2));
    }
    return true;
  } catch (err) {
    console.error('❌ 执行出错:', err.message);
    return false;
  }
}

async function executeSqlFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`📄 执行文件: ${filePath}\n`);
    return await executeSql(sql);
  } catch (err) {
    console.error('❌ 读取文件失败:', err.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📖 使用方法:

  # 执行 SQL 文件
  npm run db:exec supabase/migrations/0001_init.sql

  # 执行 SQL 命令
  npm run db:exec "SELECT * FROM locations LIMIT 5"

🔗 连接到: ${SUPABASE_URL}
`);
    process.exit(0);
  }

  const input = args[0];

  // 判断是文件还是 SQL 命令
  if (fs.existsSync(input)) {
    await executeSqlFile(input);
  } else {
    await executeSql(input);
  }
}

main().catch(console.error);
