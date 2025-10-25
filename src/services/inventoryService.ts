import { supabase } from '../lib/supabase';
import { Inventory } from '../data/inventory';

// 数据库行接口
interface InventoryRow {
  id: string;
  created_at: string;
  updated_at: string;
  location: string;
  last_updated: string;
  notes?: string;
  paper_stock: any;
  epson_ink_stock: any;
  equipment_stock: any;
}

/**
 * 从数据库获取库存信息
 */
export async function fetchInventory(): Promise<Inventory | null> {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('获取库存失败:', error);
      return null;
    }

    if (!data) return null;

    return mapRowToInventory(data);
  } catch (error) {
    console.error('获取库存异常:', error);
    return null;
  }
}

/**
 * 更新库存到数据库
 */
export async function updateInventoryData(inventory: Partial<Inventory>): Promise<boolean> {
  try {
    // 先获取当前库存记录
    const { data: existingData, error: fetchError } = await supabase
      .from('inventory')
      .select('id')
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const updateData: any = {};

    if (inventory.location !== undefined) updateData.location = inventory.location;
    if (inventory.notes !== undefined) updateData.notes = inventory.notes;
    if (inventory.paperStock !== undefined) updateData.paper_stock = inventory.paperStock;
    if (inventory.epsonInkStock !== undefined) updateData.epson_ink_stock = inventory.epsonInkStock;
    if (inventory.equipmentStock !== undefined) updateData.equipment_stock = inventory.equipmentStock;
    if (inventory.lastUpdated !== undefined) {
      updateData.last_updated = inventory.lastUpdated;
    } else {
      updateData.last_updated = new Date().toISOString();
    }

    if (existingData) {
      // 更新现有记录
      const { error: updateError } = await supabase
        .from('inventory')
        .update(updateData)
        .eq('id', existingData.id);

      if (updateError) throw updateError;
    } else {
      // 插入新记录
      const { error: insertError } = await supabase
        .from('inventory')
        .insert({
          location: inventory.location || '杭州调试间',
          paper_stock: inventory.paperStock || {},
          epson_ink_stock: inventory.epsonInkStock || {},
          equipment_stock: inventory.equipmentStock || {},
          last_updated: updateData.last_updated,
          notes: inventory.notes
        });

      if (insertError) throw insertError;
    }

    console.log('✅ 库存已更新到数据库');
    return true;
  } catch (error) {
    console.error('更新库存失败:', error);
    return false;
  }
}

/**
 * 映射数据库行到 Inventory 对象
 */
function mapRowToInventory(row: InventoryRow): Inventory {
  return {
    location: row.location,
    lastUpdated: typeof row.last_updated === 'string'
      ? row.last_updated.split('T')[0]
      : new Date(row.last_updated).toISOString().split('T')[0],
    paperStock: row.paper_stock || {},
    epsonInkStock: row.epson_ink_stock || {},
    equipmentStock: row.equipment_stock || {},
    notes: row.notes
  };
}
