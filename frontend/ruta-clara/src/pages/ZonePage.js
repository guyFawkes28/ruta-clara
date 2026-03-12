import { headerView } from '../components/Header.js';
import { reportZone } from '../components/ReportZone.js';

export const zonePage = () => {
  const zona = 'Sala 3 — Piso 1';
  const header = headerView({ zona, onScan: () => { window.location.hash = ''; } });

  const modalReporte = reportZone({
    onSave: (datos) => {
      console.log("Datos recibidos del modal:", datos);
      alert(`Reporte guardado para ${datos.puestoId}: ${datos.categoria}`);
      
      // Aquí es donde luego llamarás al backend:
      // await urlApi.post('/reportes', datos);
      
      modalReporte.close(); // Cerramos el modal al termi      ${modalReporte.render()}      ${modalReporte.render()}nar
    },
    onCancel: () => {
      modalReporte.close();
    }
  });

  return {
    render: () => {
      return `
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
              <div class="map-title">🖥️ Sala 3 — Piso 1</div>
            </div>
            <div class="map-body">
              <div class="pasillo">— pasillo central —</div>
              <div class="tl-row">
                <div class="tl-wrap">
                  <div class="tl-lbl">Puesto TL</div>
                  <div class="p-tl" data-id="TL">💻<div class="tlbl">TL</div></div>
                </div>
              </div>
              <div class="bloques">
                <div class="bloque">
                  <div class="fan sv" data-id="V1">🌀<div class="fan-lbl">V1</div></div>
                  <div class="mesa"><div class="prow">
                    <div class="p sg" data-id="A-P4">💻<div class="plbl-in">P4</div></div>
                    <div class="p so" data-id="A-P3">💻<div class="plbl-in">P3</div></div>
                    <div class="p sv" data-id="A-P2">💻<div class="plbl-in">P2</div></div>
                    <div class="p sg" data-id="A-P1">💻<div class="plbl-in">P1</div></div>
                  </div></div>
                  <div class="mesa"><div class="prow">
                    <div class="p sb" data-id="B-P4">💻<div class="plbl-in">P4</div></div>
                    <div class="p sg" data-id="B-P3">💻<div class="plbl-in">P3</div></div>
                    <div class="p so" data-id="B-P2">💻<div class="plbl-in">P2</div></div>
                    <div class="p sv" data-id="B-P1">💻<div class="plbl-in">P1</div></div>
                  </div></div>
                  <div class="mesa"><div class="prow">
                    <div class="p sg" data-id="C-P4">💻<div class="plbl-in">P4</div></div>
                    <div class="p sg" data-id="C-P3">💻<div class="plbl-in">P3</div></div>
                    <div class="p so" data-id="C-P2">💻<div class="plbl-in">P2</div></div>
                    <div class="p sg" data-id="C-P1">💻<div class="plbl-in">P1</div></div>
                  </div></div>
                  <div class="mesa"><div class="prow">
                    <div class="p sv" data-id="D-P4">💻<div class="plbl-in">P4</div></div>
                    <div class="p sg" data-id="D-P3">💻<div class="plbl-in">P3</div></div>
                    <div class="p sg" data-id="D-P2">💻<div class="plbl-in">P2</div></div>
                    <div class="p sg" data-id="D-P1">💻<div class="plbl-in">P1</div></div>
                  </div></div>
                  <div class="mesa"><div class="prow">
                    <div class="p sg" data-id="E-P2">💻<div class="plbl-in">P2</div></div>
                    <div class="p sb" data-id="E-P1">💻<div class="plbl-in">P1</div></div>
                  </div></div>
                  <div class="fan so" data-id="V2">🌀<div class="fan-lbl">V2</div></div>
                </div>
                <div class="divider"></div>
                <div class="bloque">
                  <div class="fan sg" data-id="V3">🌀<div class="fan-lbl">V3</div></div>
                  <div class="mesa"><div class="prow">
                    <div class="p sv" data-id="F-P1">💻<div class="plbl-in">P1</div></div>
                    <div class="p sg" data-id="F-P2">💻<div class="plbl-in">P2</div></div>
                    <div class="p so" data-id="F-P3">💻<div class="plbl-in">P3</div></div>
                    <div class="p sb" data-id="F-P4">💻<div class="plbl-in">P4</div></div>
                  </div></div>
                  <div class="mesa"><div class="prow">
                    <div class="p sg" data-id="G-P1">💻<div class="plbl-in">P1</div></div>
                    <div class="p sv" data-id="G-P2">💻<div class="plbl-in">P2</div></div>
                    <div class="p sg" data-id="G-P3">💻<div class="plbl-in">P3</div></div>
                    <div class="p so" data-id="G-P4">💻<div class="plbl-in">P4</div></div>
                  </div></div>
                  <div class="mesa"><div class="prow">
                    <div class="p sg" data-id="H-P1">💻<div class="plbl-in">P1</div></div>
                    <div class="p sg" data-id="H-P2">💻<div class="plbl-in">P2</div></div>
                    <div class="p sg" data-id="H-P3">💻<div class="plbl-in">P3</div></div>
                    <div class="p sg" data-id="H-P4">💻<div class="plbl-in">P4</div></div>
                  </div></div>
                  <div class="mesa"><div class="prow">
                    <div class="p sg" data-id="I-P1">💻<div class="plbl-in">P1</div></div>
                    <div class="p sb" data-id="I-P2">💻<div class="plbl-in">P2</div></div>
                    <div class="p sv" data-id="I-P3">💻<div class="plbl-in">P3</div></div>
                  </div></div>
                  <div class="mesa"><div class="prow">
                    <div class="p so" data-id="J-P1">💻<div class="plbl-in">P1</div></div>
                    <div class="p sg" data-id="J-P2">💻<div class="plbl-in">P2</div></div>
                    <div class="p sv" data-id="J-P3">💻<div class="plbl-in">P3</div></div>
                  </div></div>
                  <div class="fan sg" data-id="V4">🌀<div class="fan-lbl">V4</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="report-modal" class="d-none">
          ${modalReporte.render()}
        </div>
      `;
    },
    loadRender: () => {
      header.loadRender();
      document.querySelectorAll('.p[data-id]').forEach(el => {
        el.onclick = () => modalReporte.open(el.dataset.id);
      });
      const tlEl = document.querySelector('.p-tl[data-id="TL"]');
      if (tlEl) tlEl.onclick = () => modalReporte.open('TL');
      document.querySelectorAll('.fan[data-id]').forEach(el => {
        el.onclick = () => modalReporte.open(el.dataset.id);
      });
      if (modalReporte.loadRender) modalReporte.loadRender();
    },
  };
}