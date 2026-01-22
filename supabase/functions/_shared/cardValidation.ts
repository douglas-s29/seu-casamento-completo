/**
 * Credit Card Validation
 * Implements Luhn algorithm and basic card validation
 */

export interface CreditCardValidation {
  valid: boolean;
  error?: string;
}

const luhnCheck = (cardNumber: string): boolean => {
  let sum = 0;
  let isEven = false;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

export const validateCreditCard = (card: {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}): CreditCardValidation => {
  if (!card.holderName || card.holderName.length < 3) {
    return { valid: false, error: "Nome do titular inválido" };
  }
  
  const cardNumber = card.number.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(cardNumber)) {
    return { valid: false, error: "Número de cartão inválido" };
  }
  
  if (!luhnCheck(cardNumber)) {
    return { valid: false, error: "Número de cartão inválido (falha Luhn)" };
  }
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const expiryYear = parseInt(card.expiryYear);
  const expiryMonth = parseInt(card.expiryMonth);
  
  if (expiryYear < currentYear || 
      (expiryYear === currentYear && expiryMonth < currentMonth)) {
    return { valid: false, error: "Cartão expirado" };
  }
  
  if (!/^\d{3,4}$/.test(card.ccv)) {
    return { valid: false, error: "CVV inválido" };
  }
  
  return { valid: true };
};
