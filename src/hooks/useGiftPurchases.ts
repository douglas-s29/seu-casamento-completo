import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GiftPurchase {
  id: string;
  gift_id: string;
  purchaser_name: string;
  purchaser_email: string | null;
  amount: number;
  purchased_at: string;
  payment_status: string;
  external_payment_id: string | null;
  payment_gateway: string | null;
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
        // Only count confirmed purchases
        .eq("payment_status", "confirmed")
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
      paymentStatus = "pending",
      externalPaymentId,
      paymentGateway,
    }: {
      giftId: string;
      purchaserName: string;
      purchaserEmail?: string;
      amount: number;
      paymentStatus?: string;
      externalPaymentId?: string;
      paymentGateway?: string;
    }) => {
      // Insert purchase record with pending status
      // The purchase_count will be incremented by the webhook when payment is confirmed
      const { data: purchase, error: purchaseError } = await supabase
        .from("gift_purchases")
        .insert({
          gift_id: giftId,
          purchaser_name: purchaserName,
          purchaser_email: purchaserEmail || null,
          amount,
          payment_status: paymentStatus,
          external_payment_id: externalPaymentId || null,
          payment_gateway: paymentGateway || null,
        } as any)
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      return purchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift_purchases"] });
      queryClient.invalidateQueries({ queryKey: ["gift_purchases_by_day"] });
      queryClient.invalidateQueries({ queryKey: ["gifts"] });
    },
  });
}
