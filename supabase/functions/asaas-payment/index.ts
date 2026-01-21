import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  giftId: string;
  giftName: string;
  value: number;
  customerName: string;
  customerEmail?: string;
  billingType: "PIX" | "CREDIT_CARD";
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      console.error("ASAAS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Configuração de pagamento não encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine if it's sandbox or production based on key prefix
    const isSandbox = ASAAS_API_KEY.startsWith("$aact_") === false;
    const baseUrl = isSandbox 
      ? "https://sandbox.asaas.com/api/v3"
      : "https://api.asaas.com/v3";

    console.log(`Using Asaas ${isSandbox ? 'Sandbox' : 'Production'} API`);

    const body: PaymentRequest = await req.json();
    console.log("Payment request received:", { 
      giftId: body.giftId, 
      giftName: body.giftName,
      value: body.value,
      billingType: body.billingType,
      customerName: body.customerName 
    });

    // First, create or find customer
    const customerResponse = await fetch(`${baseUrl}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: JSON.stringify({
        name: body.customerName,
        email: body.customerEmail || undefined,
        notificationDisabled: true,
      }),
    });

    const customerData = await customerResponse.json();
    console.log("Customer response:", customerData);

    if (!customerData.id && !customerData.errors) {
      throw new Error("Falha ao criar cliente no Asaas");
    }

    const customerId = customerData.id;

    // Calculate due date (today + 1 day)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    // Create payment
    const paymentPayload: Record<string, unknown> = {
      customer: customerId,
      billingType: body.billingType,
      value: body.value,
      dueDate: dueDateStr,
      description: `Presente de Casamento: ${body.giftName}`,
      externalReference: body.giftId,
    };

    // Add credit card info if paying by card
    if (body.billingType === "CREDIT_CARD" && body.creditCard && body.creditCardHolderInfo) {
      paymentPayload.creditCard = body.creditCard;
      paymentPayload.creditCardHolderInfo = body.creditCardHolderInfo;
    }

    console.log("Creating payment with payload:", { 
      ...paymentPayload, 
      creditCard: paymentPayload.creditCard ? "[REDACTED]" : undefined 
    });

    const paymentResponse = await fetch(`${baseUrl}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentData = await paymentResponse.json();
    console.log("Payment response:", paymentData);

    if (paymentData.errors) {
      console.error("Asaas payment error:", paymentData.errors);
      return new Response(
        JSON.stringify({ 
          error: "Erro ao processar pagamento", 
          details: paymentData.errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If PIX, get the QR code
    let pixData = null;
    if (body.billingType === "PIX") {
      const pixResponse = await fetch(`${baseUrl}/payments/${paymentData.id}/pixQrCode`, {
        headers: {
          "access_token": ASAAS_API_KEY,
        },
      });
      pixData = await pixResponse.json();
      console.log("PIX QR Code generated:", pixData.success !== false);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentData.id,
        status: paymentData.status,
        billingType: body.billingType,
        value: paymentData.value,
        invoiceUrl: paymentData.invoiceUrl,
        pixQrCode: pixData?.encodedImage,
        pixCopyPaste: pixData?.payload,
        expirationDate: pixData?.expirationDate,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar pagamento" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
