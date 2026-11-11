// ============================================
// YAADHUM OOORE - ADMIN REPORTS
// Real Financial & Tourism Analytics
// ============================================

const api = window.YaadhumAPI;

function generateReports() {
    const bookings = api ? api.getBookings() : [];
    const packages = api ? api.getPackages() : [];

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => (b.booking_status || b.status) === "Confirmed" || (b.booking_status || b.status) === "Completed");
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (Number(b.total_amount || b.amount) || 0), 0);
    const avgBookingVal = confirmedBookings.length > 0 ? Math.round(totalRevenue / confirmedBookings.length) : 0;

    // Summary Cards
    const cards = document.querySelectorAll(".cards .card p, .stat-card p");
    if (cards.length >= 4) {
        cards[0].textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
        cards[1].textContent = totalBookings;
        cards[2].textContent = confirmedBookings.length;
        cards[3].textContent = `₹${avgBookingVal.toLocaleString('en-IN')}`;
    }

    // Populate Report Tables
    const tbody = document.querySelector("main table tbody");
    if (tbody) {
        tbody.innerHTML = "";
        packages.forEach(pkg => {
            const pkgBookings = bookings.filter(b => String(b.package_id || b.packageId) === String(pkg.id));
            const rev = pkgBookings
                .filter(b => (b.booking_status || b.status) !== "Cancelled")
                .reduce((sum, b) => sum + (Number(b.total_amount || b.amount) || 0), 0);

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${pkg.title || pkg.name}</strong></td>
                <td>${pkg.destination}</td>
                <td>${pkg.provider_name || 'Provider'}</td>
                <td>${pkgBookings.length} booking(s)</td>
                <td><strong>₹${rev.toLocaleString('en-IN')}</strong></td>
            `;
            tbody.appendChild(row);
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    generateReports();
});
