/**
 * Componente TaskTimer - Cronómetro para medir duración de tarea
 */

export const TaskTimer = ({ tareaId, onFinish, duracionEstimada = 0 }) => {
  const state = {
    running: true,
    startTime: Date.now(),
    pausedTime: 0,
    isPaused: false
  }

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  let updateInterval

  return {
    render: () => `
      <div id="task-timer" style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        color: white;
        padding: 20px 24px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        min-width: 280px;
        z-index: 9000;
      ">
        <!-- Header -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        ">
          <h3 style="margin: 0; font-size: 14px; font-weight: 600; opacity: 0.9;">
            ⏱️ Cronómetro de Tarea
          </h3>
          <span id="timer-status" style="
            font-size: 12px;
            background: rgba(255,255,255,0.2);
            padding: 4px 8px;
            border-radius: 4px;
          ">EN PROGRESO</span>
        </div>

        <!-- Timer Display -->
        <div id="timer-display" style="
          font-size: 36px;
          font-weight: 700;
          font-family: 'Monaco', 'Courier New', monospace;
          letter-spacing: 2px;
          text-align: center;
          margin-bottom: 16px;
        ">00:00:00</div>

        <!-- Info -->
        <div style="
          background: rgba(255,255,255,0.1);
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 12px;
        ">
          ${duracionEstimada > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Estimado:</span>
              <strong>${duracionEstimada} min</strong>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between;">
            <span>Progreso:</span>
            <span id="timer-progress">0%</span>
          </div>
          <div style="
            background: rgba(255,255,255,0.1);
            height: 4px;
            border-radius: 2px;
            margin-top: 8px;
            overflow: hidden;
          ">
            <div id="timer-bar" style="
              height: 100%;
              background: linear-gradient(90deg, #4ade80, #22c55e);
              width: 0%;
              transition: width 0.3s ease;
            "></div>
          </div>
        </div>

        <!-- Botones -->
        <div style="
          display: flex;
          gap: 8px;
        ">
          <button id="timer-pause" style="
            flex: 1;
            padding: 10px;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 12px;
            transition: background 0.2s;
          ">⏸️ Pausar</button>
          <button id="timer-finish" style="
            flex: 1;
            padding: 10px;
            background: #ef4444;
            border: none;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 12px;
            transition: background 0.2s;
          "> Finalizar</button>
        </div>
      </div>
    `,

    loadRender: () => {
      const display = document.getElementById('timer-display')
      if (!display) return

      // Actualizar cada segundo
      updateInterval = setInterval(() => {
        if (!state.running || state.isPaused) return

        const elapsed = Date.now() - state.startTime - state.pausedTime
        display.textContent = formatTime(elapsed)

        // Actualizar barra de progreso
        if (duracionEstimada > 0) {
          const estimadoMs = duracionEstimada * 60 * 1000
          const progress = Math.min((elapsed / estimadoMs) * 100, 100)
          const bar = document.getElementById('timer-bar')
          const progressText = document.getElementById('timer-progress')
          if (bar) bar.style.width = progress + '%'
          if (progressText) progressText.textContent = Math.round(progress) + '%'
        }
      }, 1000)

      // Pausar
      document.getElementById('timer-pause')?.addEventListener('click', () => {
        state.isPaused = !state.isPaused
        const btn = document.getElementById('timer-pause')
        const statusEl = document.getElementById('timer-status')

        if (state.isPaused) {
          state.pausedStartTime = Date.now()
          btn.textContent = '▶️ Reanudar'
          if (statusEl) statusEl.textContent = 'PAUSADO'
        } else {
          state.pausedTime += Date.now() - state.pausedStartTime
          btn.textContent = '⏸️ Pausar'
          if (statusEl) statusEl.textContent = 'EN PROGRESO'
        }
      })

      // Finalizar
      document.getElementById('timer-finish')?.addEventListener('click', () => {
        state.running = false
        clearInterval(updateInterval)

        const elapsed = Date.now() - state.startTime - state.pausedTime
        const segundos = Math.floor(elapsed / 1000)
        
        // Calcular correctamente minutos y segundos
        const minutos = Math.floor(segundos / 60)
        const segsRestantes = segundos % 60

        const modal = document.getElementById('task-timer')
        if (modal) modal.remove()

        onFinish && onFinish({
          tareaId,
          duracion_minutos: minutos,
          duracion_segundos: segsRestantes
        })
      })
    },

    cleanup: () => {
      clearInterval(updateInterval)
    }
  }
}

export default TaskTimer
