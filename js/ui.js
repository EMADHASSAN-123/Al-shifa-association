// ui.js - simple toast notifications (global)
(function(){
    const containerId = 'global-toast-container';
 
    function ensureContainer() {
        let c = document.getElementById(containerId);
        if (!c) {
            c = document.createElement('div');
            c.id = containerId;
            c.style.position = 'fixed';
            c.style.top = '1rem';
            c.style.left = '50%';
            c.style.transform = 'translateX(-50%)';
            c.style.zIndex = 9999;
            c.style.display = 'flex';
            c.style.flexDirection = 'column';
            c.style.gap = '0.5rem';
            document.body.appendChild(c);
        }
        return c;
    }

    function showToast(message, type = 'info', timeout = 4000) {
        const c = ensureContainer();
        const el = document.createElement('div');
        el.textContent = message;
        el.style.padding = '0.6rem 1rem';
        el.style.borderRadius = '0.5rem';
        el.style.minWidth = '220px';
        el.style.color = '#fff';
        el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
        el.style.fontFamily = "'Cairo', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
        el.style.textAlign = 'center';

        switch(type) {
            case 'success': el.style.background = '#16a34a'; break;
            case 'error': el.style.background = '#dc2626'; break;
            case 'warning': el.style.background = '#f59e0b'; el.style.color = '#111827'; break;
            default: el.style.background = '#0369a1'; break;
        }

        c.appendChild(el);

        setTimeout(() => {
            el.style.transition = 'transform 300ms ease, opacity 300ms ease';
            el.style.transform = 'translateY(-8px)';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 300);
        }, timeout);
    }

    window.showToast = showToast;
})();
