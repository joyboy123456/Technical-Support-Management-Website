#!/usr/bin/env node

/**
 * 一键配置脚本
 * 自动创建 .env 文件并配置 Supabase 环境变量
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// 默认配置
const DEFAULT_CONFIG = {
  VITE_SUPABASE_URL: 'https://your-project-id.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'your_actual_supabase_anon_key_here'
};

async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     Supabase 环境配置向导                                   ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  // 检查 .env 文件是否已存在
  if (fs.existsSync(envPath)) {
    log('⚠️  检测到 .env 文件已存在', 'yellow');
    const overwrite = await question('是否覆盖现有配置？(y/N): ');
    
    if (overwrite.toLowerCase() !== 'y') {
      log('\n✅ 保留现有配置，退出向导', 'green');
      rl.close();
      return;
    }
    
    // 备份现有文件
    const backupPath = `${envPath}.backup.${Date.now()}`;
    fs.copyFileSync(envPath, backupPath);
    log(`📦 已备份现有配置到: ${path.basename(backupPath)}`, 'blue');
  }

  log('\n📋 配置选项：', 'bright');
  log('1. 使用默认配置（推荐）', 'blue');
  log('2. 自定义配置', 'blue');
  log('3. 从 .env.example 复制', 'blue');

  const choice = await question('\n请选择 (1-3): ');

  let config = {};

  switch (choice.trim()) {
    case '1':
      // 使用默认配置
      config = { ...DEFAULT_CONFIG };
      log('\n✅ 使用默认配置', 'green');
      break;

    case '2':
      // 自定义配置
      log('\n请输入 Supabase 配置信息：', 'bright');
      log('（直接按回车使用默认值）\n', 'yellow');

      const url = await question(`Supabase URL [${DEFAULT_CONFIG.VITE_SUPABASE_URL}]: `);
      config.VITE_SUPABASE_URL = url.trim() || DEFAULT_CONFIG.VITE_SUPABASE_URL;

      const key = await question(`Supabase ANON KEY [${DEFAULT_CONFIG.VITE_SUPABASE_ANON_KEY.substring(0, 30)}...]: `);
      config.VITE_SUPABASE_ANON_KEY = key.trim() || DEFAULT_CONFIG.VITE_SUPABASE_ANON_KEY;

      log('\n✅ 自定义配置完成', 'green');
      break;

    case '3':
      // 从 .env.example 复制
      if (!fs.existsSync(envExamplePath)) {
        log('\n❌ 错误: .env.example 文件不存在', 'red');
        rl.close();
        return;
      }

      fs.copyFileSync(envExamplePath, envPath);
      log('\n✅ 已从 .env.example 复制配置', 'green');
      log('⚠️  请手动编辑 .env 文件以填写实际的配置值', 'yellow');
      rl.close();
      return;

    default:
      log('\n❌ 无效的选择', 'red');
      rl.close();
      return;
  }

  // 询问是否需要数据库连接字符串
  log('\n是否需要配置数据库连接字符串？（用于 CLI 和脚本）', 'bright');
  const needDbUrl = await question('(y/N): ');

  if (needDbUrl.toLowerCase() === 'y') {
    log('\n请输入数据库密码：', 'bright');
    const dbPassword = await question('密码: ');
    
    if (dbPassword.trim()) {
      config.SUPABASE_DB_URL = `postgresql://postgres:${dbPassword.trim()}@db.your-project-id.supabase.co:5432/postgres`;
    }
  }

  // 生成 .env 文件内容
  const envContent = generateEnvContent(config);

  // 写入文件
  fs.writeFileSync(envPath, envContent, 'utf8');

  log('\n╔════════════════════════════════════════════════════════════╗', 'green');
  log('║     ✅ 配置完成！                                           ║', 'green');
  log('╚════════════════════════════════════════════════════════════╝\n', 'green');

  log('📄 已创建 .env 文件，包含以下配置：', 'bright');
  log(`   • VITE_SUPABASE_URL: ${config.VITE_SUPABASE_URL}`, 'blue');
  log(`   • VITE_SUPABASE_ANON_KEY: ${config.VITE_SUPABASE_ANON_KEY.substring(0, 30)}...`, 'blue');
  
  if (config.SUPABASE_DB_URL) {
    log(`   • SUPABASE_DB_URL: postgresql://postgres:***@db...`, 'blue');
  }

  log('\n🚀 下一步操作：', 'bright');
  log('   1. 运行 npm run dev 启动开发服务器', 'cyan');
  log('   2. 访问 http://localhost:5173', 'cyan');
  log('   3. 验证数据加载正常', 'cyan');

  log('\n📚 相关文档：', 'bright');
  log('   • LOCAL_SETUP.md - 本地开发环境配置', 'blue');
  log('   • VERCEL_ENV_CONFIG.md - Vercel 环境变量配置', 'blue');
  log('   • SUPABASE_SETUP.md - Supabase 详细配置', 'blue');

  rl.close();
}

function generateEnvContent(config) {
  const lines = [
    '# ========================================',
    '# Supabase 数据库配置',
    '# ========================================',
    '# 自动生成时间: ' + new Date().toLocaleString('zh-CN'),
    '#',
    '# ⚠️ 重要：本项目使用 Vite，必须使用 VITE_ 前缀',
    '# ❌ 错误：NEXT_PUBLIC_SUPABASE_URL',
    '# ✅ 正确：VITE_SUPABASE_URL',
    '',
    `VITE_SUPABASE_URL=${config.VITE_SUPABASE_URL}`,
    `VITE_SUPABASE_ANON_KEY=${config.VITE_SUPABASE_ANON_KEY}`,
    ''
  ];

  if (config.SUPABASE_DB_URL) {
    lines.push(
      '# ========================================',
      '# Supabase 数据库连接（用于 CLI 和脚本）',
      '# ========================================',
      '',
      `SUPABASE_DB_URL=${config.SUPABASE_DB_URL}`,
      ''
    );
  }

  lines.push(
    '# ========================================',
    '# Figma MCP Configuration (可选)',
    '# ========================================',
    '',
    'FIGMA_PERSONAL_ACCESS_TOKEN=your_figma_token_here',
    ''
  );

  return lines.join('\n');
}

// 错误处理
process.on('SIGINT', () => {
  log('\n\n👋 配置已取消', 'yellow');
  rl.close();
  process.exit(0);
});

// 运行主函数
main().catch(error => {
  log(`\n❌ 错误: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});
