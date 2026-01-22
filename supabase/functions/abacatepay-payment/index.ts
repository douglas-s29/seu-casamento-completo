const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Product {
  externalId: string;
  name: string;
  description: string;
  quantity: number;
  price: number; // in cents
}

interface PaymentRequest {
  products: Product[];
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  customerTaxId: string;
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
      products: body.products?.length,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
    });

    // Build payload according to AbacatePay documentation
    const billingPayload = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: body.products,
      returnUrl: body.returnUrl,
      completionUrl: body.completionUrl,
      customer: {
        name: body.customerName,
        email: body.customerEmail || `${body.customerPhone}@cliente.temp`,
        cellphone: body.customerPhone,
        taxId: body.customerTaxId,
      },
      metadata: {
        source: "wedding-gifts",
      },
    };

    console.log("Creating billing with payload:", JSON.stringify(billingPayload, null, 2));

    const billingResponse = await fetch("https://api.abacatepay.com/v1/billing/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ABACATEPAY_API_KEY}`,
      },
      body: JSON.stringify(billingPayload),
    });

    const billingData = await billingResponse.json();
    console.log("AbacatePay response:", JSON.stringify(billingData, null, 2));

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
