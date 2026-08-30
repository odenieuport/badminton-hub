// Généré depuis le schéma Supabase (supabase/migrations/0001_init.sql).
// Régénérer via `mcp__Supabase__generate_typescript_types` après toute migration.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      matches: {
        Row: {
          classement_a1: number
          classement_a2: number | null
          classement_b1: number
          classement_b2: number | null
          competition_type: string
          created_at: string
          created_by: string | null
          discipline: string
          id: string
          is_walkover: boolean
          match_date: string
          score: string | null
          side_a_player1: string
          side_a_player2: string | null
          side_b_player1: string
          side_b_player2: string | null
          source: string
          winner_side: string
        }
        Insert: {
          classement_a1: number
          classement_a2?: number | null
          classement_b1: number
          classement_b2?: number | null
          competition_type: string
          created_at?: string
          created_by?: string | null
          discipline: string
          id?: string
          is_walkover?: boolean
          match_date: string
          score?: string | null
          side_a_player1: string
          side_a_player2?: string | null
          side_b_player1: string
          side_b_player2?: string | null
          source?: string
          winner_side: string
        }
        Update: {
          classement_a1?: number
          classement_a2?: number | null
          classement_b1?: number
          classement_b2?: number | null
          competition_type?: string
          created_at?: string
          created_by?: string | null
          discipline?: string
          id?: string
          is_walkover?: boolean
          match_date?: string
          score?: string | null
          side_a_player1?: string
          side_a_player2?: string | null
          side_b_player1?: string
          side_b_player2?: string | null
          source?: string
          winner_side?: string
        }
        Relationships: [
          {
            foreignKeyName: 'matches_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'matches_side_a_player1_fkey'
            columns: ['side_a_player1']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'matches_side_a_player2_fkey'
            columns: ['side_a_player2']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'matches_side_b_player1_fkey'
            columns: ['side_b_player1']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'matches_side_b_player2_fkey'
            columns: ['side_b_player2']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
      player_rankings: {
        Row: {
          classement: number
          discipline: string
          id: string
          inactivity_already_demoted: boolean
          last_change: string | null
          last_evaluation_date: string | null
          match_count_descente: number
          match_count_montee: number
          moyenne_descente: number
          moyenne_montee: number
          player_id: string
          protected_until: string | null
          updated_at: string
        }
        Insert: {
          classement?: number
          discipline: string
          id?: string
          inactivity_already_demoted?: boolean
          last_change?: string | null
          last_evaluation_date?: string | null
          match_count_descente?: number
          match_count_montee?: number
          moyenne_descente?: number
          moyenne_montee?: number
          player_id: string
          protected_until?: string | null
          updated_at?: string
        }
        Update: {
          classement?: number
          discipline?: string
          id?: string
          inactivity_already_demoted?: boolean
          last_change?: string | null
          last_evaluation_date?: string | null
          match_count_descente?: number
          match_count_montee?: number
          moyenne_descente?: number
          moyenne_montee?: number
          player_id?: string
          protected_until?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'player_rankings_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
      players: {
        Row: {
          club: string | null
          created_at: string
          first_name: string
          gender: string
          id: string
          is_foreign: boolean
          last_name: string
          license_number: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          club?: string | null
          created_at?: string
          first_name: string
          gender: string
          id?: string
          is_foreign?: boolean
          last_name: string
          license_number?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          club?: string | null
          created_at?: string
          first_name?: string
          gender?: string
          id?: string
          is_foreign?: boolean
          last_name?: string
          license_number?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      ranking_history: {
        Row: {
          classement: number
          created_at: string
          discipline: string
          evaluation_date: string
          id: string
          moyenne_descente: number
          moyenne_montee: number
          player_id: string
        }
        Insert: {
          classement: number
          created_at?: string
          discipline: string
          evaluation_date: string
          id?: string
          moyenne_descente?: number
          moyenne_montee?: number
          player_id: string
        }
        Update: {
          classement?: number
          created_at?: string
          discipline?: string
          evaluation_date?: string
          id?: string
          moyenne_descente?: number
          moyenne_montee?: number
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ranking_history_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { uid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
