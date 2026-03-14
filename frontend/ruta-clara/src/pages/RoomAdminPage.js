import { reportZone } from '../components/ReportZone.js';

export const roomPage = () => {
  const zona = 'Sala 1';

  const modalReporte = reportZone({
    onSave: (datos) => {
      console.log("Datos para el backend:", datos);
      alert(`Reporte guardado para ${datos.puestoId}: ${datos.categoria}`);
      modalReporte.close();
    },
    onCancel: () => { modalReporte.close(); }
  });

  // Función auxiliar para generar puestos rápidamente
  const crearPuesto = (id, label) => `
    <div class="p" data-id="${id}">
      <div class="plbl-in">${label}</div>
    </div>`;

  return {
    render: () => `
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
            <div class="pasillo">— PASILLO CE
            <div class="tl-row">
              <div class="tl-wrap">
                <div class="tl-lbl">Puesto TL</div>
                <div class="p-tl" data-id="TL"><div class="tlbl">TL</div></div>
              </div>
            </div>

            <div class="bloques">
              <div class="bloque">
                <div class="fan" data-id="V1"><div class="fan-lbl">V1</div></div>
                
                <div class="mesa"><div class="prow">
                  ${crearPuesto('A-P4', 'P4')} ${crearPuesto('A-P3', 'P3')}
                  ${crearPuesto('A-P2', 'P2')} ${crearPuesto('A-P1', 'P1')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('B-P4', 'P4')} ${crearPuesto('B-P3', 'P3')}
                  ${crearPuesto('B-P2', 'P2')} ${crearPuesto('B-P1', 'P1')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('C-P4', 'P4')} ${crearPuesto('C-P3', 'P3')}
                  ${crearPuesto('C-P2', 'P2')} ${crearPuesto('C-P1', 'P1')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('D-P4', 'P4')} ${crearPuesto('D-P3', 'P3')}
                  ${crearPuesto('D-P2', 'P2')} ${crearPuesto('D-P1', 'P1')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('E-P2', 'P2')} ${crearPuesto('E-P1', 'P1')}
                </div></div>

                <div class="fan" data-id="V2"><div class="fan-lbl">V2</div></div>
              </div>

              <div class="divider"></div>

              <div class="bloque">
                <div class="fan" data-id="V3"><div class="fan-lbl">V3</div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('F-P1', 'P1')} ${crearPuesto('F-P2', 'P2')}
                  ${crearPuesto('F-P3', 'P3')} ${crearPuesto('F-P4', 'P4')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('G-P1', 'P1')} ${crearPuesto('G-P2', 'P2')}
                  ${crearPuesto('G-P3', 'P3')} ${crearPuesto('G-P4', 'P4')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('H-P1', 'P1')} ${crearPuesto('H-P2', 'P2')}
                  ${crearPuesto('H-P3', 'P3')} ${crearPuesto('H-P4', 'P4')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('I-P1', 'P1')} ${crearPuesto('I-P2', 'P2')}
                  ${crearPuesto('I-P3', 'P3')}
                </div></div>

                <div class="mesa"><div class="prow">
                  ${crearPuesto('J-P1', 'P1')} ${crearPuesto('J-P2', 'P2')}
                  ${crearPuesto('J-P3', 'P3')}
                </div></div>

                <div class="fan" data-id="V4"><div class="fan-lbl">V4</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${modalReporte.render()}
    `,

    loadRender: () => {
      // Eventos para todos los elementos clickeables
      const elementos = document.querySelectorAll('.p, .p-tl, .fan');
      elementos.forEach(el => {
        el.onclick = () => {
          const id = el.dataset.id || 'TL';
          modalReporte.open(id);
        };
      });

      if (modalReporte.loadRender) modalReporte.loadRender();
    }
  };
};
