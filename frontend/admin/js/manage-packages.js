// ============================================
// YAADHUM OOORE - MANAGE PACKAGES
// Integrated with Shared State & Real Actions
// ============================================

const api = window.YaadhumAPI;
let packages = api ? api.getPackages() : [];

// SELECT HTML ELEMENTS
const packageTableBody = document.getElementById("packageTableBody");
const packageSearch = document.getElementById("searchPackage");
const packageStatusFilter = document.getElementById("packageStatusFilter");
const packageEmptyMessage = document.getElementById("packageEmptyMessage");

// DISPLAY PACKAGES IN THE TABLE
function displayPackages() {
    if (api) packages = api.getPackages();
    packageTableBody.innerHTML = "";

    const searchText = (packageSearch ? packageSearch.value : "").toLowerCase();
    const selectedStatus = packageStatusFilter ? packageStatusFilter.value : "All";

    const filteredPackages = packages.filter(function(item) {
        const title = (item.title || item.name || "").toLowerCase();
        const prov = (item.provider_name || item.provider || "").toLowerCase();
        const dest = (item.destination || "").toLowerCase();

        const matchesSearch = title.includes(searchText) || prov.includes(searchText) || dest.includes(searchText);
        const matchesStatus = selectedStatus === "All" || item.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    if (packageEmptyMessage) {
        packageEmptyMessage.hidden = filteredPackages.length !== 0;
    }

    filteredPackages.forEach(function(item) {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = item.id;

        const nameCell = document.createElement("td");
        nameCell.innerHTML = `<strong>${item.title || item.name}</strong><br><small style="color:#718096;">${item.category || ''} &bull; ${item.duration || ''}</small>`;

        const providerCell = document.createElement("td");
        providerCell.textContent = item.provider_name || item.provider || "Local Provider";

        const destinationCell = document.createElement("td");
        destinationCell.textContent = item.destination;

        const priceCell = document.createElement("td");
        priceCell.textContent = "₹" + Number(item.price).toLocaleString("en-IN");

        const statusCell = document.createElement("td");
        const statusLabel = document.createElement("span");
        statusLabel.className = "status " + (item.status || "approved").toLowerCase();
        statusLabel.textContent = item.status || "Approved";
        statusCell.appendChild(statusLabel);

        const actionCell = document.createElement("td");
        actionCell.style.cssText = "display: flex; gap: 6px; flex-wrap: wrap;";

        const viewButton = document.createElement("button");
        viewButton.textContent = "View";
        viewButton.className = "action-button view-button";
        viewButton.onclick = function() {
            alert(`Package: ${item.title || item.name}\nDestination: ${item.destination}\nPrice: ₹${item.price}\nSeats Available: ${item.available_seats || item.capacity}\nProvider: ${item.provider_name || item.provider}\nDescription: ${item.description || 'N/A'}`);
        };
        actionCell.appendChild(viewButton);

        if (item.status === "Pending") {
            const approveButton = document.createElement("button");
            approveButton.textContent = "Approve";
            approveButton.className = "action-button approve-button";
            approveButton.onclick = function() {
                updatePackageStatus(item.id, "Approved");
            };

            const rejectButton = document.createElement("button");
            rejectButton.textContent = "Reject";
            rejectButton.className = "action-button reject-button";
            rejectButton.onclick = function() {
                updatePackageStatus(item.id, "Rejected");
            };

            actionCell.appendChild(approveButton);
            actionCell.appendChild(rejectButton);
        } else if (item.status === "Approved") {
            const disableButton = document.createElement("button");
            disableButton.textContent = "Disable";
            disableButton.className = "action-button reject-button";
            disableButton.onclick = function() {
                updatePackageStatus(item.id, "Inactive");
            };
            actionCell.appendChild(disableButton);
        } else {
            const enableButton = document.createElement("button");
            enableButton.textContent = "Activate";
            enableButton.className = "action-button approve-button";
            enableButton.onclick = function() {
                updatePackageStatus(item.id, "Approved");
            };
            actionCell.appendChild(enableButton);
        }

        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(providerCell);
        row.appendChild(destinationCell);
        row.appendChild(priceCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        packageTableBody.appendChild(row);
    });

    updatePackageStatistics();
}

// UPDATE PACKAGE STATISTICS
function updatePackageStatistics() {
    if (api) packages = api.getPackages();
    const total = packages.length;
    const approved = packages.filter(i => i.status === "Approved").length;
    const pending = packages.filter(i => i.status === "Pending").length;
    const rejected = packages.filter(i => i.status === "Rejected" || i.status === "Inactive").length;

    const elTotal = document.getElementById("totalPackages");
    const elApp = document.getElementById("approvedPackages");
    const elPen = document.getElementById("pendingPackages");
    const elRej = document.getElementById("rejectedPackages");

    if (elTotal) elTotal.textContent = total;
    if (elApp) elApp.textContent = approved;
    if (elPen) elPen.textContent = pending;
    if (elRej) elRej.textContent = rejected;
}

// APPROVE OR REJECT A PACKAGE
function updatePackageStatus(packageId, newStatus) {
    const adminUser = window.YaadhumSession ? window.YaadhumSession.getUser() : null;
    const adminName = adminUser ? adminUser.name : "Admin";

    if (api) {
        api.updatePackageStatus(packageId, newStatus, adminName);
    }
    displayPackages();
}

// EVENT LISTENERS
document.addEventListener("DOMContentLoaded", function () {
    if (packageSearch) packageSearch.addEventListener("input", displayPackages);
    if (packageStatusFilter) packageStatusFilter.addEventListener("change", displayPackages);
    displayPackages();
});
