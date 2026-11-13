-- =============================================================================
-- YAADHUM OOORE - Local Tourism Package Booking System
-- Comprehensive MySQL Relational Database Schema & Initial Seed Data
-- =============================================================================

CREATE DATABASE IF NOT EXISTS yaadhum_oore_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE yaadhum_oore_db;

-- Disable foreign key checks during schema re-creation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS system_logs;
DROP TABLE IF EXISTS admin_permissions;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS package_availability;
DROP TABLE IF EXISTS package_itinerary;
DROP TABLE IF EXISTS tour_packages;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS destinations;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE (All 4 Roles: Customer, Provider, Admin, Super Admin)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'provider', 'admin', 'superadmin') NOT NULL DEFAULT 'customer',
    status ENUM('active', 'pending', 'suspended') NOT NULL DEFAULT 'active',
    avatar_url VARCHAR(255) DEFAULT NULL,
    business_name VARCHAR(150) DEFAULT NULL, -- For providers
    bio TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_status (status),
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. ADDRESSES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) DEFAULT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Tamil Nadu',
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_address_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. DESTINATIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE destinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    tamil_name VARCHAR(150) DEFAULT NULL,
    region VARCHAR(100) NOT NULL, -- e.g. Kongu Nadu, Chola Nadu, Pandiya Nadu, Thondai Nadu
    category VARCHAR(80) NOT NULL, -- Heritage & Temple, Hill Station, Coastal & Beach, Wildlife
    description TEXT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    best_time_to_visit VARCHAR(100) DEFAULT 'October to March',
    popular_attractions TEXT DEFAULT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    package_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_destination_region (region),
    INDEX idx_destination_category (category),
    INDEX idx_destination_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. CATEGORIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    icon VARCHAR(60) DEFAULT 'fas fa-map-marked-alt',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_slug (slug),
    INDEX idx_category_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TOUR_PACKAGES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE tour_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    destination_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    duration VARCHAR(60) NOT NULL, -- e.g. '3 Days / 2 Nights'
    price_per_person DECIMAL(10, 2) NOT NULL,
    capacity INT NOT NULL DEFAULT 20,
    available_seats INT NOT NULL DEFAULT 20,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT NOT NULL,
    inclusions TEXT DEFAULT NULL,
    exclusions TEXT DEFAULT NULL,
    featured_image VARCHAR(255) DEFAULT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    rejection_reason TEXT DEFAULT NULL,
    rating_avg DECIMAL(3, 2) DEFAULT 4.80,
    review_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_packages_provider FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_packages_destination FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_packages_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_package_status (status),
    INDEX idx_package_price (price_per_person),
    INDEX idx_package_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. PACKAGE_ITINERARY TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE package_itinerary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    day_number INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    activities TEXT NOT NULL,
    meals_included VARCHAR(120) DEFAULT 'Breakfast, Lunch, Dinner',
    accommodation VARCHAR(150) DEFAULT 'Heritage Resort / 3-Star Hotel',
    CONSTRAINT fk_itinerary_package FOREIGN KEY (package_id) REFERENCES tour_packages(id) ON DELETE CASCADE,
    INDEX idx_itinerary_day (package_id, day_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. PACKAGE_AVAILABILITY TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE package_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_seats INT NOT NULL DEFAULT 20,
    booked_seats INT NOT NULL DEFAULT 0,
    price_override DECIMAL(10, 2) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_availability_package FOREIGN KEY (package_id) REFERENCES tour_packages(id) ON DELETE CASCADE,
    INDEX idx_avail_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. BOOKINGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(30) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    package_id INT NOT NULL,
    travel_date DATE NOT NULL,
    travellers_count INT NOT NULL DEFAULT 1,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(191) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    special_requests TEXT DEFAULT NULL,
    booking_status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'confirmed',
    payment_status ENUM('pending', 'completed', 'refunded', 'failed') NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_package FOREIGN KEY (package_id) REFERENCES tour_packages(id) ON DELETE RESTRICT,
    INDEX idx_booking_ref (booking_reference),
    INDEX idx_booking_status (booking_status),
    INDEX idx_booking_travel_date (travel_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. PAYMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    payment_reference VARCHAR(50) NOT NULL UNIQUE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI / Net Banking',
    amount DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('completed', 'pending', 'failed', 'refunded') NOT NULL DEFAULT 'completed',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. REVIEWS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT DEFAULT NULL,
    user_id INT NOT NULL,
    package_id INT NOT NULL,
    rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    status ENUM('approved', 'pending', 'hidden') NOT NULL DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reviews_package FOREIGN KEY (package_id) REFERENCES tour_packages(id) ON DELETE CASCADE,
    INDEX idx_review_package (package_id),
    INDEX idx_review_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. ADMIN_PERMISSIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE admin_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    module_name VARCHAR(80) NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT TRUE,
    can_create BOOLEAN NOT NULL DEFAULT FALSE,
    can_edit BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN NOT NULL DEFAULT FALSE,
    granted_by INT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_perm_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_perm_granter FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uq_admin_module (admin_id, module_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. SYSTEM_LOGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(80) NOT NULL,
    details TEXT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_logs_action (action),
    INDEX idx_logs_module (module),
    INDEX idx_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- INITIAL SEED DATA
-- =============================================================================

-- 1. USERS (Password for all demonstration accounts: 'Password@123' or simulated hash)
INSERT INTO users (id, full_name, email, phone, password_hash, role, status, business_name, bio) VALUES
(1, 'Senthil Kumar', 'customer@yaadhum.in', '9876543210', 'hashed_pass_customer', 'customer', 'active', NULL, 'Heritage enthusiast and solo traveler across Tamil Nadu.'),
(2, 'Ananya Raman', 'ananya@gmail.com', '9840112233', 'hashed_pass_customer', 'customer', 'active', NULL, 'Cultural photography traveler.'),
(3, 'Chola Heritage Tours', 'provider@yaadhum.in', '9443322110', 'hashed_pass_provider', 'provider', 'active', 'Chola Heritage Tours & Travels', 'Approved local tour operator specializing in Thanjavur and Kumbakonam heritage circuits.'),
(4, 'Nilgiri Eco Escapes', 'nilgiri@travels.com', '9442211009', 'hashed_pass_provider', 'provider', 'active', 'Nilgiri Eco Escapes', 'Licensed tea plantation trails, hill walks, and nature retreats in Ooty and Nilgiris.'),
(5, 'Madurai Temple Trails', 'madurai@tours.com', '9789012345', 'hashed_pass_provider', 'provider', 'active', 'Madurai Temple Trails', 'Pilgrimage and culinary expeditions across South Tamil Nadu.'),
(6, 'Admin Officer', 'admin@yaadhum.in', '9884012345', 'hashed_pass_admin', 'admin', 'active', NULL, 'Content moderator and package verification administrator.'),
(7, 'Super Administrator', 'superadmin@yaadhum.in', '9884099999', 'hashed_pass_superadmin', 'superadmin', 'active', NULL, 'Full system supervisor and policy administrator.');

-- 2. ADDRESSES
INSERT INTO addresses (user_id, address_line1, address_line2, city, state, postal_code, is_primary) VALUES
(1, '12, Anna Salai', 'T. Nagar', 'Chennai', 'Tamil Nadu', '600017', 1),
(2, '45, West Masi Street', 'Near Meenakshi Temple', 'Madurai', 'Tamil Nadu', '625001', 1),
(3, '88, South Rampart', 'Old Town', 'Thanjavur', 'Tamil Nadu', '613001', 1),
(4, '15, Commercial Road', 'Near Botanical Garden', 'Ooty', 'Tamil Nadu', '643001', 1),
(5, '22, North Veli Street', 'Simmakkal', 'Madurai', 'Tamil Nadu', '625001', 1),
(6, 'Secretariat Complex', 'Fort St. George', 'Chennai', 'Tamil Nadu', '600009', 1),
(7, 'HQ IT Park', 'OMR Road', 'Chennai', 'Tamil Nadu', '600096', 1);

-- 3. DESTINATIONS
INSERT INTO destinations (id, name, tamil_name, region, category, description, image_url, best_time_to_visit, popular_attractions, is_featured, package_count) VALUES
(1, 'Thanjavur', 'தஞ்சாவூர்', 'Chola Nadu', 'Heritage & Temple', 'The cultural capital of the Cholas, home to the UNESCO World Heritage Brihadeeswara Temple, Saraswathi Mahal Library, and vibrant Thanjavur art traditions.', 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80', 'October to March', 'Brihadeeswara Temple, Maratha Palace, Saraswathi Mahal Library, Royal Palace Art Gallery', 1, 4),
(2, 'Madurai', 'மதுரை', 'Pandiya Nadu', 'Heritage & Temple', 'The celebrated Temple City of South India, famous for the magnificent Meenakshi Amman Temple, Thirumalai Nayakkar Mahal, vibrant night markets, and authentic culinary heritage.', 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80', 'October to March', 'Meenakshi Amman Temple, Thirumalai Nayakkar Palace, Gandhi Memorial Museum, Alagar Koyil', 1, 5),
(3, 'Ooty (Udhagamandalam)', 'ஊட்டி', 'Kongu Nadu', 'Hill Station', 'Queen of Hill Stations nestled in the Western Ghats, renowned for scenic tea plantations, the UNESCO Nilgiri Mountain Railway, and crisp cool climate.', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80', 'Year-round (Best: March to June & Sept to Nov)', 'Botanical Garden, Doddabetta Peak, Nilgiri Mountain Railway, Ooty Lake, Rose Garden', 1, 4),
(4, 'Rameswaram', 'ராமேஸ்வரம்', 'Pandiya Nadu', 'Coastal & Pilgrimage', 'Sacred island town connected by the iconic Pamban Bridge, featuring the grand Ramanathaswamy Temple with the longest corridor in India and serene coastal vistas.', 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80', 'October to April', 'Ramanathaswamy Temple, Pamban Bridge, Dhanushkodi Ghost Town, Agni Theertham, APJ Abdul Kalam Memorial', 1, 3),
(5, 'Kanyakumari', 'கன்னியாகுமரி', 'Venad / South', 'Coastal & Heritage', 'The southernmost tip of peninsular India where the Arabian Sea, Indian Ocean, and Bay of Bengal converge, famed for breathtaking sunrises, sunsets, and the Thiruvalluvar Statue.', 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80', 'October to March', 'Vivekananda Rock Memorial, 133-ft Thiruvalluvar Statue, Triveni Sangam, Sunset Point, Padmanabhapuram Palace', 1, 3),
(6, 'Chettinad (Karaikudi)', 'செட்டிநாடு', 'Pandiya Nadu', 'Heritage & Culinary', 'A rich heritage enclave famed for grand 19th-century Athangudi-tiled palatial mansions, handloom cotton weaving, antique markets, and world-renowned spicy Chettinad cuisine.', 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80', 'October to March', 'Chettinad Mansions, Athangudi Tile Factories, Kanadukathan Palace, Pillayarpatti Temple, Antique Markets', 1, 2),
(7, 'Kodaikanal', 'கொடைக்கானல்', 'Kongu Nadu', 'Hill Station', 'The Princess of Hill Stations set upon the Palani Hills, blessed with mist-covered forested valleys, star-shaped lakes, rolling meadows, and tranquil waterfalls.', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', 'September to May', 'Kodai Lake, Coaker\'s Walk, Pillar Rocks, Bryant Park, Silver Cascade Falls', 1, 3),
(8, 'Mahabalipuram', 'மகாபலிபுரம்', 'Thondai Nadu', 'Coastal & Archaeological', 'UNESCO World Heritage coastal haven famous for 7th-century Pallava rock-cut cave sanctuaries, monolithic rathas, Shore Temple, and master stone-carving traditions.', 'https://images.unsplash.com/photo-1629853406202-b27b1029c73b?auto=format&fit=crop&w=800&q=80', 'November to February', 'Shore Temple, Pancha Rathas, Arjuna\'s Penance, Krishna\'s Butter Ball, Mahabalipuram Beach', 1, 3);

-- 4. CATEGORIES
INSERT INTO categories (id, name, slug, description, icon, is_active) VALUES
(1, 'Heritage & Temple Trails', 'heritage-temple', 'Historical pilgrimage circuits, Chola & Pandya architecture, and ancient stone sculptures.', 'fas fa-gopuram', 1),
(2, 'Hill Station & Nature', 'hill-station-nature', 'Cool mountain retreats, mist-clad valleys, waterfalls, and tea estate walks.', 'fas fa-mountain', 1),
(3, 'Coastal & Pilgrimage', 'coastal-pilgrimage', 'Sacred coastal crossings, maritime monuments, sandy beaches, and sea horizons.', 'fas fa-umbrella-beach', 1),
(4, 'Culinary & Village Culture', 'culinary-culture', 'Authentic regional cuisines, traditional pottery, handloom weaving, and heritage homestays.', 'fas fa-utensils', 1),
(5, 'Eco & Wildlife Trails', 'eco-wildlife', 'National park safaris, bird sanctuaries, bio-reserves, and pristine jungle treks.', 'fas fa-leaf', 1);

-- 5. TOUR_PACKAGES
INSERT INTO tour_packages (id, provider_id, destination_id, category_id, title, duration, price_per_person, capacity, available_seats, start_date, end_date, description, inclusions, exclusions, featured_image, status, rating_avg, review_count) VALUES
(1, 3, 1, 1, 'Great Living Chola Temples Trail', '3 Days / 2 Nights', 7499.00, 20, 16, '2026-12-01', '2026-12-03', 'Explore the UNESCO World Heritage monuments of Thanjavur Brihadeeswara Temple, Gangaikonda Cholapuram, and Darasuram Airavatesvara Temple with expert historians and temple architects.', 'Accommodation in 3-star heritage hotel, AC transportation, expert certified historian guide, entry tickets to all monuments, traditional vegetarian meals.', 'Personal expenses, camera fees, travel insurance.', 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80', 'approved', 4.90, 18),
(2, 5, 2, 1, 'Madurai Midnight Heritage & Food Expedition', '2 Days / 1 Night', 4999.00, 15, 12, '2026-12-05', '2026-12-06', 'Immerse yourself in the spirituality of Meenakshi Sundareswarar Temple, witness the grand night procession, and savor legendary Madurai street food including Kari Dosa, Bun Parotta, and famous Jigarthanda.', 'Heritage city stay, guided culinary tour with 6 food tastings, VIP temple darshan pass, private AC minivan.', 'Alcoholic beverages, tips, personal purchases.', 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80', 'approved', 4.85, 24),
(3, 4, 3, 2, 'Nilgiri Misty Valley & Heritage Toy Train Tour', '4 Days / 3 Nights', 10999.00, 18, 14, '2026-12-10', '2026-12-13', 'Ride the historic UNESCO Nilgiri Mountain Railway, wander through lush emerald tea estates in Coonoor, visit Doddabetta Peak, and relax by pykara lake waterfalls.', 'First-class Toy Train tickets, resort cottage accommodation, daily breakfast & plantation dinners, guided tea factory tasting.', 'Toy Train cancellation due to weather, personal shopping.', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80', 'approved', 4.92, 31),
(4, 5, 4, 3, 'Rameswaram & Dhanushkodi Ocean Crossing', '2 Days / 1 Night', 5499.00, 22, 19, '2026-12-15', '2026-12-16', 'Cross the scenic Pamban Bridge, bathe in sacred 22 theerthams at Ramanathaswamy Temple, and take a 4x4 off-road drive to the mysterious ghost town of Dhanushkodi where the oceans meet.', 'Hotel accommodation near temple, AC tempo traveler, 4x4 Dhanushkodi safari pass, temple priest coordination.', 'Pooja personal expenses, additional temple sevas.', 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80', 'approved', 4.78, 15),
(5, 5, 5, 3, 'Kanyakumari Lands End Sunrise & Heritage Odyssey', '3 Days / 2 Nights', 6999.00, 20, 17, '2026-12-20', '2026-12-22', 'Witness sunrise and sunset over three oceans, ferry to Vivekananda Rock and the towering Thiruvalluvar Statue, and explore the ancient wooden architecture of Padmanabhapuram Palace.', 'Sea-facing hotel rooms, ferry boat tickets, private sightseeing car, all buffet breakfasts.', 'Water sports, personal guide gratuity.', 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80', 'approved', 4.80, 12),
(6, 3, 6, 4, 'Chettinad Royal Mansions & Artisans Trail', '3 Days / 2 Nights', 8999.00, 16, 12, '2026-12-24', '2026-12-26', 'Step back into the golden era of merchant bankers in Karaikudi. Tour authentic Athangudi handmade tile workshops, visit antique streets, and feast on traditional plantain leaf multi-course Chettinad banquets.', 'Stay in restored heritage mansion, all traditional meals, hands-on tile making workshop, local storyteller guide.', 'Purchase of antiques or handloom sarees.', 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80', 'approved', 4.95, 29),
(7, 4, 7, 2, 'Kodaikanal Pine Forests & Valley Retreat', '3 Days / 2 Nights', 8499.00, 25, 21, '2026-12-28', '2026-12-30', 'A rejuvenating hill escape featuring cycling around Kodai Lake, walking through the tranquil Pine Forest, exploring Pillar Rocks, and campfire evening with acoustic music.', 'Valley-view resort stay, lake boating vouchers, bonfire evening, daily meals, local transport.', 'Personal boating duration upgrades, winter jackets.', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', 'approved', 4.75, 19),
(8, 3, 8, 1, 'Mahabalipuram Pallava Rock Architecture & Coastline', '2 Days / 1 Night', 4299.00, 20, 15, '2027-01-05', '2027-01-06', 'Discover ancient oceanfront stone artistry at the Shore Temple, the monumental bas-relief of Arjuna\'s Penance, and Five Rathas along the Coromandel coast.', 'Beachfront resort stay, certified archaeological guide, AC coach transfers from Chennai, lunch & dinner.', 'Water scooter rides, stone carvings souvenir shopping.', 'https://images.unsplash.com/photo-1629853406202-b27b1029c73b?auto=format&fit=crop&w=800&q=80', 'approved', 4.88, 22),
(9, 4, 3, 5, 'Mudumalai Tiger Reserve & Nilgiri Wild Safari', '3 Days / 2 Nights', 9499.00, 12, 10, '2027-01-12', '2027-01-14', 'Stay on the edge of the wilderness, enjoy 2 jeep safaris inside Mudumalai Tiger Reserve, and observe wild elephants, gaurs, and spotted deer in their natural sanctuary.', 'Eco-lodge jungle stay, forest department safari permits, all forest guide fees, buffet meals.', 'Camera lenses above 200mm fee, night safari add-ons.', 'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?auto=format&fit=crop&w=800&q=80', 'pending', 4.80, 5),
(10, 5, 2, 4, 'Pandiya Nadu Village Heritage & Pottery Trail', '2 Days / 1 Night', 3899.00, 18, 16, '2027-01-18', '2027-01-19', 'Experience traditional rural Tamil Nadu: bullock cart rides, clay terracotta pottery workshops with village artisans, and organic millet farm lunch.', 'Village homestay, pottery workshop materials, all meals, folk dance performance evening.', 'Transportation to village meeting point.', 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80', 'pending', 4.70, 3);

-- 6. PACKAGE_ITINERARY
INSERT INTO package_itinerary (package_id, day_number, title, activities, meals_included, accommodation) VALUES
(1, 1, 'Arrival & The Big Temple Masterpiece', 'Meet at Thanjavur Junction. Check into heritage hotel. Guided afternoon study of Brihadeeswara Temple, Vimana, and stone inscriptions.', 'Dinner', 'Svatma Heritage Boutique Hotel'),
(1, 2, 'Royal Palace & Bronze Art Castings', 'Visit Saraswathi Mahal Library, Maratha Palace, and artisanal bronze lost-wax casting workshop in Swamimalai.', 'Breakfast, Lunch, Dinner', 'Svatma Heritage Boutique Hotel'),
(1, 3, 'Gangaikonda Cholapuram & Farewell', 'Excursion to Gangaikonda Cholapuram and Darasuram Airavatesvara Temple. Depart with Thanjavur souvenir plate.', 'Breakfast, Lunch', 'Checkout'),

(2, 1, 'Sacred Sanctum & Night Culinary Trail', 'Check-in by noon. Evening darshan at Meenakshi Amman Temple. Savor Bun Parotta, Kari Dosa and Jigarthanda on street walk.', 'Dinner', 'Heritage Madurai Hotel'),
(2, 2, 'Nayakar Palace & Traditional Weaving', 'Morning exploration of Thirumalai Nayakkar Palace. Visit Sungudi saree handloom weavers. Depart at 5 PM.', 'Breakfast, Lunch', 'Checkout'),

(3, 1, 'Mountain Rail Climb to the Nilgiris', 'Board the historic steam toy train at Mettupalayam. Arrive Ooty by late afternoon. Botanical Garden sunset walk.', 'Dinner', 'Savoy Nilgiri Resort'),
(3, 2, 'Tea Plantations & Coonoor Viewpoints', 'Visit high-altitude tea estate in Coonoor, tea tasting session, and view Lamb\'s Rock and Dolphin\'s Nose.', 'Breakfast, Lunch, Dinner', 'Savoy Nilgiri Resort'),
(3, 3, 'Doddabetta Peak & Pykara Waterfalls', 'Ascend Doddabetta peak, explore Pine Forest trails, and afternoon speedboat ride in Pykara Lake.', 'Breakfast, Lunch, Dinner', 'Savoy Nilgiri Resort'),
(3, 4, 'Rose Garden & Departure', 'Morning visit to Government Rose Garden. Souvenir shopping for homemade chocolates and eucalyptus oils.', 'Breakfast', 'Checkout');

-- 7. PACKAGE_AVAILABILITY
INSERT INTO package_availability (package_id, start_date, end_date, total_seats, booked_seats, price_override, is_active) VALUES
(1, '2026-12-01', '2026-12-03', 20, 4, 7499.00, 1),
(1, '2026-12-15', '2026-12-17', 20, 2, 7499.00, 1),
(2, '2026-12-05', '2026-12-06', 15, 3, 4999.00, 1),
(3, '2026-12-10', '2026-12-13', 18, 4, 10999.00, 1),
(4, '2026-12-15', '2026-12-16', 22, 3, 5499.00, 1),
(5, '2026-12-20', '2026-12-22', 20, 3, 6999.00, 1),
(6, '2026-12-24', '2026-12-26', 16, 4, 8999.00, 1);

-- 8. BOOKINGS
INSERT INTO bookings (id, booking_reference, user_id, package_id, travel_date, travellers_count, customer_name, customer_email, customer_phone, total_amount, special_requests, booking_status, payment_status, created_at) VALUES
(1, 'BK-YO-2026-101', 1, 1, '2026-12-01', 2, 'Senthil Kumar', 'customer@yaadhum.in', '9876543210', 14998.00, 'Vegetarian meals preferred.', 'confirmed', 'completed', '2026-11-05 10:30:00'),
(2, 'BK-YO-2026-102', 1, 3, '2026-12-10', 2, 'Senthil Kumar', 'customer@yaadhum.in', '9876543210', 21998.00, 'Window seats on toy train if possible.', 'confirmed', 'completed', '2026-11-08 14:15:00'),
(3, 'BK-YO-2026-103', 2, 2, '2026-12-05', 3, 'Ananya Raman', 'ananya@gmail.com', '9840112233', 14997.00, 'Temple architecture photography assistance.', 'confirmed', 'completed', '2026-11-10 16:45:00'),
(4, 'BK-YO-2026-104', 1, 6, '2026-12-24', 2, 'Senthil Kumar', 'customer@yaadhum.in', '9876543210', 17998.00, 'Heritage mansion room on first floor.', 'confirmed', 'completed', '2026-11-11 11:20:00');

-- 9. PAYMENTS
INSERT INTO payments (id, booking_id, user_id, payment_reference, payment_method, amount, payment_status, transaction_date) VALUES
(1, 1, 1, 'PAY-TXN-90281-UPI', 'UPI / Google Pay', 14998.00, 'completed', '2026-11-05 10:32:10'),
(2, 2, 1, 'PAY-TXN-90432-CARD', 'Credit / Debit Card', 21998.00, 'completed', '2026-11-08 14:16:40'),
(3, 3, 2, 'PAY-TXN-90511-NB', 'Net Banking (SBI)', 14997.00, 'completed', '2026-11-10 16:46:12'),
(4, 4, 1, 'PAY-TXN-90605-UPI', 'UPI / PhonePe', 17998.00, 'completed', '2026-11-11 11:21:55');

-- 10. REVIEWS
INSERT INTO reviews (id, booking_id, user_id, package_id, rating, comment, status, created_at) VALUES
(1, 1, 1, 1, 5, 'The Chola temples trail was an unforgettable spiritual and architectural experience! The historian guide explained the stone inscriptions in deep detail.', 'approved', '2026-11-06 09:00:00'),
(2, 3, 2, 2, 5, 'Madurai at night is simply magical. The Bun Parotta and Jigarthanda were divine, and the temple procession gave me goosebumps.', 'approved', '2026-11-11 18:20:00'),
(3, 2, 1, 3, 5, 'The toy train through the Nilgiri tunnels was breathtaking. Superb organization and great hospitality by the Nilgiri Eco team.', 'approved', '2026-11-12 10:15:00');

-- 11. ADMIN_PERMISSIONS
INSERT INTO admin_permissions (admin_id, module_name, can_view, can_create, can_edit, can_delete, granted_by) VALUES
(6, 'packages', 1, 0, 1, 0, 7),
(6, 'bookings', 1, 0, 1, 0, 7),
(6, 'customers', 1, 0, 1, 0, 7),
(6, 'providers', 1, 0, 1, 0, 7),
(6, 'destinations', 1, 1, 1, 0, 7),
(6, 'categories', 1, 1, 1, 0, 7),
(6, 'reports', 1, 0, 0, 0, 7),
(7, 'all_modules', 1, 1, 1, 1, 7),
(7, 'admin_management', 1, 1, 1, 1, 7),
(7, 'permissions', 1, 1, 1, 1, 7),
(7, 'system_logs', 1, 0, 0, 1, 7),
(7, 'system_settings', 1, 1, 1, 1, 7);

-- 12. SYSTEM_LOGS
INSERT INTO system_logs (user_id, action, module, details, ip_address, created_at) VALUES
(7, 'SYSTEM_INIT', 'core', 'Database initialized and seeded successfully for YAADHUM OOORE platform.', '127.0.0.1', '2026-11-01 08:00:00'),
(6, 'PACKAGE_APPROVED', 'packages', 'Package ID 1 (Great Living Chola Temples Trail) approved by Admin Officer.', '127.0.0.1', '2026-11-02 11:15:00'),
(6, 'PACKAGE_APPROVED', 'packages', 'Package ID 2 (Madurai Midnight Heritage) approved by Admin Officer.', '127.0.0.1', '2026-11-02 11:20:00'),
(1, 'BOOKING_CREATED', 'bookings', 'New booking created BK-YO-2026-101 for package ID 1.', '127.0.0.1', '2026-11-05 10:30:00'),
(1, 'PAYMENT_SUCCESS', 'payments', 'Payment reference PAY-TXN-90281-UPI processed successfully.', '127.0.0.1', '2026-11-05 10:32:10'),
(7, 'PERMISSION_ASSIGNED', 'permissions', 'Standard moderation permissions assigned to admin user ID 6.', '127.0.0.1', '2026-11-06 14:00:00');

