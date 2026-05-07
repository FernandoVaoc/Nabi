-- =============================================================================
-- Tabla para códigos de verificación de correo durante el registro manual.
-- - El código expira a los 2 minutos (se valida en el endpoint).
-- - Se accede únicamente con el SERVICE_ROLE_KEY desde las API routes,
--   por lo que NO necesita políticas RLS para clientes.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.email_verification_codes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL,
  code        TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INT         NOT NULL DEFAULT 0,
  used        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Búsqueda rápida por correo (siempre filtramos por email + used + expires_at)
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email
  ON public.email_verification_codes (email);

-- Habilitamos RLS y NO creamos políticas: así sólo el service role
-- (que omite RLS) puede leer/escribir esta tabla. Los clientes no podrán tocarla.
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;
