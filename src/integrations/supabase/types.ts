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
      account_claims: {
        Row: {
          claim_passcode: string
          claim_token: string
          claimed_at: string | null
          created_at: string
          expires_at: string
          id: string
          individual_id: string
          provisioner_id: string
          status: Database["public"]["Enums"]["invite_status"]
        }
        Insert: {
          claim_passcode: string
          claim_token: string
          claimed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          individual_id: string
          provisioner_id: string
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Update: {
          claim_passcode?: string
          claim_token?: string
          claimed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          individual_id?: string
          provisioner_id?: string
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Relationships: []
      }
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
          base_points_per_milestone: number | null
          base_points_per_planned_step: number | null
          created_at: string
          description: string | null
          domain: string | null
          due_date: string | null
          duration_weeks: number | null
          earned_points: number | null
          frequency_per_week: number | null
          goal_completion_bonus: number | null
          id: string
          owner_id: string
          planned_milestones_count: number | null
          planned_scaffold_count: number | null
          planned_steps_count: number | null
          priority: string
          progress_pct: number
          start_date: string | null
          status: string
          streak_count: number | null
          substep_points: number | null
          tags: string[] | null
          title: string
          total_possible_points: number | null
          updated_at: string
        }
        Insert: {
          base_points_per_milestone?: number | null
          base_points_per_planned_step?: number | null
          created_at?: string
          description?: string | null
          domain?: string | null
          due_date?: string | null
          duration_weeks?: number | null
          earned_points?: number | null
          frequency_per_week?: number | null
          goal_completion_bonus?: number | null
          id?: string
          owner_id: string
          planned_milestones_count?: number | null
          planned_scaffold_count?: number | null
          planned_steps_count?: number | null
          priority?: string
          progress_pct?: number
          start_date?: string | null
          status?: string
          streak_count?: number | null
          substep_points?: number | null
          tags?: string[] | null
          title: string
          total_possible_points?: number | null
          updated_at?: string
        }
        Update: {
          base_points_per_milestone?: number | null
          base_points_per_planned_step?: number | null
          created_at?: string
          description?: string | null
          domain?: string | null
          due_date?: string | null
          duration_weeks?: number | null
          earned_points?: number | null
          frequency_per_week?: number | null
          goal_completion_bonus?: number | null
          id?: string
          owner_id?: string
          planned_milestones_count?: number | null
          planned_scaffold_count?: number | null
          planned_steps_count?: number | null
          priority?: string
          progress_pct?: number
          start_date?: string | null
          status?: string
          streak_count?: number | null
          substep_points?: number | null
          tags?: string[] | null
          title?: string
          total_possible_points?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      points_log: {
        Row: {
          awarded_at: string
          category: string
          goal_id: string
          id: string
          points_awarded: number
          step_id: string | null
          step_type: string
          substep_id: string | null
          user_id: string
        }
        Insert: {
          awarded_at?: string
          category: string
          goal_id: string
          id?: string
          points_awarded: number
          step_id?: string | null
          step_type: string
          substep_id?: string | null
          user_id: string
        }
        Update: {
          awarded_at?: string
          category?: string
          goal_id?: string
          id?: string
          points_awarded?: number
          step_id?: string | null
          step_type?: string
          substep_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          avatar_url: string | null
          challenges: string[] | null
          claimed_at: string | null
          comm_pref: string
          created_at: string
          created_by_supporter: string | null
          first_name: string
          guardian_locked_until: string | null
          id: string
          interests: string[] | null
          onboarding_complete: boolean
          strengths: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          challenges?: string[] | null
          claimed_at?: string | null
          comm_pref: string
          created_at?: string
          created_by_supporter?: string | null
          first_name: string
          guardian_locked_until?: string | null
          id?: string
          interests?: string[] | null
          onboarding_complete?: boolean
          strengths?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          challenges?: string[] | null
          claimed_at?: string | null
          comm_pref?: string
          created_at?: string
          created_by_supporter?: string | null
          first_name?: string
          guardian_locked_until?: string | null
          id?: string
          interests?: string[] | null
          onboarding_complete?: boolean
          strengths?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      steps: {
        Row: {
          created_at: string
          dependency_step_ids: string[] | null
          due_date: string | null
          estimated_effort_min: number | null
          explainer: string | null
          goal_id: string
          id: string
          is_planned: boolean | null
          is_required: boolean
          notes: string | null
          order_index: number
          planned_week_index: number | null
          points: number | null
          points_awarded: number | null
          status: string
          step_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dependency_step_ids?: string[] | null
          due_date?: string | null
          estimated_effort_min?: number | null
          explainer?: string | null
          goal_id: string
          id?: string
          is_planned?: boolean | null
          is_required?: boolean
          notes?: string | null
          order_index?: number
          planned_week_index?: number | null
          points?: number | null
          points_awarded?: number | null
          status?: string
          step_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dependency_step_ids?: string[] | null
          due_date?: string | null
          estimated_effort_min?: number | null
          explainer?: string | null
          goal_id?: string
          id?: string
          is_planned?: boolean | null
          is_required?: boolean
          notes?: string | null
          order_index?: number
          planned_week_index?: number | null
          points?: number | null
          points_awarded?: number | null
          status?: string
          step_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "steps_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      substeps: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          is_planned: boolean | null
          points_awarded: number | null
          step_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_planned?: boolean | null
          points_awarded?: number | null
          step_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_planned?: boolean | null
          points_awarded?: number | null
          step_id?: string
          title?: string
          updated_at?: string
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
      supporter_invites: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          individual_id: string
          invite_token: string
          invitee_email: string
          invitee_name: string | null
          inviter_id: string
          message: string | null
          permission_level: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["user_role"]
          specific_goals: string[] | null
          status: Database["public"]["Enums"]["invite_status"]
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          individual_id: string
          invite_token: string
          invitee_email: string
          invitee_name?: string | null
          inviter_id: string
          message?: string | null
          permission_level: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["user_role"]
          specific_goals?: string[] | null
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          individual_id?: string
          invite_token?: string
          invitee_email?: string
          invitee_name?: string | null
          inviter_id?: string
          message?: string | null
          permission_level?: Database["public"]["Enums"]["permission_level"]
          role?: Database["public"]["Enums"]["user_role"]
          specific_goals?: string[] | null
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Relationships: []
      }
      supporters: {
        Row: {
          created_at: string
          id: string
          individual_id: string
          invited_by: string | null
          is_provisioner: boolean
          permission_level: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["user_role"]
          specific_goals: string[] | null
          supporter_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          individual_id: string
          invited_by?: string | null
          is_provisioner?: boolean
          permission_level?: Database["public"]["Enums"]["permission_level"]
          role?: Database["public"]["Enums"]["user_role"]
          specific_goals?: string[] | null
          supporter_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          individual_id?: string
          invited_by?: string | null
          is_provisioner?: boolean
          permission_level?: Database["public"]["Enums"]["permission_level"]
          role?: Database["public"]["Enums"]["user_role"]
          specific_goals?: string[] | null
          supporter_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          category: string
          created_at: string
          id: string
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          total_points?: number
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
      calculate_step_points: {
        Args: { goal_domain?: string; step_notes?: string; step_title: string }
        Returns: number
      }
      calculate_step_points_v2: {
        Args: {
          category: string
          step_notes?: string
          step_title?: string
          step_type?: string
        }
        Returns: number
      }
      calculate_total_possible_points: {
        Args: {
          p_category: string
          p_duration_weeks: number
          p_frequency_per_week: number
          p_planned_milestones_count?: number
          p_planned_scaffold_count?: number
          p_step_type?: string
        }
        Returns: number
      }
      check_user_permission: {
        Args: { _action: string; _goal_id?: string; _individual_id: string }
        Returns: boolean
      }
      claim_account: {
        Args: { _claim_token: string; _passcode: string }
        Returns: Json
      }
      get_goal_completion_bonus: {
        Args: { category: string }
        Returns: number
      }
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
      account_status: "active" | "pending_user_consent" | "user_claimed"
      invite_status: "pending" | "accepted" | "declined" | "expired"
      permission_level: "viewer" | "collaborator" | "admin"
      user_role: "individual" | "supporter" | "friend" | "provider" | "admin"
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
      account_status: ["active", "pending_user_consent", "user_claimed"],
      invite_status: ["pending", "accepted", "declined", "expired"],
      permission_level: ["viewer", "collaborator", "admin"],
      user_role: ["individual", "supporter", "friend", "provider", "admin"],
    },
  },
} as const
