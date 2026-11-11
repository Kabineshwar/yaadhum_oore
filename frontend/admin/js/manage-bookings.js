// ============================================
// YAADHUM OOORE - MANAGE BOOKINGS
// Integrated with Shared State & Booking Integrity
// ============================================

const api = window.YaadhumAPI;
let bookings = api ? api.getBookings() : [];

const bookingTableBody = document.getElementById("bookingTableBody");
const searchBooking = document.getElementById("searchBooking");
const bookingStatusFilter = document.getElementById("bookingStatusFilter");
const bookingEmptyMessage = document.getElementById("bookingEmptyMessage");

function displayBookings() {
    if (api) bookings = api.getBookings();
    if (!bookingTableBody) return;
    bookingTableBody.innerHTML = "";

    const searchText = (searchBooking ? searchBooking.value : "").toLowerCase();
    const selectedStatus = bookingStatusFilter ? bookingStatusFilter.value : "All";

    const filtered = bookings.filter(function(item) {
        const cust = (item.customer_name || item.customer || "").toLowerCase();
        const pkg = (item.package_name || item.package || "").toLowerCase();
        const id = String(item.booking_id || item.id || "").toLowerCase();
        const status = item.booking_status || item.status || "Pending";

        const matchesSearch = cust.includes(searchText) || pkg.includes(searchText) || id.includes(searchText);
        const matchesStatus = selectedStatus === "All" || status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    if (bookingEmptyMessage) {
        bookingEmptyMessage.hidden = filtered.length !== 0;
    }

    filtered.forEach(function(item) {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = item.booking_id || item.id;

        const customerCell = document.createElement("td");
        customerCell.innerHTML = `<strong>${item.customer_name || item.customer}</strong><br><small style="color:#718096;">${item.customer_email || ''}</small>`;

        const packageCell = document.createElement("td");
        packageCell.textContent = item.package_name || item.package;

        const destinationCell = document.createElement("td");
        destinationCell.textContent = item.destination || "Tamil Nadu";

        const dateCell = document.createElement("td");
        dateCell.textContent = item.travel_date || item.travelDate || "Upcoming";

        const peopleCell = document.createElement("td");
        peopleCell.textContent = (item.travelers || item.people || 1) + " person(s)";

        const amountCell = document.createElement("td");
        amountCell.textContent = "₹" + Number(item.total_amount || item.amount || 0).toLocaleString("en-IN");

        const statusCell = document.createElement("td");
        const status = item.booking_status || item.status || "Pending";
        const statusLabel = document.createElement("span");
        statusLabel.className = "status " + status.toLowerCase();
        statusLabel.textContent = status;
        statusCell.appendChild(statusLabel);

        const actionCell = document.createElement("td");
        actionCell.style.cssText = "display: flex; gap: 6px; flex-wrap: wrap;";

        const bkId = item.booking_id || item.id;

        if (status === "Pending") {
            const confirmBtn = document.createElement("button");
            confirmBtn.textContent = "Confirm";
            confirmBtn.className = "action-button approve-button";
            confirmBtn.onclick = function() {
                if (api) api.updateBookingStatus(bkId, "Confirmed", "Admin");
                displayBookings();
            };
            actionCell.appendChild(confirmBtn);
        } else if (status === "Confirmed") {
            const completeBtn = document.createElement("button");
            completeBtn.textContent = "Complete";
            completeBtn.className = "action-button approve-button";
            completeBtn.onclick = function() {
                if (api) api.updateBookingStatus(bkId, "Completed", "Admin");
                displayBookings();
            };
            actionCell.appendChild(completeBtn);
        }

        if (status !== "Cancelled") {
            const cancelBtn = document.createElement("button");
            cancelBtn.textContent = "Cancel";
            cancelBtn.className = "action-button reject-button";
            cancelBtn.onclick = function() {
                if (confirm(`Cancel booking ${bkId}? Seats will be restored to package capacity.`)) {
                    if (api) api.cancelBooking(bkId, "Admin");
                    displayBookings();
                }
            };
            actionCell.appendChild(cancelBtn);
        }

        row.appendChild(idCell);
        row.appendChild(customerCell);
        row.appendChild(packageCell);
        row.appendChild(destinationCell);
        row.appendChild(dateCell);
        row.appendChild(peopleCell);
        row.appendChild(amountCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        bookingTableBody.appendChild(row);
    });

    updateBookingStatistics();
}

function updateBookingStatistics() {
    if (api) bookings = api.getBookings();
    const total = bookings.length;
    const confirmed = bookings.filter(b => (b.booking_status || b.status) === "Confirmed").length;
    const pending = bookings.filter(b => (b.booking_status || b.status) === "Pending").length;
    const cancelled = bookings.filter(b => (b.booking_status || b.status) === "Cancelled").length;

    const elTotal = document.getElementById("totalBookings");
    const elConf = document.getElementById("confirmedBookings");
    const elPend = document.getElementById("pendingBookings");
    const elCanc = document.getElementById("cancelledBookings");

    if (elTotal) elTotal.textContent = total;
    if (elConf) elConf.textContent = confirmed;
    if (elPend) elPend.textContent = pending;
    if (elCanc) elCanc.textContent = cancelled;
}

document.addEventListener("DOMContentLoaded", function () {
    if (searchBooking) searchBooking.addEventListener("input", displayBookings);
    if (bookingStatusFilter) bookingStatusFilter.addEventListener("change", displayBookings);
    displayBookings();
});
