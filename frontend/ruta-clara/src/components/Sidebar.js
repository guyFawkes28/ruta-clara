export const sidebarView = ({ activePage = 'dashboard', onNavigate } = {}) => {
  const getNotificationCount = () => {
    try {
      const count = localStorage.getItem('dashboard_chat_notifications') || '0'
      return parseInt(count, 10) || 0
    } catch {
      return 0
    }
  }

  return {
    render: () => {
      const notifCount = getNotificationCount()
      const notifBadge = notifCount > 0 ? `<span class="db-notif-badge">${notifCount > 99 ? '99+' : notifCount}</span>` : ''
      
      return `
    <aside id="db-sidebar">
      <div class="db-logo">Ruta<em>Clara</em></div>

      <div class="db-sidebar-card">
        <nav>
          <ul class="db-nav">
            <li><a data-db-page="dashboard" class="${activePage === 'dashboard' ? 'active' : ''}"><span class="nav-emoji">📊</span><span class="nav-label">Dashboard</span></a></li>
            <li><a data-db-page="equipment" class="${activePage === 'equipment' ? 'active' : ''}"><span class="nav-emoji">🔧</span><span class="nav-label">Equipos</span></a></li>
            <li><a data-db-page="inspections" class="${activePage === 'inspections' ? 'active' : ''}"><span class="nav-emoji">📋</span><span class="nav-label">Inspecciones</span></a></li>
            <li><a data-db-page="reports" class="${activePage === 'reports' ? 'active' : ''}"><span class="nav-emoji">📈</span><span class="nav-label">Reportes</span></a></li>
            <li><a data-db-page="chat" class="${activePage === 'chat' ? 'active' : ''}" style="position: relative;"><span class="nav-emoji">💬</span><span class="nav-label">Chat</span>${notifBadge}</a></li>
            <li><a data-db-page="home-cleaner" class="${activePage === 'home-cleaner' ? 'active' : ''}"><span class="nav-emoji">🧹</span><span class="nav-label">Registro Aseo</span></a></li>
        </nav>
      </div>
    </aside>
  `
    },

    loadRender: () => {
      document.querySelectorAll('#db-sidebar [data-db-page]').forEach(a => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          onNavigate?.(a.dataset.dbPage);
        });
      });

      // Sidebar: no mostrar resumen de aseo aquí (se muestra en Dashboard)
    }
  }
}

export default sidebarView;
