import axios from './axiosConfig.js'

export const transfer_service = {
  // Registrar transferencia
  async create_transfer(asset_id, origin_zone_id, destination_zone_id, reason) {
    const response = await axios.post('/transfer/create', {
      activo_id: asset_id,
      zona_origen_id: origin_zone_id,
      zona_destino_id: destination_zone_id,
      motivo: reason
    })
    return response.data
  },

  // Historial del activo
  async get_transfer_history(asset_id) {
    const response = await axios.get(`/transfer/history/${asset_id}`)
    return response.data.history || []
  },

  // Transferencias por zona
  async get_transfers_by_zone(zone_id) {
    const response = await axios.get('/transfer/by-zone', {
      params: { zona_id: zone_id }
    })
    return response.data.transfers || []
  },

  // Activos móviles disponibles
  async get_mobile_assets_by_zone(zone_id) {
    const response = await axios.get('/transfer/mobile-assets', {
      params: { zona_id: zone_id }
    })
    return response.data.mobile_assets || {}
  }
}

export default transfer_service
