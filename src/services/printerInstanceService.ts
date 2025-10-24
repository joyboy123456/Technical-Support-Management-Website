import { supabase } from '../lib/supabase';
import { PrinterInstance } from '../data/inventory';

/**
 * 获取所有打印机设备实例
 */
export async function fetchPrinterInstances(): Promise<PrinterInstance[]> {
  try {
    const { data, error } = await supabase
      .from('printer_instances')
      .select('*')
      .order('printer_model')
      .order('id');

    if (error) throw error;
    if (!data) return [];

    return data.map(row => ({
      id: row.id,
      printerModel: row.printer_model,
      serialNumber: row.serial_number || undefined,
      status: row.status as PrinterInstance['status'],
      location: row.location,
      deployedDate: row.deployed_date || undefined,
      notes: row.notes || undefined,
    }));
  } catch (error) {
    console.error('获取打印机实例失败:', error);
    return [];
  }
}

/**
 * 获取指定型号的打印机设备实例
 */
export async function fetchPrinterInstancesByModel(printerModel: string): Promise<PrinterInstance[]> {
  try {
    const { data, error } = await supabase
      .from('printer_instances')
      .select('*')
      .eq('printer_model', printerModel)
      .order('id');

    if (error) throw error;
    if (!data) return [];

    return data.map(row => ({
      id: row.id,
      printerModel: row.printer_model,
      serialNumber: row.serial_number || undefined,
      status: row.status as PrinterInstance['status'],
      location: row.location,
      deployedDate: row.deployed_date || undefined,
      notes: row.notes || undefined,
    }));
  } catch (error) {
    console.error('获取打印机实例失败:', error);
    return [];
  }
}

/**
 * 创建打印机设备实例
 */
export async function createPrinterInstance(instance: PrinterInstance): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('printer_instances')
      .insert({
        id: instance.id,
        printer_model: instance.printerModel,
        serial_number: instance.serialNumber || null,
        status: instance.status,
        location: instance.location,
        deployed_date: instance.deployedDate || null,
        notes: instance.notes || null,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('创建打印机实例失败:', error);
    return false;
  }
}

/**
 * 更新打印机设备实例
 */
export async function updatePrinterInstance(id: string, updates: Partial<PrinterInstance>): Promise<boolean> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.printerModel !== undefined) updateData.printer_model = updates.printerModel;
    if (updates.serialNumber !== undefined) updateData.serial_number = updates.serialNumber || null;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.deployedDate !== undefined) updateData.deployed_date = updates.deployedDate || null;
    if (updates.notes !== undefined) updateData.notes = updates.notes || null;

    const { error } = await supabase
      .from('printer_instances')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('更新打印机实例失败:', error);
    return false;
  }
}

/**
 * 删除打印机设备实例
 */
export async function deletePrinterInstance(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('printer_instances')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('删除打印机实例失败:', error);
    return false;
  }
}
