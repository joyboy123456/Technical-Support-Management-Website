import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { OutboundRecord, OutboundItem, ReturnInfo, getInventory, updateInventory } from '../data/inventory';
import { getDevice, updateDevice } from '../data/devices';

// 数据库行映射
interface OutboundRecordRow {
  id: string;
  created_at: string;
  device_id: string;
  device_name: string;
  destination: string;
  operator: string;
  items: any;
  notes?: string;
  status: 'outbound' | 'returned';
  return_info?: any;
  original_location?: string;
  original_owner?: string;
  device_instance_id?: string;
}

// 本地内存存储（用于演示模式）
let localOutboundRecords: OutboundRecord[] = [];
let nextRecordId = 1;

/**
 * 检查设备是否已有未归还的出库记录
 */
async function checkExistingOutbound(deviceId: string): Promise<{
  hasOutbound: boolean;
  outboundDate?: string;
  destination?: string;
}> {
  try {
    if (isSupabaseConfigured) {
      // 从 Supabase 检查
      const { data, error } = await supabase
        .from('outbound_records')
        .select('created_at, destination')
        .eq('device_id', deviceId)
        .eq('status', 'outbound')
        .limit(1)
        .single();

      if (error) {
        // 如果没有找到记录，error.code 会是 'PGRST116'
        if (error.code === 'PGRST116') {
          return { hasOutbound: false };
        }
        throw error;
      }

      if (data) {
        return {
          hasOutbound: true,
          outboundDate: new Date(data.created_at).toLocaleString('zh-CN'),
          destination: data.destination
        };
      }
      return { hasOutbound: false };
    } else {
      // 从本地内存检查
      const existingRecord = localOutboundRecords.find(
        r => r.deviceId === deviceId && r.status === 'outbound'
      );
      if (existingRecord) {
        return {
          hasOutbound: true,
          outboundDate: new Date(existingRecord.date).toLocaleString('zh-CN'),
          destination: existingRecord.destination
        };
      }
      return { hasOutbound: false };
    }
  } catch (error) {
    console.error('检查出库记录失败:', error);
    // 出错时保守处理，返回 false 以免阻止正常出库
    return { hasOutbound: false };
  }
}

/**
 * 创建出库记录并更新库存
 */
export async function createOutboundRecord(
  record: Omit<OutboundRecord, 'id' | 'date' | 'status'>
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 获取设备当前位置和负责人（用于记录和后续归还）
    const device = await getDevice(record.deviceId);
    if (!device) {
      return { success: false, error: '设备不存在' };
    }
    const originalLocation = device.location;
    const originalOwner = device.owner;

    // 2. 检查该设备是否已有未归还的出库记录
    const existingOutbound = await checkExistingOutbound(record.deviceId);
    if (existingOutbound.hasOutbound) {
      return { 
        success: false, 
        error: `该设备已有未归还的出库记录（出库时间: ${existingOutbound.outboundDate}, 目的地: ${existingOutbound.destination}），请先归还后再出库` 
      };
    }

    // 3. 检查库存是否充足
    const stockCheck = await checkStock(record.items);
    if (!stockCheck.sufficient) {
      return { success: false, error: `库存不足: ${stockCheck.message}` };
    }

    // 3. 创建出库记录
    if (isSupabaseConfigured) {
      // 使用 Supabase
      const { data: outboundData, error: outboundError } = await supabase
        .from('outbound_records')
        .insert({
          device_id: record.deviceId,
          device_name: record.deviceName,
          destination: record.destination,
          operator: record.operator,
          items: record.items,
          notes: record.notes,
          status: 'outbound',
          original_location: originalLocation,
          original_owner: originalOwner,
          device_instance_id: record.deviceInstanceId || null
        })
        .select()
        .single();

      if (outboundError) throw outboundError;

      // 如果关联了打印机设备实例，自动更新其状态
      if (record.deviceInstanceId) {
        try {
          const { updatePrinterInstance } = await import('./printerInstanceService');
          await updatePrinterInstance(record.deviceInstanceId, {
            status: 'deployed',
            location: record.destination,
            deployedDate: new Date().toISOString().split('T')[0]
          });
          console.log(`✅ 已自动更新打印机实例 ${record.deviceInstanceId} 状态为外放`);
        } catch (error) {
          console.error('更新打印机实例状态失败:', error);
          // 不影响出库流程，继续执行
        }
      }

      // 创建审计日志
      await createAuditLog({
        action_type: '出库',
        entity_type: 'outbound_record',
        entity_id: outboundData.id,
        operator: record.operator,
        details: {
          deviceId: record.deviceId,
          deviceName: record.deviceName,
          destination: record.destination,
          items: record.items,
          originalLocation,
          originalOwner
        }
      });
    } else {
      // 使用本地内存存储
      const newRecord: OutboundRecord = {
        id: `local-${nextRecordId++}`,
        date: new Date().toISOString(),
        deviceId: record.deviceId,
        deviceName: record.deviceName,
        destination: record.destination,
        operator: record.operator,
        items: record.items,
        notes: record.notes,
        status: 'outbound',
        originalLocation,
        originalOwner
      };
      localOutboundRecords.push(newRecord);
      console.log('✅ 出库记录已保存到本地内存:', newRecord);
    }

    // 4. 更新设备位置和负责人
    const deviceUpdateSuccess = await updateDevice(record.deviceId, {
      location: record.destination,
      owner: record.operator
    });

    if (!deviceUpdateSuccess) {
      console.warn('⚠️ 设备信息更新失败，但出库记录已创建');
    } else {
      console.log('✅ 设备位置已更新:', originalLocation, '→', record.destination);
      console.log('✅ 设备负责人已更新为:', record.operator);
    }

    // 5. 更新库存
    await updateInventoryStock(record.items, 'decrement');

    return { success: true };
  } catch (error: any) {
    console.error('创建出库记录失败:', error);
    return { success: false, error: error.message || '创建出库记录失败' };
  }
}

/**
 * 获取所有出库记录
 */
export async function getOutboundRecords(): Promise<OutboundRecord[]> {
  try {
    if (isSupabaseConfigured) {
      // 从 Supabase 获取
      const { data, error } = await supabase
        .from('outbound_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapRowToOutboundRecord);
    } else {
      // 从本地内存获取
      return [...localOutboundRecords].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
  } catch (error) {
    console.error('获取出库记录失败:', error);
    return [];
  }
}

/**
 * 根据ID获取单个出库记录
 */
export async function getOutboundRecord(id: string): Promise<OutboundRecord | null> {
  try {
    if (isSupabaseConfigured) {
      // 从 Supabase 获取
      const { data, error } = await supabase
        .from('outbound_records')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? mapRowToOutboundRecord(data) : null;
    } else {
      // 从本地内存获取
      return localOutboundRecords.find(r => r.id === id) || null;
    }
  } catch (error) {
    console.error('获取出库记录失败:', error);
    return null;
  }
}

/**
 * 归还出库物资
 */
export async function returnOutboundItems(
  recordId: string,
  returnInfo: Omit<ReturnInfo, 'returnDate'>
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 获取原出库记录
    const record = await getOutboundRecord(recordId);
    if (!record) {
      return { success: false, error: '出库记录不存在' };
    }

    if (record.status === 'returned') {
      return { success: false, error: '该记录已归还' };
    }

    // 2. 更新出库记录状态
    if (isSupabaseConfigured) {
      // 使用 Supabase
      const { error: updateError } = await supabase
        .from('outbound_records')
        .update({
          status: 'returned',
          return_info: {
            returnDate: new Date().toISOString(),
            ...returnInfo
          }
        })
        .eq('id', recordId);

      if (updateError) throw updateError;

      // 创建审计日志
      await createAuditLog({
        action_type: '归还',
        entity_type: 'outbound_record',
        entity_id: recordId,
        operator: returnInfo.returnOperator,
        details: {
          returnedItems: returnInfo.returnedItems,
          equipmentDamage: returnInfo.equipmentDamage,
          returnNotes: returnInfo.returnNotes
        }
      });
    } else {
      // 使用本地内存存储
      const localRecord = localOutboundRecords.find(r => r.id === recordId);
      if (localRecord) {
        localRecord.status = 'returned';
        localRecord.returnInfo = {
          returnDate: new Date().toISOString(),
          ...returnInfo
        };
        console.log('✅ 归还记录已更新到本地内存:', localRecord);
      }
    }

    // 3. 恢复设备位置和负责人
    const updates: any = {};
    if (record.originalLocation) {
      updates.location = record.originalLocation;
    }
    // 归还时将负责人设为"公司"（如果原负责人为空）或恢复原负责人
    updates.owner = record.originalOwner || '公司';

    const deviceUpdateSuccess = await updateDevice(record.deviceId, updates);

    if (!deviceUpdateSuccess) {
      console.warn('⚠️ 设备信息恢复失败');
    } else {
      if (record.originalLocation) {
        console.log('✅ 设备位置已恢复:', record.destination, '→', record.originalLocation);
      }
      console.log('✅ 设备负责人已恢复为:', updates.owner);
    }

    // 3.5. 如果关联了打印机设备实例，自动恢复其状态
    if (record.deviceInstanceId) {
      try {
        const { updatePrinterInstance } = await import('./printerInstanceService');
        await updatePrinterInstance(record.deviceInstanceId, {
          status: 'in-house',
          location: record.originalLocation || '展厅/调试间',
          deployedDate: null
        });
        console.log(`✅ 已自动恢复打印机实例 ${record.deviceInstanceId} 状态为在库`);
      } catch (error) {
        console.error('恢复打印机实例状态失败:', error);
        // 不影响归还流程，继续执行
      }
    }

    // 4. 归还库存
    await updateInventoryStock(returnInfo.returnedItems, 'increment');

    return { success: true };
  } catch (error: any) {
    console.error('归还失败:', error);
    return { success: false, error: error.message || '归还失败' };
  }
}

/**
 * 删除出库记录
 */
export async function deleteOutboundRecord(recordId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (isSupabaseConfigured) {
      const { error, data } = await supabase
        .from('outbound_records')
        .delete()
        .eq('id', recordId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('未能删除出库记录，可能是权限限制');
      }
    } else {
      localOutboundRecords = localOutboundRecords.filter(record => record.id !== recordId);
    }

    return { success: true };
  } catch (error: any) {
    console.error('删除出库记录失败:', error);
    return { success: false, error: error.message || '删除出库记录失败' };
  }
}

/**
 * 检查库存是否充足
 */
async function checkStock(items: OutboundItem): Promise<{ sufficient: boolean; message?: string }> {
  try {
    // 获取当前库存（从本地数据）
    const inventory = await getInventory();

    if (!inventory) {
      return { sufficient: false, message: '无法获取库存信息' };
    }

    // 检查相纸库存
    if (items.printerModel && items.paperType && items.paperQuantity) {
      const paperStock = inventory.paperStock?.[items.printerModel]?.[items.paperType] || 0;
      if (paperStock < items.paperQuantity) {
        return {
          sufficient: false,
          message: `${items.printerModel} ${items.paperType} 库存不足 (需要: ${items.paperQuantity}, 可用: ${paperStock})`
        };
      }
    }

    // 检查墨水库存
    if (items.inkC || items.inkM || items.inkY || items.inkK) {
      const inkStock = inventory.epsonInkStock || {};
      if (items.inkC && (inkStock.C || 0) < items.inkC) {
        return { sufficient: false, message: `墨水C库存不足 (需要: ${items.inkC}, 可用: ${inkStock.C || 0})` };
      }
      if (items.inkM && (inkStock.M || 0) < items.inkM) {
        return { sufficient: false, message: `墨水M库存不足 (需要: ${items.inkM}, 可用: ${inkStock.M || 0})` };
      }
      if (items.inkY && (inkStock.Y || 0) < items.inkY) {
        return { sufficient: false, message: `墨水Y库存不足 (需要: ${items.inkY}, 可用: ${inkStock.Y || 0})` };
      }
      if (items.inkK && (inkStock.K || 0) < items.inkK) {
        return { sufficient: false, message: `墨水K库存不足 (需要: ${items.inkK}, 可用: ${inkStock.K || 0})` };
      }
    }

    // 检查设备库存
    const equipmentStock = inventory.equipmentStock || {};
    if (items.routers && (equipmentStock.routers || 0) < items.routers) {
      return { sufficient: false, message: `路由器库存不足 (需要: ${items.routers}, 可用: ${equipmentStock.routers || 0})` };
    }
    if (items.powerStrips && (equipmentStock.powerStrips || 0) < items.powerStrips) {
      return { sufficient: false, message: `插板库存不足 (需要: ${items.powerStrips}, 可用: ${equipmentStock.powerStrips || 0})` };
    }
    if (items.usbCables && (equipmentStock.usbCables || 0) < items.usbCables) {
      return { sufficient: false, message: `USB线库存不足 (需要: ${items.usbCables}, 可用: ${equipmentStock.usbCables || 0})` };
    }
    if (items.networkCables && (equipmentStock.networkCables || 0) < items.networkCables) {
      return { sufficient: false, message: `网线库存不足 (需要: ${items.networkCables}, 可用: ${equipmentStock.networkCables || 0})` };
    }
    if (items.adapters && (equipmentStock.adapters || 0) < items.adapters) {
      return { sufficient: false, message: `电源适配器库存不足 (需要: ${items.adapters}, 可用: ${equipmentStock.adapters || 0})` };
    }

    return { sufficient: true };
  } catch (error) {
    console.error('检查库存失败:', error);
    return { sufficient: false, message: '检查库存失败: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

/**
 * 更新库存（使用本地数据）
 */
async function updateInventoryStock(items: OutboundItem, operation: 'increment' | 'decrement'): Promise<void> {
  try {
    const inventory = await getInventory();
    if (!inventory) {
      throw new Error('无法获取库存信息');
    }

    const multiplier = operation === 'increment' ? 1 : -1;
    const updatedInventory = { ...inventory };

    // 更新相纸库存
    if (items.printerModel && items.paperType && items.paperQuantity) {
      if (!updatedInventory.paperStock[items.printerModel]) {
        updatedInventory.paperStock[items.printerModel] = {} as any;
      }
      const currentStock = updatedInventory.paperStock[items.printerModel][items.paperType] || 0;
      updatedInventory.paperStock[items.printerModel][items.paperType] =
        currentStock + (items.paperQuantity * multiplier);
    }

    // 更新墨水库存
    if (items.inkC) {
      updatedInventory.epsonInkStock.C = (updatedInventory.epsonInkStock.C || 0) + (items.inkC * multiplier);
    }
    if (items.inkM) {
      updatedInventory.epsonInkStock.M = (updatedInventory.epsonInkStock.M || 0) + (items.inkM * multiplier);
    }
    if (items.inkY) {
      updatedInventory.epsonInkStock.Y = (updatedInventory.epsonInkStock.Y || 0) + (items.inkY * multiplier);
    }
    if (items.inkK) {
      updatedInventory.epsonInkStock.K = (updatedInventory.epsonInkStock.K || 0) + (items.inkK * multiplier);
    }

    // 更新设备库存
    if (items.routers) {
      updatedInventory.equipmentStock.routers = (updatedInventory.equipmentStock.routers || 0) + (items.routers * multiplier);
    }
    if (items.powerStrips) {
      updatedInventory.equipmentStock.powerStrips = (updatedInventory.equipmentStock.powerStrips || 0) + (items.powerStrips * multiplier);
    }
    if (items.usbCables) {
      updatedInventory.equipmentStock.usbCables = (updatedInventory.equipmentStock.usbCables || 0) + (items.usbCables * multiplier);
    }
    if (items.networkCables) {
      updatedInventory.equipmentStock.networkCables = (updatedInventory.equipmentStock.networkCables || 0) + (items.networkCables * multiplier);
    }
    if (items.adapters) {
      updatedInventory.equipmentStock.adapters = (updatedInventory.equipmentStock.adapters || 0) + (items.adapters * multiplier);
    }

    // 更新最后更新时间
    updatedInventory.lastUpdated = new Date().toISOString().split('T')[0];

    // 保存更新后的库存
    await updateInventory(updatedInventory);
  } catch (error) {
    console.error('更新库存失败:', error);
    throw error;
  }
}

/**
 * 创建审计日志
 */
async function createAuditLog(log: {
  action_type: string;
  entity_type: string;
  entity_id: string;
  operator: string;
  details: any;
}): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      action_type: log.action_type,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      operator: log.operator,
      details: log.details,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('创建审计日志失败:', error);
    // 审计日志失败不应阻止主流程
  }
}

/**
 * 映射数据库行到 OutboundRecord 对象
 */
function mapRowToOutboundRecord(row: OutboundRecordRow): OutboundRecord {
  return {
    id: row.id,
    date: row.created_at,
    deviceId: row.device_id,
    deviceName: row.device_name,
    destination: row.destination,
    operator: row.operator,
    items: row.items || {},
    notes: row.notes,
    status: row.status,
    returnInfo: row.return_info,
    originalLocation: row.original_location,
    originalOwner: row.original_owner,
    deviceInstanceId: row.device_instance_id
  };
}
