import axios from './axiosConfig.js'

export const executionService = {
  // Inicializar ejecución de tarea
  async initializeExecution(tareaId) {
    const response = await axios.post('/execution/init', {
      tarea_id: tareaId
    })
    return response.data
  },

  // Registrar protocolo SST
  async registerSST(tareaId, fotoSelfie, checklist) {
    const body = {
      tarea_id: tareaId,
      foto_selfie: fotoSelfie,
      checklist
    }
    
    console.log('[ExecutionService] registerSST enviando:', JSON.stringify(body, null, 2))
    
    try {
      const response = await axios.post('/execution/register-sst', body)
      console.log('[ExecutionService] registerSST respuesta:', response.data)
      return response.data
    } catch (error) {
      console.error('[ExecutionService] registerSST error:', error.response?.data || error.message)
      throw error
    }
  },

  // Finalizar tarea
  async finishTask(tareaId, fotoDespues, repuestosUsados) {
    const body = {
      tarea_id: tareaId,
      foto_despues: fotoDespues,
      repuestos_usados: repuestosUsados
    }
    
    console.log('[ExecutionService] finishTask enviando:', JSON.stringify(body, null, 2))
    
    try {
      const response = await axios.post('/execution/finish', body)
      console.log('[ExecutionService] finishTask respuesta:', response.data)
      return response.data
    } catch (error) {
      console.error('[ExecutionService] finishTask error:', error.response?.data || error.message)
      throw error
    }
  },

  // Obtener duración estimada
  async getEstimatedDuration(tipoDano) {
    const response = await axios.get('/execution/estimate/duration', {
      params: { tipo_dano: tipoDano }
    })
    return response.data.estimada || {}
  },

  // Obtener métricas de performance
  async getPerformanceMetrics() {
    const response = await axios.get('/execution/metrics/performance')
    return response.data.metricas || {}
  }
}

export default executionService
