#!/usr/bin/env node

/**
 * Supabase 连接诊断工具
 * 帮助定位连接问题
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 读取环境变量
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    return null;
  }

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

// HTTP 请求函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000, // 10秒超时
    };

    log(`\n📡 请求详情:`, 'cyan');
    log(`   URL: ${url}`, 'cyan');
    log(`   方法: ${requestOptions.method}`, 'cyan');
    log(`   主机: ${requestOptions.hostname}`, 'cyan');

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      log(`\n📥 响应状态: ${res.statusCode}`, res.statusCode === 200 ? 'green' : 'yellow');
      log(`   响应头:`, 'cyan');
      Object.keys(res.headers).slice(0, 5).forEach(key => {
        log(`   ${key}: ${res.headers[key]}`, 'cyan');
      });

      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({ 
            data: jsonData, 
            error: null, 
            status: res.statusCode,
            headers: res.headers,
            rawData: data
          });
        } catch (e) {
          resolve({ 
            data: null, 
            error: { message: data }, 
            status: res.statusCode,
            headers: res.headers,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      log(`\n❌ 请求错误: ${error.message}`, 'red');
      reject(error);
    });

    req.on('timeout', () => {
      log(`\n❌ 请求超时（10秒）`, 'red');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function diagnose() {
  log('\n🔍 Supabase 连接诊断工具\n', 'bright');
  log('═'.repeat(60), 'cyan');

  // 步骤 1: 检查环境变量
  log('\n步骤 1: 检查环境变量', 'bright');
  log('─'.repeat(60));

  const env = loadEnvFile();
  
  if (!env) {
    log('❌ .env 文件不存在', 'red');
    return;
  }

  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  const dbUrl = env.SUPABASE_DB_URL;

  if (!url || !key) {
    log('❌ 环境变量缺失', 'red');
    log(`   VITE_SUPABASE_URL: ${url ? '✅' : '❌'}`, url ? 'green' : 'red');
    log(`   VITE_SUPABASE_ANON_KEY: ${key ? '✅' : '❌'}`, key ? 'green' : 'red');
    return;
  }

  log('✅ 环境变量已配置', 'green');
  log(`   URL: ${url}`, 'cyan');
  log(`   Key: ${key.substring(0, 30)}...`, 'cyan');
  if (dbUrl) {
    const maskedDbUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
    log(`   DB URL: ${maskedDbUrl}`, 'cyan');
  }

  // 步骤 2: 测试 DNS 解析
  log('\n步骤 2: 测试 DNS 解析', 'bright');
  log('─'.repeat(60));

  try {
    const urlObj = new URL(url);
    log(`✅ URL 格式正确`, 'green');
    log(`   协议: ${urlObj.protocol}`, 'cyan');
    log(`   主机: ${urlObj.hostname}`, 'cyan');
    log(`   端口: ${urlObj.port || '443 (默认)'}`, 'cyan');
  } catch (error) {
    log(`❌ URL 格式错误: ${error.message}`, 'red');
    return;
  }

  // 步骤 3: 测试基本连接
  log('\n步骤 3: 测试基本 HTTPS 连接', 'bright');
  log('─'.repeat(60));

  try {
    const healthUrl = `${url}/rest/v1/`;
    const response = await makeRequest(healthUrl, {
      method: 'GET',
      headers: {
        'apikey': key,
      }
    });

    if (response.status === 200 || response.status === 404) {
      log('\n✅ 基本连接成功', 'green');
    } else {
      log(`\n⚠️  连接返回状态: ${response.status}`, 'yellow');
      if (response.rawData) {
        log(`   响应内容: ${response.rawData.substring(0, 200)}`, 'yellow');
      }
    }
  } catch (error) {
    log(`\n❌ 连接失败: ${error.message}`, 'red');
    log('\n可能的原因:', 'yellow');
    log('  1. 网络连接问题', 'yellow');
    log('  2. Supabase 服务不可用', 'yellow');
    log('  3. 防火墙阻止连接', 'yellow');
    return;
  }

  // 步骤 4: 测试表访问
  log('\n步骤 4: 测试数据表访问', 'bright');
  log('─'.repeat(60));

  const tables = [
    'devices',
    'maintenance_logs',
    'issues',
    'inventory',
    'outbound_records',
    'audit_logs',
  ];

  for (const table of tables) {
    try {
      const tableUrl = `${url}/rest/v1/${table}?select=*&limit=0`;
      const response = await makeRequest(tableUrl, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        }
      });

      if (response.status === 200) {
        log(`  ✅ ${table} - 可访问`, 'green');
      } else if (response.status === 401) {
        log(`  ❌ ${table} - 401 Unauthorized (权限问题)`, 'red');
        if (response.rawData) {
          log(`     错误: ${response.rawData.substring(0, 100)}`, 'yellow');
        }
      } else if (response.status === 404) {
        log(`  ❌ ${table} - 404 Not Found (表不存在)`, 'red');
      } else {
        log(`  ⚠️  ${table} - HTTP ${response.status}`, 'yellow');
        if (response.rawData) {
          log(`     响应: ${response.rawData.substring(0, 100)}`, 'yellow');
        }
      }
    } catch (error) {
      log(`  ❌ ${table} - 连接错误: ${error.message}`, 'red');
    }
  }

  // 步骤 5: 测试写入权限
  log('\n步骤 5: 测试写入权限', 'bright');
  log('─'.repeat(60));

  try {
    const testData = {
      action_type: '诊断测试',
      entity_type: 'test',
      entity_id: 'diagnose-' + Date.now(),
      operator: '诊断工具',
      details: { test: true, timestamp: new Date().toISOString() },
    };

    const writeUrl = `${url}/rest/v1/audit_logs`;
    const response = await makeRequest(writeUrl, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: testData
    });

    if (response.status === 201) {
      log('  ✅ 写入测试成功', 'green');
    } else {
      log(`  ⚠️  写入测试返回: ${response.status}`, 'yellow');
      if (response.rawData) {
        log(`     响应: ${response.rawData.substring(0, 200)}`, 'yellow');
      }
    }
  } catch (error) {
    log(`  ❌ 写入测试失败: ${error.message}`, 'red');
  }

  // 总结
  log('\n═'.repeat(60), 'cyan');
  log('\n📊 诊断总结', 'bright');
  log('─'.repeat(60));
  log('\n请将以上所有输出信息提供给我，我会帮你分析问题。\n', 'cyan');
}

diagnose().catch(error => {
  log(`\n❌ 诊断工具执行失败: ${error.message}`, 'red');
  console.error(error);
});
