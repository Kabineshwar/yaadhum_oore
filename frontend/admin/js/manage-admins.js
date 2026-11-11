// ============================================
// YAADHUM OOORE - MANAGE ADMINISTRATORS
// Super Admin Administrator Accounts
// ============================================

const api = window.YaadhumAPI;
let administrators = api ? api.getAdmins() : [];

function displayAdmins() {
    if (api) administrators = api.getAdmins();
    const tbody = document.querySelector("main table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    administrators.forEach(admin => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${admin.id}</strong></td>
            <td><strong>${admin.name}</strong></td>
            <td>${admin.email}</td>
            <td>${admin.phone || 'N/A'}</td>
            <td><span class="status ${(admin.status || 'Active').toLowerCase()}">${admin.status || 'Active'}</span></td>
            <td>
                <button class="action-button approve-button btn-toggle-admin" data-id="${admin.id}">
                    ${admin.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
                <button class="action-button reject-button btn-delete-admin" data-id="${admin.id}">
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll(".btn-toggle-admin").forEach(btn => {
        btn.onclick = function() {
            const id = this.getAttribute("data-id");
            const a = administrators.find(x => x.id === id);
            if (a) {
                a.status = a.status === 'Active' ? 'Inactive' : 'Active';
                if (api) api.saveAdmin(a);
                displayAdmins();
            }
        };
    });

    document.querySelectorAll(".btn-delete-admin").forEach(btn => {
        btn.onclick = function() {
            const id = this.getAttribute("data-id");
            if (confirm("Delete this administrator account?")) {
                if (api) api.deleteAdmin(id);
                displayAdmins();
            }
        };
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
            if (inputs.length >= 2 && api) {
                api.saveAdmin({
                    name: inputs[0].value.trim(),
                    email: inputs[1].value.trim(),
                    phone: inputs[2] ? inputs[2].value.trim() : "",
                    status: "Active",
                    permissions: ['customers', 'packages', 'bookings']
                });
                form.reset();
                displayAdmins();
            }
        });
    }
    displayAdmins();
});
