/**
 * Webhook Logging Utility
 * Logs webhook events to database for audit trail
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const logWebhook = async (
  supabase: SupabaseClient,
  gateway: "abacatepay" | "asaas",
  event: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  success: boolean,
  error?: string
): Promise<void> => {
  try {
    await supabase.from("webhook_logs").insert({
      gateway,
      event,
      payload,
      success,
      error: error || null,
      received_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to log webhook:", err);
    // Don't throw - logging failure shouldn't break webhook processing
  }
};
