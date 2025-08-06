import backendApiService from './backend-api-service.js';
import apiService from './api-service.js';

class ETDFormManager {
    constructor() {
        this.currentApplication = null;
        this.isDraft = true;
        this.formData = {};
        this.uploadedFiles = [];
        this.validationErrors = [];
    }

    // Application Management
    async createNewApplication(formData) {
        try {
            const applicationData = {
                ...formData,
                status: 'draft',
                created_at: new Date().toISOString()
            };

            const result = await backendApiService.createApplication(applicationData);
            
            if (result.success) {
                this.currentApplication = result.data;
                this.isDraft = true;
                this.showNotification('Application created successfully', 'success');
                return result;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Create application error:', error);
            this.showNotification(`Failed to create application: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async saveApplicationAsDraft(formData) {
        try {
            if (!this.currentApplication) {
                return await this.createNewApplication(formData);
            }

            const result = await backendApiService.updateApplication(
                this.currentApplication.id, 
                { ...formData, status: 'draft' }
            );

            if (result.success) {
                this.currentApplication = result.data;
                this.showNotification('Draft saved successfully', 'success');
                return result;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Save draft error:', error);
            this.showNotification(`Failed to save draft: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async submitApplication(formData) {
        try {
            // First validate the form
            const validation = this.validateForm(formData);
            if (!validation.isValid) {
                this.showValidationErrors(validation.errors);
                return { success: false, error: 'Form validation failed' };
            }

            // Save/update application with submitted status
            let applicationResult;
            if (this.currentApplication) {
                applicationResult = await backendApiService.updateApplication(
                    this.currentApplication.id,
                    { ...formData, status: 'submitted' }
                );
            } else {
                applicationResult = await this.createNewApplication({ ...formData, status: 'submitted' });
            }

            if (!applicationResult.success) {
                throw new Error(applicationResult.error);
            }

            this.currentApplication = applicationResult.data;
            this.isDraft = false;

            // Trigger NADRA and Passport API calls
            const citizenId = formData.citizen_id || formData.cnic;
            const passportNumber = formData.passport_number;

            if (citizenId) {
                await this.fetchAndStoreThirdPartyData(this.currentApplication.id, citizenId, passportNumber);
            }

            // Submit the application
            const submitResult = await backendApiService.submitApplication(this.currentApplication.id);
            
            if (submitResult.success) {
                this.showNotification('Application submitted successfully!', 'success');
                return submitResult;
            } else {
                throw new Error(submitResult.error);
            }

        } catch (error) {
            console.error('Submit application error:', error);
            this.showNotification(`Failed to submit application: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async fetchAndStoreThirdPartyData(applicationId, citizenId, passportNumber = null) {
        try {
            this.showNotification('Verifying citizen data...', 'info');

            // Get API configuration
            const config = window.getApiCredentials ? window.getApiCredentials() : { USE_SIMULATION: true };

            let nadraData, passportData;

            if (config.USE_SIMULATION) {
                // Use simulation
                const promises = [apiService.simulateNadraApiCall(citizenId)];
                if (passportNumber) {
                    promises.push(apiService.simulatePassportApiCall(citizenId, passportNumber));
                }
                const results = await Promise.all(promises);
                nadraData = results[0];
                passportData = results[1] || null;
            } else {
                // Use real APIs
                const results = await apiService.fetchThirdPartyData(citizenId, passportNumber);
                nadraData = results.nadra;
                passportData = results.passport;
            }

            // Store the responses in the application
            const updateData = {
                nadra_response: nadraData,
                passport_response: passportData,
                verification_date: new Date().toISOString()
            };

            await backendApiService.updateApplication(applicationId, updateData);

            if (nadraData.status === 'SUCCESS') {
                this.showNotification('Citizen data verified successfully', 'success');
            } else {
                this.showNotification('Citizen data verification failed', 'warning');
            }

        } catch (error) {
            console.error('Third-party data fetch error:', error);
            this.showNotification(`Verification failed: ${error.message}`, 'error');
        }
    }

    // File Upload Management
    async uploadFiles(files, applicationId = null) {
        try {
            const targetApplicationId = applicationId || this.currentApplication?.id;
            if (!targetApplicationId) {
                throw new Error('No application ID available for file upload');
            }

            this.showLoadingState('Uploading files...');

            const metadata = {
                application_id: targetApplicationId,
                uploaded_by: localStorage.getItem('etd_user'),
                upload_type: 'application_document'
            };

            const result = await backendApiService.uploadMultipleFiles(files, metadata);

            if (result.success) {
                this.uploadedFiles = [...this.uploadedFiles, ...result.data];
                this.showNotification(`${files.length} file(s) uploaded successfully`, 'success');
                return result;
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('File upload error:', error);
            this.showNotification(`File upload failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        } finally {
            this.hideLoadingState();
        }
    }

    async deleteFile(fileId) {
        try {
            const result = await backendApiService.deleteFile(fileId);
            
            if (result.success) {
                this.uploadedFiles = this.uploadedFiles.filter(file => file.id !== fileId);
                this.showNotification('File deleted successfully', 'success');
                return result;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('File delete error:', error);
            this.showNotification(`File deletion failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // Form Generation and Management
    async generateTrackingId() {
        try {
            if (!this.currentApplication) {
                throw new Error('No application available for tracking ID generation');
            }

            const result = await backendApiService.generateTrackingId({
                application_id: this.currentApplication.id
            });

            if (result.success) {
                this.currentApplication.tracking_id = result.data.tracking_id;
                this.showNotification(`Tracking ID generated: ${result.data.tracking_id}`, 'success');
                return result;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Generate tracking ID error:', error);
            this.showNotification(`Tracking ID generation failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // Form Validation
    validateForm(formData) {
        const errors = [];

        // Required fields validation
        const requiredFields = {
            'first_name': 'First Name',
            'last_name': 'Last Name',
            'father_name': 'Father Name',
            'citizen_id': 'Citizen ID/CNIC',
            'date_of_birth': 'Date of Birth'
        };

        Object.entries(requiredFields).forEach(([field, label]) => {
            if (!formData[field] || formData[field].trim() === '') {
                errors.push(`${label} is required`);
            }
        });

        // Citizen ID format validation
        if (formData.citizen_id) {
            const cleanId = formData.citizen_id.replace(/[-\s]/g, '');
            if (cleanId.length !== 13 || !/^\d{13}$/.test(cleanId)) {
                errors.push('Citizen ID must be 13 digits');
            }
        }

        // Passport number validation (if provided)
        if (formData.passport_number && formData.passport_number.trim() !== '') {
            const cleanPassport = formData.passport_number.trim().toUpperCase();
            if (!/^[A-Z]{1,2}\d{6,9}$/.test(cleanPassport)) {
                errors.push('Invalid passport number format');
            }
        }

        // Date validation
        if (formData.date_of_birth) {
            const dob = new Date(formData.date_of_birth);
            const today = new Date();
            if (dob >= today) {
                errors.push('Date of birth must be in the past');
            }
        }

        this.validationErrors = errors;
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    showValidationErrors(errors) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'validation-errors';
        errorContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            max-width: 400px;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
        `;

        const errorList = errors.map(error => `• ${error}`).join('<br>');
        errorContainer.innerHTML = `
            <strong>Please fix the following errors:</strong><br>
            ${errorList}
        `;

        document.body.appendChild(errorContainer);

        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.parentNode.removeChild(errorContainer);
            }
        }, 8000);
    }

    // Form Data Collection
    collectFormData(formSelector = 'form, .form-container') {
        const form = document.querySelector(formSelector);
        if (!form) {
            console.warn('Form not found with selector:', formSelector);
            return {};
        }

        const formData = {};
        
        // Get all form inputs
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.name || input.id) {
                const key = input.name || input.id;
                let value = input.value;
                
                // Handle different input types
                if (input.type === 'checkbox') {
                    value = input.checked;
                } else if (input.type === 'radio') {
                    if (input.checked) {
                        value = input.value;
                    } else {
                        return; // Skip unchecked radio buttons
                    }
                }
                
                formData[key] = value;
            }
        });

        return formData;
    }

    // UI Helper Methods
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
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
        }, 5000);
    }

    showLoadingState(message = 'Processing...') {
        let loader = document.getElementById('etd-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'etd-loader';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                font-family: 'Inter', sans-serif;
            `;
            
            loader.innerHTML = `
                <div style="
                    background: white;
                    padding: 32px;
                    border-radius: 16px;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #525EB1;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 16px auto;
                    "></div>
                    <div id="loader-message">${message}</div>
                </div>
            `;

            // Add spinner animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            if (!document.querySelector('style[data-loader]')) {
                style.setAttribute('data-loader', 'true');
                document.head.appendChild(style);
            }

            document.body.appendChild(loader);
        } else {
            const messageEl = loader.querySelector('#loader-message');
            if (messageEl) messageEl.textContent = message;
            loader.style.display = 'flex';
        }
    }

    hideLoadingState() {
        const loader = document.getElementById('etd-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    // Application Status Management
    async getApplicationStatus(trackingId) {
        try {
            const result = await backendApiService.getApplications({ tracking_id: trackingId });
            if (result.success && result.data.length > 0) {
                return {
                    success: true,
                    data: result.data[0]
                };
            } else {
                throw new Error('Application not found');
            }
        } catch (error) {
            console.error('Get application status error:', error);
            return { success: false, error: error.message };
        }
    }

    // Initialize form manager
    init() {
        this.bindEvents();
        this.loadCurrentApplication();
    }

    bindEvents() {
        // Save draft button
        document.addEventListener('click', async (e) => {
            if (e.target.matches('.save-btn, .btn.save, [data-action="save"]')) {
                e.preventDefault();
                const formData = this.collectFormData();
                await this.saveApplicationAsDraft(formData);
            }
        });

        // Submit button
        document.addEventListener('click', async (e) => {
            if (e.target.matches('.submit-btn, .btn.submit, [data-action="submit"]')) {
                e.preventDefault();
                const formData = this.collectFormData();
                await this.submitApplication(formData);
            }
        });

        // Generate tracking ID button
        document.addEventListener('click', async (e) => {
            if (e.target.matches('#generateBtn, .generate-tracking-btn, [data-action="generate-tracking"]')) {
                e.preventDefault();
                await this.generateTrackingId();
            }
        });

        // File upload handling
        document.addEventListener('change', async (e) => {
            if (e.target.type === 'file') {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    await this.uploadFiles(files);
                }
            }
        });
    }

    async loadCurrentApplication() {
        // Try to load existing application from session storage
        const storedApp = sessionStorage.getItem('current_etd_application');
        if (storedApp) {
            try {
                this.currentApplication = JSON.parse(storedApp);
            } catch (e) {
                console.warn('Failed to parse stored application data');
            }
        }
    }

    saveCurrentApplication() {
        if (this.currentApplication) {
            sessionStorage.setItem('current_etd_application', JSON.stringify(this.currentApplication));
        }
    }
}

// Create singleton instance
const etdFormManager = new ETDFormManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => etdFormManager.init());
} else {
    etdFormManager.init();
}

export default etdFormManager;
export { ETDFormManager };