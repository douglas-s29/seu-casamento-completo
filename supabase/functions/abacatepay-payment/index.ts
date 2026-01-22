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
  returnUrl: string;
  completionUrl: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ABACATEPAY_API_KEY = Deno.env.get("ABACATEPAY_API_KEY");
    if (!ABACATEPAY_API_KEY) {
      console.error("ABACATEPAY_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Configuração de pagamento não encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: PaymentRequest = await req.json();
    console.log("Payment request received:", { 
      giftId: body.giftId, 
      giftName: body.giftName,
      value: body.value,
      customerName: body.customerName 
    });

    // Valor em centavos
    const amountInCents = Math.round(body.value * 100);

    // Criar cobrança no AbacatePay
    const billingPayload = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: body.giftId,
          name: body.giftName,
          description: `Presente de Casamento: ${body.giftName}`,
          quantity: 1,
          price: amountInCents,
        },
      ],
      returnUrl: body.returnUrl,
      completionUrl: body.completionUrl,
      customer: {
        name: body.customerName,
        email: body.customerEmail || undefined,
      },
      metadata: {
        giftId: body.giftId,
        purchaserName: body.customerName,
      },
    };

    console.log("Creating billing with payload:", billingPayload);

    const billingResponse = await fetch("https://api.abacatepay.com/v1/billing/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ABACATEPAY_API_KEY}`,
      },
      body: JSON.stringify(billingPayload),
    });

    const billingData = await billingResponse.json();
    console.log("AbacatePay response:", billingData);

    if (billingData.error) {
      console.error("AbacatePay error:", billingData.error);
      return new Response(
        JSON.stringify({ 
          error: "Erro ao criar cobrança", 
          details: billingData.error 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        billingId: billingData.data?.id,
        status: billingData.data?.status,
        paymentUrl: billingData.data?.url,
        amount: billingData.data?.amount,
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
