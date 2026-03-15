// Utilidades de UX: Toasts, Prompts y Diálogos de Copiado
(function(){
    // Inyecta estilos una sola vez
    if (!document.getElementById('rc-ux-styles')) {
        const s = document.createElement('style'); s.id = 'rc-ux-styles';
        s.textContent = `
        .rc-toast-container{position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;flex-direction:column;gap:8px}
        .rc-toast{min-width:200px;padding:10px 14px;border-radius:8px;color:#fff;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,0.12)}
        .rc-toast.info{background:#2563eb}
        .rc-toast.success{background:#16a34a}
        .rc-toast.error{background:#dc2626}
        .rc-ux-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:10000}
        .rc-ux-modal{background:#fff;color:#111;padding:18px;border-radius:10px;max-width:720px;min-width:320px;box-shadow:0 10px 30px rgba(2,6,23,0.2);}
        .rc-ux-modal .rc-ux-title{font-weight:800;margin-bottom:8px}
        .rc-ux-modal textarea{width:100%;height:160px;margin-top:8px;padding:8px;border-radius:6px;border:1px solid #e6e6e6}
        .rc-ux-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
        .rc-ux-btn{padding:8px 12px;border-radius:8px;border:0;cursor:pointer;font-weight:700}
        .rc-ux-btn.primary{background:#2563eb;color:#fff}
        .rc-ux-btn.ghost{background:transparent;border:1px solid #e6e6e6}
        `;
        document.head.appendChild(s);
    }

    function ensureContainer(){
        let c = document.getElementById('rc-toast-container');
        if (!c) { c = document.createElement('div'); c.id = 'rc-toast-container'; c.className = 'rc-toast-container'; document.body.appendChild(c); }
        return c;
    }

    function toast(message, type='info', timeout=3500){
        const c = ensureContainer();
        const t = document.createElement('div');
        t.className = `rc-toast ${type}`;
        t.textContent = message;
        c.appendChild(t);
        setTimeout(()=>{ t.style.transition = 'opacity 220ms'; t.style.opacity = '0'; setTimeout(()=>t.remove(),240); }, timeout);
        return t;
    }

    function inputPrompt(message, placeholder=''){
        return new Promise(resolve => {
            const ov = document.createElement('div'); ov.className = 'rc-ux-overlay';
            const modal = document.createElement('div'); modal.className = 'rc-ux-modal';
            modal.innerHTML = `<div class="rc-ux-title">${message}</div>`;
            const input = document.createElement('input'); input.type = 'text'; input.placeholder = placeholder; input.style.width='100%'; input.style.padding='8px'; input.style.border='1px solid #e6e6e6'; input.style.borderRadius='6px';
            modal.appendChild(input);
            const actions = document.createElement('div'); actions.className = 'rc-ux-actions';
            const btnCancel = document.createElement('button'); btnCancel.className='rc-ux-btn ghost'; btnCancel.textContent='Cancelar';
            const btnOk = document.createElement('button'); btnOk.className='rc-ux-btn primary'; btnOk.textContent='OK';
            actions.appendChild(btnCancel); actions.appendChild(btnOk);
            modal.appendChild(actions);
            ov.appendChild(modal); document.body.appendChild(ov);
            input.focus();
            function cleanup(val){ ov.remove(); resolve(val); }
            btnCancel.onclick = () => cleanup(null);
            btnOk.onclick = () => cleanup(input.value);
            input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); cleanup(input.value); } if (e.key === 'Escape') { cleanup(null); } };
        });
    }

    function copyDialog(title, text){
        return new Promise(resolve => {
            const ov = document.createElement('div'); ov.className = 'rc-ux-overlay';
            const modal = document.createElement('div'); modal.className = 'rc-ux-modal';
            modal.innerHTML = `<div class="rc-ux-title">${title}</div>`;
            const ta = document.createElement('textarea'); ta.readOnly = true; ta.value = text; modal.appendChild(ta);
            const actions = document.createElement('div'); actions.className = 'rc-ux-actions';
            const btnCopy = document.createElement('button'); btnCopy.className='rc-ux-btn primary'; btnCopy.textContent='Copiar';
            const btnClose = document.createElement('button'); btnClose.className='rc-ux-btn ghost'; btnClose.textContent='Cerrar';
            actions.appendChild(btnClose); actions.appendChild(btnCopy);
            modal.appendChild(actions);
            ov.appendChild(modal); document.body.appendChild(ov);
            btnClose.onclick = () => { ov.remove(); resolve(); };
            btnCopy.onclick = async () => {
                try { await navigator.clipboard.writeText(text); toast('Copiado al portapapeles','success'); }
                catch (e) { toast('No se pudo copiar automáticamente','error'); }
            };
        });
    }

    // Exponer en global
    window.RC_UX = window.RC_UX || {};
    window.RC_UX.toast = toast;
    window.RC_UX.inputPrompt = inputPrompt;
    window.RC_UX.copyDialog = copyDialog;

    // Compatibilidad con import estilo modulo
    if (typeof exports !== 'undefined') { exports.toast = toast; exports.inputPrompt = inputPrompt; exports.copyDialog = copyDialog; }
})();

export const toast = window.RC_UX.toast;
export const inputPrompt = window.RC_UX.inputPrompt;
export const copyDialog = window.RC_UX.copyDialog;
