export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      discussion_messages: {
        Row: {
          author_name: string
          created_at: string
          discussion_id: string
          id: string
          parent_id: string | null
          support_count: number
          text: string
          user_id: string | null
        }
        Insert: {
          author_name: string
          created_at?: string
          discussion_id: string
          id?: string
          parent_id?: string | null
          support_count?: number
          text: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          created_at?: string
          discussion_id?: string
          id?: string
          parent_id?: string | null
          support_count?: number
          text?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_messages_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "discussion_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          category: string
          created_at: string
          creator_id: string | null
          id: string
          participant_count: number
          topic: string
        }
        Insert: {
          category: string
          created_at?: string
          creator_id?: string | null
          id?: string
          participant_count?: number
          topic: string
        }
        Update: {
          category?: string
          created_at?: string
          creator_id?: string | null
          id?: string
          participant_count?: number
          topic?: string
        }
        Relationships: []
      }
      mentor_applications: {
        Row: {
          bio: string
          created_at: string
          expertise: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio: string
          created_at?: string
          expertise: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string
          created_at?: string
          expertise?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          anonymous_name: string
          avatar_url: string | null
          confidence_score: number
          created_at: string
          day_streak: number
          display_name: string | null
          id: string
          questions_asked: number
          sessions_joined: number
          tasks_completed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          anonymous_name: string
          avatar_url?: string | null
          confidence_score?: number
          created_at?: string
          day_streak?: number
          display_name?: string | null
          id?: string
          questions_asked?: number
          sessions_joined?: number
          tasks_completed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          anonymous_name?: string
          avatar_url?: string | null
          confidence_score?: number
          created_at?: string
          day_streak?: number
          display_name?: string | null
          id?: string
          questions_asked?: number
          sessions_joined?: number
          tasks_completed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          author_name: string
          created_at: string
          id: string
          is_answered: boolean
          is_pinned: boolean
          session_id: string | null
          tag: string
          text: string
          upvotes: number
          user_id: string | null
        }
        Insert: {
          author_name: string
          created_at?: string
          id?: string
          is_answered?: boolean
          is_pinned?: boolean
          session_id?: string | null
          tag?: string
          text: string
          upvotes?: number
          user_id?: string | null
        }
        Update: {
          author_name?: string
          created_at?: string
          id?: string
          is_answered?: boolean
          is_pinned?: boolean
          session_id?: string | null
          tag?: string
          text?: string
          upvotes?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          creator_id: string | null
          description: string | null
          ended_at: string | null
          id: string
          is_live: boolean
          mentor_name: string
          participant_count: number
          room_name: string
          scheduled_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean
          mentor_name: string
          participant_count?: number
          room_name?: string
          scheduled_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean
          mentor_name?: string
          participant_count?: number
          room_name?: string
          scheduled_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_responses: {
        Row: {
          created_at: string
          id: string
          response_text: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          response_text: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          response_text?: string
          task_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "mentor" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "mentor", "user"],
    },
  },
} as const
