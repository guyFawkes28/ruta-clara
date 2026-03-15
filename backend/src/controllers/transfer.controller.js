import Transfer from '../models/Transfer.model.js'

// Registrar traslado de activo
export const create_transfer = async (req, res) => {
  try {
    const { activo_id, zona_origen_id, zona_destino_id, motivo } = req.body

    if (!activo_id || !zona_origen_id || !zona_destino_id) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos'
      })
    }

    const transfer = await Transfer.createTransfer(
      parseInt(activo_id),
      parseInt(zona_origen_id),
      parseInt(zona_destino_id),
      motivo || 'Traslado de activo'
    )

    res.json({
      success: true,
      message: 'Traslado registrado correctamente',
      transfer
    })
  } catch (err) {
    console.error('[Transfer] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Obtener historial de un activo
export const get_transfer_history = async (req, res) => {
  try {
    const { activo_id } = req.params

    if (!activo_id) {
      return res.status(400).json({
        success: false,
        error: 'Falta activo_id'
      })
    }

    const history = await Transfer.getTransferHistory(parseInt(activo_id))

    res.json({
      success: true,
      total: history.length,
      historial: history
    })
  } catch (err) {
    console.error('[Transfer] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Obtener transferencias por zona
export const get_transfers_by_zone = async (req, res) => {
  try {
    const { zona_id } = req.query

    if (!zona_id) {
      return res.status(400).json({
        success: false,
        error: 'Falta zona_id'
      })
    }

    const transfers = await Transfer.getTransfersByZone(parseInt(zona_id))

    res.json({
      success: true,
      total: transfers.length,
      transferencias: transfers
    })
  } catch (err) {
    console.error('[Transfer] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Obtener totales de activos móviles
export const get_mobile_assets_by_zone = async (req, res) => {
  try {
    const { zona_id } = req.query

    if (!zona_id) {
      return res.status(400).json({
        success: false,
        error: 'Falta zona_id'
      })
    }

    const assets = await Transfer.getMobileAssetsByZone(parseInt(zona_id))

    res.json({
      success: true,
      activos_moviles: assets
    })
  } catch (err) {
    console.error('[Transfer] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export default {
  create_transfer,
  get_transfer_history,
  get_transfers_by_zone,
  get_mobile_assets_by_zone
}
