import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Device } from '../data/devices';

interface CreateDeviceDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (device: Omit<Device, 'id'>) => Promise<void>;
}

const defaultPrinterConfig = {
  model: 'EPSON-L8058',
  paper: 'A4' as const,
  connect: 'Wi-Fi' as const,
  paperStock: 0,
  ink: { C: 0, M: 0, Y: 0, K: 0 }
};

const defaultState = {
  name: '',
  model: '魔镜6号',
  serial: '',
  printerModel: defaultPrinterConfig.model,
  location: '',
  owner: '',
  status: '离线' as Device['status'],
  nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0],
  coverImage: '',
};

export function CreateDeviceDialog({ open, onClose, onCreate }: CreateDeviceDialogProps) {
  const [formData, setFormData] = React.useState(defaultState);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setFormData(defaultState);
    }
  }, [open]);

  const handleInputChange = (field: keyof typeof defaultState, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.location.trim() || !formData.owner.trim()) {
      toast.error('请填写设备名称、位置和负责人');
      return;
    }

    try {
      setSubmitting(true);
      await onCreate({
        name: formData.name.trim(),
        model: formData.model,
        serial: formData.serial.trim() || `SN-${Date.now()}`,
        printerModel: formData.printerModel,
        location: formData.location.trim(),
        owner: formData.owner.trim(),
        status: formData.status,
        nextMaintenance: formData.nextMaintenance,
        coverImage: formData.coverImage || undefined,
        images: [],
        deviceType: '打印机',
        printer: {
          ...defaultPrinterConfig,
          model: formData.printerModel
        },
        logs: [],
        issues: []
      });
      toast.success('设备创建成功');
      onClose();
    } catch (error: any) {
      console.error('Create device failed:', error);
      toast.error(error?.message || '设备创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新建设备</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="device-name">设备名称 *</Label>
            <Input
              id="device-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入设备名称"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-model">设备型号</Label>
            <Select value={formData.model} onValueChange={(value) => handleInputChange('model', value)}>
              <SelectTrigger id="device-model">
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
            <Label htmlFor="device-serial">序列号</Label>
            <Input
              id="device-serial"
              value={formData.serial}
              onChange={(e) => handleInputChange('serial', e.target.value)}
              placeholder="请输入序列号，不填将自动生成"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="printer-model">打印机型号</Label>
            <Select value={formData.printerModel} onValueChange={(value) => handleInputChange('printerModel', value)}>
              <SelectTrigger id="printer-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EPSON-L8058">EPSON-L8058</SelectItem>
                <SelectItem value="EPSON-L18058">EPSON-L18058</SelectItem>
                <SelectItem value="DNP-QW410">DNP-QW410</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-location">位置 *</Label>
            <Input
              id="device-location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="请输入设备所在位置"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-owner">负责人 *</Label>
            <Input
              id="device-owner"
              value={formData.owner}
              onChange={(e) => handleInputChange('owner', e.target.value)}
              placeholder="请输入负责人姓名"
            />
          </div>

          <div className="space-y-2">
            <Label>设备状态</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as Device['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="运行中">运行中</SelectItem>
                <SelectItem value="维护">维护</SelectItem>
                <SelectItem value="离线">离线</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-next-maintenance">下次维护日期</Label>
            <Input
              id="device-next-maintenance"
              type="date"
              value={formData.nextMaintenance}
              onChange={(e) => handleInputChange('nextMaintenance', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-cover">封面图片（可选）</Label>
            <Input
              id="device-cover"
              value={formData.coverImage}
              onChange={(e) => handleInputChange('coverImage', e.target.value)}
              placeholder="请输入图片 URL"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? '创建中...' : '创建设备'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
