import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema types
export type Database = {
  public: {
    Tables: {
      land_plots: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          price: number;
          area: number;
          location: string;
          coordinates: {
            lat: number;
            lng: number;
          };
          boundaries: Array<{
            lat: number;
            lng: number;
          }> | null;
          status: 'available' | 'sold' | 'reserved' | 'pending';
          type: 'residential' | 'commercial' | 'agricultural' | 'industrial';
          amenities: string[];
          images: string[];
          owner_name: string;
          owner_contact: string;
          owner_email: string;
          created_at: string;
          updated_at: string;
          zoning: string | null;
          utilities: string[] | null;
          access_roads: boolean | null;
          soil_type: string | null;
          elevation: number | null;
        };
        Insert: Omit<Database['public']['Tables']['land_plots']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['land_plots']['Insert']>;
      };
      plot_inquiries: {
        Row: {
          id: string;
          plot_id: string;
          name: string;
          email: string;
          phone: string;
          message: string;
          inspection_date: string | null;
          financing_needed: boolean;
          status: 'pending' | 'contacted' | 'viewed' | 'closed';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['plot_inquiries']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['plot_inquiries']['Insert']>;
      };
    };
  };
};