class IntegrationTest {
    constructor() {
        this.results = [];
        this.testCount = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    async runAllTests() {
        console.log('🧪 Starting ETD Frontend API Integration Tests...\n');
        
        const testSuite = [
            { name: 'API Configuration Test', test: () => this.testApiConfiguration() },
            { name: 'Backend API Service Test', test: () => this.testBackendApiService() },
            { name: 'Authentication Service Test', test: () => this.testAuthService() },
            { name: 'Application Service Test', test: () => this.testApplicationService() },
            { name: 'Dashboard Service Test', test: () => this.testDashboardService() },
            { name: 'Utils Test', test: () => this.testUtils() },
            { name: 'Form Handler Integration Test', test: () => this.testFormHandlerIntegration() },
            { name: 'Dashboard Handler Integration Test', test: () => this.testDashboardHandlerIntegration() },
        ];

        for (const testCase of testSuite) {
            try {
                await this.runTest(testCase.name, testCase.test);
            } catch (error) {
                this.logTest(testCase.name, false, `Unexpected error: ${error.message}`);
            }
        }

        this.displayResults();
        return this.generateReport();
    }

    async runTest(testName, testFunction) {
        this.testCount++;
        console.log(`\n🔍 Running: ${testName}`);
        
        try {
            const result = await testFunction();
            if (result.success) {
                this.passedTests++;
                this.logTest(testName, true, result.message);
                console.log(`✅ PASSED: ${result.message}`);
            } else {
                this.failedTests++;
                this.logTest(testName, false, result.message);
                console.log(`❌ FAILED: ${result.message}`);
            }
        } catch (error) {
            this.failedTests++;
            this.logTest(testName, false, `Exception: ${error.message}`);
            console.log(`❌ ERROR: ${error.message}`);
        }
    }

    logTest(name, passed, message) {
        this.results.push({
            name,
            passed,
            message,
            timestamp: new Date().toISOString()
        });
    }

    testApiConfiguration() {
        if (!window.ApiConfig) {
            return { success: false, message: 'ApiConfig not loaded' };
        }

        if (!window.getCurrentApiConfig) {
            return { success: false, message: 'getCurrentApiConfig function not found' };
        }

        const config = getCurrentApiConfig();
        
        const requiredFields = ['NADRA_API_URL', 'PASSPORT_API_URL', 'ETD_API_URL'];
        const missingFields = requiredFields.filter(field => !config[field]);
        
        if (missingFields.length > 0) {
            return { success: false, message: `Missing config fields: ${missingFields.join(', ')}` };
        }

        return { success: true, message: 'API configuration loaded and contains required fields' };
    }

    testBackendApiService() {
        if (!window.BackendApiService) {
            return { success: false, message: 'BackendApiService class not loaded' };
        }

        if (!window.backendApiService) {
            return { success: false, message: 'backendApiService instance not found' };
        }

        const apiService = window.backendApiService;
        const requiredMethods = [
            'getBaseURL', 'getAuthToken', 'setAuthToken', 'removeAuthToken',
            'login', 'createUser', 'getAllUsers', 'getCurrentUserProfile',
            'createApplication', 'getAllApplications', 'getApplicationById',
            'updateApplication', 'reviewApplication', 'getAdminDashboardStats',
            'getAgencyApplications', 'getMinistryApplications', 'getMissionOperatorSummary'
        ];

        const missingMethods = requiredMethods.filter(method => typeof apiService[method] !== 'function');
        
        if (missingMethods.length > 0) {
            return { success: false, message: `Missing methods: ${missingMethods.join(', ')}` };
        }

        // Test base URL generation
        const baseURL = apiService.getBaseURL();
        if (!baseURL) {
            return { success: false, message: 'getBaseURL() returned empty value' };
        }

        return { success: true, message: 'BackendApiService loaded with all required methods' };
    }

    testAuthService() {
        if (!window.AuthService) {
            return { success: false, message: 'AuthService class not loaded' };
        }

        if (!window.authService) {
            return { success: false, message: 'authService instance not found' };
        }

        const authService = window.authService;
        const requiredMethods = [
            'login', 'logout', 'isAuthenticated', 'getCurrentUser',
            'getUserRole', 'hasPermission', 'requireAuth', 'requireRole',
            'redirectToDashboard', 'refreshUserProfile'
        ];

        const missingMethods = requiredMethods.filter(method => typeof authService[method] !== 'function');
        
        if (missingMethods.length > 0) {
            return { success: false, message: `Missing methods: ${missingMethods.join(', ')}` };
        }

        // Test permission checking
        const testRoles = ['ADMIN', 'MINISTRY', 'AGENCY', 'MISSION_OPERATOR'];
        const hasPermissionMethod = typeof authService.hasPermission === 'function';
        
        if (!hasPermissionMethod) {
            return { success: false, message: 'hasPermission method not working' };
        }

        return { success: true, message: 'AuthService loaded with all required methods' };
    }

    testApplicationService() {
        if (!window.ApplicationService) {
            return { success: false, message: 'ApplicationService class not loaded' };
        }

        if (!window.applicationService) {
            return { success: false, message: 'applicationService instance not found' };
        }

        const appService = window.applicationService;
        const requiredMethods = [
            'createApplication', 'updateApplication', 'getApplication',
            'getAllApplications', 'approveApplication', 'rejectApplication',
            'prepareApplicationData', 'validateApplicationData', 'populateForm'
        ];

        const missingMethods = requiredMethods.filter(method => typeof appService[method] !== 'function');
        
        if (missingMethods.length > 0) {
            return { success: false, message: `Missing methods: ${missingMethods.join(', ')}` };
        }

        // Test validation
        const testData = {
            first_name: 'Test',
            last_name: 'User',
            citizen_id: '1234567890123'
        };

        const validation = appService.validateApplicationData(testData);
        if (!Array.isArray(validation)) {
            return { success: false, message: 'validateApplicationData should return array' };
        }

        return { success: true, message: 'ApplicationService loaded with all required methods' };
    }

    testDashboardService() {
        if (!window.DashboardService) {
            return { success: false, message: 'DashboardService class not loaded' };
        }

        if (!window.dashboardService) {
            return { success: false, message: 'dashboardService instance not found' };
        }

        const dashService = window.dashboardService;
        const requiredMethods = [
            'getDashboardData', 'getAdminDashboard', 'getAgencyDashboard',
            'getMinistryDashboard', 'getMissionOperatorDashboard',
            'renderDashboardWidgets', 'createApplicationTable', 'refreshDashboard'
        ];

        const missingMethods = requiredMethods.filter(method => typeof dashService[method] !== 'function');
        
        if (missingMethods.length > 0) {
            return { success: false, message: `Missing methods: ${missingMethods.join(', ')}` };
        }

        return { success: true, message: 'DashboardService loaded with all required methods' };
    }

    testUtils() {
        if (!window.Utils) {
            return { success: false, message: 'Utils class not loaded' };
        }

        const requiredMethods = [
            'formatDate', 'formatDateTime', 'showNotification', 'showLoading',
            'hideLoading', 'validateCNIC', 'formatCNIC', 'validateEmail',
            'debounce', 'throttle', 'parseURLParams', 'updateURLParams',
            'createPagination', 'copyToClipboard', 'downloadFile', 'confirmAction',
            'createModal', 'closeModal'
        ];

        const missingMethods = requiredMethods.filter(method => typeof Utils[method] !== 'function');
        
        if (missingMethods.length > 0) {
            return { success: false, message: `Missing methods: ${missingMethods.join(', ')}` };
        }

        // Test CNIC validation
        const validCNIC = '61101-3082523-9';
        const invalidCNIC = '1234567890';
        
        if (!Utils.validateCNIC(validCNIC)) {
            return { success: false, message: 'CNIC validation failed for valid CNIC' };
        }

        if (Utils.validateCNIC(invalidCNIC)) {
            return { success: false, message: 'CNIC validation passed for invalid CNIC' };
        }

        // Test email validation
        const validEmail = 'test@example.com';
        const invalidEmail = 'invalid-email';
        
        if (!Utils.validateEmail(validEmail)) {
            return { success: false, message: 'Email validation failed for valid email' };
        }

        if (Utils.validateEmail(invalidEmail)) {
            return { success: false, message: 'Email validation passed for invalid email' };
        }

        return { success: true, message: 'Utils loaded with all required methods and validations work' };
    }

    testFormHandlerIntegration() {
        if (!window.IntegratedFormHandler) {
            return { success: false, message: 'IntegratedFormHandler class not loaded' };
        }

        // Check if form handler can be instantiated (even without DOM elements)
        try {
            const handler = new IntegratedFormHandler();
            if (!handler.applicationService) {
                return { success: false, message: 'Form handler missing applicationService dependency' };
            }
            if (!handler.authService) {
                return { success: false, message: 'Form handler missing authService dependency' };
            }
        } catch (error) {
            return { success: false, message: `Form handler instantiation failed: ${error.message}` };
        }

        return { success: true, message: 'IntegratedFormHandler loaded and can be instantiated' };
    }

    testDashboardHandlerIntegration() {
        if (!window.DashboardHandler) {
            return { success: false, message: 'DashboardHandler class not loaded' };
        }

        // Test dependencies
        const requiredServices = [
            'dashboardService',
            'authService', 
            'applicationService'
        ];

        const missingServices = requiredServices.filter(service => !window[service]);
        
        if (missingServices.length > 0) {
            return { success: false, message: `Missing service dependencies: ${missingServices.join(', ')}` };
        }

        return { success: true, message: 'DashboardHandler loaded with all dependencies' };
    }

    displayResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 ETD FRONTEND API INTEGRATION TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`📊 Total Tests: ${this.testCount}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`📈 Success Rate: ${((this.passedTests / this.testCount) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));

        if (this.failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.filter(r => !r.passed).forEach(result => {
                console.log(`   • ${result.name}: ${result.message}`);
            });
        }

        console.log('\n✅ INTEGRATION STATUS:', this.failedTests === 0 ? 'SUCCESS' : 'FAILED');
        console.log('='.repeat(60));
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.testCount,
                passedTests: this.passedTests,
                failedTests: this.failedTests,
                successRate: ((this.passedTests / this.testCount) * 100).toFixed(1) + '%'
            },
            results: this.results,
            status: this.failedTests === 0 ? 'SUCCESS' : 'FAILED',
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.failedTests === 0) {
            recommendations.push('✅ All tests passed! The API integration is ready for production.');
            recommendations.push('🔄 Consider setting up automated testing in your CI/CD pipeline.');
            recommendations.push('📊 Monitor API performance and error rates in production.');
        } else {
            recommendations.push('❌ Some tests failed. Please review and fix the failing components.');
            
            const failedTests = this.results.filter(r => !r.passed);
            
            if (failedTests.some(t => t.name.includes('API Configuration'))) {
                recommendations.push('🔧 Fix API configuration issues before proceeding.');
            }
            
            if (failedTests.some(t => t.name.includes('Service'))) {
                recommendations.push('🔧 Service classes are not loading properly. Check script paths.');
            }
            
            if (failedTests.some(t => t.name.includes('Integration'))) {
                recommendations.push('🔧 Integration handlers have dependency issues.');
            }
        }
        
        recommendations.push('📝 Update the documentation with any changes made.');
        recommendations.push('🚀 Test with real API endpoints in staging environment.');
        
        return recommendations;
    }
}

// Create global function to run tests
window.runETDIntegrationTests = async function() {
    const tester = new IntegrationTest();
    return await tester.runAllTests();
};

// Auto-run tests if this is the test page
if (window.location.pathname.includes('test') || window.location.search.includes('test=true')) {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🧪 Auto-running ETD Integration Tests...');
        await window.runETDIntegrationTests();
    });
}

console.log('🧪 ETD Integration Test Suite Loaded');
console.log('Run tests manually with: runETDIntegrationTests()');
console.log('Or add "?test=true" to URL to auto-run tests');

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegrationTest;
} else {
    window.IntegrationTest = IntegrationTest;
}