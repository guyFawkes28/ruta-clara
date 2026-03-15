/**
 * Componente Modal - Diálogos estilizados reutilizables
 * Sigue el diseño visual del proyecto
 */

export const Modal = ({ 
  title = ' Información', 
  message = '', 
  type = 'info', // 'info', 'success', 'error', 'warning'
  buttons = [{ text: 'OK', onClick: () => {}, style: 'primary' }],
  icon = null
}) => {
  const colors = {
    info: { bg: '#E3F2FD', border: '#2196F3', icon: '💡' },
    success: { bg: '#E8F5E9', border: '#4CAF50', icon: '✅' },
    error: { bg: '#FFEBEE', border: '#F44336', icon: '' },
    warning: { bg: '#FFF3E0', border: '#FF9800', icon: '' }
  }

  const config = colors[type] || colors.info
  const displayIcon = icon || config.icon

  return {
    render: () => `
      <div id="modal-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9998;
        backdrop-filter: blur(2px);
      ">
        <div style="
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: slideUp 0.3s ease-out;
          border-left: 5px solid ${config.border};
        ">
          <!-- Header con icono -->
          <div style="
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
          ">
            <div style="
              font-size: 28px;
              line-height: 1;
            ">${displayIcon}</div>
            <h2 style="
              margin: 0;
              font-size: 18px;
              font-weight: 700;
              color: #1a1a1a;
            ">${title}</h2>
          </div>

          <!-- Mensaje -->
          <div style="
            background: ${config.bg};
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            font-size: 14px;
            color: #333;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
          ">${message}</div>

          <!-- Botones -->
          <div style="
            display: flex;
            gap: 12px;
            justify-content: flex-end;
          ">
            ${buttons.map(btn => `
              <button class="modal-btn modal-btn-${btn.style || 'secondary'}" style="
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
                ${btn.style === 'primary' ? `
                  background: #2196F3;
                  color: white;
                ` : `
                  background: #f0f0f0;
                  color: #1a1a1a;
                `}
              " 
              data-btn-text="${btn.text}"
              >
                ${btn.text}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <style>
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .modal-btn:active {
          transform: translateY(0);
        }

        .modal-btn-primary:hover {
          background: #1976D2;
        }

        .modal-btn-secondary:hover {
          background: #e0e0e0;
        }
      </style>
    `,

    loadRender: () => {
      // Vincular onclick a los botones
      buttons.forEach(btn => {
        const btnElement = document.querySelector(`[data-btn-text="${btn.text}"]`)
        if (btnElement) {
          btnElement.addEventListener('click', () => {
            // Cerrar modal
            const overlay = document.getElementById('modal-overlay')
            if (overlay) overlay.remove()
            // Ejecutar callback
            if (btn.onClick) btn.onClick()
          })
        }
      })
    }
  }
}

export default Modal
