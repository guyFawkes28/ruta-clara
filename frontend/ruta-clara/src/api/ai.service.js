import axios from './axiosConfig.js'

export const ai_service = {
  // Mejorar clasificación del reporte con IA
  async improve_report(task_id) {
    const response = await axios.post('/ai/improve-report', {
      tarea_id: task_id
    })
    return response.data
  },

  // Mejorar descripción del reporte
  async improve_description(description, context = {}) {
    const response = await axios.post('/ai/improve-description', {
      descripcion: description,
      tipo_dano: context.damage_type || '',
      activo: context.asset || '',
      zona: context.zone || ''
    })
    return response.data
  },

  // Obtener orden de tareas optimizado
  async get_optimized_task_order(zone_id = null) {
    const params = zone_id ? { zona_id: zone_id } : {}
    const response = await axios.get('/ai/optimize-tasks', { params })
    return response.data.optimization || {}
  },

  // Sugerir compras con IA
  async suggest_purchases() {
    const response = await axios.get('/ai/suggest-purchases')
    return response.data.purchase_suggestions || {}
  }
}

export default ai_service
