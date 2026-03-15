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
    console.log('[registerSST] Body recibido:', JSON.stringify(req.body, null, 2))
    
    const { tarea_id, foto_selfie, checklist } = req.body

    if (!tarea_id) {
      console.error('[registerSST] Error: falta tarea_id')
      return res.status(400).json({ 
        success: false, 
        error: 'Falta tarea_id',
        canStart: false
      })
    }

    if (!checklist) {
      console.error('[registerSST] Error: falta checklist')
      return res.status(400).json({ 
        success: false, 
        error: 'Falta checklist',
        canStart: false
      })
    }

    // Validar checklist completo
    if (!checklist.epp || !checklist.bloqueo_energias) {
      console.error('[registerSST] Error: checklist incompleto', { checklist })
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

    console.log('[registerSST] Validaciones pasadas, registrando SST...')

    // Registrar SST con foto (si se proporciona, de lo contrario es null)
    const execution = await TaskExecution.recordSST(
      parseInt(tarea_id),
      foto_selfie || null
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
    console.log('\n========== [finishTask] INICIANDO FINALIZACIÓN DE TAREA ==========')
    console.log('[finishTask] Body recibido:', JSON.stringify(req.body, null, 2))
    
    const { tarea_id, foto_despues, repuestos_usados } = req.body

    if (!tarea_id) {
      console.error('[finishTask] ✗ Error: falta tarea_id')
      return res.status(400).json({ 
        success: false, 
        error: 'Falta tarea_id' 
      })
    }

    const taskIdInt = parseInt(tarea_id)
    console.log(`[finishTask] ID convertido a integer: ${taskIdInt} (tipo: ${typeof taskIdInt})`)

    // Finalizar ejecución
    console.log(`[finishTask] Llamando TaskExecution.finishTask(${taskIdInt})...`)
    const execution = await TaskExecution.finishTask(
      taskIdInt,
      foto_despues || null
    )
    console.log(`[finishTask] ✓ Ejecución finalizada:`, execution)

    // Descontar repuestos si se especificaron
    let movimientos = []
    if (repuestos_usados && repuestos_usados.length > 0) {
      console.log(`[finishTask] Descontando ${repuestos_usados.length} repuestos...`)
      movimientos = await Inventory.deductFromTask(
        taskIdInt,
        repuestos_usados
      )
      console.log(`[finishTask] ✓ Repuestos descontados:`, movimientos)
    }

    // ACTUALIZAR estado de tarea a "Terminada"
    console.log(`\n[finishTask] INICIANDO UPDATE: id_tarea = ${taskIdInt}, nuevo estado = 'Terminada'`)
    const { data: updateData, error: updateError, count: updateCount } = await supabase
      .from('tareas')
      .update({ estado_tarea: 'Terminada' })
      .eq('id_tarea', taskIdInt)
      .select()

    if (updateError) {
      console.error('[finishTask] ✗✗✗ ERROR AL ACTUALIZAR:', JSON.stringify(updateError, null, 2))
      throw updateError
    }

    console.log(`[finishTask] ✓ UPDATE EXITOSO`)
    console.log(`[finishTask] Filas actualizadas (count):`, updateCount)
    console.log(`[finishTask] Datos retornados:`, updateData)

    // VERIFICACIÓN: Leer la tarea actualizada
    console.log(`\n[finishTask] VERIFICANDO: leyendo tarea ${taskIdInt} para confirmar...`)
    const { data: verificacion, error: verificacionError } = await supabase
      .from('tareas')
      .select('id_tarea, estado_tarea, fecha_actualizacion')
      .eq('id_tarea', taskIdInt)
      .single()

    if (verificacionError) {
      console.error('[finishTask] ✗ Error en verificación:', verificacionError)
    } else {
      console.log(`[finishTask] ✓ VERIFICACIÓN: Tarea ${verificacion.id_tarea} tiene estado: "${verificacion.estado_tarea}"`)
      if (verificacion.estado_tarea !== 'Terminada') {
        console.error(`[finishTask] ⚠️⚠️⚠️ ALERTA: Estado NO cambió a Terminada. Sigue siendo: ${verificacion.estado_tarea}`)
      }
    }

    console.log('========== [finishTask] FIN DE PROCESO ==========\n')

    res.json({
      success: true,
      message: 'Tarea completada correctamente',
      ejecucion: execution,
      repuestos_descontados: movimientos.length,
      estado_actualizado: 'Terminada',
      verificacion: verificacion
    })
  } catch (err) {
    console.error('[finishTask] ✗✗✗ ERROR GENERAL:', err)
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
