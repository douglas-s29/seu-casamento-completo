import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Gift = Tables<"gifts">;
export type GiftInsert = TablesInsert<"gifts">;
export type GiftUpdate = TablesUpdate<"gifts">;

export function useGifts() {
  return useQuery({
    queryKey: ["gifts"],
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
      queryClient.invalidateQueries({ queryKey: ["gifts"] });
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
      queryClient.invalidateQueries({ queryKey: ["gifts"] });
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
      queryClient.invalidateQueries({ queryKey: ["gifts"] });
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
      queryClient.invalidateQueries({ queryKey: ["gifts"] });
    },
  });
}
