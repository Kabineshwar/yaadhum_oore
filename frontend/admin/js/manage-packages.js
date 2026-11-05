
// ============================================
// YAADHUM OOORE - MANAGE PACKAGES
// ============================================


// 1. SAMPLE PACKAGE DATA

let packages = [

    {
        id: 301,
        name: "Ooty Hill Station Adventure",
        provider: "Mountain Adventures",
        destination: "Ooty",
        price: 4500,
        duration: "3 Days / 2 Nights",
        description: "Explore the beautiful hills, gardens and scenic viewpoints of Ooty.",
        status: "Pending"
    },

    {
        id: 302,
        name: "Madurai Heritage Tour",
        provider: "Explore Tamil Nadu",
        destination: "Madurai",
        price: 3000,
        duration: "2 Days / 1 Night",
        description: "Visit historic temples and explore the cultural heritage of Madurai.",
        status: "Approved"
    },

    {
        id: 303,
        name: "Pondicherry Beach Escape",
        provider: "Coastal Holidays",
        destination: "Pondicherry",
        price: 5500,
        duration: "3 Days / 2 Nights",
        description: "Enjoy beaches, cafes and the French colonial architecture of Pondicherry.",
        status: "Pending"
    },

    {
        id: 304,
        name: "Thanjavur Cultural Experience",
        provider: "Heritage Tours",
        destination: "Thanjavur",
        price: 2500,
        duration: "2 Days / 1 Night",
        description: "Discover traditional art, architecture and historic landmarks.",
        status: "Rejected"
    },

    {
        id: 305,
        name: "Kodaikanal Nature Retreat",
        provider: "Mountain Adventures",
        destination: "Kodaikanal",
        price: 4000,
        duration: "3 Days / 2 Nights",
        description: "Experience lakes, forests and scenic mountain viewpoints.",
        status: "Approved"
    }

];


// 2. SELECT HTML ELEMENTS

const packageTableBody =
    document.getElementById("packageTableBody");

const packageSearch =
    document.getElementById("searchPackage");

const packageStatusFilter =
    document.getElementById("packageStatusFilter");

const packageEmptyMessage =
    document.getElementById("packageEmptyMessage");


// 3. DISPLAY PACKAGES IN THE TABLE

function displayPackages() {

    // Remove previous table rows

    packageTableBody.innerHTML = "";

    // Read search text and selected status

    const searchText = packageSearch.value.toLowerCase();

    const selectedStatus = packageStatusFilter.value;


    // Filter packages based on search and status

    const filteredPackages = packages.filter(function(item) {

        const matchesSearch =
            item.name.toLowerCase().includes(searchText) ||
            item.provider.toLowerCase().includes(searchText) ||
            item.destination.toLowerCase().includes(searchText);

        const matchesStatus =
            selectedStatus === "All" ||
            item.status === selectedStatus;

        return matchesSearch && matchesStatus;

    });


    // Show message if no package matches

    packageEmptyMessage.hidden =
        filteredPackages.length !== 0;


    // Generate table rows

    filteredPackages.forEach(function(item) {

        const row = document.createElement("tr");


        // Package ID

        const idCell = document.createElement("td");
        idCell.textContent = item.id;


        // Package name

        const nameCell = document.createElement("td");
        nameCell.textContent = item.name;


        // Provider name

        const providerCell = document.createElement("td");
        providerCell.textContent = item.provider;


        // Destination

        const destinationCell = document.createElement("td");
        destinationCell.textContent = item.destination;


        // Price

        const priceCell = document.createElement("td");
        priceCell.textContent = "₹" + item.price.toLocaleString("en-IN");


        // Status label

        const statusCell = document.createElement("td");

        const statusLabel = document.createElement("span");

        statusLabel.className =
            "status " + item.status.toLowerCase();

        statusLabel.textContent = item.status;

        statusCell.appendChild(statusLabel);


        // Action buttons

        const actionCell = document.createElement("td");


        const viewButton = document.createElement("button");

        viewButton.textContent = "View";

        viewButton.className =
            "action-button view-button";

        viewButton.dataset.action = "view";
        viewButton.dataset.id = item.id;


        actionCell.appendChild(viewButton);


        // Approval buttons only for pending packages

        if (item.status === "Pending") {

            const approveButton = document.createElement("button");

            approveButton.textContent = "Approve";

            approveButton.className =
                "action-button approve-button";

            approveButton.dataset.action = "approve";
            approveButton.dataset.id = item.id;


            const rejectButton = document.createElement("button");

            rejectButton.textContent = "Reject";

            rejectButton.className =
                "action-button reject-button";

            rejectButton.dataset.action = "reject";
            rejectButton.dataset.id = item.id;


            actionCell.appendChild(approveButton);
            actionCell.appendChild(rejectButton);

        }


        // Add all cells to the row

        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(providerCell);
        row.appendChild(destinationCell);
        row.appendChild(priceCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);


        // Add row to the table

        packageTableBody.appendChild(row);

    });


    updatePackageStatistics();

}


// 4. UPDATE PACKAGE STATISTICS

function updatePackageStatistics() {

    const total = packages.length;

    const approved = packages.filter(function(item) {
        return item.status === "Approved";
    }).length;

    const pending = packages.filter(function(item) {
        return item.status === "Pending";
    }).length;

    const rejected = packages.filter(function(item) {
        return item.status === "Rejected";
    }).length;


    document.getElementById("totalPackages").textContent = total;

    document.getElementById("approvedPackages").textContent = approved;

    document.getElementById("pendingPackages").textContent = pending;

    document.getElementById("rejectedPackages").textContent = rejected;

}


// 5. APPROVE OR REJECT A PACKAGE

function updatePackageStatus(packageId, newStatus) {

    const selectedPackage = packages.find(function(item) {
        return item.id === packageId;
    });


    if (!selectedPackage) {
        return;
    }


    const confirmation = confirm(
        "Are you sure you want to " +
        newStatus.toLowerCase() +
        " the package: " +
        selectedPackage.name +
        "?"
    );


    if (confirmation) {

        selectedPackage.status = newStatus;

        alert(
            selectedPackage.name +
            " has been " +
            newStatus.toLowerCase() +
            "."
        );

        displayPackages();

    }

}


// 6. VIEW PACKAGE DETAILS

function viewPackageDetails(packageId) {

    const selectedPackage = packages.find(function(item) {
        return item.id === packageId;
    });


    if (!selectedPackage) {
        return;
    }


    const details = document.getElementById("packageDetails");

    details.innerHTML = "";


    const fields = [
        ["Package ID", selectedPackage.id],
        ["Package Name", selectedPackage.name],
        ["Provider", selectedPackage.provider],
        ["Destination", selectedPackage.destination],
        ["Price", "₹" + selectedPackage.price.toLocaleString("en-IN")],
        ["Duration", selectedPackage.duration],
        ["Description", selectedPackage.description],
        ["Approval Status", selectedPackage.status]
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


    document.getElementById("packageDialog").showModal();

}


// 7. HANDLE TABLE BUTTON CLICKS

packageTableBody.addEventListener("click", function(event) {

    const button = event.target.closest("button");

    if (!button) {
        return;
    }


    const packageId = Number(button.dataset.id);

    const action = button.dataset.action;


    if (action === "view") {

        viewPackageDetails(packageId);

    }
    else if (action === "approve") {

        updatePackageStatus(packageId, "Approved");

    }
    else if (action === "reject") {

        updatePackageStatus(packageId, "Rejected");

    }

});


// 8. SEARCH PACKAGES

packageSearch.addEventListener("input", function() {

    displayPackages();

});


// 9. FILTER PACKAGES BY STATUS

packageStatusFilter.addEventListener("change", function() {

    displayPackages();

});


// 10. CLOSE PACKAGE DETAILS

document.getElementById("closePackageDialog")
    .addEventListener("click", function() {

        document.getElementById("packageDialog").close();

    });


// 11. INITIAL PAGE LOAD

document.addEventListener("DOMContentLoaded", function() {

    displayPackages();

});
