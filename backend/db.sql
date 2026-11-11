-- =============================================================================
-- YAADHUM OOORE - LOCAL TOURISM PACKAGE BOOKING SYSTEM
-- Relational Database Schema & Constraints (MySQL 8.0+)
-- "யாதும் ஊரே யாவரும் கேளிர்"
-- =============================================================================

CREATE DATABASE IF NOT EXISTS yaadhum_oore_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE yaadhum_oore_db;

-- Disable foreign key checks during drop & recreate
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS destination_updates;
DROP TABLE IF EXISTS wishlist;
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
-- 1. Table: users
-- Roles: 'customer', 'provider', 'admin', 'superadmin'
-- Status: 'Active', 'Inactive', 'Pending', 'Blocked'
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  role ENUM('customer', 'provider', 'admin', 'superadmin') NOT NULL DEFAULT 'customer',
  status ENUM('Active', 'Inactive', 'Pending', 'Blocked') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 2. Table: addresses
-- -----------------------------------------------------------------------------
CREATE TABLE addresses (
  address_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  address_line VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL DEFAULT 'Tamil Nadu',
  pincode VARCHAR(10) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_address_user (user_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. Table: destinations
-- -----------------------------------------------------------------------------
CREATE TABLE destinations (
  destination_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL DEFAULT 'Tamil Nadu',
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  description TEXT,
  image VARCHAR(255),
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  INDEX idx_destination_name (name)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 4. Table: categories
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  description TEXT,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  INDEX idx_category_name (category_name)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 5. Table: tour_packages
-- -----------------------------------------------------------------------------
CREATE TABLE tour_packages (
  package_id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id INT NOT NULL,
  destination_id INT NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  duration_days INT NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  capacity INT NOT NULL DEFAULT 10,
  available_seats INT NOT NULL DEFAULT 10,
  image VARCHAR(255),
  status ENUM('Approved', 'Pending', 'Rejected', 'Inactive') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_packages_provider (provider_id),
  INDEX idx_packages_dest (destination_id),
  INDEX idx_packages_cat (category_id),
  INDEX idx_packages_status (status)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 6. Table: package_itinerary
-- -----------------------------------------------------------------------------
CREATE TABLE package_itinerary (
  itinerary_id INT AUTO_INCREMENT PRIMARY KEY,
  package_id INT NOT NULL,
  day_no INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  FOREIGN KEY (package_id) REFERENCES tour_packages(package_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_itinerary_pkg (package_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 7. Table: package_availability
-- -----------------------------------------------------------------------------
CREATE TABLE package_availability (
  availability_id INT AUTO_INCREMENT PRIMARY KEY,
  package_id INT NOT NULL,
  available_date DATE NOT NULL,
  seats_available INT NOT NULL,
  status ENUM('Available', 'Sold Out', 'Closed') NOT NULL DEFAULT 'Available',
  FOREIGN KEY (package_id) REFERENCES tour_packages(package_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_avail_pkg (package_id),
  INDEX idx_avail_date (available_date)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 8. Table: bookings
-- -----------------------------------------------------------------------------
CREATE TABLE bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  package_id INT NOT NULL,
  availability_id INT NULL,
  travelers INT NOT NULL DEFAULT 1,
  total_amount DECIMAL(10, 2) NOT NULL,
  booking_status ENUM('Confirmed', 'Pending', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Confirmed',
  payment_status ENUM('Paid', 'Pending', 'Refunded') NOT NULL DEFAULT 'Paid',
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (package_id) REFERENCES tour_packages(package_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (availability_id) REFERENCES package_availability(availability_id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_bookings_cust (customer_id),
  INDEX idx_bookings_pkg (package_id),
  INDEX idx_bookings_status (booking_status)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 9. Table: payments
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  customer_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI',
  payment_status ENUM('Success', 'Pending', 'Refunded', 'Failed') NOT NULL DEFAULT 'Success',
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_payments_booking (booking_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 10. Table: reviews
-- One customer review per booking
-- -----------------------------------------------------------------------------
CREATE TABLE reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  package_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (package_id) REFERENCES tour_packages(package_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_reviews_pkg (package_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 11. Table: admin_permissions
-- -----------------------------------------------------------------------------
CREATE TABLE admin_permissions (
  permission_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  permission_name VARCHAR(80) NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_admin_perm (admin_id, permission_name)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 12. Table: system_logs
-- -----------------------------------------------------------------------------
CREATE TABLE system_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  ip_address VARCHAR(45) DEFAULT '127.0.0.1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_logs_created (created_at)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 13. Table: wishlist (additional)
-- -----------------------------------------------------------------------------
CREATE TABLE wishlist (
  wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  package_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (package_id) REFERENCES tour_packages(package_id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_wishlist_item (customer_id, package_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 14. Table: destination_updates (additional - Local Pulse)
-- -----------------------------------------------------------------------------
CREATE TABLE destination_updates (
  update_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  destination_id INT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'Advisory',
  description TEXT NOT NULL,
  date_posted DATE NOT NULL,
  status ENUM('Active', 'Archived') NOT NULL DEFAULT 'Active',
  FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Seed Users
INSERT INTO users (user_id, name, email, password, mobile, role, status) VALUES
(1, 'Kaniyan Pungundran', 'customer@yaadhum.local', 'password123', '9876543210', 'customer', 'Active'),
(2, 'Selvam Perumal', 'selvam@tamilnadutours.in', 'password123', '9840123456', 'provider', 'Approved'),
(3, 'Meenakshi Sundaram', 'meenakshi@heritagetours.in', 'password123', '9840234567', 'provider', 'Approved'),
(4, 'Priya Sundaram', 'admin@yaadhum.local', 'password123', '9876523456', 'admin', 'Active'),
(5, 'Super Administrator', 'superadmin@yaadhum.local', 'password123', '9876599999', 'superadmin', 'Active');

-- Seed Addresses
INSERT INTO addresses (user_id, address_line, city, state, pincode) VALUES
(1, '42, Heritage Street, Near Temple Gate', 'Madurai', 'Tamil Nadu', '625001'),
(2, '12, Club Road', 'Ooty', 'Tamil Nadu', '643001'),
(3, '5, West Tower Street', 'Madurai', 'Tamil Nadu', '625001');

-- Seed Destinations
INSERT INTO destinations (destination_id, name, city, state, country, description, status) VALUES
(1, 'Ooty', 'Nilgiris', 'Tamil Nadu', 'India', 'Queen of Hill Stations, famous for tea gardens, Nilgiri Mountain Railway, and botanical wonders.', 'Active'),
(2, 'Madurai', 'Madurai', 'Tamil Nadu', 'India', 'The Athens of the East, famed for the historic Meenakshi Amman Temple and vibrant night bazaars.', 'Active'),
(3, 'Kodaikanal', 'Dindigul', 'Tamil Nadu', 'India', 'The Princess of Hill Stations featuring pine forests, star-shaped lakes, and Pillar Rocks.', 'Active'),
(4, 'Thanjavur', 'Thanjavur', 'Tamil Nadu', 'India', 'The cultural capital and home of the Great Living Chola Temples and classical Carnatic music.', 'Active'),
(5, 'Rameswaram', 'Ramanathapuram', 'Tamil Nadu', 'India', 'Sacred island town connected by Pamban bridge, featuring the mystical ghost town of Dhanushkodi.', 'Active'),
(6, 'Mahabalipuram', 'Chengalpattu', 'Tamil Nadu', 'India', 'UNESCO World Heritage coastal town renowned for 7th-century rock-cut monuments and shore temples.', 'Active');

-- Seed Categories
INSERT INTO categories (category_id, category_name, description, status) VALUES
(1, 'Hill Stations', 'Escapes to misty peaks, tea gardens, and lush mountain treks.', 'Active'),
(2, 'Heritage & Cultural', 'Ancient Dravidian architecture, historic forts, and traditional arts.', 'Active'),
(3, 'Coastal & Beach', 'Scenic shores, lighthouse trails, and island discoveries.', 'Active'),
(4, 'Wildlife & Eco', 'Tiger reserves, biosphere sanctuaries, and birdwatching trails.', 'Active'),
(5, 'Pilgrimage & Spiritual', 'Venerated temple corridors, sacred rivers, and spiritual peace.', 'Active'),
(6, 'Culinary & Village', 'Authentic local gastronomy, farm stays, and traditional craft tours.', 'Active');

-- Seed Tour Packages
INSERT INTO tour_packages (package_id, provider_id, destination_id, category_id, title, description, duration_days, price, capacity, available_seats, status) VALUES
(1, 2, 1, 1, 'Ooty Nilgiri Mountain Railway & Tea Trails', 'Experience the magic of the Nilgiris aboard the UNESCO heritage toy train, stroll through aromatic tea estates, and witness panoramic sunset views from Doddabetta Peak.', 3, 4500.00, 15, 11, 'Approved'),
(2, 3, 2, 2, 'Madurai Heritage Temples & Street Food Walk', 'Dive deep into Tamil history with a scholar-led tour of Meenakshi Sundareswarar Temple and Tirumalai Nayakkar Mahal, followed by an evening culinary walk.', 2, 3200.00, 20, 18, 'Approved'),
(3, 2, 3, 1, 'Kodaikanal Mist & Pine Forest Trek', 'A serene getaway through whispering pine groves, Coakers Walk, Pillar Rocks, and campfire sessions under starry mountain skies.', 3, 5200.00, 12, 8, 'Approved'),
(4, 3, 4, 2, 'Thanjavur Chola Architecture & Bronze Craft', 'Stand in awe before the 1000-year-old Brihadisvara Temple (Big Temple), discover Thanjavur Royal Palace art gallery, and visit Swamimalai bronze casting artisans.', 2, 2800.00, 25, 22, 'Approved'),
(5, 3, 5, 3, 'Rameswaram & Dhanushkodi Island Expedition', 'Journey across the Pamban Sea Bridge, bathe in holy theerthams, and explore the windswept ruins and sand spits of Dhanushkodi.', 3, 4000.00, 18, 15, 'Approved');

-- Seed Bookings
INSERT INTO bookings (booking_id, customer_id, package_id, travelers, total_amount, booking_status, payment_status) VALUES
(1001, 1, 1, 2, 9000.00, 'Confirmed', 'Paid'),
(1002, 1, 3, 1, 5200.00, 'Confirmed', 'Paid');

-- Seed Payments
INSERT INTO payments (booking_id, customer_id, amount, payment_method, payment_status) VALUES
(1001, 1, 9000.00, 'UPI', 'Success'),
(1002, 1, 5200.00, 'Credit Card', 'Success');

-- Seed Reviews
INSERT INTO reviews (booking_id, customer_id, package_id, rating, comment) VALUES
(1001, 1, 1, 5, 'The toy train journey was magical! Selvam was an exceptional host who shared incredible lore about the Nilgiris.');

-- Seed Admin Permissions
INSERT INTO admin_permissions (admin_id, permission_name) VALUES
(4, 'manage_customers'),
(4, 'manage_providers'),
(4, 'manage_packages'),
(4, 'manage_bookings'),
(4, 'view_reports');

-- Seed Destination Updates
INSERT INTO destination_updates (title, destination_id, category, description, date_posted, status) VALUES
('Nilgiri Mountain Railway Winter Timetable & Heritage Run', 1, 'Advisory', 'Southern Railway has announced two additional weekend steam locomotive runs between Mettupalayam and Ooty.', '2026-11-08', 'Active'),
('Madurai Chithirai Heritage Pre-Celebrations', 2, 'Festival', 'Special Bharatanatyam and Villu Paattu cultural performances scheduled around the East Chithirai Street.', '2026-11-09', 'Active');
