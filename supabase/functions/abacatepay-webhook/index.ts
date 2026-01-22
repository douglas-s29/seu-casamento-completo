import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight } from "../_shared/cors.ts";
import { logWebhook } from "../_shared/webhookLog.ts";

interface AbacateWebhookPayload {
  event: string;
  data?: {
    billing?: {
      id: string;
      status: string;
      metadata?: {
        purchaseId?: string;
        giftId?: string;
      };
    };
  };
}

const validateAbacateWebhook = async (payload: string, signature: string | null): Promise<boolean> => {
  const secret = Deno.env.get("ABACATEPAY_WEBHOOK_SECRET");
  
  // If no secret configured, log warning but allow (for backwards compatibility)
  if (!secret) {
    console.warn("ABACATEPAY_WEBHOOK_SECRET not configured - webhook signature not validated");
    return true;
  }
  
  if (!signature) {
    console.error("Missing webhook signature");
    return false;
  }
  
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const expectedSignature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );
    
    const expectedSignatureBase64 = btoa(String.fromCharCode(...new Uint8Array(expectedSignature)));
    return signature === expectedSignatureBase64;
  } catch (error) {
    console.error("Error validating webhook signature:", error);
    return false;
  }
};

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreFlight(origin);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate webhook signature
    const signature = req.headers.get("X-Abacate-Signature");
    const bodyText = await req.text();
    
    const isValid = await validateAbacateWebhook(bodyText, signature);
    if (!isValid) {
      await logWebhook(supabase, "abacatepay", "signature_validation_failed", {}, false, "Invalid signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const body: AbacateWebhookPayload = JSON.parse(bodyText);
    console.log("AbacatePay webhook received:", JSON.stringify(body, null, 2));

    const { event, data } = body;
    const billing = data?.billing;

    if (!billing) {
      console.log("No billing data in webhook");
      await logWebhook(supabase, "abacatepay", event, body, true);
      return new Response(
        JSON.stringify({ success: true, message: "No billing data" }),
        { status: 200, headers: corsHeaders }
      );
    }

    const billingId = billing.id;
    let newStatus: string;

    // Map AbacatePay events to our status
    // AbacatePay billing statuses: PENDING, EXPIRED, CANCELLED, PAID, REFUNDED
    switch (billing.status) {
      case "PAID":
        newStatus = "confirmed";
        break;
      case "REFUNDED":
        newStatus = "refunded";
        break;
      case "CANCELLED":
      case "EXPIRED":
        newStatus = "cancelled";
        break;
      default:
        console.log(`Unhandled billing status: ${billing.status}`);
        await logWebhook(supabase, "abacatepay", event, body, true, `Unhandled status: ${billing.status}`);
        return new Response(
          JSON.stringify({ success: true, message: `Status ${billing.status} not handled` }),
          { status: 200, headers: corsHeaders }
        );
    }

    console.log(`Updating billing ${billingId} to status: ${newStatus}`);

    // Find and update the purchase by external_payment_id
    const { data: purchase, error: findError } = await supabase
      .from("gift_purchases")
      .select("id, gift_id, payment_status")
      .eq("external_payment_id", billingId)
      .maybeSingle();

    if (findError) {
      console.error("Error finding purchase:", findError);
      await logWebhook(supabase, "abacatepay", event, body, false, findError.message);
      throw findError;
    }

    if (!purchase) {
      console.log(`No purchase found for billing ${billingId}`);
      await logWebhook(supabase, "abacatepay", event, body, true, "Purchase not found");
      return new Response(
        JSON.stringify({ success: true, message: "Purchase not found" }),
        { status: 200, headers: corsHeaders }
      );
    }

    const previousStatus = purchase.payment_status;

    // Update purchase status
    const { error: updateError } = await supabase
      .from("gift_purchases")
      .update({ payment_status: newStatus })
      .eq("id", purchase.id);

    if (updateError) {
      console.error("Error updating purchase:", updateError);
      await logWebhook(supabase, "abacatepay", event, body, false, updateError.message);
      throw updateError;
    }

    // Update gift purchase_count based on status change
    if (previousStatus !== newStatus) {
      // If going from pending/cancelled/refunded to confirmed, increment count
      if (newStatus === "confirmed" && previousStatus !== "confirmed") {
        const { error: incrementError } = await supabase.rpc("increment_gift_purchase_count", {
          gift_id_param: purchase.gift_id
        });
        if (incrementError) {
          console.error("Error incrementing count:", incrementError);
        }
      }
      // If going from confirmed to refunded/cancelled, decrement count
      else if ((newStatus === "refunded" || newStatus === "cancelled") && previousStatus === "confirmed") {
        const { error: decrementError } = await supabase.rpc("decrement_gift_purchase_count", {
          gift_id_param: purchase.gift_id
        });
        if (decrementError) {
          console.error("Error decrementing count:", decrementError);
        }
      }
    }

    console.log(`Purchase ${purchase.id} updated from ${previousStatus} to ${newStatus}`);
    await logWebhook(supabase, "abacatepay", event, body, true);

    return new Response(
      JSON.stringify({ 
        success: true, 
        purchaseId: purchase.id,
        previousStatus,
        newStatus 
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