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
      abandoned_carts: {
        Row: {
          abandoned_at: string | null
          cart_id: string | null
          cart_snapshot: Json
          cart_total: number | null
          id: string
          recovered: boolean | null
          recovered_at: string | null
          recovered_order_id: string | null
          user_id: string | null
        }
        Insert: {
          abandoned_at?: string | null
          cart_id?: string | null
          cart_snapshot: Json
          cart_total?: number | null
          id?: string
          recovered?: boolean | null
          recovered_at?: string | null
          recovered_order_id?: string | null
          user_id?: string | null
        }
        Update: {
          abandoned_at?: string | null
          cart_id?: string | null
          cart_snapshot?: Json
          cart_total?: number | null
          id?: string
          recovered?: boolean | null
          recovered_at?: string | null
          recovered_order_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_recovered_order_id_fkey"
            columns: ["recovered_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          amount: number
          balance: number
          created_at: string | null
          customer_id: string
          document_number: string | null
          due_date: string | null
          id: string
          notes: string | null
          paid_amount: number
          sales_order_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          balance: number
          created_at?: string | null
          customer_id: string
          document_number?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          sales_order_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          balance?: number
          created_at?: string | null
          customer_id?: string
          document_number?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          sales_order_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable_payments: {
        Row: {
          account_receivable_id: string
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference: string | null
        }
        Insert: {
          account_receivable_id: string
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference?: string | null
        }
        Update: {
          account_receivable_id?: string
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_payments_account_receivable_id_fkey"
            columns: ["account_receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_permissions: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      ai_product_recommendations: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          recommendation_type: string | null
          recommended_product_id: string
          score: number | null
          source_product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          recommendation_type?: string | null
          recommended_product_id: string
          score?: number | null
          source_product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          recommendation_type?: string | null
          recommended_product_id?: string
          score?: number | null
          source_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_product_recommendations_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_product_recommendations_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_product_recommendations_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_product_recommendations_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_product_recommendations_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_product_recommendations_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_search_queries: {
        Row: {
          clicked_product_id: string | null
          created_at: string
          embedding: string | null
          id: string
          results_count: number | null
          search_query: string
          user_id: string | null
        }
        Insert: {
          clicked_product_id?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          results_count?: number | null
          search_query: string
          user_id?: string | null
        }
        Update: {
          clicked_product_id?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          results_count?: number | null
          search_query?: string
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          page: string | null
          referrer: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          page?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      approvals: {
        Row: {
          approval_type: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          description: string | null
          id: string
          reference_id: string
          reference_type: string
          rejected_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          approval_type: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id: string
          reference_type: string
          rejected_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          approval_type?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string
          reference_type?: string
          rejected_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          action_type: string
          code: string
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_event: string
        }
        Insert: {
          action_type: string
          code: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_event: string
        }
        Update: {
          action_type?: string
          code?: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_event?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string | null
          cart_id: string
          customer_type: string
          id: string
          image_url: string | null
          line_total: number | null
          product_name: string
          quantity: number
          sku: string | null
          unit_price: number
          updated_at: string | null
          variant_id: string
          variant_name: string | null
        }
        Insert: {
          added_at?: string | null
          cart_id: string
          customer_type: string
          id?: string
          image_url?: string | null
          line_total?: number | null
          product_name: string
          quantity: number
          sku?: string | null
          unit_price: number
          updated_at?: string | null
          variant_id: string
          variant_name?: string | null
        }
        Update: {
          added_at?: string | null
          cart_id?: string
          customer_type?: string
          id?: string
          image_url?: string | null
          line_total?: number | null
          product_name?: string
          quantity?: number
          sku?: string | null
          unit_price?: number
          updated_at?: string | null
          variant_id?: string
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          converted_at: string | null
          created_at: string | null
          currency: string
          customer_type: string
          discount_total: number | null
          expires_at: string | null
          id: string
          session_id: string | null
          status: string
          subtotal: number | null
          total: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string | null
          currency?: string
          customer_type?: string
          discount_total?: number | null
          expires_at?: string | null
          id?: string
          session_id?: string | null
          status?: string
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string | null
          currency?: string
          customer_type?: string
          discount_total?: number | null
          expires_at?: string | null
          id?: string
          session_id?: string | null
          status?: string
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          code_prefix: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code_prefix?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code_prefix?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cold_chain_logs: {
        Row: {
          delivery_id: string | null
          humidity: number | null
          id: string
          notes: string | null
          recorded_at: string
          route_id: string | null
          temperature: number | null
        }
        Insert: {
          delivery_id?: string | null
          humidity?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string
          route_id?: string | null
          temperature?: number | null
        }
        Update: {
          delivery_id?: string | null
          humidity?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string
          route_id?: string | null
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cold_chain_logs_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cold_chain_logs_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "delivery_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      cold_chain_rules: {
        Row: {
          allow_outside_city: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_delivery_hours: number | null
          max_temperature: number | null
          min_temperature: number | null
          name: string
          requires_frozen_vehicle: boolean | null
        }
        Insert: {
          allow_outside_city?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_delivery_hours?: number | null
          max_temperature?: number | null
          min_temperature?: number | null
          name: string
          requires_frozen_vehicle?: boolean | null
        }
        Update: {
          allow_outside_city?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_delivery_hours?: number | null
          max_temperature?: number | null
          min_temperature?: number | null
          name?: string
          requires_frozen_vehicle?: boolean | null
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string | null
          discount_amount: number
          id: string
          order_id: string
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string | null
          discount_amount: number
          id?: string
          order_id: string
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string | null
          discount_amount?: number
          id?: string
          order_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          minimum_order_amount: number | null
          name: string
          starts_at: string | null
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          minimum_order_amount?: number | null
          name: string
          starts_at?: string | null
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          minimum_order_amount?: number | null
          name?: string
          starts_at?: string | null
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          city: string
          country: string | null
          created_at: string | null
          exterior_number: string | null
          id: string
          interior_number: string | null
          is_default: boolean | null
          label: string | null
          latitude: number | null
          longitude: number | null
          municipality: string | null
          neighborhood: string | null
          phone: string | null
          postal_code: string
          recipient_name: string
          references_text: string | null
          state: string
          street: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city: string
          country?: string | null
          created_at?: string | null
          exterior_number?: string | null
          id?: string
          interior_number?: string | null
          is_default?: boolean | null
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          neighborhood?: string | null
          phone?: string | null
          postal_code: string
          recipient_name: string
          references_text?: string | null
          state: string
          street: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string
          country?: string | null
          created_at?: string | null
          exterior_number?: string | null
          id?: string
          interior_number?: string | null
          is_default?: boolean | null
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          neighborhood?: string | null
          phone?: string | null
          postal_code?: string
          recipient_name?: string
          references_text?: string | null
          state?: string
          street?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customer_credit_accounts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          available_credit: number
          created_at: string
          credit_limit: number
          current_balance: number
          id: string
          is_active: boolean
          metadata: Json
          notes: string | null
          payment_term_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          available_credit?: number
          created_at?: string
          credit_limit?: number
          current_balance?: number
          id?: string
          is_active?: boolean
          metadata?: Json
          notes?: string | null
          payment_term_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          available_credit?: number
          created_at?: string
          credit_limit?: number
          current_balance?: number
          id?: string
          is_active?: boolean
          metadata?: Json
          notes?: string | null
          payment_term_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_credit_accounts_payment_term_id_fkey"
            columns: ["payment_term_id"]
            isOneToOne: false
            referencedRelation: "payment_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_events: {
        Row: {
          created_at: string | null
          event_name: string
          event_type: string
          id: string
          metadata: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          event_type: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      customer_ltv: {
        Row: {
          average_ticket: number
          churn_risk_score: number | null
          last_order_at: string | null
          loyalty_score: number | null
          predicted_ltv: number | null
          total_orders: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_ticket?: number
          churn_risk_score?: number | null
          last_order_at?: string | null
          loyalty_score?: number | null
          predicted_ltv?: number | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_ticket?: number
          churn_risk_score?: number | null
          last_order_at?: string | null
          loyalty_score?: number | null
          predicted_ltv?: number | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_metrics: {
        Row: {
          average_order_value: number | null
          created_at: string | null
          customer_segment: string | null
          favorite_category_id: string | null
          favorite_product_id: string | null
          first_order_at: string | null
          id: string
          last_order_at: string | null
          lifetime_value: number | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_order_value?: number | null
          created_at?: string | null
          customer_segment?: string | null
          favorite_category_id?: string | null
          favorite_product_id?: string | null
          first_order_at?: string | null
          id?: string
          last_order_at?: string | null
          lifetime_value?: number | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_order_value?: number | null
          created_at?: string | null
          customer_segment?: string | null
          favorite_category_id?: string | null
          favorite_product_id?: string | null
          first_order_at?: string | null
          id?: string
          last_order_at?: string | null
          lifetime_value?: number | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_metrics_favorite_category_id_fkey"
            columns: ["favorite_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_metrics_favorite_product_id_fkey"
            columns: ["favorite_product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_metrics_favorite_product_id_fkey"
            columns: ["favorite_product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_metrics_favorite_product_id_fkey"
            columns: ["favorite_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segment_members: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          metadata: Json
          segment_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          metadata?: Json
          segment_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          metadata?: Json
          segment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_segment_members_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          rules: Json
          segment_code: string
          segment_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          rules?: Json
          segment_code: string
          segment_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          rules?: Json
          segment_code?: string
          segment_name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          created_at: string
          credit_limit: number
          current_balance: number
          customer_code: string
          customer_type: string
          deleted_at: string | null
          email: string | null
          id: string
          is_active: boolean
          mobile: string | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          credit_limit?: number
          current_balance?: number
          customer_code: string
          customer_type?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          mobile?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          credit_limit?: number
          current_balance?: number
          customer_code?: string
          customer_type?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          mobile?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string
          customer_notes: string | null
          delivered_at: string | null
          delivery_address: Json
          delivery_status: string
          driver_id: string | null
          driver_notes: string | null
          estimated_delivery_at: string | null
          id: string
          metadata: Json
          order_id: string
          requires_cold_chain: boolean
          route_id: string | null
          scheduled_delivery_at: string | null
          shipping_cost: number | null
          shipping_zone_id: string | null
          tracking_code: string | null
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          customer_notes?: string | null
          delivered_at?: string | null
          delivery_address?: Json
          delivery_status?: string
          driver_id?: string | null
          driver_notes?: string | null
          estimated_delivery_at?: string | null
          id?: string
          metadata?: Json
          order_id: string
          requires_cold_chain?: boolean
          route_id?: string | null
          scheduled_delivery_at?: string | null
          shipping_cost?: number | null
          shipping_zone_id?: string | null
          tracking_code?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          customer_notes?: string | null
          delivered_at?: string | null
          delivery_address?: Json
          delivery_status?: string
          driver_id?: string | null
          driver_notes?: string | null
          estimated_delivery_at?: string | null
          id?: string
          metadata?: Json
          order_id?: string
          requires_cold_chain?: boolean
          route_id?: string | null
          scheduled_delivery_at?: string | null
          shipping_cost?: number | null
          shipping_zone_id?: string | null
          tracking_code?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "delivery_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_shipping_zone_id_fkey"
            columns: ["shipping_zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_drivers: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          metadata: Json
          phone: string | null
          supports_frozen: boolean
          updated_at: string
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          metadata?: Json
          phone?: string | null
          supports_frozen?: boolean
          updated_at?: string
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          phone?: string | null
          supports_frozen?: boolean
          updated_at?: string
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      delivery_routes: {
        Row: {
          completed_at: string | null
          created_at: string
          driver_id: string | null
          estimated_distance_km: number | null
          estimated_duration_minutes: number | null
          id: string
          notes: string | null
          route_code: string
          route_name: string
          route_status: string
          started_at: string | null
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          driver_id?: string | null
          estimated_distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          notes?: string | null
          route_code: string
          route_name: string
          route_status?: string
          started_at?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          driver_id?: string | null
          estimated_distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          notes?: string | null
          route_code?: string
          route_name?: string
          route_status?: string
          started_at?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_routes_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_routes_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_slots: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          end_time: string
          id: string
          is_active: boolean | null
          max_orders: number | null
          name: string
          shipping_zone_id: string | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          is_active?: boolean | null
          max_orders?: number | null
          name: string
          shipping_zone_id?: string | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          max_orders?: number | null
          name?: string
          shipping_zone_id?: string | null
          start_time?: string
        }
        Relationships: []
      }
      delivery_status_history: {
        Row: {
          created_at: string
          delivery_id: string
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          status: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          delivery_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          status: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          delivery_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          status?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_status_history_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_forecasts: {
        Row: {
          average_daily_demand: number
          calculated_at: string
          forecast_quantity: number
          id: string
          period_days: number
          product_id: string
          stock_quantity: number
          suggested_production: number
          updated_at: string
        }
        Insert: {
          average_daily_demand?: number
          calculated_at?: string
          forecast_quantity?: number
          id?: string
          period_days?: number
          product_id: string
          stock_quantity?: number
          suggested_production?: number
          updated_at?: string
        }
        Update: {
          average_daily_demand?: number
          calculated_at?: string
          forecast_quantity?: number
          id?: string
          period_days?: number
          product_id?: string
          stock_quantity?: number
          suggested_production?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_forecasts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_forecasts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_forecasts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          payload: Json | null
          retries: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template: string
          to_email: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          retries?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template: string
          to_email: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          retries?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template?: string
          to_email?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          category_id: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          internal_code: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          internal_code: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          internal_code?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "families_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      flavors: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          code: string
          cost_per_unit: number | null
          created_at: string
          description: string | null
          id: string
          ingredient_type: string | null
          is_active: boolean
          metadata: Json
          minimum_stock: number | null
          name: string
          unit: string
          updated_at: string
        }
        Insert: {
          code: string
          cost_per_unit?: number | null
          created_at?: string
          description?: string | null
          id?: string
          ingredient_type?: string | null
          is_active?: boolean
          metadata?: Json
          minimum_stock?: number | null
          name: string
          unit: string
          updated_at?: string
        }
        Update: {
          code?: string
          cost_per_unit?: number | null
          created_at?: string
          description?: string | null
          id?: string
          ingredient_type?: string | null
          is_active?: boolean
          metadata?: Json
          minimum_stock?: number | null
          name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_adjustments: {
        Row: {
          adjusted_by: string | null
          adjustment: number
          created_at: string | null
          id: string
          new_stock: number
          previous_stock: number
          product_variant_id: string
          reason: string | null
        }
        Insert: {
          adjusted_by?: string | null
          adjustment: number
          created_at?: string | null
          id?: string
          new_stock: number
          previous_stock: number
          product_variant_id: string
          reason?: string | null
        }
        Update: {
          adjusted_by?: string | null
          adjustment?: number
          created_at?: string | null
          id?: string
          new_stock?: number
          previous_stock?: number
          product_variant_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batches: {
        Row: {
          batch_number: string
          created_at: string
          expires_at: string | null
          id: string
          manufactured_at: string | null
          notes: string | null
          product_id: string
          quantity: number
          remaining_quantity: number
          supplier_name: string | null
          unit_cost: number | null
          variant_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          batch_number: string
          created_at?: string
          expires_at?: string | null
          id?: string
          manufactured_at?: string | null
          notes?: string | null
          product_id: string
          quantity: number
          remaining_quantity: number
          supplier_name?: string | null
          unit_cost?: number | null
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          batch_number?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          manufactured_at?: string | null
          notes?: string | null
          product_id?: string
          quantity?: number
          remaining_quantity?: number
          supplier_name?: string | null
          unit_cost?: number | null
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_levels: {
        Row: {
          available_stock: number | null
          current_stock: number
          id: string
          maximum_stock: number | null
          minimum_stock: number
          product_id: string
          reorder_point: number | null
          reserved_stock: number
          updated_at: string
          variant_id: string | null
          warehouse_id: string
        }
        Insert: {
          available_stock?: number | null
          current_stock?: number
          id?: string
          maximum_stock?: number | null
          minimum_stock?: number
          product_id: string
          reorder_point?: number | null
          reserved_stock?: number
          updated_at?: string
          variant_id?: string | null
          warehouse_id: string
        }
        Update: {
          available_stock?: number | null
          current_stock?: number
          id?: string
          maximum_stock?: number | null
          minimum_stock?: number
          product_id?: string
          reorder_point?: number | null
          reserved_stock?: number
          updated_at?: string
          variant_id?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_locations: {
        Row: {
          aisle: number | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          level: number | null
          name: string
          position: number | null
          rack: number | null
          slug: string
          updated_at: string | null
          zone: string | null
        }
        Insert: {
          aisle?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          name: string
          position?: number | null
          rack?: number | null
          slug: string
          updated_at?: string | null
          zone?: string | null
        }
        Update: {
          aisle?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          name?: string
          position?: number | null
          rack?: number | null
          slug?: string
          updated_at?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      inventory_lots: {
        Row: {
          created_at: string
          expiration_date: string | null
          id: string
          item_id: string
          item_type: string
          lot_number: string
          manufacturing_date: string | null
          notes: string | null
          purchase_order_id: string | null
          quantity: number
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiration_date?: string | null
          id?: string
          item_id: string
          item_type: string
          lot_number: string
          manufacturing_date?: string | null
          notes?: string | null
          purchase_order_id?: string | null
          quantity?: number
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiration_date?: string | null
          id?: string
          item_id?: string
          item_type?: string
          lot_number?: string
          manufacturing_date?: string | null
          notes?: string | null
          purchase_order_id?: string | null
          quantity?: number
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lots_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          item_id: string | null
          item_type: string | null
          movement_type: string
          new_stock: number | null
          notes: string | null
          previous_stock: number | null
          product_id: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          variant_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          movement_type: string
          new_stock?: number | null
          notes?: string | null
          previous_stock?: number | null
          product_id?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          movement_type?: string
          new_stock?: number | null
          notes?: string | null
          previous_stock?: number | null
          product_id?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reservations: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          notes: string | null
          quantity: number
          reference_id: string
          reference_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          notes?: string | null
          quantity?: number
          reference_id: string
          reference_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          notes?: string | null
          quantity?: number
          reference_id?: string
          reference_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_snapshots: {
        Row: {
          available_stock: number | null
          id: string
          product_variant_id: string | null
          reserved_stock: number | null
          snapshot_at: string | null
          stock: number
        }
        Insert: {
          available_stock?: number | null
          id?: string
          product_variant_id?: string | null
          reserved_stock?: number | null
          snapshot_at?: string | null
          stock: number
        }
        Update: {
          available_stock?: number | null
          id?: string
          product_variant_id?: string | null
          reserved_stock?: number | null
          snapshot_at?: string | null
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_snapshots_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_snapshots_daily: {
        Row: {
          available_stock: number
          created_at: string
          id: string
          product_id: string | null
          reserved_stock: number
          snapshot_date: string
          stock: number
          variant_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          available_stock: number
          created_at?: string
          id?: string
          product_id?: string | null
          reserved_stock: number
          snapshot_date: string
          stock: number
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          available_stock?: number
          created_at?: string
          id?: string
          product_id?: string | null
          reserved_stock?: number
          snapshot_date?: string
          stock?: number
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_snapshots_daily_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshots_daily_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshots_daily_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshots_daily_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshots_daily_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          metadata: Json
          notes: string | null
          payment_date: string
          payment_transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          metadata?: Json
          notes?: string | null
          payment_date?: string
          payment_transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          metadata?: Json
          notes?: string | null
          payment_date?: string
          payment_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          invoice_status: string
          issued_at: string
          metadata: Json
          notes: string | null
          order_id: string | null
          paid_amount: number
          paid_at: string | null
          payment_term_id: string | null
          remaining_balance: number
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          invoice_status?: string
          issued_at?: string
          metadata?: Json
          notes?: string | null
          order_id?: string | null
          paid_amount?: number
          paid_at?: string | null
          payment_term_id?: string | null
          remaining_balance?: number
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          invoice_status?: string
          issued_at?: string
          metadata?: Json
          notes?: string | null
          order_id?: string | null
          paid_amount?: number
          paid_at?: string | null
          payment_term_id?: string | null
          remaining_balance?: number
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_term_id_fkey"
            columns: ["payment_term_id"]
            isOneToOne: false
            referencedRelation: "payment_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      live_order_status: {
        Row: {
          current_status: string
          estimated_delivery: string | null
          kitchen_status: string | null
          order_id: string
          packing_status: string | null
          shipping_status: string | null
          updated_at: string | null
        }
        Insert: {
          current_status: string
          estimated_delivery?: string | null
          kitchen_status?: string | null
          order_id: string
          packing_status?: string | null
          shipping_status?: string | null
          updated_at?: string | null
        }
        Update: {
          current_status?: string
          estimated_delivery?: string | null
          kitchen_status?: string | null
          order_id?: string
          packing_status?: string | null
          shipping_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_order_status_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      low_stock_alerts: {
        Row: {
          created_at: string
          current_stock: number
          id: string
          inventory_level_id: string | null
          minimum_stock: number
          resolved: boolean
          resolved_at: string | null
        }
        Insert: {
          created_at?: string
          current_stock: number
          id?: string
          inventory_level_id?: string | null
          minimum_stock: number
          resolved?: boolean
          resolved_at?: string | null
        }
        Update: {
          created_at?: string
          current_stock?: number
          id?: string
          inventory_level_id?: string | null
          minimum_stock?: number
          resolved?: boolean
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "low_stock_alerts_inventory_level_id_fkey"
            columns: ["inventory_level_id"]
            isOneToOne: false
            referencedRelation: "inventory_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          reference_id: string | null
          reference_type: string | null
          severity: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          severity?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          severity?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          subtotal: number | null
          unit_price: number
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity: number
          subtotal?: number | null
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          subtotal?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_shipments: {
        Row: {
          address_snapshot: Json
          courier_name: string | null
          created_at: string | null
          delivered_at: string | null
          id: string
          notes: string | null
          order_id: string
          shipment_status: string | null
          shipped_at: string | null
          shipping_method_id: string | null
          shipping_zone_id: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          address_snapshot: Json
          courier_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          shipment_status?: string | null
          shipped_at?: string | null
          shipping_method_id?: string | null
          shipping_zone_id?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          address_snapshot?: Json
          courier_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          shipment_status?: string | null
          shipped_at?: string | null
          shipping_method_id?: string | null
          shipping_zone_id?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_shipments_shipping_method_id_fkey"
            columns: ["shipping_method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: string
          notes: string | null
          order_id: string
          previous_status: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: string
          notes?: string | null
          order_id: string
          previous_status?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          order_id?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_timeline: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          order_id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          status: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_timeline_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string | null
          estimated_delivery_date: string | null
          id: string
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          shipping_address: string
          shipping_city: string
          status: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          estimated_delivery_date?: string | null
          id?: string
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipping_address: string
          shipping_city: string
          status?: string | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          estimated_delivery_date?: string | null
          id?: string
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipping_address?: string
          shipping_city?: string
          status?: string | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_customers"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_attempts: {
        Row: {
          created_at: string | null
          error_message: string | null
          http_status: number | null
          id: string
          payment_id: string
          provider: string
          request_payload: Json | null
          response_payload: Json | null
          success: boolean | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          http_status?: number | null
          id?: string
          payment_id: string
          provider: string
          request_payload?: Json | null
          response_payload?: Json | null
          success?: boolean | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          http_status?: number | null
          id?: string
          payment_id?: string
          provider?: string
          request_payload?: Json | null
          response_payload?: Json | null
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          event_status: string | null
          event_type: string
          headers: Json
          id: string
          is_verified: boolean
          order_id: string | null
          payload: Json
          payment_transaction_id: string
          processed: boolean
          processed_at: string | null
          processing_error: string | null
          provider: Database["public"]["Enums"]["payment_provider_type"] | null
          provider_event_id: string | null
          signature: string | null
        }
        Insert: {
          created_at?: string
          event_status?: string | null
          event_type: string
          headers?: Json
          id?: string
          is_verified?: boolean
          order_id?: string | null
          payload?: Json
          payment_transaction_id: string
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          provider?: Database["public"]["Enums"]["payment_provider_type"] | null
          provider_event_id?: string | null
          signature?: string | null
        }
        Update: {
          created_at?: string
          event_status?: string | null
          event_type?: string
          headers?: Json
          id?: string
          is_verified?: boolean
          order_id?: string | null
          payload?: Json
          payment_transaction_id?: string
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          provider?: Database["public"]["Enums"]["payment_provider_type"] | null
          provider_event_id?: string | null
          signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          admin_notes: string | null
          created_at: string
          file_size: number | null
          id: string
          mime_type: string | null
          notes: string | null
          order_id: string
          original_filename: string | null
          payment_transaction_id: string
          proof_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_proof_status"]
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          order_id: string
          original_filename?: string | null
          payment_transaction_id: string
          proof_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_proof_status"]
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          order_id?: string
          original_filename?: string | null
          payment_transaction_id?: string
          proof_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_proof_status"]
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reconciliation: {
        Row: {
          bank_reference: string | null
          created_at: string
          currency: string | null
          expected_amount: number | null
          id: string
          matched_at: string | null
          matched_by: string | null
          metadata: Json
          order_id: string | null
          payer_bank: string | null
          payer_name: string | null
          payment_date: string | null
          payment_transaction_id: string | null
          provider_reference: string | null
          received_amount: number | null
          reconciliation_notes: string | null
          reconciliation_status:
            | Database["public"]["Enums"]["reconciliation_status"]
            | null
          updated_at: string
        }
        Insert: {
          bank_reference?: string | null
          created_at?: string
          currency?: string | null
          expected_amount?: number | null
          id?: string
          matched_at?: string | null
          matched_by?: string | null
          metadata?: Json
          order_id?: string | null
          payer_bank?: string | null
          payer_name?: string | null
          payment_date?: string | null
          payment_transaction_id?: string | null
          provider_reference?: string | null
          received_amount?: number | null
          reconciliation_notes?: string | null
          reconciliation_status?:
            | Database["public"]["Enums"]["reconciliation_status"]
            | null
          updated_at?: string
        }
        Update: {
          bank_reference?: string | null
          created_at?: string
          currency?: string | null
          expected_amount?: number | null
          id?: string
          matched_at?: string | null
          matched_by?: string | null
          metadata?: Json
          order_id?: string | null
          payer_bank?: string | null
          payer_name?: string | null
          payment_date?: string | null
          payment_transaction_id?: string | null
          provider_reference?: string | null
          received_amount?: number | null
          reconciliation_notes?: string | null
          reconciliation_status?:
            | Database["public"]["Enums"]["reconciliation_status"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reconciliation_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_terms: {
        Row: {
          code: string
          created_at: string
          days_due: number
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          days_due: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          days_due?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          authorization_code: string | null
          confirmed_at: string | null
          created_at: string
          currency: string
          expires_at: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          is_manual_review: boolean
          metadata: Json
          order_id: string
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method_type"]
          provider: Database["public"]["Enums"]["payment_provider_type"]
          provider_reference: string | null
          provider_transaction_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          authorization_code?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          is_manual_review?: boolean
          metadata?: Json
          order_id: string
          payment_date?: string | null
          payment_method: Database["public"]["Enums"]["payment_method_type"]
          provider: Database["public"]["Enums"]["payment_provider_type"]
          provider_reference?: string | null
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          authorization_code?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          is_manual_review?: boolean
          metadata?: Json
          order_id?: string
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method_type"]
          provider?: Database["public"]["Enums"]["payment_provider_type"]
          provider_reference?: string | null
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhooks: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string | null
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
          provider: string
          provider_event_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          provider: string
          provider_event_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          provider?: string
          provider_event_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          expires_at: string | null
          id: string
          order_id: string
          paid_amount: number | null
          paid_at: string | null
          payment_details: Json | null
          payment_method: string | null
          provider: string
          provider_payment_id: string | null
          provider_reference: string | null
          refunded_amount: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          order_id: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          provider: string
          provider_payment_id?: string | null
          provider_reference?: string | null
          refunded_amount?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          order_id?: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          provider?: string
          provider_payment_id?: string | null
          provider_reference?: string | null
          refunded_amount?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      picking_order_items: {
        Row: {
          created_at: string
          id: string
          inventory_location_id: string | null
          picked_quantity: number
          picking_order_id: string
          product_id: string
          product_lot_id: string | null
          quantity: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_location_id?: string | null
          picked_quantity?: number
          picking_order_id: string
          product_id: string
          product_lot_id?: string | null
          quantity: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_location_id?: string | null
          picked_quantity?: number
          picking_order_id?: string
          product_id?: string
          product_lot_id?: string | null
          quantity?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "picking_order_items_inventory_location_id_fkey"
            columns: ["inventory_location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picking_order_items_picking_order_id_fkey"
            columns: ["picking_order_id"]
            isOneToOne: false
            referencedRelation: "picking_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picking_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picking_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picking_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picking_order_items_product_lot_id_fkey"
            columns: ["product_lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_pick_suggestions"
            referencedColumns: ["lot_id"]
          },
          {
            foreignKeyName: "picking_order_items_product_lot_id_fkey"
            columns: ["product_lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_product_lots_fefo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picking_order_items_product_lot_id_fkey"
            columns: ["product_lot_id"]
            isOneToOne: false
            referencedRelation: "product_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      picking_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          sales_order_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          sales_order_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          sales_order_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "picking_orders_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      preparation_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          new_price: number
          old_price: number | null
          reason: string | null
          variant_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_price: number
          old_price?: number | null
          reason?: string | null
          variant_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_price?: number
          old_price?: number | null
          reason?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          applies_to_all_products: boolean | null
          created_at: string | null
          customer_type: string | null
          discount_percentage: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          minimum_quantity: number | null
          name: string
          starts_at: string | null
        }
        Insert: {
          applies_to_all_products?: boolean | null
          created_at?: string | null
          customer_type?: string | null
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          minimum_quantity?: number | null
          name: string
          starts_at?: string | null
        }
        Update: {
          applies_to_all_products?: boolean | null
          created_at?: string | null
          customer_type?: string | null
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          minimum_quantity?: number | null
          name?: string
          starts_at?: string | null
        }
        Relationships: []
      }
      product_analytics_daily: {
        Row: {
          add_to_cart: number | null
          analytics_date: string
          conversion_rate: number | null
          created_at: string | null
          id: string
          product_id: string
          purchases: number | null
          revenue: number | null
          views: number | null
        }
        Insert: {
          add_to_cart?: number | null
          analytics_date: string
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          product_id: string
          purchases?: number | null
          revenue?: number | null
          views?: number | null
        }
        Update: {
          add_to_cart?: number | null
          analytics_date?: string
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          product_id?: string
          purchases?: number | null
          revenue?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_analytics_daily_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_analytics_daily_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_analytics_daily_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_badge_relations: {
        Row: {
          badge_id: string
          created_at: string | null
          id: string
          product_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string | null
          id?: string
          product_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_badge_relations_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "product_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_badge_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_badge_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_badge_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_badges: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      product_embeddings: {
        Row: {
          embedding: string | null
          generated_at: string | null
          product_id: string
        }
        Insert: {
          embedding?: string | null
          generated_at?: string | null
          product_id: string
        }
        Update: {
          embedding?: string | null
          generated_at?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_embeddings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_embeddings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_embeddings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_families: {
        Row: {
          category_id: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_families_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_forecasting: {
        Row: {
          confidence_score: number | null
          created_at: string
          forecast_date: string
          id: string
          metadata: Json
          model_version: string | null
          predicted_demand: number
          product_id: string
          variant_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          forecast_date: string
          id?: string
          metadata?: Json
          model_version?: string | null
          predicted_demand: number
          product_id: string
          variant_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          forecast_date?: string
          id?: string
          metadata?: Json
          model_version?: string | null
          predicted_demand?: number
          product_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_forecasting_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_forecasting_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_forecasting_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_forecasting_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string
          sort_order: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_lots: {
        Row: {
          created_at: string
          expiration_date: string | null
          id: string
          inventory_location_id: string | null
          location_name: string | null
          lot_number: string
          product_id: string
          production_order_id: string | null
          quantity: number
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          expiration_date?: string | null
          id?: string
          inventory_location_id?: string | null
          location_name?: string | null
          lot_number: string
          product_id: string
          production_order_id?: string | null
          quantity?: number
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          expiration_date?: string | null
          id?: string
          inventory_location_id?: string | null
          location_name?: string | null
          lot_number?: string
          product_id?: string
          production_order_id?: string | null
          quantity?: number
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_lots_inventory_location_id_fkey"
            columns: ["inventory_location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_nutrition: {
        Row: {
          allergens: string[] | null
          calories: number | null
          carbs: number | null
          created_at: string | null
          fat: number | null
          id: string
          ingredients: string | null
          product_id: string
          protein: number | null
          serving_size: string | null
          sodium: number | null
          sugar: number | null
          updated_at: string | null
        }
        Insert: {
          allergens?: string[] | null
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          fat?: number | null
          id?: string
          ingredients?: string | null
          product_id: string
          protein?: number | null
          serving_size?: string | null
          sodium?: number | null
          sugar?: number | null
          updated_at?: string | null
        }
        Update: {
          allergens?: string[] | null
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          fat?: number | null
          id?: string
          ingredients?: string | null
          product_id?: string
          protein?: number | null
          serving_size?: string | null
          sodium?: number | null
          sugar?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_nutrition_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_nutrition_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_nutrition_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recommendations: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          recommended_product_id: string | null
          score: number | null
          source_product_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          recommended_product_id?: string | null
          score?: number | null
          source_product_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          recommended_product_id?: string | null
          score?: number | null
          source_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_recommendations_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_seo: {
        Row: {
          canonical_url: string | null
          created_at: string | null
          id: string
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          og_image: string | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          canonical_url?: string | null
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_seo_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_seo_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_seo_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tag_relations: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tag_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tag_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tag_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "product_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          created_at: string | null
          customer_type: string
          id: string
          is_active: boolean | null
          max_order_qty: number | null
          min_order_qty: number | null
          pieces: number | null
          presentation_type: string
          price: number
          product_id: string
          sku: string
          stock: number | null
          unit_label: string | null
          updated_at: string | null
          variant_name: string
          weight_grams: number | null
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string | null
          customer_type: string
          id?: string
          is_active?: boolean | null
          max_order_qty?: number | null
          min_order_qty?: number | null
          pieces?: number | null
          presentation_type: string
          price: number
          product_id: string
          sku: string
          stock?: number | null
          unit_label?: string | null
          updated_at?: string | null
          variant_name: string
          weight_grams?: number | null
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string | null
          customer_type?: string
          id?: string
          is_active?: boolean | null
          max_order_qty?: number | null
          min_order_qty?: number | null
          pieces?: number | null
          presentation_type?: string
          price?: number
          product_id?: string
          sku?: string
          stock?: number | null
          unit_label?: string | null
          updated_at?: string | null
          variant_name?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_consumptions: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          notes: string | null
          production_order_id: string
          quantity_used: number
          total_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          notes?: string | null
          production_order_id: string
          quantity_used: number
          total_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          notes?: string | null
          production_order_id?: string
          quantity_used?: number
          total_cost?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_consumptions_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_consumptions_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_costs: {
        Row: {
          created_at: string
          id: string
          labor_cost: number
          material_cost: number
          overhead_cost: number
          production_order_id: string
          total_cost: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          labor_cost?: number
          material_cost?: number
          overhead_cost?: number
          production_order_id: string
          total_cost?: number
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          labor_cost?: number
          material_cost?: number
          overhead_cost?: number
          production_order_id?: string
          total_cost?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_costs_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: true
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_lines: {
        Row: {
          created_at: string
          daily_capacity: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_capacity?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_capacity?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      production_lot_consumptions: {
        Row: {
          created_at: string | null
          id: string
          inventory_lot_id: string
          production_order_id: string
          quantity: number
          raw_material_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_lot_id: string
          production_order_id: string
          quantity: number
          raw_material_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_lot_id?: string
          production_order_id?: string
          quantity?: number
          raw_material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_lot_consumptions_inventory_lot_id_fkey"
            columns: ["inventory_lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_lot_consumptions_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_lot_consumptions_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "mrp_purchase_requirements"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "production_lot_consumptions_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "mrp_requirements"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "production_lot_consumptions_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_consumptions: {
        Row: {
          created_at: string
          id: string
          production_order_item_id: string
          quantity: number
          raw_material_lot_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          production_order_item_id: string
          quantity?: number
          raw_material_lot_id: string
        }
        Update: {
          created_at?: string
          id?: string
          production_order_item_id?: string
          quantity?: number
          raw_material_lot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_order_consumptions_production_order_item_id_fkey"
            columns: ["production_order_item_id"]
            isOneToOne: false
            referencedRelation: "production_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_consumptions_raw_material_lot_id_fkey"
            columns: ["raw_material_lot_id"]
            isOneToOne: false
            referencedRelation: "raw_material_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_items: {
        Row: {
          consumed_quantity: number
          created_at: string
          id: string
          planned_quantity: number
          production_order_id: string
          raw_material_id: string
          status: string
          updated_at: string
        }
        Insert: {
          consumed_quantity?: number
          created_at?: string
          id?: string
          planned_quantity?: number
          production_order_id: string
          raw_material_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          consumed_quantity?: number
          created_at?: string
          id?: string
          planned_quantity?: number
          production_order_id?: string
          raw_material_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_order_items_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "mrp_purchase_requirements"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "production_order_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "mrp_requirements"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "production_order_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          actual_cost: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          estimated_cost: number | null
          id: string
          notes: string | null
          planned_quantity: number
          planned_start_at: string | null
          produced_quantity: number | null
          production_number: string
          production_status: string
          recipe_id: string
          started_at: string | null
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          actual_cost?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          planned_quantity: number
          planned_start_at?: string | null
          produced_quantity?: number | null
          production_number: string
          production_status?: string
          recipe_id: string
          started_at?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          actual_cost?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          planned_quantity?: number
          planned_start_at?: string | null
          produced_quantity?: number | null
          production_number?: string
          production_status?: string
          recipe_id?: string
          started_at?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      production_outputs: {
        Row: {
          batch_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          product_id: string
          production_order_id: string
          quantity_produced: number
          total_cost: number | null
          unit_cost: number | null
          variant_id: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          product_id: string
          production_order_id: string
          quantity_produced: number
          total_cost?: number | null
          unit_cost?: number | null
          variant_id?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          product_id?: string
          production_order_id?: string
          quantity_produced?: number
          total_cost?: number | null
          unit_cost?: number | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_outputs_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_outputs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_outputs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_outputs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_outputs_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_outputs_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      production_schedules: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          planned_quantity: number
          production_line: string | null
          production_order_id: string
          scheduled_date: string
          scheduled_end_time: string | null
          scheduled_start_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          planned_quantity?: number
          production_line?: string | null
          production_order_id: string
          scheduled_date: string
          scheduled_end_time?: string | null
          scheduled_start_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          planned_quantity?: number
          production_line?: string | null
          production_order_id?: string
          scheduled_date?: string
          scheduled_end_time?: string | null
          scheduled_start_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_schedules_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: true
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          family_id: string | null
          flavor_id: string | null
          id: string
          image_alt: string | null
          image_url: string | null
          internal_code: string | null
          is_active: boolean | null
          is_featured: boolean | null
          min_stock: number | null
          name: string
          preparation_type_id: string | null
          raw_material_type: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          status: string | null
          unit_of_measure_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          family_id?: string | null
          flavor_id?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          internal_code?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          min_stock?: number | null
          name: string
          preparation_type_id?: string | null
          raw_material_type?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          status?: string | null
          unit_of_measure_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          family_id?: string | null
          flavor_id?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          internal_code?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          min_stock?: number | null
          name?: string
          preparation_type_id?: string | null
          raw_material_type?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          status?: string | null
          unit_of_measure_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_family_category_fkey"
            columns: ["family_id", "category_id"]
            isOneToOne: false
            referencedRelation: "product_families"
            referencedColumns: ["id", "category_id"]
          },
          {
            foreignKeyName: "products_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "product_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_flavor_id_fkey"
            columns: ["flavor_id"]
            isOneToOne: false
            referencedRelation: "flavors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_preparation_type_id_fkey"
            columns: ["preparation_type_id"]
            isOneToOne: false
            referencedRelation: "preparation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_unit_of_measure_id_fkey"
            columns: ["unit_of_measure_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          phone: string | null
          rfc: string | null
          role: string | null
          updated_at: string
          user_type: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          phone?: string | null
          rfc?: string | null
          role?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          rfc?: string | null
          role?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Relationships: []
      }
      proof_of_delivery: {
        Row: {
          created_at: string
          delivered_at: string
          delivered_by: string | null
          delivery_id: string
          id: string
          notes: string | null
          photo_url: string | null
          receiver_name: string | null
          receiver_phone: string | null
          signature_url: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string
          delivered_by?: string | null
          delivery_id: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          receiver_name?: string | null
          receiver_phone?: string | null
          signature_url?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string
          delivered_by?: string | null
          delivery_id?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          receiver_name?: string | null
          receiver_phone?: string | null
          signature_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proof_of_delivery_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          purchase_order_id: string
          quantity: number
          raw_material_id: string
          received_quantity: number
          total: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          purchase_order_id: string
          quantity: number
          raw_material_id: string
          received_quantity?: number
          total?: number
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          purchase_order_id?: string
          quantity?: number
          raw_material_id?: string
          received_quantity?: number
          total?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "mrp_purchase_requirements"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "purchase_order_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "mrp_requirements"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "purchase_order_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          deleted_at: string | null
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          status: string
          subtotal: number
          supplier_id: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          status?: string
          subtotal?: number
          supplier_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          status?: string
          subtotal?: number
          supplier_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requisition_items: {
        Row: {
          available_quantity: number
          created_at: string
          id: string
          purchase_quantity: number
          purchase_requisition_id: string
          raw_material_id: string
          required_quantity: number
        }
        Insert: {
          available_quantity?: number
          created_at?: string
          id?: string
          purchase_quantity?: number
          purchase_requisition_id: string
          raw_material_id: string
          required_quantity?: number
        }
        Update: {
          available_quantity?: number
          created_at?: string
          id?: string
          purchase_quantity?: number
          purchase_requisition_id?: string
          raw_material_id?: string
          required_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requisition_items_purchase_requisition_id_fkey"
            columns: ["purchase_requisition_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requisition_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "mrp_purchase_requirements"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "purchase_requisition_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "mrp_requirements"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "purchase_requisition_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requisitions: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          notes: string | null
          requested_by: string | null
          requisition_number: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          requested_by?: string | null
          requisition_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          requested_by?: string | null
          requisition_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      raw_material_lots: {
        Row: {
          created_at: string
          expiration_date: string | null
          id: string
          inventory_location_id: string | null
          lot_number: string
          quantity: number
          raw_material_id: string
          status: string
          supplier_lot: string | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiration_date?: string | null
          id?: string
          inventory_location_id?: string | null
          lot_number: string
          quantity?: number
          raw_material_id: string
          status?: string
          supplier_lot?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiration_date?: string | null
          id?: string
          inventory_location_id?: string | null
          lot_number?: string
          quantity?: number
          raw_material_id?: string
          status?: string
          supplier_lot?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_material_lots_inventory_location_id_fkey"
            columns: ["inventory_location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_material_lots_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "mrp_purchase_requirements"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "raw_material_lots_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "mrp_requirements"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "raw_material_lots_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_materials: {
        Row: {
          average_cost: number
          category_id: string | null
          created_at: string
          current_stock: number
          deleted_at: string | null
          description: string | null
          family_id: string | null
          id: string
          internal_code: string | null
          is_active: boolean
          last_cost: number
          minimum_stock: number
          name: string
          preferred_supplier_id: string | null
          reorder_quantity: number | null
          slug: string
          unit_of_measure_id: string | null
          updated_at: string
        }
        Insert: {
          average_cost?: number
          category_id?: string | null
          created_at?: string
          current_stock?: number
          deleted_at?: string | null
          description?: string | null
          family_id?: string | null
          id?: string
          internal_code?: string | null
          is_active?: boolean
          last_cost?: number
          minimum_stock?: number
          name: string
          preferred_supplier_id?: string | null
          reorder_quantity?: number | null
          slug: string
          unit_of_measure_id?: string | null
          updated_at?: string
        }
        Update: {
          average_cost?: number
          category_id?: string | null
          created_at?: string
          current_stock?: number
          deleted_at?: string | null
          description?: string | null
          family_id?: string | null
          id?: string
          internal_code?: string | null
          is_active?: boolean
          last_cost?: number
          minimum_stock?: number
          name?: string
          preferred_supplier_id?: string | null
          reorder_quantity?: number | null
          slug?: string
          unit_of_measure_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_materials_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_materials_preferred_supplier_id_fkey"
            columns: ["preferred_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_materials_unit_of_measure_id_fkey"
            columns: ["unit_of_measure_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          notes: string | null
          quantity: number
          recipe_id: string
          unit: string
          waste_percentage: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          notes?: string | null
          quantity: number
          recipe_id: string
          unit: string
          waste_percentage?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          notes?: string | null
          quantity?: number
          recipe_id?: string
          unit?: string
          waste_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_items: {
        Row: {
          created_at: string | null
          id: string
          quantity: number
          raw_material_id: string
          recipe_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          quantity: number
          raw_material_id: string
          recipe_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          quantity?: number
          raw_material_id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_ingredient_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "mrp_purchase_requirements"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "recipe_items_ingredient_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "mrp_requirements"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "recipe_items_ingredient_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          product_id: string
          unit_of_measure_id: string | null
          updated_at: string | null
          yield_quantity: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          product_id: string
          unit_of_measure_id?: string | null
          updated_at?: string | null
          yield_quantity?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          product_id?: string
          unit_of_measure_id?: string | null
          updated_at?: string | null
          yield_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_unit_of_measure_id_fkey"
            columns: ["unit_of_measure_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          payment_id: string
          provider_refund_id: string | null
          reason: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          payment_id: string
          provider_refund_id?: string | null
          reason?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          payment_id?: string
          provider_refund_id?: string | null
          reason?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      related_products: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          related_product_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          related_product_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          related_product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "related_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_products_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_products_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_products_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_daily: {
        Row: {
          average_order_value: number | null
          created_at: string | null
          discounts_total: number | null
          gross_revenue: number | null
          id: string
          net_revenue: number | null
          sales_date: string
          shipping_total: number | null
          total_orders: number | null
          updated_at: string | null
        }
        Insert: {
          average_order_value?: number | null
          created_at?: string | null
          discounts_total?: number | null
          gross_revenue?: number | null
          id?: string
          net_revenue?: number | null
          sales_date: string
          shipping_total?: number | null
          total_orders?: number | null
          updated_at?: string | null
        }
        Update: {
          average_order_value?: number | null
          created_at?: string | null
          discounts_total?: number | null
          gross_revenue?: number | null
          id?: string
          net_revenue?: number | null
          sales_date?: string
          shipping_total?: number | null
          total_orders?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_order_items: {
        Row: {
          created_at: string | null
          delivered_quantity: number
          discount: number
          id: string
          product_id: string
          quantity: number
          sales_order_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          delivered_quantity?: number
          discount?: number
          id?: string
          product_id: string
          quantity: number
          sales_order_id: string
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          delivered_quantity?: number
          discount?: number
          id?: string
          product_id?: string
          quantity?: number
          sales_order_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_profit: {
        Row: {
          calculated_at: string
          cost_amount: number
          created_at: string | null
          gross_profit: number
          id: string
          margin_percent: number
          sales_amount: number
          sales_order_id: string
          updated_at: string | null
        }
        Insert: {
          calculated_at?: string
          cost_amount?: number
          created_at?: string | null
          gross_profit?: number
          id?: string
          margin_percent?: number
          sales_amount?: number
          sales_order_id: string
          updated_at?: string | null
        }
        Update: {
          calculated_at?: string
          cost_amount?: number
          created_at?: string | null
          gross_profit?: number
          id?: string
          margin_percent?: number
          sales_amount?: number
          sales_order_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_profit_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          created_at: string | null
          customer_id: string
          delivery_date: string | null
          discount: number
          id: string
          notes: string | null
          order_date: string
          order_number: string
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          delivery_date?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          delivery_date?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_jobs: {
        Row: {
          created_at: string
          cron_expression: string | null
          id: string
          is_active: boolean
          job_key: string
          last_run_at: string | null
          name: string
          next_run_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cron_expression?: string | null
          id?: string
          is_active?: boolean
          job_key: string
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cron_expression?: string | null
          id?: string
          is_active?: boolean
          job_key?: string
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shipping_methods: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_days_max: number | null
          estimated_days_min: number | null
          id: string
          is_active: boolean | null
          is_pickup: boolean | null
          name: string
          slug: string
          supports_b2b: boolean | null
          supports_b2c: boolean | null
          supports_frozen: boolean | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          is_active?: boolean | null
          is_pickup?: boolean | null
          name: string
          slug: string
          supports_b2b?: boolean | null
          supports_b2c?: boolean | null
          supports_frozen?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          is_active?: boolean | null
          is_pickup?: boolean | null
          name?: string
          slug?: string
          supports_b2b?: boolean | null
          supports_b2c?: boolean | null
          supports_frozen?: boolean | null
        }
        Relationships: []
      }
      shipping_rates: {
        Row: {
          cold_chain_required: boolean | null
          created_at: string | null
          free_shipping: boolean | null
          id: string
          is_active: boolean | null
          max_weight: number | null
          method_id: string
          min_order_total: number | null
          min_weight: number | null
          price: number
          zone_id: string
        }
        Insert: {
          cold_chain_required?: boolean | null
          created_at?: string | null
          free_shipping?: boolean | null
          id?: string
          is_active?: boolean | null
          max_weight?: number | null
          method_id: string
          min_order_total?: number | null
          min_weight?: number | null
          price: number
          zone_id: string
        }
        Update: {
          cold_chain_required?: boolean | null
          created_at?: string | null
          free_shipping?: boolean | null
          id?: string
          is_active?: boolean | null
          max_weight?: number | null
          method_id?: string
          min_order_total?: number | null
          min_weight?: number | null
          price?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_rates_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          base_shipping_cost: number | null
          code: string
          created_at: string
          description: string | null
          estimated_delivery_hours: number | null
          id: string
          is_active: boolean
          minimum_order_amount: number | null
          name: string
          polygon: Json | null
          supports_frozen: boolean
          supports_same_day: boolean
          updated_at: string
        }
        Insert: {
          base_shipping_cost?: number | null
          code: string
          created_at?: string
          description?: string | null
          estimated_delivery_hours?: number | null
          id?: string
          is_active?: boolean
          minimum_order_amount?: number | null
          name: string
          polygon?: Json | null
          supports_frozen?: boolean
          supports_same_day?: boolean
          updated_at?: string
        }
        Update: {
          base_shipping_cost?: number | null
          code?: string
          created_at?: string
          description?: string | null
          estimated_delivery_hours?: number | null
          id?: string
          is_active?: boolean
          minimum_order_amount?: number | null
          name?: string
          polygon?: Json | null
          supports_frozen?: boolean
          supports_same_day?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          created_at: string | null
          current_stock: number
          id: string
          minimum_stock: number
          product_variant_id: string | null
          resolved: boolean | null
          resolved_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_stock: number
          id?: string
          minimum_stock: number
          product_variant_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_stock?: number
          id?: string
          minimum_stock?: number
          product_variant_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reservations: {
        Row: {
          cart_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          order_id: string | null
          product_id: string
          quantity: number
          released_at: string | null
          reservation_status: string
          variant_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          cart_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          product_id: string
          quantity: number
          released_at?: string | null
          reservation_status?: string
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          cart_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string
          quantity?: number
          released_at?: string | null
          reservation_status?: string
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          business_name: string | null
          contact_name: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          contact_name?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_name?: string | null
          contact_name?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tenant_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["tenant_member_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["tenant_member_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["tenant_member_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      units_of_measure: {
        Row: {
          code: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_admin_permissions: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_admin_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "admin_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: Json
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          supports_frozen: boolean
          updated_at: string
          warehouse_type: string
        }
        Insert: {
          address?: Json
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          supports_frozen?: boolean
          updated_at?: string
          warehouse_type?: string
        }
        Update: {
          address?: Json
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          supports_frozen?: boolean
          updated_at?: string
          warehouse_type?: string
        }
        Relationships: []
      }
      waste_tracking: {
        Row: {
          created_at: string
          estimated_loss: number | null
          id: string
          ingredient_id: string | null
          product_id: string | null
          quantity: number
          reason: string | null
          recorded_by: string | null
          warehouse_id: string | null
          waste_type: string
        }
        Insert: {
          created_at?: string
          estimated_loss?: number | null
          id?: string
          ingredient_id?: string | null
          product_id?: string | null
          quantity: number
          reason?: string | null
          recorded_by?: string | null
          warehouse_id?: string | null
          waste_type: string
        }
        Update: {
          created_at?: string
          estimated_loss?: number | null
          id?: string
          ingredient_id?: string | null
          product_id?: string | null
          quantity?: number
          reason?: string | null
          recorded_by?: string | null
          warehouse_id?: string | null
          waste_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "waste_tracking_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_tracking_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_tracking_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_tracking_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_tracking_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          external_id: string | null
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
          provider: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          external_id?: string | null
          id?: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          provider: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          external_id?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          provider?: string
        }
        Relationships: []
      }
      whatsapp_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          payload: Json | null
          phone: string
          retries: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          template: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          phone: string
          retries?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          template: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          phone?: string
          retries?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          template?: string
        }
        Relationships: []
      }
    }
    Views: {
      analytics_sales_by_day: {
        Row: {
          day: string | null
          revenue: number | null
          total_orders: number | null
        }
        Relationships: []
      }
      analytics_top_products: {
        Row: {
          id: string | null
          name: string | null
          revenue: number | null
          total_orders: number | null
          units_sold: number | null
        }
        Relationships: []
      }
      dashboard_sales_summary: {
        Row: {
          average_ticket: number | null
          day: string | null
          revenue: number | null
          total_orders: number | null
          unique_customers: number | null
        }
        Relationships: []
      }
      dashboard_top_customers: {
        Row: {
          email: string | null
          full_name: string | null
          lifetime_value: number | null
          profile_id: string | null
          total_orders: number | null
        }
        Relationships: []
      }
      dashboard_top_products: {
        Row: {
          id: string | null
          name: string | null
          revenue: number | null
          units_sold: number | null
        }
        Relationships: []
      }
      inventory_available_to_promise: {
        Row: {
          available_quantity: number | null
          item_id: string | null
          item_type: string | null
          reserved_quantity: number | null
          stock_quantity: number | null
        }
        Relationships: []
      }
      inventory_pick_suggestions: {
        Row: {
          expiration_date: string | null
          location_name: string | null
          lot_id: string | null
          lot_number: string | null
          product_id: string | null
          quantity: number | null
        }
        Insert: {
          expiration_date?: string | null
          location_name?: string | null
          lot_id?: string | null
          lot_number?: string | null
          product_id?: string | null
          quantity?: number | null
        }
        Update: {
          expiration_date?: string | null
          location_name?: string | null
          lot_id?: string | null
          lot_number?: string | null
          product_id?: string | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_product_lots_fefo: {
        Row: {
          expiration_date: string | null
          id: string | null
          location_name: string | null
          lot_number: string | null
          product_id: string | null
          quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_stock: {
        Row: {
          product_id: string | null
          quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dashboard_top_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_stock_by_item: {
        Row: {
          item_id: string | null
          item_type: string | null
          quantity: number | null
          warehouse_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      mrp_purchase_requirements: {
        Row: {
          available_quantity: number | null
          purchase_quantity: number | null
          raw_material_id: string | null
          raw_material_name: string | null
          required_quantity: number | null
        }
        Relationships: []
      }
      mrp_requirements: {
        Row: {
          raw_material_id: string | null
          raw_material_name: string | null
          required_quantity: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_production_order_items: {
        Args: { p_production_order_id: string }
        Returns: undefined
      }
      decrease_product_lot_quantity: {
        Args: { p_lot_id: string; p_quantity: number }
        Returns: undefined
      }
      generate_purchase_requisition_number: { Args: never; Returns: string }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      payment_method_type:
        | "card"
        | "transfer"
        | "cash"
        | "oxxo"
        | "paypal"
        | "spei"
        | "terminal"
        | "manual"
      payment_proof_status: "pending" | "approved" | "rejected"
      payment_provider_type:
        | "stripe"
        | "mercado_pago"
        | "conekta"
        | "paypal"
        | "manual"
        | "cash"
        | "terminal"
      payment_status:
        | "pending"
        | "processing"
        | "authorized"
        | "paid"
        | "partially_paid"
        | "failed"
        | "expired"
        | "cancelled"
        | "refunded"
        | "chargeback"
      reconciliation_status:
        | "pending"
        | "matched"
        | "mismatch"
        | "manual_review"
        | "resolved"
      tenant_member_role: "owner" | "admin" | "member" | "viewer"
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
      payment_method_type: [
        "card",
        "transfer",
        "cash",
        "oxxo",
        "paypal",
        "spei",
        "terminal",
        "manual",
      ],
      payment_proof_status: ["pending", "approved", "rejected"],
      payment_provider_type: [
        "stripe",
        "mercado_pago",
        "conekta",
        "paypal",
        "manual",
        "cash",
        "terminal",
      ],
      payment_status: [
        "pending",
        "processing",
        "authorized",
        "paid",
        "partially_paid",
        "failed",
        "expired",
        "cancelled",
        "refunded",
        "chargeback",
      ],
      reconciliation_status: [
        "pending",
        "matched",
        "mismatch",
        "manual_review",
        "resolved",
      ],
      tenant_member_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
