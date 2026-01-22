import { getCorsHeaders, handleCorsPreFlight } from "../_shared/cors.ts";
import { sanitizeForLog } from "../_shared/sanitize.ts";
import { PaymentRequestSchema } from "../_shared/validation.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";
import { fetchWithRetry } from "../_shared/retry.ts";

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
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreFlight(origin);
  }

  try {
    const ABACATEPAY_API_KEY = Deno.env.get("ABACATEPAY_API_KEY");
    if (!ABACATEPAY_API_KEY) {
      console.error("ABACATEPAY_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Configuração de pagamento não encontrada" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Rate limiting - use customer phone or IP as identifier
    const identifier = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = checkRateLimit(identifier, 10, 60000);
    
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns instantes." }),
        { status: 429, headers: corsHeaders }
      );
    }

    const body: PaymentRequest = await req.json();
    
    // Validate request payload
    const validation = PaymentRequestSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation failed:", validation.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Dados inválidos", 
          details: validation.error.errors.map(e => e.message).join(", ")
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("Payment request received:", sanitizeForLog({ 
      products: body.products?.length,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
    }));

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

    console.log("Creating billing with payload:", sanitizeForLog(billingPayload));

    // Generate idempotency key
    const idempotencyKey = crypto.randomUUID();

    const billingResponse = await fetchWithRetry("https://api.abacatepay.com/v1/billing/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ABACATEPAY_API_KEY}`,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(billingPayload),
    }, 3);

    if (!billingResponse.ok) {
      const errorText = await billingResponse.text();
      console.error("AbacatePay API error:", {
        status: billingResponse.status,
        body: errorText,
      });
      
      return new Response(
        JSON.stringify({ 
          error: "Erro ao processar pagamento", 
          details: billingResponse.status >= 500 
            ? "Serviço temporariamente indisponível" 
            : "Dados inválidos",
        }),
        { status: billingResponse.status, headers: corsHeaders }
      );
    }

    const billingData = await billingResponse.json();
    console.log("AbacatePay response:", sanitizeForLog(billingData));

    // Validate response structure
    if (!billingData.data?.id || !billingData.data?.url) {
      console.error("Invalid AbacatePay response structure:", billingData);
      return new Response(
        JSON.stringify({ error: "Resposta inválida do gateway de pagamento" }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (billingData.error) {
      console.error("AbacatePay error:", billingData.error);
      return new Response(
        JSON.stringify({ 
          error: "Erro ao criar cobrança", 
          details: billingData.error 
        }),
        { status: 400, headers: corsHeaders }
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
        headers: corsHeaders
      }
    );

  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar pagamento" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
