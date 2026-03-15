import { supabase } from '../config/db.js'

export const TaskExecution = {
  // Crear registro de ejecución de tarea
  async create_execution(tareaId) {
    const { data, error } = await supabase
      .from('ejecucion_tarea')
      .insert({
        tarea_id: tareaId,
        check_sst: false
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Registrar SST (checklist) con foto
  async record_sst(tareaId, fotoSelfie) {
    // Primero intentar actualizar si existe
    const { data: updateData, error: updateError } = await supabase
      .from('ejecucion_tarea')
      .update({
        check_sst: true,
        foto_evidencia_sst: fotoSelfie,
        fecha_inicio: new Date().toISOString()
      })
      .eq('tarea_id', tareaId)
      .select()
      .single()
    
    // Si no existe, crear el registro
    if (updateError && updateError.code === 'PGRST116') {
      console.log('[TaskExecution] recordSST: creando nuevo registro para tarea', tareaId)
      const { data: createData, error: createError } = await supabase
        .from('ejecucion_tarea')
        .insert({
          tarea_id: tareaId,
          check_sst: true,
          foto_evidencia_sst: fotoSelfie,
          fecha_inicio: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) throw createError
      return createData
    }
    
    if (updateError) throw updateError
    return updateData
  },

  // Finalizar tarea con foto y duración
  async finish_task(tareaId, fotoDespues, duracionMinutos, duracionSegundos) {
    console.log(`[TaskExecution.finishTask] Guardando para tarea_id: ${tareaId}`)
    console.log(`[TaskExecution.finishTask] Duración recibida: ${duracionMinutos}m ${duracionSegundos}s`)
    console.log(`[TaskExecution.finishTask] timestamp actual: ${new Date().toISOString()}`)
    
    // Calcular duración total en segundos
    const duracionTotalSegundos = (duracionMinutos * 60) + duracionSegundos
    console.log(`[TaskExecution.finishTask] Duración total en segundos: ${duracionTotalSegundos}s`)
    
    const { data, error } = await supabase
      .from('ejecucion_tarea')
      .update({
        foto_despues: fotoDespues,
        fecha_fin: new Date().toISOString(),
        duracion_minutos: duracionMinutos || 0,
        duracion_segundos: duracionSegundos || 0,
        duracion_total_segundos: duracionTotalSegundos
      })
      .eq('tarea_id', tareaId)
      .select()
      .single()
    
    if (error) {
      console.error(`[TaskExecution.finishTask]  Error guardando fecha_fin:`, error)
      throw error
    }
    
    console.log(`[TaskExecution.finishTask]  Datos guardados exitosamente`)
    console.log(`[TaskExecution.finishTask] Registro actualizado:`, {
      tarea_id: data.tarea_id,
      duracion_minutos: data.duracion_minutos,
      duracion_segundos: data.duracion_segundos,
      duracion_total_segundos: data.duracion_total_segundos,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin
    })
    
    return {
      ...data,
      duracion_minutos: duracionMinutos,
      duracion_segundos: duracionSegundos
    }
  },

  // Obtener ejecución de tarea
  async get_execution(tareaId) {
    const { data, error } = await supabase
      .from('ejecucion_tarea')
      .select(`
        *,
        tareas!inner(id_tarea, tipo_dano, estado_tarea)
      `)
      .eq('tarea_id', tareaId)
      .single()
    
    if (error) throw error
    return data
  },

  // Obtener todas las ejecuciones (para análisis)
  async get_all_executions() {
    const { data, error } = await supabase
      .from('ejecucion_tarea')
      .select(`
        *,
        tareas!inner(id_tarea, tipo_dano, operador_id)
      `)
      .order('fecha_inicio', { ascending: false })
    
    if (error) {
      console.error('[TaskExecution.getAllExecutions]  Error en query:', error)
      throw error
    }
    
    console.log(`[TaskExecution.getAllExecutions]  Traídas ${data.length} ejecuciones`)
    if (data.length > 0) {
      console.log('[TaskExecution.getAllExecutions] Primeras 3 con sus fechas:')
      data.slice(0, 3).forEach((e, i) => {
        console.log(`  [${i}] ID: ${e.tarea_id}, Inicio: ${e.fecha_inicio}, Fin: ${e.fecha_fin}, SST: ${e.check_sst}`)
      })
    }
    
    return data
  },

  // Obtener duración promedio de tareas por tipo de daño
  async get_average_duration(tipoDano) {
    const { data, error } = await supabase
      .from('ejecucion_tarea')
      .select(`
        fecha_inicio,
        fecha_fin,
        tareas!inner(tipo_dano)
      `)
      .eq('tareas.tipo_dano', tipoDano)
      .not('fecha_fin', 'is', null)
    
    if (error) throw error

    const duraciones = data.map(e => {
      const ms = new Date(e.fecha_fin) - new Date(e.fecha_inicio)
      return Math.round(ms / (1000 * 60)) // en minutos
    })

    if (duraciones.length === 0) return null

    const promedio = duraciones.reduce((a, b) => a + b, 0) / duraciones.length
    return {
      promedio_minutos: Math.round(promedio),
      total_tareas: duraciones.length,
      minimo: Math.min(...duraciones),
      maximo: Math.max(...duraciones)
    }
  }
}

export default TaskExecution
