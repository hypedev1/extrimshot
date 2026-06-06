
-- Blocklist table
CREATE TABLE public.blocked_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unblocked_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_phone_numbers TO authenticated;
GRANT ALL ON public.blocked_phone_numbers TO service_role;

ALTER TABLE public.blocked_phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view blocked numbers"
  ON public.blocked_phone_numbers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert blocked numbers"
  ON public.blocked_phone_numbers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blocked numbers"
  ON public.blocked_phone_numbers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blocked numbers"
  ON public.blocked_phone_numbers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_blocked_phone_numbers_phone ON public.blocked_phone_numbers(phone);
CREATE INDEX idx_blocked_phone_numbers_active ON public.blocked_phone_numbers(is_active);

CREATE TRIGGER trg_blocked_phone_numbers_updated_at
  BEFORE UPDATE ON public.blocked_phone_numbers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit log
CREATE TABLE public.blocked_phone_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.blocked_phone_audit_log TO authenticated;
GRANT ALL ON public.blocked_phone_audit_log TO service_role;

ALTER TABLE public.blocked_phone_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.blocked_phone_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit log"
  ON public.blocked_phone_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_blocked_phone_audit_phone ON public.blocked_phone_audit_log(phone);
CREATE INDEX idx_blocked_phone_audit_created_at ON public.blocked_phone_audit_log(created_at DESC);

-- Public helper to check whether a phone is currently blocked.
-- SECURITY DEFINER so unauthenticated visitors can check without exposing the table.
CREATE OR REPLACE FUNCTION public.is_phone_blocked(_phone TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_phone_numbers
    WHERE phone = _phone AND is_active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_phone_blocked(TEXT) TO anon, authenticated;
