// Sample destination update requests
let destinationUpdates = [

    {
        id: 901,
        destination: "Ooty",
        submittedBy: "Arun Kumar",
        updateType: "Description Update",
        submittedDate: "2026-11-04",
        status: "Pending",
        oldDescription: "A popular hill station in Tamil Nadu.",
        newDescription: "A scenic hill station known for its tea gardens, pleasant climate and mountain views.",
        reason: "Updated destination information for tourists."
    },

    {
        id: 902,
        destination: "Mahabalipuram",
        submittedBy: "Priya Sharma",
        updateType: "Information Update",
        submittedDate: "2026-11-03",
        status: "Approved",
        oldDescription: "A historic coastal town.",
        newDescription: "A UNESCO-recognised heritage destination known for its ancient rock-cut temples and shore monuments.",
        reason: "Added updated heritage information."
    },

    {
        id: 903,
        destination: "Pondicherry",
        submittedBy: "Sneha Reddy",
        updateType: "Description Update",
        submittedDate: "2026-11-03",
        status: "Pending",
        oldDescription: "A coastal tourist destination.",
        newDescription: "A coastal destination known for its beaches, French colonial architecture and cafes.",
        reason: "Improved the destination description."
    },

    {
        id: 904,
        destination: "Kodaikanal",
        submittedBy: "Karthik S",
        updateType: "Category Update",
        submittedDate: "2026-11-02",
        status: "Rejected",
        oldDescription: "Hill Station",
        newDescription: "Adventure",
        reason: "Requested a destination category change."
    },

    {
        id: 905,
        destination: "Rameswaram",
        submittedBy: "Rahul Raj",
        updateType: "Information Update",
        submittedDate: "2026-11-01",
        status: "Pending",
        oldDescription: "A religious destination in Tamil Nadu.",
        newDescription: "A pilgrimage destination known for Ramanathaswamy Temple and its coastal setting.",
        reason: "Added more information for visitors."
    }
];

// HTML elements
const destinationUpdateTableBody =
    document.getElementById("destinationUpdateTableBody");

const searchDestinationUpdate =
    document.getElementById("searchDestinationUpdate");

const destinationUpdateStatus =
    document.getElementById("destinationUpdateStatus");

const destinationUpdateDialog =
    document.getElementById("destinationUpdateDialog");

// Display destination updates
function displayDestinationUpdates() {

    const searchText =
        searchDestinationUpdate.value.toLowerCase();

    const selectedStatus =
        destinationUpdateStatus.value;

    destinationUpdateTableBody.replaceChildren();

    const filteredUpdates = destinationUpdates.filter(update => {

        const matchesSearch =
            update.destination.toLowerCase().includes(searchText) ||
            update.submittedBy.toLowerCase().includes(searchText);

        const matchesStatus =
            selectedStatus === "All" ||
            update.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    filteredUpdates.forEach(update => {

        const row = document.createElement("tr");

        const values = [
            update.id,
            update.destination,
            update.submittedBy,
            update.updateType,
            update.submittedDate
        ];

        values.forEach(value => {

            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        // Status column
        const statusCell = document.createElement("td");
        const statusLabel = document.createElement("span");

        statusLabel.textContent = update.status;
        statusLabel.className =
            `status ${update.status.toLowerCase()}`;

        statusCell.appendChild(statusLabel);
        row.appendChild(statusCell);

        // Action buttons
        const actionsCell = document.createElement("td");

        const viewButton = document.createElement("button");
        viewButton.textContent = "View";
        viewButton.className = "view-button";
        viewButton.dataset.action = "view";
        viewButton.dataset.id = update.id;

        actionsCell.appendChild(viewButton);

        if (update.status === "Pending") {

            const approveButton = document.createElement("button");
            approveButton.textContent = "Approve";
            approveButton.className = "approve-button";
            approveButton.dataset.action = "approve";
            approveButton.dataset.id = update.id;

            const rejectButton = document.createElement("button");
            rejectButton.textContent = "Reject";
            rejectButton.className = "reject-button";
            rejectButton.dataset.action = "reject";
            rejectButton.dataset.id = update.id;

            actionsCell.appendChild(approveButton);
            actionsCell.appendChild(rejectButton);
        }

        row.appendChild(actionsCell);
        destinationUpdateTableBody.appendChild(row);
    });

    document.getElementById("noDestinationUpdates").hidden =
        filteredUpdates.length !== 0;

    updateDestinationUpdateStatistics();
}

// Update summary cards
function updateDestinationUpdateStatistics() {

    document.getElementById("totalUpdates").textContent =
        destinationUpdates.length;

    document.getElementById("pendingUpdates").textContent =
        destinationUpdates.filter(
            update => update.status === "Pending"
        ).length;

    document.getElementById("approvedUpdates").textContent =
        destinationUpdates.filter(
            update => update.status === "Approved"
        ).length;

    document.getElementById("rejectedUpdates").textContent =
        destinationUpdates.filter(
            update => update.status === "Rejected"
        ).length;
}

// View destination update details
function viewDestinationUpdate(id) {

    const update = destinationUpdates.find(
        item => item.id === id
    );

    if (!update) return;

    const details = document.getElementById(
        "destinationUpdateDetails"
    );

    details.replaceChildren();

    const fields = [
        ["Update ID", update.id],
        ["Destination", update.destination],
        ["Submitted By", update.submittedBy],
        ["Update Type", update.updateType],
        ["Submitted Date", update.submittedDate],
        ["Current Status", update.status],
        ["Previous Information", update.oldDescription],
        ["Proposed Information", update.newDescription],
        ["Reason for Update", update.reason]
    ];

    fields.forEach(([label, value]) => {

        const paragraph = document.createElement("p");
        const strong = document.createElement("strong");

        strong.textContent = `${label}: `;

        paragraph.appendChild(strong);
        paragraph.appendChild(
            document.createTextNode(String(value))
        );

        details.appendChild(paragraph);
    });

    destinationUpdateDialog.showModal();
}

// Approve a destination update
function approveDestinationUpdate(id) {

    const update = destinationUpdates.find(
        item => item.id === id
    );

    if (!update || update.status !== "Pending") return;

    if (confirm(`Approve the update for ${update.destination}?`)) {

        update.status = "Approved";

        alert("Destination update approved successfully.");

        displayDestinationUpdates();
    }
}

// Reject a destination update
function rejectDestinationUpdate(id) {

    const update = destinationUpdates.find(
        item => item.id === id
    );

    if (!update || update.status !== "Pending") return;

    if (confirm(`Reject the update for ${update.destination}?`)) {

        update.status = "Rejected";

        alert("Destination update rejected.");

        displayDestinationUpdates();
    }
}

// Handle table button clicks
destinationUpdateTableBody.addEventListener("click", function(event) {

    const button = event.target.closest("button");

    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "view") {
        viewDestinationUpdate(id);
    } else if (action === "approve") {
        approveDestinationUpdate(id);
    } else if (action === "reject") {
        rejectDestinationUpdate(id);
    }
});

// Event listeners
searchDestinationUpdate.addEventListener(
    "input",
    displayDestinationUpdates
);

destinationUpdateStatus.addEventListener(
    "change",
    displayDestinationUpdates
);

document.getElementById("closeDestinationUpdateDialog")
    .addEventListener("click", function() {
        destinationUpdateDialog.close();
    });

// Initial display
displayDestinationUpdates();