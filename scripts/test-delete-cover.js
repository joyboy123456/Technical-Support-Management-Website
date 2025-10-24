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

async function testDeleteCover() {
  console.log('\n🧪 测试删除封面图功能\n');
  
  // 找一个有封面图的设备
  const { data: devices } = await supabase
    .from('devices')
    .select('id, name, cover_image')
    .not('cover_image', 'is', null)
    .limit(1);
  
  if (!devices || devices.length === 0) {
    console.log('⚠️  没有找到有封面图的设备，先设置一个封面图...');
    
    const { data: allDevices } = await supabase
      .from('devices')
      .select('id, name')
      .limit(1);
    
    if (!allDevices || allDevices.length === 0) {
      console.error('❌ 没有找到任何设备');
      return;
    }
    
    const testDevice = allDevices[0];
    const testImageUrl = 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800';
    
    console.log(`📝 为设备 "${testDevice.name}" (${testDevice.id}) 设置测试封面图...`);
    
    const { error: setError } = await supabase
      .from('devices')
      .update({ cover_image: testImageUrl })
      .eq('id', testDevice.id);
    
    if (setError) {
      console.error('❌ 设置封面图失败:', setError);
      return;
    }
    
    console.log('✅ 封面图设置成功\n');
    
    // 重新查询
    const { data: updatedDevices } = await supabase
      .from('devices')
      .select('id, name, cover_image')
      .eq('id', testDevice.id);
    
    if (updatedDevices && updatedDevices.length > 0) {
      testDeleteWithDevice(updatedDevices[0]);
    }
  } else {
    testDeleteWithDevice(devices[0]);
  }
}

async function testDeleteWithDevice(device) {
  console.log(`🎯 测试设备: "${device.name}" (${device.id})`);
  console.log(`📷 当前封面图: ${device.cover_image?.substring(0, 50)}...\n`);
  
  // 测试删除（设置为 null）
  console.log('🗑️  执行删除（设置为 null）...');
  
  const { error: deleteError } = await supabase
    .from('devices')
    .update({ cover_image: null })
    .eq('id', device.id);
  
  if (deleteError) {
    console.error('❌ 删除失败:', deleteError);
    return;
  }
  
  console.log('✅ 删除命令执行成功\n');
  
  // 验证结果
  console.log('🔍 验证删除结果...');
  
  const { data: verifyData } = await supabase
    .from('devices')
    .select('id, name, cover_image')
    .eq('id', device.id)
    .single();
  
  if (!verifyData) {
    console.error('❌ 无法查询到设备');
    return;
  }
  
  console.log(`📋 查询结果:`);
  console.log(`   设备: ${verifyData.name}`);
  console.log(`   cover_image: ${verifyData.cover_image === null ? '✅ null (已删除)' : `❌ "${verifyData.cover_image}" (仍有值)`}\n`);
  
  if (verifyData.cover_image === null) {
    console.log('🎉 测试成功！封面图已正确删除\n');
  } else {
    console.log('⚠️  测试失败：封面图未被删除\n');
  }
}

testDeleteCover();
