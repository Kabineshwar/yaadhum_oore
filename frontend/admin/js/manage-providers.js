// ============================================
// YAADHUM OOORE - MANAGE PROVIDERS
// Integrated with Shared State & Real Actions
// ============================================

const api = window.YaadhumAPI;
let providers = api ? api.getUsers('provider') : [];

const providerTableBody = document.getElementById("providerTableBody");
const searchProvider = document.getElementById("searchProvider");
const providerStatusFilter = document.getElementById("providerStatusFilter");
const providerEmptyMessage = document.getElementById("providerEmptyMessage");

function displayProviders() {
    if (api) providers = api.getUsers('provider');
    if (!providerTableBody) return;
    providerTableBody.innerHTML = "";

    const searchText = (searchProvider ? searchProvider.value : "").toLowerCase();
    const selectedStatus = providerStatusFilter ? providerStatusFilter.value : "All";

    const filtered = providers.filter(function(item) {
        const name = (item.name || "").toLowerCase();
        const biz = (item.business || "").toLowerCase();
        const email = (item.email || "").toLowerCase();
        const loc = (item.location || "").toLowerCase();
        const status = item.status || "Approved";

        const matchesSearch = name.includes(searchText) || biz.includes(searchText) || email.includes(searchText) || loc.includes(searchText);
        const matchesStatus = selectedStatus === "All" || status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    if (providerEmptyMessage) {
        providerEmptyMessage.hidden = filtered.length !== 0;
    }

    filtered.forEach(function(item) {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = item.id;

        const nameCell = document.createElement("td");
        nameCell.innerHTML = `<strong>${item.name}</strong><br><small style="color:#718096;">${item.business || ''}</small>`;

        const businessCell = document.createElement("td");
        businessCell.textContent = item.business || "Independent Host";

        const emailCell = document.createElement("td");
        emailCell.textContent = item.email;

        const phoneCell = document.createElement("td");
        phoneCell.textContent = item.phone || "N/A";

        const locationCell = document.createElement("td");
        locationCell.textContent = item.location || "Tamil Nadu";

        const statusCell = document.createElement("td");
        const status = item.status || "Approved";
        const statusLabel = document.createElement("span");
        statusLabel.className = "status " + status.toLowerCase();
        statusLabel.textContent = status;
        statusCell.appendChild(statusLabel);

        const actionCell = document.createElement("td");
        actionCell.style.cssText = "display: flex; gap: 6px; flex-wrap: wrap;";

        if (status === "Pending") {
            const approveBtn = document.createElement("button");
            approveBtn.textContent = "Approve";
            approveBtn.className = "action-button approve-button";
            approveBtn.onclick = function() {
                if (api) api.updateUserStatus(item.id, "Approved");
                displayProviders();
            };
            actionCell.appendChild(approveBtn);

            const rejectBtn = document.createElement("button");
            rejectBtn.textContent = "Reject";
            rejectBtn.className = "action-button reject-button";
            rejectBtn.onclick = function() {
                if (api) api.updateUserStatus(item.id, "Rejected");
                displayProviders();
            };
            actionCell.appendChild(rejectBtn);
        } else if (status === "Approved") {
            const blockBtn = document.createElement("button");
            blockBtn.textContent = "Block";
            blockBtn.className = "action-button reject-button";
            blockBtn.onclick = function() {
                if (confirm(`Block provider ${item.name}?`)) {
                    if (api) api.updateUserStatus(item.id, "Blocked");
                    displayProviders();
                }
            };
            actionCell.appendChild(blockBtn);
        } else {
            const unblockBtn = document.createElement("button");
            unblockBtn.textContent = "Activate";
            unblockBtn.className = "action-button approve-button";
            unblockBtn.onclick = function() {
                if (api) api.updateUserStatus(item.id, "Approved");
                displayProviders();
            };
            actionCell.appendChild(unblockBtn);
        }

        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(businessCell);
        row.appendChild(emailCell);
        row.appendChild(phoneCell);
        row.appendChild(locationCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        providerTableBody.appendChild(row);
    });

    updateProviderStatistics();
}

function updateProviderStatistics() {
    if (api) providers = api.getUsers('provider');
    const total = providers.length;
    const approved = providers.filter(p => (p.status || "Approved") === "Approved").length;
    const pending = providers.filter(p => p.status === "Pending").length;
    const blocked = providers.filter(p => p.status === "Blocked" || p.status === "Rejected").length;

    const elTotal = document.getElementById("totalProviders");
    const elApp = document.getElementById("activeProviders") || document.getElementById("approvedProviders");
    const elPend = document.getElementById("pendingProviders");
    const elBlock = document.getElementById("inactiveProviders") || document.getElementById("blockedProviders");

    if (elTotal) elTotal.textContent = total;
    if (elApp) elApp.textContent = approved;
    if (elPend) elPend.textContent = pending;
    if (elBlock) elBlock.textContent = blocked;
}

document.addEventListener("DOMContentLoaded", function () {
    if (searchProvider) searchProvider.addEventListener("input", displayProviders);
    if (providerStatusFilter) providerStatusFilter.addEventListener("change", displayProviders);
    displayProviders();
});
