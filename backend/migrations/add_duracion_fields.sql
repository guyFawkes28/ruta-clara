-- Migración: Agregar campos de duración a ejecucion_tarea
-- Ejecutar esto en Supabase SQL Editor

-- Verificar si los campos ya existen, si no, crear ALTER TABLE
ALTER TABLE ejecucion_tarea
ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS duracion_segundos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS duracion_total_segundos INTEGER DEFAULT 0;

-- Crear índices para mejorar performance en queries
CREATE INDEX IF NOT EXISTS idx_ejecucion_tarea_duracion_total 
ON ejecucion_tarea(duracion_total_segundos);

CREATE INDEX IF NOT EXISTS idx_ejecucion_tarea_fecha_fin 
ON ejecucion_tarea(fecha_fin);
