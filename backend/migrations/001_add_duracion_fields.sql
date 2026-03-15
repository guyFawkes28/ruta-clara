-- Migración: Agregar campos de duración a ejecucion_tarea
-- Ejecutar esto en Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql
-- Basado en el schema actual de la tabla ejecucion_tarea

-- Agregar columnas de duración si no existen
ALTER TABLE public.ejecucion_tarea
ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS duracion_segundos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS duracion_total_segundos INTEGER DEFAULT 0;

-- Crear índices para mejorar performance en queries
CREATE INDEX IF NOT EXISTS idx_ejecucion_tarea_duracion_total 
ON public.ejecucion_tarea(duracion_total_segundos DESC);

CREATE INDEX IF NOT EXISTS idx_ejecucion_tarea_fecha_fin 
ON public.ejecucion_tarea(fecha_fin DESC);

-- Verificar que los campos fueron creados
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'ejecucion_tarea' AND column_name LIKE 'duracion%';
