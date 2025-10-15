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
          device_type: string | null
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
          device_type?: string | null
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
          device_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      device_types: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          color: string
          sort_order: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          color?: string
          sort_order?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          color?: string
          sort_order?: number
        }
      }
      device_relations: {
        Row: {
          id: string
          created_at: string
          device_id: string
          related_device_id: string
          relation_type: string
          note: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          device_id: string
          related_device_id: string
          relation_type?: string
          note?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          device_id?: string
          related_device_id?: string
          relation_type?: string
          note?: string | null
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
          description: string
          status: '处理中' | '已解决' | null
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          date: string
          description: string
          status?: '处理中' | '已解决' | null
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          date?: string
          description?: string
          status?: '处理中' | '已解决' | null
          created_at?: string
        }
      }
      outbound_records: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          device_id: string
          device_name: string
          destination: string
          operator: string
          items: Json
          notes: string | null
          status: 'outbound' | 'returned'
          return_info: Json | null
          original_location: string | null
          original_owner: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          device_id: string
          device_name: string
          destination: string
          operator: string
          items: Json
          notes?: string | null
          status?: 'outbound' | 'returned'
          return_info?: Json | null
          original_location?: string | null
          original_owner?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          device_id?: string
          device_name?: string
          destination?: string
          operator?: string
          items?: Json
          notes?: string | null
          status?: 'outbound' | 'returned'
          return_info?: Json | null
          original_location?: string | null
          original_owner?: string | null
        }
      }
      inventory: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          paper_stock: Json
          epson_ink_stock: Json
          equipment_stock: Json
          last_updated: string
          remark: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          paper_stock?: Json
          epson_ink_stock?: Json
          equipment_stock?: Json
          last_updated?: string
          remark?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          paper_stock?: Json
          epson_ink_stock?: Json
          equipment_stock?: Json
          last_updated?: string
          remark?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          created_at: string
          action_type: string
          entity_type: string
          entity_id: string
          operator: string
          details: Json
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          action_type: string
          entity_type: string
          entity_id: string
          operator: string
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          action_type?: string
          entity_type?: string
          entity_id?: string
          operator?: string
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
        }
      }
    }
  }
}
