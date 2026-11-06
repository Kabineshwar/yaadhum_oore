// Sample destination data

let destinations = [
    {
        id: 401,
        name: "Ooty",
        state: "Tamil Nadu",
        category: "Hill Station",
        description: "A popular hill station known for its tea gardens and scenic beauty.",
        status: "Active"
    },

    {
        id: 402,
        name: "Mahabalipuram",
        state: "Tamil Nadu",
        category: "Heritage",
        description: "Famous for its ancient temples and stone monuments.",
        status: "Active"
    },

    {
        id: 403,
        name: "Pondicherry",
        state: "Puducherry",
        category: "Beach",
        description: "Known for its beaches, French architecture and peaceful atmosphere.",
        status: "Active"
    },

    {
        id: 404,
        name: "Kodaikanal",
        state: "Tamil Nadu",
        category: "Nature",
        description: "A scenic destination featuring lakes, forests and waterfalls.",
        status: "Active"
    },

    {
        id: 405,
        name: "Rameswaram",
        state: "Tamil Nadu",
        category: "Heritage",
        description: "A destination known for its temples and coastal attractions.",
        status: "Active"
    }
];


// Get HTML elements

const tableBody = document.getElementById("destinationTableBody");

const searchInput = document.getElementById("searchDestination");

const categoryFilter = document.getElementById("categoryFilter");

const destinationDialog = document.getElementById("destinationDialog");

const destinationForm = document.getElementById("destinationForm");


// Display destinations in the table

function displayDestinations() {

    tableBody.textContent = "";

    const searchValue = searchInput.value.toLowerCase();

    const selectedCategory = categoryFilter.value;

    const filteredDestinations = destinations.filter(function(destination) {

        const matchesSearch =
            destination.name.toLowerCase().includes(searchValue) ||
            destination.state.toLowerCase().includes(searchValue);

        const matchesCategory =
            selectedCategory === "All" ||
            destination.category === selectedCategory;

        return matchesSearch && matchesCategory;

    });


    filteredDestinations.forEach(function(destination) {

        const row = document.createElement("tr");

        // ID
        const idCell = document.createElement("td");
        idCell.textContent = destination.id;

        // Name
        const nameCell = document.createElement("td");
        nameCell.textContent = destination.name;

        // State
        const stateCell = document.createElement("td");
        stateCell.textContent = destination.state;

        // Category
        const categoryCell = document.createElement("td");
        categoryCell.textContent = destination.category;

        // Status
        const statusCell = document.createElement("td");
        statusCell.textContent = destination.status;
        statusCell.className = "status approved";

        // Actions
        const actionCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "view-button";
        editButton.dataset.action = "edit";
        editButton.dataset.id = destination.id;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "reject-button";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = destination.id;

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);

        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(stateCell);
        row.appendChild(categoryCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        tableBody.appendChild(row);

    });


    // Show empty message if no destinations match

    document.getElementById("emptyDestinationMessage").style.display =
        filteredDestinations.length === 0 ? "block" : "none";


    updateDestinationStatistics();

}


// Update destination statistics

function updateDestinationStatistics() {

    document.getElementById("totalDestinations").textContent =
        destinations.length;

    const activeCount = destinations.filter(function(destination) {
        return destination.status === "Active";
    }).length;

    document.getElementById("activeDestinations").textContent =
        activeCount;

}


// Open dialog for adding a destination

function openAddDestinationDialog() {

    destinationForm.reset();

    document.getElementById("destinationId").value = "";

    document.getElementById("dialogTitle").textContent =
        "Add Destination";

    document.getElementById("saveDestinationButton").textContent =
        "Save Destination";

    destinationDialog.showModal();

}


// Open dialog for editing a destination

function editDestination(id) {

    const destination = destinations.find(function(item) {
        return item.id === id;
    });

    if (!destination) {
        return;
    }

    document.getElementById("destinationId").value =
        destination.id;

    document.getElementById("destinationName").value =
        destination.name;

    document.getElementById("destinationState").value =
        destination.state;

    document.getElementById("destinationCategory").value =
        destination.category;

    document.getElementById("destinationDescription").value =
        destination.description;

    document.getElementById("dialogTitle").textContent =
        "Edit Destination";

    document.getElementById("saveDestinationButton").textContent =
        "Update Destination";

    destinationDialog.showModal();

}


// Add or update destination

function saveDestination(event) {

    event.preventDefault();

    const id = document.getElementById("destinationId").value;

    const name = document.getElementById("destinationName").value.trim();

    const state = document.getElementById("destinationState").value.trim();

    const category = document.getElementById("destinationCategory").value;

    const description =
        document.getElementById("destinationDescription").value.trim();


    if (id === "") {

        // Add new destination

        const newDestination = {
            id: Date.now(),
            name: name,
            state: state,
            category: category,
            description: description,
            status: "Active"
        };

        destinations.push(newDestination);

        alert("Destination added successfully!");

    } else {

        // Update existing destination

        const destination = destinations.find(function(item) {
            return item.id === Number(id);
        });

        if (destination) {

            destination.name = name;
            destination.state = state;
            destination.category = category;
            destination.description = description;

            alert("Destination updated successfully!");

        }

    }

    destinationDialog.close();

    destinationForm.reset();

    displayDestinations();

}


// Delete destination

function deleteDestination(id) {

    const confirmation = confirm(
        "Are you sure you want to delete this destination?"
    );

    if (!confirmation) {
        return;
    }

    destinations = destinations.filter(function(destination) {
        return destination.id !== id;
    });

    alert("Destination deleted successfully!");

    displayDestinations();

}


// Handle edit and delete button clicks

tableBody.addEventListener("click", function(event) {

    const button = event.target.closest("button");

    if (!button) {
        return;
    }

    const id = Number(button.dataset.id);

    const action = button.dataset.action;

    if (action === "edit") {

        editDestination(id);

    } else if (action === "delete") {

        deleteDestination(id);

    }

});


// Event listeners

document.getElementById("addDestinationButton")
    .addEventListener("click", openAddDestinationDialog);

destinationForm.addEventListener("submit", saveDestination);

searchInput.addEventListener("input", displayDestinations);

categoryFilter.addEventListener("change", displayDestinations);

document.getElementById("closeDestinationDialog")
    .addEventListener("click", function() {

        destinationDialog.close();

    });


// Initial display

displayDestinations();