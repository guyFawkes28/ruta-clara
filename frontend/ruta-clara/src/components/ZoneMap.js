
const DEFAULT_PUESTOS = {
  'TL':   'sg',
  'V1':   'sv', 'V2': 'so', 'V3': 'sg', 'V4': 'sg',
  'A-P1': 'sg', 'A-P2': 'sv', 'A-P3': 'so', 'A-P4': 'sg',
  'B-P1': 'sv', 'B-P2': 'so', 'B-P3': 'sg', 'B-P4': 'sb',
  'C-P1': 'sg', 'C-P2': 'so', 'C-P3': 'sg', 'C-P4': 'sg',
  'D-P1': 'sg', 'D-P2': 'sg', 'D-P3': 'sg', 'D-P4': 'sv',
  'E-P1': 'sb', 'E-P2': 'sg',
  'F-P1': 'sv', 'F-P2': 'sg', 'F-P3': 'so', 'F-P4': 'sb',
  'G-P1': 'sg', 'G-P2': 'sv', 'G-P3': 'sg', 'G-P4': 'so',
  'H-P1': 'sg', 'H-P2': 'sg', 'H-P3': 'sg', 'H-P4': 'sg',
  'I-P1': 'sg', 'I-P2': 'sb', 'I-P3': 'sv',
  'J-P1': 'so', 'J-P2': 'sg', 'J-P3': 'sv',
}

export const ZoneMap = ({ zona = 'Sala', puestos = DEFAULT_PUESTOS, onClick = null, readOnly = false } = {}) => {

  const estado = (id) => puestos[id] ?? 'sg'

  const puesto = (id, label) => {
    const cls = estado(id)
    const cursor = readOnly ? 'cursor:default' : ''
    return `
      <div class="p ${cls}" data-id="${id}"
        data-bs-toggle="tooltip" data-bs-placement="top"
        title="Pantalla, Mouse, Teclado, Silla"
        data-bs-custom-class="puesto-tooltip"
        style="${cursor}">
        <div class="plbl-in">${label}</div>
      </div>`
  }

  const fan = (id, label) => {
    const cls = estado(id)
    const cursor = readOnly ? 'cursor:default' : ''
    return `
      <div class="fan ${cls}" data-id="${id}"
        data-bs-toggle="tooltip" data-bs-placement="top"
        title="Ventilador ${id}"
        style="${cursor}">
        <div class="fan-lbl">${label}</div>
      </div>`
  }

  return {
    render: () => `
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
              <div class="p-tl" data-id="TL"
                data-bs-toggle="tooltip" data-bs-placement="top"
                title="Puesto TL"
                style="${readOnly ? 'cursor:default' : ''}">
                <div class="tlbl">TL</div>
              </div>
            </div>
          </div>

          <div class="bloques">
            <!-- BLOQUE IZQUIERDO -->
            <div class="bloque">
              ${fan('V1', 'V1')}

              <div class="mesa"><div class="prow">
                ${puesto('A-P4','P4')} ${puesto('A-P3','P3')}
                ${puesto('A-P2','P2')} ${puesto('A-P1','P1')}
              </div></div>

              <div class="mesa"><div class="prow">
                ${puesto('B-P4','P4')} ${puesto('B-P3','P3')}
                ${puesto('B-P2','P2')} ${puesto('B-P1','P1')}
              </div></div>

              <div class="mesa"><div class="prow">
                ${puesto('C-P4','P4')} ${puesto('C-P3','P3')}
                ${puesto('C-P2','P2')} ${puesto('C-P1','P1')}
              </div></div>

              <div class="mesa"><div class="prow">
                ${puesto('D-P4','P4')} ${puesto('D-P3','P3')}
                ${puesto('D-P2','P2')} ${puesto('D-P1','P1')}
              </div></div>

              <div class="mesa"><div class="prow">
                ${puesto('E-P2','P2')} ${puesto('E-P1','P1')}
              </div></div>

              ${fan('V2', 'V2')}
            </div>

            <div class="divider"></div>

            <!-- BLOQUE DERECHO -->
            <div class="bloque">
              ${fan('V3', 'V3')}

              <div class="mesa"><div class="prow">
                ${puesto('F-P1','P1')} ${puesto('F-P2','P2')}
                ${puesto('F-P3','P3')} ${puesto('F-P4','P4')}
              </div></div>

              <div class="mesa"><div class="prow">
                ${puesto('G-P1','P1')} ${puesto('G-P2','P2')}
                ${puesto('G-P3','P3')} ${puesto('G-P4','P4')}
              </div></div>

              <div class="mesa"><div class="prow">
                ${puesto('H-P1','P1')} ${puesto('H-P2','P2')}
                ${puesto('H-P3','P3')} ${puesto('H-P4','P4')}
              </div></div>

              <div class="mesa"><div class="prow">
                ${puesto('I-P1','P1')} ${puesto('I-P2','P2')}
                ${puesto('I-P3','P3')}
              </div></div>

              <div class="mesa"><div class="prow">
                ${puesto('J-P1','P1')} ${puesto('J-P2','P2')}
                ${puesto('J-P3','P3')}
              </div></div>

              ${fan('V4', 'V4')}
            </div>
          </div>

        </div>
      </div>
    `,

    loadRender: () => {
      // Tooltips Bootstrap
      const tooltipEls = document.querySelectorAll('[data-bs-toggle="tooltip"]')
      if (window.bootstrap?.Tooltip) {
        tooltipEls.forEach(el => {
          const tt = new window.bootstrap.Tooltip(el, {
            trigger: 'hover focus',
            customClass: el.getAttribute('data-bs-custom-class') || ''
          })
          // Soporte táctil
          el.addEventListener('touchend', (e) => {
            e.preventDefault()
            e.stopPropagation()
            if (tt._isShown()) {
              tt.hide()
            } else {
              tt.show()
              const hideOnTouch = (ev) => {
                if (!el.contains(ev.target)) {
                  tt.hide()
                  document.removeEventListener('touchend', hideOnTouch)
                }
              }
              setTimeout(() => document.addEventListener('touchend', hideOnTouch), 0)
            }
          })
        })
      }

      // Clics — solo si no es readOnly y hay callback
      if (!readOnly && typeof onClick === 'function') {
        document.querySelectorAll('.p, .p-tl, .fan').forEach(el => {
          el.onclick = () => onClick(el.dataset.id)
        })
      }
    },

    // Actualiza el estado visual de un puesto sin re-renderizar todo el mapa
    updatePuesto: (id, nuevaClase) => {
      const el = document.querySelector(`[data-id="${id}"]`)
      if (!el) return
      el.classList.remove('sg', 'so', 'sb', 'sv')
      el.classList.add(nuevaClase)
    }
  }
}