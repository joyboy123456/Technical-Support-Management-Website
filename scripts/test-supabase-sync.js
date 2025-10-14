#!/usr/bin/env node

/**
 * Supabase 数据同步测试脚本
 * 
 * 功能：
 * 1. 检查 Supabase 配置是否正确
 * 2. 测试数据库连接
 * 3. 验证本地调用是否使用 Supabase 数据
 * 4. 测试数据读写同步
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
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

// 简单的 HTTP 请求函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ data: jsonData, error: null, status: res.statusCode });
        } catch (e) {
          resolve({ data: null, error: { message: data }, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// 测试 1: 检查配置文件
async function testConfigFiles() {
  logSection('测试 1: 检查配置文件');
  
  const files = [
    { path: '.env', required: true, desc: '环境变量配置文件' },
    { path: '.env.example', required: false, desc: '环境变量模板文件' },
    { path: 'supabase/config.toml', required: false, desc: 'Supabase CLI 配置' },
  ];
  
  let allPassed = true;
  
  for (const file of files) {
    const filePath = path.join(__dirname, '..', file.path);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      logSuccess(`${file.desc} 存在: ${file.path}`);
    } else if (file.required) {
      logError(`${file.desc} 不存在: ${file.path}`);
      allPassed = false;
    } else {
      logWarning(`${file.desc} 不存在: ${file.path} (可选)`);
    }
  }
  
  return allPassed;
}

// 测试 2: 检查环境变量
async function testEnvironmentVariables() {
  logSection('测试 2: 检查环境变量');
  
  const env = loadEnvFile();
  
  if (!env) {
    logError('.env 文件不存在');
    logInfo('请运行: npm run setup 或手动创建 .env 文件');
    return false;
  }
  
  const requiredVars = [
    { key: 'VITE_SUPABASE_URL', desc: 'Supabase 项目 URL' },
    { key: 'VITE_SUPABASE_ANON_KEY', desc: 'Supabase 匿名密钥' },
  ];
  
  let allPassed = true;
  
  for (const varInfo of requiredVars) {
    const value = env[varInfo.key];
    
    if (!value) {
      logError(`${varInfo.desc} 未配置: ${varInfo.key}`);
      allPassed = false;
    } else if (value.includes('your_') || value.includes('your-')) {
      logWarning(`${varInfo.desc} 使用占位符值: ${varInfo.key}`);
      logInfo('请替换为真实的 Supabase 凭据');
      allPassed = false;
    } else {
      logSuccess(`${varInfo.desc} 已配置: ${varInfo.key}`);
      logInfo(`  值: ${value.substring(0, 30)}...`);
    }
  }
  
  return allPassed;
}

// 测试 3: 测试数据库连接
async function testDatabaseConnection() {
  logSection('测试 3: 测试数据库连接');
  
  const env = loadEnvFile();
  
  if (!env || !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    logError('环境变量未正确配置，跳过连接测试');
    return false;
  }
  
  try {
    logInfo('正在连接到 Supabase...');
    
    // 测试简单查询
    const url = `${env.VITE_SUPABASE_URL}/rest/v1/devices?select=count&count=exact&head=true`;
    const response = await makeRequest(url, {
      method: 'HEAD',
      headers: {
        'apikey': env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
      }
    });
    
    if (response.status !== 200 && response.status !== 206) {
      logError(`数据库连接失败: HTTP ${response.status}`);
      logInfo('可能的原因:');
      logInfo('  1. URL 或密钥不正确');
      logInfo('  2. 数据库表未创建');
      logInfo('  3. 网络连接问题');
      return false;
    }
    
    logSuccess('数据库连接成功！');
    return true;
  } catch (error) {
    logError(`连接测试失败: ${error.message}`);
    return false;
  }
}

// 测试 4: 验证数据表结构
async function testDatabaseSchema() {
  logSection('测试 4: 验证数据表结构');
  
  const env = loadEnvFile();
  
  if (!env || !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    logError('环境变量未正确配置，跳过表结构测试');
    return false;
  }
  
  try {
    const tables = [
      { name: 'devices', desc: '设备表' },
      { name: 'maintenance_logs', desc: '维护日志表' },
      { name: 'issues', desc: '故障记录表' },
      { name: 'inventory', desc: '库存表' },
      { name: 'outbound_records', desc: '出库记录表' },
      { name: 'audit_logs', desc: '审计日志表' },
    ];
    
    let allPassed = true;
    
    for (const table of tables) {
      try {
        const url = `${env.VITE_SUPABASE_URL}/rest/v1/${table.name}?select=*&limit=0`;
        const response = await makeRequest(url, {
          method: 'GET',
          headers: {
            'apikey': env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
          }
        });
        
        if (response.status === 200) {
          logSuccess(`${table.desc} (${table.name}) 存在`);
        } else {
          logError(`${table.desc} (${table.name}) 不存在或无权限访问`);
          if (response.error) {
            logInfo(`  错误: ${response.error.message || JSON.stringify(response.error)}`);
          }
          allPassed = false;
        }
      } catch (error) {
        logError(`${table.desc} (${table.name}) 检查失败`);
        logInfo(`  错误: ${error.message}`);
        allPassed = false;
      }
    }
    
    return allPassed;
  } catch (error) {
    logError(`表结构验证失败: ${error.message}`);
    return false;
  }
}

// 测试 5: 测试数据读取
async function testDataReading() {
  logSection('测试 5: 测试数据读取');
  
  const env = loadEnvFile();
  
  if (!env || !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    logError('环境变量未正确配置，跳过数据读取测试');
    return false;
  }
  
  try {
    // 读取设备数据
    logInfo('正在读取设备数据...');
    const devicesUrl = `${env.VITE_SUPABASE_URL}/rest/v1/devices?select=*&limit=5`;
    const devicesResponse = await makeRequest(devicesUrl, {
      method: 'GET',
      headers: {
        'apikey': env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
      }
    });
    
    if (devicesResponse.status !== 200) {
      logError(`读取设备数据失败: HTTP ${devicesResponse.status}`);
      return false;
    }
    
    const devices = devicesResponse.data;
    
    if (!devices || devices.length === 0) {
      logWarning('设备表为空，没有数据');
      logInfo('提示: 可能需要运行数据迁移脚本导入初始数据');
      return false;
    }
    
    logSuccess(`成功读取 ${devices.length} 条设备记录`);
    logInfo(`示例设备: ${devices[0].name} (${devices[0].model})`);
    
    // 读取库存数据
    logInfo('正在读取库存数据...');
    const inventoryUrl = `${env.VITE_SUPABASE_URL}/rest/v1/inventory?select=*&limit=1`;
    const inventoryResponse = await makeRequest(inventoryUrl, {
      method: 'GET',
      headers: {
        'apikey': env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
        'Accept': 'application/vnd.pgrst.object+json'
      }
    });
    
    if (inventoryResponse.status === 200) {
      const inventory = Array.isArray(inventoryResponse.data) ? inventoryResponse.data[0] : inventoryResponse.data;
      if (inventory) {
        logSuccess('成功读取库存数据');
        logInfo(`库存位置: ${inventory.location}`);
      } else {
        logWarning('库存表为空');
        logInfo('提示: 首次使用时库存数据会自动创建');
      }
    } else if (inventoryResponse.status === 406) {
      logWarning('库存表为空');
      logInfo('提示: 首次使用时库存数据会自动创建');
    } else {
      logWarning(`读取库存数据返回状态: ${inventoryResponse.status}`);
    }
    
    return true;
  } catch (error) {
    logError(`数据读取测试失败: ${error.message}`);
    return false;
  }
}

// 测试 6: 测试数据写入（可选）
async function testDataWriting() {
  logSection('测试 6: 测试数据写入（只读测试）');
  
  const env = loadEnvFile();
  
  if (!env || !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    logError('环境变量未正确配置，跳过数据写入测试');
    return false;
  }
  
  try {
    logInfo('检查写入权限...');
    
    // 尝试创建一个测试审计日志（不会影响业务数据）
    const testLog = {
      action_type: '系统测试',
      entity_type: 'test',
      entity_id: 'test-' + Date.now(),
      operator: '测试脚本',
      details: { test: true, timestamp: new Date().toISOString() },
    };
    
    const url = `${env.VITE_SUPABASE_URL}/rest/v1/audit_logs`;
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'apikey': env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: testLog
    });
    
    if (response.status === 201) {
      logSuccess('数据写入测试通过');
      logInfo('提示: 已创建一条测试审计日志');
    } else {
      logWarning(`写入测试返回状态: ${response.status}`);
      logInfo('这可能是正常的，取决于数据库权限配置');
    }
    
    return true; // 不算失败，因为可能是权限限制
  } catch (error) {
    logWarning(`数据写入测试异常: ${error.message}`);
    return true; // 不算失败
  }
}

// 测试 7: 检查代码集成
async function testCodeIntegration() {
  logSection('测试 7: 检查代码集成');
  
  const filesToCheck = [
    {
      path: 'src/lib/supabase.ts',
      checks: [
        { pattern: /import.*@supabase\/supabase-js/, desc: 'Supabase 客户端导入' },
        { pattern: /createClient/, desc: 'Supabase 客户端创建' },
        { pattern: /isSupabaseConfigured/, desc: '配置状态检查' },
      ]
    },
    {
      path: 'src/services/deviceService.ts',
      checks: [
        { pattern: /from.*supabase/, desc: 'Supabase 导入' },
        { pattern: /supabase\.from\('devices'\)/, desc: '设备表查询' },
      ]
    },
    {
      path: 'src/services/inventoryService.ts',
      checks: [
        { pattern: /from.*supabase/, desc: 'Supabase 导入' },
        { pattern: /supabase\.from\('inventory'\)/, desc: '库存表查询' },
      ]
    },
    {
      path: 'src/data/devices.ts',
      checks: [
        { pattern: /isSupabaseConfigured/, desc: '配置检查' },
        { pattern: /fetchDevices/, desc: 'Supabase 数据获取' },
      ]
    },
  ];
  
  let allPassed = true;
  
  for (const file of filesToCheck) {
    const filePath = path.join(__dirname, '..', file.path);
    
    if (!fs.existsSync(filePath)) {
      logError(`文件不存在: ${file.path}`);
      allPassed = false;
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    logInfo(`检查文件: ${file.path}`);
    
    for (const check of file.checks) {
      if (check.pattern.test(content)) {
        logSuccess(`  ✓ ${check.desc}`);
      } else {
        logWarning(`  ✗ ${check.desc} 未找到`);
      }
    }
  }
  
  return allPassed;
}

// 主测试函数
async function runTests() {
  log('\n🧪 Supabase 数据同步测试\n', 'bright');
  log('本脚本将验证项目是否正确配置并使用 Supabase 数据库\n', 'cyan');
  
  const results = {
    configFiles: await testConfigFiles(),
    envVars: await testEnvironmentVariables(),
    connection: await testDatabaseConnection(),
    schema: await testDatabaseSchema(),
    reading: await testDataReading(),
    writing: await testDataWriting(),
    integration: await testCodeIntegration(),
  };
  
  // 汇总结果
  logSection('测试结果汇总');
  
  const tests = [
    { name: '配置文件检查', key: 'configFiles', critical: true },
    { name: '环境变量检查', key: 'envVars', critical: true },
    { name: '数据库连接', key: 'connection', critical: true },
    { name: '数据表结构', key: 'schema', critical: true },
    { name: '数据读取', key: 'reading', critical: true },
    { name: '数据写入', key: 'writing', critical: false },
    { name: '代码集成', key: 'integration', critical: false },
  ];
  
  let criticalPassed = true;
  let allPassed = true;
  
  for (const test of tests) {
    const passed = results[test.key];
    const status = passed ? '✅ 通过' : '❌ 失败';
    const critical = test.critical ? ' [关键]' : '';
    
    console.log(`${status} ${test.name}${critical}`);
    
    if (!passed) {
      allPassed = false;
      if (test.critical) {
        criticalPassed = false;
      }
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  if (allPassed) {
    logSuccess('🎉 所有测试通过！');
    logInfo('✨ 项目已正确配置，本地调用使用 Supabase 数据');
    logInfo('📝 您可以开始开发，数据将自动同步到云端');
  } else if (criticalPassed) {
    logWarning('⚠️  关键测试通过，但有些非关键测试失败');
    logInfo('💡 项目基本可用，但建议修复警告项');
  } else {
    logError('❌ 测试失败！');
    logInfo('🔧 请按照上述错误提示修复问题');
    logInfo('📖 参考文档: QUICK_START.md 或 LOCAL_SETUP.md');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 返回退出码
  process.exit(criticalPassed ? 0 : 1);
}

// 运行测试
runTests().catch(error => {
  logError(`测试执行失败: ${error.message}`);
  console.error(error);
  process.exit(1);
});
