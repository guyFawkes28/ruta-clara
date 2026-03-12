export const Sidebar = ({ onNavigate } = {}) => {
  let currentView = 'inicio';

  return {
    render: () => `
    <div id="wrapper" class="d-flex">
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
      <div id="sidebar-wrapper" class="bg-dark text-white d-flex flex-column">
        <button class="sidebar-close" id="sidebar-close" aria-label="Cerrar menú">&times;</button>
        <div class="p-4">
          <h4 class="mb-0"><i class="bi bi-building-gear me-2"></i>VISTA ADMIN</h4>
          <small class="text-muted">Panel de Control</small>
        </div>

        <div class="mt-3 flex-grow-1 p-2">
          <button class="nav-link-custom w-100 mb-1 btn btn-link text-start text-white" data-view="inicio">
            <i class="bi bi-house me-2"></i>Inicio
          </button>
          <button class="nav-link-custom w-100 mb-1 btn btn-link text-start text-white" data-view="sala1">
            <i class="bi bi-person-video3 me-2"></i>Sala 1
          </button>
          <button class="nav-link-custom w-100 mb-1 btn btn-link text-start text-white" data-view="inventario">
            <i class="bi bi-box-seam me-2"></i>Inventario
          </button>
          <button class="nav-link-custom w-100 mb-1 btn btn-link text-start text-white" data-view="chat">
            <i class="bi bi-chat-dots me-2"></i>Chat Empleado
          </button>
        </div>

        <div class="p-3 border-top border-secondary">
          <button class="nav-link-custom text-danger btn btn-link w-100 text-start" data-view="salir">
            <i class="bi bi-box-arrow-left me-2"></i>Cerrar Sesión
          </button>
        </div>
      </div>

      <div id="page-content-wrapper" class="flex-grow-1">
        <nav class="navbar navbar-light bg-white border-bottom p-3 shadow-sm">
          <button class="btn btn-dark" id="menu-toggle"><i class="bi bi-list"></i></button>
          <span class="ms-3 fw-bold" id="current-view-title">Inicio</span>
        </nav>
        <div class="p-4" id="main-view"></div>
      </div>
    </div>
  `,

    loadRender: () => {
      const wrapper = document.getElementById('wrapper');
      const overlay = document.getElementById('sidebar-overlay');
      const closeBtn = document.getElementById('sidebar-close');
      const menuToggle = document.getElementById('menu-toggle');
      const title = document.getElementById('current-view-title');

      function setInitialState() {
        if (window.innerWidth < 768) {
          wrapper.classList.add('toggled');
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        } else {
          wrapper.classList.remove('toggled');
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
      setInitialState();

      function openMenu() {
        wrapper.classList.remove('toggled');
        if (window.innerWidth < 768) {
          overlay.classList.add('active');
          document.body.style.overflow = 'hidden';
        } else {
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      }

      function closeMenu() {
        wrapper.classList.add('toggled');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }

      menuToggle?.addEventListener('click', () => {
        if (wrapper.classList.contains('toggled')) {
          openMenu();
        } else {
          closeMenu();
        }
      });

      closeBtn?.addEventListener('click', closeMenu);
      overlay?.addEventListener('click', closeMenu);

      window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
          wrapper.classList.remove('toggled');
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        } else {
          wrapper.classList.add('toggled');
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      });

      // --- Navegación ---
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-view]');
        if (!btn) return;

        // Cerrar menú en móvil al hacer clic
        if (window.innerWidth < 768) {
          closeMenu();
        }

        const view = btn.getAttribute('data-view');
        if (view === 'salir') {
          localStorage.removeItem('user');
          // Redirige a login a través del onNavigate para que el router se encargue
          onNavigate && onNavigate('login'); 
          return;
        }
        
        currentView = view;
        title && (title.innerText = btn.innerText.trim());
        onNavigate && onNavigate(view);
      });
    }
  };
};