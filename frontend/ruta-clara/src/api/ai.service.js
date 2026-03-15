import axios from './axiosConfig.js'

export const aiService = {
  // Mejorar clasificación de reporte con IA
  async improveReport(tareaId) {
    const response = await axios.post('/ai/improve-report', {
      tarea_id: tareaId
    })
    return response.data
  },

  // Mejorar descripción de un reporte (corregir ortografía, hacerlo más detallado)
  async improveDescription(descripcion, contexto = {}) {
    const response = await axios.post('/ai/improve-description', {
      descripcion,
      tipo_dano: contexto.tipo_dano || '',
      activo: contexto.activo || '',
      zona: contexto.zona || ''
    })
    return response.data
  },

  // Obtener orden optimizado de tareas
  async getOptimizedTaskOrder(zonaId = null) {
    const params = zonaId ? { zona_id: zonaId } : {}
    const response = await axios.get('/ai/optimize-tasks', { params })
    return response.data.optimizacion || {}
  },

  // Sugerir compras basadas en IA
  async suggestPurchases() {
    const response = await axios.get('/ai/suggest-purchases')
    return response.data.sugerencias_compra || {}
  }
}

export default aiService
