class LoginHandler {
    constructor() {
        this.authService = window.authService;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkExistingSession();
    }

    bindEvents() {
        const loginButton = document.getElementById('loginButton');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        if (loginButton) {
            loginButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        [usernameInput, passwordInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.handleLogin();
                    }
                });
            }
        });

        const loginForm = document.querySelector('.login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!this.validateInput(username, password)) {
            return;
        }

        this.setLoading(true);
        this.clearMessages();

        try {
            const result = await this.authService.login(username, password);
            
            if (result.success) {
                this.showSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    this.redirectToDashboard(result.user);
                }, 1500);
            } else {
                this.showError(result.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please check your credentials and try again.');
        } finally {
            this.setLoading(false);
        }
    }

    validateInput(username, password) {
        if (!username) {
            this.showError('Please enter your username');
            return false;
        }

        if (!password) {
            this.showError('Please enter your password');
            return false;
        }

        if (!this.isValidEmail(username)) {
            this.showError('Please enter a valid email address');
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setLoading(loading) {
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            if (loading) {
                loginButton.innerHTML = 'Logging in...';
                loginButton.disabled = true;
                loginButton.style.opacity = '0.7';
            } else {
                loginButton.innerHTML = 'Log in';
                loginButton.disabled = false;
                loginButton.style.opacity = '1';
            }
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        this.clearMessages();

        const messageDiv = document.createElement('div');
        messageDiv.className = `login-message ${type}`;
        messageDiv.style.cssText = `
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            font-size: 14px;
            text-align: center;
            ${type === 'error' ? 
                'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' :
                'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;'
            }
        `;
        messageDiv.textContent = message;

        const formFields = document.querySelector('.form-fields');
        if (formFields) {
            formFields.appendChild(messageDiv);
        }

        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    clearMessages() {
        const existingMessages = document.querySelectorAll('.login-message');
        existingMessages.forEach(msg => msg.remove());
    }

    redirectToDashboard(user) {
        const dashboards = {
            'ADMIN': '../dashboards/HQdashboard.html',
            'MINISTRY': '../dashboards/FMdashboard.html',
            'AGENCY': '../dashboards/AgencyDashboard.html',
            'MISSION_OPERATOR': '../dashboards/AgencyDashboard.html'
        };

        const dashboardUrl = dashboards[user.role];
        if (dashboardUrl) {
            window.location.href = dashboardUrl;
        } else {
            console.error('Unknown user role:', user.role);
            this.showError('Unknown user role. Please contact administrator.');
        }
    }

    checkExistingSession() {
        if (this.authService.isAuthenticated()) {
            const user = this.authService.getCurrentUser();
            if (user) {
                this.showSuccess('You are already logged in. Redirecting...');
                setTimeout(() => {
                    this.redirectToDashboard(user);
                }, 1000);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoginHandler();
});