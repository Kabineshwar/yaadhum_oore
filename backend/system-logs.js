/**
 * =============================================================================
 * YAADHUM OOORE - System Audit Logger
 * Shared audit logging helper
 * =============================================================================
 */

'use strict';

const inMemoryLogs = [];

const SystemLogs = {
  log(actor, action, description, ip = '127.0.0.1') {
    const entry = {
      log_id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      actor: actor || 'System',
      action: action,
      description: description,
      ip: ip,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    inMemoryLogs.unshift(entry);
    if (inMemoryLogs.length > 500) inMemoryLogs.pop();
    console.log(`[AUDIT LOG] [${entry.timestamp}] ${entry.actor} -> ${entry.action}: ${entry.description}`);
    return entry;
  },

  getAll() {
    return inMemoryLogs;
  }
};

module.exports = SystemLogs;
