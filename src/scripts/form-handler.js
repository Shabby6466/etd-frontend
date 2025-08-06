import apiService from './api-service.js';

class FormHandler {
    constructor() {
        this.isProcessing = false;
        this.loadConfig();
    }

    loadConfig() {
        this.config = window.getApiCredentials ? window.getApiCredentials() : { USE_SIMULATION: true };
    }

    showLoadingState(button, originalText) {
        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <span class="loading-spinner" style="
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid #ffffff40;
                    border-top: 2px solid #ffffff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-right: 8px;
                "></span>
                Processing...
            `;
        }

        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        if (!document.querySelector('style[data-spinner]')) {
            style.setAttribute('data-spinner', 'true');
            document.head.appendChild(style);
        }
    }

    hideLoadingState(button, originalText) {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

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

    validateCitizenId(citizenId) {
        const cleanId = citizenId.replace(/[-\s]/g, '');
        
        if (cleanId.length !== 13) {
            return { valid: false, message: 'Citizen ID must be 13 digits' };
        }
        
        if (!/^\d{13}$/.test(cleanId)) {
            return { valid: false, message: 'Citizen ID must contain only digits' };
        }
        
        return { valid: true, formatted: cleanId };
    }

    validatePassportNumber(passportNumber) {
        if (!passportNumber) {
            return { valid: true, formatted: null };
        }
        
        const cleanPassport = passportNumber.trim().toUpperCase();
        
        if (!/^[A-Z]{1,2}\d{6,9}$/.test(cleanPassport)) {
            return { valid: false, message: 'Invalid passport number format' };
        }
        
        return { valid: true, formatted: cleanPassport };
    }

    async handleGetDataClick(event) {
        if (this.isProcessing) {
            return;
        }

        const button = event.target;
        const originalText = button.innerHTML;

        try {
            this.isProcessing = true;
            this.showLoadingState(button, originalText);

            const citizenIdInput = document.querySelector('input[name="citizen_id"], input[placeholder*="citizen"], input[placeholder*="CNIC"]');
            const passportInput = document.querySelector('input[name="passport_number"], input[placeholder*="passport"]');

            if (!citizenIdInput) {
                throw new Error('Citizen ID input field not found');
            }

            const citizenId = citizenIdInput.value.trim();
            const passportNumber = passportInput ? passportInput.value.trim() : '';

            const citizenValidation = this.validateCitizenId(citizenId);
            if (!citizenValidation.valid) {
                throw new Error(citizenValidation.message);
            }

            const passportValidation = this.validatePassportNumber(passportNumber);
            if (!passportValidation.valid) {
                throw new Error(passportValidation.message);
            }

            let nadraData, passportData;

            if (this.config.USE_SIMULATION) {
                this.showNotification('Using simulation mode for API calls', 'info');
                
                const promises = [apiService.simulateNadraApiCall(citizenValidation.formatted)];
                
                if (passportValidation.formatted) {
                    promises.push(apiService.simulatePassportApiCall(citizenValidation.formatted, passportValidation.formatted));
                }

                const results = await Promise.all(promises);
                nadraData = results[0];
                passportData = results[1] || null;
            } else {
                const results = await apiService.fetchThirdPartyData(
                    citizenValidation.formatted, 
                    passportValidation.formatted
                );
                nadraData = results.nadra;
                passportData = results.passport;
            }

            this.populateFormFields(nadraData, passportData);
            this.showNotification('Data retrieved successfully!', 'success');

        } catch (error) {
            console.error('Error fetching data:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.hideLoadingState(button, originalText);
        }
    }

    populateFormFields(nadraData, passportData = null) {
        const fieldMappings = {
            first_name: ['input[name="first_name"]', 'input[placeholder*="first name"]', 'input[placeholder*="First Name"]'],
            last_name: ['input[name="last_name"]', 'input[placeholder*="last name"]', 'input[placeholder*="Last Name"]'],
            father_name: ['input[name="father_name"]', 'input[placeholder*="father"]', 'input[placeholder*="Father"]'],
            mother_name: ['input[name="mother_name"]', 'input[placeholder*="mother"]', 'input[placeholder*="Mother"]'],
            date_of_birth: ['input[name="date_of_birth"]', 'input[type="date"]', 'input[placeholder*="birth"]'],
            profession: ['input[name="profession"]', 'input[placeholder*="profession"]', 'input[placeholder*="occupation"]'],
            pakistan_address: ['textarea[name="address"]', 'input[name="address"]', 'textarea[placeholder*="address"]', 'input[placeholder*="address"]'],
            pakistan_city: ['input[name="city"]', 'input[placeholder*="city"]', 'select[name="city"]'],
            birth_country: ['input[name="birth_country"]', 'select[name="birth_country"]', 'input[placeholder*="country"]'],
            birth_city: ['input[name="birth_city"]', 'input[placeholder*="birth city"]']
        };

        const dataToUse = nadraData.status === 'SUCCESS' ? nadraData.data : {};

        Object.entries(fieldMappings).forEach(([fieldName, selectors]) => {
            const value = dataToUse[fieldName];
            if (value) {
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        if (element.type === 'date' && fieldName === 'date_of_birth') {
                            element.value = value;
                        } else {
                            element.value = value;
                        }
                        
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        break;
                    }
                }
            }
        });

        if (passportData && passportData.status === 'SUCCESS') {
            const passportMappings = {
                passport_status: ['input[name="passport_status"]', 'select[name="passport_status"]'],
                issue_date: ['input[name="issue_date"]', 'input[type="date"][name*="issue"]'],
                expiry_date: ['input[name="expiry_date"]', 'input[type="date"][name*="expiry"]'],
                issuing_authority: ['input[name="issuing_authority"]', 'input[placeholder*="authority"]']
            };

            Object.entries(passportMappings).forEach(([fieldName, selectors]) => {
                const value = passportData.data[fieldName];
                if (value) {
                    for (const selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element) {
                            element.value = value;
                            element.dispatchEvent(new Event('input', { bubbles: true }));
                            element.dispatchEvent(new Event('change', { bubbles: true }));
                            break;
                        }
                    }
                }
            });
        }

        this.storeResponseData(nadraData, passportData);
    }

    storeResponseData(nadraData, passportData) {
        const responseData = {
            nadra: nadraData,
            passport: passportData,
            timestamp: new Date().toISOString()
        };

        sessionStorage.setItem('api_response_data', JSON.stringify(responseData));
        
        console.log('API Response Data stored:', responseData);
    }

    getStoredResponseData() {
        const stored = sessionStorage.getItem('api_response_data');
        return stored ? JSON.parse(stored) : null;
    }

    bindEvents() {
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            if (target.matches('.btn.get-data, .get-data-btn, [data-action="get-data"]') ||
                (target.textContent && target.textContent.toLowerCase().includes('get data'))) {
                event.preventDefault();
                this.handleGetDataClick(event);
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            this.initializeForm();
        });

        if (document.readyState !== 'loading') {
            this.initializeForm();
        }
    }

    initializeForm() {
        const getDataButtons = document.querySelectorAll('.btn.get-data, .get-data-btn, [data-action="get-data"]');
        getDataButtons.forEach(button => {
            if (!button.hasAttribute('data-handler-bound')) {
                button.setAttribute('data-handler-bound', 'true');
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.handleGetDataClick(event);
                });
            }
        });

        const genericButtons = document.querySelectorAll('button, .btn');
        genericButtons.forEach(button => {
            const text = button.textContent.toLowerCase().trim();
            if ((text.includes('get') && text.includes('data')) || text.includes('fetch') || text.includes('retrieve')) {
                if (!button.hasAttribute('data-handler-bound')) {
                    button.setAttribute('data-handler-bound', 'true');
                    button.addEventListener('click', (event) => {
                        event.preventDefault();
                        this.handleGetDataClick(event);
                    });
                }
            }
        });
    }
}

const formHandler = new FormHandler();
formHandler.bindEvents();

export default formHandler;
export { FormHandler };