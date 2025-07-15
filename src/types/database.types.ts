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
      artifacts: {
        Row: {
          id: string
          user_id: string | null
          text: string
          timestamp: string
          task: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          text: string
          timestamp: string
          task?: string | null
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          text?: string
          timestamp?: string
          task?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      todos: {
        Row: {
          id: string
          user_id: string | null
          text: string
          completed: boolean
          category: 'do' | 'schedule' | 'delegate' | 'eliminate'
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          text: string
          completed?: boolean
          category: 'do' | 'schedule' | 'delegate' | 'eliminate'
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          text?: string
          completed?: boolean
          category?: 'do' | 'schedule' | 'delegate' | 'eliminate'
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          user_id: string | null
          work_time: number
          short_break_time: number
          long_break_time: number
          long_break_interval: number
          auto_start_breaks: boolean
          auto_start_pomodoros: boolean
          sound_enabled: boolean
          notifications_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          work_time?: number
          short_break_time?: number
          long_break_time?: number
          long_break_interval?: number
          auto_start_breaks?: boolean
          auto_start_pomodoros?: boolean
          sound_enabled?: boolean
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          work_time?: number
          short_break_time?: number
          long_break_time?: number
          long_break_interval?: number
          auto_start_breaks?: boolean
          auto_start_pomodoros?: boolean
          sound_enabled?: boolean
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}