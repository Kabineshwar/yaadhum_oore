# YAADHUM OOORE (யாதும் ஊரே)
### Local Tourism Package Booking System — Web Technology Academic Project

> *"யாதும் ஊரே யாவரும் கேளிர்"* — To us all towns are one, all people our kin.  
> A comprehensive, database-driven local tourism package booking platform promoting authentic cultural exploration, heritage preservation, and sustainable community tourism across Tamil Nadu.

---

## 🏛️ Project Architecture & Four Stakeholder Roles

The system is architected into four fully realized, permission-governed stakeholder modules:

1. **Customer Module**
   - Cultural destination discovery across Tamil Nadu (Kongu Nadu, Chola Nadu, Pandiya Nadu, Thondai Nadu).
   - Package discovery, multi-parameter filtering (category, price range, duration, region), and full-text search.
   - Comprehensive package details, day-by-day itineraries, inclusions/exclusions, and verified traveler reviews.
   - Multi-package side-by-side comparison matrix.
   - Local wishlist management with instant save/remove.
   - Multi-step booking engine with date selection, dynamic traveler calculation, special requests, and simulated payment gateway.
   - Customer booking history (*My Bookings*) with active/completed/cancelled filtering and booking cancellation.
   - Profile management and personalized customer dashboard.

2. **Tourism Provider Module**
   - Provider sign-in and operator registration onboarding (`/provider/provider-login.html`).
   - Provider Dashboard with operational performance statistics.
   - Package authoring form (`add-package.html`): submissions enter **Pending Admin Verification** state.
   - Package catalog management (`my-packages.html`) with editing and deletion capabilities.
   - Batch departure availability and seat allocation controls (`package-availability.html`).
   - Customer booking view (`provider-bookings.html`) synchronized with customer bookings.
   - Traveler reviews monitor (`provider-reviews.html`) and revenue performance reports (`provider-reports.html`).

3. **Platform Administrator Module**
   - Admin sign-in portal (`/admin/admin-login.html`).
   - Centralized Administrative Dashboard (`admin-dashboard.html`).
   - Provider package moderation workflow (`manage-packages.html`): review, approve, or reject provider tour packages.
   - Booking management console (`manage-bookings.html`): monitor customer bookings across providers, update statuses (Confirmed, Cancelled, Completed).
   - Customer account management (`manage-customers.html`): activate or suspend traveler accounts.
   - Tour operator verification (`manage-providers.html`): verify and approve new agency registrations.
   - Destination catalog updates (`manage-destinations.html`) and tourism categories manager (`manage-categories.html`).
   - Real-time platform revenue and performance analytics (`reports.html`).

4. **Super Administrator Module**
   - Executive control panel (`superadmin-dashboard.html`).
   - Administrator management (`manage-admins.html`): provision new admin accounts, assign roles.
   - Fine-grained permission matrix (`permissions.html`) governing module-level access.
   - Real-time audit trail and security activity logs (`system-logs.html`).
   - Platform configuration and maintenance controls (`system-settings.html`).

---

## 🛠️ Technology Stack (Strict Academic Constraints Adhered)

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+), DOM Manipulation, Fetch API.
  - *Strictly ZERO external frontend frameworks (No React, Angular, Vue, Bootstrap, or jQuery).*
- **Backend:** Node.js native standard library (`http`, `fs`, `path`, `url`, `crypto`).
  - *Strictly ZERO third-party backend frameworks (No Express.js).*
- **Database:** MySQL Relational Database (`backend/db.sql`).
  - Features 12 relational tables with foreign keys, constraints, indexes, cascade behaviors, and seed data.
  - Native fallback JSON storage (`backend/data/store.json`) ensuring 100% execution resilience in test environments where MySQL server is not locally configured.

---

## 💾 Database Schema (12 Mandatory Tables)

The schema is defined in executable SQL format in [`backend/db.sql`](backend/db.sql):

1. `users` — Unified authentication table for all four roles (customer, provider, admin, superadmin).
2. `addresses` — Geographic addresses linked to registered users.
3. `destinations` — Curated Tamil Nadu travel destinations with cultural metadata and regional tagging.
4. `categories` — Thematic travel categories (Heritage & Temple, Hill Station, Coastal, Culinary, Eco).
5. `tour_packages` — Tour packages submitted by providers, governed by status (`pending`, `approved`, `rejected`).
6. `package_itinerary` — Day-by-day scheduled activities, meal plans, and accommodations.
7. `package_availability` — Scheduled tour departure dates, total capacity, and seat occupancy.
8. `bookings` — Customer booking records with unique alphanumeric references and statuses.
9. `payments` — Transaction logs mapped to bookings with simulated payment statuses.
10. `reviews` — Customer feedback, star ratings, and testimonials tied to completed tours.
11. `admin_permissions` — Granular role-based capability matrices (view, create, edit, delete).
12. `system_logs` — Immutable audit trail recording administrative and financial operations.

---

## 🚀 Execution & Setup Guide

### Method 1: Run Full Application with Native Node.js Server (Recommended)

1. Open a terminal in the project root directory:
   ```bash
   cd "g:\My Drive\PROJECTS\Web Tech YaadhuM Oore\yaadhum_oore"
   ```

2. Start the native HTTP backend server:
   ```bash
   node backend/server.js
   ```
   *(Or alternatively via npm script: `npm start`)*

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
   - The native HTTP server serves all static frontend assets and routes `/api/*` endpoints.
   - The embedded Universal Portal Bar at the top allows 1-click switching between all 4 roles.

### Method 2: MySQL Database Import (Optional / Production Setup)

To import the database schema into a local MySQL instance:
```bash
mysql -u root -p < backend/db.sql
```

### Method 3: Direct Client-Side Browser Inspection

You can also directly double-click or open [`frontend/index.html`](frontend/index.html) in any modern browser (Chrome, Edge, Firefox, Safari).  
All frontend services include automatic offline fallbacks and local storage synchronization, so every feature remains operable even without an active server process.

---

## 🔑 Pre-Seeded Demonstration Accounts

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@yaadhum.in` | `Password@123` | Full Traveler Discovery, Booking & Reviews |
| **Provider** | `provider@yaadhum.in` | `Password@123` | Package Submission, Bookings & Availability |
| **Admin** | `admin@yaadhum.in` | `Password@123` | Package Moderation, Customer & Booking Controls |
| **Super Admin** | `superadmin@yaadhum.in` | `Password@123` | Full Platform Oversight, Permissions & Audit Logs |

---

## 📁 Repository Directory Structure

```
yaadhum_oore/
├── backend/
│   ├── data/
│   │   └── store.json             # Seeded JSON persistence for standalone execution
│   ├── database.js                # Database abstraction layer (MySQL + File fallback)
│   ├── db.sql                     # Complete 12-table MySQL relational DDL & seed script
│   └── server.js                  # Native Node.js HTTP server (zero external dependencies)
├── frontend/
│   ├── admin/                     # Administrator & Super Admin Module (14 pages)
│   │   ├── css/admin.css
│   │   ├── js/                    # Modular administrative logic scripts
│   │   ├── admin-dashboard.html
│   │   ├── admin-login.html
│   │   ├── manage-packages.html   # Package approval / rejection workflow
│   │   ├── manage-bookings.html   # Booking monitoring and status management
│   │   ├── manage-customers.html  # Customer account oversight
│   │   ├── manage-providers.html  # Provider approval and verification
│   │   ├── reports.html           # Revenue and platform analytics
│   │   ├── superadmin-dashboard.html
│   │   ├── system-logs.html       # Immutable audit logs
│   │   └── ...
│   ├── customer/                  # Customer Module (12 pages)
│   │   ├── css/customer.css       # Unified Tamil Nadu cultural design system
│   │   ├── js/customer.js         # Centralized Customer services & API client
│   │   ├── destinations.html      # Cultural destinations catalogue
│   │   ├── packages.html          # Approved packages explorer
│   │   ├── search-packages.html   # Real-time multi-filter package search
│   │   ├── package-details.html   # Deep package view, itinerary & reviews
│   │   ├── booking.html           # Multi-step booking engine
│   │   ├── my-bookings.html       # Customer booking history & cancellation
│   │   ├── compare.html           # Side-by-side tour comparison
│   │   ├── wishlist.html          # Saved tours wishlist
│   │   ├── customer-dashboard.html# Customer hub & upcoming tour
│   │   ├── profile.html           # Customer profile management
│   │   ├── login.html             # Customer authentication
│   │   └── register.html          # Customer registration
│   ├── provider/                  # Tourism Provider Module (11 pages)
│   │   ├── css/provider.css       # Provider portal styling
│   │   ├── js/provider.js         # Provider package CRUD, bookings & reviews logic
│   │   ├── provider-login.html    # Provider sign-in portal
│   │   ├── provider-register.html # Provider onboarding registration
│   │   ├── provider-dashboard.html# Provider hub & metrics
│   │   ├── add-package.html       # Package creation form (status: pending)
│   │   ├── my-packages.html       # Package catalog, edit & delete
│   │   ├── package-availability.html # Departure dates & seat allocations
│   │   ├── provider-bookings.html # Synchronized customer bookings table
│   │   ├── provider-reviews.html  # Verified traveler feedback
│   │   ├── provider-reports.html  # Package sales & revenue performance
│   │   └── provider-profile.html  # Operator business profile
│   ├── shared/
│   │   └── portal-nav.js          # Universal sticky role switcher navigation bar
│   └── index.html                 # Main platform cultural landing page
├── package.json                   # Project scripts and configuration
├── .gitignore                     # Repository ignore rules
└── README.md                      # Comprehensive project documentation
```

---

## 👥 Academic Team Contribution Summary

- **Person 1 (Customer Module):** Cultural landing page, destination exploration, package discovery, multi-filter search, package details, itinerary breakdown, package comparison, wishlist, booking flow, booking history, customer profile, customer dashboard, and unified Tamil Nadu heritage design system.
- **Person 2 (Provider Module & Shared Backend):** Tour operator portal, package submission and editing, availability schedule, provider bookings and reports, native Node.js HTTP server (`server.js`), REST API endpoints for all four roles, and MySQL database schema (`db.sql`).
- **Person 3 (Admin & Super Admin Module):** Administrative control dashboard, super admin console, package verification and approval workflow, booking manager, customer management, provider verification, role permissions matrix, audit activity logs, and platform revenue reports.
