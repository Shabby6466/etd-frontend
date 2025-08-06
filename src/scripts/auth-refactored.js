// Refactored Authentication Module
import AuthenticationManager from './authentication-manager.js';

// Initialize authentication manager
let authManager = null;

/**
 * Initialize authentication system
 */
async function initAuth() {
    if (!authManager) {
        authManager = await AuthenticationManager.initialize();
    }
    return authManager;
}

/**
 * Login function - simplified and clean
 */
export async function login(username, password, role = 'fm') {
    try {
        await initAuth();
        
        const result = await authManager.login({
            username: username.trim(),
            password: password.trim(),
            role: role.toLowerCase()
        });

        if (result.success) {
            console.log(`✅ Login successful for ${username} with role ${role}`);
            return result;
        } else {
            console.error(`❌ Login failed: ${result.error}`);
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Logout function
 */
export async function logout() {
    try {
        await initAuth();
        await authManager.logout();
        console.log('✅ Logout successful');
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if API call fails
        authManager?.clearAuthData();
        authManager?.navigateToLogin();
    }
}

/**
 * Get authentication token
 */
export function getToken() {
    if (authManager) {
        return authManager.getAuthState().token;
    }
    // Fallback to localStorage
    return localStorage.getItem('token');
}

/**
 * Check if user is logged in
 */
export function isLoggedIn() {
    if (authManager) {
        return authManager.isAuthenticated();
    }
    // Fallback check
    return !!localStorage.getItem('token');
}

/**
 * Get current user
 */
export function getCurrentUser() {
    if (authManager) {
        return authManager.getCurrentUser();
    }
    // Fallback to localStorage
    return localStorage.getItem('etd_user');
}

/**
 * Get current user role
 */
export function getUserRole() {
    if (authManager) {
        return authManager.getCurrentRole();
    }
    // Fallback to localStorage
    return localStorage.getItem('etd_user_role') || 'fm';
}

/**
 * Get user permissions
 */
export function getUserPermissions() {
    if (authManager) {
        return authManager.getPermissions();
    }
    // Fallback to localStorage
    const permissions = localStorage.getItem('etd_user_permissions');
    return permissions ? JSON.parse(permissions) : [];
}

/**
 * Check if user has specific permission
 */
export function hasPermission(permission) {
    if (authManager) {
        return authManager.hasPermission(permission);
    }
    // Fallback check
    const permissions = getUserPermissions();
    return permissions.includes('*') || permissions.includes(permission);
}

/**
 * Get user's dashboard URL
 */
export function getUserDashboardUrl() {
    if (authManager) {
        return authManager.getDashboardUrl();
    }
    // Fallback to localStorage
    return localStorage.getItem('etd_dashboard_url') || '/src/pages/dashboards/FMdashboard.html';
}

/**
 * Refresh authentication token
 */
export async function refreshToken() {
    try {
        await initAuth();
        return await authManager.refreshToken();
    } catch (error) {
        console.error('Token refresh error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Make authenticated API requests
 */
export async function authFetch(url, options = {}) {
    try {
        await initAuth();
        return await authManager.authFetch(url, options);
    } catch (error) {
        console.error('Authenticated fetch error:', error);
        
        // Fallback to manual token addition
        const token = getToken();
        if (token) {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            };
            
            return fetch(url, {
                ...options,
                headers
            });
        }
        
        throw error;
    }
}

/**
 * Get authentication state
 */
export function getAuthState() {
    if (authManager) {
        return authManager.getAuthState();
    }
    
    // Fallback state construction
    return {
        isAuthenticated: isLoggedIn(),
        user: getCurrentUser(),
        token: getToken(),
        role: getUserRole(),
        permissions: getUserPermissions(),
        dashboardUrl: getUserDashboardUrl()
    };
}

/**
 * Validate authentication and redirect if needed
 */
export async function validateAuth(currentPage = null) {
    try {
        await initAuth();
        
        if (!authManager.isAuthenticated()) {
            // Not authenticated - redirect to login
            if (currentPage && !['login.html', 'index.html'].includes(currentPage)) {
                if (window.etdRouter) {
                    window.etdRouter.navigateTo('login.html');
                } else {
                    window.location.href = '/src/pages/auth/login.html';
                }
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Auth validation error:', error);
        return false;
    }
}

/**
 * Handle authentication errors globally
 */
export function handleAuthError(error) {
    console.error('Authentication error:', error);
    
    if (error.message?.includes('token') || error.message?.includes('401')) {
        // Token-related errors - logout and redirect
        logout();
    } else {
        // Other auth errors - show notification
        if (authManager) {
            authManager.showNotification(`Authentication error: ${error.message}`, 'error');
        } else {
            alert(`Authentication error: ${error.message}`);
        }
    }
}

/**
 * Auto-initialize authentication on module load
 */
if (typeof window !== 'undefined') {
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
}

// Export authentication manager for advanced usage
export { authManager };

// Legacy support - expose functions globally for backward compatibility
if (typeof window !== 'undefined') {
    window.auth = {
        login,
        logout,
        getToken,
        isLoggedIn,
        getCurrentUser,
        getUserRole,
        getUserPermissions,
        hasPermission,
        getUserDashboardUrl,
        refreshToken,
        authFetch,
        getAuthState,
        validateAuth,
        handleAuthError
    };
}