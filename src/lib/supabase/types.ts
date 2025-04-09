export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["activity_event_type"]
          id: string
          metadata: Json | null
          target_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["activity_event_type"]
          id?: string
          metadata?: Json | null
          target_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["activity_event_type"]
          id?: string
          metadata?: Json | null
          target_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_query_log: {
        Row: {
          created_at: string
          id: string
          prompt: string
          response_summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt: string
          response_summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt?: string
          response_summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_query_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      car_listings: {
        Row: {
          body_type: string | null
          condition: Database["public"]["Enums"]["car_condition"]
          created_at: string
          dealer_id: string
          description: string | null
          engine: string | null
          exterior_color: string | null
          features: string[] | null
          fuel_type: string | null
          id: string
          images: string[] | null
          interior_color: string | null
          is_public: boolean
          is_shared_with_network: boolean
          listing_type: Database["public"]["Enums"]["listing_type"]
          location_city: string | null
          location_country: string | null
          make: string
          max_rental_days: number | null
          mileage: number | null
          min_rental_days: number | null
          model: string
          price: number | null
          rental_daily_price: number | null
          rental_deposit_required: number | null
          rental_status: Database["public"]["Enums"]["rental_status"] | null
          seller_name: string | null
          seller_since: string | null
          status: Database["public"]["Enums"]["listing_status"]
          transmission: string | null
          updated_at: string
          vin: string | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          condition: Database["public"]["Enums"]["car_condition"]
          created_at?: string
          dealer_id: string
          description?: string | null
          engine?: string | null
          exterior_color?: string | null
          features?: string[] | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          interior_color?: string | null
          is_public?: boolean
          is_shared_with_network?: boolean
          listing_type?: Database["public"]["Enums"]["listing_type"]
          location_city?: string | null
          location_country?: string | null
          make: string
          max_rental_days?: number | null
          mileage?: number | null
          min_rental_days?: number | null
          model: string
          price?: number | null
          rental_daily_price?: number | null
          rental_deposit_required?: number | null
          rental_status?: Database["public"]["Enums"]["rental_status"] | null
          seller_name?: string | null
          seller_since?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          transmission?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          condition?: Database["public"]["Enums"]["car_condition"]
          created_at?: string
          dealer_id?: string
          description?: string | null
          engine?: string | null
          exterior_color?: string | null
          features?: string[] | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          interior_color?: string | null
          is_public?: boolean
          is_shared_with_network?: boolean
          listing_type?: Database["public"]["Enums"]["listing_type"]
          location_city?: string | null
          location_country?: string | null
          make?: string
          max_rental_days?: number | null
          mileage?: number | null
          min_rental_days?: number | null
          model?: string
          price?: number | null
          rental_daily_price?: number | null
          rental_deposit_required?: number | null
          rental_status?: Database["public"]["Enums"]["rental_status"] | null
          seller_name?: string | null
          seller_since?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          transmission?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "car_listings_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["commission_status"]
          tipper_id: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          tipper_id: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          tipper_id?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_tipper_id_fkey"
            columns: ["tipper_id"]
            isOneToOne: false
            referencedRelation: "tippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      dealerships: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_user_id: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_user_id: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealerships_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          from_user_id: string | null
          id: string
          listing_id: string
          message: string | null
          name: string | null
          phone: string | null
          source_id: string | null
          source_type: Database["public"]["Enums"]["lead_source_type"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          from_user_id?: string | null
          id?: string
          listing_id: string
          message?: string | null
          name?: string | null
          phone?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["lead_source_type"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          from_user_id?: string | null
          id?: string
          listing_id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["lead_source_type"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "tippers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          id: string
          listing_id: string | null
          read_at: string | null
          receiver_id: string
          sender_id: string
          sent_at: string
        }
        Insert: {
          content: string
          id?: string
          listing_id?: string | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
          sent_at?: string
        }
        Update: {
          content?: string
          id?: string
          listing_id?: string | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_reservations: {
        Row: {
          created_at: string
          end_date: string
          id: string
          listing_id: string
          renter_id: string
          start_date: string
          status: Database["public"]["Enums"]["reservation_status"]
          total_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          listing_id: string
          renter_id: string
          start_date: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          listing_id?: string
          renter_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_reservations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_reservations_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
          transaction_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
          transaction_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      tippers: {
        Row: {
          commission_rate: number | null
          created_at: string
          dealership_id: string | null
          id: string
          status: Database["public"]["Enums"]["tipper_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string
          dealership_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["tipper_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate?: number | null
          created_at?: string
          dealership_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["tipper_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tippers_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tippers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          agreed_price: number
          buyer_id: string
          completed_at: string | null
          created_at: string
          id: string
          listing_id: string
          seller_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          updated_at: string
        }
        Insert: {
          agreed_price: number
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          listing_id: string
          seller_id: string
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
        }
        Update: {
          agreed_price?: number
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_commission_tipper: {
        Args: {
          commission_id_to_check: string
        }
        Returns: boolean
      }
      is_listing_dealer: {
        Args: {
          listing_id_to_check: string
        }
        Returns: boolean
      }
      is_reservation_renter: {
        Args: {
          reservation_id_to_check: string
        }
        Returns: boolean
      }
      is_transaction_participant: {
        Args: {
          transaction_id_to_check: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_event_type:
        | "login"
        | "view_listing"
        | "submit_lead"
        | "create_listing"
        | "update_listing"
        | "delete_listing"
        | "create_reservation"
        | "update_reservation"
        | "create_transaction"
        | "update_transaction"
        | "etc..."
      car_condition: "new" | "used"
      commission_status: "pending" | "paid"
      lead_source_type: "organic" | "tipper"
      lead_status: "new" | "contacted" | "closed"
      listing_status: "available" | "reserved" | "sold"
      listing_type: "sale" | "rent" | "both"
      rental_status: "available" | "rented" | "maintenance"
      reservation_status: "pending" | "confirmed" | "completed" | "cancelled"
      tipper_status: "pending" | "approved" | "rejected"
      transaction_status: "pending" | "confirmed" | "completed" | "cancelled"
      user_role: "admin" | "dealer" | "buyer" | "tipper"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
