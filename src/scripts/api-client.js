// Refactored API Client - Clean and modular
import { getToken } from './auth-refactored.js';

class ApiClient {
    constructor() {
        this.config = this.getConfig();
        this.requestInterceptors = [];
        this.responseInterceptors = [];
    }

    // Configuration
    getConfig() {
        const isDevelopment = window.location.hostname === 'localhost';
        
        return {
            baseURL: isDevelopment ? 'http://localhost:3837/v1/api' : '/api/v1',
            timeout: 30000,
            retries: 3,
            retryDelay: 1000,
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }

    // Add request interceptor
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }

    // Add response interceptor
    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }

    // Build full URL
    buildUrl(endpoint) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${this.config.baseURL}${cleanEndpoint}`;
    }

    // Process request through interceptors
    async processRequest(url, options) {
        let processedOptions = { ...options };
        
        for (const interceptor of this.requestInterceptors) {
            processedOptions = await interceptor(url, processedOptions) || processedOptions;
        }
        
        return processedOptions;
    }

    // Process response through interceptors
    async processResponse(response, originalUrl, originalOptions) {
        let processedResponse = response;
        
        for (const interceptor of this.responseInterceptors) {
            processedResponse = await interceptor(processedResponse, originalUrl, originalOptions) || processedResponse;
        }
        
        return processedResponse;
    }

    // Make HTTP request with retry logic
    async request(endpoint, options = {}) {
        const url = this.buildUrl(endpoint);
        let lastError;

        for (let attempt = 1; attempt <= this.config.retries; attempt++) {
            try {
                const processedOptions = await this.processRequest(url, {
                    timeout: this.config.timeout,
                    ...options,
                    headers: {
                        ...this.config.headers,
                        ...options.headers
                    }
                });

                // Create AbortController for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

                const fetchOptions = {
                    ...processedOptions,
                    signal: controller.signal
                };

                const response = await fetch(url, fetchOptions);
                clearTimeout(timeoutId);

                const processedResponse = await this.processResponse(response, url, options);
                
                // Handle response
                if (processedResponse.ok) {
                    const data = await processedResponse.json().catch(() => ({}));
                    return {
                        success: true,
                        data: data,
                        status: processedResponse.status,
                        headers: Object.fromEntries(processedResponse.headers.entries())
                    };
                } else {
                    const errorData = await processedResponse.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP ${processedResponse.status}: ${processedResponse.statusText}`);
                }

            } catch (error) {
                lastError = error;
                
                console.warn(`API request attempt ${attempt} failed:`, error.message);
                
                // Don't retry on authentication errors or client errors (4xx)
                if (error.name === 'AbortError' || (error.message.includes('HTTP 4'))) {
                    break;
                }
                
                // Wait before retry (except on last attempt)
                if (attempt < this.config.retries) {
                    await new Promise(resolve => 
                        setTimeout(resolve, this.config.retryDelay * attempt)
                    );
                }
            }
        }

        return {
            success: false,
            error: lastError?.message || 'Request failed',
            status: lastError?.status || 0
        };
    }

    // HTTP methods
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, { method: 'GET' });
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Upload files
    async upload(endpoint, formData, onProgress = null) {
        try {
            const url = this.buildUrl(endpoint);
            const token = getToken();
            
            const options = {
                method: 'POST',
                body: formData,
                headers: {}
            };

            if (token) {
                options.headers.Authorization = `Bearer ${token}`;
            }

            // Handle progress if callback provided
            if (onProgress && typeof onProgress === 'function') {
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    
                    xhr.upload.addEventListener('progress', (e) => {
                        if (e.lengthComputable) {
                            const progress = Math.round((e.loaded / e.total) * 100);
                            onProgress(progress);
                        }
                    });
                    
                    xhr.addEventListener('load', () => {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (xhr.status >= 200 && xhr.status < 300) {
                                resolve({ success: true, data: response });
                            } else {
                                resolve({ success: false, error: response.message || 'Upload failed' });
                            }
                        } catch (error) {
                            resolve({ success: false, error: 'Invalid response format' });
                        }
                    });
                    
                    xhr.addEventListener('error', () => {
                        reject(new Error('Upload failed'));
                    });
                    
                    xhr.open('POST', url);
                    if (token) {
                        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    }
                    xhr.send(formData);
                });
            } else {
                const response = await fetch(url, options);
                const data = await response.json().catch(() => ({}));
                
                return {
                    success: response.ok,
                    data: response.ok ? data : null,
                    error: response.ok ? null : (data.message || 'Upload failed')
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Authentication API Client
class AuthApiClient extends ApiClient {
    constructor() {
        super();
        this.setupAuthInterceptors();
    }

    setupAuthInterceptors() {
        // Add authentication token to requests
        this.addRequestInterceptor(async (url, options) => {
            const token = getToken();
            if (token && !url.includes('/auth/login')) {
                options.headers = {
                    ...options.headers,
                    Authorization: `Bearer ${token}`
                };
            }
            return options;
        });

        // Handle authentication errors
        this.addResponseInterceptor(async (response) => {
            if (response.status === 401) {
                console.warn('Authentication failed - token may be expired');
                // Could trigger token refresh or logout here
            }
            return response;
        });
    }

    // Authentication methods
    async login(credentials) {
        return this.post('/auth/login', credentials);
    }

    async logout() {
        return this.post('/auth/logout');
    }

    async refreshToken() {
        return this.post('/auth/refresh');
    }

    async getCurrentUser() {
        return this.get('/auth/me');
    }
}

// Application API Client
class AppApiClient extends AuthApiClient {
    // User methods
    async getUsers(filters = {}) {
        return this.get('/users', filters);
    }

    async getUserById(userId) {
        return this.get(`/users/${userId}`);
    }

    async updateUser(userId, userData) {
        return this.put(`/users/${userId}`, userData);
    }

    // Application methods
    async getApplications(filters = {}) {
        return this.get('/applications', filters);
    }

    async getApplicationById(applicationId) {
        return this.get(`/applications/${applicationId}`);
    }

    async createApplication(applicationData) {
        return this.post('/applications', applicationData);
    }

    async updateApplication(applicationId, applicationData) {
        return this.put(`/applications/${applicationId}`, applicationData);
    }

    async submitApplication(applicationId) {
        return this.post(`/applications/${applicationId}/submit`);
    }

    async approveApplication(applicationId, remarks = '') {
        return this.post(`/applications/${applicationId}/approve`, { remarks });
    }

    async rejectApplication(applicationId, reason = '') {
        return this.post(`/applications/${applicationId}/reject`, { reason });
    }

    async generateTrackingId(applicationData) {
        return this.post('/applications/generate-tracking', applicationData);
    }

    // Document methods
    async getDocuments(filters = {}) {
        return this.get('/documents', filters);
    }

    async getDocumentById(documentId) {
        return this.get(`/documents/${documentId}`);
    }

    async createDocument(documentData) {
        return this.post('/documents', documentData);
    }

    async updateDocument(documentId, documentData) {
        return this.put(`/documents/${documentId}`, documentData);
    }

    async deleteDocument(documentId) {
        return this.delete(`/documents/${documentId}`);
    }

    // File upload methods
    async uploadFile(file, metadata = {}, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.keys(metadata).forEach(key => {
            formData.append(key, metadata[key]);
        });

        return this.upload('/uploads', formData, onProgress);
    }

    async uploadFiles(files, metadata = {}, onProgress = null) {
        const formData = new FormData();
        
        files.forEach((file, index) => {
            formData.append(`files`, file);
        });
        
        Object.keys(metadata).forEach(key => {
            formData.append(key, metadata[key]);
        });

        return this.upload('/uploads/multiple', formData, onProgress);
    }

    async deleteFile(fileId) {
        return this.delete(`/uploads/${fileId}`);
    }

    async getFileInfo(fileId) {
        return this.get(`/uploads/${fileId}`);
    }

    // System methods
    async checkHealth() {
        return this.get('/health');
    }
}

// Create singleton instances
const authApi = new AuthApiClient();
const appApi = new AppApiClient();

// Export instances and classes
export { ApiClient, AuthApiClient, AppApiClient, authApi, appApi };
export default appApi;