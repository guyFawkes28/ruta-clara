import { persistence } from '../util/persistence.js';

export const chatPage = () => ({
  render: () => {
    return `<div class="chat-container">
    <div class="row g-0 shadow-sm rounded-4 overflow-hidden bg-white chat-shell">
        

        <div class="col-12 d-flex flex-column chat-col">
            <div class="p-3 border-bottom d-flex align-items-center justify-content-between bg-white">
                <div class="d-flex align-items-center gap-3">
                    <div class="avatar sm">E</div>
                    <h6 class="mb-0 fw-bold">Chat</h6>
                </div>
                <button id="clearChatBtn" class="btn btn-sm btn-outline-secondary">Limpiar Chat</button>
            </div>

            <div class="chat-messages flex-grow-1 p-4 bg-white" id="chatMessages">
                </div>

            <div class="p-3 border-top bg-light chat-composer">
                <form id="chatForm" class="d-flex gap-2 align-items-center position-relative">
                  <input id="chatInput" type="text" class="form-control rounded-pill px-4" placeholder="Escribe para corregir...">
                  <button type="submit" class="btn btn-send rounded-circle ms-auto">
                    <i class="bi bi-send-fill"></i>
                  </button>
                </form>
            </div>
        </div>
    </div>
  </div>`;
  },

  loadRender: () => {
    const container = document.getElementById('chatMessages');
    const form = document.getElementById('chatForm');
    const input = document.getElementById('chatInput');
    const clearBtn = document.getElementById('clearChatBtn');

    if (!container || !form || !input) return;

    const escapeHtml = (value) => String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const formatTime = (dateValue) => {
      const date = dateValue ? new Date(dateValue) : new Date();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    function appendMessage(direction, text, options = {}) {
      const { save = true, createdAt } = options;
      const time = formatTime(createdAt);
      const cls = direction === 'sent' ? 'message sent mb-3' : 'message received mb-3';
      const safeText = escapeHtml(text);

      container.insertAdjacentHTML('beforeend', `
        <div class="${cls}">
          <div class="message-content shadow-sm p-3 rounded-3">${safeText}</div>
          <small class="text-muted">${time}</small>
        </div>
      `);

      if (save) {
        persistence.saveChatMessage(direction, text);
      }

      container.scrollTop = container.scrollHeight;
    }

    const history = persistence.getChatHistory();
    history.forEach((item) => {
      appendMessage(item.direction, item.text, {
        save: false,
        createdAt: item.createdAt
      });
    });

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      appendMessage('sent', text);
      input.value = '';

      try {
        const response = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });

        const raw = await response.text();
        let data;

        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error('La respuesta del servidor no es JSON. Verifica que /api/chat apunte al backend correcto.');
        }

        if (!response.ok) throw new Error(data?.error || 'Error en el servidor');

        const corregido = data.reply || 'No pude corregir el texto.';
        appendMessage('received', corregido);
        persistence.saveReport(corregido);
      } catch (error) {
        appendMessage('received', `Error: ${error.message || 'No fue posible conectar con el servidor.'}`);
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        container.innerHTML = '';
        persistence.clearChatHistory();
      });
    }
  }
});