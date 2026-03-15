import axios from './axiosConfig.js'

export const ai_service = {
  // Improve report classification with AI
  async improve_report(task_id) {
    const response = await axios.post('/ai/improve-report', {
      tarea_id: task_id
    })
    return response.data
  },

  // Improve description of a report (fix spelling, make it more detailed)
  async improve_description(description, context = {}) {
    const response = await axios.post('/ai/improve-description', {
      descripcion: description,
      tipo_dano: context.damage_type || '',
      activo: context.asset || '',
      zona: context.zone || ''
    })
    return response.data
  },

  // Get optimized task order
  async get_optimized_task_order(zone_id = null) {
    const params = zone_id ? { zona_id: zone_id } : {}
    const response = await axios.get('/ai/optimize-tasks', { params })
    return response.data.optimization || {}
  },

  // Suggest purchases based on AI
  async suggest_purchases() {
    const response = await axios.get('/ai/suggest-purchases')
    return response.data.purchase_suggestions || {}
  }
}

export default ai_service
