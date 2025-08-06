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
      alert(data.message || "Login failed");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem('etd_user', username.toLowerCase());
    localStorage.setItem('etd_user_role', 'fm');
    
    // Always navigate to FM dashboard
    if (window.etdRouter) {
      window.etdRouter.navigateTo('FMdashboard.html');
    } else {
      // Fallback navigation without router
      window.location.href = '/src/pages/dashboards/FMdashboard.html';
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("An error occurred while logging in.");
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