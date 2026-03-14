import { persistence } from "../util/persistence.js"
import { HomeHeader } from "../components/HomeHeader.js"
import { BottomNav } from "../components/BottomNav.js"

export const HomeCleanerPage = () => {
  // Puedes guardar el usuario para mostrar el nombre
  const user = persistence.getUser() || {}

  return {
    render: () => `
      <div class="rc-app aseo-home">
        <main id="rc-main">
          <div id="rc-view-home" class="rc-view active">
            ${HomeHeader({ title: `¡Hola, ${user.name || 'Usuario'}!`, showLogout: true }).render()}

            <div class="rc-section">
              <div class="rc-section-title">¿A qué zona vas a limpiar?</div>
              <p style="margin-bottom:16px;">Usa el botón de escanear en la barra inferior para registrar la zona que vas a limpiar.</p>
            </div>
            <div class="rc-section" style="margin-top:24px;">
              <div class="rc-section-title">Última limpieza</div>
              <div id="aseo-last-clean" style="color:#666;padding:6px 0;">Cargando...</div>
            </div>
          </div>

          <div id="rc-view-settings" class="rc-view">
            <div class="rc-profile">
              <div class="rc-avatar">${(user.name||'U').split(' ').map(n=>n[0]).join('').toUpperCase()}</div>
              <div>
                <div class="rc-profile-name">${user.name || 'Usuario'}</div>
                <div class="rc-profile-email">${user.email || ''}</div>
              </div>
            </div>
          </div>

              ${BottomNav({ active: 'home', showChat: false }).render()}

        </main>
      </div>
    `,

    loadRender: () => {
      // Inicializar componentes reutilizables
      try { HomeHeader({ title: `¡Hola, ${user.name || 'Usuario'}!`, showLogout: true }).loadRender() } catch (e) { console.warn('[HomeCleaner] HomeHeader loadRender error', e) }
          try { BottomNav({ active: 'home', showChat: false }).loadRender() } catch (e) { console.warn('[HomeCleaner] BottomNav loadRender error', e) }

      // El escaneo se realiza desde la barra inferior (BottomNav)

      // Mostrar última limpieza (si tienes endpoint o storage)
      async function cargarUltimaLimpieza() {
        try {
          const last = JSON.parse(localStorage.getItem("lastCleaning") || "null")
          const el = document.getElementById("aseo-last-clean")
          if (el) {
            if (last && last.zona && last.fecha) {
              el.textContent = `Zona: ${last.zona} — ${new Date(last.fecha).toLocaleTimeString("es-CO")}`
            } else {
              el.textContent = "Sin registros recientes."
            }
          }
        } catch (e) {
          const el = document.getElementById("aseo-last-clean")
          if (el) el.textContent = "Error cargando registro."
        }
      }
      cargarUltimaLimpieza()
    }
  }
}