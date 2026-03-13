import { persistence } from "../util/persistence.js"

export const HomeCleanerPage = () => {
  // Puedes guardar el usuario para mostrar el nombre
  const user = persistence.getUser() || {}
  const nombre = user.name || user.usuario || user.email || 'Usuario'

  return {
    render: () => `
      <div class="rc-app aseo-home">
        <main id="rc-main">
          <div class="rc-welcome">
            <h2>¡Hola, ${nombre}!</h2>
            <div class="rc-welcome-date">${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div class="rc-section">
            <div class="rc-section-title">¿A qué zona vas a limpiar?</div>
            <p style="margin-bottom:16px;">Presiona el botón para escanear el código QR de la zona que vas a limpiar.</p>
            <button class="btn btn-primary" id="aseo-scan-btn" style="font-size:1.1em;padding:16px 24px">
              📷 Escanear zona
            </button>
          </div>
          <div class="rc-section" style="margin-top:24px;">
            <div class="rc-section-title">Última limpieza</div>
            <div id="aseo-last-clean" style="color:#666;padding:6px 0;">Cargando...</div>
          </div>
        </main>
      </div>
    `,

    loadRender: () => {
      // Botón de escaneo
      const scanBtn = document.getElementById("aseo-scan-btn")
      if (scanBtn) {
        scanBtn.onclick = () => window.location.hash = "#/scanner"
      }

      // Mostrar última limpieza (si tienes endpoint o storage)
      // Suponiendo que la API tiene /getLastCleaning (adáptalo)
      async function cargarUltimaLimpieza() {
        try {
          // TODO: Cambia por tu verdadera API/service
          // Ejemplo: const last = await maintenanceService.getLastCleaning(user.id)
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