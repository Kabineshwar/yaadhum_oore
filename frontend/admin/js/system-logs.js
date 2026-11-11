// ============================================
// YAADHUM OOORE - SYSTEM AUDIT LOGS
// Integrated System Activity Journal
// ============================================

const api = window.YaadhumAPI;
let systemLogs = api ? api.getSystemLogs() : [];

function displaySystemLogs() {
    if (api) systemLogs = api.getSystemLogs();
    const tbody = document.querySelector("main table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const searchInput = document.querySelector('input[type="text"]');
    const q = (searchInput ? searchInput.value : "").toLowerCase();

    const filtered = systemLogs.filter(l => {
        return (l.actor || "").toLowerCase().includes(q) ||
               (l.action || "").toLowerCase().includes(q) ||
               (l.description || "").toLowerCase().includes(q);
    });

    filtered.forEach(log => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${log.log_id}</strong></td>
            <td><strong>${log.actor}</strong></td>
            <td><span class="badge" style="background:#EBF8FF; color:#2B6CB0; padding:2px 8px; border-radius:4px;">${log.action}</span></td>
            <td>${log.description}</td>
            <td>${log.ip || '127.0.0.1'}</td>
            <td><small style="color:#718096;">${log.timestamp}</small></td>
        `;
        tbody.appendChild(row);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector('input[type="text"]');
    if (searchInput) searchInput.addEventListener("input", displaySystemLogs);
    displaySystemLogs();
});
