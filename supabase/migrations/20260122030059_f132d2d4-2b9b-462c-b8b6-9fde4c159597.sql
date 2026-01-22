-- =============================================
-- SECURITY HARDENING MIGRATION
-- Corrigir políticas RLS permissivas demais
-- =============================================

-- 1. GIFT_PURCHASES - Remover acesso público de leitura (dados sensíveis)
DROP POLICY IF EXISTS "Anyone can view gift purchases" ON public.gift_purchases;

-- Apenas admins podem ver compras
CREATE POLICY "Only admins can view gift purchases"
  ON public.gift_purchases
  FOR SELECT
  USING (is_admin(auth.uid()));

-- 2. GUESTS - Corrigir UPDATE permissivo demais
DROP POLICY IF EXISTS "Guests can update their own RSVP by invitation code" ON public.guests;

-- Convidados só podem atualizar campos específicos de RSVP (não qualquer campo)
-- Como RLS não controla colunas, precisamos de trigger para isso
-- Por ora, removemos a política permissiva para que apenas admins atualizem via painel

-- 3. GUEST_COMPANIONS - Manter INSERT público apenas
-- Política atual ok para inserção pública

-- 4. GIFTS - Remover UPDATE público (deve ser via webhook apenas)
DROP POLICY IF EXISTS "Anyone can update gift to mark as purchased" ON public.gifts;

-- 5. MESSAGES - INSERT público mas com rate limiting será controlado no app
-- Política atual ok