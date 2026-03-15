import Inventory from '../models/Inventory.model.js'
import { supabase } from '../config/db.js'

// Obtener todos los repuestos con filtros
export const get_all_spare_parts = async (req, res) => {
  try {
    const { categoria } = req.query
    let repuestos
    
    if (categoria) {
      repuestos = await Inventory.getByCategory(parseInt(categoria))
    } else {
      repuestos = await Inventory.getAll()
    }

    res.json({ 
      success: true, 
      total: repuestos.length, 
      repuestos 
    })
  } catch (err) {
    console.error('[Inventory] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Obtener repuesto específico
export const get_spare_part = async (req, res) => {
  try {
    const { id } = req.params
    const repuesto = await Inventory.getById(parseInt(id))
    
    res.json({ success: true, repuesto })
  } catch (err) {
    console.error('[Inventory] Error:', err)
    res.status(404).json({ success: false, error: 'Repuesto no encontrado' })
  }
}

// Validar disponibilidad para una tarea
export const check_availability = async (req, res) => {
  try {
    const { repuesto_id, cantidad } = req.body
    
    if (!repuesto_id || !cantidad) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan repuesto_id o cantidad' 
      })
    }

    const availability = await Inventory.checkAvailability(
      parseInt(repuesto_id),
      parseInt(cantidad)
    )

    res.json({ 
      success: true, 
      ...availability 
    })
  } catch (err) {
    console.error('[Inventory] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Validar si la tarea puede iniciar por stock
export const validate_task_start = async (req, res) => {
  try {
    const { tarea_id } = req.body

    if (!tarea_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Falta tarea_id',
        canStart: false
      })
    }

    console.log(`[Inventory] Validando inicio de tarea ${tarea_id}...`)

    // Obtener repuestos requeridos para la tarea desde tarea_repuestos
    const { data: repuestosRequeridos, error: repuestosError } = await supabase
      .from('tarea_repuestos')
      .select('repuesto_id, cantidad_usada')
      .eq('tarea_id', tarea_id)

    if (repuestosError) {
      console.error(`[Inventory] Error obtener repuestos para tarea ${tarea_id}:`, repuestosError)
      return res.status(500).json({
        success: false,
        error: 'Error al obtener repuestos requeridos',
        canStart: false,
        details: repuestosError.message
      })
    }

    // Si no hay repuestos requeridos, la tarea puede iniciarse
    if (!repuestosRequeridos || repuestosRequeridos.length === 0) {
      console.log(`[Inventory] Tarea ${tarea_id} no requiere repuestos - Puede iniciarse`)
      return res.json({
        success: true,
        canStart: true,
        repuestos_validados: 0,
        repuestos_disponibles: 0,
        repuestos_faltantes: [],
        mensaje: 'No requiere repuestos o tabla vacía'
      })
    }

    console.log(`[Inventory] Tarea ${tarea_id} requiere ${repuestosRequeridos.length} repuesto(s)`)

    // Validar disponibilidad de cada repuesto
    const validations = await Promise.all(
      repuestosRequeridos.map(r => {
        console.log(`[Inventory] Validando repuesto ${r.repuesto_id} - cantidad: ${r.cantidad_usada}`)
        return Inventory.checkAvailability(r.repuesto_id, r.cantidad_usada)
      })
    )

    const allAvailable = validations.every(v => v.disponible)
    const missingItems = validations.filter(v => !v.disponible)

    console.log(`[Inventory] Resultado: ${allAvailable ? ' Todos disponibles' : ' Faltan algunos'}`)

    res.json({
      success: true,
      canStart: allAvailable,
      repuestos_validados: validations.length,
      repuestos_disponibles: validations.filter(v => v.disponible).length,
      repuestos_faltantes: missingItems,
      validations: validations
    })
  } catch (err) {
    console.error(`[Inventory] Error en validateTaskStart:`, err)
    // Permitir inicio de tarea si algo falla en validación (modo desarrollo)
    res.status(200).json({ 
      success: true,
      canStart: true,
      error: err.message,
      warning: 'Validación falló pero se permite iniciar (modo desarrollo)',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

// Descontar repuestos al completar tarea
export const deduct_spare_parts = async (req, res) => {
  try {
    const { tarea_id, repuestos_usados } = req.body
    // repuestos_usados = [{ repuesto_id, cantidad_usada }, ...]

    if (!tarea_id || !repuestos_usados) {
      return res.status(400).json({ 
        success: false, 
        error: 'Datos incompletos' 
      })
    }

    const movements = await Inventory.deductFromTask(
      parseInt(tarea_id),
      repuestos_usados.map(r => ({
        repuesto_id: r.repuesto_id,
        cantidad_usada: r.cantidad_usada
      }))
    )

    res.json({ 
      success: true, 
      message: 'Repuestos descontados correctamente',
      movimientos_registrados: movements.length
    })
  } catch (err) {
    console.error('[Inventory] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Alertas de stock bajo
export const get_low_stock_alerts = async (req, res) => {
  try {
    const alerts = await Inventory.getLowStockAlerts()
    
    res.json({
      success: true,
      total_alertas: alerts.length,
      repuestos_bajo_stock: alerts
    })
  } catch (err) {
    console.error('[Inventory] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Agregar stock (compra)
export const add_stock = async (req, res) => {
  try {
    const { repuesto_id, cantidad, motivo } = req.body

    if (!repuesto_id || !cantidad) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan campos requeridos' 
      })
    }

    const movement = await Inventory.addStock(
      parseInt(repuesto_id),
      parseInt(cantidad),
      motivo || 'Compra'
    )

    res.json({
      success: true,
      message: 'Stock agregado correctamente',
      movimiento: movement
    })
  } catch (err) {
    console.error('[Inventory] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Historial de movimientos
export const get_movement_history = async (req, res) => {
  try {
    const { repuesto_id, limit } = req.query

    if (!repuesto_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Falta repuesto_id' 
      })
    }

    const history = await Inventory.getMovementHistory(
      parseInt(repuesto_id),
      limit ? parseInt(limit) : 50
    )

    res.json({
      success: true,
      total: history.length,
      historial: history
    })
  } catch (err) {
    console.error('[Inventory] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Obtener tipos de repuestos
export const get_spare_part_types = async (req, res) => {
  try {
    const { data: tipos, error } = await supabase
      .from('categorias_repuestos')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) throw error

    res.json({
      success: true,
      tipos: tipos || []
    })
  } catch (err) {
    console.error('[Inventory] Error obtener tipos:', err)
    res.status(500).json({ 
      success: false, 
      error: err.message,
      tipos: []
    })
  }
}

// Obtener repuestos agrupados por tipo con cantidad
export const get_spare_parts_grouped_by_type = async (req, res) => {
  try {
    console.log('[Inventory] getRepuestosGroupedByType iniciado')
    
    // Obtener todos los repuestos
    const { data: repuestos, error } = await supabase
      .from('repuestos')
      .select(`
        id_repuesto,
        nombre,
        stock_actual,
        stock_minimo,
        categoria_id
      `)
      .order('nombre', { ascending: true })

    if (error) {
      console.error('[Inventory] Error al obtener repuestos:', error)
      throw error
    }

    // Agrupar por categoría_id
    const repuestos_por_tipo = {}
    
    if (repuestos && repuestos.length > 0) {
      repuestos.forEach(rep => {
        const tipoNombre = `Categoría ${rep.categoria_id}`
        
        if (!repuestos_por_tipo[tipoNombre]) {
          repuestos_por_tipo[tipoNombre] = {
            cantidad_total: 0,
            repuestos: []
          }
        }

        const repuestoFormateado = {
          id: rep.id_repuesto,
          nombre: rep.nombre,
          stock: rep.stock_actual || 0,
          stock_minimo: rep.stock_minimo || 0
        }

        repuestos_por_tipo[tipoNombre].repuestos.push(repuestoFormateado)
        repuestos_por_tipo[tipoNombre].cantidad_total += rep.stock_actual || 0
      })
    }

    console.log('[Inventory] Repuestos agrupados:', Object.keys(repuestos_por_tipo).length, 'categorías')

    // Mantener ambas claves por compatibilidad
    res.json({
      success: true,
      repuestos_por_tipo,
      grouped_by_type: repuestos_por_tipo
    })
  } catch (err) {
    console.error('[Inventory] Error obtener agrupados:', err)
    res.status(500).json({ 
      success: false, 
      error: err.message,
      repuestos_por_tipo: {},
      grouped_by_type: {}
    })
  }
}

export default {
  get_all_spare_parts,
  get_spare_part,
  check_availability,
  validate_task_start,
  deduct_spare_parts,
  get_low_stock_alerts,
  add_stock,
  get_spare_parts_grouped_by_type,
  get_movement_history
}
