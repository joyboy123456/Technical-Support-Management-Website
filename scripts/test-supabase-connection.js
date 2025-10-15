/**
 * 测试 Supabase 连接
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sbp-a2e2xuudcasoe44t.supabase.opentrust.net';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNicC1hMmUyeHV1ZGNhc29lNDR0IiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjAwNjU2MTMsImV4cCI6MjA3NTY0MTYxM30.keZ6_HXm3pgWaWZdD_2OFbGff89Gf6RDTM_b1340tiI';

console.log('═══════════════════════════════════════════════════════');
console.log('  测试 Supabase 连接');
console.log('═══════════════════════════════════════════════════════\n');

console.log('配置信息:');
console.log('  URL:', supabaseUrl);
console.log('  Key:', supabaseKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    // 测试1: 获取设备类型
    console.log('测试 1: 获取设备类型 (device_types)...');
    const { data: types, error: typesError } = await supabase
      .from('device_types')
      .select('*')
      .order('sort_order', { ascending: true });

    if (typesError) {
      console.error('  ❌ 失败:', typesError.message);
    } else {
      console.log('  ✅ 成功！获取到', types.length, '条设备类型:');
      types.forEach(type => {
        console.log(`     - ${type.name} (${type.color})`);
      });
    }
    console.log('');

    // 测试2: 获取设备列表
    console.log('测试 2: 获取设备列表 (devices)...');
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('id, name, device_type')
      .limit(5);

    if (devicesError) {
      console.error('  ❌ 失败:', devicesError.message);
    } else {
      console.log('  ✅ 成功！获取到', devices.length, '台设备:');
      devices.forEach(device => {
        console.log(`     - ${device.name} (类型: ${device.device_type || '未设置'})`);
      });
    }
    console.log('');

    // 测试3: 测试设备类型写入权限
    console.log('测试 3: 测试设备类型写入权限...');
    const testType = {
      name: `测试类型_${Date.now()}`,
      description: '这是一个测试类型，会立即删除',
      color: '#FF0000',
      sort_order: 999
    };

    const { data: created, error: createError } = await supabase
      .from('device_types')
      .insert(testType)
      .select()
      .single();

    if (createError) {
      console.error('  ❌ 创建失败:', createError.message);
    } else {
      console.log('  ✅ 创建成功:', created.name);
      
      // 立即删除测试数据
      const { error: deleteError } = await supabase
        .from('device_types')
        .delete()
        .eq('id', created.id);
      
      if (deleteError) {
        console.error('  ⚠️  删除测试数据失败:', deleteError.message);
      } else {
        console.log('  ✅ 测试数据已清理');
      }
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════════');
    console.log('  所有测试完成！');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('发生错误:', error.message);
  }
})();
