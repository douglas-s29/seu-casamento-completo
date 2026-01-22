/**
 * Data Sanitization for Logging
 * Removes sensitive information from objects before logging
 */

const SENSITIVE_FIELDS = [
  'creditCard', 'ccv', 'cvv', 'number', 'password', 
  'taxId', 'cpfCnpj', 'holderName', 'expiryMonth', 'expiryYear'
];

export const sanitizeForLog = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLog(item));
  }

  const sanitized: any = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_FIELDS.some(s => 
        lowerKey.includes(s.toLowerCase())
      );
      
      if (isSensitive) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitized[key] = sanitizeForLog(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }
  
  return sanitized;
};
