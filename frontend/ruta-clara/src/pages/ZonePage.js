import { headerView } from '../components/Header.js';
import { reportZone } from '../components/ReportZone.js';

export const zonePage = () => {
  const zona = 'Sala 3 — Piso 1';
  const header = headerView({ 
    zona, 
    onScan: () => { window.location.hash = '#/scanner'; } 
  });

  const modalReporte = reportZone({
    onSave: (datos) => {
      console.log("Datos para el backend:", datos);
      // Actualizar el estado visual del puesto en el mapa
      const sel = document.querySelector(`[data-id="${datos.puestoId}"]`);
      if (sel) {
        // remover clases de estado previas y aplicar la nueva
        sel.classList.remove('sg','so','sb','sv');
        if (datos.estado) sel.classList.add(datos.estado);
      }
      alert(`Reporte guardado para ${datos.puestoId}: ${datos.estado || datos.categoria}`);
      modalReporte.close();
    },
    onCancel: () => { modalReporte.close(); }
  });

  // Función auxiliar para generar puestos: por defecto todos inician `sg` (sin novedad)
  const crearPuesto = (clase, id, label) => `
    <div class="p sg" data-id="${id}" data-bs-toggle="tooltip" data-bs-placement="top" title="Pantalla, Mouse, Teclado, Silla" data-bs-custom-class="puesto-tooltip">
      <div class="plbl-in">${label}</div>
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

        <div class="map-outer">
          <div class="map-hdr">
            <div class="map-title">${zona}</div>
          </div>
          
          <div class="map-body">
            <div class="pasillo">— PASILLO CENTRAL —</div>
            
            <div class="tl-row">
              <div class="tl-wrap">
                <div class="tl-lbl">Puesto TL</div>
                <div class="p-tl" data-id="TL" data-bs-toggle="tooltip" data-bs-placement="top" title="Puesto TL"><div class="tlbl">TL</div></div>
              </div>
            </div>

            <div class="bloques">
              <div class="bloque">
                <div class="fan" data-id="V1" data-bs-toggle="tooltip" data-bs-placement="top" title="Ventilador V1"><div class="fan-lbl">V1</div></div>
                
                <div class="mesa"><div class="prow">
                  ${crearPuesto('sg', 'A-P4', 'P4')} ${crearPuesto('so', 'A-P3', 'P3')}
                  ${crearPuesto('sv', 'A-P2', 'P2')} ${crearPuesto('sg', 'A-P1', 'P1')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('sb', 'B-P4', 'P4')} ${crearPuesto('sg', 'B-P3', 'P3')}
                  ${crearPuesto('so', 'B-P2', 'P2')} ${crearPuesto('sv', 'B-P1', 'P1')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('sg', 'C-P4', 'P4')} ${crearPuesto('sg', 'C-P3', 'P3')}
                  ${crearPuesto('so', 'C-P2', 'P2')} ${crearPuesto('sg', 'C-P1', 'P1')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('sv', 'D-P4', 'P4')} ${crearPuesto('sg', 'D-P3', 'P3')}
                  ${crearPuesto('sg', 'D-P2', 'P2')} ${crearPuesto('sg', 'D-P1', 'P1')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('sg', 'E-P2', 'P2')} ${crearPuesto('sb', 'E-P1', 'P1')}
                </div></div>

                <div class="fan" data-id="V2" data-bs-toggle="tooltip" data-bs-placement="top" title="Ventilador V2"><div class="fan-lbl">V2</div></div>
              </div>

              <div class="divider"></div>

              <div class="bloque">
                <div class="fan" data-id="V3" data-bs-toggle="tooltip" data-bs-placement="top" title="Ventilador V3"><div class="fan-lbl">V3</div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('sv', 'F-P1', 'P1')} ${crearPuesto('sg', 'F-P2', 'P2')}
                  ${crearPuesto('so', 'F-P3', 'P3')} ${crearPuesto('sb', 'F-P4', 'P4')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('sg', 'G-P1', 'P1')} ${crearPuesto('sv', 'G-P2', 'P2')}
                  ${crearPuesto('sg', 'G-P3', 'P3')} ${crearPuesto('so', 'G-P4', 'P4')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('sg', 'H-P1', 'P1')} ${crearPuesto('sg', 'H-P2', 'P2')}
                  ${crearPuesto('sg', 'H-P3', 'P3')} ${crearPuesto('sg', 'H-P4', 'P4')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('sg', 'I-P1', 'P1')} ${crearPuesto('sb', 'I-P2', 'P2')}
                  ${crearPuesto('sv', 'I-P3', 'P3')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('so', 'J-P1', 'P1')} ${crearPuesto('sg', 'J-P2', 'P2')}
                  ${crearPuesto('sv', 'J-P3', 'P3')}
                </div></div>

                <div class="fan" data-id="V4" data-bs-toggle="tooltip" data-bs-placement="top" title="Ventilador V4"><div class="fan-lbl">V4</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${modalReporte.render()}
    `,

    loadRender: () => {
      header.loadRender();
      // Inicializar tooltips de Bootstrap
      const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
      if (window.bootstrap && window.bootstrap.Tooltip) {
        tooltipTriggerList.forEach(function (tooltipTriggerEl) {
          const tooltip = new window.bootstrap.Tooltip(tooltipTriggerEl, {
            trigger: 'hover focus',
            customClass: tooltipTriggerEl.getAttribute('data-bs-custom-class') || ''
          });
          // Mobile: mostrar tooltip sólo en long-press (mantener presionado) y ocultar al soltar
          let lpTimer = null;
          tooltipTriggerEl._longPressActive = false;

          tooltipTriggerEl.addEventListener('touchstart', function (e) {
            // Iniciar temporizador de long-press (300ms)
            lpTimer = setTimeout(() => {
              tooltip.show();
              tooltipTriggerEl._longPressActive = true;
            }, 300);
          }, { passive: true });

          const clearLongPress = () => {
            if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
          };

          tooltipTriggerEl.addEventListener('touchend', function (e) {
            // Si fue long-press, ocultar tooltip al soltar y evitar que se propague como tap
            if (tooltipTriggerEl._longPressActive) {
              tooltip.hide();
              tooltipTriggerEl._longPressActive = false;
              clearLongPress();
              // Evitar que el click sintetizado abra el modal: marcar supresión temporal
              tooltipTriggerEl._suppressClick = true;
              setTimeout(() => { tooltipTriggerEl._suppressClick = false; }, 400);
              e.preventDefault();
              e.stopPropagation();
            } else {
              // tap corto: limpiar timer y dejar que el handler de tap abra el modal
              clearLongPress();
            }
          }, { passive: false });

          tooltipTriggerEl.addEventListener('touchcancel', function () {
            clearLongPress();
            if (tooltipTriggerEl._longPressActive) {
              tooltip.hide();
              tooltipTriggerEl._longPressActive = false;
            }
          });
        });
      }
      // Eventos para todos los elementos clickeables
      const elementos = document.querySelectorAll('.p, .p-tl, .fan');
      elementos.forEach(el => {
        el.onclick = (e) => {
          // Si se debe suprimir el click (por long-press), ignorar
          if (el._suppressClick) { el._suppressClick = false; return; }
          const id = el.dataset.id || 'TL';
          modalReporte.open(id);
        };
        // Soporte explícito para touch en mobile
        el.addEventListener('touchend', function(e) {
          // Si el touch fue un long-press que mostró el tooltip, evitamos abrir el modal
          if (el._suppressClick) {
            el._suppressClick = false;
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          // Si todavía queda marcado como long-press activo, ignorar también
          if (el._longPressActive) {
            el._longPressActive = false;
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          const id = el.dataset.id || 'TL';
          modalReporte.open(id);
        }, { passive: false });
      });
      if (modalReporte.loadRender) modalReporte.loadRender();
    }
  };
};