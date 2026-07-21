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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_usage_events: {
        Row: {
          created_at: string
          feature: string
          id: string
          input_tokens: number
          output_tokens: number
          provider: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          input_tokens?: number
          output_tokens?: number
          provider: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          input_tokens?: number
          output_tokens?: number
          provider?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_events: {
        Row: {
          application_id: string
          from_stage: string | null
          id: string
          note: string | null
          occurred_at: string
          to_stage: string
        }
        Insert: {
          application_id: string
          from_stage?: string | null
          id?: string
          note?: string | null
          occurred_at?: string
          to_stage: string
        }
        Update: {
          application_id?: string
          from_stage?: string | null
          id?: string
          note?: string | null
          occurred_at?: string
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          created_at: string
          id: string
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          opportunity_id: string
          prep_notes: string | null
          resume_document_id: string | null
          stage: string
          submitted_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          opportunity_id: string
          prep_notes?: string | null
          resume_document_id?: string | null
          stage?: string
          submitted_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          opportunity_id?: string
          prep_notes?: string | null
          resume_document_id?: string | null
          stage?: string
          submitted_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_document_id_fkey"
            columns: ["resume_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assignment_id: string | null
          confidence: number | null
          confirmed: boolean
          course_id: string
          coverage: string | null
          created_at: string
          dismissed_at: string | null
          id: string
          kind: string
          location: string | null
          preparation_status: string
          scheduled_at: string | null
          source: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          confidence?: number | null
          confirmed?: boolean
          course_id: string
          coverage?: string | null
          created_at?: string
          dismissed_at?: string | null
          id?: string
          kind?: string
          location?: string | null
          preparation_status?: string
          scheduled_at?: string | null
          source?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          confidence?: number | null
          confirmed?: boolean
          course_id?: string
          coverage?: string | null
          created_at?: string
          dismissed_at?: string | null
          id?: string
          kind?: string
          location?: string | null
          preparation_status?: string
          scheduled_at?: string | null
          source?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          canvas_assignment_id: string | null
          course_id: string
          created_at: string
          due_at: string | null
          html_url: string | null
          id: string
          points_possible: number | null
          submission_types: string[]
          submitted: boolean
          submitted_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canvas_assignment_id?: string | null
          course_id: string
          created_at?: string
          due_at?: string | null
          html_url?: string | null
          id?: string
          points_possible?: number | null
          submission_types?: string[]
          submitted?: boolean
          submitted_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canvas_assignment_id?: string | null
          course_id?: string
          created_at?: string
          due_at?: string | null
          html_url?: string | null
          id?: string
          points_possible?: number | null
          submission_types?: string[]
          submitted?: boolean
          submitted_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_actions: {
        Row: {
          action_type: string
          arguments: Json
          conversation_id: string | null
          created_at: string
          error: string | null
          id: string
          preview: string
          result: Json | null
          source_message_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: string
          arguments: Json
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          preview: string
          result?: Json | null
          source_message_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          arguments?: Json
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          preview?: string
          result?: Json | null
          source_message_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_actions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_actions_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          capacity_minutes: number | null
          check_in_date: string
          created_at: string
          energy: string | null
          id: string
          mood: string | null
          note: string | null
          sleep_perception: string | null
          stress: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          capacity_minutes?: number | null
          check_in_date?: string
          created_at?: string
          energy?: string | null
          id?: string
          mood?: string | null
          note?: string | null
          sleep_perception?: string | null
          stress?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          capacity_minutes?: number | null
          check_in_date?: string
          created_at?: string
          energy?: string | null
          id?: string
          mood?: string | null
          note?: string | null
          sleep_perception?: string | null
          stress?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          domain: string | null
          established: boolean
          id: string
          name: string
          notes: string | null
          size_category: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          established?: boolean
          id?: string
          name: string
          notes?: string | null
          size_category?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          established?: boolean
          id?: string
          name?: string
          notes?: string | null
          size_category?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          last_contacted_at: string | null
          linkedin_url: string | null
          name: string
          next_contact_at: string | null
          notes: string | null
          relationship: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          linkedin_url?: string | null
          name: string
          next_contact_at?: string | null
          notes?: string | null
          relationship?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          linkedin_url?: string | null
          name?: string
          next_contact_at?: string | null
          notes?: string | null
          relationship?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          summary: string | null
          summary_through_created_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          summary?: string | null
          summary_through_created_at?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          summary?: string | null
          summary_through_created_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          active: boolean
          canvas_course_id: string | null
          course_code: string | null
          created_at: string
          id: string
          instructor: string | null
          term: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          canvas_course_id?: string | null
          course_code?: string | null
          created_at?: string
          id?: string
          instructor?: string | null
          term?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          canvas_course_id?: string | null
          course_code?: string | null
          created_at?: string
          id?: string
          instructor?: string | null
          term?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_observations: {
        Row: {
          created_at: string
          flow: string | null
          id: string
          note_encrypted: string | null
          observation_date: string
          source: string
          symptoms: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          flow?: string | null
          id?: string
          note_encrypted?: string | null
          observation_date: string
          source?: string
          symptoms?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          flow?: string | null
          id?: string
          note_encrypted?: string | null
          observation_date?: string
          source?: string
          symptoms?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycle_observations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_plans: {
        Row: {
          created_at: string
          id: string
          outcome_1: string | null
          outcome_2: string | null
          outcome_3: string | null
          plan_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          outcome_1?: string | null
          outcome_2?: string | null
          outcome_3?: string | null
          plan_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          outcome_1?: string | null
          outcome_2?: string | null
          outcome_3?: string | null
          plan_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          content_hash: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          page: number | null
          user_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          content_hash: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          page?: number | null
          user_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          content_hash?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          page?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          course_id: string | null
          created_at: string
          file_name: string
          id: string
          is_active: boolean
          kind: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          file_name: string
          id?: string
          is_active?: boolean
          kind: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          file_name?: string
          id?: string
          is_active?: boolean
          kind?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drafts: {
        Row: {
          application_id: string
          content: string
          created_at: string
          evidence_document_ids: string[]
          id: string
          kind: string
          resume_document_id: string | null
          status: string
          unsupported_claims: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          content?: string
          created_at?: string
          evidence_document_ids?: string[]
          id?: string
          kind: string
          resume_document_id?: string | null
          status?: string
          unsupported_claims?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          content?: string
          created_at?: string
          evidence_document_ids?: string[]
          id?: string
          kind?: string
          resume_document_id?: string | null
          status?: string
          unsupported_claims?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drafts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drafts_resume_document_id_fkey"
            columns: ["resume_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean
          calendar_id: string | null
          course_id: string | null
          created_at: string
          deleted_at: string | null
          end_at: string
          id: string
          is_fixed_commitment: boolean
          kind: string
          location: string | null
          recurring_source_id: string | null
          source: string
          source_id: string | null
          start_at: string
          time_zone: string | null
          title: string
          travel_buffer_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          calendar_id?: string | null
          course_id?: string | null
          created_at?: string
          deleted_at?: string | null
          end_at: string
          id?: string
          is_fixed_commitment?: boolean
          kind?: string
          location?: string | null
          recurring_source_id?: string | null
          source?: string
          source_id?: string | null
          start_at: string
          time_zone?: string | null
          title: string
          travel_buffer_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          calendar_id?: string | null
          course_id?: string | null
          created_at?: string
          deleted_at?: string | null
          end_at?: string
          id?: string
          is_fixed_commitment?: boolean
          kind?: string
          location?: string | null
          recurring_source_id?: string | null
          source?: string
          source_id?: string | null
          start_at?: string
          time_zone?: string | null
          title?: string
          travel_buffer_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_drafts: {
        Row: {
          content: string
          created_at: string
          gmail_draft_id: string | null
          gmail_item_id: string | null
          gmail_thread_id: string
          id: string
          in_reply_to_message_id: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          gmail_draft_id?: string | null
          gmail_item_id?: string | null
          gmail_thread_id: string
          id?: string
          in_reply_to_message_id: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          gmail_draft_id?: string | null
          gmail_item_id?: string | null
          gmail_thread_id?: string
          id?: string
          in_reply_to_message_id?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gmail_drafts_gmail_item_id_fkey"
            columns: ["gmail_item_id"]
            isOneToOne: false
            referencedRelation: "gmail_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gmail_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_items: {
        Row: {
          confidence: number | null
          confirmed: boolean
          created_at: string
          date_at: string | null
          dismissed_at: string | null
          excerpt_encrypted: string | null
          expires_at: string
          gmail_message_id: string
          gmail_thread_id: string
          id: string
          kind: string
          requested_action: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          confirmed?: boolean
          created_at?: string
          date_at?: string | null
          dismissed_at?: string | null
          excerpt_encrypted?: string | null
          expires_at: string
          gmail_message_id: string
          gmail_thread_id: string
          id?: string
          kind: string
          requested_action?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          confirmed?: boolean
          created_at?: string
          date_at?: string | null
          dismissed_at?: string | null
          excerpt_encrypted?: string | null
          expires_at?: string
          gmail_message_id?: string
          gmail_thread_id?: string
          id?: string
          kind?: string
          requested_action?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gmail_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_processed_messages: {
        Row: {
          gmail_message_id: string
          id: string
          processed_at: string
          user_id: string
        }
        Insert: {
          gmail_message_id: string
          id?: string
          processed_at?: string
          user_id: string
        }
        Update: {
          gmail_message_id?: string
          id?: string
          processed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gmail_processed_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          horizon: string
          id: string
          progress_type: string
          status: string
          success_definition: string | null
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          horizon?: string
          id?: string
          progress_type?: string
          status?: string
          success_definition?: string | null
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          horizon?: string
          id?: string
          progress_type?: string
          status?: string
          success_definition?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_daily_summaries: {
        Row: {
          active_energy_kcal: number | null
          created_at: string
          id: string
          resting_heart_rate: number | null
          sleep_minutes: number | null
          source: string
          steps: number | null
          summary_date: string
          synced_at: string
          updated_at: string
          user_id: string
          workout_minutes: number | null
        }
        Insert: {
          active_energy_kcal?: number | null
          created_at?: string
          id?: string
          resting_heart_rate?: number | null
          sleep_minutes?: number | null
          source?: string
          steps?: number | null
          summary_date: string
          synced_at?: string
          updated_at?: string
          user_id: string
          workout_minutes?: number | null
        }
        Update: {
          active_energy_kcal?: number | null
          created_at?: string
          id?: string
          resting_heart_rate?: number | null
          sleep_minutes?: number | null
          source?: string
          steps?: number | null
          summary_date?: string
          synced_at?: string
          updated_at?: string
          user_id?: string
          workout_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_daily_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_items: {
        Row: {
          converted_id: string | null
          converted_to: string | null
          created_at: string
          id: string
          raw_text: string
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          converted_id?: string | null
          converted_to?: string | null
          created_at?: string
          id?: string
          raw_text: string
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          converted_id?: string | null
          converted_to?: string | null
          created_at?: string
          id?: string
          raw_text?: string
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          account_email: string | null
          created_at: string
          error: string | null
          granted_scopes: string[]
          id: string
          last_synced_at: string | null
          provider: string
          settings: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_email?: string | null
          created_at?: string
          error?: string | null
          granted_scopes?: string[]
          id?: string
          last_synced_at?: string | null
          provider: string
          settings?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_email?: string | null
          created_at?: string
          error?: string | null
          granted_scopes?: string[]
          id?: string
          last_synced_at?: string | null
          provider?: string
          settings?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          application_id: string | null
          contact_id: string
          created_at: string
          follow_up_at: string | null
          id: string
          kind: string
          occurred_at: string
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          contact_id: string
          created_at?: string
          follow_up_at?: string | null
          id?: string
          kind?: string
          occurred_at?: string
          summary: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          contact_id?: string
          created_at?: string
          follow_up_at?: string | null
          id?: string
          kind?: string
          occurred_at?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_scores: {
        Row: {
          computed_at: string
          deadline_urgency_score: number
          eligibility_score: number
          established_company_score: number
          excluded: boolean
          exclusion_reason: string | null
          explanation: string
          id: string
          interest_industry_score: number
          opportunity_id: string
          role_family_score: number
          score_version: number
          skills_experience_score: number
          total_score: number
          user_feedback_score: number
        }
        Insert: {
          computed_at?: string
          deadline_urgency_score?: number
          eligibility_score?: number
          established_company_score?: number
          excluded?: boolean
          exclusion_reason?: string | null
          explanation?: string
          id?: string
          interest_industry_score?: number
          opportunity_id: string
          role_family_score?: number
          score_version?: number
          skills_experience_score?: number
          total_score?: number
          user_feedback_score?: number
        }
        Update: {
          computed_at?: string
          deadline_urgency_score?: number
          eligibility_score?: number
          established_company_score?: number
          excluded?: boolean
          exclusion_reason?: string | null
          explanation?: string
          id?: string
          interest_industry_score?: number
          opportunity_id?: string
          role_family_score?: number
          score_version?: number
          skills_experience_score?: number
          total_score?: number
          user_feedback_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_scores_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: true
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_items: {
        Row: {
          confidence: number | null
          created_at: string
          embedding: string | null
          id: string
          kind: string
          last_used_at: string | null
          learned_at: string
          source: string
          source_message_id: string | null
          status: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          embedding?: string | null
          id?: string
          kind: string
          last_used_at?: string | null
          learned_at?: string
          source: string
          source_message_id?: string | null
          status?: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          embedding?: string | null
          id?: string
          kind?: string
          last_used_at?: string | null
          learned_at?: string
          source?: string
          source_message_id?: string | null
          status?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_items_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_links: {
        Row: {
          created_at: string
          id: string
          linked_id: string
          linked_table: string
          memory_item_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_id: string
          linked_table: string
          memory_item_id: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_id?: string
          linked_table?: string
          memory_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_links_memory_item_id_fkey"
            columns: ["memory_item_id"]
            isOneToOne: false
            referencedRelation: "memory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          input_tokens: number | null
          output_tokens: number | null
          role: string
          tool_call_id: string | null
          tool_calls: Json | null
          tool_name: string | null
          user_id: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          input_tokens?: number | null
          output_tokens?: number | null
          role: string
          tool_call_id?: string | null
          tool_calls?: Json | null
          tool_name?: string | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          input_tokens?: number | null
          output_tokens?: number | null
          role?: string
          tool_call_id?: string | null
          tool_calls?: Json | null
          tool_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_suggestions: {
        Row: {
          assessment_id: string | null
          assignment_id: string | null
          created_at: string
          created_task_id: string | null
          due_date: string
          estimated_minutes: number | null
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id?: string | null
          assignment_id?: string | null
          created_at?: string
          created_task_id?: string | null
          due_date: string
          estimated_minutes?: number | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string | null
          assignment_id?: string | null
          created_at?: string
          created_task_id?: string | null
          due_date?: string
          estimated_minutes?: number | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_suggestions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_suggestions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_suggestions_created_task_id_fkey"
            columns: ["created_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_tokens: {
        Row: {
          access_token_encrypted: string
          created_at: string
          expires_at: string
          id: string
          provider: string
          refresh_token_encrypted: string | null
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted: string
          created_at?: string
          expires_at: string
          id?: string
          provider: string
          refresh_token_encrypted?: string | null
          scope?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string
          refresh_token_encrypted?: string | null
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          deadline: string | null
          description: string | null
          eligible_grad_years: number[]
          external_id: string | null
          feedback: string | null
          fingerprint: string
          id: string
          is_finance: boolean
          is_swe: boolean
          last_seen_at: string | null
          location: string | null
          posted_at: string | null
          role_family: string
          source: string
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligible_grad_years?: number[]
          external_id?: string | null
          feedback?: string | null
          fingerprint: string
          id?: string
          is_finance?: boolean
          is_swe?: boolean
          last_seen_at?: string | null
          location?: string | null
          posted_at?: string | null
          role_family?: string
          source?: string
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligible_grad_years?: number[]
          external_id?: string | null
          feedback?: string | null
          fingerprint?: string
          id?: string
          is_finance?: boolean
          is_swe?: boolean
          last_seen_at?: string | null
          location?: string | null
          posted_at?: string | null
          role_family?: string
          source?: string
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      preferences: {
        Row: {
          ai_daily_dollar_limit: number | null
          ai_daily_token_limit: number | null
          buffer_minutes: number
          created_at: string
          id: string
          notification_rules: Json
          recruiting_preferences: Json
          theme: string
          updated_at: string
          working_hours_end: string
          working_hours_start: string
        }
        Insert: {
          ai_daily_dollar_limit?: number | null
          ai_daily_token_limit?: number | null
          buffer_minutes?: number
          created_at?: string
          id: string
          notification_rules?: Json
          recruiting_preferences?: Json
          theme?: string
          updated_at?: string
          working_hours_end?: string
          working_hours_start?: string
        }
        Update: {
          ai_daily_dollar_limit?: number | null
          ai_daily_token_limit?: number | null
          buffer_minutes?: number
          created_at?: string
          id?: string
          notification_rules?: Json
          recruiting_preferences?: Json
          theme?: string
          updated_at?: string
          working_hours_end?: string
          working_hours_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferences_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          area: string
          created_at: string
          description: string | null
          id: string
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_schedules: {
        Row: {
          active: boolean
          category: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          location: string | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          location?: string | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          location?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      source_configs: {
        Row: {
          adapter_id: string
          config: Json
          created_at: string
          enabled: boolean
          id: string
          label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adapter_id: string
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          label: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adapter_id?: string
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      source_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          items_created: number
          items_expired: number
          items_found: number
          items_updated: number
          source_config_id: string
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          items_created?: number
          items_expired?: number
          items_found?: number
          items_updated?: number
          source_config_id: string
          started_at?: string
          status?: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          items_created?: number
          items_expired?: number
          items_found?: number
          items_updated?: number
          source_config_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_runs_source_config_id_fkey"
            columns: ["source_config_id"]
            isOneToOne: false
            referencedRelation: "source_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_items: {
        Row: {
          confidence: number | null
          confirmed: boolean
          course_id: string
          created_at: string
          date: string | null
          description: string | null
          document_id: string | null
          id: string
          kind: string
          source_page: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          confirmed?: boolean
          course_id: string
          created_at?: string
          date?: string | null
          description?: string | null
          document_id?: string | null
          id?: string
          kind?: string
          source_page?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          confirmed?: boolean
          course_id?: string
          created_at?: string
          date?: string | null
          description?: string | null
          document_id?: string | null
          id?: string
          kind?: string
          source_page?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_runs: {
        Row: {
          error: string | null
          events_created: number
          events_deleted: number
          events_updated: number
          finished_at: string | null
          id: string
          provider: string
          retry_count: number
          started_at: string
          status: string
          sync_token: string | null
          user_id: string
        }
        Insert: {
          error?: string | null
          events_created?: number
          events_deleted?: number
          events_updated?: number
          finished_at?: string | null
          id?: string
          provider: string
          retry_count?: number
          started_at?: string
          status?: string
          sync_token?: string | null
          user_id: string
        }
        Update: {
          error?: string | null
          events_created?: number
          events_deleted?: number
          events_updated?: number
          finished_at?: string | null
          id?: string
          provider?: string
          retry_count?: number
          started_at?: string
          status?: string
          sync_token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          area: string
          created_at: string
          deadline_notified_at: string | null
          due_date: string | null
          earliest_start: string | null
          energy: string | null
          estimated_minutes: number | null
          goal_id: string | null
          id: string
          notes: string | null
          priority: string
          project_id: string | null
          rollover_count: number
          source: string
          source_assessment_id: string | null
          source_assignment_id: string | null
          source_inbox_item_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: string
          created_at?: string
          deadline_notified_at?: string | null
          due_date?: string | null
          earliest_start?: string | null
          energy?: string | null
          estimated_minutes?: number | null
          goal_id?: string | null
          id?: string
          notes?: string | null
          priority?: string
          project_id?: string | null
          rollover_count?: number
          source?: string
          source_assessment_id?: string | null
          source_assignment_id?: string | null
          source_inbox_item_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          deadline_notified_at?: string | null
          due_date?: string | null
          earliest_start?: string | null
          energy?: string | null
          estimated_minutes?: number | null
          goal_id?: string | null
          id?: string
          notes?: string | null
          priority?: string
          project_id?: string | null
          rollover_count?: number
          source?: string
          source_assessment_id?: string | null
          source_assignment_id?: string | null
          source_inbox_item_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_assessment_id_fkey"
            columns: ["source_assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_assignment_id_fkey"
            columns: ["source_assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_inbox_item_id_fkey"
            columns: ["source_inbox_item_id"]
            isOneToOne: false
            referencedRelation: "inbox_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      time_block_suggestions: {
        Row: {
          created_at: string
          end_at: string
          explanation: string | null
          google_event_id: string | null
          id: string
          score: number
          start_at: string
          status: string
          suggestion_date: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_at: string
          explanation?: string | null
          google_event_id?: string | null
          id?: string
          score?: number
          start_at: string
          status?: string
          suggestion_date?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_at?: string
          explanation?: string | null
          google_event_id?: string | null
          id?: string
          score?: number
          start_at?: string
          status?: string
          suggestion_date?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_block_suggestions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_block_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_check_ins: {
        Row: {
          ate_consistently: string | null
          check_in_date: string
          created_at: string
          energy: string | null
          id: string
          mood: string | null
          note: string | null
          recovery: string | null
          sleep_perception: string | null
          stress: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ate_consistently?: string | null
          check_in_date?: string
          created_at?: string
          energy?: string | null
          id?: string
          mood?: string | null
          note?: string | null
          recovery?: string | null
          sleep_perception?: string | null
          stress?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ate_consistently?: string | null
          check_in_date?: string
          created_at?: string
          energy?: string | null
          id?: string
          mood?: string | null
          note?: string | null
          recovery?: string | null
          sleep_perception?: string | null
          stress?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_estimates: {
        Row: {
          actual_minutes: number | null
          created_at: string
          estimator_version: string
          id: string
          predicted_minutes: number
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_minutes?: number | null
          created_at?: string
          estimator_version?: string
          id?: string
          predicted_minutes: number
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_minutes?: number | null
          created_at?: string
          estimator_version?: string
          id?: string
          predicted_minutes?: number
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_estimates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_estimates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          occurred_on: string
          points: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          occurred_on?: string
          points: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          occurred_on?: string
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_document_chunks: {
        Args: {
          p_match_count?: number
          p_query_embedding: string
          p_user_id: string
        }
        Returns: {
          chunk_index: number
          content: string
          document_id: string
          id: string
          page: number
          similarity: number
        }[]
      }
      match_memory_items: {
        Args: {
          p_match_count?: number
          p_query_embedding: string
          p_user_id: string
        }
        Returns: {
          confidence: number
          id: string
          kind: string
          similarity: number
          text: string
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
