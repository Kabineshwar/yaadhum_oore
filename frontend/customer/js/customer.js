/**
 * ==========================================================================
 * YAADHUM OOORE - Customer Module JavaScript
 * Modular Vanilla JavaScript Library
 * "யாதும் ஊரே யாவரும் கேளிர்"
 * ==========================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.YaadhumCustomer = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Configuration & Constants
  // --------------------------------------------------------------------------
  const CONFIG = {
    // Configurable API base URL matching Person 2's native Node.js HTTP server
    API_BASE: '/api',
    SESSION_STORAGE_KEY: 'yaadhum_customer_session',
    LOCAL_STORAGE_KEY: 'yaadhum_customer_user',
    WISHLIST_KEY: 'yaadhum_wishlist',
    COMPARE_KEY: 'yaadhum_compare',
    BOOKINGS_KEY: 'yaadhum_demo_bookings',
    REQUEST_TIMEOUT_MS: 8000
  };

  // --------------------------------------------------------------------------
  // 2. Centralized Fetch API Wrapper
  // --------------------------------------------------------------------------
  const apiClient = {
    /**
     * Core request handler using native Fetch API.
     * @param {string} endpoint - API route (e.g. '/auth/login')
     * @param {Object} options - Standard fetch options (method, headers, body)
     * @returns {Promise<{success: boolean, data?: any, error?: string, isDemo?: boolean}>}
     */
    async request(endpoint, options = {}) {
      const url = `${CONFIG.API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      };

      const fetchConfig = {
        method: options.method || 'GET',
        headers: headers,
        credentials: 'same-origin',
        ...options
      };

      if (options.body && typeof options.body === 'object') {
        fetchConfig.body = JSON.stringify(options.body);
      }

      // Setup AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
      fetchConfig.signal = controller.signal;

      try {
        const response = await fetch(url, fetchConfig);
        clearTimeout(timeoutId);

        let data = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = { success: response.ok, message: text };
        }

        if (!response.ok) {
          const errorMsg = (data && data.error) || (data && data.message) || `HTTP error ${response.status}`;
          return { success: false, error: errorMsg, status: response.status };
        }

        return data;
      } catch (err) {
        clearTimeout(timeoutId);
        // Distinguish between timeout and connection refused
        if (err.name === 'AbortError') {
          return { success: false, error: 'Request timed out. Please check your network connection.' };
        }
        // In academic development, Person 2's backend server may not be running yet
        return {
          success: false,
          error: 'Unable to connect to backend server. (Person 2 server offline)',
          isOffline: true
        };
      }
    },

    get(endpoint, params = {}) {
      let query = '';
      const keys = Object.keys(params);
      if (keys.length > 0) {
        const searchParams = new URLSearchParams();
        keys.forEach(k => {
          if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
            searchParams.append(k, params[k]);
          }
        });
        const qs = searchParams.toString();
        if (qs) query = `?${qs}`;
      }
      return this.request(`${endpoint}${query}`, { method: 'GET' });
    },

    post(endpoint, body = {}) {
      return this.request(endpoint, { method: 'POST', body: body });
    },

    put(endpoint, body = {}) {
      return this.request(endpoint, { method: 'PUT', body: body });
    },

    delete(endpoint) {
      return this.request(endpoint, { method: 'DELETE' });
    }
  };

  // --------------------------------------------------------------------------
  // 3. Form Validation & DOM Notification Utilities
  // --------------------------------------------------------------------------
  const FormValidator = {
    /**
     * Checks if a string is non-empty after trimming.
     */
    isRequired(val) {
      return typeof val === 'string' && val.trim().length > 0;
    },

    /**
     * Standard RFC 5322 compatible email regex.
     */
    isValidEmail(email) {
      if (!email) return false;
      const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      return re.test(String(email).trim());
    },

    /**
     * Validates Indian 10-digit mobile number (starts with 6, 7, 8, or 9).
     */
    isValidIndianPhone(phone) {
      if (!phone) return false;
      const cleaned = String(phone).replace(/[\s\-()]/g, '');
      const re = /^[6-9]\d{9}$/;
      return re.test(cleaned);
    },

    /**
     * Validates 6-digit Indian postal code.
     */
    isValidPincode(pincode) {
      if (!pincode) return false;
      const re = /^[1-9][0-9]{5}$/;
      return re.test(String(pincode).trim());
    },

    /**
     * Minimum 8 characters; recommends at least one letter and one number.
     */
    isValidPassword(pwd) {
      if (!pwd || typeof pwd !== 'string') return false;
      return pwd.length >= 8;
    },

    /**
     * Displays a field-specific validation error message.
     */
    showFieldError(fieldId, errorMsg) {
      const field = document.getElementById(fieldId);
      const errorSpan = document.getElementById(`${fieldId}Error`);
      if (field) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
      }
      if (errorSpan) {
        errorSpan.textContent = errorMsg;
        errorSpan.classList.add('is-visible');
      }
    },

    /**
     * Clears field validation error.
     */
    clearFieldError(fieldId) {
      const field = document.getElementById(fieldId);
      const errorSpan = document.getElementById(`${fieldId}Error`);
      if (field) {
        field.classList.remove('is-invalid');
      }
      if (errorSpan) {
        errorSpan.textContent = '';
        errorSpan.classList.remove('is-visible');
      }
    },

    /**
     * Marks a field as valid.
     */
    markFieldValid(fieldId) {
      const field = document.getElementById(fieldId);
      const errorSpan = document.getElementById(`${fieldId}Error`);
      if (field) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
      }
      if (errorSpan) {
        errorSpan.textContent = '';
        errorSpan.classList.remove('is-visible');
      }
    },

    /**
     * Clears all validation states within a form.
     */
    clearAllErrors(formElement) {
      if (!formElement) return;
      const inputs = formElement.querySelectorAll('.is-invalid, .is-valid');
      inputs.forEach(el => el.classList.remove('is-invalid', 'is-valid'));

      const errors = formElement.querySelectorAll('.form-error-msg');
      errors.forEach(el => {
        el.textContent = '';
        el.classList.remove('is-visible');
      });
    },

    /**
     * Shows top-level notification banner inside a container.
     */
    showAlert(containerId, message, type = 'error') {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.className = `alert alert-${type} is-visible`;
      container.innerHTML = message;
      container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    /**
     * Hides alert banner.
     */
    hideAlert(containerId) {
      const container = document.getElementById(containerId);
      if (container) {
        container.className = 'alert';
        container.innerHTML = '';
      }
    },

    /**
     * Initializes show/hide password buttons.
     */
    initPasswordToggles() {
      const toggleButtons = document.querySelectorAll('.password-toggle-btn');
      toggleButtons.forEach(btn => {
        // Prevent duplicate listener attachments
        if (btn.dataset.initialized === 'true') return;
        btn.dataset.initialized = 'true';

        btn.addEventListener('click', function (e) {
          e.preventDefault();
          const targetId = this.getAttribute('data-target');
          const targetInput = document.getElementById(targetId);
          if (!targetInput) return;

          if (targetInput.type === 'password') {
            targetInput.type = 'text';
            this.textContent = 'Hide';
            this.setAttribute('aria-label', 'Hide password');
          } else {
            targetInput.type = 'password';
            this.textContent = 'Show';
            this.setAttribute('aria-label', 'Show password');
          }
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // 4. Customer Authentication Interface
  // --------------------------------------------------------------------------
  const CustomerAuth = {
    /**
     * Retrieves currently signed-in user profile (SAFE data only: name, email, city).
     * IMPORTANT: Passwords are NEVER stored.
     */
    getCurrentUser() {
      try {
        const sessionData = sessionStorage.getItem(CONFIG.SESSION_STORAGE_KEY);
        if (sessionData) return JSON.parse(sessionData);

        const localData = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY);
        if (localData) return JSON.parse(localData);
      } catch (err) {
        console.warn('Session parsing error:', err);
      }
      return null;
    },

    /**
     * Checks if customer is currently logged in.
     */
    isAuthenticated() {
      return Boolean(this.getCurrentUser());
    },

    /**
     * Stores safe session token and user profile in storage.
     * Absolutely NO password or sensitive credential is persisted.
     */
    setSession(userProfile, remember = false) {
      const safeData = {
        id: userProfile.id || 'cust_' + Date.now(),
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone || '',
        dob: userProfile.dob || '',
        gender: userProfile.gender || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || 'Tamil Nadu',
        pincode: userProfile.pincode || '',
        memberSince: userProfile.memberSince || 'March 2026',
        status: userProfile.status || 'Active',
        role: 'customer',
        loginTime: userProfile.loginTime || new Date().toISOString()
      };

      const serialized = JSON.stringify(safeData);
      if (remember) {
        localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, serialized);
      } else {
        sessionStorage.setItem(CONFIG.SESSION_STORAGE_KEY, serialized);
      }
      return safeData;
    },

    /**
     * Clears all session and local storage user tokens.
     */
    clearSession() {
      sessionStorage.removeItem(CONFIG.SESSION_STORAGE_KEY);
      localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEY);
    },

    /**
     * Handles customer login submission.
     * 1. Attempts live API request to Person 2's backend: POST /api/auth/login.
     * 2. If backend is not available, informs user clearly and provides demo mode.
     */
    async login({ email, password, remember = false }) {
      // Clear previous alerts
      FormValidator.hideAlert('loginAlert');

      // 1. Send live request to backend
      const result = await apiClient.post('/auth/login', { email, password });

      if (result.success && result.data && result.data.user) {
        this.setSession(result.data.user, remember);
        return { success: true, user: result.data.user, isDemo: false };
      }

      // If backend responded with an authentic failure (e.g., invalid credentials)
      if (result.status === 401 || result.status === 400) {
        return { success: false, error: result.error || 'Invalid email or password.' };
      }

      // 2. Academic Demonstration Fallback (when backend server has not yet been started by Person 2)
      if (result.isOffline) {
        console.info('Backend server is offline. Running in Academic Demonstration Mode.');

        // For academic demonstration, check against a known demo identity
        const isDemoAdmin = email === 'customer@yaadhum.local';
        const simulatedUser = {
          id: 101,
          name: email.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()),
          email: email,
          phone: '9876543210',
          city: 'Chennai',
          role: 'customer'
        };

        this.setSession(simulatedUser, remember);

        return {
          success: true,
          user: simulatedUser,
          isDemo: true,
          notice: 'Backend API is currently offline. Logged in via Academic Demonstration Mode (Client prototype).'
        };
      }

      return { success: false, error: result.error || 'Authentication failed. Please try again.' };
    },

    /**
     * Handles customer registration submission.
     * 1. Attempts live API request to Person 2's backend: POST /api/auth/register.
     * 2. If backend is not available, informs user and provides safe demonstration mode.
     */
    async register(regData) {
      FormValidator.hideAlert('registerAlert');

      // 1. Send live request to backend
      const result = await apiClient.post('/auth/register', regData);

      if (result.success) {
        return { success: true, data: result.data, isDemo: false };
      }

      // If backend responded with validation error (e.g. email already exists)
      if (result.status === 409 || result.status === 400) {
        return { success: false, error: result.error || 'Registration failed. Email may already be in use.' };
      }

      // 2. Academic Demonstration Fallback (Person 2 server offline)
      if (result.isOffline) {
        console.info('Backend server is offline. Simulating registration in Academic Demonstration Mode.');

        const simulatedNewUser = {
          id: Date.now(),
          name: regData.name,
          email: regData.email,
          phone: regData.phone,
          city: regData.city,
          role: 'customer'
        };

        // Do NOT store passwords anywhere!
        return {
          success: true,
          user: simulatedNewUser,
          isDemo: true,
          notice: 'Backend API is currently offline. Account registration successfully validated in Academic Demonstration Mode.'
        };
      }

      return { success: false, error: result.error || 'Registration request failed. Please try again.' };
    },

    /**
     * Customer logout.
     */
    async logout() {
      try {
        await apiClient.post('/auth/logout', {});
      } catch (err) {
        // Ignore network errors on logout
      }
      this.clearSession();
      window.location.href = 'login.html';
    },

    /**
     * Retrieves customer profile information, with graceful defaults if some attributes are absent.
     * @returns {Object} Complete safe profile object
     */
    getProfile() {
      const user = this.getCurrentUser();
      if (user) {
        return {
          id: user.id || 'CUST-101',
          name: user.name || 'Valued Traveller',
          email: user.email || 'customer@yaadhum.local',
          phone: user.phone || '9876543210',
          dob: user.dob || '1995-06-15',
          gender: user.gender || 'Prefer not to say',
          address: user.address || '42, Heritage Street, Near Temple Gate',
          city: user.city || 'Madurai',
          state: user.state || 'Tamil Nadu',
          pincode: user.pincode || '625001',
          memberSince: user.memberSince || (user.loginTime ? new Date(user.loginTime).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'March 2026'),
          status: user.status || 'Active',
          isDemo: Boolean(user.isDemo !== false)
        };
      }

      // Default demo profile when inspecting profile without prior login
      return {
        id: 'CUST-101',
        name: 'Anandha Kannan',
        email: 'customer@yaadhum.local',
        phone: '9840123456',
        dob: '1994-08-20',
        gender: 'Male',
        address: '15, Sannathi Street, Chidambaram Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600004',
        memberSince: 'January 2026',
        status: 'Active',
        isDemo: true
      };
    },

    /**
     * Update customer profile information.
     * Attempts live backend PUT /api/customer/profile, with graceful fallback to safe session store.
     * @param {Object} profileData
     * @returns {Promise<{success: boolean, data?: any, error?: string, isDemo?: boolean, notice?: string}>}
     */
    async updateProfile(profileData) {
      // 1. Attempt live backend PUT /api/customer/profile
      try {
        const res = await apiClient.put('/customer/profile', profileData);
        if (res && res.success && !res.isDemo) {
          const isRemembered = Boolean(localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY));
          this.setSession(res.data, isRemembered);
          return { success: true, data: res.data, isDemo: false };
        }
      } catch (err) {
        console.info('Backend profile endpoint offline, using demonstration profile engine.');
      }

      // 2. Demonstration Fallback: update non-sensitive fields in active session/local storage
      const current = this.getProfile();
      const updatedUser = {
        ...current,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        dob: profileData.dob !== undefined ? profileData.dob : current.dob,
        gender: profileData.gender !== undefined ? profileData.gender : current.gender,
        address: profileData.address !== undefined ? profileData.address : current.address,
        city: profileData.city !== undefined ? profileData.city : current.city,
        state: profileData.state !== undefined ? profileData.state : current.state,
        pincode: profileData.pincode !== undefined ? profileData.pincode : current.pincode,
        updatedAt: new Date().toISOString(),
        isDemo: true
      };

      const isRemembered = Boolean(localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY));
      this.setSession(updatedUser, isRemembered);

      return {
        success: true,
        data: updatedUser,
        isDemo: true,
        notice: 'Profile updated in Academic Demonstration Mode (Client session only). Live MySQL synchronization requires Person 2 backend connectivity.'
      };
    },

    /**
     * Change account password.
     * Strictly verifies input, attempts live backend endpoint PUT /api/customer/password.
     * NEVER persists, stores, or simulates passwords client-side.
     * @param {Object} passwordPayload
     * @returns {Promise<{success: boolean, error?: string, message?: string, isOffline?: boolean}>}
     */
    async changePassword({ currentPassword, newPassword, confirmPassword }) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return { success: false, error: 'All password fields are required.' };
      }
      if (newPassword.length < 8) {
        return { success: false, error: 'New password must be at least 8 characters long.' };
      }
      if (newPassword !== confirmPassword) {
        return { success: false, error: 'New password and confirmation password do not match.' };
      }

      // Attempt live backend update via Person 2's secure endpoint
      try {
        const res = await apiClient.put('/customer/password', { currentPassword, newPassword });
        if (res && res.success) {
          return { success: true, message: 'Password updated successfully.', isDemo: false };
        }
        if (res && !res.isOffline && res.error) {
          return { success: false, error: res.error };
        }
      } catch (err) {
        // Backend offline
      }

      return {
        success: false,
        isOffline: true,
        error: 'Backend Server Offline: Password change requires a secure, live database connection to Person 2’s backend authentication service. For security integrity, password updates cannot be simulated on the client.'
      };
    }
  };

  // --------------------------------------------------------------------------
  // 5. Automatic DOM Binding for Auth & Discovery Pages
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    // A. Initialize password toggle buttons
    FormValidator.initPasswordToggles();

    // B. Handle Mobile Navigation if present
    const mobileToggle = document.getElementById('mobileNavToggle');
    const mainNav = document.getElementById('mainNav');
    if (mobileToggle && mainNav) {
      mobileToggle.addEventListener('click', function () {
        mainNav.classList.toggle('is-open');
      });
    }

    // C. Setup Login Form Handler if present on the page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      setupLoginForm(loginForm);
    }

    // D. Setup Registration Form Handler if present on the page
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      setupRegisterForm(registerForm);
    }

    // E. Initialize Compare Floating Bar if present or on discovery pages
    CompareService.updateFloatingBar();

    // F. Setup Destinations Page Handler if present
    if (document.getElementById('destinationsGrid')) {
      setupDestinationsPage();
    }

    // G. Setup Packages Page Handler if present
    if (document.getElementById('packagesGrid')) {
      setupPackagesPage();
    }

    // H. Setup Search Packages Page Handler if present
    if (document.getElementById('searchResultsGrid')) {
      setupSearchPage();
    }

    // I. Setup Package Details Page Handler if present
    if (document.getElementById('packageDetailsContainer')) {
      setupPackageDetailsPage();
    }

    // J. Setup Wishlist Page Handler if present
    if (document.getElementById('wishlistGrid')) {
      setupWishlistPage();
    }

    // K. Setup Compare Page Handler if present
    if (document.getElementById('compareContainer')) {
      setupComparePage();
    }

    // L. Setup Booking Page Handler if present
    if (document.getElementById('bookingContainer')) {
      setupBookingPage();
    }

    // M. Setup My Bookings Page Handler if present
    if (document.getElementById('myBookingsContainer')) {
      setupMyBookingsPage();
    }

    // N. Setup Profile Page Handler if present
    if (document.getElementById('profileContainer')) {
      setupProfilePage();
    }

    // O. Setup Customer Dashboard Page Handler if present
    if (document.getElementById('customerDashboardContainer')) {
      setupCustomerDashboardPage();
    }
  });

  /**
   * Wires up client-side validation and submission for login.html.
   */
  function setupLoginForm(form) {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('rememberMe');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Real-time input cleaning
    emailInput.addEventListener('input', () => FormValidator.clearFieldError('email'));
    passwordInput.addEventListener('input', () => FormValidator.clearFieldError('password'));

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      FormValidator.clearAllErrors(form);
      FormValidator.hideAlert('loginAlert');

      let isValid = true;
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const remember = rememberCheckbox ? rememberCheckbox.checked : false;

      // Validate email
      if (!FormValidator.isRequired(email)) {
        FormValidator.showFieldError('email', 'Email address is required.');
        isValid = false;
      } else if (!FormValidator.isValidEmail(email)) {
        FormValidator.showFieldError('email', 'Please enter a valid email address (e.g. user@example.com).');
        isValid = false;
      } else {
        FormValidator.markFieldValid('email');
      }

      // Validate password
      if (!FormValidator.isRequired(password)) {
        FormValidator.showFieldError('password', 'Password is required.');
        isValid = false;
      } else if (password.length < 6) {
        FormValidator.showFieldError('password', 'Password must be at least 6 characters.');
        isValid = false;
      } else {
        FormValidator.markFieldValid('password');
      }

      if (!isValid) return;

      // Disable button while processing
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Signing in...';
      }

      const res = await CustomerAuth.login({ email, password, remember });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In to YAADHUM OOORE &rarr;';
      }

      if (res.success) {
        let msg = `<strong>Welcome back, ${res.user.name}!</strong> Login successful.`;
        if (res.isDemo) {
          msg += `<br><small style="margin-top:4px; display:inline-block;">${res.notice}</small>`;
        }
        FormValidator.showAlert('loginAlert', msg, 'success');

        // Redirect to dashboard or landing page after brief feedback
        setTimeout(() => {
          window.location.href = 'customer-dashboard.html';
        }, 1200);
      } else {
        FormValidator.showAlert('loginAlert', `<strong>Sign In Failed:</strong> ${res.error}`, 'error');
      }
    });
  }

  /**
   * Wires up client-side validation and submission for register.html.
   */
  function setupRegisterForm(form) {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const addressInput = document.getElementById('address');
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    const pincodeInput = document.getElementById('pincode');
    const termsCheckbox = document.getElementById('terms');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Real-time clearing
    const fields = [nameInput, emailInput, phoneInput, passwordInput, confirmPasswordInput, addressInput, cityInput, stateInput, pincodeInput];
    fields.forEach(f => {
      if (f) f.addEventListener('input', () => FormValidator.clearFieldError(f.id));
    });
    if (termsCheckbox) {
      termsCheckbox.addEventListener('change', () => FormValidator.clearFieldError('terms'));
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      FormValidator.clearAllErrors(form);
      FormValidator.hideAlert('registerAlert');

      let isValid = true;

      // 1. Full Name
      if (!FormValidator.isRequired(nameInput.value)) {
        FormValidator.showFieldError('name', 'Full name is required.');
        isValid = false;
      } else if (nameInput.value.trim().length < 2) {
        FormValidator.showFieldError('name', 'Name must contain at least 2 characters.');
        isValid = false;
      } else {
        FormValidator.markFieldValid('name');
      }

      // 2. Email Address
      if (!FormValidator.isRequired(emailInput.value)) {
        FormValidator.showFieldError('email', 'Email address is required.');
        isValid = false;
      } else if (!FormValidator.isValidEmail(emailInput.value)) {
        FormValidator.showFieldError('email', 'Enter a valid email address (e.g. name@domain.com).');
        isValid = false;
      } else {
        FormValidator.markFieldValid('email');
      }

      // 3. Indian Phone Number
      if (!FormValidator.isRequired(phoneInput.value)) {
        FormValidator.showFieldError('phone', 'Mobile number is required.');
        isValid = false;
      } else if (!FormValidator.isValidIndianPhone(phoneInput.value)) {
        FormValidator.showFieldError('phone', 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
        isValid = false;
      } else {
        FormValidator.markFieldValid('phone');
      }

      // 4. Password
      if (!FormValidator.isRequired(passwordInput.value)) {
        FormValidator.showFieldError('password', 'Password is required.');
        isValid = false;
      } else if (!FormValidator.isValidPassword(passwordInput.value)) {
        FormValidator.showFieldError('password', 'Password must be at least 8 characters long.');
        isValid = false;
      } else {
        FormValidator.markFieldValid('password');
      }

      // 5. Confirm Password
      if (!FormValidator.isRequired(confirmPasswordInput.value)) {
        FormValidator.showFieldError('confirmPassword', 'Please re-enter your password.');
        isValid = false;
      } else if (confirmPasswordInput.value !== passwordInput.value) {
        FormValidator.showFieldError('confirmPassword', 'Passwords do not match. Please verify.');
        isValid = false;
      } else {
        FormValidator.markFieldValid('confirmPassword');
      }

      // 6. Address
      if (!FormValidator.isRequired(addressInput.value)) {
        FormValidator.showFieldError('address', 'Street address is required.');
        isValid = false;
      } else {
        FormValidator.markFieldValid('address');
      }

      // 7. City
      if (!FormValidator.isRequired(cityInput.value)) {
        FormValidator.showFieldError('city', 'City is required.');
        isValid = false;
      } else {
        FormValidator.markFieldValid('city');
      }

      // 8. State
      if (!FormValidator.isRequired(stateInput.value)) {
        FormValidator.showFieldError('state', 'State is required.');
        isValid = false;
      } else {
        FormValidator.markFieldValid('state');
      }

      // 9. Pincode
      if (!FormValidator.isRequired(pincodeInput.value)) {
        FormValidator.showFieldError('pincode', 'Postal code is required.');
        isValid = false;
      } else if (!FormValidator.isValidPincode(pincodeInput.value)) {
        FormValidator.showFieldError('pincode', 'Enter a valid 6-digit Indian PIN code (e.g. 600001).');
        isValid = false;
      } else {
        FormValidator.markFieldValid('pincode');
      }

      // 10. Terms and Conditions
      if (!termsCheckbox.checked) {
        FormValidator.showFieldError('terms', 'You must agree to the Terms of Service & Privacy Policy.');
        isValid = false;
      }

      if (!isValid) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Creating Account...';
      }

      const payload = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        password: passwordInput.value,
        address: addressInput.value.trim(),
        city: cityInput.value.trim(),
        state: stateInput.value.trim(),
        pincode: pincodeInput.value.trim()
      };

      const res = await CustomerAuth.register(payload);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Customer Account &rarr;';
      }

      if (res.success) {
        let msg = `<strong>Account Created Successfully!</strong> Welcome to YAADHUM OOORE.`;
        if (res.isDemo) {
          msg += `<br><small style="margin-top:4px; display:inline-block;">${res.notice}</small>`;
        }
        FormValidator.showAlert('registerAlert', msg, 'success');
        form.reset();

        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1800);
      } else {
        FormValidator.showAlert('registerAlert', `<strong>Registration Failed:</strong> ${res.error}`, 'error');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 6. Centralized Tourism Demonstration Dataset
  // --------------------------------------------------------------------------
  const DESTINATIONS_DATA = [
    {
      id: 'ooty',
      name: 'Ooty (Udhagamandalam)',
      tamilName: 'உதகமண்டலம்',
      location: 'Nilgiris District, Tamil Nadu',
      category: 'hills',
      categoryName: 'Hill Station',
      description: 'The Queen of Hill Stations, celebrated for misty tea estates, heritage mountain railways, botanical gardens, and cool pine valleys.',
      image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
      packageCount: 4,
      isFeatured: true
    },
    {
      id: 'kodaikanal',
      name: 'Kodaikanal',
      tamilName: 'கொடைக்கானல்',
      location: 'Dindigul District, Tamil Nadu',
      category: 'hills',
      categoryName: 'Hill Station',
      description: 'The Princess of Hill Stations, nestled in the Palani Hills with cloud-kissed lakes, rolling pine forests, and dramatic Pillar Rocks.',
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
      packageCount: 3,
      isFeatured: true
    },
    {
      id: 'valparai',
      name: 'Valparai',
      tamilName: 'வால்பாறை',
      location: 'Coimbatore District, Tamil Nadu',
      category: 'nature',
      categoryName: 'Nature & Wildlife',
      description: 'High-altitude rainforest sanctuary perched 3,500 ft above sea level, rich in tea plantations, Lion-tailed Macaques, and Great Hornbills.',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      packageCount: 2,
      isFeatured: false
    },
    {
      id: 'pollachi',
      name: 'Pollachi',
      tamilName: 'பொள்ளாச்சி',
      location: 'Coimbatore District, Tamil Nadu',
      category: 'nature',
      categoryName: 'Nature & Agriculture',
      description: 'Lush agricultural heartland flanked by emerald coconut groves, jaggery markets, and the gateway to Anamalai Tiger Reserve.',
      image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
      packageCount: 2,
      isFeatured: false
    },
    {
      id: 'madurai',
      name: 'Madurai',
      tamilName: 'மதுரை',
      location: 'Madurai District, Tamil Nadu',
      category: 'heritage',
      categoryName: 'Heritage & Culture',
      description: 'The ancient Cultural Capital of Tamil Nadu. Home to soaring gopurams of Meenakshi Amman Temple, jasmine bazars, and vibrant street food.',
      image: 'https://images.unsplash.com/photo-1609137144822-2615a639b780?auto=format&fit=crop&w=800&q=80',
      packageCount: 4,
      isFeatured: true
    },
    {
      id: 'thanjavur',
      name: 'Thanjavur',
      tamilName: 'தஞ்சாவூர்',
      location: 'Thanjavur District, Tamil Nadu',
      category: 'heritage',
      categoryName: 'Heritage & Art',
      description: 'Cradle of living Chola art and architecture, featuring the millennium-old Brihadisvara Great Temple, Tanjore art, and bronze crafts.',
      image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80',
      packageCount: 3,
      isFeatured: true
    },
    {
      id: 'rameswaram',
      name: 'Rameswaram',
      tamilName: 'ராமேஸ்வரம்',
      location: 'Ramanathapuram District, Tamil Nadu',
      category: 'coastal',
      categoryName: 'Coastal & Pilgrimage',
      description: 'Sacred island town across the Pamban sea bridge, adorned with legendary 1000-pillar temple corridors, coral shores, and Dhanushkodi ghost town.',
      image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
      packageCount: 3,
      isFeatured: true
    },
    {
      id: 'mahabalipuram',
      name: 'Mahabalipuram (Mamallapuram)',
      tamilName: 'மாமல்லபுரம்',
      location: 'Chengalpattu District, Tamil Nadu',
      category: 'heritage',
      categoryName: 'UNESCO Heritage & Coast',
      description: '7th-century Pallava coastal sanctuary boasting UNESCO Shore Temples, monolithic Pancha Rathas, and intricate granite rock reliefs.',
      image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
      packageCount: 2,
      isFeatured: false
    },
    {
      id: 'chettinad',
      name: 'Chettinad (Karaikudi)',
      tamilName: 'செட்டிநாடு',
      location: 'Sivaganga District, Tamil Nadu',
      category: 'cultural',
      categoryName: 'Heritage & Culinary',
      description: 'Renowned for grand merchant palatial mansions, hand-crafted Athangudi terracotta tiles, antique markets, and world-famous spicy cuisine.',
      image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80',
      packageCount: 2,
      isFeatured: true
    },
    {
      id: 'kanyakumari',
      name: 'Kanyakumari',
      tamilName: 'கன்னியாகுமரி',
      location: 'Kanyakumari District, Tamil Nadu',
      category: 'coastal',
      categoryName: 'Coastal & Landmark',
      description: "India's southern land's end where the Arabian Sea, Indian Ocean, and Bay of Bengal converge, with the Vivekananda Rock Memorial.",
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      packageCount: 2,
      isFeatured: false
    },
    {
      id: 'yercaud',
      name: 'Yercaud',
      tamilName: 'ஏற்காடு',
      location: 'Salem District, Tamil Nadu',
      category: 'hills',
      categoryName: 'Hill Station',
      description: 'The Jewel of the Shevaroy Hills. Quaint coffee plantations, orange groves, Emerald Lake boat rides, and the scenic Killiyur Falls.',
      image: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80',
      packageCount: 2,
      isFeatured: false
    },
    {
      id: 'coimbatore',
      name: 'Coimbatore',
      tamilName: 'கோயம்புத்தூர்',
      location: 'Coimbatore District, Tamil Nadu',
      category: 'cultural',
      categoryName: 'Culture & Gateway',
      description: 'The Manchester of South India. Textile heritage, Adiyogi Shiva monument, Marudhamalai Hill Temple, and the pristine Siruvani waterfalls.',
      image: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80',
      packageCount: 2,
      isFeatured: false
    }
  ];

  const PACKAGES_DATA = [
    {
      id: 1,
      title: 'Nilgiri Heritage Express & Tea Estate Trail',
      destination: 'Ooty',
      destinationSlug: 'ooty',
      category: 'hills',
      categoryName: 'Hills & Plantations',
      price: 4499,
      duration: '3 Days, 2 Nights',
      durationDays: 3,
      rating: 4.9,
      reviewCount: 48,
      availableSeats: 12,
      totalSeats: 16,
      description: 'Experience scenic toy train journeys through the Nilgiri blue mountains, artisanal organic tea garden walks, and campfire evenings at high-altitude bungalows.',
      image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
      isBestSeller: true
    },
    {
      id: 2,
      title: 'Great Living Chola Temples & Art Circuit',
      destination: 'Thanjavur',
      destinationSlug: 'thanjavur',
      category: 'heritage',
      categoryName: 'Heritage & Temples',
      price: 2999,
      duration: '2 Days, 1 Night',
      durationDays: 2,
      rating: 4.8,
      reviewCount: 32,
      availableSeats: 16,
      totalSeats: 20,
      description: 'Explore the architectural zenith of the Chola empire at the Brihadisvara Temple, Kumbakonam sacred water tanks, and watch traditional bronze sculptors at work.',
      image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80',
      isBestSeller: false
    },
    {
      id: 3,
      title: 'Madurai Night Food Trail & Meenakshi Immersion',
      destination: 'Madurai',
      destinationSlug: 'madurai',
      category: 'cultural',
      categoryName: 'Culinary & Culture',
      price: 2200,
      duration: '2 Days, 1 Night',
      durationDays: 2,
      rating: 4.9,
      reviewCount: 56,
      availableSeats: 10,
      totalSeats: 14,
      description: 'Savour iconic street foods like Jigarthanda, Bun Parotta, and Kari Dosai while touring towering Meenakshi gopurams and the 17th-century Thirumalai Nayakkar Mahal.',
      image: 'https://images.unsplash.com/photo-1609137144822-2615a639b780?auto=format&fit=crop&w=800&q=80',
      isBestSeller: true
    },
    {
      id: 4,
      title: 'Mist & Waterfalls Eco-Trek',
      destination: 'Kodaikanal',
      destinationSlug: 'kodaikanal',
      category: 'hills',
      categoryName: 'Hills & Plantations',
      price: 3850,
      duration: '3 Days, 2 Nights',
      durationDays: 3,
      rating: 4.7,
      reviewCount: 29,
      availableSeats: 8,
      totalSeats: 12,
      description: 'Guided wilderness hikes to hidden forest waterfalls, Pine forest trails, cycling around Kodaikanal star-shaped lake, and panoramic stargazing at Coaker\'s walk.',
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
      isBestSeller: false
    },
    {
      id: 5,
      title: 'Chettinad Mansions & Culinary Heritage',
      destination: 'Chettinad',
      destinationSlug: 'chettinad',
      category: 'cultural',
      categoryName: 'Culinary & Culture',
      price: 3400,
      duration: '2 Days, 1 Night',
      durationDays: 2,
      rating: 4.8,
      reviewCount: 21,
      availableSeats: 14,
      totalSeats: 18,
      description: 'Stay in a restored 19th-century merchant palace, learn handmade Athangudi tile craft, and participate in an authentic banana leaf cooking masterclass.',
      image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80',
      isBestSeller: false
    },
    {
      id: 6,
      title: 'Pamban Island & Dhanushkodi Safari',
      destination: 'Rameswaram',
      destinationSlug: 'rameswaram',
      category: 'coastal',
      categoryName: 'Coastal Escapes',
      price: 4100,
      duration: '3 Days, 2 Nights',
      durationDays: 3,
      rating: 4.9,
      reviewCount: 37,
      availableSeats: 15,
      totalSeats: 20,
      description: 'Cross the engineering marvel of Pamban Sea Bridge, visit the sacred temple corridors, and take a 4x4 beach drive through the sunken ruins of Dhanushkodi.',
      image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
      isBestSeller: true
    },
    {
      id: 7,
      title: 'Valparai Cloud Forest & Hornbill Sanctuary',
      destination: 'Valparai',
      destinationSlug: 'valparai',
      category: 'nature',
      categoryName: 'Nature & Wildlife',
      price: 4800,
      duration: '3 Days, 2 Nights',
      durationDays: 3,
      rating: 4.8,
      reviewCount: 19,
      availableSeats: 8,
      totalSeats: 10,
      description: 'Journey through 40 hairpin bends to pristine rainforest plateaus. Spot Great Indian Hornbills, wild gaurs, and experience Chinnakallar roaring falls.',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      isBestSeller: false
    },
    {
      id: 8,
      title: 'Pollachi Coconut Groves & Anamalai Safari',
      destination: 'Pollachi',
      destinationSlug: 'pollachi',
      category: 'nature',
      categoryName: 'Nature & Wildlife',
      price: 3200,
      duration: '2 Days, 1 Night',
      durationDays: 2,
      rating: 4.7,
      reviewCount: 25,
      availableSeats: 12,
      totalSeats: 16,
      description: 'Traditional bullock cart rides across organic coconut farms, river picnics at Aliyar Dam, and early morning forest safari in Top Slip tiger corridor.',
      image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
      isBestSeller: false
    },
    {
      id: 9,
      title: 'UNESCO Pallava Shore Temples & Sculptures',
      destination: 'Mahabalipuram',
      destinationSlug: 'mahabalipuram',
      category: 'heritage',
      categoryName: 'Heritage & Temples',
      price: 1800,
      duration: '1 Day',
      durationDays: 1,
      rating: 4.6,
      reviewCount: 42,
      availableSeats: 20,
      totalSeats: 25,
      description: 'Witness the sea-kissed 8th-century Shore Temple, Arjuna\'s Penance bas-relief, and Krishna\'s Butterball guided by certified local archaeological experts.',
      image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
      isBestSeller: false
    },
    {
      id: 10,
      title: 'Land\'s End Sunrise & Rock Memorial Experience',
      destination: 'Kanyakumari',
      destinationSlug: 'kanyakumari',
      category: 'coastal',
      categoryName: 'Coastal Escapes',
      price: 2500,
      duration: '2 Days, 1 Night',
      durationDays: 2,
      rating: 4.8,
      reviewCount: 34,
      availableSeats: 18,
      totalSeats: 22,
      description: 'Watch the sun rise over the confluence of three oceans, ferry across to Vivekananda Rock and the towering 133-ft Thiruvalluvar bronze statue.',
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      isBestSeller: false
    },
    {
      id: 11,
      title: 'Shevaroy Coffee Hills & Lake Retreat',
      destination: 'Yercaud',
      destinationSlug: 'yercaud',
      category: 'hills',
      categoryName: 'Hills & Plantations',
      price: 2750,
      duration: '2 Days, 1 Night',
      durationDays: 2,
      rating: 4.6,
      reviewCount: 18,
      availableSeats: 12,
      totalSeats: 16,
      description: 'A serene weekend escape in the eastern ghats with boat rides on Emerald Lake, treks to Pagoda Point, and estate-fresh filter coffee tasting.',
      image: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80',
      isBestSeller: false
    },
    {
      id: 12,
      title: 'Siruvani Foothills & Handloom Heritage Tour',
      destination: 'Coimbatore',
      destinationSlug: 'coimbatore',
      category: 'cultural',
      categoryName: 'Culinary & Culture',
      price: 1950,
      duration: '1 Day',
      durationDays: 1,
      rating: 4.5,
      reviewCount: 22,
      availableSeats: 16,
      totalSeats: 20,
      description: 'Taste the naturally sweet Siruvani mineral waters, visit traditional Kanchipuram-style handloom weavers, and tour the tranquil foothills of Vellingiri.',
      image: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80',
      isBestSeller: false
    },
    {
      id: 13,
      title: 'Doddabetta Peak Trek & Pykara Falls Adventure',
      destination: 'Ooty',
      destinationSlug: 'ooty',
      category: 'hills',
      categoryName: 'Hills & Plantations',
      price: 3600,
      duration: '2 Days, 1 Night',
      durationDays: 2,
      rating: 4.8,
      reviewCount: 31,
      availableSeats: 10,
      totalSeats: 14,
      description: 'Climb the highest peak in the Nilgiris (8,650 ft), cruise on Pykara boat house, and enjoy Toda tribal heritage walks with authorized indigenous guides.',
      image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
      isBestSeller: false
    },
    {
      id: 14,
      title: 'Madurai to Rameswaram Grand Spiritual Circuit',
      destination: 'Madurai',
      destinationSlug: 'madurai',
      category: 'heritage',
      categoryName: 'Heritage & Temples',
      price: 5400,
      duration: '4 Days, 3 Nights',
      durationDays: 4,
      rating: 4.9,
      reviewCount: 45,
      availableSeats: 14,
      totalSeats: 18,
      description: 'A comprehensive cultural pilgrimage linking Meenakshi Amman Temple, Thirupparankundram cave temples, and sacred 22 theerthams of Rameswaram.',
      image: 'https://images.unsplash.com/photo-1609137144822-2615a639b780?auto=format&fit=crop&w=800&q=80',
      isBestSeller: true
    }
  ];

  // --------------------------------------------------------------------------
  // 7. Destination Service
  // --------------------------------------------------------------------------
  const DestinationService = {
    async getDestinations() {
      // 1. Try real API
      const result = await apiClient.get('/destinations');
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        return result.data;
      }
      // 2. Demonstration data fallback
      return DESTINATIONS_DATA;
    },

    getById(destId) {
      return DESTINATIONS_DATA.find(d => d.id === destId || d.name.toLowerCase().includes(destId.toLowerCase())) || null;
    },

    renderCard(dest) {
      return `
        <article class="destination-card" data-category="${dest.category}">
          <div class="destination-thumb">
            <img src="${dest.image}" alt="${dest.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80'">
            <span class="destination-badge">${dest.categoryName}</span>
          </div>
          <div class="destination-info">
            <h3 class="destination-title">${dest.name}</h3>
            <span class="destination-tamil">${dest.tamilName} &bull; ${dest.location}</span>
            <p class="destination-desc">${dest.description}</p>
            <div class="destination-footer">
              <span><strong>${dest.packageCount}</strong> Packages Available</span>
              <a href="packages.html?destination=${encodeURIComponent(dest.name.split(' ')[0])}" class="btn btn-secondary btn-sm">Explore Tours &rarr;</a>
            </div>
          </div>
        </article>
      `;
    },

    renderGrid(containerEl, destinations) {
      if (!containerEl) return;
      if (!destinations || destinations.length === 0) {
        containerEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">&#128506;</div>
            <h3 class="empty-state-title">No Destinations Found</h3>
            <p class="empty-state-desc">We couldn't find any destinations matching your search or category filter. Try clearing your filters.</p>
            <button type="button" class="btn btn-primary" onclick="window.location.href='destinations.html'">Reset Filters</button>
          </div>
        `;
        return;
      }
      containerEl.innerHTML = destinations.map(d => this.renderCard(d)).join('');
    }
  };

  // --------------------------------------------------------------------------
  // 8. Package Service
  // --------------------------------------------------------------------------
  const PackageService = {
    async getPackages() {
      // 1. Try real API
      const result = await apiClient.get('/packages');
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        return result.data;
      }
      // 2. Demonstration data fallback
      return PACKAGES_DATA;
    },

    getById(id) {
      const numId = parseInt(id, 10);
      const pkg = PACKAGES_DATA.find(p => p.id === numId);
      if (!pkg) return null;

      const days = pkg.durationDays || 2;
      const itinerary = pkg.itinerary || [
        {
          day: 1,
          title: `Arrival, Welcome Briefing & ${pkg.destination} Sightseeing`,
          desc: `Morning welcome by your certified local guide. Check-in to verified eco/heritage accommodation. Afternoon guided walking exploration covering prominent scenic viewpoints and historic landmarks in ${pkg.destination}. Evening traditional filter tea/coffee gathering with orientation.`
        },
        {
          day: 2,
          title: `Guided Artisan Trails & Cultural Immersion`,
          desc: `Early morning sunrise observation followed by authentic local breakfast. Field excursion to local community craft workshops, tea/spice plantations, and heritage sanctuaries. Midday traditional feast followed by evening leisure and sunset photography.`
        }
      ];

      if (days >= 3) {
        itinerary.push({
          day: 3,
          title: `Wilderness Eco-Trek & Forest Waterfall Discovery`,
          desc: `Early morning guided birdwatching or biodiversity trek through protected forest corridors. Visit local agricultural co-operatives and artisanal markets. Farewell gathering and departure transfer assistance.`
        });
      }

      if (days >= 4) {
        itinerary.push({
          day: 4,
          title: `Sacred Waterways, Ancient Shrines & Departure`,
          desc: `Early morning sacred shrine or coastal boat exploration. Traditional host family lunch and coordinated transfer to regional railway station/bus terminal.`
        });
      }

      const inclusions = pkg.inclusions || [
        'Accommodation in verified eco-friendly / heritage retreat',
        'All meals included (Authentic South Indian Breakfast, Lunch, Dinner)',
        'Certified local guide with deep folklore and regional knowledge',
        'All entry tickets, forest permits, and state tourism toll fees',
        'Sightseeing transfers via private, air-conditioned sanitized vehicle',
        'Complimentary traditional welcome drink and local spice tasting'
      ];

      const exclusions = pkg.exclusions || [
        'Interstate or intercity airfare / train tickets to origin point',
        'Personal expenses (specialty shopping, souvenirs, personal laundry)',
        'Optional specialized camera or drone permits where applicable',
        'Driver and guide tips (optional, at traveller discretion)'
      ];

      const importantInfo = pkg.importantInfo || [
        'Valid government-issued photo identity proof (Aadhaar / Voter ID / Passport) is required at check-in.',
        'Modest, respectful attire is mandatory when entering temple and sacred monument premises.',
        'Comfortable walking shoes, personal reusable water flask, and light weather protection are recommended.',
        'Cancellations made 48 hours or more before departure are 100% refundable with zero deduction.'
      ];

      const reviews = pkg.reviews || [
        {
          author: 'Muthu Kumar R.',
          city: 'Coimbatore',
          date: 'October 2026',
          rating: 5,
          comment: `Exceeded all our expectations! Our local guide was remarkably knowledgeable about ${pkg.destination}'s authentic heritage and hidden viewpoints that commercial group tours miss.`
        },
        {
          author: 'Lavanya S.',
          city: 'Chennai',
          date: 'September 2026',
          rating: pkg.rating >= 4.8 ? 5 : 4,
          comment: `The itinerary was relaxing and beautifully paced. Transparent pricing with zero hidden fees. Booking through YAADHUM OOORE was completely seamless!`
        },
        {
          author: 'Gautam V.',
          city: 'Bengaluru',
          date: 'August 2026',
          rating: 5,
          comment: `A truly authentic local experience. Great food, punctual private transfers, and the host went out of their way to ensure our family felt comfortable throughout.`
        }
      ];

      return {
        ...pkg,
        itinerary,
        inclusions,
        exclusions,
        importantInfo,
        reviews
      };
    },

    filter(packages, criteria = {}) {
      return packages.filter(pkg => {
        // Destination match
        if (criteria.destination && criteria.destination !== 'all') {
          const target = criteria.destination.toLowerCase();
          const pkgDest = pkg.destination.toLowerCase();
          if (!pkgDest.includes(target) && !target.includes(pkgDest)) return false;
        }

        // Category match
        if (criteria.category && criteria.category !== 'all') {
          if (pkg.category.toLowerCase() !== criteria.category.toLowerCase()) return false;
        }

        // Min price
        if (criteria.minPrice && pkg.price < criteria.minPrice) return false;

        // Max price
        if (criteria.maxPrice && pkg.price > criteria.maxPrice) return false;

        // Duration filter
        if (criteria.duration && criteria.duration !== 'all') {
          if (criteria.duration === '1-2' && (pkg.durationDays < 1 || pkg.durationDays > 2)) return false;
          if (criteria.duration === '3-4' && (pkg.durationDays < 3 || pkg.durationDays > 4)) return false;
          if (criteria.duration === '5+' && pkg.durationDays < 5) return false;
        }

        // Rating filter
        if (criteria.rating && criteria.rating > 0) {
          if (pkg.rating < criteria.rating) return false;
        }

        return true;
      });
    },

    sort(packages, sortKey = 'price-asc') {
      const copy = [...packages];
      switch (sortKey) {
        case 'price-asc':
          return copy.sort((a, b) => a.price - b.price);
        case 'price-desc':
          return copy.sort((a, b) => b.price - a.price);
        case 'rating-desc':
          return copy.sort((a, b) => b.rating - a.rating);
        case 'duration-asc':
          return copy.sort((a, b) => a.durationDays - b.durationDays);
        case 'duration-desc':
          return copy.sort((a, b) => b.durationDays - a.durationDays);
        default:
          return copy;
      }
    },

    search(packages, query) {
      if (!query || typeof query !== 'string') return packages;
      const q = query.trim().toLowerCase();
      if (!q) return packages;

      return packages.filter(pkg => {
        return (
          pkg.title.toLowerCase().includes(q) ||
          pkg.destination.toLowerCase().includes(q) ||
          pkg.categoryName.toLowerCase().includes(q) ||
          pkg.description.toLowerCase().includes(q)
        );
      });
    },

    renderCard(pkg) {
      const isWishlisted = WishlistService.has(pkg.id);
      const isCompared = CompareService.has(pkg.id);

      return `
        <article class="package-card" data-package-id="${pkg.id}">
          <div class="package-media">
            <img src="${pkg.image}" alt="${pkg.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80'">
            <span class="package-tag">${pkg.categoryName}</span>
            <button type="button" class="package-wishlist-btn ${isWishlisted ? 'active' : ''}" title="Add to Wishlist" data-package-id="${pkg.id}" aria-label="Save package to wishlist">
              &hearts;
            </button>
          </div>
          <div class="package-body">
            <div class="package-meta">
              <span class="package-meta-item">&#128205; ${pkg.destination}</span>
              <span class="package-meta-item">&#128197; ${pkg.duration}</span>
              <span class="package-meta-item">&#128101; ${pkg.availableSeats} Seats Left</span>
            </div>
            <h3 class="package-title">
              <a href="package-details.html?id=${pkg.id}">${pkg.title}</a>
            </h3>
            <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 12px; line-height: 1.4;">
              ${pkg.description.length > 115 ? pkg.description.substring(0, 115) + '...' : pkg.description}
            </p>
            <div class="package-rating">
              <span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
              <span class="rating-count"><strong>${pkg.rating}</strong> (${pkg.reviewCount} reviews)</span>
            </div>
            
            <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
              <label class="package-compare-wrap">
                <input type="checkbox" class="package-compare-checkbox" data-package-id="${pkg.id}" ${isCompared ? 'checked' : ''}>
                <span>Compare</span>
              </label>
              ${pkg.isBestSeller ? '<span class="badge badge-success">Top Rated</span>' : ''}
            </div>

            <div class="package-price-row">
              <div class="price-box">
                <span class="price-label">Price per person</span>
                <span class="price-amount">&#8377;${pkg.price.toLocaleString('en-IN')}</span>
              </div>
              <a href="package-details.html?id=${pkg.id}" class="btn btn-primary btn-sm">View Details &rarr;</a>
            </div>
          </div>
        </article>
      `;
    },

    renderGrid(containerEl, packages) {
      if (!containerEl) return;
      if (!packages || packages.length === 0) {
        containerEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">&#128507;</div>
            <h3 class="empty-state-title">No Tourism Packages Found</h3>
            <p class="empty-state-desc">No packages matched your filter criteria. Try adjusting the destination, price range, or clearing filters.</p>
            <button type="button" class="btn btn-primary" onclick="if(document.getElementById('clearFiltersBtn')) document.getElementById('clearFiltersBtn').click(); else window.location.href='packages.html';">Reset Filters</button>
          </div>
        `;
        return;
      }
      containerEl.innerHTML = packages.map(p => this.renderCard(p)).join('');

      // Wire interactive buttons inside grid
      WishlistService.initButtons(containerEl);
      CompareService.initCheckboxes(containerEl);
    }
  };

  // --------------------------------------------------------------------------
  // 9. Wishlist Service (Persistent Local Storage)
  // --------------------------------------------------------------------------
  const WishlistService = {
    getWishlist() {
      try {
        return JSON.parse(localStorage.getItem(CONFIG.WISHLIST_KEY) || '[]');
      } catch (e) {
        return [];
      }
    },

    has(pkgId) {
      const list = this.getWishlist();
      return list.includes(String(pkgId)) || list.includes(Number(pkgId));
    },

    toggle(pkgId) {
      let list = this.getWishlist();
      const strId = String(pkgId);
      const isPresent = list.includes(strId) || list.includes(Number(pkgId));

      if (isPresent) {
        list = list.filter(id => String(id) !== strId);
      } else {
        list.push(strId);
      }

      localStorage.setItem(CONFIG.WISHLIST_KEY, JSON.stringify(list));
      return !isPresent;
    },

    initButtons(rootEl = document) {
      const buttons = rootEl.querySelectorAll('.package-wishlist-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          const pkgId = this.getAttribute('data-package-id');
          const isAdded = WishlistService.toggle(pkgId);
          this.classList.toggle('active', isAdded);

          // Optional toast feedback
          const toast = document.createElement('div');
          toast.className = 'alert alert-success is-visible';
          toast.style.position = 'fixed';
          toast.style.bottom = '20px';
          toast.style.right = '20px';
          toast.style.zIndex = '9999';
          toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
          toast.innerHTML = isAdded ? 'Added to your Wishlist &hearts;' : 'Removed from your Wishlist';
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 2000);
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // 10. Package Comparison Service (Max 4 items)
  // --------------------------------------------------------------------------
  const CompareService = {
    getCompareList() {
      try {
        return JSON.parse(localStorage.getItem(CONFIG.COMPARE_KEY) || '[]');
      } catch (e) {
        return [];
      }
    },

    has(pkgId) {
      const list = this.getCompareList();
      return list.includes(String(pkgId)) || list.includes(Number(pkgId));
    },

    toggle(pkgId) {
      let list = this.getCompareList();
      const strId = String(pkgId);
      const isPresent = list.includes(strId) || list.includes(Number(pkgId));

      if (isPresent) {
        list = list.filter(id => String(id) !== strId);
        localStorage.setItem(CONFIG.COMPARE_KEY, JSON.stringify(list));
        this.updateFloatingBar();
        return { added: false, count: list.length };
      } else {
        if (list.length >= 4) {
          if (typeof alert === 'function') {
            alert('You can compare a maximum of 4 packages at a time. Please remove one first.');
          }
          return { added: false, count: list.length, error: 'limit_reached' };
        }
        list.push(strId);
        localStorage.setItem(CONFIG.COMPARE_KEY, JSON.stringify(list));
        this.updateFloatingBar();
        return { added: true, count: list.length };
      }
    },

    clear() {
      localStorage.removeItem(CONFIG.COMPARE_KEY);
      this.updateFloatingBar();
      // Uncheck all compare checkboxes
      document.querySelectorAll('.package-compare-checkbox').forEach(cb => {
        cb.checked = false;
      });
    },

    updateFloatingBar() {
      if (typeof document === 'undefined' || !document.body || typeof document.createElement !== 'function') {
        return;
      }
      const list = this.getCompareList();
      let bar = document.getElementById('compareFloatingBar');

      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'compareFloatingBar';
        bar.className = 'compare-floating-bar';
        document.body.appendChild(bar);
      }

      if (list.length > 0) {
        bar.innerHTML = `
          <span><span class="compare-badge-pill">${list.length}</span> Packages Selected</span>
          <a href="compare.html" class="btn btn-gold btn-sm">Compare Now &rarr;</a>
          <button type="button" id="clearCompareBtn" style="background:none; border:none; color:#FFFFFF; text-decoration:underline; font-size:0.8rem; cursor:pointer;">Clear</button>
        `;
        bar.classList.add('is-visible');

        const clearBtn = document.getElementById('clearCompareBtn');
        if (clearBtn) {
          clearBtn.addEventListener('click', () => this.clear());
        }
      } else {
        bar.classList.remove('is-visible');
      }
    },

    initCheckboxes(rootEl = document) {
      const checkboxes = rootEl.querySelectorAll('.package-compare-checkbox');
      checkboxes.forEach(cb => {
        cb.addEventListener('change', function () {
          const pkgId = this.getAttribute('data-package-id');
          const res = CompareService.toggle(pkgId);
          if (res.error === 'limit_reached') {
            this.checked = false;
          }
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // 10B. Customer Booking Service (Phase 4A)
  // --------------------------------------------------------------------------
  const BookingService = {
    /**
     * Calculate price breakdown based on base package price and traveller count.
     * Includes 5% GST calculation.
     * @param {number} basePrice
     * @param {number} travellerCount
     * @returns {{ pricePerPerson: number, travellerCount: number, subtotal: number, gstRate: number, gstAmount: number, grandTotal: number }}
     */
    calculatePrice(basePrice, travellerCount) {
      const count = Math.max(1, parseInt(travellerCount, 10) || 1);
      const price = Math.max(0, parseInt(basePrice, 10) || 0);
      const subtotal = price * count;
      const gstRate = 0.05; // 5% GST
      const gstAmount = Math.round(subtotal * gstRate);
      const grandTotal = subtotal + gstAmount;

      return {
        pricePerPerson: price,
        travellerCount: count,
        subtotal: subtotal,
        gstRate: gstRate,
        gstAmount: gstAmount,
        grandTotal: grandTotal
      };
    },

    /**
     * Retrieve all demo bookings from localStorage, enriched with package imagery.
     * @returns {Array<Object>}
     */
    getBookings() {
      try {
        const raw = localStorage.getItem(CONFIG.BOOKINGS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : [];
        return list.map(b => {
          if (!b.packageImage && b.packageId) {
            const pkg = PACKAGES_DATA.find(p => String(p.id) === String(b.packageId));
            if (pkg) b.packageImage = pkg.image;
          }
          return b;
        });
      } catch (e) {
        console.warn('Failed to parse demo bookings from localStorage:', e);
        return [];
      }
    },

    /**
     * Retrieve a specific booking by internal ID or public Reference Number.
     * @param {string|number} idOrRef
     * @returns {Object|null}
     */
    getBookingById(idOrRef) {
      if (!idOrRef) return null;
      const list = this.getBookings();
      const target = String(idOrRef).trim();
      return list.find(b => String(b.id) === target || String(b.referenceNumber) === target) || null;
    },

    /**
     * Calculate summary overview counts for customer booking KPI dashboard.
     * @param {Array<Object>} [bookings]
     * @returns {{ total: number, upcoming: number, completed: number, cancelled: number }}
     */
    getBookingStats(bookings) {
      const list = bookings || this.getBookings();
      const todayStr = new Date().toISOString().split('T')[0];
      let total = list.length;
      let upcoming = 0;
      let completed = 0;
      let cancelled = 0;

      list.forEach(b => {
        if (b.bookingStatus === 'Cancelled') {
          cancelled++;
        } else if (b.bookingStatus === 'Completed' || (b.travelDate && b.travelDate < todayStr)) {
          completed++;
        } else {
          upcoming++;
        }
      });

      return { total, upcoming, completed, cancelled };
    },

    /**
     * Cancel an existing booking (demonstration mode fallback).
     * @param {string|number} bookingId
     * @param {string} [reason]
     * @returns {Promise<{success: boolean, data?: any, error?: string, isDemo?: boolean}>}
     */
    async cancelBooking(bookingId, reason = '') {
      // 1. Attempt real backend cancellation if available
      try {
        const response = await apiClient.post(`/customer/bookings/${bookingId}/cancel`, { reason });
        if (response && response.success && !response.isDemo) {
          return response;
        }
      } catch (err) {
        console.info('Backend cancel endpoint offline, using demonstration cancellation engine.');
      }

      // 2. Demonstration fallback: update in localStorage
      let rawList = [];
      try {
        const raw = localStorage.getItem(CONFIG.BOOKINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) rawList = parsed;
        }
      } catch (e) {
        rawList = [];
      }

      const strId = String(bookingId);
      const targetIndex = rawList.findIndex(b => String(b.id) === strId || String(b.referenceNumber) === strId);
      if (targetIndex === -1) {
        return { success: false, error: 'Booking record not found.' };
      }

      rawList[targetIndex].bookingStatus = 'Cancelled';
      rawList[targetIndex].cancelledAt = new Date().toISOString();
      rawList[targetIndex].cancellationReason = reason || 'Cancelled by customer (Academic Demo)';
      rawList[targetIndex].paymentStatus = 'Cancelled (Demo)';

      localStorage.setItem(CONFIG.BOOKINGS_KEY, JSON.stringify(rawList));

      return {
        success: true,
        data: rawList[targetIndex],
        isDemo: true
      };
    },

    /**
     * Seed demonstration sample bookings for initial testing and evaluation.
     * @returns {Array<Object>}
     */
    seedSampleBookings() {
      const today = new Date();
      const yyyy = today.getFullYear();
      
      const upDate = new Date(today);
      upDate.setDate(upDate.getDate() + 10);
      const upDateStr = upDate.toISOString().split('T')[0];

      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - 30);
      const pastDateStr = pastDate.toISOString().split('T')[0];

      const cancelDate = new Date(today);
      cancelDate.setDate(cancelDate.getDate() + 25);
      const cancelDateStr = cancelDate.toISOString().split('T')[0];

      const samples = [
        {
          id: 'BK-1001',
          referenceNumber: `YO-${yyyy}-748291`,
          packageId: 1,
          packageTitle: 'Ooty & Nilgiri Heritage Circuit',
          destination: 'Ooty',
          packageImage: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
          travelDate: upDateStr,
          travellerCount: 2,
          pricePerPerson: 8500,
          subtotal: 17000,
          gstAmount: 850,
          grandTotal: 17850,
          customerName: 'Anandha Kannan',
          customerEmail: 'anandha@example.com',
          customerPhone: '9840123456',
          specialRequests: 'Vegetarian meals preferred for all departures.',
          paymentMethod: 'UPI',
          paymentStatus: 'Paid (Simulated)',
          bookingStatus: 'Confirmed',
          createdAt: new Date().toISOString()
        },
        {
          id: 'BK-1002',
          referenceNumber: `YO-${yyyy}-512849`,
          packageId: 5,
          packageTitle: 'Madurai Temple & Food Trail',
          destination: 'Madurai',
          packageImage: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
          travelDate: pastDateStr,
          travellerCount: 1,
          pricePerPerson: 4200,
          subtotal: 4200,
          gstAmount: 210,
          grandTotal: 4410,
          customerName: 'Anandha Kannan',
          customerEmail: 'anandha@example.com',
          customerPhone: '9840123456',
          specialRequests: 'Temple darshan pass requested.',
          paymentMethod: 'NetBanking',
          paymentStatus: 'Paid (Simulated)',
          bookingStatus: 'Completed',
          createdAt: new Date(Date.now() - 35 * 86400000).toISOString()
        },
        {
          id: 'BK-1003',
          referenceNumber: `YO-${yyyy}-938102`,
          packageId: 2,
          packageTitle: 'Kodaikanal Mist & Lake Retreat',
          destination: 'Kodaikanal',
          packageImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
          travelDate: cancelDateStr,
          travellerCount: 3,
          pricePerPerson: 9200,
          subtotal: 27600,
          gstAmount: 1380,
          grandTotal: 28980,
          customerName: 'Anandha Kannan',
          customerEmail: 'anandha@example.com',
          customerPhone: '9840123456',
          specialRequests: 'Family cottage with lake view requested.',
          paymentMethod: 'Card',
          paymentStatus: 'Cancelled (Demo)',
          bookingStatus: 'Cancelled',
          cancelledAt: new Date().toISOString(),
          cancellationReason: 'Scheduling conflict (Academic Demo)',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
        }
      ];

      localStorage.setItem(CONFIG.BOOKINGS_KEY, JSON.stringify(samples));
      return samples;
    },

    /**
     * Save a booking to localStorage demo store.
     * @param {Object} bookingData
     * @returns {Object} savedBooking
     */
    saveBooking(bookingData) {
      try {
        const bookings = this.getBookings();
        bookings.unshift(bookingData); // Newest first
        localStorage.setItem(CONFIG.BOOKINGS_KEY, JSON.stringify(bookings));
        return bookingData;
      } catch (e) {
        console.warn('Failed to save booking to localStorage:', e);
        return bookingData;
      }
    },

    /**
     * Generate a unique demonstration booking reference code.
     * Format: YO-YYYY-XXXXXX (e.g. YO-2026-482910)
     */
    generateReference() {
      const year = new Date().getFullYear();
      const rand = Math.floor(100000 + Math.random() * 900000);
      return `YO-${year}-${rand}`;
    },

    /**
     * Create a booking either via backend API or fallback to demonstration mode.
     * @param {Object} bookingPayload
     * @returns {Promise<{success: boolean, data?: any, error?: string, isDemo?: boolean}>}
     */
    async createBooking(bookingPayload) {
      // Attempt real backend POST if available
      try {
        const response = await apiClient.post('/customer/bookings', bookingPayload);
        if (response && response.success && !response.isDemo) {
          this.saveBooking(response.data);
          return response;
        }
      } catch (err) {
        console.info('Backend booking endpoint offline, utilizing demonstration booking engine.');
      }

      // Demonstration fallback mode
      const bookingRef = this.generateReference();
      const newBooking = {
        id: 'BK-' + Date.now(),
        referenceNumber: bookingRef,
        packageId: bookingPayload.packageId,
        packageTitle: bookingPayload.packageTitle,
        destination: bookingPayload.destination,
        packageImage: bookingPayload.packageImage || '',
        travelDate: bookingPayload.travelDate,
        travellerCount: bookingPayload.travellerCount,
        pricePerPerson: bookingPayload.pricePerPerson,
        subtotal: bookingPayload.subtotal,
        gstAmount: bookingPayload.gstAmount,
        grandTotal: bookingPayload.grandTotal,
        customerName: bookingPayload.customerName,
        customerEmail: bookingPayload.customerEmail,
        customerPhone: bookingPayload.customerPhone,
        specialRequests: bookingPayload.specialRequests || '',
        paymentMethod: bookingPayload.paymentMethod || 'UPI',
        paymentStatus: bookingPayload.paymentMethod === 'Arrival' ? 'Pending (Pay on Arrival)' : 'Paid (Simulated)',
        bookingStatus: 'Confirmed',
        createdAt: new Date().toISOString()
      };

      this.saveBooking(newBooking);

      return {
        success: true,
        data: newBooking,
        isDemo: true
      };
    }
  };

  // --------------------------------------------------------------------------
  // 11. Page Setup Handlers for Destinations, Packages & Search
  // --------------------------------------------------------------------------

  /**
   * Setup logic for destinations.html.
   */
  async function setupDestinationsPage() {
    const grid = document.getElementById('destinationsGrid');
    const searchInput = document.getElementById('destSearchInput');
    const pills = document.querySelectorAll('.filter-pill[data-category]');
    const countDisplay = document.getElementById('destResultsCount');

    const destinations = await DestinationService.getDestinations();
    const urlParams = new URLSearchParams(window.location.search);
    let activeCategory = urlParams.get('category') || 'all';

    function applyFilters() {
      const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
      let filtered = destinations;

      if (activeCategory !== 'all') {
        filtered = filtered.filter(d => d.category.toLowerCase() === activeCategory.toLowerCase());
      }

      if (q) {
        filtered = filtered.filter(d => 
          d.name.toLowerCase().includes(q) || 
          d.tamilName.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) || 
          d.description.toLowerCase().includes(q)
        );
      }

      DestinationService.renderGrid(grid, filtered);
      if (countDisplay) {
        countDisplay.textContent = `${filtered.length} Destination${filtered.length === 1 ? '' : 's'}`;
      }
    }

    // Set active pill based on URL
    pills.forEach(pill => {
      const cat = pill.getAttribute('data-category');
      if (cat === activeCategory) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }

      pill.addEventListener('click', function (e) {
        e.preventDefault();
        pills.forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        activeCategory = this.getAttribute('data-category');
        applyFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }

    applyFilters();
  }

  /**
   * Setup logic for packages.html.
   */
  async function setupPackagesPage() {
    const grid = document.getElementById('packagesGrid');
    const countDisplay = document.getElementById('packagesCount');
    const filterForm = document.getElementById('packagesFilterForm');
    const sortSelect = document.getElementById('packagesSortSelect');
    const clearBtn = document.getElementById('clearFiltersBtn');

    const destSelect = document.getElementById('filterDestination');
    const catSelect = document.getElementById('filterCategory');
    const minPriceInput = document.getElementById('filterMinPrice');
    const maxPriceInput = document.getElementById('filterMaxPrice');
    const durSelect = document.getElementById('filterDuration');
    const ratingSelect = document.getElementById('filterRating');

    const packages = await PackageService.getPackages();
    const urlParams = new URLSearchParams(window.location.search);

    // Sync form controls from URL params if present
    if (urlParams.get('destination') && destSelect) destSelect.value = urlParams.get('destination');
    if (urlParams.get('category') && catSelect) catSelect.value = urlParams.get('category');
    if (urlParams.get('minPrice') && minPriceInput) minPriceInput.value = urlParams.get('minPrice');
    if (urlParams.get('maxPrice') && maxPriceInput) maxPriceInput.value = urlParams.get('maxPrice');
    if (urlParams.get('duration') && durSelect) durSelect.value = urlParams.get('duration');
    if (urlParams.get('rating') && ratingSelect) ratingSelect.value = urlParams.get('rating');
    if (urlParams.get('sort') && sortSelect) sortSelect.value = urlParams.get('sort');

    function applyCatalogFilters() {
      const criteria = {
        destination: destSelect ? destSelect.value : 'all',
        category: catSelect ? catSelect.value : 'all',
        minPrice: minPriceInput && minPriceInput.value ? Number(minPriceInput.value) : null,
        maxPrice: maxPriceInput && maxPriceInput.value ? Number(maxPriceInput.value) : null,
        duration: durSelect ? durSelect.value : 'all',
        rating: ratingSelect && ratingSelect.value ? Number(ratingSelect.value) : null
      };

      const sortKey = sortSelect ? sortSelect.value : 'price-asc';

      let filtered = PackageService.filter(packages, criteria);
      let sorted = PackageService.sort(filtered, sortKey);

      PackageService.renderGrid(grid, sorted);

      if (countDisplay) {
        countDisplay.textContent = `${sorted.length} Package${sorted.length === 1 ? '' : 's'}`;
      }
    }

    if (filterForm) {
      filterForm.addEventListener('change', applyCatalogFilters);
      filterForm.addEventListener('submit', e => { e.preventDefault(); applyCatalogFilters(); });
    }
    if (sortSelect) {
      sortSelect.addEventListener('change', applyCatalogFilters);
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (filterForm) filterForm.reset();
        if (sortSelect) sortSelect.value = 'price-asc';
        applyCatalogFilters();
      });
    }

    applyCatalogFilters();
  }

  /**
   * Setup logic for search-packages.html.
   */
  async function setupSearchPage() {
    const grid = document.getElementById('searchResultsGrid');
    const searchForm = document.getElementById('searchForm');
    const keywordInput = document.getElementById('keywordInput');
    const destSelect = document.getElementById('searchDestination');
    const catSelect = document.getElementById('searchCategory');
    const budgetSelect = document.getElementById('searchBudget');
    const durSelect = document.getElementById('searchDuration');
    const sortSelect = document.getElementById('searchSort');
    const countDisplay = document.getElementById('searchCount');
    const summaryDisplay = document.getElementById('searchSummary');
    const resetBtn = document.getElementById('resetSearchBtn');

    const packages = await PackageService.getPackages();
    const urlParams = new URLSearchParams(window.location.search);

    // Read initial params
    if (urlParams.get('q') && keywordInput) keywordInput.value = urlParams.get('q');
    if (urlParams.get('destination') && destSelect) destSelect.value = urlParams.get('destination');
    if (urlParams.get('category') && catSelect) catSelect.value = urlParams.get('category');
    if (urlParams.get('duration') && durSelect) durSelect.value = urlParams.get('duration');
    if (urlParams.get('sort') && sortSelect) sortSelect.value = urlParams.get('sort');

    function executeSearch() {
      const q = keywordInput ? keywordInput.value.trim() : '';
      const dest = destSelect ? destSelect.value : '';
      const cat = catSelect ? catSelect.value : '';
      const budget = budgetSelect ? budgetSelect.value : '';
      const dur = durSelect ? durSelect.value : '';
      const sortKey = sortSelect ? sortSelect.value : 'price-asc';

      let minPrice = null;
      let maxPrice = null;
      if (budget === 'budget') { maxPrice = 2500; }
      else if (budget === 'mid') { minPrice = 2500; maxPrice = 4500; }
      else if (budget === 'luxury') { minPrice = 4500; }

      // 1. Text keyword search
      let results = PackageService.search(packages, q);

      // 2. Structured criteria filter
      results = PackageService.filter(results, {
        destination: dest || 'all',
        category: cat || 'all',
        minPrice: minPrice,
        maxPrice: maxPrice,
        duration: dur || 'all'
      });

      // 3. Sort
      results = PackageService.sort(results, sortKey);

      // 4. Render
      PackageService.renderGrid(grid, results);

      // 5. Update UI counters and summary
      if (countDisplay) {
        countDisplay.textContent = `${results.length} Result${results.length === 1 ? '' : 's'}`;
      }
      if (summaryDisplay) {
        let summaryParts = [];
        if (q) summaryParts.push(`"${q}"`);
        if (dest) summaryParts.push(`in ${dest}`);
        if (cat) summaryParts.push(`category: ${cat}`);
        if (budget) summaryParts.push(`budget: ${budget}`);
        if (dur) summaryParts.push(`duration: ${dur}`);
        summaryDisplay.textContent = summaryParts.length > 0 ? `Showing results for: ${summaryParts.join(' • ')}` : 'Showing all available tours';
      }
    }

    if (searchForm) {
      searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        executeSearch();
      });
      searchForm.addEventListener('change', executeSearch);
    }
    if (keywordInput) {
      keywordInput.addEventListener('input', executeSearch);
    }
    if (sortSelect) {
      sortSelect.addEventListener('change', executeSearch);
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (searchForm) searchForm.reset();
        executeSearch();
      });
    }

    executeSearch();
  }

  /**
   * Setup logic for package-details.html.
   */
  async function setupPackageDetailsPage() {
    const container = document.getElementById('packageDetailsContainer');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
      renderPackageNotFound(container);
      return;
    }

    const pkg = PackageService.getById(id);
    if (!pkg) {
      renderPackageNotFound(container);
      return;
    }

    // Update document title & breadcrumb if present
    document.title = `${pkg.title} | YAADHUM OOORE`;
    const breadcrumbTitle = document.getElementById('breadcrumbTitle');
    if (breadcrumbTitle) breadcrumbTitle.textContent = pkg.title;

    const isWishlisted = WishlistService.has(pkg.id);
    const isCompared = CompareService.has(pkg.id);

    // Render Package Details Interface
    container.innerHTML = `
      <!-- Package Hero Banner -->
      <section class="page-hero" style="background-image: linear-gradient(135deg, rgba(16,80,68,0.92) 0%, rgba(23,107,91,0.85) 60%, rgba(217,119,54,0.7) 100%), url('${pkg.image}'); padding: 50px 0 60px 0;">
        <div class="container">
          <div class="page-hero-breadcrumb">
            <a href="../index.html">Home</a> &rsaquo; 
            <a href="packages.html">Packages</a> &rsaquo; 
            <a href="packages.html?destination=${encodeURIComponent(pkg.destination)}">${pkg.destination}</a> &rsaquo; 
            <span>${pkg.title}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <span class="badge badge-primary" style="background: var(--color-gold); color: var(--color-primary-dark); font-weight: 800;">${pkg.categoryName}</span>
            <span class="badge" style="background: rgba(255,255,255,0.25); color: #FFFFFF; margin-left: 6px;">&#128205; ${pkg.destination}</span>
            ${pkg.isBestSeller ? '<span class="badge badge-success" style="margin-left: 6px;">★ Best Seller</span>' : ''}
          </div>
          <h1 class="page-hero-title">${pkg.title}</h1>
          <p class="page-hero-subtitle" style="max-width: 800px;">
            &#128197; ${pkg.duration} &nbsp;&bull;&nbsp; 
            <span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span> <strong>${pkg.rating}</strong> (${pkg.reviewCount} customer reviews) &nbsp;&bull;&nbsp;
            &#128101; Verified Local Tourism Provider
          </p>
        </div>
      </section>

      <!-- Main Content Layout -->
      <section class="section" style="padding-top: var(--space-2xl);">
        <div class="container">
          <div class="package-details-layout">
            
            <!-- Left Main Column -->
            <div class="package-details-main">
              
              <!-- Section: Detailed Overview -->
              <div class="details-section">
                <h2 class="details-section-title">&#128214; Tour Overview</h2>
                <p style="font-size: 1.05rem; line-height: 1.7; color: var(--color-text-main); margin-bottom: 16px;">
                  ${pkg.description}
                </p>
                <p style="font-size: 0.95rem; line-height: 1.6; color: var(--color-text-muted);">
                  Immerse yourself in authentic Tamil Nadu culture, scenic beauty, and local traditions. This tour is curated by certified local hosts who prioritize sustainable eco-tourism, respectful cultural exploration, and high safety standards for travellers of all ages.
                </p>
              </div>

              <!-- Section: Day-wise Itinerary -->
              <div class="details-section">
                <h2 class="details-section-title">&#128197; Day-Wise Itinerary</h2>
                <div class="itinerary-timeline">
                  ${pkg.itinerary.map(item => `
                    <div class="itinerary-day-item">
                      <div class="itinerary-day-badge">Day ${item.day}</div>
                      <div class="itinerary-day-body">
                        <h3 class="itinerary-day-title">${item.title}</h3>
                        <p class="itinerary-day-desc">${item.desc}</p>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Section: Inclusions & Exclusions -->
              <div class="details-section">
                <h2 class="details-section-title">&#9745; Package Inclusions & Exclusions</h2>
                <div class="inclusions-grid">
                  <div class="inclusions-box">
                    <h3 class="inclusions-box-title">&#10003; What's Included</h3>
                    ${pkg.inclusions.map(inc => `
                      <div class="check-item">
                        <span class="check-icon">&#10004;</span>
                        <span>${inc}</span>
                      </div>
                    `).join('')}
                  </div>

                  <div class="exclusions-box">
                    <h3 class="exclusions-box-title">&#10005; What's Not Included</h3>
                    ${pkg.exclusions.map(exc => `
                      <div class="check-item">
                        <span class="cross-icon">&#10008;</span>
                        <span>${exc}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- Section: Important Travel Information -->
              <div class="details-section">
                <h2 class="details-section-title">&#9888; Important Travel Information</h2>
                <div style="background: var(--color-gold-subtle); border-left: 4px solid var(--color-gold); border-radius: var(--radius-sm); padding: 18px 20px;">
                  <ul style="list-style: disc; margin-left: 20px; font-size: 0.92rem; color: #5B4400; line-height: 1.6;">
                    ${pkg.importantInfo.map(info => `<li style="margin-bottom: 6px;">${info}</li>`).join('')}
                  </ul>
                </div>
              </div>

              <!-- Section: Verified Customer Reviews -->
              <div class="details-section">
                <div class="d-flex align-center justify-between" style="margin-bottom: var(--space-md); flex-wrap: wrap;">
                  <h2 class="details-section-title" style="margin: 0;">&#128172; Verified Customer Reviews</h2>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="stars" style="font-size: 1.1rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                    <strong>${pkg.rating} out of 5.0</strong>
                    <span style="color: var(--color-text-light); font-size: 0.85rem;">(${pkg.reviewCount} reviews)</span>
                  </div>
                </div>

                <div class="reviews-list">
                  ${pkg.reviews.map(rev => `
                    <div class="review-item-card">
                      <div class="review-header">
                        <div>
                          <span class="reviewer-name">${rev.author}</span>
                          <span style="font-size: 0.8rem; color: var(--color-text-light); margin-left: 6px;">(${rev.city})</span>
                        </div>
                        <span class="review-date">${rev.date}</span>
                      </div>
                      <div class="stars" style="font-size: 0.85rem; margin-bottom: 6px;">
                        ${'&#9733;'.repeat(rev.rating)}${'&#9734;'.repeat(5 - rev.rating)}
                      </div>
                      <p class="review-comment">"${rev.comment}"</p>
                    </div>
                  `).join('')}
                </div>
              </div>

            </div>

            <!-- Right Sticky Booking Card -->
            <aside class="booking-card-sticky">
              
              <div class="booking-price-header">
                <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--color-text-light); font-weight: 700; letter-spacing: 0.5px; display: block;">All-Inclusive Tour Price</span>
                <div style="display: flex; align-items: baseline; gap: 6px; margin: 4px 0 8px 0;">
                  <span style="font-size: 2rem; font-weight: 800; color: var(--color-primary-dark);">&#8377;${pkg.price.toLocaleString('en-IN')}</span>
                  <span style="color: var(--color-text-muted); font-size: 0.9rem;">/ person</span>
                </div>
                
                <div class="seats-badge-alert">
                  &#128101; Only ${pkg.availableSeats} of ${pkg.totalSeats} seats remaining!
                </div>
              </div>

              <!-- Main Booking CTA Button -->
              <div class="booking-actions-group">
                <a href="booking.html?id=${pkg.id}" class="btn btn-terracotta btn-lg" style="width: 100%; text-align: center; font-weight: 700;">
                  Proceed to Book &rarr;
                </a>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  <button type="button" id="detailWishlistBtn" class="btn btn-secondary btn-sm ${isWishlisted ? 'active' : ''}" style="width: 100%; justify-content: center;">
                    ${isWishlisted ? '&hearts; Saved' : '&hearts; Wishlist'}
                  </button>

                  <button type="button" id="detailCompareBtn" class="btn btn-secondary btn-sm" style="width: 100%; justify-content: center;">
                    ${isCompared ? '&#10003; In Compare' : '+ Compare'}
                  </button>
                </div>
              </div>

              <!-- Trust & Safety Signals -->
              <div class="trust-signals-box">
                <div>&#128737; <strong>100% Verified Local Provider</strong></div>
                <div>&#128197; <strong>Free cancellation</strong> up to 48 hours before trip</div>
                <div>&#128179; <strong>Secure Payment Guarantee</strong> & zero hidden fees</div>
                <div>&#128663; <strong>Sanitized & Licensed</strong> private transport</div>
              </div>

              <p style="margin-top: 16px; font-size: 0.8rem; color: var(--color-text-light); text-align: center;">
                Need help? Contact local provider support through YAADHUM OOORE customer care.
              </p>
            </aside>

          </div>

          <!-- Section: Related Packages -->
          <div style="margin-top: var(--space-3xl);">
            <div class="section-header" style="text-align: left; margin-bottom: var(--space-lg);">
              <span class="section-tagline">More Like This</span>
              <h2 class="section-title">Similar Recommended Tours</h2>
            </div>
            <div class="grid-3" id="relatedPackagesGrid"></div>
          </div>

        </div>
      </section>
    `;

    // Wire up Detail Wishlist Button
    const detailWishBtn = document.getElementById('detailWishlistBtn');
    if (detailWishBtn) {
      detailWishBtn.addEventListener('click', function () {
        const added = WishlistService.toggle(pkg.id);
        this.innerHTML = added ? '&hearts; Saved' : '&hearts; Wishlist';
        this.classList.toggle('active', added);
      });
    }

    // Wire up Detail Compare Button
    const detailCompBtn = document.getElementById('detailCompareBtn');
    if (detailCompBtn) {
      detailCompBtn.addEventListener('click', function () {
        const res = CompareService.toggle(pkg.id);
        if (res.error === 'limit_reached') return;
        this.innerHTML = res.added ? '&#10003; In Compare' : '+ Compare';
      });
    }

    // Render Related Packages
    const relatedGrid = document.getElementById('relatedPackagesGrid');
    if (relatedGrid) {
      let related = PACKAGES_DATA.filter(p => p.id !== pkg.id && (p.category === pkg.category || p.destination === pkg.destination));
      if (related.length < 3) {
        related = PACKAGES_DATA.filter(p => p.id !== pkg.id);
      }
      related = related.slice(0, 3);
      PackageService.renderGrid(relatedGrid, related);
    }
  }

  function renderPackageNotFound(container) {
    container.innerHTML = `
      <section class="section">
        <div class="container">
          <div class="empty-state">
            <div class="empty-state-icon">&#9888;</div>
            <h2 class="empty-state-title">Package Not Found</h2>
            <p class="empty-state-desc">
              The tourism package you are looking for does not exist, has been removed, or an invalid ID was supplied.
            </p>
            <a href="packages.html" class="btn btn-primary btn-lg">Browse All Packages &rarr;</a>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Setup logic for wishlist.html.
   */
  async function setupWishlistPage() {
    const grid = document.getElementById('wishlistGrid');
    const countDisplay = document.getElementById('wishlistCount');
    if (!grid) return;

    const savedIds = WishlistService.getWishlist();
    const allPackages = await PackageService.getPackages();
    const savedPackages = allPackages.filter(p => savedIds.includes(String(p.id)) || savedIds.includes(Number(p.id)));

    if (countDisplay) {
      countDisplay.textContent = `${savedPackages.length} Saved Tour${savedPackages.length === 1 ? '' : 's'}`;
    }

    if (savedPackages.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">&hearts;</div>
          <h2 class="empty-state-title">Your Wishlist is Empty</h2>
          <p class="empty-state-desc">
            You haven't saved any tourism packages yet. Explore our handcrafted tours across Tamil Nadu and click the heart icon on any package card to save it for later.
          </p>
          <a href="packages.html" class="btn btn-primary btn-lg">Browse Packages &rarr;</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = savedPackages.map(pkg => `
      <article class="package-card" data-package-id="${pkg.id}">
        <div class="package-media">
          <img src="${pkg.image}" alt="${pkg.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80'">
          <span class="package-tag">${pkg.categoryName}</span>
          <button type="button" class="package-wishlist-btn active" title="Remove from Wishlist" data-package-id="${pkg.id}" aria-label="Remove from wishlist">
            &hearts;
          </button>
        </div>
        <div class="package-body">
          <div class="package-meta">
            <span class="package-meta-item">&#128205; ${pkg.destination}</span>
            <span class="package-meta-item">&#128197; ${pkg.duration}</span>
          </div>
          <h3 class="package-title">
            <a href="package-details.html?id=${pkg.id}">${pkg.title}</a>
          </h3>
          <div class="package-rating">
            <span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
            <span class="rating-count"><strong>${pkg.rating}</strong> (${pkg.reviewCount} reviews)</span>
          </div>
          <div class="package-price-row">
            <div class="price-box">
              <span class="price-label">Price per person</span>
              <span class="price-amount">&#8377;${pkg.price.toLocaleString('en-IN')}</span>
            </div>
            <div class="d-flex gap-md">
              <a href="package-details.html?id=${pkg.id}" class="btn btn-secondary btn-sm">Details</a>
              <a href="booking.html?id=${pkg.id}" class="btn btn-primary btn-sm">Book Now</a>
            </div>
          </div>
        </div>
      </article>
    `).join('');

    // Wire up remove from wishlist buttons to immediately re-render
    const removeButtons = grid.querySelectorAll('.package-wishlist-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const pkgId = this.getAttribute('data-package-id');
        WishlistService.toggle(pkgId);
        setupWishlistPage(); // Re-render instantly
      });
    });
  }

  /**
   * Setup logic for compare.html.
   */
  async function setupComparePage() {
    const container = document.getElementById('compareContainer');
    const countDisplay = document.getElementById('compareCount');
    if (!container) return;

    const compareIds = CompareService.getCompareList();
    const allPackages = await PackageService.getPackages();
    const comparedPackages = allPackages.filter(p => compareIds.includes(String(p.id)) || compareIds.includes(Number(p.id)));

    if (countDisplay) {
      countDisplay.textContent = `${comparedPackages.length} Package${comparedPackages.length === 1 ? '' : 's'}`;
    }

    if (comparedPackages.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">&#9878;</div>
          <h2 class="empty-state-title">No Packages Selected for Comparison</h2>
          <p class="empty-state-desc">
            You can compare up to 4 tourism packages side-by-side. Browse our catalogue, click the 'Compare' checkbox on your preferred packages, and return here.
          </p>
          <a href="packages.html" class="btn btn-primary btn-lg">Browse Packages &rarr;</a>
        </div>
      `;
      return;
    }

    // Determine highlights: lowest price and highest rating
    const lowestPrice = Math.min(...comparedPackages.map(p => p.price));
    const highestRating = Math.max(...comparedPackages.map(p => p.rating));

    container.innerHTML = `
      <div class="d-flex align-center justify-between" style="margin-bottom: var(--space-lg); flex-wrap: wrap; gap: 12px;">
        <p style="margin: 0; color: var(--color-text-muted);">
          Comparing <strong>${comparedPackages.length}</strong> of maximum 4 tourism packages side-by-side.
        </p>
        <div class="d-flex gap-md">
          <button type="button" id="clearAllCompareBtn" class="btn btn-secondary btn-sm" style="color: var(--color-status-cancelled); border-color: var(--color-border);">
            &#10005; Clear All
          </button>
          <a href="packages.html" class="btn btn-primary btn-sm">
            + Add More Packages
          </a>
        </div>
      </div>

      <div class="compare-table-wrapper">
        <table class="compare-table">
          <thead>
            <tr>
              <th class="compare-feature-label">Package Overview</th>
              ${comparedPackages.map(p => `
                <th class="compare-pkg-col">
                  <div style="position: relative; height: 130px; border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 8px;">
                    <img src="${p.image}" alt="${p.title}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80'">
                    <button type="button" class="remove-compare-item-btn" data-package-id="${p.id}" title="Remove from comparison" style="position:absolute; top:6px; right:6px; background:rgba(0,0,0,0.6); color:#FFF; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer; font-size:12px; line-height:1;">&#10005;</button>
                  </div>
                  <h4 style="font-size: 0.95rem; line-height: 1.3; margin-bottom: 4px;">
                    <a href="package-details.html?id=${p.id}">${p.title}</a>
                  </h4>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="compare-feature-label">Destination</td>
              ${comparedPackages.map(p => `<td class="compare-pkg-col"><strong>${p.destination}</strong></td>`).join('')}
            </tr>
            <tr>
              <td class="compare-feature-label">Category</td>
              ${comparedPackages.map(p => `<td class="compare-pkg-col">${p.categoryName}</td>`).join('')}
            </tr>
            <tr>
              <td class="compare-feature-label">Price Per Person</td>
              ${comparedPackages.map(p => `
                <td class="compare-pkg-col">
                  <div style="font-size: 1.25rem; font-weight: 800; color: var(--color-primary-dark);">&#8377;${p.price.toLocaleString('en-IN')}</div>
                  ${p.price === lowestPrice ? '<span class="badge-best-value">&#10003; Best Value</span>' : ''}
                </td>
              `).join('')}
            </tr>
            <tr>
              <td class="compare-feature-label">Trip Duration</td>
              ${comparedPackages.map(p => `<td class="compare-pkg-col">${p.duration}</td>`).join('')}
            </tr>
            <tr>
              <td class="compare-feature-label">Customer Rating</td>
              ${comparedPackages.map(p => `
                <td class="compare-pkg-col">
                  <span class="stars">&#9733;</span> <strong>${p.rating}</strong> / 5.0
                  <br><small style="color:var(--color-text-light);">(${p.reviewCount} reviews)</small>
                  ${p.rating === highestRating ? '<br><span class="badge-top-rated">★ Top Rated</span>' : ''}
                </td>
              `).join('')}
            </tr>
            <tr>
              <td class="compare-feature-label">Capacity & Seats</td>
              ${comparedPackages.map(p => `<td class="compare-pkg-col"><strong>${p.availableSeats}</strong> of ${p.totalSeats} seats left</td>`).join('')}
            </tr>
            <tr>
              <td class="compare-feature-label">Highlights</td>
              ${comparedPackages.map(p => `<td class="compare-pkg-col" style="font-size: 0.85rem; line-height: 1.4; text-align: left;">${p.description}</td>`).join('')}
            </tr>
            <tr>
              <td class="compare-feature-label">Actions</td>
              ${comparedPackages.map(p => `
                <td class="compare-pkg-col">
                  <div style="display: flex; flex-direction: column; gap: 8px; padding: 6px 0;">
                    <a href="booking.html?id=${p.id}" class="btn btn-terracotta btn-sm" style="width: 100%;">Book Now &rarr;</a>
                    <a href="package-details.html?id=${p.id}" class="btn btn-secondary btn-sm" style="width: 100%;">View Details</a>
                  </div>
                </td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    // Wire Clear All button
    const clearAllBtn = document.getElementById('clearAllCompareBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', function () {
        CompareService.clear();
        setupComparePage(); // Re-render
      });
    }

    // Wire individual remove buttons
    const removeBtns = container.querySelectorAll('.remove-compare-item-btn');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const pkgId = this.getAttribute('data-package-id');
        CompareService.toggle(pkgId);
        setupComparePage(); // Re-render
      });
    });
  }

  /**
   * Setup logic for booking.html (Phase 4A: Customer Booking Module).
   */
  async function setupBookingPage() {
    const container = document.getElementById('bookingContainer');
    if (!container) return;

    // 1. Get package ID from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const pkgId = urlParams.get('id');

    if (!pkgId) {
      container.innerHTML = `
        <div style="padding: 60px 0;">
          <div class="container">
            <div class="empty-state">
              <div class="empty-state-icon">&#128507;</div>
              <h2 class="empty-state-title">No Package Selected for Booking</h2>
              <p class="empty-state-desc">
                Please select a tourism package from our catalogue to proceed with booking your authentic Tamil Nadu experience.
              </p>
              <a href="packages.html" class="btn btn-primary btn-lg">Browse Tourism Packages &rarr;</a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // 2. Fetch package details
    const pkg = await PackageService.getById(pkgId);
    if (!pkg) {
      container.innerHTML = `
        <div style="padding: 60px 0;">
          <div class="container">
            <div class="empty-state">
              <div class="empty-state-icon">&#9888;</div>
              <h2 class="empty-state-title">Package Not Found</h2>
              <p class="empty-state-desc">
                We could not locate package #${pkgId}. It may have been updated or removed.
              </p>
              <div class="d-flex justify-center gap-md" style="margin-top: 16px;">
                <a href="packages.html" class="btn btn-primary">Browse Packages &rarr;</a>
                <a href="../index.html" class="btn btn-secondary">Homepage</a>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // 3. User session check for pre-filling
    const currentUser = CustomerAuth.getCurrentUser();
    const defaultName = currentUser ? currentUser.name || '' : '';
    const defaultEmail = currentUser ? currentUser.email || '' : '';
    const defaultPhone = currentUser ? currentUser.phone || '' : '';

    // Date constraints: minimum date tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDateStr = tomorrow.toISOString().split('T')[0];

    // Initial state
    let travellerCount = 1;
    const maxCapacity = Math.max(1, pkg.availableSeats || 15);
    const initialCalc = BookingService.calculatePrice(pkg.price, travellerCount);

    // Render initial booking layout
    container.innerHTML = `
      <div style="padding: 30px 0 60px 0;">
        <div class="container">
          
          <!-- Breadcrumb -->
          <nav class="breadcrumb-trail" aria-label="Breadcrumb" style="margin-bottom: var(--space-lg);">
            <a href="../index.html">Home</a>
            <span class="breadcrumb-separator">/</span>
            <a href="packages.html">Packages</a>
            <span class="breadcrumb-separator">/</span>
            <a href="package-details.html?id=${pkg.id}">${pkg.title}</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">Confirm Booking</span>
          </nav>

          <div class="section-header" style="margin-bottom: var(--space-xl); text-align: left;">
            <span class="section-tag">Direct Package Reservation</span>
            <h1 style="font-size: 2rem; color: var(--color-primary-dark); margin: 6px 0;">
              Book Your Experience: ${pkg.title}
            </h1>
            <p style="color: var(--color-text-muted); margin: 0;">
              Departing to <strong>${pkg.destination}</strong> &bull; ${pkg.duration} &bull; Handcrafted Authentic Itinerary
            </p>
          </div>

          <div class="booking-layout">
            
            <!-- Left Column: Booking Form Steps -->
            <div class="booking-form-col">
              <form id="bookingForm" novalidate>
                
                <!-- Step 1: Trip & Travellers -->
                <div class="booking-step-card">
                  <div class="booking-step-header">
                    <span class="step-num-badge">1</span>
                    <h2 class="booking-step-title">Select Departure Date & Travellers</h2>
                  </div>

                  <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                    
                    <!-- Departure Date -->
                    <div class="form-group">
                      <label for="travelDate" class="form-label">
                        Departure Date <span style="color: var(--color-status-cancelled);">*</span>
                      </label>
                      <input 
                        type="date" 
                        id="travelDate" 
                        name="travelDate" 
                        class="form-control" 
                        min="${minDateStr}" 
                        value="${minDateStr}" 
                        required
                      >
                      <span class="form-hint">Bookings must be scheduled at least 24 hours in advance.</span>
                      <div class="field-error-msg" id="travelDateError" style="display:none; color:var(--color-status-cancelled); font-size:0.8rem; margin-top:4px;"></div>
                    </div>

                    <!-- Traveller Count -->
                    <div class="form-group">
                      <label class="form-label">
                        Number of Travellers <span style="color: var(--color-status-cancelled);">*</span>
                      </label>
                      <div style="display: flex; align-items: center; gap: 12px; margin-top: 4px;">
                        <div class="traveller-counter">
                          <button type="button" class="counter-btn" id="btnTravellerMinus" aria-label="Decrease travellers" disabled>&minus;</button>
                          <span class="counter-value-display" id="travellerCountDisplay">1</span>
                          <button type="button" class="counter-btn" id="btnTravellerPlus" aria-label="Increase travellers" ${maxCapacity <= 1 ? 'disabled' : ''}>&plus;</button>
                        </div>
                        <input type="hidden" id="travellerCount" name="travellerCount" value="1">
                        <span style="font-size: 0.85rem; color: var(--color-text-muted);">
                          &#128101; <strong id="seatsLeftDisplay">${maxCapacity}</strong> seats available
                        </span>
                      </div>
                      <div class="field-error-msg" id="travellerCountError" style="display:none; color:var(--color-status-cancelled); font-size:0.8rem; margin-top:4px;"></div>
                    </div>

                  </div>
                </div>

                <!-- Step 2: Contact / Traveller Details -->
                <div class="booking-step-card">
                  <div class="booking-step-header">
                    <span class="step-num-badge">2</span>
                    <h2 class="booking-step-title">Lead Traveller & Contact Details</h2>
                  </div>

                  ${currentUser ? `
                    <div style="background: var(--color-primary-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 10px 14px; margin-bottom: var(--space-md); font-size: 0.88rem; color: var(--color-primary-dark); display: flex; align-items: center; gap: 8px;">
                      <span>&#128100; Signed in as <strong>${currentUser.name}</strong> (${currentUser.email})</span>
                    </div>
                  ` : `
                    <div style="background: var(--color-gold-subtle); border: 1px solid var(--color-gold); border-radius: var(--radius-sm); padding: 10px 14px; margin-bottom: var(--space-md); font-size: 0.85rem; color: var(--color-text-main); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                      <span>Already a YAADHUM OOORE member? Log in for express checkout.</span>
                      <a href="login.html" class="btn btn-secondary btn-sm" style="background:#FFF;">Member Login</a>
                    </div>
                  `}

                  <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                    
                    <div class="form-group" style="grid-column: span 2;">
                      <label for="customerName" class="form-label">
                        Full Name (Lead Traveller) <span style="color: var(--color-status-cancelled);">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="customerName" 
                        name="customerName" 
                        class="form-control" 
                        placeholder="e.g. Anandha Kannan" 
                        value="${defaultName}" 
                        required
                      >
                      <div class="field-error-msg" id="customerNameError" style="display:none; color:var(--color-status-cancelled); font-size:0.8rem; margin-top:4px;"></div>
                    </div>

                    <div class="form-group">
                      <label for="customerEmail" class="form-label">
                        Email Address <span style="color: var(--color-status-cancelled);">*</span>
                      </label>
                      <input 
                        type="email" 
                        id="customerEmail" 
                        name="customerEmail" 
                        class="form-control" 
                        placeholder="name@example.com" 
                        value="${defaultEmail}" 
                        required
                      >
                      <span class="form-hint">Confirmation receipt will be delivered here.</span>
                      <div class="field-error-msg" id="customerEmailError" style="display:none; color:var(--color-status-cancelled); font-size:0.8rem; margin-top:4px;"></div>
                    </div>

                    <div class="form-group">
                      <label for="customerPhone" class="form-label">
                        Mobile Phone Number <span style="color: var(--color-status-cancelled);">*</span>
                      </label>
                      <input 
                        type="tel" 
                        id="customerPhone" 
                        name="customerPhone" 
                        class="form-control" 
                        placeholder="10-digit Indian mobile (e.g. 9876543210)" 
                        value="${defaultPhone}" 
                        maxlength="10" 
                        required
                      >
                      <span class="form-hint">Provider will contact you on tour departure morning.</span>
                      <div class="field-error-msg" id="customerPhoneError" style="display:none; color:var(--color-status-cancelled); font-size:0.8rem; margin-top:4px;"></div>
                    </div>

                    <div class="form-group" style="grid-column: span 2;">
                      <label for="specialRequests" class="form-label">
                        Special Requests & Preferences <span style="font-weight: normal; color: var(--color-text-light);">(Optional)</span>
                      </label>
                      <textarea 
                        id="specialRequests" 
                        name="specialRequests" 
                        class="form-control" 
                        rows="2" 
                        placeholder="Dietary preferences (e.g. Pure Jain / Veg), accessibility requirements, pickup points, etc."
                      ></textarea>
                    </div>

                  </div>
                </div>

                <!-- Step 3: Simulated Payment Mode -->
                <div class="booking-step-card">
                  <div class="booking-step-header">
                    <span class="step-num-badge">3</span>
                    <h2 class="booking-step-title">Choose Payment Method</h2>
                  </div>

                  <div style="background: var(--color-gold-subtle); border-left: 4px solid var(--color-gold); border-radius: var(--radius-xs); padding: 12px 16px; margin-bottom: var(--space-md); font-size: 0.85rem; color: var(--color-text-main); line-height: 1.5;">
                    <strong>Academic Demonstration Simulation:</strong> YAADHUM OOORE is a web technology project. No actual monetary transaction or card charge will take place. Select your preferred simulated payment mode below.
                  </div>

                  <div class="payment-methods-grid">
                    
                    <label class="payment-card-label">
                      <input type="radio" name="paymentMethod" value="UPI" checked>
                      <div class="payment-card">
                        <div class="payment-card-title">
                          <span>&#128241; UPI / QR Code</span>
                        </div>
                        <p class="payment-card-desc">Google Pay, PhonePe, Paytm, BHIM</p>
                      </div>
                    </label>

                    <label class="payment-card-label">
                      <input type="radio" name="paymentMethod" value="Card">
                      <div class="payment-card">
                        <div class="payment-card-title">
                          <span>&#128179; Credit / Debit Card</span>
                        </div>
                        <p class="payment-card-desc">Visa, MasterCard, RuPay, Maestro</p>
                      </div>
                    </label>

                    <label class="payment-card-label">
                      <input type="radio" name="paymentMethod" value="NetBanking">
                      <div class="payment-card">
                        <div class="payment-card-title">
                          <span>&#127963; Net Banking</span>
                        </div>
                        <p class="payment-card-desc">SBI, HDFC, ICICI, Canara, Indian Bank</p>
                      </div>
                    </label>

                    <label class="payment-card-label">
                      <input type="radio" name="paymentMethod" value="Arrival">
                      <div class="payment-card">
                        <div class="payment-card-title">
                          <span>&#128181; Pay on Arrival</span>
                        </div>
                        <p class="payment-card-desc">Pay at tour check-in via cash or UPI</p>
                      </div>
                    </label>

                  </div>
                </div>

                <!-- Step 4: Terms & Confirmation -->
                <div class="booking-step-card">
                  <div class="booking-step-header">
                    <span class="step-num-badge">4</span>
                    <h2 class="booking-step-title">Review & Confirm</h2>
                  </div>

                  <div class="form-group" style="margin-bottom: var(--space-lg);">
                    <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; font-size: 0.88rem; line-height: 1.5; color: var(--color-text-main);">
                      <input type="checkbox" id="agreeTerms" name="agreeTerms" style="margin-top: 3px;" required>
                      <span>
                        I accept the <a href="#" onclick="event.preventDefault(); alert('YAADHUM OOORE Academic Terms: Free cancellation up to 48 hours before departure. Respect local eco-tourism norms.');" style="color: var(--color-primary); text-decoration: underline;">Terms & Conditions</a>, Cancellation Policy, and agree to follow responsible eco-tourism guidelines across Tamil Nadu.
                      </span>
                    </label>
                    <div class="field-error-msg" id="agreeTermsError" style="display:none; color:var(--color-status-cancelled); font-size:0.8rem; margin-top:4px;"></div>
                  </div>

                  <div id="bookingAlertBox" style="display: none; margin-bottom: var(--space-md);"></div>

                  <button type="submit" id="submitBookingBtn" class="btn btn-terracotta btn-lg" style="width: 100%; font-size: 1.1rem; padding: 14px;">
                    Confirm & Complete Booking &rarr;
                  </button>
                  <p style="text-align: center; font-size: 0.8rem; color: var(--color-text-light); margin-top: 8px;">
                    Instant confirmation &bull; Verified Local Experience
                  </p>
                </div>

              </form>
            </div>

            <!-- Right Column: Sticky Order Summary -->
            <div class="booking-summary-col">
              <div class="order-summary-card">
                <h3 style="font-size: 1.2rem; color: var(--color-primary-dark); margin-bottom: var(--space-md); font-weight: 800;">
                  Booking Summary
                </h3>

                <!-- Package Thumbnail Preview -->
                <div class="order-pkg-preview">
                  <img src="${pkg.image}" alt="${pkg.title}" class="order-pkg-thumb" onerror="this.src='https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80'">
                  <div>
                    <h4 class="order-pkg-title">${pkg.title}</h4>
                    <div class="order-pkg-meta">&#128205; ${pkg.destination}</div>
                    <div class="order-pkg-meta">&#128197; ${pkg.duration}</div>
                  </div>
                </div>

                <!-- Price Calculations -->
                <div style="margin-bottom: var(--space-md);">
                  <div class="price-breakdown-row">
                    <span>Departure Date</span>
                    <strong id="summaryDepartureDate">${minDateStr}</strong>
                  </div>
                  <div class="price-breakdown-row">
                    <span>Base Price (per person)</span>
                    <span>&#8377;${pkg.price.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="price-breakdown-row">
                    <span>Travellers</span>
                    <span id="summaryTravellerCount">1 Person</span>
                  </div>
                  <div class="price-breakdown-row">
                    <span>Subtotal</span>
                    <span id="summarySubtotal">&#8377;${initialCalc.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="price-breakdown-row">
                    <span>GST (5%)</span>
                    <span id="summaryGst">&#8377;${initialCalc.gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="price-breakdown-row total-row">
                    <span>Grand Total</span>
                    <span id="summaryGrandTotal" style="color: var(--color-primary);">&#8377;${initialCalc.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <!-- Guarantee & Inclusions Preview -->
                <div style="background: var(--color-bg-warm); border-radius: var(--radius-sm); padding: 12px; font-size: 0.8rem; color: var(--color-text-muted); line-height: 1.4;">
                  <div style="font-weight: 700; color: var(--color-primary-dark); margin-bottom: 4px;">&#10003; What's Included:</div>
                  <ul style="padding-left: 16px; margin: 0;">
                    ${(pkg.inclusions || ['Accommodation', 'Guided Tours', 'Local Transfers']).slice(0, 3).map(inc => `<li>${inc}</li>`).join('')}
                  </ul>
                  <div style="margin-top: 8px; font-size: 0.78rem; color: var(--color-text-light);">
                    Free cancellation up to 48 hours before departure.
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    `;

    // 4. Wire Interactive Controls
    const form = document.getElementById('bookingForm');
    const btnMinus = document.getElementById('btnTravellerMinus');
    const btnPlus = document.getElementById('btnTravellerPlus');
    const travellerDisplay = document.getElementById('travellerCountDisplay');
    const travellerHidden = document.getElementById('travellerCount');
    const travelDateInput = document.getElementById('travelDate');
    const customerNameInput = document.getElementById('customerName');
    const customerEmailInput = document.getElementById('customerEmail');
    const customerPhoneInput = document.getElementById('customerPhone');
    const agreeTermsCheckbox = document.getElementById('agreeTerms');
    const submitBtn = document.getElementById('submitBookingBtn');
    const alertBox = document.getElementById('bookingAlertBox');

    // Summary Elements
    const summaryDepartureDate = document.getElementById('summaryDepartureDate');
    const summaryTravellerCount = document.getElementById('summaryTravellerCount');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryGst = document.getElementById('summaryGst');
    const summaryGrandTotal = document.getElementById('summaryGrandTotal');

    function updatePricing() {
      const calc = BookingService.calculatePrice(pkg.price, travellerCount);
      if (travellerDisplay) travellerDisplay.textContent = travellerCount;
      if (travellerHidden) travellerHidden.value = travellerCount;
      if (summaryTravellerCount) summaryTravellerCount.textContent = `${travellerCount} Person${travellerCount > 1 ? 's' : ''}`;
      if (summarySubtotal) summarySubtotal.innerHTML = `&#8377;${calc.subtotal.toLocaleString('en-IN')}`;
      if (summaryGst) summaryGst.innerHTML = `&#8377;${calc.gstAmount.toLocaleString('en-IN')}`;
      if (summaryGrandTotal) summaryGrandTotal.innerHTML = `&#8377;${calc.grandTotal.toLocaleString('en-IN')}`;

      if (btnMinus) btnMinus.disabled = travellerCount <= 1;
      if (btnPlus) btnPlus.disabled = travellerCount >= maxCapacity;
    }

    if (btnMinus) {
      btnMinus.addEventListener('click', function () {
        if (travellerCount > 1) {
          travellerCount--;
          updatePricing();
        }
      });
    }

    if (btnPlus) {
      btnPlus.addEventListener('click', function () {
        if (travellerCount < maxCapacity) {
          travellerCount++;
          updatePricing();
        }
      });
    }

    if (travelDateInput) {
      travelDateInput.addEventListener('change', function () {
        const val = this.value;
        if (summaryDepartureDate) summaryDepartureDate.textContent = val || 'Not Selected';
        const errEl = document.getElementById('travelDateError');
        if (errEl) errEl.style.display = 'none';
      });
    }

    // Clear inline errors on input
    function setupErrorClear(inputEl, errorId) {
      if (!inputEl) return;
      inputEl.addEventListener('input', function () {
        const err = document.getElementById(errorId);
        if (err) err.style.display = 'none';
        if (alertBox) alertBox.style.display = 'none';
      });
    }

    setupErrorClear(customerNameInput, 'customerNameError');
    setupErrorClear(customerEmailInput, 'customerEmailError');
    setupErrorClear(customerPhoneInput, 'customerPhoneError');
    if (agreeTermsCheckbox) {
      agreeTermsCheckbox.addEventListener('change', function () {
        const err = document.getElementById('agreeTermsError');
        if (err) err.style.display = 'none';
      });
    }

    // 5. Handle Form Submission
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Field Validations
        let hasError = false;

        function showError(fieldId, errorId, message) {
          const field = document.getElementById(fieldId);
          const errEl = document.getElementById(errorId);
          if (errEl) {
            errEl.textContent = message;
            errEl.style.display = 'block';
          }
          if (field && !hasError) {
            field.focus();
          }
          hasError = true;
        }

        // Date Check
        const selectedDate = travelDateInput ? travelDateInput.value : '';
        if (!selectedDate) {
          showError('travelDate', 'travelDateError', 'Please select a departure date.');
        } else if (selectedDate < minDateStr) {
          showError('travelDate', 'travelDateError', 'Departure date must be at least 24 hours in the future.');
        }

        // Name Check
        const nameVal = customerNameInput ? customerNameInput.value.trim() : '';
        if (!nameVal || nameVal.length < 2) {
          showError('customerName', 'customerNameError', 'Please enter the lead traveller’s full name.');
        }

        // Email Check
        const emailVal = customerEmailInput ? customerEmailInput.value.trim() : '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailVal || !emailRegex.test(emailVal)) {
          showError('customerEmail', 'customerEmailError', 'Please enter a valid email address.');
        }

        // Phone Check
        const phoneVal = customerPhoneInput ? customerPhoneInput.value.trim() : '';
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneVal || !phoneRegex.test(phoneVal)) {
          showError('customerPhone', 'customerPhoneError', 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
        }

        // Terms Check
        if (agreeTermsCheckbox && !agreeTermsCheckbox.checked) {
          showError('agreeTerms', 'agreeTermsError', 'You must agree to the Terms & Conditions and Eco-tourism Guidelines.');
        }

        if (hasError) return;

        // Submit state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing Reservation...';

        const selectedPayment = form.querySelector('input[name="paymentMethod"]:checked');
        const paymentMethod = selectedPayment ? selectedPayment.value : 'UPI';
        const calc = BookingService.calculatePrice(pkg.price, travellerCount);
        const specialReqs = document.getElementById('specialRequests') ? document.getElementById('specialRequests').value.trim() : '';

        const payload = {
          packageId: pkg.id,
          packageTitle: pkg.title,
          destination: pkg.destination,
          packageImage: pkg.image,
          travelDate: selectedDate,
          travellerCount: travellerCount,
          pricePerPerson: calc.pricePerPerson,
          subtotal: calc.subtotal,
          gstAmount: calc.gstAmount,
          grandTotal: calc.grandTotal,
          customerName: nameVal,
          customerEmail: emailVal,
          customerPhone: phoneVal,
          specialRequests: specialReqs,
          paymentMethod: paymentMethod
        };

        const result = await BookingService.createBooking(payload);

        if (result && result.success && result.data) {
          const booking = result.data;
          
          if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }

          container.innerHTML = `
            <div style="padding: 60px 0;">
              <div class="container">
                <div class="booking-success-box">
                  <div class="success-icon-large">&#10003;</div>
                  <h1 style="color: var(--color-primary-dark); font-size: 1.85rem; margin-bottom: 6px;">
                    Booking Confirmed!
                  </h1>
                  <p style="font-size: 1rem; color: var(--color-text-muted); margin-bottom: var(--space-md);">
                    முன்பதிவு உறுதி செய்யப்பட்டது &bull; Your local tourism experience is secured.
                  </p>

                  <div class="booking-ref-banner">
                    <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--color-text-light); letter-spacing: 0.5px; margin-bottom: 2px;">
                      Booking Reference Number
                    </div>
                    <span class="booking-ref-num">${booking.referenceNumber}</span>
                  </div>

                  <p style="color: var(--color-text-main); font-size: 0.95rem; line-height: 1.5; max-width: 580px; margin: 0 auto var(--space-lg) auto;">
                    Thank you, <strong>${booking.customerName}</strong>! A reservation voucher and tour schedule has been logged for your trip. Please keep this reference number for check-in.
                  </p>

                  <table class="booking-summary-table">
                    <tbody>
                      <tr>
                        <td style="color: var(--color-text-muted); width: 38%;">Package</td>
                        <td><strong>${booking.packageTitle}</strong></td>
                      </tr>
                      <tr>
                        <td style="color: var(--color-text-muted);">Destination</td>
                        <td>${booking.destination}</td>
                      </tr>
                      <tr>
                        <td style="color: var(--color-text-muted);">Departure Date</td>
                        <td><strong>${booking.travelDate}</strong></td>
                      </tr>
                      <tr>
                        <td style="color: var(--color-text-muted);">Travellers</td>
                        <td>${booking.travellerCount} Person(s)</td>
                      </tr>
                      <tr>
                        <td style="color: var(--color-text-muted);">Total Amount</td>
                        <td style="font-size: 1.15rem; font-weight: 800; color: var(--color-primary-dark);">
                          &#8377;${booking.grandTotal.toLocaleString('en-IN')} 
                          <span style="font-size: 0.75rem; font-weight: normal; color: var(--color-text-light);">(incl. 5% GST)</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: var(--color-text-muted);">Payment Mode & Status</td>
                        <td>
                          <span class="badge ${booking.paymentMethod === 'Arrival' ? 'badge-warning' : 'badge-success'}">
                            ${booking.paymentMethod} &bull; ${booking.paymentStatus}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: var(--color-text-muted);">Lead Contact</td>
                        <td>${booking.customerName} (${booking.customerEmail}, +91 ${booking.customerPhone})</td>
                      </tr>
                      ${booking.specialRequests ? `
                        <tr>
                          <td style="color: var(--color-text-muted);">Special Requests</td>
                          <td>${booking.specialRequests}</td>
                        </tr>
                      ` : ''}
                    </tbody>
                  </table>

                  <div class="d-flex justify-center gap-md" style="flex-wrap: wrap; margin-top: var(--space-xl);">
                    <a href="packages.html" class="btn btn-primary btn-md">
                      Browse More Packages &rarr;
                    </a>
                    <a href="../index.html" class="btn btn-secondary btn-md">
                      Return to Homepage
                    </a>
                    <a href="my-bookings.html" class="btn btn-terracotta btn-md">
                      View My Bookings
                    </a>
                  </div>

                  <div style="margin-top: var(--space-xl); font-size: 0.8rem; color: var(--color-text-light);">
                    Need to make adjustments? Reach customer support at <strong>support@yaadhumoore.local</strong> with your reference code.
                  </div>
                </div>
              </div>
            </div>
          `;
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirm & Complete Booking \u2192';
          if (alertBox) {
            alertBox.className = 'alert alert-error';
            alertBox.textContent = (result && result.error) || 'Could not complete your reservation. Please try again.';
            alertBox.style.display = 'block';
          }
        }
      });
    }
  }

  /**
   * Setup logic for my-bookings.html (Phase 4B: Customer Booking Management).
   */
  async function setupMyBookingsPage() {
    const container = document.getElementById('myBookingsContainer');
    if (!container) return;

    // Load initial bookings from demo storage (or backend in production)
    let bookings = BookingService.getBookings();
    let currentFilter = 'all';
    let searchQuery = '';
    let currentSort = 'booking-desc';

    // Base Page Structure
    container.innerHTML = `
      <div style="padding: 30px 0 60px 0;">
        <div class="container">
          
          <!-- Breadcrumb -->
          <nav class="breadcrumb-trail" aria-label="Breadcrumb" style="margin-bottom: var(--space-lg);">
            <a href="../index.html">Home</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">My Bookings</span>
          </nav>

          <!-- Notification Toast Box -->
          <div id="bookingToastBox" style="display: none; margin-bottom: var(--space-md);" role="alert"></div>

          <!-- Page Header -->
          <div class="bookings-dashboard-header d-flex justify-between align-center" style="flex-wrap: wrap; gap: 16px;">
            <div>
              <span class="section-tag">Reservation Hub</span>
              <h1 style="font-size: 2rem; color: var(--color-primary-dark); margin: 6px 0;">
                My Tour Bookings
              </h1>
              <p style="color: var(--color-text-muted); margin: 0;">
                முன்பதிவு மேலாண்மை &bull; Manage your travel reservations, view tour itineraries, and track departure dates.
              </p>
            </div>
            <div>
              <a href="packages.html" class="btn btn-primary btn-md">
                + Explore More Packages
              </a>
            </div>
          </div>

          <!-- KPI Summary Grid -->
          <div class="bookings-kpi-grid" id="bookingsKpiGrid"></div>

          <!-- Toolbar: Search, Filter Tabs, Sort -->
          <div class="bookings-toolbar">
            <div class="bookings-search-box">
              <span class="bookings-search-icon">&#128269;</span>
              <input 
                type="text" 
                id="bookingsSearchInput" 
                class="bookings-search-input" 
                placeholder="Search by booking reference or package name..."
                aria-label="Search bookings by reference or package"
              >
            </div>

            <div class="bookings-filter-tabs" id="bookingsFilterTabs" role="tablist">
              <button type="button" class="booking-filter-tab active" data-filter="all" role="tab">All Bookings</button>
              <button type="button" class="booking-filter-tab" data-filter="upcoming" role="tab">Upcoming</button>
              <button type="button" class="booking-filter-tab" data-filter="completed" role="tab">Completed</button>
              <button type="button" class="booking-filter-tab" data-filter="cancelled" role="tab">Cancelled</button>
            </div>

            <div class="bookings-sort-wrap">
              <label for="bookingsSortSelect" style="font-size: 0.85rem; color: var(--color-text-muted); font-weight: 600;">Sort By:</label>
              <select id="bookingsSortSelect" class="bookings-sort-select" aria-label="Sort bookings">
                <option value="booking-desc">Newest Booking</option>
                <option value="booking-asc">Oldest Booking</option>
                <option value="date-asc">Departure: Earliest First</option>
                <option value="date-desc">Departure: Latest First</option>
              </select>
            </div>
          </div>

          <!-- Bookings List Output -->
          <div id="bookingsList" class="my-bookings-list"></div>

        </div>
      </div>

      <!-- Modal Dialog Overlay for Details & Cancellation -->
      <div id="bookingModalOverlay" class="booking-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div class="booking-modal-dialog" id="bookingModalDialog"></div>
      </div>
    `;

    const kpiGrid = document.getElementById('bookingsKpiGrid');
    const bookingsList = document.getElementById('bookingsList');
    const searchInput = document.getElementById('bookingsSearchInput');
    const sortSelect = document.getElementById('bookingsSortSelect');
    const filterTabs = document.querySelectorAll('.booking-filter-tab');
    const modalOverlay = document.getElementById('bookingModalOverlay');
    const modalDialog = document.getElementById('bookingModalDialog');
    const toastBox = document.getElementById('bookingToastBox');

    // 1. Toast Notification Helper
    function showToast(message, type = 'success') {
      if (!toastBox) return;
      toastBox.className = type === 'success' ? 'alert alert-success' : 'alert alert-error';
      toastBox.innerHTML = `<span>${message}</span>`;
      toastBox.style.display = 'block';
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setTimeout(() => {
        if (toastBox) toastBox.style.display = 'none';
      }, 6000);
    }

    // 2. Render KPI Summary Cards
    function renderKpiCards() {
      if (!kpiGrid) return;
      const stats = BookingService.getBookingStats(bookings);

      kpiGrid.innerHTML = `
        <div class="kpi-card kpi-total">
          <div class="kpi-info">
            <span class="kpi-value">${stats.total}</span>
            <span class="kpi-label">Total Bookings</span>
          </div>
          <div class="kpi-icon">&#128197;</div>
        </div>

        <div class="kpi-card kpi-upcoming">
          <div class="kpi-info">
            <span class="kpi-value">${stats.upcoming}</span>
            <span class="kpi-label">Upcoming Tours</span>
          </div>
          <div class="kpi-icon">&#9992;</div>
        </div>

        <div class="kpi-card kpi-completed">
          <div class="kpi-info">
            <span class="kpi-value">${stats.completed}</span>
            <span class="kpi-label">Completed Tours</span>
          </div>
          <div class="kpi-icon">&#10003;</div>
        </div>

        <div class="kpi-card kpi-cancelled">
          <div class="kpi-info">
            <span class="kpi-value">${stats.cancelled}</span>
            <span class="kpi-label">Cancelled Bookings</span>
          </div>
          <div class="kpi-icon">&#10005;</div>
        </div>
      `;
    }

    // 3. Filter & Sort Bookings
    function getFilteredBookings() {
      const todayStr = new Date().toISOString().split('T')[0];
      let filtered = [...bookings];

      // Filter by status tab
      if (currentFilter === 'upcoming') {
        filtered = filtered.filter(b => b.bookingStatus !== 'Cancelled' && (b.bookingStatus === 'Upcoming' || (b.bookingStatus === 'Confirmed' && (!b.travelDate || b.travelDate >= todayStr))));
      } else if (currentFilter === 'completed') {
        filtered = filtered.filter(b => b.bookingStatus === 'Completed' || (b.bookingStatus === 'Confirmed' && b.travelDate && b.travelDate < todayStr));
      } else if (currentFilter === 'cancelled') {
        filtered = filtered.filter(b => b.bookingStatus === 'Cancelled');
      }

      // Filter by search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(b => {
          const ref = (b.referenceNumber || '').toLowerCase();
          const title = (b.packageTitle || '').toLowerCase();
          const dest = (b.destination || '').toLowerCase();
          const name = (b.customerName || '').toLowerCase();
          return ref.includes(q) || title.includes(q) || dest.includes(q) || name.includes(q);
        });
      }

      // Sort
      filtered.sort((a, b) => {
        if (currentSort === 'booking-desc') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        } else if (currentSort === 'booking-asc') {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        } else if (currentSort === 'date-asc') {
          return (a.travelDate || '') > (b.travelDate || '') ? 1 : -1;
        } else if (currentSort === 'date-desc') {
          return (b.travelDate || '') > (a.travelDate || '') ? 1 : -1;
        }
        return 0;
      });

      return filtered;
    }

    // 4. Render Bookings List
    function renderList() {
      if (!bookingsList) return;

      // Handle completely empty storage state
      if (bookings.length === 0) {
        bookingsList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">&#128197;</div>
            <h2 class="empty-state-title">No Tour Bookings Found</h2>
            <p class="empty-state-desc">
              You haven't made any package reservations yet. Explore our handcrafted tours across Tamil Nadu and discover unforgettable destinations.
            </p>
            <div class="d-flex justify-center gap-md" style="margin-top: var(--space-md); flex-wrap: wrap;">
              <a href="packages.html" class="btn btn-primary btn-lg">Browse Tourism Packages &rarr;</a>
              <button type="button" id="btnSeedSampleBookings" class="btn btn-secondary btn-lg">
                &#9881; Load Demo Sample Bookings
              </button>
            </div>
          </div>
        `;

        const btnSeed = document.getElementById('btnSeedSampleBookings');
        if (btnSeed) {
          btnSeed.addEventListener('click', function () {
            bookings = BookingService.seedSampleBookings();
            renderKpiCards();
            renderList();
            showToast('Demonstration sample bookings loaded successfully!');
          });
        }
        return;
      }

      const filtered = getFilteredBookings();

      // Handle empty filter/search results
      if (filtered.length === 0) {
        bookingsList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">&#128269;</div>
            <h2 class="empty-state-title">No Matching Bookings</h2>
            <p class="empty-state-desc">
              No reservation records matched your search "${searchQuery || currentFilter}". Try resetting your filter criteria or search keyword.
            </p>
            <button type="button" id="btnResetFilters" class="btn btn-primary btn-md" style="margin-top: 14px;">
              Reset Filters & Search
            </button>
          </div>
        `;

        const btnReset = document.getElementById('btnResetFilters');
        if (btnReset) {
          btnReset.addEventListener('click', function () {
            currentFilter = 'all';
            searchQuery = '';
            if (searchInput) searchInput.value = '';
            filterTabs.forEach(tab => {
              if (tab.getAttribute('data-filter') === 'all') tab.classList.add('active');
              else tab.classList.remove('active');
            });
            renderList();
          });
        }
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];

      // Render cards
      bookingsList.innerHTML = filtered.map(b => {
        const isCancelled = b.bookingStatus === 'Cancelled';
        const isCompleted = !isCancelled && (b.bookingStatus === 'Completed' || (b.bookingStatus === 'Confirmed' && b.travelDate && b.travelDate < todayStr));
        const isUpcoming = !isCancelled && !isCompleted;

        let statusClass = 'status-confirmed';
        let statusLabel = 'Confirmed';

        if (isCancelled) {
          statusClass = 'status-cancelled';
          statusLabel = 'Cancelled';
        } else if (isCompleted) {
          statusClass = 'status-completed';
          statusLabel = 'Completed';
        } else {
          statusClass = 'status-upcoming';
          statusLabel = 'Upcoming';
        }

        const canCancel = isUpcoming;
        const imgUrl = b.packageImage || 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80';

        return `
          <article class="my-booking-card" data-booking-id="${b.id}">
            
            <div class="booking-card-media">
              <img src="${imgUrl}" alt="${b.packageTitle}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80'">
            </div>

            <div class="booking-card-body">
              <div>
                <div class="booking-card-top">
                  <span class="booking-ref-badge">${b.referenceNumber}</span>
                  <div class="booking-badges-wrap">
                    <span class="badge-status ${statusClass}">&#9679; ${statusLabel}</span>
                    <span class="badge-payment">&#128179; ${b.paymentMethod || 'UPI'} &bull; ${b.paymentStatus || 'Simulated'}</span>
                  </div>
                </div>

                <h2 class="booking-card-title">
                  <a href="package-details.html?id=${b.packageId}">${b.packageTitle}</a>
                </h2>

                <div class="booking-card-meta-row">
                  <span class="booking-meta-item">&#128205; <strong>${b.destination}</strong></span>
                  <span class="booking-meta-item">&#128197; Departure: <strong>${b.travelDate}</strong></span>
                  <span class="booking-meta-item">&#128101; <strong>${b.travellerCount}</strong> Traveller${b.travellerCount > 1 ? 's' : ''}</span>
                  <span class="booking-meta-item">&#128100; Lead: ${b.customerName}</span>
                </div>
              </div>

              <div class="booking-card-bottom">
                <div class="booking-price-group">
                  <span class="booking-price-label">Total Booking Amount</span>
                  <div class="booking-price-total">
                    &#8377;${(b.grandTotal || 0).toLocaleString('en-IN')}
                    <span style="font-size: 0.75rem; font-weight: normal; color: var(--color-text-light);">(incl. 5% GST)</span>
                  </div>
                </div>

                <div class="booking-card-actions">
                  <button type="button" class="btn btn-secondary btn-sm btn-view-details" data-id="${b.id}">
                    View Details &rarr;
                  </button>
                  ${canCancel ? `
                    <button type="button" class="btn btn-outline btn-sm btn-cancel-booking" data-id="${b.id}" style="border: 1px solid var(--color-border); color: var(--color-status-cancelled);">
                      Cancel Booking
                    </button>
                  ` : ''}
                </div>
              </div>

            </div>

          </article>
        `;
      }).join('');

      // Wire View Details buttons
      const detailBtns = bookingsList.querySelectorAll('.btn-view-details');
      detailBtns.forEach(btn => {
        btn.addEventListener('click', function () {
          const bId = this.getAttribute('data-id');
          const targetBooking = bookings.find(b => String(b.id) === String(bId));
          if (targetBooking) openDetailsModal(targetBooking);
        });
      });

      // Wire Cancel Booking buttons
      const cancelBtns = bookingsList.querySelectorAll('.btn-cancel-booking');
      cancelBtns.forEach(btn => {
        btn.addEventListener('click', function () {
          const bId = this.getAttribute('data-id');
          const targetBooking = bookings.find(b => String(b.id) === String(bId));
          if (targetBooking) openCancelModal(targetBooking);
        });
      });
    }

    // 5. Open Detailed View Modal
    function openDetailsModal(booking) {
      if (!modalDialog || !modalOverlay) return;

      const isCancelled = booking.bookingStatus === 'Cancelled';
      const todayStr = new Date().toISOString().split('T')[0];
      const isCompleted = !isCancelled && (booking.bookingStatus === 'Completed' || (booking.bookingStatus === 'Confirmed' && booking.travelDate && booking.travelDate < todayStr));
      const canCancel = !isCancelled && !isCompleted;

      modalDialog.innerHTML = `
        <div class="booking-modal-header">
          <div>
            <h3 class="booking-modal-title" id="modalTitle">Booking Details</h3>
            <span class="booking-ref-badge" style="margin-top: 4px;">${booking.referenceNumber}</span>
          </div>
          <button type="button" class="booking-modal-close" id="btnCloseModal" aria-label="Close dialog">&times;</button>
        </div>

        <div class="booking-modal-body">
          
          <div style="display: flex; gap: 14px; margin-bottom: var(--space-md); padding-bottom: var(--space-md); border-bottom: 1px solid var(--color-border);">
            <img src="${booking.packageImage || 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80'}" alt="${booking.packageTitle}" style="width: 100px; height: 75px; object-fit: cover; border-radius: var(--radius-sm);" onerror="this.src='https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80'">
            <div>
              <h4 style="font-size: 1.1rem; color: var(--color-primary-dark); margin-bottom: 2px;">${booking.packageTitle}</h4>
              <div style="font-size: 0.85rem; color: var(--color-text-muted);">&#128205; ${booking.destination}</div>
              <div style="font-size: 0.85rem; color: var(--color-text-muted);">&#128197; Departure Date: <strong>${booking.travelDate}</strong></div>
            </div>
          </div>

          <table class="booking-summary-table" style="margin: 0 0 var(--space-md) 0;">
            <tbody>
              <tr>
                <td style="color: var(--color-text-muted); width: 40%;">Booking Status</td>
                <td>
                  <span class="badge ${isCancelled ? 'badge-warning' : (isCompleted ? 'badge-primary' : 'badge-success')}">
                    ${booking.bookingStatus}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="color: var(--color-text-muted);">Payment Method & Status</td>
                <td>${booking.paymentMethod || 'UPI'} &bull; ${booking.paymentStatus || 'Simulated'}</td>
              </tr>
              <tr>
                <td style="color: var(--color-text-muted);">Number of Travellers</td>
                <td>${booking.travellerCount} Person(s)</td>
              </tr>
              <tr>
                <td style="color: var(--color-text-muted);">Base Price Per Person</td>
                <td>&#8377;${(booking.pricePerPerson || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="color: var(--color-text-muted);">Subtotal</td>
                <td>&#8377;${(booking.subtotal || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="color: var(--color-text-muted);">GST (5%)</td>
                <td>&#8377;${(booking.gstAmount || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="color: var(--color-text-muted); font-weight: 700;">Grand Total</td>
                <td style="font-size: 1.2rem; font-weight: 800; color: var(--color-primary-dark);">
                  &#8377;${(booking.grandTotal || 0).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr>
                <td style="color: var(--color-text-muted);">Lead Traveller</td>
                <td>${booking.customerName}</td>
              </tr>
              <tr>
                <td style="color: var(--color-text-muted);">Email Address</td>
                <td>${booking.customerEmail}</td>
              </tr>
              <tr>
                <td style="color: var(--color-text-muted);">Mobile Contact</td>
                <td>+91 ${booking.customerPhone}</td>
              </tr>
              ${booking.specialRequests ? `
                <tr>
                  <td style="color: var(--color-text-muted);">Special Requests</td>
                  <td>${booking.specialRequests}</td>
                </tr>
              ` : ''}
              ${isCancelled ? `
                <tr style="background: #FFF5F5;">
                  <td style="color: var(--color-status-cancelled); font-weight: 700;">Cancellation Reason</td>
                  <td style="color: var(--color-status-cancelled);">${booking.cancellationReason || 'Cancelled by customer'} (${booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleDateString() : 'N/A'})</td>
                </tr>
              ` : ''}
              <tr>
                <td style="color: var(--color-text-muted);">Booking Timestamp</td>
                <td><small>${booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}</small></td>
              </tr>
            </tbody>
          </table>

          <div style="background: var(--color-bg-warm); border-radius: var(--radius-sm); padding: 12px; font-size: 0.8rem; color: var(--color-text-muted); line-height: 1.4;">
            <strong>Academic Demonstration Notice:</strong> This booking is recorded in browser local demonstration storage (<code>yaadhum_demo_bookings</code>) for evaluation. No live transaction or payment gateway charge has occurred.
          </div>

        </div>

        <div class="booking-modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" id="btnPrintReceiptBtn">
            &#128424; Print Summary
          </button>
          ${canCancel ? `
            <button type="button" class="btn btn-outline btn-sm" id="btnModalCancelAction" style="border: 1px solid var(--color-status-cancelled); color: var(--color-status-cancelled);">
              Cancel Reservation
            </button>
          ` : ''}
          <button type="button" class="btn btn-primary btn-sm" id="btnModalCloseAction">
            Close
          </button>
        </div>
      `;

      modalOverlay.classList.add('is-active');

      // Wire Close buttons
      const btnClose = document.getElementById('btnCloseModal');
      const btnCloseAction = document.getElementById('btnModalCloseAction');
      if (btnClose) btnClose.addEventListener('click', closeModal);
      if (btnCloseAction) btnCloseAction.addEventListener('click', closeModal);

      // Wire Print
      const btnPrint = document.getElementById('btnPrintReceiptBtn');
      if (btnPrint) {
        btnPrint.addEventListener('click', () => {
          if (typeof window !== 'undefined' && typeof window.print === 'function') {
            window.print();
          }
        });
      }

      // Wire Cancel from Details
      const btnModalCancel = document.getElementById('btnModalCancelAction');
      if (btnModalCancel) {
        btnModalCancel.addEventListener('click', () => {
          closeModal();
          openCancelModal(booking);
        });
      }
    }

    // 6. Open Cancellation Confirmation Modal
    function openCancelModal(booking) {
      if (!modalDialog || !modalOverlay) return;

      modalDialog.innerHTML = `
        <div class="booking-modal-header" style="background: #FFF8E1; border-bottom-color: var(--color-terracotta);">
          <div>
            <h3 class="booking-modal-title" style="color: var(--color-terracotta-dark);" id="modalTitle">
              Confirm Booking Cancellation
            </h3>
            <span class="booking-ref-badge" style="margin-top: 4px;">${booking.referenceNumber}</span>
          </div>
          <button type="button" class="booking-modal-close" id="btnCloseCancelModal" aria-label="Close dialog">&times;</button>
        </div>

        <div class="booking-modal-body">
          <div class="cancel-warning-banner">
            <strong>Demonstration Cancellation Policy:</strong>
            <p style="margin: 4px 0 0 0;">
              This is an academic project prototype. Confirming cancellation will update your local demonstration booking record to <strong>Cancelled</strong>.
              No actual card refund or monetary reversal is processed. In the production deployment, Person 2's backend handles seat replenishment and 48-hour eligibility verification.
            </p>
          </div>

          <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 14px; margin-bottom: var(--space-md);">
            <h4 style="margin: 0 0 6px 0; color: var(--color-primary-dark); font-size: 1.05rem;">${booking.packageTitle}</h4>
            <div style="font-size: 0.88rem; color: var(--color-text-muted); line-height: 1.5;">
              &#128205; Destination: <strong>${booking.destination}</strong><br>
              &#128197; Departure: <strong>${booking.travelDate}</strong> (${booking.travellerCount} Traveller(s))<br>
              &#128176; Amount Paid: <strong>&#8377;${(booking.grandTotal || 0).toLocaleString('en-IN')}</strong> (${booking.paymentMethod || 'UPI'})
            </div>
          </div>

          <div class="form-group">
            <label for="cancelReasonSelect" class="form-label">
              Reason for Cancellation <span style="color: var(--color-text-light); font-weight: normal;">(Required for demo record)</span>
            </label>
            <select id="cancelReasonSelect" class="form-control" style="font-size: 0.9rem;">
              <option value="Change in personal travel plans">Change in personal travel plans</option>
              <option value="Scheduling or work conflict">Scheduling or work conflict</option>
              <option value="Medical / emergency situation">Medical / emergency situation</option>
              <option value="Booked alternate Tamil Nadu package">Booked alternate Tamil Nadu package</option>
              <option value="Academic test / demonstration evaluation">Academic test / demonstration evaluation</option>
            </select>
          </div>
        </div>

        <div class="booking-modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" id="btnDismissCancelModal">
            Keep My Booking
          </button>
          <button type="button" class="btn btn-terracotta btn-sm" id="btnConfirmCancelBooking">
            Yes, Cancel This Booking (Demo) &rarr;
          </button>
        </div>
      `;

      modalOverlay.classList.add('is-active');

      const btnClose = document.getElementById('btnCloseCancelModal');
      const btnDismiss = document.getElementById('btnDismissCancelModal');
      const btnConfirm = document.getElementById('btnConfirmCancelBooking');
      const reasonSelect = document.getElementById('cancelReasonSelect');

      if (btnClose) btnClose.addEventListener('click', closeModal);
      if (btnDismiss) btnDismiss.addEventListener('click', closeModal);

      if (btnConfirm) {
        btnConfirm.addEventListener('click', async function () {
          btnConfirm.disabled = true;
          btnConfirm.textContent = 'Cancelling...';

          const reason = reasonSelect ? reasonSelect.value : 'Customer requested cancellation (Demo)';
          const res = await BookingService.cancelBooking(booking.id, reason);

          closeModal();

          if (res.success) {
            bookings = BookingService.getBookings();
            renderKpiCards();
            renderList();
            showToast(`Booking ${booking.referenceNumber} has been successfully cancelled (Demonstration Mode).`, 'success');
          } else {
            showToast(res.error || 'Failed to cancel booking.', 'error');
          }
        });
      }
    }

    // 7. Close Modal Helper
    function closeModal() {
      if (!modalOverlay) return;
      modalOverlay.classList.remove('is-active');
      if (modalDialog) modalDialog.innerHTML = '';
    }

    // Modal background click and Esc key listeners
    if (modalOverlay) {
      modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) closeModal();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('is-active')) {
        closeModal();
      }
    });

    // 8. Wire Search, Filter Tabs & Sort Select
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = this.value;
        renderList();
      });
    }

    filterTabs.forEach(tab => {
      tab.addEventListener('click', function () {
        filterTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.getAttribute('data-filter');
        renderList();
      });
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        currentSort = this.value;
        renderList();
      });
    }

    // Initial Render
    renderKpiCards();
    renderList();
  }

  /**
   * Setup logic for profile.html (Phase 4C: Customer Profile Management).
   */
  async function setupProfilePage() {
    const container = document.getElementById('profileContainer');
    if (!container) return;

    let profile = CustomerAuth.getProfile();
    let isEditing = false;

    function getInitials(name) {
      if (!name || typeof name !== 'string') return 'YO';
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    // Render base layout
    container.innerHTML = `
      <div style="padding: 30px 0 60px 0;">
        <div class="container">
          
          <!-- Breadcrumb Trail -->
          <nav class="breadcrumb-trail" aria-label="Breadcrumb" style="margin-bottom: var(--space-lg);">
            <a href="../index.html">Home</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">My Profile</span>
          </nav>

          <!-- Top Notification Toast -->
          <div id="profileAlertBox" style="display: none; margin-bottom: var(--space-md);" role="alert" aria-live="polite"></div>

          <!-- Section Header -->
          <div class="section-header" style="text-align: left; margin-bottom: var(--space-xl);">
            <span class="section-tag">Account Management</span>
            <h1 style="font-size: 2rem; color: var(--color-primary-dark); margin: 6px 0;">
              Customer Profile & Account
            </h1>
            <p style="color: var(--color-text-muted); margin: 0;">
              யாதும் ஊரே யாவரும் கேளிர் &bull; View and manage your personal details, contact address, and account security.
            </p>
          </div>

          <!-- Profile 2-Column Grid -->
          <div class="profile-layout">
            
            <!-- Left Column: Profile Overview Card -->
            <aside class="profile-overview-card">
              <div class="profile-avatar" id="overviewAvatar">
                ${getInitials(profile.name)}
              </div>
              
              <h2 class="profile-overview-name" id="overviewName">${profile.name}</h2>
              <div class="profile-overview-email" id="overviewEmail">${profile.email}</div>

              <div class="profile-badges-row">
                <span class="badge badge-success" id="overviewStatus">&#9679; ${profile.status || 'Active'}</span>
                <span class="badge badge-primary">Customer</span>
                ${profile.isDemo ? '<span class="badge badge-warning">Demo Account</span>' : ''}
              </div>

              <div class="profile-meta-list">
                <div class="profile-meta-row">
                  <span class="profile-meta-label">Customer ID</span>
                  <span class="profile-meta-value" id="overviewCustomerId">${profile.id || 'CUST-101'}</span>
                </div>
                <div class="profile-meta-row">
                  <span class="profile-meta-label">Mobile Number</span>
                  <span class="profile-meta-value" id="overviewPhone">${profile.phone || 'Not provided'}</span>
                </div>
                <div class="profile-meta-row">
                  <span class="profile-meta-label">City / State</span>
                  <span class="profile-meta-value" id="overviewLocation">${profile.city ? profile.city + ', ' + (profile.state || 'Tamil Nadu') : 'Tamil Nadu'}</span>
                </div>
                <div class="profile-meta-row">
                  <span class="profile-meta-label">Member Since</span>
                  <span class="profile-meta-value" id="overviewMemberSince">${profile.memberSince || 'March 2026'}</span>
                </div>
              </div>

              <div style="margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 8px;">
                <a href="my-bookings.html" class="btn btn-secondary btn-sm" style="width: 100%;">
                  &#128197; My Tour Bookings &rarr;
                </a>
                <a href="wishlist.html" class="btn btn-outline btn-sm" style="width: 100%; border: 1px solid var(--color-border);">
                  &hearts; Saved Wishlist
                </a>
              </div>
            </aside>

            <!-- Right Column: Settings & Forms -->
            <div class="profile-main-col">
              
              <!-- Card 1: Personal & Address Information -->
              <div class="profile-card" id="profileDetailsCard">
                <div class="profile-card-header">
                  <div class="profile-card-title-group">
                    <h3 class="profile-card-title">Personal & Address Information</h3>
                    <p class="profile-card-desc">Review your official contact credentials and residential address.</p>
                  </div>
                  <button type="button" id="btnToggleEditProfile" class="btn btn-primary btn-sm">
                    &#9998; Edit Profile
                  </button>
                </div>

                <!-- Academic Demonstration Mode Banner -->
                <div class="alert alert-demo is-visible" style="margin-bottom: var(--space-lg);">
                  <strong>Academic Demonstration Mode:</strong> Profile updates are verified and maintained in client demonstration storage. Database-backed synchronization will connect with Person 2's backend server.
                </div>

                <form id="profileDetailsForm" novalidate>
                  
                  <!-- Section 1: Personal Info -->
                  <div class="profile-section-title">Personal Information</div>
                  
                  <div class="profile-form-grid">
                    <div class="form-group">
                      <label for="profileName" class="form-label">Full Name <span style="color:var(--color-status-cancelled);">*</span></label>
                      <input 
                        type="text" 
                        id="profileName" 
                        name="name" 
                        class="form-input is-readonly" 
                        value="${profile.name}" 
                        readonly 
                        required
                      >
                      <span id="profileNameError" class="form-error-msg" aria-live="polite"></span>
                    </div>

                    <div class="form-group">
                      <label for="profileEmail" class="form-label">Email Address <span style="color:var(--color-status-cancelled);">*</span></label>
                      <input 
                        type="email" 
                        id="profileEmail" 
                        name="email" 
                        class="form-input is-readonly" 
                        value="${profile.email}" 
                        readonly 
                        required
                      >
                      <span id="profileEmailError" class="form-error-msg" aria-live="polite"></span>
                    </div>

                    <div class="form-group">
                      <label for="profilePhone" class="form-label">Mobile Number <span style="color:var(--color-status-cancelled);">*</span></label>
                      <input 
                        type="tel" 
                        id="profilePhone" 
                        name="phone" 
                        class="form-input is-readonly" 
                        value="${profile.phone}" 
                        maxlength="10" 
                        readonly 
                        required
                      >
                      <span id="profilePhoneError" class="form-error-msg" aria-live="polite"></span>
                      <span class="form-help">10-digit Indian mobile starting with 6–9</span>
                    </div>

                    <div class="form-group">
                      <label for="profileDob" class="form-label">Date of Birth</label>
                      <input 
                        type="date" 
                        id="profileDob" 
                        name="dob" 
                        class="form-input is-readonly" 
                        value="${profile.dob || ''}" 
                        readonly
                      >
                      <span id="profileDobError" class="form-error-msg" aria-live="polite"></span>
                    </div>

                    <div class="form-group" style="grid-column: span 2;">
                      <label for="profileGender" class="form-label">Gender</label>
                      <select id="profileGender" name="gender" class="form-input is-readonly" disabled>
                        <option value="Prefer not to say" ${profile.gender === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
                        <option value="Male" ${profile.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${profile.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Other" ${profile.gender === 'Other' ? 'selected' : ''}>Other</option>
                      </select>
                    </div>
                  </div>

                  <!-- Section 2: Address Info -->
                  <div class="profile-section-title">Address Information</div>

                  <div class="form-group" style="margin-bottom: var(--space-md);">
                    <label for="profileAddress" class="form-label">Street / Residential Address <span style="color:var(--color-status-cancelled);">*</span></label>
                    <input 
                      type="text" 
                      id="profileAddress" 
                      name="address" 
                      class="form-input is-readonly" 
                      value="${profile.address || ''}" 
                      readonly 
                      required
                    >
                    <span id="profileAddressError" class="form-error-msg" aria-live="polite"></span>
                  </div>

                  <div class="profile-form-grid">
                    <div class="form-group">
                      <label for="profileCity" class="form-label">City / Town <span style="color:var(--color-status-cancelled);">*</span></label>
                      <input 
                        type="text" 
                        id="profileCity" 
                        name="city" 
                        class="form-input is-readonly" 
                        value="${profile.city || ''}" 
                        readonly 
                        required
                      >
                      <span id="profileCityError" class="form-error-msg" aria-live="polite"></span>
                    </div>

                    <div class="form-group">
                      <label for="profileState" class="form-label">State <span style="color:var(--color-status-cancelled);">*</span></label>
                      <input 
                        type="text" 
                        id="profileState" 
                        name="state" 
                        class="form-input is-readonly" 
                        value="${profile.state || 'Tamil Nadu'}" 
                        readonly 
                        required
                      >
                      <span id="profileStateError" class="form-error-msg" aria-live="polite"></span>
                    </div>

                    <div class="form-group" style="grid-column: span 2;">
                      <label for="profilePincode" class="form-label">PIN Code <span style="color:var(--color-status-cancelled);">*</span></label>
                      <input 
                        type="text" 
                        id="profilePincode" 
                        name="pincode" 
                        class="form-input is-readonly" 
                        value="${profile.pincode || ''}" 
                        maxlength="6" 
                        readonly 
                        required
                      >
                      <span id="profilePincodeError" class="form-error-msg" aria-live="polite"></span>
                      <span class="form-help">6-digit Indian Postal Code</span>
                    </div>
                  </div>

                  <!-- Action Buttons (Shown when in Edit Mode) -->
                  <div id="profileFormActions" class="profile-actions-bar" style="display: none;">
                    <button type="button" id="btnCancelProfileEdit" class="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" id="btnSaveProfileChanges" class="btn btn-terracotta">
                      Save Changes &rarr;
                    </button>
                  </div>

                </form>
              </div>

              <!-- Card 2: Password Management -->
              <div class="profile-card" id="passwordManagementCard">
                <div class="profile-card-header">
                  <div class="profile-card-title-group">
                    <h3 class="profile-card-title">Security & Password Management</h3>
                    <p class="profile-card-desc">Change your account password securely.</p>
                  </div>
                </div>

                <div class="security-notice-box">
                  <strong>Password Security Standards:</strong> New password must contain at least 8 characters. Passwords are never logged or stored in local browser storage, and verification requires a secure live database connection.
                </div>

                <div id="passwordAlertBox" style="display: none; margin-bottom: var(--space-md);" role="alert" aria-live="polite"></div>

                <form id="changePasswordForm" novalidate>
                  
                  <div class="form-group" style="margin-bottom: var(--space-md);">
                    <label for="currentPassword" class="form-label">Current Password <span style="color:var(--color-status-cancelled);">*</span></label>
                    <div class="password-input-wrapper">
                      <input 
                        type="password" 
                        id="currentPassword" 
                        name="currentPassword" 
                        class="form-input" 
                        placeholder="Enter current password" 
                        required 
                        autocomplete="current-password"
                      >
                      <button type="button" class="password-toggle-btn" data-target="currentPassword" aria-label="Show current password">Show</button>
                    </div>
                    <span id="currentPasswordError" class="form-error-msg" aria-live="polite"></span>
                  </div>

                  <div class="profile-form-grid">
                    <div class="form-group">
                      <label for="newPassword" class="form-label">New Password <span style="color:var(--color-status-cancelled);">*</span></label>
                      <div class="password-input-wrapper">
                        <input 
                          type="password" 
                          id="newPassword" 
                          name="newPassword" 
                          class="form-input" 
                          placeholder="Minimum 8 characters" 
                          required 
                          autocomplete="new-password"
                        >
                        <button type="button" class="password-toggle-btn" data-target="newPassword" aria-label="Show new password">Show</button>
                      </div>
                      <span id="newPasswordError" class="form-error-msg" aria-live="polite"></span>
                    </div>

                    <div class="form-group">
                      <label for="confirmNewPassword" class="form-label">Confirm New Password <span style="color:var(--color-status-cancelled);">*</span></label>
                      <div class="password-input-wrapper">
                        <input 
                          type="password" 
                          id="confirmNewPassword" 
                          name="confirmNewPassword" 
                          class="form-input" 
                          placeholder="Re-enter new password" 
                          required 
                          autocomplete="new-password"
                        >
                        <button type="button" class="password-toggle-btn" data-target="confirmNewPassword" aria-label="Show confirm new password">Show</button>
                      </div>
                      <span id="confirmNewPasswordError" class="form-error-msg" aria-live="polite"></span>
                    </div>
                  </div>

                  <div style="margin-top: var(--space-lg); text-align: right;">
                    <button type="submit" id="btnSubmitChangePassword" class="btn btn-primary">
                      Update Password &rarr;
                    </button>
                  </div>

                </form>
              </div>

            </div>

          </div>

        </div>
      </div>
    `;

    // Elements & Controllers
    const editableInputs = [
      document.getElementById('profileName'),
      document.getElementById('profileEmail'),
      document.getElementById('profilePhone'),
      document.getElementById('profileDob'),
      document.getElementById('profileAddress'),
      document.getElementById('profileCity'),
      document.getElementById('profileState'),
      document.getElementById('profilePincode')
    ];
    const genderSelect = document.getElementById('profileGender');
    const btnToggleEdit = document.getElementById('btnToggleEditProfile');
    const actionsBar = document.getElementById('profileFormActions');
    const btnCancel = document.getElementById('btnCancelProfileEdit');
    const profileForm = document.getElementById('profileDetailsForm');
    const profileAlert = document.getElementById('profileAlertBox');

    function showTopToast(msg, type = 'success') {
      if (!profileAlert) return;
      profileAlert.className = type === 'success' ? 'alert alert-success is-visible' : 'alert alert-error is-visible';
      profileAlert.innerHTML = `<span>${msg}</span>`;
      profileAlert.style.display = 'block';
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setTimeout(() => {
        if (profileAlert) profileAlert.style.display = 'none';
      }, 6000);
    }

    function setEditMode(enable) {
      isEditing = enable;
      editableInputs.forEach(input => {
        if (input) {
          input.readOnly = !enable;
          if (enable) input.classList.remove('is-readonly');
          else input.classList.add('is-readonly');
        }
      });
      if (genderSelect) {
        genderSelect.disabled = !enable;
        if (enable) genderSelect.classList.remove('is-readonly');
        else genderSelect.classList.add('is-readonly');
      }
      if (actionsBar) actionsBar.style.display = enable ? 'flex' : 'none';
      if (btnToggleEdit) btnToggleEdit.style.display = enable ? 'none' : 'inline-flex';
      if (enable && editableInputs[0]) editableInputs[0].focus();
    }

    function restoreOriginalValues() {
      if (document.getElementById('profileName')) document.getElementById('profileName').value = profile.name || '';
      if (document.getElementById('profileEmail')) document.getElementById('profileEmail').value = profile.email || '';
      if (document.getElementById('profilePhone')) document.getElementById('profilePhone').value = profile.phone || '';
      if (document.getElementById('profileDob')) document.getElementById('profileDob').value = profile.dob || '';
      if (genderSelect) genderSelect.value = profile.gender || 'Prefer not to say';
      if (document.getElementById('profileAddress')) document.getElementById('profileAddress').value = profile.address || '';
      if (document.getElementById('profileCity')) document.getElementById('profileCity').value = profile.city || '';
      if (document.getElementById('profileState')) document.getElementById('profileState').value = profile.state || 'Tamil Nadu';
      if (document.getElementById('profilePincode')) document.getElementById('profilePincode').value = profile.pincode || '';

      ['profileName', 'profileEmail', 'profilePhone', 'profileDob', 'profileAddress', 'profileCity', 'profileState', 'profilePincode'].forEach(id => {
        const err = document.getElementById(id + 'Error');
        if (err) err.textContent = '';
        const input = document.getElementById(id);
        if (input) input.classList.remove('input-error', 'input-success');
      });
    }

    if (btnToggleEdit) {
      btnToggleEdit.addEventListener('click', () => setEditMode(true));
    }

    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        restoreOriginalValues();
        setEditMode(false);
      });
    }

    // Profile Details Form Submission
    if (profileForm) {
      profileForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        let hasError = false;

        function showFieldErr(id, errId, msg) {
          const input = document.getElementById(id);
          const err = document.getElementById(errId);
          if (err) err.textContent = msg;
          if (input) {
            input.classList.add('input-error');
            if (!hasError) input.focus();
          }
          hasError = true;
        }

        function clearFieldErr(id, errId) {
          const input = document.getElementById(id);
          const err = document.getElementById(errId);
          if (err) err.textContent = '';
          if (input) input.classList.remove('input-error');
        }

        const nameVal = document.getElementById('profileName').value.trim();
        const emailVal = document.getElementById('profileEmail').value.trim();
        const phoneVal = document.getElementById('profilePhone').value.trim();
        const addressVal = document.getElementById('profileAddress').value.trim();
        const cityVal = document.getElementById('profileCity').value.trim();
        const stateVal = document.getElementById('profileState').value.trim();
        const pincodeVal = document.getElementById('profilePincode').value.trim();

        if (!nameVal || nameVal.length < 2) {
          showFieldErr('profileName', 'profileNameError', 'Full name is required (at least 2 characters).');
        } else {
          clearFieldErr('profileName', 'profileNameError');
        }

        if (!FormValidator.isRequired(emailVal)) {
          showFieldErr('profileEmail', 'profileEmailError', 'Email address is required.');
        } else if (!FormValidator.isValidEmail(emailVal)) {
          showFieldErr('profileEmail', 'profileEmailError', 'Please enter a valid email address.');
        } else {
          clearFieldErr('profileEmail', 'profileEmailError');
        }

        if (!FormValidator.isRequired(phoneVal)) {
          showFieldErr('profilePhone', 'profilePhoneError', 'Mobile number is required.');
        } else if (!FormValidator.isValidIndianPhone(phoneVal)) {
          showFieldErr('profilePhone', 'profilePhoneError', 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
        } else {
          clearFieldErr('profilePhone', 'profilePhoneError');
        }

        if (!FormValidator.isRequired(addressVal)) {
          showFieldErr('profileAddress', 'profileAddressError', 'Street address is required.');
        } else {
          clearFieldErr('profileAddress', 'profileAddressError');
        }

        if (!FormValidator.isRequired(cityVal)) {
          showFieldErr('profileCity', 'profileCityError', 'City is required.');
        } else {
          clearFieldErr('profileCity', 'profileCityError');
        }

        if (!FormValidator.isRequired(stateVal)) {
          showFieldErr('profileState', 'profileStateError', 'State is required.');
        } else {
          clearFieldErr('profileState', 'profileStateError');
        }

        if (!FormValidator.isRequired(pincodeVal)) {
          showFieldErr('profilePincode', 'profilePincodeError', 'PIN code is required.');
        } else if (!FormValidator.isValidPincode(pincodeVal)) {
          showFieldErr('profilePincode', 'profilePincodeError', 'Enter a valid 6-digit Indian PIN code (e.g. 600001).');
        } else {
          clearFieldErr('profilePincode', 'profilePincodeError');
        }

        if (hasError) return;

        const saveBtn = document.getElementById('btnSaveProfileChanges');
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = 'Saving Changes...';
        }

        const payload = {
          name: nameVal,
          email: emailVal,
          phone: phoneVal,
          dob: document.getElementById('profileDob') ? document.getElementById('profileDob').value : '',
          gender: genderSelect ? genderSelect.value : 'Prefer not to say',
          address: addressVal,
          city: cityVal,
          state: stateVal,
          pincode: pincodeVal
        };

        const res = await CustomerAuth.updateProfile(payload);

        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Changes \u2192';
        }

        if (res.success) {
          profile = res.data;
          
          // Update Overview Card display
          const avatarEl = document.getElementById('overviewAvatar');
          const nameEl = document.getElementById('overviewName');
          const emailEl = document.getElementById('overviewEmail');
          const phoneEl = document.getElementById('overviewPhone');
          const locEl = document.getElementById('overviewLocation');

          if (avatarEl) avatarEl.textContent = getInitials(profile.name);
          if (nameEl) nameEl.textContent = profile.name;
          if (emailEl) emailEl.textContent = profile.email;
          if (phoneEl) phoneEl.textContent = profile.phone;
          if (locEl) locEl.textContent = `${profile.city}, ${profile.state || 'Tamil Nadu'}`;

          setEditMode(false);
          showTopToast(res.notice || 'Profile updated successfully!', 'success');
        } else {
          showTopToast(res.error || 'Failed to update profile.', 'error');
        }
      });
    }

    // Password Form Handling
    const passwordForm = document.getElementById('changePasswordForm');
    const passwordAlert = document.getElementById('passwordAlertBox');
    const submitPassBtn = document.getElementById('btnSubmitChangePassword');

    // Init password toggle buttons
    FormValidator.initPasswordToggles(passwordForm);

    if (passwordForm) {
      passwordForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        let hasPassErr = false;

        function showPassErr(id, errId, msg) {
          const input = document.getElementById(id);
          const err = document.getElementById(errId);
          if (err) err.textContent = msg;
          if (input) {
            input.classList.add('input-error');
            if (!hasPassErr) input.focus();
          }
          hasPassErr = true;
        }

        function clearPassErr(id, errId) {
          const input = document.getElementById(id);
          const err = document.getElementById(errId);
          if (err) err.textContent = '';
          if (input) input.classList.remove('input-error');
        }

        const curPass = document.getElementById('currentPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confPass = document.getElementById('confirmNewPassword').value;

        if (!curPass) {
          showPassErr('currentPassword', 'currentPasswordError', 'Current password is required.');
        } else {
          clearPassErr('currentPassword', 'currentPasswordError');
        }

        if (!newPass) {
          showPassErr('newPassword', 'newPasswordError', 'New password is required.');
        } else if (newPass.length < 8) {
          showPassErr('newPassword', 'newPasswordError', 'New password must be at least 8 characters long.');
        } else {
          clearPassErr('newPassword', 'newPasswordError');
        }

        if (!confPass) {
          showPassErr('confirmNewPassword', 'confirmNewPasswordError', 'Please confirm your new password.');
        } else if (confPass !== newPass) {
          showPassErr('confirmNewPassword', 'confirmNewPasswordError', 'Passwords do not match. Please verify.');
        } else {
          clearPassErr('confirmNewPassword', 'confirmNewPasswordError');
        }

        if (hasPassErr) return;

        if (submitPassBtn) {
          submitPassBtn.disabled = true;
          submitPassBtn.textContent = 'Updating Password...';
        }

        const res = await CustomerAuth.changePassword({
          currentPassword: curPass,
          newPassword: newPass,
          confirmPassword: confPass
        });

        if (submitPassBtn) {
          submitPassBtn.disabled = false;
          submitPassBtn.textContent = 'Update Password \u2192';
        }

        // CRITICAL SECURITY RULE: Clear password fields immediately from DOM and memory
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';

        if (res.success) {
          if (passwordAlert) {
            passwordAlert.className = 'alert alert-success is-visible';
            passwordAlert.textContent = res.message || 'Password updated successfully.';
            passwordAlert.style.display = 'block';
          }
        } else {
          if (passwordAlert) {
            passwordAlert.className = 'alert alert-error is-visible';
            passwordAlert.innerHTML = `<strong>Security Notice:</strong> ${res.error}`;
            passwordAlert.style.display = 'block';
          }
        }
      });
    }
  }

  /**
   * Setup logic for customer-dashboard.html (Final Customer Frontend Module).
   */
  async function setupCustomerDashboardPage() {
    const container = document.getElementById('customerDashboardContainer');
    if (!container) return;

    // 1. Session & Profile
    const profile = CustomerAuth.getProfile();
    function getInitials(name) {
      if (!name || typeof name !== 'string') return 'YO';
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    const initials = getInitials(profile.name);

    // 2. Bookings & Wishlist Data
    const bookings = BookingService.getBookings();
    const stats = BookingService.getBookingStats(bookings);
    const wishlistIds = WishlistService.getWishlist();
    const wishlistCount = wishlistIds.length;

    // 3. Nearest Eligible Upcoming Trip (excluding cancelled bookings)
    const todayStr = new Date().toISOString().split('T')[0];
    const eligibleUpcoming = bookings.filter(b => {
      return b.bookingStatus !== 'Cancelled' && (b.bookingStatus === 'Upcoming' || (b.bookingStatus === 'Confirmed' && (!b.travelDate || b.travelDate >= todayStr)));
    });

    eligibleUpcoming.sort((a, b) => (a.travelDate || '') > (b.travelDate || '') ? 1 : -1);
    const nearestTrip = eligibleUpcoming[0] || null;

    // 4. Latest 3 Bookings
    const recentBookings = bookings.slice(0, 3);

    // 5. Wishlist Preview (up to 4 packages)
    const wishlistPackages = PACKAGES_DATA.filter(pkg => {
      return wishlistIds.includes(String(pkg.id)) || wishlistIds.includes(Number(pkg.id));
    }).slice(0, 4);

    // 6. Recommended Destinations (up to 4)
    const recommendedDests = (DESTINATIONS_DATA || []).slice(0, 4);

    // Render Dashboard
    container.innerHTML = `
      <div style="padding: 30px 0 60px 0;">
        <div class="container">
          
          <!-- Breadcrumb Trail -->
          <nav class="breadcrumb-trail" aria-label="Breadcrumb" style="margin-bottom: var(--space-lg);">
            <a href="../index.html">Home</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">Customer Dashboard</span>
          </nav>

          <!-- 1. Welcome Section -->
          <section class="dashboard-welcome-banner">
            <div class="welcome-user-info">
              <div class="welcome-avatar-circle">${initials}</div>
              <div>
                <h1 class="welcome-title">Vanakkam, ${profile.name}!</h1>
                <p class="welcome-subtitle">
                  "யாதும் ஊரே யாவரும் கேளிர்" &bull; Welcome to your Tamil Nadu travel command centre.
                </p>
              </div>
            </div>
            <div>
              <a href="packages.html" class="btn btn-gold btn-md" style="font-weight: 700;">
                + Explore Packages
              </a>
            </div>
          </section>

          <!-- 2. Statistics Grid (4 Dynamically Calculated Cards) -->
          <section class="bookings-kpi-grid" style="margin-bottom: var(--space-2xl);">
            <div class="kpi-card kpi-total">
              <div class="kpi-info">
                <span class="kpi-value">${stats.total}</span>
                <span class="kpi-label">Total Bookings</span>
              </div>
              <div class="kpi-icon">&#128197;</div>
            </div>

            <div class="kpi-card kpi-upcoming">
              <div class="kpi-info">
                <span class="kpi-value">${stats.upcoming}</span>
                <span class="kpi-label">Upcoming Trips</span>
              </div>
              <div class="kpi-icon">&#9992;</div>
            </div>

            <div class="kpi-card kpi-completed">
              <div class="kpi-info">
                <span class="kpi-value">${stats.completed}</span>
                <span class="kpi-label">Completed Trips</span>
              </div>
              <div class="kpi-icon">&#10003;</div>
            </div>

            <div class="kpi-card" style="border-left: 4px solid var(--color-terracotta);">
              <div class="kpi-info">
                <span class="kpi-value">${wishlistCount}</span>
                <span class="kpi-label">Wishlist Saved</span>
              </div>
              <div class="kpi-icon" style="color: var(--color-terracotta);">&hearts;</div>
            </div>
          </section>

          <!-- 7. Quick Actions -->
          <section style="margin-bottom: var(--space-2xl);">
            <div class="dashboard-section-head">
              <h2 class="dashboard-section-title">Quick Actions</h2>
            </div>
            <div class="dashboard-quick-actions-grid">
              <a href="destinations.html" class="quick-action-card">
                <span class="quick-action-icon">&#127963;</span>
                <span class="quick-action-label">Explore Destinations</span>
              </a>
              <a href="packages.html" class="quick-action-card">
                <span class="quick-action-icon">&#127957;</span>
                <span class="quick-action-label">Browse Packages</span>
              </a>
              <a href="search-packages.html" class="quick-action-card">
                <span class="quick-action-icon">&#128269;</span>
                <span class="quick-action-label">Search Packages</span>
              </a>
              <a href="compare.html" class="quick-action-card">
                <span class="quick-action-icon">&#9878;</span>
                <span class="quick-action-label">Compare Packages</span>
              </a>
              <a href="my-bookings.html" class="quick-action-card">
                <span class="quick-action-icon">&#128197;</span>
                <span class="quick-action-label">My Bookings</span>
              </a>
              <a href="wishlist.html" class="quick-action-card">
                <span class="quick-action-icon">&hearts;</span>
                <span class="quick-action-label">Wishlist</span>
              </a>
              <a href="profile.html" class="quick-action-card">
                <span class="quick-action-icon">&#128100;</span>
                <span class="quick-action-label">My Profile</span>
              </a>
            </div>
          </section>

          <!-- 3. Upcoming Trip Section -->
          <section style="margin-bottom: var(--space-2xl);">
            <div class="dashboard-section-head">
              <h2 class="dashboard-section-title">Next Upcoming Departure</h2>
              ${nearestTrip ? '<a href="my-bookings.html" class="btn btn-secondary btn-sm">All Bookings &rarr;</a>' : ''}
            </div>

            ${nearestTrip ? `
              <div class="spotlight-trip-card">
                <div class="spotlight-media">
                  <img src="${nearestTrip.packageImage || 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80'}" alt="${nearestTrip.packageTitle}" onerror="this.src='https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80'">
                </div>
                <div class="spotlight-content">
                  <div>
                    <span class="spotlight-tag">&#9992; Upcoming Departure</span>
                    <h3 class="spotlight-title">
                      <a href="package-details.html?id=${nearestTrip.packageId}">${nearestTrip.packageTitle}</a>
                    </h3>
                    <div class="spotlight-meta-row">
                      <span>&#128205; Destination: <strong>${nearestTrip.destination}</strong></span>
                      <span>&#128197; Date: <strong>${nearestTrip.travelDate}</strong></span>
                      <span>&#128101; Travellers: <strong>${nearestTrip.travellerCount}</strong></span>
                      <span>&#128278; Ref: <strong style="font-family: monospace; color: var(--color-terracotta);">${nearestTrip.referenceNumber}</strong></span>
                    </div>
                  </div>
                  <div class="d-flex align-center justify-between" style="flex-wrap: wrap; gap: 12px; border-top: 1px solid var(--color-border); padding-top: var(--space-md); margin-top: var(--space-md);">
                    <div>
                      <span style="font-size: 0.8rem; color: var(--color-text-light); text-transform: uppercase;">Amount Paid</span>
                      <div style="font-size: 1.25rem; font-weight: 800; color: var(--color-primary-dark);">&#8377;${(nearestTrip.grandTotal || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div class="d-flex gap-md">
                      <a href="package-details.html?id=${nearestTrip.packageId}" class="btn btn-secondary btn-sm">View Tour Details</a>
                      <a href="my-bookings.html" class="btn btn-primary btn-sm">Manage Reservation &rarr;</a>
                    </div>
                  </div>
                </div>
              </div>
            ` : `
              <div class="empty-state" style="padding: 30px; margin-bottom: var(--space-2xl);">
                <div class="empty-state-icon">&#9992;</div>
                <h3 class="empty-state-title" style="font-size: 1.2rem;">No Upcoming Departures</h3>
                <p class="empty-state-desc" style="max-width: 500px; margin: 0 auto 16px auto;">
                  You do not have any active upcoming tour departures. Explore our handcrafted destinations across Tamil Nadu to reserve your next trip.
                </p>
                <a href="packages.html" class="btn btn-primary btn-sm">Discover Packages &rarr;</a>
              </div>
            `}
          </section>

          <!-- 4. Recent Bookings (Latest 3) -->
          <section style="margin-bottom: var(--space-2xl);">
            <div class="dashboard-section-head">
              <h2 class="dashboard-section-title">Recent Reservations</h2>
              <a href="my-bookings.html" class="btn btn-secondary btn-sm">View All Bookings &rarr;</a>
            </div>

            ${recentBookings.length > 0 ? `
              <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow-x: auto; box-shadow: var(--shadow-xs);">
                <table class="booking-summary-table" style="margin: 0; min-width: 600px;">
                  <thead>
                    <tr style="background: var(--color-bg-warm); border-bottom: 2px solid var(--color-border);">
                      <th style="padding: 12px 16px; text-align: left; font-size: 0.82rem; text-transform: uppercase; color: var(--color-text-light);">Reference</th>
                      <th style="padding: 12px 16px; text-align: left; font-size: 0.82rem; text-transform: uppercase; color: var(--color-text-light);">Package Title</th>
                      <th style="padding: 12px 16px; text-align: left; font-size: 0.82rem; text-transform: uppercase; color: var(--color-text-light);">Departure Date</th>
                      <th style="padding: 12px 16px; text-align: left; font-size: 0.82rem; text-transform: uppercase; color: var(--color-text-light);">Status</th>
                      <th style="padding: 12px 16px; text-align: right; font-size: 0.82rem; text-transform: uppercase; color: var(--color-text-light);">Total Amount</th>
                      <th style="padding: 12px 16px; text-align: center; font-size: 0.82rem; text-transform: uppercase; color: var(--color-text-light);">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recentBookings.map(b => {
                      const isCancelled = b.bookingStatus === 'Cancelled';
                      const isCompleted = b.bookingStatus === 'Completed' || (b.travelDate && b.travelDate < todayStr);
                      const badgeClass = isCancelled ? 'badge-warning' : (isCompleted ? 'badge-primary' : 'badge-success');
                      const statusText = isCancelled ? 'Cancelled' : (isCompleted ? 'Completed' : 'Upcoming');

                      return `
                        <tr>
                          <td style="font-family: monospace; font-weight: 700; color: var(--color-terracotta);">${b.referenceNumber}</td>
                          <td>
                            <strong><a href="package-details.html?id=${b.packageId}">${b.packageTitle}</a></strong>
                            <div style="font-size: 0.8rem; color: var(--color-text-muted);">&#128205; ${b.destination}</div>
                          </td>
                          <td>${b.travelDate}</td>
                          <td><span class="badge ${badgeClass}">${statusText}</span></td>
                          <td style="text-align: right; font-weight: 800; color: var(--color-primary-dark);">&#8377;${(b.grandTotal || 0).toLocaleString('en-IN')}</td>
                          <td style="text-align: center;">
                            <a href="my-bookings.html" class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 0.8rem;">Details</a>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div class="empty-state" style="padding: 24px;">
                <p class="empty-state-desc" style="margin: 0;">No reservations on file yet. Book your first local tour package!</p>
              </div>
            `}
          </section>

          <!-- 5. Wishlist Preview (up to 4 packages) -->
          <section style="margin-bottom: var(--space-2xl);">
            <div class="dashboard-section-head">
              <h2 class="dashboard-section-title">Saved in Wishlist</h2>
              <a href="wishlist.html" class="btn btn-secondary btn-sm">View Full Wishlist &rarr;</a>
            </div>

            ${wishlistPackages.length > 0 ? `
              <div class="grid-4">
                ${wishlistPackages.map(pkg => `
                  <article class="package-card" style="box-shadow: var(--shadow-sm);">
                    <div class="package-media" style="height: 150px;">
                      <img src="${pkg.image}" alt="${pkg.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80'">
                      <span class="package-tag">${pkg.categoryName}</span>
                    </div>
                    <div class="package-body" style="padding: 14px;">
                      <h4 class="package-title" style="font-size: 0.95rem; margin-bottom: 4px;">
                        <a href="package-details.html?id=${pkg.id}">${pkg.title}</a>
                      </h4>
                      <div class="package-meta" style="margin-bottom: 8px;">
                        <span class="package-meta-item">&#128205; ${pkg.destination}</span>
                        <span class="package-meta-item">&#128197; ${pkg.duration}</span>
                      </div>
                      <div class="d-flex align-center justify-between" style="border-top: 1px solid var(--color-border); padding-top: 8px; margin-top: 8px;">
                        <span style="font-weight: 800; color: var(--color-primary-dark);">&#8377;${pkg.price.toLocaleString('en-IN')}</span>
                        <a href="package-details.html?id=${pkg.id}" class="btn btn-secondary btn-sm" style="padding: 3px 8px; font-size: 0.78rem;">Details &rarr;</a>
                      </div>
                    </div>
                  </article>
                `).join('')}
              </div>
            ` : `
              <div class="empty-state" style="padding: 24px;">
                <p class="empty-state-desc" style="margin: 0 0 12px 0;">You have not saved any packages to your wishlist yet.</p>
                <a href="packages.html" class="btn btn-primary btn-sm">Explore Tour Packages &rarr;</a>
              </div>
            `}
          </section>

          <!-- 6. Recommended Destinations (up to 4) -->
          <section>
            <div class="dashboard-section-head">
              <h2 class="dashboard-section-title">Recommended Destinations</h2>
              <a href="destinations.html" class="btn btn-secondary btn-sm">All Destinations &rarr;</a>
            </div>

            <div class="grid-4">
              ${recommendedDests.map(d => `
                <article class="destination-card">
                  <div class="destination-media" style="height: 140px;">
                    <img src="${d.image}" alt="${d.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80'">
                    <span class="destination-badge">${d.category}</span>
                  </div>
                  <div class="destination-body" style="padding: 14px;">
                    <div style="font-size: 0.75rem; color: var(--color-gold-dark); font-weight: 700; font-family: var(--font-serif);">${d.tamilName || ''}</div>
                    <h3 class="destination-name" style="font-size: 1.05rem; margin-bottom: 4px;">${d.name}</h3>
                    <p style="font-size: 0.8rem; color: var(--color-text-muted); line-height: 1.4; margin-bottom: 10px;">${d.description.length > 70 ? d.description.substring(0, 70) + '...' : d.description}</p>
                    <a href="packages.html?dest=${encodeURIComponent(d.name)}" class="btn btn-secondary btn-sm" style="width: 100%; text-align: center;">View Packages</a>
                  </div>
                </article>
              `).join('')}
            </div>
          </section>

        </div>
      </div>
    `;
  }

  // Export public API
  return {
    apiClient,
    FormValidator,
    CustomerAuth,
    DestinationService,
    PackageService,
    WishlistService,
    CompareService,
    BookingService,
    DESTINATIONS_DATA,
    PACKAGES_DATA,
    CONFIG
  };
});

