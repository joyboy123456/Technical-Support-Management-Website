import React from 'react';
import { Package, Save, AlertCircle, Plus, Minus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  getInventory, 
  updateInventory, 
  Inventory, 
  PrinterModel,
  getPrinterDisplayName,
  checkStockLevel 
} from '../data/inventory';

export function InventoryManagement() {
  const [inventory, setInventory] = React.useState<Inventory | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editedInventory, setEditedInventory] = React.useState<Inventory | null>(null);

  // 加载库存数据
  const loadInventory = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getInventory();
      setInventory(data);
      setEditedInventory(JSON.parse(JSON.stringify(data))); // 深拷贝
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      toast.error('加载库存数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // 更新相纸数量
  const handlePaperChange = (printerModel: PrinterModel, paperType: string, value: string) => {
    if (!editedInventory) return;
    
    const quantity = parseInt(value) || 0;
    const newInventory = { ...editedInventory };
    // @ts-ignore
    newInventory.paperStock[printerModel][paperType] = quantity;
    setEditedInventory(newInventory);
  };

  // 快速调整相纸数量
  const adjustPaper = (printerModel: PrinterModel, paperType: string, delta: number) => {
    if (!editedInventory) return;
    
    // @ts-ignore
    const currentValue = editedInventory.paperStock[printerModel][paperType] || 0;
    const newValue = Math.max(0, currentValue + delta);
    handlePaperChange(printerModel, paperType, newValue.toString());
  };

  // 更新墨水数量
  const handleInkChange = (color: string, value: string) => {
    if (!editedInventory) return;
    
    const quantity = parseInt(value) || 0;
    const newInventory = { ...editedInventory };
    // @ts-ignore
    newInventory.epsonInkStock[color] = quantity;
    setEditedInventory(newInventory);
  };

  // 快速调整墨水数量
  const adjustInk = (color: string, delta: number) => {
    if (!editedInventory) return;

    // @ts-ignore
    const currentValue = editedInventory.epsonInkStock[color] || 0;
    const newValue = Math.max(0, currentValue + delta);
    handleInkChange(color, newValue.toString());
  };

  // 更新设备配件数量
  const handleEquipmentChange = (equipmentType: string, value: string) => {
    if (!editedInventory) return;

    const quantity = parseInt(value) || 0;
    const newInventory = { ...editedInventory };
    // @ts-ignore
    newInventory.equipmentStock[equipmentType] = quantity;
    setEditedInventory(newInventory);
  };

  // 快速调整设备配件数量
  const adjustEquipment = (equipmentType: string, delta: number) => {
    if (!editedInventory) return;

    // @ts-ignore
    const currentValue = editedInventory.equipmentStock[equipmentType] || 0;
    const newValue = Math.max(0, currentValue + delta);
    handleEquipmentChange(equipmentType, newValue.toString());
  };

  // 保存更改
  const handleSave = async () => {
    if (!editedInventory) return;
    
    try {
      setSaving(true);
      const success = await updateInventory(editedInventory);
      if (success) {
        setInventory(editedInventory);
        toast.success('库存已更新');
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      console.error('Failed to update inventory:', error);
      toast.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  // 重置更改
  const handleReset = () => {
    if (inventory) {
      setEditedInventory(JSON.parse(JSON.stringify(inventory)));
      toast.info('已重置更改');
    }
  };

  // 检查是否有未保存的更改
  const hasChanges = React.useMemo(() => {
    return JSON.stringify(inventory) !== JSON.stringify(editedInventory);
  }, [inventory, editedInventory]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded-lg w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded-lg"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!editedInventory) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center">
        <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">加载库存数据失败</p>
      </div>
    );
  }

  const stockStatus = checkStockLevel(editedInventory);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto fade-in">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
        <div>
          <h1 className="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight">库存管理</h1>
          <p className="text-muted-foreground text-sm sm:text-base">管理调试间的耗材库存</p>
        </div>
        
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              重置
            </Button>
          )}
          <Button 
            data-testid="inventory-save"
            onClick={handleSave} 
            disabled={!hasChanges || saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存更改'}
          </Button>
        </div>
      </div>

      {/* 库存状态提示 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{editedInventory.location}</p>
              <p className="text-xs text-muted-foreground mt-1">
                最后更新: {editedInventory.lastUpdated}
              </p>
            </div>
            
            {(stockStatus.paperLow || stockStatus.inkLow) ? (
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                库存不足
              </Badge>
            ) : (
              <Badge variant="success">库存充足</Badge>
            )}
          </div>
          
          {stockStatus.details.length > 0 && (
            <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-2">库存警告：</p>
              <ul className="text-xs text-destructive space-y-1">
                {stockStatus.details.map((detail, index) => (
                  <li key={index}>• {detail}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 相纸库存管理 */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">相纸库存</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.entries(editedInventory.paperStock) as [PrinterModel, any][]).map(([printerModel, stock]) => (
            <Card key={printerModel} className="anthropic-card-shadow">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {getPrinterDisplayName(printerModel)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stock).map(([paperType, quantity]) => (
                  <div key={paperType} className="space-y-2">
                    <label className="text-sm font-medium">{paperType}</label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => adjustPaper(printerModel, paperType, -10)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      
                      <Input
                        data-testid={`inventory-paper-${printerModel.replace(/\s+/g, '-').replace(/\//g, '-')}-${paperType.replace(/\s+/g, '-').replace(/\//g, '-')}`}
                        type="number"
                        value={quantity}
                        onChange={(e) => handlePaperChange(printerModel, paperType, e.target.value)}
                        className={`text-center ${quantity < 100 ? 'border-destructive' : ''}`}
                        min="0"
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => adjustPaper(printerModel, paperType, 10)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      
                      <span className="text-xs text-muted-foreground min-w-[30px]">张</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* EPSON 墨水库存管理 */}
      <div className="space-y-6 mt-8">
        <h2 className="text-xl font-semibold">EPSON 墨水库存</h2>
        
        <Card className="anthropic-card-shadow">
          <CardHeader>
            <CardTitle className="text-base">通用墨水（适用于所有 EPSON 打印机）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(editedInventory.epsonInkStock).map(([color, quantity]) => {
                const colorNames: Record<string, string> = {
                  'C': '青色',
                  'M': '品红',
                  'Y': '黄色',
                  'K': '黑色'
                };
                
                return (
                  <div key={color} className="space-y-2">
                    <label className="text-sm font-medium">{colorNames[color]} ({color})</label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => adjustInk(color, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      
                      <Input
                        data-testid={`inventory-ink-${color}`}
                        type="number"
                        value={quantity}
                        onChange={(e) => handleInkChange(color, e.target.value)}
                        className={`text-center ${quantity < 3 ? 'border-destructive' : ''}`}
                        min="0"
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => adjustInk(color, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      
                      <span className="text-xs text-muted-foreground min-w-[30px]">瓶</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 设备配件库存管理 */}
      <div className="space-y-6 mt-8">
        <h2 className="text-xl font-semibold">设备配件库存</h2>

        <Card className="anthropic-card-shadow">
          <CardHeader>
            <CardTitle className="text-base">配件与耗材</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(editedInventory.equipmentStock).map(([equipmentType, quantity]) => {
                const equipmentNames: Record<string, string> = {
                  'routers': '路由器',
                  'powerStrips': '插板',
                  'usbCables': 'USB线',
                  'networkCables': '网线',
                  'adapters': '电源适配器'
                };

                return (
                  <div key={equipmentType} className="space-y-2">
                    <label className="text-sm font-medium">{equipmentNames[equipmentType]}</label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => adjustEquipment(equipmentType, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>

                      <Input
                        data-testid={`inventory-equipment-${equipmentType}`}
                        type="number"
                        value={quantity}
                        onChange={(e) => handleEquipmentChange(equipmentType, e.target.value)}
                        className={`text-center ${quantity < 5 ? 'border-destructive' : ''}`}
                        min="0"
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => adjustEquipment(equipmentType, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>

                      <span className="text-xs text-muted-foreground min-w-[30px]">个</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 备注 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">备注</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={editedInventory.notes || ''}
            onChange={(e) => setEditedInventory({ ...editedInventory, notes: e.target.value })}
            placeholder="添加备注信息..."
          />
        </CardContent>
      </Card>

      {/* 未保存更改提示 */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-card border shadow-lg rounded-lg p-4 max-w-sm">
          <p className="text-sm font-medium mb-2">有未保存的更改</p>
          <p className="text-xs text-muted-foreground mb-3">
            记得点击"保存更改"按钮保存你的修改
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              保存
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
