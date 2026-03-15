import { persistence } from "../util/persistence.js";
import maintenance_service from "../api/maintenance.service.js";
import chat_service from "../api/chat.service.js";
import socket_manager from "../api/socket.js";
import execution_service from "../api/execution.service.js";
import inventory_service from "../api/inventory.service.js";
import ai_service from "../api/ai.service.js";
import sidebarView from "../components/Sidebar.js";
import { reportZone } from "../components/ReportZone.js";

const state = {
  equipment: { total: 0, active: 0, inactive: 0, in_maintenance: 0, list: [] },
  inspections: { total: 0, completed: 0, pending: 0, with_issues: 0, list: [] },
  technicians: { total: 0, active: 0, available: 0, list: [] },
  reports: { generated: 0, pending: 0, list: [], status_summary: {}, total: 0 },
  metrics: { total_tasks: 0, completed: 0, in_progress: 0, avg_duration_minutes: 0, sst_compliance_rate: 0 },
  stock_alerts: [],
  spare_parts_by_type: {},
  zone_not_found: false,
  // Estado de equipos para el mapa
  equipment_states: {} // Estado por puesto
}

const load_zone = async (qrCode = 'SALA3-P1') => {
  try {
    state.zone_not_found = false
    const data = await maintenance_service.get_zone_by_qr(qrCode)
    const assets = data?.activos || []
    state.equipment.list = assets.map(a => ({
      id: a.id_activo ?? a.id ?? a.codigo ?? '',
      name: a.nombre ?? a.descripcion ?? a.tipos_activo?.nombre ?? 'Activo',
      location: data?.info_zona?.nombre ?? a.ubicacion ?? '',
      type: a.tipos_activo?.nombre ?? a.tipo ?? '',
      status: a.estado ?? a.status ?? 'activo'
    }))
    state.equipment.total = state.equipment.list.length
    const counts = state.equipment.list.reduce((acc, it) => { acc[it.status] = (acc[it.status] || 0) + 1; return acc }, {})
    state.equipment.active = counts['activo'] || counts['ok'] || 0
    state.equipment.inactive = counts['inactivo'] || 0
    state.equipment.in_maintenance = counts['mantenimiento'] || 0
  } catch (err) { 
    console.warn('Error cargando zona:', err)
    state.zone_not_found = true
    state.equipment.list = []
    state.equipment.total = 0
  }
}

const statusBadge = (status) => {
  // Normalizar estado
  const statusNormalized = String(status || '').toLowerCase().trim()
  
  const map = {
    activo: ['db-status-ok','● Activo'], inactivo: ['db-status-off','● Inactivo'],
    mantenimiento: ['db-status-pending','⏳ Mantenimiento'], ok: ['db-status-ok',' OK'],
    critico: ['db-status-error','⚠ Crítico'], pendiente: ['db-status-pending','⏳ Pendiente'],
    completada: ['db-status-ok',' Completada'], terminada: ['db-status-ok',' Terminada'],
    progreso: ['db-status-pending','⏳ En Progreso'], 'en proceso': ['db-status-pending','⏳ En Proceso'], 'en ejecución': ['db-status-pending','⏳ En Ejecución'], 
    'ejecución': ['db-status-pending','⏳ En Ejecución'], problema: ['db-status-error','⚠ Problema'], 
    disponible: ['db-status-ok',' Disponible'], revision: ['db-status-pending','⏳ Revisión'], 
    'en_progreso': ['db-status-pending','⏳ En Progreso'],
  }
  const [cls, label] = map[statusNormalized] ?? ['db-status-off', status]
  return `<span class="db-status ${cls}">${label}</span>`
}

let chat_messages = []
const escape_html = (str) => String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s])

const render_message = (msg) => {
  const currentUser = persistence.getUser()
  const isSent = msg.senderEmail === currentUser?.email
  const type = isSent ? 'sent' : 'received'

  const time = msg.createdAt
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
      ">${escape_html(time)}</div>
    </div>
  </div>`
}

function subDashboard() {
  const { equipment, inspections, technicians, metrics, stock_alerts, reports } = state
  return `
    <div class="db-ph">
      <div class="db-ph-actions">
        <button class="db-btn db-btn-secondary" id="db-logout">🔒 Cerrar sesión</button>
      </div>
      <div>
        <h1>Dashboard</h1>
        <p>Bienvenido de vuelta, ${persistence.getUser()?.name || persistence.getUser()?.email || 'Usuario'}</p>
      </div>
    </div>
    
    ${state.zone_not_found ? '<div style="padding:10px 12px;border-radius:8px;background:rgba(220,38,38,0.06);color:var(--danger);margin-bottom:12px;font-weight:700;">Zona no encontrada</div>' : ''}
    
    <!-- Alertas de Stock Bajo -->
    ${stock_alerts.length > 0 ? `
      <div style="
        padding:12px;
        border-radius:8px;
        background:rgba(251,146,60,0.06);
        border-left:4px solid #f97316;
        margin-bottom:16px;
      ">
        <div style="font-weight:700;color:#f97316;margin-bottom:8px;"> ${stock_alerts.length} Repuestos con Stock Bajo</div>
        <div style="font-size:12px;color:var(--tmid);">
          ${stock_alerts.slice(0, 3).map(r => `<div>• ${r.nombre}: ${r.stock_actual}/${r.stock_minimo}</div>`).join('')}
          ${stock_alerts.length > 3 ? `<div style="color:var(--tsoft);">+ ${stock_alerts.length - 3} más</div>` : ''}
        </div>
      </div>
    ` : ''}
    
    <!-- Métricas de Tareas -->
    <div class="db-cards">
      <div class="db-card db-fade">
        <div class="db-card-head"><span class="db-card-title">Tareas Completadas</span></div>
        <div class="db-card-value">${metrics.completed ?? 0}</div>
        <div class="db-card-stat">De ${metrics.total_tasks ?? 0} totales</div>
      </div>
      <div class="db-card db-fade" style="animation-delay:.06s">
        <div class="db-card-head"><span class="db-card-title">En Proceso</span></div>
        <div class="db-card-value" style="color:#f97316">${metrics.in_progress ?? 0}</div>
        <div class="db-card-stat">Tareas activas</div>
      </div>
      <div class="db-card db-fade" style="animation-delay:.12s">
        <div class="db-card-head"><span class="db-card-title">Cumplimiento SST</span></div>
        <div class="db-card-value" style="color:#22c55e">${metrics.sst_compliance_rate ?? 0}%</div>
        <div class="db-card-stat">Protocolo de seguridad</div>
      </div>
   
    </div>`
}

function subEquipment() {
  const { spare_parts_by_type } = state
  const types = Object.keys(spare_parts_by_type)
  
  const tablaHtml = types.length === 0 
    ? `<tr><td colspan="5" style="text-align:center;color:var(--tsoft);padding:10px;"></td></tr>`
    : types.map(type => {
        const datos = spare_parts_by_type[type]
        const spare_parts = datos.repuestos || []
        return spare_parts.map((rep, idx) => `
          <tr style="font-size:12px;">
            <td style="padding:6px 8px;"><strong>${idx === 0 ? type : ''}</strong></td>
            <td style="padding:6px 8px;">${rep.nombre || ''}</td>
            <td style="padding:6px 8px;text-align:center;"><span style="background:${rep.stock <= rep.stock_minimo ? '#fecaca' : '#dcfce7'};padding:4px 8px;border-radius:4px;font-weight:700;">${rep.stock || 0}</span></td>
            <td style="padding:6px 8px;text-align:center;">${rep.stock_minimo || 0}</td>
          </tr>
        `).join('')
      }).join('')
  
  return `
    <div class="db-ph">
      <div><h1>📦 Inventario de Repuestos</h1></div>
    </div>
    <div class="db-cards">
      <div class="db-card db-fade"><div class="db-card-title">Tipos de Repuestos</div><div class="db-card-value">${types.length}</div></div>
      <div class="db-card db-fade" style="animation-delay:.06s"><div class="db-card-title">Total en Stock</div><div class="db-card-value" style="color:#22c55e">${Object.values(spare_parts_by_type).reduce((sum, t) => sum + (t.cantidad_total || 0), 0)}</div></div>
      <div class="db-card db-fade" style="animation-delay:.12s"><div class="db-card-title">Stock Bajo</div><div class="db-card-value" style="color:#f97316">${Object.values(spare_parts_by_type).reduce((sum, t) => sum + (t.repuestos || []).filter(r => r.stock <= r.stock_minimo).length, 0)}</div></div>
    </div>
    <div class="db-section"><div class="db-section-head"><h2 class="db-section-title">Repuestos por Categoría</h2></div>
      <div class="db-table-wrap"><table class="db-table"><thead><tr><th>Categoría</th><th>Nombre</th><th>Stock Actual</th><th>Stock Mínimo</th></tr></thead><tbody>${tablaHtml}</tbody></table></div>
    </div>`
}

// Mapa solo lectura
function ro(tag, label) {
  return `<div class="p sg" data-map-id="${tag}" style="cursor:default;pointer-events:none;"><div class="plbl-in" style="pointer-events:none;">${label}</div></div>`
}

function subMap() {
  return `
    <div class="db-ph">
      <div class="db-ph-actions"></div>
      <div>
        <h1>🗺️ Mapa de Sala</h1>
        <span style="font-size:13px;color:var(--tsoft);font-weight:600">Solo lectura — Sala 3, Piso 1</span>
      </div>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;background:var(--card);border:1.5px solid var(--border);border-radius:10px;padding:8px 14px;">
        <div style="width:18px;height:18px;border-radius:5px;background:#9CA3AF;flex-shrink:0;"></div>
        <span style="font-size:13px;font-weight:700;color:var(--tmid)">Sin novedad</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;background:var(--card);border:1.5px solid var(--border);border-radius:10px;padding:8px 14px;">
        <div style="width:18px;height:18px;border-radius:5px;background:#F97316;flex-shrink:0;"></div>
        <span style="font-size:13px;font-weight:700;color:var(--tmid)">Daño reportado</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;background:var(--card);border:1.5px solid var(--border);border-radius:10px;padding:8px 14px;">
        <div style="width:18px;height:18px;border-radius:5px;background:#3B82F6;flex-shrink:0;"></div>
        <span style="font-size:13px;font-weight:700;color:var(--tmid)">En reparación</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;background:var(--card);border:1.5px solid var(--border);border-radius:10px;padding:8px 14px;">
        <div style="width:18px;height:18px;border-radius:5px;background:#22C55E;flex-shrink:0;"></div>
        <span style="font-size:13px;font-weight:700;color:var(--tmid)">Reparado </span>
      </div>
    </div>

    <div class="db-section" style="padding:0;">
      <div class="map-outer" style="pointer-events:none;user-select:none;">
        <div class="map-hdr"><div class="map-title">Sala 3 — Piso 1</div></div>
        <div class="map-body">
          <div class="pasillo">— PASILLO CENTRAL —</div>
          <div class="tl-row"><div class="tl-wrap">
            <div class="tl-lbl">Puesto TL</div>
            <div class="p-tl sg" data-map-id="TL" style="cursor:default;"><div class="tlbl" style="pointer-events:none;">TL</div></div>
          </div></div>
          <div class="bloques">
            <div class="bloque">
              <div class="fan sg" data-map-id="V1"><div class="fan-lbl" style="pointer-events:none;">V1</div></div>
              <div class="mesa"><div class="prow">${ro('A-P4','P4')} ${ro('A-P3','P3')} ${ro('A-P2','P2')} ${ro('A-P1','P1')}</div></div>
              <div class="mesa"><div class="prow">${ro('B-P4','P4')} ${ro('B-P3','P3')} ${ro('B-P2','P2')} ${ro('B-P1','P1')}</div></div>
              <div class="mesa"><div class="prow">${ro('C-P4','P4')} ${ro('C-P3','P3')} ${ro('C-P2','P2')} ${ro('C-P1','P1')}</div></div>
              <div class="mesa"><div class="prow">${ro('D-P4','P4')} ${ro('D-P3','P3')} ${ro('D-P2','P2')} ${ro('D-P1','P1')}</div></div>
              <div class="mesa"><div class="prow">${ro('E-P2','P2')} ${ro('E-P1','P1')}</div></div>
              <div class="fan sg" data-map-id="V2"><div class="fan-lbl" style="pointer-events:none;">V2</div></div>
            </div>
            <div class="divider"></div>
            <div class="bloque">
              <div class="fan sg" data-map-id="V3"><div class="fan-lbl" style="pointer-events:none;">V3</div></div>
              <div class="mesa"><div class="prow">${ro('F-P1','P1')} ${ro('F-P2','P2')} ${ro('F-P3','P3')} ${ro('F-P4','P4')}</div></div>
              <div class="mesa"><div class="prow">${ro('G-P1','P1')} ${ro('G-P2','P2')} ${ro('G-P3','P3')} ${ro('G-P4','P4')}</div></div>
              <div class="mesa"><div class="prow">${ro('H-P1','P1')} ${ro('H-P2','P2')} ${ro('H-P3','P3')} ${ro('H-P4','P4')}</div></div>
              <div class="mesa"><div class="prow">${ro('I-P1','P1')} ${ro('I-P2','P2')} ${ro('I-P3','P3')}</div></div>
              <div class="mesa"><div class="prow">${ro('J-P1','P1')} ${ro('J-P2','P2')} ${ro('J-P3','P3')}</div></div>
              <div class="fan sg" data-map-id="V4"><div class="fan-lbl" style="pointer-events:none;">V4</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>`
}

function subReports() {
  const { reports } = state
  const rows = reports.list.map(r => `<tr><td><strong>${r.id}</strong></td><td>${r.description}</td><td>${r.date}</td><td>Antonio</td><td>${statusBadge(r.status)}</td></tr>`).join('')
  
  // Tarjeta de total reportes
  const totalCard = `<div class="db-card db-fade"><div class="db-card-title">Total Reportes</div><div class="db-card-value">${reports.list?.length || 0}</div></div>`;
  
  // Tarjetas por estado
  const statusCards = Object.entries(reports.status_summary || {}).map(([ status, count ], idx) => {
    const colors = {
      'Pendiente': 'var(--orange)',
      'En Ejecución': 'var(--blue)',
      'Completado': 'var(--green)',
      'Cancelado': 'var(--red)'
    };
    const color = colors[status] || 'var(--primary)';
    return `<div class="db-card db-fade" style="animation-delay:${idx * 0.06}s"><div class="db-card-title">${status}</div><div class="db-card-value" style="color:${color}">${count}</div></div>`;
  }).join('');
  
  return `
    
    <div class="db-cards">
      ${totalCard}
      ${statusCards}
    </div>
    <div class="db-section"><div class="db-section-head"><h2 class="db-section-title">Reportes Recientes</h2></div>
      <div class="db-table-wrap"><table class="db-table"><thead><tr><th>ID</th><th>Descripción</th><th>Fecha</th><th>Generado por</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>`
}

function subCleaning() {
  return `
    <div class="db-ph">
      <div class="db-ph-actions"></div>
      <div>
        <h1>🧹 Registro de Aseo</h1>
        <span style="font-size:13px;color:var(--tsoft);font-weight:600">Registros recientes de limpieza</span>
      </div>
    </div>

    <div class="db-section">
      <div class="db-section-head"><h2 class="db-section-title">Registros</h2></div>
      <div id="db-cleaning-list" class="db-table-wrap" style="max-height:420px;overflow:auto;padding:12px;background:var(--card);border:1.5px solid var(--border);border-radius:10px;">
        <div style="color:var(--tsoft);padding:16px;text-align:center">Cargando registros de aseo...</div>
      </div>
    </div>`
}

function subChat() {
  return `
    <div class="db-ph">
      <div class="db-ph-actions"></div>
      <div>
        <h1>💬 Chat</h1>
        <div class="rc-chat-status online" style="font-size:13px;font-weight:700">● En línea — Ing. Don Antonio</div>
      </div>
    </div>
    <div class="rc-chat-wrap db-chat-wrap" style="display:flex;flex-direction:column;background:var(--bg);border-radius:16px;border:1.5px solid var(--border);overflow:hidden;height:calc(100vh - 160px);">
      <div class="rc-chat-header" style="flex-shrink:0;padding:12px 16px;border-bottom:1px solid var(--border);">
        <div class="rc-chat-title">Canal de Supervisión</div>
        <div class="rc-chat-status online">● En línea — Antonio</div>
      </div>
      <div class="rc-messages" id="db-chat-messages" role="log" aria-live="polite" aria-atomic="false"
        style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;">
        <div style="text-align:center;padding:20px;color:var(--tsoft);">Cargando mensajes...</div>
      </div>
      <div class="rc-chat-input-area" style="flex-shrink:0;padding:12px 16px;border-top:1px solid var(--border);">
        <div class="rc-chat-form">
          <input class="rc-chat-input" id="db-chat-input" type="text" placeholder="Escribe un mensaje...">
          <button class="rc-chat-send" id="db-chat-send">➤</button>
        </div>
      </div>
    </div>`
}

const subRenders = {
  dashboard:    subDashboard,
  equipment:    subEquipment,
  inspections:  subMap,
  reports:      subReports,
  chat:         subChat,
  'home-cleaner': subCleaning
}

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
    let isLoadingPage = false // Evita cargas en paralelo
    let lastPageLoad = 0

const load_map_states = async () => {
      try {
        console.log('[Mapa] Iniciando carga de estados...')
        const response = await maintenance_service.get_zone_by_qr(encodeURIComponent('SALA3-P1'))
        const assets = response.activos || []
        console.log('[Map] Assets received from backend:', assets)
        
        // IDs disponibles en el DOM
        const elementosEnMapa = document.querySelectorAll('[data-map-id]')
        console.log('[Mapa] Elementos disponibles en DOM:', Array.from(elementosEnMapa).map(e => e.getAttribute('data-map-id')))
        
        const class_state = { 'Gris': 'sg', 'Naranja': 'so', 'Azul': 'sb', 'Verde': 'sv' }
        
        // Cargar estados guardados
        let states_ls = {}
        try {
          states_ls = JSON.parse(localStorage.getItem('mapEstados') || '{}')
          console.log('[Mapa] 📦 Estados cargados desde localStorage:', states_ls)
        } catch (lsErr) {
          console.warn('[Mapa] Error leyendo localStorage:', lsErr)
        }
        
        // Inicializar cache sin pisar cambios recientes
        assets.forEach(asset => {
          if (!state.equipment_states[asset.etiqueta]) {
            // Prioridad: localStorage sobre BD
            state.equipment_states[asset.etiqueta] = states_ls[asset.etiqueta] || asset.estado
            console.log(`[Map] 💾 Initializing cache: ${asset.etiqueta} = ${state.equipment_states[asset.etiqueta]} (LS: ${states_ls[asset.etiqueta]}, DB: ${asset.estado})`)
          }
        })
        
        assets.forEach(asset => {
          console.log(`[Map] Processing asset:`, {
            etiqueta: asset.etiqueta,
            codigo: asset.codigo,
            nombre: asset.nombre,
            id: asset.id_activo,
            estado: asset.estado
          })
          
          // Estado final: localStorage > cache > BD
          const state_ls_item = states_ls[asset.etiqueta]
          const state_cache = state.equipment_states[asset.etiqueta]
          const state_final = state_ls_item || state_cache || asset.estado
          console.log(`[Mapa] Estado para ${asset.etiqueta}: LS="${state_ls_item}" | Cache="${state_cache}" | BD="${asset.estado}" → Usando="${state_final}"`)
          
          // Buscar por etiqueta
          let selector = `[data-map-id="${asset.etiqueta}"]`
          let el = document.querySelector(selector)
          console.log(`[Mapa] Intentando con etiqueta "${asset.etiqueta}": ${!!el}`)
          
          // Si no aparece, buscar por codigo
          if (!el && asset.codigo) {
            selector = `[data-map-id="${asset.codigo}"]`
            el = document.querySelector(selector)
            console.log(`[Mapa] Intentando con codigo "${asset.codigo}": ${!!el}`)
          }
          
          if (el) {
            const previous_class = el.className
            el.classList.remove('sg', 'so', 'sb', 'sv')
            const new_class = class_state[state_final] || 'sg'
            el.classList.add(new_class)
            console.log(`[Mapa] ✅ ${asset.etiqueta || asset.codigo}: "${previous_class}" → "${el.className}"`)
            
            const issues = asset.fallos_activos?.length ? asset.fallos_activos.join(', ') : 'Sin fallos'
            el.setAttribute('title', `${asset.etiqueta} — ${state_final} | ${issues}`)
          } else {
            console.warn(`[Mapa]  No encontrado: etiqueta=${asset.etiqueta}, codigo=${asset.codigo}`)
          }
        })
        console.log('[Mapa] Carga completada - Cache:', state.equipment_states, 'localStorage:', states_ls)
      } catch (err) { 
        console.error('[Mapa] Error cargando estados:', err) 
      }
    }

    // Cargar metricas
    const load_metrics = async () => {
      try {
        const metricas = await execution_service.get_performance_metrics()
        // Mapear nombres del backend al estado local
        state.metrics = {
          total_tasks: metricas.total_tareas || 0,
          completed: metricas.completadas || 0,
          in_progress: metricas.en_proceso || 0,
          avg_duration_minutes: metricas.promedio_duracion_minutos || 0,
          sst_compliance_rate: metricas.tasa_cumplimiento_sst || 0
        }
        console.log('[Dashboard] Métricas mapeadas:', state.metrics)
        // Re-render en dashboard
        if (currentPage === 'dashboard') {
          const content = document.getElementById('db-content')
          if (content) content.innerHTML = subRenders.dashboard()
        }
      } catch (err) { 
        console.warn('[Dashboard] Error cargando métricas:', err)
      }
    }

    // Cargar alertas de stock
    const load_stock_alerts = async () => {
      try {
        const alertas = await inventory_service.get_low_stock_alerts()
        state.alertas_stock = alertas
        console.log('[Dashboard] Alertas de stock:', alertas.length)
        // Re-render en dashboard
        if (currentPage === 'dashboard') {
          const content = document.getElementById('db-content')
          if (content) content.innerHTML = subRenders.dashboard()
        }
      } catch (err) { 
        console.warn('[Dashboard] Error cargando alertas:', err)
      }
    }

    // Cargar inspecciones recientes
    const load_inspections = async () => {
      try {
        const data = await maintenance_service.get_recent_inspections(10)
        state.inspections.list = data.inspections || []
        console.log('[Dashboard] Inspecciones cargadas:', state.inspections.list.length)
      } catch (err) {
        console.warn('[Dashboard] Error cargando inspecciones:', err)
      }
    }

    // Cargar reportes recientes
    const load_reports = async () => {
      try {
        const data = await maintenance_service.get_recent_reports(15)
        console.log('[Dashboard] Raw data from backend:', JSON.stringify(data, null, 2))
        
        // Normalizar campos del backend
        state.reports.list = (data.reportes || []).map(r => ({
          id: r.id,
          description: r.descripcion,
          date: r.fecha,
          generatedBy: r.generadoPor || 'Antonio',
          status: r.estado
        }))
        state.reports.status_summary = data.resumen_estados || {}
        state.reports.total = data.total || 0
        console.log('[Dashboard] Reportes mapeados:', state.reports.list.length)
        console.log('[Dashboard] ResumenEstados:', state.reports.status_summary)
        console.log('[Dashboard] Reportes cargados:', state.reports.list.length, 'Estados:', Object.keys(state.reports.status_summary).join(', '))
      } catch (err) {
        console.warn('[Dashboard] Error cargando reportes:', err)
      }
    }

    // Cargar repuestos por tipo
    const load_spare_parts = async () => {
      try {
        const data = await inventory_service.get_spare_parts_grouped_by_type()
        state.spare_parts_by_type = data
        console.log('[Dashboard] Repuestos agrupados cargados')
      } catch (err) {
        console.warn('[Dashboard] Error cargando repuestos agrupados:', err)
      }
    }

    // Actualiza un equipo sin recargar todo el mapa
    const update_equipment_on_map = (tag, new_status) => {
      try {
        // Validar entrada
        if (!tag || !String(tag).trim()) {
          console.error('[Mapa] Error: etiqueta vacía o inválida')
          return
        }
        
        // Mapa de estado a clase de color
        const class_to_color = { 
          'Gris': 'sg', 
          'Naranja': 'so', 
          'Azul': 'sb', 
          'Verde': 'sv',
          'sg': 'sg',
          'so': 'so', 
          'sb': 'sb', 
          'sv': 'sv'
        }
        const color_class = class_to_color[new_status] || 'sg'
        
        // Guardar en cache y localStorage
        state.equipment_states[tag] = new_status
        try {
          const states_ls = JSON.parse(localStorage.getItem('mapEstados') || '{}')
          states_ls[tag] = new_status
          localStorage.setItem('mapEstados', JSON.stringify(states_ls))
          console.log(`[Mapa] 💾 Estado guardado en localStorage: ${tag} → ${new_status} (JSON: ${JSON.stringify(states_ls).substring(0, 100)})`)
        } catch (lsErr) {
          console.warn('[Mapa] No se pudo guardar en localStorage:', lsErr)
        }
        
        // Buscar elemento en el mapa
        let selector = `[data-map-id="${tag}"]`
        let el = document.querySelector(selector)
        console.log(`[Mapa] 🔍 Buscando elemento: selector="${selector}" → encontrado=${!!el}`)
        
        if (el) {
          // Quitar clases anteriores
          const previous_classes = el.className
          el.classList.remove('sg', 'so', 'sb', 'sv')
          // Agregar clase nueva
          el.classList.add(color_class)
          console.log(`[Mapa] ✅ Equipo ${tag} actualizado a ${new_status} (${color_class}) | Antes: "${previous_classes}" → Después: "${el.className}"`)
          
          // Forzar repintado
          el.style.transition = 'all 0.3s ease'
          el.offsetHeight // Reflow
        } else {
          console.warn(`[Mapa]  Elemento ${tag} no encontrado en el DOM para selector "${selector}". Reintentando en 500ms...`)
          // Reintento por si el mapa sigue renderizando
          setTimeout(() => {
            let elRetry = document.querySelector(selector)
            if (elRetry) {
              elRetry.classList.remove('sg', 'so', 'sb', 'sv')
              elRetry.classList.add(color_class)
              console.log(`[Mapa] ✅ Reintento exitoso: ${tag} → ${color_class}`)
            } else {
              console.warn(`[Mapa]  Elemento ${tag} aún no disponible después del reintento. Probablemente la pestaña "Inspecciones" no está visible actualmente.`)
              // Mostrar elementos disponibles
              const allMapElements = document.querySelectorAll('[data-map-id]')
              const availableIds = Array.from(allMapElements).map(e => e.dataset.mapId)
              console.log(`[Mapa] ℹ️ Elementos disponibles en el mapa (${availableIds.length}):`, availableIds)
            }
          }, 500)
        }
      } catch (err) {
        console.error('[Mapa] Error actualizando equipo:', err)
      }
    }

    // Limpiar estado local de un equipo
    const clear_equipment_state = (etiqueta) => {
      try {
        // Limpiar cache local
        delete state.equipment_states[etiqueta]
        
        // Limpiar localStorage
        const states_ls = JSON.parse(localStorage.getItem('mapEstados') || '{}')
        delete states_ls[etiqueta]
        localStorage.setItem('mapEstados', JSON.stringify(states_ls))
        
        console.log(`[Mapa] 🗑️ Estado limpiado para ${etiqueta} (volverá a leer desde BD)`)
        
        // Recargar desde BD
        load_map_states()
      } catch (err) {
        console.error('[Mapa] Error limpiando estado:', err)
      }
    }

    // Cargar registros de aseo (sin throttle)
    const load_cleaning_records = async () => {
      try {
        const resp = await fetch('http://localhost:4000/api/cleanings')
        if (!resp.ok) throw new Error('fetch failed')
        const registros = await resp.json()
        const container = document.getElementById('db-cleaning-list')
        if (!container) return

        const user = (typeof persistence !== 'undefined') ? persistence.getUser() : null
        const isAdmin = user && (user.rol === 'ADMIN' || user.role === 'ADMIN' || user.isAdmin || user.admin)

        let filtered = Array.isArray(registros) ? registros.slice() : []
        if (!isAdmin && user) {
          filtered = filtered.filter(r => {
            return (r.user_email && user.email && r.user_email === user.email) || (r.user_name && user.name && r.user_name === user.name) || (r.user && user.email && r.user === user.email) || (r.user_id && user.id && String(r.user_id) === String(user.id))
          })
        }

        if (!Array.isArray(filtered) || filtered.length === 0) {
          const msg = isAdmin ? 'No hay registros de aseo.' : 'No hay registros de aseo para el usuario actual'
          container.innerHTML = `<div style="color:var(--tsoft);padding:12px;text-align:center">${msg}</div>`
          return
        }
        const rows = filtered.slice().sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)).map(r => {
          const who = r.user_name || r.user || r.user_email || '—'
          const zone = r.zone_id || r.zone || r.zone_name || r.zona || r.zone_label || r.zoneId || '—'
          const when = r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }) + ' · ' + new Date(r.createdAt).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' }) : (r.created_at || '—')
          const desc = r.descriptions || r.description || r.desc || r.detalle || r.notes || r.observacion || ''
          
          let start_time = r.hora_inicio || r.start_time || r.startTime || r.inicio || r.start || ''
          let end_time = r.hora_fin || r.end_time || r.endTime || r.fin || r.end || ''
          
          if (!start_time && r.createdAt) {
            start_time = new Date(r.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })
          }
          if (!end_time && r.createdAt) {
            end_time = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })
          }
          
          return `
            <div style="padding:12px;border-bottom:1px solid var(--border);background:var(--card-bg);">
              <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;margin-bottom:8px;">
                <div style="font-weight:700;font-size:14px;color:var(--primary)">${escape_html(String(zone))}</div>
                <div style="font-size:11px;color:var(--tsoft);white-space:nowrap">${escape_html(when)}</div>
              </div>
              <div style="display:flex;gap:16px;font-size:13px;margin-bottom:6px;">
                <div><span style="color:var(--tsoft)">🕐 Inicio:</span> <strong>${escape_html(start_time) || '—'}</strong></div>
                <div><span style="color:var(--tsoft)">🕑 Fin:</span> <strong>${escape_html(end_time) || '—'}</strong></div>
              </div>
              <div style="font-size:12px;color:var(--tmid)">${escape_html(String(who))} ${desc ? '— ' + escape_html(String(desc)) : ''}</div>
            </div>`
        }).join('')

        const headerHtml = `<div style="font-size:13px;color:var(--tsoft);margin-bottom:10px">Mostrando ${filtered.length} registros${isAdmin ? ' (todos)' : ''}</div>`
        container.innerHTML = headerHtml + `<div>${rows}</div>`
      } catch (err) {
        console.error('[Dashboard Aseo] Error cargando registros:', err)
        const container = document.getElementById('db-aseo-list')
        if (container) container.innerHTML = '<div style="color:var(--tsoft);padding:12px;text-align:center">No se pudieron cargar los registros</div>'
      }
    }

    // Exponer helper global
    window.load_cleaning_records_global = (forceUpdate = false) => {
      console.log('[Dashboard] Actualizando registros de aseo' + (forceUpdate ? ' (bypass throttle)' : ''))
      load_cleaning_records()
    }

    // Actualizar badge de chat
    const update_dashboard_chat_badge = () => {
      try {
        const count = parseInt(localStorage.getItem('dashboard_chat_notifications') || '0', 10) || 0
        const chatLink = document.querySelector('[data-db-page="chat"]')
        if (!chatLink) return
        
        // Quitar badge anterior
        const oldBadge = chatLink.querySelector('.db-notif-badge')
        if (oldBadge) oldBadge.remove()
        
        // Crear badge si hay pendientes
        if (count > 0) {
          const badge = document.createElement('span')
          badge.className = 'db-notif-badge'
          badge.textContent = count > 99 ? '99+' : String(count)
          chatLink.appendChild(badge)
        }
      } catch (err) {
        console.error('[Dashboard] Error actualizando badge:', err)
      }
    }

    const render_page = async (page) => {
      // Evita cargas simultaneas
      if (isLoadingPage) {
        console.log('[Dashboard] Ya hay una carga en progreso, ignorando', page)
        return
      }

      const now = Date.now()
      // Aplica throttle solo si es la misma pagina
      if (page === currentPage && now - lastPageLoad < 500) {
        console.log('[Dashboard] Demasiadas peticiones rápido para la misma página, ignorando', page)
        return
      }

      isLoadingPage = true
      lastPageLoad = now

      try {
        currentPage = page
        const content = document.getElementById('db-content')
        if (!content) return

        // Cargar datos segun pagina
        if (page === 'dashboard') {
          await Promise.all([load_metrics(), load_stock_alerts(), load_inspections(), load_spare_parts()])
        } else if (page === 'equipment') {
          await load_spare_parts()
        } else if (page === 'reports') {
          await load_reports()
        }

        content.innerHTML = subRenders[page]?.() ?? subRenders.dashboard()

        // Si estamos en inspecciones, cargar estados del mapa
        if (page === 'inspections') {
          setTimeout(() => {
            console.log('[Dashboard] Renderizado completado, cargando estados del mapa...')
            load_map_states()
          }, 100)
        }

        try { sidebarView({ activePage: page, onNavigate: render_page }).loadRender() } catch (e) {}
        update_dashboard_chat_badge()

        const sidebar = document.getElementById('db-sidebar')
        let backdrop = document.getElementById('db-backdrop')
        if (!backdrop) {
          backdrop = document.createElement('div')
          backdrop.id = 'db-backdrop'
          document.body.appendChild(backdrop)
        }

        const setSidebarOpen = (open) => {
          if (!sidebar || !backdrop) return
          sidebar.classList.toggle('open', open)
          backdrop.classList.toggle('visible', open)
          document.body.style.overflow = open ? 'hidden' : ''
          globalToggle?.setAttribute('aria-expanded', String(open))
        }

        backdrop.onclick = () => setSidebarOpen(false)

        let closeBtn = sidebar.querySelector('.db-sidebar-close')
        if (!closeBtn) {
          closeBtn = document.createElement('button')
          closeBtn.className = 'db-sidebar-close'
          closeBtn.setAttribute('aria-label', 'Cerrar menú')
          closeBtn.innerText = '✕'
          sidebar.insertBefore(closeBtn, sidebar.firstChild)
        }
        closeBtn.onclick = () => setSidebarOpen(false)

        const globalToggle = document.getElementById('db-global-toggle')
        if (globalToggle) {
          globalToggle.setAttribute('aria-controls', 'db-sidebar')
          globalToggle.setAttribute('aria-expanded', 'false')
          if (!globalToggle.dataset.dbToggleBound) {
            globalToggle.addEventListener('click', (e) => { e.stopPropagation(); setSidebarOpen(!sidebar.classList.contains('open')) })
            globalToggle.dataset.dbToggleBound = '1'
          }
        }

        document.querySelectorAll('#db-sidebar [data-db-page]').forEach(link => {
          link.addEventListener('click', () => { if (window.innerWidth <= 768) setSidebarOpen(false) })
        })
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setSidebarOpen(false) })
        window.addEventListener('resize', () => { if (window.innerWidth > 768) setSidebarOpen(false) })

        document.querySelectorAll('[data-db-page]').forEach(link => {
          link.classList.toggle('active', link.dataset.dbPage === page)
        })

        document.getElementById('db-logout')?.addEventListener('click', () => {
          persistence.clearSession(); window.location.hash = '#/login'
        })
        document.getElementById('db-see-all')?.addEventListener('click', () => render_page('inspections'))

        if (currentPage === 'equipment') {
          const filterBtn = document.getElementById('db-filter-equipment')
          if (!filterBtn) return
          filterBtn.addEventListener('click', () => {
            const header = document.querySelector('.db-ph')
            if (!header) return
            let f = document.getElementById('db-filter-input')
            if (!f) {
              const inp = document.createElement('input')
              inp.id = 'db-filter-input'
              inp.placeholder = 'Filtrar por ID, nombre, ubicación o tipo...'
              inp.style.cssText = 'padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-family:Nunito,sans-serif;margin-top:8px;width:100%'
              header.appendChild(inp)
              inp.addEventListener('input', (e) => {
                const q = (e.target.value || '').toLowerCase().trim()
                const lista = state.equipos.lista.filter(it => String(it.id||'').toLowerCase().includes(q) || String(it.nombre||'').toLowerCase().includes(q) || String(it.ubicacion||'').toLowerCase().includes(q) || String(it.tipo||'').toLowerCase().includes(q))
                const tbody = document.querySelector('.db-table tbody')
                if (!tbody) return
                tbody.innerHTML = lista.map(e => `<tr><td><strong>${e.id}</strong></td><td>${e.nombre}</td><td>${e.ubicacion}</td><td>${e.tipo}</td><td>${statusBadge(e.estado)}</td><td><button class="db-btn db-btn-secondary db-btn-sm">Editar</button></td></tr>`).join('')
              })
            } else { f.remove() }
          })
        }

        // En aseo, cargar registros
        if (page === 'home-cleaner') load_cleaning_records()

        // Chat en tiempo real
        if (page === 'chat') {
          // Limpiar notificaciones al entrar al chat
          localStorage.setItem('dashboard_chat_notifications', '0')
          update_dashboard_chat_badge()
          
          if (window.__dashboardChat_interval) clearInterval(window.__dashboardChat_interval)
          const input = document.getElementById('db-chat-input')
          const sendBtn = document.getElementById('db-chat-send')
          const container = document.getElementById('db-chat-messages')
          const statusDiv = document.querySelector('.rc-chat-status')
          
          if (input && sendBtn && container) {
            const load_chat_history = async () => {
              try {
                const messages = await chat_service.get_messages('DASHBOARD', 50, 0)
                chat_messages = messages
                container.innerHTML = messages.length === 0 ? '<div style="text-align:center;padding:20px;color:var(--tsoft);">Sin mensajes</div>' : messages.map(render_message).join('')
                container.scrollTop = container.scrollHeight
              } catch (err) { console.error('[Dashboard Chat] Error cargando histórico:', err) }
            }
            

            
            // Conectar socket
            socket_manager.connect('DASHBOARD').then(() => {
              console.log('[Dashboard Chat] WebSocket conectado')
              
              // Estado de conexion
              socket_manager.on_connection_change((is_connected) => {
                if (statusDiv) {
                  if (is_connected) {
                    statusDiv.textContent = '● En línea — Antonio'
                  } else {
                    statusDiv.textContent = '● Desconectado'
                  }
                }
              })
              
              // Mensajes en tiempo real
              socket_manager.on_message((msg) => {
                console.log('[Dashboard Chat] Nuevo mensaje:', msg.senderName, '-', msg.message)
                // Evitar duplicados
                if (chat_messages.find(m => m._id === msg._id)) {
                  console.log('[Dashboard Chat] Mensaje duplicado, ignorando')
                  return
                }
                chat_messages.push(msg)
                const html = render_message(msg)
                if (container.textContent.includes('Sin mensajes')) {
                  container.innerHTML = html
                } else {
                  container.insertAdjacentHTML('beforeend', html)
                }
                container.scrollTop = container.scrollHeight
                
                // Sumar notificaciones fuera de la vista chat
                if (currentPage !== 'chat') {
                  try {
                    const currentCount = parseInt(localStorage.getItem('dashboard_chat_notifications') || '0', 10) || 0
                    const newCount = currentCount + 1
                    localStorage.setItem('dashboard_chat_notifications', String(newCount))
                    console.log('[Dashboard Chat] Notificación incrementada a:', newCount)
                    // Refrescar badge
                    update_dashboard_chat_badge()
                  } catch (err) {
                    console.error('[Dashboard Chat] Error actualizando notificaciones:', err)
                  }
                }
              })
              
              // Confirmacion de envio
              socket_manager.on_message_sent((data) => {
                console.log('[Dashboard Chat]  Mensaje confirmado en servidor', data.messageId)
              })
              
              socket_manager.on_message_error((data) => {
                console.error('[Dashboard Chat]  Error al enviar:', data.error)
                alert('Error al enviar el mensaje: ' + data.error)
                input.focus()
              })
              
              // Cargar historial
              load_chat_history()
            }).catch(err => {
              console.error('[Dashboard Chat] Error conectando:', err)
              container.innerHTML = '<div style="text-align:center;padding:20px;color:#f00;">Error conectando al chat</div>'
            })
            
            const enviar = () => {
              const texto = input.value.trim()
              if (!texto) return
              
              // Validar conexion
              if (!socket_manager.is_connected()) {
                alert('No estás conectado. Intenta recargar la página.')
                return
              }
              
              const currentUser = persistence.getUser()
              socket_manager.send_message({
                message: texto,
                sender: 'DASHBOARD',
                senderName: currentUser?.name || 'Admin',
                senderEmail: currentUser?.email || 'admin@mail.com',
                role: currentUser?.rol || 'ADMIN',
                recipient: 'HOME'
              })
              input.value = ''
              input.focus()
            }
            
            sendBtn.onclick = enviar
            input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); enviar() } }
          }
        }
      } catch (err) {
        console.error('[Dashboard renderPage] Error:', err)
      } finally {
        isLoadingPage = false
      }
    }

    document.querySelectorAll('[data-db-page]').forEach(link => {
      link.addEventListener('click', (e) => { e.preventDefault(); render_page(link.dataset.dbPage) })
    })

    // Conectar socket para cambios de estado
    socket_manager.connect('DASHBOARD').then(() => {
      console.log('[Dashboard]  WebSocket conectado para sincronización en tiempo real')
      
      // Escuchar cambios de otros usuarios
      socket_manager.on_task_status_change((data) => {
        console.log('[Dashboard] 📡 Cambio de estado recibido por socket:', data)
        // Reemitir evento local para actualizar mapa
        window.dispatchEvent(new CustomEvent('task:status:changed', { 
          detail: data
        }))
        console.log('[Dashboard]  Evento task:status:changed emitido localmente')
      })

      // Al completar tarea, recargar mapa
      socket_manager.on_task_completed((data) => {
        console.log('[Dashboard] ✅ Tarea completada recibida - Recargando mapa completo:', data)
        if ((currentPage === 'dashboard' || currentPage === 'inspections') && data.reloadMap) {
          load_map_states()
        }
      })
      
      // Al reportar novedad
      socket_manager.get_socket()?.on('report-created', (data) => {
        console.log('[Dashboard] 🚨 Novedad reportada recibida por socket:', data)
        if (data.etiqueta) {
          console.log(`[Dashboard] Validando etiqueta recibida: "${data.etiqueta}" (tipo: ${typeof data.etiqueta})`)
          
          // Mantener localStorage y limpiar solo cache local
          delete state.equipment_states[data.etiqueta]
          console.log(`[Dashboard] 🗑️ Cache local limpiado para ${data.etiqueta}`)
          
          // Pasar a Naranja de inmediato
          console.log(`[Dashboard] Actualizando mapa: ${data.etiqueta} → Naranja (Novedad Reportada)`)
          update_equipment_on_map(data.etiqueta, 'Naranja')
          
          // Revalidar con BD en 1s
          setTimeout(() => {
            console.log('[Dashboard] Recargando mapa después de reportar novedad')
            load_map_states()
          }, 1000)
        } else {
          console.warn('[Dashboard]  Evento report-created sin etiqueta:', data)
        }
      })

      // Nuevo registro de aseo
      socket_manager.get_socket()?.on('cleaning-created', (data) => {
        console.log('[Dashboard] 🧹 Nuevo registro de aseo recibido por socket:', data)
        if (currentPage === 'home-cleaner') {
          console.log('[Dashboard]  Actualizando registros de aseo en tiempo real')
          load_cleaning_records()
        }
      })
      
      // Nuevo reporte de mantenimiento
      socket_manager.get_socket()?.on('report-created', (data) => {
        console.log('[Dashboard] 🚨 Nuevo reporte recibido por socket:', data)
        if (data?.etiqueta) {
          try {
            console.log(`[Dashboard] Validando etiqueta recibida: "${data.etiqueta}"`)
            // Actualizar a Naranja
            update_equipment_on_map(data.etiqueta, 'Naranja')

            // Recargar reportes y vista
            load_reports().then(() => {
              const content = document.getElementById('db-content')
              if (content && (currentPage === 'reports' || currentPage === 'dashboard')) {
                content.innerHTML = subRenders[currentPage]?.() ?? subRenders.dashboard()
              }
            }).catch(err => console.error('[Dashboard] Error recargando reportes tras evento socket:', err))

            // Revalidar mapa en 1s
            setTimeout(() => {
              console.log('[Dashboard] Recargando mapa después de nuevo reporte')
              load_map_states()
            }, 1000)
          } catch (err) {
            console.error('[Dashboard] Error procesando report-created:', err)
          }
        } else {
          console.warn('[Dashboard] report-created sin etiqueta:', data)
        }
      })

      console.log('[Dashboard]  Listeners de socket establecidos')
      // Handler global de mensajes para badge
      socket_manager.on_message((msg) => {
        try {
          console.log('[Dashboard] Global new-message received:', msg)
          // Sumar solo si el mensaje es para dashboard
          if (msg && (msg.recipient === 'DASHBOARD' || !msg.recipient)) {
            if (currentPage !== 'chat') {
              const currentCount = parseInt(localStorage.getItem('dashboard_chat_notifications') || '0', 10) || 0
              const newCount = currentCount + 1
              localStorage.setItem('dashboard_chat_notifications', String(newCount))
              console.log('[Dashboard] Global chat notification incremented to:', newCount)
              update_dashboard_chat_badge()
            }
          }
        } catch (err) {
          console.error('[Dashboard] Error in global new-message handler:', err)
        }
      })
    }).catch(err => {
      console.warn('[Dashboard]  No se pudo conectar a socket:', err)
    })

    // Inicio
    render_page('dashboard')
    update_dashboard_chat_badge()
    load_zone().catch(err => console.warn('[Dashboard] Error en load_zone:', err))

    // Carga inicial de metricas
    load_metrics()
    load_stock_alerts()

    // Evento de tarea completada
    window.addEventListener('task:completed', (e) => {
      try {
        console.log('[Dashboard] 🟢 Evento task:completed recibido:', e.detail)
        const { etiqueta, nuevoEstado } = e.detail
        // Si hay etiqueta, actualizar solo ese equipo
        if (etiqueta && nuevoEstado) {
          update_equipment_on_map(etiqueta, nuevoEstado)
        } else {
          load_map_states()
        }
        // Recargar metricas
        console.log('[Dashboard] Recargando métricas por task:completed')
        load_metrics()
      } catch (err) {
        console.warn('[Dashboard] Error actualizando mapa por evento task:completed', err)
      }
    })

    // Evento de tarea iniciada
    window.addEventListener('task:started', (e) => {
      try {
        console.log('[Dashboard] 🔵 Evento task:started recibido:', e.detail)
        const { etiqueta, nuevoEstado } = e.detail
        // Si hay etiqueta, actualizar solo ese equipo
        if (etiqueta && nuevoEstado) {
          update_equipment_on_map(etiqueta, nuevoEstado)
        } else {
          // Si no hay etiqueta, recargar todo
          load_map_states()
        }
      } catch (err) {
        console.warn('[Dashboard] Error actualizando mapa por evento task:started', err)
      }
    })

    // Cambio de estado recibido por socket
    window.addEventListener('task:status:changed', (e) => {
      try {
        console.log('[Dashboard] 📡 Evento task:status:changed desde socket:', e.detail)
        const { etiqueta, nuevoEstado, estado, tareaId } = e.detail
        
        if (etiqueta && nuevoEstado) {
          console.log(`[Dashboard] Actualizando mapa: ${etiqueta} → ${nuevoEstado} (Tarea: ${tareaId})`)
          update_equipment_on_map(etiqueta, nuevoEstado)
          
          // En dashboard/inspecciones, refrescar metricas
          if ((currentPage === 'dashboard' || currentPage === 'inspections') && estado === 'Terminada') {
            setTimeout(() => {
              console.log('[Dashboard] Recargando métricas después de completar tarea...')
              load_metrics()
            }, 1000)
          }
        } else {
          console.warn('[Dashboard] Datos incompletos en evento:', { etiqueta, nuevoEstado })
        }
      } catch (err) {
        console.warn('[Dashboard] Error procesando cambio de estado desde socket', err)
      }
    })

    // Refresco periodico de metricas
    setInterval(() => {
      if (currentPage === 'dashboard') {
        console.log('[Dashboard] Refrescando métricas (intervalo automático 10s)')
        load_metrics()
        load_stock_alerts()
      }
    }, 10000)

    // Throttle para evitar exceso de refrescos
    let lastMetricsUpdate = Date.now()
    const throttleMetrics = () => {
      const now = Date.now()
      if (now - lastMetricsUpdate > 10000) { // Maximo 1 cada 10s
        lastMetricsUpdate = now
        if (currentPage === 'dashboard') {
          load_metrics()
          load_stock_alerts()
        }
      }
    }

    // Listener para refresco por eventos
    socket_manager.on_message((msg) => {
      throttleMetrics()
    })
  }
})