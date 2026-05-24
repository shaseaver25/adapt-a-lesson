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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          performed_by: string | null
          target_user_id: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          target_user_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          target_user_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_cost_logs: {
        Row: {
          created_at: string | null
          estimated_cost: number | null
          function_name: string
          id: string
          input_tokens: number | null
          model: string
          output_tokens: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_cost?: number | null
          function_name: string
          id?: string
          input_tokens?: number | null
          model: string
          output_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_cost?: number | null
          function_name?: string
          id?: string
          input_tokens?: number | null
          model?: string
          output_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      audio_cache: {
        Row: {
          audio_url: string
          character_count: number
          created_at: string | null
          id: string
          language: string
          phrase_hash: string
          phrase_text: string
          usage_count: number | null
          voice_id: string
        }
        Insert: {
          audio_url: string
          character_count?: number
          created_at?: string | null
          id?: string
          language?: string
          phrase_hash: string
          phrase_text: string
          usage_count?: number | null
          voice_id?: string
        }
        Update: {
          audio_url?: string
          character_count?: number
          created_at?: string | null
          id?: string
          language?: string
          phrase_hash?: string
          phrase_text?: string
          usage_count?: number | null
          voice_id?: string
        }
        Relationships: []
      }
      audio_usage: {
        Row: {
          audio_url: string | null
          characters_used: number
          created_at: string
          duration_seconds: number | null
          estimated_cost: number
          group_id: string | null
          id: string
          language: string
          lesson_id: string | null
          section_type: string
        }
        Insert: {
          audio_url?: string | null
          characters_used?: number
          created_at?: string
          duration_seconds?: number | null
          estimated_cost?: number
          group_id?: string | null
          id?: string
          language?: string
          lesson_id?: string | null
          section_type: string
        }
        Update: {
          audio_url?: string | null
          characters_used?: number
          created_at?: string
          duration_seconds?: number | null
          estimated_cost?: number
          group_id?: string | null
          id?: string
          language?: string
          lesson_id?: string | null
          section_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_usage_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_usage_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "generated_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_connections: {
        Row: {
          canvas_instance_url: string
          canvas_user_id: number | null
          created_at: string
          encrypted_access_token: string
          encrypted_refresh_token: string | null
          id: string
          scope: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canvas_instance_url: string
          canvas_user_id?: number | null
          created_at?: string
          encrypted_access_token: string
          encrypted_refresh_token?: string | null
          id?: string
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canvas_instance_url?: string
          canvas_user_id?: number | null
          created_at?: string
          encrypted_access_token?: string
          encrypted_refresh_token?: string | null
          id?: string
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      canvas_oauth_state: {
        Row: {
          canvas_instance_url: string
          created_at: string
          expires_at: string
          state: string
          user_id: string
        }
        Insert: {
          canvas_instance_url: string
          created_at?: string
          expires_at: string
          state: string
          user_id: string
        }
        Update: {
          canvas_instance_url?: string
          created_at?: string
          expires_at?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      class_folders: {
        Row: {
          color: string | null
          created_at: string | null
          folder_name: string
          id: string
          organization_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          folder_name: string
          id?: string
          organization_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          folder_name?: string
          id?: string
          organization_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      compliance_events: {
        Row: {
          action_taken: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          field_name: string
          findings: string[]
          id: string
          match_count: number
          risk_level: string
          user_id: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          field_name: string
          findings?: string[]
          id?: string
          match_count?: number
          risk_level: string
          user_id?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          field_name?: string
          findings?: string[]
          id?: string
          match_count?: number
          risk_level?: string
          user_id?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          error_type: string
          id: string
          metadata: Json | null
          page_url: string | null
          stack_trace: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          error_type: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          stack_trace?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          error_type?: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          stack_trace?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          flag_name: string
          id: string
          is_enabled: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          flag_name: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          flag_name?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      generated_assessments: {
        Row: {
          assessment_content: string
          city: string | null
          created_at: string
          grade_level: string | null
          id: string
          learning_objectives: string[] | null
          lesson_title: string | null
          local_context_details: string | null
          method_category: string | null
          method_name: string | null
          method_outputs: Json | null
          school_name: string | null
          state: string | null
          storage_path: string | null
          subject: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assessment_content: string
          city?: string | null
          created_at?: string
          grade_level?: string | null
          id?: string
          learning_objectives?: string[] | null
          lesson_title?: string | null
          local_context_details?: string | null
          method_category?: string | null
          method_name?: string | null
          method_outputs?: Json | null
          school_name?: string | null
          state?: string | null
          storage_path?: string | null
          subject?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assessment_content?: string
          city?: string | null
          created_at?: string
          grade_level?: string | null
          id?: string
          learning_objectives?: string[] | null
          lesson_title?: string | null
          local_context_details?: string | null
          method_category?: string | null
          method_name?: string | null
          method_outputs?: Json | null
          school_name?: string | null
          state?: string | null
          storage_path?: string | null
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      generated_audio: {
        Row: {
          audio_url: string
          characters_used: number
          created_at: string
          duration_seconds: number | null
          group_id: string | null
          group_name: string
          id: string
          language: string
          lesson_id: string | null
          section_id: string
          section_type: string
          storage_path: string | null
          voice_id: string | null
        }
        Insert: {
          audio_url: string
          characters_used?: number
          created_at?: string
          duration_seconds?: number | null
          group_id?: string | null
          group_name: string
          id?: string
          language?: string
          lesson_id?: string | null
          section_id: string
          section_type: string
          storage_path?: string | null
          voice_id?: string | null
        }
        Update: {
          audio_url?: string
          characters_used?: number
          created_at?: string
          duration_seconds?: number | null
          group_id?: string | null
          group_name?: string
          id?: string
          language?: string
          lesson_id?: string | null
          section_id?: string
          section_type?: string
          storage_path?: string | null
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_audio_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_audio_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "generated_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_lessons: {
        Row: {
          created_at: string
          differentiation_options: Json | null
          group_ids: string[]
          id: string
          lesson_title: string | null
          original_content: string
          student_handouts: Json | null
          teacher_guide: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          differentiation_options?: Json | null
          group_ids: string[]
          id?: string
          lesson_title?: string | null
          original_content: string
          student_handouts?: Json | null
          teacher_guide?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          differentiation_options?: Json | null
          group_ids?: string[]
          id?: string
          lesson_title?: string | null
          original_content?: string
          student_handouts?: Json | null
          teacher_guide?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      generated_rubrics: {
        Row: {
          ai_proof_criteria: Json | null
          ai_proof_settings: Json | null
          ai_vulnerability_score: number | null
          assessment_description: string
          auto_verification_added: boolean | null
          auto_verification_count: number | null
          created_at: string
          grade_level: string | null
          id: string
          learning_objectives: string[]
          num_criteria: number
          rubric_content: string
          rubric_name: string | null
          updated_at: string
          user_id: string | null
          verification_checkpoints: string[] | null
        }
        Insert: {
          ai_proof_criteria?: Json | null
          ai_proof_settings?: Json | null
          ai_vulnerability_score?: number | null
          assessment_description: string
          auto_verification_added?: boolean | null
          auto_verification_count?: number | null
          created_at?: string
          grade_level?: string | null
          id?: string
          learning_objectives: string[]
          num_criteria?: number
          rubric_content: string
          rubric_name?: string | null
          updated_at?: string
          user_id?: string | null
          verification_checkpoints?: string[] | null
        }
        Update: {
          ai_proof_criteria?: Json | null
          ai_proof_settings?: Json | null
          ai_vulnerability_score?: number | null
          assessment_description?: string
          auto_verification_added?: boolean | null
          auto_verification_count?: number | null
          created_at?: string
          grade_level?: string | null
          id?: string
          learning_objectives?: string[]
          num_criteria?: number
          rubric_content?: string
          rubric_name?: string | null
          updated_at?: string
          user_id?: string | null
          verification_checkpoints?: string[] | null
        }
        Relationships: []
      }
      help_article_feedback: {
        Row: {
          article_id: string | null
          created_at: string | null
          feedback_comment: string | null
          id: string
          is_helpful: boolean
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          feedback_comment?: string | null
          id?: string
          is_helpful: boolean
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          feedback_comment?: string | null
          id?: string
          is_helpful?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_article_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "help_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      help_articles: {
        Row: {
          category: string
          content: string
          created_at: string | null
          created_by: string | null
          display_order: number | null
          excerpt: string | null
          helpful_count: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          not_helpful_count: number | null
          search_keywords: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
          updated_by: string | null
          view_count: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          excerpt?: string | null
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          not_helpful_count?: number | null
          search_keywords?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          excerpt?: string | null
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          not_helpful_count?: number | null
          search_keywords?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      lesson_audio_status: {
        Row: {
          completed_at: string | null
          completed_sections: number | null
          created_at: string | null
          error_details: Json | null
          failed_sections: number | null
          id: string
          lesson_id: string
          started_at: string | null
          status: string
          total_sections: number
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_sections?: number | null
          created_at?: string | null
          error_details?: Json | null
          failed_sections?: number | null
          id?: string
          lesson_id: string
          started_at?: string | null
          status: string
          total_sections?: number
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_sections?: number | null
          created_at?: string | null
          error_details?: Json | null
          failed_sections?: number | null
          id?: string
          lesson_id?: string
          started_at?: string | null
          status?: string
          total_sections?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_audio_status_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "generated_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          description: string | null
          file_size: number | null
          group_id: string | null
          id: string
          lesson_id: string
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          group_id?: string | null
          id?: string
          lesson_id: string
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          group_id?: string | null
          id?: string
          lesson_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_images_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_images_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "generated_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_validation_results: {
        Row: {
          hard_check_results: Json
          id: string
          lesson_id: string
          passed: boolean
          regen_attempts: number
          rubric_version: string
          soft_check_results: Json | null
          user_id: string
          validated_at: string
        }
        Insert: {
          hard_check_results: Json
          id?: string
          lesson_id: string
          passed: boolean
          regen_attempts?: number
          rubric_version: string
          soft_check_results?: Json | null
          user_id: string
          validated_at?: string
        }
        Update: {
          hard_check_results?: Json
          id?: string
          lesson_id?: string
          passed?: boolean
          regen_attempts?: number
          rubric_version?: string
          soft_check_results?: Json | null
          user_id?: string
          validated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_validation_results_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "generated_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      marketing_surveys: {
        Row: {
          created_at: string
          features_used: string[] | null
          grade_levels: string[] | null
          id: string
          improvement_suggestion: string | null
          incentive_claim_date: string | null
          incentive_claimed: boolean | null
          lesson_quality_satisfaction: number | null
          lessons_per_week: string | null
          most_valuable_thing: string | null
          multilingual_satisfaction: number | null
          nps_score: number | null
          ocr_complaint: string | null
          previous_method: string | null
          primary_role: string
          student_impact: string | null
          time_saved_rating: number | null
          usage_duration: string | null
          user_id: string | null
          wcag_adoption_factor: string | null
        }
        Insert: {
          created_at?: string
          features_used?: string[] | null
          grade_levels?: string[] | null
          id?: string
          improvement_suggestion?: string | null
          incentive_claim_date?: string | null
          incentive_claimed?: boolean | null
          lesson_quality_satisfaction?: number | null
          lessons_per_week?: string | null
          most_valuable_thing?: string | null
          multilingual_satisfaction?: number | null
          nps_score?: number | null
          ocr_complaint?: string | null
          previous_method?: string | null
          primary_role: string
          student_impact?: string | null
          time_saved_rating?: number | null
          usage_duration?: string | null
          user_id?: string | null
          wcag_adoption_factor?: string | null
        }
        Update: {
          created_at?: string
          features_used?: string[] | null
          grade_levels?: string[] | null
          id?: string
          improvement_suggestion?: string | null
          incentive_claim_date?: string | null
          incentive_claimed?: boolean | null
          lesson_quality_satisfaction?: number | null
          lessons_per_week?: string | null
          most_valuable_thing?: string | null
          multilingual_satisfaction?: number | null
          nps_score?: number | null
          ocr_complaint?: string | null
          previous_method?: string | null
          primary_role?: string
          student_impact?: string | null
          time_saved_rating?: number | null
          usage_duration?: string | null
          user_id?: string | null
          wcag_adoption_factor?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          page_path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_locked: boolean | null
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string | null
          failed_login_attempts: number | null
          feedback_request_sent_at: string | null
          first_lesson_email_sent: boolean | null
          full_name: string | null
          id: string
          last_login_at: string | null
          locked_at: string | null
          login_count: number | null
          organization_type: string | null
          provider: string | null
          updated_at: string
        }
        Insert: {
          account_locked?: boolean | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          failed_login_attempts?: number | null
          feedback_request_sent_at?: string | null
          first_lesson_email_sent?: boolean | null
          full_name?: string | null
          id: string
          last_login_at?: string | null
          locked_at?: string | null
          login_count?: number | null
          organization_type?: string | null
          provider?: string | null
          updated_at?: string
        }
        Update: {
          account_locked?: boolean | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          failed_login_attempts?: number | null
          feedback_request_sent_at?: string | null
          first_lesson_email_sent?: boolean | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          locked_at?: string | null
          login_count?: number | null
          organization_type?: string | null
          provider?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rubric_verifications: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          red_flags_detected: string[] | null
          rubric_id: string | null
          score: number | null
          student_id: string | null
          student_name: string | null
          verification_passed: boolean | null
          verification_type: string
          verified_at: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          red_flags_detected?: string[] | null
          rubric_id?: string | null
          score?: number | null
          student_id?: string | null
          student_name?: string | null
          verification_passed?: boolean | null
          verification_type: string
          verified_at?: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          red_flags_detected?: string[] | null
          rubric_id?: string | null
          score?: number | null
          student_id?: string | null
          student_name?: string | null
          verification_passed?: boolean | null
          verification_type?: string
          verified_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rubric_verifications_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "generated_rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_assessments: {
        Row: {
          assessment_description: string
          created_at: string
          grade_level: string | null
          id: string
          subject: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assessment_description: string
          created_at?: string
          grade_level?: string | null
          id?: string
          subject?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assessment_description?: string
          created_at?: string
          grade_level?: string | null
          id?: string
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      student_groups: {
        Row: {
          accommodations: string[] | null
          created_at: string
          ell_status: string
          folder_id: string | null
          group_name: string
          home_language: string
          id: string
          iep_504_status: string
          learning_preferences: string[] | null
          notes: string | null
          num_students: number
          organization_id: string | null
          reading_level_label: string
          reading_level_lexile: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accommodations?: string[] | null
          created_at?: string
          ell_status?: string
          folder_id?: string | null
          group_name: string
          home_language?: string
          id?: string
          iep_504_status?: string
          learning_preferences?: string[] | null
          notes?: string | null
          num_students?: number
          organization_id?: string | null
          reading_level_label?: string
          reading_level_lexile?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accommodations?: string[] | null
          created_at?: string
          ell_status?: string
          folder_id?: string | null
          group_name?: string
          home_language?: string
          id?: string
          iep_504_status?: string
          learning_preferences?: string[] | null
          notes?: string | null
          num_students?: number
          organization_id?: string | null
          reading_level_label?: string
          reading_level_lexile?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_groups_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "class_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          override_type: string
          trial_end_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          override_type: string
          trial_end_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          override_type?: string
          trial_end_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_ticket_replies: {
        Row: {
          attachments: string[] | null
          author_id: string | null
          author_name: string
          created_at: string | null
          id: string
          is_admin: boolean | null
          is_internal_note: boolean | null
          message: string
          ticket_id: string | null
        }
        Insert: {
          attachments?: string[] | null
          author_id?: string | null
          author_name: string
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          is_internal_note?: boolean | null
          message: string
          ticket_id?: string | null
        }
        Update: {
          attachments?: string[] | null
          author_id?: string | null
          author_name?: string
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          is_internal_note?: boolean | null
          message?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          browser_info: string | null
          category: string
          created_at: string | null
          description: string
          error_messages: string | null
          id: string
          last_admin_reply_at: string | null
          last_user_reply_at: string | null
          page_url: string | null
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          screenshots: string[] | null
          status: string | null
          subject: string
          ticket_number: string
          updated_at: string | null
          user_email: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          assigned_to?: string | null
          browser_info?: string | null
          category: string
          created_at?: string | null
          description: string
          error_messages?: string | null
          id?: string
          last_admin_reply_at?: string | null
          last_user_reply_at?: string | null
          page_url?: string | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshots?: string[] | null
          status?: string | null
          subject: string
          ticket_number: string
          updated_at?: string | null
          user_email: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          assigned_to?: string | null
          browser_info?: string | null
          category?: string
          created_at?: string | null
          description?: string
          error_messages?: string | null
          id?: string
          last_admin_reply_at?: string | null
          last_user_reply_at?: string | null
          page_url?: string | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshots?: string[] | null
          status?: string | null
          subject?: string
          ticket_number?: string
          updated_at?: string | null
          user_email?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      usage_analytics: {
        Row: {
          created_at: string | null
          date: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          comparison_to_other_tools: string | null
          created_at: string | null
          ease_of_use: number | null
          favorite_features: string | null
          feature_completeness: number | null
          feedback_type: string | null
          grade_levels: string[] | null
          id: string
          improvement_suggestions: string | null
          incentive_claim_date: string | null
          incentive_claimed: boolean | null
          missing_features: string | null
          overall_satisfaction: number | null
          pain_points: string | null
          recommendation_reason: string | null
          subject_areas: string[] | null
          success_stories: string | null
          updated_at: string | null
          usage_frequency: string
          use_cases: string | null
          user_id: string
          user_role: string | null
          would_recommend: boolean | null
          years_teaching: number | null
        }
        Insert: {
          comparison_to_other_tools?: string | null
          created_at?: string | null
          ease_of_use?: number | null
          favorite_features?: string | null
          feature_completeness?: number | null
          feedback_type?: string | null
          grade_levels?: string[] | null
          id?: string
          improvement_suggestions?: string | null
          incentive_claim_date?: string | null
          incentive_claimed?: boolean | null
          missing_features?: string | null
          overall_satisfaction?: number | null
          pain_points?: string | null
          recommendation_reason?: string | null
          subject_areas?: string[] | null
          success_stories?: string | null
          updated_at?: string | null
          usage_frequency: string
          use_cases?: string | null
          user_id: string
          user_role?: string | null
          would_recommend?: boolean | null
          years_teaching?: number | null
        }
        Update: {
          comparison_to_other_tools?: string | null
          created_at?: string | null
          ease_of_use?: number | null
          favorite_features?: string | null
          feature_completeness?: number | null
          feedback_type?: string | null
          grade_levels?: string[] | null
          id?: string
          improvement_suggestions?: string | null
          incentive_claim_date?: string | null
          incentive_claimed?: boolean | null
          missing_features?: string | null
          overall_satisfaction?: number | null
          pain_points?: string | null
          recommendation_reason?: string | null
          subject_areas?: string[] | null
          success_stories?: string | null
          updated_at?: string | null
          usage_frequency?: string
          use_cases?: string | null
          user_id?: string
          user_role?: string | null
          would_recommend?: boolean | null
          years_teaching?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          ip_address: string | null
          last_active_at: string
          session_duration_seconds: number | null
          session_id: string
          session_started_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          last_active_at?: string
          session_duration_seconds?: number | null
          session_id: string
          session_started_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          last_active_at?: string
          session_duration_seconds?: number | null
          session_id?: string
          session_started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_time_stats: {
        Row: {
          created_at: string | null
          id: string
          last_session_duration_seconds: number | null
          last_updated: string | null
          total_time_seconds: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_session_duration_seconds?: number | null
          last_updated?: string | null
          total_time_seconds?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_session_duration_seconds?: number | null
          last_updated?: string | null
          total_time_seconds?: number
          user_id?: string
        }
        Relationships: []
      }
      vocabulary_audio: {
        Row: {
          created_at: string | null
          definition: string | null
          english_definition_audio_url: string | null
          english_term_audio_url: string | null
          group_id: string | null
          group_name: string
          home_language: string | null
          home_language_definition_audio_url: string | null
          home_language_term_audio_url: string | null
          id: string
          lesson_id: string
          term: string
          translated_definition: string | null
          translated_term: string | null
          vocab_id: string
        }
        Insert: {
          created_at?: string | null
          definition?: string | null
          english_definition_audio_url?: string | null
          english_term_audio_url?: string | null
          group_id?: string | null
          group_name: string
          home_language?: string | null
          home_language_definition_audio_url?: string | null
          home_language_term_audio_url?: string | null
          id?: string
          lesson_id: string
          term: string
          translated_definition?: string | null
          translated_term?: string | null
          vocab_id: string
        }
        Update: {
          created_at?: string | null
          definition?: string | null
          english_definition_audio_url?: string | null
          english_term_audio_url?: string | null
          group_id?: string | null
          group_name?: string
          home_language?: string | null
          home_language_definition_audio_url?: string | null
          home_language_term_audio_url?: string | null
          id?: string
          lesson_id?: string
          term?: string
          translated_definition?: string | null
          translated_term?: string | null
          vocab_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_audio_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_audio_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "generated_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_account_locked: {
        Args: { p_email: string }
        Returns: {
          is_locked: boolean
          locked_timestamp: string
        }[]
      }
      check_email_exists: { Args: { p_email: string }; Returns: boolean }
      cleanup_inactive_sessions: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      count_active_sessions: { Args: { p_user_id: string }; Returns: number }
      generate_ticket_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_failed_login: {
        Args: { p_email: string }
        Returns: {
          attempts: number
          is_locked: boolean
        }[]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      reset_failed_login: { Args: { p_user_id: string }; Returns: undefined }
      update_login_stats: { Args: { p_user_id: string }; Returns: undefined }
      update_user_time_stats: {
        Args: { p_duration_seconds: number; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "moderator" | "user"
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
      app_role: ["super_admin", "admin", "moderator", "user"],
    },
  },
} as const
