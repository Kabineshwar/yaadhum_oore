/**
 * =============================================================================
 * YAADHUM OOORE - Provider API Module (Person 2 Handlers)
 * Endpoints for provider package CRUD, capacity/availability,
 * provider-specific customer bookings, and performance reports.
 * =============================================================================
 */

'use strict';

const db = require('./database');
const Validation = require('./validation');
const SystemLogs = require('./system-logs');

const ProviderHandlers = {
  // GET /api/provider/packages
  async getMyPackages(req, res, sendJSON, user) {
    const store = db.getStore();
    const providerId = user ? user.user_id : 2;
    const pkgs = store.packages.filter(p => p.provider_id === providerId);
    return sendJSON(res, 200, { success: true, data: pkgs });
  },

  // POST /api/provider/packages
  async createPackage(req, res, sendJSON, body, user) {
    const store = db.getStore();
    const providerId = user ? user.user_id : 2;
    const providerName = user ? (user.business || user.name) : 'Mountain Adventures';

    if (!Validation.isRequired(body.title) || !Validation.isValidPrice(body.price)) {
      return sendJSON(res, 400, { success: false, error: 'Title and valid price are required.' });
    }

    const newPkg = {
      package_id: store.packages.length + 1,
      provider_id: providerId,
      provider_name: providerName,
      title: body.title,
      destination: body.destination || 'Tamil Nadu',
      category: body.category || 'Hill Stations',
      description: body.description || '',
      itinerary: body.itinerary || '',
      duration_days: Number(body.duration_days) || 2,
      duration: body.duration || '2 Days / 1 Night',
      price: Number(body.price),
      capacity: Number(body.capacity) || 10,
      available_seats: Number(body.capacity) || 10,
      image: body.image || 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
      status: 'Approved',
      created_at: new Date().toISOString().split('T')[0]
    };

    store.packages.unshift(newPkg);
    SystemLogs.log(providerName, 'Package Created', `Created package "${newPkg.title}" (₹${newPkg.price})`);

    return sendJSON(res, 201, { success: true, data: newPkg, message: 'Package published successfully.' });
  },

  // PUT /api/provider/packages/:id
  async updatePackage(req, res, sendJSON, id, body, user) {
    const store = db.getStore();
    const pkg = store.packages.find(p => String(p.package_id) === String(id));
    if (!pkg) {
      return sendJSON(res, 404, { success: false, error: 'Package not found' });
    }

    if (body.title) pkg.title = body.title;
    if (body.destination) pkg.destination = body.destination;
    if (body.category) pkg.category = body.category;
    if (body.price) pkg.price = Number(body.price);
    if (body.capacity) pkg.capacity = Number(body.capacity);
    if (body.description) pkg.description = body.description;
    if (body.itinerary) pkg.itinerary = body.itinerary;

    SystemLogs.log(user ? user.name : 'Provider', 'Package Updated', `Updated package details for ID ${id}`);
    return sendJSON(res, 200, { success: true, data: pkg, message: 'Package updated successfully.' });
  },

  // DELETE /api/provider/packages/:id
  async deletePackage(req, res, sendJSON, id, user) {
    const store = db.getStore();
    const idx = store.packages.findIndex(p => String(p.package_id) === String(id));
    if (idx === -1) {
      return sendJSON(res, 404, { success: false, error: 'Package not found' });
    }

    const removed = store.packages.splice(idx, 1)[0];
    SystemLogs.log(user ? user.name : 'Provider', 'Package Deleted', `Removed package "${removed.title}"`);
    return sendJSON(res, 200, { success: true, message: 'Package removed successfully.' });
  },

  // GET /api/provider/bookings
  async getProviderBookings(req, res, sendJSON, user) {
    const store = db.getStore();
    const providerId = user ? user.user_id : 2;
    const bookings = store.bookings.filter(b => b.provider_id === providerId);
    return sendJSON(res, 200, { success: true, data: bookings });
  },

  // GET /api/provider/reports
  async getReports(req, res, sendJSON, user) {
    const store = db.getStore();
    const providerId = user ? user.user_id : 2;
    const myPackages = store.packages.filter(p => p.provider_id === providerId);
    const myBookings = store.bookings.filter(b => b.provider_id === providerId);
    const confirmed = myBookings.filter(b => b.booking_status === 'Confirmed' || b.booking_status === 'Completed');
    const revenue = confirmed.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

    return sendJSON(res, 200, {
      success: true,
      data: {
        totalPackages: myPackages.length,
        totalBookings: myBookings.length,
        confirmedBookings: confirmed.length,
        totalRevenue: revenue
      }
    });
  }
};

module.exports = ProviderHandlers;
