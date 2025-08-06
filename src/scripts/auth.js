// auth.js

const API_URL = "http://localhost:3837/v1/api";

/**
 * Handles user login with username and password.
 * Saves the token to localStorage on success.
 */
export async function login(username, password, locationId = 'fm') {
  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  console.log("Attempting login with:", { username, password, locationId });

  try {
    // Try to import backend service dynamically
    let backendService = null;
    try {
      const module = await import('./backend-api-service.js');
      backendService = module.default;
    } catch (importError) {
      console.warn('Backend API service not available, using fallback');
    }

    let result;
    
    if (backendService) {
      // Use new backend API service
      result = await backendService.login(username, password, locationId);
      
      if (result.success) {
        // Store authentication data
        localStorage.setItem("token", result.token);
        localStorage.setItem('etd_user', result.user.username);
        localStorage.setItem('etd_user_role', result.user.role);
        localStorage.setItem('etd_user_permissions', JSON.stringify(result.user.permissions));
        localStorage.setItem('etd_dashboard_url', result.user.dashboardUrl);
        
        // Navigate to appropriate dashboard based on user role
        const dashboardFile = result.user.dashboardUrl.split('/').pop();
        if (window.etdRouter) {
          window.etdRouter.navigateTo(dashboardFile);
        } else {
          window.location.href = result.user.dashboardUrl;
        }
        
        // Show success message with role info
        showLoginNotification(`Welcome! Redirecting to ${result.user.role.toUpperCase()} dashboard...`, 'success');
        
        return result;
      } else {
        throw new Error(result.error);
      }
    } else {
      // Fallback to direct API call
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, locationId, password }),
      });

      const data = await response.json();
      console.log("API response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem('etd_user', username.toLowerCase());
      localStorage.setItem('etd_user_role', data.role || locationId);
      localStorage.setItem('etd_user_permissions', JSON.stringify(data.permissions || []));
      
      // Determine dashboard based on role
      const userRole = data.role || locationId;
      const dashboardUrl = getDashboardForRole(userRole);
      const dashboardFile = dashboardUrl.split('/').pop();
      
      localStorage.setItem('etd_dashboard_url', dashboardUrl);
      
      // Navigate to appropriate dashboard
      if (window.etdRouter) {
        window.etdRouter.navigateTo(dashboardFile);
      } else {
        window.location.href = dashboardUrl;
      }
      
      showLoginNotification(`Welcome! Redirecting to ${userRole.toUpperCase()} dashboard...`, 'success');
      
      return { success: true, data: data, token: data.token };
    }
  } catch (error) {
    console.error("Login error:", error);
    alert(`Login failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Logs the user out by clearing the token and redirecting to login.
 */
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("etd_user");
  localStorage.removeItem("etd_user_role");
  
  if (window.etdRouter) {
    window.etdRouter.navigateTo('login.html');
  } else {
    window.location.href = "/src/pages/auth/login.html";
  }
}

/**
 * Gets the saved auth token from localStorage.
 */
export function getToken() {
  return localStorage.getItem("token");
}

/**
 * Checks if the user is currently logged in.
 */
export function isLoggedIn() {
  return !!getToken();
}

/**
 * Adds Authorization header to a fetch request.
 */
export function authFetch(url, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Get dashboard URL based on user role
 */
function getDashboardForRole(role) {
  const roleMapping = {
    'fm': '/src/pages/dashboards/FMdashboard.html',
    'foreign_ministry': '/src/pages/dashboards/FMdashboard.html',
    'hq': '/src/pages/dashboards/HQdashboard.html',
    'headquarters': '/src/pages/dashboards/HQdashboard.html',
    'agency': '/src/pages/dashboards/AgencyDashboard.html',
    'processing_agency': '/src/pages/dashboards/AgencyDashboard.html',
    'admin': '/src/pages/dashboards/HQdashboard.html',
    'super_admin': '/src/pages/dashboards/HQdashboard.html'
  };

  return roleMapping[role.toLowerCase()] || '/src/pages/dashboards/FMdashboard.html';
}

/**
 * Get current user role
 */
export function getUserRole() {
  return localStorage.getItem('etd_user_role') || 'fm';
}

/**
 * Get current user permissions
 */
export function getUserPermissions() {
  const permissions = localStorage.getItem('etd_user_permissions');
  return permissions ? JSON.parse(permissions) : [];
}

/**
 * Check if user has specific permission
 */
export function hasPermission(permission) {
  const permissions = getUserPermissions();
  return permissions.includes('*') || permissions.includes(permission);
}

/**
 * Get user's dashboard URL
 */
export function getUserDashboardUrl() {
  return localStorage.getItem('etd_dashboard_url') || '/src/pages/dashboards/FMdashboard.html';
}

/**
 * Show login notification
 */
function showLoginNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `login-notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    color: white;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    z-index: 10000;
    max-width: 400px;
    word-wrap: break-word;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;

  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };

  notification.style.backgroundColor = colors[type] || colors.info;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 100);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}