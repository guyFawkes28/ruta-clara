
export const scannerPage = () => ({

  render: () => `
    <!-- ══ SCAN SCREEN ══ -->
    <div id="scan-screen">

      <!-- Logo -->
      <div class="bc fw-bold text-white text-center lh-1 mb-1" style="font-size:44px">
        Ruta<em style="color:var(--amber);font-style:normal">Clara</em>
      </div>
      <div class="text-center mb-4"
           style="font-size:13px;color:rgba(255,255,255,.4);font-weight:600;letter-spacing:.3px">
        Escanea la zona para comenzar
      </div>

      <!-- Marco QR animado -->
      <div class="scan-frame-wrap">
        <div class="scan-ring"></div>
        <div class="scan-frame">
          <div class="sc tl"></div>
          <div class="sc tr"></div>
          <div class="sc bl"></div>
          <div class="sc br"></div>
          <div class="scan-line"></div>
          <span style="font-size:64px;opacity:.18">📱</span>
        </div>
      </div>

      <!-- Texto instrucción -->
      <div id="scan-txt"
           class="text-white text-center fw-bold mb-2"
           style="font-size:16px;line-height:1.5">
        Apunta al código QR de la zona
      </div>

      <!-- Estado: detectando -->
      <div class="scan-detecting" id="scan-detecting">
        ✅ Sala 3 — Piso 4 detectada
      </div>

      <!-- Botón escanear -->
      <button class="scan-btn" id="scan-btn">
        📷 Escanear QR
      </button>

    </div>

    <!-- Toast (compartido, vive aquí mientras no haya layout global) -->
    <div class="toast-app" id="toast"></div>
  `,

  loadRender: () => {

function doScan() {
        const btn = document.getElementById('scan-btn');
        btn.disabled = true;
        btn.innerHTML = '⏳ Leyendo código QR…';

        setTimeout(() => {
            // Simulamos que el QR leído es "SALA1-P1"
            // En el futuro, aquí es donde usarías una librería de cámara real
            const qrDetectado = "SALA3-P4"; 

            const det = document.getElementById('scan-detecting');
            det.style.display = 'block';
            det.innerHTML = `✅ Zona ${qrDetectado} detectada`; // Dinámico
            document.getElementById('scan-txt').style.opacity = '0';

            setTimeout(() => enterApp(qrDetectado), 1100);
        }, 2000);
    }

    function enterApp(qrCode) {
        const sc = document.getElementById('scan-screen');
        sc.style.opacity = '0';
        sc.style.transition = 'opacity .4s';

        setTimeout(() => {
            // CAMBIO CLAVE: Pasamos el código QR en la URL
            window.location.hash = `#/zone/${qrCode}`; 
        }, 400);
    }

    document.getElementById('scan-btn').addEventListener('click', doScan);
}
});
