// ============================================
// YAADHUM OOORE - DESTINATION UPDATES (LOCAL PULSE)
// Integrated with Shared State & Real Actions
// ============================================

const api = window.YaadhumAPI;
let updates = api ? api.getDestinationUpdates() : [];

const updatesTableBody = document.getElementById("updateTableBody") || document.getElementById("destinationUpdateTableBody");
const searchUpdate = document.getElementById("searchUpdate");
const updateCategoryFilter = document.getElementById("updateCategoryFilter");
const updateForm = document.getElementById("updateForm") || document.getElementById("destinationUpdateForm");

function displayDestinationUpdates() {
    if (api) updates = api.getDestinationUpdates();
    const tbody = document.querySelector("main table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const searchText = (searchUpdate ? searchUpdate.value : "").toLowerCase();

    const filtered = updates.filter(function(item) {
        const title = (item.title || "").toLowerCase();
        const dest = (item.destination || "").toLowerCase();
        const cat = (item.category || "").toLowerCase();
        return title.includes(searchText) || dest.includes(searchText) || cat.includes(searchText);
    });

    filtered.forEach(function(item) {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = item.update_id || "UPD-1";

        const titleCell = document.createElement("td");
        titleCell.innerHTML = `<strong>${item.title}</strong><br><small style="color:#718096;">${item.description || ''}</small>`;

        const destCell = document.createElement("td");
        destCell.textContent = item.destination;

        const catCell = document.createElement("td");
        catCell.textContent = item.category || "Advisory";

        const dateCell = document.createElement("td");
        dateCell.textContent = item.date_posted || "2026-11-08";

        const statusCell = document.createElement("td");
        const status = item.status || "Active";
        const statusLabel = document.createElement("span");
        statusLabel.className = "status " + status.toLowerCase();
        statusLabel.textContent = status;
        statusCell.appendChild(statusLabel);

        const actionCell = document.createElement("td");
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.className = "action-button reject-button";
        delBtn.onclick = function() {
            if (confirm(`Delete advisory "${item.title}"?`)) {
                if (api) api.deleteDestinationUpdate(item.update_id);
                displayDestinationUpdates();
            }
        };
        actionCell.appendChild(delBtn);

        row.appendChild(idCell);
        row.appendChild(titleCell);
        row.appendChild(destCell);
        row.appendChild(catCell);
        row.appendChild(dateCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        tbody.appendChild(row);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    if (searchUpdate) searchUpdate.addEventListener("input", displayDestinationUpdates);

    const form = document.querySelector("form");
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            const titleInput = form.querySelector('input[type="text"]');
            const destSelect = form.querySelector('select');
            const descArea = form.querySelector('textarea');

            if (titleInput && api) {
                api.saveDestinationUpdate({
                    title: titleInput.value.trim(),
                    destination: destSelect ? destSelect.value : "Tamil Nadu",
                    category: "Advisory",
                    description: descArea ? descArea.value.trim() : "",
                    status: "Active"
                });
                form.reset();
                displayDestinationUpdates();
            }
        });
    }

    displayDestinationUpdates();
});
