// Sample category data

let categories = [

    {
        id: 501,
        name: "Hill Station",
        description: "Tourism packages involving hills, mountains and cool climates.",
        status: "Active"
    },

    {
        id: 502,
        name: "Beach",
        description: "Destinations featuring beaches and coastal activities.",
        status: "Active"
    },

    {
        id: 503,
        name: "Heritage",
        description: "Historical monuments, temples and cultural destinations.",
        status: "Active"
    },

    {
        id: 504,
        name: "Adventure",
        description: "Trekking, camping and other adventure activities.",
        status: "Active"
    },

    {
        id: 505,
        name: "Nature",
        description: "Nature tourism involving forests, lakes and waterfalls.",
        status: "Active"
    }

];


// Get HTML elements

const categoryTableBody = document.getElementById("categoryTableBody");

const searchCategory = document.getElementById("searchCategory");

const categoryDialog = document.getElementById("categoryDialog");

const categoryForm = document.getElementById("categoryForm");


// Display categories

function displayCategories() {

    categoryTableBody.textContent = "";

    const searchValue = searchCategory.value.toLowerCase();

    const filteredCategories = categories.filter(function(category) {

        return (
            category.name.toLowerCase().includes(searchValue) ||
            category.description.toLowerCase().includes(searchValue)
        );

    });


    filteredCategories.forEach(function(category) {

        const row = document.createElement("tr");

        // ID
        const idCell = document.createElement("td");
        idCell.textContent = category.id;

        // Category name
        const nameCell = document.createElement("td");
        nameCell.textContent = category.name;

        // Description
        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = category.description;

        // Status
        const statusCell = document.createElement("td");
        statusCell.textContent = category.status;
        statusCell.className = "status approved";

        // Action buttons
        const actionCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "view-button";
        editButton.dataset.action = "edit";
        editButton.dataset.id = category.id;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "reject-button";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = category.id;

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);

        // Add cells to row
        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(descriptionCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        categoryTableBody.appendChild(row);

    });


    document.getElementById("emptyCategoryMessage").style.display =
        filteredCategories.length === 0 ? "block" : "none";

    updateCategoryStatistics();

}


// Update statistics

function updateCategoryStatistics() {

    document.getElementById("totalCategories").textContent =
        categories.length;

    const activeCount = categories.filter(function(category) {
        return category.status === "Active";
    }).length;

    document.getElementById("activeCategories").textContent =
        activeCount;

}


// Open dialog to add category

function openAddCategoryDialog() {

    categoryForm.reset();

    document.getElementById("categoryId").value = "";

    document.getElementById("categoryDialogTitle").textContent =
        "Add Category";

    document.getElementById("saveCategoryButton").textContent =
        "Save Category";

    categoryDialog.showModal();

}


// Open dialog to edit category

function editCategory(id) {

    const category = categories.find(function(item) {
        return item.id === id;
    });

    if (!category) {
        return;
    }

    document.getElementById("categoryId").value = category.id;

    document.getElementById("categoryName").value = category.name;

    document.getElementById("categoryDescription").value =
        category.description;

    document.getElementById("categoryDialogTitle").textContent =
        "Edit Category";

    document.getElementById("saveCategoryButton").textContent =
        "Update Category";

    categoryDialog.showModal();

}


// Save new category or update existing category

function saveCategory(event) {

    event.preventDefault();

    const id = document.getElementById("categoryId").value;

    const name = document.getElementById("categoryName").value.trim();

    const description =
        document.getElementById("categoryDescription").value.trim();


    // Prevent duplicate category names

    const duplicate = categories.some(function(category) {

        return (
            category.name.toLowerCase() === name.toLowerCase() &&
            category.id !== Number(id)
        );

    });

    if (duplicate) {
        alert("This category already exists.");
        return;
    }


    if (id === "") {

        // Add new category

        const newCategory = {
            id: Date.now(),
            name: name,
            description: description,
            status: "Active"
        };

        categories.push(newCategory);

        alert("Category added successfully!");

    } else {

        // Update existing category

        const category = categories.find(function(item) {
            return item.id === Number(id);
        });

        if (category) {

            category.name = name;
            category.description = description;

            alert("Category updated successfully!");

        }

    }


    categoryDialog.close();

    categoryForm.reset();

    displayCategories();

}


// Delete category

function deleteCategory(id) {

    const confirmation = confirm(
        "Are you sure you want to delete this category?"
    );

    if (!confirmation) {
        return;
    }

    categories = categories.filter(function(category) {
        return category.id !== id;
    });

    alert("Category deleted successfully!");

    displayCategories();

}


// Handle edit and delete clicks

categoryTableBody.addEventListener("click", function(event) {

    const button = event.target.closest("button");

    if (!button) {
        return;
    }

    const id = Number(button.dataset.id);

    const action = button.dataset.action;

    if (action === "edit") {

        editCategory(id);

    } else if (action === "delete") {

        deleteCategory(id);

    }

});


// Event listeners

document.getElementById("addCategoryButton")
    .addEventListener("click", openAddCategoryDialog);

categoryForm.addEventListener("submit", saveCategory);

searchCategory.addEventListener("input", displayCategories);

document.getElementById("closeCategoryDialog")
    .addEventListener("click", function() {

        categoryDialog.close();

    });


// Initial display

displayCategories();