#!/usr/bin/env node

/**
 * PostgreSQL HTTP API 服务器
 * 为前端提供数据库访问接口
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = process.env.POSTGRES_API_PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 配置 multer 用于文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

// 数据库连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 错误处理
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

// 健康检查
app.get('/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 通用查询接口
app.post('/query', async (req, res) => {
  const { sql, params = [] } = req.body;

  if (!sql) {
    return res.status(400).json({ error: 'SQL query is required' });
  }

  try {
    const client = await pool.connect();
    const result = await client.query(sql, params);
    client.release();

    res.json({
      data: result.rows,
      count: result.rowCount,
      error: null
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({
      data: null,
      error: error.message
    });
  }
});

// 表查询接口 (类似 Supabase)
app.get('/table/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const { select = '*', where, order, limit } = req.query;

  try {
    let sql = `SELECT ${select} FROM ${tableName}`;
    const params = [];
    let paramIndex = 1;

    // WHERE 条件
    if (where) {
      const conditions = [];
      const whereObj = JSON.parse(where);

      for (const [key, value] of Object.entries(whereObj)) {
        conditions.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    // ORDER BY
    if (order) {
      sql += ` ORDER BY ${order}`;
    }

    // LIMIT
    if (limit) {
      sql += ` LIMIT ${parseInt(limit)}`;
    }

    const client = await pool.connect();
    const result = await client.query(sql, params);
    client.release();

    res.json({
      data: result.rows,
      count: result.rowCount,
      error: null
    });
  } catch (error) {
    console.error('Table query error:', error);
    res.status(500).json({
      data: null,
      error: error.message
    });
  }
});

// 插入数据
app.post('/table/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const data = req.body;

  try {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;

    const client = await pool.connect();
    const result = await client.query(sql, values);
    client.release();

    res.json({
      data: result.rows,
      error: null
    });
  } catch (error) {
    console.error('Insert error:', error);
    res.status(500).json({
      data: null,
      error: error.message
    });
  }
});

// 更新数据
app.patch('/table/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const { data, where } = req.body;

  if (!where) {
    return res.status(400).json({ error: 'WHERE condition is required for updates' });
  }

  try {
    const columns = Object.keys(data);
    const values = Object.values(data);

    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    let sql = `UPDATE ${tableName} SET ${setClause}`;

    let allParams = [...values];
    let paramIndex = values.length + 1;

    // WHERE 条件
    const conditions = [];
    for (const [key, value] of Object.entries(where)) {
      conditions.push(`${key} = $${paramIndex}`);
      allParams.push(value);
      paramIndex++;
    }

    sql += ` WHERE ${conditions.join(' AND ')} RETURNING *`;

    const client = await pool.connect();
    const result = await client.query(sql, allParams);
    client.release();

    res.json({
      data: result.rows,
      error: null
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      data: null,
      error: error.message
    });
  }
});

// 删除数据
app.delete('/table/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const { where } = req.body;

  if (!where) {
    return res.status(400).json({ error: 'WHERE condition is required for deletes' });
  }

  try {
    let sql = `DELETE FROM ${tableName}`;
    const params = [];
    let paramIndex = 1;

    // WHERE 条件
    const conditions = [];
    for (const [key, value] of Object.entries(where)) {
      conditions.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }

    sql += ` WHERE ${conditions.join(' AND ')} RETURNING *`;

    const client = await pool.connect();
    const result = await client.query(sql, params);
    client.release();

    res.json({
      data: result.rows,
      error: null
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      data: null,
      error: error.message
    });
  }
});

// 图片上传接口
app.post('/upload/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const { buffer, mimetype, originalname } = req.file;
    const imageId = crypto.randomUUID();
    const fileExtension = originalname.split('.').pop() || 'jpg';
    const filename = `${imageId}.${fileExtension}`;

    // 将图片存储到数据库
    const sql = `
      INSERT INTO images (id, filename, mimetype, data, size, created_at) 
      VALUES ($1, $2, $3, $4, $5, NOW()) 
      RETURNING id, filename, mimetype, size, created_at
    `;

    const client = await pool.connect();
    const result = await client.query(sql, [
      imageId,
      filename,
      mimetype,
      buffer,
      buffer.length
    ]);
    client.release();

    res.json({
      success: true,
      data: result.rows[0],
      url: `/image/${imageId}` // 返回图片访问URL
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Base64 图片上传接口
app.post('/upload/base64', async (req, res) => {
  try {
    const { base64Data, filename } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: '没有提供base64数据' });
    }

    // 解析 base64 数据
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: '无效的base64格式' });
    }

    const mimetype = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const imageId = crypto.randomUUID();
    const fileExtension = mimetype.split('/')[1] || 'jpg';
    const finalFilename = filename || `${imageId}.${fileExtension}`;

    // 将图片存储到数据库
    const sql = `
      INSERT INTO images (id, filename, mimetype, data, size, created_at) 
      VALUES ($1, $2, $3, $4, $5, NOW()) 
      RETURNING id, filename, mimetype, size, created_at
    `;

    const client = await pool.connect();
    const result = await client.query(sql, [
      imageId,
      finalFilename,
      mimetype,
      buffer,
      buffer.length
    ]);
    client.release();

    res.json({
      success: true,
      data: result.rows[0],
      url: `/image/${imageId}` // 返回图片访问URL
    });
  } catch (error) {
    console.error('Base64 upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 图片获取接口
app.get('/image/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;

    const sql = 'SELECT filename, mimetype, data FROM images WHERE id = $1';
    const client = await pool.connect();
    const result = await client.query(sql, [imageId]);
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '图片不存在' });
    }

    const { filename, mimetype, data } = result.rows[0];

    // 设置响应头
    res.set({
      'Content-Type': mimetype,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'public, max-age=31536000', // 缓存1年
    });

    res.send(data);
  } catch (error) {
    console.error('Image fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 图片删除接口
app.delete('/image/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;

    const sql = 'DELETE FROM images WHERE id = $1 RETURNING id, filename';
    const client = await pool.connect();
    const result = await client.query(sql, [imageId]);
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '图片不存在' });
    }

    res.json({
      success: true,
      message: '图片已删除',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Image delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 图片列表接口
app.get('/images', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const sql = `
      SELECT id, filename, mimetype, size, created_at 
      FROM images 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;

    const client = await pool.connect();
    const result = await client.query(sql, [parseInt(limit), parseInt(offset)]);
    client.release();

    // 为每个图片添加访问URL
    const images = result.rows.map(img => ({
      ...img,
      url: `/image/${img.id}`
    }));

    res.json({
      data: images,
      count: result.rowCount,
      error: null
    });
  } catch (error) {
    console.error('Images list error:', error);
    res.status(500).json({
      data: null,
      error: error.message
    });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`🐘 PostgreSQL API 服务器运行在 http://localhost:${port}`);
  console.log(`📊 数据库连接: ${process.env.DATABASE_URL ? '已配置' : '未配置'}`);
  console.log(`📷 图片上传功能已启用`);
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务器...');
  await pool.end();
  process.exit(0);
});