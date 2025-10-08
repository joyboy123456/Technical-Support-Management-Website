// 调试间耗材库存数据

// 打印机型号枚举
export type PrinterModel = 
  | 'EPSON-L18058'  // A3
  | 'EPSON-L8058'   // A4
  | 'DNP-微印创'
  | 'DNP-自购'
  | 'DNP-锦联';

// EPSON 打印机墨水库存
export interface EPSONInkStock {
  C: number;  // 青色墨水（瓶数）
  M: number;  // 品红墨水（瓶数）
  Y: number;  // 黄色墨水（瓶数）
  K: number;  // 黑色墨水（瓶数）
}

// 按打印机型号分类的相纸库存
export interface PrinterPaperStock {
  'EPSON-L18058': {
    A3: number;  // A3相纸数量
  };
  'EPSON-L8058': {
    A4: number;  // A4相纸数量
  };
  'DNP-微印创': {
    '6寸': number;
    '8寸': number;
  };
  'DNP-自购': {
    '6寸': number;
    '8寸': number;
  };
  'DNP-锦联': {
    '6寸': number;
    '8寸': number;
  };
}

// 完整的库存数据结构
export interface Inventory {
  location: string;                    // 位置/调试间名称
  lastUpdated: string;                 // 最后更新时间
  paperStock: PrinterPaperStock;       // 按打印机分类的相纸库存
  epsonInkStock: EPSONInkStock;        // EPSON 墨水库存（通用）
  notes?: string;                      // 备注
}

// 默认调试间库存数据
const defaultInventory: Inventory = {
  location: '杭州调试间',
  lastUpdated: new Date().toISOString().split('T')[0],
  paperStock: {
    'EPSON-L18058': {
      A3: 280  // A3相纸
    },
    'EPSON-L8058': {
      A4: 450  // A4相纸
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
    C: 8,   // 8瓶青色墨水
    M: 6,   // 6瓶品红墨水
    Y: 7,   // 7瓶黄色墨水
    K: 12   // 12瓶黑色墨水
  },
  notes: '库存充足，定期检查有效期'
};

// 全局库存状态（实际项目中应该从数据库读取）
let inventoryData: Inventory = { ...defaultInventory };

/**
 * 获取调试间库存信息
 */
export const getInventory = async (): Promise<Inventory> => {
  // 模拟异步操作
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
    inventoryData = {
      ...inventoryData,
      ...updates,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    console.log('库存已更新:', inventoryData);
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
  const names: Record<PrinterModel, string> = {
    'EPSON-L18058': 'EPSON L18058 (A3)',
    'EPSON-L8058': 'EPSON L8058 (A4)',
    'DNP-微印创': 'DNP 微印创',
    'DNP-自购': 'DNP 自购',
    'DNP-锦联': 'DNP 锦联'
  };
  return names[model];
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
    Object.entries(stock).forEach(([type, quantity]) => {
      if (quantity < 100) {
        paperLow = true;
        details.push(`${getPrinterDisplayName(printerModel)} ${type}相纸库存不足 (${quantity}张)`);
      }
    });
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
