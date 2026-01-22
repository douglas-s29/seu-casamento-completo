/**
 * Asaas Webhook Handler
 * Validates webhook token and updates payment status
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight } from "../_shared/cors.ts";
import { logWebhook } from "../_shared/webhookLog.ts";

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    status: string;
    billingType: string;
    externalReference: string;
  };
}

/**
 * Validate Asaas webhook token
 * CRITICAL: This MUST pass for webhook to be processed
 */
const validateAsaasWebhook = (token: string | null): boolean => {
  const expectedToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");

  if (!expectedToken) {
    console.error("SECURITY WARNING: ASAAS_WEBHOOK_TOKEN not configured!");
    // In production, we should reject webhooks without token validation
    // For now, return false to enforce security
    return false;
  }

  if (!token) {
    console.error("Missing webhook token in request");
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (token.length !== expectedToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }

  return result === 0;
};

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreFlight(origin);
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate webhook token - CRITICAL SECURITY CHECK
    const token = req.headers.get("asaas-access-token");
    if (!validateAsaasWebhook(token)) {
      console.error("Webhook token validation failed");
      await logWebhook(supabase, "asaas", "token_validation_failed", {}, false, "Unauthorized");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const body: AsaasWebhookPayload = await req.json();
    console.log("Asaas webhook received:", JSON.stringify({
      event: body.event,
      paymentId: body.payment?.id,
      status: body.payment?.status,
    }));

    const { event, payment } = body;

    if (!payment) {
      console.log("No payment data in webhook");
      await logWebhook(supabase, "asaas", event, { event }, true);
      return new Response(
        JSON.stringify({ success: true, message: "No payment data" }),
        { status: 200, headers: corsHeaders }
      );
    }

    const paymentId = payment.id;
    let newStatus: string;

    // Map Asaas events to our status
    switch (event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        newStatus = "confirmed";
        break;
      case "PAYMENT_REFUNDED":
        newStatus = "refunded";
        break;
      case "PAYMENT_DELETED":
      case "PAYMENT_OVERDUE":
        newStatus = "cancelled";
        break;
      default:
        console.log(`Unhandled event type: ${event}`);
        await logWebhook(supabase, "asaas", event, { event, paymentId }, true, `Unhandled event: ${event}`);
        return new Response(
          JSON.stringify({ success: true, message: `Event ${event} not handled` }),
          { status: 200, headers: corsHeaders }
        );
    }

    console.log(`Updating payment ${paymentId} to status: ${newStatus}`);

    // Find and update the purchase by external_payment_id
    const { data: purchase, error: findError } = await supabase
      .from("gift_purchases")
      .select("id, gift_id, payment_status")
      .eq("external_payment_id", paymentId)
      .maybeSingle();

    if (findError) {
      console.error("Error finding purchase:", findError);
      await logWebhook(supabase, "asaas", event, { event, paymentId }, false, findError.message);
      throw findError;
    }

    if (!purchase) {
      console.log(`No purchase found for payment ${paymentId}`);
      await logWebhook(supabase, "asaas", event, { event, paymentId }, true, "Purchase not found");
      return new Response(
        JSON.stringify({ success: true, message: "Purchase not found" }),
        { status: 200, headers: corsHeaders }
      );
    }

    const previousStatus = purchase.payment_status;

    // Don't update if status is the same
    if (previousStatus === newStatus) {
      console.log(`Payment ${paymentId} already has status ${newStatus}`);
      await logWebhook(supabase, "asaas", event, { event, paymentId }, true, "Status unchanged");
      return new Response(
        JSON.stringify({ success: true, message: "Status unchanged" }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Update purchase status
    const { error: updateError } = await supabase
      .from("gift_purchases")
      .update({ payment_status: newStatus })
      .eq("id", purchase.id);

    if (updateError) {
      console.error("Error updating purchase:", updateError);
      await logWebhook(supabase, "asaas", event, { event, paymentId }, false, updateError.message);
      throw updateError;
    }

    // Update gift purchase_count based on status change
    if (previousStatus !== newStatus) {
      // If going from pending/cancelled/refunded to confirmed, increment count
      if (newStatus === "confirmed" && previousStatus !== "confirmed") {
        const { error: incrementError } = await supabase.rpc("increment_gift_purchase_count", {
          gift_id_param: purchase.gift_id,
        });
        if (incrementError) {
          console.error("Error incrementing count:", incrementError);
        } else {
          console.log(`Incremented purchase count for gift ${purchase.gift_id}`);
        }
      }
      // If going from confirmed to refunded/cancelled, decrement count
      else if ((newStatus === "refunded" || newStatus === "cancelled") && previousStatus === "confirmed") {
        const { error: decrementError } = await supabase.rpc("decrement_gift_purchase_count", {
          gift_id_param: purchase.gift_id,
        });
        if (decrementError) {
          console.error("Error decrementing count:", decrementError);
        } else {
          console.log(`Decremented purchase count for gift ${purchase.gift_id}`);
        }
      }
    }

    console.log(`Purchase ${purchase.id} updated from ${previousStatus} to ${newStatus}`);
    await logWebhook(supabase, "asaas", event, { event, paymentId, previousStatus, newStatus }, true);

    return new Response(
      JSON.stringify({
        success: true,
        purchaseId: purchase.id,
        previousStatus,
        newStatus,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
