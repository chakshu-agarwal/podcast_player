export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      podcasts: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          author: string | null
          feed_url: string
          created_at: string | null
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          image_url?: string | null
          author?: string | null
          feed_url: string
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          author?: string | null
          feed_url?: string
          created_at?: string | null
        }
      }
      // user_podcasts is a junction table for the many-to-many relationship between users and podcasts
      // It allows a single podcast to be associated with multiple users
      user_podcasts: {
        Row: {
          user_id: string
          podcast_id: string
          created_at: string | null
        }
        Insert: {
          user_id: string
          podcast_id: string
          created_at?: string | null
        }
        Update: {
          user_id?: string
          podcast_id?: string
          created_at?: string | null
        }
      }
      episodes: {
        Row: {
          id: string
          title: string
          description: string | null
          audio_url: string
          image_url: string | null
          pub_date: string | null
          duration: string | null
          podcast_id: string
          played: boolean | null
          progress: number | null
          last_played: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          audio_url: string
          image_url?: string | null
          pub_date?: string | null
          duration?: string | null
          podcast_id: string
          played?: boolean | null
          progress?: number | null
          last_played?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          audio_url?: string
          image_url?: string | null
          pub_date?: string | null
          duration?: string | null
          podcast_id?: string
          played?: boolean | null
          progress?: number | null
          last_played?: string | null
          created_at?: string | null
        }
      }
      user_episodes: {
        Row: {
          user_id: string
          episode_id: string
          played: boolean | null
          progress: number | null
          last_played: string | null
          created_at: string | null
        }
        Insert: {
          user_id: string
          episode_id: string
          played?: boolean | null
          progress?: number | null
          last_played?: string | null
          created_at?: string | null
        }
        Update: {
          user_id?: string
          episode_id?: string
          played?: boolean | null
          progress?: number | null
          last_played?: string | null
          created_at?: string | null
        }
      }
      bookmarks: {
        Row: {
          id: string
          episode_id: string
          timestamp: number
          note: string | null
          user_id: string
          created_at: string | null
        }
        Insert: {
          id: string
          episode_id: string
          timestamp: number
          note?: string | null
          user_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          episode_id?: string
          timestamp?: number
          note?: string | null
          user_id?: string
          created_at?: string | null
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
