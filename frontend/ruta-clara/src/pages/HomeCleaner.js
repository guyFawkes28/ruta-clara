import { persistence } from "../util/persistence.js"
import { HomeHeader } from "../components/HomeHeader.js"
import { BottomNav } from "../components/BottomNav.js"

export const HomeCleanerPage = () => {
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
              <div class="rc-section-title">Tus limpiezas recientes</div>
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
      try { HomeHeader({ title: `¡Hola, ${user.name || 'Usuario'}!`, showLogout: true }).loadRender() } catch (e) { console.warn('[HomeCleaner] HomeHeader loadRender error', e) }
      try { BottomNav({ active: 'home', showChat: false }).loadRender() } catch (e) { console.warn('[HomeCleaner] BottomNav loadRender error', e) }

      async function cargarUltimaLimpieza() {
        const el = document.getElementById("aseo-last-clean")
        try {
          const res = await fetch(`http://localhost:4000/api/cleanings`)

          if (!res.ok) throw new Error(`Error HTTP ${res.status}`)

          const registros = await res.json()

          // Filtrar solo los del usuario actual
          const mios = registros.filter(r => r.user_name === user.name)

          if (!el) return

          if (mios.length === 0) {
            el.textContent = "Sin registros recientes."
            return
          }

          // Renderizar todas las limpiezas del usuario en una lista
          el.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div style="font-size:13px;color:var(--tsoft);">Mostrando ${mios.length} registros</div>
              ${mios.map(item => {
                const fecha = new Date(item.createdAt).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });
                const hora = new Date(item.createdAt).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' });
                return `
                  <div class="aseo-clean-item" style="background:#fff;border:1px solid var(--border);padding:10px;border-radius:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                      <div style="font-weight:800">Zona: ${item.zone_id}</div>
                      <div style="font-size:12px;color:var(--tsoft)">${fecha} · ${hora}</div>
                    </div>
                    <div style="margin-top:6px;color:#333"><strong>Descripción:</strong> ${item.descriptions || item.descriptions || ''}</div>
                    <div style="margin-top:6px;font-size:13px;color:var(--tsoft)"><strong>Hora fin:</strong> ${item.hora_fin || 'No registrada'}</div>
                  </div>
                `
              }).join('')}
            </div>
          `
        } catch (e) {
          console.error('[HomeCleaner] Error cargando última limpieza:', e)
          if (el) el.textContent = "Error cargando registro."
        }
      }

      cargarUltimaLimpieza()
    }
  }
}