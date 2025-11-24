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
          claim_passcode: string | null
          claim_token: string
          claimed_at: string | null
          created_at: string
          expires_at: string
          first_name: string | null
          id: string
          individual_id: string
          invitee_email: string | null
          magic_link_expires_at: string | null
          magic_link_token: string | null
          provisioner_id: string
          status: Database["public"]["Enums"]["invite_status"]
        }
        Insert: {
          claim_passcode?: string | null
          claim_token: string
          claimed_at?: string | null
          created_at?: string
          expires_at?: string
          first_name?: string | null
          id?: string
          individual_id: string
          invitee_email?: string | null
          magic_link_expires_at?: string | null
          magic_link_token?: string | null
          provisioner_id: string
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Update: {
          claim_passcode?: string | null
          claim_token?: string
          claimed_at?: string | null
          created_at?: string
          expires_at?: string
          first_name?: string | null
          id?: string
          individual_id?: string
          invitee_email?: string | null
          magic_link_expires_at?: string | null
          magic_link_token?: string | null
          provisioner_id?: string
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Relationships: []
      }
      admin_action_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          individual_id: string
          target_goal_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          individual_id: string
          target_goal_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          individual_id?: string
          target_goal_id?: string | null
          target_user_id?: string | null
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
      chat_cooldown_state: {
        Row: {
          cooldown_attempts_total: number
          cooldown_level: number
          cooldown_until: string | null
          created_at: string
          id: string
          irrelevance_count: number
          is_locked: boolean
          last_unrelated_at: string | null
          lock_reason: string | null
          locked_at: string | null
          reflection_q1: string | null
          reflection_q2: string | null
          reflection_submitted: boolean | null
          reframing_statement: string | null
          step_id: string
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cooldown_attempts_total?: number
          cooldown_level?: number
          cooldown_until?: string | null
          created_at?: string
          id?: string
          irrelevance_count?: number
          is_locked?: boolean
          last_unrelated_at?: string | null
          lock_reason?: string | null
          locked_at?: string | null
          reflection_q1?: string | null
          reflection_q2?: string | null
          reflection_submitted?: boolean | null
          reframing_statement?: string | null
          step_id: string
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cooldown_attempts_total?: number
          cooldown_level?: number
          cooldown_until?: string | null
          created_at?: string
          id?: string
          irrelevance_count?: number
          is_locked?: boolean
          last_unrelated_at?: string | null
          lock_reason?: string | null
          locked_at?: string | null
          reflection_q1?: string | null
          reflection_q2?: string | null
          reflection_submitted?: boolean | null
          reframing_statement?: string | null
          step_id?: string
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          completed: boolean | null
          confidence_1_5: number | null
          count_of_attempts: number | null
          created_at: string
          date: string
          difficulty_rating: string | null
          evidence_attachments: string[] | null
          goal_id: string
          id: string
          minutes_spent: number | null
          reflection: string | null
          reflection_is_voice: boolean | null
          source: string | null
          step_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          confidence_1_5?: number | null
          count_of_attempts?: number | null
          created_at?: string
          date?: string
          difficulty_rating?: string | null
          evidence_attachments?: string[] | null
          goal_id: string
          id?: string
          minutes_spent?: number | null
          reflection?: string | null
          reflection_is_voice?: boolean | null
          source?: string | null
          step_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          confidence_1_5?: number | null
          count_of_attempts?: number | null
          created_at?: string
          date?: string
          difficulty_rating?: string | null
          evidence_attachments?: string[] | null
          goal_id?: string
          id?: string
          minutes_spent?: number | null
          reflection?: string | null
          reflection_is_voice?: boolean | null
          source?: string | null
          step_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
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
      claim_attempt_log: {
        Row: {
          attempted_at: string | null
          claim_token: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string | null
          claim_token: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string | null
          claim_token?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      cooldown_event_log: {
        Row: {
          created_at: string
          event_type: string
          goal_id: string | null
          id: string
          metadata: Json | null
          step_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          goal_id?: string | null
          id?: string
          metadata?: Json | null
          step_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          goal_id?: string | null
          id?: string
          metadata?: Json | null
          step_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooldown_event_log_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooldown_event_log_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "supporter_accessible_goals"
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
      goal_proposals: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string
          description: string | null
          frequency_per_week: number | null
          id: string
          individual_id: string
          outcome: string | null
          proposer_id: string
          rationale: string | null
          status: string
          timeline_end: string | null
          timeline_start: string | null
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          frequency_per_week?: number | null
          id?: string
          individual_id: string
          outcome?: string | null
          proposer_id: string
          rationale?: string | null
          status?: string
          timeline_end?: string | null
          timeline_start?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          frequency_per_week?: number | null
          id?: string
          individual_id?: string
          outcome?: string | null
          proposer_id?: string
          rationale?: string | null
          status?: string
          timeline_end?: string | null
          timeline_start?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          ai_generation_metadata: Json | null
          base_points_per_milestone: number | null
          base_points_per_planned_step: number | null
          completed_steps_count: number | null
          created_at: string
          created_by: string
          current_step_position: number | null
          description: string | null
          domain: string | null
          due_date: string | null
          duration_weeks: number | null
          earned_points: number | null
          frequency_per_week: number | null
          goal_completion_bonus: number | null
          goal_type: string | null
          id: string
          last_completed_date: string | null
          longest_streak: number | null
          metadata: Json | null
          owner_id: string
          planned_milestones_count: number | null
          planned_scaffold_count: number | null
          planned_steps_count: number | null
          pm_metadata: Json | null
          priority: string
          progress_pct: number
          selected_days: string[] | null
          start_date: string | null
          status: string
          streak_count: number | null
          substep_points: number | null
          tags: string[] | null
          title: string
          total_possible_points: number | null
          total_steps_count: number | null
          updated_at: string
        }
        Insert: {
          ai_generation_metadata?: Json | null
          base_points_per_milestone?: number | null
          base_points_per_planned_step?: number | null
          completed_steps_count?: number | null
          created_at?: string
          created_by: string
          current_step_position?: number | null
          description?: string | null
          domain?: string | null
          due_date?: string | null
          duration_weeks?: number | null
          earned_points?: number | null
          frequency_per_week?: number | null
          goal_completion_bonus?: number | null
          goal_type?: string | null
          id?: string
          last_completed_date?: string | null
          longest_streak?: number | null
          metadata?: Json | null
          owner_id: string
          planned_milestones_count?: number | null
          planned_scaffold_count?: number | null
          planned_steps_count?: number | null
          pm_metadata?: Json | null
          priority?: string
          progress_pct?: number
          selected_days?: string[] | null
          start_date?: string | null
          status?: string
          streak_count?: number | null
          substep_points?: number | null
          tags?: string[] | null
          title: string
          total_possible_points?: number | null
          total_steps_count?: number | null
          updated_at?: string
        }
        Update: {
          ai_generation_metadata?: Json | null
          base_points_per_milestone?: number | null
          base_points_per_planned_step?: number | null
          completed_steps_count?: number | null
          created_at?: string
          created_by?: string
          current_step_position?: number | null
          description?: string | null
          domain?: string | null
          due_date?: string | null
          duration_weeks?: number | null
          earned_points?: number | null
          frequency_per_week?: number | null
          goal_completion_bonus?: number | null
          goal_type?: string | null
          id?: string
          last_completed_date?: string | null
          longest_streak?: number | null
          metadata?: Json | null
          owner_id?: string
          planned_milestones_count?: number | null
          planned_scaffold_count?: number | null
          planned_steps_count?: number | null
          pm_metadata?: Json | null
          priority?: string
          progress_pct?: number
          selected_days?: string[] | null
          start_date?: string | null
          status?: string
          streak_count?: number | null
          substep_points?: number | null
          tags?: string[] | null
          title?: string
          total_possible_points?: number | null
          total_steps_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string
          delivered_at: string | null
          id: string
          interacted_at: string | null
          interaction_type: string | null
          notification_type: string
          scheduled_for: string
          step_id: string | null
          suppression_reason: string | null
          user_id: string
          was_suppressed: boolean | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          interacted_at?: string | null
          interaction_type?: string | null
          notification_type: string
          scheduled_for: string
          step_id?: string | null
          suppression_reason?: string | null
          user_id: string
          was_suppressed?: boolean | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          interacted_at?: string | null
          interaction_type?: string | null
          notification_type?: string
          scheduled_for?: string
          step_id?: string | null
          suppression_reason?: string | null
          user_id?: string
          was_suppressed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      points_log: {
        Row: {
          awarded_at: string
          category: string
          goal_id: string | null
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
          goal_id?: string | null
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
          goal_id?: string | null
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
          authentication_status: string | null
          avatar_url: string | null
          birthday: string | null
          challenges: string[] | null
          claimed_at: string | null
          comm_pref: string
          created_at: string
          created_by_supporter: string | null
          email: string | null
          first_name: string
          goal_sharing: string | null
          grade: string | null
          guardian_locked_until: string | null
          has_seen_welcome: boolean | null
          id: string
          interests: string[] | null
          is_self_registered: boolean
          metadata: Json | null
          notification_settings: Json | null
          onboarding_complete: boolean
          password_set: boolean | null
          profile_visibility: string | null
          progress_sharing: string | null
          resilience_bonus_earned: number | null
          strengths: string[] | null
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          authentication_status?: string | null
          avatar_url?: string | null
          birthday?: string | null
          challenges?: string[] | null
          claimed_at?: string | null
          comm_pref: string
          created_at?: string
          created_by_supporter?: string | null
          email?: string | null
          first_name: string
          goal_sharing?: string | null
          grade?: string | null
          guardian_locked_until?: string | null
          has_seen_welcome?: boolean | null
          id?: string
          interests?: string[] | null
          is_self_registered?: boolean
          metadata?: Json | null
          notification_settings?: Json | null
          onboarding_complete?: boolean
          password_set?: boolean | null
          profile_visibility?: string | null
          progress_sharing?: string | null
          resilience_bonus_earned?: number | null
          strengths?: string[] | null
          updated_at?: string
          user_id: string
          user_type?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          authentication_status?: string | null
          avatar_url?: string | null
          birthday?: string | null
          challenges?: string[] | null
          claimed_at?: string | null
          comm_pref?: string
          created_at?: string
          created_by_supporter?: string | null
          email?: string | null
          first_name?: string
          goal_sharing?: string | null
          grade?: string | null
          guardian_locked_until?: string | null
          has_seen_welcome?: boolean | null
          id?: string
          interests?: string[] | null
          is_self_registered?: boolean
          metadata?: Json | null
          notification_settings?: Json | null
          onboarding_complete?: boolean
          password_set?: boolean | null
          profile_visibility?: string | null
          progress_sharing?: string | null
          resilience_bonus_earned?: number | null
          strengths?: string[] | null
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          fulfilled_at: string | null
          id: string
          notes: string | null
          requested_at: string
          reward_id: string
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          requested_at?: string
          reward_id: string
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          requested_at?: string
          reward_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_redemptions_reward_id"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image: string | null
          is_active: boolean
          name: string
          owner_id: string
          point_cost: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          name: string
          owner_id: string
          point_cost: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          name?: string
          owner_id?: string
          point_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      safety_violations_log: {
        Row: {
          ai_response: string | null
          barriers: string | null
          compliance_notified: boolean | null
          created_at: string
          emoji_combination_detected: boolean | null
          goal_category: string | null
          goal_title: string
          helper_notified: boolean | null
          id: string
          is_self_registered: boolean | null
          motivation: string | null
          skill_level: number | null
          supporter_notified: boolean | null
          triggered_emoji_codes: string[] | null
          triggered_emojis: string[] | null
          triggered_keywords: string[] | null
          user_age: number | null
          user_email: string | null
          user_id: string
          violation_layer: string
          violation_reason: string
        }
        Insert: {
          ai_response?: string | null
          barriers?: string | null
          compliance_notified?: boolean | null
          created_at?: string
          emoji_combination_detected?: boolean | null
          goal_category?: string | null
          goal_title: string
          helper_notified?: boolean | null
          id?: string
          is_self_registered?: boolean | null
          motivation?: string | null
          skill_level?: number | null
          supporter_notified?: boolean | null
          triggered_emoji_codes?: string[] | null
          triggered_emojis?: string[] | null
          triggered_keywords?: string[] | null
          user_age?: number | null
          user_email?: string | null
          user_id: string
          violation_layer: string
          violation_reason: string
        }
        Update: {
          ai_response?: string | null
          barriers?: string | null
          compliance_notified?: boolean | null
          created_at?: string
          emoji_combination_detected?: boolean | null
          goal_category?: string | null
          goal_title?: string
          helper_notified?: boolean | null
          id?: string
          is_self_registered?: boolean | null
          motivation?: string | null
          skill_level?: number | null
          supporter_notified?: boolean | null
          triggered_emoji_codes?: string[] | null
          triggered_emojis?: string[] | null
          triggered_keywords?: string[] | null
          user_age?: number | null
          user_email?: string | null
          user_id?: string
          violation_layer?: string
          violation_reason?: string
        }
        Relationships: []
      }
      step_check_ins: {
        Row: {
          check_in_type: string
          checked_in_at: string
          completed: boolean
          created_at: string
          deferred_reason: string | null
          difficulty_rating: string | null
          id: string
          initiated_before_checkin: boolean | null
          source: string
          step_id: string
          user_id: string
          was_on_time: boolean | null
        }
        Insert: {
          check_in_type: string
          checked_in_at?: string
          completed?: boolean
          created_at?: string
          deferred_reason?: string | null
          difficulty_rating?: string | null
          id?: string
          initiated_before_checkin?: boolean | null
          source?: string
          step_id: string
          user_id: string
          was_on_time?: boolean | null
        }
        Update: {
          check_in_type?: string
          checked_in_at?: string
          completed?: boolean
          created_at?: string
          deferred_reason?: string | null
          difficulty_rating?: string | null
          id?: string
          initiated_before_checkin?: boolean | null
          source?: string
          step_id?: string
          user_id?: string
          was_on_time?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "step_check_ins_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      steps: {
        Row: {
          completion_method: string | null
          completion_notes: string | null
          completion_streak: number | null
          created_at: string
          dependency_step_ids: string[] | null
          due_date: string | null
          estimated_effort_min: number | null
          explainer: string | null
          friction_score: number | null
          goal_id: string
          id: string
          independence_rating: number | null
          initiated_at: string | null
          is_planned: boolean | null
          is_required: boolean
          is_scaffolding: boolean | null
          is_supporter_step: boolean
          last_deferred_at: string | null
          last_skipped_date: string | null
          notes: string | null
          order_index: number
          parent_step_id: string | null
          planned_week_index: number | null
          pm_metadata: Json | null
          points: number | null
          points_awarded: number | null
          quality_rating: number | null
          scaffolding_level: number | null
          skip_count: number | null
          skip_reasons: Json | null
          snooze_count: number | null
          status: string
          step_type: string | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          completion_method?: string | null
          completion_notes?: string | null
          completion_streak?: number | null
          created_at?: string
          dependency_step_ids?: string[] | null
          due_date?: string | null
          estimated_effort_min?: number | null
          explainer?: string | null
          friction_score?: number | null
          goal_id: string
          id?: string
          independence_rating?: number | null
          initiated_at?: string | null
          is_planned?: boolean | null
          is_required?: boolean
          is_scaffolding?: boolean | null
          is_supporter_step?: boolean
          last_deferred_at?: string | null
          last_skipped_date?: string | null
          notes?: string | null
          order_index?: number
          parent_step_id?: string | null
          planned_week_index?: number | null
          pm_metadata?: Json | null
          points?: number | null
          points_awarded?: number | null
          quality_rating?: number | null
          scaffolding_level?: number | null
          skip_count?: number | null
          skip_reasons?: Json | null
          snooze_count?: number | null
          status?: string
          step_type?: string | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          completion_method?: string | null
          completion_notes?: string | null
          completion_streak?: number | null
          created_at?: string
          dependency_step_ids?: string[] | null
          due_date?: string | null
          estimated_effort_min?: number | null
          explainer?: string | null
          friction_score?: number | null
          goal_id?: string
          id?: string
          independence_rating?: number | null
          initiated_at?: string | null
          is_planned?: boolean | null
          is_required?: boolean
          is_scaffolding?: boolean | null
          is_supporter_step?: boolean
          last_deferred_at?: string | null
          last_skipped_date?: string | null
          notes?: string | null
          order_index?: number
          parent_step_id?: string | null
          planned_week_index?: number | null
          pm_metadata?: Json | null
          points?: number | null
          points_awarded?: number | null
          quality_rating?: number | null
          scaffolding_level?: number | null
          skip_count?: number | null
          skip_reasons?: Json | null
          snooze_count?: number | null
          status?: string
          step_type?: string | null
          title?: string
          type?: string | null
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
          {
            foreignKeyName: "steps_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "supporter_accessible_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "steps_parent_step_id_fkey"
            columns: ["parent_step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      substeps_archived: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          initiated_at: string | null
          is_planned: boolean | null
          points_awarded: number | null
          step_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          initiated_at?: string | null
          is_planned?: boolean | null
          points_awarded?: number | null
          step_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          initiated_at?: string | null
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
          requested_by: string | null
          requires_approval: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          specific_goals: string[] | null
          status: Database["public"]["Enums"]["invite_status"]
          supporter_setup_token: string | null
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
          requested_by?: string | null
          requires_approval?: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          specific_goals?: string[] | null
          status?: Database["public"]["Enums"]["invite_status"]
          supporter_setup_token?: string | null
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
          requested_by?: string | null
          requires_approval?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          specific_goals?: string[] | null
          status?: Database["public"]["Enums"]["invite_status"]
          supporter_setup_token?: string | null
        }
        Relationships: []
      }
      supporter_setup_steps: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_effort_min: number | null
          goal_id: string
          id: string
          order_index: number
          status: string
          supporter_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_effort_min?: number | null
          goal_id: string
          id?: string
          order_index?: number
          status?: string
          supporter_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_effort_min?: number | null
          goal_id?: string
          id?: string
          order_index?: number
          status?: string
          supporter_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supporter_setup_steps_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supporter_setup_steps_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "supporter_accessible_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      supporters: {
        Row: {
          created_at: string
          id: string
          individual_id: string
          invited_by: string | null
          is_admin: boolean
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
          is_admin?: boolean
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
          is_admin?: boolean
          is_provisioner?: boolean
          permission_level?: Database["public"]["Enums"]["permission_level"]
          role?: Database["public"]["Enums"]["user_role"]
          specific_goals?: string[] | null
          supporter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_individual_profile"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_supporter_profile"
            columns: ["supporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_consents: {
        Row: {
          admin_id: string
          consent_type: string
          created_at: string
          expires_at: string | null
          granted: boolean
          id: string
          individual_id: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          consent_type: string
          created_at?: string
          expires_at?: string | null
          granted?: boolean
          id?: string
          individual_id: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          consent_type?: string
          created_at?: string
          expires_at?: string | null
          granted?: boolean
          id?: string
          individual_id?: string
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
      supporter_accessible_goals: {
        Row: {
          ai_generation_metadata: Json | null
          base_points_per_milestone: number | null
          base_points_per_planned_step: number | null
          completed_steps_count: number | null
          created_at: string | null
          created_by: string | null
          current_step_position: number | null
          description: string | null
          domain: string | null
          due_date: string | null
          duration_weeks: number | null
          earned_points: number | null
          frequency_per_week: number | null
          goal_completion_bonus: number | null
          goal_type: string | null
          id: string | null
          is_admin: boolean | null
          last_completed_date: string | null
          longest_streak: number | null
          metadata: Json | null
          owner_id: string | null
          permission_level:
            | Database["public"]["Enums"]["permission_level"]
            | null
          planned_milestones_count: number | null
          planned_scaffold_count: number | null
          planned_steps_count: number | null
          pm_metadata: Json | null
          priority: string | null
          progress_pct: number | null
          selected_days: string[] | null
          start_date: string | null
          status: string | null
          streak_count: number | null
          substep_points: number | null
          supporter_id: string | null
          supporter_role: Database["public"]["Enums"]["user_role"] | null
          tags: string[] | null
          title: string | null
          total_possible_points: number | null
          total_steps_count: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_supporter_profile"
            columns: ["supporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      supporter_redemptions_summary: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          fulfilled_at: string | null
          id: string | null
          notes: string | null
          requested_at: string | null
          reward_category: string | null
          reward_id: string | null
          reward_image: string | null
          reward_name: string | null
          reward_owner_id: string | null
          reward_point_cost: number | null
          status: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_redemptions_reward_id"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invite_by_token: { Args: { _token: string }; Returns: Json }
      accept_supporter_invite_secure: {
        Args: { _invite_token: string }
        Returns: Json
      }
      admin_delete_user: {
        Args: { user_id_to_delete: string }
        Returns: boolean
      }
      approve_supporter_request_by_email: {
        Args: { p_individual_id: string; p_invitee_email: string }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          individual_id: string
          invite_token: string
          invitee_email: string
          invitee_name: string
          inviter_id: string
          message: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["user_role"]
          specific_goals: string[]
          status: Database["public"]["Enums"]["invite_status"]
        }[]
      }
      approve_supporter_request_by_email_v2: {
        Args: { p_individual_id: string; p_invitee_email: string }
        Returns: string
      }
      approve_supporter_request_by_email_v3: {
        Args: { p_individual_id: string; p_invitee_email: string }
        Returns: string
      }
      approve_supporter_request_secure: {
        Args: { p_request_id: string }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          individual_id: string
          invite_token: string
          invitee_email: string
          invitee_name: string
          inviter_id: string
          message: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["user_role"]
          specific_goals: string[]
          status: Database["public"]["Enums"]["invite_status"]
        }[]
      }
      approve_supporter_request_secure_v2: {
        Args: { p_request_id: string }
        Returns: string
      }
      approve_supporter_request_secure_v3: {
        Args: { p_request_id: string }
        Returns: string
      }
      assign_email_and_invite: {
        Args: {
          p_individual_id: string
          p_invitee_name?: string
          p_real_email: string
        }
        Returns: {
          claim_token: string
          magic_link_token: string
          success: boolean
        }[]
      }
      award_resilience_bonus: {
        Args: { p_base_points: number; p_step_id: string; p_user_id: string }
        Returns: number
      }
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
      check_user_permission_v2: {
        Args: {
          _action: string
          _goal_id?: string
          _individual_id: string
          _scope?: string
        }
        Returns: boolean
      }
      claim_account: {
        Args: { _claim_token: string; _passcode: string }
        Returns: Json
      }
      create_account_claim_with_email: {
        Args: {
          p_individual_id: string
          p_invitee_email: string
          p_invitee_name?: string
          p_message?: string
        }
        Returns: {
          claim_token: string
          magic_link_token: string
        }[]
      }
      create_step_secure: {
        Args: {
          p_due_date?: string
          p_estimated_effort_min?: number
          p_goal_id: string
          p_is_planned?: boolean
          p_notes?: string
          p_step_type?: string
          p_title: string
        }
        Returns: string
      }
      create_supporter_invite_secure:
        | {
            Args: {
              p_expires_at?: string
              p_individual_id: string
              p_invitee_email: string
              p_invitee_name?: string
              p_message?: string
              p_permission_level?: Database["public"]["Enums"]["permission_level"]
              p_role?: Database["public"]["Enums"]["user_role"]
              p_specific_goals?: string[]
            }
            Returns: {
              created_at: string
              expires_at: string
              id: string
              individual_id: string
              invite_token: string
              invitee_email: string
              invitee_name: string
              inviter_id: string
              message: string
              permission_level: Database["public"]["Enums"]["permission_level"]
              role: Database["public"]["Enums"]["user_role"]
              specific_goals: string[]
              status: Database["public"]["Enums"]["invite_status"]
            }[]
          }
        | {
            Args: {
              p_expires_at?: string
              p_individual_id: string
              p_invitee_email: string
              p_invitee_name?: string
              p_inviter_id?: string
              p_message?: string
              p_permission_level?: Database["public"]["Enums"]["permission_level"]
              p_role?: Database["public"]["Enums"]["user_role"]
              p_specific_goals?: string[]
            }
            Returns: {
              created_at: string
              expires_at: string
              id: string
              individual_id: string
              invite_token: string
              invitee_email: string
              invitee_name: string
              inviter_id: string
              message: string
              permission_level: Database["public"]["Enums"]["permission_level"]
              role: Database["public"]["Enums"]["user_role"]
              specific_goals: string[]
              status: Database["public"]["Enums"]["invite_status"]
              supporter_setup_token: string
            }[]
          }
      delete_user_safely: {
        Args: { user_id_to_delete: string }
        Returns: boolean
      }
      deny_supporter_request_by_email: {
        Args: { p_individual_id: string; p_invitee_email: string }
        Returns: undefined
      }
      deny_supporter_request_secure: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      get_goal_completion_bonus: { Args: { category: string }; Returns: number }
      get_invite_by_token: {
        Args: { _token: string }
        Returns: {
          expires_at: string
          id: string
          individual_id: string
          invitee_name: string
          inviter_id: string
          message: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["user_role"]
          specific_goals: string[]
          status: Database["public"]["Enums"]["invite_status"]
        }[]
      }
      get_invite_token_by_id_secure: {
        Args: { invite_id: string }
        Returns: {
          individual_id: string
          invite_token: string
          invitee_email: string
          invitee_name: string
          inviter_id: string
          message: string
          supporter_setup_token: string
        }[]
      }
      get_my_invite_by_token: {
        Args: { _token: string }
        Returns: {
          expires_at: string
          id: string
          invitee_name: string
          inviter_name: string
          masked_email: string
          message: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["invite_status"]
        }[]
      }
      get_my_provisioned_individuals: {
        Args: never
        Returns: {
          first_name: string
          status: Database["public"]["Enums"]["invite_status"]
          user_id: string
        }[]
      }
      get_my_received_invites: {
        Args: never
        Returns: {
          created_at: string
          expires_at: string
          id: string
          invitee_name: string
          inviter_name: string
          masked_email: string
          message: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["invite_status"]
        }[]
      }
      get_my_sent_invites: {
        Args: never
        Returns: {
          created_at: string
          expires_at: string
          id: string
          individual_id: string
          invitee_name: string
          masked_email: string
          message: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["invite_status"]
        }[]
      }
      get_pending_requests_for_individual: {
        Args: { p_individual_id: string }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          individual_id: string
          invitee_email: string
          invitee_name: string
          inviter_id: string
          message: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["user_role"]
          specific_goals: string[]
          status: Database["public"]["Enums"]["invite_status"]
        }[]
      }
      get_profiles_created_by_me: {
        Args: never
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          avatar_url: string
          first_name: string
          user_id: string
        }[]
      }
      get_supporter_invite_public: {
        Args: { p_token: string }
        Returns: {
          id: string
          individual_id: string
          individual_name: string
          invite_token: string
          invitee_email: string
          invitee_name: string
          message: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["user_role"]
          supporter_setup_token: string
        }[]
      }
      get_user_member_circles: {
        Args: never
        Returns: {
          circle_id: string
        }[]
      }
      get_user_owned_circles: {
        Args: never
        Returns: {
          circle_id: string
        }[]
      }
      get_user_total_points: { Args: { p_user_id: string }; Returns: number }
      increment_friction_score: { Args: { p_step_id: string }; Returns: number }
      process_redemption_approval: {
        Args: { p_redemption_id: string }
        Returns: undefined
      }
      provision_individual: {
        Args: {
          p_comm_pref?: string
          p_first_name: string
          p_interests?: string[]
          p_strengths?: string[]
        }
        Returns: {
          claim_passcode: string
          claim_token: string
          individual_id: string
        }[]
      }
      provision_individual_direct:
        | {
            Args: { p_first_name: string; p_user_type?: string }
            Returns: {
              individual_id: string
              placeholder_email: string
            }[]
          }
        | {
            Args: {
              p_comm_pref?: string
              p_first_name: string
              p_interests?: string[]
              p_strengths?: string[]
            }
            Returns: {
              individual_id: string
              placeholder_email: string
            }[]
          }
    }
    Enums: {
      account_status: "active" | "pending_user_consent" | "user_claimed"
      invite_status:
        | "pending"
        | "accepted"
        | "declined"
        | "expired"
        | "pending_admin_approval"
      permission_level: "viewer" | "collaborator" | "admin"
      permission_level_fixed: "viewer" | "collaborator"
      user_role:
        | "individual"
        | "supporter"
        | "friend"
        | "provider"
        | "admin"
        | "parent"
        | "family"
        | "coach"
        | "teacher"
      user_role_fixed: "individual" | "supporter" | "friend" | "provider"
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
      invite_status: [
        "pending",
        "accepted",
        "declined",
        "expired",
        "pending_admin_approval",
      ],
      permission_level: ["viewer", "collaborator", "admin"],
      permission_level_fixed: ["viewer", "collaborator"],
      user_role: [
        "individual",
        "supporter",
        "friend",
        "provider",
        "admin",
        "parent",
        "family",
        "coach",
        "teacher",
      ],
      user_role_fixed: ["individual", "supporter", "friend", "provider"],
    },
  },
} as const
