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
      trusted_sources: {
        Row: {
          id: string
          domain: string
          name: string
          category: 'government' | 'academic' | 'media' | 'international_org' | 'ngo' | 'other'
          reliability_score: number
          country_code: string | null
          language: string
          crawl_frequency: 'daily' | 'weekly' | 'monthly'
          is_active: boolean
          robots_txt_url: string | null
          last_crawled_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          domain: string
          name: string
          category: 'government' | 'academic' | 'media' | 'international_org' | 'ngo' | 'other'
          reliability_score: number
          country_code?: string | null
          language?: string
          crawl_frequency?: 'daily' | 'weekly' | 'monthly'
          is_active?: boolean
          robots_txt_url?: string | null
          last_crawled_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          domain?: string
          name?: string
          category?: 'government' | 'academic' | 'media' | 'international_org' | 'ngo' | 'other'
          reliability_score?: number
          country_code?: string | null
          language?: string
          crawl_frequency?: 'daily' | 'weekly' | 'monthly'
          is_active?: boolean
          robots_txt_url?: string | null
          last_crawled_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      indexed_pages: {
        Row: {
          id: string
          url: string
          source_id: string
          title: string
          content: string
          content_hash: string
          author: string | null
          published_at: string | null
          language: string
          word_count: number
          indexed_at: string
          last_checked_at: string
          status: 'active' | 'updated' | 'deleted' | 'error'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          url: string
          source_id: string
          title: string
          content: string
          content_hash: string
          author?: string | null
          published_at?: string | null
          language?: string
          word_count?: number
          indexed_at?: string
          last_checked_at?: string
          status?: 'active' | 'updated' | 'deleted' | 'error'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          url?: string
          source_id?: string
          title?: string
          content?: string
          content_hash?: string
          author?: string | null
          published_at?: string | null
          language?: string
          word_count?: number
          indexed_at?: string
          last_checked_at?: string
          status?: 'active' | 'updated' | 'deleted' | 'error'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      search_queries: {
        Row: {
          id: string
          query_text: string
          filters: Json | null
          result_count: number
          synthesis_requested: boolean
          created_at: string
        }
        Insert: {
          id?: string
          query_text: string
          filters?: Json | null
          result_count?: number
          synthesis_requested?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          query_text?: string
          filters?: Json | null
          result_count?: number
          synthesis_requested?: boolean
          created_at?: string
        }
      }
      ai_syntheses: {
        Row: {
          id: string
          query_id: string
          synthesis_text: string
          source_page_ids: string[]
          model: string
          tokens_used: number
          generation_time_ms: number
          created_at: string
        }
        Insert: {
          id?: string
          query_id: string
          synthesis_text: string
          source_page_ids: string[]
          model: string
          tokens_used?: number
          generation_time_ms?: number
          created_at?: string
        }
        Update: {
          id?: string
          query_id?: string
          synthesis_text?: string
          source_page_ids?: string[]
          model?: string
          tokens_used?: number
          generation_time_ms?: number
          created_at?: string
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
