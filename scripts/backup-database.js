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
  console.error('错误: 请在 .env 文件中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLES = [
  'locations',
  'printer_models',
  'consumables',
  'compatibilities',
  'assets',
  'codes',
  'sim_cards',
  'stock_ledger',
  'actions',
  'maintenance_records',
  'suppliers',
  'price_history',
  'sops',
  'inventory',
  'outbound_records',
  'audit_logs'
];

async function backupTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn(`⚠️  表 ${tableName} 备份失败或不存在: ${error.message}`);
      return null;
    }

    console.log(`✅ 已备份表 ${tableName}: ${data.length} 行`);
    return { tableName, data, rowCount: data.length };
  } catch (err) {
    console.warn(`⚠️  表 ${tableName} 备份出错: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 开始数据库备份...\n');
  console.log(`📡 连接到: ${SUPABASE_URL}\n`);

  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

  const results = [];
  let totalRows = 0;

  for (const table of TABLES) {
    const result = await backupTable(table);
    if (result) {
      results.push(result);
      totalRows += result.rowCount;
    }
  }

  const backup = {
    timestamp: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL,
    tables: results,
    summary: {
      totalTables: results.length,
      totalRows: totalRows
    }
  };

  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8');

  console.log('\n✅ 备份完成!');
  console.log(`📁 备份文件: ${backupFile}`);
  console.log(`📊 总计: ${results.length} 个表, ${totalRows} 行数据`);
  console.log(`💾 文件大小: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB\n`);
}

main().catch(console.error);
