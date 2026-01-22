-- Create webhook_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL CHECK (gateway IN ('abacatepay', 'asaas')),
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_webhook_logs_gateway ON public.webhook_logs(gateway);
CREATE INDEX idx_webhook_logs_received_at ON public.webhook_logs(received_at DESC);
CREATE INDEX idx_webhook_logs_success ON public.webhook_logs(success);

-- Create payment_attempts table for tracking payment attempts
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL REFERENCES public.gifts(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  gateway TEXT NOT NULL CHECK (gateway IN ('abacatepay', 'asaas')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_attempts_gift ON public.payment_attempts(gift_id);
CREATE INDEX idx_payment_attempts_status ON public.payment_attempts(status);
CREATE INDEX idx_payment_attempts_created_at ON public.payment_attempts(created_at DESC);

COMMENT ON TABLE public.webhook_logs IS 'Audit trail for webhook events from payment gateways';
COMMENT ON TABLE public.payment_attempts IS 'Log of all payment attempts for tracking and debugging';
