class AuthService {
    constructor() {
        this.apiService = window.backendApiService || new BackendApiService();
        this.currentUser = null;
        this.authCallbacks = [];
        
        this.initializeAuth();
    }

    initializeAuth() {
        const token = this.apiService.getAuthToken();
        if (token) {
            this.currentUser = this.apiService.getCurrentUser();
            this.notifyAuthChange();
        }
    }

    async login(email, password) {
        try {
            const response = await this.apiService.login(email, password);
            console.log(response,"responseresponse")
            if (response.user) {
                this.currentUser = response.user;
                this.notifyAuthChange();
                return { success: true, user: response.user };
            }
            
            return { success: false, message: 'Invalid response from server' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message || 'Login failed' };
        }
    }

    async logout() {
        try {
            this.apiService.logout();
            this.currentUser = null;
            this.notifyAuthChange();
            
            window.location.href = '/src/pages/auth/login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    isAuthenticated() {
        return this.apiService.isAuthenticated() && this.currentUser;
    }

    getCurrentUser() {
        const user = localStorage.getItem("user");
        return JSON.parse(user);
    }

    getUserRole() {
        return this.currentUser?.role;
    }

    hasPermission(requiredRole) {
        if (!this.currentUser) return false;
        
        const roleHierarchy = {
            'ADMIN': 4,
            'MINISTRY': 3,
            'AGENCY': 2,
            'MISSION_OPERATOR': 1
        };
        
        const userLevel = roleHierarchy[this.currentUser.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;
        
        return userLevel >= requiredLevel;
    }

    onAuthChange(callback) {
        this.authCallbacks.push(callback);
    }

    notifyAuthChange() {
        this.authCallbacks.forEach(callback => {
            try {
                callback(this.currentUser);
            } catch (error) {
                console.error('Auth callback error:', error);
            }
        });
    }

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/src/pages/auth/login.html';
            return false;
        }
        return true;
    }

    requireRole(requiredRole) {
        if (!this.hasPermission(requiredRole)) {
            this.showUnauthorizedMessage();
            return false;
        }
        return true;
    }

    showUnauthorizedMessage() {
        alert('You do not have permission to access this page.');
        this.redirectToDashboard();
    }

    redirectToDashboard() {
        const role = this.getUserRole();
        console.log(role,"Admindashboard")
        const dashboards = {
            'ADMIN': '/src/pages/dashboards/Admindashboard.html',
            'MINISTRY': '/src/pages/dashboards/HQdashboard.html',
            'AGENCY': '/src/pages/dashboards/AgencyDashboard.html',
            'MISSION_OPERATOR': '/src/pages/dashboards/AgencyDashboard.html'
        };
        
        window.location.href = dashboards[role] || '/src/pages/auth/login.html';
    }

    async refreshUserProfile() {
        try {
            const userProfile = await this.apiService.getCurrentUserProfile();
            this.currentUser = userProfile;
            this.notifyAuthChange();
            return userProfile;
        } catch (error) {
            console.error('Failed to refresh user profile:', error);
            return null;
        }
    }
}

const authService = new AuthService();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
} else {
    window.AuthService = AuthService;
    window.authService = authService;
}