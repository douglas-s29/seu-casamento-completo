/**
 * Asaas Payment Edge Function
 * Unified payment gateway supporting PIX and Credit Card
 */

import { getCorsHeaders, handleCorsPreFlight } from "../_shared/cors.ts";
import { sanitizeForLog } from "../_shared/sanitize.ts";
import { AsaasPaymentRequestSchema } from "../_shared/validation.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";
import { validateCreditCard } from "../_shared/cardValidation.ts";

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

const findCustomerByEmail = async (
  email: string,
  baseUrl: string,
  apiKey: string
): Promise<{ id: string } | undefined> => {
  try {
    const response = await fetch(
      `${baseUrl}/customers?email=${encodeURIComponent(email)}`,
      {
        headers: {
          "access_token": apiKey,
        },
      }
    );

    const data = await response.json();
    return data.data?.[0];
  } catch (error) {
    console.error("Error finding customer:", error);
    return undefined;
  }
};

const findCustomerByCpf = async (
  cpf: string,
  baseUrl: string,
  apiKey: string
): Promise<{ id: string } | undefined> => {
  try {
    const response = await fetch(
      `${baseUrl}/customers?cpfCnpj=${encodeURIComponent(cpf)}`,
      {
        headers: {
          "access_token": apiKey,
        },
      }
    );

    const data = await response.json();
    return data.data?.[0];
  } catch (error) {
    console.error("Error finding customer by CPF:", error);
    return undefined;
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
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      console.error("ASAAS_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Configuração de pagamento não encontrada" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Rate limiting
    const identifier = req.headers.get("x-forwarded-for") || 
                       req.headers.get("x-real-ip") || 
                       "unknown";
    const rateLimit = checkRateLimit(identifier, 10, 60000);

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

    console.log(`Using Asaas ${isSandbox ? "Sandbox" : "Production"} API`);

    const body: PaymentRequest = await req.json();

    // Validate request payload
    const validation = AsaasPaymentRequestSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation failed:", validation.error.errors);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Dados inválidos",
          details: validation.error.errors.map((e) => e.message).join(", "),
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate credit card if payment is by card
    if (body.billingType === "CREDIT_CARD" && body.creditCard) {
      const cardValidation = validateCreditCard(body.creditCard);
      if (!cardValidation.valid) {
        return new Response(
          JSON.stringify({ success: false, error: cardValidation.error }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    console.log("Payment request received:", sanitizeForLog({
      giftId: body.giftId,
      giftName: body.giftName,
      value: body.value,
      billingType: body.billingType,
      customerName: body.customerName,
    }));

    // Get CPF from creditCardHolderInfo
    const cpfCnpj = body.creditCardHolderInfo?.cpfCnpj?.replace(/\D/g, "");

    // First, try to create customer
    const customerPayload: Record<string, unknown> = {
      name: body.customerName,
      notificationDisabled: true,
    };

    if (body.customerEmail) {
      customerPayload.email = body.customerEmail;
    }

    if (cpfCnpj) {
      customerPayload.cpfCnpj = cpfCnpj;
    }

    if (body.creditCardHolderInfo?.phone) {
      customerPayload.phone = body.creditCardHolderInfo.phone.replace(/\D/g, "");
    }

    console.log("Creating customer with payload:", sanitizeForLog(customerPayload));

    const customerResponse = await fetch(`${baseUrl}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: JSON.stringify(customerPayload),
    });

    const customerData = await customerResponse.json();
    console.log("Customer response:", sanitizeForLog(customerData));

    let customerId = customerData.id;

    // Handle customer already exists case
    if (!customerId && customerData.errors) {
      const alreadyExistsError = customerData.errors.find(
        (e: { code: string }) => e.code === "customer_already_exists" || e.code === "invalid_cpfCnpj"
      );

      if (alreadyExistsError) {
        // Try to find existing customer by CPF first, then by email
        if (cpfCnpj) {
          const existingCustomer = await findCustomerByCpf(cpfCnpj, baseUrl, ASAAS_API_KEY);
          if (existingCustomer) {
            customerId = existingCustomer.id;
            console.log("Using existing customer by CPF:", customerId);
          }
        }

        if (!customerId && body.customerEmail) {
          const existingCustomer = await findCustomerByEmail(body.customerEmail, baseUrl, ASAAS_API_KEY);
          if (existingCustomer) {
            customerId = existingCustomer.id;
            console.log("Using existing customer by email:", customerId);
          }
        }
      }

      if (!customerId) {
        const errorMessages = customerData.errors
          .map((e: { description: string }) => e.description)
          .join(", ");
        console.error("Asaas customer creation failed:", customerData.errors);

        return new Response(
          JSON.stringify({
            success: false,
            error: "Erro ao criar cliente",
            details: errorMessages,
          }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    if (!customerId) {
      throw new Error("Falha ao criar ou encontrar cliente no Asaas");
    }

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
      paymentPayload.creditCardHolderInfo = {
        ...body.creditCardHolderInfo,
        cpfCnpj: cpfCnpj,
        postalCode: body.creditCardHolderInfo.postalCode?.replace(/\D/g, ""),
        phone: body.creditCardHolderInfo.phone?.replace(/\D/g, ""),
      };
    }

    console.log("Creating payment with payload:", sanitizeForLog(paymentPayload));

    const paymentResponse = await fetch(`${baseUrl}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentData = await paymentResponse.json();
    console.log("Payment response:", sanitizeForLog(paymentData));

    if (paymentData.errors) {
      const errorMessages = paymentData.errors
        .map((e: { description: string }) => e.description)
        .join(", ");
      console.error("Asaas payment error:", paymentData.errors);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Erro ao processar pagamento",
          details: errorMessages,
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!paymentData.id) {
      console.error("Invalid payment response:", paymentData);
      return new Response(
        JSON.stringify({ success: false, error: "Resposta inválida do gateway de pagamento" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // If PIX, get the QR code
    let pixData = null;
    if (body.billingType === "PIX") {
      try {
        const pixResponse = await fetch(`${baseUrl}/payments/${paymentData.id}/pixQrCode`, {
          headers: {
            "access_token": ASAAS_API_KEY,
          },
        });
        pixData = await pixResponse.json();
        console.log("PIX QR Code generated:", pixData.success !== false);
      } catch (pixError) {
        console.error("Error generating PIX QR code:", pixError);
        // Continue without PIX QR code - user can still pay via invoice URL
      }
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
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno ao processar pagamento" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
