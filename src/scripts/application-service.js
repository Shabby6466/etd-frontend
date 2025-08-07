class ApplicationService {
    constructor() {
        this.apiService = window.backendApiService || new BackendApiService();
    }

    async createApplication(formData) {
        try {
            const applicationData = this.prepareApplicationData(formData);
            return await this.apiService.createApplication(applicationData);
        } catch (error) {
            console.error('Create application error:', error);
            throw error;
        }
    }

    async updateApplication(id, formData) {
        try {
            const applicationData = this.prepareApplicationData(formData);
            return await this.apiService.updateApplication(id, applicationData);
        } catch (error) {
            console.error('Update application error:', error);
            throw error;
        }
    }

    async getApplication(id) {
        try {
            return await this.apiService.getApplicationById(id);
        } catch (error) {
            console.error('Get application error:', error);
            throw error;
        }
    }

    async getAllApplications(filters = {}) {
        try {
            return await this.apiService.getAllApplications(filters);
        } catch (error) {
            console.error('Get all applications error:', error);
            throw error;
        }
    }

    async approveApplication(id) {
        try {
            return await this.apiService.reviewApplication(id, true);
        } catch (error) {
            console.error('Approve application error:', error);
            throw error;
        }
    }

    async rejectApplication(id) {
        try {
            return await this.apiService.reviewApplication(id, false);
        } catch (error) {
            console.error('Reject application error:', error);
            throw error;
        }
    }

    prepareApplicationData(formData) {
        const applicationData = {};
        
        const fieldMapping = {
            'firstName': 'first_name',
            'lastName': 'last_name',
            'fatherName': 'father_name',
            'motherName': 'mother_name',
            'citizenId': 'citizen_id',
            'citizenNumber': 'citizen_id',
            'pakistanCity': 'pakistan_city',
            'dateOfBirth': 'date_of_birth',
            'birthCountry': 'birth_country',
            'birthCity': 'birth_city',
            'profession': 'profession',
            'pakistanAddress': 'pakistan_address',
            'height': 'height',
            'colorOfHair': 'color_of_hair',
            'colorOfEyes': 'color_of_eyes',
            'departureDate': 'departure_date',
            'transportMode': 'transport_mode',
            'investor': 'investor',
            'requestedBy': 'requested_by',
            'reasonForDeport': 'reason_for_deport',
            'amount': 'amount',
            'currency': 'currency',
            'isFiaBlacklist': 'is_fia_blacklist',
            'status': 'status'
        };

        if (formData instanceof FormData) {
            for (const [key, value] of formData.entries()) {
                const apiField = fieldMapping[key] || key;
                applicationData[apiField] = this.convertValue(key, value);
            }
        } else if (typeof formData === 'object') {
            for (const [key, value] of Object.entries(formData)) {
                const apiField = fieldMapping[key] || key;
                applicationData[apiField] = this.convertValue(key, value);
            }
        }

        if (!applicationData.status) {
            applicationData.status = 'DRAFT';
        }

        return applicationData;
    }

    convertValue(field, value) {
        if (field === 'height' || field === 'amount') {
            return parseFloat(value) || 0;
        }
        
        if (field === 'investor' || field === 'isFiaBlacklist') {
            return value === 'true' || value === true;
        }
        
        if (field === 'dateOfBirth' || field === 'departureDate') {
            return value ? new Date(value).toISOString().split('T')[0] : null;
        }
        
        return value || '';
    }

    extractFormData(form) {
        const formData = {};
        const formElements = form.elements;
        
        for (let element of formElements) {
            if (element.name && element.value !== '') {
                formData[element.name] = element.value;
            }
        }
        
        return formData;
    }

    populateForm(form, applicationData) {
        const reverseFieldMapping = {
            'first_name': 'firstName',
            'last_name': 'lastName',
            'father_name': 'fatherName',
            'mother_name': 'motherName',
            'citizen_id': 'citizenNumber',
            'pakistan_city': 'pakistanCity',
            'date_of_birth': 'dateOfBirth',
            'birth_country': 'birthCountry',
            'birth_city': 'birthCity',
            'profession': 'profession',
            'pakistan_address': 'pakistanAddress',
            'height': 'height',
            'color_of_hair': 'colorOfHair',
            'color_of_eyes': 'colorOfEyes',
            'departure_date': 'departureDate',
            'transport_mode': 'transportMode',
            'investor': 'investor',
            'requested_by': 'requestedBy',
            'reason_for_deport': 'reasonForDeport',
            'amount': 'amount',
            'currency': 'currency',
            'is_fia_blacklist': 'isFiaBlacklist'
        };

        for (const [apiField, value] of Object.entries(applicationData)) {
            const formField = reverseFieldMapping[apiField] || apiField;
            const element = form.elements[formField];
            
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = Boolean(value);
                } else if (element.type === 'radio') {
                    const radioButton = form.querySelector(`input[name="${formField}"][value="${value}"]`);
                    if (radioButton) radioButton.checked = true;
                } else {
                    element.value = value || '';
                }
            }
        }
    }

    validateApplicationData(data) {
        const errors = [];
        const required = ['first_name', 'last_name', 'citizen_id'];
        
        for (const field of required) {
            if (!data[field] || data[field].toString().trim() === '') {
                errors.push(`${field.replace('_', ' ')} is required`);
            }
        }

        if (data.citizen_id && !/^\d{12}$/.test(data.citizen_id.toString())) {
            errors.push('Citizen ID must be a 12-digit number');
        }

        if (data.date_of_birth && new Date(data.date_of_birth) > new Date()) {
            errors.push('Date of birth cannot be in the future');
        }

        return errors;
    }

    getStatusColor(status) {
        const statusColors = {
            'DRAFT': '#6c757d',
            'SUBMITTED': '#007bff',
            'UNDER_REVIEW': '#ffc107',
            'APPROVED': '#28a745',
            'REJECTED': '#dc3545',
            'COMPLETED': '#17a2b8'
        };
        
        return statusColors[status] || '#6c757d';
    }

    getStatusText(status) {
        const statusText = {
            'DRAFT': 'Draft',
            'SUBMITTED': 'Submitted',
            'UNDER_REVIEW': 'Under Review',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected',
            'COMPLETED': 'Completed'
        };
        
        return statusText[status] || status;
    }
}

const applicationService = new ApplicationService();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApplicationService;
} else {
    window.ApplicationService = ApplicationService;
    window.applicationService = applicationService;
}