import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AlertTriangle, Info, CheckCircle, HelpCircle } from 'lucide-react';

interface KnowledgePageProps {
  pageId: string;
}

export function KnowledgePage({ pageId }: KnowledgePageProps) {
  const renderAnnouncementsPage = () => (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="mb-6">公告</h1>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg">系统维护通知</CardTitle>
              <Badge variant="outline">2025-10-01</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p>设备管理系统将于2025年10月15日凌晨2:00-4:00进行系统升级维护，期间可能影响设备状态同步。请各位负责人提前做好相关准备。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-lg">耗材采购提醒</CardTitle>
              <Badge variant="outline">2025-09-28</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p>根据各设备墨水余量监控，建议在本月底前统一采购以下耗材：</p>
            <ul className="mt-2 ml-4 space-y-1">
              <li>• EPSON原装墨盒 C/M/Y/K 各10个</li>
              <li>• A4相纸 20包</li>
              <li>• A3相纸 15包</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <CardTitle className="text-lg">新设备上线</CardTitle>
              <Badge variant="outline">2025-09-15</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p>新采购的魔镜7号设备已完成部署，分别安装在杭州展厅、上海展厅和深圳展厅。请相关负责人及时完成设备验收和培训。</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSoftwareGuidePage = () => (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="mb-6">软件操作指南</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="mb-4">系统登录</h2>
          <div className="space-y-4">
            <h3>登录步骤</h3>
            <ol className="ml-6 space-y-2 list-decimal">
              <li>打开设备管理系统网址</li>
              <li>输入用户名和密码</li>
              <li>点击"登录"按钮进入系统</li>
              <li>首次登录需要修改默认密码</li>
            </ol>
            
            <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-muted-foreground">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1570894808314-677b57f25e45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2dpbiUyMHNjcmVlbiUyMGludGVyZmFjZXxlbnwxfHx8fDE3NTk2Njk2OTR8MA&ixlib=rb-4.1.0&q=80&w=1080" 
                alt="登录界面示意图"
                className="w-full max-w-md h-48 object-cover rounded mb-2 mx-auto"
              />
              登录界面示意图
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4">设备监控</h2>
          <div className="space-y-4">
            <h3>实时状态查看</h3>
            <ul className="ml-6 space-y-2 list-disc">
              <li>在首页可查看所有设备的实时状态</li>
              <li>绿色表示设备运行正常</li>
              <li>橙色表示设备正在维护</li>
              <li>灰色表示设备离线</li>
            </ul>
            
            <h3>状态筛选</h3>
            <ul className="ml-6 space-y-2 list-disc">
              <li>使用顶部筛选器按状态、位置等条件筛选设备</li>
              <li>使用搜索框快速查找特定设备</li>
              <li>点击列标题可对设备列表进行排序</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="mb-4">维护管理</h2>
          <div className="space-y-4">
            <h3>添加维护记录</h3>
            <ol className="ml-6 space-y-2 list-decimal">
              <li>进入设备详情页面</li>
              <li>点击"添加维护"按钮</li>
              <li>填写维护类型和内容</li>
              <li>确认提交记录</li>
            </ol>
            
            <h3>故障报修</h3>
            <ol className="ml-6 space-y-2 list-decimal">
              <li>点击"报修"按钮</li>
              <li>详细描述故障现象</li>
              <li>填写联系人信息</li>
              <li>提交故障报告</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );

  const renderPrinterGuidePage = () => (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="mb-6">打印机操作指南</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="mb-4">EPSON-L8058 (A4) 操作指南</h2>
          <div className="space-y-4">
            <h3>日常操作</h3>
            <ol className="ml-6 space-y-2 list-decimal">
              <li>检查打印机电源是否正常</li>
              <li>确认Wi-Fi连接状态</li>
              <li>检查A4相纸余量</li>
              <li>查看墨水液位指示</li>
            </ol>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-muted-foreground">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1630327722923-5ebd594ddda9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlcHNvbiUyMHByaW50ZXJ8ZW58MXx8fHwxNzU5NjY5Njg4fDA&ixlib=rb-4.1.0&q=80&w=1080" 
                  alt="EPSON-L8058操作面板"
                  className="w-full h-32 object-cover rounded mb-2"
                />
                EPSON-L8058操作面板
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-muted-foreground">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1723672947453-e6d09052bdf3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXBlciUyMGxvYWRpbmclMjBwcmludGVyfGVufDF8fHx8MTc1OTY2OTY5MHww&ixlib=rb-4.1.0&q=80&w=1080" 
                  alt="A4相纸装载示意"
                  className="w-full h-32 object-cover rounded mb-2"
                />
                A4相纸装载示意
              </div>
            </div>
            
            <h3>墨水更换步骤</h3>
            <ol className="ml-6 space-y-2 list-decimal">
              <li>打开打印机前盖</li>
              <li>等待墨盒移动到更换位置</li>
              <li>按压旧墨盒取出</li>
              <li>安装新墨盒并确认卡扣到位</li>
              <li>关闭前盖，运行清洁程序</li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="mb-4">EPSON-L18058 (A3) 操作指南</h2>
          <div className="space-y-4">
            <h3>日常操作</h3>
            <ol className="ml-6 space-y-2 list-decimal">
              <li>检查USB连接线是否牢固</li>
              <li>确认A3纸张正确放置</li>
              <li>调整导轨宽度匹配纸张尺寸</li>
              <li>检查各色墨水余量</li>
            </ol>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-muted-foreground">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1630327722923-5ebd594ddda9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlcHNvbiUyMHByaW50ZXJ8ZW58MXx8fHwxNzU5NjY5Njg4fDA&ixlib=rb-4.1.0&q=80&w=1080" 
                  alt="EPSON-L18058外观"
                  className="w-full h-32 object-cover rounded mb-2"
                />
                EPSON-L18058外观
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-muted-foreground">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1723672947453-e6d09052bdf3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXBlciUyMGxvYWRpbmclMjBwcmludGVyfGVufDF8fHx8MTc1OTY2OTY5MHww&ixlib=rb-4.1.0&q=80&w=1080" 
                  alt="A3相纸装载示意"
                  className="w-full h-32 object-cover rounded mb-2"
                />
                A3相纸装载示意
              </div>
            </div>
            
            <h3>导轨调整</h3>
            <ol className="ml-6 space-y-2 list-decimal">
              <li>轻轻推开左右导轨</li>
              <li>将A3纸张居中放入</li>
              <li>调整导轨贴合纸张边缘</li>
              <li>确保纸张可以顺畅进纸</li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="mb-4">常见问题处理</h2>
          <div className="space-y-4">
            <h3>打印质量问题</h3>
            <ul className="ml-6 space-y-2 list-disc">
              <li>出现条纹：运行打印头清洁程序</li>
              <li>颜色偏差：检查墨水余量，更换相应墨盒</li>
              <li>图像模糊：检查纸张类型设置</li>
            </ul>
            
            <h3>进纸问题</h3>
            <ul className="ml-6 space-y-2 list-disc">
              <li>卡纸：关闭打印机，小心取出卡住的纸张</li>
              <li>无法进纸：检查纸张是否正确放置</li>
              <li>进纸倾斜：调整导轨位置</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );

  const renderTroubleshootingPage = () => (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="mb-6">故障处理与应急</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="mb-4">设备故障处理</h2>
          <div className="space-y-4">
            <h3>设备无法启动</h3>
            <ol className="ml-6 space-y-2 list-decimal">
              <li>检查电源线连接是否正常</li>
              <li>确认电源插座有电</li>
              <li>尝试更换电源线</li>
              <li>如仍无法启动，联系技术支持</li>
            </ol>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-800">紧急处理</span>
              </div>
              <p className="text-red-700 text-sm">
                如遇设备冒烟、异常响声等危险情况，立即断开电源，疏散人员，联系安全管理部门。
              </p>
            </div>
            
            <h3>网络连接问题</h3>
            <ol className="ml-6 space-y-2 list-decimal">
              <li>检查网络线连接状态</li>
              <li>重启网络设备</li>
              <li>检查IP地址配置</li>
              <li>联系网络管理员</li>
            </ol>
            
            <h3>软件运行异常</h3>
            <ol className="ml-6 space-y-2 list-decimal">
              <li>重启应用程序</li>
              <li>检查系统资源占用</li>
              <li>查看错误日志</li>
              <li>重启操作系统</li>
              <li>联系软件技术支持</li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="mb-4">打印机故障处理</h2>
          <div className="space-y-4">
            <h3>打印机离线</h3>
            <ol className="ml-6 space-y-2 list-decimal">
              <li>检查打印机电源状态</li>
              <li>确认连接线是否松动</li>
              <li>重新安装打印机驱动</li>
              <li>重启打印服务</li>
            </ol>
            
            <h3>打印质量问题</h3>
            <ol className="ml-6 space-y-2 list-decimal">
              <li>运行打印头清洁程序</li>
              <li>检查墨水余量</li>
              <li>更换墨盒</li>
              <li>调整打印质量设置</li>
            </ol>
            
            <h3>卡纸处理</h3>
            <ol className="ml-6 space-y-2 list-decimal">
              <li>关闭打印机电源</li>
              <li>打开打印机盖板</li>
              <li>小心取出卡住的纸张</li>
              <li>检查纸张路径是否有异物</li>
              <li>重新启动打印机</li>
            </ol>

            <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-muted-foreground">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1630327722923-5ebd594ddda9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlcHNvbiUyMHByaW50ZXJ8ZW58MXx8fHwxNzU5NjY5Njg4fDA&ixlib=rb-4.1.0&q=80&w=1080" 
                alt="卡纸处理示意图"
                className="w-full max-w-md h-48 object-cover rounded mb-2 mx-auto"
              />
              卡纸处理示意图
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4">应急联系方式</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">技术支持</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>服务热线:</span>
                  <span>400-123-4567</span>
                </div>
                <div className="flex justify-between">
                  <span>工作时间:</span>
                  <span>7×24小时</span>
                </div>
                <div className="flex justify-between">
                  <span>邮箱:</span>
                  <span>support@company.com</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">硬件维修</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>服务热线:</span>
                  <span>400-789-0123</span>
                </div>
                <div className="flex justify-between">
                  <span>工作时间:</span>
                  <span>9:00-18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>邮箱:</span>
                  <span>repair@company.com</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );

  const renderFAQPage = () => (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="mb-6">常见问题</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="mb-4">设备使用问题</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="w-4 h-4" />
                  设备开机后显示屏无显示怎么办？
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>请按以下步骤排查：</p>
                <ol className="mt-2 ml-4 space-y-1 list-decimal">
                  <li>检查显示器电源线是否连接正常</li>
                  <li>确认显示器电源开关是否开启</li>
                  <li>检查显示器与主机的连接线</li>
                  <li>尝试更换显示器连接线</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="w-4 h-4" />
                  系统运行缓慢怎么处理？
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>可能的原因和解决方法：</p>
                <ul className="mt-2 ml-4 space-y-1 list-disc">
                  <li>检查内存使用率，关闭不必要的程序</li>
                  <li>清理系统临时文件</li>
                  <li>检查硬盘剩余空间</li>
                  <li>运行系统优化工具</li>
                  <li>如问题持续，联系技术支持</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="mb-4">打印机问题</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="w-4 h-4" />
                  打印出来的照片颜色不正确？
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>可能的解决方法：</p>
                <ul className="mt-2 ml-4 space-y-1 list-disc">
                  <li>检查各色墨水余量，更换墨水不足的墨盒</li>
                  <li>运行打印头清洁程序</li>
                  <li>确认使用的是原装墨盒</li>
                  <li>检查纸张类型设置是否正确</li>
                  <li>校准打印机颜色</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="w-4 h-4" />
                  如何更换墨盒？
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>更换步骤：</p>
                <ol className="mt-2 ml-4 space-y-1 list-decimal">
                  <li>确保打印机电源开启</li>
                  <li>打开打印机前盖</li>
                  <li>等待墨盒架移动到更换位置</li>
                  <li>按压需要更换的墨盒，向上提起取出</li>
                  <li>撕掉新墨盒的保护胶带</li>
                  <li>将新墨盒插入对应位置，按下卡紧</li>
                  <li>关闭前盖，打印机会自动进行初始化</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="mb-4">系统操作问题</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="w-4 h-4" />
                  忘记登录密码怎么办？
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>请联系系统管理员重置密码，或通过以下方式找回：</p>
                <ul className="mt-2 ml-4 space-y-1 list-disc">
                  <li>使用"忘记密码"功能发送重置邮件</li>
                  <li>联系IT部门：ext-1234</li>
                  <li>带身份证明到IT部门现场重置</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="w-4 h-4" />
                  如何导出设备数据？
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>导出步骤：</p>
                <ol className="mt-2 ml-4 space-y-1 list-decimal">
                  <li>登录设备管理系统</li>
                  <li>在首页点击"导出CSV"按钮</li>
                  <li>选择需要导出的数据范围</li>
                  <li>确认导出，系统会自动下载文件</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );

  switch (pageId) {
    case 'announcements':
      return renderAnnouncementsPage();
    case 'software-guide':
      return renderSoftwareGuidePage();
    case 'printer-guide':
      return renderPrinterGuidePage();
    case 'troubleshooting':
      return renderTroubleshootingPage();
    case 'faq':
      return renderFAQPage();
    default:
      return (
        <div className="p-6">
          <p>页面内容开发中...</p>
        </div>
      );
  }
}