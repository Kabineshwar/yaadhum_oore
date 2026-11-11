// ============================================
// YAADHUM OOORE - MANAGE CUSTOMERS
// Integrated with Shared State & Real User Actions
// ============================================

const api = window.YaadhumAPI;
let customers = api ? api.getUsers('customer') : [];

const customerTableBody = document.getElementById("customerTableBody");
const searchCustomer = document.getElementById("searchCustomer");
const customerStatusFilter = document.getElementById("customerStatusFilter");
const customerEmptyMessage = document.getElementById("customerEmptyMessage");

function displayCustomers() {
    if (api) customers = api.getUsers('customer');
    if (!customerTableBody) return;
    customerTableBody.innerHTML = "";

    const searchText = (searchCustomer ? searchCustomer.value : "").toLowerCase();
    const selectedStatus = customerStatusFilter ? customerStatusFilter.value : "All";

    const filtered = customers.filter(function(item) {
        const name = (item.name || "").toLowerCase();
        const email = (item.email || "").toLowerCase();
        const phone = (item.phone || "").toLowerCase();
        const loc = (item.city || item.location || "").toLowerCase();
        const status = item.status || "Active";

        const matchesSearch = name.includes(searchText) || email.includes(searchText) || phone.includes(searchText) || loc.includes(searchText);
        const matchesStatus = selectedStatus === "All" || status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    if (customerEmptyMessage) {
        customerEmptyMessage.hidden = filtered.length !== 0;
    }

    filtered.forEach(function(item) {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = item.id;

        const nameCell = document.createElement("td");
        nameCell.textContent = item.name;

        const emailCell = document.createElement("td");
        emailCell.textContent = item.email;

        const phoneCell = document.createElement("td");
        phoneCell.textContent = item.phone || "N/A";

        const locationCell = document.createElement("td");
        locationCell.textContent = item.city || item.location || "Tamil Nadu";

        const dateCell = document.createElement("td");
        dateCell.textContent = item.created_at || item.joinedDate || "2026-08-01";

        const statusCell = document.createElement("td");
        const status = item.status || "Active";
        const statusLabel = document.createElement("span");
        statusLabel.className = "status " + status.toLowerCase();
        statusLabel.textContent = status;
        statusCell.appendChild(statusLabel);

        const actionCell = document.createElement("td");
        const toggleBtn = document.createElement("button");
        if (status === "Active") {
            toggleBtn.textContent = "Block";
            toggleBtn.className = "action-button reject-button";
            toggleBtn.onclick = function() {
                if (confirm(`Block customer ${item.name}?`)) {
                    if (api) api.updateUserStatus(item.id, "Blocked");
                    displayCustomers();
                }
            };
        } else {
            toggleBtn.textContent = "Unblock";
            toggleBtn.className = "action-button approve-button";
            toggleBtn.onclick = function() {
                if (api) api.updateUserStatus(item.id, "Active");
                displayCustomers();
            };
        }
        actionCell.appendChild(toggleBtn);

        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(emailCell);
        row.appendChild(phoneCell);
        row.appendChild(locationCell);
        row.appendChild(dateCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        customerTableBody.appendChild(row);
    });

    updateCustomerStatistics();
}

function updateCustomerStatistics() {
    if (api) customers = api.getUsers('customer');
    const total = customers.length;
    const active = customers.filter(c => (c.status || "Active") === "Active").length;
    const blocked = customers.filter(c => c.status === "Blocked" || c.status === "Inactive").length;

    const elTotal = document.getElementById("totalCustomers");
    const elAct = document.getElementById("activeCustomers");
    const elInact = document.getElementById("inactiveCustomers");

    if (elTotal) elTotal.textContent = total;
    if (elAct) elAct.textContent = active;
    if (elInact) elInact.textContent = blocked;
}

document.addEventListener("DOMContentLoaded", function () {
    if (searchCustomer) searchCustomer.addEventListener("input", displayCustomers);
    if (customerStatusFilter) customerStatusFilter.addEventListener("change", displayCustomers);
    displayCustomers();
});
