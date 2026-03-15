import { supabase } from '../config/db.js'

export const Inventory = {
  // Obtener todos los repuestos
  async getAll() {
    const { data, error } = await supabase
      .from('repuestos')
      .select(`
        *,
        categorias_repuestos(nombre)
      `)
      .order('nombre', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Obtener repuesto por ID
  async getById(id) {
    const { data, error } = await supabase
      .from('repuestos')
      .select('*')
      .eq('id_repuesto', id)
      .single()
    
    if (error) {
      // Si no existe, retorna null en lugar de lanzar error
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Obtener repuestos por categoría
  async getByCategory(categoryId) {
    const { data, error } = await supabase
      .from('repuestos')
      .select('*')
      .eq('categoria_id', categoryId)
      .order('nombre', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Verificar disponibilidad (stock >= cantidad)
  async checkAvailability(repuestoId, cantidadNeeded) {
    try {
      const repuesto = await this.getById(repuestoId)
      if (!repuesto) {
        return {
          disponible: false,
          stock_actual: 0,
          cantidad_necesaria: cantidadNeeded,
          deficit: cantidadNeeded,
          error: `Repuesto con ID ${repuestoId} no encontrado`
        }
      }
      
      return {
        disponible: repuesto.stock_actual >= cantidadNeeded,
        stock_actual: repuesto.stock_actual,
        cantidad_necesaria: cantidadNeeded,
        deficit: Math.max(0, cantidadNeeded - repuesto.stock_actual)
      }
    } catch (err) {
      console.error(`[Inventory] Error en checkAvailability para repuesto ${repuestoId}:`, err)
      return {
        disponible: false,
        stock_actual: 0,
        cantidad_necesaria: cantidadNeeded,
        deficit: cantidadNeeded,
        error: err.message
      }
    }
  },

  // Descontar repuesto después de usar (por tarea)
  async deductFromTask(tareaId, repuestosUsados) {
    // repuestosUsados = [{ repuesto_id, cantidad_usada }, ...]
    const { data: movements, error: movError } = await supabase
      .from('movimientos_inventario')
      .insert(
        repuestosUsados.map(r => ({
          repuesto_id: r.repuesto_id,
          tipo_movimiento: 'SALIDA',
          cantidad: -r.cantidad_usada,
          tarea_id: tareaId
        }))
      )
      .select()
    
    if (movError) throw movError

    // Actualizar stocks en tabla repuestos
    for (const repuesto of repuestosUsados) {
      const current = await this.getById(repuesto.repuesto_id)
      const { error: updateError } = await supabase
        .from('repuestos')
        .update({ stock_actual: current.stock_actual - repuesto.cantidad_usada })
        .eq('id_repuesto', repuesto.repuesto_id)
      
      if (updateError) throw updateError
    }

    return movements
  },

  // Registrar movimiento manual (entrada)
  async addStock(repuestoId, cantidad, motivo = 'Compra', tareaId = null) {
    const current = await this.getById(repuestoId)
    
    // Registrar movimiento
    const { data: movement, error: movError } = await supabase
      .from('movimientos_inventario')
      .insert({
        repuesto_id: repuestoId,
        tipo_movimiento: 'ENTRADA',
        cantidad: cantidad,
        tarea_id: tareaId
      })
      .select()
      .single()
    
    if (movError) throw movError

    // Actualizar stock
    const { error: updateError } = await supabase
      .from('repuestos')
      .update({ stock_actual: current.stock_actual + cantidad })
      .eq('id_repuesto', repuestoId)
    
    if (updateError) throw updateError

    return movement
  },

  // Obtener repuestos con stock bajo (< stock_minimo)
  async getLowStockAlerts() {
    const { data, error } = await supabase
      .from('repuestos')
      .select(`
        *,
        categorias_repuestos(nombre)
      `)
      .order('stock_actual', { ascending: true })
    
    if (error) throw error
    
    // Filtrar repuestos con stock bajo (stock_actual < stock_minimo)
    return data.filter(r => r.stock_actual < r.stock_minimo)
  },

  // Obtener historial de movimientos
  async getMovementHistory(repuestoId, limit = 50) {
    const { data, error } = await supabase
      .from('movimientos_inventario')
      .select('*, tareas!inner(id_tarea, tipo_dano)')
      .eq('repuesto_id', repuestoId)
      .order('fecha_movimiento', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  // Crear categoría
  async createCategory(nombre) {
    const { data, error } = await supabase
      .from('categorias_repuestos')
      .insert({ nombre })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Crear repuesto
  async create(categoria_id, nombre, stock_minimo, ubicacion_bodega) {
    const { data, error } = await supabase
      .from('repuestos')
      .insert({
        categoria_id,
        nombre,
        stock_actual: 0,
        stock_minimo,
        ubicacion_bodega
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export default Inventory
