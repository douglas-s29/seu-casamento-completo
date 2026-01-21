import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Guest = Tables<"guests">;
export type GuestInsert = TablesInsert<"guests">;
export type GuestUpdate = TablesUpdate<"guests">;

export function useGuests() {
  return useQuery({
    queryKey: ["guests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAddGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guest: GuestInsert) => {
      const { data, error } = await supabase
        .from("guests")
        .insert(guest)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
    },
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: GuestUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("guests")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
    },
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("guests")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
    },
  });
}

export function useRsvpByCode() {
  return useMutation({
    mutationFn: async ({ 
      invitationCode, 
      rsvpStatus, 
      companions, 
      message 
    }: { 
      invitationCode: string; 
      rsvpStatus: "confirmed" | "declined"; 
      companions?: number;
      message?: string;
    }) => {
      const { data, error } = await supabase
        .from("guests")
        .update({ 
          rsvp_status: rsvpStatus, 
          companions: companions || 0,
          message: message || null
        })
        .eq("invitation_code", invitationCode)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  });
}
