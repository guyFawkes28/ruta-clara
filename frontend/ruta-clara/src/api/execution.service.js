import axios from './axiosConfig.js'

export const execution_service = {
  // Iniciar ejecución de tarea
  async initialize_execution(task_id) {
    const response = await axios.post('/execution/init', {
      tarea_id: task_id
    })
    return response.data
  },

  // Registrar protocolo SST
  async register_sst(task_id, selfie_photo, checklist) {
    const body = {
      tarea_id: task_id,
      foto_selfie: selfie_photo,
      checklist
    }
    
    console.log('[ExecService] register_sst sending:', JSON.stringify(body, null, 2))
    
    try {
      const response = await axios.post('/execution/register-sst', body)
      console.log('[ExecService] register_sst response:', response.data)
      return response.data
    } catch (error) {
      console.error('[ExecService] register_sst error:', error.response?.data || error.message)
      throw error
    }
  },

  // Finalizar tarea
  async finish_task(task_id, after_photo, spare_parts_used, duration = {}) {
    const body = {
      tarea_id: task_id,
      foto_despues: after_photo,
      repuestos_usados: spare_parts_used,
      duracion_minutos: duration.duration_minutes || 0,
      duracion_segundos: duration.duration_seconds || 0
    }
    
    console.log('[ExecService] finish_task sending:', JSON.stringify(body, null, 2))
    
    try {
      const response = await axios.post('/execution/finish', body)
      console.log('[ExecService] finish_task response:', response.data)
      return response.data
    } catch (error) {
      console.error('[ExecService] finish_task error:', error.response?.data || error.message)
      throw error
    }
  },

  // Obtener duración estimada
  async get_estimated_duration(damage_type) {
    const response = await axios.get('/execution/estimate/duration', {
      params: { tipo_dano: damage_type }
    })
    return response.data.estimated || {}
  },

  // Obtener métricas de desempeño
  async get_performance_metrics() {
    const response = await axios.get('/execution/metrics/performance')
    return response.data.metrics || {}
  }
}

export default execution_service
