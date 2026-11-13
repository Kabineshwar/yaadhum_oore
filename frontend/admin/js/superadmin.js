// ===============================================
// YAADHUM OOORE - SUPER ADMIN DASHBOARD JAVASCRIPT
// ===============================================

function checkSuperAdminAuth() {
  const path = window.location.pathname;
  if (path.includes('admin-login.html')) return;
  let user = null;
  try {
    const raw = sessionStorage.getItem('yaadhum_session') || localStorage.getItem('yaadhum_session') || localStorage.getItem('yaadhum_admin_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      user = parsed.user || parsed;
    }
  } catch(e) {}

  if (!user) {
    window.location.href = 'admin-login.html';
    return;
  }
  if (user.role !== 'superadmin') {
    alert('Access Restricted: Super Administrator privileges required.');
    window.location.href = 'admin-dashboard.html';
    return;
  }
}
checkSuperAdminAuth();

// Sample administrator data

const administrators = [

    {
        id: 701,
        name: "Arun Kumar",
        status: "Active"
    },

    {
        id: 702,
        name: "Priya Sharma",
        status: "Active"
    },

    {
        id: 703,
        name: "Rahul Raj",
        status: "Pending"
    },

    {
        id: 704,
        name: "Sneha Reddy",
        status: "Active"
    },

    {
        id: 705,
        name: "Karthik S",
        status: "Inactive"
    }

];


// Sample system activity data

const systemActivities = [

    {
        id: 801,
        admin: "Arun Kumar",
        activity: "Approved a tourism package",
        date: "2026-11-05",
        status: "Successful"
    },

    {
        id: 802,
        admin: "Priya Sharma",
        activity: "Updated destination information",
        date: "2026-11-05",
        status: "Successful"
    },

    {
        id: 803,
        admin: "Sneha Reddy",
        activity: "Modified customer information",
        date: "2026-11-04",
        status: "Successful"
    },

    {
        id: 804,
        admin: "Rahul Raj",
        activity: "Requested administrator access",
        date: "2026-11-04",
        status: "Pending"
    },

    {
        id: 805,
        admin: "Arun Kumar",
        activity: "Reviewed booking information",
        date: "2026-11-03",
        status: "Successful"
    }

];


// Display current date

function displaySuperAdminDate() {

    const today = new Date();

    document.getElementById("superAdminDate").textContent =
        "Date: " + today.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

}


// Display dashboard statistics

function displayAdminStatistics() {

    const total = administrators.length;

    const active = administrators.filter(function(admin) {
        return admin.status === "Active";
    }).length;

    const pending = administrators.filter(function(admin) {
        return admin.status === "Pending";
    }).length;

    document.getElementById("totalAdmins").textContent = total;

    document.getElementById("activeAdmins").textContent = active;

    document.getElementById("pendingAdmins").textContent = pending;

    document.getElementById("totalActivities").textContent =
        systemActivities.length;

}


// Display recent system activities

function displaySystemActivities() {

    const tableBody = document.getElementById("activityTableBody");

    tableBody.textContent = "";

    systemActivities.forEach(function(activity) {

        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = activity.id;

        const adminCell = document.createElement("td");
        adminCell.textContent = activity.admin;

        const activityCell = document.createElement("td");
        activityCell.textContent = activity.activity;

        const dateCell = document.createElement("td");
        dateCell.textContent = activity.date;

        const statusCell = document.createElement("td");
        statusCell.textContent = activity.status;

        statusCell.className =
            activity.status === "Successful"
                ? "status approved"
                : "status pending";

        row.appendChild(idCell);
        row.appendChild(adminCell);
        row.appendChild(activityCell);
        row.appendChild(dateCell);
        row.appendChild(statusCell);

        tableBody.appendChild(row);

    });

}


// Initialize dashboard

displaySuperAdminDate();

displayAdminStatistics();

displaySystemActivities();