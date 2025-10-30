#!/usr/bin/env node

/**
 * 检查数据库中的图片数据
 */

const { Pool } = require('pg');
require('dotenv').config();

async function checkImages() {
  console.log('🔍 开始检查数据库中的图片数据...');
  
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('❌ 错误: 未找到数据库连接字符串');
    console.log('请检查 .env 文件中的 DATABASE_URL 或 SUPABASE_DB_URL');
    process.exit(1);
  }
  
  console.log('📡 连接数据库...');
  const pool = new Pool({
    connectionString: connectionString,
  });

  try {
    
    // 查询图片总数
    const countClient = await pool.connect();
    const countResult = await countClient.query('SELECT COUNT(*) as total FROM images');
    countClient.release();
    
    const totalImages = countResult.rows[0].total;
    console.log(`📊 图片总数: ${totalImages}`);
    
    if (totalImages > 0) {
      // 查询最近的图片
      const listClient = await pool.connect();
      const listResult = await listClient.query(`
        SELECT 
          id, 
          filename, 
          mimetype, 
          size, 
          created_at,
          LENGTH(data) as data_size
        FROM images 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      listClient.release();
      
      console.log('\n📷 最近上传的图片:');
      console.log('─'.repeat(100));
      console.log('ID'.padEnd(38) + 'Filename'.padEnd(25) + 'Type'.padEnd(15) + 'Size'.padEnd(10) + 'Upload Time');
      console.log('─'.repeat(100));
      
      listResult.rows.forEach(row => {
        const sizeKB = Math.round(row.size / 1024);
        const uploadTime = new Date(row.created_at).toLocaleString('zh-CN');
        console.log(
          row.id.padEnd(38) + 
          row.filename.substring(0, 24).padEnd(25) + 
          row.mimetype.padEnd(15) + 
          `${sizeKB}KB`.padEnd(10) + 
          uploadTime
        );
      });
      
      // 统计信息
      const statsClient = await pool.connect();
      const statsResult = await statsClient.query(`
        SELECT 
          mimetype,
          COUNT(*) as count,
          SUM(size) as total_size,
          AVG(size) as avg_size
        FROM images 
        GROUP BY mimetype
        ORDER BY count DESC
      `);
      statsClient.release();
      
      console.log('\n📈 图片类型统计:');
      console.log('─'.repeat(60));
      console.log('Type'.padEnd(20) + 'Count'.padEnd(10) + 'Total Size'.padEnd(15) + 'Avg Size');
      console.log('─'.repeat(60));
      
      statsResult.rows.forEach(row => {
        const totalMB = Math.round(row.total_size / 1024 / 1024 * 100) / 100;
        const avgKB = Math.round(row.avg_size / 1024);
        console.log(
          row.mimetype.padEnd(20) + 
          row.count.toString().padEnd(10) + 
          `${totalMB}MB`.padEnd(15) + 
          `${avgKB}KB`
        );
      });
      
      // 存储空间使用情况
      const spaceClient = await pool.connect();
      const spaceResult = await spaceClient.query(`
        SELECT 
          SUM(size) as total_size,
          COUNT(*) as total_count
        FROM images
      `);
      spaceClient.release();
      
      const totalMB = Math.round(spaceResult.rows[0].total_size / 1024 / 1024 * 100) / 100;
      console.log(`\n💾 总存储空间: ${totalMB}MB (${spaceResult.rows[0].total_count} 张图片)`);
      
    } else {
      console.log('\n📭 数据库中暂无图片数据');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    try {
      await pool.end();
      console.log('🔌 数据库连接已关闭');
    } catch (err) {
      console.error('关闭连接时出错:', err.message);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkImages();
}

module.exports = { checkImages };