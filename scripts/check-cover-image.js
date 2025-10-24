import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// 读取 .env 文件
const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCoverImages() {
  console.log('\n📋 检查所有设备的封面图状态...\n');
  
  const { data: devices, error } = await supabase
    .from('devices')
    .select('id, name, cover_image')
    .order('name');
  
  if (error) {
    console.error('❌ 查询失败:', error);
    return;
  }
  
  console.log(`找到 ${devices.length} 个设备:\n`);
  
  devices.forEach((device, index) => {
    const coverStatus = device.cover_image === null 
      ? '❌ null' 
      : device.cover_image === '' 
      ? '⚠️  空字符串' 
      : `✅ ${device.cover_image.substring(0, 50)}...`;
    
    console.log(`${index + 1}. ${device.name} (${device.id})`);
    console.log(`   cover_image: ${coverStatus}\n`);
  });
}

checkCoverImages();
