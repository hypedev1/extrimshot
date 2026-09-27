-- =============================================================================
-- Consolidated schema for a fresh Supabase project.
-- Built from every file in supabase/migrations (20251208164411 .. 20260605112430)
-- and reflects the FINAL state after all of them ran.
--
-- Run once in the Supabase SQL editor. Re-running is safe: every statement is
-- guarded with IF NOT EXISTS / DROP ... IF EXISTS / exception handlers.
--
-- Left out on purpose:
--   * 20260331155202 - deletes one specific user by UUID (data cleanup only).
--   * Data backfills of serial_number (no rows exist in a fresh DB).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- -----------------------------------------------------------------------------
-- 2. Types
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Tables (dependency order)
-- -----------------------------------------------------------------------------

-- profiles ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  full_name  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_roles -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    public.app_role NOT NULL,
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

-- orders -----------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.orders_serial_number_seq;

CREATE TABLE IF NOT EXISTS public.orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name         TEXT NOT NULL,
  phone                 TEXT NOT NULL,
  address               TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending',
  total_amount          INTEGER NOT NULL DEFAULT 1250,
  package_type          TEXT NOT NULL DEFAULT 'regular',
  pathao_city_id        INTEGER,
  pathao_zone_id        INTEGER,
  pathao_area_id        INTEGER,
  pathao_consignment_id TEXT,
  notes                 TEXT,
  serial_number         BIGINT NOT NULL DEFAULT nextval('public.orders_serial_number_seq'),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER SEQUENCE public.orders_serial_number_seq OWNED BY public.orders.serial_number;

COMMENT ON COLUMN public.orders.package_type IS
  'Package type: regular (90g/15 days/1250tk) or permanent (180g/30 days/1950tk)';

-- incomplete_orders ------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.incomplete_orders_serial_number_seq;

CREATE TABLE IF NOT EXISTS public.incomplete_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         TEXT NOT NULL,
  customer_name TEXT,
  address       TEXT,
  serial_number BIGINT NOT NULL DEFAULT nextval('public.incomplete_orders_serial_number_seq'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER SEQUENCE public.incomplete_orders_serial_number_seq OWNED BY public.incomplete_orders.serial_number;

-- order_fingerprints -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_fingerprints (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint       TEXT NOT NULL,
  ip_address        TEXT,
  phone             TEXT NOT NULL,
  user_agent        TEXT,
  screen_resolution TEXT,
  timezone          TEXT,
  language          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- blocked_order_attempts -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocked_order_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT,
  phone         TEXT NOT NULL,
  address       TEXT,
  fingerprint   TEXT,
  ip_address    TEXT,
  block_reason  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- blocked_phone_numbers --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocked_phone_numbers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        TEXT NOT NULL UNIQUE,
  reason       TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  blocked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  unblocked_at TIMESTAMPTZ,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- blocked_phone_audit_log ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocked_phone_audit_log (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone              TEXT NOT NULL,
  action             TEXT NOT NULL,
  reason             TEXT,
  performed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by_email TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. Functions (after tables, because SQL-language bodies are validated)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.make_admin(user_email text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Public helper to check whether a phone is currently blocked.
-- SECURITY DEFINER so unauthenticated visitors can check without exposing the table.
CREATE OR REPLACE FUNCTION public.is_phone_blocked(_phone TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_phone_numbers
    WHERE phone = _phone AND is_active = true
  );
$$;

-- make_admin must never be callable from the client API.
REVOKE EXECUTE ON FUNCTION public.make_admin(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_phone_blocked(TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. Triggers
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_incomplete_orders_updated_at ON public.incomplete_orders;
CREATE TRIGGER update_incomplete_orders_updated_at
  BEFORE UPDATE ON public.incomplete_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_blocked_phone_numbers_updated_at ON public.blocked_phone_numbers;
CREATE TRIGGER trg_blocked_phone_numbers_updated_at
  BEFORE UPDATE ON public.blocked_phone_numbers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Creates a profiles row for each new auth user. The original pg_dump only
-- covered the public schema, so this auth.users trigger was missing from the
-- migrations even though handle_new_user() existed.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 6. Indexes
-- -----------------------------------------------------------------------------
-- orders
CREATE UNIQUE INDEX IF NOT EXISTS orders_serial_number_idx ON public.orders (serial_number);
CREATE INDEX IF NOT EXISTS idx_orders_pathao_consignment ON public.orders (pathao_consignment_id)
  WHERE pathao_consignment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_customer_name_trgm ON public.orders USING gin (lower(customer_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_phone_trgm ON public.orders USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_address_trgm ON public.orders USING gin (lower(address) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

-- incomplete_orders
CREATE UNIQUE INDEX IF NOT EXISTS idx_incomplete_orders_phone ON public.incomplete_orders (phone);
CREATE UNIQUE INDEX IF NOT EXISTS incomplete_orders_serial_number_key ON public.incomplete_orders (serial_number);
CREATE INDEX IF NOT EXISTS idx_incomplete_orders_customer_name_trgm ON public.incomplete_orders USING gin (lower(customer_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_incomplete_orders_phone_trgm ON public.incomplete_orders USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_incomplete_orders_address_trgm ON public.incomplete_orders USING gin (lower(address) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_incomplete_orders_created_at ON public.incomplete_orders (created_at DESC);

-- order_fingerprints
CREATE INDEX IF NOT EXISTS idx_order_fingerprints_fingerprint ON public.order_fingerprints (fingerprint);
CREATE INDEX IF NOT EXISTS idx_order_fingerprints_phone ON public.order_fingerprints (phone);
CREATE INDEX IF NOT EXISTS idx_order_fingerprints_ip ON public.order_fingerprints (ip_address);
CREATE INDEX IF NOT EXISTS idx_order_fingerprints_created ON public.order_fingerprints (created_at);

-- blocked_phone_numbers / audit log
CREATE INDEX IF NOT EXISTS idx_blocked_phone_numbers_phone ON public.blocked_phone_numbers (phone);
CREATE INDEX IF NOT EXISTS idx_blocked_phone_numbers_active ON public.blocked_phone_numbers (is_active);
CREATE INDEX IF NOT EXISTS idx_blocked_phone_audit_phone ON public.blocked_phone_audit_log (phone);
CREATE INDEX IF NOT EXISTS idx_blocked_phone_audit_created_at ON public.blocked_phone_audit_log (created_at DESC);

-- -----------------------------------------------------------------------------
-- 7. Grants
-- -----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_phone_numbers TO authenticated;
GRANT ALL ON public.blocked_phone_numbers TO service_role;
GRANT SELECT, INSERT ON public.blocked_phone_audit_log TO authenticated;
GRANT ALL ON public.blocked_phone_audit_log TO service_role;

-- -----------------------------------------------------------------------------
-- 8. Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomplete_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_fingerprints      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_order_attempts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_phone_numbers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_phone_audit_log ENABLE ROW LEVEL SECURITY;

-- profiles ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles -------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- orders -----------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view their own order after creation" ON public.orders;
CREATE POLICY "Anyone can view their own order after creation" ON public.orders
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- incomplete_orders ------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can create incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Anyone can create incomplete orders" ON public.incomplete_orders
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Anyone can update incomplete orders" ON public.incomplete_orders
  FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Anyone can delete incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Anyone can delete incomplete orders" ON public.incomplete_orders
  FOR DELETE TO public USING (true);

DROP POLICY IF EXISTS "Anyone can view their incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Anyone can view their incomplete orders" ON public.incomplete_orders
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can view incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Admins can view incomplete orders" ON public.incomplete_orders
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- order_fingerprints -----------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can create fingerprints" ON public.order_fingerprints;
CREATE POLICY "Anyone can create fingerprints" ON public.order_fingerprints
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view fingerprints" ON public.order_fingerprints;
CREATE POLICY "Anyone can view fingerprints" ON public.order_fingerprints
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can delete fingerprints" ON public.order_fingerprints;
CREATE POLICY "Admins can delete fingerprints" ON public.order_fingerprints
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- blocked_order_attempts -------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can create blocked attempts" ON public.blocked_order_attempts;
CREATE POLICY "Anyone can create blocked attempts" ON public.blocked_order_attempts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view blocked attempts" ON public.blocked_order_attempts;
CREATE POLICY "Admins can view blocked attempts" ON public.blocked_order_attempts
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete blocked attempts" ON public.blocked_order_attempts;
CREATE POLICY "Admins can delete blocked attempts" ON public.blocked_order_attempts
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- blocked_phone_numbers --------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view blocked numbers" ON public.blocked_phone_numbers;
CREATE POLICY "Admins can view blocked numbers" ON public.blocked_phone_numbers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert blocked numbers" ON public.blocked_phone_numbers;
CREATE POLICY "Admins can insert blocked numbers" ON public.blocked_phone_numbers
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update blocked numbers" ON public.blocked_phone_numbers;
CREATE POLICY "Admins can update blocked numbers" ON public.blocked_phone_numbers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete blocked numbers" ON public.blocked_phone_numbers;
CREATE POLICY "Admins can delete blocked numbers" ON public.blocked_phone_numbers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- blocked_phone_audit_log ------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view audit log" ON public.blocked_phone_audit_log;
CREATE POLICY "Admins can view audit log" ON public.blocked_phone_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert audit log" ON public.blocked_phone_audit_log;
CREATE POLICY "Admins can insert audit log" ON public.blocked_phone_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- 9. Realtime
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.incomplete_orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 10. Seed admin users
-- IDs match the old Lovable project, so imported rows that reference them
-- (blocked_phone_audit_log.performed_by, blocked_phone_numbers.created_by)
-- satisfy their foreign keys. profiles rows come from on_auth_user_created.
-- Everyone shares one temporary password; change it after first sign-in.
-- -----------------------------------------------------------------------------
WITH seed(id, email, created_at, confirmed_at) AS (
  VALUES
    ('525dd862-49d7-4f6e-8bfd-cee3d90aee4f'::uuid, 'admin@example.com',
     '2026-05-15T18:04:20.686014Z'::timestamptz, '2026-05-15T18:04:20.757784Z'::timestamptz),
    ('1eed2001-9d9b-41af-b0b2-813decce9bdc'::uuid, 'gazihypeskills@gmail.com',
     '2026-04-02T13:13:05.543972Z'::timestamptz, '2026-04-02T13:13:05.588409Z'::timestamptz),
    ('6683ef43-2a17-41ca-8eb8-628352fd03f3'::uuid, 'admin@thehypecorporation.com',
     '2026-03-31T15:48:22.68053Z'::timestamptz,  '2026-03-31T15:48:22.703057Z'::timestamptz)
)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
  extensions.crypt('admin@2026', extensions.gen_salt('bf')),
  confirmed_at, '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
  created_at, now(),
  -- GoTrue fails to scan NULL token columns, so they must be empty strings.
  '', '', '', ''
FROM seed
ON CONFLICT (id) DO NOTHING;

-- Password login needs a matching email identity per user.
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
SELECT u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', u.created_at, now()
FROM auth.users u
WHERE u.id IN ('525dd862-49d7-4f6e-8bfd-cee3d90aee4f',
               '1eed2001-9d9b-41af-b0b2-813decce9bdc',
               '6683ef43-2a17-41ca-8eb8-628352fd03f3')
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = u.id AND i.provider = 'email'
  );

SELECT public.make_admin('admin@example.com');
SELECT public.make_admin('gazihypeskills@gmail.com');
SELECT public.make_admin('admin@thehypecorporation.com');

COMMIT;

-- -----------------------------------------------------------------------------
-- Verify: expect 3 rows, each with has_profile = true and role = admin.
-- -----------------------------------------------------------------------------
SELECT u.id, u.email, p.id IS NOT NULL AS has_profile, r.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id;

-- -----------------------------------------------------------------------------
-- After importing old orders / incomplete_orders, move the serial sequences
-- past the imported values or new inserts collide on serial_number:
--   SELECT setval('public.orders_serial_number_seq',
--                 COALESCE((SELECT MAX(serial_number) FROM public.orders), 0) + 1, false);
--   SELECT setval('public.incomplete_orders_serial_number_seq',
--                 COALESCE((SELECT MAX(serial_number) FROM public.incomplete_orders), 0) + 1, false);
-- -----------------------------------------------------------------------------
