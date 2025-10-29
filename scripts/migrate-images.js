#!/usr/bin/env node

/**
 * 数据库迁移脚本 - 创建图片存储表
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrateImages() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  });

  try {
    console.log('🔄 开始创建图片存储表...');
    
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'create-images-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // 执行迁移
    const client = await pool.connect();
    await client.query(sql);
    client.release();
    
    console.log('✅ 图片存储表创建成功！');
    
    // 验证表是否创建成功
    const verifyClient = await pool.connect();
    const result = await verifyClient.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'images' 
      ORDER BY ordinal_position
    `);
    verifyClient.release();
    
    console.log('\n📋 表结构:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateImages();
}

module.exports = { migrateImages };