// Default platform settings
const defaultSettings = {
    websiteName: "YAADHUM OOORE",
    websiteDescription: "Local Tourism Package Booking Platform",
    supportEmail: "support@yaadhumooore.com",
    supportPhone: "9876543210",
    websiteStatus: true,
    maintenanceMode: false,
    bookingLimit: 10,
    allowBookings: true,
    requireApproval: false
};

// Current settings
let systemSettings = { ...defaultSettings };

// Load settings into the form
function loadSettings() {

    document.getElementById("websiteName").value =
        systemSettings.websiteName;

    document.getElementById("websiteDescription").value =
        systemSettings.websiteDescription;

    document.getElementById("supportEmail").value =
        systemSettings.supportEmail;

    document.getElementById("supportPhone").value =
        systemSettings.supportPhone;

    document.getElementById("websiteStatus").checked =
        systemSettings.websiteStatus;

    document.getElementById("maintenanceMode").checked =
        systemSettings.maintenanceMode;

    document.getElementById("bookingLimit").value =
        systemSettings.bookingLimit;

    document.getElementById("allowBookings").checked =
        systemSettings.allowBookings;

    document.getElementById("requireApproval").checked =
        systemSettings.requireApproval;
}

// Save settings from the form
function saveSettings(event) {

    event.preventDefault();

    const bookingLimit =
        Number(document.getElementById("bookingLimit").value);

    if (!Number.isInteger(bookingLimit) ||
        bookingLimit < 1 ||
        bookingLimit > 50) {

        alert("Booking limit must be between 1 and 50.");
        return;
    }

    systemSettings = {

        websiteName:
            document.getElementById("websiteName").value.trim(),

        websiteDescription:
            document.getElementById("websiteDescription").value.trim(),

        supportEmail:
            document.getElementById("supportEmail").value.trim(),

        supportPhone:
            document.getElementById("supportPhone").value.trim(),

        websiteStatus:
            document.getElementById("websiteStatus").checked,

        maintenanceMode:
            document.getElementById("maintenanceMode").checked,

        bookingLimit: bookingLimit,

        allowBookings:
            document.getElementById("allowBookings").checked,

        requireApproval:
            document.getElementById("requireApproval").checked
    };

    document.getElementById("settingsMessage").textContent =
        "System settings updated successfully in this session.";

    alert("System settings saved successfully.");
}

// Reset settings to default values
function resetSettings() {

    if (confirm("Are you sure you want to reset all settings to default?")) {

        systemSettings = { ...defaultSettings };

        loadSettings();

        document.getElementById("settingsMessage").textContent =
            "All settings have been restored to their default values.";

        alert("Settings reset successfully.");
    }
}

// Event listeners
document.getElementById("settingsForm")
    .addEventListener("submit", saveSettings);

document.getElementById("resetSettingsButton")
    .addEventListener("click", resetSettings);

// Initial load
loadSettings();