import { routerManager } from "./routes/router.js";

window.addEventListener("hashchange",routerManager)
window.addEventListener("load",routerManager)

// Escuchar cambios en registros de limpieza a nivel global
window.addEventListener('cleaning:created', (e) => {
  try {
    console.log('[Global] Evento cleaning:created recibido:', e.detail)
    // Si el Dashboard tiene la función disponible, actualizar registros
    if (typeof window.cargarRegistrosAseoGlobal === 'function') {
      window.cargarRegistrosAseoGlobal(true) // Si es true, fuerza recarga sin throttle
      console.log('[Global] Registros de aseo actualizados en tiempo real (bypass throttle)')
    } else {
      console.log('[Global] Dashboard no disponible aún, registro se cargará al navegar')
    }
  } catch (err) {
    console.error('[Global] Error procesando evento cleaning:created:', err)
  }
})