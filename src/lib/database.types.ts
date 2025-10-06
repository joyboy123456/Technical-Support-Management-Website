export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      devices: {
        Row: {
          id: string
          name: string
          model: string
          serial: string
          os: string
          location: string
          owner: string
          status: '运行中' | '离线' | '维护'
          printer_model: string
          printer_paper: 'A4' | 'A3'
          printer_connect: 'USB' | 'Wi-Fi'
          printer_paper_stock: number
          printer_ink_c: number
          printer_ink_m: number
          printer_ink_y: number
          printer_ink_k: number
          next_maintenance: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          model: string
          serial: string
          os: string
          location: string
          owner: string
          status?: '运行中' | '离线' | '维护'
          printer_model: string
          printer_paper: 'A4' | 'A3'
          printer_connect: 'USB' | 'Wi-Fi'
          printer_paper_stock: number
          printer_ink_c: number
          printer_ink_m: number
          printer_ink_y: number
          printer_ink_k: number
          next_maintenance: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          model?: string
          serial?: string
          os?: string
          location?: string
          owner?: string
          status?: '运行中' | '离线' | '维护'
          printer_model?: string
          printer_paper?: 'A4' | 'A3'
          printer_connect?: 'USB' | 'Wi-Fi'
          printer_paper_stock?: number
          printer_ink_c?: number
          printer_ink_m?: number
          printer_ink_y?: number
          printer_ink_k?: number
          next_maintenance?: string
          created_at?: string
          updated_at?: string
        }
      }
      maintenance_logs: {
        Row: {
          id: string
          device_id: string
          date: string
          type: '维护' | '故障' | '耗材' | '其他'
          note: string
          executor: string | null
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          date: string
          type: '维护' | '故障' | '耗材' | '其他'
          note: string
          executor?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          date?: string
          type?: '维护' | '故障' | '耗材' | '其他'
          note?: string
          executor?: string | null
          created_at?: string
        }
      }
      issues: {
        Row: {
          id: string
          device_id: string
          date: string
          desc: string
          status: '处理中' | '已解决' | null
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          date: string
          desc: string
          status?: '处理中' | '已解决' | null
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          date?: string
          desc?: string
          status?: '处理中' | '已解决' | null
          created_at?: string
        }
      }
    }
  }
}
