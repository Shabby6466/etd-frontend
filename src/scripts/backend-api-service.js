import { authFetch, getToken, isLoggedIn } from './auth.js';

class BackendApiService {
    constructor() {
        this.loadConfig();
    }

    loadConfig() {
        const config = window.getCurrentConfig ? window.getCurrentConfig() : {
            apiUrl: '/api/v1',
            environment: 'development'
        };

        // Use localhost for development, otherwise use relative paths
        this.baseApiUrl = config.environment === 'development' 
            ? 'http://localhost:3837/v1/api' 
            : config.apiUrl;
            
        this.authUrl = `${this.baseApiUrl}/auth`;
        this.usersUrl = `${this.baseApiUrl}/users`;
        this.documentsUrl = `${this.baseApiUrl}/documents`;
        this.uploadsUrl = `${this.baseApiUrl}/uploads`;
        this.applicationsUrl = `${this.baseApiUrl}/applications`;
    }

    // Auth API Methods
    async login(username, password, locationId = 'fm') {
        try {
            const response = await fetch(`${this.authUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, locationId }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            return {
                success: true,
                data: data,
                token: data.token
            };
        } catch (error) {
            console.error('Login API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async logout() {
        try {
            const response = await authFetch(`${this.authUrl}/logout`, {
                method: 'POST'
            });

            return {
                success: response.ok,
                data: response.ok ? await response.json() : null
            };
        } catch (error) {
            console.error('Logout API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async refreshToken() {
        try {
            const response = await authFetch(`${this.authUrl}/refresh`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            return {
                success: true,
                token: data.token
            };
        } catch (error) {
            console.error('Token refresh error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Users API Methods
    async getCurrentUser() {
        try {
            const response = await authFetch(`${this.usersUrl}/me`);
            
            if (!response.ok) {
                throw new Error('Failed to get user info');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Get user API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateUser(userId, userData) {
        try {
            const response = await authFetch(`${this.usersUrl}/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error('Failed to update user');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Update user API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getUsers(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await authFetch(`${this.usersUrl}?${queryParams}`);
            
            if (!response.ok) {
                throw new Error('Failed to get users');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Get users API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Applications API Methods
    async createApplication(applicationData) {
        try {
            const response = await authFetch(`${this.applicationsUrl}`, {
                method: 'POST',
                body: JSON.stringify(applicationData)
            });

            if (!response.ok) {
                throw new Error('Failed to create application');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Create application API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getApplication(applicationId) {
        try {
            const response = await authFetch(`${this.applicationsUrl}/${applicationId}`);
            
            if (!response.ok) {
                throw new Error('Failed to get application');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Get application API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateApplication(applicationId, applicationData) {
        try {
            const response = await authFetch(`${this.applicationsUrl}/${applicationId}`, {
                method: 'PUT',
                body: JSON.stringify(applicationData)
            });

            if (!response.ok) {
                throw new Error('Failed to update application');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Update application API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getApplications(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await authFetch(`${this.applicationsUrl}?${queryParams}`);
            
            if (!response.ok) {
                throw new Error('Failed to get applications');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Get applications API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async submitApplication(applicationId) {
        try {
            const response = await authFetch(`${this.applicationsUrl}/${applicationId}/submit`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to submit application');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Submit application API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async approveApplication(applicationId, remarks = '') {
        try {
            const response = await authFetch(`${this.applicationsUrl}/${applicationId}/approve`, {
                method: 'POST',
                body: JSON.stringify({ remarks })
            });

            if (!response.ok) {
                throw new Error('Failed to approve application');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Approve application API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async rejectApplication(applicationId, reason = '') {
        try {
            const response = await authFetch(`${this.applicationsUrl}/${applicationId}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });

            if (!response.ok) {
                throw new Error('Failed to reject application');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Reject application API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Documents API Methods
    async getDocument(documentId) {
        try {
            const response = await authFetch(`${this.documentsUrl}/${documentId}`);
            
            if (!response.ok) {
                throw new Error('Failed to get document');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Get document API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getDocuments(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await authFetch(`${this.documentsUrl}?${queryParams}`);
            
            if (!response.ok) {
                throw new Error('Failed to get documents');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Get documents API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createDocument(documentData) {
        try {
            const response = await authFetch(`${this.documentsUrl}`, {
                method: 'POST',
                body: JSON.stringify(documentData)
            });

            if (!response.ok) {
                throw new Error('Failed to create document');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Create document API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateDocument(documentId, documentData) {
        try {
            const response = await authFetch(`${this.documentsUrl}/${documentId}`, {
                method: 'PUT',
                body: JSON.stringify(documentData)
            });

            if (!response.ok) {
                throw new Error('Failed to update document');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Update document API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteDocument(documentId) {
        try {
            const response = await authFetch(`${this.documentsUrl}/${documentId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete document');
            }

            return {
                success: true
            };
        } catch (error) {
            console.error('Delete document API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Upload API Methods
    async uploadFile(file, metadata = {}) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // Add metadata
            Object.keys(metadata).forEach(key => {
                formData.append(key, metadata[key]);
            });

            const response = await fetch(`${this.uploadsUrl}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                    // Don't set Content-Type for FormData, let browser set it with boundary
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload file');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Upload file API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async uploadMultipleFiles(files, metadata = {}) {
        try {
            const uploadPromises = files.map(file => this.uploadFile(file, metadata));
            const results = await Promise.all(uploadPromises);
            
            return {
                success: true,
                data: results
            };
        } catch (error) {
            console.error('Upload multiple files API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteFile(fileId) {
        try {
            const response = await authFetch(`${this.uploadsUrl}/${fileId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete file');
            }

            return {
                success: true
            };
        } catch (error) {
            console.error('Delete file API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getFile(fileId) {
        try {
            const response = await authFetch(`${this.uploadsUrl}/${fileId}`);
            
            if (!response.ok) {
                throw new Error('Failed to get file');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Get file API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ETD Specific Methods
    async generateTrackingId(applicationData) {
        try {
            const response = await authFetch(`${this.applicationsUrl}/generate-tracking`, {
                method: 'POST',
                body: JSON.stringify(applicationData)
            });

            if (!response.ok) {
                throw new Error('Failed to generate tracking ID');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Generate tracking ID API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async verifyApplication(applicationId, verificationData) {
        try {
            const response = await authFetch(`${this.applicationsUrl}/${applicationId}/verify`, {
                method: 'POST',
                body: JSON.stringify(verificationData)
            });

            if (!response.ok) {
                throw new Error('Failed to verify application');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Verify application API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async printDocument(applicationId, documentType = 'etd') {
        try {
            const response = await authFetch(`${this.applicationsUrl}/${applicationId}/print/${documentType}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to print document');
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Print document API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility Methods
    async checkApiHealth() {
        try {
            const response = await fetch(`${this.baseApiUrl}/health`);
            return {
                success: response.ok,
                status: response.status
            };
        } catch (error) {
            console.error('API health check error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    isAuthenticated() {
        return isLoggedIn();
    }
}

// Create singleton instance
const backendApiService = new BackendApiService();

// Export both the instance and the class
export default backendApiService;
export { BackendApiService };