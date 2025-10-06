import React from 'react';
import { ArrowLeft, Plus, Wrench, TestTube, Calendar, User, MapPin, Settings, Printer, AlertCircle, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { getDevice, updateDevice, addMaintenanceLog, Device } from '../data/devices';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { EditDeviceDialog } from './EditDeviceDialog';

interface DeviceDetailProps {
  deviceId: string;
  onBack: () => void;
}

export function DeviceDetail({ deviceId, onBack }: DeviceDetailProps) {
  const [device, setDevice] = React.useState<Device | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [checklistItems, setChecklistItems] = React.useState({
    connection: false,
    paper: false,
    rails: false,
    ink: false,
    cover: false
  });

  // 刷新设备数据
  const refreshDevice = React.useCallback(async () => {
    setLoading(true);
    const data = await getDevice(deviceId);
    setDevice(data);
    setLoading(false);
  }, [deviceId]);

  // 当deviceId变化时更新设备数据
  React.useEffect(() => {
    refreshDevice();
    // 重置检查列表状态
    setChecklistItems({
      connection: false,
      paper: false,
      rails: false,
      ink: false,
      cover: false
    });
  }, [deviceId, refreshDevice]);

  if (!device) {
    return (
      <div className="p-6">
        <p>设备未找到</p>
      </div>
    );
  }

  const getStatusBadge = (status: Device['status']) => {
    const colors = {
      '运行中': 'bg-green-100 text-green-800 hover:bg-green-100',
      '离线': 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      '维护': 'bg-orange-100 text-orange-800 hover:bg-orange-100'
    };

    return (
      <Badge className={colors[status]}>
        {status}
      </Badge>
    );
  };

  const handleSaveDevice = async (updatedData: Partial<Device>) => {
    const success = await updateDevice(deviceId, updatedData);
    if (success) {
      await refreshDevice();
      toast.success('设备信息已更新');
    } else {
      toast.error('更新失败');
    }
  };

  const handleAddMaintenance = async (maintenanceData: {
    type: '维护' | '故障' | '耗材' | '其他';
    note: string;
    executor: string;
  }) => {
    const success = await addMaintenanceLog(deviceId, {
      date: new Date().toISOString().split('T')[0],
      ...maintenanceData
    });
    
    if (success) {
      await refreshDevice();
      toast.success('维护记录已添加');
    } else {
      toast.error('添加失败');
    }
  };



  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 返回按钮和标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <div className="flex items-center gap-3">
            <h1>{device.name}</h1>
            {getStatusBadge(device.status)}
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setEditDialogOpen(true)}
        >
          <Edit className="w-4 h-4 mr-2" />
          编辑设备
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要内容区 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基础信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                基础信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">设备型号:</span>
                    <span>{device.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">序列号:</span>
                    <span>{device.serial}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">操作系统:</span>
                    <span>{device.os}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">位置:</span>
                    <span>{device.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">负责人:</span>
                    <span>{device.owner}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 关联打印机 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                关联打印机
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">打印机型号:</span>
                    <span>{device.printer.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">纸张规格:</span>
                    <span>{device.printer.paper}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">连接方式:</span>
                    <span>{device.printer.connect}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">相纸余量:</span>
                    <span>{device.printer.paperStock} 张</span>
                  </div>
                </div>
              </div>

              {/* 墨水状态 */}
              <div>
                <h4 className="mb-3">耗材状态</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(device.printer.ink).map(([color, level]) => (
                    <div key={color} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {color === 'C' ? '青色' : color === 'M' ? '品红' : color === 'Y' ? '黄色' : '黑色'}墨水:
                        </span>
                        <span>{level}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            level > 50 ? 'bg-green-500' : 
                            level > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 维护与故障 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                耗材与记录
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 耗材状态 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-blue-900">相纸库存</h4>
                    <Badge variant="outline" className="text-blue-700">
                      公司仓库
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">A4相纸</span>
                      <span>450张</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">A3相纸</span>
                      <span>280张</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">A6相纸</span>
                      <span>120张</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-green-900">墨水余量</h4>
                    <Badge variant="outline" className="text-green-700">
                      {Math.min(device.printer.ink.C, device.printer.ink.M, device.printer.ink.Y, device.printer.ink.K)}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">黑色(K)</span>
                      <span>{device.printer.ink.K}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">青色(C)</span>
                      <span>{device.printer.ink.C}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">品红(M)</span>
                      <span>{device.printer.ink.M}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">黄色(Y)</span>
                      <span>{device.printer.ink.Y}%</span>
                    </div>
                    {Math.min(device.printer.ink.C, device.printer.ink.M, device.printer.ink.Y, device.printer.ink.K) < 20 && (
                      <div className="text-xs text-red-600 mt-2">
                        ⚠️ 墨水不足
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 快捷操作 */}
              <div className="flex gap-2 flex-wrap">
                <MaintenanceDialog onAddMaintenance={handleAddMaintenance} />
              </div>

              {/* 维护日志 */}
              <div>
                <h4 className="mb-3">维护日志</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>内容</TableHead>
                      <TableHead>执行人</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {device.logs.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell>{log.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.type}</Badge>
                        </TableCell>
                        <TableCell>{log.note}</TableCell>
                        <TableCell>{log.executor || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 故障记录 */}
              {device.issues.length > 0 && (
                <div>
                  <h4 className="mb-3">故障记录</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>时间</TableHead>
                        <TableHead>现象</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {device.issues.map((issue, index) => (
                        <TableRow key={index}>
                          <TableCell>{issue.date}</TableCell>
                          <TableCell>{issue.desc}</TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                issue.status === '已解决' 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                  : 'bg-orange-100 text-orange-800 hover:bg-orange-100'
                              }
                            >
                              {issue.status || '处理中'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 打印前检查 */}
          <Card>
            <CardHeader>
              <CardTitle>打印前检查</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="connection" 
                      checked={checklistItems.connection}
                      onCheckedChange={(checked) => 
                        setChecklistItems(prev => ({ ...prev, connection: checked as boolean }))
                      }
                    />
                    <label htmlFor="connection" className="text-sm">
                      检查设备与打印机连接线是否正常
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="paper" 
                      checked={checklistItems.paper}
                      onCheckedChange={(checked) => 
                        setChecklistItems(prev => ({ ...prev, paper: checked as boolean }))
                      }
                    />
                    <label htmlFor="paper" className="text-sm">
                      确认相纸正反面放置正确
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="rails" 
                      checked={checklistItems.rails}
                      onCheckedChange={(checked) => 
                        setChecklistItems(prev => ({ ...prev, rails: checked as boolean }))
                      }
                    />
                    <label htmlFor="rails" className="text-sm">
                      调整导轨宽度与纸张匹配
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="ink" 
                      checked={checklistItems.ink}
                      onCheckedChange={(checked) => 
                        setChecklistItems(prev => ({ ...prev, ink: checked as boolean }))
                      }
                    />
                    <label htmlFor="ink" className="text-sm">
                      检查各色墨水液位充足
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="cover" 
                      checked={checklistItems.cover}
                      onCheckedChange={(checked) => 
                        setChecklistItems(prev => ({ ...prev, cover: checked as boolean }))
                      }
                    />
                    <label htmlFor="cover" className="text-sm">
                      确认打印机前盖已关闭
                    </label>
                  </div>
                </div>

                {/* 操作示意图占位 */}
                <div className="mt-6 space-y-4">
                  <h4>操作示意图</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-muted-foreground">
                      <ImageWithFallback 
                        src="https://images.unsplash.com/photo-1753272691001-4d68806ac590?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wdXRlciUyMHNlcnZlciUyMGVxdWlwbWVudHxlbnwxfHx8fDE3NTk2Njk2ODR8MA&ixlib=rb-4.1.0&q=80&w=1080" 
                        alt="接线示意图"
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                      接线示意图
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-muted-foreground">
                      <ImageWithFallback 
                        src="https://images.unsplash.com/photo-1723672947453-e6d09052bdf3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXBlciUyMGxvYWRpbmclMjBwcmludGVyfGVufDF8fHx8MTc1OTY2OTY5MHww&ixlib=rb-4.1.0&q=80&w=1080" 
                        alt="相纸放置示意图"
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                      相纸放置示意图
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 侧边栏信息 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4" />
                维护信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">下次维护:</span>
                <span>{device.nextMaintenance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">最近维护:</span>
                <span>{device.logs[device.logs.length - 1]?.date || '暂无记录'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4" />
                负责人信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">姓名:</span>
                <span>{device.owner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">联系方式:</span>
                <span>138****1234</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-4 h-4" />
                位置信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">详细位置:</span>
                <span>{device.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">楼层:</span>
                <span>2F</span>
              </div>
              
              {/* 快速位置更新 */}
              <div className="pt-3 border-t">
                <QuickLocationUpdate 
                  deviceId={deviceId}
                  currentLocation={device.location}
                  onLocationUpdated={refreshDevice}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 编辑设备对话框 */}
      <EditDeviceDialog 
        device={device}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveDevice}
      />
    </div>
  );
}

// 维护记录添加对话框组件
function MaintenanceDialog({ onAddMaintenance }: { 
  onAddMaintenance: (data: { type: '维护' | '故障' | '耗材' | '其他'; note: string; executor: string }) => void 
}) {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    type: '维护' as '维护' | '故障' | '耗材' | '其他',
    note: '',
    executor: ''
  });

  const handleSubmit = () => {
    if (!formData.note || !formData.executor) {
      toast.error('请填写完整信息');
      return;
    }
    
    onAddMaintenance(formData);
    setFormData({ type: '维护', note: '', executor: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          添加维护
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加维护记录</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">维护类型</label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="维护">定期维护</SelectItem>
                <SelectItem value="耗材">耗材更换</SelectItem>
                <SelectItem value="故障">故障修复</SelectItem>
                <SelectItem value="其他">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm mb-2">维护内容</label>
            <Textarea 
              placeholder="请描述维护内容..." 
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm mb-2">执行人</label>
            <Input 
              placeholder="请输入执行人姓名" 
              value={formData.executor}
              onChange={(e) => setFormData(prev => ({ ...prev, executor: e.target.value }))}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            确认添加
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 快速位置更新组件
function QuickLocationUpdate({ 
  deviceId, 
  currentLocation, 
  onLocationUpdated 
}: { 
  deviceId: string; 
  currentLocation: string; 
  onLocationUpdated: () => void; 
}) {
  const [newLocation, setNewLocation] = React.useState(currentLocation);

  const commonLocations = [
    '杭州展厅A区',
    '杭州展厅B区', 
    '上海展厅A区',
    '上海展厅B区',
    '北京展厅A区',
    '北京展厅B区',
    '深圳展厅A区',
    '深圳展厅B区',
    '广州展厅A区',
    '广州展厅B区',
    '外出活动',
    '维修中心',
    '仓库'
  ];

  const handleLocationUpdate = async (location: string) => {
    if (location === currentLocation) return;
    
    const success = await updateDevice(deviceId, { location });
    if (success) {
      onLocationUpdated();
      toast.success(`位置已更新为: ${location}`);
    } else {
      toast.error('位置更新失败');
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground">快速更改位置</label>
      <Select value={currentLocation} onValueChange={handleLocationUpdate}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {commonLocations.map(location => (
            <SelectItem key={location} value={location} className="text-xs">
              {location}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}