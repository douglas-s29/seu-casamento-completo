/**
 * Asaas Payment Status Edge Function
 * Checks payment status and allows cancellation
 */

import { getCorsHeaders, handleCorsPreFlight } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

interface StatusRequest {
  paymentId: string;
  action?: "check" | "cancel";
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreFlight(origin);
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      console.error("ASAAS_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Configuração de pagamento não encontrada" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Rate limiting - more permissive for status checks
    const identifier = req.headers.get("x-forwarded-for") || 
                       req.headers.get("x-real-ip") || 
                       "unknown";
    const rateLimit = checkRateLimit(identifier, 60, 60000); // 60 requests per minute

    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for ${identifier}`);
      return new Response(
        JSON.stringify({ success: false, error: "Muitas requisições. Aguarde alguns instantes." }),
        { status: 429, headers: corsHeaders }
      );
    }

    // Determine if it's sandbox or production based on key prefix
    const isSandbox = !ASAAS_API_KEY.startsWith("$aact_");
    const baseUrl = isSandbox
      ? "https://sandbox.asaas.com/api/v3"
      : "https://api.asaas.com/v3";

    const body: StatusRequest = await req.json();

    if (!body.paymentId) {
      return new Response(
        JSON.stringify({ success: false, error: "ID do pagamento não informado" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const action = body.action || "check";

    if (action === "cancel") {
      // Cancel/delete the payment
      console.log(`Cancelling payment: ${body.paymentId}`);
      
      const deleteResponse = await fetch(`${baseUrl}/payments/${body.paymentId}`, {
        method: "DELETE",
        headers: {
          "access_token": ASAAS_API_KEY,
        },
      });

      const deleteData = await deleteResponse.json();
      console.log("Cancel response:", deleteData);

      if (deleteData.errors) {
        const errorMessages = deleteData.errors
          .map((e: { description: string }) => e.description)
          .join(", ");
        return new Response(
          JSON.stringify({
            success: false,
            error: "Erro ao cancelar pagamento",
            details: errorMessages,
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          cancelled: true,
          message: "Pagamento cancelado com sucesso",
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Check payment status
    console.log(`Checking payment status: ${body.paymentId}`);

    const statusResponse = await fetch(`${baseUrl}/payments/${body.paymentId}`, {
      headers: {
        "access_token": ASAAS_API_KEY,
      },
    });

    const paymentData = await statusResponse.json();
    console.log("Payment status:", paymentData.status);

    if (paymentData.errors) {
      const errorMessages = paymentData.errors
        .map((e: { description: string }) => e.description)
        .join(", ");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Erro ao verificar status",
          details: errorMessages,
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Map Asaas status to friendly status
    // PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, RECEIVED_IN_CASH, REFUND_REQUESTED, CHARGEBACK_REQUESTED, CHARGEBACK_DISPUTE, AWAITING_CHARGEBACK_REVERSAL, DUNNING_REQUESTED, DUNNING_RECEIVED, AWAITING_RISK_ANALYSIS
    const isPaid = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(paymentData.status);
    const isCancelled = ["REFUNDED", "DELETED"].includes(paymentData.status);
    const isPending = paymentData.status === "PENDING";

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentData.id,
        status: paymentData.status,
        isPaid,
        isPending,
        isCancelled,
        value: paymentData.value,
        paymentDate: paymentData.paymentDate,
        confirmedDate: paymentData.confirmedDate,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error checking payment status:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno ao verificar status" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
