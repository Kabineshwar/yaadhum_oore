// Default permissions for each administrator role
const defaultPermissions = {

    "Administrator": {
        Customers: { view: true, add: true, edit: true, delete: false },
        Providers: { view: true, add: true, edit: true, delete: false },
        Destinations: { view: true, add: true, edit: true, delete: false },
        Categories: { view: true, add: true, edit: true, delete: false },
        Packages: { view: true, add: true, edit: true, delete: false },
        Bookings: { view: true, add: false, edit: true, delete: false },
        Reports: { view: true, add: false, edit: false, delete: false }
    },

    "Booking Manager": {
        Customers: { view: true, add: false, edit: false, delete: false },
        Providers: { view: false, add: false, edit: false, delete: false },
        Destinations: { view: true, add: false, edit: false, delete: false },
        Categories: { view: true, add: false, edit: false, delete: false },
        Packages: { view: true, add: false, edit: false, delete: false },
        Bookings: { view: true, add: true, edit: true, delete: false },
        Reports: { view: true, add: false, edit: false, delete: false }
    },

    "Content Manager": {
        Customers: { view: false, add: false, edit: false, delete: false },
        Providers: { view: true, add: false, edit: false, delete: false },
        Destinations: { view: true, add: true, edit: true, delete: false },
        Categories: { view: true, add: true, edit: true, delete: false },
        Packages: { view: true, add: true, edit: true, delete: false },
        Bookings: { view: false, add: false, edit: false, delete: false },
        Reports: { view: false, add: false, edit: false, delete: false }
    },

    "Support Manager": {
        Customers: { view: true, add: false, edit: true, delete: false },
        Providers: { view: true, add: false, edit: false, delete: false },
        Destinations: { view: true, add: false, edit: false, delete: false },
        Categories: { view: true, add: false, edit: false, delete: false },
        Packages: { view: true, add: false, edit: false, delete: false },
        Bookings: { view: true, add: false, edit: true, delete: false },
        Reports: { view: false, add: false, edit: false, delete: false }
    }
};

// Create a separate working copy so defaults remain unchanged
let permissions = JSON.parse(JSON.stringify(defaultPermissions));

const roleSelect = document.getElementById("roleSelect");
const permissionTableBody = document.getElementById("permissionTableBody");
const selectedRoleTitle = document.getElementById("selectedRoleTitle");
const permissionMessage = document.getElementById("permissionMessage");

// Display permissions for the selected role
function displayPermissions() {

    const selectedRole = roleSelect.value;
    const rolePermissions = permissions[selectedRole];

    selectedRoleTitle.textContent = `${selectedRole} Permissions`;

    permissionTableBody.replaceChildren();

    Object.entries(rolePermissions).forEach(([module, actions]) => {

        const row = document.createElement("tr");

        const moduleCell = document.createElement("td");
        moduleCell.textContent = module;
        row.appendChild(moduleCell);

        ["view", "add", "edit", "delete"].forEach(action => {

            const cell = document.createElement("td");
            const checkbox = document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.checked = actions[action];
            checkbox.dataset.module = module;
            checkbox.dataset.action = action;
            checkbox.setAttribute(
                "aria-label",
                `${action} permission for ${module}`
            );

            cell.appendChild(checkbox);
            row.appendChild(cell);
        });

        permissionTableBody.appendChild(row);
    });

    permissionMessage.textContent = "";
}

// Update a permission when a checkbox changes
permissionTableBody.addEventListener("change", function(event) {

    if (event.target.type !== "checkbox") return;

    const selectedRole = roleSelect.value;
    const module = event.target.dataset.module;
    const action = event.target.dataset.action;

    permissions[selectedRole][module][action] = event.target.checked;
});

// Save current permissions
function savePermissions() {

    const selectedRole = roleSelect.value;

    // In this frontend version, saving updates the in-memory data.
    alert(`Permissions for ${selectedRole} saved successfully.`);

    permissionMessage.textContent =
        `Permissions for ${selectedRole} have been updated in this session.`;
}

// Reset selected role to its default permissions
function resetPermissions() {

    const selectedRole = roleSelect.value;

    if (confirm(`Reset permissions for ${selectedRole} to default settings?`)) {

        permissions[selectedRole] =
            JSON.parse(JSON.stringify(defaultPermissions[selectedRole]));

        displayPermissions();

        permissionMessage.textContent =
            `Default permissions restored for ${selectedRole}.`;
    }
}

// Event listeners
roleSelect.addEventListener("change", displayPermissions);

document.getElementById("savePermissionsButton")
    .addEventListener("click", savePermissions);

document.getElementById("resetPermissionsButton")
    .addEventListener("click", resetPermissions);

// Initial display
displayPermissions();