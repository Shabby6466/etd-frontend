class IntegratedFormHandler {
    constructor() {
        this.applicationService = window.applicationService || new ApplicationService();
        this.authService = window.authService || new AuthService();
        this.currentApplicationId = null;
        this.isEditMode = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadApplicationIfEditing();
        this.setupNavigation();
    }

    bindEvents() {
        const form = document.querySelector('form') || document.querySelector('.main-container');
        if (form) {
            this.bindFormEvents(form);
        }

        this.bindGetDataButton();
        this.bindSaveButtons();
        this.bindSubmitButtons();
        this.bindBackButton();
    }

    bindGetDataButton() {
        const getDataButton = document.querySelector('[data-action="get-data"]') || 
                             document.querySelector('.get-data-btn') ||
                             document.querySelector('#getDataBtn');

        if (getDataButton) {
            getDataButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleGetData();
            });
        }
    }

    bindSaveButtons() {
        const saveButtons = document.querySelectorAll('[data-action="save"], .save-btn, #saveBtn');
        saveButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSave(false);
            });
        });
    }

    bindSubmitButtons() {
        const submitButtons = document.querySelectorAll('[data-action="submit"], .submit-btn, #submitBtn');
        submitButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        });
    }

    bindBackButton() {
        const backButton = document.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.goBack();
            });
        }
    }

    bindFormEvents(form) {
        const citizenInput = form.querySelector('#citizenNumber, #citizenId, [name="citizenId"]');
        if (citizenInput) {
            citizenInput.addEventListener('input', (e) => {
                const formatted = Utils.formatCNIC(e.target.value);
                if (formatted !== e.target.value) {
                    e.target.value = formatted;
                }
            });

            citizenInput.addEventListener('blur', (e) => {
                this.validateCitizenId(e.target.value);
            });
        }

        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', (e) => {
                this.validateField(e.target);
            });
        });
    }

    async handleGetData() {

        const citizenId = this.getCitizenId();
        
        if (!this.validateCitizenId(citizenId)) {
            Utils.showNotification('Please enter a valid 13-digit CNIC', 'error');
            return;
        }

        const container = document.querySelector('.main-container') || document.body;
        const loadingOverlay = Utils.showLoading(container, 'Fetching data from NADRA/Passport...');

        try {
            await this.fetchExternalData(citizenId);
        } catch (error) {
            console.error('Get data error:', error);
            Utils.showNotification('Unable to fetch data from external sources. You can enter details manually.', 'warning');
            // Show custom form when API calls fail
            setTimeout(() => {
                this.showCustomForm();
            }, 1000);
        } finally {
            Utils.hideLoading(container);
        }
    }

    async fetchExternalData(citizenId) {

        window.location.href='../forms/Nadra-and-passport.html';
         const promises = [];

        promises.push(this.fetchNadraData(citizenId));
        
        const passportNumber = this.getPassportNumber();
        if (passportNumber) {
            promises.push(this.fetchPassportData(citizenId, passportNumber));
        }

        const results = await Promise.allSettled(promises);
        
        let hasNadraData = false;
        let hasPassportData = false;
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                if (index === 0) {
                    hasNadraData = this.populateFromNadraData(result.value);
                } else if (index === 1) {
                    hasPassportData = this.populateFromPassportData(result.value);
                }
            } else {
                console.warn(`API call ${index} failed:`, result.reason);
            }
        });

        // Show custom form if no data is available from external sources
        if (!hasNadraData && !hasPassportData) {
            this.showCustomForm();
        }
    }

    async fetchNadraData(citizenId) {
        if (!window.ApiService) {
            throw new Error('NADRA API service not available');
        }
        
        const apiService = new window.ApiService();
        return await apiService.verifyNadraId(citizenId);
    }

    async fetchPassportData(citizenId, passportNumber) {
        if (!window.ApiService) {
            throw new Error('Passport API service not available');
        }
        
        const apiService = new window.ApiService();
        return await apiService.verifyPassport(citizenId, passportNumber);
    }

    populateFromNadraData(nadraResponse) {
        if (nadraResponse.status === 'SUCCESS' && nadraResponse.data) {
            const data = nadraResponse.data;
            
            this.setFieldValue('firstName', data.first_name);
            this.setFieldValue('lastName', data.last_name);
            this.setFieldValue('fatherName', data.father_name);
            this.setFieldValue('motherName', data.mother_name);
            this.setFieldValue('pakistanCity', data.pakistan_city);
            this.setFieldValue('dateOfBirth', data.date_of_birth);
            this.setFieldValue('birthCountry', data.birth_country || 'Pakistan');
            this.setFieldValue('birthCity', data.birth_city);
            this.setFieldValue('profession', data.profession);
            this.setFieldValue('pakistanAddress', data.pakistan_address);
            
            this.markFieldAsVerified('citizenNumber', 'NADRA Verified');
            return true;
        }
        return false;
    }

    populateFromPassportData(passportResponse) {
        if (passportResponse.status === 'SUCCESS' && passportResponse.data) {
            const data = passportResponse.data;
            
            this.setFieldValue('passportNumber', data.passport_number);
            this.setFieldValue('passportIssueDate', data.issue_date);
            this.setFieldValue('passportExpiryDate', data.expiry_date);
            
            this.markFieldAsVerified('passportNumber', 'Passport Verified');
            return true;
        }
        return false;
    }

    showCustomForm() {
        // Show notification message
        Utils.showNotification('No data found from external sources. Please enter your details manually in the form below.', 'info');
        
        // Convert static display fields to editable input fields
        this.convertFieldsToEditable();
        
        // Add manual entry indicator
        this.addManualEntryHeader();
    }

    convertFieldsToEditable() {
        const fieldMappings = [
            { label: 'First name', name: 'firstName', type: 'text', required: true },
            { label: 'Last Name', name: 'lastName', type: 'text', required: true },
            { label: 'Fathers Name', name: 'fatherName', type: 'text', required: true },
            { label: 'Mothers Name', name: 'motherName', type: 'text', required: false },
            { label: 'Gender', name: 'gender', type: 'select', required: true, options: ['Male', 'Female'] },
            { label: 'Pakistan City', name: 'pakistanCity', type: 'text', required: true },
            { label: 'Date of Birth', name: 'dateOfBirth', type: 'date', required: true },
            { label: 'Birth Country', name: 'birthCountry', type: 'text', required: true, defaultValue: 'Pakistan' },
            { label: 'Birth City', name: 'birthCity', type: 'text', required: true },
            { label: 'Profession', name: 'profession', type: 'text', required: false },
            { label: 'Pakistan Address', name: 'pakistanAddress', type: 'textarea', required: true }
        ];

        // Convert both Passport and NADRA card fields
        const cards = document.querySelectorAll('.passport-card, .nadra-card');
        
        cards.forEach(card => {
            const cardContent = card.querySelector('.card-content');
            if (!cardContent) return;

            const fields = cardContent.querySelectorAll('.field');
            
            fields.forEach(field => {
                const labelDiv = field.querySelector('.label');
                const valueDiv = field.querySelector('.value');
                
                if (!labelDiv || !valueDiv) return;

                const labelText = labelDiv.textContent.trim();
                const mapping = fieldMappings.find(m => m.label === labelText);
                
                if (mapping) {
                    // Create input element based on field type
                    let inputElement;
                    
                    if (mapping.type === 'select') {
                        inputElement = document.createElement('select');
                        mapping.options.forEach(option => {
                            const optionElement = document.createElement('option');
                            optionElement.value = option;
                            optionElement.textContent = option;
                            inputElement.appendChild(optionElement);
                        });
                    } else if (mapping.type === 'textarea') {
                        inputElement = document.createElement('textarea');
                        inputElement.rows = 3;
                    } else {
                        inputElement = document.createElement('input');
                        inputElement.type = mapping.type;
                    }
                    
                    // Set common attributes
                    inputElement.name = mapping.name;
                    inputElement.id = mapping.name;
                    inputElement.className = 'manual-input';
                    
                    if (mapping.required) {
                        inputElement.required = true;
                        // Add red asterisk to label
                        if (!labelDiv.querySelector('.required-asterisk')) {
                            const asterisk = document.createElement('span');
                            asterisk.className = 'required-asterisk';
                            asterisk.textContent = ' *';
                            asterisk.style.color = '#dc3545';
                            labelDiv.appendChild(asterisk);
                        }
                    }
                    
                    if (mapping.defaultValue) {
                        inputElement.value = mapping.defaultValue;
                    }
                    
                    // Style the input
                    inputElement.style.cssText = `
                        width: 100%;
                        padding: 8px 12px;
                        border: 2px solid #ffc107;
                        border-radius: 4px;
                        font-size: 14px;
                        font-family: inherit;
                        background-color: #fff9e6;
                        outline: none;
                        transition: border-color 0.3s ease;
                    `;
                    
                    // Add focus styling
                    inputElement.addEventListener('focus', function() {
                        this.style.borderColor = '#007bff';
                    });
                    
                    inputElement.addEventListener('blur', function() {
                        this.style.borderColor = '#ffc107';
                    });
                    
                    // Replace the value div with input
                    field.replaceChild(inputElement, valueDiv);
                    
                    // Add validation
                    inputElement.addEventListener('input', () => {
                        this.validateManualField(inputElement);
                    });
                }
            });
        });
        
        // Add save button if it doesn't exist
        this.addSaveButton();
    }

    addManualEntryHeader() {
        const container = document.querySelector('.container');
        if (!container) return;
        
        const existingHeader = document.querySelector('.manual-entry-header');
        if (existingHeader) return;
        
        const header = document.createElement('div');
        header.className = 'manual-entry-header';
        header.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #ffc107, #ff9800);
                color: white;
                padding: 16px 20px;
                margin: 20px 0;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                text-align: center;
                font-family: 'Inter', sans-serif;
            ">
                <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
                    ✏️ Manual Data Entry Mode
                </h3>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                    External data sources are not available. Please fill in your details manually below.
                </p>
            </div>
        `;
        
        // Insert after the header image
        const headerImage = container.querySelector('.header-image');
        if (headerImage) {
            headerImage.insertAdjacentElement('afterend', header);
        } else {
            container.insertBefore(header, container.firstChild);
        }
    }

    addSaveButton() {
        const container = document.querySelector('.container');
        if (!container || document.querySelector('.manual-save-button')) return;
        
        const saveButton = document.createElement('button');
        saveButton.className = 'manual-save-button';
        saveButton.textContent = 'Save Manual Entry';
        saveButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        
        saveButton.addEventListener('click', () => {
            this.saveManualFormData();
        });
        
        saveButton.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 16px rgba(40, 167, 69, 0.4)';
        });
        
        saveButton.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
        });
        
        document.body.appendChild(saveButton);
    }

    validateManualField(field) {
        const isValid = field.required ? field.value.trim() !== '' : true;
        
        if (isValid) {
            field.style.borderColor = '#28a745';
            field.style.backgroundColor = '#f8fff9';
        } else {
            field.style.borderColor = '#dc3545';
            field.style.backgroundColor = '#fff5f5';
        }
        
        return isValid;
    }

    saveManualFormData() {
        const manualInputs = document.querySelectorAll('.manual-input');
        let isValid = true;
        const formData = {};
        
        // Validate all fields
        manualInputs.forEach(input => {
            const fieldValid = this.validateManualField(input);
            if (!fieldValid) {
                isValid = false;
            } else {
                formData[input.name] = input.value;
            }
        });
        
        if (!isValid) {
            Utils.showNotification('Please fill in all required fields (marked with *)', 'error');
            return;
        }
        
        // Mark all fields as manually entered
        manualInputs.forEach(input => {
            this.markFieldAsManualEntry(input.name);
        });
        
        // Remove the save button and header since data is now saved
        const saveButton = document.querySelector('.manual-save-button');
        const header = document.querySelector('.manual-entry-header');
        
        if (saveButton) saveButton.remove();
        if (header) header.remove();
        
        // Convert inputs back to display format but keep the manual styling
        this.convertInputsToDisplay();
        
        Utils.showNotification('Manual data saved successfully! You can now proceed with your application.', 'success');
    }

    convertInputsToDisplay() {
        const manualInputs = document.querySelectorAll('.manual-input');
        
        manualInputs.forEach(input => {
            const valueDiv = document.createElement('div');
            valueDiv.className = 'value manual-value';
            valueDiv.textContent = input.value || 'Not provided';
            
            valueDiv.style.cssText = `
                color: #333;
                font-size: 14px;
                padding: 8px 12px;
                background-color: #fff9e6;
                border: 1px solid #ffc107;
                border-radius: 4px;
                position: relative;
            `;
            
            // Add manual entry indicator
            const indicator = document.createElement('span');
            indicator.innerHTML = '✏️';
            indicator.title = 'Manually Entered';
            indicator.style.cssText = `
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 12px;
            `;
            
            valueDiv.appendChild(indicator);
            input.parentNode.replaceChild(valueDiv, input);
        });
    }

    markFieldAsManualEntry(fieldName) {
        const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (field && field.value) {
            field.style.borderColor = '#ffc107';
            field.style.backgroundColor = '#fff9e6';
            
            const manualIcon = document.createElement('span');
            manualIcon.innerHTML = '✏️';
            manualIcon.title = 'Manually Entered';
            manualIcon.style.cssText = `
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 16px;
            `;
            
            if (field.parentNode.style.position !== 'relative') {
                field.parentNode.style.position = 'relative';
            }
            
            const existingIcon = field.parentNode.querySelector('.manual-icon');
            if (existingIcon) {
                existingIcon.remove();
            }
            
            manualIcon.className = 'manual-icon';
            field.parentNode.appendChild(manualIcon);
        }
    }

    async handleSave(isDraft = true) {
        const formData = this.extractFormData();
        formData.status = isDraft ? 'DRAFT' : 'SUBMITTED';

        const container = document.querySelector('.main-container') || document.body;
        const loadingOverlay = Utils.showLoading(container, 'Saving application...');

        try {
            let result;
            if (this.currentApplicationId && this.isEditMode) {
                result = await this.applicationService.updateApplication(this.currentApplicationId, formData);
                Utils.showNotification('Application updated successfully', 'success');
            } else {
                result = await this.applicationService.createApplication(formData);
                this.currentApplicationId = result.id;
                Utils.showNotification('Application saved successfully', 'success');
            }

            this.updateUIAfterSave(result);
        } catch (error) {
            console.error('Save error:', error);
            Utils.showNotification(`Failed to save: ${error.message}`, 'error');
        } finally {
            Utils.hideLoading(container);
        }
    }

    async handleSubmit() {
        const validation = this.validateForm();
        if (!validation.isValid) {
            Utils.showNotification(`Please fix the following errors:\n${validation.errors.join('\n')}`, 'error');
            return;
        }

        const confirmMessage = 'Are you sure you want to submit this application? Once submitted, you cannot make changes.';
        Utils.confirmAction(confirmMessage, async () => {
            await this.handleSave(false);
        });
    }

    extractFormData() {
        const formData = {};
        const form = document.querySelector('form') || document.querySelector('.main-container');
        
        if (form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.name || input.id) {
                    const key = input.name || input.id;
                    if (input.type === 'checkbox') {
                        formData[key] = input.checked;
                    } else if (input.type === 'radio') {
                        if (input.checked) {
                            formData[key] = input.value;
                        }
                    } else {
                        formData[key] = input.value;
                    }
                }
            });
        }

        return formData;
    }

    validateForm() {
        const formData = this.extractFormData();
        const errors = this.applicationService.validateApplicationData(formData);
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        if (field.hasAttribute('required') && !value) {
            isValid = false;
            message = 'This field is required';
        } else if (field.type === 'email' && value && !Utils.validateEmail(value)) {
            isValid = false;
            message = 'Please enter a valid email address';
        } 
        else if ((field.name === 'citizenId' || field.id === 'citizenNumber') && value) {
            isValid = Utils.validateCNIC(value);
            message = isValid ? '' : 'Please enter a valid 13-digit CNIC';
        }

        this.showFieldValidation(field, isValid, message);
        return isValid;
    }

    validateCitizenId(citizenId) {
        return Utils.validateCNIC(citizenId);
    }

    showFieldValidation(field, isValid, message) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        if (!isValid && message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.style.cssText = `
                color: #dc3545;
                font-size: 12px;
                margin-top: 4px;
            `;
            errorDiv.textContent = message;
            field.parentNode.appendChild(errorDiv);
        }

        field.style.borderColor = isValid ? '' : '#dc3545';
    }

    setFieldValue(fieldName, value) {
        const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (field && value) {
            field.value = value;
        }
    }

    markFieldAsVerified(fieldName, message) {
        const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (field) {
            field.style.borderColor = '#28a745';
            field.style.backgroundColor = '#f8fff9';
            
            const verifiedIcon = document.createElement('span');
            verifiedIcon.innerHTML = '✅';
            verifiedIcon.title = message;
            verifiedIcon.style.cssText = `
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 16px;
            `;
            
            if (field.parentNode.style.position !== 'relative') {
                field.parentNode.style.position = 'relative';
            }
            
            const existingIcon = field.parentNode.querySelector('.verified-icon');
            if (existingIcon) {
                existingIcon.remove();
            }
            
            verifiedIcon.className = 'verified-icon';
            field.parentNode.appendChild(verifiedIcon);
        }
    }

    getCitizenId() {
        const citizenField = document.querySelector('#citizenNumber, #citizenId, [name="citizenId"]');
        return citizenField ? citizenField.value.replace(/\D/g, '') : '';
    }

    getPassportNumber() {
        const passportField = document.querySelector('#passportNumber, [name="passportNumber"]');
        return passportField ? passportField.value.trim() : '';
    }

    async loadApplicationIfEditing() {
        const urlParams = Utils.parseURLParams();
        if (urlParams.id) {
            this.currentApplicationId = urlParams.id;
            this.isEditMode = true;
            await this.loadApplication(urlParams.id);
        }
    }

    async loadApplication(applicationId) {
        const container = document.querySelector('.main-container') || document.body;
        const loadingOverlay = Utils.showLoading(container, 'Loading application...');

        try {
            const application = await this.applicationService.getApplication(applicationId);
            this.populateFormFromApplication(application);
            Utils.showNotification('Application loaded successfully', 'success');
        } catch (error) {
            console.error('Load application error:', error);
            Utils.showNotification(`Failed to load application: ${error.message}`, 'error');
        } finally {
            Utils.hideLoading(container);
        }
    }

    populateFormFromApplication(application) {
        const form = document.querySelector('form') || document.querySelector('.main-container');
        if (form) {
            this.applicationService.populateForm(form, application);
        }
    }

    updateUIAfterSave(application) {
        if (application.status === 'SUBMITTED') {
            this.showSubmissionConfirmation(application);
        }

        this.updatePageTitle(application);
        this.updateFormButtons(application);
    }

    showSubmissionConfirmation(application) {
        const message = `
            <p>Your application has been submitted successfully!</p>
            <p><strong>Application ID:</strong> ${application.id}</p>
            <p><strong>Status:</strong> ${application.status}</p>
            <p>You will receive updates on your application status via email.</p>
        `;

        Utils.createModal('Application Submitted', message, [
            { text: 'OK', primary: true },
            { text: 'View Application', callback: () => this.viewApplication(application.id) }
        ]);
    }

    updatePageTitle(application) {
        const titleElement = document.querySelector('title');
        if (titleElement && application.id) {
            titleElement.textContent = `Application ${application.id} - Emergency Travel Document`;
        }
    }

    updateFormButtons(application) {
        if (application.status === 'SUBMITTED') {
            const submitButtons = document.querySelectorAll('[data-action="submit"], .submit-btn, #submitBtn');
            submitButtons.forEach(button => {
                button.disabled = true;
                button.textContent = 'Already Submitted';
                button.style.opacity = '0.6';
            });
        }
    }

    setupNavigation() {
        if (!this.authService.requireAuth()) {
            return;
        }

        this.addLogoutButton();
        this.addDashboardLink();
    }

    addLogoutButton() {
        const logoutButton = document.createElement('button');
        logoutButton.textContent = 'Logout';
        logoutButton.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 8px 16px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 16px;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            z-index: 1000;
        `;

        logoutButton.addEventListener('click', () => {
            this.authService.logout();
        });

        document.body.appendChild(logoutButton);
    }

    addDashboardLink() {
        const dashboardLink = document.createElement('a');
        dashboardLink.textContent = '🏠 Dashboard';
        dashboardLink.href = this.getDashboardUrl();
        dashboardLink.style.cssText = `
            position: absolute;
            top: 20px;
            right: 100px;
            padding: 8px 16px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 16px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 4px;
        `;

        document.body.appendChild(dashboardLink);
    }

    getDashboardUrl() {
        const user = this.authService.getCurrentUser();
        const dashboards = {
            'ADMIN': '/src/pages/dashboards/HQdashboard.html',
            'MINISTRY': '/src/pages/dashboards/FMdashboard.html',
            'AGENCY': '/src/pages/dashboards/AgencyDashboard.html',
            'MISSION_OPERATOR': '/src/pages/dashboards/AgencyDashboard.html'
        };

        return dashboards[user?.role] || '/src/pages/dashboards/AgencyDashboard.html';
    }

    viewApplication(applicationId) {
        window.location.href = `/src/pages/views/application-view.html?id=${applicationId}`;
    }

    goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = this.getDashboardUrl();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.main-container') || document.querySelector('form')) {
        new IntegratedFormHandler();
    }
});