/**
 * ==========================================================================
 * YAADHUM OOORE - Shared Session & Role Helpers
 * "யாதும் ஊரே யாவரும் கேளிர்"
 * Manages user authentication state, role verification, and access controls.
 * ==========================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./api'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./api'));
  } else {
    root.YaadhumSession = factory(root.YaadhumAPI);
  }
})(typeof self !== 'undefined' ? self : this, function (YaadhumAPI) {
  'use strict';

  const YaadhumSession = {
    getUser() {
      if (window.YaadhumAPI && typeof window.YaadhumAPI.getCurrentUser === 'function') {
        return window.YaadhumAPI.getCurrentUser();
      }
      try {
        const item = sessionStorage.getItem('yaadhum_session_user') || localStorage.getItem('yaadhum_session_user');
        return item ? JSON.parse(item) : null;
      } catch (e) {
        return null;
      }
    },

    isLoggedIn() {
      return Boolean(this.getUser());
    },

    getRole() {
      const user = this.getUser();
      return user ? user.role : 'guest';
    },

    hasRole(role) {
      const user = this.getUser();
      if (!user) return false;
      if (Array.isArray(role)) return role.includes(user.role);
      return user.role === role;
    },

    requireAuth(allowedRoles = [], fallbackPath = '../customer/login.html') {
      const user = this.getUser();
      if (!user) {
        alert('Authentication required. Redirecting to login page...');
        window.location.href = fallbackPath;
        return false;
      }
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        alert(`Access denied. Your current account role (${user.role}) does not have permission for this section.`);
        if (user.role === 'customer') window.location.href = '../customer/customer-dashboard.html';
        else if (user.role === 'provider') window.location.href = '../provider/provider-dashboard.html';
        else if (user.role === 'admin' || user.role === 'superadmin') window.location.href = '../admin/admin-dashboard.html';
        else window.location.href = fallbackPath;
        return false;
      }
      return true;
    },

    logout(redirectUrl = null) {
      if (window.YaadhumAPI && typeof window.YaadhumAPI.clearSession === 'function') {
        window.YaadhumAPI.clearSession();
      } else {
        sessionStorage.clear();
        localStorage.removeItem('yaadhum_session_user');
      }

      // Check current path to determine suitable home/login redirect
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        const path = window.location.pathname;
        if (path.includes('/customer/') || path.includes('/provider/') || path.includes('/admin/')) {
          window.location.href = '../index.html';
        } else {
          window.location.href = 'index.html';
        }
      }
    },

    formatCurrency(amount) {
      return '₹' + Number(amount || 0).toLocaleString('en-IN');
    },

    formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch (e) {
        return dateStr;
      }
    }
  };

  return YaadhumSession;
});
