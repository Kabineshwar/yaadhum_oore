/**
 * ==========================================================================
 * YAADHUM OOORE - Provider Module JavaScript
 * "யாதும் ஊரே யாவரும் கேளிர்"
 * Integrated Provider Frontend with Shared State & Unified CRUD.
 * Supports package creation, editing, availability, real customer bookings,
 * earnings reports, reviews, and provider profile management.
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Authentication & Active Provider Identity
  const api = window.YaadhumAPI;
  let currentUser = window.YaadhumSession ? window.YaadhumSession.getUser() : null;

  // If accessed directly without login, default to primary demo provider (Selvam - Mountain Adventures)
  if (!currentUser || currentUser.role !== 'provider') {
    const providers = api ? api.getUsers('provider') : [];
    currentUser = (providers && providers.length > 0) ? providers[0] : {
      id: 'prov_201',
      name: 'Selvam Perumal',
      business: 'Mountain Adventures',
      email: 'selvam@tamilnadutours.in',
      phone: '9840123456',
      role: 'provider',
      location: 'Ooty',
      status: 'Approved'
    };
  }

  // Update greeting with provider business name if element exists
  const heading = document.querySelector('main h2');
  if (heading && heading.textContent.includes('Welcome, Local Provider')) {
    heading.textContent = `Welcome, ${currentUser.business || currentUser.name}!`;
  }

  function showMessage(id, text, isError = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = isError ? "message error" : "message success";
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Highlight active link in provider navigation
  const currentFile = window.location.pathname.split("/").pop();
  document.querySelectorAll("nav a").forEach(link => {
    if (link.getAttribute("href") === currentFile) {
      link.classList.add("active");
    }
  });

  // --------------------------------------------------------------------------
  // 2. Provider Dashboard Metrics (provider-dashboard.html)
  // --------------------------------------------------------------------------
  const dashboardPackagesEl = document.getElementById("dashboardPackages");
  if (dashboardPackagesEl && api) {
    const myPackages = api.getPackages({ providerId: currentUser.id });
    const myBookings = api.getBookings({ providerId: currentUser.id });
    const myReviews = api.getReviews({ providerId: currentUser.id });

    dashboardPackagesEl.textContent = `${myPackages.length} active`;

    // Update bookings stat card
    const cards = document.querySelectorAll(".cards .card");
    if (cards.length >= 4) {
      cards[1].querySelector("p").textContent = `${myBookings.length} total booking(s)`;
      cards[2].querySelector("p").textContent = `${myReviews.length} customer review(s)`;
      
      const totalEarnings = myBookings
        .filter(b => b.booking_status !== 'Cancelled')
        .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
      cards[3].querySelector("p").textContent = `Earnings: ₹${totalEarnings.toLocaleString('en-IN')}`;
    }
  }

  // --------------------------------------------------------------------------
  // 3. My Packages List (my-packages.html)
  // --------------------------------------------------------------------------
  const packageList = document.getElementById("packageList");
  if (packageList && api) {
    const myPackages = api.getPackages({ providerId: currentUser.id });
    packageList.innerHTML = "";

    if (!myPackages || myPackages.length === 0) {
      packageList.innerHTML = `
        <div class="panel" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
          <h3>No Packages Created Yet</h3>
          <p class="note" style="margin: 10px 0 20px 0;">You haven't added any packages under "${currentUser.business || currentUser.name}". Click below to list your first tour.</p>
          <a class="button" href="add-package.html">+ Create New Package</a>
        </div>
      `;
    } else {
      myPackages.forEach(pkg => {
        const card = document.createElement("div");
        card.className = "card";

        const badgeClass = pkg.status === 'Approved' ? 'badge' : (pkg.status === 'Pending' ? 'badge pending' : 'badge danger');
        const badgeStyle = pkg.status === 'Approved' ? 'background: #C6F6D5; color: #22543D;' : (pkg.status === 'Pending' ? 'background: #FEFCBF; color: #975A16;' : 'background: #FED7D7; color: #9B2C2C;');

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <h3 style="margin: 0; font-size: 17px;">${pkg.title || pkg.name}</h3>
            <span class="${badgeClass}" style="${badgeStyle}; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${pkg.status || 'Approved'}</span>
          </div>
          <p style="color: #4A5568; margin: 4px 0; font-size: 14px;">
            <strong>${pkg.destination}</strong> &bull; ${pkg.category} &bull; ${pkg.duration}
          </p>
          <p style="font-size: 15px; font-weight: bold; color: #176b5b; margin: 6px 0;">
            ₹${Number(pkg.price).toLocaleString('en-IN')} <span style="font-size: 12px; font-weight: normal; color: #718096;">per person</span>
          </p>
          <p style="font-size: 13px; color: #718096; margin: 4px 0;">
            Available Seats: <strong>${pkg.available_seats !== undefined ? pkg.available_seats : pkg.capacity}</strong> / ${pkg.capacity}
          </p>
          <p style="font-size: 12px; color: #718096; margin: 4px 0;">
            Dates: ${pkg.startDate || 'Flexible'} to ${pkg.endDate || 'Flexible'}
          </p>
          <div class="actions" style="margin-top: 14px;">
            <a class="button" href="edit-package.html?id=${encodeURIComponent(pkg.id)}" style="background: #2B6CB0; padding: 6px 14px; font-size: 13px;">Edit</a>
            <button class="button danger btn-delete-pkg" data-id="${pkg.id}" style="padding: 6px 14px; font-size: 13px;">Delete</button>
            <a class="button secondary" href="../customer/package-details.html?id=${encodeURIComponent(pkg.id)}" target="_blank" style="padding: 6px 14px; font-size: 13px;">Preview</a>
          </div>
        `;
        packageList.appendChild(card);
      });

      // Bind delete handlers
      document.querySelectorAll(".btn-delete-pkg").forEach(btn => {
        btn.addEventListener("click", function () {
          const id = this.getAttribute("data-id");
          if (confirm("Are you sure you want to delete this package? It will be removed from customer searches.")) {
            api.deletePackage(id, currentUser.business || currentUser.name);
            location.reload();
          }
        });
      });
    }
  }

  // --------------------------------------------------------------------------
  // 4. Add Package Form (add-package.html)
  // --------------------------------------------------------------------------
  const packageForm = document.getElementById("packageForm");
  if (packageForm && api) {
    packageForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const title = document.getElementById("name").value.trim();
      const destination = document.getElementById("destination").value.trim();
      const category = document.getElementById("category").value;
      const price = Number(document.getElementById("price").value);
      const duration = document.getElementById("duration").value.trim();
      const capacity = Number(document.getElementById("capacity").value);
      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("endDate").value;
      const description = document.getElementById("description").value.trim();
      const itinerary = document.getElementById("itinerary").value.trim();

      if (!title || !destination || !category || !duration) {
        showMessage("message", "Please fill in all required package fields.", true);
        return;
      }
      if (price <= 0 || capacity <= 0) {
        showMessage("message", "Price and capacity seats must be greater than zero.", true);
        return;
      }
      if (startDate && endDate && endDate < startDate) {
        showMessage("message", "End date must be on or after the start date.", true);
        return;
      }

      const res = api.savePackage({
        title,
        name: title,
        destination,
        category,
        price,
        duration,
        duration_days: parseInt(duration) || 2,
        capacity,
        available_seats: capacity,
        startDate,
        endDate,
        description,
        itinerary,
        provider_id: currentUser.id,
        provider_name: currentUser.business || currentUser.name,
        status: 'Approved' // Live for customer booking
      }, currentUser);

      if (res.success) {
        showMessage("message", `Success! "${title}" has been saved and is now visible to customers.`);
        packageForm.reset();
        setTimeout(() => {
          window.location.href = "my-packages.html";
        }, 1200);
      } else {
        showMessage("message", res.error || "Failed to save package.", true);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 5. Edit Package Form (edit-package.html)
  // --------------------------------------------------------------------------
  const editForm = document.getElementById("editPackageForm");
  if (editForm && api) {
    const pkgId = new URLSearchParams(window.location.search).get("id");
    const pkg = pkgId ? api.getPackageById(pkgId) : null;

    if (!pkg) {
      showMessage("message", "Package not found. Please choose a package from the My Packages page.", true);
      const submitBtn = editForm.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = true;
    } else {
      document.getElementById("packageId").value = pkg.id;
      if (document.getElementById("name")) document.getElementById("name").value = pkg.title || pkg.name || '';
      if (document.getElementById("destination")) document.getElementById("destination").value = pkg.destination || '';
      if (document.getElementById("category")) document.getElementById("category").value = pkg.category || '';
      if (document.getElementById("price")) document.getElementById("price").value = pkg.price || '';
      if (document.getElementById("duration")) document.getElementById("duration").value = pkg.duration || '';
      if (document.getElementById("capacity")) document.getElementById("capacity").value = pkg.capacity || '';
      if (document.getElementById("startDate")) document.getElementById("startDate").value = pkg.startDate || '';
      if (document.getElementById("endDate")) document.getElementById("endDate").value = pkg.endDate || '';
      if (document.getElementById("description")) document.getElementById("description").value = pkg.description || '';
      if (document.getElementById("itinerary")) document.getElementById("itinerary").value = pkg.itinerary || '';

      editForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const updatedTitle = document.getElementById("name").value.trim();
        const updatedDest = document.getElementById("destination").value.trim();
        const updatedCat = document.getElementById("category").value;
        const updatedPrice = Number(document.getElementById("price").value);
        const updatedDur = document.getElementById("duration").value.trim();
        const updatedCap = Number(document.getElementById("capacity").value);
        const updatedStart = document.getElementById("startDate").value;
        const updatedEnd = document.getElementById("endDate").value;
        const updatedDesc = document.getElementById("description").value.trim();
        const updatedItin = document.getElementById("itinerary").value.trim();

        if (updatedPrice <= 0 || updatedCap <= 0) {
          showMessage("message", "Price and capacity must be positive numbers.", true);
          return;
        }

        const res = api.savePackage({
          id: pkg.id,
          provider_id: pkg.provider_id || currentUser.id,
          provider_name: pkg.provider_name || currentUser.business || currentUser.name,
          title: updatedTitle,
          name: updatedTitle,
          destination: updatedDest,
          category: updatedCat,
          price: updatedPrice,
          duration: updatedDur,
          capacity: updatedCap,
          available_seats: Math.min(updatedCap, pkg.available_seats !== undefined ? pkg.available_seats : updatedCap),
          startDate: updatedStart,
          endDate: updatedEnd,
          description: updatedDesc,
          itinerary: updatedItin,
          status: pkg.status || 'Approved'
        }, currentUser);

        if (res.success) {
          showMessage("message", "Package details updated successfully! Changes reflect across the platform.");
          setTimeout(() => {
            window.location.href = "my-packages.html";
          }, 1200);
        } else {
          showMessage("message", res.error || "Update failed.", true);
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // 6. Customer Bookings for Provider (package-bookings.html / provider-bookings.html)
  // --------------------------------------------------------------------------
  const bookingsTbody = document.querySelector("main table tbody");
  if (bookingsTbody && (currentFile.includes("bookings") || document.querySelector("h2").textContent.includes("Bookings")) && api) {
    const myBookings = api.getBookings({ providerId: currentUser.id });
    bookingsTbody.innerHTML = "";

    if (!myBookings || myBookings.length === 0) {
      bookingsTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #718096;">No customer bookings recorded yet for ${currentUser.business || currentUser.name}.</td></tr>`;
    } else {
      myBookings.forEach(b => {
        const row = document.createElement("tr");
        const statusBadgeClass = b.booking_status === 'Confirmed' ? 'badge' : (b.booking_status === 'Completed' ? 'badge secondary' : (b.booking_status === 'Cancelled' ? 'badge danger' : 'badge'));
        const statusBadgeStyle = b.booking_status === 'Confirmed' ? 'background: #C6F6D5; color: #22543D;' : (b.booking_status === 'Cancelled' ? 'background: #FED7D7; color: #9B2C2C;' : 'background: #EBF8FF; color: #2B6CB0;');

        row.innerHTML = `
          <td><strong>${b.booking_id}</strong></td>
          <td>
            <strong>${b.customer_name || 'Customer'}</strong><br>
            <small style="color: #718096;">${b.customer_phone || ''} ${b.customer_email ? '(' + b.customer_email + ')' : ''}</small>
          </td>
          <td>${b.package_name}</td>
          <td>${b.travel_date || 'Upcoming'}</td>
          <td>${b.travelers} person(s)</td>
          <td><strong>₹${Number(b.total_amount).toLocaleString('en-IN')}</strong></td>
          <td>
            <span class="${statusBadgeClass}" style="${statusBadgeStyle}; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
              ${b.booking_status}
            </span>
          </td>
          <td>
            ${b.booking_status !== 'Confirmed' && b.booking_status !== 'Cancelled' ? `<button class="button btn-confirm-bk" data-id="${b.booking_id}" style="padding: 4px 8px; font-size: 12px;">Confirm</button>` : ''}
            ${b.booking_status === 'Confirmed' ? `<button class="button secondary btn-complete-bk" data-id="${b.booking_id}" style="padding: 4px 8px; font-size: 12px; background: #2F855A;">Complete Tour</button>` : ''}
            ${b.booking_status !== 'Cancelled' ? `<button class="button danger btn-cancel-bk" data-id="${b.booking_id}" style="padding: 4px 8px; font-size: 12px;">Cancel</button>` : ''}
          </td>
        `;
        bookingsTbody.appendChild(row);
      });

      // Bind booking action handlers
      document.querySelectorAll(".btn-confirm-bk").forEach(btn => {
        btn.addEventListener("click", function () {
          api.updateBookingStatus(this.getAttribute("data-id"), 'Confirmed', currentUser.business || currentUser.name);
          location.reload();
        });
      });
      document.querySelectorAll(".btn-complete-bk").forEach(btn => {
        btn.addEventListener("click", function () {
          api.updateBookingStatus(this.getAttribute("data-id"), 'Completed', currentUser.business || currentUser.name);
          location.reload();
        });
      });
      document.querySelectorAll(".btn-cancel-bk").forEach(btn => {
        btn.addEventListener("click", function () {
          if (confirm("Cancel this booking? Seats will be restored to your package.")) {
            api.cancelBooking(this.getAttribute("data-id"), currentUser.business || currentUser.name);
            location.reload();
          }
        });
      });
    }
  }

  // --------------------------------------------------------------------------
  // 7. Provider Reports (provider-reports.html)
  // --------------------------------------------------------------------------
  const reportPackagesEl = document.getElementById("reportPackages");
  if (reportPackagesEl && api) {
    const myPackages = api.getPackages({ providerId: currentUser.id });
    const myBookings = api.getBookings({ providerId: currentUser.id });
    const confirmed = myBookings.filter(b => b.booking_status === 'Confirmed' || b.booking_status === 'Completed');
    const totalEarnings = confirmed.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

    reportPackagesEl.textContent = myPackages.length;

    const cards = document.querySelectorAll(".cards .card p");
    if (cards.length >= 4) {
      cards[1].textContent = myBookings.length;
      cards[2].textContent = confirmed.length;
      cards[3].textContent = `₹${totalEarnings.toLocaleString('en-IN')}`;
    }

    // Populate package performance table
    const perfTbody = document.querySelector("main table tbody");
    if (perfTbody) {
      perfTbody.innerHTML = "";
      myPackages.forEach(pkg => {
        const pkgBookings = myBookings.filter(b => String(b.package_id) === String(pkg.id));
        const pkgRevenue = pkgBookings
          .filter(b => b.booking_status !== 'Cancelled')
          .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

        const row = document.createElement("tr");
        row.innerHTML = `
          <td><strong>${pkg.title || pkg.name}</strong></td>
          <td>${pkgBookings.length} booking(s)</td>
          <td><strong>₹${pkgRevenue.toLocaleString('en-IN')}</strong></td>
        `;
        perfTbody.appendChild(row);
      });
    }
  }

  // --------------------------------------------------------------------------
  // 8. Provider Reviews (provider-reviews.html)
  // --------------------------------------------------------------------------
  if (currentFile.includes("reviews") && api) {
    const myReviews = api.getReviews({ providerId: currentUser.id });
    let container = document.getElementById("reviewsContainer") || document.querySelector("main table") || document.querySelector("main");

    if (myReviews.length > 0) {
      const reviewSection = document.createElement("div");
      reviewSection.className = "cards";
      reviewSection.style.marginTop = "20px";
      myReviews.forEach(r => {
        const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between;">
            <strong style="color: #176b5b;">${r.customer_name}</strong>
            <span style="color: #D69E2E; font-size: 16px;">${stars}</span>
          </div>
          <p style="margin: 10px 0; color: #4A5568; font-style: italic;">"${r.comment}"</p>
          <small style="color: #718096;">Verified Tour &bull; ${r.created_at}</small>
        `;
        reviewSection.appendChild(card);
      });
      const table = document.querySelector("main table");
      if (table) table.parentNode.replaceChild(reviewSection, table);
    }
  }

  // --------------------------------------------------------------------------
  // 9. Provider Profile Management (provider-profile.html)
  // --------------------------------------------------------------------------
  const profileForm = document.getElementById("profileForm");
  if (profileForm && api) {
    if (document.getElementById("providerName")) document.getElementById("providerName").value = currentUser.name || "";
    if (document.getElementById("email")) document.getElementById("email").value = currentUser.email || "";
    if (document.getElementById("phone")) document.getElementById("phone").value = currentUser.phone || "";
    if (document.getElementById("business")) document.getElementById("business").value = currentUser.business || "";
    if (document.getElementById("location")) document.getElementById("location").value = currentUser.location || "";
    if (document.getElementById("description")) document.getElementById("description").value = currentUser.description || "";

    profileForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const updatedData = {
        name: document.getElementById("providerName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        business: document.getElementById("business").value.trim(),
        location: document.getElementById("location").value.trim(),
        description: document.getElementById("description").value.trim()
      };

      const res = api.updateProfile(currentUser.id, updatedData);
      if (res.success) {
        showMessage("message", "Profile details saved successfully! Updated across your packages and portal.");
      } else {
        showMessage("message", res.error || "Failed to update profile.", true);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 10. Package Availability (package-availability.html)
  // --------------------------------------------------------------------------
  const availabilityForm = document.getElementById("availabilityForm");
  if (availabilityForm && api) {
    const select = document.getElementById("package");
    const myPackages = api.getPackages({ providerId: currentUser.id });
    if (select) {
      select.innerHTML = '<option value="">Select a package</option>';
      myPackages.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.title || p.name} (${p.destination})`;
        select.appendChild(opt);
      });
    }

    availabilityForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const selectedId = select ? select.value : null;
      const start = document.getElementById("start").value;
      const end = document.getElementById("end").value;
      const seats = Number(document.getElementById("seats").value);

      if (!selectedId) {
        showMessage("message", "Please select a package first.", true);
        return;
      }
      if (seats < 1) {
        showMessage("message", "Seats available must be at least 1.", true);
        return;
      }

      const pkg = api.getPackageById(selectedId);
      if (pkg) {
        pkg.startDate = start;
        pkg.endDate = end;
        pkg.capacity = seats;
        pkg.available_seats = seats;
        api.savePackage(pkg, currentUser);
        showMessage("message", `Availability updated: ${seats} seats available from ${start} to ${end}.`);
        availabilityForm.reset();
      }
    });
  }
});
