// ============================================
// YAADHUM OOORE - SUPER ADMIN DASHBOARD
// Integrated System Overview
// ============================================

const api = window.YaadhumAPI;

function displaySuperAdminDashboard() {
    const today = new Date();
    const dateEl = document.getElementById("superAdminDate");
    if (dateEl) {
        dateEl.textContent = "Date: " + today.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    const admins = api ? api.getAdmins() : [];
    const logs = api ? api.getSystemLogs() : [];

    const totalAdmins = admins.length;
    const activeAdmins = admins.filter(a => (a.status || "Active") === "Active").length;
    const pendingAdmins = admins.filter(a => a.status === "Pending").length;
    const totalActivities = logs.length;

    const elTotal = document.getElementById("totalAdmins");
    const elAct = document.getElementById("activeAdmins");
    const elPend = document.getElementById("pendingAdmins");
    const elActv = document.getElementById("totalActivities");

    if (elTotal) elTotal.textContent = totalAdmins;
    if (elAct) elAct.textContent = activeAdmins;
    if (elPend) elPend.textContent = pendingAdmins;
    if (elActv) elActv.textContent = totalActivities;

    // Render Recent Logs table if present
    const tbody = document.querySelector("main table tbody");
    if (tbody) {
        tbody.innerHTML = "";
        logs.slice(0, 5).forEach(l => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${l.log_id}</strong></td>
                <td>${l.actor}</td>
                <td>${l.action}</td>
                <td>${l.timestamp}</td>
                <td><span class="status approved">Successful</span></td>
            `;
            tbody.appendChild(row);
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    displaySuperAdminDashboard();
});
