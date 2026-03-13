import { persistence } from "../util/persistence.js"
import maintenanceService from "../api/maintenance.service.js"

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
  const ahora = () => {
    const d = new Date()
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const obtenerSaludo = () => {
    const hora = new Date().getHours()
    const nombre = persistence.getUser()?.name || 'Técnico'
    if (hora < 12) return `¡Buen día, ${nombre}!`
    if (hora < 18) return `¡Buenas tardes, ${nombre}!`
    return `¡Buenas noches, ${nombre}!`
  }

  const escapeHtml = (str) => String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" })[s])

  const renderMensaje = ({ tipo, autor, texto, hora }) => `
    <div class="rc-msg ${tipo}">
      <div class="rc-bubble">
        <div class="rc-msg-sender">${escapeHtml(autor)}</div>
        <div class="rc-msg-content">${escapeHtml(texto)}</div>
        <div class="rc-msg-time">${escapeHtml(hora)}</div>
      </div>
    </div>`

  // ── Sub-renders ───────────────────────────────────────────

  const renderHome = () => `
    <div class="rc-welcome">
      <h2>${obtenerSaludo()}</h2>
      <div class="rc-welcome-date">${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>

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
        <div class="rc-chat-title">💬 Mensajes del Sistema</div>
        <div class="rc-chat-status online">● Conectado</div>
      </div>
      <div class="rc-messages" id="rc-messages" role="log" aria-live="polite" aria-atomic="false">
        ${state.mensajes.map(renderMensaje).join('')}
      </div>
      <div class="rc-chat-input-area">
        <div class="rc-chat-form">
          <input class="rc-chat-input" id="rc-chat-input" type="text" placeholder="Escribe un mensaje...">
          <button class="rc-chat-send" id="rc-chat-send">➤</button>
        </div>
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

  // ── Vistas disponibles ────────────────────────────────────
  const vistas = {
    home: renderHome,
    chat: renderChat,
    settings: renderSettings,
  }

  // ─────────────────────────────────────────────────────────
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
        <nav class="rc-bottom-nav">
          <button class="rc-nav-btn active" data-rc-view="home">
            <span class="rc-nav-icon">🏠</span>
            Inicio
          </button>
          <button class="rc-nav-btn" data-rc-view="chat">
            <span class="rc-nav-icon">💬</span>
            Chat
          </button>
          <button class="rc-nav-btn" id="rc-scan-btn" aria-label="Escanear">
            <span class="rc-nav-icon">📷</span>
          </button>
        </nav>

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

        // Re-montar listeners si la vista tiene interactividad
        if (vista === 'chat') montarChat()
        if (vista === 'settings') montarSettings()
      }

      document.querySelectorAll('[data-rc-view]').forEach(btn => {
        btn.onclick = () => cambiarVista(btn.dataset.rcView)
        btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false')
      })

      // Botón de cámara: navegar a la ruta del scanner
      const scanBtn = document.getElementById('rc-scan-btn')
      if (scanBtn) {
        scanBtn.onclick = () => { window.location.hash = '#/scanner' }
        scanBtn.setAttribute('role', 'button')
        scanBtn.setAttribute('aria-pressed', 'false')
      }

      // ── Cargar tareas pendientes y actualizar estadísticas ──
      const cargarTareasPendientes = async () => {
        try {
          console.log('[HomePage] Iniciando carga de tareas pendientes...')
          const response = await maintenanceService.getPendingTasks()
          console.log('[HomePage] Respuesta de tareas:', response)
          
          const tareas = response?.tareas || []
          const total = response?.total || 0
          
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
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">No hay tareas pendientes</div>'
            return
          }

          container.innerHTML = tareas.map(tarea => {
            try {
              const activo = tarea.activos
              const zona = Array.isArray(activo?.zonas) ? activo.zonas[0] : activo?.zonas
              const incidencias = tarea.tarea_detalles_incidencia?.map(d => d.tipos_incidencia?.nombre || 'Desconocido').join(' · ') || 'Sin incidencias'
              const badgeClass = tarea.prioridad_ia > 5 ? 'danger' : tarea.prioridad_ia > 2 ? 'warning' : 'info'
              const badgeText = tarea.prioridad_ia > 5 ? 'Urgente' : tarea.prioridad_ia > 2 ? 'Normal' : 'Baja'

              return `
                <div class="rc-task ${badgeClass === 'danger' ? 'urgent' : ''}">
                  <div class="rc-task-left">
                    <div>
                      <div><span class="rc-task-badge ${badgeClass}">${badgeText}</span></div>
                      <div class="rc-task-title">${activo?.etiqueta || 'Activo sin datos'} — ${zona?.nombre || 'Zona desconocida'}, Piso ${zona?.piso || '—'}</div>
                      <div class="rc-task-meta">${incidencias}</div>
                    </div>
                  </div>
                  <div class="rc-task-arrow">›</div>
                </div>
              `
            } catch (e) {
              console.error('Error renderizando tarea:', tarea, e)
              return `<div class="rc-task"><div class="rc-task-left"><div><div class="rc-task-meta" style="color: #f00;">Error: No se pudo cargar esta tarea</div></div></div></div>`
            }
          }).join('')
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
      setTimeout(() => cargarTareasPendientes(), 100)

      // ── Chat ─────────────────────────────────────────────
      const montarChat = () => {
        const input = document.getElementById('rc-chat-input')
        const sendBtn = document.getElementById('rc-chat-send')
        const container = document.getElementById('rc-messages')
        if (!input || !sendBtn || !container) return

        const enviar = () => {
          const texto = input.value.trim()
          if (!texto) return

          const msg = { tipo: 'sent', autor: 'Tú', texto, hora: ahora() }
          state.mensajes.push(msg)

          container.insertAdjacentHTML('beforeend', renderMensaje(msg))
          container.scrollTop = container.scrollHeight
          input.value = ''
        }

        sendBtn.onclick = enviar
        input.onkeydown = (e) => { if (e.key === 'Enter') enviar() }

        // Scroll al último mensaje
        container.scrollTop = container.scrollHeight
      }

      // ── Settings ─────────────────────────────────────────
      const montarSettings = () => {
        if (state.settingsMounted) return
        state.settingsMounted = true
        const logoutBtn = document.getElementById('rc-logout')
        if (!logoutBtn) return
        logoutBtn.onclick = () => {
          if (confirm('¿Cerrar sesión?')) {
            persistence.clearSession()
            window.location.hash = '#/login'
          }
        }
      }

      // Montar listeners de la vista inicial
      montarChat()

      // Actualizar el conteo de tareas pendientes (estado 'Naranja')
      const updatePendingCount = async () => {
        try {
          console.debug('[HomePage] updatePendingCount called');
          const data = await maintenanceService.getPendingCount();
          console.debug('[HomePage] getPendingCount response:', data);

          // Soporte para dos formas de respuesta: 1) el objeto directo {pending, completedToday}
          // o 2) una respuesta anidada tipo axios { data: { pending, completedToday } }
          const payload = (data && typeof data === 'object' && 'data' in data) ? data.data : data;

          // Guardar en state para referencia futura
          state.pendingCount = payload?.pending ?? 0;
          state.completedToday = payload?.completedToday ?? 0;

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