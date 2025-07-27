// ETD System Application Configuration
const AppConfig = {
    // Environment settings
    environment: {
        production: {
            apiUrl: '/api/v1',
            baseUrl: '',
            debugMode: false,
            logLevel: 'error',
            cacheEnabled: true,
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            allowedOrigins: ['https://etd.gov.pk', 'https://etd-system.gov.pk']
        },
        staging: {
            apiUrl: '/api/v1',
            baseUrl: '',
            debugMode: true,
            logLevel: 'info',
            cacheEnabled: false,
            sessionTimeout: 60 * 60 * 1000, // 60 minutes
            allowedOrigins: ['https://staging-etd.gov.pk', 'http://localhost:8080']
        },
        development: {
            apiUrl: '/api/v1',
            baseUrl: '',
            debugMode: true,
            logLevel: 'debug',
            cacheEnabled: false,
            sessionTimeout: 120 * 60 * 1000, // 120 minutes
            allowedOrigins: ['*']
        }
    },

    // Application settings
    app: {
        name: 'ETD System',
        version: '1.0.0',
        title: 'Emergency Travel Document Management System',
        description: 'Government Emergency Travel Document Processing System',
        author: 'Government Agency',
        
        // Default user roles and permissions
        userRoles: {
            fm: {
                name: 'Foreign Ministry',
                permissions: ['view_dashboard', 'create_form', 'view_etd_data', 'print_token'],
                redirectPage: '/src/pages/dashboards/FMdashboard.html'
            },
            hq: {
                name: 'Headquarters',
                permissions: ['view_dashboard', 'view_details', 'send_verification'],
                redirectPage: '/src/pages/dashboards/HQdashboard.html'
            },
            agency: {
                name: 'Processing Agency',
                permissions: ['view_dashboard', 'verify_documents', 'upload_files'],
                redirectPage: '/src/pages/dashboards/AgencyDashboard.html'
            }
        },

        // Security settings
        security: {
            maxLoginAttempts: 3,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            passwordMinLength: 6,
            enableBruteForceProtection: true,
            csrfProtection: true
        },

        // UI/UX settings
        ui: {
            theme: {
                primaryColor: '#525EB1',
                secondaryColor: '#E5EDFF',
                accentColor: '#FF3E41',
                successColor: '#28a745',
                warningColor: '#ffc107',
                errorColor: '#dc3545'
            },
            animations: {
                enabled: true,
                duration: 300
            },
            responsiveBreakpoints: {
                mobile: '768px',
                tablet: '1024px',
                desktop: '1440px'
            }
        },

        // Feature flags
        features: {
            enableFileUpload: true,
            enableNotifications: true,
            enableDarkMode: false,
            enableAnalytics: false,
            enableCache: true,
            enableOfflineMode: false
        }
    },

    // Paths configuration
    paths: {
        pages: {
            auth: '/src/pages/auth/',
            dashboards: '/src/pages/dashboards/',
            forms: '/src/pages/forms/',
            views: '/src/pages/views/'
        },
        assets: {
            images: '/public/assets/',
            icons: '/public/assets/svgs/',
            styles: '/src/styles/',
            scripts: '/src/scripts/'
        },
        api: {
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            documents: '/api/v1/documents',
            uploads: '/api/v1/uploads'
        }
    },

    // File upload settings
    uploads: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
        allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
    },

    // Validation rules
    validation: {
        cnic: {
            pattern: /^\d{5}-\d{7}-\d{1}$/,
            message: 'CNIC must be in format: 12345-1234567-1'
        },
        passport: {
            pattern: /^[A-Z]{1,2}\d{6,9}$/,
            message: 'Invalid passport number format'
        },
        trackingId: {
            pattern: /^\d{6}[A-Z]$/,
            message: 'Tracking ID must be 6 digits followed by a letter'
        }
    }
};

// Get current environment configuration
function getCurrentConfig() {
    const env = window.location.hostname === 'localhost' ? 'development' :
               window.location.hostname.includes('staging') ? 'staging' : 'production';
    
    return {
        ...AppConfig.app,
        ...AppConfig.environment[env],
        paths: AppConfig.paths,
        uploads: AppConfig.uploads,
        validation: AppConfig.validation,
        environment: env
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppConfig, getCurrentConfig };
} else {
    window.AppConfig = AppConfig;
    window.getCurrentConfig = getCurrentConfig;
} 