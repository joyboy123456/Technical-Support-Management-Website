import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Device } from '../data/devices';

interface EditDeviceDialogProps {
  device: Device;
  open: boolean;
  onClose: () => void;
  onSave: (updatedDevice: Partial<Device>) => void;
}

export function EditDeviceDialog({ device, open, onClose, onSave }: EditDeviceDialogProps) {
  const [formData, setFormData] = React.useState({
    name: device.name,
    model: device.model,
    serial: device.serial,
    printerModel: device.printerModel,
    location: device.location,
    owner: device.owner,
    status: device.status,
    nextMaintenance: device.nextMaintenance,
    coverImage: device.coverImage || '',
    images: device.images || []
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        name: device.name,
        model: device.model,
        serial: device.serial,
        printerModel: device.printerModel,
        location: device.location,
        owner: device.owner,
        status: device.status,
        nextMaintenance: device.nextMaintenance,
        coverImage: device.coverImage || '',
        images: device.images || []
      });
    }
  }, [device, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // 基本验证
    if (!formData.name || !formData.location || !formData.owner) {
      toast.error('请填写必填字段');
      return;
    }

    onSave(formData);
    toast.success('设备信息已更新');
    onClose();
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑设备信息</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">设备名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入设备名称"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">设备型号</Label>
            <Select value={formData.model} onValueChange={(value) => handleInputChange('model', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="魔镜6号">魔镜6号</SelectItem>
                <SelectItem value="魔镜7号">魔镜7号</SelectItem>
                <SelectItem value="魔镜8号">魔镜8号</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serial">序列号</Label>
            <Input
              id="serial"
              value={formData.serial}
              onChange={(e) => handleInputChange('serial', e.target.value)}
              placeholder="请输入序列号"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="printerModel">打印机型号</Label>
            <Input
              id="printerModel"
              value={formData.printerModel}
              onChange={(e) => handleInputChange('printerModel', e.target.value)}
              placeholder="请输入打印机型号"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">位置 *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="请输入设备位置"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner">负责人 *</Label>
            <Input
              id="owner"
              value={formData.owner}
              onChange={(e) => handleInputChange('owner', e.target.value)}
              placeholder="请输入负责人姓名"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">设备状态</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as Device['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="运行中">运行中</SelectItem>
                <SelectItem value="离线">离线</SelectItem>
                <SelectItem value="维护">维护</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextMaintenance">下次维护日期</Label>
            <Input
              id="nextMaintenance"
              type="date"
              value={formData.nextMaintenance}
              onChange={(e) => handleInputChange('nextMaintenance', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage">设备封面图（URL）</Label>
            <Input
              id="coverImage"
              value={formData.coverImage}
              onChange={(e) => handleInputChange('coverImage', e.target.value)}
              placeholder="请输入封面图片 URL"
            />
            {formData.coverImage && (
              <div className="mt-2">
                <img 
                  src={formData.coverImage} 
                  alt="封面预览" 
                  className="w-full h-32 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存更改
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}