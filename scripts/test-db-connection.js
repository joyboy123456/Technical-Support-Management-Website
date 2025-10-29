#!/usr/bin/env node

/**
 * 测试数据库连接
 */

const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 测试数据库连接...');
  
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  console.log('📡 连接字符串:', connectionString ? '已配置' : '未配置');
  
  if (!connectionString) {
    console.error('❌ 错误: 未找到数据库连接字符串');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: connectionString,
  });

  try {
    console.log('🔌 正在连接数据库...');
    const client = await pool.connect();
    
    console.log('✅ 数据库连接成功！');
    
    // 测试基本查询
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('⏰ 数据库时间:', result.rows[0].current_time);
    console.log('🗄️  数据库版本:', result.rows[0].db_version.split(' ')[0]);
    
    // 检查 images 表是否存在
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'images'
      ) as table_exists
    `);
    
    console.log('📋 images 表存在:', tableCheck.rows[0].table_exists ? '是' : '否');
    
    if (tableCheck.rows[0].table_exists) {
      const countResult = await client.query('SELECT COUNT(*) as count FROM images');
      console.log('📷 图片数量:', countResult.rows[0].count);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await pool.end();
  }
}

testConnection();