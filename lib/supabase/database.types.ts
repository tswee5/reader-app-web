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
          created_at: string
          updated_at: string
          display_name: string | null
          avatar_url: string | null
          preferences: Json | null
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: Json | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: Json | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          id: string
          user_id: string
          url: string
          title: string
          author: string | null
          published_date: string | null
          content: string
          excerpt: string | null
          lead_image_url: string | null
          domain: string | null
          word_count: number | null
          estimated_read_time: number | null
          reading_progress: number | null
          is_completed: boolean | null
          created_at: string
          updated_at: string | null
          last_read_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          title: string
          author?: string | null
          published_date?: string | null
          content: string
          excerpt?: string | null
          lead_image_url?: string | null
          domain?: string | null
          word_count?: number | null
          estimated_read_time?: number | null
          reading_progress?: number | null
          is_completed?: boolean | null
          created_at?: string
          updated_at?: string | null
          last_read_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          title?: string
          author?: string | null
          published_date?: string | null
          content?: string
          excerpt?: string | null
          lead_image_url?: string | null
          domain?: string | null
          word_count?: number | null
          estimated_read_time?: number | null
          reading_progress?: number | null
          is_completed?: boolean | null
          created_at?: string
          updated_at?: string | null
          last_read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      highlights: {
        Row: {
          id: string
          user_id: string
          article_id: string
          content: string
          text_position_start: number
          text_position_end: number
          color: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          article_id: string
          content: string
          text_position_start: number
          text_position_end: number
          color?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          article_id?: string
          content?: string
          text_position_start?: number
          text_position_end?: number
          color?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "highlights_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_article_id_fkey"
            columns: ["article_id"]
            referencedRelation: "articles"
            referencedColumns: ["id"]
          }
        ]
      }
      notes: {
        Row: {
          id: string
          user_id: string
          article_id: string
          highlight_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          article_id: string
          highlight_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          article_id?: string
          highlight_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_article_id_fkey"
            columns: ["article_id"]
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_highlight_id_fkey"
            columns: ["highlight_id"]
            referencedRelation: "highlights"
            referencedColumns: ["id"]
          }
        ]
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      article_tags: {
        Row: {
          article_id: string
          tag_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          article_id: string
          tag_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          article_id?: string
          tag_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tags_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          article_id: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          article_id: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          article_id?: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_article_id_fkey"
            columns: ["article_id"]
            referencedRelation: "articles"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      collection_articles: {
        Row: {
          collection_id: string
          article_id: string
          user_id: string
          created_at: string
          sort_order: number
        }
        Insert: {
          collection_id: string
          article_id: string
          user_id: string
          created_at?: string
          sort_order?: number
        }
        Update: {
          collection_id?: string
          article_id?: string
          user_id?: string
          created_at?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_articles_collection_id_fkey"
            columns: ["collection_id"]
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_articles_article_id_fkey"
            columns: ["article_id"]
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_articles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_interactions: {
        Row: {
          id: string;
          user_id: string;
          article_id: string;
          user_query: string;
          ai_response: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          article_id: string;
          user_query: string;
          ai_response: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          article_id?: string;
          user_query?: string;
          ai_response?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_interactions_user_id_fk";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_interactions_article_id_fk";
            columns: ["article_id"];
            referencedRelation: "articles";
            referencedColumns: ["id"];
          }
        ];
      }
      tts_requests: {
        Row: {
          id: string;
          user_id: string;
          article_id: string;
          text_length: number;
          voice: string;
          model?: string | null;
          stability?: number | null;
          similarity_boost?: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          article_id: string;
          text_length: number;
          voice: string;
          model?: string | null;
          stability?: number | null;
          similarity_boost?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          article_id?: string;
          text_length?: number;
          voice?: string;
          model?: string | null;
          stability?: number | null;
          similarity_boost?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tts_requests_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tts_requests_article_id_fkey";
            columns: ["article_id"];
            referencedRelation: "articles";
            referencedColumns: ["id"];
          }
        ];
      },
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
} 