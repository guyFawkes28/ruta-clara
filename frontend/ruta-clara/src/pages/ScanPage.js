import maintenanceService from '../api/maintenance.service.js'
import { Html5Qrcode } from 'html5-qrcode'

export const scannerPage = () => ({
  render: () => `
    <div id="scan-screen">
      <div class="login-logo bc">Ruta<em>Clara</em></div>
      <div class="login-sub">Módulo de Mantenimiento</div>
      
      <div class="scan-frame-wrap">
        <div class="scan-ring"></div>
        <div class="scan-frame">
          <div id="reader" style="width: 100%; height: 100%; object-fit: cover;"></div>
          
          <div class="sc tl" style="top:-2px; left:-2px; border-top:4px solid; border-left:4px solid;"></div>
          <div class="sc tr" style="top:-2px; right:-2px; border-top:4px solid; border-right:4px solid;"></div>
          <div class="sc bl" style="bottom:-2px; left:-2px; border-bottom:4px solid; border-left:4px solid;"></div>
          <div class="sc br" style="bottom:-2px; right:-2px; border-bottom:4px solid; border-right:4px solid;"></div>
          
          <div class="scan-line"></div>
        </div>
      </div>

      <div id="scan-txt" class="text-white text-center fw-bold">
        Apunta al código QR de la zona
      </div>

      <div id="loading-overlay" class="d-none" style="margin-top:20px;">
         <div class="spinner-border text-warning" role="status"></div>
      </div>
    </div>`,

  loadRender: async () => {
    const html5QrCode = new Html5Qrcode("reader");
    
    const onScanSuccess = async (decodedText) => {
      try {
        const loading = document.getElementById("loading-overlay");
        if(loading) loading.classList.remove("d-none");
        
        await html5QrCode.stop();

        // Limpieza de texto plano para evitar errores de URL
        const qrFinal = decodedText.trim();
        
        // Llamamos al servicio (asegúrate que maintenanceService esté bien importado)
        const data = await maintenanceService.getZoneByQR(encodeURIComponent(qrFinal));
        
        window.location.hash = `#/zone/${data.info_zona.id}`;
      } catch (error) {
        alert(error.error || "Zona no encontrada o error de red");
        location.reload(); // Reinicio rápido si falla
      }
    };

    const config = { 
      fps: 15, 
      qrbox: { width: 200, height: 200 },
      aspectRatio: 1.0 // Fuerza cuadrado para que encaje en tu .scan-frame
    };

    // Iniciar cámara
    html5QrCode.start(
      { facingMode: "environment" }, 
      config,
      onScanSuccess
    ).catch(err => {
      console.error("No se pudo iniciar la cámara:", err);
      document.getElementById("scan-txt").innerHTML = 
        '<span style="color:#FCA5A5">Error: Permiso de cámara denegado o sin HTTPS</span>';
    });
  }
});