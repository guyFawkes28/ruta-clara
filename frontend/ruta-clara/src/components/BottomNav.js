export const BottomNav = (opts = {}) => {
  const getNotificationCount = () => {
    try {
      const count = localStorage.getItem('chat_notifications') || '0'
      return parseInt(count, 10) || 0
    } catch {
      return 0
    }
  }

  return {
    render: () => {
      const showChat = opts.showChat !== false
      const notifCount = getNotificationCount()
      const notifBadge = notifCount > 0 ? `<span class="rc-notif-badge">${notifCount > 99 ? '99+' : notifCount}</span>` : ''
      
      return `
      <nav class="rc-bottom-nav">
        <button class="rc-nav-btn ${opts.active === 'home' ? 'active' : ''}" data-rc-view="home">
          <span class="rc-nav-icon">🏠</span>
          Inicio
        </button>
        ${showChat ? `<button class="rc-nav-btn ${opts.active === 'chat' ? 'active' : ''}" data-rc-view="chat" style="position: relative;">
          <span class="rc-nav-icon">💬</span>
          Chat
          ${notifBadge}
        </button>` : ''}
        <button class="rc-nav-btn" id="rc-scan-btn" aria-label="Escanear">
          <span class="rc-nav-icon">📷</span>
        </button>
      </nav>
    `
    },
    loadRender: () => {
      // Asignar eventos a los botones presentes
      document.querySelectorAll('[data-rc-view]').forEach(btn => {
        // Evitar doble enlace
        if (btn.dataset.bound) return
        btn.dataset.bound = '1'
        btn.onclick = () => {
          const view = btn.dataset.rcView
          document.querySelectorAll('.rc-view').forEach(el => el.classList.remove('active'))
          document.getElementById(`rc-view-${view}`)?.classList.add('active')
          document.querySelectorAll('[data-rc-view]').forEach(b => b.classList.toggle('active', b === btn))
          document.querySelectorAll('[data-rc-view]').forEach(b => b.setAttribute('aria-pressed', b.classList.contains('active') ? 'true' : 'false'))
          
          // Limpiar notificaciones al entrar al chat
          if (view === 'chat') {
            localStorage.setItem('chat_notifications', '0')
            const badge = btn.querySelector('.rc-notif-badge')
            if (badge) badge.remove()
          }
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
