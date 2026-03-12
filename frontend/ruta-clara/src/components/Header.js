
import { persistence } from '../util/persistence.js';

export function headerView({ zona = 'Sala 3 — Piso 1', onScan = () => {} } = {}) {
  return {

    render() {
      return `
        <div class="hdr" id="app-header">
          <div class="hdr-inner">
            <div class="logo">Ruta<em>Clara</em></div>
            <div class="pill">
              <div class="pill-inner">
                <span class="rdot"></span>
                <span id="hdr-zona">${zona}</span>
              </div>
            </div>
            <button class="qr-btn" id="hdr-scan">📷</button>
            <button class="btn btn-danger btn-sm" id="hdr-logout" title="Cerrar sesión">Cerrar sesión</button>
          </div>
        </div>
      `;
    },

    loadRender() {
      document.getElementById('hdr-scan').onclick = onScan;
      document.getElementById('hdr-logout').onclick = () => {
        persistence.clearSession();
        window.location.hash = '#/login';
      };
    },

    // Actualizar el nombre de zona dinámicamente
    setZona(nombre) {
      const el = document.getElementById('hdr-zona');
      if (el) el.textContent = nombre;
    },

  };
}