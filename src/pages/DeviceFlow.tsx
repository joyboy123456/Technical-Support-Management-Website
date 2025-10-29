import React from 'react';
import mermaid from 'mermaid';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export function DeviceFlow() {
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    });
    // 渲染当前页面中的所有 Mermaid 图
    // 兼容新旧 API：优先使用 run，其次使用 init
    // @ts-ignore
    if (typeof mermaid.run === 'function') {
      // @ts-ignore
      mermaid.run({ querySelector: '.mermaid' });
    } else {
      // @ts-ignore
      mermaid.init(undefined, '.mermaid');
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="mb-6">设备管理流程图</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">总览：设备管理入口流程（含远端/本地降级）</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="mermaid overflow-x-auto">
{`flowchart TD
    A[调用设备管理功能] --> B{Supabase 已配置?}
    B -- 是 --> C[调用远端服务]
    B -- 否 --> D[使用本地缓存 devicesData]
    C --> E[返回远端数据并更新缓存]
    D --> F[返回本地数据]`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">获取设备列表 getDevices</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="mermaid overflow-x-auto">
{`flowchart TD
    A[调用 getDevices] --> B{Supabase 已配置?}
    B -- 是 --> C[fetchDevices()]
    C --> D[查询 devices 表]
    D --> E[查询 maintenance_logs 表]
    E --> F[查询 issues 表]
    F --> G[mapRowToDevice: 将行数据合并日志/故障并转为 Device]
    G --> H[返回设备数组并更新 devicesData 缓存]
    B -- 否 --> I[返回 devicesData 作为降级结果]`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">获取单设备详情 getDevice</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="mermaid overflow-x-auto">
{`flowchart TD
    A[调用 getDevice(deviceId)] --> B{Supabase 已配置?}
    B -- 是 --> C[fetchDevice(deviceId)]
    C --> D[查询 devices 表: 指定 id 单行]
    D --> E[查询 maintenance_logs 表: 按 device_id]
    E --> F[查询 issues 表: 按 device_id]
    F --> G[mapRowToDevice: 合并后返回 Device]
    B -- 否 --> H[在 devicesData 中查找对应 id 并返回]`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">创建设备 createDevice</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="mermaid overflow-x-auto">
{`flowchart TD
    A[调用 createDevice(newDevice)] --> AA[生成 deviceId 并构造 Device 对象]
    AA --> B{Supabase 已配置?}
    B -- 是 --> C[createDeviceRecord: mapDeviceToRow 转换并插入 devices 表]
    C --> D[插入成功后 fetchDevice(createdId)]
    D --> E[获取完整 Device(含日志/故障为空集合)] --> F[push 到 devicesData 并返回]
    B -- 否 --> G[直接 push 到 devicesData 并返回]`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">更新设备 updateDevice</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="mermaid overflow-x-auto">
{`flowchart TD
    A[调用 updateDevice(deviceId, updates)] --> B{Supabase 已配置?}
    B -- 是 --> C[updateDeviceData: mapDeviceToRow 转换并更新 devices 表]
    C --> D{更新成功?}
    D -- 是 --> E[返回 true]
    D -- 否 --> F[转入本地更新]
    B -- 否 --> F[本地更新 devicesData 指定项并返回 true]`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">删除设备 deleteDevice</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="mermaid overflow-x-auto">
{`flowchart TD
    A[调用 deleteDevice(deviceId)] --> B{Supabase 已配置?}
    B -- 是 --> C[deleteDeviceData: 删除 devices 表对应 id]
    C --> D{删除成功?}
    D -- 否 --> E[返回 false]
    D -- 是 --> F[继续本地删除]
    B -- 否 --> F[在 devicesData 中查找并 splice 删除]
    F --> G{找到设备?}
    G -- 是 --> H[删除并返回 true]
    G -- 否 --> I[返回 false]`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">添加维护日志 addMaintenanceLog</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="mermaid overflow-x-auto">
{`flowchart TD
    A[调用 addMaintenanceLog(deviceId, log)] --> B{Supabase 已配置?}
    B -- 是 --> C[addMaintenanceLogData: 插入 maintenance_logs 表]
    C --> D{插入成功?}
    D -- 是 --> E[返回 true]
    D -- 否 --> F[本地追加]
    B -- 否 --> F[在 devicesData 中找到设备并 push log]
    F --> G{找到设备?}
    G -- 是 --> H[追加日志并返回 true]
    G -- 否 --> I[返回 false]`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">数据映射函数</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="mermaid overflow-x-auto">
{`flowchart TD
    subgraph 映射
    A[mapRowToDevice(row, logs, issues)]
    A --> B[字段映射: id/name/model/serial/...]
    B --> C[printer 对象映射: model/paper/connect/paperStock/ink CMYK]
    C --> D[images: 字段为 JSON 字符串时解析为数组]
    D --> E[组合 logs/issues 为 Device.logs/Device.issues]
    E --> F[返回 Device]

    G[mapDeviceToRow(device)]
    G --> H[将 Device/Partial<Device> 转换为数据库列]
    H --> I[处理 printer 与 ink 的子字段]
    I --> J[images 序列化为 JSON 字符串]
    J --> K[附加 updated_at 时间戳]
    K --> L[返回 row 以供 insert/update]
    end`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

export default DeviceFlow;