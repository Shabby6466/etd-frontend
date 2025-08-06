// Centralized Authentication Manager
class AuthenticationManager {
    constructor() {
        this.config = this.getConfig();
        this.isInitialized = false;
        this.currentUser = null;
        this.authState = {
            isAuthenticated: false,
            user: null,
            token: null,
            role: null,
            permissions: [],
            dashboardUrl: null
        };
    }

    // Configuration
    getConfig() {
        return {
            apiUrl: window.location.hostname === 'localhost' 
                ? 'http://localhost:3837/v1/api' 
                : '/api/v1',
            endpoints: {
                login: '/auth/login',
                logout: '/auth/logout',
                refresh: '/auth/refresh',
                me: '/auth/me'
            },
            storage: {
                token: 'token',
                user: 'etd_user',
                role: 'etd_user_role',
                permissions: 'etd_user_permissions',
                dashboardUrl: 'etd_dashboard_url'
            },
            roleMapping: {
                'fm': {
                    name: 'Foreign Ministry',
                    dashboard: '/src/pages/dashboards/FMdashboard.html',
                    permissions: ['view_dashboard', 'create_form', 'view_etd_data', 'print_token']
                },
                'hq': {
                    name: 'Headquarters',
                    dashboard: '/src/pages/dashboards/HQdashboard.html',
                    permissions: ['view_dashboard', 'view_details', 'send_verification', 'approve_applications']
                },
                'agency': {
                    name: 'Processing Agency',
                    dashboard: '/src/pages/dashboards/AgencyDashboard.html',
                    permissions: ['view_dashboard', 'verify_documents', 'upload_files', 'process_applications']
                },
                'admin': {
                    name: 'Administrator',
                    dashboard: '/src/pages/dashboards/HQdashboard.html',
                    permissions: ['view_dashboard', 'manage_users', 'view_all_applications', 'system_config']
                },
                'super_admin': {
                    name: 'Super Administrator',
                    dashboard: '/src/pages/dashboards/HQdashboard.html',
                    permissions: ['*']
                }
            }
        };
    }

    // Initialize the authentication manager
    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.loadStoredAuth();
            this.isInitialized = true;
            console.log('AuthenticationManager initialized');
        } catch (error) {
            console.warn('Failed to initialize AuthenticationManager:', error);
        }
    }

    // Load stored authentication data
    async loadStoredAuth() {
        const token = localStorage.getItem(this.config.storage.token);
        const user = localStorage.getItem(this.config.storage.user);
        const role = localStorage.getItem(this.config.storage.role);
        const permissions = localStorage.getItem(this.config.storage.permissions);
        const dashboardUrl = localStorage.getItem(this.config.storage.dashboardUrl);

        if (token && user) {
            this.authState = {
                isAuthenticated: true,
                user: user,
                token: token,
                role: role || 'fm',
                permissions: permissions ? JSON.parse(permissions) : [],
                dashboardUrl: dashboardUrl || this.config.roleMapping['fm'].dashboard
            };
        }
    }

    // Login method
    async login(credentials) {
        try {
            this.validateCredentials(credentials);
            
            const loginData = await this.performLogin(credentials);
            
            if (loginData.success) {
                await this.processSuccessfulLogin(loginData);
                return this.createLoginResponse(true, loginData);
            } else {
                return this.createLoginResponse(false, null, loginData.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            return this.createLoginResponse(false, null, error.message);
        }
    }

    // Validate login credentials
    validateCredentials({ username, password, role }) {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        if (!role || !this.config.roleMapping[role]) {
            throw new Error('Valid role selection is required');
        }
    }

    // Perform the actual login API call
    async performLogin({ username, password, role }) {
        try {
            // Import API client dynamically to avoid circular dependencies
            const { authApi } = await import('./api-client.js');
            
            const requestPayload = {
                username,
                password,
                locationId: role,
                role: role
            };

            const result = await authApi.login(requestPayload);

            if (result.success) {
                return {
                    success: true,
                    data: result.data,
                    token: result.data.token,
                    apiRole: result.data.role || role
                };
            } else {
                return {
                    success: false,
                    error: result.error
                };
            }
        } catch (error) {
            console.error('API call failed:', error);
            
            // Fallback to role-based simulation for development
            if (this.config.apiUrl.includes('localhost')) {
                return this.simulateLogin(username, password, role);
            }
            
            throw new Error('Authentication service unavailable');
        }
    }

    // Simulate login for development/testing
    simulateLogin(username, password, role) {
        console.warn('Using simulated login - for development only');
        
        // Simple validation
        if (username && password) {
            return {
                success: true,
                data: {
                    user_id: 'sim_' + Date.now(),
                    username: username,
                    role: role,
                    permissions: this.config.roleMapping[role]?.permissions || []
                },
                token: 'sim_token_' + Date.now(),
                apiRole: role
            };
        }
        
        return {
            success: false,
            error: 'Invalid credentials'
        };
    }

    // Process successful login
    async processSuccessfulLogin(loginData) {
        const role = loginData.apiRole;
        const roleConfig = this.config.roleMapping[role];
        
        if (!roleConfig) {
            throw new Error(`Unknown role: ${role}`);
        }

        // Update auth state
        this.authState = {
            isAuthenticated: true,
            user: loginData.data.username || loginData.data.user?.username,
            token: loginData.token,
            role: role,
            permissions: loginData.data.permissions || roleConfig.permissions,
            dashboardUrl: roleConfig.dashboard
        };

        // Store in localStorage
        this.storeAuthData();

        // Navigate to appropriate dashboard
        await this.navigateToDashboard();
    }

    // Store authentication data
    storeAuthData() {
        const { storage } = this.config;
        
        localStorage.setItem(storage.token, this.authState.token);
        localStorage.setItem(storage.user, this.authState.user);
        localStorage.setItem(storage.role, this.authState.role);
        localStorage.setItem(storage.permissions, JSON.stringify(this.authState.permissions));
        localStorage.setItem(storage.dashboardUrl, this.authState.dashboardUrl);
    }

    // Navigate to dashboard
    async navigateToDashboard() {
        const dashboardFile = this.authState.dashboardUrl.split('/').pop();
        
        // Show success notification
        this.showNotification(
            `Welcome! Redirecting to ${this.config.roleMapping[this.authState.role].name} dashboard...`, 
            'success'
        );

        // Navigate
        setTimeout(() => {
            if (window.etdRouter) {
                window.etdRouter.navigateTo(dashboardFile);
            } else {
                window.location.href = this.authState.dashboardUrl;
            }
        }, 1000);
    }

    // Create standardized login response
    createLoginResponse(success, data = null, error = null) {
        return {
            success,
            data: success ? {
                user: this.authState.user,
                role: this.authState.role,
                permissions: this.authState.permissions,
                dashboardUrl: this.authState.dashboardUrl,
                token: this.authState.token
            } : null,
            error,
            timestamp: new Date().toISOString()
        };
    }

    // Logout method
    async logout() {
        try {
            // Call logout API if possible
            if (this.authState.isAuthenticated && this.authState.token) {
                await this.performLogout();
            }
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            // Always clear local data
            this.clearAuthData();
            this.navigateToLogin();
        }
    }

    // Perform logout API call
    async performLogout() {
        try {
            const { authApi } = await import('./api-client.js');
            await authApi.logout();
        } catch (error) {
            // Logout API failure is not critical
            console.warn('Logout API call failed:', error);
        }
    }

    // Clear authentication data
    clearAuthData() {
        const { storage } = this.config;
        
        // Clear localStorage
        Object.values(storage).forEach(key => {
            localStorage.removeItem(key);
        });

        // Reset auth state
        this.authState = {
            isAuthenticated: false,
            user: null,
            token: null,
            role: null,
            permissions: [],
            dashboardUrl: null
        };
    }

    // Navigate to login page
    navigateToLogin() {
        this.showNotification('You have been logged out', 'info');
        
        setTimeout(() => {
            if (window.etdRouter) {
                window.etdRouter.navigateTo('login.html');
            } else {
                window.location.href = '/src/pages/auth/login.html';
            }
        }, 500);
    }

    // Refresh token
    async refreshToken() {
        if (!this.authState.token) {
            throw new Error('No token to refresh');
        }

        try {
            const { authApi } = await import('./api-client.js');
            const result = await authApi.refreshToken();

            if (result.success && result.data.token) {
                this.authState.token = result.data.token;
                localStorage.setItem(this.config.storage.token, result.data.token);
                return { success: true, token: result.data.token };
            } else {
                throw new Error(result.error || 'Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            await this.logout(); // Force logout on refresh failure
            return { success: false, error: error.message };
        }
    }

    // Get current authentication state
    getAuthState() {
        return { ...this.authState };
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.authState.isAuthenticated && !!this.authState.token;
    }

    // Get current user
    getCurrentUser() {
        return this.authState.user;
    }

    // Get current role
    getCurrentRole() {
        return this.authState.role;
    }

    // Get current permissions
    getPermissions() {
        return [...this.authState.permissions];
    }

    // Check if user has permission
    hasPermission(permission) {
        return this.authState.permissions.includes('*') || 
               this.authState.permissions.includes(permission);
    }

    // Get dashboard URL
    getDashboardUrl() {
        return this.authState.dashboardUrl;
    }

    // Make authenticated requests
    async authFetch(url, options = {}) {
        if (!this.authState.token) {
            throw new Error('No authentication token available');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authState.token}`,
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        // Handle token expiration
        if (response.status === 401) {
            const refreshResult = await this.refreshToken();
            if (refreshResult.success) {
                // Retry with new token
                headers.Authorization = `Bearer ${this.authState.token}`;
                return fetch(url, { ...options, headers });
            }
        }

        return response;
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `auth-notification notification-${type}`;
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
        }, 4000);
    }

    // Initialize on page load
    static async initialize() {
        if (!window.authManager) {
            window.authManager = new AuthenticationManager();
            await window.authManager.init();
        }
        return window.authManager;
    }
}

// Auto-initialize
if (typeof window !== 'undefined') {
    AuthenticationManager.initialize();
}

export default AuthenticationManager;
export { AuthenticationManager };