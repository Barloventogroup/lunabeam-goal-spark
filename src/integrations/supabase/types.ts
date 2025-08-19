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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          description: string
          earned_at: string
          goal_id: string
          id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          description: string
          earned_at?: string
          goal_id: string
          id?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          description?: string
          earned_at?: string
          goal_id?: string
          id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          confidence_1_5: number | null
          count_of_attempts: number | null
          created_at: string
          date: string
          evidence_attachments: string[] | null
          goal_id: string
          id: string
          minutes_spent: number | null
          reflection: string | null
          reflection_is_voice: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_1_5?: number | null
          count_of_attempts?: number | null
          created_at?: string
          date?: string
          evidence_attachments?: string[] | null
          goal_id: string
          id?: string
          minutes_spent?: number | null
          reflection?: string | null
          reflection_is_voice?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_1_5?: number | null
          count_of_attempts?: number | null
          created_at?: string
          date?: string
          evidence_attachments?: string[] | null
          goal_id?: string
          id?: string
          minutes_spent?: number | null
          reflection?: string | null
          reflection_is_voice?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_invites: {
        Row: {
          circle_id: string
          created_at: string
          delivery_method: string
          expires_at: string
          id: string
          invitee_contact: string
          invitee_name: string | null
          inviter_id: string
          magic_token: string
          message: string | null
          parent_led_draft: boolean
          role: string
          share_scope: Json
          status: string
          updated_at: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          delivery_method: string
          expires_at?: string
          id?: string
          invitee_contact: string
          invitee_name?: string | null
          inviter_id: string
          magic_token: string
          message?: string | null
          parent_led_draft?: boolean
          role: string
          share_scope?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          delivery_method?: string
          expires_at?: string
          id?: string
          invitee_contact?: string
          invitee_name?: string | null
          inviter_id?: string
          magic_token?: string
          message?: string | null
          parent_led_draft?: boolean
          role?: string
          share_scope?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_invites_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "family_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_memberships: {
        Row: {
          circle_id: string
          consent_log: Json[]
          created_at: string
          id: string
          role: string
          share_scope: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          circle_id: string
          consent_log?: Json[]
          created_at?: string
          id?: string
          role: string
          share_scope?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          consent_log?: Json[]
          created_at?: string
          id?: string
          role?: string
          share_scope?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_memberships_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "family_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          description: string | null
          goal_id: string
          id: string
          type: string
          uploaded_at: string
          url: string
          user_id: string
        }
        Insert: {
          description?: string | null
          goal_id: string
          id?: string
          type: string
          uploaded_at?: string
          url: string
          user_id: string
        }
        Update: {
          description?: string | null
          goal_id?: string
          id?: string
          type?: string
          uploaded_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      family_circles: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          check_ins: Json
          created_at: string
          data_to_track: string[] | null
          id: string
          rewards: Json
          status: string
          title: string
          updated_at: string
          user_id: string
          week_plan: Json
        }
        Insert: {
          check_ins: Json
          created_at?: string
          data_to_track?: string[] | null
          id?: string
          rewards: Json
          status?: string
          title: string
          updated_at?: string
          user_id: string
          week_plan: Json
        }
        Update: {
          check_ins?: Json
          created_at?: string
          data_to_track?: string[] | null
          id?: string
          rewards?: Json
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          week_plan?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          challenges: string[] | null
          comm_pref: string
          created_at: string
          first_name: string
          id: string
          interests: string[] | null
          onboarding_complete: boolean
          strengths: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          challenges?: string[] | null
          comm_pref: string
          created_at?: string
          first_name: string
          id?: string
          interests?: string[] | null
          onboarding_complete?: boolean
          strengths?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          challenges?: string[] | null
          comm_pref?: string
          created_at?: string
          first_name?: string
          id?: string
          interests?: string[] | null
          onboarding_complete?: boolean
          strengths?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supporter_consents: {
        Row: {
          contact_id: string
          created_at: string
          expires_at: string | null
          id: string
          name: string | null
          notes_visible_to_user: boolean | null
          redactions: string[] | null
          role: string
          scope: string
          sections: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          name?: string | null
          notes_visible_to_user?: boolean | null
          redactions?: string[] | null
          role: string
          scope: string
          sections?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          name?: string | null
          notes_visible_to_user?: boolean | null
          redactions?: string[] | null
          role?: string
          scope?: string
          sections?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_checkins: {
        Row: {
          circle_id: string
          completed_at: string | null
          created_at: string
          id: string
          microsteps: Json[]
          reward: Json | null
          updated_at: string
          user_id: string
          week_of: string
          wins: Json[]
        }
        Insert: {
          circle_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          microsteps?: Json[]
          reward?: Json | null
          updated_at?: string
          user_id: string
          week_of: string
          wins?: Json[]
        }
        Update: {
          circle_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          microsteps?: Json[]
          reward?: Json | null
          updated_at?: string
          user_id?: string
          week_of?: string
          wins?: Json[]
        }
        Relationships: [
          {
            foreignKeyName: "weekly_checkins_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "family_circles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_member_circles: {
        Args: Record<PropertyKey, never>
        Returns: {
          circle_id: string
        }[]
      }
      get_user_owned_circles: {
        Args: Record<PropertyKey, never>
        Returns: {
          circle_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
