
// ============================================
// YAADHUM OOORE - MANAGE CUSTOMERS
// ============================================


// 1. SAMPLE CUSTOMER DATA

let customers = [

    {
        id: 201,
        name: "Vikram Raj",
        email: "vikram@gmail.com",
        phone: "9876543210",
        location: "Chennai",
        joinedDate: "2026-08-12",
        status: "Active"
    },

    {
        id: 202,
        name: "Ananya Kumar",
        email: "ananya@gmail.com",
        phone: "9876501234",
        location: "Coimbatore",
        joinedDate: "2026-08-15",
        status: "Active"
    },

    {
        id: 203,
        name: "Rahul Sharma",
        email: "rahul@gmail.com",
        phone: "9876512345",
        location: "Madurai",
        joinedDate: "2026-09-01",
        status: "Inactive"
    },

    {
        id: 204,
        name: "Meera S",
        email: "meera@gmail.com",
        phone: "9876523456",
        location: "Chennai",
        joinedDate: "2026-09-10",
        status: "Active"
    },

    {
        id: 205,
        name: "Arjun Prakash",
        email: "arjun@gmail.com",
        phone: "9876534567",
        location: "Salem",
        joinedDate: "2026-09-20",
        status: "Inactive"
    }

];


// 2. SELECT HTML ELEMENTS

const customerTableBody =
    document.getElementById("customerTableBody");

const customerSearch =
    document.getElementById("searchCustomer");

const customerStatusFilter =
    document.getElementById("customerStatusFilter");

const customerEmptyMessage =
    document.getElementById("customerEmptyMessage");


// 3. DISPLAY CUSTOMERS

function displayCustomers() {

    // Clear the existing table

    customerTableBody.innerHTML = "";

    // Get search text and selected filter

    const searchText = customerSearch.value.toLowerCase();

    const selectedStatus = customerStatusFilter.value;


    // Filter customer records

    const filteredCustomers = customers.filter(function(customer) {

        const matchesSearch =
            customer.name.toLowerCase().includes(searchText) ||
            customer.email.toLowerCase().includes(searchText);

        const matchesStatus =
            selectedStatus === "All" ||
            customer.status === selectedStatus;

        return matchesSearch && matchesStatus;

    });


    // Display message when no customers match

    customerEmptyMessage.hidden =
        filteredCustomers.length !== 0;


    // Create a table row for each customer

    filteredCustomers.forEach(function(customer) {

        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = customer.id;

        const nameCell = document.createElement("td");
        nameCell.textContent = customer.name;

        const emailCell = document.createElement("td");
        emailCell.textContent = customer.email;

        const phoneCell = document.createElement("td");
        phoneCell.textContent = customer.phone;


        // Create status label

        const statusCell = document.createElement("td");

        const statusLabel = document.createElement("span");

        statusLabel.className =
            "status " + customer.status.toLowerCase();

        statusLabel.textContent = customer.status;

        statusCell.appendChild(statusLabel);


        // Create action buttons

        const actionCell = document.createElement("td");

        const viewButton = document.createElement("button");

        viewButton.textContent = "View";

        viewButton.className = "action-button view-button";

        viewButton.dataset.action = "view";
        viewButton.dataset.id = customer.id;


        const toggleButton = document.createElement("button");

        toggleButton.textContent =
            customer.status === "Active"
                ? "Deactivate"
                : "Activate";

        toggleButton.className =
            customer.status === "Active"
                ? "action-button reject-button"
                : "action-button approve-button";

        toggleButton.dataset.action = "toggle";
        toggleButton.dataset.id = customer.id;


        actionCell.appendChild(viewButton);
        actionCell.appendChild(toggleButton);


        // Add all cells to the row

        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(emailCell);
        row.appendChild(phoneCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        customerTableBody.appendChild(row);

    });


    updateCustomerStatistics();

}


// 4. UPDATE CUSTOMER STATISTICS

function updateCustomerStatistics() {

    const total = customers.length;

    const active = customers.filter(function(customer) {
        return customer.status === "Active";
    }).length;

    const inactive = customers.filter(function(customer) {
        return customer.status === "Inactive";
    }).length;


    document.getElementById("totalCustomers").textContent = total;

    document.getElementById("activeCustomers").textContent = active;

    document.getElementById("inactiveCustomers").textContent = inactive;

}


// 5. ACTIVATE OR DEACTIVATE CUSTOMER

function toggleCustomerStatus(customerId) {

    const customer = customers.find(function(item) {
        return item.id === customerId;
    });

    if (!customer) {
        return;
    }


    const newStatus =
        customer.status === "Active"
            ? "Inactive"
            : "Active";


    const confirmation = confirm(
        "Are you sure you want to " +
        newStatus.toLowerCase() +
        " the account of " +
        customer.name +
        "?"
    );


    if (confirmation) {

        customer.status = newStatus;

        alert(
            customer.name +
            "'s account is now " +
            newStatus +
            "."
        );

        displayCustomers();

    }

}


// 6. VIEW CUSTOMER DETAILS

function viewCustomerDetails(customerId) {

    const customer = customers.find(function(item) {
        return item.id === customerId;
    });

    if (!customer) {
        return;
    }


    const details = document.getElementById("customerDetails");

    details.innerHTML = "";


    const fields = [
        ["Customer ID", customer.id],
        ["Name", customer.name],
        ["Email", customer.email],
        ["Phone", customer.phone],
        ["Location", customer.location],
        ["Joined Date", customer.joinedDate],
        ["Account Status", customer.status]
    ];


    fields.forEach(function(field) {

        const paragraph = document.createElement("p");

        const label = document.createElement("strong");

        label.textContent = field[0] + ": ";

        paragraph.appendChild(label);

        paragraph.appendChild(
            document.createTextNode(field[1])
        );

        details.appendChild(paragraph);

    });


    document.getElementById("customerDialog").showModal();

}


// 7. HANDLE TABLE BUTTON CLICKS

customerTableBody.addEventListener("click", function(event) {

    const button = event.target.closest("button");

    if (!button) {
        return;
    }


    const customerId = Number(button.dataset.id);

    const action = button.dataset.action;


    if (action === "view") {

        viewCustomerDetails(customerId);

    }
    else if (action === "toggle") {

        toggleCustomerStatus(customerId);

    }

});


// 8. SEARCH CUSTOMERS

customerSearch.addEventListener("input", function() {

    displayCustomers();

});


// 9. FILTER CUSTOMERS

customerStatusFilter.addEventListener("change", function() {

    displayCustomers();

});


// 10. CLOSE CUSTOMER DETAILS

document.getElementById("closeCustomerDialog")
    .addEventListener("click", function() {

        document.getElementById("customerDialog").close();

    });


// 11. INITIAL PAGE LOAD & LIVE BACKEND SYNC

async function loadCustomersFromApi() {
    try {
        const res = await fetch('/api/admin/customers');
        if (res.ok) {
            const data = await res.json();
            if (data.customers && data.customers.length > 0) {
                customers = data.customers.map(c => ({
                    id: c.id,
                    name: c.full_name,
                    email: c.email,
                    phone: c.phone || '9876543210',
                    location: 'Tamil Nadu',
                    joinedDate: (c.created_at || '2026-11-01').substring(0, 10),
                    status: c.status === 'active' ? 'Active' : 'Inactive'
                }));
            }
        }
    } catch(e) {}
    displayCustomers();
}

document.addEventListener("DOMContentLoaded", function() {

    loadCustomersFromApi();

});
