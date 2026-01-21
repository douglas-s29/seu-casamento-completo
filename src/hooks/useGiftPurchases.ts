import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GiftPurchase {
  id: string;
  gift_id: string;
  purchaser_name: string;
  purchaser_email: string | null;
  amount: number;
  purchased_at: string;
}

export function useGiftPurchases() {
  return useQuery({
    queryKey: ["gift_purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_purchases")
        .select("*")
        .order("purchased_at", { ascending: false });
      
      if (error) throw error;
      return data as GiftPurchase[];
    },
  });
}

export function useGiftPurchasesByDay() {
  return useQuery({
    queryKey: ["gift_purchases_by_day"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_purchases")
        .select("*")
        .order("purchased_at", { ascending: true });
      
      if (error) throw error;
      
      // Group by day
      const byDay: Record<string, { date: string; total: number; count: number }> = {};
      
      (data as GiftPurchase[]).forEach((purchase) => {
        const date = new Date(purchase.purchased_at).toISOString().split("T")[0];
        if (!byDay[date]) {
          byDay[date] = { date, total: 0, count: 0 };
        }
        byDay[date].total += Number(purchase.amount);
        byDay[date].count += 1;
      });
      
      return Object.values(byDay);
    },
  });
}

export function useAddGiftPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      giftId,
      purchaserName,
      purchaserEmail,
      amount,
    }: {
      giftId: string;
      purchaserName: string;
      purchaserEmail?: string;
      amount: number;
    }) => {
      // Insert purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from("gift_purchases")
        .insert({
          gift_id: giftId,
          purchaser_name: purchaserName,
          purchaser_email: purchaserEmail || null,
          amount,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Update purchase_count on the gift
      const { data: gift } = await supabase
        .from("gifts")
        .select("purchase_count, purchase_limit")
        .eq("id", giftId)
        .single();

      if (gift) {
        const newCount = ((gift as any).purchase_count || 0) + 1;
        const limit = (gift as any).purchase_limit || 1;
        const isPurchased = newCount >= limit;
        
        await supabase
          .from("gifts")
          .update({
            purchase_count: newCount,
            purchased: isPurchased,
            purchaser_name: purchaserName,
            purchaser_email: purchaserEmail || null,
            purchased_at: new Date().toISOString(),
          } as any)
          .eq("id", giftId);
      }

      return purchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift_purchases"] });
      queryClient.invalidateQueries({ queryKey: ["gift_purchases_by_day"] });
      queryClient.invalidateQueries({ queryKey: ["gifts"] });
    },
  });
}
