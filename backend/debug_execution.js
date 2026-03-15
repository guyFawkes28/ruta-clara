import { supabase } from './src/config/db.js'

async function checkExecutionData() {
  console.log('═══════════════════════════════════════════')
  console.log('Verificando datos de ejecución de tareas')
  console.log('═══════════════════════════════════════════\n')

  try {
    // 1. Contar total de registros
    const { data: allExecutions, error: allError } = await supabase
      .from('ejecucion_tarea')
      .select('*', { count: 'exact' })

    if (allError) throw allError
    console.log(` Total registros en ejecucion_tarea: ${allExecutions?.length || 0}\n`)

    // 2. Tareas completadas (con fecha_fin)
    const { data: completed, error: completedError } = await supabase
      .from('ejecucion_tarea')
      .select('*')
      .not('fecha_fin', 'is', null)
      .order('fecha_fin', { ascending: false })

    if (completedError) throw completedError
    console.log(` Tareas COMPLETADAS (fecha_fin != null): ${completed?.length || 0}`)
    
    if (completed && completed.length > 0) {
      console.log('\n Últimas tareas completadas:')
      completed.slice(0, 5).forEach((t, idx) => {
        console.log(`\n  [${idx + 1}] Tarea ID: ${t.tarea_id}`)
        console.log(`      Duración: ${t.duracion_minutos}m ${t.duracion_segundos}s`)
        console.log(`      Duración Total (segundos): ${t.duracion_total_segundos}`)
        console.log(`      Inicio: ${t.fecha_inicio}`)
        console.log(`      Fin: ${t.fecha_fin}`)
        console.log(`      SST: ${t.check_sst ? '' : ''}`)
      })
    } else {
      console.log('       NO HAY TAREAS COMPLETADAS')
    }

    // 3. Tareas EN PROCESO
    const { data: inProcess, error: inProcessError } = await supabase
      .from('ejecucion_tarea')
      .select('*')
      .is('fecha_fin', null)
      .order('fecha_inicio', { ascending: false })

    if (inProcessError) throw inProcessError
    console.log(`\n Tareas EN PROCESO (fecha_fin = null): ${inProcess?.length || 0}`)

    if (inProcess && inProcess.length > 0) {
      console.log('\n Últimas tareas en proceso:')
      inProcess.slice(0, 3).forEach((t, idx) => {
        console.log(`\n  [${idx + 1}] Tarea ID: ${t.tarea_id}`)
        console.log(`      Inicio: ${t.fecha_inicio}`)
        console.log(`      SST: ${t.check_sst ? '' : ''}`)
      })
    }

    // 4. Calcular promedio
    if (completed && completed.length > 0) {
      const validDurations = completed.filter(t => t.duracion_total_segundos > 0)
      if (validDurations.length > 0) {
        const totalSeconds = validDurations.reduce((sum, t) => sum + (t.duracion_total_segundos || 0), 0)
        const avgSeconds = Math.round(totalSeconds / validDurations.length)
        const avgMinutos = Math.floor(avgSeconds / 60)
        const avgSegundos = avgSeconds % 60
        
        console.log(`\n PROMEDIO CALCULADO:`)
        console.log(`   Tareas con duración válida: ${validDurations.length} / ${completed.length}`)
        console.log(`   Total segundos: ${totalSeconds}s`)
        console.log(`   Promedio: ${avgMinutos}m ${avgSegundos}s (${avgSeconds}s)`)
      } else {
        console.log(`\n  Hay ${completed.length} tareas completadas pero NINGUNA tiene duracion_total_segundos > 0`)
      }
    }

    console.log('\n═══════════════════════════════════════════\n')
  } catch (err) {
    console.error(' Error:', err.message)
  }
  
  process.exit(0)
}

checkExecutionData()
