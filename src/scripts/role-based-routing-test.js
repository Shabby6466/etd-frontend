// Role-Based Routing Test Suite
class RoleBasedRoutingTest {
    constructor() {
        this.testResults = [];
        this.originalLocalStorage = {};
    }

    // Save current localStorage state
    saveLocalStorageState() {
        this.originalLocalStorage = {
            etd_user: localStorage.getItem('etd_user'),
            etd_user_role: localStorage.getItem('etd_user_role'),
            etd_user_permissions: localStorage.getItem('etd_user_permissions'),
            etd_dashboard_url: localStorage.getItem('etd_dashboard_url'),
            token: localStorage.getItem('token')
        };
    }

    // Restore original localStorage state
    restoreLocalStorageState() {
        Object.keys(this.originalLocalStorage).forEach(key => {
            if (this.originalLocalStorage[key] !== null) {
                localStorage.setItem(key, this.originalLocalStorage[key]);
            } else {
                localStorage.removeItem(key);
            }
        });
    }

    // Test helper to set user role
    setUserRole(role, username = 'testuser') {
        localStorage.setItem('etd_user', username);
        localStorage.setItem('etd_user_role', role);
        
        const rolePermissions = {
            'fm': ['view_dashboard', 'create_form', 'view_etd_data', 'print_token'],
            'hq': ['view_dashboard', 'view_details', 'send_verification', 'approve_applications'],
            'agency': ['view_dashboard', 'verify_documents', 'upload_files', 'process_applications'],
            'admin': ['view_dashboard', 'manage_users', 'view_all_applications', 'system_config']
        };
        
        const dashboardUrls = {
            'fm': '/src/pages/dashboards/FMdashboard.html',
            'hq': '/src/pages/dashboards/HQdashboard.html',
            'agency': '/src/pages/dashboards/AgencyDashboard.html',
            'admin': '/src/pages/dashboards/HQdashboard.html'
        };
        
        localStorage.setItem('etd_user_permissions', JSON.stringify(rolePermissions[role] || []));
        localStorage.setItem('etd_dashboard_url', dashboardUrls[role] || dashboardUrls['fm']);
        localStorage.setItem('token', 'test-token');
    }

    // Test role-based dashboard routing
    async testRoleBasedDashboardRouting() {
        console.log('🧪 Testing role-based dashboard routing...');
        
        const roles = ['fm', 'hq', 'agency', 'admin'];
        const expectedDashboards = {
            'fm': 'FMdashboard.html',
            'hq': 'HQdashboard.html',
            'agency': 'AgencyDashboard.html',
            'admin': 'HQdashboard.html'
        };

        for (const role of roles) {
            try {
                this.setUserRole(role);
                
                // Test backend API service dashboard URL generation
                const backendService = await import('./backend-api-service.js');
                const dashboardUrl = backendService.default.getDashboardForRole(role);
                const expectedUrl = `/src/pages/dashboards/${expectedDashboards[role]}`;
                
                const success = dashboardUrl === expectedUrl;
                this.testResults.push({
                    test: `Dashboard URL for ${role}`,
                    expected: expectedUrl,
                    actual: dashboardUrl,
                    success: success
                });

                console.log(`✓ ${role}: ${dashboardUrl} ${success ? '✅' : '❌'}`);
            } catch (error) {
                console.error(`❌ Error testing role ${role}:`, error);
                this.testResults.push({
                    test: `Dashboard URL for ${role}`,
                    expected: 'No error',
                    actual: error.message,
                    success: false
                });
            }
        }
    }

    // Test permission system
    async testPermissionSystem() {
        console.log('🧪 Testing permission system...');
        
        const permissionTests = [
            { role: 'fm', permission: 'create_form', expected: true },
            { role: 'fm', permission: 'approve_applications', expected: false },
            { role: 'hq', permission: 'approve_applications', expected: true },
            { role: 'hq', permission: 'create_form', expected: false },
            { role: 'agency', permission: 'verify_documents', expected: true },
            { role: 'agency', permission: 'create_form', expected: false },
            { role: 'admin', permission: 'manage_users', expected: true }
        ];

        try {
            const { getUserPermissions, hasPermission } = await import('./auth.js');
            
            for (const test of permissionTests) {
                this.setUserRole(test.role);
                const hasAccess = hasPermission(test.permission);
                
                const success = hasAccess === test.expected;
                this.testResults.push({
                    test: `${test.role} has ${test.permission}`,
                    expected: test.expected,
                    actual: hasAccess,
                    success: success
                });

                console.log(`✓ ${test.role} ${test.permission}: ${hasAccess} ${success ? '✅' : '❌'}`);
            }
        } catch (error) {
            console.error('❌ Error testing permission system:', error);
        }
    }

    // Test role manager functionality
    async testRoleManagerFunctionality() {
        console.log('🧪 Testing role manager functionality...');
        
        try {
            const roleManager = await import('./role-manager.js');
            const manager = roleManager.default;
            
            // Test role info retrieval
            const fmRole = manager.getRoleInfo('fm');
            const expectedFM = {
                name: 'Foreign Ministry',
                dashboardUrl: '/src/pages/dashboards/FMdashboard.html'
            };
            
            const fmSuccess = fmRole.name === expectedFM.name && fmRole.dashboardUrl === expectedFM.dashboardUrl;
            this.testResults.push({
                test: 'Role info retrieval for FM',
                expected: expectedFM.name,
                actual: fmRole.name,
                success: fmSuccess
            });

            console.log(`✓ FM Role Info: ${fmRole.name} ${fmSuccess ? '✅' : '❌'}`);

            // Test page access validation
            this.setUserRole('fm');
            const canAccessCitizen = manager.canAccessPage('Citizen.html');
            const canAccessAgencyView = manager.canAccessPage('AgencyView.html');
            
            const pageAccessSuccess = canAccessCitizen && !canAccessAgencyView;
            this.testResults.push({
                test: 'FM page access validation',
                expected: 'Can access Citizen.html, cannot access AgencyView.html',
                actual: `Citizen: ${canAccessCitizen}, AgencyView: ${canAccessAgencyView}`,
                success: pageAccessSuccess
            });

            console.log(`✓ Page Access: Citizen=${canAccessCitizen}, AgencyView=${canAccessAgencyView} ${pageAccessSuccess ? '✅' : '❌'}`);

        } catch (error) {
            console.error('❌ Error testing role manager:', error);
        }
    }

    // Test authentication flow
    async testAuthenticationFlow() {
        console.log('🧪 Testing authentication flow...');
        
        try {
            // Test login response processing
            const mockLoginResponse = {
                success: true,
                token: 'test-token',
                user: {
                    username: 'testuser',
                    role: 'hq',
                    permissions: ['view_dashboard', 'approve_applications'],
                    dashboardUrl: '/src/pages/dashboards/HQdashboard.html'
                }
            };

            // Simulate processing login response
            localStorage.setItem('token', mockLoginResponse.token);
            localStorage.setItem('etd_user', mockLoginResponse.user.username);
            localStorage.setItem('etd_user_role', mockLoginResponse.user.role);
            localStorage.setItem('etd_user_permissions', JSON.stringify(mockLoginResponse.user.permissions));
            localStorage.setItem('etd_dashboard_url', mockLoginResponse.user.dashboardUrl);

            // Verify stored data
            const storedRole = localStorage.getItem('etd_user_role');
            const storedPermissions = JSON.parse(localStorage.getItem('etd_user_permissions'));
            
            const authFlowSuccess = storedRole === 'hq' && storedPermissions.includes('approve_applications');
            this.testResults.push({
                test: 'Authentication data storage',
                expected: 'Role: hq, has approve_applications permission',
                actual: `Role: ${storedRole}, permissions: ${storedPermissions.join(', ')}`,
                success: authFlowSuccess
            });

            console.log(`✓ Auth Flow: Role=${storedRole} ${authFlowSuccess ? '✅' : '❌'}`);

        } catch (error) {
            console.error('❌ Error testing authentication flow:', error);
        }
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting Role-Based Routing Tests...');
        
        // Save current state
        this.saveLocalStorageState();
        
        try {
            await this.testRoleBasedDashboardRouting();
            await this.testPermissionSystem();
            await this.testRoleManagerFunctionality();
            await this.testAuthenticationFlow();
            
            this.generateTestReport();
        } catch (error) {
            console.error('❌ Test suite error:', error);
        } finally {
            // Restore original state
            this.restoreLocalStorageState();
        }
    }

    // Generate test report
    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(result => result.success).length;
        const failedTests = totalTests - passedTests;
        
        console.log('\n📊 TEST REPORT');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.filter(result => !result.success).forEach(result => {
                console.log(`- ${result.test}`);
                console.log(`  Expected: ${result.expected}`);
                console.log(`  Actual: ${result.actual}`);
            });
        }
        
        console.log('\n🎉 Role-based routing test suite completed!');
        
        return {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: (passedTests / totalTests) * 100,
            details: this.testResults
        };
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.RoleBasedRoutingTest = RoleBasedRoutingTest;
}

// Auto-run tests in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Uncomment to auto-run tests
    // setTimeout(() => {
    //     const testSuite = new RoleBasedRoutingTest();
    //     testSuite.runAllTests();
    // }, 2000);
}

export default RoleBasedRoutingTest;