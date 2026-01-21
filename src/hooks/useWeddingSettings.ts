import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type WeddingSettings = Tables<"wedding_settings">;

export function useWeddingSettings() {
  return useQuery({
    queryKey: ["wedding_settings"],
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
      queryClient.invalidateQueries({ queryKey: ["wedding_settings"] });
    },
  });
}
