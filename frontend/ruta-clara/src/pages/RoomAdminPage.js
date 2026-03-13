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
  const crearPuesto = (clase, id, label) => `
    <div class="p ${clase}" data-id="${id}">
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
            <div class="pasillo">— PASILLO CENTRAL —</div>
            
            <div class="tl-row">
              <div class="tl-wrap">
                <div class="tl-lbl">Puesto TL</div>
                <div class="p-tl" data-id="TL"><div class="tlbl">TL</div></div>
              </div>
            </div>

            <div class="bloques">
              <div class="bloque">
                <div class="fan sv" data-id="V1"><div class="fan-lbl">V1</div></div>
                
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

                <div class="fan so" data-id="V2"><div class="fan-lbl">V2</div></div>
              </div>

              <div class="divider"></div>

              <div class="bloque">
                <div class="fan sg" data-id="V3"><div class="fan-lbl">V3</div></div>

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

                <div class="fan sg" data-id="V4"><div class="fan-lbl">V4</div></div>
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
