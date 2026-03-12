import { persistence } from '../util/persistence.js';

export function headerView({ zona = 'Sala 3 — Piso 1', onScan = () => {} } = {}) {
  return {

    render() {
      return `
        <div class="hdr" id="app-header">
          <div class="hdr-inner">
            <div class="logo">
              <span class="logo-lg">Ruta<em>Clara</em></span>
              <span class="logo-sm">R<em>C</em></span>
            </div>
            <div class="pill">
              <div class="pill-inner">
                <span class="rdot"></span>
                <span id="hdr-zona">${zona}</span>
              </div>
            </div>
            <div class="hdr-controls">
              <div class="hdr-profile" id="hdr-profile">
                <div class="hdr-name" id="hdr-name">Usuario</div>
              </div>
              <button class="qr-btn" id="hdr-scan">📷</button>
              <button class="btn btn-danger btn-sm" id="hdr-logout" title="Cerrar sesión">
                <span class="logout-icon">↩</span>
                <span class="logout-text">Exit</span>
              </button>
            </div>
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

      // Cargar nombre del usuario desde persistence y mostrarlo
      try {
        const user = persistence.getUser();
        const nameEl = document.getElementById('hdr-name');
        const avatarEl = document.getElementById('hdr-avatar');
        if (user && nameEl) {
          // Preferencias de campo: probar varias propiedades
          const display = user.name || user.fullName || user.username || user.usuario || user.email || 'Usuario';
          nameEl.textContent = display;
          if (avatarEl) {
            // Mostrar inicial del nombre
            avatarEl.textContent = (display && String(display).trim().charAt(0).toUpperCase()) || 'U';
          }
        }
      } catch (e) { /* ignore */ }
    },

    // Actualizar el nombre de zona dinámicamente
    setZona(nombre) {
      const el = document.getElementById('hdr-zona');
      if (el) el.textContent = nombre;
    },

  };
}