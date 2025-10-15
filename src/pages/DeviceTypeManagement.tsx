import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Tag, Palette } from 'lucide-react';
import { getDeviceTypes, createDeviceType, updateDeviceType, deleteDeviceType } from '../services/deviceTypeService';
import { DeviceType } from '../data/devices';

export function DeviceTypeManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<DeviceType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    sortOrder: 0,
  });

  const { data: deviceTypes, refetch } = useQuery({
    queryKey: ['deviceTypes'],
    queryFn: getDeviceTypes,
  });

  const handleOpenDialog = (type?: DeviceType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        description: type.description || '',
        color: type.color,
        sortOrder: type.sortOrder,
      });
    } else {
      setEditingType(null);
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        sortOrder: (deviceTypes?.length || 0) + 1,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入类型名称');
      return;
    }

    const typeData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color,
      sortOrder: formData.sortOrder,
    };

    if (editingType) {
      const result = await updateDeviceType(editingType.id, typeData);
      if (result.success) {
        toast.success('设备类型已更新');
        setDialogOpen(false);
        refetch();
      } else {
        toast.error(result.error || '更新失败');
      }
    } else {
      const result = await createDeviceType(typeData);
      if (result.success) {
        toast.success('设备类型已创建');
        setDialogOpen(false);
        refetch();
      } else {
        toast.error(result.error || '创建失败');
      }
    }
  };

  const handleDelete = async (type: DeviceType) => {
    if (!confirm(`确定要删除类型"${type.name}"吗？`)) {
      return;
    }

    const result = await deleteDeviceType(type.id);
    if (result.success) {
      toast.success('设备类型已删除');
      refetch();
    } else {
      toast.error(result.error || '删除失败');
    }
  };

  const predefinedColors = [
    '#3B82F6', // 蓝色
    '#8B5CF6', // 紫色
    '#EC4899', // 粉色
    '#FF6B9D', // 玫红
    '#10B981', // 绿色
    '#F59E0B', // 橙色
    '#EF4444', // 红色
    '#6366F1', // 靛蓝
  ];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">设备类型管理</h1>
          <p className="text-muted-foreground">管理和编辑设备分类</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新建类型
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deviceTypes?.map((type) => (
          <Card key={type.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(type)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(type)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {type.description && (
                <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Tag className="w-3 h-3" />
                <span>排序: {type.sortOrder}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!deviceTypes || deviceTypes.length === 0) && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无设备类型，点击右上角按钮创建</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingType ? '编辑设备类型' : '新建设备类型'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">类型名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：二次元机、普通机"
              />
            </div>

            <div>
              <Label htmlFor="description">类型描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="简要描述该类型设备的特点"
                rows={3}
              />
            </div>

            <div>
              <Label>类型颜色</Label>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex gap-2 flex-wrap">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-8 p-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="sortOrder">排序顺序</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                }
                placeholder="数字越小越靠前"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingType ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
