
import { persistence } from "../util/persistence.js";
import maintenanceService from "../api/maintenance.service.js";
import sidebarView from "../components/Sidebar.js";
import { reportZone } from "../components/ReportZone.js";

// Estado dinámico reemplazando los datos "quemados"
const state = {
  equipos: { total: 0, activos: 0, inactivos: 0, enMantenimiento: 0, lista: [] },
  inspecciones: { total: 0, completadas: 0, pendientes: 0, conProblemas: 0, lista: [] },
  tecnicos: { total: 0, activos: 0, disponibles: 0, lista: [] },
  reportes: { generados: 0, pendientes: 0, lista: [] }
}

// Carga activos de backend y mapea a la forma esperada por las vistas
const loadZone = async (qrCode = 'TL') => {
  try {
    const data = await maintenanceService.getZoneByQR(qrCode)
    const activos = data?.activos || []
    state.equipos.lista = activos.map(a => ({
      id: a.id_activo ?? a.id ?? a.codigo ?? '',
      nombre: a.nombre ?? a.descripcion ?? a.tipos_activo?.nombre ?? 'Activo',
      ubicacion: data?.info_zona?.nombre ?? a.ubicacion ?? '',
      tipo: a.tipos_activo?.nombre ?? a.tipo ?? '',
      estado: a.estado ?? a.status ?? 'activo'
    }))
    state.equipos.total = state.equipos.lista.length
    const counts = state.equipos.lista.reduce((acc, it) => { acc[it.estado] = (acc[it.estado] || 0) + 1; return acc }, {})
    state.equipos.activos = counts['activo'] || counts['ok'] || 0
    state.equipos.inactivos = counts['inactivo'] || 0
    state.equipos.enMantenimiento = counts['mantenimiento'] || 0
  } catch (err) {
    console.error('Error cargando zona:', err)
  }
}

// ─── helper de estado ────────────────────────────────────────
const statusBadge = (estado) => {
  const map = {
    activo:        ['db-status-ok',      '● Activo'],
    inactivo:      ['db-status-off',     '● Inactivo'],
    mantenimiento: ['db-status-pending', '⏳ Mantenimiento'],
    ok:            ['db-status-ok',      '✓ OK'],
    critico:       ['db-status-error',   '⚠ Crítico'],
    pendiente:     ['db-status-pending', '⏳ Pendiente'],
    completada:    ['db-status-ok',      '✓ Completada'],
    progreso:      ['db-status-pending', '⏳ En Progreso'],
    problema:      ['db-status-error',   '⚠ Problema'],
    disponible:    ['db-status-ok',      '✓ Disponible'],
    revision:      ['db-status-pending', '⏳ Revisión'],
  }
  const [cls, label] = map[estado] ?? ['db-status-off', estado]
  return `<span class="db-status ${cls}">${label}</span>`
}

// ─── sub-renders ────────────────────────────────────────────

function subDashboard() {
  const { equipos, inspecciones, tecnicos } = state
  return `
    <div class="db-ph">
      <div>
        <h1>Dashboard</h1>
        <p>Bienvenido de vuelta, ${persistence.getUser()?.name || persistence.getUser()?.email || 'Usuario'}</p>
      </div>
      <div class="db-ph-actions">
        <button class="db-btn db-btn-secondary" id="db-logout">🔒 Cerrar sesión</button>
        <button class="db-btn db-btn-primary"   id="db-new-report">+ Nuevo Reporte</button>
      </div>
    </div>

    <div class="db-cards">
      <div class="db-card db-fade">
        <div class="db-card-head">
          <span class="db-card-title">Equipos Activos</span>
        </div>
        <div class="db-card-value">${equipos.activos}</div>
        <div class="db-card-stat">De ${equipos.total} totales</div>
      </div>
      <div class="db-card db-fade" style="animation-delay:.06s">
        <div class="db-card-head">
          <span class="db-card-title">Inspecciones</span>
          <span class="db-badge db-badge-info">${inspecciones.pendientes} pend.</span>
        </div>
        <div class="db-card-value">${inspecciones.completadas}</div>
        <div class="db-card-stat">Completadas este mes</div>
      </div>
      <div class="db-card db-fade" style="animation-delay:.12s">
        <div class="db-card-head">
          <span class="db-card-title">Problemas</span>
          <span class="db-badge db-badge-warn">${inspecciones.conProblemas}</span>
        </div>
        <div class="db-card-value">${inspecciones.conProblemas}</div>
        <div class="db-card-stat">Requieren atención</div>
      </div>
      <div class="db-card db-fade" style="animation-delay:.18s">
        <div class="db-card-head">
          <span class="db-card-title">Técnicos Disponibles</span>
          <span class="db-badge db-badge-ok">${tecnicos.disponibles}</span>
        </div>
        <div class="db-card-value">${tecnicos.disponibles}/${tecnicos.activos}</div>
        <div class="db-card-stat">En horario laboral</div>
      </div>
    </div>



    <div class="db-section">
      <div class="db-section-head">
        <h2 class="db-section-title">Últimas Inspecciones</h2>
        <button class="db-btn db-btn-secondary db-btn-sm" id="db-see-all">Ver todas →</button>
      </div>
      <div class="db-table-wrap">
        <table class="db-table">
          <thead>
            <tr>
              <th>ID Equipo</th><th>Ubicación</th><th>Técnico</th>
              <th>Fecha</th><th>Estado</th><th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${inspecciones.lista.length === 0 ? `
              <tr><td colspan="6" style="text-align:center;color:var(--tsoft)">No hay inspecciones recientes</td></tr>
            ` : inspecciones.lista.map(i => `
              <tr>
                <td><strong>${i.id || ''}</strong></td>
                <td>${i.equipo || i.ubicacion || ''}</td>
                <td>${i.tecnico || ''}</td>
                <td>${i.fecha || ''}</td>
                <td>${statusBadge(i.estado || 'pendiente')}</td>
                <td><button class="db-btn db-btn-secondary db-btn-sm">Ver</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function subEquipos() {
  const { equipos } = state
  const rows = equipos.lista.map(e => `
    <tr>
      <td><strong>${e.id}</strong></td>
      <td>${e.nombre}</td>
      <td>${e.ubicacion}</td>
      <td>${e.tipo}</td>
      <td>${statusBadge(e.estado)}</td>
      <td><button class="db-btn db-btn-secondary db-btn-sm">Editar</button></td>
    </tr>`).join('')

  return `
    <div class="db-ph">
      <h1>Gestión de Equipos</h1>
      <div class="db-ph-actions">
        <button id="db-filter-equipos" class="db-btn db-btn-secondary">🔍 Filtrar</button>
        <button class="db-btn db-btn-primary">+ Registrar Equipo</button>
      </div>
    </div>
    <div class="db-cards">
      <div class="db-card db-fade">
        <div class="db-card-title">Total de Equipos</div>
        <div class="db-card-value">${equipos.total}</div>
      </div>
      <div class="db-card db-fade" style="animation-delay:.06s">
        <div class="db-card-title">En Mantenimiento</div>
        <div class="db-card-value" style="color:var(--orange)">${equipos.enMantenimiento}</div>
      </div>
      <div class="db-card db-fade" style="animation-delay:.12s">
        <div class="db-card-title">Inactivos</div>
        <div class="db-card-value" style="color:#DC2626">${equipos.inactivos}</div>
      </div>
    </div>
    <div class="db-section">
      <div class="db-section-head">
        <h2 class="db-section-title">Listado de Equipos</h2>
      </div>
      <div class="db-table-wrap">
        <table class="db-table">
          <thead>
            <tr><th>ID</th><th>Nombre</th><th>Ubicación</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`
}

function subInspecciones() {
  const { inspecciones } = state
  const rows = inspecciones.lista.map(i => `
    <tr>
      <td><strong>${i.id || ''}</strong></td>
      <td>${i.equipo || ''}</td>
      <td>${i.fecha || ''}</td>
      <td>${i.tecnico || ''}</td>
      <td>${i.hallazgos || ''}</td>
      <td>${statusBadge(i.estado || 'pendiente')}</td>
    </tr>`).join('')

  return `
    <div class="db-ph">
      <h1>Inspecciones</h1>
    </div>
    <div class="db-table-wrap">
      <table class="db-table">
        <thead>
          <tr><th>ID</th><th>Equipo</th><th>Fecha</th><th>Técnico</th><th>Hallazgos</th><th>Estado</th></tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--tsoft)">No hay inspecciones</td></tr>'}</tbody>
      </table>
    </div>`
}

function subReportes() {
  const { reportes } = state
  const rows = reportes.lista.map(r => `
    <tr>
      <td><strong>${r.id}</strong></td>
      <td>${r.tipo}</td>
      <td>${r.fecha}</td>
      <td>${r.autor}</td>
      <td>${statusBadge(r.estado)}</td>
      <td><button class="db-btn db-btn-secondary db-btn-sm">
        ${r.estado === 'disponible' ? '📥 Descargar' : 'Ver'}
      </button></td>
    </tr>`).join('')

  return `
    <div class="db-ph">
      <h1>Reportes</h1>
      <div class="db-ph-actions">
        <button class="db-btn db-btn-secondary">📥 Importar</button>
        <button class="db-btn db-btn-primary">+ Generar Reporte</button>
      </div>
    </div>
    <div class="db-cards">
      <div class="db-card db-fade">
        <div class="db-card-title">Reportes Generados</div>
        <div class="db-card-value">${reportes.generados}</div>
      </div>
      <div class="db-card db-fade" style="animation-delay:.06s">
        <div class="db-card-title">Pendientes de Revisión</div>
        <div class="db-card-value" style="color:var(--orange)">${reportes.pendientes}</div>
      </div>
    </div>
    <div class="db-section">
      <div class="db-section-head">
        <h2 class="db-section-title">Reportes Recientes</h2>
      </div>
      <div class="db-table-wrap">
        <table class="db-table">
          <thead>
            <tr><th>ID</th><th>Tipo</th><th>Fecha</th><th>Generado por</th><th>Estado</th><th>Acción</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`
}

const subRenders = {
  dashboard:    subDashboard,
  equipos:      subEquipos,
  inspecciones: subInspecciones,
  reportes:     subReportes
}

// ─── página principal ────────────────────────────────────────

export const dashboardPage = () => ({

  render: () => `
    <div id="db-app">
      ${sidebarView({ activePage: 'dashboard' }).render()}
      <main id="db-main">
        <button id="db-global-toggle" class="db-mobile-toggle" aria-label="Abrir menú">☰</button>
        <div id="db-content"></div>
      </main>
    </div>
  `,

  loadRender: () => {
    let currentPage = 'dashboard'

    const renderPage = (page) => {
      currentPage = page
      const content = document.getElementById('db-content')
      if (!content) return

      content.innerHTML = subRenders[page]?.() ?? subRenders.dashboard()

      // wire sidebar navigation handlers
      try {
        const sb = sidebarView({ activePage: page, onNavigate: renderPage })
        sb.loadRender()
      } catch (e) { /* ignore if sidebar not present */ }

      // Mobile menu toggles (abre/cierra el sidebar) + backdrop + close button
      const sidebar = document.getElementById('db-sidebar')

      // ensure backdrop exists
      let backdrop = document.getElementById('db-backdrop')
      if (!backdrop) {
        backdrop = document.createElement('div')
        backdrop.id = 'db-backdrop'
        document.body.appendChild(backdrop)
      }
      backdrop.onclick = () => {
        sidebar.classList.remove('open')
        backdrop.classList.remove('visible')
      }

      // ensure close button exists inside sidebar
      let closeBtn = sidebar.querySelector('.db-sidebar-close')
      if (!closeBtn) {
        closeBtn = document.createElement('button')
        closeBtn.className = 'db-sidebar-close'
        closeBtn.setAttribute('aria-label', 'Cerrar menú')
        closeBtn.innerText = '✕'
        sidebar.insertBefore(closeBtn, sidebar.firstChild)
      }
      closeBtn.onclick = () => { sidebar.classList.remove('open'); backdrop.classList.remove('visible') }

      const globalToggle = document.getElementById('db-global-toggle')
      if (globalToggle) globalToggle.addEventListener('click', () => {
        const opening = !sidebar.classList.contains('open')
        if (opening) { sidebar.classList.add('open'); backdrop.classList.add('visible') }
        else { sidebar.classList.remove('open'); backdrop.classList.remove('visible') }
      })

      // close sidebar when clicking a sidebar link on mobile
      document.querySelectorAll('#db-sidebar [data-db-page]').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 768) { sidebar.classList.remove('open'); backdrop.classList.remove('visible') }
        })
      })

      document.querySelectorAll('[data-db-page]').forEach(link => {
        link.classList.toggle('active', link.dataset.dbPage === page)
      })

      document.getElementById('db-logout')?.addEventListener('click', () => {
        persistence.clearSession()
        window.location.hash = '#/login'
      })
      document.getElementById('db-see-all')?.addEventListener('click', () => {
        renderPage('inspecciones')
      })
      // Nuevo reporte: abrir modal wizard
      document.getElementById('db-new-report')?.addEventListener('click', () => {
        // insertar modal en el body si aún no existe
        if (!document.getElementById('report-modal')) {
          const container = document.createElement('div')
          container.innerHTML = reportZone({
            onSave: async (data) => {
              try {
                await maintenanceService.createReport(data)
                try { window.alert('Reporte guardado correctamente') } catch (e) {}
                // cerrar modal
                const rz = reportZone({});
                rz.close && rz.close()
              } catch (err) {
                try { window.alert('Error al guardar el reporte') } catch (e) {}
              }
            },
            onCancel: () => {
              const rz = reportZone({});
              rz.close && rz.close()
            }
          }).render()
          // container contiene el markup del modal; agregar al body
          document.body.insertAdjacentHTML('beforeend', container.innerHTML)
          // inicializar handlers
          const rzInst = reportZone({
            onSave: async (data) => {
              try {
                await maintenanceService.createReport(data)
                try { window.alert('Reporte guardado correctamente') } catch (e) {}
                // cerrar
                const modal = document.getElementById('report-modal'); if (modal) modal.classList.add('d-none')
                document.body.style.overflow = ''
              } catch (err) {
                try { window.alert('Error al guardar el reporte') } catch (e) {}
              }
            }
          })
          rzInst.loadRender && rzInst.loadRender()
        }
        // abrir modal y preseleccionar sin id
        const rzOpen = reportZone({ onSave: async (data) => {} })
        rzOpen.loadRender && rzOpen.loadRender()
        try { const modalEl = document.getElementById('report-modal'); if (modalEl && typeof rzOpen.open === 'function') rzOpen.open('') } catch (e) {}
      })

      // Filtrar equipos: toggle input and filter rows
      const setupEquiposFilter = () => {
        const filterBtn = document.getElementById('db-filter-equipos')
        if (!filterBtn) return
        filterBtn.addEventListener('click', () => {
          const header = document.querySelector('.db-ph')
          if (!header) return
          let f = document.getElementById('db-filter-input')
          if (!f) {
            const inp = document.createElement('input')
            inp.id = 'db-filter-input'
            inp.placeholder = 'Filtrar por ID, nombre, ubicación o tipo...'
            inp.style.padding = '8px 10px'; inp.style.borderRadius = '8px'; inp.style.border = '1px solid var(--border)';
            inp.style.fontFamily = "'Nunito',sans-serif"; inp.style.marginTop = '8px'; inp.style.width = '100%';
            header.appendChild(inp)
            inp.addEventListener('input', (e) => {
              const q = (e.target.value || '').toLowerCase().trim()
              const lista = state.equipos.lista.filter(it => {
                return String(it.id || '').toLowerCase().includes(q)
                  || String(it.nombre || '').toLowerCase().includes(q)
                  || String(it.ubicacion || '').toLowerCase().includes(q)
                  || String(it.tipo || '').toLowerCase().includes(q)
              })
              const tbody = document.querySelector('.db-table tbody')
              if (!tbody) return
              tbody.innerHTML = lista.map(e => `
                <tr>
                  <td><strong>${e.id}</strong></td>
                  <td>${e.nombre}</td>
                  <td>${e.ubicacion}</td>
                  <td>${e.tipo}</td>
                  <td>${statusBadge(e.estado)}</td>
                  <td><button class="db-btn db-btn-secondary db-btn-sm">Editar</button></td>
                </tr>`).join('')
            })
            f = inp
          } else {
            // toggle visibility
            f.remove()
          }
        })
      }
      // ejecutar setup de filtro cuando la página es equipos
      if (currentPage === 'equipos') setTimeout(setupEquiposFilter, 60)
    }

    document.querySelectorAll('[data-db-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        renderPage(link.dataset.dbPage)
      })
    })

    // Render inicial y recarga cuando se obtengan datos del backend
    renderPage('dashboard')
    loadZone().then(() => renderPage(currentPage))
  }
})