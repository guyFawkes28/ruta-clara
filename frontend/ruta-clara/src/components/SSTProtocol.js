/**
 * Componente SSTProtocol - Protocolo de Seguridad y Salud en el Trabajo
 * Simple checklist de seguridad - sin cámara, solo checklist de EPP y bloqueo de energías
 */

// Recomendaciones de seguridad por tipo de activo
const SST_RECOMENDACIONES = {
  'Laptop': ['Desconectar de energía', 'Dejar enfriar si estaba en uso', 'Usar pulsera antiestática'],
  'Computadora de Escritorio': ['Apagar y desconectar', 'Esperar 30 segundos', 'Usar guantes antiestáticos'],
  'Monitor': ['Desconectar cable de poder', 'Evitar tocar la pantalla', 'Descargar estática'],
  'Teclado': ['Desconectar USB', 'Limpiar con paño antiestático', 'No usar agua'],
  'Mouse': ['Desconectar USB o batería', 'Limpiar superficie', 'Secar completamente'],
  'Impresora': ['Apagar de inmediato', 'Desconectar poder', 'Esperar a que se enfríe'],
  'Scanner': ['Desconectar de energía', 'No abrir mientras esté caliente', 'Limpiar cristal cuidadosamente'],
  'Servidor': ['CRÍTICO: Contactar a IT', 'No apagar sin autorización', 'Usar pulsera antiestática'],
  'Silla': ['Inspeccionar estructura', 'Verificar estabilidad', 'Usar herramientas apropiadas'],
  'Escritorio': ['Verificar cables sueltos', 'Revisar estructura', 'Usar herramientas manuales']
}

export const SSTProtocol = ({ tareaId, tareaData, onSSTComplete, onCancel }) => {
  const state = {
    checklist: {
      epp: false,
      bloqueo_energias: false
    },
    error: null
  }

  // Obtener recomendaciones según tipo de activo
    const get_recommendations = () => {
    if (!tareaData?.activos) return []
    const tipoActivo = tareaData.activos?.tipos_activo?.nombre || 'Genérico'
    return SST_RECOMENDACIONES[tipoActivo] || SST_RECOMENDACIONES['Genérico'] || [
      'Usar equipo de protección personal (EPP)',
      'Realizar bloqueo de energías',
      'Verificar seguridad del área'
    ]
  }

  // Crear objeto del componente para usarlo en callbacks
  const component = {
    render: () => {
      const recomendaciones = get_recommendations()
      const tipoActivo = tareaData?.activos?.tipos_activo?.nombre || 'Activo'
      const nombreActivo = tareaData?.activos?.etiqueta || 'desconocido'
      
      return `
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
          max-width: 600px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-height: 80vh;
          overflow-y: auto;
        ">
          <h2 style="
            font-size: 20px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            🛡️ Protocolo SST
          </h2>
          
          <p style="
            font-size: 13px;
            color: #999;
            margin: 0 0 16px 0;
          ">
            ${tipoActivo} - ${nombreActivo}
          </p>

          <p style="
            font-size: 14px;
            color: #666;
            margin: 0 0 16px 0;
          ">
            Verifica que hayas completado todas las medidas de seguridad antes de iniciar la tarea.
          </p>

          <!-- Recomendaciones personalizadas -->
          <div style="
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
          ">
            <p style="
              font-size: 13px;
              font-weight: 600;
              color: #b45309;
              margin: 0 0 8px 0;
            ">
               Recomendaciones para este equipo:
            </p>
            <ul style="
              margin: 0;
              padding-left: 20px;
              font-size: 13px;
              color: #92400e;
              line-height: 1.6;
            ">
              ${recomendaciones.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>

          <!-- Checklist -->
          <div style="
            background: #f5f5f5;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
          ">
            <label style="
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 16px;
              cursor: pointer;
              font-size: 15px;
              font-weight: 600;
            ">
              <input 
                type="checkbox" 
                id="sst-epp"
                style="width: 20px; height: 20px; cursor: pointer;"
              />
              <span>✅ Equipo de Protección Personal (EPP) verificado</span>
            </label>

            <label style="
              display: flex;
              align-items: center;
              gap: 12px;
              cursor: pointer;
              font-size: 15px;
              font-weight: 600;
            ">
              <input 
                type="checkbox" 
                id="sst-bloqueo"
                style="width: 20px; height: 20px; cursor: pointer;"
              />
              <span>⚡ Bloqueo de energías completado</span>
            </label>
          </div>

          <!-- Mensaje de error -->
          <div id="sst-error" style="
            background: #fee;
            color: #c33;
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 20px;
            display: none;
            border: 1px solid #fcc;
          "></div>

          <!-- Botones -->
          <div style="
            display: flex;
            gap: 12px;
            justify-content: flex-end;
          ">
            <button id="sst-cancel" style="
              padding: 12px 20px;
              border: 2px solid #ddd;
              background: white;
              color: #666;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s;
            " onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
              Cancelar
            </button>

            <button id="sst-confirm" style="
              padding: 12px 20px;
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s;
            " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
              🚀 Iniciar Tarea
            </button>
          </div>
        </div>
      </div>
    `
    },

    loadRender: () => {
      const modal = document.getElementById('sst-modal')
      if (!modal) return

      // Cancelar
      document.getElementById('sst-cancel')?.addEventListener('click', () => {
        modal.remove()
        onCancel && onCancel()
      })

      // Confirmar - Iniciar Tarea directamente después de validar checkboxes
      document.getElementById('sst-confirm')?.addEventListener('click', () => {
        const epp = document.getElementById('sst-epp').checked
        const bloqueo = document.getElementById('sst-bloqueo').checked
        const errorDiv = document.getElementById('sst-error')

        if (!epp || !bloqueo) {
          state.error = ' Debes confirmar TODOS los puntos de seguridad'
          errorDiv.textContent = state.error
          errorDiv.style.display = 'block'
          return
        }

        // Si todo está bien, iniciar tarea directamente
        state.checklist = { epp, bloqueo_energias: bloqueo }
        state.error = null
        errorDiv.style.display = 'none'
        
        modal.remove()
        onSSTComplete && onSSTComplete({
          checklist: state.checklist
        })
      })
    }
  }

  return component
}

export default SSTProtocol
