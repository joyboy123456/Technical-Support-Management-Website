import { supabase } from '../lib/supabase';
import { Device } from '../data/devices';

// 将数据库行转换为 Device 对象
function mapRowToDevice(row: any, logs: any[] = [], issues: any[] = []): Device {
  return {
    id: row.id,
    name: row.name,
    model: row.model,
    serial: row.serial,
    printerModel: row.printer_model_field || row.printer_model || '',
    location: row.location,
    owner: row.owner,
    status: row.status,
    coverImage: row.cover_image,
    images: row.images ? (Array.isArray(row.images) ? row.images : JSON.parse(row.images || '[]')) : [],
    printer: {
      model: row.printer_model,
      paper: row.printer_paper,
      connect: row.printer_connect,
      paperStock: row.printer_paper_stock,
      ink: {
        C: row.printer_ink_c,
        M: row.printer_ink_m,
        Y: row.printer_ink_y,
        K: row.printer_ink_k,
      },
    },
    nextMaintenance: row.next_maintenance,
    logs: logs.map(log => ({
      date: log.date,
      type: log.type,
      note: log.note,
      executor: log.executor,
    })),
    issues: issues.map(issue => ({
      date: issue.date,
      desc: issue.description,
      status: issue.status,
    })),
  };
}

// 将 Device 对象转换为数据库行
function mapDeviceToRow(device: Partial<Device>) {
  const row: any = {};
  
  if (device.name !== undefined) row.name = device.name;
  if (device.model !== undefined) row.model = device.model;
  if (device.serial !== undefined) row.serial = device.serial;
  if (device.printerModel !== undefined) row.printer_model_field = device.printerModel;
  if (device.location !== undefined) row.location = device.location;
  if (device.owner !== undefined) row.owner = device.owner;
  if (device.status !== undefined) row.status = device.status;
  if (device.coverImage !== undefined) row.cover_image = device.coverImage;
  if (device.images !== undefined) row.images = JSON.stringify(device.images);
  if (device.nextMaintenance !== undefined) row.next_maintenance = device.nextMaintenance;
  
  if (device.printer) {
    if (device.printer.model !== undefined) row.printer_model = device.printer.model;
    if (device.printer.paper !== undefined) row.printer_paper = device.printer.paper;
    if (device.printer.connect !== undefined) row.printer_connect = device.printer.connect;
    if (device.printer.paperStock !== undefined) row.printer_paper_stock = device.printer.paperStock;
    if (device.printer.ink) {
      if (device.printer.ink.C !== undefined) row.printer_ink_c = device.printer.ink.C;
      if (device.printer.ink.M !== undefined) row.printer_ink_m = device.printer.ink.M;
      if (device.printer.ink.Y !== undefined) row.printer_ink_y = device.printer.ink.Y;
      if (device.printer.ink.K !== undefined) row.printer_ink_k = device.printer.ink.K;
    }
  }
  
  row.updated_at = new Date().toISOString();
  
  return row;
}

// 获取所有设备
export async function fetchDevices(): Promise<Device[]> {
  try {
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('*')
      .order('name');

    if (devicesError) throw devicesError;
    if (!devices) return [];

    // 获取所有维护日志
    const { data: logs } = await supabase
      .from('maintenance_logs')
      .select('*')
      .order('date', { ascending: false });

    // 获取所有故障记录
    const { data: issues } = await supabase
      .from('issues')
      .select('*')
      .order('date', { ascending: false });

    // 组合数据
    return devices.map(device => {
      const deviceLogs = logs?.filter(log => log.device_id === device.id) || [];
      const deviceIssues = issues?.filter(issue => issue.device_id === device.id) || [];
      return mapRowToDevice(device, deviceLogs, deviceIssues);
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return [];
  }
}

// 获取单个设备
export async function fetchDevice(deviceId: string): Promise<Device | null> {
  try {
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .single();

    if (deviceError) throw deviceError;
    if (!device) return null;

    // 获取维护日志
    const { data: logs } = await supabase
      .from('maintenance_logs')
      .select('*')
      .eq('device_id', deviceId)
      .order('date', { ascending: false });

    // 获取故障记录
    const { data: issues } = await supabase
      .from('issues')
      .select('*')
      .eq('device_id', deviceId)
      .order('date', { ascending: false });

    return mapRowToDevice(device, logs || [], issues || []);
  } catch (error) {
    console.error('Error fetching device:', error);
    return null;
  }
}

// 更新设备信息
export async function updateDeviceData(deviceId: string, updates: Partial<Device>): Promise<boolean> {
  try {
    const row = mapDeviceToRow(updates);
    
    const { error } = await supabase
      .from('devices')
      .update(row)
      .eq('id', deviceId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating device:', error);
    return false;
  }
}

// 添加维护记录
export async function addMaintenanceLogData(
  deviceId: string,
  log: {
    date: string;
    type: '维护' | '故障' | '耗材' | '其他';
    note: string;
    executor?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('maintenance_logs')
      .insert({
        device_id: deviceId,
        date: log.date,
        type: log.type,
        note: log.note,
        executor: log.executor || null,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding maintenance log:', error);
    return false;
  }
}

// 创建新设备
export async function createDevice(device: Omit<Device, 'logs' | 'issues'>): Promise<string | null> {
  try {
    const row = {
      id: device.id,
      name: device.name,
      model: device.model,
      serial: device.serial,
      printer_model_field: device.printerModel,
      location: device.location,
      owner: device.owner,
      status: device.status,
      cover_image: device.coverImage,
      images: JSON.stringify(device.images || []),
      printer_model: device.printer.model,
      printer_paper: device.printer.paper,
      printer_connect: device.printer.connect,
      printer_paper_stock: device.printer.paperStock,
      printer_ink_c: device.printer.ink.C,
      printer_ink_m: device.printer.ink.M,
      printer_ink_y: device.printer.ink.Y,
      printer_ink_k: device.printer.ink.K,
      next_maintenance: device.nextMaintenance,
    };

    const { data, error } = await supabase
      .from('devices')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Error creating device:', error);
    return null;
  }
}

export async function deleteDeviceData(deviceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', deviceId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting device:', error);
    return false;
  }
}
