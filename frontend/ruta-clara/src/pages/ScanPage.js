import maintenance_service from '../api/maintenance.service.js'
import { toast } from '../util/ux.js'
import { Html5Qrcode } from 'html5-qrcode'
import { persistence } from '../util/persistence.js'

export const scannerPage = () => ({
  render: () => `
    <div id="scan-screen">
      <div class="login-logo bc">Ruta<em>Clara</em></div>
      <div class="login-sub">Módulo de Mantenimiento</div>
      
      <div class="scan-frame-wrap">
        <div class="scan-ring"></div>
        <div class="scan-frame">
          <div id="reader" style="width: 100%; height: 100%; object-fit: cover;"></div>
          
          <div class="sc tl"></div>
          <div class="sc tr"></div>
          <div class="sc bl"></div>
          <div class="sc br"></div>
          
          <div class="scan-line"></div>
        </div>
      </div>

      <div id="scan-txt" class="text-white text-center fw-bold">
        Apunta al código QR de la zona
      </div>
      
      <div class="scanner-cta" style="margin-top:18px;padding:0 16px;">
        <button id="scan-home-btn" class="hdr-home-btn" aria-label="Volver al inicio">🏠 Volver al inicio</button>
      </div>

      <div id="loading-overlay" class="d-none" style="margin-top:20px;">
         <div class="spinner-border text-warning" role="status"></div>
      </div>
    </div>`,

  loadRender: async () => {
    const html5QrCode = new Html5Qrcode("reader");

    // Bloqueo del botón atrás mientras la cámara está activa
    const preventBack = () => {
      window.history.pushState(null, null, window.location.href);
    };
    window.history.pushState(null, null, window.location.href);
    window.addEventListener("popstate", preventBack);

    const onScanSuccess = async (decodedText) => {
      try {
        const loading = document.getElementById("loading-overlay");
        if(loading) loading.classList.remove("d-none");
        
        await html5QrCode.stop();
        
        // Liberar el bloqueo para poder navegar
        window.removeEventListener("popstate", preventBack);

        const qrFinal = decodedText.trim();
        console.log("Código QR detectado:", qrFinal);
        const data = await maintenance_service.get_zone_by_qr(encodeURIComponent(qrFinal));
        
        // REDIRECCIÓN LIMPIA: Reemplaza el scanner en el historial
        // Decide destino según rol del usuario: aseo -> pantalla de limpieza, otros -> vista de zona
        const user = persistence.getUser()
        const role = user?.rol ?? user?.role ?? user?.data?.rol ?? user?.data?.role ?? null
        const roleNorm = role ? String(role).toLowerCase() : null
        const targetHash = (roleNorm === 'aseo' || roleNorm === 'cleaner') ? `#/clean/${data.info_zona.id}` : `#/zone/${data.info_zona.id}`;
        window.location.replace(window.location.pathname + targetHash);

      } catch (error) {
        toast(error.error || "Zona no encontrada", 'error');
        setTimeout(() => location.reload(), 1200);
      }
    };

    const config = { 
      fps: 15, 
      qrbox: { width: 220, height: 220 },
      aspectRatio: 1.0 
    };

    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
      .catch(err => {
        console.error("Error al inicializar el escáner: ", err);
        window.removeEventListener("popstate", preventBack);
        document.getElementById("scan-txt").innerHTML = 
          '<span style="color:#FCA5A5">Error: Permiso de cámara denegado o no disponible</span>';
      });
    
    // Handler para el botón Volver al inicio (detiene cámara y navega a #/home)
    const scanHomeBtn = document.getElementById('scan-home-btn');
    if (scanHomeBtn) {
      scanHomeBtn.onclick = async () => {
        try { await html5QrCode.stop(); } catch(e) { /* ignore */ }
        window.removeEventListener("popstate", preventBack);
        window.location.hash = '#/home';
      };
    }
  }
});
