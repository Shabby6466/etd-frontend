// Refactored Login Handler
import { login } from './auth-refactored.js';

class LoginHandler {
    constructor() {
        this.isProcessing = false;
        this.elements = {};
        this.config = {
            defaultRole: 'fm',
            loadingText: 'Logging in...',
            maxRetries: 3,
            retryDelay: 1000
        };
    }

    // Initialize login handler
    init() {
        this.bindElements();
        this.bindEvents();
        this.setupFormValidation();
        console.log('✅ Login handler initialized');
    }

    // Bind DOM elements
    bindElements() {
        this.elements = {
            loginButton: document.getElementById('loginButton'),
            usernameInput: document.getElementById('username'),
            passwordInput: document.getElementById('password'),
            roleSelect: document.getElementById('userRole'),
            loginForm: document.querySelector('.login-form') || document.querySelector('form')
        };

        // Verify required elements
        if (!this.elements.loginButton) {
            console.error('❌ Login button not found');
            return;
        }

        if (!this.elements.usernameInput || !this.elements.passwordInput) {
            console.error('❌ Username or password input not found');
            return;
        }

        // Set default role if role selector exists
        if (this.elements.roleSelect && !this.elements.roleSelect.value) {
            this.elements.roleSelect.value = this.config.defaultRole;
        }
    }

    // Bind event listeners
    bindEvents() {
        // Login button click
        if (this.elements.loginButton) {
            this.elements.loginButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Enter key press on inputs
        const inputs = [
            this.elements.usernameInput,
            this.elements.passwordInput,
            this.elements.roleSelect
        ].filter(el => el);

        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleLogin();
                }
            });
        });

        // Role selection change
        if (this.elements.roleSelect) {
            this.elements.roleSelect.addEventListener('change', (e) => {
                const selectedRole = e.target.value;
                console.log(`🔄 Role selected: ${selectedRole}`);
                this.updateUIForRole(selectedRole);
            });
        }

        // Form submission
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    // Setup form validation
    setupFormValidation() {
        // Real-time validation
        if (this.elements.usernameInput) {
            this.elements.usernameInput.addEventListener('input', () => {
                this.validateField('username');
            });
        }

        if (this.elements.passwordInput) {
            this.elements.passwordInput.addEventListener('input', () => {
                this.validateField('password');
            });
        }

        if (this.elements.roleSelect) {
            this.elements.roleSelect.addEventListener('change', () => {
                this.validateField('role');
            });
        }
    }

    // Validate individual fields
    validateField(fieldType) {
        let isValid = true;
        let errorMessage = '';

        switch (fieldType) {
            case 'username':
                const username = this.elements.usernameInput.value.trim();
                if (!username) {
                    isValid = false;
                    errorMessage = 'Username is required';
                } else if (username.length < 3) {
                    isValid = false;
                    errorMessage = 'Username must be at least 3 characters';
                }
                this.showFieldValidation(this.elements.usernameInput, isValid, errorMessage);
                break;

            case 'password':
                const password = this.elements.passwordInput.value;
                if (!password) {
                    isValid = false;
                    errorMessage = 'Password is required';
                } else if (password.length < 4) {
                    isValid = false;
                    errorMessage = 'Password must be at least 4 characters';
                }
                this.showFieldValidation(this.elements.passwordInput, isValid, errorMessage);
                break;

            case 'role':
                const role = this.elements.roleSelect?.value;
                if (!role) {
                    isValid = false;
                    errorMessage = 'Please select your role';
                }
                if (this.elements.roleSelect) {
                    this.showFieldValidation(this.elements.roleSelect, isValid, errorMessage);
                }
                break;
        }

        return isValid;
    }

    // Show field validation feedback
    showFieldValidation(element, isValid, errorMessage) {
        // Remove existing validation classes
        element.classList.remove('validation-error', 'validation-success');
        
        // Remove existing error message
        const existingError = element.parentNode.querySelector('.validation-message');
        if (existingError) {
            existingError.remove();
        }

        if (!isValid && errorMessage) {
            element.classList.add('validation-error');
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-message validation-error-message';
            errorDiv.textContent = errorMessage;
            errorDiv.style.cssText = `
                color: #dc3545;
                font-size: 12px;
                margin-top: 4px;
                font-family: 'Inter', sans-serif;
            `;
            
            element.parentNode.appendChild(errorDiv);
        } else if (isValid && element.value.trim()) {
            element.classList.add('validation-success');
        }
    }

    // Get login credentials from form
    getCredentials() {
        return {
            username: this.elements.usernameInput?.value.trim() || '',
            password: this.elements.passwordInput?.value || '',
            role: this.elements.roleSelect?.value || this.config.defaultRole
        };
    }

    // Validate all form fields
    validateForm() {
        const { username, password, role } = this.getCredentials();
        
        const errors = [];

        if (!username) {
            errors.push('Username is required');
        }

        if (!password) {
            errors.push('Password is required');
        }

        if (!role) {
            errors.push('Please select your role');
        }

        if (errors.length > 0) {
            this.showErrors(errors);
            return false;
        }

        return true;
    }

    // Show validation errors
    showErrors(errors) {
        const errorContainer = this.createErrorContainer();
        errorContainer.innerHTML = `
            <strong>Please fix the following errors:</strong>
            <ul>
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
        
        document.body.appendChild(errorContainer);
        
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.parentNode.removeChild(errorContainer);
            }
        }, 5000);
    }

    // Create error container
    createErrorContainer() {
        const container = document.createElement('div');
        container.className = 'login-error-container';
        container.style.cssText = `
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
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        return container;
    }

    // Handle login process
    async handleLogin() {
        if (this.isProcessing) {
            console.log('⏳ Login already in progress');
            return;
        }

        try {
            // Validate form
            if (!this.validateForm()) {
                return;
            }

            // Show loading state
            this.setLoadingState(true);
            
            const credentials = this.getCredentials();
            console.log(`🚀 Attempting login for ${credentials.username} with role ${credentials.role}`);

            // Perform login
            const result = await login(credentials.username, credentials.password, credentials.role);

            if (result.success) {
                console.log('✅ Login successful, redirecting...');
                this.showSuccessMessage(`Welcome ${credentials.username}! Redirecting to dashboard...`);
                
                // Login successful - user will be redirected by auth manager
                // No additional action needed here
            } else {
                throw new Error(result.error || 'Login failed');
            }

        } catch (error) {
            console.error('❌ Login failed:', error);
            this.showErrorMessage(error.message || 'Login failed. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Set loading state
    setLoadingState(loading) {
        this.isProcessing = loading;

        if (this.elements.loginButton) {
            if (loading) {
                this.elements.loginButton.disabled = true;
                this.elements.loginButton.textContent = this.config.loadingText;
                this.elements.loginButton.classList.add('loading');
            } else {
                this.elements.loginButton.disabled = false;
                this.elements.loginButton.textContent = 'Log in';
                this.elements.loginButton.classList.remove('loading');
            }
        }

        // Disable form inputs during login
        const inputs = [
            this.elements.usernameInput,
            this.elements.passwordInput,
            this.elements.roleSelect
        ].filter(el => el);

        inputs.forEach(input => {
            input.disabled = loading;
        });
    }

    // Show success message
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    // Show error message
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    // Show message
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `login-message login-message-${type}`;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };

        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            max-width: 400px;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        // Animate in
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, type === 'error' ? 6000 : 3000);
    }

    // Update UI based on selected role
    updateUIForRole(role) {
        const roleDescriptions = {
            fm: 'Foreign Ministry - Create and manage ETD applications',
            hq: 'Headquarters - Review and approve applications',
            agency: 'Processing Agency - Verify documents and process applications',
            admin: 'Administrator - Full system access and user management'
        };

        // Could add role description or UI changes here
        console.log(`Role info: ${roleDescriptions[role] || 'Unknown role'}`);
    }

    // Add loading styles
    addLoadingStyles() {
        if (document.querySelector('#login-loading-styles')) return;

        const style = document.createElement('style');
        style.id = 'login-loading-styles';
        style.textContent = `
            .login-button.loading {
                opacity: 0.7;
                cursor: not-allowed;
            }
            
            .validation-error {
                border-color: #dc3545 !important;
                box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
            }
            
            .validation-success {
                border-color: #28a745 !important;
                box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25) !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize login handler when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const loginHandler = new LoginHandler();
    loginHandler.init();
    loginHandler.addLoadingStyles();
    
    // Make globally available for debugging
    window.loginHandler = loginHandler;
});

export default LoginHandler;