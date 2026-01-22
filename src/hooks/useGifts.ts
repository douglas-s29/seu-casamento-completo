import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Gift = Tables<"gifts">;
export type GiftInsert = TablesInsert<"gifts">;
export type GiftUpdate = TablesUpdate<"gifts">;

// Public gift type (without sensitive purchaser info)
export type GiftPublic = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  purchase_count: number;
  purchase_limit: number;
  purchased: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Public hook - uses gifts_public view (no sensitive data)
 * Use this for guest-facing pages like /presentes
 */
export function useGifts() {
  return useQuery({
    queryKey: ["gifts_public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gifts_public")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as GiftPublic[];
    },
  });
}

/**
 * Admin hook - uses gifts table directly (full data including purchaser info)
 * Use this only in admin pages
 */
export function useGiftsAdmin() {
  return useQuery({
    queryKey: ["gifts_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gifts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAddGift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gift: GiftInsert) => {
      const { data, error } = await supabase
        .from("gifts")
        .insert(gift)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gifts_admin"] });
      queryClient.invalidateQueries({ queryKey: ["gifts_public"] });
    },
  });
}

export function useUpdateGift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: GiftUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("gifts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gifts_admin"] });
      queryClient.invalidateQueries({ queryKey: ["gifts_public"] });
    },
  });
}

export function useDeleteGift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("gifts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gifts_admin"] });
      queryClient.invalidateQueries({ queryKey: ["gifts_public"] });
    },
  });
}

export function usePurchaseGift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      purchaserName, 
      purchaserEmail 
    }: { 
      id: string; 
      purchaserName: string; 
      purchaserEmail?: string;
    }) => {
      const { data, error } = await supabase
        .from("gifts")
        .update({ 
          purchased: true,
          purchaser_name: purchaserName,
          purchaser_email: purchaserEmail || null,
          purchased_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("purchased", false)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gifts_admin"] });
      queryClient.invalidateQueries({ queryKey: ["gifts_public"] });
    },
  });
}
