import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: AsaasWebhookPayload = await req.json();
    console.log("Asaas webhook received:", JSON.stringify(body, null, 2));

    const { event, payment } = body;

    if (!payment) {
      console.log("No payment data in webhook");
      return new Response(
        JSON.stringify({ success: true, message: "No payment data" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        return new Response(
          JSON.stringify({ success: true, message: `Event ${event} not handled` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      throw findError;
    }

    if (!purchase) {
      console.log(`No purchase found for payment ${paymentId}`);
      return new Response(
        JSON.stringify({ success: true, message: "Purchase not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        purchaseId: purchase.id,
        previousStatus,
        newStatus 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});