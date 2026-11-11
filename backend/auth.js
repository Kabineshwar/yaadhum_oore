/**
 * =============================================================================
 * YAADHUM OOORE - Authentication & Role Authorization Helper
 * Built using Node.js native crypto module (PBKDF2/SHA-256 with salt)
 * Manages sessions and role-based access checks on the server side.
 * =============================================================================
 */

'use strict';

const crypto = require('crypto');

const activeSessions = new Map(); // token -> { user, expiresAt }

const Auth = {
  /**
   * Hashes a password using SHA-256 with salt.
   */
  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
    return `${salt}:${hash}`;
  },

  /**
   * Verifies a candidate password against the stored salt:hash string or plaintext fallback for dev.
   */
  verifyPassword(candidatePassword, storedPassword) {
    if (!storedPassword || !candidatePassword) return false;
    
    // Support stored password with salt:hash
    if (storedPassword.includes(':')) {
      const [salt, key] = storedPassword.split(':');
      const hash = crypto.pbkdf2Sync(candidatePassword, salt, 1000, 64, 'sha256').toString('hex');
      return hash === key;
    }

    // Direct match (for initial development seed or plain demo passwords like password123)
    return candidatePassword === storedPassword;
  },

  /**
   * Creates an active server session token.
   */
  createSession(user) {
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const safeUser = { ...user };
    delete safeUser.password;

    activeSessions.set(token, { user: safeUser, expiresAt });
    return { token, user: safeUser };
  },

  /**
   * Validates a session token from Cookie or Authorization header.
   */
  getSession(token) {
    if (!token) return null;
    const session = activeSessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      return null;
    }
    return session.user;
  },

  /**
   * Destroys an active session.
   */
  destroySession(token) {
    if (token) activeSessions.delete(token);
  },

  /**
   * Server-side role check middleware helper.
   */
  checkRole(user, allowedRoles = []) {
    if (!user) return false;
    if (allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role);
  }
};

module.exports = Auth;
