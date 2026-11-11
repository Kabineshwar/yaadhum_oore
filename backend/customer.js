/**
 * =============================================================================
 * YAADHUM OOORE - Customer API Module (Person 1 Handlers)
 * Endpoints for public package search, booking creation, booking cancellation,
 * wishlist management, customer profile, and experience reviews.
 * =============================================================================
 */

'use strict';

const db = require('./database');
const Validation = require('./validation');
const SystemLogs = require('./system-logs');

const CustomerHandlers = {
  // GET /api/destinations
  async getDestinations(req, res, sendJSON) {
    const store = db.getStore();
    return sendJSON(res, 200, { success: true, data: store.destinations });
  },

  // GET /api/packages
  async getPackages(req, res, sendJSON, query) {
    const store = db.getStore();
    let pkgs = store.packages.filter(p => p.status === 'Approved');

    if (query.destination) {
      pkgs = pkgs.filter(p => (p.destination || '').toLowerCase().includes(query.destination.toLowerCase()));
    }
    if (query.category) {
      pkgs = pkgs.filter(p => (p.category || '').toLowerCase().includes(query.category.toLowerCase()));
    }
    if (query.maxPrice) {
      pkgs = pkgs.filter(p => Number(p.price) <= Number(query.maxPrice));
    }

    return sendJSON(res, 200, { success: true, data: pkgs });
  },

  // GET /api/packages/:id
  async getPackageDetails(req, res, sendJSON, id) {
    const store = db.getStore();
    const pkg = store.packages.find(p => String(p.package_id) === String(id));
    if (!pkg) {
      return sendJSON(res, 404, { success: false, error: 'Package not found' });
    }
    return sendJSON(res, 200, { success: true, data: pkg });
  },

  // GET /api/customer/bookings
  async getMyBookings(req, res, sendJSON, user) {
    if (!user) return sendJSON(res, 401, { success: false, error: 'Unauthorized' });
    const store = db.getStore();
    const bookings = store.bookings.filter(b => b.customer_id === user.user_id || b.customer_email === user.email);
    return sendJSON(res, 200, { success: true, data: bookings });
  },

  // POST /api/customer/bookings
  async createBooking(req, res, sendJSON, body, user) {
    const store = db.getStore();
    const packageId = body.package_id || body.packageId;
    const travelers = Number(body.travelers || body.travellerCount) || 1;
    const travelDate = body.travel_date || body.travelDate;

    if (!packageId || !Validation.isValidTravellerCount(travelers)) {
      return sendJSON(res, 400, { success: false, error: 'Invalid booking parameters or traveler count.' });
    }

    const pkg = store.packages.find(p => String(p.package_id) === String(packageId));
    if (!pkg) {
      return sendJSON(res, 404, { success: false, error: 'Tourism package not found.' });
    }

    if (pkg.available_seats < travelers) {
      return sendJSON(res, 400, { success: false, error: `Only ${pkg.available_seats} seats remaining.` });
    }

    // Authoritative server-side total
    const total = travelers * Number(pkg.price);
    pkg.available_seats -= travelers;

    const newBooking = {
      booking_id: 1000 + store.bookings.length + 1,
      customer_id: user ? user.user_id : 1,
      customer_name: user ? user.name : (body.customerName || 'Valued Traveller'),
      customer_email: user ? user.email : (body.customerEmail || 'customer@yaadhum.local'),
      package_id: pkg.package_id,
      package_name: pkg.title,
      provider_id: pkg.provider_id,
      travel_date: travelDate || new Date().toISOString().split('T')[0],
      travelers: travelers,
      total_amount: total,
      booking_status: 'Confirmed',
      payment_status: 'Paid',
      payment_method: body.paymentMethod || 'UPI',
      booked_at: new Date().toISOString().split('T')[0]
    };

    store.bookings.unshift(newBooking);
    SystemLogs.log(newBooking.customer_name, 'Booking Created', `Booked "${pkg.title}" for ${travelers} traveler(s) - Total ₹${total}`);

    return sendJSON(res, 201, { success: true, data: newBooking, message: 'Booking confirmed successfully.' });
  },

  // POST /api/customer/bookings/:id/cancel
  async cancelBooking(req, res, sendJSON, id, user) {
    const store = db.getStore();
    const booking = store.bookings.find(b => String(b.booking_id) === String(id));
    if (!booking) {
      return sendJSON(res, 404, { success: false, error: 'Booking not found.' });
    }

    if (booking.booking_status === 'Cancelled') {
      return sendJSON(res, 400, { success: false, error: 'Booking is already cancelled.' });
    }

    booking.booking_status = 'Cancelled';
    booking.payment_status = 'Refunded';

    // Restore seats
    const pkg = store.packages.find(p => String(p.package_id) === String(booking.package_id));
    if (pkg) {
      pkg.available_seats = Math.min(pkg.capacity, pkg.available_seats + booking.travelers);
    }

    SystemLogs.log(user ? user.name : 'Customer', 'Booking Cancelled', `Cancelled booking #${id} and restored seats.`);
    return sendJSON(res, 200, { success: true, data: booking, message: 'Booking cancelled and seats restored.' });
  },

  // PUT /api/customer/profile
  async updateProfile(req, res, sendJSON, body, user) {
    if (!user) return sendJSON(res, 401, { success: false, error: 'Unauthorized' });
    const store = db.getStore();
    const u = store.users.find(x => x.user_id === user.user_id || x.email === user.email);
    if (!u) return sendJSON(res, 404, { success: false, error: 'User not found' });

    if (body.name) u.name = body.name;
    if (body.phone) u.mobile = body.phone;
    if (body.city) u.city = body.city;

    SystemLogs.log(u.name, 'Profile Updated', 'Updated profile information.');
    return sendJSON(res, 200, { success: true, data: u });
  }
};

module.exports = CustomerHandlers;
