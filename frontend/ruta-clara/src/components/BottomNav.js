export const BottomNav = (opts = {}) => {
  return {
    render: () => {
      const showChat = opts.showChat !== false
      return `
      <nav class="rc-bottom-nav">
        <button class="rc-nav-btn ${opts.active === 'home' ? 'active' : ''}" data-rc-view="home">
          <span class="rc-nav-icon">🏠</span>
          Inicio
        </button>
        ${showChat ? `<button class="rc-nav-btn ${opts.active === 'chat' ? 'active' : ''}" data-rc-view="chat">
          <span class="rc-nav-icon">💬</span>
          Chat
        </button>` : ''}
        <button class="rc-nav-btn" id="rc-scan-btn" aria-label="Escanear">
          <span class="rc-nav-icon">📷</span>
        </button>
      </nav>
    `
    },
    loadRender: () => {
      // Attach handlers for navigation buttons (only those present in DOM)
      document.querySelectorAll('[data-rc-view]').forEach(btn => {
        // avoid double-binding
        if (btn.dataset.bound) return
        btn.dataset.bound = '1'
        btn.onclick = () => {
          const view = btn.dataset.rcView
          document.querySelectorAll('.rc-view').forEach(el => el.classList.remove('active'))
          document.getElementById(`rc-view-${view}`)?.classList.add('active')
          document.querySelectorAll('[data-rc-view]').forEach(b => b.classList.toggle('active', b === btn))
          document.querySelectorAll('[data-rc-view]').forEach(b => b.setAttribute('aria-pressed', b.classList.contains('active') ? 'true' : 'false'))
        }
      })
      const scanBtn = document.getElementById('rc-scan-btn')
      if (scanBtn && !scanBtn.dataset.bound) {
        scanBtn.dataset.bound = '1'
        scanBtn.onclick = () => window.location.hash = '#/scanner'
      }
    }
  }
}
