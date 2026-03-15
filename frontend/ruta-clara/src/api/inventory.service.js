import axios from './axiosConfig.js'

export const inventory_service = {
  // Obtener repuestos
  async get_spare_parts(category = null) {
    const params = category ? { categoria: category } : {}
    const response = await axios.get('/inventory/spare-parts', { params })
    return response.data.spare_parts || []
  },

  // Validar disponibilidad
  async check_availability(spare_part_id, quantity) {
    const response = await axios.post('/inventory/check-availability', {
      repuesto_id: spare_part_id,
      cantidad: quantity
    })
    return response.data
  },

  // Validar inicio de tarea
  async validate_task_start(task_id, required_spare_parts) {
    const response = await axios.post('/inventory/validate-task-start', {
      tarea_id: task_id,
      required_spare_parts: required_spare_parts
    })
    return response.data
  },

  // Descontar repuestos
  async deduct_spare_parts(task_id, spare_parts_used) {
    const response = await axios.post('/inventory/deduct', {
      tarea_id: task_id,
      repuestos_usados: spare_parts_used
    })
    return response.data
  },

  // Alertas de stock bajo
  async get_low_stock_alerts() {
    const response = await axios.get('/inventory/alerts/low-stock')
    return response.data.low_stock || []
  },

  // Agregar stock
  async add_stock(spare_part_id, quantity, reason) {
    const response = await axios.post('/inventory/add-stock', {
      repuesto_id: spare_part_id,
      cantidad: quantity,
      motivo: reason
    })
    return response.data
  },

  // Obtener tipos de repuesto
  async get_spare_part_types() {
    try {
      const response = await axios.get('/inventory/spare-part-types')
      return response.data.types || []
    } catch (error) {
      console.warn('[inventory_service] Error loading types:', error)
      return []
    }
  },

  // Obtener repuestos agrupados por tipo
  async get_spare_parts_grouped_by_type() {
    try {
      const response = await axios.get('/inventory/spare-parts/grouped')
      return response.data.grouped_by_type || {}
    } catch (error) {
      console.warn('[inventory_service] Error loading grouped spare parts:', error)
      return {}
    }
  }
}

export default inventory_service
