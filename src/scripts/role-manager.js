// ETD Role Management System
class RoleManager {
    constructor() {
        this.roles = {
            'fm': {
                name: 'Foreign Ministry',
                dashboardUrl: '/src/pages/dashboards/FMdashboard.html',
                permissions: [
                    'view_dashboard',
                    'create_form', 
                    'view_etd_data',
                    'print_token',
                    'submit_applications'
                ],
                allowedPages: [
                    'FMdashboard.html',
                    'Citizen.html',
                    'Nadra-and-passport.html',
                    'ETDdataviewApproved.html',
                    'ETDdataViewNotApproved.html',
                    'ETD-remarks2.html'
                ]
            },
            'hq': {
                name: 'Headquarters',
                dashboardUrl: '/src/pages/dashboards/HQdashboard.html',
                permissions: [
                    'view_dashboard',
                    'view_details',
                    'send_verification',
                    'approve_applications',
                    'manage_workflow'
                ],
                allowedPages: [
                    'HQdashboard.html',
                    'HQview.html',
                    'SB.html'
                ]
            },
            'agency': {
                name: 'Processing Agency',
                dashboardUrl: '/src/pages/dashboards/AgencyDashboard.html',
                permissions: [
                    'view_dashboard',
                    'verify_documents',
                    'upload_files',
                    'process_applications',
                    'update_status'
                ],
                allowedPages: [
                    'AgencyDashboard.html',
                    'AgencyView.html'
                ]
            },
            'admin': {
                name: 'System Administrator',
                dashboardUrl: '/src/pages/dashboards/HQdashboard.html',
                permissions: [
                    'view_dashboard',
                    'manage_users',
                    'view_all_applications',
                    'system_config',
                    'audit_logs',
                    'manage_roles'
                ],
                allowedPages: [
                    'HQdashboard.html',
                    'HQview.html',
                    'SB.html',
                    'FMdashboard.html',
                    'AgencyDashboard.html'
                ]
            },
            'super_admin': {
                name: 'Super Administrator',
                dashboardUrl: '/src/pages/dashboards/HQdashboard.html',
                permissions: ['*'], // All permissions
                allowedPages: ['*'] // All pages
            }
        };
    }

    // Get role information
    getRoleInfo(role) {
        return this.roles[role.toLowerCase()] || this.roles['fm'];
    }

    // Get current user role
    getCurrentUserRole() {
        return localStorage.getItem('etd_user_role') || 'fm';
    }

    // Get current user permissions
    getCurrentUserPermissions() {
        const permissions = localStorage.getItem('etd_user_permissions');
        if (permissions) {
            try {
                return JSON.parse(permissions);
            } catch (e) {
                console.warn('Failed to parse user permissions');
            }
        }
        
        // Fallback to role-based permissions
        const role = this.getCurrentUserRole();
        return this.getRoleInfo(role).permissions;
    }

    // Check if user has specific permission
    hasPermission(permission) {
        const permissions = this.getCurrentUserPermissions();
        return permissions.includes('*') || permissions.includes(permission);
    }

    // Check if user can access specific page
    canAccessPage(pageName) {
        const role = this.getCurrentUserRole();
        const roleInfo = this.getRoleInfo(role);
        
        // Super admin can access all pages
        if (roleInfo.permissions.includes('*')) {
            return true;
        }
        
        // Check if page is in allowed pages
        return roleInfo.allowedPages.includes('*') || roleInfo.allowedPages.includes(pageName);
    }

    // Get dashboard URL for current user
    getCurrentUserDashboard() {
        const role = this.getCurrentUserRole();
        return this.getRoleInfo(role).dashboardUrl;
    }

    // Get dashboard file name for current user
    getCurrentUserDashboardFile() {
        const dashboardUrl = this.getCurrentUserDashboard();
        return dashboardUrl.split('/').pop();
    }

    // Validate page access and redirect if necessary
    validatePageAccess(currentPage, router) {
        if (!this.canAccessPage(currentPage)) {
            console.warn(`User role ${this.getCurrentUserRole()} cannot access ${currentPage}`);
            const dashboardFile = this.getCurrentUserDashboardFile();
            if (router) {
                router.navigateTo(dashboardFile);
            } else {
                window.location.href = this.getCurrentUserDashboard();
            }
            return false;
        }
        return true;
    }

    // Get role display name
    getRoleDisplayName(role = null) {
        const userRole = role || this.getCurrentUserRole();
        return this.getRoleInfo(userRole).name;
    }

    // Get all available roles (for admin purposes)
    getAllRoles() {
        return Object.keys(this.roles).map(roleKey => ({
            key: roleKey,
            name: this.roles[roleKey].name,
            permissions: this.roles[roleKey].permissions
        }));
    }

    // Update user role (for admin purposes)
    updateUserRole(newRole) {
        if (!this.roles[newRole.toLowerCase()]) {
            throw new Error(`Invalid role: ${newRole}`);
        }

        const roleInfo = this.getRoleInfo(newRole);
        localStorage.setItem('etd_user_role', newRole.toLowerCase());
        localStorage.setItem('etd_user_permissions', JSON.stringify(roleInfo.permissions));
        localStorage.setItem('etd_dashboard_url', roleInfo.dashboardUrl);

        return roleInfo;
    }

    // Check if current user is admin
    isAdmin() {
        const role = this.getCurrentUserRole();
        return ['admin', 'super_admin'].includes(role.toLowerCase());
    }

    // Check if current user is super admin
    isSuperAdmin() {
        const role = this.getCurrentUserRole();
        return role.toLowerCase() === 'super_admin';
    }

    // Get navigation menu items based on user role
    getNavigationItems() {
        const role = this.getCurrentUserRole();
        const roleInfo = this.getRoleInfo(role);

        const navigationMap = {
            'fm': [
                { name: 'Dashboard', url: 'FMdashboard.html', icon: 'dashboard' },
                { name: 'New Application', url: 'Citizen.html', icon: 'plus' },
                { name: 'Profile', url: '#', icon: 'user' }
            ],
            'hq': [
                { name: 'Dashboard', url: 'HQdashboard.html', icon: 'dashboard' },
                { name: 'Applications Review', url: 'HQview.html', icon: 'review' },
                { name: 'Reports', url: '#', icon: 'chart' },
                { name: 'Profile', url: '#', icon: 'user' }
            ],
            'agency': [
                { name: 'Dashboard', url: 'AgencyDashboard.html', icon: 'dashboard' },
                { name: 'Document Verification', url: 'AgencyView.html', icon: 'verify' },
                { name: 'Profile', url: '#', icon: 'user' }
            ],
            'admin': [
                { name: 'Dashboard', url: 'HQdashboard.html', icon: 'dashboard' },
                { name: 'User Management', url: '#', icon: 'users' },
                { name: 'System Config', url: '#', icon: 'settings' },
                { name: 'Audit Logs', url: '#', icon: 'logs' },
                { name: 'Profile', url: '#', icon: 'user' }
            ],
            'super_admin': [
                { name: 'Dashboard', url: 'HQdashboard.html', icon: 'dashboard' },
                { name: 'All Dashboards', url: '#', icon: 'grid' },
                { name: 'User Management', url: '#', icon: 'users' },
                { name: 'System Config', url: '#', icon: 'settings' },
                { name: 'Audit Logs', url: '#', icon: 'logs' },
                { name: 'Profile', url: '#', icon: 'user' }
            ]
        };

        return navigationMap[role] || navigationMap['fm'];
    }

    // Initialize role manager
    init() {
        // Check if user has valid role data
        const user = localStorage.getItem('etd_user');
        const role = localStorage.getItem('etd_user_role');

        if (user && !role) {
            // Set default role if user exists but no role is set
            localStorage.setItem('etd_user_role', 'fm');
            localStorage.setItem('etd_user_permissions', JSON.stringify(this.roles.fm.permissions));
            localStorage.setItem('etd_dashboard_url', this.roles.fm.dashboardUrl);
        }
    }

    // Clear all role data
    clearRoleData() {
        localStorage.removeItem('etd_user_role');
        localStorage.removeItem('etd_user_permissions');
        localStorage.removeItem('etd_dashboard_url');
    }
}

// Create singleton instance
const roleManager = new RoleManager();

// Auto-initialize
roleManager.init();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = roleManager;
} else {
    window.roleManager = roleManager;
}

export default roleManager;
export { RoleManager };