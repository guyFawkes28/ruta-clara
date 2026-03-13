import { persistence } from '../util/persistence.js';

export const homePage = () => ({
  render: () => `
    <div class="home-wrap">
      <section class="home-hero card p-4 mb-3">
        <h1 id="home-title">Inicio</h1>
        <p id="home-welcome" class="mb-2">Bienvenido al panel principal.</p>
        <p class="home-description mb-0">
          Ruta Clara centraliza reportes operativos de Aseo y Mantenimiento para mejorar el seguimiento,
          la trazabilidad y la comunicacion entre equipos en tiempo real.
        </p>
      </section>

      <section class="home-reports card p-4">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h2 class="home-subtitle mb-0">Reportes Generados en Chat</h2>
          <button id="clearHomeReportsBtn" class="btn btn-sm btn-outline-secondary">Limpiar Reportes</button>
        </div>
        <div id="home-reports-list" class="home-reports-list"></div>
      </section>
    </div>
  `,

  loadRender: () => {
    const welcome = document.getElementById('home-welcome');
    const reportsContainer = document.getElementById('home-reports-list');
    const clearBtn = document.getElementById('clearHomeReportsBtn');
    const user = persistence.getUser();
    const name = user && (user.nombre || user.name) ? (user.nombre || user.name) : 'YULL';
    if (welcome) welcome.textContent = `Bienvenido, ${name}`;

    const renderReports = () => {
      if (!reportsContainer) return;

      const reports = persistence.getReports();

      if (!reports.length) {
        reportsContainer.innerHTML = `
          <div class="home-empty-state">
            Aun no hay reportes guardados. Genera uno desde el chat para verlo aqui.
          </div>
        `;
        return;
      }

      reportsContainer.innerHTML = reports.map((report, index) => {
        const date = new Date(report.createdAt).toLocaleString();
        const safeText = String(report.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        return `
          <article class="home-report-item">
            <div class="home-report-head">
              <span class="home-report-index">Reporte #${index + 1}</span>
              <time class="home-report-date">${date}</time>
            </div>
            <pre class="home-report-text">${safeText}</pre>
          </article>
        `;
      }).join('');
    };

    renderReports();

    if (clearBtn) {
      clearBtn.onclick = () => {
        persistence.clearReports();
        renderReports();
      };
    }
  }
});