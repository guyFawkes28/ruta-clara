import { persistence } from "../util/persistence.js"
import maintenance_service from "../api/maintenance.service.js"
import chat_service from "../api/chat.service.js"
import socket_manager from "../api/socket.js"
import ai_service from "../api/ai.service.js"
import inventory_service from "../api/inventory.service.js"
import execution_service from "../api/execution.service.js"
import { SSTProtocol } from "../components/SSTProtocol.js"
import { TaskTimer } from "../components/TaskTimer.js"
import { Modal } from "../components/Modal.js"
import { HomeHeader } from "../components/HomeHeader.js"
import { BottomNav } from "../components/BottomNav.js"

export const HomePage = () => {

  const MAX_MSG_LEN = 1000

  const state = {
    vistaActiva: 'home',
    mensajes: [],
    chatMounted: false,
    settingsMounted: false,
    pendingCount: 0,
    completedToday: 0
  }

  // ── Helpers ───────────────────────────────────────────────
  const get_time = () => {
    const d = new Date()
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const get_greeting = () => {
    const hora = new Date().getHours()
    const nombre = persistence.getUser()?.name || 'Técnico'
    if (hora < 12) return `¡Buen día, ${nombre}!`
    if (hora < 18) return `¡Buenas tardes, ${nombre}!`
    return `¡Buenas noches, ${nombre}!`
  }

  const escape_html = (str) => String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" })[s])

  const render_message = (msg) => {
    const currentUser = persistence.getUser()
    const isSent = msg.senderEmail === currentUser?.email
    const tipo = isSent ? 'sent' : 'received'

    const hora = msg.createdAt
      ? new Date(msg.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      : msg.hora || '00:00'

    const senderLabel = isSent ? 'Tú' : (msg.senderName || msg.autor || 'Usuario')

    return `
    <div style="
      display: flex;
      justify-content: ${isSent ? 'flex-end' : 'flex-start'};
      margin-bottom: 12px;
      padding: 0 4px;
    ">
      <div style="
        background: ${isSent ? '#007AFF' : '#E5E5EA'};
        color: ${isSent ? '#fff' : '#1a1a1a'};
        padding: 10px 14px;
        border-radius: ${isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
        max-width: 72%;
        min-width: 60px;
        word-break: break-word;
        overflow-wrap: break-word;
        box-shadow: 0 1px 2px rgba(0,0,0,0.08);
      ">
        <div style="
          font-size: 11px;
          font-weight: 800;
          opacity: 0.75;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        ">${escape_html(senderLabel)}</div>
        <div style="
          font-size: 14px;
          line-height: 1.45;
          white-space: pre-wrap;
        ">${escape_html(msg.message || msg.texto || '')}</div>
        <div style="
          font-size: 10px;
          opacity: 0.6;
          margin-top: 5px;
          text-align: right;
        ">${escape_html(hora)}</div>
      </div>
    </div>`
  }
  
  // ── Sub-renders ───────────────────────────────────────────

  const renderHome = () => `
    ${HomeHeader({ title: get_greeting(), showLogout: true }).render()}

    <div class="rc-section">
      <div class="rc-section-title">Resumen del día</div>
      <div class="rc-stats">
        <div class="rc-stat">
          <div class="rc-stat-icon">🔧</div>
          <div>
            <div id="pending-count" class="rc-stat-num">
              ${state.pendingCount ?? '—'}
            </div>
            <div class="rc-stat-lbl">Tareas pendientes</div>
          </div>
        </div>
        <div class="rc-stat">
          <div class="rc-stat-icon">✅</div>
          <div>
            <div id="completed-count" class="rc-stat-num">
              ${state.completedToday ?? '—'}
            </div>
            <div class="rc-stat-lbl">Completadas hoy</div>
          </div>
        </div>
      </div>
    </div>

    <div class="rc-section">
      <div class="rc-section-title">Tareas pendientes</div>
      <div id="pending-tasks-container" class="rc-tasks">
        <div style="text-align: center; padding: 20px; color: #999;">Cargando tareas...</div>
      </div>
    </div>
  `

  const renderChat = () => `
    <div class="rc-chat-wrap">
      <div class="rc-chat-header">
        <div class="rc-chat-title">💬 Chat en Vivo</div>
        <div class="rc-chat-status online">● Conectado</div>
      </div>
      <div class="rc-messages" id="rc-messages" role="log" aria-live="polite" aria-atomic="false">
        <div style="text-align:center;padding:20px;color:var(--tsoft);">Cargando mensajes...</div>
      </div>
      <div class="rc-chat-input-area">
        <form class="rc-chat-form" id="rc-chat-form" onsubmit="return false;" style="display: flex; gap: 8px; align-items: stretch;">
          <input class="rc-chat-input" id="rc-chat-input" type="text" placeholder="Escribe un mensaje..." autocomplete="off" style="flex: 1; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); font-family: 'Nunito', sans-serif; background: var(--input-bg); color: var(--text); outline: none;" />
          <button class="rc-chat-send" id="rc-chat-send" type="button" style="padding: 10px 16px; background: #007AFF; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; flex-shrink: 0; transition: opacity 0.2s;">Enviar</button>
        </form>
      </div>
    </div>
  `

  const renderSettings = () => {
    const session = persistence.getUser() || {}
    const nombre = session.name || 'Usuario'
    const email = session.email || 'Sin datos'
    const initials = nombre.split(' ').map(n => n[0]).join('').toUpperCase() || 'US'

    return `
    <div class="rc-profile">
      <div class="rc-avatar">${initials}</div>
      <div>
        <div class="rc-profile-name">${nombre}</div>
        <div class="rc-profile-email">${email}</div>
      </div>
    </div>

    <div class="rc-section">
      <div class="rc-section-title">Cuenta</div>
      <div class="rc-settings-group">
        <button class="rc-settings-btn">
          <div class="rc-settings-btn-content">
            <span class="rc-settings-label">Cambiar contraseña</span>
            <span class="rc-settings-hint">Actualiza tu PIN de acceso</span>
          </div>
          <span class="rc-settings-arrow">›</span>
        </button>
        <button class="rc-settings-btn">
          <div class="rc-settings-btn-content">
            <span class="rc-settings-label">Notificaciones</span>
            <span class="rc-settings-hint">Alertas de tareas y mensajes</span>
          </div>
          <span class="rc-settings-arrow">›</span>
        </button>
      </div>
    </div>

    <div class="rc-section">
      <div class="rc-section-title">Soporte</div>
      <div class="rc-settings-group">
        <button class="rc-settings-btn">
          <div class="rc-settings-btn-content">
            <span class="rc-settings-label">Ayuda</span>
            <span class="rc-settings-hint">Guías y manual de uso</span>
          </div>
          <span class="rc-settings-arrow">›</span>
        </button>
        <button class="rc-settings-btn">
          <div class="rc-settings-btn-content">
            <span class="rc-settings-label">Versión</span>
            <span class="rc-settings-hint">v1.0.0 — Ruta Clara</span>
          </div>
          <span class="rc-settings-arrow">›</span>
        </button>
      </div>
    </div>

    <button class="rc-logout" id="rc-logout">
      <span>🚪</span> Cerrar sesión
    </button>
    `
  }

  // ── Vistas disponibles 
  const vistas = {
    home: renderHome,
    chat: renderChat,
    settings: renderSettings,
  }

  return {

    render: () => `
      <div class="rc-app">

        <!-- Vistas -->
        <main id="rc-main">
          <div id="rc-view-home"     class="rc-view active">${renderHome()}</div>
          <div id="rc-view-chat"     class="rc-view">${renderChat()}</div>
          <div id="rc-view-settings" class="rc-view">${renderSettings()}</div>
        </main>

        <!-- Bottom nav -->
        ${BottomNav({ active: 'home', showChat: true }).render()}

      </div>
    `,

    loadRender: () => {

      

      // ── Navegación entre vistas ──────────────────────────
      const cambiarVista = (vista) => {
        state.vistaActiva = vista

        document.querySelectorAll('.rc-view').forEach(el => el.classList.remove('active'))
        document.getElementById(`rc-view-${vista}`)?.classList.add('active')

        document.querySelectorAll('[data-rc-view]').forEach(btn => {
          const isActive = btn.dataset.rcView === vista
          btn.classList.toggle('active', isActive)
          btn.setAttribute('aria-pressed', isActive ? 'true' : 'false')
        })

        // Limpiar notificaciones cuando entra al chat
        if (vista === 'chat') {
          localStorage.setItem('chat_notifications', '0')
          updateChatBadge()
        }

        // Re-montar listeners si la vista tiene interactividad
        if (vista === 'chat') mount_chat()
        if (vista === 'settings') montarSettings()
      }

      document.querySelectorAll('[data-rc-view]').forEach(btn => {
        btn.onclick = () => cambiarVista(btn.dataset.rcView)
        btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false')
      })

      // Inicializar componentes reutilizables
      try {
        HomeHeader({ title: get_greeting(), showLogout: true }).loadRender()
      } catch (e) { console.warn('[HomePage] HomeHeader loadRender error', e) }
      try {
        BottomNav({ active: 'home', showChat: true }).loadRender()
      } catch (e) { console.warn('[HomePage] BottomNav loadRender error', e) }

      // ── Iniciar tarea con SST + Cronómetro ───────────────────
      const iniciarTarea = async (tareaId, tareaData = null) => {
        try {
          console.log('[HomePage] Iniciando tarea:', tareaId, tareaData)
          
          // 1. Validar inventario (hard-lock)
          const validationResult = await inventory_service.validate_task_start(tareaId)
          if (!validationResult.canStart) {
            const faltantes = validationResult.repuestos_faltantes?.map(r => `• ${r.nombre}: ${r.requerido} necesarios, ${r.disponible} disponibles`).join('\n') || 'Repuestos no disponibles'
            const modal = Modal({
              title: '🚫 No se puede iniciar',
              message: `No hay suficientes repuestos disponibles:\n\n${faltantes}`,
              type: 'error',
              buttons: [{ text: 'Entendido', onClick: () => {}, style: 'primary' }]
            })
            document.body.insertAdjacentHTML('beforeend', modal.render())
            modal.loadRender()
            return
          }

          console.log('[HomePage]  Inventario validado, mostrando SST...')

          // 2. Mostrar protocolo SST
          const sst = SSTProtocol({
            tareaId,
            tareaData,
            onSSTComplete: async (sstData) => {
              try {
                console.log('[HomePage] SST completado, registrando...')
                
                // Registrar SST en backend
                const sstResult = await execution_service.register_sst(
                  tareaId,
                  null, // Sin foto selfie en versión simplificada
                  {
                    epp: sstData.checklist.epp,
                    bloqueo_energias: sstData.checklist.bloqueo_energias
                  }
                )

                if (!sstResult.success) {
                  const modal = Modal({
                    title: ' Error en SST',
                    message: 'No se pudo registrar el protocolo de seguridad: ' + sstResult.error,
                    type: 'error',
                    buttons: [{ text: 'OK', onClick: () => {}, style: 'primary' }]
                  })
                  document.body.insertAdjacentHTML('beforeend', modal.render())
                  modal.loadRender()
                  return
                }

                console.log('[HomePage]  SST registrado, mostrando cronómetro...')

                // Disparar evento para actualizar el mapa cuando inicia la tarea
                const etiqueta = tareaData?.activos?.etiqueta || tareaData?.activo?.etiqueta || 'UNKNOWN'
                console.log('[HomePage] Etiqueta del activo:', etiqueta, 'tareaData:', tareaData)
                
                const taskStartedEvent = { tareaId, etiqueta, estado: 'En Proceso', nuevoEstado: 'Azul' }
                
                // Evento local en esta ventana
                window.dispatchEvent(new CustomEvent('task:started', { 
                  detail: taskStartedEvent
                }))
                console.log('[HomePage] evento task:started emitido:', taskStartedEvent)
                
                // Enviar por socket a todos los usuarios conectados en tiempo real
                console.log('[HomePage] Emitiendo cambio de estado por socket...')
                const socketEmitted = socket_manager.emit_task_status_change(taskStartedEvent)
                console.log('[HomePage] Socket emit result:', socketEmitted)

                // 3. Mostrar cronómetro
                const timer = TaskTimer({
                  tareaId,
                  onFinish: async (timerData) => {
                    console.log('[HomePage] Cronómetro terminado, finalizando tarea...', timerData)
                    
                    // Capturar foto final (simulada)
                    // En producción, habría un modal para capturar la foto
                    const fotoDespues = null // Simulado - en UI real sería capturada

                    try {
                      const finishResult = await execution_service.finish_task(
                        tareaId,
                        fotoDespues,
                        [], // repuestos usados
                        timerData // Pasar duración del cronómetro { duracion_minutos, duracion_segundos }
                      )

                      // Cerrar modal del cronómetro
                      const timerModal = document.getElementById('task-timer-modal')
                      if (timerModal) timerModal.remove()

                      if (finishResult.success) {
                        console.log('[HomePage]  Tarea finalizada, mostrando confirmación...')
                        // Disparar evento para actualizar el mapa en tiempo real
                        const etiqueta = tareaData?.activos?.etiqueta || tareaData?.activo?.etiqueta || 'UNKNOWN'
                        console.log('[HomePage] Etiqueta del activo para finalización:', etiqueta)
                        
                        const taskCompletedEvent = { tareaId, etiqueta, estado: 'Terminada', nuevoEstado: 'Verde' }
                        
                        // Evento local en esta ventana
                        window.dispatchEvent(new CustomEvent('task:completed', { 
                          detail: taskCompletedEvent
                        }))
                        console.log('[HomePage] evento task:completed emitido:', taskCompletedEvent)
                        
                        // Enviar por socket a todos los usuarios conectados en tiempo real
                        console.log('[HomePage] Emitiendo cambio de estado (completado) por socket...')
                        const socketEmitted = socket_manager.emit_task_status_change(taskCompletedEvent)
                        console.log('[HomePage] Socket emit result:', socketEmitted)
                        const modal = Modal({
                          title: '✅ ¡Tarea Completada!',
                          message: 'La tarea se ha finalizado exitosamente. Los cambios se han guardado en el sistema.',
                          type: 'success',
                          buttons: [{ text: 'Aceptar', onClick: async () => { 
                            console.log('[HomePage] Esperando 1.5s para que BD procese...')
                            await new Promise(resolve => setTimeout(resolve, 1500))
                            console.log('[HomePage] Recargando tareas y actualizando contadores...')
                            // Sumar +1 al contador de completadas hoy
                            state.completedToday = (state.completedToday ?? 0) + 1
                            const completedEl = document.getElementById('completed-count')
                            if (completedEl) completedEl.textContent = String(state.completedToday)
                            // Recargar tareas pendientes
                            await load_pending_tasks()
                            // Actualizar contadores desde backend
                            await updatePendingCount()
                          }, style: 'primary' }],
                          icon: '🎉'
                        })
                        document.body.insertAdjacentHTML('beforeend', modal.render())
                        modal.loadRender()
                      } else {
                        const modal = Modal({
                          title: ' Error',
                          message: 'Error al completar tarea: ' + finishResult.error,
                          type: 'error',
                          buttons: [{ text: 'OK', onClick: () => {}, style: 'primary' }]
                        })
                        document.body.insertAdjacentHTML('beforeend', modal.render())
                        modal.loadRender()
                      }
                    } catch (err) {
                      console.error('[HomePage] Error finalizando tarea:', err)
                      
                      // Cerrar modal del cronómetro en caso de error
                      const timerModal = document.getElementById('task-timer-modal')
                      if (timerModal) timerModal.remove()
                      
                      const modal = Modal({
                        title: ' Error',
                        message: 'Error al finalizar la tarea: ' + err.message,
                        type: 'error',
                        buttons: [{ text: 'OK', onClick: () => {}, style: 'primary' }]
                      })
                      document.body.insertAdjacentHTML('beforeend', modal.render())
                      modal.loadRender()
                    }
                  }
                })

                document.body.insertAdjacentHTML('beforeend', timer.render())
                timer.loadRender()

                // Cerrar modal SST
                const sstModal = document.getElementById('sst-modal')
                if (sstModal) sstModal.remove()

              } catch (err) {
                console.error('[HomePage] Error en SST complete:', err)
                const modal = Modal({
                  title: ' Error en SST',
                  message: 'Error en el protocolo de seguridad: ' + err.message,
                  type: 'error',
                  buttons: [{ text: 'OK', onClick: () => {}, style: 'primary' }]
                })
                document.body.insertAdjacentHTML('beforeend', modal.render())
                modal.loadRender()
              }
            },
            onCancel: () => {
              console.log('[HomePage] SST cancelado por usuario')
              const modal = Modal({
                title: 'ℹ Cancelado',
                message: 'Has cancelado la ejecución de la tarea.',
                type: 'info',
                buttons: [{ text: 'OK', onClick: () => {}, style: 'primary' }]
              })
              document.body.insertAdjacentHTML('beforeend', modal.render())
              modal.loadRender()
            }
          })

          document.body.insertAdjacentHTML('beforeend', sst.render())
          sst.loadRender()

        } catch (err) {
          console.error('[HomePage] Error iniciando tarea:', err)
          const modal = Modal({
            title: ' Error',
            message: 'Error al iniciar la tarea: ' + err.message,
            type: 'error',
            buttons: [{ text: 'OK', onClick: () => {}, style: 'primary' }]
          })
          document.body.insertAdjacentHTML('beforeend', modal.render())
          modal.loadRender()
        }
      }

      // ── Cargar tareas pendientes y actualizar estadísticas ──
      const load_pending_tasks = async () => {
        try {
          console.log('[HomePage] Iniciando carga de tareas pendientes...')
          const response = await maintenance_service.get_pending_tasks()
          console.log('[HomePage] Respuesta de tareas:', response)
          
          const tareas = response?.tareas || []
          const total = response?.total || 0
          
          console.log(`[HomePage] Total de tareas pendientes: ${total}`)
          
          // Actualizar contador de tareas pendientes
          const pendingCountEl = document.getElementById('pending-count')
          if (pendingCountEl) {
            pendingCountEl.textContent = total || 0
          }

          const container = document.getElementById('pending-tasks-container')
          if (!container) {
            console.warn('[HomePage] Contenedor de tareas no encontrado en el DOM')
            return
          }

          if (!tareas || tareas.length === 0) {
            console.log('[HomePage] No hay tareas pendientes, mostrando vista vacía')
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">No hay tareas pendientes</div>'
            return
          }

          console.log(`[HomePage] Renderizando ${tareas.length} tareas...`)
          
          container.innerHTML = tareas.map(tarea => {
            try {
              console.log('[HomePage] Tarea data:', tarea)
              const activo = tarea.activos
              const zona = Array.isArray(activo?.zonas) ? activo.zonas[0] : activo?.zonas
              const incidencias = tarea.tarea_detalles_incidencia?.map(d => d.tipos_incidencia?.nombre || 'Desconocido').join(' · ') || ''
              console.log('[HomePage] Incidencias encontradas:', incidencias)
              const tipoDano = tarea.tipo_dano || 'Por determinar'
              const badgeClass = tarea.prioridad_ia > 5 ? 'danger' : tarea.prioridad_ia > 2 ? 'warning' : 'info'
              const badgeText = tarea.prioridad_ia > 5 ? 'Urgente' : tarea.prioridad_ia > 2 ? 'Normal' : 'Baja'

              return `
                <div class="rc-task ${badgeClass === 'danger' ? 'urgent' : ''}" data-tarea-id="${tarea.id_tarea}" data-tarea-json="${btoa(JSON.stringify({activos: tarea.activos, tipo_dano: tarea.tipo_dano}))}" style="cursor: pointer; transition: background 0.2s;">
                  <div class="rc-task-left">
                    <div>
                      <div><span class="rc-task-badge ${badgeClass}">${badgeText}</span></div>
                      <div class="rc-task-title">${activo?.etiqueta || 'Activo sin datos'} — ${zona?.nombre || 'Sala desconocida'}, Piso ${zona?.piso || '—'}</div>
                      <div class="rc-task-meta">� Activo: ${activo?.etiqueta || 'Desconocido'}</div>
                      <div class="rc-task-meta">�🔧 ${tipoDano}</div>
                      ${incidencias ? `<div class="rc-task-meta">📋 ${incidencias}</div>` : ''}
                    </div>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="rc-task-improve-ai" data-tarea-id="${tarea.id_tarea}" style="
                      padding: 6px 10px;
                      background: #8B5CF6;
                      color: white;
                      border: none;
                      border-radius: 6px;
                      font-size: 11px;
                      font-weight: 600;
                      cursor: pointer;
                      white-space: nowrap;
                    ">✨ IA-Analisis</button>
                    <div class="rc-task-arrow">›</div>
                  </div>
                </div>
              `
            } catch (e) {
              console.error('Error renderizando tarea:', tarea, e)
              return `<div class="rc-task"><div class="rc-task-left"><div><div class="rc-task-meta" style="color: #f00;">Error: No se pudo cargar esta tarea</div></div></div></div>`
            }
          }).join('')

          // Agregar listeners de click para iniciar tareas
          document.querySelectorAll('.rc-task').forEach(card => {
            card.addEventListener('click', async (e) => {
              // Si se clickea el botón "Mejorar", no continuar
              if (e.target.classList.contains('rc-task-improve-ai')) return

              const tareaId = parseInt(card.dataset.tareaId)
              if (isNaN(tareaId)) return

              // Recuperar datos de la tarea
              let tareaData = null
              try {
                const encoded = card.dataset.tareaJson
                if (encoded) {
                  tareaData = JSON.parse(atob(encoded))
                }
              } catch (e) {
                console.warn('[HomePage] Error parseando datos de tarea:', e)
              }

              // Iniciar secuencia de SST + Timer
              await iniciarTarea(tareaId, tareaData)
            })
          })

          // Agregar listeners de botones "Mejorar"
          document.querySelectorAll('.rc-task-improve-ai').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation()
              const tareaId = parseInt(btn.dataset.tareaId)
              btn.textContent = '⏳ Analizando...'
              btn.disabled = true

              try {
                const result = await ai_service.improve_report(tareaId)
                if (result.success && result.mejoras) {
                  const mejoras = result.mejoras
                  const modal = Modal({
                    title: '✨ Análisis IA',
                    message: `🔴 Prioridad: ${mejoras.prioridad}/10\n🔧 Categoría: ${mejoras.categoria}\n⏱️ Tiempo: ~${mejoras.tiempo_estimado_minutos} min\n🛠️ Herramientas: ${mejoras.herramientas?.join(', ') || 'N/A'}\n\n💡 Recomendación:\n${mejoras.recomendaciones}`,
                    type: 'success',
                    buttons: [{ text: 'Cerrar', onClick: () => {}, style: 'primary' }],
                    icon: '🧠'
                  })
                  document.body.insertAdjacentHTML('beforeend', modal.render())
                  modal.loadRender()
                }
              } catch (err) {
                console.error('Error mejorando reporte:', err)
                const modal = Modal({
                  title: ' Error',
                  message: 'No se pudo analizar la tarea con IA. Intenta más tarde.',
                  type: 'error',
                  buttons: [{ text: 'OK', onClick: () => {}, style: 'primary' }]
                })
                document.body.insertAdjacentHTML('beforeend', modal.render())
                modal.loadRender()
              } finally {
                btn.textContent = '✨ Mejorar'
                btn.disabled = false
              }
            })
          })
        } catch (err) {
          console.error('[HomePage] Error cargando tareas pendientes:', err)
          const container = document.getElementById('pending-tasks-container')
          if (container) {
            console.error('[HomePage] Detalles del error:', err?.message, err?.response?.data)
            container.innerHTML = `<div style="text-align: center; padding: 20px; color: #999;">No se pudieron cargar las tareas (intenta más tarde)</div>`
          }
        }
      }

      // Cargar tareas pendientes al iniciar
      setTimeout(() => load_pending_tasks(), 100)

      // ── Chat ─────────────────────────────────────────────
      // Función para actualizar el badge de chat
      const updateChatBadge = () => {
        try {
          const count = parseInt(localStorage.getItem('chat_notifications') || '0', 10) || 0
          const chatBtn = document.querySelector('[data-rc-view="chat"]')
          if (!chatBtn) return
          
          // Remover badge anterior si existe
          const oldBadge = chatBtn.querySelector('.rc-notif-badge')
          if (oldBadge) oldBadge.remove()
          
          // Agregar nuevo badge si hay notificaciones
          if (count > 0) {
            const badge = document.createElement('span')
            badge.className = 'rc-notif-badge'
            badge.textContent = count > 99 ? '99+' : String(count)
            chatBtn.appendChild(badge)
          }
        } catch (err) {
          console.error('[HomePage] Error actualizando badge:', err)
        }
      }

      const mount_chat = async () => {
        const input = document.getElementById('rc-chat-input')
        const sendBtn = document.getElementById('rc-chat-send')
        const form = document.getElementById('rc-chat-form')
        const container = document.getElementById('rc-messages')
        if (!input || !sendBtn || !container) {
          console.error('[HomePage Chat] Elementos no encontrados')
          return
        }

        // Evitar montar múltiples veces si ya hay listeners
        if (sendBtn.dataset.homeChatBound) {
          console.log('[HomePage Chat] Ya montado, solo cargando histórico')
          try {
            const mensajes = await chat_service.get_messages('HOME', 50, 0)
            state.mensajes = mensajes
            container.innerHTML = mensajes.length === 0 
              ? '<div style="text-align:center;padding:20px;color:var(--tsoft);">Sin mensajes</div>'
              : mensajes.map(render_message).join('')
            container.scrollTop = container.scrollHeight
          } catch (err) {
            console.error('[HomePage Chat] Error recargando:', err)
          }
          return
        }

        sendBtn.dataset.homeChatBound = '1'

        try {
          // Conectar al servidor de WebSocket
          await socket_manager.connect('HOME')
          console.log('[HomePage Chat] WebSocket conectado')
          
          // Monitorear cambios de conexión en tiempo real
          const statusDiv = document.querySelector('.rc-chat-status')
          socket_manager.on_connection_change((isConnected) => {
            if (statusDiv) {
              if (isConnected) {
                statusDiv.className = 'rc-chat-status online'
                statusDiv.textContent = '● Conectado'
              } else {
                statusDiv.className = 'rc-chat-status offline'
                statusDiv.textContent = '● Desconectado'
              }
            }
          })
          
          // Cargar mensajes históricos del servidor
          const load_chat_history = async () => {
            try {
              const mensajes = await chat_service.get_messages('HOME', 50, 0)
              console.log('[HomePage Chat] Mensajes históricos cargados:', mensajes.length)
              state.mensajes = mensajes
              container.innerHTML = mensajes.length === 0 
                ? '<div style="text-align:center;padding:20px;color:var(--tsoft);">Sin mensajes</div>'
                : mensajes.map(render_message).join('')
              container.scrollTop = container.scrollHeight
            } catch (err) {
              console.error('[HomePage Chat] Error cargando histórico:', err)
              container.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">Sin mensajes previos</div>'
            }
          }

          // Escuchar nuevos mensajes en tiempo real
          socket_manager.on_message((msg) => {
            console.log('[HomePage Chat] Nuevo mensaje:', msg.senderName, '-', msg.message)
            // Evitar duplicados
            if (state.mensajes.find(m => m._id === msg._id)) {
              console.log('[HomePage Chat] Mensaje duplicado, ignorando')
              return
            }
            state.mensajes.push(msg)
            const html = render_message(msg)
            container.insertAdjacentHTML('beforeend', html)
            container.scrollTop = container.scrollHeight
            
            // Incrementar notificaciones solo si no estamos en la vista de chat
            if (state.vistaActiva !== 'chat') {
              try {
                const currentCount = parseInt(localStorage.getItem('chat_notifications') || '0', 10) || 0
                const newCount = currentCount + 1
                localStorage.setItem('chat_notifications', String(newCount))
                console.log('[HomePage Chat] Notificación incrementada a:', newCount)
                // Actualizar badge en BottomNav
                updateChatBadge()
              } catch (err) {
                console.error('[HomePage Chat] Error actualizando notificaciones:', err)
              }
            }
          })

          // Escuchar confirmación de envío exitoso
          socket_manager.on_message_sent((data) => {
            console.log('[HomePage Chat]  Mensaje confirmado en servidor', data.messageId)
          })

          // Escuchar errores al enviar
          socket_manager.on_message_error((data) => {
            console.error('[HomePage Chat]  Error al enviar:', data.error)
            alert('Error al enviar el mensaje: ' + data.error)
            input.focus()
          })

          // Enviar mensaje
          const enviar = () => {
            const texto = input.value.trim()
            if (!texto) return

            console.log('[HomePage Chat] Enviando mensaje:', texto)
            const currentUser = persistence.getUser()
            
            // Validar conexión antes de enviar
            if (!socket_manager.is_connected()) {
              console.error('[HomePage Chat] No conectado al servidor')
              alert('No estás conectado. Intenta recargar la página.')
              return
            }
            
            socket_manager.send_message({
              message: texto,
              sender: 'HOME',
              senderName: currentUser?.name || 'Técnico',
              senderEmail: currentUser?.email || 'unknown@mail.com',
              role: currentUser?.rol || 'OPERATOR',
              recipient: 'DASHBOARD'
            })
            input.value = ''
            input.focus()
          }

          // Vincular eventos (remover listeners antiguos primero)
          sendBtn.onclick = null
          input.onkeydown = null
          
          sendBtn.onclick = enviar
          input.onkeydown = (e) => { 
            if (e.key === 'Enter') {
              e.preventDefault()
              enviar()
            }
          }
          if (form) form.onsubmit = (e) => { e.preventDefault(); enviar(); return false }

          // Cargar histórico al iniciar
          await load_chat_history()
        } catch (err) {
          console.error('[HomePage Chat] Error conectando:', err)
          container.innerHTML = '<div style="text-align:center;padding:20px;color:#f00;">Error conectando al chat</div>'
        }
      }

      // ── Settings ─────────────────────────────────────────
      const montarSettings = () => {
        if (state.settingsMounted) return
        state.settingsMounted = true
        const logoutBtn = document.getElementById('rc-logout')
        if (!logoutBtn) return
        logoutBtn.onclick = () => {
          persistence.clearSession()
          window.location.hash = '#/login'
        }
      }

      // Montar listeners de la vista inicial
      mount_chat()
      updateChatBadge()

      // Actualizar el conteo de tareas pendientes (estado 'Naranja')
      const updatePendingCount = async () => {
        try {
          console.debug('[HomePage] updatePendingCount called');
          const data = await maintenance_service.get_pending_tasks();
          console.debug('[HomePage] get_pending_tasks response:', data);

          // Soporte para dos formas de respuesta: 1) el objeto directo {pending, completedToday}
          // o 2) una respuesta anidada tipo axios { data: { pending, completedToday } }
          const payload = (data && typeof data === 'object' && 'data' in data) ? data.data : data;

          // Actualizar pending siempre
          state.pendingCount = payload?.pending ?? 0;

          // Solo actualizar completedToday si el servidor devuelve un valor válido y es mayor que el actual
          // Esto preserva los incrementos locales mientras se sincroniza con el backend
          if (typeof payload?.completedToday === 'number' && payload.completedToday >= state.completedToday) {
            state.completedToday = payload.completedToday;
          }

          // Actualizar el DOM si los elementos ya existen
          const pendingEl = document.getElementById('pending-count');
          if (pendingEl) pendingEl.textContent = String(state.pendingCount);

          const completedEl = document.getElementById('completed-count');
          if (completedEl) completedEl.textContent = String(state.completedToday);
        } catch (err) {
          console.warn('[HomePage] No se pudo obtener el conteo de tareas:', err);
        }
      }

      // Ejecutar tras render para garantizar que los elementos estén en el DOM
      setTimeout(updatePendingCount, 50);

    }
  }
}