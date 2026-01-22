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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      gift_purchases: {
        Row: {
          amount: number
          external_payment_id: string | null
          gift_id: string
          id: string
          payment_gateway: string | null
          payment_status: string
          purchased_at: string
          purchaser_email: string | null
          purchaser_name: string
        }
        Insert: {
          amount: number
          external_payment_id?: string | null
          gift_id: string
          id?: string
          payment_gateway?: string | null
          payment_status?: string
          purchased_at?: string
          purchaser_email?: string | null
          purchaser_name: string
        }
        Update: {
          amount?: number
          external_payment_id?: string | null
          gift_id?: string
          id?: string
          payment_gateway?: string | null
          payment_status?: string
          purchased_at?: string
          purchaser_email?: string | null
          purchaser_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_purchases_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          purchase_count: number
          purchase_limit: number
          purchased: boolean
          purchased_at: string | null
          purchaser_email: string | null
          purchaser_name: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          purchase_count?: number
          purchase_limit?: number
          purchased?: boolean
          purchased_at?: string | null
          purchaser_email?: string | null
          purchaser_name?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          purchase_count?: number
          purchase_limit?: number
          purchased?: boolean
          purchased_at?: string | null
          purchaser_email?: string | null
          purchaser_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      guest_companions: {
        Row: {
          age: number | null
          created_at: string
          guest_id: string
          id: string
          name: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          guest_id: string
          id?: string
          name: string
        }
        Update: {
          age?: number | null
          created_at?: string
          guest_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_companions_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          age: number | null
          companions: number
          created_at: string
          email: string | null
          id: string
          invitation_code: string | null
          message: string | null
          name: string
          phone: string | null
          rsvp_status: Database["public"]["Enums"]["rsvp_status"]
          updated_at: string
        }
        Insert: {
          age?: number | null
          companions?: number
          created_at?: string
          email?: string | null
          id?: string
          invitation_code?: string | null
          message?: string | null
          name: string
          phone?: string | null
          rsvp_status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
        }
        Update: {
          age?: number | null
          companions?: number
          created_at?: string
          email?: string | null
          id?: string
          invitation_code?: string | null
          message?: string | null
          name?: string
          phone?: string | null
          rsvp_status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          approved: boolean
          content: string
          created_at: string
          guest_email: string | null
          guest_name: string
          id: string
        }
        Insert: {
          approved?: boolean
          content: string
          created_at?: string
          guest_email?: string | null
          guest_name: string
          id?: string
        }
        Update: {
          approved?: boolean
          content?: string
          created_at?: string
          guest_email?: string | null
          guest_name?: string
          id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      wedding_settings: {
        Row: {
          account_holder: string | null
          bank_name: string | null
          bride_name: string
          ceremony_address: string | null
          ceremony_location: string | null
          ceremony_map_url: string | null
          created_at: string
          dress_code: string | null
          gift_purchase_limit: number
          groom_name: string
          id: string
          pix_key: string | null
          reception_address: string | null
          reception_location: string | null
          reception_map_url: string | null
          story_text: string | null
          updated_at: string
          wedding_date: string | null
        }
        Insert: {
          account_holder?: string | null
          bank_name?: string | null
          bride_name?: string
          ceremony_address?: string | null
          ceremony_location?: string | null
          ceremony_map_url?: string | null
          created_at?: string
          dress_code?: string | null
          gift_purchase_limit?: number
          groom_name?: string
          id?: string
          pix_key?: string | null
          reception_address?: string | null
          reception_location?: string | null
          reception_map_url?: string | null
          story_text?: string | null
          updated_at?: string
          wedding_date?: string | null
        }
        Update: {
          account_holder?: string | null
          bank_name?: string | null
          bride_name?: string
          ceremony_address?: string | null
          ceremony_location?: string | null
          ceremony_map_url?: string | null
          created_at?: string
          dress_code?: string | null
          gift_purchase_limit?: number
          groom_name?: string
          id?: string
          pix_key?: string | null
          reception_address?: string | null
          reception_location?: string | null
          reception_map_url?: string | null
          story_text?: string | null
          updated_at?: string
          wedding_date?: string | null
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      rsvp_status: "pending" | "confirmed" | "declined"
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
      app_role: ["admin", "user"],
      rsvp_status: ["pending", "confirmed", "declined"],
    },
  },
} as const
