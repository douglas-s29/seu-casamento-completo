/**
 * Checkout form validation utilities with enhanced security
 */

import { z } from "zod";

export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  paymentMethod: string;
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  cardCvv?: string;
  postalCode?: string;
  addressNumber?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate CPF using mod 11 algorithm
 */
export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, "");

  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // First digit validation
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF[9])) return false;

  // Second digit validation
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF[10])) return false;

  return true;
};

/**
 * Luhn algorithm for credit card validation
 */
export const validateCardNumber = (cardNumber: string): boolean => {
  const cleanNumber = cardNumber.replace(/\s/g, "");
  
  if (!/^\d{13,19}$/.test(cleanNumber)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate card expiry date
 */
export const validateCardExpiry = (expiry: string): boolean => {
  const match = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1]);
  const year = parseInt(`20${match[2]}`);
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  if (year > currentYear + 20) return false;

  return true;
};

/**
 * Format CPF with mask
 */
export const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

/**
 * Format phone with mask
 */
export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

/**
 * Format card number with mask
 */
export const formatCardNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(" ") : digits;
};

/**
 * Format card expiry with mask
 */
export const formatCardExpiry = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

/**
 * Format CEP with mask
 */
export const formatCEP = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

// Zod schema for comprehensive validation
export const CheckoutSchema = z.object({
  name: z.string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras"),
  email: z.string()
    .email("E-mail inválido")
    .max(255, "E-mail muito longo")
    .optional()
    .or(z.literal("")),
  phone: z.string()
    .min(14, "Telefone inválido")
    .max(15, "Telefone inválido"),
  cpf: z.string()
    .length(14, "CPF deve ter 11 dígitos"),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD"]),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  postalCode: z.string().optional(),
  addressNumber: z.string().optional(),
});

export const validateCheckoutForm = (data: CheckoutFormData): ValidationResult => {
  // Basic name validation
  if (!data.name.trim() || data.name.trim().length < 3) {
    return { valid: false, error: "Nome completo deve ter pelo menos 3 caracteres" };
  }

  // Name should only contain letters
  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(data.name.trim())) {
    return { valid: false, error: "Nome deve conter apenas letras" };
  }

  // Email validation (optional for PIX, required for card)
  if (data.paymentMethod === "CREDIT_CARD" && !data.email?.trim()) {
    return { valid: false, error: "E-mail é obrigatório para cartão de crédito" };
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { valid: false, error: "E-mail inválido" };
  }

  // Phone validation
  const phoneDigits = data.phone.replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    return { valid: false, error: "Telefone inválido (DDD + número)" };
  }

  // CPF validation
  if (!validateCPF(data.cpf)) {
    return { valid: false, error: "CPF inválido" };
  }

  // Credit card specific validations
  if (data.paymentMethod === "CREDIT_CARD") {
    if (!data.cardNumber || !data.cardHolder || !data.cardExpiry || !data.cardCvv) {
      return { valid: false, error: "Preencha todos os dados do cartão" };
    }

    if (!validateCardNumber(data.cardNumber)) {
      return { valid: false, error: "Número do cartão inválido" };
    }

    if (data.cardHolder.trim().length < 3) {
      return { valid: false, error: "Nome no cartão deve ter pelo menos 3 caracteres" };
    }

    if (!validateCardExpiry(data.cardExpiry)) {
      return { valid: false, error: "Data de validade inválida" };
    }

    const cvvDigits = data.cardCvv.replace(/\D/g, "");
    if (cvvDigits.length < 3 || cvvDigits.length > 4) {
      return { valid: false, error: "CVV inválido" };
    }

    if (!data.postalCode || data.postalCode.replace(/\D/g, "").length !== 8) {
      return { valid: false, error: "CEP inválido" };
    }

    if (!data.addressNumber || data.addressNumber.trim().length === 0) {
      return { valid: false, error: "Número do endereço é obrigatório" };
    }
  }

  return { valid: true };
};
