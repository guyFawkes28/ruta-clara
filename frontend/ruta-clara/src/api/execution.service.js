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
    const response = await axios.post('/execution/register-sst', {
      tarea_id: tareaId,
      foto_selfie: fotoSelfie,
      checklist
    })
    return response.data
  },

  // Finalizar tarea
  async finishTask(tareaId, fotoDespues, repuestosUsados) {
    const response = await axios.post('/execution/finish', {
      tarea_id: tareaId,
      foto_despues: fotoDespues,
      repuestos_usados: repuestosUsados
    })
    return response.data
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
