// Sample platform statistics

const reportData = {

    customers: 250,

    providers: 35,

    bookings: [

        {
            id: 601,
            destination: "Ooty",
            amount: 9000,
            status: "Pending"
        },

        {
            id: 602,
            destination: "Madurai",
            amount: 9000,
            status: "Confirmed"
        },

        {
            id: 603,
            destination: "Pondicherry",
            amount: 11000,
            status: "Completed"
        },

        {
            id: 604,
            destination: "Kodaikanal",
            amount: 16000,
            status: "Cancelled"
        },

        {
            id: 605,
            destination: "Thanjavur",
            amount: 5000,
            status: "Pending"
        },

        {
            id: 606,
            destination: "Ooty",
            amount: 4500,
            status: "Confirmed"
        },

        {
            id: 607,
            destination: "Madurai",
            amount: 3000,
            status: "Completed"
        }

    ]

};


// Format amount into Indian currency

function formatCurrency(amount) {

    return "₹" + amount.toLocaleString("en-IN");

}


// Calculate total revenue

function calculateRevenue() {

    let revenue = 0;

    reportData.bookings.forEach(function(booking) {

        if (
            booking.status === "Confirmed" ||
            booking.status === "Completed"
        ) {

            revenue += booking.amount;

        }

    });

    return revenue;

}


// Calculate booking counts by status

function calculateBookingStatus(status) {

    return reportData.bookings.filter(function(booking) {

        return booking.status === status;

    }).length;

}


// Display overall statistics

function displayReportSummary() {

    document.getElementById("reportCustomers").textContent =
        reportData.customers;

    document.getElementById("reportProviders").textContent =
        reportData.providers;

    document.getElementById("reportBookings").textContent =
        reportData.bookings.length;

    document.getElementById("reportRevenue").textContent =
        formatCurrency(calculateRevenue());

}


// Display booking status statistics

function displayBookingStatistics() {

    document.getElementById("reportPending").textContent =
        calculateBookingStatus("Pending");

    document.getElementById("reportConfirmed").textContent =
        calculateBookingStatus("Confirmed");

    document.getElementById("reportCompleted").textContent =
        calculateBookingStatus("Completed");

    document.getElementById("reportCancelled").textContent =
        calculateBookingStatus("Cancelled");

}


// Generate booking status chart

function displayBookingChart() {

    const chart = document.getElementById("bookingChart");

    chart.textContent = "";

    const statuses = [
        "Pending",
        "Confirmed",
        "Completed",
        "Cancelled"
    ];

    const colors = {
        Pending: "#ffc107",
        Confirmed: "#0d6efd",
        Completed: "#198754",
        Cancelled: "#dc3545"
    };

    const total = reportData.bookings.length;

    statuses.forEach(function(status) {

        const count = calculateBookingStatus(status);

        const percentage = total === 0
            ? 0
            : (count / total) * 100;

        const item = document.createElement("div");
        item.className = "chart-item";

        const label = document.createElement("div");
        label.className = "chart-label";

        const statusName = document.createElement("span");
        statusName.textContent = status;

        const countText = document.createElement("span");
        countText.textContent = count + " bookings";

        label.appendChild(statusName);
        label.appendChild(countText);

        const barBackground = document.createElement("div");
        barBackground.className = "chart-bar-background";

        const bar = document.createElement("div");
        bar.className = "chart-bar";

        bar.style.width = percentage + "%";
        bar.style.backgroundColor = colors[status];

        barBackground.appendChild(bar);

        item.appendChild(label);
        item.appendChild(barBackground);

        chart.appendChild(item);

    });

}


// Display popular destinations

function displayPopularDestinations() {

    const destinationCounts = {};

    reportData.bookings.forEach(function(booking) {

        const destination = booking.destination;

        destinationCounts[destination] =
            (destinationCounts[destination] || 0) + 1;

    });


    const sortedDestinations = Object.entries(destinationCounts)
        .sort(function(a, b) {
            return b[1] - a[1];
        });


    const tableBody =
        document.getElementById("popularDestinationBody");

    tableBody.textContent = "";

    const highestCount = sortedDestinations.length > 0
        ? sortedDestinations[0][1]
        : 0;

    sortedDestinations.forEach(function(item) {

        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = item[0];

        const countCell = document.createElement("td");
        countCell.textContent = item[1];

        const popularityCell = document.createElement("td");

        const percentage = highestCount === 0
            ? 0
            : (item[1] / highestCount) * 100;

        const progress = document.createElement("div");
        progress.className = "popularity-background";

        const progressBar = document.createElement("div");
        progressBar.className = "popularity-bar";
        progressBar.style.width = percentage + "%";

        progress.appendChild(progressBar);

        popularityCell.appendChild(progress);

        row.appendChild(nameCell);
        row.appendChild(countCell);
        row.appendChild(popularityCell);

        tableBody.appendChild(row);

    });

}


// Display revenue report

function displayRevenueReport() {

    const revenue = calculateRevenue();

    document.getElementById("revenueAmount").textContent =
        formatCurrency(revenue);

    const revenueBookings = reportData.bookings.filter(function(booking) {

        return (
            booking.status === "Confirmed" ||
            booking.status === "Completed"
        );

    }).length;

    document.getElementById("revenueDescription").textContent =
        revenueBookings + " bookings included in this revenue calculation.";

}


// Run all report functions

function generateReports() {

    displayReportSummary();

    displayBookingStatistics();

    displayBookingChart();

    displayPopularDestinations();

    displayRevenueReport();

}


// Initial execution

generateReports();