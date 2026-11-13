// Sample administrator records
let administrators = [
    {
        id: 701,
        name: "Arun Kumar",
        email: "arun@yaadhumooore.com",
        role: "Administrator",
        status: "Active"
    },
    {
        id: 702,
        name: "Priya Sharma",
        email: "priya@yaadhumooore.com",
        role: "Booking Manager",
        status: "Active"
    },
    {
        id: 703,
        name: "Rahul Raj",
        email: "rahul@yaadhumooore.com",
        role: "Content Manager",
        status: "Pending"
    },
    {
        id: 704,
        name: "Sneha Reddy",
        email: "sneha@yaadhumooore.com",
        role: "Support Manager",
        status: "Active"
    },
    {
        id: 705,
        name: "Karthik S",
        email: "karthik@yaadhumooore.com",
        role: "Administrator",
        status: "Inactive"
    }
];

let nextAdminId = 706;

// HTML elements
const adminTableBody = document.getElementById("adminTableBody");
const searchAdmin = document.getElementById("searchAdmin");
const adminStatusFilter = document.getElementById("adminStatusFilter");
const adminDialog = document.getElementById("adminDialog");
const adminForm = document.getElementById("adminForm");

// Display administrators in the table
function displayAdministrators() {

    const searchText = searchAdmin.value.toLowerCase();
    const selectedStatus = adminStatusFilter.value;

    adminTableBody.replaceChildren();

    const filteredAdmins = administrators.filter(admin => {

        const matchesSearch =
            admin.name.toLowerCase().includes(searchText) ||
            admin.email.toLowerCase().includes(searchText);

        const matchesStatus =
            selectedStatus === "All" ||
            admin.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    filteredAdmins.forEach(admin => {

        const row = document.createElement("tr");

        const values = [
            admin.id,
            admin.name,
            admin.email,
            admin.role
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        // Status column
        const statusCell = document.createElement("td");
        const statusLabel = document.createElement("span");

        statusLabel.textContent = admin.status;
        statusLabel.className = `status ${admin.status.toLowerCase()}`;

        statusCell.appendChild(statusLabel);
        row.appendChild(statusCell);

        // Actions column
        const actionsCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "view-button";
        editButton.dataset.action = "edit";
        editButton.dataset.id = admin.id;

        actionsCell.appendChild(editButton);

        if (admin.status === "Pending") {

            const approveButton = document.createElement("button");
            approveButton.textContent = "Approve";
            approveButton.className = "approve-button";
            approveButton.dataset.action = "approve";
            approveButton.dataset.id = admin.id;

            const rejectButton = document.createElement("button");
            rejectButton.textContent = "Reject";
            rejectButton.className = "reject-button";
            rejectButton.dataset.action = "reject";
            rejectButton.dataset.id = admin.id;

            actionsCell.appendChild(approveButton);
            actionsCell.appendChild(rejectButton);

        } else {

            const statusButton = document.createElement("button");

            statusButton.textContent =
                admin.status === "Active" ? "Deactivate" : "Activate";

            statusButton.className =
                admin.status === "Active" ? "reject-button" : "approve-button";

            statusButton.dataset.action = "toggle";
            statusButton.dataset.id = admin.id;

            actionsCell.appendChild(statusButton);
        }

        row.appendChild(actionsCell);
        adminTableBody.appendChild(row);
    });

    document.getElementById("noAdminsMessage").hidden =
        filteredAdmins.length !== 0;

    updateAdminStatistics();
}

// Update administrator statistics
function updateAdminStatistics() {

    document.getElementById("totalAdminsCount").textContent =
        administrators.length;

    document.getElementById("activeAdminsCount").textContent =
        administrators.filter(admin => admin.status === "Active").length;

    document.getElementById("pendingAdminsCount").textContent =
        administrators.filter(admin => admin.status === "Pending").length;

    document.getElementById("inactiveAdminsCount").textContent =
        administrators.filter(admin => admin.status === "Inactive").length;
}

// Open dialog to add a new administrator
function openAddAdminDialog() {

    adminForm.reset();

    document.getElementById("adminId").value = "";
    document.getElementById("adminDialogTitle").textContent =
        "Add Administrator";

    adminDialog.showModal();
}

// Open dialog to edit an existing administrator
function editAdministrator(id) {

    const admin = administrators.find(item => item.id === id);

    if (!admin) return;

    document.getElementById("adminId").value = admin.id;
    document.getElementById("adminName").value = admin.name;
    document.getElementById("adminEmail").value = admin.email;
    document.getElementById("adminRole").value = admin.role;

    document.getElementById("adminDialogTitle").textContent =
        "Edit Administrator";

    adminDialog.showModal();
}

// Add or update administrator
function saveAdministrator(event) {

    event.preventDefault();

    const id = document.getElementById("adminId").value;
    const name = document.getElementById("adminName").value.trim();
    const email = document.getElementById("adminEmail").value.trim();
    const role = document.getElementById("adminRole").value;

    if (!name || !email) {
        alert("Please fill in all required fields.");
        return;
    }

    // Check whether the email is already used
    const duplicateEmail = administrators.some(admin =>
        admin.email.toLowerCase() === email.toLowerCase() &&
        admin.id !== Number(id)
    );

    if (duplicateEmail) {
        alert("An administrator with this email already exists.");
        return;
    }

    if (id) {

        // Update existing administrator
        const admin = administrators.find(item => item.id === Number(id));

        if (admin) {
            admin.name = name;
            admin.email = email;
            admin.role = role;
        }

        alert("Administrator details updated successfully.");

    } else {

        // Add new administrator with Pending status
        const newAdmin = {
            id: nextAdminId++,
            name: name,
            email: email,
            role: role,
            status: "Pending"
        };

        administrators.push(newAdmin);

        alert("Administrator added. Approval is pending.");
    }

    adminDialog.close();
    displayAdministrators();
}

// Approve a pending administrator
function approveAdministrator(id) {

    const admin = administrators.find(item => item.id === id);

    if (!admin || admin.status !== "Pending") return;

    if (confirm(`Approve ${admin.name} as an administrator?`)) {

        admin.status = "Active";

        alert("Administrator approved successfully.");
        displayAdministrators();
    }
}

// Reject a pending administrator
function rejectAdministrator(id) {

    const admin = administrators.find(item => item.id === id);

    if (!admin || admin.status !== "Pending") return;

    if (confirm(`Reject the administrator request from ${admin.name}?`)) {

        admin.status = "Inactive";

        alert("Administrator request rejected.");
        displayAdministrators();
    }
}

// Activate or deactivate an administrator
function toggleAdministratorStatus(id) {

    const admin = administrators.find(item => item.id === id);

    if (!admin) return;

    const newStatus = admin.status === "Active" ? "Inactive" : "Active";

    if (confirm(`${newStatus} ${admin.name}'s account?`)) {

        admin.status = newStatus;

        alert(`Administrator account ${newStatus.toLowerCase()}.`);
        displayAdministrators();
    }
}

// Handle clicks on table action buttons
adminTableBody.addEventListener("click", function(event) {

    const button = event.target.closest("button");

    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "edit") {
        editAdministrator(id);
    } else if (action === "approve") {
        approveAdministrator(id);
    } else if (action === "reject") {
        rejectAdministrator(id);
    } else if (action === "toggle") {
        toggleAdministratorStatus(id);
    }
});

// Event listeners
document.getElementById("addAdminButton")
    .addEventListener("click", openAddAdminDialog);

document.getElementById("cancelAdminButton")
    .addEventListener("click", function() {
        adminDialog.close();
    });

adminForm.addEventListener("submit", saveAdministrator);

searchAdmin.addEventListener("input", displayAdministrators);

adminStatusFilter.addEventListener("change", displayAdministrators);

// Initial display
displayAdministrators();