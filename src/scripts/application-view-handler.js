class ApplicationViewHandler {
    constructor() {
        this.applicationService = window.applicationService || new ApplicationService();
        this.authService = window.authService || new AuthService();
        this.applicationId = null;
        this.applicationData = null;
        
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.getApplicationId();
        this.bindEvents();
        this.loadApplication();
    }

    checkAuthentication() {
        if (!this.authService.requireAuth()) {
            return;
        }
    }

    getApplicationId() {
        const urlParams = new URLSearchParams(window.location.search);
        this.applicationId = urlParams.get('id');
        
        console.log('URL parameters:', window.location.search);
        console.log('Extracted application ID:', this.applicationId);
        
        if (!this.applicationId) {
            console.error('No application ID found in URL');
            Utils.showNotification('No application ID provided in URL. Please access this page through the dashboard.', 'error');
            
            // Show a test ID button for debugging
            this.showTestIdButton();
            
            setTimeout(() => {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = '../dashboards/AgencyDashboard.html';
                }
            }, 5000);
        }
    }

    showTestIdButton() {
        const testBtn = document.createElement('button');
        testBtn.textContent = 'Test with Sample ID';
        testBtn.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
        `;
        
        testBtn.addEventListener('click', () => {
            // Use a test ID for debugging
            this.applicationId = 'test-application-id';
            testBtn.remove();
            this.loadApplication();
        });
        
        document.body.appendChild(testBtn);
    }

    bindEvents() {
        const approveBtn = document.getElementById('approve-btn');
        const rejectBtn = document.getElementById('reject-btn');

        if (approveBtn) {
            approveBtn.addEventListener('click', () => {
                this.approveApplication();
            });
        }

        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                this.rejectApplication();
            });
        }
    }

    async loadApplication() {
        if (!this.applicationId) {
            console.error('No application ID available');
            this.showErrorState();
            return;
        }

        console.log('Loading application with ID:', this.applicationId);

        try {
            this.showLoadingState();
            
            // Check if applicationService is available
            if (!this.applicationService) {
                throw new Error('Application service not available');
            }

            this.applicationData = await this.applicationService.getApplication(this.applicationId);
            
            if (!this.applicationData) {
                throw new Error('No application data received');
            }

            console.log('Application data loaded successfully:', this.applicationData);
            
            this.populateApplicationData();
            this.setupStatusActions();
            
        } catch (error) {
            console.error('Failed to load application:', error);
            
            // Show specific error messages
            if (error.message.includes('404') || error.message.includes('not found')) {
                Utils.showNotification('Application not found', 'error');
            } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                Utils.showNotification('You do not have permission to view this application', 'error');
            } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                Utils.showNotification('Please log in to view this application', 'error');
                setTimeout(() => {
                    window.location.href = '../auth/login.html';
                }, 2000);
            } else {
                Utils.showNotification(`Failed to load application: ${error.message}`, 'error');
            }
            
            this.showErrorState();
        } finally {
            this.hideLoadingState();
        }
    }

    populateApplicationData() {
        if (!this.applicationData) {
            console.error('No application data to populate');
            return;
        }

        console.log('Populating application data:', this.applicationData);

        // Set basic information
        this.setElementValue('tracking-id', this.applicationData.id?.substring(0, 8) || 'N/A');
        this.setElementValue('application-type', 'Emergency Travel Document');

        // Set status
        const statusBadge = document.getElementById('status-badge');
        if (statusBadge) {
            statusBadge.textContent = this.formatStatus(this.applicationData.status);
            this.updateStatusBadgeColor(statusBadge, this.applicationData.status);
        }

        // Personal Information
        this.setElementValue('full-name', `${this.applicationData.first_name || ''} ${this.applicationData.last_name || ''}`.trim() || 'Not provided');
        this.setElementValue('father-name', this.applicationData.father_name || 'Not provided');
        this.setElementValue('mother-name', this.applicationData.mother_name || 'Not provided');
        this.setElementValue('citizen-id', this.formatCNIC(this.applicationData.citizen_id) || 'Not provided');
        this.setElementValue('date-of-birth', this.formatDate(this.applicationData.date_of_birth) || 'Not provided');
        this.setElementValue('gender', this.applicationData.gender || 'Not provided');
        this.setElementValue('nationality', this.applicationData.nationality || 'Pakistani');
        this.setElementValue('profession', this.applicationData.profession || 'Not provided');

        // Birth Information
        this.setElementValue('birth-city', this.applicationData.birth_city || 'Not provided');
        this.setElementValue('birth-country', this.applicationData.birth_country || 'Not provided');

        // Address Information
        this.setElementValue('pakistan-city', this.applicationData.pakistan_city || 'Not provided');
        this.setElementValue('pakistan-address', this.applicationData.pakistan_address || 'Not provided');

        // Physical Description
        this.setElementValue('height', this.applicationData.height ? `${this.applicationData.height} ft` : 'Not provided');
        this.setElementValue('color-of-eyes', this.applicationData.color_of_eyes || 'Not provided');
        this.setElementValue('color-of-hair', this.applicationData.color_of_hair || 'Not provided');

        // Travel Information
        this.setElementValue('departure-date', this.formatDate(this.applicationData.departure_date) || 'Not provided');
        this.setElementValue('transport-mode', this.applicationData.transport_mode || 'Not provided');

        // Show type-specific sections
        this.showTypeSpecificSections();
    }

    setElementValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                element.value = value;
            } else {
                element.textContent = value;
            }
        } else {
            console.warn(`Element with ID '${elementId}' not found`);
        }
    }

    updateStatusBadgeColor(statusBadge, status) {
        const statusColors = {
            'DRAFT': '#6c757d',
            'SUBMITTED': '#007bff',
            'UNDER_REVIEW': '#ffc107',
            'APPROVED': '#28a745',
            'REJECTED': '#dc3545',
            'COMPLETED': '#17a2b8'
        };
        
        const color = statusColors[status] || '#6c757d';
        statusBadge.style.backgroundColor = color;
    }

    showTypeSpecificSections() {
        // Check if application has ETD or SB specific data
        const hasETDData = this.applicationData.investor !== undefined || 
                          this.applicationData.etd_issue_date || 
                          this.applicationData.etd_expiry_date;
        
        const hasSBData = this.applicationData.requested_by || 
                         this.applicationData.reason_for_deport || 
                         this.applicationData.amount !== undefined ||
                         this.applicationData.currency ||
                         this.applicationData.is_fia_blacklist !== undefined;

        // Hide all type-specific fields first
        const etdFields = ['etd-investor-field', 'etd-security-field', 'etd-issue-field', 'etd-expiry-field'];
        const sbFields = ['sb-requested-field', 'sb-reason-field', 'sb-amount-field', 'sb-currency-field', 'sb-blacklist-field'];

        etdFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.style.display = 'none';
        });

        sbFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.style.display = 'none';
        });

        if (hasETDData) {
            // Show ETD fields
            etdFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) field.style.display = 'block';
            });

            // Populate ETD fields
            this.setElementValue('investor', this.applicationData.investor ? 'Yes' : 'No');
            this.setElementValue('security-deposit-desc', this.applicationData.security_deposit_desc || 'Not provided');
            this.setElementValue('etd-issue-date', this.formatDate(this.applicationData.etd_issue_date) || 'Not issued');
            this.setElementValue('etd-expiry-date', this.formatDate(this.applicationData.etd_expiry_date) || 'Not set');
        }

        if (hasSBData) {
            // Show SB fields
            sbFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) field.style.display = 'block';
            });

            // Populate SB fields
            this.setElementValue('requested-by', this.applicationData.requested_by || 'Not provided');
            this.setElementValue('reason-for-deport', this.applicationData.reason_for_deport || 'Not provided');
            this.setElementValue('amount', this.applicationData.amount ? `${this.applicationData.amount}` : 'Not provided');
            this.setElementValue('currency', this.applicationData.currency || 'Not provided');
            this.setElementValue('is-fia-blacklist', this.applicationData.is_fia_blacklist ? 'Yes' : 'No');
        }
    }

    setupStatusActions() {
        const statusActions = document.getElementById('status-actions');
        const user = this.authService.getCurrentUser();
        const status = this.applicationData.status;

        if (!statusActions || !user) return;

        // Show action buttons only for authorized users and appropriate statuses
        if ((user.role === 'AGENCY' || user.role === 'MINISTRY') && 
            (status === 'SUBMITTED' || status === 'UNDER_REVIEW')) {
            statusActions.style.display = 'flex';
        } else {
            statusActions.style.display = 'none';
        }
    }

    async approveApplication() {
        const confirmMessage = 'Are you sure you want to approve this application?';
        Utils.confirmAction(confirmMessage, async () => {
            try {
                await this.applicationService.approveApplication(this.applicationId);
                Utils.showNotification('Application approved successfully', 'success');
                this.loadApplication(); // Reload to update status
            } catch (error) {
                console.error('Approve error:', error);
                Utils.showNotification(`Failed to approve: ${error.message}`, 'error');
            }
        });
    }

    async rejectApplication() {
        const confirmMessage = 'Are you sure you want to reject this application?';
        Utils.confirmAction(confirmMessage, async () => {
            try {
                await this.applicationService.rejectApplication(this.applicationId);
                Utils.showNotification('Application rejected', 'success');
                this.loadApplication(); // Reload to update status
            } catch (error) {
                console.error('Reject error:', error);
                Utils.showNotification(`Failed to reject: ${error.message}`, 'error');
            }
        });
    }

    getApplicationTypeText(type) {
        const typeMap = {
            'ETD': 'Emergency Travel Document (ETD)',
            'SB': 'Special Branch (SB)',
            'NADRA': 'NADRA Application'
        };
        return typeMap[type] || type || 'Application';
    }

    formatStatus(status) {
        const statusMap = {
            'SUBMITTED': 'Submitted',
            'UNDER_REVIEW': 'Under Review',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected',
            'DRAFT': 'Draft',
            'COMPLETED': 'Completed'
        };
        return statusMap[status] || status;
    }

    formatCNIC(cnic) {
        if (!cnic) return 'N/A';
        return Utils.formatCNIC ? Utils.formatCNIC(cnic) : cnic;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB');
        } catch (error) {
            return dateString;
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-GB');
        } catch (error) {
            return dateString;
        }
    }

    showLoadingState() {
        document.body.classList.add('loading');
    }

    hideLoadingState() {
        document.body.classList.remove('loading');
    }

    showErrorState() {
        const card = document.querySelector('.card');
        card.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: #dc3545; margin-bottom: 20px;">Failed to Load Application</h2>
                <p style="color: #666; margin-bottom: 30px;">The application details could not be loaded. Please try again.</p>
                <button class="back-button" onclick="goBack()">
                    <span>Go Back</span>
                </button>
            </div>
        `;
    }
}

// Global function for back button
function goBack() {
    window.history.back();
}

// Initialize the handler when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ApplicationViewHandler();
}); 