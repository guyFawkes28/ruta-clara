import { persistence } from "../util/persistence.js"

export const HomeHeader = (opts = {}) => {
  return {
    render: () => {
      const user = persistence.getUser() || {}
      const nombre = user.name || user.usuario || user.email || 'Usuario'
      return `
      <div class="rc-welcome">
        <div class="rc-welcome-left">
          <h2>${opts.title || `¡Hola, ${nombre}!`}</h2>
          <div class="rc-welcome-date">${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div class="rc-welcome-actions">
          ${opts.showLogout ? '<button class="db-btn db-btn-secondary" id="db-logout">🔒 Cerrar sesión</button>' : ''}
        </div>
      </div>`
    },
    loadRender: () => {
      if (opts.showLogout) {
        const btn = document.getElementById('db-logout')
        if (btn && !btn.dataset.logoutBound) {
          btn.onclick = () => { persistence.clearSession(); window.location.hash = '#/login' }
          btn.dataset.logoutBound = '1'
        }
      }
    }
  }
}
