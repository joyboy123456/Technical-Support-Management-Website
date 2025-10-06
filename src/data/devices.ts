export interface Device {
  id: string;
  name: string;
  model: string;
  serial: string;
  os: string;
  location: string;
  owner: string;
  status: '运行中' | '离线' | '维护';
  printer: {
    model: string;
    paper: 'A4' | 'A3';
    connect: 'USB' | 'Wi-Fi';
    paperStock: number;
    ink: {
      C: number; // 青色
      M: number; // 品红
      Y: number; // 黄色
      K: number; // 黑色
    };
  };
  nextMaintenance: string;
  logs: Array<{
    date: string;
    type: '维护' | '故障' | '耗材' | '其他';
    note: string;
    executor?: string;
  }>;
  issues: Array<{
    date: string;
    desc: string;
    status?: '处理中' | '已解决';
  }>;
}

export const devices: Device[] = [
  {
    id: 'dev-01',
    name: '设备01',
    model: '魔镜6号',
    serial: 'SN-01-2025',
    os: 'Windows 11',
    location: '杭州展厅A区',
    owner: '张三',
    status: '运行中',
    printer: {
      model: 'EPSON-L8058',
      paper: 'A4',
      connect: 'Wi-Fi',
      paperStock: 120,
      ink: { C: 76, M: 64, Y: 58, K: 83 }
    },
    nextMaintenance: '2025-11-15',
    logs: [
      { date: '2025-09-01', type: '维护', note: '清洁打印头', executor: '张三' },
      { date: '2025-09-20', type: '耗材', note: '补充相纸 100 张', executor: '李四' }
    ],
    issues: []
  },
  {
    id: 'dev-02',
    name: '设备02',
    model: '魔镜6号',
    serial: 'SN-02-2025',
    os: 'Windows 11',
    location: '杭州展厅B区',
    owner: '李四',
    status: '维护',
    printer: {
      model: 'EPSON-L18058',
      paper: 'A3',
      connect: 'USB',
      paperStock: 60,
      ink: { C: 40, M: 52, Y: 47, K: 61 }
    },
    nextMaintenance: '2025-10-25',
    logs: [
      { date: '2025-09-28', type: '故障', note: '走纸不顺；已清理导轨', executor: '王五' }
    ],
    issues: [
      { date: '2025-09-28', desc: '卡纸', status: '已解决' }
    ]
  },
  {
    id: 'dev-03',
    name: '设备03',
    model: '魔镜7号',
    serial: 'SN-03-2025',
    os: 'Windows 11',
    location: '上海展厅A区',
    owner: '王五',
    status: '运行中',
    printer: {
      model: 'EPSON-L8058',
      paper: 'A4',
      connect: 'Wi-Fi',
      paperStock: 95,
      ink: { C: 88, M: 92, Y: 76, K: 94 }
    },
    nextMaintenance: '2025-12-01',
    logs: [
      { date: '2025-09-15', type: '维护', note: '系统更新', executor: '王五' }
    ],
    issues: []
  },
  {
    id: 'dev-04',
    name: '设备04',
    model: '魔镜6号',
    serial: 'SN-04-2025',
    os: 'Windows 11',
    location: '上海展厅B区',
    owner: '赵六',
    status: '离线',
    printer: {
      model: 'EPSON-L18058',
      paper: 'A3',
      connect: 'USB',
      paperStock: 25,
      ink: { C: 15, M: 23, Y: 18, K: 31 }
    },
    nextMaintenance: '2025-10-30',
    logs: [
      { date: '2025-09-25', type: '故障', note: '网络连接异常', executor: '赵六' }
    ],
    issues: [
      { date: '2025-09-25', desc: '网络连接失败', status: '处理中' }
    ]
  },
  {
    id: 'dev-05',
    name: '设备05',
    model: '魔镜7号',
    serial: 'SN-05-2025',
    os: 'Windows 11',
    location: '北京展厅A区',
    owner: '孙七',
    status: '运行中',
    printer: {
      model: 'EPSON-L8058',
      paper: 'A4',
      connect: 'Wi-Fi',
      paperStock: 80,
      ink: { C: 65, M: 71, Y: 58, K: 79 }
    },
    nextMaintenance: '2025-11-20',
    logs: [
      { date: '2025-09-10', type: '耗材', note: '更换墨盒', executor: '孙七' }
    ],
    issues: []
  },
  {
    id: 'dev-06',
    name: '设备06',
    model: '魔镜6号',
    serial: 'SN-06-2025',
    os: 'Windows 11',
    location: '北京展厅B区',
    owner: '周八',
    status: '维护',
    printer: {
      model: 'EPSON-L18058',
      paper: 'A3',
      connect: 'USB',
      paperStock: 40,
      ink: { C: 35, M: 42, Y: 38, K: 46 }
    },
    nextMaintenance: '2025-10-28',
    logs: [
      { date: '2025-09-30', type: '维护', note: '定期保养检查', executor: '周八' }
    ],
    issues: []
  },
  {
    id: 'dev-07',
    name: '设备07',
    model: '魔镜7号',
    serial: 'SN-07-2025',
    os: 'Windows 11',
    location: '深圳展厅A区',
    owner: '吴九',
    status: '运行中',
    printer: {
      model: 'EPSON-L8058',
      paper: 'A4',
      connect: 'Wi-Fi',
      paperStock: 110,
      ink: { C: 82, M: 87, Y: 73, K: 91 }
    },
    nextMaintenance: '2025-12-05',
    logs: [
      { date: '2025-09-18', type: '维护', note: '清洁设备外壳', executor: '吴九' }
    ],
    issues: []
  },
  {
    id: 'dev-08',
    name: '设备08',
    model: '魔镜6号',
    serial: 'SN-08-2025',
    os: 'Windows 11',
    location: '深圳展厅B区',
    owner: '郑十',
    status: '运行中',
    printer: {
      model: 'EPSON-L18058',
      paper: 'A3',
      connect: 'USB',
      paperStock: 75,
      ink: { C: 56, M: 63, Y: 49, K: 72 }
    },
    nextMaintenance: '2025-11-25',
    logs: [
      { date: '2025-09-22', type: '耗材', note: '补充A3相纸', executor: '郑十' }
    ],
    issues: []
  },
  {
    id: 'dev-09',
    name: '设备09',
    model: '魔镜7号',
    serial: 'SN-09-2025',
    os: 'Windows 11',
    location: '广州展厅A区',
    owner: '冯十一',
    status: '离线',
    printer: {
      model: 'EPSON-L8058',
      paper: 'A4',
      connect: 'Wi-Fi',
      paperStock: 20,
      ink: { C: 12, M: 18, Y: 15, K: 25 }
    },
    nextMaintenance: '2025-11-10',
    logs: [
      { date: '2025-09-26', type: '故障', note: '电源故障', executor: '冯十一' }
    ],
    issues: [
      { date: '2025-09-26', desc: '设备无法开机', status: '处理中' }
    ]
  },
  {
    id: 'dev-10',
    name: '设备10',
    model: '魔镜6号',
    serial: 'SN-10-2025',
    os: 'Windows 11',
    location: '广州展厅B区',
    owner: '陈十二',
    status: '运行中',
    printer: {
      model: 'EPSON-L18058',
      paper: 'A3',
      connect: 'USB',
      paperStock: 85,
      ink: { C: 69, M: 74, Y: 66, K: 81 }
    },
    nextMaintenance: '2025-12-10',
    logs: [
      { date: '2025-09-12', type: '维护', note: '软件升级', executor: '陈十二' }
    ],
    issues: []
  }
];

import { 
  fetchDevices, 
  fetchDevice, 
  updateDeviceData, 
  addMaintenanceLogData 
} from '../services/deviceService';

// 设备数据的全局状态（用作缓存和降级方案）
let devicesData = [...devices];
let isSupabaseEnabled = true;

// 检查 Supabase 是否配置
const checkSupabaseConfig = () => {
  const hasConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!hasConfig && isSupabaseEnabled) {
    console.warn('Supabase not configured. Using local data mode.');
    isSupabaseEnabled = false;
  }
  return hasConfig;
};

// 更新设备信息
export const updateDevice = async (deviceId: string, updates: Partial<Device>): Promise<boolean> => {
  if (checkSupabaseConfig()) {
    const success = await updateDeviceData(deviceId, updates);
    if (success) return true;
  }
  
  // 降级到本地存储
  const deviceIndex = devicesData.findIndex(d => d.id === deviceId);
  if (deviceIndex === -1) return false;
  
  devicesData[deviceIndex] = {
    ...devicesData[deviceIndex],
    ...updates
  };
  
  return true;
};

// 获取设备列表
export const getDevices = async (): Promise<Device[]> => {
  if (checkSupabaseConfig()) {
    const devices = await fetchDevices();
    if (devices.length > 0) {
      devicesData = devices; // 更新缓存
      return devices;
    }
  }
  
  // 降级到本地数据
  return [...devicesData];
};

// 获取单个设备
export const getDevice = async (deviceId: string): Promise<Device | undefined> => {
  if (checkSupabaseConfig()) {
    const device = await fetchDevice(deviceId);
    if (device) return device;
  }
  
  // 降级到本地数据
  return devicesData.find(d => d.id === deviceId);
};

// 添加维护记录
export const addMaintenanceLog = async (deviceId: string, log: {
  date: string;
  type: '维护' | '故障' | '耗材' | '其他';
  note: string;
  executor?: string;
}): Promise<boolean> => {
  if (checkSupabaseConfig()) {
    const success = await addMaintenanceLogData(deviceId, log);
    if (success) return true;
  }
  
  // 降级到本地存储
  const deviceIndex = devicesData.findIndex(d => d.id === deviceId);
  if (deviceIndex === -1) return false;
  
  devicesData[deviceIndex].logs.push(log);
  return true;
};

export const sidebarItems = [
  {
    title: '公告',
    id: 'announcements',
    type: 'page' as const
  },
  {
    title: '设备列表',
    id: 'device-list',
    type: 'group' as const,
    children: async () => {
      const devices = await getDevices();
      return devices.map(device => ({
        title: device.name,
        id: device.id,
        type: 'device' as const
      }));
    }
  },
  {
    title: '打印机操作指南',
    id: 'printer-guide',
    type: 'page' as const
  },
  {
    title: '故障处理与应急',
    id: 'troubleshooting',
    type: 'page' as const
  },
  {
    title: '常见问题',
    id: 'faq',
    type: 'page' as const
  }
];