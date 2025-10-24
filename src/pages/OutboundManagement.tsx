import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import {
  PackageMinus,
  Save,
  History,
  AlertCircle,
  PackagePlus,
  Trash2,
} from "lucide-react";
import {
  getInventory,
  PrinterModel,
  getPrinterDisplayName,
  OutboundItem,
  OutboundRecord,
  getAllPrinterInstances,
  PrinterInstance,
} from "../data/inventory";
import { getDevices as fetchDevices } from "../data/devices";
import {
  createOutboundRecord,
  getOutboundRecords,
  returnOutboundItems,
  deleteOutboundRecord,
} from "../services/outboundService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export function OutboundManagement() {
  const queryClient = useQueryClient();
  const [deviceId, setDeviceId] = useState("");
  const [destination, setDestination] = useState("");
  const [operator, setOperator] = useState("");
  const [printerModel, setPrinterModel] = useState<PrinterModel | "">("");
  const [paperType, setPaperType] = useState("");
  const [items, setItems] = useState<OutboundItem>({});
  const [notes, setNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [returningRecordId, setReturningRecordId] = useState<string | null>(
    null,
  );
  const [returningRecord, setReturningRecord] = useState<any>(null);
  const [returnOperator, setReturnOperator] = useState("");
  const [returnedItems, setReturnedItems] = useState<OutboundItem>({});
  const [equipmentDamage, setEquipmentDamage] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<OutboundRecord | null>(
    null,
  );
  const [selectedDeviceInstance, setSelectedDeviceInstance] = useState<string>("");
  const [printerInstances, setPrinterInstances] = useState<any[]>([]);

  const handleDeleteDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setRecordToDelete(null);
    }
  };

  const { data: inventory } = useQuery({
    queryKey: ["inventory"],
    queryFn: getInventory,
  });

  const { data: devices } = useQuery({
    queryKey: ["devices"],
    queryFn: fetchDevices,
  });

  const { data: outboundRecords, refetch: refetchRecords } = useQuery({
    queryKey: ["outboundRecords"],
    queryFn: getOutboundRecords,
  });

  // 加载打印机实例
  React.useEffect(() => {
    const loadPrinterInstances = async () => {
      try {
        const instances = await getAllPrinterInstances();
        setPrinterInstances(instances);
      } catch (error) {
        console.error('加载打印机实例失败:', error);
      }
    };
    loadPrinterInstances();
  }, []);

  const handleItemChange = (
    key: keyof OutboundItem,
    value: string | number,
  ) => {
    setItems((prev) => ({
      ...prev,
      [key]: typeof value === "string" ? parseInt(value) || 0 : value,
    }));
  };

  const handlePrinterModelChange = (model: string) => {
    setPrinterModel(model as PrinterModel);
    setPaperType("");
    setSelectedDeviceInstance(""); // 清空选中的设备实例
    setItems((prev) => ({
      ...prev,
      printerModel: model as PrinterModel,
      paperType: undefined,
      paperQuantity: undefined,
    }));
  };

  const getPaperTypes = (model: PrinterModel): string[] => {
    if (!inventory) return [];
    const stock = inventory.paperStock[model];
    return Object.keys(stock);
  };

  // 获取当前选中打印机型号下的在库设备
  const getAvailableDevices = (): PrinterInstance[] => {
    if (!printerModel) return [];
    return printerInstances.filter(
      (instance) => 
        instance.printerModel === printerModel && 
        instance.status === 'in-house'
    );
  };

  const handleSubmit = async () => {
    if (!deviceId || !destination || !operator) {
      toast.error("请填写必填项");
      return;
    }

    const selectedDevice = devices?.find((d) => d.id === deviceId);
    if (!selectedDevice) {
      toast.error("设备不存在");
      return;
    }

    const outboundItems: OutboundItem = { ...items };
    if (printerModel && paperType && items.paperQuantity) {
      outboundItems.printerModel = printerModel;
      outboundItems.paperType = paperType;
      outboundItems.paperQuantity = items.paperQuantity;
    }

    // 如果是DNP型号且未选择设备，显示警告（但允许继续）
    if (printerModel && printerModel.startsWith('DNP-') && !selectedDeviceInstance) {
      toast.warning('提醒：DNP 打印机建议选择具体设备，确保相纸与打印机匹配', {
        duration: 3000
      });
    }

    const result = await createOutboundRecord({
      deviceId,
      deviceName: selectedDevice.name,
      destination,
      operator,
      items: outboundItems,
      notes,
      deviceInstanceId: selectedDeviceInstance || undefined,
    });

    if (result.success) {
      const syncMsg = selectedDeviceInstance 
        ? `，已自动更新 ${selectedDeviceInstance} 状态为外放` 
        : '';
      toast.success(`出库记录已创建${syncMsg}`);
      setDeviceId("");
      setDestination("");
      setOperator("");
      setPrinterModel("");
      setPaperType("");
      setItems({});
      setNotes("");
      setSelectedDeviceInstance("");
      refetchRecords();
    } else {
      toast.error(result.error || "库存不足或创建失败");
    }
  };

  const handleReturnSubmit = async () => {
    if (!returningRecordId || !returnOperator) {
      toast.error("请填写归还操作员");
      return;
    }

    const result = await returnOutboundItems(returningRecordId, {
      returnOperator,
      returnedItems,
      equipmentDamage: equipmentDamage || undefined,
      returnNotes: returnNotes || undefined,
    });

    if (result.success) {
      toast.success("归还记录已创建");
      setReturningRecordId(null);
      setReturningRecord(null);
      setReturnOperator("");
      setReturnedItems({});
      setEquipmentDamage("");
      setReturnNotes("");
      refetchRecords();
    } else {
      toast.error(result.error || "归还失败");
    }
  };

  const startReturn = (record: any) => {
    setReturningRecordId(record.id);
    setReturningRecord(record);
    setReturnedItems({ ...record.items });
  };

  const handleReturnItemChange = (
    key: keyof OutboundItem,
    value: string | number,
  ) => {
    setReturnedItems((prev) => ({
      ...prev,
      [key]: typeof value === "string" ? parseInt(value) || 0 : value,
    }));
  };

  const openDeleteDialog = (record: OutboundRecord) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteRecord = async (record: OutboundRecord) => {
    const result = await deleteOutboundRecord(record.id);
    if (result.success) {
      toast.success("出库记录已删除");
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      queryClient.setQueryData<OutboundRecord[] | undefined>(
        ["outboundRecords"],
        (old) => old?.filter((item) => item.id !== record.id),
      );
      await refetchRecords();
    } else {
      toast.error(result.error || "删除失败，请稍后重试");
    }
  };

  if (!inventory) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">出库管理</h1>
          <p className="text-muted-foreground">统一记录设备和配件出库</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          {showHistory ? "返回出库" : "出库历史"}
        </Button>
      </div>

      {returningRecordId ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackagePlus className="w-5 h-5" />
              归还物资 - {returningRecord?.deviceName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-blue-900">出库信息</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">出库时间：</span>
                  <span>{returningRecord && new Date(returningRecord.date).toLocaleString("zh-CN")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">出库人员：</span>
                  <span>{returningRecord?.operator}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">目的地：</span>
                  <span>{returningRecord?.destination}</span>
                </div>
              </div>
            </div>

            <div>
              <Label>归还操作员 *</Label>
              <Input
                data-testid="return-operator"
                value={returnOperator}
                onChange={(e) => setReturnOperator(e.target.value)}
                placeholder="例如：张三"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">物资归还清点</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-3 text-sm font-semibold">物品名称</th>
                      <th className="text-center p-3 text-sm font-semibold">出库数量</th>
                      <th className="text-center p-3 text-sm font-semibold">归还数量</th>
                      <th className="text-center p-3 text-sm font-semibold">丢失/消耗</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returningRecord?.items.printerModel && returningRecord?.items.paperType && (
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">
                          相纸 ({getPrinterDisplayName(returningRecord.items.printerModel)} - {returningRecord.items.paperType})
                        </td>
                        <td className="p-3 text-center text-sm font-medium">
                          {returningRecord.items.paperQuantity || 0} 张
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            max={returningRecord.items.paperQuantity}
                            data-testid="return-paper-qty"
                            value={returnedItems.paperQuantity || ""}
                            onChange={(e) => handleReturnItemChange("paperQuantity", e.target.value)}
                            className="text-center"
                          />
                        </td>
                        <td className={`p-3 text-center text-sm font-medium ${
                          (returningRecord.items.paperQuantity || 0) - (returnedItems.paperQuantity || 0) > 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}>
                          {(returningRecord.items.paperQuantity || 0) - (returnedItems.paperQuantity || 0)} 张
                        </td>
                      </tr>
                    )}
                    {returningRecord?.items.routers !== undefined && (
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">路由器</td>
                        <td className="p-3 text-center text-sm font-medium">{returningRecord.items.routers} 台</td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            max={returningRecord.items.routers}
                            value={returnedItems.routers || ""}
                            onChange={(e) => handleReturnItemChange("routers", e.target.value)}
                            className="text-center"
                          />
                        </td>
                        <td className={`p-3 text-center text-sm font-medium ${
                          (returningRecord.items.routers || 0) - (returnedItems.routers || 0) > 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}>
                          {(returningRecord.items.routers || 0) - (returnedItems.routers || 0)} 台
                        </td>
                      </tr>
                    )}
                    {returningRecord?.items.powerStrips !== undefined && (
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">插板</td>
                        <td className="p-3 text-center text-sm font-medium">{returningRecord.items.powerStrips} 个</td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            max={returningRecord.items.powerStrips}
                            value={returnedItems.powerStrips || ""}
                            onChange={(e) => handleReturnItemChange("powerStrips", e.target.value)}
                            className="text-center"
                          />
                        </td>
                        <td className={`p-3 text-center text-sm font-medium ${
                          (returningRecord.items.powerStrips || 0) - (returnedItems.powerStrips || 0) > 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}>
                          {(returningRecord.items.powerStrips || 0) - (returnedItems.powerStrips || 0)} 个
                        </td>
                      </tr>
                    )}
                    {returningRecord?.items.usbCables !== undefined && (
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">USB线</td>
                        <td className="p-3 text-center text-sm font-medium">{returningRecord.items.usbCables} 根</td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            max={returningRecord.items.usbCables}
                            value={returnedItems.usbCables || ""}
                            onChange={(e) => handleReturnItemChange("usbCables", e.target.value)}
                            className="text-center"
                          />
                        </td>
                        <td className={`p-3 text-center text-sm font-medium ${
                          (returningRecord.items.usbCables || 0) - (returnedItems.usbCables || 0) > 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}>
                          {(returningRecord.items.usbCables || 0) - (returnedItems.usbCables || 0)} 根
                        </td>
                      </tr>
                    )}
                    {returningRecord?.items.networkCables !== undefined && (
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">网线</td>
                        <td className="p-3 text-center text-sm font-medium">{returningRecord.items.networkCables} 根</td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            max={returningRecord.items.networkCables}
                            value={returnedItems.networkCables || ""}
                            onChange={(e) => handleReturnItemChange("networkCables", e.target.value)}
                            className="text-center"
                          />
                        </td>
                        <td className={`p-3 text-center text-sm font-medium ${
                          (returningRecord.items.networkCables || 0) - (returnedItems.networkCables || 0) > 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}>
                          {(returningRecord.items.networkCables || 0) - (returnedItems.networkCables || 0)} 根
                        </td>
                      </tr>
                    )}
                    {returningRecord?.items.adapters !== undefined && (
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">电源适配器</td>
                        <td className="p-3 text-center text-sm font-medium">{returningRecord.items.adapters} 个</td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            max={returningRecord.items.adapters}
                            value={returnedItems.adapters || ""}
                            onChange={(e) => handleReturnItemChange("adapters", e.target.value)}
                            className="text-center"
                          />
                        </td>
                        <td className={`p-3 text-center text-sm font-medium ${
                          (returningRecord.items.adapters || 0) - (returnedItems.adapters || 0) > 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}>
                          {(returningRecord.items.adapters || 0) - (returnedItems.adapters || 0)} 个
                        </td>
                      </tr>
                    )}
                    {(returningRecord?.items.inkC || returningRecord?.items.inkM || returningRecord?.items.inkY || returningRecord?.items.inkK) && (
                      <>
                        {returningRecord.items.inkC !== undefined && (
                          <tr className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm">墨水 - 青色(C)</td>
                            <td className="p-3 text-center text-sm font-medium">{returningRecord.items.inkC} 瓶</td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                max={returningRecord.items.inkC}
                                value={returnedItems.inkC || ""}
                                onChange={(e) => handleReturnItemChange("inkC", e.target.value)}
                                className="text-center"
                              />
                            </td>
                            <td className={`p-3 text-center text-sm font-medium ${
                              (returningRecord.items.inkC || 0) - (returnedItems.inkC || 0) > 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}>
                              {(returningRecord.items.inkC || 0) - (returnedItems.inkC || 0)} 瓶
                            </td>
                          </tr>
                        )}
                        {returningRecord.items.inkM !== undefined && (
                          <tr className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm">墨水 - 品红(M)</td>
                            <td className="p-3 text-center text-sm font-medium">{returningRecord.items.inkM} 瓶</td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                max={returningRecord.items.inkM}
                                value={returnedItems.inkM || ""}
                                onChange={(e) => handleReturnItemChange("inkM", e.target.value)}
                                className="text-center"
                              />
                            </td>
                            <td className={`p-3 text-center text-sm font-medium ${
                              (returningRecord.items.inkM || 0) - (returnedItems.inkM || 0) > 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}>
                              {(returningRecord.items.inkM || 0) - (returnedItems.inkM || 0)} 瓶
                            </td>
                          </tr>
                        )}
                        {returningRecord.items.inkY !== undefined && (
                          <tr className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm">墨水 - 黄色(Y)</td>
                            <td className="p-3 text-center text-sm font-medium">{returningRecord.items.inkY} 瓶</td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                max={returningRecord.items.inkY}
                                value={returnedItems.inkY || ""}
                                onChange={(e) => handleReturnItemChange("inkY", e.target.value)}
                                className="text-center"
                              />
                            </td>
                            <td className={`p-3 text-center text-sm font-medium ${
                              (returningRecord.items.inkY || 0) - (returnedItems.inkY || 0) > 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}>
                              {(returningRecord.items.inkY || 0) - (returnedItems.inkY || 0)} 瓶
                            </td>
                          </tr>
                        )}
                        {returningRecord.items.inkK !== undefined && (
                          <tr className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm">墨水 - 黑色(K)</td>
                            <td className="p-3 text-center text-sm font-medium">{returningRecord.items.inkK} 瓶</td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                max={returningRecord.items.inkK}
                                value={returnedItems.inkK || ""}
                                onChange={(e) => handleReturnItemChange("inkK", e.target.value)}
                                className="text-center"
                              />
                            </td>
                            <td className={`p-3 text-center text-sm font-medium ${
                              (returningRecord.items.inkK || 0) - (returnedItems.inkK || 0) > 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}>
                              {(returningRecord.items.inkK || 0) - (returnedItems.inkK || 0)} 瓶
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <Label>设备损坏情况</Label>
              <textarea
                value={equipmentDamage}
                onChange={(e) => setEquipmentDamage(e.target.value)}
                placeholder="请详细描述设备的损坏情况，如有划痕、磕碰、功能异常等。如无损坏可留空。"
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              />
            </div>

            <div>
              <Label>归还备注</Label>
              <textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="其他需要说明的情况，如物品使用情况、异常消耗原因等"
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                data-testid="return-submit"
                onClick={handleReturnSubmit}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                提交归还
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setReturningRecordId(null);
                  setReturningRecord(null);
                  setReturnOperator("");
                  setReturnedItems({});
                  setEquipmentDamage("");
                  setReturnNotes("");
                }}
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : showHistory ? (
        <>
        <Card>
          <CardHeader>
            <CardTitle>出库历史记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {outboundRecords && outboundRecords.length > 0 ? (
                outboundRecords.map((record) => (
                  <div
                    key={record.id}
                    data-testid="outbound-record-card"
                    className={`border rounded-lg p-4 space-y-2 ${record.status === "returned" ? "bg-green-50" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{record.deviceName}</p>
                          {record.status === "returned" && (
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                              已归还
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          目的地: {record.destination}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.date).toLocaleString("zh-CN")}
                        </p>
                        <div className="flex items-center gap-2">
                          {record.status === "outbound" && (
                            <Button
                              data-testid="outbound-return-button"
                              size="sm"
                              variant="outline"
                              onClick={() => startReturn(record)}
                            >
                              归还
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid="outbound-delete-button"
                            aria-label="删除出库记录"
                            onClick={() => openDeleteDialog(record)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p>操作员: {record.operator}</p>
                      {record.items.printerModel && (
                        <p>
                          打印机:{" "}
                          {getPrinterDisplayName(record.items.printerModel)} -{" "}
                          {record.items.paperType} ×{" "}
                          {record.items.paperQuantity}张
                        </p>
                      )}
                      {record.items.routers && (
                        <p>路由器: {record.items.routers}台</p>
                      )}
                      {record.items.powerStrips && (
                        <p>插板: {record.items.powerStrips}个</p>
                      )}
                      {record.items.usbCables && (
                        <p>USB线: {record.items.usbCables}根</p>
                      )}
                      {record.items.networkCables && (
                        <p>网线: {record.items.networkCables}根</p>
                      )}
                      {record.items.adapters && (
                        <p>电源适配器: {record.items.adapters}个</p>
                      )}
                      {(record.items.inkC ||
                        record.items.inkM ||
                        record.items.inkY ||
                        record.items.inkK) && (
                        <p>
                          墨水: C×{record.items.inkC || 0} M×
                          {record.items.inkM || 0} Y×{record.items.inkY || 0} K×
                          {record.items.inkK || 0}
                        </p>
                      )}
                      {record.notes && (
                        <p className="text-muted-foreground">
                          出库备注: {record.notes}
                        </p>
                      )}

                      {record.returnInfo && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="font-medium text-green-700">归还信息</p>
                          <p>
                            归还时间:{" "}
                            {new Date(
                              record.returnInfo.returnDate,
                            ).toLocaleString("zh-CN")}
                          </p>
                          <p>归还操作员: {record.returnInfo.returnOperator}</p>
                          {record.returnInfo.equipmentDamage && (
                            <p className="text-red-600">
                              损坏情况: {record.returnInfo.equipmentDamage}
                            </p>
                          )}
                          {record.returnInfo.returnNotes && (
                            <p className="text-muted-foreground">
                              归还备注: {record.returnInfo.returnNotes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  暂无出库记录
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除出库记录</AlertDialogTitle>
              <AlertDialogDescription>
                {recordToDelete
                  ? `删除后将无法恢复记录“${recordToDelete.deviceName} → ${recordToDelete.destination}”。库存数据不会自动回滚，请谨慎操作。`
                  : "删除后将无法恢复该记录。"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                data-testid="outbound-delete-confirm"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => recordToDelete && handleDeleteRecord(recordToDelete)}
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageMinus className="w-5 h-5" />
                出库信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>设备 *</Label>
                <Select value={deviceId} onValueChange={setDeviceId}>
                  <SelectTrigger data-testid="outbound-device-select">
                    <SelectValue placeholder="选择设备" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices?.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name} - {device.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>目的地 *</Label>
                <Input
                  data-testid="outbound-destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="例如：上海展厅"
                />
              </div>

              <div>
                <Label>操作员 *</Label>
                <Input
                  data-testid="outbound-operator"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="例如：张三"
                />
              </div>

              <div>
                <Label>备注</Label>
                <Input
                  data-testid="outbound-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="可选"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>打印机与相纸</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>打印机型号</Label>
                <Select
                  value={printerModel}
                  onValueChange={handlePrinterModelChange}
                >
                  <SelectTrigger data-testid="outbound-printer-select">
                    <SelectValue placeholder="选择打印机型号" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(inventory.paperStock).sort((a, b) => {
                      // 定义打印机型号的显示顺序
                      const order = [
                        'DNP-自购',
                        'DNP-锦联',
                        'DNP-微印创',
                        'EPSON-L8058',
                        'EPSON-L18058',
                        '西铁城CX-02',
                        'HITI诚研P525L'
                      ];
                      const indexA = order.indexOf(a);
                      const indexB = order.indexOf(b);
                      // 如果型号在order中，按order排序；否则放到最后按字母排序
                      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                      if (indexA !== -1) return -1;
                      if (indexB !== -1) return 1;
                      return a.localeCompare(b, 'zh-CN');
                    }).map((model) => (
                      <SelectItem key={model} value={model}>
                        {getPrinterDisplayName(model as PrinterModel)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 设备选择（可选） */}
              {printerModel && (
                <div>
                  <Label>携带打印机设备（可选）</Label>
                  {printerModel.startsWith('DNP-') && (
                    <p className="text-xs text-amber-600 mb-2">
                      💡 提示：DNP 打印机建议选择对应设备，确保相纸与打印机匹配
                    </p>
                  )}
                  <Select
                    value={selectedDeviceInstance}
                    onValueChange={setSelectedDeviceInstance}
                  >
                    <SelectTrigger data-testid="outbound-device-instance-select">
                      <SelectValue placeholder="选择具体设备或仅出库相纸" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">仅出库相纸，不带打印机实体</SelectItem>
                      {getAvailableDevices().map((instance) => (
                        <SelectItem key={instance.id} value={instance.id}>
                          {instance.id} ({instance.location} · 在库)
                        </SelectItem>
                      ))}
                      {getAvailableDevices().length === 0 && (
                        <SelectItem value="__no_devices__" disabled>
                          暂无在库设备
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {printerModel && (
                <>
                  <div>
                    <Label>相纸类型</Label>
                    <Select value={paperType} onValueChange={setPaperType}>
                      <SelectTrigger data-testid="outbound-paper-type">
                        <SelectValue placeholder="选择相纸类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {getPaperTypes(printerModel).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type} (库存:{" "}
                            {inventory.paperStock[printerModel][type]}张)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>相纸数量</Label>
                    <Input
                      type="number"
                      min="0"
                      data-testid="outbound-paper-qty"
                      value={items.paperQuantity || ""}
                      onChange={(e) =>
                        handleItemChange("paperQuantity", e.target.value)
                      }
                      placeholder="张"
                    />
                  </div>

                  {printerModel.startsWith("EPSON") && (
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">青色墨水</Label>
                        <Input
                          type="number"
                          min="0"
                          max={inventory.epsonInkStock.C}
                          value={items.inkC || ""}
                          onChange={(e) =>
                            handleItemChange("inkC", e.target.value)
                          }
                          placeholder="瓶"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">品红墨水</Label>
                        <Input
                          type="number"
                          min="0"
                          max={inventory.epsonInkStock.M}
                          value={items.inkM || ""}
                          onChange={(e) =>
                            handleItemChange("inkM", e.target.value)
                          }
                          placeholder="瓶"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">黄色墨水</Label>
                        <Input
                          type="number"
                          min="0"
                          max={inventory.epsonInkStock.Y}
                          value={items.inkY || ""}
                          onChange={(e) =>
                            handleItemChange("inkY", e.target.value)
                          }
                          placeholder="瓶"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">黑色墨水</Label>
                        <Input
                          type="number"
                          min="0"
                          max={inventory.epsonInkStock.K}
                          value={items.inkK || ""}
                          onChange={(e) =>
                            handleItemChange("inkK", e.target.value)
                          }
                          placeholder="瓶"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>其他配件</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                <div>
                  <Label>路由器</Label>
                  <Input
                    type="number"
                    min="0"
                    max={inventory.equipmentStock.routers}
                    value={items.routers || ""}
                    onChange={(e) =>
                      handleItemChange("routers", e.target.value)
                    }
                    placeholder={`库存: ${inventory.equipmentStock.routers}`}
                  />
                </div>
                <div>
                  <Label>插板</Label>
                  <Input
                    type="number"
                    min="0"
                    max={inventory.equipmentStock.powerStrips}
                    value={items.powerStrips || ""}
                    onChange={(e) =>
                      handleItemChange("powerStrips", e.target.value)
                    }
                    placeholder={`库存: ${inventory.equipmentStock.powerStrips}`}
                  />
                </div>
                <div>
                  <Label>USB线</Label>
                  <Input
                    type="number"
                    min="0"
                    max={inventory.equipmentStock.usbCables}
                    value={items.usbCables || ""}
                    onChange={(e) =>
                      handleItemChange("usbCables", e.target.value)
                    }
                    placeholder={`库存: ${inventory.equipmentStock.usbCables}`}
                  />
                </div>
                <div>
                  <Label>网线</Label>
                  <Input
                    type="number"
                    min="0"
                    max={inventory.equipmentStock.networkCables}
                    value={items.networkCables || ""}
                    onChange={(e) =>
                      handleItemChange("networkCables", e.target.value)
                    }
                    placeholder={`库存: ${inventory.equipmentStock.networkCables}`}
                  />
                </div>
                <div>
                  <Label>电源适配器</Label>
                  <Input
                    type="number"
                    min="0"
                    max={inventory.equipmentStock.adapters}
                    value={items.adapters || ""}
                    onChange={(e) =>
                      handleItemChange("adapters", e.target.value)
                    }
                    placeholder={`库存: ${inventory.equipmentStock.adapters}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 flex justify-end">
            <Button
              data-testid="outbound-submit"
              onClick={handleSubmit}
              size="lg"
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              提交出库记录
            </Button>
          </div>
        </div>
      )}

      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              提示：提交出库记录后，系统会自动从库存中扣除相应的物资数量。请确保填写的数量准确无误。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
