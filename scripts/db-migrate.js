#!/usr/bin/env node
/**
 * 🚀 智能数据库迁移工具 - 全自动版本
 *
 * 功能：
 * - 自动扫描 supabase/migrations/ 目录下的所有 SQL 文件
 * - 追踪已执行的迁移，避免重复执行
 * - 按文件名顺序执行迁移
 * - 完整的错误处理和回滚机制
 * - 支持环境变量配置
 *
 * 使用方法：
 * - npm run migrate           # 执行所有未运行的迁移
 * - npm run migrate:status    # 查看迁移状态
 * - npm run migrate:reset     # 重置迁移记录（谨慎使用）
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================

const DATABASE_URL = process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  'postgresql://postgres:Yxmsx123321.@sbp-a2e2xuudcasoe44t.supabase.opentrust.net:5432/postgres';

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

// ==================== 数据库客户端 ====================

function createClient() {
  return new Client({
    connectionString: DATABASE_URL,
    ssl: false
  });
}

// ==================== 迁移记录表管理 ====================

/**
 * 创建迁移记录表（如果不存在）
 */
async function ensureMigrationsTable(client) {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT NOW(),
      checksum VARCHAR(64)
    );

    CREATE INDEX IF NOT EXISTS idx_schema_migrations_name
    ON ${MIGRATIONS_TABLE}(name);
  `;

  await client.query(createTableSQL);
}

/**
 * 获取已执行的迁移列表
 */
async function getExecutedMigrations(client) {
  const result = await client.query(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name`
  );
  return result.rows.map(row => row.name);
}

/**
 * 记录迁移执行
 */
async function recordMigration(client, name, checksum) {
  await client.query(
    `INSERT INTO ${MIGRATIONS_TABLE} (name, checksum)
     VALUES ($1, $2)
     ON CONFLICT (name) DO NOTHING`,
    [name, checksum]
  );
}

// ==================== 迁移文件扫描 ====================

/**
 * 扫描迁移目录，获取所有 SQL 文件
 */
function scanMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`迁移目录不存在: ${MIGRATIONS_DIR}`);
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort(); // 按文件名排序

  return files.map(file => ({
    name: file,
    path: path.join(MIGRATIONS_DIR, file),
    content: fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
  }));
}

/**
 * 计算文件校验和（简单版本）
 */
function calculateChecksum(content) {
  // 使用简单的哈希算法
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// ==================== 迁移执行 ====================

/**
 * 执行单个迁移
 */
async function executeMigration(client, migration) {
  console.log(`\n📄 执行迁移: ${migration.name}`);
  console.log('━'.repeat(60));

  try {
    // 开始事务
    await client.query('BEGIN');

    // 执行迁移 SQL
    await client.query(migration.content);

    // 记录迁移
    const checksum = calculateChecksum(migration.content);
    await recordMigration(client, migration.name, checksum);

    // 提交事务
    await client.query('COMMIT');

    console.log(`✅ 迁移成功: ${migration.name}`);
    return true;

  } catch (error) {
    // 回滚事务
    await client.query('ROLLBACK');
    console.error(`❌ 迁移失败: ${migration.name}`);
    console.error(`错误: ${error.message}`);
    throw error;
  }
}

/**
 * 执行所有待处理的迁移
 */
async function runPendingMigrations() {
  const client = createClient();

  try {
    console.log('🚀 智能数据库迁移工具启动\n');
    console.log('═'.repeat(60));
    console.log(`📡 连接数据库: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
    console.log('═'.repeat(60));

    await client.connect();
    console.log('✅ 数据库连接成功\n');

    // 确保迁移记录表存在
    await ensureMigrationsTable(client);
    console.log('✅ 迁移记录表准备完成\n');

    // 获取所有迁移文件
    const allMigrations = scanMigrationFiles();
    console.log(`📂 发现 ${allMigrations.length} 个迁移文件\n`);

    // 获取已执行的迁移
    const executedMigrations = await getExecutedMigrations(client);
    console.log(`✓  已执行 ${executedMigrations.length} 个迁移\n`);

    // 找出待执行的迁移
    const pendingMigrations = allMigrations.filter(
      m => !executedMigrations.includes(m.name)
    );

    if (pendingMigrations.length === 0) {
      console.log('🎉 所有迁移都已是最新状态！无需执行新迁移。\n');
      return;
    }

    console.log(`⏳ 待执行 ${pendingMigrations.length} 个迁移:\n`);
    pendingMigrations.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.name}`);
    });
    console.log('');

    // 执行所有待处理的迁移
    let successCount = 0;
    for (const migration of pendingMigrations) {
      await executeMigration(client, migration);
      successCount++;
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`🎉 迁移完成！成功执行 ${successCount}/${pendingMigrations.length} 个迁移`);
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n' + '═'.repeat(60));
    console.error('💥 迁移过程中发生错误');
    console.error('═'.repeat(60));
    console.error(error);
    process.exit(1);

  } finally {
    await client.end();
  }
}

/**
 * 查看迁移状态
 */
async function showMigrationStatus() {
  const client = createClient();

  try {
    console.log('📊 数据库迁移状态\n');
    console.log('═'.repeat(60));

    await client.connect();
    await ensureMigrationsTable(client);

    const allMigrations = scanMigrationFiles();
    const executedMigrations = await getExecutedMigrations(client);

    console.log('\n迁移文件列表:\n');
    console.log('┌─────┬─────────────────────────────────┬──────────┐');
    console.log('│ 序号│ 文件名                          │ 状态     │');
    console.log('├─────┼─────────────────────────────────┼──────────┤');

    allMigrations.forEach((migration, index) => {
      const isExecuted = executedMigrations.includes(migration.name);
      const status = isExecuted ? '✅ 已执行' : '⏳ 待执行';
      const num = String(index + 1).padStart(4);
      const name = migration.name.padEnd(32);
      console.log(`│ ${num}│ ${name}│ ${status}│`);
    });

    console.log('└─────┴─────────────────────────────────┴──────────┘\n');

    const pending = allMigrations.length - executedMigrations.length;
    console.log(`📈 统计: 总计 ${allMigrations.length} 个，已执行 ${executedMigrations.length} 个，待执行 ${pending} 个\n`);

  } catch (error) {
    console.error('❌ 查询状态失败:', error.message);
    process.exit(1);

  } finally {
    await client.end();
  }
}

/**
 * 重置迁移记录（危险操作）
 */
async function resetMigrations() {
  const client = createClient();

  try {
    console.log('⚠️  警告：此操作将清空迁移记录表！\n');

    await client.connect();
    await client.query(`DROP TABLE IF EXISTS ${MIGRATIONS_TABLE} CASCADE`);

    console.log('✅ 迁移记录已重置\n');

  } catch (error) {
    console.error('❌ 重置失败:', error.message);
    process.exit(1);

  } finally {
    await client.end();
  }
}

// ==================== 命令行接口 ====================

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'status':
      await showMigrationStatus();
      break;

    case 'reset':
      await resetMigrations();
      break;

    default:
      await runPendingMigrations();
      break;
  }
}

// 执行
if (require.main === module) {
  main().catch(error => {
    console.error('💥 致命错误:', error);
    process.exit(1);
  });
}

module.exports = {
  runPendingMigrations,
  showMigrationStatus,
  resetMigrations
};
