
// ============================================
// YAADHUM OOORE - MANAGE PROVIDERS
// ============================================


// 1. SAMPLE PROVIDER DATA

let providers = [

    {
        id: 101,
        name: "Arun Kumar",
        email: "arun@gmail.com",
        business: "Arun Travels",
        phone: "9876543210",
        location: "Chennai",
        status: "Pending"
    },

    {
        id: 102,
        name: "Priya Sharma",
        email: "priya@gmail.com",
        business: "Explore Tamil Nadu",
        phone: "9876501234",
        location: "Madurai",
        status: "Approved"
    },

    {
        id: 103,
        name: "Rahul Raj",
        email: "rahul@gmail.com",
        business: "Mountain Adventures",
        phone: "9876512345",
        location: "Ooty",
        status: "Pending"
    },

    {
        id: 104,
        name: "Sneha Reddy",
        email: "sneha@gmail.com",
        business: "Coastal Holidays",
        phone: "9876523456",
        location: "Pondicherry",
        status: "Rejected"
    },

    {
        id: 105,
        name: "Karthik S",
        email: "karthik@gmail.com",
        business: "Heritage Tours",
        phone: "9876534567",
        location: "Thanjavur",
        status: "Approved"
    }

];


// 2. GET HTML ELEMENTS

const tableBody = document.getElementById("providerTableBody");

const searchInput = document.getElementById("searchProvider");

const statusFilter = document.getElementById("statusFilter");

const emptyMessage = document.getElementById("emptyMessage");


// 3. DISPLAY PROVIDERS IN THE TABLE

function displayProviders() {

    // Clear existing table rows

    tableBody.innerHTML = "";

    // Get search text and selected status

    const searchText = searchInput.value.toLowerCase();

    const selectedStatus = statusFilter.value;

    // Filter provider records

    const filteredProviders = providers.filter(function(provider) {

        const matchesSearch =
            provider.name.toLowerCase().includes(searchText) ||
            provider.email.toLowerCase().includes(searchText) ||
            provider.business.toLowerCase().includes(searchText);

        const matchesStatus =
            selectedStatus === "All" ||
            provider.status === selectedStatus;

        return matchesSearch && matchesStatus;

    });


    // Display a message if no records match

    emptyMessage.hidden = filteredProviders.length !== 0;


    // Create a table row for every matching provider

    filteredProviders.forEach(function(provider) {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${provider.id}</td>
            <td>${provider.name}</td>
            <td>${provider.email}</td>
            <td>${provider.business}</td>
            <td>
                <span class="status ${provider.status.toLowerCase()}">
                    ${provider.status}
                </span>
            </td>
            <td>
                <button class="action-button view-button"
                    data-action="view"
                    data-id="${provider.id}">
                    View
                </button>

                ${
                    provider.status === "Pending"
                    ? `
                        <button class="action-button approve-button"
                            data-action="approve"
                            data-id="${provider.id}">
                            Approve
                        </button>

                        <button class="action-button reject-button"
                            data-action="reject"
                            data-id="${provider.id}">
                            Reject
                        </button>
                    `
                    : ""
                }
            </td>
        `;

        tableBody.appendChild(row);

    });

    updateStatistics();

}


// 4. UPDATE DASHBOARD STATISTICS

function updateStatistics() {

    const total = providers.length;

    const approved = providers.filter(function(provider) {
        return provider.status === "Approved";
    }).length;

    const pending = providers.filter(function(provider) {
        return provider.status === "Pending";
    }).length;

    const rejected = providers.filter(function(provider) {
        return provider.status === "Rejected";
    }).length;


    document.getElementById("totalProviders").textContent = total;

    document.getElementById("approvedProviders").textContent = approved;

    document.getElementById("pendingProviders").textContent = pending;

    document.getElementById("rejectedProviders").textContent = rejected;

}


// 5. APPROVE OR REJECT A PROVIDER

function updateProviderStatus(providerId, newStatus) {

    const provider = providers.find(function(item) {
        return item.id === providerId;
    });

    if (!provider) {
        return;
    }

    const confirmation = confirm(
        "Are you sure you want to " +
        newStatus.toLowerCase() +
        " " + provider.name + "?"
    );

    if (confirmation) {

        provider.status = newStatus;

        alert(
            provider.name + " has been " +
            newStatus.toLowerCase() + "."
        );

        displayProviders();

    }

}


// 6. VIEW PROVIDER DETAILS

function viewProviderDetails(providerId) {

    const provider = providers.find(function(item) {
        return item.id === providerId;
    });

    if (!provider) {
        return;
    }

    const details = document.getElementById("providerDetails");

    details.innerHTML = `
        <p><strong>Provider ID:</strong> ${provider.id}</p>
        <p><strong>Name:</strong> ${provider.name}</p>
        <p><strong>Email:</strong> ${provider.email}</p>
        <p><strong>Business:</strong> ${provider.business}</p>
        <p><strong>Phone:</strong> ${provider.phone}</p>
        <p><strong>Location:</strong> ${provider.location}</p>
        <p><strong>Status:</strong> ${provider.status}</p>
    `;

    document.getElementById("providerDialog").showModal();

}


// 7. HANDLE TABLE BUTTON CLICKS

tableBody.addEventListener("click", function(event) {

    const button = event.target.closest("button");

    if (!button) {
        return;
    }

    const providerId = Number(button.dataset.id);

    const action = button.dataset.action;

    if (action === "approve") {

        updateProviderStatus(providerId, "Approved");

    }
    else if (action === "reject") {

        updateProviderStatus(providerId, "Rejected");

    }
    else if (action === "view") {

        viewProviderDetails(providerId);

    }

});


// 8. SEARCH PROVIDERS

searchInput.addEventListener("input", function() {

    displayProviders();

});


// 9. FILTER PROVIDERS BY STATUS

statusFilter.addEventListener("change", function() {

    displayProviders();

});


// 10. CLOSE PROVIDER DETAILS

document.getElementById("closeDialog").addEventListener("click", function() {

    document.getElementById("providerDialog").close();

});


// 11. INITIAL PAGE LOAD

document.addEventListener("DOMContentLoaded", function() {

    displayProviders();

});
