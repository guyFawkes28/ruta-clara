/**
 * Componente SSTProtocol - Protocolo de Seguridad y Salud en el Trabajo
 * Valida checklist de seguridad antes de permitir ejecución de tarea
 */

export const SSTProtocol = ({ tareaId, onSSTComplete, onCancel }) => {
  const state = {
    step: 1, // 1: Checklist, 2: Foto Selfie, 3: Confirmación
    checklist: {
      epp: false,
      bloqueo_energias: false
    },
    fotoSelfie: null,
    error: null
  }

  return {
    render: () => `
      <div id="sst-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      ">
        <div style="
          background: white;
          border-radius: 16px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
          <h2 style="
            font-size: 20px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 20px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            🛡️ Protocolo SST
          </h2>

          <!-- STEP 1: Checklist -->
          <div id="sst-step-1" style="display: ${state.step === 1 ? 'block' : 'none'};">
            <p style="color: var(--tmid); margin-bottom: 20px; font-size: 14px;">
              Antes de starting, verifica los siguientes puntos de seguridad:
            </p>

            <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
              <!-- EPP Checkbox -->
              <label style="
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                padding: 12px;
                border-radius: 8px;
                background: #f5f5f5;
                transition: background 0.2s;
              " onmouseover="this.style.background='#efefef'" onmouseout="this.style.background='#f5f5f5'">
                <input 
                  type="checkbox" 
                  id="sst-epp"
                  style="width: 20px; height: 20px; cursor: pointer;"
                >
                <span style="font-weight: 600; flex: 1;">
                  ✅ Uso de EPP Completo
                </span>
                <span style="font-size: 12px; color: var(--tsoft);">
                  Guantes, botas, gafas
                </span>
              </label>

              <!-- Bloqueo de Energías Checkbox -->
              <label style="
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                padding: 12px;
                border-radius: 8px;
                background: #f5f5f5;
                transition: background 0.2s;
              " onmouseover="this.style.background='#efefef'" onmouseout="this.style.background='#f5f5f5'">
                <input 
                  type="checkbox" 
                  id="sst-bloqueo"
                  style="width: 20px; height: 20px; cursor: pointer;"
                >
                <span style="font-weight: 600; flex: 1;">
                  🔐 Bloqueo de Energías
                </span>
                <span style="font-size: 12px; color: var(--tsoft);">
                  Breakers/Válvulas
                </span>
              </label>
            </div>

            <div id="sst-error" style="
              display: ${state.error ? 'block' : 'none'};
              background: #fee;
              color: #c33;
              padding: 12px;
              border-radius: 8px;
              font-size: 13px;
              margin-bottom: 16px;
            ">${state.error || ''}</div>

            <div style="display: flex; gap: 10px;">
              <button id="sst-cancel" style="
                flex: 1;
                padding: 12px;
                border: 1.5px solid var(--border);
                background: white;
                color: var(--tmid);
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
              ">Cancelar</button>
              <button id="sst-next" style="
                flex: 1;
                padding: 12px;
                border: none;
                background: #007AFF;
                color: white;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
              ">Siguiente →</button>
            </div>
          </div>

          <!-- STEP 2: Foto Selfie -->
          <div id="sst-step-2" style="display: ${state.step === 2 ? 'block' : 'none'};">
            <p style="color: var(--tmid); margin-bottom: 20px; font-size: 14px;">
              Toma una foto de evidencia con tu EPP puesto (selfie):
            </p>

            <div style="
              display: flex;
              flex-direction: column;
              gap: 16px;
            ">
              <!-- Cámara -->
              <video id="sst-camera" style="
                width: 100%;
                height: 300px;
                background: #000;
                border-radius: 12px;
                object-fit: cover;
              "></video>

              <!-- Preview Foto -->
              <img id="sst-photo-preview" style="
                display: none;
                width: 100%;
                height: 300px;
                border-radius: 12px;
                object-fit: cover;
              ">

              <!-- Botones Foto -->
              <div style="display: flex; gap: 10px;">
                <button id="sst-take-photo" style="
                  flex: 1;
                  padding: 12px;
                  border: none;
                  background: #22C55E;
                  color: white;
                  border-radius: 8px;
                  font-weight: 600;
                  cursor: pointer;
                ">📸 Capturar Foto</button>
                <button id="sst-retake" style="
                  flex: 1;
                  padding: 12px;
                  border: 1.5px solid var(--border);
                  background: white;
                  color: var(--tmid);
                  border-radius: 8px;
                  font-weight: 600;
                  cursor: pointer;
                  display: none;
                ">Retomar</button>
              </div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 16px;">
              <button id="sst-back" style="
                flex: 1;
                padding: 12px;
                border: 1.5px solid var(--border);
                background: white;
                color: var(--tmid);
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
              ">← Atrás</button>
              <button id="sst-confirm" style="
                flex: 1;
                padding: 12px;
                border: none;
                background: #007AFF;
                color: white;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                opacity: 0.5;
                cursor: not-allowed;
              " disabled>Confirmar ✓</button>
            </div>
          </div>

          <!-- STEP 3: Confirmación -->
          <div id="sst-step-3" style="display: ${state.step === 3 ? 'block' : 'none'};">
            <div style="
              background: #f0fdf4;
              padding: 16px;
              border-radius: 8px;
              border: 1.5px solid #22C55E;
              text-align: center;
              margin-bottom: 24px;
            ">
              <div style="
                font-size: 40px;
                margin-bottom: 8px;
              ">✅</div>
              <h3 style="
                margin: 0;
                color: #15803D;
                font-size: 16px;
                font-weight: 700;
              ">Protocolo SST Completado</h3>
              <p style="
                margin: 8px 0 0 0;
                color: #16a34a;
                font-size: 13px;
              ">Estás autorizado para iniciar la tarea</p>
            </div>

            <button id="sst-start-task" style="
              width: 100%;
              padding: 12px;
              border: none;
              background: #007AFF;
              color: white;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              font-size: 14px;
            ">🚀 Iniciar Tarea</button>
          </div>
        </div>
      </div>
    `,

    loadRender: () => {
      const modal = document.getElementById('sst-modal')
      if (!modal) return

      // Cancelar
      document.getElementById('sst-cancel')?.addEventListener('click', () => {
        modal.remove()
        onCancel && onCancel()
      })

      // Step 1 → 2
      document.getElementById('sst-next')?.addEventListener('click', () => {
        const epp = document.getElementById('sst-epp').checked
        const bloqueo = document.getElementById('sst-bloqueo').checked

        if (!epp || !bloqueo) {
          state.error = '⚠️ Debes confirmar TODOS los puntos de seguridad'
          document.getElementById('sst-error').textContent = state.error
          document.getElementById('sst-error').style.display = 'block'
          return
        }

        state.checklist = { epp, bloqueo }
        state.error = null
        state.step = 2
        this.loadRender()
        startCamera()
      })

      // Cámara
      const startCamera = () => {
        const video = document.getElementById('sst-camera')
        if (!video) return

        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
          .then(stream => {
            video.srcObject = stream
          })
          .catch(err => {
            console.error('Error cámara:', err)
            alert('No se pudo acceder a la cámara')
          })
      }

      // Capturar foto
      document.getElementById('sst-take-photo')?.addEventListener('click', () => {
        const video = document.getElementById('sst-camera')
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)

        state.fotoSelfie = canvas.toDataURL('image/jpeg', 0.8)

        document.getElementById('sst-camera').style.display = 'none'
        document.getElementById('sst-photo-preview').src = state.fotoSelfie
        document.getElementById('sst-photo-preview').style.display = 'block'
        document.getElementById('sst-take-photo').style.display = 'none'
        document.getElementById('sst-retake').style.display = 'block'
        document.getElementById('sst-confirm').disabled = false
        document.getElementById('sst-confirm').style.opacity = '1'
        document.getElementById('sst-confirm').style.cursor = 'pointer'
      })

      // Retomar foto
      document.getElementById('sst-retake')?.addEventListener('click', () => {
        const video = document.getElementById('sst-camera')
        video.style.display = 'block'
        document.getElementById('sst-photo-preview').style.display = 'none'
        document.getElementById('sst-take-photo').style.display = 'block'
        document.getElementById('sst-retake').style.display = 'none'
        document.getElementById('sst-confirm').disabled = true
        document.getElementById('sst-confirm').style.opacity = '0.5'
        document.getElementById('sst-confirm').style.cursor = 'not-allowed'
        state.fotoSelfie = null
      })

      // Atrás
      document.getElementById('sst-back')?.addEventListener('click', () => {
        state.step = 1
        this.loadRender()
      })

      // Confirmar foto
      document.getElementById('sst-confirm')?.addEventListener('click', () => {
        state.step = 3
        this.loadRender()
      })

      // Iniciar Tarea
      document.getElementById('sst-start-task')?.addEventListener('click', () => {
        modal.remove()
        onSSTComplete && onSSTComplete({
          checklist: state.checklist,
          foto_selfie: state.fotoSelfie
        })
      })
    }
  }
}

export default SSTProtocol
