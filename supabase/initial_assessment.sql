-- ============================================================================
-- SCHEMA NUEVO PARA EL TEST INICIAL DE NABI
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================================

-- Tabla principal donde se guarda el resultado completo del test inicial
-- (un registro por paciente; si vuelve a tomarlo se puede usar UPSERT por id).
CREATE TABLE IF NOT EXISTS public.initial_assessments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  patient_id uuid NOT NULL UNIQUE,

  -- Respuestas crudas (JSON con clave = número de pregunta 1..24, valor 0..3)
  answers jsonb NOT NULL,

  -- Puntajes por categoría (calculados al guardar)
  score_depresion       integer NOT NULL DEFAULT 0,
  score_ansiedad        integer NOT NULL DEFAULT 0,
  score_tdah            integer NOT NULL DEFAULT 0,
  score_toc             integer NOT NULL DEFAULT 0,
  score_tept            integer NOT NULL DEFAULT 0,
  score_bipolaridad     integer NOT NULL DEFAULT 0,
  score_tca             integer NOT NULL DEFAULT 0,
  score_duelo           integer NOT NULL DEFAULT 0,
  score_sueno           integer NOT NULL DEFAULT 0,

  -- Niveles textuales: bajo | leve | moderado | alto
  level_depresion       text,
  level_ansiedad        text,
  level_tdah            text,
  level_toc             text,
  level_tept            text,
  level_bipolaridad     text,
  level_tca             text,
  level_duelo           text,
  level_sueno           text,

  -- Área predominante (la de mayor puntaje normalizado) y perfil
  dominant_area         text,
  user_profile          text, -- "Perfil ansioso", "Perfil emocional", etc.

  -- Bandera crítica: pregunta 24 (riesgo) >= 1
  risk_flag             boolean NOT NULL DEFAULT false,

  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT initial_assessments_pkey PRIMARY KEY (id),
  CONSTRAINT initial_assessments_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_initial_assessments_patient
  ON public.initial_assessments (patient_id);

-- ============================================================================
-- COLUMNAS NUEVAS EN profiles
--   - assessment_completed: ya tomó el test inicial (controla redirección).
--   - suggested_route: ruta clínica sugerida por el test.
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assessment_completed boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suggested_route text;

-- ============================================================================
-- RLS (Row Level Security): cada paciente solo ve/escribe sus resultados
--                           y su psicólogo vinculado puede leerlos.
-- ============================================================================
ALTER TABLE public.initial_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pacientes leen su test"        ON public.initial_assessments;
DROP POLICY IF EXISTS "Pacientes guardan su test"    ON public.initial_assessments;
DROP POLICY IF EXISTS "Pacientes actualizan su test" ON public.initial_assessments;
DROP POLICY IF EXISTS "Psicologos leen test paciente" ON public.initial_assessments;

CREATE POLICY "Pacientes leen su test"
  ON public.initial_assessments
  FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Pacientes guardan su test"
  ON public.initial_assessments
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Pacientes actualizan su test"
  ON public.initial_assessments
  FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "Psicologos leen test paciente"
  ON public.initial_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = initial_assessments.patient_id
        AND p.psychologist_id = auth.uid()
    )
  );
