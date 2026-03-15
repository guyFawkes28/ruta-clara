import TaskExecution from '../models/TaskExecution.model.js'
import Inventory from '../models/Inventory.model.js'
import { supabase } from '../config/db.js'
import { io } from '../../app.js'

// Iniciar registro de ejecución de tarea
export const initialize_task_execution = async (req, res) => {
  try {
    const { tarea_id } = req.body

    if (!tarea_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Falta tarea_id' 
      })
    }

    const execution = await TaskExecution.create_execution(parseInt(tarea_id))

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
export const register_sst = async (req, res) => {
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
    const execution = await TaskExecution.record_sst(
      parseInt(tarea_id),
      foto_selfie || null
    )

    // Actualizar estado de tarea a "En Ejecución"
    await supabase
      .from('tareas')
      .update({ estado_tarea: 'En Ejecución' })
      .eq('id_tarea', tarea_id)

    // Obtener datos de la tarea y del activo (incluyendo etiqueta)
    const { data: tareaData } = await supabase
      .from('tareas')
      .select('activo_id')
      .eq('id_tarea', tarea_id)
      .single()

    // Si existe el activo, actualizar su estado a 'Azul' (En reparación)
    if (tareaData?.activo_id) {
      // Obtener la etiqueta del activo
      const { data: activoData } = await supabase
        .from('activos')
        .select('etiqueta')
        .eq('id_activo', tareaData.activo_id)
        .single()

      await supabase
        .from('activos')
        .update({ estado: 'Azul' })
        .eq('id_activo', tareaData.activo_id)

      // Emitir evento por socket para que todos los dashboards se actualicen
      io.emit('task-status-changed', {
        tareaId: tarea_id,
        activo_id: tareaData.activo_id,
        etiqueta: activoData?.etiqueta || 'UNKNOWN',
        estado: 'En Proceso',
        nuevoEstado: 'Azul'
      })
      console.log('[registerSST]  Evento socket emitido: task-status-changed con etiqueta', activoData?.etiqueta)
    }

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
export const finish_task = async (req, res) => {
  try {
    console.log('\n========== [finishTask] INICIANDO FINALIZACIÓN DE TAREA ==========')
    console.log('[finishTask] Body recibido:', JSON.stringify(req.body, null, 2))
    
    const { tarea_id, foto_despues, repuestos_usados, duracion_minutos, duracion_segundos } = req.body

    if (!tarea_id) {
      console.error('[finishTask]  Error: falta tarea_id')
      return res.status(400).json({ 
        success: false, 
        error: 'Falta tarea_id' 
      })
    }

    const taskIdInt = parseInt(tarea_id)
    console.log(`[finishTask] ID convertido a integer: ${taskIdInt} (tipo: ${typeof taskIdInt})`)
    console.log(`[finishTask] Duración recibida: ${duracion_minutos} min, ${duracion_segundos} seg`)

    // Finalizar ejecución con duración
    console.log(`[finishTask] Llamando TaskExecution.finish_task(${taskIdInt})...`)
    const execution = await TaskExecution.finish_task(
      taskIdInt,
      foto_despues || null,
      duracion_minutos || 0,
      duracion_segundos || 0
    )
    console.log(`[finishTask]  Ejecución finalizada:`, execution)

    // Descontar repuestos si se especificaron
    let movimientos = []
    if (repuestos_usados && repuestos_usados.length > 0) {
      console.log(`[finishTask] Descontando ${repuestos_usados.length} repuestos...`)
      movimientos = await Inventory.deductFromTask(
        taskIdInt,
        repuestos_usados
      )
      console.log(`[finishTask]  Repuestos descontados:`, movimientos)
    }

    // Actualizar estado de tarea a "Terminada"
    console.log(`\n[finishTask] INICIANDO UPDATE: id_tarea = ${taskIdInt}, nuevo estado = 'Terminada'`)
    const { data: updateData, error: updateError, count: updateCount } = await supabase
      .from('tareas')
      .update({ estado_tarea: 'Terminada' })
      .eq('id_tarea', taskIdInt)
      .select()

    if (updateError) {
      console.error('[finishTask]  ERROR AL ACTUALIZAR:', JSON.stringify(updateError, null, 2))
      throw updateError
    }

    console.log(`[finishTask]  UPDATE EXITOSO`)
    console.log(`[finishTask] Filas actualizadas (count):`, updateCount)
    console.log(`[finishTask] Datos retornados:`, updateData)

    // Obtener datos de la tarea y del activo (incluyendo etiqueta)
    const { data: tareaData } = await supabase
      .from('tareas')
      .select('activo_id')
      .eq('id_tarea', taskIdInt)
      .single()

    // Si existe el activo, actualizar su estado a 'Verde' (Reparado)
    if (tareaData?.activo_id) {
      // Obtener la etiqueta del activo
      const { data: activoData } = await supabase
        .from('activos')
        .select('etiqueta')
        .eq('id_activo', tareaData.activo_id)
        .single()

      await supabase
        .from('activos')
        .update({ estado: 'Verde' })
        .eq('id_activo', tareaData.activo_id)

      // Emitir evento para que todos los dashboards se actualicen
      io.emit('task-status-changed', {
        tareaId: taskIdInt,
        activo_id: tareaData.activo_id,
        etiqueta: activoData?.etiqueta || 'UNKNOWN',
        estado: 'Terminada',
        nuevoEstado: 'Verde',
        reloadMap: true
      })
      console.log(`[finishTask]  Evento socket emitido con etiqueta: ${activoData?.etiqueta}`)
    }

    // Verificar la tarea actualizada
    console.log(`\n[finishTask] VERIFICANDO: leyendo tarea ${taskIdInt} para confirmar...`)
    const { data: verificacion, error: verificacionError } = await supabase
      .from('tareas')
      .select('id_tarea, estado_tarea, fecha_actualizacion')
      .eq('id_tarea', taskIdInt)
      .single()

    if (verificacionError) {
      console.error('[finishTask]  Error en verificación:', verificacionError)
    } else {
      console.log(`[finishTask]  VERIFICACIÓN: Tarea ${verificacion.id_tarea} tiene estado: "${verificacion.estado_tarea}"`)
      if (verificacion.estado_tarea !== 'Terminada') {
        console.error(`[finishTask]  ALERTA: Estado NO cambió a Terminada. Sigue siendo: ${verificacion.estado_tarea}`)
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
    console.error('[finishTask]  ERROR GENERAL:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Obtener detalles de ejecución
export const get_task_execution = async (req, res) => {
  try {
    const { tarea_id } = req.params

    if (!tarea_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Falta tarea_id' 
      })
    }

    const execution = await TaskExecution.get_execution(parseInt(tarea_id))

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
export const get_estimated_duration = async (req, res) => {
  try {
    const { tipo_dano } = req.query

    if (!tipo_dano) {
      return res.status(400).json({ 
        success: false, 
        error: 'Falta tipo_dano' 
      })
    }

    const estimate = await TaskExecution.get_average_duration(tipo_dano)

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
export const get_performance_metrics = async (req, res) => {
  try {
    console.log('[getPerformanceMetrics] Iniciando cálculo de métricas...')
    
    const executions = await TaskExecution.get_all_executions()
    console.log('[getPerformanceMetrics] Total de ejecuciones:', executions.length)

    // Contar tareas REALMENTE completadas (que tienen fecha_fin)
    const actuallyCompleted = executions.filter(e => e.fecha_fin !== null && e.fecha_inicio !== null)
    const actuallyInProcess = executions.filter(e => e.fecha_fin === null)
    
    console.log('[getPerformanceMetrics] Tareas realmente completadas (fecha_fin !== null):', actuallyCompleted.length)
    console.log('[getPerformanceMetrics] Tareas en proceso (fecha_fin === null):', actuallyInProcess.length)

    // Para el PROMEDIO: usar TODAS las tareas completadas
    // (algunas pueden tener duracion_total_segundos, otras se calcularán desde fechas)
    const completedForAverage = actuallyCompleted
    
    console.log('[getPerformanceMetrics] Tareas usadas para calcular promedio:', completedForAverage.length)
    
    if (completedForAverage.length === 0) {
      console.log('[getPerformanceMetrics] Sin tareas completadas para calcular promedio')
      const emptyMetrics = {
        total_tareas: executions.length,
        completadas: actuallyCompleted.length,
        en_proceso: actuallyInProcess.length,
        promedio_duracion_minutos: 0,
        promedio_duracion_segundos: 0,
        promedio_duracion_horas: 0,
        promedio_duracion_minutos_exacto: 0,
        promedio_duracion_segundos_exacto: 0,
        promedio_duracion_formato: '—',
        sst_cumplidas: executions.filter(e => e.check_sst).length,
        tasa_cumplimiento_sst: executions.length > 0 
          ? Math.round((executions.filter(e => e.check_sst).length / executions.length) * 100)
          : 0
      }

      return res.json({
        success: true,
        metricas: emptyMetrics,
        metrics: emptyMetrics
      })
    }
    
    let totalTimeSeconds = 0
    let tasksWithValidDuration = 0
    
    completedForAverage.forEach((e, idx) => {
      try {
        let segundos = 0
        let source = 'desconocida'
        
        // Prioridad 1: usar duracion_total_segundos si está disponible (valor exacto del cronómetro)
        if (e.duracion_total_segundos && e.duracion_total_segundos > 0) {
          segundos = e.duracion_total_segundos
          source = 'duracion_total_segundos (cronómetro)'
        } 
        // Prioridad 2: calcular desde fechas si no hay duración almacenada
        else if (e.fecha_inicio && e.fecha_fin) {
          const ms = new Date(e.fecha_fin) - new Date(e.fecha_inicio)
          segundos = Math.round(ms / 1000)
          source = 'fecha_fin - fecha_inicio'
        }
        
        if (segundos > 0) {
          totalTimeSeconds += segundos
          tasksWithValidDuration++
          console.log(`  [${idx}] Tarea ${e.tarea_id}: ${segundos}s (desde ${source})`)
        } else {
          console.warn(`  [${idx}] Tarea ${e.tarea_id}: duración NO calculada (segundos=${segundos}, fecha_inicio=${e.fecha_inicio}, fecha_fin=${e.fecha_fin})`)
        }
      } catch (parseErr) {
        console.error(`[getPerformanceMetrics] Error procesando registro ${idx}:`, parseErr)
      }
    })

    console.log(`[getPerformanceMetrics] Total segundos sumado: ${totalTimeSeconds}s`)
    console.log(`[getPerformanceMetrics] Tareas con duración válida: ${tasksWithValidDuration} / ${completedForAverage.length}`)

    // Calcular promedio (solo con tareas que tienen duración válida)
    const avgTimeSeconds = tasksWithValidDuration > 0 ? Math.round(totalTimeSeconds / tasksWithValidDuration) : 0
    const avgHoras = Math.floor(avgTimeSeconds / 3600)
    const avgMinutos = Math.floor((avgTimeSeconds % 3600) / 60)
    const avgSegundos = avgTimeSeconds % 60
    
    // Formato legible para el dashboard
    const formatoPromedio = avgHoras > 0 
      ? `${avgHoras}h ${avgMinutos}m`
      : avgMinutos > 0
      ? `${avgMinutos}m ${avgSegundos}s`
      : `${avgSegundos}s`

    console.log(`[getPerformanceMetrics]  PROMEDIO CALCULADO: ${formatoPromedio} (${totalTimeSeconds}s total / ${tasksWithValidDuration} tareas = ${avgTimeSeconds}s promedio)`)

    const metrics = {
      total_tareas: executions.length,
      completadas: actuallyCompleted.length,              //  Usa TODAS las completadas
      en_proceso: actuallyInProcess.length,              //  Usa TODAS las en proceso
      promedio_duracion_minutos: completedForAverage.length > 0 
        ? Math.round(avgTimeSeconds / 60)
        : 0,
      promedio_duracion_segundos: avgTimeSeconds,
      promedio_duracion_horas: avgHoras,
      promedio_duracion_minutos_exacto: avgMinutos,
      promedio_duracion_segundos_exacto: avgSegundos,
      promedio_duracion_formato: formatoPromedio,
      sst_cumplidas: executions.filter(e => e.check_sst).length,
      tasa_cumplimiento_sst: executions.length > 0 
        ? Math.round((executions.filter(e => e.check_sst).length / executions.length) * 100)
        : 0
    }

    console.log('[getPerformanceMetrics] Métricas finales:', metrics)
    res.json({
      success: true,
      metricas: metrics,
      metrics: metrics
    })
  } catch (err) {
    console.error('[getPerformanceMetrics] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export default {
  initialize_task_execution,
  register_sst,
  finish_task,
  get_task_execution,
  get_estimated_duration,
  get_performance_metrics
}
