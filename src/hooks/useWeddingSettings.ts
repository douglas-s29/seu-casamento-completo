import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type WeddingSettings = Tables<"wedding_settings">;

// Public wedding settings type (without banking info)
export type WeddingSettingsPublic = {
  id: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string | null;
  ceremony_location: string | null;
  ceremony_address: string | null;
  ceremony_map_url: string | null;
  reception_location: string | null;
  reception_address: string | null;
  reception_map_url: string | null;
  dress_code: string | null;
  story_text: string | null;
  background_image_url: string | null;
  gift_purchase_limit: number;
  created_at: string;
  updated_at: string;
};

/**
 * Public hook - uses wedding_settings_public view (no banking info)
 * Use this for guest-facing pages
 */
export function useWeddingSettings() {
  return useQuery({
    queryKey: ["wedding_settings_public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_settings_public")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as WeddingSettingsPublic | null;
    },
  });
}

/**
 * Admin hook - uses wedding_settings table directly (full data including banking)
 * Use this only in admin pages
 */
export function useWeddingSettingsAdmin() {
  return useQuery({
    queryKey: ["wedding_settings_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateWeddingSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"wedding_settings"> & { id: string }) => {
      const { data, error } = await supabase
        .from("wedding_settings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding_settings_admin"] });
      queryClient.invalidateQueries({ queryKey: ["wedding_settings_public"] });
    },
  });
}
