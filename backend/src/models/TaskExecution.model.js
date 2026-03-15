import { supabase } from '../config/db.js'

export const TaskExecution = {
  // Crear registro de ejecución de tarea
  async createExecution(tareaId) {
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
  async recordSST(tareaId, fotoSelfie) {
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

  // Finalizar tarea con foto
  async finishTask(tareaId, fotoDespues) {
    const { data, error } = await supabase
      .from('ejecucion_tarea')
      .update({
        foto_despues: fotoDespues,
        fecha_fin: new Date().toISOString()
      })
      .eq('tarea_id', tareaId)
      .select()
      .single()
    
    if (error) throw error
    
    // Calcular duración
    const duracionMs = new Date(data.fecha_fin) - new Date(data.fecha_inicio)
    const duracionMinutos = Math.round(duracionMs / (1000 * 60))

    return {
      ...data,
      duracion_minutos: duracionMinutos
    }
  },

  // Obtener ejecución de tarea
  async getExecution(tareaId) {
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
  async getAllExecutions() {
    const { data, error } = await supabase
      .from('ejecucion_tarea')
      .select(`
        *,
        tareas!inner(id_tarea, tipo_dano, operador_id)
      `)
      .order('fecha_inicio', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Obtener duración promedio de tareas por tipo de daño
  async getAverageDuration(tipoDano) {
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
