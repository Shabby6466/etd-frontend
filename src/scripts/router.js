// ETD System Router - Emergency Travel Document Management - Handles all navigation flows
class ETDRouter {
    constructor() {
        this.currentUser = null;
        this.basePath = this.getBasePath();
        this.init();
    }

    // Get the base path for the application
    getBasePath() {
        const path = window.location.pathname;
        if (path.includes('/src/pages/')) {
            return path.substring(0, path.indexOf('/src/pages/'));
        }
        return '';
    }

    init() {
        // Store current page info
        this.currentPage = this.getCurrentPage();
        console.log('Router initialized for page:', this.currentPage);
        
        // Bind events based on current page
        this.bindPageEvents();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.substring(path.lastIndexOf('/') + 1);
        return page || 'index.html';
    }

    // Navigation methods with updated paths
    navigateTo(page) {
        console.log('Navigating to:', page);
        
        // Map logical page names to actual file paths
        const pageMap = {
            // Auth pages
            'login.html': `${this.basePath}/src/pages/auth/login.html`,
            'index.html': `${this.basePath}/index.html`,
            
            // Dashboard pages
            'FMdashboard.html': `${this.basePath}/src/pages/dashboards/FMdashboard.html`,
            'HQdashboard.html': `${this.basePath}/src/pages/dashboards/HQdashboard.html`,
            'AgencyDashboard.html': `${this.basePath}/src/pages/dashboards/AgencyDashboard.html`,
            
            // Form pages
            'Citizen.html': `${this.basePath}/src/pages/forms/Citizen.html`,
            'Nadra-and-passport.html': `${this.basePath}/src/pages/forms/Nadra-and-passport.html`,
            'SB.html': `${this.basePath}/src/pages/forms/SB.html`,
            
            // View pages
            'AgencyView.html': `${this.basePath}/src/pages/views/AgencyView.html`,
            'HQview.html': `${this.basePath}/src/pages/views/HQview.html`,
            'ETDdataviewApproved.html': `${this.basePath}/src/pages/views/ETDdataviewApproved.html`,
            'ETDdataViewNotApproved.html': `${this.basePath}/src/pages/views/ETDdataViewNotApproved.html`,
            'ETD-remarks2.html': `${this.basePath}/src/pages/views/ETD-remarks2.html`
        };
        
        const targetPath = pageMap[page] || page;
        window.location.href = targetPath;
    }

    // Login flow
    handleLogin(username, password, locationId = 'fm') {
        // Call the auth login function
        return login(username, password, locationId)
            .then(() => {
                // Store user info
                this.currentUser = username.toLowerCase();
                localStorage.setItem('etd_user', this.currentUser);
                
                // Always navigate to FM dashboard regardless of location
                this.navigateTo('FMdashboard.html');
                return true;
            })
            .catch(error => {
                console.error('Login failed:', error);
                return false;
            });
    }

    // Check authentication
    checkAuth() {
        const user = localStorage.getItem('etd_user');
        if (!user && this.currentPage !== 'login.html' && this.currentPage !== 'index.html') {
            this.navigateTo('login.html');
            return false;
        }
        this.currentUser = user;
        return true;
    }

    // Logout
    logout() {
        localStorage.removeItem('etd_user');
        this.navigateTo('login.html');
    }

    // FM Dashboard flows
    handleFMDashboardView(status) {
        // Route based on verification status
        if (status === 'In progress' || status === 'in progress') {
            this.navigateTo('ETDdataViewNotApproved.html');
        } else if (status === 'Approved' || status === 'approved' || status === 'Completed' || status === 'completed') {
            this.navigateTo('ETDdataviewApproved.html');
        } else {
            // Default to not approved
            this.navigateTo('ETDdataViewNotApproved.html');
        }
    }

    

    handleFMNewForm() {
        this.navigateTo('Citizen.html');
    }

    // ETD flows
    handleETDApprovedPrint() {
        this.navigateTo('ETD-remarks2.html');
    }

    handleQCFailed() {
        this.navigateTo('ETDdataviewApproved.html');
    }

    handleQCPassed() {
        this.navigateTo('FMdashboard.html');
    }

    // Citizen flow
    handleCitizenSubmit() {
        this.navigateTo('Nadra-and-passport.html');
    }

    handlePrintToken() {
        this.navigateTo('FMdashboard.html');
    }

    // HQ flows
    handleHQDashboardView() {
        this.navigateTo('HQview.html');
    }

    handleSendForVerification() {
        this.navigateTo('SB.html');
    }

    // Agency flows
    handleAgencyDashboardView() {
        this.navigateTo('AgencyView.html');
    }

    handleAgencyViewSend() {
        this.navigateTo('AgencyDashboard.html');
    }

    // Bind events based on current page
    bindPageEvents() {
        // Check authentication first
        if (!this.checkAuth()) return;

        // Bind universal back button functionality for all pages
        this.bindUniversalBackButtons();

        switch(this.currentPage) {
            case 'login.html':
                this.bindLoginEvents();
                break;
            case 'FMdashboard.html':
                this.bindFMDashboardEvents();
                break;
            case 'HQdashboard.html':
                this.bindHQDashboardEvents();
                break;
            case 'AgencyDashboard.html':
                this.bindAgencyDashboardEvents();
                break;
            case 'ETDdataviewApproved.html':
                this.bindETDApprovedEvents();
                break;
            case 'ETDdataViewNotApproved.html':
                this.bindETDNotApprovedEvents();
                break;
            case 'ETD-remarks2.html':
                this.bindETDRemarksEvents();
                break;
            case 'Citizen.html':
                this.bindCitizenEvents();
                break;
            case 'Nadra-and-passport.html':
                this.bindNadraPassportEvents();
                break;
            case 'HQview.html':
                this.bindHQViewEvents();
                break;
            case 'AgencyView.html':
                this.bindAgencyViewEvents();
                break;
            case 'SB.html':
                this.bindSBEvents();
                break;
        }
    }

    // Event binding methods for each page
    bindLoginEvents() {
        const loginButton = document.querySelector('.login-button');
        const usernameInput = document.querySelector('input[type="text"]');
        const passwordInput = document.querySelector('input[type="password"]');

        // if (loginButton) {
        //     loginButton.addEventListener('click', (e) => {
        //         e.preventDefault();
        //         const username = usernameInput ? usernameInput.value : '';
        //         const password = passwordInput ? passwordInput.value : '';
                
        //         if (username && password) {
        //             this.handleLogin(username, password);
        //         } else {
        //             alert('Please enter both username and password');
        //         }
        //     });
        // }

        // Handle Enter key press
        if (usernameInput && passwordInput) {
            [usernameInput, passwordInput].forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        loginButton.click();
                    }
                });
            });
        }
    }

    bindFMDashboardEvents() {
        // Handle View buttons
        const viewButtons = document.querySelectorAll('.tag-gray');
        viewButtons.forEach(button => {
            if (button.textContent.trim() === 'View') {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Get status from the same row
                    const row = button.closest('.table-row');
                    const statusElement = row ? row.querySelector('.tag-red, .tag-green') : null;
                    const status = statusElement ? statusElement.textContent.trim() : 'In progress';
                    this.handleFMDashboardView(status);
                });
            }
        });

        // Handle New Form button
        const newFormButton = document.querySelector('.new-form-button');
        if (newFormButton) {
            newFormButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleFMNewForm();
            });
        }

        // Add logout functionality to user profile
        this.addLogoutFunctionality();
    }

    bindHQDashboardEvents() {
        // Handle View buttons
        const viewButtons = document.querySelectorAll('.tag-gray');
        viewButtons.forEach(button => {
            if (button.textContent.trim() === 'View') {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleHQDashboardView();
                });
            }
        });

        this.addLogoutFunctionality();
    }

    bindAgencyDashboardEvents() {
        // Handle View buttons
        const viewButtons = document.querySelectorAll('.tag-gray');
        viewButtons.forEach(button => {
            if (button.textContent.trim() === 'View') {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleAgencyDashboardView();
                });
            }
        });

        this.addLogoutFunctionality();
    }

    bindETDApprovedEvents() {
        // Handle Print button
        const printButton = document.querySelector('#print-button');
        if (printButton) {
            printButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleETDApprovedPrint();
            });
        }

        // Handle Back button
        const backButton = document.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo('FMdashboard.html');
            });
        }
    }

    bindETDRemarksEvents() {
        // Handle QC Failed button
        const qcFailedButton = document.querySelector('.qc-failed');
        if (qcFailedButton) {
            qcFailedButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleQCFailed();
            });
        }

        // Handle QC Passed button
        const qcPassedButton = document.querySelector('.qc-passed');
        if (qcPassedButton) {
            qcPassedButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleQCPassed();
            });
        }
    }

    bindCitizenEvents() {
        // Handle Save button (or main action button)
        const saveButton = document.querySelector('.btn.save');
        if (saveButton) {
            saveButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCitizenSubmit();
            });
        }

        // Handle Get Data button if it should also proceed
        const getDataButton = document.querySelector('.btn.get-data');
        if (getDataButton) {
            getDataButton.addEventListener('click', (e) => {
                // Let it do its original function first, then proceed
                setTimeout(() => {
                    this.handleCitizenSubmit();
                }, 500);
            });
        }
    }

    bindNadraPassportEvents() {
        // Handle Print Token button
        const printTokenButton = document.querySelector('.button.primary');
        if (printTokenButton && printTokenButton.textContent.includes('PRINT TOKEN')) {
            printTokenButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePrintToken();
            });
        }
    }

    bindHQViewEvents() {
        // Handle Send for Verification button specifically
        const sendVerificationButton = document.querySelector('.send-verification-btn');
        if (sendVerificationButton) {
            sendVerificationButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSendForVerification();
            });
        }

        // Only handle buttons that specifically contain "verification" in their text
        const buttons = document.querySelectorAll('.button');
        buttons.forEach(button => {
            const text = button.textContent.trim().toLowerCase();
            if (text.includes('verification')) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleSendForVerification();
                });
            }
        });
    }

    bindAgencyViewEvents() {
        // Handle Send button (Verified/Not Verified buttons)
        const verifiedButton = document.querySelector('.send-printing-btn');
        const notVerifiedButton = document.querySelector('.defer-btn');

        if (verifiedButton) {
            verifiedButton.addEventListener('click', (e) => {
                // Don't prevent default, let popup work
                // Add listener to form submission to navigate back
                this.addAgencyPopupHandler();
            });
        }

        if (notVerifiedButton) {
            notVerifiedButton.addEventListener('click', (e) => {
                // Don't prevent default, let popup work
                // Add listener to form submission to navigate back
                this.addAgencyPopupHandler();
            });
        }
    }

    addAgencyPopupHandler() {
        // Wait for popup to be created and add handler to submit button
        setTimeout(() => {
            const submitButton = document.querySelector('#submit-button');
            if (submitButton) {
                submitButton.addEventListener('click', () => {
                    // After form submission, navigate back
                    setTimeout(() => {
                        this.handleAgencyViewSend();
                    }, 1500);
                });
            }
        }, 100);
    }

    addLogoutFunctionality() {
        // Add logout to user profile dropdown
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            userProfile.addEventListener('click', () => {
                if (confirm('Do you want to logout?')) {
                    this.logout();
                }
            });
        }
    }

    bindETDNotApprovedEvents() {
        // Handle any specific events for ETD not approved page
        // Go back button is handled by universal back button handler
    }

    bindSBEvents() {
        // Handle any specific events for SB page
        // Go back button is handled by universal back button handler
    }

    // Enhanced back button functionality
    goBack() {
        // Define the navigation hierarchy for back button functionality
        const backRoutes = {
            // Auth flow
            'login.html': 'index.html',
            
            // Dashboard flows
            'FMdashboard.html': 'login.html',
            'HQdashboard.html': 'login.html', 
            'AgencyDashboard.html': 'login.html',
            
            // Form flows - go back to appropriate dashboard
            'Citizen.html': 'FMdashboard.html',
            'Nadra-and-passport.html': 'Citizen.html',
            'SB.html': 'HQdashboard.html',
            
            // View flows - go back to appropriate dashboard
            'AgencyView.html': 'AgencyDashboard.html',
            'HQview.html': 'HQdashboard.html',
            'ETDdataviewApproved.html': 'FMdashboard.html',
            'ETDdataViewNotApproved.html': 'FMdashboard.html',
            'ETD-remarks2.html': 'ETDdataviewApproved.html'
        };
        
        const targetPage = backRoutes[this.currentPage];
        if (targetPage) {
            this.navigateTo(targetPage);
        } else {
            // Fallback to browser history
            window.history.back();
        }
    }

    // Utility method to add back buttons where needed
    addBackButton(targetPage, container = 'body') {
        const backButtonHTML = `
            <button class="back-btn" style="
                position: fixed;
                top: 20px;
                left: 20px;
                padding: 8px 16px;
                background: #525EB1;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 4px;
            ">← Back</button>
        `;
        
        document.querySelector(container).insertAdjacentHTML('afterbegin', backButtonHTML);
        
        document.querySelector('.back-btn').addEventListener('click', () => {
            if (targetPage) {
                this.navigateTo(targetPage);
            } else {
                this.goBack();
            }
        });
    }

    // Add universal back button handler for existing back buttons
    bindUniversalBackButtons() {
        // Handle existing back buttons with various selectors
        const backButtonSelectors = [
            '.back-button',
            '.btn-secondary', // Go Back buttons in forms
            '.go-back-btn'
        ];
        
        backButtonSelectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(button => {
                // Check if it's a go back button based on text content
                const text = button.textContent.trim().toLowerCase();
                if (text.includes('back') || text.includes('go back')) {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.goBack();
                    });
                }
            });
        });
    }
}

// Initialize router when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.etdRouter = new ETDRouter();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.etdRouter = new ETDRouter();
    });
} else {
    window.etdRouter = new ETDRouter();
} 