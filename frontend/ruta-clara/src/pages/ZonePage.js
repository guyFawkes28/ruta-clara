import { headerView } from '../components/Header.js';
import { reportZone } from '../components/ReportZone.js';
import maintenanceService from '../api/maintenance.service.js';
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

            await maintenanceService.createReport(reportData);

            // Refrescar estados visuales
            try {
                const qr = window.location.hash.split('/').pop() || 'SALA3-P1';
                const zone = await maintenanceService.getZoneByQR(encodeURIComponent(qr));
                const claseEstado = { 'Gris': 'sg', 'Naranja': 'so', 'Azul': 'sb', 'Verde': 'sv' };
                (zone.activos || []).forEach(activo => {
                    const el = document.querySelector(`[data-id="${activo.id_activo}"]`);
                    if (el) {
                        el.classList.remove('sg', 'so', 'sb', 'sv');
                        el.classList.add(claseEstado[activo.estado] || 'sg');
                        const fallos = activo.fallos_activos?.length ? activo.fallos_activos.join(', ') : 'Sin fallos';
                        el.setAttribute('title', `Estado: ${activo.estado} | Componentes: ${fallos}`);
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
                    <div class="leg"><div class="ldot v"></div>Reparado ✓</div>
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

            const qrCode = window.location.hash.split('/').pop() || 'SALA3-P1';
            const claseEstado = { 'Gris': 'sg', 'Naranja': 'so', 'Azul': 'sb', 'Verde': 'sv' };
            let activos = [];

            try {
                const response = await maintenanceService.getZoneByQR(encodeURIComponent(qrCode));
                activos = response.activos || [];

                activos.forEach(activo => {
                    // Buscar elemento por etiqueta (como está en el HTML inicial)
                    const el = document.querySelector(`[data-id="${activo.etiqueta}"]`);
                    if (el) {
                        // Reemplazar etiqueta por id numérico real
                        el.setAttribute('data-id', String(activo.id_activo));
                        el.classList.remove('sg', 'so', 'sb', 'sv');
                        el.classList.add(claseEstado[activo.estado] || 'sg');
                        const fallos = activo.fallos_activos?.length ? activo.fallos_activos.join(', ') : 'Sin fallos';
                        el.setAttribute('title', `Estado: ${activo.estado} | Componentes: ${fallos}`);
                    }
                });

            } catch (err) {
                console.warn('No se cargaron activos:', err);
                toast('No se pudo cargar el estado de la sala.', 'error');
            }

            // Click handlers — data-id ya es numérico en este punto
            document.querySelectorAll('.p, .p-tl, .fan').forEach(el => {
                el.addEventListener('click', () => {
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

            // (CTA movido al header)
        }
    };
};