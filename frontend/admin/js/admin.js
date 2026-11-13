
// ==========================================
// YAADHUM OOORE - ADMIN DASHBOARD JAVASCRIPT
// ==========================================

function checkAdminAuth() {
  const path = window.location.pathname;
  if (path.includes('admin-login.html')) return;
  let user = null;
  try {
    const raw = sessionStorage.getItem('yaadhum_session') || localStorage.getItem('yaadhum_session') || localStorage.getItem('yaadhum_admin_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      user = parsed.user || parsed;
    }
  } catch(e) {}

  if (!user) {
    window.location.href = 'admin-login.html';
    return;
  }
  if (user.role === 'customer') {
    window.location.href = '../customer/customer-dashboard.html';
    return;
  }
  if (user.role === 'provider') {
    window.location.href = '../provider/provider-dashboard.html';
    return;
  }
}
checkAdminAuth();


// 1. DISPLAY A TIME-BASED WELCOME MESSAGE

function displayWelcomeMessage() {

    const heading = document.querySelector("main h2");

    const hour = new Date().getHours();

    let greeting;

    if (hour < 12) {
        greeting = "Good Morning";
    }
    else if (hour < 17) {
        greeting = "Good Afternoon";
    }
    else {
        greeting = "Good Evening";
    }

    heading.textContent = greeting + ", Administrator!";
}


// 2. DISPLAY CURRENT DATE

function displayCurrentDate() {

    const main = document.querySelector("main");

    const dateElement = document.createElement("p");

    const today = new Date();

    dateElement.textContent = "Date: " +
        today.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    dateElement.id = "current-date";

    main.insertBefore(dateElement, main.children[1]);
}


// 3. DISPLAY DASHBOARD STATISTICS

function displayDashboardStats() {

    // Sample data for frontend demonstration

    const statistics = [
        {
            title: "Total Customers",
            count: 250,
            description: "Registered customers"
        },
        {
            title: "Total Providers",
            count: 35,
            description: "Registered providers"
        },
        {
            title: "Pending Approvals",
            count: 12,
            description: "Require administrator review"
        },
        {
            title: "Total Bookings",
            count: 180,
            description: "Bookings received"
        }
    ];

    const statsSection = document.createElement("section");

    statsSection.className = "dashboard-stats";

    statistics.forEach(function (item) {

        const statCard = document.createElement("div");

        statCard.className = "stat-card";

        const title = document.createElement("h3");
        title.textContent = item.title;

        const count = document.createElement("h2");
        count.textContent = item.count;

        const description = document.createElement("p");
        description.textContent = item.description;

        statCard.appendChild(title);
        statCard.appendChild(count);
        statCard.appendChild(description);

        statsSection.appendChild(statCard);
    });

    const cardsSection = document.querySelector(".cards");

    cardsSection.parentNode.insertBefore(
        statsSection,
        cardsSection
    );
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


// 5. SHOW A MESSAGE WHEN A DASHBOARD LINK IS CLICKED

function addClickMessages() {

    const buttons = document.querySelectorAll(".card .button");

    buttons.forEach(function (button) {

        button.addEventListener("click", function () {

            const pageName = button.textContent.trim();

            console.log("Opening page: " + pageName);

        });

    });
}


// 6. UPDATE FOOTER WITH CURRENT YEAR

function updateFooter() {

    const footer = document.querySelector("footer p");

    const currentYear = new Date().getFullYear();

    footer.textContent =
        "YAADHUM OOORE | Explore Your World | " + currentYear;
}


// 7. RUN ALL FUNCTIONS WHEN THE PAGE LOADS

document.addEventListener("DOMContentLoaded", function () {

    displayWelcomeMessage();

    displayCurrentDate();

    displayDashboardStats();

    highlightActiveNavigation();

    addClickMessages();

    updateFooter();

});
