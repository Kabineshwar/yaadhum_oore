// Sample booking data

let bookings = [

    {
        id: 601,
        customer: "Vikram Raj",
        email: "vikram@gmail.com",
        package: "Ooty Hill Station Adventure",
        destination: "Ooty",
        travelDate: "2026-11-15",
        people: 2,
        amount: 9000,
        status: "Pending"
    },

    {
        id: 602,
        customer: "Ananya Kumar",
        email: "ananya@gmail.com",
        package: "Madurai Heritage Tour",
        destination: "Madurai",
        travelDate: "2026-11-20",
        people: 3,
        amount: 9000,
        status: "Confirmed"
    },

    {
        id: 603,
        customer: "Rahul Sharma",
        email: "rahul@gmail.com",
        package: "Pondicherry Beach Escape",
        destination: "Pondicherry",
        travelDate: "2026-12-05",
        people: 2,
        amount: 11000,
        status: "Completed"
    },

    {
        id: 604,
        customer: "Meera S",
        email: "meera@gmail.com",
        package: "Kodaikanal Nature Retreat",
        destination: "Kodaikanal",
        travelDate: "2026-12-10",
        people: 4,
        amount: 16000,
        status: "Cancelled"
    },

    {
        id: 605,
        customer: "Arjun Prakash",
        email: "arjun@gmail.com",
        package: "Thanjavur Cultural Experience",
        destination: "Thanjavur",
        travelDate: "2026-12-18",
        people: 2,
        amount: 5000,
        status: "Pending"
    }

];


// Get HTML elements

const bookingTableBody = document.getElementById("bookingTableBody");

const searchBooking = document.getElementById("searchBooking");

const bookingStatusFilter =
    document.getElementById("bookingStatusFilter");

const bookingDialog = document.getElementById("bookingDialog");


// Display bookings

function displayBookings() {

    bookingTableBody.textContent = "";

    const searchValue = searchBooking.value.toLowerCase();

    const selectedStatus = bookingStatusFilter.value;

    const filteredBookings = bookings.filter(function(booking) {

        const matchesSearch =
            booking.customer.toLowerCase().includes(searchValue) ||
            booking.destination.toLowerCase().includes(searchValue);

        const matchesStatus =
            selectedStatus === "All" ||
            booking.status === selectedStatus;

        return matchesSearch && matchesStatus;

    });


    filteredBookings.forEach(function(booking) {

        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = booking.id;

        const customerCell = document.createElement("td");
        customerCell.textContent = booking.customer;

        const packageCell = document.createElement("td");
        packageCell.textContent = booking.package;

        const dateCell = document.createElement("td");
        dateCell.textContent = booking.travelDate;

        const amountCell = document.createElement("td");
        amountCell.textContent = "₹" + booking.amount.toLocaleString("en-IN");

        const statusCell = document.createElement("td");
        statusCell.textContent = booking.status;
        statusCell.className =
            "status " + booking.status.toLowerCase();

        const actionCell = document.createElement("td");

        const viewButton = document.createElement("button");
        viewButton.textContent = "View";
        viewButton.className = "view-button";
        viewButton.dataset.action = "view";
        viewButton.dataset.id = booking.id;

        const updateButton = document.createElement("button");
        updateButton.textContent = "Update Status";
        updateButton.className = "approve-button";
        updateButton.dataset.action = "update";
        updateButton.dataset.id = booking.id;

        actionCell.appendChild(viewButton);
        actionCell.appendChild(updateButton);

        row.appendChild(idCell);
        row.appendChild(customerCell);
        row.appendChild(packageCell);
        row.appendChild(dateCell);
        row.appendChild(amountCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        bookingTableBody.appendChild(row);

    });


    document.getElementById("emptyBookingMessage").style.display =
        filteredBookings.length === 0 ? "block" : "none";

    updateBookingStatistics();

}


// Update booking statistics

function updateBookingStatistics() {

    document.getElementById("totalBookings").textContent =
        bookings.length;

    document.getElementById("pendingBookings").textContent =
        bookings.filter(function(booking) {
            return booking.status === "Pending";
        }).length;

    document.getElementById("confirmedBookings").textContent =
        bookings.filter(function(booking) {
            return booking.status === "Confirmed";
        }).length;

    document.getElementById("cancelledBookings").textContent =
        bookings.filter(function(booking) {
            return booking.status === "Cancelled";
        }).length;

}


// View booking details

function viewBookingDetails(id) {

    const booking = bookings.find(function(item) {
        return item.id === id;
    });

    if (!booking) {
        return;
    }

    const details = document.getElementById("bookingDetails");

    details.textContent = "";

    const bookingFields = [
        ["Booking ID", booking.id],
        ["Customer", booking.customer],
        ["Email", booking.email],
        ["Package", booking.package],
        ["Destination", booking.destination],
        ["Travel Date", booking.travelDate],
        ["Number of People", booking.people],
        ["Total Amount", "₹" + booking.amount.toLocaleString("en-IN")],
        ["Booking Status", booking.status]
    ];

    bookingFields.forEach(function(field) {

        const paragraph = document.createElement("p");

        const label = document.createElement("strong");
        label.textContent = field[0] + ": ";

        const value = document.createElement("span");
        value.textContent = field[1];

        paragraph.appendChild(label);
        paragraph.appendChild(value);

        details.appendChild(paragraph);

    });

    bookingDialog.showModal();

}


// Update booking status

function updateBookingStatus(id) {

    const booking = bookings.find(function(item) {
        return item.id === id;
    });

    if (!booking) {
        return;
    }

    const newStatus = prompt(
        "Enter new status:\nPending\nConfirmed\nCompleted\nCancelled",
        booking.status
    );

    if (newStatus === null) {
        return;
    }

    const validStatuses = [
        "Pending",
        "Confirmed",
        "Completed",
        "Cancelled"
    ];

    const normalizedStatus = validStatuses.find(function(status) {
        return status.toLowerCase() === newStatus.trim().toLowerCase();
    });

    if (!normalizedStatus) {
        alert("Invalid status. Please enter Pending, Confirmed, Completed or Cancelled.");
        return;
    }

    booking.status = normalizedStatus;

    alert("Booking status updated successfully!");

    displayBookings();

}


// Handle table button clicks

bookingTableBody.addEventListener("click", function(event) {

    const button = event.target.closest("button");

    if (!button) {
        return;
    }

    const id = Number(button.dataset.id);

    const action = button.dataset.action;

    if (action === "view") {

        viewBookingDetails(id);

    } else if (action === "update") {

        updateBookingStatus(id);

    }

});


// Event listeners

searchBooking.addEventListener("input", displayBookings);

bookingStatusFilter.addEventListener("change", displayBookings);

document.getElementById("closeBookingDialog")
    .addEventListener("click", function() {

        bookingDialog.close();

    });


// Initial display

displayBookings();