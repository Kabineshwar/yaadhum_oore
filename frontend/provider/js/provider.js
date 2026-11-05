// YAADHUM OOORE - Provider frontend demo
// Data is stored in this browser only. Replace localStorage calls with backend API calls during integration.
const PACKAGE_KEY = "yaadhum_provider_packages";
const AVAILABILITY_KEY = "yaadhum_provider_availability";
const PROFILE_KEY = "yaadhum_provider_profile";

function getData(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (error) { return []; }
}
function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
function showMessage(id, text, isError = false) {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = text;
    element.className = isError ? "message error" : "message success";
}
function packageFromForm(form) {
    const data = new FormData(form);
    return {
        id: Date.now().toString(),
        name: data.get("name") || document.getElementById("name")?.value.trim(),
        destination: data.get("destination") || document.getElementById("destination")?.value.trim(),
        category: data.get("category") || document.getElementById("category")?.value,
        price: Number(data.get("price") || document.getElementById("price")?.value),
        duration: data.get("duration") || document.getElementById("duration")?.value.trim(),
        capacity: Number(data.get("capacity") || document.getElementById("capacity")?.value),
        startDate: data.get("startDate") || document.getElementById("startDate")?.value,
        endDate: data.get("endDate") || document.getElementById("endDate")?.value,
        description: data.get("description") || document.getElementById("description")?.value.trim(),
        itinerary: data.get("itinerary") || document.getElementById("itinerary")?.value.trim()
    };
}
function validDates(start, end) { return !!start && !!end && end >= start; }

document.addEventListener("DOMContentLoaded", () => {
    const packageForm = document.getElementById("packageForm");
    if (packageForm) {
        packageForm.addEventListener("submit", event => {
            event.preventDefault();
            const item = packageFromForm(packageForm);
            if (!validDates(item.startDate, item.endDate)) {
                showMessage("message", "End date must be on or after the start date.", true); return;
            }
            if (item.price <= 0 || item.capacity <= 0) {
                showMessage("message", "Price and available seats must be greater than zero.", true); return;
            }
            const packages = getData(PACKAGE_KEY);
            packages.push(item);
            saveData(PACKAGE_KEY, packages);
            packageForm.reset();
            showMessage("message", "Package saved in this browser. You can view it in My Packages.");
        });
    }

    const packageList = document.getElementById("packageList");
    if (packageList) {
        const packages = getData(PACKAGE_KEY);
        if (!packages.length) packageList.innerHTML = '<p class="note">No packages added yet. Use Add Package to create your first package.</p>';
        packages.forEach(item => {
            const card = document.createElement("div");
            card.className = "card";
            const heading = document.createElement("h3"); heading.textContent = item.name;
            const details = document.createElement("p");
            details.textContent = `${item.destination} | ${item.duration} | ₹${item.price} per person | ${item.capacity} seats`;
            const dates = document.createElement("p"); dates.textContent = `${item.startDate} to ${item.endDate}`;
            const actions = document.createElement("div"); actions.className = "actions";
            const edit = document.createElement("a"); edit.className = "button"; edit.href = `edit-package.html?id=${encodeURIComponent(item.id)}`; edit.textContent = "Edit";
            const remove = document.createElement("button"); remove.className = "danger"; remove.textContent = "Delete";
            remove.addEventListener("click", () => {
                if (!confirm("Delete this package?")) return;
                saveData(PACKAGE_KEY, getData(PACKAGE_KEY).filter(p => p.id !== item.id));
                location.reload();
            });
            actions.append(edit, remove); card.append(heading, details, dates, actions); packageList.append(card);
        });
    }

    const editForm = document.getElementById("editPackageForm");
    if (editForm) {
        const id = new URLSearchParams(location.search).get("id");
        const packages = getData(PACKAGE_KEY);
        const item = packages.find(p => p.id === id);
        if (!item) {
            showMessage("message", "Package not found. Open Edit from the My Packages page.", true);
            editForm.querySelector("button").disabled = true;
        } else {
            Object.keys(item).forEach(key => {
                const field = document.getElementById(key);
                if (field) field.value = item[key];
            });
            document.getElementById("packageId").value = item.id;
        }
        editForm.addEventListener("submit", event => {
            event.preventDefault();
            const updated = packageFromForm(editForm);
            updated.id = document.getElementById("packageId").value;
            if (!validDates(updated.startDate, updated.endDate)) {
                showMessage("message", "End date must be on or after the start date.", true); return;
            }
            saveData(PACKAGE_KEY, getData(PACKAGE_KEY).map(p => p.id === updated.id ? updated : p));
            showMessage("message", "Package updated successfully in this browser.");
        });
    }

    const availabilityForm = document.getElementById("availabilityForm");
    if (availabilityForm) {
        const select = document.getElementById("package");
        const packages = getData(PACKAGE_KEY);
        packages.forEach(p => { const option = document.createElement("option"); option.value = p.id; option.textContent = p.name; select.append(option); });
        const list = document.getElementById("availabilityList");
        getData(AVAILABILITY_KEY).forEach(a => {
            const card = document.createElement("div"); card.className = "card";
            const title = document.createElement("h3"); title.textContent = a.packageName;
            const text = document.createElement("p"); text.textContent = `${a.start} to ${a.end} | ${a.seats} seats`;
            card.append(title, text); list.append(card);
        });
        availabilityForm.addEventListener("submit", event => {
            event.preventDefault();
            const selected = packages.find(p => p.id === select.value);
            const start = document.getElementById("start").value;
            const end = document.getElementById("end").value;
            const seats = Number(document.getElementById("seats").value);
            if (!selected) { showMessage("message", "Please add and select a package first.", true); return; }
            if (!validDates(start, end) || seats < 1) { showMessage("message", "Enter valid dates and at least one seat.", true); return; }
            const rows = getData(AVAILABILITY_KEY);
            rows.push({ packageId: selected.id, packageName: selected.name, start, end, seats });
            saveData(AVAILABILITY_KEY, rows);
            showMessage("message", "Availability saved in this browser.");
            availabilityForm.reset();
            setTimeout(() => location.reload(), 500);
        });
    }

    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
        const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
        Object.entries(profile).forEach(([key, value]) => { const field = document.getElementById(key); if (field) field.value = value; });
        profileForm.addEventListener("submit", event => {
            event.preventDefault();
            const data = {};
            profileForm.querySelectorAll("input,textarea").forEach(field => data[field.id] = field.value.trim());
            localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
            showMessage("message", "Profile saved in this browser.");
        });
    }

    const count = getData(PACKAGE_KEY).length;
    const dashboardCount = document.getElementById("dashboardPackages");
    const reportCount = document.getElementById("reportPackages");
    if (dashboardCount) dashboardCount.textContent = count;
    if (reportCount) reportCount.textContent = count;
});
