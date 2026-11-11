// ============================================
// YAADHUM OOORE - MANAGE CATEGORIES
// Integrated with Shared State & Real Actions
// ============================================

const api = window.YaadhumAPI;
let categories = api ? api.getCategories() : [];

const categoryTableBody = document.getElementById("categoryTableBody");
const searchCategory = document.getElementById("searchCategory");
const categoryStatusFilter = document.getElementById("categoryStatusFilter");
const categoryEmptyMessage = document.getElementById("categoryEmptyMessage");
const categoryForm = document.getElementById("categoryForm");

function displayCategories() {
    if (api) categories = api.getCategories();
    if (!categoryTableBody) return;
    categoryTableBody.innerHTML = "";

    const searchText = (searchCategory ? searchCategory.value : "").toLowerCase();
    const selectedStatus = categoryStatusFilter ? categoryStatusFilter.value : "All";

    const filtered = categories.filter(function(item) {
        const name = (item.name || "").toLowerCase();
        const status = item.status || "Active";
        const matchesSearch = name.includes(searchText);
        const matchesStatus = selectedStatus === "All" || status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    if (categoryEmptyMessage) {
        categoryEmptyMessage.hidden = filtered.length !== 0;
    }

    filtered.forEach(function(item) {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = item.id;

        const nameCell = document.createElement("td");
        nameCell.textContent = item.name;

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
            if (api) api.saveCategory(item);
            displayCategories();
        };
        actionCell.appendChild(toggleBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "action-button reject-button";
        deleteBtn.onclick = function() {
            if (confirm(`Delete category ${item.name}?`)) {
                if (api) api.deleteCategory(item.id);
                displayCategories();
            }
        };
        actionCell.appendChild(deleteBtn);

        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(descCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        categoryTableBody.appendChild(row);
    });

    updateCategoryStatistics();
}

function updateCategoryStatistics() {
    if (api) categories = api.getCategories();
    const total = categories.length;
    const active = categories.filter(c => (c.status || "Active") === "Active").length;
    const inactive = categories.filter(c => c.status === "Inactive").length;

    const elTotal = document.getElementById("totalCategories");
    const elAct = document.getElementById("activeCategories");
    const elInact = document.getElementById("inactiveCategories");

    if (elTotal) elTotal.textContent = total;
    if (elAct) elAct.textContent = active;
    if (elInact) elInact.textContent = inactive;
}

document.addEventListener("DOMContentLoaded", function () {
    if (searchCategory) searchCategory.addEventListener("input", displayCategories);
    if (categoryStatusFilter) categoryStatusFilter.addEventListener("change", displayCategories);

    if (categoryForm) {
        categoryForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const name = document.getElementById("categoryName").value.trim();
            const desc = document.getElementById("categoryDescription").value.trim();

            if (name && api) {
                api.saveCategory({
                    name: name,
                    description: desc,
                    status: "Active"
                });
                categoryForm.reset();
                displayCategories();
            }
        });
    }

    displayCategories();
});
