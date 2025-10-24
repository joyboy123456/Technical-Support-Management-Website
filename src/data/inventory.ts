// 调试间耗材库存数据
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchInventory, updateInventoryData } from '../services/inventoryService';

// 打印机型号类型（支持任意字符串，兼容数据库中的动态型号）
export type PrinterModel = string;

// 打印机设备实例
export interface PrinterInstance {
  id: string;              // 设备编号
  printerModel: PrinterModel; // 所属型号
  serialNumber?: string;   // 序列号（可选）
  status: 'in-house' | 'deployed' | 'idle';  // 在库/外放/闲置
  location: string;        // 当前位置或去向
  deployedDate?: string;   // 外放日期
  notes?: string;          // 备注
}

// EPSON 打印机墨水库存
export interface EPSONInkStock {
  C: number;  // 青色墨水（瓶数）
  M: number;  // 品红墨水（瓶数）
  Y: number;  // 黄色墨水（瓶数）
  K: number;  // 黑色墨水（瓶数）
}

// 按打印机型号分类的相纸库存（动态结构，支持任意打印机型号和相纸类型）
export interface PrinterPaperStock {
  [printerModel: string]: {
    [paperType: string]: number;
  };
}

export interface EquipmentStock {
  routers: number;          // 路由器数量
  powerStrips: number;      // 插板数量
  usbCables: number;        // USB线数量
  networkCables: number;    // 网线数量
  adapters: number;         // 电源适配器数量
}

export interface Inventory {
  location: string;                    // 位置/调试间名称
  lastUpdated: string;                 // 最后更新时间
  paperStock: PrinterPaperStock;       // 按打印机分类的相纸库存
  epsonInkStock: EPSONInkStock;        // EPSON 墨水库存（通用）
  equipmentStock: EquipmentStock;      // 设备配件库存
  notes?: string;                      // 备注
}

const defaultInventory: Inventory = {
  location: '杭州调试间',
  lastUpdated: new Date().toISOString().split('T')[0],
  paperStock: {
    'EPSON-L18058': {
      A3: 280
    },
    'EPSON-L8058': {
      A4: 450
    },
    'DNP-微印创': {
      '6寸': 300,
      '8寸': 200
    },
    'DNP-自购': {
      '6寸': 250,
      '8寸': 180
    },
    'DNP-锦联': {
      '6寸': 320,
      '8寸': 220
    }
  },
  epsonInkStock: {
    C: 8,
    M: 6,
    Y: 7,
    K: 12
  },
  equipmentStock: {
    routers: 15,
    powerStrips: 20,
    usbCables: 25,
    networkCables: 30,
    adapters: 18
  },
  notes: '库存充足，定期检查有效期'
};

// 全局库存状态（实际项目中应该从数据库读取）
let inventoryData: Inventory = { ...defaultInventory };

// 全局缓存打印机实例
let printerInstancesCache: PrinterInstance[] = [];

/**
 * 获取指定型号的设备实例列表（从数据库）
 */
export const getPrinterInstances = async (printerModel: PrinterModel): Promise<PrinterInstance[]> => {
  if (!isSupabaseConfigured) {
    // 降级：返回空数组（或者从本地存储读取）
    console.warn('Supabase 未配置，无法获取设备实例');
    return [];
  }

  try {
    const { fetchPrinterInstancesByModel } = await import('../services/printerInstanceService');
    return await fetchPrinterInstancesByModel(printerModel);
  } catch (error) {
    console.error('获取打印机实例失败:', error);
    return [];
  }
};

/**
 * 获取所有设备实例（用于缓存和统计）
 */
export const getAllPrinterInstances = async (): Promise<PrinterInstance[]> => {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { fetchPrinterInstances } = await import('../services/printerInstanceService');
    const instances = await fetchPrinterInstances();
    printerInstancesCache = instances;
    return instances;
  } catch (error) {
    console.error('获取所有打印机实例失败:', error);
    return [];
  }
};

/**
 * 获取调试间库存信息
 */
export const getInventory = async (): Promise<Inventory> => {
  // 如果 Supabase 已配置，从数据库获取
  if (isSupabaseConfigured) {
    const dbInventory = await fetchInventory();
    if (dbInventory) {
      // 更新内存数据为数据库数据
      inventoryData = { ...dbInventory };
      return dbInventory;
    }
  }

  // 降级：从内存获取
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...inventoryData });
    }, 100);
  });
};

/**
 * 更新库存信息
 */
export const updateInventory = async (updates: Partial<Inventory>): Promise<boolean> => {
  try {
    // 更新内存数据
    inventoryData = {
      ...inventoryData,
      ...updates,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    // 如果 Supabase 已配置,持久化到数据库
    if (isSupabaseConfigured) {
      const success = await updateInventoryData(inventoryData);
      if (success) {
        console.log('✅ 库存已更新并保存到数据库:', inventoryData);
      } else {
        console.warn('⚠️ 库存已更新到内存，但数据库保存失败');
      }
      return success;
    }

    // 降级：仅更新内存
    console.log('库存已更新（仅内存）:', inventoryData);
    return true;
  } catch (error) {
    console.error('更新库存失败:', error);
    return false;
  }
};

/**
 * 更新特定打印机的相纸库存
 */
export const updatePrinterPaperStock = async (
  printerModel: PrinterModel,
  paperType: string,
  quantity: number
): Promise<boolean> => {
  try {
    // @ts-ignore - 动态访问
    if (inventoryData.paperStock[printerModel] && inventoryData.paperStock[printerModel][paperType] !== undefined) {
      // @ts-ignore
      inventoryData.paperStock[printerModel][paperType] = quantity;
      inventoryData.lastUpdated = new Date().toISOString().split('T')[0];
      return true;
    }
    return false;
  } catch (error) {
    console.error('更新相纸库存失败:', error);
    return false;
  }
};

/**
 * 更新 EPSON 墨水库存
 */
export const updateEpsonInkStock = async (inkColor: keyof EPSONInkStock, quantity: number): Promise<boolean> => {
  try {
    inventoryData.epsonInkStock[inkColor] = quantity;
    inventoryData.lastUpdated = new Date().toISOString().split('T')[0];
    return true;
  } catch (error) {
    console.error('更新墨水库存失败:', error);
    return false;
  }
};

/**
 * 获取特定打印机型号的相纸库存
 */
export const getPrinterPaperStock = (inventory: Inventory, printerModel: PrinterModel) => {
  return inventory.paperStock[printerModel];
};

/**
 * 获取打印机型号显示名称
 */
export const getPrinterDisplayName = (model: PrinterModel): string => {
  const displayNames: Record<string, string> = {
    'DNP-锦联': 'DNP DS-RX1HS (锦联)',
    'DNP-微印创': 'DNP DS-RX1HS (微印创)',
    'DNP-自购': 'DNP DS-RX1HS (自购)',
    'EPSON-L8058': 'EPSON L8058 (A4)',
    'EPSON-L18058': 'EPSON L18058 (A3)',
    '西铁城CX-02': '西铁城 CX-02',
    'HITI诚研P525L': 'HITI 诚研 P525L'
  };
  
  return displayNames[model] || model;
};

/**
 * 解析打印机型号信息（品牌、型号、变体）
 */
export interface PrinterInfo {
  brand: string;       // 品牌：DNP、EPSON、西铁城、HITI
  model: string;       // 型号：DS-RX1HS、L8058、L18058、CX-02、P525L
  variant: string;     // 变体：自购、锦联、微印创、A4、A3 等
  rawModel: string;    // 原始型号字符串
  displayName: string; // 显示名称
}

export const parsePrinterModel = (model: PrinterModel): PrinterInfo => {
  const displayName = getPrinterDisplayName(model);
  
  // 从显示名称中提取品牌、型号、变体
  // 格式：品牌 型号 (变体)
  const match = displayName.match(/^([^\s]+)\s+([^\(]+?)(?:\s*\(([^\)]+)\))?$/);
  
  if (match) {
    const [, brand, modelPart, variant] = match;
    return {
      brand: brand.trim(),
      model: modelPart.trim(),
      variant: variant?.trim() || '',
      rawModel: model,
      displayName
    };
  }
  
  // 降级处理：如果解析失败，从原始型号推断
  const parts = model.split('-');
  return {
    brand: parts[0] || model,
    model: model,
    variant: parts.slice(1).join('-'),
    rawModel: model,
    displayName
  };
};

/**
 * 三级排序：品牌 → 型号 → 变体
 */
export const sortPrinterModels = (models: PrinterModel[]): PrinterModel[] => {
  return models.sort((a, b) => {
    const infoA = parsePrinterModel(a);
    const infoB = parsePrinterModel(b);
    
    // 第一级：按品牌排序
    if (infoA.brand !== infoB.brand) {
      // 定义品牌优先级
      const brandOrder = ['DNP', 'EPSON', '西铁城', 'HITI'];
      const indexA = brandOrder.indexOf(infoA.brand);
      const indexB = brandOrder.indexOf(infoB.brand);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return infoA.brand.localeCompare(infoB.brand, 'zh-CN');
    }
    
    // 第二级：按型号排序
    if (infoA.model !== infoB.model) {
      // EPSON 型号特殊处理：L8058 → L18058
      if (infoA.brand === 'EPSON') {
        const modelOrder = ['L8058', 'L18058'];
        const indexA = modelOrder.indexOf(infoA.model);
        const indexB = modelOrder.indexOf(infoB.model);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      }
      
      return infoA.model.localeCompare(infoB.model, 'zh-CN');
    }
    
    // 第三级：按变体排序
    if (infoA.variant !== infoB.variant) {
      // DNP 变体排序：自购 → 锦联 → 微印创
      if (infoA.brand === 'DNP') {
        const variantOrder = ['自购', '锦联', '微印创'];
        const indexA = variantOrder.indexOf(infoA.variant);
        const indexB = variantOrder.indexOf(infoB.variant);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
      }
      
      // EPSON 变体排序：L8058 (A4) → L18058 (A3)
      if (infoA.brand === 'EPSON') {
        const variantOrder = ['A4', 'A3'];
        const indexA = variantOrder.indexOf(infoA.variant);
        const indexB = variantOrder.indexOf(infoB.variant);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      }
      
      return infoA.variant.localeCompare(infoB.variant, 'zh-CN');
    }
    
    return 0;
  });
};

/**
 * 判断打印机是否是 EPSON 系列（需要墨水）
 */
export const isEpsonPrinter = (model: string): boolean => {
  return model.startsWith('EPSON');
};

/**
 * 检查库存是否充足
 */
export const checkStockLevel = (inventory: Inventory, printerModel?: PrinterModel): {
  paperLow: boolean;
  inkLow: boolean;
  details: string[];
} => {
  const details: string[] = [];
  let paperLow = false;
  let inkLow = false;

  // 如果指定了打印机型号，只检查该型号的相纸
  if (printerModel) {
    const stock = inventory.paperStock[printerModel];
    if (stock && typeof stock === 'object') {
      Object.entries(stock).forEach(([type, quantity]) => {
        if (quantity < 100) {
          paperLow = true;
          details.push(`${getPrinterDisplayName(printerModel)} ${type}相纸库存不足 (${quantity}张)`);
        }
      });
    }
  } else {
    // 检查所有打印机的相纸库存
    Object.entries(inventory.paperStock).forEach(([model, stock]) => {
      Object.entries(stock).forEach(([type, quantity]) => {
        if (quantity < 100) {
          paperLow = true;
          details.push(`${getPrinterDisplayName(model as PrinterModel)} ${type}相纸库存不足 (${quantity}张)`);
        }
      });
    });
  }

  // 检查 EPSON 墨水库存（低于3瓶提醒）
  if (!printerModel || isEpsonPrinter(printerModel)) {
    Object.entries(inventory.epsonInkStock).forEach(([color, quantity]) => {
      if (quantity < 3) {
        inkLow = true;
        const colorName = color === 'C' ? '青色' : color === 'M' ? '品红' : color === 'Y' ? '黄色' : '黑色';
        details.push(`EPSON ${colorName}墨水库存不足 (${quantity}瓶)`);
      }
    });
  }

  return { paperLow, inkLow, details };
};

export interface OutboundItem {
  printerModel?: PrinterModel;
  paperType?: string;
  paperQuantity?: number;
  inkC?: number;
  inkM?: number;
  inkY?: number;
  inkK?: number;
  routers?: number;
  powerStrips?: number;
  usbCables?: number;
  networkCables?: number;
  adapters?: number;
}

export interface ReturnInfo {
  returnDate: string;
  returnOperator: string;
  returnedItems: OutboundItem;
  equipmentDamage?: string;
  returnNotes?: string;
}

export interface OutboundRecord {
  id: string;
  date: string;
  deviceId: string;
  deviceName: string;
  destination: string;
  operator: string;
  items: OutboundItem;
  notes?: string;
  status: 'outbound' | 'returned';
  returnInfo?: ReturnInfo;
  originalLocation?: string; // 记录原始位置，用于归还时恢复
  originalOwner?: string; // 记录原负责人，用于归还时恢复
  deviceInstanceId?: string; // 关联的打印机设备实例ID（可选）
}

let outboundRecords: OutboundRecord[] = [];

export const createOutboundRecord = async (record: Omit<OutboundRecord, 'id' | 'date' | 'status'>): Promise<boolean> => {
  try {
    const newRecord: OutboundRecord = {
      id: `out-${Date.now()}`,
      date: new Date().toISOString(),
      status: 'outbound',
      ...record
    };

    const items = record.items;

    if (items.paperType && items.paperQuantity && items.printerModel) {
      const currentStock = inventoryData.paperStock[items.printerModel][items.paperType];
      if (currentStock < items.paperQuantity) {
        console.error('相纸库存不足');
        return false;
      }
      inventoryData.paperStock[items.printerModel][items.paperType] = currentStock - items.paperQuantity;
    }

    if (items.inkC || items.inkM || items.inkY || items.inkK) {
      if (items.inkC && inventoryData.epsonInkStock.C >= items.inkC) {
        inventoryData.epsonInkStock.C -= items.inkC;
      }
      if (items.inkM && inventoryData.epsonInkStock.M >= items.inkM) {
        inventoryData.epsonInkStock.M -= items.inkM;
      }
      if (items.inkY && inventoryData.epsonInkStock.Y >= items.inkY) {
        inventoryData.epsonInkStock.Y -= items.inkY;
      }
      if (items.inkK && inventoryData.epsonInkStock.K >= items.inkK) {
        inventoryData.epsonInkStock.K -= items.inkK;
      }
    }

    if (items.routers && inventoryData.equipmentStock.routers >= items.routers) {
      inventoryData.equipmentStock.routers -= items.routers;
    }
    if (items.powerStrips && inventoryData.equipmentStock.powerStrips >= items.powerStrips) {
      inventoryData.equipmentStock.powerStrips -= items.powerStrips;
    }
    if (items.usbCables && inventoryData.equipmentStock.usbCables >= items.usbCables) {
      inventoryData.equipmentStock.usbCables -= items.usbCables;
    }
    if (items.networkCables && inventoryData.equipmentStock.networkCables >= items.networkCables) {
      inventoryData.equipmentStock.networkCables -= items.networkCables;
    }
    if (items.adapters && inventoryData.equipmentStock.adapters >= items.adapters) {
      inventoryData.equipmentStock.adapters -= items.adapters;
    }

    inventoryData.lastUpdated = new Date().toISOString().split('T')[0];
    outboundRecords.push(newRecord);

    console.log('出库记录已创建:', newRecord);
    console.log('当前库存:', inventoryData);

    return true;
  } catch (error) {
    console.error('创建出库记录失败:', error);
    return false;
  }
};

export const getOutboundRecords = async (): Promise<OutboundRecord[]> => {
  return [...outboundRecords];
};

export const returnOutboundItems = async (
  recordId: string,
  returnInfo: Omit<ReturnInfo, 'returnDate'>
): Promise<boolean> => {
  try {
    const recordIndex = outboundRecords.findIndex(r => r.id === recordId);
    if (recordIndex === -1) {
      console.error('出库记录不存在');
      return false;
    }

    const record = outboundRecords[recordIndex];
    if (record.status === 'returned') {
      console.error('该记录已归还');
      return false;
    }

    const returnedItems = returnInfo.returnedItems;

    if (returnedItems.paperType && returnedItems.paperQuantity && returnedItems.printerModel) {
      inventoryData.paperStock[returnedItems.printerModel][returnedItems.paperType] += returnedItems.paperQuantity;
    }

    if (returnedItems.inkC) inventoryData.epsonInkStock.C += returnedItems.inkC;
    if (returnedItems.inkM) inventoryData.epsonInkStock.M += returnedItems.inkM;
    if (returnedItems.inkY) inventoryData.epsonInkStock.Y += returnedItems.inkY;
    if (returnedItems.inkK) inventoryData.epsonInkStock.K += returnedItems.inkK;

    if (returnedItems.routers) inventoryData.equipmentStock.routers += returnedItems.routers;
    if (returnedItems.powerStrips) inventoryData.equipmentStock.powerStrips += returnedItems.powerStrips;
    if (returnedItems.usbCables) inventoryData.equipmentStock.usbCables += returnedItems.usbCables;
    if (returnedItems.networkCables) inventoryData.equipmentStock.networkCables += returnedItems.networkCables;
    if (returnedItems.adapters) inventoryData.equipmentStock.adapters += returnedItems.adapters;

    outboundRecords[recordIndex].status = 'returned';
    outboundRecords[recordIndex].returnInfo = {
      returnDate: new Date().toISOString(),
      ...returnInfo
    };

    inventoryData.lastUpdated = new Date().toISOString().split('T')[0];

    console.log('归还记录已创建:', outboundRecords[recordIndex]);
    console.log('当前库存:', inventoryData);

    return true;
  } catch (error) {
    console.error('创建归还记录失败:', error);
    return false;
  }
};
