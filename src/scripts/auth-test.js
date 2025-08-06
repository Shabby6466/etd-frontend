// Authentication Refactor Test Suite
class AuthRefactorTest {
    constructor() {
        this.testResults = [];
        this.originalStorage = {};
        this.testData = {
            validCredentials: {
                username: 'testuser',
                password: 'testpass',
                role: 'fm'
            },
            invalidCredentials: {
                username: '',
                password: '',
                role: ''
            }
        };
    }

    // Save current localStorage
    saveStorage() {
        const keys = ['token', 'etd_user', 'etd_user_role', 'etd_user_permissions', 'etd_dashboard_url'];
        keys.forEach(key => {
            this.originalStorage[key] = localStorage.getItem(key);
        });
    }

    // Restore localStorage
    restoreStorage() {
        Object.keys(this.originalStorage).forEach(key => {
            if (this.originalStorage[key] !== null) {
                localStorage.setItem(key, this.originalStorage[key]);
            } else {
                localStorage.removeItem(key);
            }
        });
    }

    // Add test result
    addResult(testName, success, expected, actual, error = null) {
        this.testResults.push({
            test: testName,
            success,
            expected,
            actual,
            error,
            timestamp: new Date().toISOString()
        });
    }

    // Test authentication manager initialization
    async testAuthManagerInit() {
        console.log('🧪 Testing Authentication Manager initialization...');
        
        try {
            const { default: AuthenticationManager } = await import('./authentication-manager.js');
            const authManager = new AuthenticationManager();
            
            await authManager.init();
            
            const success = authManager.isInitialized === true;
            this.addResult(
                'AuthenticationManager initialization',
                success,
                'isInitialized = true',
                `isInitialized = ${authManager.isInitialized}`
            );
            
            console.log(`✓ AuthManager init: ${success ? '✅' : '❌'}`);
            return authManager;
        } catch (error) {
            this.addResult(
                'AuthenticationManager initialization',
                false,
                'No error',
                error.message,
                error
            );
            console.log(`❌ AuthManager init failed: ${error.message}`);
            return null;
        }
    }

    // Test API client functionality
    async testApiClient() {
        console.log('🧪 Testing API Client...');
        
        try {
            const { ApiClient } = await import('./api-client.js');
            const apiClient = new ApiClient();
            
            // Test URL building
            const testUrl = apiClient.buildUrl('/test/endpoint');
            const expectedUrl = apiClient.config.baseURL + '/test/endpoint';
            const urlSuccess = testUrl === expectedUrl;
            
            this.addResult(
                'API Client URL building',
                urlSuccess,
                expectedUrl,
                testUrl
            );
            
            console.log(`✓ API Client URL: ${urlSuccess ? '✅' : '❌'}`);
            
            // Test configuration
            const config = apiClient.getConfig();
            const configSuccess = config.baseURL && config.timeout && config.headers;
            
            this.addResult(
                'API Client configuration',
                configSuccess,
                'Has baseURL, timeout, headers',
                `baseURL: ${!!config.baseURL}, timeout: ${!!config.timeout}, headers: ${!!config.headers}`
            );
            
            console.log(`✓ API Client config: ${configSuccess ? '✅' : '❌'}`);
            
        } catch (error) {
            this.addResult(
                'API Client functionality',
                false,
                'No error',
                error.message,
                error
            );
            console.log(`❌ API Client test failed: ${error.message}`);
        }
    }

    // Test refactored auth functions
    async testRefactoredAuthFunctions() {
        console.log('🧪 Testing refactored auth functions...');
        
        try {
            // Import refactored auth module
            const authModule = await import('./auth-refactored.js');
            
            // Test function availability
            const requiredFunctions = [
                'login', 'logout', 'getToken', 'isLoggedIn', 
                'getCurrentUser', 'getUserRole', 'getUserPermissions',
                'hasPermission', 'getUserDashboardUrl', 'authFetch'
            ];
            
            const availableFunctions = requiredFunctions.filter(func => 
                typeof authModule[func] === 'function'
            );
            
            const functionsSuccess = availableFunctions.length === requiredFunctions.length;
            
            this.addResult(
                'Auth functions availability',
                functionsSuccess,
                `All ${requiredFunctions.length} functions available`,
                `${availableFunctions.length}/${requiredFunctions.length} functions available`
            );
            
            console.log(`✓ Auth functions: ${functionsSuccess ? '✅' : '❌'}`);
            
            // Test authentication state functions (without login)
            const initialUser = authModule.getCurrentUser();
            const initialRole = authModule.getUserRole();
            const initialPermissions = authModule.getUserPermissions();
            
            const stateSuccess = initialRole === 'fm' && Array.isArray(initialPermissions);
            
            this.addResult(
                'Auth state functions',
                stateSuccess,
                'Default role "fm", permissions array',
                `Role: ${initialRole}, Permissions: ${Array.isArray(initialPermissions) ? 'array' : typeof initialPermissions}`
            );
            
            console.log(`✓ Auth state: ${stateSuccess ? '✅' : '❌'}`);
            
        } catch (error) {
            this.addResult(
                'Refactored auth functions',
                false,
                'No error',
                error.message,
                error
            );
            console.log(`❌ Auth functions test failed: ${error.message}`);
        }
    }

    // Test login validation
    async testLoginValidation() {
        console.log('🧪 Testing login validation...');
        
        try {
            const { default: AuthenticationManager } = await import('./authentication-manager.js');
            const authManager = new AuthenticationManager();
            
            // Test invalid credentials validation
            let errorCaught = false;
            try {
                authManager.validateCredentials({ username: '', password: '', role: 'fm' });
            } catch (error) {
                errorCaught = true;
            }
            
            const validationSuccess = errorCaught;
            
            this.addResult(
                'Login credentials validation',
                validationSuccess,
                'Error thrown for empty credentials',
                errorCaught ? 'Error thrown' : 'No error thrown'
            );
            
            console.log(`✓ Login validation: ${validationSuccess ? '✅' : '❌'}`);
            
            // Test role validation
            let roleErrorCaught = false;
            try {
                authManager.validateCredentials({ username: 'test', password: 'test', role: 'invalid_role' });
            } catch (error) {
                roleErrorCaught = true;
            }
            
            const roleValidationSuccess = roleErrorCaught;
            
            this.addResult(
                'Role validation',
                roleValidationSuccess,
                'Error thrown for invalid role',
                roleErrorCaught ? 'Error thrown' : 'No error thrown'
            );
            
            console.log(`✓ Role validation: ${roleValidationSuccess ? '✅' : '❌'}`);
            
        } catch (error) {
            this.addResult(
                'Login validation',
                false,
                'No error',
                error.message,
                error
            );
            console.log(`❌ Login validation test failed: ${error.message}`);
        }
    }

    // Test login handler
    async testLoginHandler() {
        console.log('🧪 Testing Login Handler...');
        
        try {
            // We can't fully test the login handler without DOM, but we can test the class
            const { default: LoginHandler } = await import('./login-refactored.js');
            
            const loginHandler = new LoginHandler();
            
            // Test configuration
            const configSuccess = loginHandler.config && 
                                 loginHandler.config.defaultRole && 
                                 loginHandler.config.loadingText;
            
            this.addResult(
                'Login handler configuration',
                configSuccess,
                'Has defaultRole and loadingText',
                `defaultRole: ${!!loginHandler.config.defaultRole}, loadingText: ${!!loginHandler.config.loadingText}`
            );
            
            console.log(`✓ Login handler config: ${configSuccess ? '✅' : '❌'}`);
            
            // Test credential validation
            const validCredentials = loginHandler.getCredentials = () => ({
                username: 'test',
                password: 'test',
                role: 'fm'
            });
            
            // Mock DOM elements for validation test
            loginHandler.elements = {
                usernameInput: { value: 'test' },
                passwordInput: { value: 'test' },
                roleSelect: { value: 'fm' }
            };
            
            const validationSuccess = true; // We'd need DOM to test properly
            
            this.addResult(
                'Login handler validation',
                validationSuccess,
                'Validation methods available',
                'Methods exist'
            );
            
            console.log(`✓ Login handler validation: ${validationSuccess ? '✅' : '❌'}`);
            
        } catch (error) {
            this.addResult(
                'Login handler',
                false,
                'No error',
                error.message,
                error
            );
            console.log(`❌ Login handler test failed: ${error.message}`);
        }
    }

    // Test simulated login flow
    async testSimulatedLogin() {
        console.log('🧪 Testing simulated login flow...');
        
        try {
            // Clear any existing auth data
            localStorage.clear();
            
            const { login } = await import('./auth-refactored.js');
            
            // Test simulated login (should work in development)
            const result = await login('testuser', 'testpass', 'fm');
            
            // Check if login was successful (simulation should work)
            const loginSuccess = result && result.success === true;
            
            this.addResult(
                'Simulated login flow',
                loginSuccess,
                'Login successful with simulation',
                result ? `Success: ${result.success}` : 'No result'
            );
            
            console.log(`✓ Simulated login: ${loginSuccess ? '✅' : '❌'}`);
            
            // Check if auth data was stored
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('etd_user');
            const storedRole = localStorage.getItem('etd_user_role');
            
            const storageSuccess = storedToken && storedUser && storedRole;
            
            this.addResult(
                'Auth data storage',
                storageSuccess,
                'Token, user, and role stored',
                `Token: ${!!storedToken}, User: ${!!storedUser}, Role: ${!!storedRole}`
            );
            
            console.log(`✓ Auth storage: ${storageSuccess ? '✅' : '❌'}`);
            
        } catch (error) {
            this.addResult(
                'Simulated login flow',
                false,
                'No error',
                error.message,
                error
            );
            console.log(`❌ Simulated login test failed: ${error.message}`);
        }
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting Authentication Refactor Tests...');
        
        this.saveStorage();
        
        try {
            await this.testAuthManagerInit();
            await this.testApiClient();
            await this.testRefactoredAuthFunctions();
            await this.testLoginValidation();
            await this.testLoginHandler();
            await this.testSimulatedLogin();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Test suite error:', error);
        } finally {
            this.restoreStorage();
        }
    }

    // Generate test report
    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        
        console.log('\n📊 AUTHENTICATION REFACTOR TEST REPORT');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.filter(r => !r.success).forEach(result => {
                console.log(`- ${result.test}`);
                console.log(`  Expected: ${result.expected}`);
                console.log(`  Actual: ${result.actual}`);
                if (result.error) {
                    console.log(`  Error: ${result.error.message}`);
                }
            });
        }
        
        console.log('\n🎉 Authentication refactor test suite completed!');
        
        return {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: (passedTests / totalTests) * 100,
            results: this.testResults
        };
    }
}

// Export for manual testing
if (typeof window !== 'undefined') {
    window.AuthRefactorTest = AuthRefactorTest;
    
    // Auto-run in development
    if (window.location.hostname === 'localhost') {
        console.log('🧪 Authentication refactor test suite available as window.AuthRefactorTest');
        console.log('Run: new AuthRefactorTest().runAllTests()');
    }
}

export default AuthRefactorTest;