export const sidebarView = ({ activePage = 'dashboard', onNavigate } = {}) => ({
  render: () => `
    <aside id="db-sidebar">
      <div class="db-logo">Ruta<em>Clara</em></div>

      <div class="db-sidebar-card">
        <nav>
          <ul class="db-nav">
            <li><a data-db-page="dashboard" class="${activePage === 'dashboard' ? 'active' : ''}"><span class="nav-emoji">📊</span><span class="nav-label">Dashboard</span></a></li>
            <li><a data-db-page="equipos" class="${activePage === 'equipos' ? 'active' : ''}"><span class="nav-emoji">🔧</span><span class="nav-label">Equipos</span></a></li>
            <li><a data-db-page="inspecciones" class="${activePage === 'inspecciones' ? 'active' : ''}"><span class="nav-emoji">📋</span><span class="nav-label">Inspecciones</span></a></li>
            <li><a data-db-page="reportes" class="${activePage === 'reportes' ? 'active' : ''}"><span class="nav-emoji">📈</span><span class="nav-label">Reportes</span></a></li>
            <li><a data-db-page="usuarios" class="${activePage === 'usuarios' ? 'active' : ''}"><span class="nav-emoji">👥</span><span class="nav-label">Usuarios</span></a></li>
          </ul>
        </nav>
      </div>
    </aside>
  `,

  loadRender: () => {
    document.querySelectorAll('#db-sidebar [data-db-page]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        onNavigate?.(a.dataset.dbPage);
      });
    });
  }
});

export default sidebarView;
