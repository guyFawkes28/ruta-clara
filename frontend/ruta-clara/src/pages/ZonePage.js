import { headerView } from '../components/Header.js';
import { reportZone } from '../components/ReportZone.js';
import maintenance_service from '../api/maintenance.service.js';
import socket_manager from '../api/socket.js';
import { toast } from '../util/ux.js';

export const zonePage = () => {
    const zona = 'Sala 3 — Piso 1';
    const header = headerView({ 
        zona, 
        onScan: () => { window.location.hash = '#/scanner'; } 
    });

const modalReporte = reportZone({
    onSave: async (datos) => {
        try {
            const mapaEstados = { 'so': 'Naranja', 'sb': 'Azul', 'sv': 'Verde', 'sg': 'Gris' };
            const reportData = {
                p_activo_id: datos.puestoId,
                p_incidencias_ids: datos.idsSeleccionados || [],
                p_comentario_general: datos.comentario || "",
                p_nuevo_estado: mapaEstados[datos.estado] || 'Naranja'
            };

            console.log('Enviando reporte:', reportData); // debug temporal

            await maintenance_service.create_maintenance_report(reportData);
            
            // Emitir evento socket para que todos vean la novedad en tiempo real
            // Necesitamos mapear el puestoId al etiqueta correcto de la zona
            const qrZone = window.location.hash.split('/').pop() || 'SALA3-P1';
            const zoneForMap = await maintenance_service.get_zone_by_qr(encodeURIComponent(qrZone));
            const activoForMap = (zoneForMap.activos || []).find(a => 
              String(a.id_activo) === String(datos.puestoId) || a.etiqueta === datos.puestoId
            );
            const etiqueta = activoForMap?.etiqueta || datos.puestoId || 'UNKNOWN'
            
            const eventoReporte = {
              activo_id: datos.puestoId,
              etiqueta: etiqueta,
              estado: 'Naranja',
              nuevoEstado: 'Naranja',
              tipo: 'novedad_reportada'
            }
            try {
              // Intentar emitir con reintentos si socket no está conectado
              const emitWithRetry = async (maxAttempts = 3, delayMs = 500) => {
                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                  if (socket_manager.is_connected()) {
                    try {
                      socket_manager.get_socket().emit('report-created', eventoReporte)
                      console.log('[ZonePage] ✅ Evento de novedad emitido por socket:', eventoReporte)
                      return true
                    } catch (err) {
                      console.warn(`[ZonePage]  Error emitiendo socket (intento ${attempt}/${maxAttempts}):`, err)
                    }
                  } else {
                    console.warn(`[ZonePage] Socket no conectado (intento ${attempt}/${maxAttempts}), esperando ${delayMs}ms...`)
                  }
                  
                  // Esperar antes del reintento
                  if (attempt < maxAttempts) {
                    await new Promise(r => setTimeout(r, delayMs))
                  }
                }
                
                // Si llega aquí, falló después de todos los intentos
                console.warn('[ZonePage]  No se pudo emitir evento después de', maxAttempts, 'intentos')
                
                // Intentar conectar y emitir como último recurso
                try {
                  console.log('[ZonePage] 🔌 Intentando conectar socket...')
                  await socket_manager.connect('ZONE')
                  if (socket_manager.is_connected()) {
                    socket_manager.get_socket().emit('report-created', eventoReporte)
                    console.log('[ZonePage] ✅ Evento emitido después de reconectar')
                    return true
                  }
                } catch (connectErr) {
                  console.warn('[ZonePage] No se pudo reconectar:', connectErr)
                }
                
                return false
              }
              
              await emitWithRetry()
            } catch (socketErr) {
              console.warn('[ZonePage] No se pudo emitir evento socket:', socketErr)
            }

            // Refrescar estados visuales
            try {
                const qr = window.location.hash.split('/').pop() || 'SALA3-P1';
                const zone = await maintenance_service.get_zone_by_qr(encodeURIComponent(qr));
                const claseEstado = { 'Gris': 'sg', 'Naranja': 'so', 'Azul': 'sb', 'Verde': 'sv' };
                (zone.activos || []).forEach(activo => {
                    const el = document.querySelector(`[data-id="${activo.id_activo}"]`);
                    if (el) {
                        el.classList.remove('sg', 'so', 'sb', 'sv');
                        el.classList.add(claseEstado[activo.estado] || 'sg');
                        const estadoColorMap = { Gris: '#9CA3AF', Naranja: '#F97316', Azul: '#2563EB', Verde: '#16A34A' };
                        const estadoColor = estadoColorMap[activo.estado] || '#999';
                        const componentesBase = ['Pantalla', 'Teclado', 'Silla', 'Cable', 'Enchufe'];
                        const fallos = activo.fallos_activos?.length ? activo.fallos_activos : [];
                        const componentesHtml = componentesBase.map(c => {
                            const damaged = fallos.some(f => f.toLowerCase().includes(c.toLowerCase()));
                            return `
                                <li style="display:flex;align-items:center;gap:8px;">
                                    <span style="font-size:12px;">${damaged ? '' : '✅'}</span>
                                    ${c}
                                </li>`;
                        }).join('');
                        const tooltipHtml = `
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="width:10px;height:10px;border-radius:50%;background:${estadoColor};display:inline-block;"></span>
                                <strong>Estado:</strong> ${activo.estado}
                            </div>
                            <div style="margin-top:6px;"><strong>Componentes:</strong></div>
                            <ul style="margin:4px 0 0 1rem; padding:0; list-style:disc;">
                                ${componentesHtml}
                            </ul>
                        `;
                        setupPuestoTooltip(el, tooltipHtml);
                    }
                });
            } catch (e) { console.warn('No se pudo refrescar zona:', e); }

            toast('Reporte enviado con éxito', 'success');
            modalReporte.close();
        } catch (err) {
            console.error("Error:", err);
            toast(`Error: ${err?.response?.data?.error || err.message}`, 'error');
        }
    },
    onCancel: () => { modalReporte.close(); }
});

    const setupPuestoTooltip = (el, htmlContent) => {
        if (!el || !window.bootstrap?.Tooltip) return;
        const instance = bootstrap.Tooltip.getOrCreateInstance(el, {
            trigger: 'hover focus',
            customClass: 'puesto-tooltip',
            html: true,
            title: htmlContent
        });

        // Support long-press on touch devices to show tooltip.
        let touchTimer = null;
        const LONG_PRESS_MS = 500;

        const onTouchStart = (ev) => {
            // start timer to show tooltip after LONG_PRESS_MS
            clearTimeout(touchTimer);
            touchTimer = setTimeout(() => {
                try { instance.show(); } catch (e) { /* ignore */ }
                el.dataset.tooltipActive = '1';
                // hide after a short timeout
                setTimeout(() => {
                    try { instance.hide(); } catch (e) {}
                    delete el.dataset.tooltipActive;
                }, 3000);
            }, LONG_PRESS_MS);
        };

        const onTouchEnd = (ev) => {
            clearTimeout(touchTimer);
            // if tooltip was shown, suppress the next click that would open modal
            if (el.dataset.tooltipActive === '1') {
                el.dataset.tooltipSuppressClick = String(Date.now());
                setTimeout(() => { delete el.dataset.tooltipSuppressClick; }, 800);
            }
        };

        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchend', onTouchEnd);
        el.addEventListener('touchcancel', onTouchEnd);

        // On devices that support hover (mouse), ensure tooltip appears on mouseenter
        try {
            const supportsHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
            if (supportsHover) {
                el.addEventListener('mouseenter', () => { try { instance.show(); } catch (e) {} });
                el.addEventListener('mouseleave', () => { try { instance.hide(); } catch (e) {} });
            }
        } catch (e) { /* ignore matchMedia errors */ }
    };

    const crearPuesto = (etiqueta, label) => `
        <div class="p sg" data-id="${etiqueta}" style="cursor:pointer;">
            <div class="plbl-in" style="pointer-events:none;">${label}</div>
        </div>`;

    return {
        render: () => `
            ${header.render()}
            <div class="sala1-wrap">
                <div class="sh">Estado de Equipos</div>

                <div class="leyenda">
                    <div class="leg"><div class="ldot g"></div>Sin novedad</div>
                    <div class="leg"><div class="ldot o"></div>Daño reportado</div>
                    <div class="leg"><div class="ldot b"></div>En reparación</div>
                    <div class="leg"><div class="ldot v"></div>Reparado </div>
                </div>

                <div class="map-outer zone-responsive">
                    <div class="map-hdr"><div class="map-title">${zona}</div></div>

                    <div class="map-body">
                        <div class="pasillo">— PASILLO CENTRAL —</div>

                        <div class="tl-row">
                            <div class="tl-wrap">
                                <div class="tl-lbl">Puesto TL</div>
                                <div class="p-tl sg" data-id="TL" style="cursor:pointer;">
                                    <div class="tlbl" style="pointer-events:none;">TL</div>
                                </div>
                            </div>
                        </div>

                        <div class="bloques">
                            <div class="bloque">
                                <div class="fan sg" data-id="V1" style="cursor:pointer;"><div class="fan-lbl" style="pointer-events:none;">V1</div></div>
                                <div class="mesa"><div class="prow">
                                    ${crearPuesto('A-P4','P4')} ${crearPuesto('A-P3','P3')}
                                    ${crearPuesto('A-P2','P2')} ${crearPuesto('A-P1','P1')}
                                </div></div>
                                <div class="mesa"><div class="prow">
                                    ${crearPuesto('B-P4','P4')} ${crearPuesto('B-P3','P3')}
                                    ${crearPuesto('B-P2','P2')} ${crearPuesto('B-P1','P1')}
                                </div></div>
                                <div class="mesa"><div class="prow">
                                    ${crearPuesto('C-P4','P4')} ${crearPuesto('C-P3','P3')}
                                    ${crearPuesto('C-P2','P2')} ${crearPuesto('C-P1','P1')}
                                </div></div>
                                <div class="mesa"><div class="prow">
                                    ${crearPuesto('D-P4','P4')} ${crearPuesto('D-P3','P3')}
                                    ${crearPuesto('D-P2','P2')} ${crearPuesto('D-P1','P1')}
                                </div></div>
                                <div class="mesa"><div class="prow">
                                    ${crearPuesto('E-P2','P2')} ${crearPuesto('E-P1','P1')}
                                </div></div>
                                <div class="fan sg" data-id="V2" style="cursor:pointer;"><div class="fan-lbl" style="pointer-events:none;">V2</div></div>
                            </div>

                            <div class="divider"></div>

                            <div class="bloque">
                                <div class="fan sg" data-id="V3" style="cursor:pointer;"><div class="fan-lbl" style="pointer-events:none;">V3</div></div>
                                <div class="mesa"><div class="prow">
                                    ${crearPuesto('F-P1','P1')} ${crearPuesto('F-P2','P2')}
                                    ${crearPuesto('F-P3','P3')} ${crearPuesto('F-P4','P4')}
                                </div></div>
                                <div class="mesa"><div class="prow">
                                    ${crearPuesto('G-P1','P1')} ${crearPuesto('G-P2','P2')}
                                    ${crearPuesto('G-P3','P3')} ${crearPuesto('G-P4','P4')}
                                </div></div>
                                <div class="mesa"><div class="prow">
                                    ${crearPuesto('H-P1','P1')} ${crearPuesto('H-P2','P2')}
                                    ${crearPuesto('H-P3','P3')} ${crearPuesto('H-P4','P4')}
                                </div></div>
                                <div class="mesa"><div class="prow">
                                    ${crearPuesto('I-P1','P1')} ${crearPuesto('I-P2','P2')}
                                    ${crearPuesto('I-P3','P3')}
                                </div></div>
                                <div class="mesa"><div class="prow">
                                    ${crearPuesto('J-P1','P1')} ${crearPuesto('J-P2','P2')}
                                    ${crearPuesto('J-P3','P3')}
                                </div></div>
                                <div class="fan sg" data-id="V4" style="cursor:pointer;"><div class="fan-lbl" style="pointer-events:none;">V4</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ${modalReporte.render()}
        `,

        loadRender: async () => {
            header.loadRender();
            if (modalReporte.loadRender) modalReporte.loadRender();
            
            // Conectar socket para sincronización en tiempo real
            socket_manager.connect('ZONE').catch(err => {
              console.warn('[ZonePage] No se pudo conectar socket:', err)
            })

            const qrCode = window.location.hash.split('/').pop() || 'SALA3-P1';
            const claseEstado = { 'Gris': 'sg', 'Naranja': 'so', 'Azul': 'sb', 'Verde': 'sv' };
            let activos = [];

            try {
                const response = await maintenance_service.get_zone_by_qr(encodeURIComponent(qrCode));
                activos = response.activos || [];

                activos.forEach(activo => {
                    // Buscar elemento por etiqueta (como está en el HTML inicial)
                    const el = document.querySelector(`[data-id="${activo.etiqueta}"]`);
                    if (el) {
                        // Reemplazar etiqueta por id numérico real
                        el.setAttribute('data-id', String(activo.id_activo));
                        el.classList.remove('sg', 'so', 'sb', 'sv');
                        el.classList.add(claseEstado[activo.estado] || 'sg');
                        const estadoColorMap = { Gris: '#9CA3AF', Naranja: '#F97316', Azul: '#2563EB', Verde: '#16A34A' };
                        const estadoColor = estadoColorMap[activo.estado] || '#999';
                        const componentesBase = ['Pantalla', 'Teclado', 'Silla', 'Cable', 'Enchufe'];
                        const fallos = activo.fallos_activos?.length ? activo.fallos_activos : [];
                        const componentesHtml = componentesBase.map(c => {
                            const damaged = fallos.some(f => f.toLowerCase().includes(c.toLowerCase()));
                            return `
                                <li style="display:flex;align-items:center;gap:8px;">
                                    <span style="font-size:12px;">${damaged ? '' : '✅'}</span>
                                    ${c}
                                </li>`;
                        }).join('');
                        const tooltipHtml = `
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="width:10px;height:10px;border-radius:50%;background:${estadoColor};display:inline-block;"></span>
                                <strong>Estado:</strong> ${activo.estado}
                            </div>
                            <div style="margin-top:6px;"><strong>Componentes:</strong></div>
                            <ul style="margin:4px 0 0 1rem; padding:0; list-style:disc;">
                                ${componentesHtml}
                            </ul>
                        `;
                        setupPuestoTooltip(el, tooltipHtml);
                    }
                });

            } catch (err) {
                console.warn('No se cargaron activos:', err);
                toast('No se pudo cargar el estado de la sala.', 'error');
            }

            // Click handlers — data-id ya es numérico en este punto
            document.querySelectorAll('.p, .p-tl, .fan').forEach(el => {
                el.addEventListener('click', (ev) => {
                    // If a long-press showed the tooltip, suppress this click
                    if (el.dataset.tooltipSuppressClick) {
                        delete el.dataset.tooltipSuppressClick;
                        ev.preventDefault();
                        ev.stopPropagation();
                        return;
                    }

                    const id = Number(el.getAttribute('data-id'));
                    if (!isNaN(id) && id > 0) {
                        const activo = activos.find(a => a.id_activo === id);
                        const esFan = activo?.tipo_activo_id === 2;
                        modalReporte.open(id, esFan);
                    } else {
                        toast('Este puesto no está registrado en la base de datos.', 'error');
                    }
                });
            });

        }
    };
};