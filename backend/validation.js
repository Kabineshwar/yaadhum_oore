/**
 * =============================================================================
 * YAADHUM OOORE - Validation Helpers
 * Shared input validation helpers for IDs, prices, dates, traveller counts,
 * and required fields.
 * =============================================================================
 */

'use strict';

const Validation = {
  isRequired(val) {
    if (val === undefined || val === null) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    return true;
  },

  isValidId(id) {
    if (!id) return false;
    if (typeof id === 'number') return id > 0;
    if (typeof id === 'string') return id.trim().length > 0;
    return false;
  },

  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  },

  isValidIndianPhone(phone) {
    if (!phone) return false;
    const cleaned = String(phone).replace(/[\s\-()]/g, '');
    return /^[6-9]\d{9}$/.test(cleaned);
  },

  isValidPrice(price) {
    const num = Number(price);
    return !isNaN(num) && num > 0;
  },

  isValidTravellerCount(count) {
    const num = Number(count);
    return Number.isInteger(num) && num >= 1 && num <= 50;
  },

  isValidDateRange(startDate, endDate) {
    if (!startDate || !endDate) return false;
    return new Date(endDate) >= new Date(startDate);
  },

  isValidDate(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
  },

  sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
};

module.exports = Validation;
