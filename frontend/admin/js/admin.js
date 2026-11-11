// ==========================================
// YAADHUM OOORE - ADMIN DASHBOARD JAVASCRIPT
// Integrated with Shared State & Real Statistics
// ==========================================

// 1. DISPLAY A TIME-BASED WELCOME MESSAGE
function displayWelcomeMessage() {
    const heading = document.querySelector("main h2");
    if (!heading) return;
    const hour = new Date().getHours();
    let greeting = "Good Evening";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 17) greeting = "Good Afternoon";

    const user = window.YaadhumSession ? window.YaadhumSession.getUser() : null;
    const adminName = user ? user.name : "Administrator";
    heading.textContent = `${greeting}, ${adminName}!`;
}

// 2. DISPLAY CURRENT DATE
function displayCurrentDate() {
    const main = document.querySelector("main");
    if (!main) return;
    let dateElement = document.getElementById("current-date");
    if (!dateElement) {
        dateElement = document.createElement("p");
        dateElement.id = "current-date";
        main.insertBefore(dateElement, main.children[1]);
    }
    const today = new Date();
    dateElement.textContent = "Date: " +
        today.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
}

// 3. DISPLAY DASHBOARD STATISTICS
function displayDashboardStats() {
    const api = window.YaadhumAPI;
    const customersCount = api ? api.getUsers('customer').length : 12;
    const providersCount = api ? api.getUsers('provider').length : 4;
    const pendingCount = api ? api.getPackages({ status: 'Pending' }).length : 1;
    const bookingsCount = api ? api.getBookings().length : 4;

    const statistics = [
        {
            title: "Total Customers",
            count: customersCount,
            description: "Registered travelers"
        },
        {
            title: "Total Providers",
            count: providersCount,
            description: "Registered local tour hosts"
        },
        {
            title: "Pending Packages",
            count: pendingCount,
            description: "Require administrator review"
        },
        {
            title: "Total Bookings",
            count: bookingsCount,
            description: "Active & completed bookings"
        }
    ];

    let statsSection = document.querySelector(".dashboard-stats");
    if (statsSection) statsSection.remove();

    statsSection = document.createElement("section");
    statsSection.className = "dashboard-stats";
    statsSection.style.cssText = "display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 20px 0;";

    statistics.forEach(function (item) {
        const statCard = document.createElement("div");
        statCard.className = "stat-card";
        statCard.style.cssText = "background: #fff; border: 1px solid #e2e8f0; border-left: 4px solid #1A365D; border-radius: 8px; padding: 16px;";

        const title = document.createElement("h3");
        title.style.cssText = "margin: 0; font-size: 13px; color: #718096; text-transform: uppercase;";
        title.textContent = item.title;

        const count = document.createElement("h2");
        count.style.cssText = "margin: 8px 0; font-size: 26px; color: #1A365D;";
        count.textContent = item.count;

        const description = document.createElement("p");
        description.style.cssText = "margin: 0; font-size: 12px; color: #718096;";
        description.textContent = item.description;

        statCard.appendChild(title);
        statCard.appendChild(count);
        statCard.appendChild(description);
        statsSection.appendChild(statCard);
    });

    const cardsSection = document.querySelector(".cards");
    if (cardsSection && cardsSection.parentNode) {
        cardsSection.parentNode.insertBefore(statsSection, cardsSection);
    }
}

// 4. HIGHLIGHT THE CURRENT NAVIGATION LINK
function highlightActiveNavigation() {
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll("nav a");
    navLinks.forEach(function (link) {
        const linkPage = link.getAttribute("href");
        if (linkPage === currentPage) {
            link.classList.add("active");
        }
    });
}

// 5. UPDATE FOOTER WITH CURRENT YEAR
function updateFooter() {
    const footer = document.querySelector("footer p");
    if (footer) {
        const currentYear = new Date().getFullYear();
        footer.textContent = "YAADHUM OOORE | Explore Your World | " + currentYear;
    }
}

// 6. RUN ALL FUNCTIONS WHEN THE PAGE LOADS
document.addEventListener("DOMContentLoaded", function () {
    displayWelcomeMessage();
    displayCurrentDate();
    displayDashboardStats();
    highlightActiveNavigation();
    updateFooter();
});
