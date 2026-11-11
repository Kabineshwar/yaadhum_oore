/**
 * ==========================================================================
 * YAADHUM OOORE - Shared Dynamic Navigation
 * "யாதும் ஊரே யாவரும் கேளிர்"
 * Synchronizes header navigation, user role pills, profile quick-links,
 * and working Log Out actions across all pages.
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  renderSharedNavbar();
});

function renderSharedNavbar() {
  const user = window.YaadhumSession ? window.YaadhumSession.getUser() : null;
  const currentPath = window.location.pathname.replace(/\\/g, '/');
  const inSubdir = currentPath.includes('/customer/') || currentPath.includes('/provider/') || currentPath.includes('/admin/');
  const basePath = inSubdir ? '../' : '';

  // 1. Mobile menu toggle setup
  const mobileToggle = document.getElementById('mobileNavToggle');
  const mainNav = document.getElementById('mainNav');
  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener('click', function () {
      mainNav.classList.toggle('is-open');
    });
  }

  // 2. Synchronize Navigation Actions (.nav-actions or portal headers)
  const navActions = document.querySelector('.nav-actions');
  if (navActions) {
    if (!user) {
      // Guest state
      navActions.innerHTML = `
        <a href="${basePath}customer/login.html" class="btn btn-secondary btn-sm">Log In</a>
        <a href="${basePath}customer/register.html" class="btn btn-primary btn-sm">Register</a>
      `;
    } else {
      // Logged in user state
      let roleTagClass = 'role-customer';
      let roleLabel = 'Customer';
      let portalDashboard = `${basePath}customer/customer-dashboard.html`;

      if (user.role === 'provider') {
        roleTagClass = 'role-provider';
        roleLabel = 'Provider';
        portalDashboard = `${basePath}provider/provider-dashboard.html`;
      } else if (user.role === 'admin') {
        roleTagClass = 'role-admin';
        roleLabel = 'Admin';
        portalDashboard = `${basePath}admin/admin-dashboard.html`;
      } else if (user.role === 'superadmin') {
        roleTagClass = 'role-superadmin';
        roleLabel = 'Super Admin';
        portalDashboard = `${basePath}admin/superadmin-dashboard.html`;
      }

      const initials = (user.name || 'YO').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      navActions.innerHTML = `
        <div class="user-menu-pill">
          <div class="user-avatar-badge">${initials}</div>
          <span style="font-weight: 600; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${user.business || user.name}
          </span>
          <span class="user-role-tag ${roleTagClass}">${roleLabel}</span>
        </div>
        <a href="${portalDashboard}" class="btn btn-secondary btn-sm" title="Go to Dashboard">Portal &rarr;</a>
        <button type="button" id="globalLogoutBtn" class="btn btn-outline btn-sm" style="border-color: #CBD5E0; color: #718096;" title="Sign out of account">
          Log Out
        </button>
      `;

      const logoutBtn = document.getElementById('globalLogoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
          if (confirm('Are you sure you want to log out?')) {
            window.YaadhumSession.logout(`${basePath}customer/login.html`);
          }
        });
      }
    }
  }

  // 3. For Provider and Admin standalone pages that have simple <header> and <nav>
  // Add a top role bar and logout button if not already present
  const simpleNav = document.querySelector('body > nav');
  if (simpleNav && user) {
    let topBar = document.getElementById('yaadhumRoleStatusBar');
    if (!topBar) {
      topBar = document.createElement('div');
      topBar.id = 'yaadhumRoleStatusBar';
      topBar.style.cssText = `
        background: #1A365D;
        color: #FFFFFF;
        padding: 6px 20px;
        font-size: 13px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #D69E2E;
      `;
      document.body.insertBefore(topBar, document.body.firstChild);
    }

    const initials = (user.name || 'YO').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    topBar.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-weight: 700; color: #D69E2E;">YAADHUM OOORE</span>
        <span>&bull;</span>
        <span>Signed in as: <strong>${user.business || user.name}</strong> (${user.role.toUpperCase()})</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <a href="${basePath}index.html" style="color: #CBD5E0; text-decoration: none; font-size: 12px;">&larr; Public Site</a>
        <button type="button" id="topBarLogoutBtn" style="background: rgba(255,255,255,0.15); color: #FFF; border: 1px solid rgba(255,255,255,0.3); padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
          Log Out
        </button>
      </div>
    `;

    const topLogout = document.getElementById('topBarLogoutBtn');
    if (topLogout) {
      topLogout.addEventListener('click', function () {
        if (confirm('Are you sure you want to log out?')) {
          window.YaadhumSession.logout(`${basePath}customer/login.html`);
        }
      });
    }
  }
}
