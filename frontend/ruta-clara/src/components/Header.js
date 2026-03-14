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
                <button class="hdr-user-box" id="hdr-user-box" aria-label="Perfil">
                  <span class="hdr-user-emoji" id="hdr-role">🔎</span>
                  <span class="hdr-name" id="hdr-name">Usuario</span>
                </button>
              </div>
              <button class="qr-btn" id="hdr-scan">📷</button>
              <button class="btn btn-danger btn-sm" id="hdr-logout" title="Cerrar sesión">
                <span class="logout-icon">↩</span>
                <span class="logout-text">Salir</span>
              </button>
            </div>
          </div>
          <div class="hdr-cta">
            <div class="hdr-cta-inner">
              <button id="hdr-home-btn" class="hdr-home-btn" aria-label="Ir al inicio">🏠 Volver al inicio</button>
            </div>
          </div>
        </div>
      `;
    },

    loadRender() {
      document.getElementById('hdr-scan').onclick = onScan;
      const hdrHome = document.getElementById('hdr-home-btn');
      if (hdrHome) hdrHome.onclick = () => { window.location.hash = '#/home'; };
      document.getElementById('hdr-logout').onclick = () => {
        persistence.clearSession();
        window.location.hash = '#/login';
      };

      // Cargar nombre del usuario desde persistence y mostrarlo
      try {
        const user = persistence.getUser();
        const nameEl = document.getElementById('hdr-name');
        const roleEl = document.getElementById('hdr-role');
        const userBox = document.getElementById('hdr-user-box');
        if (user && nameEl) {
          const display = user.name || user.fullName || user.username || user.usuario || user.email || 'Usuario';
          nameEl.textContent = display;
          // role emoji
          try {
            const rawRole = user?.rol ?? user?.role ?? user?.data?.rol ?? user?.data?.role ?? '';
            const r = String(rawRole || '').toLowerCase();
            let emoji = '';
            if (r.includes('aseo') || r.includes('clean')) emoji = '🧹';
            else if (r.includes('admin')) emoji = '👑';
            else if (r.includes('maint') || r.includes('mantenimiento') || r.includes('operator')) emoji = '🔧';
            else if (r) emoji = '🔎';
            if (roleEl) roleEl.textContent = emoji;
          } catch (e) { /* ignore */ }
          // make user box clickable to go to profile/home
          if (userBox && !userBox.dataset.bound) {
            userBox.onclick = () => { window.location.hash = '#/profile' }
            userBox.dataset.bound = '1'
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