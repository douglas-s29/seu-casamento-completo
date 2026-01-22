/**
 * Payment processing service
 * Handles communication with payment edge functions
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
  billingId?: string;
}

export const processPixPayment = async (
  params: PixPaymentParams
): Promise<PaymentResponse> => {
  const products = params.items.map((item) => ({
    externalId: item.giftId,
    name: item.name,
    description: `Presente de Casamento: ${item.name}`,
    quantity: item.quantity,
    price: Math.round(item.price * 100), // Convert to cents
  }));

  const { data, error } = await supabase.functions.invoke("abacatepay-payment", {
    body: {
      products,
      customerName: params.customerData.name,
      customerEmail: params.customerData.email || undefined,
      customerPhone: params.customerData.phone.replace(/\D/g, ""),
      customerTaxId: params.customerData.cpf.replace(/\D/g, ""),
      returnUrl: params.returnUrl,
      completionUrl: params.completionUrl,
    },
  });

  if (error) {
    console.error("PIX payment error:", error);
    throw error;
  }

  if (!data.success || !data.paymentUrl) {
    throw new Error(data.error || "Erro ao criar cobrança");
  }

  return {
    success: true,
    paymentUrl: data.paymentUrl,
    billingId: data.billingId,
  };
};

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
        expiryYear: `20${expiryYear}`,
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
    throw error;
  }

  if (!data.success) {
    throw new Error(data.error || "Erro ao processar pagamento");
  }

  return {
    success: true,
    paymentId: data.paymentId,
  };
};
