// =============================================================================
// YAADHUM OOORE - Universal Role Switcher & Portal Navigation Bar
// Allows seamless demonstration and switching between Customer, Provider,
// Admin, and Super Admin modules without manual URL typing.
// =============================================================================

(function() {
  function initPortalBar() {
    if (document.getElementById('yaadhumUniversalBar')) return;

    // Detect current path depth relative to frontend/
    const path = window.location.pathname;
    let prefix = '';
    if (path.includes('/customer/') || path.includes('/provider/') || path.includes('/admin/')) {
      prefix = '../';
    } else {
      prefix = '';
    }

    const bar = document.createElement('div');
    bar.id = 'yaadhumUniversalBar';
    bar.style.cssText = `
      background: #102A24;
      color: #E2ECE9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      padding: 6px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      border-bottom: 2px solid #E9A825;
      position: sticky;
      top: 0;
      z-index: 99999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    `;

    // Active session status
    let activeRoleText = 'Guest Visitor';
    let activeName = '';
    let isLoggedIn = false;
    try {
      const unifiedRaw = sessionStorage.getItem('yaadhum_session') || localStorage.getItem('yaadhum_session');
      let activeUser = null;
      if (unifiedRaw) {
        const parsed = JSON.parse(unifiedRaw);
        activeUser = parsed.user || parsed;
      }
      if (!activeUser) {
        if (path.includes('/admin/')) {
          const adm = JSON.parse(localStorage.getItem('yaadhum_admin_session') || 'null');
          if (adm && adm.user) activeUser = adm.user;
        } else if (path.includes('/provider/')) {
          const prov = JSON.parse(localStorage.getItem('yaadhum_provider_session') || 'null');
          if (prov && prov.user) activeUser = prov.user;
        } else {
          const cust = JSON.parse(localStorage.getItem('yaadhum_customer_session') || 'null');
          if (cust && cust.user) activeUser = cust.user;
        }
      }

      if (activeUser) {
        isLoggedIn = true;
        const r = (activeUser.role || '').toLowerCase();
        if (r === 'superadmin') activeRoleText = 'Super Admin';
        else if (r === 'admin') activeRoleText = 'Admin';
        else if (r === 'provider') activeRoleText = 'Provider';
        else activeRoleText = 'Customer';
        activeName = activeUser.business_name || activeUser.full_name || activeUser.name || '';
      }
    } catch(e) {}

    bar.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="background: #E9A825; color: #102A24; font-weight: bold; padding: 2px 6px; border-radius: 3px; font-size: 11px;">
          YAADHUM OOORE
        </span>
        <span style="opacity: 0.9;">Role: <strong style="color: #fff;">${activeRoleText}</strong> ${activeName ? '(' + activeName + ')' : ''}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
        <span style="color: #9ab; font-size: 11px;">Switch Portal:</span>
        <a href="${prefix}index.html" style="color: #fff; background: rgba(255,255,255,0.12); padding: 3px 8px; border-radius: 4px; text-decoration: none;">Home</a>
        <a href="${prefix}customer/destinations.html" style="color: #fff; background: rgba(23,107,91,0.6); padding: 3px 8px; border-radius: 4px; text-decoration: none;">1. Customer</a>
        <a href="${prefix}provider/provider-dashboard.html" style="color: #fff; background: rgba(15,118,110,0.6); padding: 3px 8px; border-radius: 4px; text-decoration: none;">2. Provider</a>
        <a href="${prefix}admin/admin-dashboard.html" style="color: #fff; background: rgba(24,49,83,0.7); padding: 3px 8px; border-radius: 4px; text-decoration: none;">3. Admin</a>
        <a href="${prefix}admin/superadmin-dashboard.html" style="color: #fff; background: rgba(99,102,241,0.6); padding: 3px 8px; border-radius: 4px; text-decoration: none;">4. Super Admin</a>
        ${isLoggedIn ? `<button id="btnUniversalLogout" style="background: #c62828; color: #fff; border: none; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; margin-left: 6px;">Sign Out</button>` : ''}
      </div>
    `;

    document.body.insertBefore(bar, document.body.firstChild);

    const logoutBtn = document.getElementById('btnUniversalLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        sessionStorage.clear();
        localStorage.removeItem('yaadhum_session');
        localStorage.removeItem('yaadhum_customer_session');
        localStorage.removeItem('yaadhum_customer_user');
        localStorage.removeItem('yaadhum_provider_session');
        localStorage.removeItem('yaadhum_admin_session');
        window.location.href = `${prefix}index.html`;
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortalBar);
  } else {
    initPortalBar();
  }
})();

