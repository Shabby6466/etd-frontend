class BackendApiService {
    constructor() {
        this.baseURL = this.getBaseURL();
        this.token = this.getAuthToken();
    }

    getBaseURL() {
        return 'http://localhost:3837/v1/api';
    }

    getAuthToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    setAuthToken(token) {
        localStorage.setItem('auth_token', token);
        this.token = token;
    }

    setUser(user){
        localStorage.setItem('user', user);
    }

    removeAuthToken() {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        this.token = null;
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP Error: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return response;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        
        if (response.token) {
            this.setAuthToken(response.token);
            this.setUser(JSON.stringify(response.user))
        }
        
        return response;
    }

    async createUser(userData) {
        return await this.request('/auth/admin/create-user', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async getAllUsers() {
        return await this.request('/users');
    }

    async getCurrentUserProfile() {
        return await this.request('/users/profile');
    }

    async createApplication(applicationData) {
        return await this.request('/applications', {
            method: 'POST',
            body: JSON.stringify(applicationData),
        });
    }

    async getAllApplications(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/applications${queryString ? '?' + queryString : ''}`;
        return await this.request(endpoint);
    }

    async getApplicationById(id) {
        return await this.request(`/applications/${id}`);
    }

    async updateApplication(id, applicationData) {
        return await this.request(`/applications/${id}`, {
            method: 'PUT',
            body: JSON.stringify(applicationData),
        });
    }

    async reviewApplication(id, approved) {
        return await this.request(`/applications/${id}/review`, {
            method: 'PATCH',
            body: JSON.stringify({ approved }),
        });
    }

    async getAdminDashboardStats() {
        return await this.request('/dashboard/admin/stats');
    }

    async getAgencyApplications() {
        return await this.request('/dashboard/agency/applications');
    }

    async getMinistryApplications() {
        return await this.request('/dashboard/ministry/applications');
    }

    async getMissionOperatorSummary() {
        return await this.request('/dashboard/mission-operator/summary');
    }

    logout() {
        this.removeAuthToken();
    }

    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        if (!this.token) return null;
        
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            return payload;
        } catch (error) {
            console.error('Failed to parse token:', error);
            return null;
        }
    }
}

const backendApiService = new BackendApiService();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackendApiService;
} else {
    window.BackendApiService = BackendApiService;
    window.backendApiService = backendApiService;
}