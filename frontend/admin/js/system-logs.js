// Sample system activity logs
const systemLogs = [

    {
        id: 801,
        administrator: "Arun Kumar",
        type: "Package",
        description: "Approved Ooty Hill Station Adventure package",
        date: "2026-11-05",
        time: "10:30 AM",
        result: "Successful"
    },

    {
        id: 802,
        administrator: "Priya Sharma",
        type: "Booking",
        description: "Updated booking #602 status to Confirmed",
        date: "2026-11-05",
        time: "11:15 AM",
        result: "Successful"
    },

    {
        id: 803,
        administrator: "Sneha Reddy",
        type: "Customer",
        description: "Updated customer contact information",
        date: "2026-11-05",
        time: "12:20 PM",
        result: "Successful"
    },

    {
        id: 804,
        administrator: "Rahul Raj",
        type: "Login",
        description: "Administrator login attempt",
        date: "2026-11-05",
        time: "01:05 PM",
        result: "Failed"
    },

    {
        id: 805,
        administrator: "Arun Kumar",
        type: "Admin",
        description: "Approved a new administrator account",
        date: "2026-11-04",
        time: "09:45 AM",
        result: "Successful"
    },

    {
        id: 806,
        administrator: "Priya Sharma",
        type: "Permissions",
        description: "Updated Booking Manager permissions",
        date: "2026-11-04",
        time: "02:30 PM",
        result: "Successful"
    },

    {
        id: 807,
        administrator: "Sneha Reddy",
        type: "Provider",
        description: "Reviewed provider registration request",
        date: "2026-11-04",
        time: "03:10 PM",
        result: "Pending"
    },

    {
        id: 808,
        administrator: "Karthik S",
        type: "Logout",
        description: "Administrator logged out",
        date: "2026-11-03",
        time: "05:00 PM",
        result: "Successful"
    },

    {
        id: 809,
        administrator: "Arun Kumar",
        type: "Package",
        description: "Rejected an incomplete tourism package",
        date: "2026-11-03",
        time: "11:40 AM",
        result: "Successful"
    },

    {
        id: 810,
        administrator: "Priya Sharma",
        type: "Booking",
        description: "Attempted to update a booking record",
        date: "2026-11-02",
        time: "04:15 PM",
        result: "Failed"
    }
];

// HTML elements
const systemLogTableBody =
    document.getElementById("systemLogTableBody");

const searchLog = document.getElementById("searchLog");

const activityFilter =
    document.getElementById("activityFilter");

const logStatusFilter =
    document.getElementById("logStatusFilter");

const logDateFilter =
    document.getElementById("logDateFilter");

// Display system logs
function displaySystemLogs() {

    const searchText = searchLog.value.toLowerCase();
    const selectedActivity = activityFilter.value;
    const selectedStatus = logStatusFilter.value;
    const selectedDate = logDateFilter.value;

    systemLogTableBody.replaceChildren();

    const filteredLogs = systemLogs.filter(log => {

        const matchesSearch =
            log.administrator.toLowerCase().includes(searchText) ||
            log.description.toLowerCase().includes(searchText);

        const matchesActivity =
            selectedActivity === "All" ||
            log.type === selectedActivity;

        const matchesStatus =
            selectedStatus === "All" ||
            log.result === selectedStatus;

        const matchesDate =
            selectedDate === "" ||
            log.date === selectedDate;

        return matchesSearch &&
               matchesActivity &&
               matchesStatus &&
               matchesDate;
    });

    filteredLogs.forEach(log => {

        const row = document.createElement("tr");

        const values = [
            log.id,
            log.administrator,
            log.type,
            log.description,
            log.date,
            log.time
        ];

        values.forEach(value => {

            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        // Result status column
        const resultCell = document.createElement("td");
        const resultLabel = document.createElement("span");

        resultLabel.textContent = log.result;
        resultLabel.className =
            `status ${log.result.toLowerCase()}`;

        resultCell.appendChild(resultLabel);
        row.appendChild(resultCell);

        systemLogTableBody.appendChild(row);
    });

    document.getElementById("noLogsMessage").hidden =
        filteredLogs.length !== 0;

    updateLogStatistics();
}

// Update log statistics
function updateLogStatistics() {

    document.getElementById("totalLogs").textContent =
        systemLogs.length;

    document.getElementById("successfulLogs").textContent =
        systemLogs.filter(log => log.result === "Successful").length;

    document.getElementById("failedLogs").textContent =
        systemLogs.filter(log => log.result === "Failed").length;

    document.getElementById("pendingLogs").textContent =
        systemLogs.filter(log => log.result === "Pending").length;
}

// Clear all filters
function clearLogFilters() {

    searchLog.value = "";
    activityFilter.value = "All";
    logStatusFilter.value = "All";
    logDateFilter.value = "";

    displaySystemLogs();
}

// Event listeners
searchLog.addEventListener("input", displaySystemLogs);

activityFilter.addEventListener("change", displaySystemLogs);

logStatusFilter.addEventListener("change", displaySystemLogs);

logDateFilter.addEventListener("change", displaySystemLogs);

document.getElementById("clearLogFilters")
    .addEventListener("click", clearLogFilters);

// Initial display
displaySystemLogs();