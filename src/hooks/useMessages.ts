import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Message = Tables<"messages">;
export type MessageInsert = TablesInsert<"messages">;
export type MessageUpdate = TablesUpdate<"messages">;

export function useMessages(includeUnapproved = false) {
  return useQuery({
    queryKey: ["messages", includeUnapproved],
    queryFn: async () => {
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (!includeUnapproved) {
        query = query.eq("approved", true);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAddMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: MessageInsert) => {
      const { data, error } = await supabase
        .from("messages")
        .insert(message)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useApproveMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { data, error } = await supabase
        .from("messages")
        .update({ approved })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}
