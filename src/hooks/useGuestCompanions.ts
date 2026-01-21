import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GuestCompanion {
  id: string;
  guest_id: string;
  name: string;
  age: number | null;
  created_at: string;
}

export function useGuestCompanions(guestId?: string) {
  return useQuery({
    queryKey: ["guest-companions", guestId],
    queryFn: async () => {
      const query = supabase
        .from("guest_companions")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (guestId) {
        query.eq("guest_id", guestId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GuestCompanion[];
    },
    enabled: guestId !== undefined,
  });
}

export function useAllGuestCompanions() {
  return useQuery({
    queryKey: ["all-guest-companions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_companions")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as GuestCompanion[];
    },
  });
}
