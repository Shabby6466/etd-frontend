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
        localStorage.setItem("token", result.token);
        localStorage.setItem('etd_user', username.toLowerCase());
        localStorage.setItem('etd_user_role', locationId);
        
        // Always navigate to FM dashboard
        if (window.etdRouter) {
          window.etdRouter.navigateTo('FMdashboard.html');
        } else {
          window.location.href = '/src/pages/dashboards/FMdashboard.html';
        }
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
      localStorage.setItem('etd_user_role', locationId);
      
      // Always navigate to FM dashboard
      if (window.etdRouter) {
        window.etdRouter.navigateTo('FMdashboard.html');
      } else {
        window.location.href = '/src/pages/dashboards/FMdashboard.html';
      }
      
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