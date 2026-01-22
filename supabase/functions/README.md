# Edge Functions - Sistema de Pagamentos

Este documento descreve as Edge Functions implementadas para processar pagamentos de presentes de casamento.

## 📋 Visão Geral

O sistema suporta dois gateways de pagamento:
- **AbacatePay**: Para pagamentos via PIX
- **Asaas**: Para pagamentos via PIX e Cartão de Crédito

## 🔐 Segurança

Todas as Edge Functions implementam:

### CORS Restritivo
- Valida origem das requisições
- Produção: apenas domínio configurado
- Desenvolvimento: localhost:5173 e localhost:3000

### Headers de Segurança
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### Validação de Entrada
- Schemas Zod para validar payloads
- Validação de CPF
- Validação de cartão de crédito (Luhn)

### Sanitização de Logs
- Dados sensíveis removidos de logs
- Números de cartão, CPF, senhas são redactados

### Rate Limiting
- 10 requisições por minuto por IP
- Protege contra ataques de força bruta

### Webhook Signatures
- AbacatePay: validação HMAC SHA-256
- Asaas: validação por token

## 📦 AbacatePay (PIX)

### Endpoint: `/abacatepay-payment`

Cria uma cobrança PIX através da API do AbacatePay.

#### Request Body
```typescript
{
  products: Array<{
    externalId: string;    // UUID do presente
    name: string;
    description: string;
    quantity: number;
    price: number;         // Em centavos
  }>;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;   // 10-11 dígitos
  customerTaxId: string;   // CPF - 11 dígitos
  returnUrl: string;
  completionUrl: string;
}
```

#### Response
```typescript
{
  success: true,
  billingId: string,
  status: string,
  paymentUrl: string,
  amount: number
}
```

#### Recursos
- ✅ Retry automático com backoff exponencial (3 tentativas)
- ✅ Idempotência via `Idempotency-Key`
- ✅ Validação de estrutura de resposta
- ✅ Logging sanitizado

### Webhook: `/abacatepay-webhook`

Recebe notificações de mudanças de status de pagamento.

#### Headers Esperados
- `X-Abacate-Signature`: Assinatura HMAC do payload

#### Eventos Suportados
- `PAID` → confirmed
- `REFUNDED` → refunded
- `CANCELLED` / `EXPIRED` → cancelled

## 💳 Asaas (Cartão de Crédito)

### Endpoint: `/asaas-payment`

Processa pagamentos via PIX ou Cartão de Crédito.

#### Request Body
```typescript
{
  giftId: string;
  giftName: string;
  value: number;
  customerName: string;
  customerEmail?: string;
  billingType: "PIX" | "CREDIT_CARD";
  creditCard?: {
    holderName: string;
    number: string;         // 13-19 dígitos
    expiryMonth: string;    // 01-12
    expiryYear: string;     // YYYY
    ccv: string;            // 3-4 dígitos
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
```

#### Response
```typescript
{
  success: true,
  paymentId: string,
  status: string,
  billingType: string,
  value: number,
  invoiceUrl?: string,
  pixQrCode?: string,
  pixCopyPaste?: string
}
```

#### Recursos
- ✅ Validação de cartão com algoritmo de Luhn
- ✅ Busca de cliente existente por email
- ✅ Tratamento de erro detalhado
- ✅ Logging sanitizado de cartões

### Webhook: `/asaas-webhook`

Recebe notificações de eventos de pagamento.

#### Headers Esperados
- `asaas-access-token`: Token de autenticação

#### Eventos Suportados
- `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` → confirmed
- `PAYMENT_REFUNDED` → refunded
- `PAYMENT_DELETED` / `PAYMENT_OVERDUE` → cancelled

## 🔧 Configuração

### Variáveis de Ambiente Necessárias

```env
# APIs de Pagamento
ABACATEPAY_API_KEY=your_abacatepay_key
ASAAS_API_KEY=your_asaas_key

# Segurança
ENVIRONMENT=production                    # ou "development"
SITE_URL=https://seudominio.com          # URL do site em produção
ABACATEPAY_WEBHOOK_SECRET=your_secret    # Segredo para validar webhooks
ASAAS_WEBHOOK_TOKEN=your_token           # Token para validar webhooks

# Supabase (já configuradas)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Configuração dos Webhooks

#### AbacatePay
1. Acesse o dashboard do AbacatePay
2. Configure o webhook URL: `https://your-project.supabase.co/functions/v1/abacatepay-webhook`
3. Copie o secret e configure `ABACATEPAY_WEBHOOK_SECRET`

#### Asaas
1. Acesse o dashboard do Asaas
2. Configure o webhook URL: `https://your-project.supabase.co/functions/v1/asaas-webhook`
3. Gere um token e configure `ASAAS_WEBHOOK_TOKEN`
4. Configure o header `asaas-access-token` com o token

## 📊 Logging e Auditoria

### Tabela: `webhook_logs`
Registra todos os eventos de webhook recebidos:
- `gateway`: 'abacatepay' ou 'asaas'
- `event`: tipo do evento
- `payload`: payload completo (JSONB)
- `success`: se foi processado com sucesso
- `error`: mensagem de erro, se houver
- `received_at`: timestamp de recebimento

### Tabela: `payment_attempts`
Registra tentativas de pagamento (futura implementação):
- `gift_id`: presente relacionado
- `customer_name`: nome do cliente
- `amount`: valor
- `gateway`: gateway utilizado
- `status`: pending/success/failed
- `error_message`: detalhes do erro

## 🧪 Testando

### Ambiente de Desenvolvimento
```bash
# Iniciar Supabase local
supabase start

# Deploy das functions
supabase functions deploy abacatepay-payment
supabase functions deploy abacatepay-webhook
supabase functions deploy asaas-payment
supabase functions deploy asaas-webhook

# Ver logs
supabase functions logs abacatepay-payment --tail
```

### Sandbox
- AbacatePay: use chave de teste
- Asaas: use chave que não começa com `$aact_`

## 🐛 Troubleshooting

### Erro de CORS
- Verifique se `SITE_URL` está configurado corretamente
- Em desenvolvimento, use `http://localhost:5173`

### Webhook não recebe eventos
- Verifique URL do webhook no dashboard
- Confirme que secrets/tokens estão corretos
- Verifique logs: `supabase functions logs webhook-name`

### Erro de validação
- Certifique-se que CPF tem 11 dígitos
- Telefone deve ter 10-11 dígitos
- Número do cartão: 13-19 dígitos

## 📚 Documentação das APIs

- [AbacatePay Docs](https://docs.abacatepay.com)
- [Asaas Docs](https://docs.asaas.com)

## 🔄 Fluxo de Pagamento

### PIX (AbacatePay)
1. Frontend chama `/abacatepay-payment`
2. Função cria cobrança e retorna URL de pagamento
3. Usuário é redirecionado para página de pagamento
4. Após pagamento, AbacatePay notifica via webhook
5. Webhook atualiza status da compra no banco

### Cartão de Crédito (Asaas)
1. Frontend chama `/asaas-payment` com dados do cartão
2. Função cria/busca cliente e processa pagamento
3. Retorna resultado imediatamente
4. Webhooks notificam mudanças de status posteriores
5. Webhook atualiza status da compra no banco
