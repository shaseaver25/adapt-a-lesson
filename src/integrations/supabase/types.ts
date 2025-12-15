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
          updated_at?: string
          user_id?: string | null
          verification_checkpoints?: string[] | null
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
        Relationships: []
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
