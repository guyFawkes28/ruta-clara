import { persistence } from "../util/persistence.js";
import maintenanceService from "../api/maintenance.service.js";
import chatService from "../api/chat.service.js";
import socketManager from "../api/socket.js";
import executionService from "../api/execution.service.js";
import inventoryService from "../api/inventory.service.js";
import aiService from "../api/ai.service.js";
import sidebarView from "../components/Sidebar.js";
import { reportZone } from "../components/ReportZone.js";

const state = {
  equipos: { total: 0, activos: 0, inactivos: 0, enMantenimiento: 0, lista: [] },
  inspecciones: { total: 0, completadas: 0, pendientes: 0, conProblemas: 0, lista: [] },
  tecnicos: { total: 0, activos: 0, disponibles: 0, lista: [] },
  reportes: { generados: 0, pendientes: 0, lista: [] },
  metricas: { total_tareas: 0, completadas: 0, en_proceso: 0, promedio_duracion_minutos: 0, tasa_cumplimiento_sst: 0 },
  alertas_stock: [],
  repuestos_por_tipo: {},
  zoneNotFound: false
}

const loadZone = async (qrCode = 'SALA3-P1') => {
  try {
    state.zoneNotFound = false
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
    console.warn('Error cargando zona:', err)
    state.zoneNotFound = true
    state.equipos.lista = []
    state.equipos.total = 0
  }
}

const statusBadge = (estado) => {
  // Normalizar estado
  const estadoNorm = String(estado || '').toLowerCase().trim()
  
  const map = {
    activo: ['db-status-ok','● Activo'], inactivo: ['db-status-off','● Inactivo'],
    mantenimiento: ['db-status-pending','⏳ Mantenimiento'], ok: ['db-status-ok','✓ OK'],
    critico: ['db-status-error','⚠ Crítico'], pendiente: ['db-status-pending','⏳ Pendiente'],
    completada: ['db-status-ok','✓ Completada'], progreso: ['db-status-pending','⏳ En Progreso'],
    'en ejecución': ['db-status-pending','⏳ En Ejecución'], 'ejecución': ['db-status-pending','⏳ En Ejecución'],
    problema: ['db-status-error','⚠ Problema'], disponible: ['db-status-ok','✓ Disponible'],
    revision: ['db-status-pending','⏳ Revisión'], 'en_progreso': ['db-status-pending','⏳ En Progreso'],
  }
  const [cls, label] = map[estadoNorm] ?? ['db-status-off', estado]
  return `<span class="db-status ${cls}">${label}</span>`
}

let chatMensajes = []
const escapeHtml = (str) => String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s])

const renderMensaje = (msg) => {
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
      ">${escapeHtml(senderLabel)}</div>
      <div style="
        font-size: 14px;
        line-height: 1.45;
        white-space: pre-wrap;
      ">${escapeHtml(msg.message || msg.texto || '')}</div>
      <div style="
        font-size: 10px;
        opacity: 0.6;
        margin-top: 5px;
        text-align: right;
      ">${escapeHtml(hora)}</div>
    </div>
  </div>`
}

function subDashboard() {
  const { equipos, inspecciones, tecnicos, metricas, alertas_stock } = state
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
    
    ${state.zoneNotFound ? '<div style="padding:10px 12px;border-radius:8px;background:rgba(220,38,38,0.06);color:var(--danger);margin-bottom:12px;font-weight:700;">Zona no encontrada</div>' : ''}
    
    <!-- Alertas de Stock Bajo -->
    ${alertas_stock.length > 0 ? `
      <div style="
        padding:12px;
        border-radius:8px;
        background:rgba(251,146,60,0.06);
        border-left:4px solid #f97316;
        margin-bottom:16px;
      ">
        <div style="font-weight:700;color:#f97316;margin-bottom:8px;">⚠️ ${alertas_stock.length} Repuestos con Stock Bajo</div>
        <div style="font-size:12px;color:var(--tmid);">
          ${alertas_stock.slice(0, 3).map(r => `<div>• ${r.nombre}: ${r.stock_actual}/${r.stock_minimo}</div>`).join('')}
          ${alertas_stock.length > 3 ? `<div style="color:var(--tsoft);">+ ${alertas_stock.length - 3} más</div>` : ''}
        </div>
      </div>
    ` : ''}
    
    <!-- Métricas de Tareas -->
    <div class="db-cards">
      <div class="db-card db-fade">
        <div class="db-card-head"><span class="db-card-title">Tareas Completadas</span></div>
        <div class="db-card-value">${metricas.completadas ?? 0}</div>
        <div class="db-card-stat">De ${metricas.total_tareas ?? 0} totales</div>
      </div>
      <div class="db-card db-fade" style="animation-delay:.06s">
        <div class="db-card-head"><span class="db-card-title">En Proceso</span></div>
        <div class="db-card-value" style="color:#f97316">${metricas.en_proceso ?? 0}</div>
        <div class="db-card-stat">Tareas activas</div>
      </div>
      <div class="db-card db-fade" style="animation-delay:.12s">
        <div class="db-card-head"><span class="db-card-title">Cumplimiento SST</span></div>
        <div class="db-card-value" style="color:#22c55e">${metricas.tasa_cumplimiento_sst ?? 0}%</div>
        <div class="db-card-stat">Protocolo de seguridad</div>
      </div>
      <div class="db-card db-fade" style="animation-delay:.18s">
        <div class="db-card-head"><span class="db-card-title">Duración Promedio</span></div>
        <div class="db-card-value">${metricas.promedio_duracion_minutos ?? 0}</div>
        <div class="db-card-stat">Minutos por tarea</div>
      </div>
    </div>
    
    <!-- Información Operativa Anterior -->
    <div class="db-cards">
      <div class="db-card db-fade"><div class="db-card-head"><span class="db-card-title">Equipos Activos</span></div><div class="db-card-value">${equipos.activos}</div><div class="db-card-stat">De ${equipos.total} totales</div></div>
      <div class="db-card db-fade" style="animation-delay:.06s"><div class="db-card-head"><span class="db-card-title">Inspecciones</span><span class="db-badge db-badge-info">${inspecciones.pendientes} pend.</span></div><div class="db-card-value">${inspecciones.completadas}</div><div class="db-card-stat">Completadas este mes</div></div>
      <div class="db-card db-fade" style="animation-delay:.12s"><div class="db-card-head"><span class="db-card-title">Problemas</span><span class="db-badge db-badge-warn">${inspecciones.conProblemas}</span></div><div class="db-card-value">${inspecciones.conProblemas}</div><div class="db-card-stat">Requieren atención</div></div>
      <div class="db-card db-fade" style="animation-delay:.18s"><div class="db-card-head"><span class="db-card-title">Técnicos Disponibles</span><span class="db-badge db-badge-ok">${tecnicos.disponibles}</span></div><div class="db-card-value">${tecnicos.disponibles}/${tecnicos.activos}</div><div class="db-card-stat">En horario laboral</div></div>
    </div>
    
    <div class="db-section">
      <div class="db-section-head"><h2 class="db-section-title">Últimas Inspecciones</h2><button class="db-btn db-btn-secondary db-btn-sm" id="db-see-all">Ver todas →</button></div>
      <div class="db-table-wrap" style="max-height:250px;overflow-y:auto;"><table class="db-table" style="font-size:13px;"><thead><tr><th style="padding:6px 8px;">ID Equipo</th><th style="padding:6px 8px;">Ubicación</th><th style="padding:6px 8px;">Técnico</th><th style="padding:6px 8px;">Fecha</th><th style="padding:6px 8px;">Estado</th><th style="padding:6px 8px;">Acción</th></tr></thead>
        <tbody>${inspecciones.lista.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--tsoft);padding:10px;">No hay inspecciones recientes</td></tr>' : inspecciones.lista.map(i => `<tr style="font-size:12px;"><td style="padding:6px 8px;"><strong>${i.id||''}</strong></td><td style="padding:6px 8px;">${i.equipo||i.ubicacion||''}</td><td style="padding:6px 8px;">${i.tecnico||''}</td><td style="padding:6px 8px;">${i.fecha||''}</td><td style="padding:6px 8px;">${statusBadge(i.estado||'pendiente')}</td><td style="padding:6px 8px;"><button class="db-btn db-btn-secondary db-btn-sm">Ver</button></td></tr>`).join('')}</tbody>
      </table></div>
    </div>`
}

function subEquipos() {
  const { repuestos_por_tipo } = state
  const tipos = Object.keys(repuestos_por_tipo)
  
  const tablaHtml = tipos.length === 0 
    ? '<tr><td colspan="5" style="text-align:center;color:var(--tsoft);padding:10px;">No hay repuestos registrados</td></tr>'
    : tipos.map(tipo => {
        const datos = repuestos_por_tipo[tipo]
        const repuestos = datos.repuestos || []
        return repuestos.map((rep, idx) => `
          <tr style="font-size:12px;">
            <td style="padding:6px 8px;"><strong>${idx === 0 ? tipo : ''}</strong></td>
            <td style="padding:6px 8px;">${rep.nombre || ''}</td>
            <td style="padding:6px 8px;text-align:center;"><span style="background:${rep.stock <= rep.stock_minimo ? '#fecaca' : '#dcfce7'};padding:4px 8px;border-radius:4px;font-weight:700;">${rep.stock || 0}</span></td>
            <td style="padding:6px 8px;text-align:center;">${rep.stock_minimo || 0}</td>
            <td style="padding:6px 8px;text-align:center;">${rep.stock_maximo || 0}</td>
          </tr>
        `).join('')
      }).join('')
  
  return `
<<<<<<< HEAD
    <div class="db-ph">
      <div class="db-ph-actions"><button id="db-filter-equipos" class="db-btn db-btn-secondary">🔍 Filtrar</button><button class="db-btn db-btn-primary">+ Registrar Equipo</button></div>
      <div><h1>Gestión de Equipos</h1></div>
    </div>
=======
    <div class="db-ph"><h1>📦 Inventario de Repuestos</h1><div class="db-ph-actions"><button class="db-btn db-btn-secondary">🔍 Filtrar</button><button class="db-btn db-btn-primary">+ Agregar Repuesto</button></div></div>
>>>>>>> e4b46ac93fe4a855271a72dd01e793facd66028e
    <div class="db-cards">
      <div class="db-card db-fade"><div class="db-card-title">Tipos de Repuestos</div><div class="db-card-value">${tipos.length}</div></div>
      <div class="db-card db-fade" style="animation-delay:.06s"><div class="db-card-title">Total en Stock</div><div class="db-card-value" style="color:#22c55e">${Object.values(repuestos_por_tipo).reduce((sum, t) => sum + (t.cantidad_total || 0), 0)}</div></div>
      <div class="db-card db-fade" style="animation-delay:.12s"><div class="db-card-title">Stock Bajo</div><div class="db-card-value" style="color:#f97316">${Object.values(repuestos_por_tipo).reduce((sum, t) => sum + (t.repuestos || []).filter(r => r.stock <= r.stock_minimo).length, 0)}</div></div>
    </div>
    <div class="db-section"><div class="db-section-head"><h2 class="db-section-title">Repuestos por Categoría</h2></div>
      <div class="db-table-wrap"><table class="db-table"><thead><tr><th>Categoría</th><th>Nombre</th><th>Stock Actual</th><th>Stock Mínimo</th><th>Stock Máximo</th></tr></thead><tbody>${tablaHtml}</tbody></table></div>
    </div>`
}

// ─── Mapa solo lectura ───────────────────────────────────────
function ro(etiqueta, label) {
  return `<div class="p sg" data-map-id="${etiqueta}" style="cursor:default;pointer-events:none;"><div class="plbl-in" style="pointer-events:none;">${label}</div></div>`
}

function subMapa() {
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
        <span style="font-size:13px;font-weight:700;color:var(--tmid)">Reparado ✓</span>
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

function subReportes() {
  const { reportes } = state
  const rows = reportes.lista.map(r => `<tr><td><strong>${r.id}</strong></td><td>${r.tipo}</td><td>${r.fecha}</td><td>${r.autor}</td><td>${statusBadge(r.estado)}</td><td><button class="db-btn db-btn-secondary db-btn-sm">${r.estado==='disponible'?'📥 Descargar':'Ver'}</button></td></tr>`).join('')
  return `
    <div class="db-ph">
      <div class="db-ph-actions"><button class="db-btn db-btn-secondary">📥 Importar</button><button class="db-btn db-btn-primary">+ Generar Reporte</button></div>
      <div><h1>Reportes</h1></div>
    </div>
    <div class="db-cards">
      <div class="db-card db-fade"><div class="db-card-title">Reportes Generados</div><div class="db-card-value">${reportes.generados}</div></div>
      <div class="db-card db-fade" style="animation-delay:.06s"><div class="db-card-title">Pendientes de Revisión</div><div class="db-card-value" style="color:var(--orange)">${reportes.pendientes}</div></div>
    </div>
    <div class="db-section"><div class="db-section-head"><h2 class="db-section-title">Reportes Recientes</h2></div>
      <div class="db-table-wrap"><table class="db-table"><thead><tr><th>ID</th><th>Tipo</th><th>Fecha</th><th>Generado por</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>`
}

function subAseo() {
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
      <div id="db-aseo-list" class="db-table-wrap" style="max-height:420px;overflow:auto;padding:12px;background:var(--card);border:1.5px solid var(--border);border-radius:10px;">
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
  equipos:      subEquipos,
  inspecciones: subMapa,
  reportes:     subReportes,
  chat:         subChat,
  'home-cleaner': subAseo
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
    let isLoadingPage = false // Prevenir peticiones simultáneas
    let lastPageLoad = 0

    const cargarEstadosMapa = async () => {
      try {
        const response = await maintenanceService.getZoneByQR(encodeURIComponent('SALA3-P1'))
        const activos = response.activos || []
        const claseEstado = { 'Gris': 'sg', 'Naranja': 'so', 'Azul': 'sb', 'Verde': 'sv' }
        activos.forEach(activo => {
          const el = document.querySelector(`[data-map-id="${activo.etiqueta}"]`)
          if (el) {
            el.classList.remove('sg', 'so', 'sb', 'sv')
            el.classList.add(claseEstado[activo.estado] || 'sg')
            const fallos = activo.fallos_activos?.length ? activo.fallos_activos.join(', ') : 'Sin fallos'
            el.setAttribute('title', `${activo.etiqueta} — ${activo.estado} | ${fallos}`)
          }
        })
      } catch (err) { console.warn('[Mapa RO] No se cargaron estados:', err) }
    }

    // Cargar métricas de desempeño
    const cargarMetricas = async () => {
      try {
        const metricas = await executionService.getPerformanceMetrics()
        state.metricas = metricas
        console.log('[Dashboard] Métricas cargadas:', metricas)
        // Re-render si estamos en dashboard
        if (currentPage === 'dashboard') {
          const content = document.getElementById('db-content')
          if (content) content.innerHTML = subRenders.dashboard()
        }
      } catch (err) { 
        console.warn('[Dashboard] Error cargando métricas:', err)
      }
    }

    // Cargar alertas de stock bajo
    const cargarAlertasStock = async () => {
      try {
        const alertas = await inventoryService.getLowStockAlerts()
        state.alertas_stock = alertas
        console.log('[Dashboard] Alertas de stock:', alertas.length)
        // Re-render si estamos en dashboard
        if (currentPage === 'dashboard') {
          const content = document.getElementById('db-content')
          if (content) content.innerHTML = subRenders.dashboard()
        }
      } catch (err) { 
        console.warn('[Dashboard] Error cargando alertas:', err)
      }
    }

    // Cargar inspecciones recientes
    const cargarInspecciones = async () => {
      try {
        const data = await maintenanceService.getRecentInspections(10)
        state.inspecciones.lista = data.inspecciones || []
        console.log('[Dashboard] Inspecciones cargadas:', state.inspecciones.lista.length)
      } catch (err) {
        console.warn('[Dashboard] Error cargando inspecciones:', err)
      }
    }

    // Cargar reportes recientes
    const cargarReportes = async () => {
      try {
        const data = await maintenanceService.getRecentReports(10)
        state.reportes.lista = data.reportes || []
        console.log('[Dashboard] Reportes cargados:', state.reportes.lista.length)
      } catch (err) {
        console.warn('[Dashboard] Error cargando reportes:', err)
      }
    }

    // Cargar repuestos agrupados
    const cargarRepuestos = async () => {
      try {
        const data = await inventoryService.getRepuestosGroupedByType()
        state.repuestos_por_tipo = data
        console.log('[Dashboard] Repuestos agrupados cargados')
      } catch (err) {
        console.warn('[Dashboard] Error cargando repuestos agrupados:', err)
      }
    }

    const renderPage = async (page) => {
      // Evitar múltiples cargas simultáneas
      if (isLoadingPage) {
        console.log('[Dashboard] Ya hay una carga en progreso, ignorando', page)
        return
      }

      const now = Date.now()
      if (now - lastPageLoad < 500) { // Debounce de 500ms
        console.log('[Dashboard] Demasiadas peticiones rápido, ignorando', page)
        return
      }

      isLoadingPage = true
      lastPageLoad = now

      try {
        currentPage = page
        const content = document.getElementById('db-content')
        if (!content) return

        // Cargar datos según la página
        if (page === 'dashboard') {
          await Promise.all([cargarMetricas(), cargarAlertasStock(), cargarInspecciones()])
        } else if (page === 'equipos') {
          await cargarRepuestos()
        } else if (page === 'reportes') {
          await cargarReportes()
        }

        content.innerHTML = subRenders[page]?.() ?? subRenders.dashboard()

      try { sidebarView({ activePage: page, onNavigate: renderPage }).loadRender() } catch (e) {}

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
      document.getElementById('db-see-all')?.addEventListener('click', () => renderPage('inspecciones'))

      // '+ Nuevo Reporte' removed: no-op (listener deleted)

      if (currentPage === 'equipos') {
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
            inp.style.cssText = 'padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-family:Nunito,sans-serif;margin-top:8px;width:100%'
            header.appendChild(inp)
            inp.addEventListener('input', (e) => {
              const q = (e.target.value || '').toLowerCase().trim()
              const lista = state.equipos.lista.filter(it => String(it.id||'').toLowerCase().includes(q) || String(it.nombre||'').toLowerCase().includes(q) || String(it.ubicacion||'').toLowerCase().includes(q) || String(it.tipo||'').toLowerCase().includes(q))
              const tbody = document.querySelector('.db-table tbody')
              if (!tbody) return
              tbody.innerHTML = lista.map(e => `<tr><td><strong>${e.id}</strong></td><td>${e.nombre}</td><td>${e.ubicacion}</td><td>${e.tipo}</td><td>${statusBadge(e.estado)}</td><td><button class=\"db-btn db-btn-secondary db-btn-sm\">Editar</button></td></tr>`).join('')
            })
          } else { f.remove() }
        })
      }

      // Mapa RO: cargar estados reales
      if (page === 'inspecciones') cargarEstadosMapa()
      // Aseo: cargar registros cuando se muestra la vista de limpieza
      if (page === 'home-cleaner') cargarRegistrosAseo()

      // Chat con Socket.io en tiempo real
      if (page === 'chat') {
        if (window.__dashboardChat_interval) clearInterval(window.__dashboardChat_interval)
        const input = document.getElementById('db-chat-input')
        const sendBtn = document.getElementById('db-chat-send')
        const container = document.getElementById('db-chat-messages')
        const statusDiv = document.querySelector('.rc-chat-status')
        
        if (input && sendBtn && container) {
          const cargarMensajesHistoricos = async () => {
            try {
              const mensajes = await chatService.getMessages('DASHBOARD', 50, 0)
              chatMensajes = mensajes
              container.innerHTML = mensajes.length === 0 ? '<div style="text-align:center;padding:20px;color:var(--tsoft);">Sin mensajes</div>' : mensajes.map(renderMensaje).join('')
              container.scrollTop = container.scrollHeight
            } catch (err) { console.error('[Dashboard Chat] Error cargando histórico:', err) }
          }
          
          // Conectar al servidor de WebSocket
          socketManager.connect('DASHBOARD').then(() => {
            console.log('[Dashboard Chat] WebSocket conectado')
            
            // Monitorear cambios de conexión
            socketManager.onConnectionChange((isConnected) => {
              if (statusDiv) {
                if (isConnected) {
                  statusDiv.textContent = '● En línea — Antonio'
                } else {
                  statusDiv.textContent = '● Desconectado'
                }
              }
            })
            
            // Escuchar nuevos mensajes en tiempo real
            socketManager.onMessage((msg) => {
              console.log('[Dashboard Chat] Nuevo mensaje:', msg.senderName, '-', msg.message)
              // Evitar duplicados
              if (chatMensajes.find(m => m._id === msg._id)) {
                console.log('[Dashboard Chat] Mensaje duplicado, ignorando')
                return
              }
              chatMensajes.push(msg)
              const html = renderMensaje(msg)
              if (container.textContent.includes('Sin mensajes')) {
                container.innerHTML = html
              } else {
                container.insertAdjacentHTML('beforeend', html)
              }
              container.scrollTop = container.scrollHeight
            })
            
            // Escuchar confirmación de envío
            socketManager.onMessageSent((data) => {
              console.log('[Dashboard Chat] ✓ Mensaje confirmado en servidor', data.messageId)
            })
            
            // Escuchar errores al enviar
            socketManager.onMessageError((data) => {
              console.error('[Dashboard Chat] ✗ Error al enviar:', data.error)
              alert('Error al enviar el mensaje: ' + data.error)
              input.focus()
            })
            
            // Cargar histórico inicial
            cargarMensajesHistoricos()
          }).catch(err => {
            console.error('[Dashboard Chat] Error conectando:', err)
            container.innerHTML = '<div style="text-align:center;padding:20px;color:#f00;">Error conectando al chat</div>'
          })
          
          const enviar = () => {
            const texto = input.value.trim()
            if (!texto) return
            
            // Validar conexión
            if (!socketManager.isConnected()) {
              alert('No estás conectado. Intenta recargar la página.')
              return
            }
            
            const currentUser = persistence.getUser()
            socketManager.sendMessage({
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
      link.addEventListener('click', (e) => { e.preventDefault(); renderPage(link.dataset.dbPage) })
    })

    // Inicializar con dashboard
    renderPage('dashboard')
    loadZone().catch(err => console.warn('[Dashboard] Error en loadZone:', err))

    // Cargar métricas e inicializar actualizaciones en tiempo real
    cargarMetricas()
    cargarAlertasStock()

    // Función para cargar registros de aseo y renderizarlos en la vista 'Aseo'
    const cargarRegistrosAseo = async () => {
      try {
        const resp = await fetch('http://localhost:4000/api/cleanings')
        if (!resp.ok) throw new Error('fetch failed')
        const registros = await resp.json()
        const container = document.getElementById('db-aseo-list')
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
          const when = r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }) + ' · ' + new Date(r.createdAt).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' }) : (r.created_at || '')
          const desc = r.descriptions || r.description || r.desc || r.detalle || r.notes || r.observacion || ''
          const hora_inicio = r.hora_inicio || r.start_time || ''
          const hora_fin = r.hora_fin || r.end_time || ''
          return `
            <div style="padding:10px;border-bottom:1px solid var(--border);">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <div style="font-weight:700">${escapeHtml(String(zone))}</div>
                <div style="font-size:12px;color:var(--tsoft)">${escapeHtml(when)}</div>
              </div>
              <div style="margin-top:6px;font-size:13px">${escapeHtml(String(who))} — ${escapeHtml(String(desc))}</div>
              <div style="margin-top:6px;font-size:12px;color:var(--tsoft)">Inicio: ${escapeHtml(hora_inicio) || '—'} — Fin: ${escapeHtml(hora_fin) || '—'}</div>
            </div>`
        }).join('')

        // Mostrar contador y la lista
        const headerHtml = `<div style="font-size:13px;color:var(--tsoft);margin-bottom:10px">Mostrando ${filtered.length} registros${isAdmin ? ' (todos)' : ''}</div>`
        container.innerHTML = headerHtml + `<div>${rows}</div>`
      } catch (err) {
        console.error('[Dashboard Aseo] Error cargando registros:', err)
        const container = document.getElementById('db-aseo-list')
        if (container) container.innerHTML = '<div style="color:var(--tsoft);padding:12px;text-align:center">No se pudieron cargar los registros</div>'
      }
    }

    // Escuchar eventos de nuevo registro de limpieza para actualizar la vista en tiempo real
    window.addEventListener('cleaning:created', (e) => {
      try {
        cargarRegistrosAseo()
      } catch (err) {
        console.warn('[Dashboard] Error actualizando por evento cleaning:created', err)
      }
    })


    // Actualizar métricas cada 30 segundos
    setInterval(() => {
      if (currentPage === 'dashboard') {
        cargarMetricas()
        cargarAlertasStock()
      }
    }, 30000)

    // Debounce para evitar actualizaciones excesivas por socket
    let lastMetricsUpdate = Date.now()
    const throttleMetrics = () => {
      const now = Date.now()
      if (now - lastMetricsUpdate > 10000) { // Max 1 petición cada 10 segundos
        lastMetricsUpdate = now
        if (currentPage === 'dashboard') {
          cargarMetricas()
          cargarAlertasStock()
        }
      }
    }

    // Listeners de socket para actualizaciones en tiempo real
    socketManager.onMessage((msg) => {
      throttleMetrics()
    })

  }
})