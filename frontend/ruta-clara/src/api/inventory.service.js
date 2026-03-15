import axios from './axiosConfig.js'

export const inventoryService = {
  // Obtener repuestos
  async getRepuestos(categoria = null) {
    const params = categoria ? { categoria } : {}
    const response = await axios.get('/inventory/repuestos', { params })
    return response.data.repuestos || []
  },

  // Verificar disponibilidad
  async checkAvailability(repuestoId, cantidad) {
    const response = await axios.post('/inventory/check-availability', {
      repuesto_id: repuestoId,
      cantidad
    })
    return response.data
  },

  // Validar inicio de tarea (Hard-Lock)
  async validateTaskStart(tareaId, repuestosRequeridos) {
    const response = await axios.post('/inventory/validate-task-start', {
      tarea_id: tareaId,
      repuestos_requeridos: repuestosRequeridos
    })
    return response.data
  },

  // Descontar repuestos
  async descontarRepuestos(tareaId, repuestosUsados) {
    const response = await axios.post('/inventory/descontar', {
      tarea_id: tareaId,
      repuestos_usados: repuestosUsados
    })
    return response.data
  },

  // Alertas de stock bajo
  async getLowStockAlerts() {
    const response = await axios.get('/inventory/alerts/low-stock')
    return response.data.repuestos_bajo_stock || []
  },

  // Agregar stock
  async agregarStock(repuestoId, cantidad, motivo) {
    const response = await axios.post('/inventory/add-stock', {
      repuesto_id: repuestoId,
      cantidad,
      motivo
    })
    return response.data
  }
}

export default inventoryService
