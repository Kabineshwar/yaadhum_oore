// =============================================================================
// YAADHUM OOORE - Node.js Native HTTP Backend Server
// Built exclusively with Node.js built-in modules (http, fs, path, url, crypto)
// Strictly NO Express.js or external frameworks as per academic constraints.
// =============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const db = require('./database');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

// Active authenticated sessions: token -> { user, expiresAt }
const sessions = new Map();

// Generate random session token
function generateToken(user) {
  const token = 'yo_sess_' + crypto.randomBytes(24).toString('hex');
  sessions.set(token, {
    user,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  });
  return token;
}

// Extract current user from request Authorization header or token query
function getAuthenticatedUser(req, parsedUrl) {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (parsedUrl.query && parsedUrl.query.token) {
    token = parsedUrl.query.token;
  }
  if (!token || !sessions.has(token)) return null;
  const session = sessions.get(token);
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session.user;
}

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Send JSON response helper
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Parse request body helper
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2 * 1024 * 1024) { // 2MB limit
        reject(new Error('Request entity too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        // Fallback for form-encoded
        try {
          const qs = new URLSearchParams(body);
          const obj = {};
          for (const [k, v] of qs.entries()) obj[k] = v;
          resolve(obj);
        } catch (e2) {
          resolve({});
        }
      }
    });
    req.on('error', reject);
  });
}

// Serve static frontend file
function serveStatic(req, res, pathname) {
  // Normalize path
  let relativePath = pathname === '/' ? 'index.html' : pathname;
  if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);

  // Determine potential file paths in frontend/
  let candidatePath = path.join(FRONTEND_DIR, relativePath);

  // If path is a directory, look for index.html
  if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
    candidatePath = path.join(candidatePath, 'index.html');
  }

  // Safety check to prevent directory traversal
  if (!candidatePath.startsWith(FRONTEND_DIR) && !candidatePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
    const ext = path.extname(candidatePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(candidatePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found: ' + pathname);
  }
}

// =============================================================================
// HTTP REQUEST DISPATCHER
// =============================================================================

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    try {
      await handleApiRoute(req, res, pathname, method, parsedUrl);
    } catch (err) {
      console.error('[API Error]', pathname, err);
      sendJSON(res, 500, { success: false, error: err.message || 'Internal Server Error' });
    }
    return;
  }

  // Handle Static Frontend Requests
  serveStatic(req, res, pathname);
});

// =============================================================================
// API ROUTE CONTROLLERS
// =============================================================================

async function handleApiRoute(req, res, pathname, method, parsedUrl) {
  const query = parsedUrl.query || {};
  const authUser = getAuthenticatedUser(req, parsedUrl);

  // ---------------------------------------------------------------------------
  // AUTH ROUTES
  // ---------------------------------------------------------------------------
  if (pathname === '/api/auth/register' && method === 'POST') {
    const body = await parseBody(req);
    const full_name = body.full_name || body.name;
    const { email, phone, password, role = 'customer', business_name } = body;

    if (!full_name || !email || !password) {
      return sendJSON(res, 400, { success: false, error: 'Full name, email, and password are required.' });
    }

    const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return sendJSON(res, 400, { success: false, error: 'An account with this email address already exists.' });
    }

    const newUser = db.insert('users', {
      full_name,
      email: email.toLowerCase(),
      phone: phone || '',
      password_hash: password, // In production this would be bcrypt
      role: ['customer', 'provider', 'admin', 'superadmin'].includes(role) ? role : 'customer',
      status: role === 'provider' ? 'pending' : 'active', // Providers need admin verification
      business_name: business_name || (role === 'provider' ? full_name + ' Travels' : null),
      bio: ''
    });

    if (body.address || body.city) {
      db.insert('addresses', {
        user_id: newUser.id,
        address_line1: body.address || 'Standard Address',
        city: body.city || 'Chennai',
        state: body.state || 'Tamil Nadu',
        postal_code: body.pincode || '600001',
        country: 'India',
        is_primary: 1
      });
    }

    const token = generateToken(newUser);
    db.logAction(newUser.id, 'USER_REGISTERED', 'auth', `Registered new account as ${newUser.role}`);
    const userPayload = {
      id: newUser.id,
      full_name: newUser.full_name,
      name: newUser.full_name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      status: newUser.status,
      business_name: newUser.business_name
    };
    return sendJSON(res, 201, {
      success: true,
      message: 'Account registered successfully.',
      token,
      user: userPayload,
      data: { user: userPayload, token }
    });
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await parseBody(req);
    const { email, password, expected_role } = body;

    if (!email || !password) {
      return sendJSON(res, 400, { success: false, error: 'Email and password are required.' });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password_hash !== password) {
      return sendJSON(res, 401, { success: false, error: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return sendJSON(res, 403, { success: false, error: 'Your account has been suspended. Please contact platform support.' });
    }

    if (expected_role && user.role !== expected_role && !(expected_role === 'admin' && user.role === 'superadmin')) {
      return sendJSON(res, 403, { success: false, error: `Access denied. Account role is '${user.role}', expected '${expected_role}'.` });
    }

    const token = generateToken(user);
    db.logAction(user.id, 'USER_LOGIN', 'auth', `Logged in successfully from ${req.socket.remoteAddress || '127.0.0.1'}`);
    const userPayload = {
      id: user.id,
      full_name: user.full_name,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      business_name: user.business_name,
      bio: user.bio
    };
    return sendJSON(res, 200, {
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userPayload,
      data: { user: userPayload, token }
    });
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    if (!authUser) {
      return sendJSON(res, 401, { success: false, error: 'Not authenticated or session expired.' });
    }
    return sendJSON(res, 200, { success: true, user: authUser });
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessions.delete(authHeader.substring(7).trim());
    }
    return sendJSON(res, 200, { success: true, message: 'Logged out successfully.' });
  }

  // ---------------------------------------------------------------------------
  // CUSTOMER PROFILE & ADDRESSES API
  // ---------------------------------------------------------------------------
  if (pathname === '/api/customer/profile' && method === 'GET') {
    const user = authUser || db.findById('users', 1);
    const address = db.findOne('addresses', a => Number(a.user_id) === Number(user.id)) || {};
    return sendJSON(res, 200, {
      success: true,
      profile: {
        id: user.id,
        name: user.full_name,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        address: address.address_line1 || '12, Anna Salai',
        city: address.city || 'Chennai',
        state: address.state || 'Tamil Nadu',
        pincode: address.postal_code || '600017'
      }
    });
  }

  if (pathname === '/api/customer/profile' && method === 'PUT') {
    const body = await parseBody(req);
    const userId = (authUser && authUser.id) ? authUser.id : 1;
    const updatedUser = db.update('users', userId, {
      full_name: body.name || body.full_name || undefined,
      phone: body.phone || undefined
    });
    if (body.address || body.city || body.pincode) {
      let addr = db.findOne('addresses', a => Number(a.user_id) === Number(userId));
      if (addr) {
        db.update('addresses', addr.id, {
          address_line1: body.address || addr.address_line1,
          city: body.city || addr.city,
          state: body.state || addr.state,
          postal_code: body.pincode || addr.postal_code
        });
      } else {
        db.insert('addresses', {
          user_id: userId,
          address_line1: body.address || 'Standard Address',
          city: body.city || 'Chennai',
          state: body.state || 'Tamil Nadu',
          postal_code: body.pincode || '600001',
          country: 'India',
          is_primary: 1
        });
      }
    }
    db.logAction(userId, 'PROFILE_UPDATED', 'customer', 'Customer profile details updated.');
    return sendJSON(res, 200, { success: true, message: 'Profile updated successfully.', user: updatedUser });
  }

  if (pathname === '/api/customer/addresses' && method === 'GET') {
    const userId = (authUser && authUser.id) ? authUser.id : (query.user_id ? Number(query.user_id) : 1);
    const addresses = db.find('addresses', a => Number(a.user_id) === Number(userId));
    return sendJSON(res, 200, { success: true, addresses });
  }

  if (pathname === '/api/customer/addresses' && method === 'POST') {
    const body = await parseBody(req);
    const userId = (authUser && authUser.id) ? authUser.id : (body.user_id || 1);
    const newAddr = db.insert('addresses', {
      user_id: userId,
      address_line1: body.address_line1 || body.address,
      address_line2: body.address_line2 || null,
      city: body.city || 'Tamil Nadu',
      state: body.state || 'Tamil Nadu',
      postal_code: body.postal_code || body.pincode || '600001',
      country: 'India',
      is_primary: body.is_primary ? 1 : 0
    });
    return sendJSON(res, 201, { success: true, address: newAddr });
  }

  if (pathname === '/api/status' && method === 'GET') {
    const tables = ['users', 'addresses', 'destinations', 'categories', 'tour_packages', 'package_itinerary', 'package_availability', 'bookings', 'payments', 'reviews', 'admin_permissions', 'system_logs'];
    const tableCounts = {};
    tables.forEach(t => tableCounts[t] = db.getTable(t).length);

    return sendJSON(res, 200, {
      success: true,
      service: 'YAADHUM OOORE Backend HTTP Server',
      database_tables: tables.length,
      tables: tableCounts,
      mysql_schema: 'backend/db.sql (12 mandatory tables with relations and seeds)',
      persistence_mode: 'ACTIVE'
    });
  }

  // ---------------------------------------------------------------------------
  // DESTINATIONS API
  // ---------------------------------------------------------------------------
  if (pathname === '/api/destinations' && method === 'GET') {
    let destinations = db.getTable('destinations');
    if (query.featured === 'true' || query.featured === '1') {
      destinations = destinations.filter(d => d.is_featured);
    }
    if (query.category) {
      destinations = destinations.filter(d => d.category.toLowerCase().includes(query.category.toLowerCase()));
    }
    if (query.region) {
      destinations = destinations.filter(d => d.region.toLowerCase().includes(query.region.toLowerCase()));
    }
    return sendJSON(res, 200, { success: true, destinations });
  }

  if (pathname.match(/^\/api\/destinations\/(\d+)$/) && method === 'GET') {
    const id = pathname.split('/')[3];
    const destination = db.findById('destinations', id);
    if (!destination) return sendJSON(res, 404, { success: false, error: 'Destination not found.' });
    return sendJSON(res, 200, { success: true, destination });
  }

  if (pathname === '/api/destinations' && method === 'POST') {
    const body = await parseBody(req);
    const newDest = db.insert('destinations', body);
    db.logAction(authUser?.id, 'DESTINATION_CREATED', 'destinations', `Created destination ${newDest.name}`);
    return sendJSON(res, 201, { success: true, destination: newDest });
  }

  if (pathname.match(/^\/api\/destinations\/(\d+)$/) && method === 'PUT') {
    const id = pathname.split('/')[3];
    const body = await parseBody(req);
    const updated = db.update('destinations', id, body);
    return sendJSON(res, 200, { success: true, destination: updated });
  }

  // ---------------------------------------------------------------------------
  // CATEGORIES API
  // ---------------------------------------------------------------------------
  if (pathname === '/api/categories' && method === 'GET') {
    const categories = db.getTable('categories');
    return sendJSON(res, 200, { success: true, categories });
  }

  // ---------------------------------------------------------------------------
  // PACKAGES API
  // ---------------------------------------------------------------------------
  if (pathname === '/api/packages' && method === 'GET') {
    let packages = db.getTable('tour_packages');

    // Customer exploration only sees approved packages by default
    if (query.status) {
      if (query.status !== 'all') {
        packages = packages.filter(p => p.status === query.status);
      }
    } else if (!query.provider_id && !query.include_pending) {
      packages = packages.filter(p => p.status === 'approved');
    }

    if (query.provider_id) {
      packages = packages.filter(p => Number(p.provider_id) === Number(query.provider_id));
    }
    if (query.destination_id) {
      packages = packages.filter(p => Number(p.destination_id) === Number(query.destination_id));
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      packages = packages.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (query.min_price) {
      packages = packages.filter(p => Number(p.price_per_person) >= Number(query.min_price));
    }
    if (query.max_price) {
      packages = packages.filter(p => Number(p.price_per_person) <= Number(query.max_price));
    }

    // Attach destination name and category name for ease of frontend consumption
    const destinations = db.getTable('destinations');
    const categories = db.getTable('categories');
    const enriched = packages.map(pkg => {
      const dest = destinations.find(d => Number(d.id) === Number(pkg.destination_id));
      const cat = categories.find(c => Number(c.id) === Number(pkg.category_id));
      return {
        ...pkg,
        destination_name: dest ? dest.name : 'Tamil Nadu',
        destination_tamil: dest ? dest.tamil_name : '',
        category_name: cat ? cat.name : 'Heritage'
      };
    });

    return sendJSON(res, 200, { success: true, count: enriched.length, packages: enriched });
  }

  if (pathname.match(/^\/api\/packages\/(\d+)$/) && method === 'GET') {
    const id = pathname.split('/')[3];
    const pkg = db.findById('tour_packages', id);
    if (!pkg) return sendJSON(res, 404, { success: false, error: 'Package not found.' });

    const dest = db.findById('destinations', pkg.destination_id);
    const cat = db.findById('categories', pkg.category_id);
    const itinerary = db.find('package_itinerary', it => Number(it.package_id) === Number(id));
    const availability = db.find('package_availability', a => Number(a.package_id) === Number(id));
    const reviews = db.find('reviews', r => Number(r.package_id) === Number(id) && r.status === 'approved');

    return sendJSON(res, 200, {
      success: true,
      package: {
        ...pkg,
        destination_name: dest ? dest.name : 'Tamil Nadu',
        destination_tamil: dest ? dest.tamil_name : '',
        category_name: cat ? cat.name : 'Heritage',
        itinerary,
        availability,
        reviews
      }
    });
  }

  if (pathname === '/api/packages' && method === 'POST') {
    const body = await parseBody(req);
    // Default package status is 'pending' requiring admin approval
    const status = (authUser && ['admin', 'superadmin'].includes(authUser.role)) ? 'approved' : 'pending';
    const newPackage = db.insert('tour_packages', {
      provider_id: body.provider_id || (authUser ? authUser.id : 3),
      destination_id: Number(body.destination_id) || 1,
      category_id: Number(body.category_id) || 1,
      title: body.title || body.name,
      duration: body.duration || '3 Days / 2 Nights',
      price_per_person: Number(body.price_per_person || body.price || 5000),
      capacity: Number(body.capacity || 20),
      available_seats: Number(body.capacity || 20),
      start_date: body.start_date || body.startDate || '2026-12-01',
      end_date: body.end_date || body.endDate || '2026-12-05',
      description: body.description || '',
      inclusions: body.inclusions || 'Standard transport and guided tour',
      exclusions: body.exclusions || 'Personal expenses',
      featured_image: body.featured_image || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
      status,
      rating_avg: 5.0,
      review_count: 0
    });

    db.logAction(authUser?.id, 'PACKAGE_SUBMITTED', 'packages', `Submitted package: ${newPackage.title} (Status: ${status})`);
    return sendJSON(res, 201, { success: true, message: 'Package submitted successfully.', package: newPackage });
  }

  if (pathname.match(/^\/api\/packages\/(\d+)$/) && method === 'PUT') {
    const id = pathname.split('/')[3];
    const body = await parseBody(req);
    const updated = db.update('tour_packages', id, body);
    if (!updated) return sendJSON(res, 404, { success: false, error: 'Package not found' });

    if (body.status) {
      db.logAction(authUser?.id, 'PACKAGE_STATUS_CHANGED', 'packages', `Package ${id} status set to ${body.status}`);
    }
    return sendJSON(res, 200, { success: true, message: 'Package updated successfully.', package: updated });
  }

  if (pathname.match(/^\/api\/packages\/(\d+)$/) && method === 'DELETE') {
    const id = pathname.split('/')[3];
    const deleted = db.delete('tour_packages', id);
    if (!deleted) return sendJSON(res, 404, { success: false, error: 'Package not found' });
    db.logAction(authUser?.id, 'PACKAGE_DELETED', 'packages', `Deleted package ${id}`);
    return sendJSON(res, 200, { success: true, message: 'Package deleted successfully.' });
  }

  // ---------------------------------------------------------------------------
  // BOOKINGS API
  // ---------------------------------------------------------------------------
  if (pathname === '/api/bookings' && method === 'GET') {
    let bookings = db.getTable('bookings');

    if (query.user_id) {
      bookings = bookings.filter(b => Number(b.user_id) === Number(query.user_id));
    }
    if (query.provider_id) {
      const providerPackages = db.find('tour_packages', p => Number(p.provider_id) === Number(query.provider_id)).map(p => Number(p.id));
      bookings = bookings.filter(b => providerPackages.includes(Number(b.package_id)));
    }
    if (query.status) {
      bookings = bookings.filter(b => b.booking_status === query.status);
    }

    // Attach package title and destination name
    const packages = db.getTable('tour_packages');
    const enriched = bookings.map(b => {
      const pkg = packages.find(p => Number(p.id) === Number(b.package_id));
      return {
        ...b,
        package_title: pkg ? pkg.title : 'Custom Tourism Package',
        package_duration: pkg ? pkg.duration : '3 Days',
        package_image: pkg ? pkg.featured_image : ''
      };
    });

    return sendJSON(res, 200, { success: true, count: enriched.length, bookings: enriched });
  }

  if (pathname.match(/^\/api\/bookings\/(\d+)$/) && method === 'GET') {
    const id = pathname.split('/')[3];
    const booking = db.findById('bookings', id);
    if (!booking) return sendJSON(res, 404, { success: false, error: 'Booking not found.' });
    return sendJSON(res, 200, { success: true, booking });
  }

  if (pathname === '/api/bookings' && method === 'POST') {
    const body = await parseBody(req);
    const { package_id, user_id, travel_date, travellers_count = 1, customer_name, customer_email, customer_phone, total_amount, special_requests, payment_method = 'UPI / Net Banking' } = body;

    const pkg = db.findById('tour_packages', package_id);
    if (!pkg) return sendJSON(res, 404, { success: false, error: 'Selected package does not exist.' });

    const ref = 'BK-YO-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
    const travellers = Number(travellers_count) || 1;
    const finalAmount = total_amount ? Number(total_amount) : (Number(pkg.price_per_person) * travellers);

    // Create booking
    const newBooking = db.insert('bookings', {
      booking_reference: ref,
      user_id: user_id || (authUser ? authUser.id : 1),
      package_id: Number(package_id),
      travel_date: travel_date || pkg.start_date,
      travellers_count: travellers,
      customer_name: customer_name || (authUser ? authUser.full_name : 'Guest Customer'),
      customer_email: customer_email || (authUser ? authUser.email : 'customer@yaadhum.in'),
      customer_phone: customer_phone || (authUser ? authUser.phone : '9876543210'),
      total_amount: finalAmount,
      special_requests: special_requests || '',
      booking_status: 'confirmed',
      payment_status: 'completed'
    });

    // Create corresponding payment transaction
    const paymentRef = 'PAY-TXN-' + Math.floor(100000 + Math.random() * 900000);
    db.insert('payments', {
      booking_id: newBooking.id,
      user_id: newBooking.user_id,
      payment_reference: paymentRef,
      payment_method,
      amount: finalAmount,
      payment_status: 'completed'
    });

    // Update package seats
    if (pkg.available_seats && pkg.available_seats >= travellers) {
      db.update('tour_packages', pkg.id, { available_seats: pkg.available_seats - travellers });
    }

    db.logAction(newBooking.user_id, 'BOOKING_CREATED', 'bookings', `Created booking ${ref} for package ${pkg.title}`);

    return sendJSON(res, 201, {
      success: true,
      message: 'Booking confirmed successfully!',
      booking: newBooking,
      payment_reference: paymentRef
    });
  }

  if (pathname.match(/^\/api\/bookings\/(\d+)$/) && method === 'PUT') {
    const id = pathname.split('/')[3];
    const body = await parseBody(req);
    const updated = db.update('bookings', id, body);
    if (!updated) return sendJSON(res, 404, { success: false, error: 'Booking not found.' });
    db.logAction(authUser?.id, 'BOOKING_STATUS_CHANGED', 'bookings', `Booking ${id} status updated to ${body.booking_status}`);
    return sendJSON(res, 200, { success: true, booking: updated });
  }

  // ---------------------------------------------------------------------------
  // REVIEWS API
  // ---------------------------------------------------------------------------
  if (pathname === '/api/reviews' && method === 'GET') {
    let reviews = db.getTable('reviews');
    if (query.package_id) {
      reviews = reviews.filter(r => Number(r.package_id) === Number(query.package_id));
    }
    const users = db.getTable('users');
    const enriched = reviews.map(r => {
      const u = users.find(user => Number(user.id) === Number(r.user_id));
      return {
        ...r,
        customer_name: u ? u.full_name : 'Customer'
      };
    });
    return sendJSON(res, 200, { success: true, count: enriched.length, reviews: enriched });
  }

  if (pathname === '/api/reviews' && method === 'POST') {
    const body = await parseBody(req);
    const { package_id, booking_id, rating = 5, comment } = body;
    if (!package_id || !comment) {
      return sendJSON(res, 400, { success: false, error: 'Package ID and comment are required.' });
    }
    const newReview = db.insert('reviews', {
      package_id: Number(package_id),
      booking_id: booking_id ? Number(booking_id) : null,
      user_id: authUser ? authUser.id : 1,
      rating: Number(rating),
      comment,
      status: 'approved'
    });
    db.logAction(authUser?.id, 'REVIEW_SUBMITTED', 'reviews', `Submitted review for package ${package_id}`);
    return sendJSON(res, 201, { success: true, review: newReview });
  }

  // ---------------------------------------------------------------------------
  // ADMIN & SUPER ADMIN APIS
  // ---------------------------------------------------------------------------
  if (pathname === '/api/admin/customers' && method === 'GET') {
    const customers = db.find('users', u => u.role === 'customer');
    return sendJSON(res, 200, { success: true, count: customers.length, customers });
  }

  if (pathname.match(/^\/api\/admin\/customers\/(\d+)$/) && method === 'PUT') {
    const id = pathname.split('/')[4];
    const body = await parseBody(req);
    const updated = db.update('users', id, body);
    db.logAction(authUser?.id, 'CUSTOMER_UPDATED', 'customers', `Updated customer account status for user ${id}`);
    return sendJSON(res, 200, { success: true, customer: updated });
  }

  if (pathname === '/api/admin/providers' && method === 'GET') {
    const providers = db.find('users', u => u.role === 'provider');
    return sendJSON(res, 200, { success: true, count: providers.length, providers });
  }

  if (pathname.match(/^\/api\/admin\/providers\/(\d+)$/) && method === 'PUT') {
    const id = pathname.split('/')[4];
    const body = await parseBody(req);
    const updated = db.update('users', id, body);
    db.logAction(authUser?.id, 'PROVIDER_UPDATED', 'providers', `Updated provider verification status for user ${id}`);
    return sendJSON(res, 200, { success: true, provider: updated });
  }

  if (pathname === '/api/admin/admins' && method === 'GET') {
    const admins = db.find('users', u => ['admin', 'superadmin'].includes(u.role));
    return sendJSON(res, 200, { success: true, admins });
  }

  if (pathname === '/api/admin/admins' && method === 'POST') {
    const body = await parseBody(req);
    const { full_name, email, phone, role = 'admin', password = 'Password@123' } = body;
    const newAdmin = db.insert('users', {
      full_name,
      email,
      phone,
      password_hash: password,
      role: role === 'superadmin' ? 'superadmin' : 'admin',
      status: 'active'
    });
    db.logAction(authUser?.id, 'ADMIN_CREATED', 'superadmin', `Created admin user: ${email} (${role})`);
    return sendJSON(res, 201, { success: true, admin: newAdmin });
  }

  if (pathname === '/api/admin/permissions' && method === 'GET') {
    const perms = db.getTable('admin_permissions');
    return sendJSON(res, 200, { success: true, permissions: perms });
  }

  if (pathname === '/api/admin/logs' && method === 'GET') {
    const logs = db.getTable('system_logs').slice().reverse().slice(0, 100);
    return sendJSON(res, 200, { success: true, logs });
  }

  if (pathname === '/api/admin/reports' && method === 'GET') {
    const packages = db.getTable('tour_packages');
    const bookings = db.getTable('bookings');
    const customers = db.find('users', u => u.role === 'customer');
    const providers = db.find('users', u => u.role === 'provider');

    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const confirmedCount = bookings.filter(b => b.booking_status === 'confirmed').length;
    const pendingCount = bookings.filter(b => b.booking_status === 'pending').length;
    const cancelledCount = bookings.filter(b => b.booking_status === 'cancelled').length;

    return sendJSON(res, 200, {
      success: true,
      stats: {
        totalPackages: packages.length,
        approvedPackages: packages.filter(p => p.status === 'approved').length,
        pendingPackages: packages.filter(p => p.status === 'pending').length,
        totalBookings: bookings.length,
        confirmedBookings: confirmedCount,
        pendingBookings: pendingCount,
        cancelledBookings: cancelledCount,
        totalRevenue,
        totalCustomers: customers.length,
        totalProviders: providers.length
      }
    });
  }

  if (pathname === '/api/admin/settings' && method === 'GET') {
    const settings = db.data.system_settings || {};
    return sendJSON(res, 200, { success: true, settings });
  }

  if (pathname === '/api/admin/settings' && method === 'PUT') {
    const body = await parseBody(req);
    db.data.system_settings = { ...db.data.system_settings, ...body };
    db.saveStore();
    db.logAction(authUser?.id, 'SETTINGS_UPDATED', 'settings', 'Platform system settings updated.');
    return sendJSON(res, 200, { success: true, settings: db.data.system_settings });
  }

  // Fallback for unhandled API route
  sendJSON(res, 404, { success: false, error: 'API endpoint not found: ' + pathname });
}

// Start server
server.listen(PORT, () => {
  console.log(`=============================================================================`);
  console.log(` YAADHUM OOORE - Local Tourism Package Booking System`);
  console.log(` HTTP Server running natively at: http://localhost:${PORT}`);
  console.log(` Serving Frontend from: ${FRONTEND_DIR}`);
  console.log(` Zero Framework Dependencies: Vanilla Node.js HTTP standard library`);
  console.log(`=============================================================================`);
});

module.exports = server;
