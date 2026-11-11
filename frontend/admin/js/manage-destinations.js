// ============================================
// YAADHUM OOORE - MANAGE DESTINATIONS
// Integrated with Shared State & Real Actions
// ============================================

const api = window.YaadhumAPI;
let destinations = api ? api.getDestinations() : [];

const destinationTableBody = document.getElementById("destinationTableBody");
const searchDestination = document.getElementById("searchDestination");
const destinationStatusFilter = document.getElementById("destinationStatusFilter");
const destinationEmptyMessage = document.getElementById("destinationEmptyMessage");
const destinationForm = document.getElementById("destinationForm");

function displayDestinations() {
    if (api) destinations = api.getDestinations();
    if (!destinationTableBody) return;
    destinationTableBody.innerHTML = "";

    const searchText = (searchDestination ? searchDestination.value : "").toLowerCase();
    const selectedStatus = destinationStatusFilter ? destinationStatusFilter.value : "All";

    const filtered = destinations.filter(function(item) {
        const name = (item.name || "").toLowerCase();
        const city = (item.city || "").toLowerCase();
        const status = item.status || "Active";

        const matchesSearch = name.includes(searchText) || city.includes(searchText);
        const matchesStatus = selectedStatus === "All" || status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    if (destinationEmptyMessage) {
        destinationEmptyMessage.hidden = filtered.length !== 0;
    }

    filtered.forEach(function(item) {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = item.id;

        const nameCell = document.createElement("td");
        nameCell.textContent = item.name;

        const locationCell = document.createElement("td");
        locationCell.textContent = `${item.city || item.name}, ${item.state || 'Tamil Nadu'}`;

        const descCell = document.createElement("td");
        descCell.textContent = item.description || "N/A";

        const statusCell = document.createElement("td");
        const status = item.status || "Active";
        const statusLabel = document.createElement("span");
        statusLabel.className = "status " + status.toLowerCase();
        statusLabel.textContent = status;
        statusCell.appendChild(statusLabel);

        const actionCell = document.createElement("td");
        actionCell.style.cssText = "display: flex; gap: 6px;";

        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = status === "Active" ? "Deactivate" : "Activate";
        toggleBtn.className = "action-button " + (status === "Active" ? "reject-button" : "approve-button");
        toggleBtn.onclick = function() {
            item.status = status === "Active" ? "Inactive" : "Active";
            if (api) api.saveDestination(item);
            displayDestinations();
        };
        actionCell.appendChild(toggleBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "action-button reject-button";
        deleteBtn.onclick = function() {
            if (confirm(`Delete destination ${item.name}?`)) {
                if (api) api.deleteDestination(item.id);
                displayDestinations();
            }
        };
        actionCell.appendChild(deleteBtn);

        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(locationCell);
        row.appendChild(descCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        destinationTableBody.appendChild(row);
    });

    updateDestinationStatistics();
}

function updateDestinationStatistics() {
    if (api) destinations = api.getDestinations();
    const total = destinations.length;
    const active = destinations.filter(d => (d.status || "Active") === "Active").length;
    const inactive = destinations.filter(d => d.status === "Inactive").length;

    const elTotal = document.getElementById("totalDestinations");
    const elAct = document.getElementById("activeDestinations");
    const elInact = document.getElementById("inactiveDestinations");

    if (elTotal) elTotal.textContent = total;
    if (elAct) elAct.textContent = active;
    if (elInact) elInact.textContent = inactive;
}

document.addEventListener("DOMContentLoaded", function () {
    if (searchDestination) searchDestination.addEventListener("input", displayDestinations);
    if (destinationStatusFilter) destinationStatusFilter.addEventListener("change", displayDestinations);

    if (destinationForm) {
        destinationForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const name = document.getElementById("destinationName").value.trim();
            const location = document.getElementById("destinationLocation").value.trim();
            const desc = document.getElementById("destinationDescription").value.trim();

            if (name && api) {
                api.saveDestination({
                    name: name,
                    city: location,
                    state: "Tamil Nadu",
                    country: "India",
                    description: desc,
                    status: "Active"
                });
                destinationForm.reset();
                displayDestinations();
            }
        });
    }

    displayDestinations();
});
