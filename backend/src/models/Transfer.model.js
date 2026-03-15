import { supabase } from '../config/db.js'

export const Transfer = {
  // Registrar traslado de activo móvil
  async createTransfer(activoId, zonaOrigenId, zonaDestinoId, motivo) {
    const { data, error } = await supabase
      .from('historial_movimientos_activos')
      .insert({
        activo_id: activoId,
        zona_origen_id: zonaOrigenId,
        zona_destino_id: zonaDestinoId,
        motivo
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Actualizar ubicación del activo
    await supabase
      .from('activos')
      .update({ zona_id: zonaDestinoId })
      .eq('id_activo', activoId)

    return data
  },

  // Obtener historial de transferencias
  async getTransferHistory(activoId) {
    const { data, error } = await supabase
      .from('historial_movimientos_activos')
      .select(`
        *,
        zonas_origen:zona_origen_id(nombre, piso),
        zonas_destino:zona_destino_id(nombre, piso)
      `)
      .eq('activo_id', activoId)
      .order('fecha_movimiento', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Obtener transferencias por zona
  async getTransfersByZone(zonaId, limit = 50) {
    const { data, error } = await supabase
      .from('historial_movimientos_activos')
      .select(`
        *,
        activos(etiqueta, tipos_activo(nombre)),
        zonas_origen:zona_origen_id(nombre),
        zonas_destino:zona_destino_id(nombre)
      `)
      .or(`zona_origen_id.eq.${zonaId},zona_destino_id.eq.${zonaId}`)
      .order('fecha_movimiento', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  // Obtener totales de activos móviles por zona
  async getMobileAssetsByZone(zonaId) {
    const { data, error } = await supabase
      .from('activos')
      .select('es_movil, tipos_activo(nombre)')
      .eq('zona_id', zonaId)
      .eq('es_movil', true)
    
    if (error) throw error

    // Contar por tipo
    const conteo = {}
    data.forEach(a => {
      const tipo = a.tipos_activo?.nombre || 'Otro'
      conteo[tipo] = (conteo[tipo] || 0) + 1
    })

    return {
      total: data.length,
      por_tipo: conteo
    }
  }
}

export default Transfer
