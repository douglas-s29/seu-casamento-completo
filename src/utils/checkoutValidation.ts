/**
 * Checkout form validation utilities
 */

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

export const validateCPF = (cpf: string): boolean => {
  // Remove non-digits
  const cleanCPF = cpf.replace(/\D/g, "");
  
  if (cleanCPF.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF[9])) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF[10])) return false;
  
  return true;
};

export const validateCheckoutForm = (data: CheckoutFormData): ValidationResult => {
  if (!data.name.trim() || data.name.trim().length < 3) {
    return { valid: false, error: "Nome completo deve ter pelo menos 3 caracteres" };
  }
  
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { valid: false, error: "E-mail inválido" };
  }
  
  const phoneDigits = data.phone.replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    return { valid: false, error: "Telefone inválido" };
  }
  
  const cpfDigits = data.cpf.replace(/\D/g, "");
  if (!validateCPF(cpfDigits)) {
    return { valid: false, error: "CPF inválido" };
  }
  
  if (data.paymentMethod === "CREDIT_CARD") {
    if (!data.cardNumber || !data.cardHolder || !data.cardExpiry || !data.cardCvv) {
      return { valid: false, error: "Preencha todos os campos do cartão" };
    }
    
    if (!data.postalCode || !data.addressNumber) {
      return { valid: false, error: "Preencha endereço completo" };
    }
  }
  
  return { valid: true };
};
