export const notFoundPage = () => ({
  render: () => {
    return `
    <div class="d-flex vh-100 justify-content-center align-items-center">
      <div class="text-center">
        <div style="font-size:48px">🔍</div>
        <h2 class="bc fw-bold" style="color:var(--navy);font-size:48px">404</h2>
        <p class="text-muted" style="font-weight:600">Vista no encontrada</p>
        <a href="#/login" class="text-primary fw-bold">← Volver al inicio</a>
      </div>
    </div>`
  },
  loadRender: () => {}
});