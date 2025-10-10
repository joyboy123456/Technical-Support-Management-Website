// src/stories/ActionModal.stories.tsx
// ActionModal Storybook 故事

import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ActionModal } from '../components/ActionModal'

// 创建测试用的 QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

// 包装器组件
const ActionModalWrapper = (props: any) => (
  <QueryClientProvider client={queryClient}>
    <ActionModal {...props} />
  </QueryClientProvider>
)

const meta: Meta<typeof ActionModal> = {
  title: 'Components/ActionModal',
  component: ActionModalWrapper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '单据操作对话框组件，支持各种设备操作和库存管理'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: '对话框是否打开'
    },
    onClose: {
      action: 'closed',
      description: '关闭对话框的回调'
    },
    onSuccess: {
      action: 'success',
      description: '操作成功的回调'
    }
  },
  args: {
    onClose: fn(),
    onSuccess: fn()
  }
}

export default meta
type Story = StoryObj<typeof meta>

// 默认空态 - 无上下文设备
export const Default: Story = {
  args: {
    open: true,
    defaultValues: {}
  },
  parameters: {
    docs: {
      description: {
        story: '默认状态的ActionModal，用户需要手动选择操作类型和目标设备'
      }
    }
  }
}

// 设备借用场景
export const DeviceBorrow: Story = {
  args: {
    open: true,
    defaultValues: {
      action_type: '借用',
      asset_type: '打印机',
      by_user: '技术员'
    },
    contextAsset: {
      id: 'printer-001',
      type: '打印机',
      name: 'EPSON L8058 (展厅)',
      model_id: 'epson-l8058-model'
    }
  },
  parameters: {
    docs: {
      description: {
        story: '设备借用场景，已预选设备和操作类型，用户只需填写借用人和目标位置'
      }
    }
  }
}

// 设备调拨场景
export const DeviceTransfer: Story = {
  args: {
    open: true,
    defaultValues: {
      action_type: '调拨',
      asset_type: '打印机',
      by_user: '管理员'
    },
    contextAsset: {
      id: 'printer-002',
      type: '打印机',
      name: 'DNP DS40 (仓库)',
      model_id: 'dnp-ds40-model'
    }
  },
  parameters: {
    docs: {
      description: {
        story: '设备调拨场景，支持在不同位置间转移设备'
      }
    }
  }
}

// 耗材更换场景 - 包含兼容性检查
export const ConsumableReplacement: Story = {
  args: {
    open: true,
    defaultValues: {
      action_type: '安装',
      asset_type: '打印机',
      by_user: '技术员'
    },
    contextAsset: {
      id: 'printer-dnp-001',
      type: '打印机',
      name: 'DNP DS40 专业打印机',
      model_id: 'dnp-ds40-model'
    }
  },
  parameters: {
    docs: {
      description: {
        story: '耗材更换场景，展示兼容性检查功能。DNP打印机只支持专码，选择通码时会显示错误提示'
      }
    }
  }
}

// 设备报修场景
export const DeviceRepair: Story = {
  args: {
    open: true,
    defaultValues: {
      action_type: '报修',
      asset_type: '打印机',
      to_location_id: 'repair-center',
      by_user: '技术员'
    },
    contextAsset: {
      id: 'printer-003',
      type: '打印机',
      name: '西铁城 CX-02 (故障)',
      model_id: 'citizen-cx02-model'
    }
  },
  parameters: {
    docs: {
      description: {
        story: '设备报修场景，设备将被转移到维修中心'
      }
    }
  }
}

// 耗材领用场景
export const ConsumableRequisition: Story = {
  args: {
    open: true,
    defaultValues: {
      action_type: '耗材领用',
      qty: 10,
      from_location_id: 'warehouse',
      to_location_id: 'showroom',
      by_user: '技术员'
    }
  },
  parameters: {
    docs: {
      description: {
        story: '耗材领用场景，支持库存数量验证和位置间转移'
      }
    }
  }
}

// 错误状态 - 兼容性检查失败
export const CompatibilityError: Story = {
  args: {
    open: true,
    defaultValues: {
      action_type: '安装',
      asset_type: '打印机',
      consumable_id: 'ribbon-001',
      code_type: '通码',
      by_user: '技术员'
    },
    contextAsset: {
      id: 'printer-dnp-002',
      type: '打印机',
      name: 'DNP DS40 (兼容性测试)',
      model_id: 'dnp-ds40-model'
    }
  },
  parameters: {
    docs: {
      description: {
        story: '兼容性检查失败状态，展示错误提示和禁用确认按钮'
      }
    }
  }
}

// 加载状态
export const Loading: Story = {
  args: {
    open: true,
    defaultValues: {
      action_type: '调拨',
      asset_type: '打印机',
      by_user: '技术员'
    }
  },
  parameters: {
    docs: {
      description: {
        story: '操作提交中的加载状态，确认按钮显示加载动画'
      }
    }
  }
}

// 复杂工单场景
export const ComplexWorkOrder: Story = {
  args: {
    open: true,
    defaultValues: {
      action_type: '安装',
      asset_type: '打印机',
      work_order: 'WO-2024-001',
      related_person: '张工程师',
      by_user: '安装团队',
      remark: '客户现场安装，需要配置网络和测试打印'
    },
    contextAsset: {
      id: 'printer-004',
      type: '打印机',
      name: '诚研 PS25L 便携式打印机',
      model_id: 'chenyan-ps25l-model'
    }
  },
  parameters: {
    docs: {
      description: {
        story: '复杂工单场景，包含完整的工单信息、执行人和详细备注'
      }
    }
  }
}