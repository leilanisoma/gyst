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
      documents: {
        Row: {
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
            foreignKeyName: "events_user_id_fkey"
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
          fingerprint: string
          id: string
          is_finance: boolean
          is_swe: boolean
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
          fingerprint: string
          id?: string
          is_finance?: boolean
          is_swe?: boolean
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
          fingerprint?: string
          id?: string
          is_finance?: boolean
          is_swe?: boolean
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
          source_inbox_item_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: string
          created_at?: string
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
          source_inbox_item_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
