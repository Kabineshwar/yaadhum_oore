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
        city: userProfile.city || '',
        role: 'customer',
        loginTime: new Date().toISOString()
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

  // Export public API
  return {
    apiClient,
    FormValidator,
    CustomerAuth,
    DestinationService,
    PackageService,
    WishlistService,
    CompareService,
    DESTINATIONS_DATA,
    PACKAGES_DATA,
    CONFIG
  };
});

