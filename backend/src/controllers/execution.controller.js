import TaskExecution from '../models/TaskExecution.model.js'
import Inventory from '../models/Inventory.model.js'
import { supabase } from '../config/db.js'

// Iniciar registro de ejecución de tarea
export const initializeTaskExecution = async (req, res) => {
  try {
    const { tarea_id } = req.body

    if (!tarea_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Falta tarea_id' 
      })
    }

    const execution = await TaskExecution.createExecution(parseInt(tarea_id))

    res.json({
      success: true,
      message: 'Ejecución iniciada, registra SST para continuar',
      ejecucion: execution
    })
  } catch (err) {
    console.error('[TaskExecution] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Registrar SST (Protocolo de Seguridad)
export const registerSST = async (req, res) => {
  try {
    const { tarea_id, foto_selfie, checklist } = req.body
    // checklist = { epp: true, bloqueo_energias: true, foto_seguridad: true }

    if (!tarea_id || !foto_selfie || !checklist) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan datos requeridos (tarea_id, foto_selfie, checklist)',
        canStart: false
      })
    }

    // Validar checklist completo
    if (!checklist.epp || !checklist.bloqueo_energias) {
      return res.status(400).json({
        success: false,
        error: 'Checklist de seguridad incompleto',
        missing: [
          !checklist.epp ? 'Uso de EPP' : null,
          !checklist.bloqueo_energias ? 'Bloqueo de energías' : null
        ].filter(Boolean),
        canStart: false
      })
    }

    // Registrar SST con foto
    const execution = await TaskExecution.recordSST(
      parseInt(tarea_id),
      foto_selfie
    )

    // Actualizar estado de tarea a "En Ejecución"
    await supabase
      .from('tareas')
      .update({ estado_tarea: 'En Ejecución' })
      .eq('id_tarea', tarea_id)

    res.json({
      success: true,
      message: 'Protocolo SST registrado correctamente',
      canStart: true,
      ejecucion: execution,
      cronometro_iniciado: true
    })
  } catch (err) {
    console.error('[TaskExecution] Error:', err)
    res.status(500).json({ 
      success: false, 
      error: err.message,
      canStart: false 
    })
  }
}

// Finalizar tarea (foto después + descuento de repuestos)
export const finishTask = async (req, res) => {
  try {
    const { tarea_id, foto_despues, repuestos_usados } = req.body
    // repuestos_usados = [{ repuesto_id, cantidad_usada }, ...]

    if (!tarea_id || !foto_despues) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan tarea_id o foto_despues' 
      })
    }

    // Finalizar ejecución
    const execution = await TaskExecution.finishTask(
      parseInt(tarea_id),
      foto_despues
    )

    // Descontar repuestos si se especificaron
    let movimientos = []
    if (repuestos_usados && repuestos_usados.length > 0) {
      movimientos = await Inventory.deductFromTask(
        parseInt(tarea_id),
        repuestos_usados
      )
    }

    // Actualizar estado de tarea a "Completada"
    await supabase
      .from('tareas')
      .update({ estado_tarea: 'Completada' })
      .eq('id_tarea', tarea_id)

    res.json({
      success: true,
      message: 'Tarea completada correctamente',
      ejecucion: execution,
      repuestos_descontados: movimientos.length
    })
  } catch (err) {
    console.error('[TaskExecution] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Obtener detalles de ejecución
export const getTaskExecution = async (req, res) => {
  try {
    const { tarea_id } = req.params

    if (!tarea_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Falta tarea_id' 
      })
    }

    const execution = await TaskExecution.getExecution(parseInt(tarea_id))

    res.json({
      success: true,
      ejecucion: execution
    })
  } catch (err) {
    console.error('[TaskExecution] Error:', err)
    res.status(404).json({ 
      success: false, 
      error: 'Ejecución no encontrada' 
    })
  }
}

// Obtener duración promedio para una tarea (para estimar tiempo)
export const getEstimatedDuration = async (req, res) => {
  try {
    const { tipo_dano } = req.query

    if (!tipo_dano) {
      return res.status(400).json({ 
        success: false, 
        error: 'Falta tipo_dano' 
      })
    }

    const estimate = await TaskExecution.getAverageDuration(tipo_dano)

    res.json({
      success: true,
      estimada: estimate || {
        promedio_minutos: 'Sin datos',
        total_tareas: 0
      }
    })
  } catch (err) {
    console.error('[TaskExecution] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Obtener métricas de desempeño (para dashboard)
export const getPerformanceMetrics = async (req, res) => {
  try {
    const executions = await TaskExecution.getAllExecutions()

    const completed = executions.filter(e => e.fecha_fin !== null)
    const totalTime = completed.reduce((acc, e) => {
      const ms = new Date(e.fecha_fin) - new Date(e.fecha_inicio)
      return acc + (ms / (1000 * 60)) // en minutos
    }, 0)

    const metrics = {
      total_tareas: executions.length,
      completadas: completed.length,
      en_proceso: executions.length - completed.length,
      promedio_duracion_minutos: completed.length > 0 
        ? Math.round(totalTime / completed.length) 
        : 0,
      sst_cumplidas: executions.filter(e => e.check_sst).length,
      tasa_cumplimiento_sst: executions.length > 0 
        ? Math.round((executions.filter(e => e.check_sst).length / executions.length) * 100)
        : 0
    }

    res.json({
      success: true,
      metricas: metrics
    })
  } catch (err) {
    console.error('[TaskExecution] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export default {
  initializeTaskExecution,
  registerSST,
  finishTask,
  getTaskExecution,
  getEstimatedDuration,
  getPerformanceMetrics
}
