// ============================================
// YAADHUM OOORE - ADMINISTRATOR PERMISSIONS
// Granular Role & Privilege Matrix
// ============================================

const api = window.YaadhumAPI;

function displayPermissions() {
    const admins = api ? api.getAdmins() : [];
    const select = document.querySelector("select");
    if (!select) return;

    select.innerHTML = "";
    admins.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.id;
        opt.textContent = `${a.name} (${a.email})`;
        select.appendChild(opt);
    });

    function loadAdminPerms(adminId) {
        const target = admins.find(a => a.id === adminId);
        if (!target) return;
        const perms = target.permissions || [];
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = perms.includes(cb.value);
        });
    }

    if (admins.length > 0) {
        loadAdminPerms(admins[0].id);
    }

    select.addEventListener("change", function () {
        loadAdminPerms(this.value);
    });

    const form = document.querySelector("form");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            const currentAdmin = admins.find(a => a.id === select.value);
            if (!currentAdmin) return;

            const selectedPerms = [];
            form.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                selectedPerms.push(cb.value);
            });

            currentAdmin.permissions = selectedPerms;
            if (api) api.saveAdmin(currentAdmin);

            alert(`Permissions saved for ${currentAdmin.name}!`);
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    displayPermissions();
});
