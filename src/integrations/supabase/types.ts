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
  public: {
    Tables: {
      feature_flags: {
        Row: {
          config: Json
          description: string | null
          enabled: boolean
          key: string
          updated_at: string
        }
        Insert: {
          config?: Json
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string
        }
        Update: {
          config?: Json
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          created_at: string
          email: string
          handled_at: string | null
          id: string
          listing_id: string | null
          locale: string | null
          message: string | null
          name: string | null
          payload: Json
          phone: string | null
          photo_paths: string[]
          read_at: string | null
          source: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          email: string
          handled_at?: string | null
          id?: string
          listing_id?: string | null
          locale?: string | null
          message?: string | null
          name?: string | null
          payload?: Json
          phone?: string | null
          photo_paths?: string[]
          read_at?: string | null
          source?: string | null
          status?: string
          type?: string
        }
        Update: {
          created_at?: string
          email?: string
          handled_at?: string | null
          id?: string
          listing_id?: string | null
          locale?: string | null
          message?: string | null
          name?: string | null
          payload?: Json
          phone?: string | null
          photo_paths?: string[]
          read_at?: string | null
          source?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_documents: {
        Row: {
          created_at: string
          filename: string
          id: string
          is_public: boolean
          listing_id: string
          requires_lead: boolean
          storage_path: string
          type: string | null
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          is_public?: boolean
          listing_id: string
          requires_lead?: boolean
          storage_path: string
          type?: string | null
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          is_public?: boolean
          listing_id?: string
          requires_lead?: boolean
          storage_path?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_documents_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_documents_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          alt_text: Json
          blurhash: string | null
          caption: Json
          content_type: string | null
          created_at: string
          height: number | null
          id: string
          is_floorplan: boolean
          is_primary: boolean
          is_visualization: boolean
          listing_id: string
          original_size_bytes: number | null
          original_storage_path: string | null
          processing_error: string | null
          processing_started_at: string | null
          processing_status: string
          sort_order: number
          storage_path: string
          variants: Json
          width: number | null
        }
        Insert: {
          alt_text?: Json
          blurhash?: string | null
          caption?: Json
          content_type?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_floorplan?: boolean
          is_primary?: boolean
          is_visualization?: boolean
          listing_id: string
          original_size_bytes?: number | null
          original_storage_path?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string
          sort_order?: number
          storage_path: string
          variants?: Json
          width?: number | null
        }
        Update: {
          alt_text?: Json
          blurhash?: string | null
          caption?: Json
          content_type?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_floorplan?: boolean
          is_primary?: boolean
          is_visualization?: boolean
          listing_id?: string
          original_size_bytes?: number | null
          original_storage_path?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string
          sort_order?: number
          storage_path?: string
          variants?: Json
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_slug_history: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_slug_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_slug_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_tours: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          sort_order: number
          thumbnail_url: string | null
          type: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          sort_order?: number
          thumbnail_url?: string | null
          type?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          sort_order?: number
          thumbnail_url?: string | null
          type?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_tours_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_tours_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          additional_costs: Json
          address_city: string | null
          address_country: string | null
          address_number: string | null
          address_region: string | null
          address_street: string | null
          address_zip: string | null
          agent_id: string | null
          archived_at: string | null
          availability_date: string | null
          bathrooms: number | null
          bedrooms: number | null
          commission_free: boolean
          commission_note: string | null
          commission_note_public: boolean
          commission_payer: string | null
          commission_type: string | null
          commission_value: number | null
          condition: string | null
          content_sections: Json
          created_at: string
          created_by: string | null
          created_from_autodraft: boolean
          deal_type: string
          deposit: number | null
          description: Json
          energy: Json
          energy_exemption: string | null
          expose_notes: Json
          features: string[]
          floor: number | null
          geo_lat: number | null
          geo_lng: number | null
          geo_precision: string
          heating_costs_included: boolean
          heating_type: string | null
          highlights: Json
          id: string
          inquiry_count: number
          is_exclusive: boolean
          is_featured: boolean
          living_area: number | null
          meta_description: Json
          meta_title: Json
          plot_area: number | null
          price: number | null
          price_on_request: boolean
          price_period: string | null
          property_type: string
          published_at: string | null
          reference_code: string | null
          rental_status: string | null
          rooms: number | null
          service_charge: number | null
          slug: string
          sold_at: string | null
          sold_price: number | null
          sort_order: number
          status: string
          title: Json
          total_floors: number | null
          total_rent: number | null
          updated_at: string
          updated_by: string | null
          usable_area: number | null
          utilities_cost: number | null
          view_count: number
          year_built: number | null
          year_renovated: number | null
        }
        Insert: {
          additional_costs?: Json
          address_city?: string | null
          address_country?: string | null
          address_number?: string | null
          address_region?: string | null
          address_street?: string | null
          address_zip?: string | null
          agent_id?: string | null
          archived_at?: string | null
          availability_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          commission_free?: boolean
          commission_note?: string | null
          commission_note_public?: boolean
          commission_payer?: string | null
          commission_type?: string | null
          commission_value?: number | null
          condition?: string | null
          content_sections?: Json
          created_at?: string
          created_by?: string | null
          created_from_autodraft?: boolean
          deal_type: string
          deposit?: number | null
          description?: Json
          energy?: Json
          energy_exemption?: string | null
          expose_notes?: Json
          features?: string[]
          floor?: number | null
          geo_lat?: number | null
          geo_lng?: number | null
          geo_precision?: string
          heating_costs_included?: boolean
          heating_type?: string | null
          highlights?: Json
          id?: string
          inquiry_count?: number
          is_exclusive?: boolean
          is_featured?: boolean
          living_area?: number | null
          meta_description?: Json
          meta_title?: Json
          plot_area?: number | null
          price?: number | null
          price_on_request?: boolean
          price_period?: string | null
          property_type: string
          published_at?: string | null
          reference_code?: string | null
          rental_status?: string | null
          rooms?: number | null
          service_charge?: number | null
          slug: string
          sold_at?: string | null
          sold_price?: number | null
          sort_order?: number
          status?: string
          title?: Json
          total_floors?: number | null
          total_rent?: number | null
          updated_at?: string
          updated_by?: string | null
          usable_area?: number | null
          utilities_cost?: number | null
          view_count?: number
          year_built?: number | null
          year_renovated?: number | null
        }
        Update: {
          additional_costs?: Json
          address_city?: string | null
          address_country?: string | null
          address_number?: string | null
          address_region?: string | null
          address_street?: string | null
          address_zip?: string | null
          agent_id?: string | null
          archived_at?: string | null
          availability_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          commission_free?: boolean
          commission_note?: string | null
          commission_note_public?: boolean
          commission_payer?: string | null
          commission_type?: string | null
          commission_value?: number | null
          condition?: string | null
          content_sections?: Json
          created_at?: string
          created_by?: string | null
          created_from_autodraft?: boolean
          deal_type?: string
          deposit?: number | null
          description?: Json
          energy?: Json
          energy_exemption?: string | null
          expose_notes?: Json
          features?: string[]
          floor?: number | null
          geo_lat?: number | null
          geo_lng?: number | null
          geo_precision?: string
          heating_costs_included?: boolean
          heating_type?: string | null
          highlights?: Json
          id?: string
          inquiry_count?: number
          is_exclusive?: boolean
          is_featured?: boolean
          living_area?: number | null
          meta_description?: Json
          meta_title?: Json
          plot_area?: number | null
          price?: number | null
          price_on_request?: boolean
          price_period?: string | null
          property_type?: string
          published_at?: string | null
          reference_code?: string | null
          rental_status?: string | null
          rooms?: number | null
          service_charge?: number | null
          slug?: string
          sold_at?: string | null
          sold_price?: number | null
          sort_order?: number
          status?: string
          title?: Json
          total_floors?: number | null
          total_rent?: number | null
          updated_at?: string
          updated_by?: string | null
          usable_area?: number | null
          utilities_cost?: number | null
          view_count?: number
          year_built?: number | null
          year_renovated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_only_permissions: {
        Row: {
          created_at: string
          permission_key: string
        }
        Insert: {
          created_at?: string
          permission_key: string
        }
        Update: {
          created_at?: string
          permission_key?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          permission_key: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          granted: boolean
          id?: string
          permission_key: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_key?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_locale: string | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          languages_spoken: string[] | null
          last_login_at: string | null
          phone: string | null
          public_bio: Json
          public_photo_url: string | null
          public_title: string | null
          role: string
          show_on_website: boolean
          sort_order: number
          specializations: string[] | null
          updated_at: string
        }
        Insert: {
          admin_locale?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          languages_spoken?: string[] | null
          last_login_at?: string | null
          phone?: string | null
          public_bio?: Json
          public_photo_url?: string | null
          public_title?: string | null
          role?: string
          show_on_website?: boolean
          sort_order?: number
          specializations?: string[] | null
          updated_at?: string
        }
        Update: {
          admin_locale?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          languages_spoken?: string[] | null
          last_login_at?: string | null
          phone?: string | null
          public_bio?: Json
          public_photo_url?: string | null
          public_title?: string | null
          role?: string
          show_on_website?: boolean
          sort_order?: number
          specializations?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          granted: boolean
          permission_key: string
          role: string
        }
        Insert: {
          granted: boolean
          permission_key: string
          role: string
        }
        Update: {
          granted?: boolean
          permission_key?: string
          role?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          about_body: Json
          accent_color: string | null
          address_city: string | null
          address_country: string | null
          address_street: string | null
          address_zip: string | null
          area_unit: string
          background_color: string | null
          border_color: string | null
          button_style: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string
          credibility_heading: Json
          credibility_stats: Json
          currency: string
          default_locale: string
          enabled_locales: string[]
          favicon_url: string | null
          font_body: string | null
          font_heading: string | null
          geo_lat: number | null
          geo_lng: number | null
          google_analytics_id: string | null
          google_site_verification: string | null
          hero_headline: Json
          hero_subline: Json
          homepage_sections: Json
          id: string
          legal_impressum: Json
          legal_name: string | null
          legal_privacy: Json
          legal_terms: Json
          logo_dark_url: string | null
          logo_url: string | null
          muted_text_color: string | null
          og_default_image: string | null
          opening_hours: Json
          plausible_domain: string | null
          primary_agent_name: string | null
          primary_agent_photo_url: string | null
          primary_agent_role: string | null
          primary_color: string | null
          qualifications: Json
          radius_scale: string | null
          seals: Json
          secondary_color: string | null
          service_areas: Json
          service_region: Json
          show_sold_prices: boolean
          site_name: string
          social: Json
          surface_color: string | null
          text_color: string | null
          updated_at: string
          valuation_offer: Json
          whatsapp: string | null
        }
        Insert: {
          about_body?: Json
          accent_color?: string | null
          address_city?: string | null
          address_country?: string | null
          address_street?: string | null
          address_zip?: string | null
          area_unit?: string
          background_color?: string | null
          border_color?: string | null
          button_style?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country: string
          credibility_heading?: Json
          credibility_stats?: Json
          currency?: string
          default_locale?: string
          enabled_locales?: string[]
          favicon_url?: string | null
          font_body?: string | null
          font_heading?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          google_analytics_id?: string | null
          google_site_verification?: string | null
          hero_headline?: Json
          hero_subline?: Json
          homepage_sections?: Json
          id?: string
          legal_impressum?: Json
          legal_name?: string | null
          legal_privacy?: Json
          legal_terms?: Json
          logo_dark_url?: string | null
          logo_url?: string | null
          muted_text_color?: string | null
          og_default_image?: string | null
          opening_hours?: Json
          plausible_domain?: string | null
          primary_agent_name?: string | null
          primary_agent_photo_url?: string | null
          primary_agent_role?: string | null
          primary_color?: string | null
          qualifications?: Json
          radius_scale?: string | null
          seals?: Json
          secondary_color?: string | null
          service_areas?: Json
          service_region?: Json
          show_sold_prices?: boolean
          site_name: string
          social?: Json
          surface_color?: string | null
          text_color?: string | null
          updated_at?: string
          valuation_offer?: Json
          whatsapp?: string | null
        }
        Update: {
          about_body?: Json
          accent_color?: string | null
          address_city?: string | null
          address_country?: string | null
          address_street?: string | null
          address_zip?: string | null
          area_unit?: string
          background_color?: string | null
          border_color?: string | null
          button_style?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string
          credibility_heading?: Json
          credibility_stats?: Json
          currency?: string
          default_locale?: string
          enabled_locales?: string[]
          favicon_url?: string | null
          font_body?: string | null
          font_heading?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          google_analytics_id?: string | null
          google_site_verification?: string | null
          hero_headline?: Json
          hero_subline?: Json
          homepage_sections?: Json
          id?: string
          legal_impressum?: Json
          legal_name?: string | null
          legal_privacy?: Json
          legal_terms?: Json
          logo_dark_url?: string | null
          logo_url?: string | null
          muted_text_color?: string | null
          og_default_image?: string | null
          opening_hours?: Json
          plausible_domain?: string | null
          primary_agent_name?: string | null
          primary_agent_photo_url?: string | null
          primary_agent_role?: string | null
          primary_color?: string | null
          qualifications?: Json
          radius_scale?: string | null
          seals?: Json
          secondary_color?: string | null
          service_areas?: Json
          service_region?: Json
          show_sold_prices?: boolean
          site_name?: string
          social?: Json
          surface_color?: string | null
          text_color?: string | null
          updated_at?: string
          valuation_offer?: Json
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          role: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      listing_documents_public: {
        Row: {
          created_at: string | null
          filename: string | null
          id: string | null
          is_public: boolean | null
          listing_id: string | null
          requires_lead: boolean | null
          storage_path: string | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_documents_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_documents_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images_public: {
        Row: {
          alt_text: Json | null
          blurhash: string | null
          caption: Json | null
          created_at: string | null
          height: number | null
          id: string | null
          is_floorplan: boolean | null
          is_primary: boolean | null
          is_visualization: boolean | null
          listing_id: string | null
          sort_order: number | null
          storage_path: string | null
          variants: Json | null
          width: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_tours_public: {
        Row: {
          created_at: string | null
          id: string | null
          listing_id: string | null
          sort_order: number | null
          thumbnail_url: string | null
          type: string | null
          url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_tours_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_tours_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      listings_public: {
        Row: {
          additional_costs: Json | null
          address_city: string | null
          address_country: string | null
          address_number: string | null
          address_region: string | null
          address_street: string | null
          address_zip: string | null
          agent_id: string | null
          availability_date: string | null
          bathrooms: number | null
          bedrooms: number | null
          commission_free: boolean | null
          commission_note: string | null
          commission_payer: string | null
          commission_type: string | null
          commission_value: number | null
          condition: string | null
          content_sections: Json | null
          created_at: string | null
          deal_type: string | null
          deposit: number | null
          description: Json | null
          energy: Json | null
          energy_exemption: string | null
          features: string[] | null
          floor: number | null
          geo_lat: number | null
          geo_lng: number | null
          geo_precision: string | null
          heating_costs_included: boolean | null
          heating_type: string | null
          highlights: Json | null
          id: string | null
          is_exclusive: boolean | null
          is_featured: boolean | null
          living_area: number | null
          meta_description: Json | null
          meta_title: Json | null
          plot_area: number | null
          price: number | null
          price_on_request: boolean | null
          price_period: string | null
          property_type: string | null
          published_at: string | null
          reference_code: string | null
          rental_status: string | null
          rooms: number | null
          service_charge: number | null
          slug: string | null
          sold_at: string | null
          sort_order: number | null
          status: string | null
          title: Json | null
          total_floors: number | null
          total_rent: number | null
          updated_at: string | null
          usable_area: number | null
          utilities_cost: number | null
          year_built: number | null
          year_renovated: number | null
        }
        Insert: {
          additional_costs?: Json | null
          address_city?: string | null
          address_country?: string | null
          address_number?: never
          address_region?: string | null
          address_street?: never
          address_zip?: string | null
          agent_id?: string | null
          availability_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          commission_free?: boolean | null
          commission_note?: never
          commission_payer?: never
          commission_type?: never
          commission_value?: never
          condition?: string | null
          content_sections?: Json | null
          created_at?: string | null
          deal_type?: string | null
          deposit?: number | null
          description?: Json | null
          energy?: Json | null
          energy_exemption?: string | null
          features?: string[] | null
          floor?: number | null
          geo_lat?: never
          geo_lng?: never
          geo_precision?: string | null
          heating_costs_included?: boolean | null
          heating_type?: string | null
          highlights?: Json | null
          id?: string | null
          is_exclusive?: boolean | null
          is_featured?: boolean | null
          living_area?: number | null
          meta_description?: Json | null
          meta_title?: Json | null
          plot_area?: number | null
          price?: number | null
          price_on_request?: boolean | null
          price_period?: string | null
          property_type?: string | null
          published_at?: string | null
          reference_code?: string | null
          rental_status?: string | null
          rooms?: number | null
          service_charge?: number | null
          slug?: string | null
          sold_at?: string | null
          sort_order?: number | null
          status?: string | null
          title?: Json | null
          total_floors?: number | null
          total_rent?: number | null
          updated_at?: string | null
          usable_area?: number | null
          utilities_cost?: number | null
          year_built?: number | null
          year_renovated?: number | null
        }
        Update: {
          additional_costs?: Json | null
          address_city?: string | null
          address_country?: string | null
          address_number?: never
          address_region?: string | null
          address_street?: never
          address_zip?: string | null
          agent_id?: string | null
          availability_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          commission_free?: boolean | null
          commission_note?: never
          commission_payer?: never
          commission_type?: never
          commission_value?: never
          condition?: string | null
          content_sections?: Json | null
          created_at?: string | null
          deal_type?: string | null
          deposit?: number | null
          description?: Json | null
          energy?: Json | null
          energy_exemption?: string | null
          features?: string[] | null
          floor?: number | null
          geo_lat?: never
          geo_lng?: never
          geo_precision?: string | null
          heating_costs_included?: boolean | null
          heating_type?: string | null
          highlights?: Json | null
          id?: string | null
          is_exclusive?: boolean | null
          is_featured?: boolean | null
          living_area?: number | null
          meta_description?: Json | null
          meta_title?: Json | null
          plot_area?: number | null
          price?: number | null
          price_on_request?: boolean | null
          price_period?: string | null
          property_type?: string | null
          published_at?: string | null
          reference_code?: string | null
          rental_status?: string | null
          rooms?: number | null
          service_charge?: number | null
          slug?: string | null
          sold_at?: string | null
          sort_order?: number | null
          status?: string | null
          title?: Json | null
          total_floors?: number | null
          total_rent?: number | null
          updated_at?: string | null
          usable_area?: number | null
          utilities_cost?: number | null
          year_built?: number | null
          year_renovated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_dashboard_metrics: {
        Args: { _from: string; _to: string }
        Returns: Json
      }
      admin_stale_active: {
        Args: { _days: number; _limit: number }
        Returns: {
          id: string
          published_at: string
          slug: string
          title: Json
          total: number
        }[]
      }
      count_active_owners: { Args: never; Returns: number }
      current_user_has_permission: { Args: { _key: string }; Returns: boolean }
      current_user_is_active: { Args: never; Returns: boolean }
      current_user_role: { Args: never; Returns: string }
      has_role: { Args: { _roles: string[] }; Returns: boolean }
      listing_is_public: { Args: { _listing_id: string }; Returns: boolean }
      listing_slug_base: {
        Args: {
          _city: string
          _property_type: string
          _rooms: number
          _title: Json
        }
        Returns: string
      }
      listing_slug_is_reserved: { Args: { _slug: string }; Returns: boolean }
      listing_unique_slug: {
        Args: { _base: string; _id: string }
        Returns: string
      }
      map_energy_source_text: { Args: { _input: string }; Returns: string }
      slugify: { Args: { _input: string }; Returns: string }
      storage_can_edit_listing_object: {
        Args: { _bucket: string; _name: string }
        Returns: boolean
      }
      storage_listing_id_from_path: { Args: { _name: string }; Returns: string }
      validate_listing_energy: {
        Args: { _country: string; _energy: Json; _property_type: string }
        Returns: string[]
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
  public: {
    Enums: {},
  },
} as const
