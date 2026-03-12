export const chatPage = () => ({
    render: () => {
      return `<div class="chat-container p-4">
    <div class="row g-0 shadow-sm rounded-4 overflow-hidden bg-white" style="height: 80vh;">
        <div class="col-md-4 col-lg-3 border-end d-flex flex-column bg-light chat-sidebar d-none d-md-flex">
            <div class="p-3 border-bottom bg-white">
                <h5 class="fw-bold mb-0">Mensajes</h5>
            </div>
            <div class="flex-grow-1 overflow-y-auto">
                <div class="contact-item active p-3 d-flex align-items-center gap-3">
                    <div class="avatar">E</div>
                    <div>
                      <h6 class="mb-0 fw-bold">Juan Empleado</h6>
                      <small class="text-muted d-none d-sm-inline">En línea</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-8 col-lg-9 d-flex flex-column chat-col">
            <div class="p-3 border-bottom d-flex align-items-center justify-content-between bg-white">
                <div class="d-flex align-items-center gap-3">
                    <div class="avatar sm">E</div>
                    <h6 class="mb-0 fw-bold">Chat con Juan Empleado</h6>
                </div>
                <button id="clearChatBtn" class="btn btn-sm btn-outline-secondary">Limpiar Chat</button>
            </div>

            <div class="chat-messages flex-grow-1 p-4 overflow-y-auto bg-white" id="chatMessages" style="min-height: 0;">
                </div>

            <div class="p-3 border-top bg-light">
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

      function appendMessage(direction, text) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const cls = direction === 'sent' ? 'message sent mb-3' : 'message received mb-3';
        
        container.insertAdjacentHTML('beforeend', `
          <div class="${cls}">
            <div class="message-content shadow-sm p-3 rounded-3">${text}</div>
            <small class="text-muted">${time}</small>
          </div>
        `);
        container.scrollTop = container.scrollHeight;
      }

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

          if (!response.ok) throw new Error("Error en el servidor");

          const data = await response.json();
          
          // AQUÍ ESTÁ EL TRUCO: Accedemos directamente a la propiedad 'reply'
          const corregido = data.reply || "No pude corregir el texto.";
          appendMessage('received', corregido);

        } catch (error) {
          appendMessage('received', " Error: Verifica que tu servidor esté corriendo.");
        }
      });
    }
  });