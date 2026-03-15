import axios from './axiosConfig.js'

export const transferService = {
  // Registrar traslado
  async createTransfer(activoId, zonaOrigenId, zonaDestinoId, motivo) {
    const response = await axios.post('/transfer/create', {
      activo_id: activoId,
      zona_origen_id: zonaOrigenId,
      zona_destino_id: zonaDestinoId,
      motivo
    })
    return response.data
  },

  // Historial de activo
  async getTransferHistory(activoId) {
    const response = await axios.get(`/transfer/history/${activoId}`)
    return response.data.historial || []
  },

  // Traslados por zona
  async getTransfersByZone(zonaId) {
    const response = await axios.get('/transfer/by-zone', {
      params: { zona_id: zonaId }
    })
    return response.data.transferencias || []
  },

  // Activos móviles disponibles
  async getMobileAssetsByZone(zonaId) {
    const response = await axios.get('/transfer/mobile-assets', {
      params: { zona_id: zonaId }
    })
    return response.data.activos_moviles || {}
  }
}

export default transferService
