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
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          phone_number: string | null
          phone_verified: boolean
          phone_verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone_number?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone_number?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          type: 'direct' | 'group'
          title: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'direct' | 'group'
          title?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'direct' | 'group'
          title?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
          left_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
          left_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
          left_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          topic: string | null
          extension: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          topic?: string | null
          extension?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          topic?: string | null
          extension?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      message_attachments: {
        Row: {
          id: string
          message_id: string
          filename: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          filename: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          filename?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          uploaded_by?: string
          created_at?: string
        }
      }
      sms_verifications: {
        Row: {
          id: string
          user_id: string
          phone_number: string
          code: string
          attempts: number
          verified: boolean
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          phone_number: string
          code: string
          attempts?: number
          verified?: boolean
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          phone_number?: string
          code?: string
          attempts?: number
          verified?: boolean
          expires_at?: string
          created_at?: string
        }
      }
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
      get_storage_usage: {
        Args: {
          p_user_id: string
        }
        Returns: {
          used_bytes: number
          available_bytes: number
        }[]
      }
      mark_messages_as_read: {
        Args: {
          p_conversation_id: string
          p_user_id: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
