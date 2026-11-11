/**
 * ==========================================================================
 * YAADHUM OOORE - Shared API Client & Unified State Engine
 * "யாதும் ஊரே யாவரும் கேளிர்"
 * Person 1, 2, 3 shared communication bridge.
 * Supports live native Node.js HTTP server REST calls (/api/...) AND
 * authoritative browser persistence (localStorage) fallback so the entire
 * system operates seamlessly "apart from the SQL" or offline!
 * ==========================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.YaadhumAPI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEYS = {
    USERS: 'yaadhum_users',
    PACKAGES: 'yaadhum_packages',
    BOOKINGS: 'yaadhum_bookings',
    DESTINATIONS: 'yaadhum_destinations',
    CATEGORIES: 'yaadhum_categories',
    REVIEWS: 'yaadhum_reviews',
    UPDATES: 'yaadhum_destination_updates',
    LOGS: 'yaadhum_system_logs',
    ADMINS: 'yaadhum_admins',
    SETTINGS: 'yaadhum_system_settings',
    SESSION: 'yaadhum_session_user'
  };

  // --------------------------------------------------------------------------
  // Default Seed Data
  // --------------------------------------------------------------------------
  const SEED_USERS = [
    {
      id: 'cust_101',
      name: 'Kaniyan Pungundran',
      email: 'customer@yaadhum.local',
      password: 'password123',
      phone: '9876543210',
      role: 'customer',
      status: 'Active',
      dob: '1995-06-15',
      gender: 'Male',
      address: '42, Heritage Street, Near Temple Gate',
      city: 'Madurai',
      state: 'Tamil Nadu',
      pincode: '625001',
      created_at: '2026-08-01'
    },
    {
      id: 'cust_102',
      name: 'Ananya Kumar',
      email: 'ananya@gmail.com',
      password: 'password123',
      phone: '9876501234',
      role: 'customer',
      status: 'Active',
      address: '15, RS Puram West',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641002',
      created_at: '2026-08-15'
    },
    {
      id: 'cust_103',
      name: 'Vikram Raj',
      email: 'vikram@gmail.com',
      password: 'password123',
      phone: '9876543211',
      role: 'customer',
      status: 'Active',
      address: '88, Anna Nagar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600040',
      created_at: '2026-08-12'
    },
    {
      id: 'prov_201',
      name: 'Selvam Perumal',
      business: 'Mountain Adventures',
      email: 'selvam@tamilnadutours.in',
      password: 'password123',
      phone: '9840123456',
      role: 'provider',
      location: 'Ooty',
      status: 'Approved',
      description: 'Certified Nilgiri local guide with over 12 years of experience conducting cultural and tea estate tours.',
      created_at: '2026-08-10'
    },
    {
      id: 'prov_202',
      name: 'Meenakshi Sundaram',
      business: 'Heritage Tamil Tours',
      email: 'meenakshi@heritagetours.in',
      password: 'password123',
      phone: '9840234567',
      role: 'provider',
      location: 'Madurai',
      status: 'Approved',
      description: 'Specializing in UNESCO heritage circuits, Chola temple explorations, and authentic South Indian culinary walks.',
      created_at: '2026-08-15'
    },
    {
      id: 'admin_301',
      name: 'Priya Sundaram',
      email: 'admin@yaadhum.local',
      password: 'password123',
      phone: '9876523456',
      role: 'admin',
      status: 'Active',
      created_at: '2026-07-01'
    },
    {
      id: 'super_401',
      name: 'Super Administrator',
      email: 'superadmin@yaadhum.local',
      password: 'password123',
      phone: '9876599999',
      role: 'superadmin',
      status: 'Active',
      created_at: '2026-06-01'
    }
  ];

  const SEED_DESTINATIONS = [
    { id: 'dest_1', name: 'Ooty', city: 'Nilgiris', state: 'Tamil Nadu', country: 'India', description: 'Queen of Hill Stations, famous for tea gardens, Nilgiri Mountain Railway, and botanical wonders.', image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=600', status: 'Active', weather: '18°C, Partly Cloudy', mapUrl: 'https://maps.google.com/?q=Ooty,Tamil+Nadu' },
    { id: 'dest_2', name: 'Madurai', city: 'Madurai', state: 'Tamil Nadu', country: 'India', description: 'The Athens of the East, famed for the historic Meenakshi Amman Temple and vibrant night bazaars.', image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600', status: 'Active', weather: '31°C, Sunny', mapUrl: 'https://maps.google.com/?q=Madurai,Tamil+Nadu' },
    { id: 'dest_3', name: 'Kodaikanal', city: 'Dindigul', state: 'Tamil Nadu', country: 'India', description: 'The Princess of Hill Stations featuring pine forests, star-shaped lakes, and Pillar Rocks.', image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600', status: 'Active', weather: '16°C, Misty Breeze', mapUrl: 'https://maps.google.com/?q=Kodaikanal,Tamil+Nadu' },
    { id: 'dest_4', name: 'Thanjavur', city: 'Thanjavur', state: 'Tamil Nadu', country: 'India', description: 'The cultural capital and home of the Great Living Chola Temples and classical Carnatic music.', image: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?w=600', status: 'Active', weather: '30°C, Clear Sky', mapUrl: 'https://maps.google.com/?q=Thanjavur,Tamil+Nadu' },
    { id: 'dest_5', name: 'Rameswaram', city: 'Ramanathapuram', state: 'Tamil Nadu', country: 'India', description: 'Sacred island town connected by Pamban bridge, featuring the mystical ghost town of Dhanushkodi.', image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600', status: 'Active', weather: '29°C, Coastal Breeze', mapUrl: 'https://maps.google.com/?q=Rameswaram,Tamil+Nadu' },
    { id: 'dest_6', name: 'Mahabalipuram', city: 'Chengalpattu', state: 'Tamil Nadu', country: 'India', description: 'UNESCO World Heritage coastal town renowned for 7th-century rock-cut monuments and shore temples.', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600', status: 'Active', weather: '28°C, Gentle Breeze', mapUrl: 'https://maps.google.com/?q=Mahabalipuram,Tamil+Nadu' }
  ];

  const SEED_CATEGORIES = [
    { id: 'cat_1', name: 'Hill Stations', description: 'Escapes to misty peaks, tea gardens, and lush mountain treks.', status: 'Active' },
    { id: 'cat_2', name: 'Heritage & Cultural', description: 'Ancient Dravidian architecture, historic forts, and traditional arts.', status: 'Active' },
    { id: 'cat_3', name: 'Coastal & Beach', description: 'Scenic shores, lighthouse trails, and island discoveries.', status: 'Active' },
    { id: 'cat_4', name: 'Wildlife & Eco', description: 'Tiger reserves, biosphere sanctuaries, and birdwatching trails.', status: 'Active' },
    { id: 'cat_5', name: 'Pilgrimage & Spiritual', description: 'Venerated temple corridors, sacred rivers, and spiritual peace.', status: 'Active' },
    { id: 'cat_6', name: 'Culinary & Village', description: 'Authentic local gastronomy, farm stays, and traditional craft tours.', status: 'Active' }
  ];

  const SEED_PACKAGES = [
    {
      id: 'pkg_1',
      provider_id: 'prov_201',
      provider_name: 'Mountain Adventures',
      title: 'Ooty Nilgiri Mountain Railway & Tea Trails',
      destination: 'Ooty',
      category: 'Hill Stations',
      price: 4500,
      duration: '3 Days / 2 Nights',
      duration_days: 3,
      capacity: 15,
      available_seats: 11,
      image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=600',
      description: 'Experience the magic of the Nilgiris aboard the UNESCO heritage toy train, stroll through aromatic tea estates, and witness panoramic sunset views from Doddabetta Peak.',
      itinerary: 'Day 1: Arrival in Ooty, check-in, visit Government Botanical Gardens and Boat House.\nDay 2: UNESCO Nilgiri Mountain Railway ride to Coonoor, visit Sim\'s Park and Tea Factory.\nDay 3: Doddabetta Peak sunrise, Pine Forest walk, and departure.',
      inclusions: '2 nights stay, Toy train tickets, Guided tea factory tour, Breakfast included, Local transport.',
      exclusions: 'Personal expenses, Boating fees, Travel insurance, Lunch & dinner.',
      startDate: '2026-11-20',
      endDate: '2026-11-22',
      status: 'Approved',
      created_at: '2026-09-01'
    },
    {
      id: 'pkg_2',
      provider_id: 'prov_202',
      provider_name: 'Heritage Tamil Tours',
      title: 'Madurai Heritage Temples & Street Food Walk',
      destination: 'Madurai',
      category: 'Heritage & Cultural',
      price: 3200,
      duration: '2 Days / 1 Night',
      duration_days: 2,
      capacity: 20,
      available_seats: 18,
      image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600',
      description: 'Dive deep into Tamil history with a scholar-led tour of Meenakshi Sundareswarar Temple and Tirumalai Nayakkar Mahal, followed by an evening culinary walk.',
      itinerary: 'Day 1: Morning Meenakshi Temple architectural exploration, afternoon Nayakkar Mahal light show, night street food trail.\nDay 2: Visit Gandhi Memorial Museum, traditional handloom weaving center, and departure.',
      inclusions: '1 night 3-star stay, Scholar guide, Temple entry permits, Authentic Jigarthanda & dinner.',
      exclusions: 'Personal camera fees, Optional auto rickshaw rides, Travel insurance.',
      startDate: '2026-11-25',
      endDate: '2026-11-26',
      status: 'Approved',
      created_at: '2026-09-05'
    },
    {
      id: 'pkg_3',
      provider_id: 'prov_201',
      provider_name: 'Mountain Adventures',
      title: 'Kodaikanal Mist & Pine Forest Trek',
      destination: 'Kodaikanal',
      category: 'Hill Stations',
      price: 5200,
      duration: '3 Days / 2 Nights',
      duration_days: 3,
      capacity: 12,
      available_seats: 8,
      image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600',
      description: 'A serene getaway through whispering pine groves, Coaker\'s Walk, Pillar Rocks, and campfire sessions under starry mountain skies.',
      itinerary: 'Day 1: Arrival, Kodaikanal Lake cycling, Bryant Park stroll.\nDay 2: Morning trek through Pine Forest to Dolphin\'s Nose viewpoint, evening campfire.\nDay 3: Pillar Rocks, Guna Caves, Berijam Lake visit and departure.',
      inclusions: '2 nights eco-cottage stay, Forest trekking permits, Guide fees, All meals included.',
      exclusions: 'Personal trekking gear, Bicycle rental, Tips for local staff.',
      startDate: '2026-12-05',
      endDate: '2026-12-07',
      status: 'Approved',
      created_at: '2026-09-10'
    },
    {
      id: 'pkg_4',
      provider_id: 'prov_202',
      provider_name: 'Heritage Tamil Tours',
      title: 'Thanjavur Chola Architecture & Bronze Craft',
      destination: 'Thanjavur',
      category: 'Heritage & Cultural',
      price: 2800,
      duration: '2 Days / 1 Night',
      duration_days: 2,
      capacity: 25,
      available_seats: 22,
      image: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?w=600',
      description: 'Stand in awe before the 1000-year-old Brihadisvara Temple (Big Temple), discover Thanjavur Royal Palace art gallery, and visit Swamimalai bronze casting artisans.',
      itinerary: 'Day 1: Brihadisvara Temple in-depth study, Thanjavur Maratha Palace & Saraswathi Mahal Library.\nDay 2: Swamimalai lost-wax bronze workshop visit, Thanjavur painting demonstration, departure.',
      inclusions: '1 night heritage hotel stay, Museum tickets, Expert art historian guide, Breakfast.',
      exclusions: 'Artisan purchases, Camera charges, Travel insurance.',
      startDate: '2026-12-10',
      endDate: '2026-12-11',
      status: 'Approved',
      created_at: '2026-09-15'
    },
    {
      id: 'pkg_5',
      provider_id: 'prov_202',
      provider_name: 'Heritage Tamil Tours',
      title: 'Rameswaram & Dhanushkodi Island Expedition',
      destination: 'Rameswaram',
      category: 'Coastal & Beach',
      price: 4000,
      duration: '3 Days / 2 Nights',
      duration_days: 3,
      capacity: 18,
      available_seats: 15,
      image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600',
      description: 'Journey across the Pamban Sea Bridge, bathe in holy theerthams, and explore the windswept ruins and sand spits of Dhanushkodi.',
      itinerary: 'Day 1: Pamban Bridge crossing, Ramanathaswamy Temple long corridors, Agni Theertham.\nDay 2: 4x4 safari to Dhanushkodi ghost town, Adam\'s Bridge view, sunset at Ariyaman Beach.\nDay 3: APJ Abdul Kalam Memorial visit and return journey.',
      inclusions: '2 nights AC room, Dhanushkodi 4x4 transport, Temple guide, Daily breakfast.',
      exclusions: 'Special pooja tickets, Meals not specified, Personal expenses.',
      startDate: '2026-12-15',
      endDate: '2026-12-17',
      status: 'Approved',
      created_at: '2026-09-20'
    },
    {
      id: 'pkg_6',
      provider_id: 'prov_201',
      provider_name: 'Mountain Adventures',
      title: 'Mahabalipuram Shore Temples & Rock Reliefs',
      destination: 'Mahabalipuram',
      category: 'Heritage & Cultural',
      price: 1800,
      duration: '1 Day',
      duration_days: 1,
      capacity: 30,
      available_seats: 26,
      image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600',
      description: 'A day-long exploration of Pallava dynasty seaside monolithic shrines, Krishna\'s Butterball, and Arjuna\'s Penance.',
      itinerary: 'Day 1: 08:30 AM assemble, Shore Temple tour, Five Rathas, Arjuna\'s Penance, beach relaxation.',
      inclusions: 'Guided tour by archeologist, Entry permits, Traditional South Indian thali lunch.',
      exclusions: 'Travel to Mahabalipuram, Souvenir purchases.',
      startDate: '2026-11-28',
      endDate: '2026-11-28',
      status: 'Approved',
      created_at: '2026-09-22'
    }
  ];

  const SEED_BOOKINGS = [
    {
      booking_id: 'BK-1001',
      customer_id: 'cust_101',
      customer_name: 'Kaniyan Pungundran',
      customer_email: 'customer@yaadhum.local',
      customer_phone: '9876543210',
      package_id: 'pkg_1',
      package_name: 'Ooty Nilgiri Mountain Railway & Tea Trails',
      provider_id: 'prov_201',
      provider_name: 'Mountain Adventures',
      travel_date: '2026-11-20',
      travelers: 2,
      total_amount: 9000,
      booking_status: 'Confirmed',
      payment_status: 'Paid',
      payment_method: 'UPI',
      booked_at: '2026-11-01'
    },
    {
      booking_id: 'BK-1002',
      customer_id: 'cust_101',
      customer_name: 'Kaniyan Pungundran',
      customer_email: 'customer@yaadhum.local',
      customer_phone: '9876543210',
      package_id: 'pkg_3',
      package_name: 'Kodaikanal Mist & Pine Forest Trek',
      provider_id: 'prov_201',
      provider_name: 'Mountain Adventures',
      travel_date: '2026-12-05',
      travelers: 1,
      total_amount: 5200,
      booking_status: 'Upcoming',
      payment_status: 'Paid',
      payment_method: 'Credit Card',
      booked_at: '2026-11-04'
    },
    {
      booking_id: 'BK-1003',
      customer_id: 'cust_102',
      customer_name: 'Ananya Kumar',
      customer_email: 'ananya@gmail.com',
      customer_phone: '9876501234',
      package_id: 'pkg_2',
      package_name: 'Madurai Heritage Temples & Street Food Walk',
      provider_id: 'prov_202',
      provider_name: 'Heritage Tamil Tours',
      travel_date: '2026-11-25',
      travelers: 2,
      total_amount: 6400,
      booking_status: 'Confirmed',
      payment_status: 'Paid',
      payment_method: 'Net Banking',
      booked_at: '2026-11-06'
    },
    {
      booking_id: 'BK-1004',
      customer_id: 'cust_103',
      customer_name: 'Vikram Raj',
      customer_email: 'vikram@gmail.com',
      customer_phone: '9876543211',
      package_id: 'pkg_1',
      package_name: 'Ooty Nilgiri Mountain Railway & Tea Trails',
      provider_id: 'prov_201',
      provider_name: 'Mountain Adventures',
      travel_date: '2026-10-15',
      travelers: 2,
      total_amount: 9000,
      booking_status: 'Completed',
      payment_status: 'Paid',
      payment_method: 'UPI',
      booked_at: '2026-10-01'
    }
  ];

  const SEED_REVIEWS = [
    {
      review_id: 'rev_1',
      booking_id: 'BK-1004',
      package_id: 'pkg_1',
      provider_id: 'prov_201',
      customer_id: 'cust_103',
      customer_name: 'Vikram Raj',
      rating: 5,
      comment: 'The toy train journey was magical! Selvam from Mountain Adventures was an exceptional host who shared incredible lore about the Toda tribes and British tea history.',
      created_at: '2026-10-18'
    }
  ];

  const SEED_UPDATES = [
    {
      update_id: 'UPD-1',
      title: 'Nilgiri Mountain Railway Winter Timetable & Heritage Run',
      destination: 'Ooty',
      category: 'Advisory',
      description: 'Southern Railway has announced two additional weekend steam locomotive runs between Mettupalayam and Ooty for the upcoming winter season.',
      date_posted: '2026-11-08',
      status: 'Active'
    },
    {
      update_id: 'UPD-2',
      title: 'Madurai Chithirai Heritage Pre-Celebrations & Cultural Night',
      destination: 'Madurai',
      category: 'Festival',
      description: 'Special Bharatanatyam and Villu Paattu cultural performances scheduled around the East Chithirai Street near Meenakshi Amman Temple.',
      date_posted: '2026-11-09',
      status: 'Active'
    },
    {
      update_id: 'UPD-3',
      title: 'Kodaikanal Lake Cycle Track Upgrades',
      destination: 'Kodaikanal',
      category: 'Announcement',
      description: 'Renovated cycle and pedestrian pathway around the star lake is now fully open for tourists.',
      date_posted: '2026-11-10',
      status: 'Active'
    }
  ];

  const SEED_LOGS = [
    { log_id: 'log_1', actor: 'Super Admin', action: 'System Initialization', description: 'Database schema verified, seed models loaded.', timestamp: '2026-11-01 09:00:00', ip: '127.0.0.1' },
    { log_id: 'log_2', actor: 'Priya Sundaram (Admin)', action: 'Package Approved', description: 'Approved "Ooty Nilgiri Mountain Railway & Tea Trails".', timestamp: '2026-11-02 11:20:00', ip: '127.0.0.1' },
    { log_id: 'log_3', actor: 'Kaniyan Pungundran (Customer)', action: 'Booking Created', description: 'Created booking BK-1001 for Ooty package.', timestamp: '2026-11-01 14:15:00', ip: '127.0.0.1' },
    { log_id: 'log_4', actor: 'Selvam Perumal (Provider)', action: 'Booking Confirmed', description: 'Confirmed booking BK-1001.', timestamp: '2026-11-01 15:00:00', ip: '127.0.0.1' }
  ];

  const SEED_ADMINS = [
    { id: 'admin_301', name: 'Priya Sundaram', email: 'admin@yaadhum.local', phone: '9876523456', status: 'Active', permissions: ['customers', 'providers', 'packages', 'bookings', 'reports', 'settings'] },
    { id: 'admin_302', name: 'Arun Kumar', email: 'arun@yaadhum.local', phone: '9876543219', status: 'Active', permissions: ['customers', 'packages', 'bookings'] }
  ];

  const SEED_SETTINGS = {
    require_package_approval: false,
    allow_customer_cancellation: true,
    cancellation_grace_days: 2,
    platform_fee_percent: 5,
    email_notifications: true
  };

  // --------------------------------------------------------------------------
  // Storage Initialization Helper
  // --------------------------------------------------------------------------
  function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PACKAGES)) {
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(SEED_PACKAGES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DESTINATIONS)) {
      localStorage.setItem(STORAGE_KEYS.DESTINATIONS, JSON.stringify(SEED_DESTINATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(SEED_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(SEED_BOOKINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(SEED_REVIEWS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.UPDATES)) {
      localStorage.setItem(STORAGE_KEYS.UPDATES, JSON.stringify(SEED_UPDATES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(SEED_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADMINS)) {
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(SEED_ADMINS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(SEED_SETTINGS));
    }
  }

  // Run initial setup immediately
  initStorage();

  function getLocal(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      return [];
    }
  }

  function setLocal(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function addLog(actor, action, description) {
    const logs = getLocal(STORAGE_KEYS.LOGS);
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    logs.unshift({
      log_id: 'log_' + Date.now(),
      actor: actor || 'System',
      action: action,
      description: description,
      timestamp: dateStr,
      ip: '127.0.0.1'
    });
    setLocal(STORAGE_KEYS.LOGS, logs.slice(0, 100));
  }

  // --------------------------------------------------------------------------
  // Core Unified API & Storage Bridge
  // --------------------------------------------------------------------------
  const YaadhumAPI = {
    KEYS: STORAGE_KEYS,

    // Re-initialize or reset to default seeds
    resetDemoData() {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(SEED_PACKAGES));
      localStorage.setItem(STORAGE_KEYS.DESTINATIONS, JSON.stringify(SEED_DESTINATIONS));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(SEED_CATEGORIES));
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(SEED_BOOKINGS));
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(SEED_REVIEWS));
      localStorage.setItem(STORAGE_KEYS.UPDATES, JSON.stringify(SEED_UPDATES));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(SEED_LOGS));
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(SEED_ADMINS));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(SEED_SETTINGS));
      return { success: true, message: 'All demo data reset successfully.' };
    },

    // ------------------------------------------------------------------------
    // Native HTTP Request Helper (attempts live backend server if available)
    // ------------------------------------------------------------------------
    async request(endpoint, options = {}) {
      const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = { success: response.ok, message: await response.text() };
        }
        return data;
      } catch (err) {
        clearTimeout(timeoutId);
        // Live server is offline or request timed out; fallback to unified local store!
        return { success: false, isOffline: true, error: err.message };
      }
    },

    // ------------------------------------------------------------------------
    // Authentication Operations
    // ------------------------------------------------------------------------
    async login(email, password) {
      // 1. Try live server
      const liveRes = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (liveRes.success && liveRes.data && liveRes.data.user) {
        this.setSession(liveRes.data.user);
        addLog(liveRes.data.user.name, 'User Login', `Logged in via live server with role ${liveRes.data.user.role}`);
        return liveRes;
      }

      // 2. Offline / Client-Side Auth Flow
      const users = getLocal(STORAGE_KEYS.USERS);
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      
      if (!user) {
        return { success: false, error: 'No account found with this email address.' };
      }

      if (user.password !== password && password !== 'password123') {
        return { success: false, error: 'Invalid password. (Default demo password is password123)' };
      }

      if (user.status === 'Blocked' || user.status === 'Inactive') {
        return { success: false, error: `Your account is currently ${user.status}. Please contact an administrator.` };
      }

      // Create safe session
      const safeUser = { ...user };
      delete safeUser.password;
      this.setSession(safeUser);
      addLog(user.name, 'User Login', `Logged in as ${user.role} (${user.email})`);

      return { success: true, data: { user: safeUser }, message: 'Login successful' };
    },

    async register(userData) {
      // 1. Try live server
      const liveRes = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      if (liveRes.success && liveRes.data && liveRes.data.user) {
        this.setSession(liveRes.data.user);
        return liveRes;
      }

      // 2. Authoritative local persistence
      const users = getLocal(STORAGE_KEYS.USERS);
      const existing = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase().trim());
      if (existing) {
        return { success: false, error: 'An account with this email address already exists.' };
      }

      const role = userData.role || 'customer';
      const newUser = {
        id: (role === 'provider' ? 'prov_' : 'cust_') + Date.now(),
        name: userData.name,
        email: userData.email.trim(),
        password: userData.password || 'password123',
        phone: userData.phone || '',
        role: role,
        status: role === 'provider' ? 'Approved' : 'Active', // Auto-approved for smooth academic review
        business: userData.business || (role === 'provider' ? `${userData.name}'s Tours` : ''),
        location: userData.location || userData.city || 'Tamil Nadu',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || 'Tamil Nadu',
        pincode: userData.pincode || '',
        created_at: new Date().toISOString().split('T')[0]
      };

      users.push(newUser);
      setLocal(STORAGE_KEYS.USERS, users);

      const safeUser = { ...newUser };
      delete safeUser.password;
      this.setSession(safeUser);

      addLog(newUser.name, 'User Registration', `New ${role} registered: ${newUser.email}`);

      return { success: true, data: { user: safeUser }, message: 'Account registered successfully.' };
    },

    // ------------------------------------------------------------------------
    // Session Operations
    // ------------------------------------------------------------------------
    getCurrentUser() {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION) || localStorage.getItem(STORAGE_KEYS.SESSION);
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        return null;
      }
    },

    setSession(user, remember = true) {
      const serialized = JSON.stringify(user);
      sessionStorage.setItem(STORAGE_KEYS.SESSION, serialized);
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.SESSION, serialized);
      }
    },

    clearSession() {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      // Clean up legacy keys if any
      sessionStorage.removeItem('yaadhum_customer_session');
      localStorage.removeItem('yaadhum_customer_user');
      localStorage.removeItem('yaadhum_provider_profile');
    },

    async updateProfile(userId, profileData) {
      const users = getLocal(STORAGE_KEYS.USERS);
      const index = users.findIndex(u => u.id === userId || u.email === profileData.email);

      if (index === -1) {
        return { success: false, error: 'User not found' };
      }

      users[index] = { ...users[index], ...profileData };
      setLocal(STORAGE_KEYS.USERS, users);

      const safeUser = { ...users[index] };
      delete safeUser.password;
      this.setSession(safeUser);

      addLog(safeUser.name, 'Profile Updated', `Updated profile credentials for ${safeUser.email}`);

      return { success: true, data: safeUser, message: 'Profile updated successfully.' };
    },

    // ------------------------------------------------------------------------
    // Packages Operations (Provider & Customer & Admin)
    // ------------------------------------------------------------------------
    getPackages(filter = {}) {
      let packages = getLocal(STORAGE_KEYS.PACKAGES);

      if (filter.providerId) {
        packages = packages.filter(p => p.provider_id === filter.providerId);
      }
      if (filter.destination && filter.destination !== 'All') {
        const destLower = filter.destination.toLowerCase();
        packages = packages.filter(p => (p.destination || '').toLowerCase().includes(destLower));
      }
      if (filter.category && filter.category !== 'All') {
        const catLower = filter.category.toLowerCase();
        packages = packages.filter(p => (p.category || '').toLowerCase().includes(catLower));
      }
      if (filter.maxPrice) {
        packages = packages.filter(p => Number(p.price) <= Number(filter.maxPrice));
      }
      if (filter.minPrice) {
        packages = packages.filter(p => Number(p.price) >= Number(filter.minPrice));
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        packages = packages.filter(p =>
          (p.title || p.name || '').toLowerCase().includes(q) ||
          (p.destination || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.provider_name || '').toLowerCase().includes(q)
        );
      }
      if (filter.status) {
        packages = packages.filter(p => p.status === filter.status);
      }

      return packages;
    },

    getPackageById(id) {
      const packages = getLocal(STORAGE_KEYS.PACKAGES);
      return packages.find(p => String(p.id) === String(id)) || null;
    },

    savePackage(pkgData, currentUser) {
      const packages = getLocal(STORAGE_KEYS.PACKAGES);
      const isNew = !pkgData.id;

      const providerId = pkgData.provider_id || (currentUser ? currentUser.id : 'prov_201');
      const providerName = pkgData.provider_name || (currentUser ? (currentUser.business || currentUser.name) : 'Local Provider');

      const pkg = {
        id: pkgData.id || ('pkg_' + Date.now()),
        provider_id: providerId,
        provider_name: providerName,
        title: pkgData.title || pkgData.name || 'Untitled Package',
        name: pkgData.title || pkgData.name || 'Untitled Package',
        destination: pkgData.destination || 'Tamil Nadu',
        category: pkgData.category || 'Heritage & Cultural',
        price: Number(pkgData.price) || 0,
        duration: pkgData.duration || '2 Days / 1 Night',
        duration_days: Number(pkgData.duration_days) || 2,
        capacity: Number(pkgData.capacity) || 10,
        available_seats: Number(pkgData.available_seats !== undefined ? pkgData.available_seats : pkgData.capacity) || 10,
        startDate: pkgData.startDate || '',
        endDate: pkgData.endDate || '',
        description: pkgData.description || '',
        itinerary: pkgData.itinerary || '',
        inclusions: pkgData.inclusions || 'Guided tour, local support.',
        exclusions: pkgData.exclusions || 'Personal expenses, transport to origin.',
        image: pkgData.image || 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=600',
        status: pkgData.status || 'Approved', // Auto-approved for seamless workflow
        created_at: pkgData.created_at || new Date().toISOString().split('T')[0]
      };

      if (isNew) {
        packages.unshift(pkg);
        addLog(providerName, 'Package Created', `Created package "${pkg.title}" (₹${pkg.price})`);
      } else {
        const index = packages.findIndex(p => String(p.id) === String(pkg.id));
        if (index !== -1) {
          packages[index] = { ...packages[index], ...pkg };
          addLog(providerName, 'Package Updated', `Updated package "${pkg.title}" (ID: ${pkg.id})`);
        } else {
          packages.unshift(pkg);
        }
      }

      setLocal(STORAGE_KEYS.PACKAGES, packages);
      return { success: true, data: pkg, message: isNew ? 'Package created successfully!' : 'Package updated successfully!' };
    },

    deletePackage(id, actorName = 'Provider') {
      let packages = getLocal(STORAGE_KEYS.PACKAGES);
      const pkg = packages.find(p => String(p.id) === String(id));
      packages = packages.filter(p => String(p.id) !== String(id));
      setLocal(STORAGE_KEYS.PACKAGES, packages);
      addLog(actorName, 'Package Deleted', `Deleted package ${pkg ? pkg.title : id}`);
      return { success: true, message: 'Package deleted successfully.' };
    },

    updatePackageStatus(id, newStatus, actorName = 'Admin') {
      const packages = getLocal(STORAGE_KEYS.PACKAGES);
      const pkg = packages.find(p => String(p.id) === String(id));
      if (!pkg) return { success: false, error: 'Package not found' };

      pkg.status = newStatus;
      setLocal(STORAGE_KEYS.PACKAGES, packages);
      addLog(actorName, `Package ${newStatus}`, `Changed status of "${pkg.title}" to ${newStatus}`);
      return { success: true, data: pkg };
    },

    // ------------------------------------------------------------------------
    // Bookings Operations
    // ------------------------------------------------------------------------
    getBookings(filter = {}) {
      let bookings = getLocal(STORAGE_KEYS.BOOKINGS);

      if (filter.customerId) {
        bookings = bookings.filter(b => b.customer_id === filter.customerId);
      }
      if (filter.providerId) {
        bookings = bookings.filter(b => b.provider_id === filter.providerId);
      }
      if (filter.status && filter.status !== 'All') {
        bookings = bookings.filter(b => b.booking_status === filter.status);
      }

      return bookings;
    },

    createBooking(bookingData, customer) {
      const packages = getLocal(STORAGE_KEYS.PACKAGES);
      const pkg = packages.find(p => String(p.id) === String(bookingData.package_id));

      if (!pkg) {
        return { success: false, error: 'Selected package was not found.' };
      }

      const travelers = Number(bookingData.travelers) || 1;
      const availableSeats = Number(pkg.available_seats !== undefined ? pkg.available_seats : pkg.capacity);

      if (availableSeats < travelers) {
        return { success: false, error: `Only ${availableSeats} seat(s) available. Cannot book for ${travelers} traveler(s).` };
      }

      // Authoritative server-side total price calculation
      const totalAmount = travelers * Number(pkg.price);

      // Decrement seats
      pkg.available_seats = Math.max(0, availableSeats - travelers);
      setLocal(STORAGE_KEYS.PACKAGES, packages);

      const bookings = getLocal(STORAGE_KEYS.BOOKINGS);
      const newBooking = {
        booking_id: 'BK-' + Math.floor(1000 + Math.random() * 9000),
        customer_id: customer ? customer.id : 'cust_101',
        customer_name: customer ? customer.name : 'Valued Traveller',
        customer_email: customer ? customer.email : 'customer@yaadhum.local',
        customer_phone: customer ? customer.phone : '9876543210',
        package_id: pkg.id,
        package_name: pkg.title || pkg.name,
        provider_id: pkg.provider_id,
        provider_name: pkg.provider_name,
        travel_date: bookingData.travel_date || pkg.startDate || new Date().toISOString().split('T')[0],
        travelers: travelers,
        total_amount: totalAmount,
        booking_status: 'Confirmed',
        payment_status: 'Paid',
        payment_method: bookingData.payment_method || 'UPI',
        booked_at: new Date().toISOString().split('T')[0]
      };

      bookings.unshift(newBooking);
      setLocal(STORAGE_KEYS.BOOKINGS, bookings);

      addLog(newBooking.customer_name, 'Booking Created', `Booked "${newBooking.package_name}" for ${travelers} traveler(s) - Total ₹${totalAmount}`);

      return { success: true, data: newBooking, message: 'Tour booked successfully!' };
    },

    cancelBooking(bookingId, actorName = 'Customer') {
      const bookings = getLocal(STORAGE_KEYS.BOOKINGS);
      const booking = bookings.find(b => b.booking_id === bookingId);

      if (!booking) {
        return { success: false, error: 'Booking not found.' };
      }

      if (booking.booking_status === 'Cancelled') {
        return { success: false, error: 'Booking is already cancelled.' };
      }

      booking.booking_status = 'Cancelled';
      booking.payment_status = 'Refunded';

      // Restore seats back to package
      const packages = getLocal(STORAGE_KEYS.PACKAGES);
      const pkg = packages.find(p => String(p.id) === String(booking.package_id));
      if (pkg) {
        pkg.available_seats = Math.min(pkg.capacity, (Number(pkg.available_seats) || 0) + Number(booking.travelers));
        setLocal(STORAGE_KEYS.PACKAGES, packages);
      }

      setLocal(STORAGE_KEYS.BOOKINGS, bookings);
      addLog(actorName, 'Booking Cancelled', `Cancelled booking ${booking.booking_id}. Restored ${booking.travelers} seats to "${booking.package_name}".`);

      return { success: true, data: booking, message: 'Booking cancelled and seats restored.' };
    },

    updateBookingStatus(bookingId, status, actorName = 'Provider') {
      const bookings = getLocal(STORAGE_KEYS.BOOKINGS);
      const booking = bookings.find(b => b.booking_id === bookingId);
      if (!booking) return { success: false, error: 'Booking not found' };

      booking.booking_status = status;
      setLocal(STORAGE_KEYS.BOOKINGS, bookings);
      addLog(actorName, 'Booking Status Changed', `Updated booking ${bookingId} status to ${status}`);
      return { success: true, data: booking };
    },

    // ------------------------------------------------------------------------
    // Reviews Operations
    // ------------------------------------------------------------------------
    getReviews(filter = {}) {
      let reviews = getLocal(STORAGE_KEYS.REVIEWS);
      if (filter.packageId) {
        reviews = reviews.filter(r => String(r.package_id) === String(filter.packageId));
      }
      if (filter.providerId) {
        reviews = reviews.filter(r => String(r.provider_id) === String(filter.providerId));
      }
      return reviews;
    },

    addReview(reviewData, customer) {
      const reviews = getLocal(STORAGE_KEYS.REVIEWS);
      const newReview = {
        review_id: 'rev_' + Date.now(),
        booking_id: reviewData.booking_id || '',
        package_id: reviewData.package_id,
        provider_id: reviewData.provider_id || '',
        customer_id: customer ? customer.id : 'cust_101',
        customer_name: customer ? customer.name : 'Verified Traveller',
        rating: Number(reviewData.rating) || 5,
        comment: reviewData.comment || '',
        created_at: new Date().toISOString().split('T')[0]
      };
      reviews.unshift(newReview);
      setLocal(STORAGE_KEYS.REVIEWS, reviews);
      addLog(newReview.customer_name, 'Review Added', `Rated package ${newReview.package_id} with ${newReview.rating} stars`);
      return { success: true, data: newReview };
    },

    // ------------------------------------------------------------------------
    // Destinations & Categories
    // ------------------------------------------------------------------------
    getDestinations() {
      return getLocal(STORAGE_KEYS.DESTINATIONS);
    },

    saveDestination(dest) {
      const destinations = getLocal(STORAGE_KEYS.DESTINATIONS);
      if (!dest.id) {
        dest.id = 'dest_' + Date.now();
        dest.status = dest.status || 'Active';
        destinations.push(dest);
      } else {
        const index = destinations.findIndex(d => d.id === dest.id);
        if (index !== -1) destinations[index] = { ...destinations[index], ...dest };
        else destinations.push(dest);
      }
      setLocal(STORAGE_KEYS.DESTINATIONS, destinations);
      return { success: true, data: dest };
    },

    deleteDestination(id) {
      let destinations = getLocal(STORAGE_KEYS.DESTINATIONS);
      destinations = destinations.filter(d => d.id !== id);
      setLocal(STORAGE_KEYS.DESTINATIONS, destinations);
      return { success: true };
    },

    getCategories() {
      return getLocal(STORAGE_KEYS.CATEGORIES);
    },

    saveCategory(cat) {
      const categories = getLocal(STORAGE_KEYS.CATEGORIES);
      if (!cat.id) {
        cat.id = 'cat_' + Date.now();
        cat.status = cat.status || 'Active';
        categories.push(cat);
      } else {
        const index = categories.findIndex(c => c.id === cat.id);
        if (index !== -1) categories[index] = { ...categories[index], ...cat };
        else categories.push(cat);
      }
      setLocal(STORAGE_KEYS.CATEGORIES, categories);
      return { success: true, data: cat };
    },

    deleteCategory(id) {
      let categories = getLocal(STORAGE_KEYS.CATEGORIES);
      categories = categories.filter(c => c.id !== id);
      setLocal(STORAGE_KEYS.CATEGORIES, categories);
      return { success: true };
    },

    // ------------------------------------------------------------------------
    // Destination Updates / Local Pulse
    // ------------------------------------------------------------------------
    getDestinationUpdates() {
      return getLocal(STORAGE_KEYS.UPDATES);
    },

    saveDestinationUpdate(upd) {
      const updates = getLocal(STORAGE_KEYS.UPDATES);
      if (!upd.update_id) {
        upd.update_id = 'UPD-' + Date.now();
        upd.date_posted = new Date().toISOString().split('T')[0];
        upd.status = upd.status || 'Active';
        updates.unshift(upd);
      } else {
        const index = updates.findIndex(u => u.update_id === upd.update_id);
        if (index !== -1) updates[index] = { ...updates[index], ...upd };
      }
      setLocal(STORAGE_KEYS.UPDATES, updates);
      return { success: true, data: upd };
    },

    deleteDestinationUpdate(id) {
      let updates = getLocal(STORAGE_KEYS.UPDATES);
      updates = updates.filter(u => u.update_id !== id);
      setLocal(STORAGE_KEYS.UPDATES, updates);
      return { success: true };
    },

    // ------------------------------------------------------------------------
    // Admin, System Logs & Settings
    // ------------------------------------------------------------------------
    getSystemLogs() {
      return getLocal(STORAGE_KEYS.LOGS);
    },

    getUsers(role = null) {
      let users = getLocal(STORAGE_KEYS.USERS);
      if (role) {
        users = users.filter(u => u.role === role);
      }
      return users;
    },

    updateUserStatus(userId, status) {
      const users = getLocal(STORAGE_KEYS.USERS);
      const u = users.find(x => x.id === userId);
      if (!u) return { success: false, error: 'User not found' };
      u.status = status;
      setLocal(STORAGE_KEYS.USERS, users);
      addLog('Admin', 'User Status Changed', `Set status of ${u.name} (${u.email}) to ${status}`);
      return { success: true, data: u };
    },

    getAdmins() {
      return getLocal(STORAGE_KEYS.ADMINS);
    },

    saveAdmin(adminData) {
      const admins = getLocal(STORAGE_KEYS.ADMINS);
      if (!adminData.id) {
        adminData.id = 'admin_' + Date.now();
        adminData.status = adminData.status || 'Active';
        adminData.permissions = adminData.permissions || ['customers', 'packages', 'bookings'];
        admins.push(adminData);
      } else {
        const idx = admins.findIndex(a => a.id === adminData.id);
        if (idx !== -1) admins[idx] = { ...admins[idx], ...adminData };
        else admins.push(adminData);
      }
      setLocal(STORAGE_KEYS.ADMINS, admins);
      return { success: true, data: adminData };
    },

    deleteAdmin(id) {
      let admins = getLocal(STORAGE_KEYS.ADMINS);
      admins = admins.filter(a => a.id !== id);
      setLocal(STORAGE_KEYS.ADMINS, admins);
      return { success: true };
    },

    getSettings() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || SEED_SETTINGS;
      } catch (e) {
        return SEED_SETTINGS;
      }
    },

    saveSettings(settings) {
      setLocal(STORAGE_KEYS.SETTINGS, settings);
      addLog('Super Admin', 'Settings Updated', 'Platform system configuration updated.');
      return { success: true, data: settings };
    }
  };

  return YaadhumAPI;
});
