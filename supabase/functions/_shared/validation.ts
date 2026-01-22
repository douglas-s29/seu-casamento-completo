/**
 * Input Validation Schemas using Zod
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const PaymentRequestSchema = z.object({
  products: z.array(z.object({
    externalId: z.string().uuid(),
    name: z.string().min(1).max(200),
    description: z.string().max(500),
    quantity: z.number().int().positive().max(100),
    price: z.number().int().positive(),
  })),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().min(1), // Accept any format, will be cleaned by function
  customerTaxId: z.string().min(1), // Accept any format, will be cleaned by function
  returnUrl: z.string().url(),
  completionUrl: z.string().url(),
});

export const CreditCardSchema = z.object({
  holderName: z.string().min(3).max(100),
  number: z.string().regex(/^\d{13,19}$/),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/),
  expiryYear: z.string().regex(/^20\d{2}$/),
  ccv: z.string().regex(/^\d{3,4}$/),
});

export const AsaasPaymentRequestSchema = z.object({
  giftId: z.string().uuid(),
  giftName: z.string().min(1).max(200),
  value: z.number().positive(),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email().optional(),
  billingType: z.enum(["PIX", "CREDIT_CARD"]),
  creditCard: CreditCardSchema.optional(),
  creditCardHolderInfo: z.object({
    name: z.string().min(3).max(100),
    email: z.string().email(),
    cpfCnpj: z.string().min(1), // Accept any format, will be cleaned by function
    postalCode: z.string().min(1), // Accept any format, will be cleaned by function
    addressNumber: z.string().min(1).max(10),
    phone: z.string().min(1), // Accept any format, will be cleaned by function
  }).optional(),
});
