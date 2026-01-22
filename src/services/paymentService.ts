/**
 * Payment processing service - Asaas Only
 * Handles all payment types: PIX and Credit Card via Asaas
 */

import { supabase } from "@/integrations/supabase/client";

export interface PixPaymentParams {
  items: Array<{
    giftId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  customerData: {
    name: string;
    email?: string;
    phone: string;
    cpf: string;
  };
  returnUrl: string;
  completionUrl: string;
}

export interface CreditCardPaymentParams {
  item: {
    giftId: string;
    name: string;
    price: number;
    quantity: number;
  };
  customerData: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
    postalCode: string;
    addressNumber: string;
  };
  cardData: {
    holder: string;
    number: string;
    expiry: string;
    cvv: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  error?: string;
  paymentUrl?: string;
  paymentId?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  invoiceUrl?: string;
}

/**
 * Process PIX payment via Asaas
 * Consolidates all cart items into a single payment
 */
export const processPixPayment = async (
  params: PixPaymentParams
): Promise<PaymentResponse> => {
  // Calculate total value
  const totalValue = params.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Use first item name or generic description
  const description = params.items.length === 1
    ? params.items[0].name
    : `${params.items.length} presentes de casamento`;

  const { data, error } = await supabase.functions.invoke("asaas-payment", {
    body: {
      giftId: params.items[0].giftId, // Primary gift ID for reference
      giftName: description,
      value: totalValue,
      customerName: params.customerData.name,
      customerEmail: params.customerData.email || undefined,
      billingType: "PIX",
      creditCardHolderInfo: {
        name: params.customerData.name,
        email: params.customerData.email || `${params.customerData.phone.replace(/\D/g, "")}@guest.temp`,
        cpfCnpj: params.customerData.cpf.replace(/\D/g, ""),
        postalCode: "00000000",
        addressNumber: "0",
        phone: params.customerData.phone.replace(/\D/g, ""),
      },
    },
  });

  if (error) {
    console.error("PIX payment error:", error);
    throw new Error(error.message || "Erro ao processar pagamento PIX");
  }

  if (!data.success) {
    throw new Error(data.error || "Erro ao criar cobrança PIX");
  }

  return {
    success: true,
    paymentId: data.paymentId,
    paymentUrl: data.invoiceUrl,
    pixQrCode: data.pixQrCode,
    pixCopyPaste: data.pixCopyPaste,
    invoiceUrl: data.invoiceUrl,
  };
};

/**
 * Process Credit Card payment via Asaas
 */
export const processCreditCardPayment = async (
  params: CreditCardPaymentParams
): Promise<PaymentResponse> => {
  const [expiryMonth, expiryYear] = params.cardData.expiry.split("/");

  const { data, error } = await supabase.functions.invoke("asaas-payment", {
    body: {
      giftId: params.item.giftId,
      giftName: params.item.name,
      value: params.item.price * params.item.quantity,
      customerName: params.customerData.name,
      customerEmail: params.customerData.email,
      billingType: "CREDIT_CARD",
      creditCard: {
        holderName: params.cardData.holder,
        number: params.cardData.number.replace(/\s/g, ""),
        expiryMonth,
        expiryYear: expiryYear.length === 2 ? `20${expiryYear}` : expiryYear,
        ccv: params.cardData.cvv,
      },
      creditCardHolderInfo: {
        name: params.cardData.holder,
        email: params.customerData.email,
        cpfCnpj: params.customerData.cpf.replace(/\D/g, ""),
        postalCode: params.customerData.postalCode.replace(/\D/g, ""),
        addressNumber: params.customerData.addressNumber,
        phone: params.customerData.phone.replace(/\D/g, ""),
      },
    },
  });

  if (error) {
    console.error("Credit card payment error:", error);
    throw new Error(error.message || "Erro ao processar pagamento");
  }

  if (!data.success) {
    throw new Error(data.error || "Erro ao processar pagamento");
  }

  return {
    success: true,
    paymentId: data.paymentId,
    invoiceUrl: data.invoiceUrl,
  };
};
