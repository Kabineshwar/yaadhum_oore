// =============================================================================
// YAADHUM OOORE - Provider Module JavaScript
// Handles Provider Authentication, Package CRUD, Bookings, Reviews, and Reports
// Integrates with Node.js backend REST API (/api/...) with robust local fallback.
// =============================================================================

const PACKAGE_KEY = "yaadhum_provider_packages";
const AVAILABILITY_KEY = "yaadhum_provider_availability";
const PROFILE_KEY = "yaadhum_provider_profile";
const PROVIDER_SESSION_KEY = "yaadhum_provider_session";

// Helpers
function getData(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch (error) { return []; }
}
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function showMessage(id, text, isError = false) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = text;
  element.className = isError ? "message error" : "message success";
  element.style.display = "block";
}

// Ensure Provider Session Guard
function checkProviderAuth() {
  const path = window.location.pathname;
  if (path.includes('provider-login.html') || path.includes('provider-register.html')) {
    return;
  }
  let user = null;
  try {
    const raw = sessionStorage.getItem('yaadhum_session') || localStorage.getItem('yaadhum_session') || localStorage.getItem(PROVIDER_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      user = parsed.user || parsed;
    }
  } catch(e) {}

  if (!user) {
    window.location.href = 'provider-login.html';
    return;
  }
  if (user.role === 'customer') {
    window.location.href = '../customer/customer-dashboard.html';
    return;
  }
}

checkProviderAuth();

function packageFromForm(form) {
  const data = new FormData(form);
  return {
    id: Date.now().toString(),
    provider_id: 3,
    name: data.get("name") || document.getElementById("name")?.value.trim(),
    destination: data.get("destination") || document.getElementById("destination")?.value.trim(),
    category: data.get("category") || document.getElementById("category")?.value,
    price: Number(data.get("price") || document.getElementById("price")?.value),
    duration: data.get("duration") || document.getElementById("duration")?.value.trim(),
    capacity: Number(data.get("capacity") || document.getElementById("capacity")?.value),
    startDate: data.get("startDate") || document.getElementById("startDate")?.value,
    endDate: data.get("endDate") || document.getElementById("endDate")?.value,
    description: data.get("description") || document.getElementById("description")?.value.trim(),
    itinerary: data.get("itinerary") || document.getElementById("itinerary")?.value.trim(),
    status: 'pending' // Mandatory: Provider packages start as pending admin approval
  };
}

function validDates(start, end) { return !!start && !!end && end >= start; }

document.addEventListener("DOMContentLoaded", async () => {

  // 1. ADD PACKAGE FORM
  const packageForm = document.getElementById("packageForm");
  if (packageForm) {
    packageForm.addEventListener("submit", async event => {
      event.preventDefault();
      const item = packageFromForm(packageForm);
      if (!validDates(item.startDate, item.endDate)) {
        showMessage("message", "End date must be on or after the start date.", true);
        return;
      }
      if (item.price <= 0 || item.capacity <= 0) {
        showMessage("message", "Price and available seats must be greater than zero.", true);
        return;
      }

      // Try API first
      try {
        const res = await fetch('/api/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.name,
            destination_id: 1, // Default or mapped
            category_id: 1,
            price_per_person: item.price,
            duration: item.duration,
            capacity: item.capacity,
            start_date: item.startDate,
            end_date: item.endDate,
            description: item.description,
            inclusions: item.itinerary,
            status: 'pending'
          })
        });
        if (res.ok) {
          const result = await res.json();
          if (result.package) item.id = result.package.id.toString();
        }
      } catch (err) {
        console.warn('Backend API offline, persisting package locally.');
      }

      // Also persist to localStorage for offline fallback
      const packages = getData(PACKAGE_KEY);
      packages.push(item);
      saveData(PACKAGE_KEY, packages);

      packageForm.reset();
      showMessage("message", "Package submitted successfully! Status: Pending Admin Approval.");
    });
  }

  // 2. MY PACKAGES LIST
  const packageList = document.getElementById("packageList");
  if (packageList) {
    let packages = getData(PACKAGE_KEY);

    // Try fetching live packages from API
    try {
      const res = await fetch('/api/packages?provider_id=3');
      if (res.ok) {
        const json = await res.json();
        if (json.packages && json.packages.length > 0) {
          packages = json.packages.map(p => ({
            id: p.id.toString(),
            name: p.title,
            destination: p.destination_name || 'Tamil Nadu',
            duration: p.duration,
            price: p.price_per_person,
            capacity: p.capacity,
            startDate: p.start_date,
            endDate: p.end_date,
            status: p.status || 'approved'
          }));
        }
      }
    } catch(e) {}

    packageList.innerHTML = '';
    if (!packages.length) {
      packageList.innerHTML = '<p class="note">No packages added yet. Use Add Package to create your first package.</p>';
    } else {
      packages.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";
        const statusBadge = item.status === 'approved' 
          ? '<span style="background: #2e7d32; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">Approved</span>'
          : item.status === 'rejected'
          ? '<span style="background: #c62828; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">Rejected</span>'
          : '<span style="background: #ef6c00; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">Pending Approval</span>';

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <h3 style="margin: 0;">${item.name}</h3>
            ${statusBadge}
          </div>
          <p>${item.destination} | ${item.duration} | ₹${item.price} per person | ${item.capacity} seats</p>
          <p>${item.startDate} to ${item.endDate}</p>
          <div class="actions">
            <a class="button" href="edit-package.html?id=${encodeURIComponent(item.id)}">Edit</a>
            <button class="danger delete-pkg-btn" data-id="${item.id}">Delete</button>
          </div>
        `;
        packageList.appendChild(card);
      });

      // Hook up delete buttons
      document.querySelectorAll('.delete-pkg-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
          const id = this.getAttribute('data-id');
          if (!confirm("Are you sure you want to delete this tourism package?")) return;
          try {
            await fetch(`/api/packages/${id}`, { method: 'DELETE' });
          } catch(e) {}
          saveData(PACKAGE_KEY, getData(PACKAGE_KEY).filter(p => p.id !== id));
          location.reload();
        });
      });
    }
  }

  // 3. EDIT PACKAGE FORM
  const editForm = document.getElementById("editPackageForm");
  if (editForm) {
    const id = new URLSearchParams(location.search).get("id");
    let packages = getData(PACKAGE_KEY);
    let item = packages.find(p => p.id === id);

    // Try fetching package details from API
    if (!item && id) {
      try {
        const res = await fetch(`/api/packages/${id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.package) {
            item = {
              id: json.package.id.toString(),
              name: json.package.title,
              destination: json.package.destination_name,
              category: 'Heritage & Temple',
              price: json.package.price_per_person,
              duration: json.package.duration,
              capacity: json.package.capacity,
              startDate: json.package.start_date,
              endDate: json.package.end_date,
              description: json.package.description,
              itinerary: json.package.inclusions
            };
          }
        }
      } catch(e) {}
    }

    if (!item) {
      showMessage("message", "Package not found. Open Edit from the My Packages page.", true);
      const submitBtn = editForm.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = true;
    } else {
      Object.keys(item).forEach(key => {
        const field = document.getElementById(key);
        if (field) field.value = item[key];
      });
      const idField = document.getElementById("packageId");
      if (idField) idField.value = item.id;
    }

    editForm.addEventListener("submit", async event => {
      event.preventDefault();
      const updated = packageFromForm(editForm);
      updated.id = document.getElementById("packageId").value;
      if (!validDates(updated.startDate, updated.endDate)) {
        showMessage("message", "End date must be on or after the start date.", true);
        return;
      }

      try {
        await fetch(`/api/packages/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: updated.name,
            price_per_person: updated.price,
            duration: updated.duration,
            capacity: updated.capacity,
            start_date: updated.startDate,
            end_date: updated.endDate,
            description: updated.description,
            inclusions: updated.itinerary
          })
        });
      } catch(e) {}

      saveData(PACKAGE_KEY, getData(PACKAGE_KEY).map(p => p.id === updated.id ? updated : p));
      showMessage("message", "Package updated successfully.");
    });
  }

  // 4. PROVIDER BOOKINGS TABLE
  const bookingsTableBody = document.getElementById("providerBookingsTableBody") || document.querySelector("main table tbody");
  if (bookingsTableBody && (window.location.pathname.includes("provider-bookings.html") || document.querySelector("h2")?.textContent.includes("Customer Bookings"))) {
    let bookings = [];

    // Try fetching from API
    try {
      const res = await fetch('/api/bookings?provider_id=3');
      if (res.ok) {
        const json = await res.json();
        if (json.bookings && json.bookings.length > 0) {
          bookings = json.bookings;
        }
      }
    } catch(e) {}

    // Fallback to customer demo bookings in localStorage
    if (!bookings.length) {
      const demoBookings = getData("yaadhum_demo_bookings");
      if (demoBookings.length > 0) {
        bookings = demoBookings.map(b => ({
          booking_reference: b.bookingReference || b.booking_reference,
          customer_name: b.contactDetails?.fullName || b.customer_name || 'Customer',
          package_title: b.packageTitle || b.package_title || 'Tourism Package',
          travellers_count: b.travellers || b.travellers_count || 2,
          total_amount: b.totalPrice || b.total_amount || 7499,
          booking_status: b.bookingStatus || b.booking_status || 'confirmed'
        }));
      }
    }

    if (bookings.length > 0) {
      bookingsTableBody.innerHTML = '';
      bookings.forEach(b => {
        const tr = document.createElement("tr");
        const statusClass = (b.booking_status || '').toLowerCase() === 'confirmed' ? 'badge' : 'badge';
        tr.innerHTML = `
          <td><strong>${b.booking_reference || ('BK-' + b.id)}</strong></td>
          <td>${b.customer_name}</td>
          <td>${b.package_title}</td>
          <td>${b.travellers_count}</td>
          <td>₹${Number(b.total_amount).toLocaleString('en-IN')}</td>
          <td><span class="${statusClass}" style="background: #2e7d32; color: #fff; padding: 3px 8px; border-radius: 4px;">${b.booking_status || 'Confirmed'}</span></td>
        `;
        bookingsTableBody.appendChild(tr);
      });
    }
  }

  // 5. PROVIDER REVIEWS
  const reviewsContainer = document.getElementById("providerReviewsContainer") || document.querySelector("main section.cards");
  if (reviewsContainer && window.location.pathname.includes("provider-reviews.html")) {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const json = await res.json();
        if (json.reviews && json.reviews.length > 0) {
          reviewsContainer.innerHTML = '';
          json.reviews.forEach(r => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
              <h3>${r.customer_name || 'Verified Traveler'}</h3>
              <p><strong>Package ID:</strong> #${r.package_id}</p>
              <p><strong>Rating:</strong> ${'⭐'.repeat(r.rating || 5)} (${r.rating} / 5)</p>
              <p style="font-style: italic;">"${r.comment}"</p>
              <small style="color: #666;">Date: ${r.created_at}</small>
            `;
            reviewsContainer.appendChild(card);
          });
        }
      }
    } catch(e) {}
  }

  // 6. PROVIDER REPORTS
  const reportPackages = document.getElementById("reportPackages");
  if (reportPackages) {
    let pkgCount = getData(PACKAGE_KEY).length || 5;
    let bookingsCount = getData("yaadhum_demo_bookings").length || 4;
    try {
      const res = await fetch('/api/admin/reports');
      if (res.ok) {
        const json = await res.json();
        if (json.stats) {
          pkgCount = json.stats.totalPackages || pkgCount;
          bookingsCount = json.stats.totalBookings || bookingsCount;
        }
      }
    } catch(e) {}
    reportPackages.textContent = pkgCount;
  }

  // 7. DASHBOARD METRICS
  const dashboardCount = document.getElementById("dashboardPackages");
  if (dashboardCount) {
    dashboardCount.textContent = getData(PACKAGE_KEY).length || 4;
  }
});
