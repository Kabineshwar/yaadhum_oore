/**
 * =============================================================================
 * YAADHUM OOORE - Shared Database Connection & Resilient Store
 * Provides native MySQL connection pooling when MySQL is active, AND
 * seamless in-memory/JSON fallback when running without a live SQL server
 * ("apart from the sql" requirement).
 * =============================================================================
 */

'use strict';

let pool = null;
let isMysqlActive = false;

// Attempt optional mysql2 pool if package is present
try {
  const mysql = require('mysql2/promise');
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'yaadhum_oore_db';

  pool = mysql.createPool({
    host,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Test ping
  pool.getConnection()
    .then(conn => {
      isMysqlActive = true;
      console.log('Connected to MySQL database:', database);
      conn.release();
    })
    .catch(err => {
      console.info('MySQL connection not available. Operating with Resilient In-Memory State Engine.');
      isMysqlActive = false;
    });
} catch (e) {
  console.info('mysql2 module not found or MySQL offline. Operating with Resilient In-Memory State Engine.');
}

// -----------------------------------------------------------------------------
// Resilient In-Memory Mock Store
// -----------------------------------------------------------------------------
const memoryStore = {
  users: [
    { user_id: 1, name: 'Kaniyan Pungundran', email: 'customer@yaadhum.local', password: 'password123', mobile: '9876543210', role: 'customer', status: 'Active' },
    { user_id: 2, name: 'Selvam Perumal', business: 'Mountain Adventures', email: 'selvam@tamilnadutours.in', password: 'password123', mobile: '9840123456', role: 'provider', status: 'Approved', location: 'Ooty' },
    { user_id: 3, name: 'Meenakshi Sundaram', business: 'Heritage Tamil Tours', email: 'meenakshi@heritagetours.in', password: 'password123', mobile: '9840234567', role: 'provider', status: 'Approved', location: 'Madurai' },
    { user_id: 4, name: 'Priya Sundaram', email: 'admin@yaadhum.local', password: 'password123', mobile: '9876523456', role: 'admin', status: 'Active' },
    { user_id: 5, name: 'Super Administrator', email: 'superadmin@yaadhum.local', password: 'password123', mobile: '9876599999', role: 'superadmin', status: 'Active' }
  ],
  destinations: [
    { destination_id: 1, name: 'Ooty', city: 'Nilgiris', state: 'Tamil Nadu', country: 'India', description: 'Queen of Hill Stations, famous for tea gardens and toy train.', status: 'Active' },
    { destination_id: 2, name: 'Madurai', city: 'Madurai', state: 'Tamil Nadu', country: 'India', description: 'Historic temple city of Meenakshi Amman Temple.', status: 'Active' },
    { destination_id: 3, name: 'Kodaikanal', city: 'Dindigul', state: 'Tamil Nadu', country: 'India', description: 'Princess of Hill Stations featuring pine forests and lakes.', status: 'Active' },
    { destination_id: 4, name: 'Thanjavur', city: 'Thanjavur', state: 'Tamil Nadu', country: 'India', description: 'Cultural capital and home of the Great Living Chola Temples.', status: 'Active' },
    { destination_id: 5, name: 'Rameswaram', city: 'Ramanathapuram', state: 'Tamil Nadu', country: 'India', description: 'Sacred island town connected by Pamban sea bridge.', status: 'Active' }
  ],
  categories: [
    { category_id: 1, category_name: 'Hill Stations', status: 'Active' },
    { category_id: 2, category_name: 'Heritage & Cultural', status: 'Active' },
    { category_id: 3, category_name: 'Coastal & Beach', status: 'Active' },
    { category_id: 4, category_name: 'Wildlife & Eco', status: 'Active' },
    { category_id: 5, category_name: 'Pilgrimage & Spiritual', status: 'Active' },
    { category_id: 6, category_name: 'Culinary & Village', status: 'Active' }
  ],
  packages: [
    { package_id: 1, provider_id: 2, provider_name: 'Mountain Adventures', destination: 'Ooty', category: 'Hill Stations', title: 'Ooty Nilgiri Mountain Railway & Tea Trails', description: 'Scenic Nilgiri toy train and tea estate walks.', duration_days: 3, price: 4500, capacity: 15, available_seats: 11, status: 'Approved' },
    { package_id: 2, provider_id: 3, provider_name: 'Heritage Tamil Tours', destination: 'Madurai', category: 'Heritage & Cultural', title: 'Madurai Heritage Temples & Street Food Walk', description: 'Ancient temple tour and culinary trail.', duration_days: 2, price: 3200, capacity: 20, available_seats: 18, status: 'Approved' },
    { package_id: 3, provider_id: 2, provider_name: 'Mountain Adventures', destination: 'Kodaikanal', category: 'Hill Stations', title: 'Kodaikanal Mist & Pine Forest Trek', description: 'Forest trek and campfire.', duration_days: 3, price: 5200, capacity: 12, available_seats: 8, status: 'Approved' }
  ],
  bookings: [
    { booking_id: 1001, customer_id: 1, customer_name: 'Kaniyan Pungundran', package_id: 1, package_name: 'Ooty Nilgiri Mountain Railway & Tea Trails', provider_id: 2, travel_date: '2026-11-20', travelers: 2, total_amount: 9000, booking_status: 'Confirmed', payment_status: 'Paid', booked_at: '2026-11-01' }
  ],
  reviews: [
    { review_id: 1, booking_id: 1001, customer_id: 1, package_id: 1, rating: 5, comment: 'Exceptional toy train journey and great local guide!' }
  ],
  destination_updates: [
    { update_id: 1, title: 'Nilgiri Mountain Railway Winter Timetable', destination: 'Ooty', category: 'Advisory', description: 'Southern Railway announces additional winter departures.', date_posted: '2026-11-08', status: 'Active' }
  ],
  system_logs: []
};

const Database = {
  isMysqlActive() {
    return isMysqlActive;
  },

  async query(sql, params = []) {
    if (isMysqlActive && pool) {
      try {
        const [rows] = await pool.query(sql, params);
        return rows;
      } catch (err) {
        console.error('MySQL Query Error:', err.message);
        throw err;
      }
    }

    // Resilient fallback query simulator
    return memoryStore;
  },

  getStore() {
    return memoryStore;
  }
};

module.exports = Database;
