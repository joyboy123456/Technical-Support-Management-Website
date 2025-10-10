// src/stories/SOPPanel.stories.tsx
// SOPPanel Storybook 故事

import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SOPPanel } from '../components/SOPPanel'

// 创建测试用的 QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

// Mock 数据
const mockSOPs = [
  {
    id: 'sop-epson-install',
    title: 'EPSON L8058 装箱检查',
    asset_type: '打印机',
    brand: 'EPSON',
    model: 'L8058',
    steps: [
      { step: '检查外包装是否完整', completed: false },
      { step: '清点配件：电源线、USB线、说明书', completed: false },
      { step: '检查打印机外观无划痕', completed: false },
      { step: '通电测试打印机状态', completed: false },
      { step: '安装墨盒并执行清洗程序', completed: false },
      { step: '打印测试页确认打印质量', completed: false }
    ]
  },
  {
    id: 'sop-huawei-reset',
    title: '华为路由器恢复出厂设置',
    asset_type: '路由器',
    brand: '华为',
    model: 'ALL',
    steps: [
      { step: '确认路由器处于开机状态', completed: true, completedAt: '2024-10-08T10:30:00Z', completedBy: '技术员A' },
      { step: '找到Reset按钮位置', completed: true, completedAt: '2024-10-08T10:31:00Z', completedBy: '技术员A' },
      { step: '长按Reset按钮10秒直到指示灯闪烁', completed: false },
      { step: '等待路由器重启完成(约2分钟)', completed: false },
      { step: '使用默认管理员账号admin/admin登录', completed: false },
      { step: '重新配置WiFi名称和密码', completed: false },
      { step: '更新管理员密码', completed: false }
    ]
  }
]

// 包装器组件
const SOPPanelWrapper = (props: any) => {
  // Mock useQuery for SOP data
  React.useEffect(() => {
    // 模拟数据加载
    queryClient.setQueryData(['sops', props.assetType, props.brand, props.model], mockSOPs)
  }, [props.assetType, props.brand, props.model])

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ maxWidth: '400px' }}>
        <SOPPanel {...props} />
      </div>
    </QueryClientProvider>
  )
}

const meta: Meta<typeof SOPPanel> = {
  title: 'Components/SOPPanel',
  component: SOPPanelWrapper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'SOP（标准操作程序）面板组件，展示设备相关的操作流程和进度跟踪'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    assetId: {
      control: 'text',
      description: '资产ID'
    },
    assetType: {
      control: 'select',
      options: ['打印机', '路由器', '机器', '物联网卡'],
      description: '资产类型'
    },
    brand: {
      control: 'text',
      description: '设备品牌'
    },
    model: {
      control: 'text',
      description: '设备型号'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// EPSON 打印机装箱检查流程
export const EpsonInstallation: Story = {
  args: {
    assetId: 'printer-epson-001',
    assetType: '打印机',
    brand: 'EPSON',
    model: 'L8058'
  },
  parameters: {
    docs: {
      description: {
        story: 'EPSON 打印机的标准装箱检查流程，包含6个关键步骤'
      }
    }
  }
}

// 华为路由器恢复出厂设置流程（部分完成）
export const HuaweiRouterReset: Story = {
  args: {
    assetId: 'router-huawei-001',
    assetType: '路由器',
    brand: '华为',
    model: 'AR6300'
  },
  parameters: {
    docs: {
      description: {
        story: '华为路由器恢复出厂设置流程，显示部分步骤已完成的状态'
      }
    }
  }
}

// 无相关SOP的设备
export const NoSOPAvailable: Story = {
  args: {
    assetId: 'device-unknown-001',
    assetType: '机器',
    brand: '未知品牌',
    model: '测试型号'
  },
  parameters: {
    docs: {
      description: {
        story: '没有相关SOP的设备，显示空状态提示'
      }
    }
  }
}

// 全部完成的SOP
export const CompletedSOP: Story = {
  args: {
    assetId: 'printer-completed-001',
    assetType: '打印机',
    brand: 'EPSON',
    model: 'L8058'
  },
  parameters: {
    docs: {
      description: {
        story: '所有步骤都已完成的SOP，显示100%完成状态'
      }
    }
  }
}

// 包含备注的SOP步骤
export const SOPWithNotes: Story = {
  args: {
    assetId: 'router-notes-001',
    assetType: '路由器',
    brand: '华为',
    model: 'AR6300'
  },
  parameters: {
    docs: {
      description: {
        story: '包含详细完成备注的SOP步骤，展示执行过程中的注意事项'
      }
    }
  }
}

// 多个SOP流程
export const MultipleSOP: Story = {
  args: {
    assetId: 'device-multi-001',
    assetType: '打印机',
    brand: 'EPSON',
    model: 'L8058'
  },
  parameters: {
    docs: {
      description: {
        story: '设备有多个相关SOP流程，用户可以展开/折叠不同的流程'
      }
    }
  }
}

// 错误状态 - 无法加载SOP
export const LoadingError: Story = {
  args: {
    assetId: 'device-error-001',
    assetType: '打印机',
    brand: 'EPSON',
    model: 'L8058'
  },
  parameters: {
    docs: {
      description: {
        story: 'SOP数据加载失败的错误状态'
      }
    }
  }
}

// 加载中状态
export const Loading: Story = {
  args: {
    assetId: 'device-loading-001',
    assetType: '打印机',
    brand: 'EPSON',
    model: 'L8058'
  },
  parameters: {
    docs: {
      description: {
        story: 'SOP数据加载中的状态，显示骨架屏'
      }
    }
  }
}