import React from 'react';
import { ArrowLeft, Plus, Wrench, TestTube, Calendar, User, MapPin, Settings, Printer, AlertCircle, Edit, Package, Move, RotateCcw, Recycle, Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { getDevice, updateDevice, addMaintenanceLog, Device } from '../data/devices';
import { getInventory, checkStockLevel, Inventory, getPrinterPaperStock, isEpsonPrinter, PrinterModel } from '../data/inventory';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { EditDeviceDialog } from './EditDeviceDialog';
import { ActionModal } from './ActionModal';
import { SOPPanel } from './SOPPanel';
import { uploadImage, getImageFromClipboard } from '../lib/imageUpload';

interface DeviceDetailProps {
  deviceId: string;
  onBack: () => void;
}

export function DeviceDetail({ deviceId, onBack }: DeviceDetailProps) {
  const [device, setDevice] = React.useState<Device | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [inventory, setInventory] = React.useState<Inventory | null>(null);
  const [actionModalOpen, setActionModalOpen] = React.useState(false);
  const [selectedAction, setSelectedAction] = React.useState<{
    action_type: string;
    defaultValues?: any;
  } | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');
  const [imageType, setImageType] = React.useState<'cover' | 'gallery'>('cover');
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 刷新设备数据
  const refreshDevice = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDevice(deviceId);
      setDevice(data);
    } catch (error) {
      console.error('Failed to fetch device:', error);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // 加载库存数据
  const loadInventory = React.useCallback(async () => {
    try {
      const data = await getInventory();
      setInventory(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  }, []);

  // 当deviceId变化时更新设备数据
  React.useEffect(() => {
    refreshDevice();
    loadInventory();
  }, [deviceId, refreshDevice, loadInventory]);

  // 加载中状态
  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded-lg w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="h-48 bg-muted rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-muted rounded-lg"></div>
              <div className="h-48 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 设备未找到
  if (!device) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">设备未找到</h3>
          <p className="text-muted-foreground mb-6">无法找到该设备信息</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: Device['status']) => {
    const variants = {
      '运行中': 'success' as const,
      '离线': 'inactive' as const,
      '维护': 'warning' as const
    };

    return (
      <Badge variant={variants[status]}>
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

  // 快捷操作处理函数
  const handleQuickAction = (actionType: string) => {
    let defaultValues = {};

    switch (actionType) {
      case '借用':
        defaultValues = {
          action_type: '借用',
          asset_id: deviceId,
          asset_type: device?.deviceType || '打印机',
          from_location_id: '', // 需要从设备当前位置获取
        };
        break;
      case '调拨':
        defaultValues = {
          action_type: '调拨',
          asset_id: deviceId,
          asset_type: device?.deviceType || '打印机',
        };
        break;
      case '更换耗材':
        defaultValues = {
          action_type: '安装',
          asset_id: deviceId,
          asset_type: device?.deviceType || '打印机',
        };
        break;
      case '报修':
        defaultValues = {
          action_type: '报修',
          asset_id: deviceId,
          asset_type: device?.deviceType || '打印机',
        };
        break;
      default:
        defaultValues = {
          action_type: actionType,
          asset_id: deviceId,
          asset_type: device?.deviceType || '打印机',
        };
    }

    setSelectedAction({
      action_type: actionType,
      defaultValues
    });
    setActionModalOpen(true);
  };

  const handleActionSuccess = () => {
    setActionModalOpen(false);
    setSelectedAction(null);
    refreshDevice();
    toast.success('操作已成功完成');
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

        <div className="flex items-center gap-2">
          {/* 快捷操作按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('借用')}
            className="flex items-center gap-1"
          >
            <User className="w-4 h-4" />
            借用
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('调拨')}
            className="flex items-center gap-1"
          >
            <Move className="w-4 h-4" />
            调拨
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('更换耗材')}
            className="flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            更换耗材
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('报修')}
            className="flex items-center gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            报修
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            编辑设备
          </Button>
        </div>
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
                    <span className="text-muted-foreground">打印机型号:</span>
                    <span>{device.printerModel}</span>
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
            <CardContent>
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
            </CardContent>
          </Card>

          {/* 调试间耗材库存 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                调试间耗材库存
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {inventory ? (
                <>
                  {/* 库存信息头 */}
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div>
                      <p className="text-sm font-medium">{inventory.location}</p>
                      <p className="text-xs text-muted-foreground mt-1">最后更新: {inventory.lastUpdated}</p>
                    </div>
                    {(() => {
                      const stockStatus = checkStockLevel(inventory, device.printer.model as PrinterModel);
                      if (stockStatus.paperLow || stockStatus.inkLow) {
                        return (
                          <Badge variant="warning" className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            库存不足
                          </Badge>
                        );
                      }
                      return <Badge variant="success">库存充足</Badge>;
                    })()}
                  </div>

                  {/* 耗材库存 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 相纸库存 - 根据打印机型号显示 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-[10px] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-blue-600">
                          {device.printer.model} 相纸
                        </h4>
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {(() => {
                            const stock = getPrinterPaperStock(inventory, device.printer.model as PrinterModel);
                            return Object.values(stock || {}).reduce((a, b) => a + b, 0);
                          })()} 张
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {(() => {
                          const stock = getPrinterPaperStock(inventory, device.printer.model as PrinterModel);
                          if (!stock) {
                            return <p className="text-xs text-muted-foreground">该型号暂无库存数据</p>;
                          }
                          return Object.entries(stock).map(([type, quantity]) => (
                            <div key={type} className="flex justify-between text-sm">
                              <span className="text-gray-600">{type}</span>
                              <span className={quantity < 100 ? 'text-destructive font-medium' : ''}>{quantity} 张</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                    
                    {/* 墨水库存 - 仅 EPSON 显示 */}
                    {isEpsonPrinter(device.printer.model) && (
                      <div className="bg-green-50 border border-green-200 rounded-[10px] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-green-600">EPSON 墨水</h4>
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            {Object.values(inventory.epsonInkStock).reduce((a, b) => a + b, 0)} 瓶
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(inventory.epsonInkStock).map(([color, quantity]) => {
                            const colorName = color === 'C' ? '青色' : color === 'M' ? '品红' : color === 'Y' ? '黄色' : '黑色';
                            return (
                              <div key={color} className="flex justify-between text-sm">
                                <span className="text-gray-600">{colorName}({color})</span>
                                <span className={quantity < 3 ? 'text-destructive font-medium' : ''}>{quantity} 瓶</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 备注 */}
                  {inventory.notes && (
                    <div className="bg-muted/40 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">{inventory.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">加载库存数据中...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 维护与记录 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                维护与记录
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                              variant={
                                issue.status === '已解决' 
                                  ? 'success'
                                  : 'warning'
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

          {/* 设备图片相册 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>设备图片</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setImageUrl('');
                  setImageType('cover');
                  setUploadDialogOpen(true);
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                添加图片
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 封面图 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm text-muted-foreground">封面图</h4>
                    {device.coverImage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await updateDevice(deviceId, { coverImage: undefined });
                          await refreshDevice();
                          toast.success('已删除封面图');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {device.coverImage ? (
                    <ImageWithFallback
                      src={device.coverImage}
                      alt={`${device.name} 封面`}
                      className="w-full h-64 object-cover rounded-xl border"
                    />
                  ) : (
                    <div
                      className="w-full h-64 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => {
                        setImageUrl('');
                        setImageType('cover');
                        setUploadDialogOpen(true);
                      }}
                    >
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">点击添加封面图</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 相册 */}
                <div>
                  <h4 className="mb-3 text-sm text-muted-foreground">设备相册（{device.images?.length || 0}）</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {device.images && device.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <ImageWithFallback
                          src={img}
                          alt={`${device.name} 图片 ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-xl border hover:scale-105 transition-all duration-200"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={async () => {
                            const newImages = device.images?.filter((_, i) => i !== idx);
                            await updateDevice(deviceId, { images: newImages });
                            await refreshDevice();
                            toast.success('已删除图片');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {/* 添加按钮 */}
                    <div
                      className="w-full h-32 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => {
                        setImageUrl('');
                        setImageType('gallery');
                        setUploadDialogOpen(true);
                      }}
                    >
                      <Plus className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 图片上传对话框 */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{imageType === 'cover' ? '设置封面图' : '添加相册图片'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* 上传方式选择 */}
                <div className="grid grid-cols-2 gap-3">
                  {/* 本地上传 */}
                  <div
                    className="border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-center text-muted-foreground">本地上传</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      setUploading(true);
                      toast.loading('正在上传图片...');

                      try {
                        const result = await uploadImage(file);
                        toast.dismiss();

                        if (result.success && result.url) {
                          setImageUrl(result.url);
                          toast.success('图片上传成功');
                        } else {
                          toast.error(result.error || '上传失败');
                        }
                      } catch (error) {
                        toast.dismiss();
                        toast.error('上传失败');
                      } finally {
                        setUploading(false);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }
                    }}
                  />

                  {/* 粘贴上传 */}
                  <div
                    className="border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary transition-colors"
                    onClick={async () => {
                      setUploading(true);
                      toast.loading('正在读取剪贴板...');

                      try {
                        const file = await getImageFromClipboard();
                        toast.dismiss();

                        if (!file) {
                          toast.error('剪贴板中没有图片');
                          setUploading(false);
                          return;
                        }

                        toast.loading('正在上传图片...');
                        const result = await uploadImage(file);
                        toast.dismiss();

                        if (result.success && result.url) {
                          setImageUrl(result.url);
                          toast.success('图片上传成功');
                        } else {
                          toast.error(result.error || '上传失败');
                        }
                      } catch (error) {
                        toast.dismiss();
                        toast.error('读取剪贴板失败');
                      } finally {
                        setUploading(false);
                      }
                    }}
                  >
                    <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-center text-muted-foreground">粘贴图片</p>
                  </div>
                </div>

                {/* 或者使用链接 */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">或使用链接</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">图片URL</label>
                  <Input
                    placeholder="输入图片链接（例如：https://example.com/image.jpg）"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    提示：支持 Unsplash、图床等图片链接
                  </p>
                </div>

                {/* 预览 */}
                {imageUrl && !uploading && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">预览</label>
                    <img
                      src={imageUrl}
                      alt="预览"
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={() => toast.error('图片加载失败，请检查链接')}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadDialogOpen(false);
                      setImageUrl('');
                    }}
                    disabled={uploading}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!imageUrl.trim()) {
                        toast.error('请上传或输入图片链接');
                        return;
                      }

                      try {
                        if (imageType === 'cover') {
                          await updateDevice(deviceId, { coverImage: imageUrl });
                        } else {
                          const newImages = [...(device.images || []), imageUrl];
                          await updateDevice(deviceId, { images: newImages });
                        }
                        await refreshDevice();
                        setUploadDialogOpen(false);
                        setImageUrl('');
                        toast.success(imageType === 'cover' ? '封面图已更新' : '图片已添加');
                      } catch (error) {
                        toast.error('保存失败');
                      }
                    }}
                    disabled={uploading || !imageUrl}
                  >
                    保存
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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

          {/* SOP 标准操作程序 */}
          <SOPPanel
            assetId={deviceId}
            assetType={device.deviceType || '打印机'}
            brand={device.printer?.brand}
            model={device.printer?.model}
          />
        </div>
      </div>

      {/* 编辑设备对话框 */}
      <EditDeviceDialog
        device={device}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveDevice}
      />

      {/* 操作单据对话框 */}
      <ActionModal
        open={actionModalOpen}
        onClose={() => {
          setActionModalOpen(false);
          setSelectedAction(null);
        }}
        onSuccess={handleActionSuccess}
        defaultValues={selectedAction?.defaultValues}
        contextAsset={device ? {
          id: deviceId,
          type: device.deviceType || '打印机',
          name: device.name,
          model_id: device.printer?.id // 假设有这个字段
        } : undefined}
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
  const [isEditing, setIsEditing] = React.useState(false);

  const handleLocationUpdate = async () => {
    if (newLocation === currentLocation) {
      setIsEditing(false);
      return;
    }
    
    const success = await updateDevice(deviceId, { location: newLocation });
    if (success) {
      onLocationUpdated();
      toast.success(`位置已更新为: ${newLocation}`);
      setIsEditing(false);
    } else {
      toast.error('位置更新失败');
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground">快速更改位置</label>
      {isEditing ? (
        <div className="flex gap-1">
          <Input
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            className="h-8 text-xs"
            placeholder="输入新位置"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLocationUpdate();
              if (e.key === 'Escape') setIsEditing(false);
            }}
          />
          <Button size="sm" className="h-8 px-2" onClick={handleLocationUpdate}>
            ✓
          </Button>
        </div>
      ) : (
        <div className="flex gap-1">
          <div className="flex-1 text-xs py-1 px-2 bg-muted rounded">
            {currentLocation}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 px-2" 
            onClick={() => setIsEditing(true)}
          >
            编辑
          </Button>
        </div>
      )}
    </div>
  );
}