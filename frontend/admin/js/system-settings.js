// ============================================
// YAADHUM OOORE - SYSTEM SETTINGS
// Super Admin Platform Configuration
// ============================================

const api = window.YaadhumAPI;

document.addEventListener("DOMContentLoaded", function () {
    const settings = api ? api.getSettings() : {};
    const form = document.querySelector("form");
    if (!form) return;

    // Hydrate form fields if any match
    Object.entries(settings).forEach(([key, val]) => {
        const input = document.getElementById(key);
        if (input) {
            if (input.type === 'checkbox') input.checked = Boolean(val);
            else input.value = val;
        }
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const updated = { ...settings };
        form.querySelectorAll("input, select").forEach(field => {
            if (field.id) {
                if (field.type === 'checkbox') updated[field.id] = field.checked;
                else updated[field.id] = field.value;
            }
        });

        if (api) api.saveSettings(updated);
        alert("Platform system settings updated successfully!");
    });
});
