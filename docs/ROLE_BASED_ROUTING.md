# Role-Based Routing System Documentation

## Overview

The ETD system now includes a comprehensive role-based routing system that automatically directs users to appropriate dashboards and pages based on their assigned roles and permissions.

## Supported Roles

### 1. Foreign Ministry (FM)
- **Role Code**: `fm` or `foreign_ministry`
- **Dashboard**: `FMdashboard.html`
- **Permissions**: 
  - `view_dashboard`
  - `create_form`
  - `view_etd_data`
  - `print_token`
  - `submit_applications`
- **Accessible Pages**:
  - FMdashboard.html
  - Citizen.html
  - Nadra-and-passport.html
  - ETDdataviewApproved.html
  - ETDdataViewNotApproved.html
  - ETD-remarks2.html

### 2. Headquarters (HQ)
- **Role Code**: `hq` or `headquarters`
- **Dashboard**: `HQdashboard.html`
- **Permissions**:
  - `view_dashboard`
  - `view_details`
  - `send_verification`
  - `approve_applications`
  - `manage_workflow`
- **Accessible Pages**:
  - HQdashboard.html
  - HQview.html
  - SB.html

### 3. Processing Agency
- **Role Code**: `agency` or `processing_agency`
- **Dashboard**: `AgencyDashboard.html`
- **Permissions**:
  - `view_dashboard`
  - `verify_documents`
  - `upload_files`
  - `process_applications`
  - `update_status`
- **Accessible Pages**:
  - AgencyDashboard.html
  - AgencyView.html

### 4. Administrator
- **Role Code**: `admin`
- **Dashboard**: `HQdashboard.html`
- **Permissions**:
  - `view_dashboard`
  - `manage_users`
  - `view_all_applications`
  - `system_config`
  - `audit_logs`
  - `manage_roles`
- **Accessible Pages**: All HQ pages plus additional admin functions

### 5. Super Administrator
- **Role Code**: `super_admin`
- **Dashboard**: `HQdashboard.html`
- **Permissions**: `*` (All permissions)
- **Accessible Pages**: `*` (All pages)

## Implementation Components

### 1. Backend API Service (`backend-api-service.js`)
Enhanced login method that returns role-based information:
```javascript
async login(username, password, locationId = 'fm') {
  // Returns enhanced response with user role and dashboard URL
  return {
    success: true,
    data: data,
    token: data.token,
    user: {
      username: username.toLowerCase(),
      role: data.role || locationId,
      locationId: locationId,
      permissions: data.permissions || [],
      dashboardUrl: this.getDashboardForRole(data.role || locationId)
    }
  };
}
```

### 2. Enhanced Authentication (`auth.js`)
Updated to handle role-based routing and store role information:
```javascript
// Stores all role-related data
localStorage.setItem("token", result.token);
localStorage.setItem('etd_user', result.user.username);
localStorage.setItem('etd_user_role', result.user.role);
localStorage.setItem('etd_user_permissions', JSON.stringify(result.user.permissions));
localStorage.setItem('etd_dashboard_url', result.user.dashboardUrl);

// Navigates to appropriate dashboard
const dashboardFile = result.user.dashboardUrl.split('/').pop();
if (window.etdRouter) {
  window.etdRouter.navigateTo(dashboardFile);
} else {
  window.location.href = result.user.dashboardUrl;
}
```

### 3. Router Enhancement (`router.js`)
Updated with role-based navigation and access validation:
```javascript
// Role-based login handling
handleLogin(username, password, locationId = 'fm') {
  return login(username, password, locationId)
    .then((result) => {
      if (result && result.success && result.user) {
        const dashboardFile = result.user.dashboardUrl.split('/').pop();
        this.navigateTo(dashboardFile);
      } else {
        // Fallback logic
        const userRole = localStorage.getItem('etd_user_role') || locationId;
        const dashboardFile = this.getDashboardForRole(userRole);
        this.navigateTo(dashboardFile);
      }
      return true;
    });
}
```

### 4. Role Manager (`role-manager.js`)
Comprehensive role management system:
```javascript
class RoleManager {
  // Get role information
  getRoleInfo(role) {
    return this.roles[role.toLowerCase()] || this.roles['fm'];
  }
  
  // Check permissions
  hasPermission(permission) {
    const permissions = this.getCurrentUserPermissions();
    return permissions.includes('*') || permissions.includes(permission);
  }
  
  // Validate page access
  canAccessPage(pageName) {
    const role = this.getCurrentUserRole();
    const roleInfo = this.getRoleInfo(role);
    return roleInfo.allowedPages.includes('*') || roleInfo.allowedPages.includes(pageName);
  }
}
```

### 5. Login Interface Updates
Enhanced login form with role selection:
```html
<select class="input-box" id="userRole">
  <option value="">Select your role</option>
  <option value="fm">Foreign Ministry</option>
  <option value="hq">Headquarters</option>
  <option value="agency">Processing Agency</option>
  <option value="admin">Administrator</option>
</select>
```

## Usage Examples

### Login Flow
1. User selects role from dropdown
2. Enters credentials and clicks login
3. System authenticates and determines appropriate dashboard
4. User is automatically redirected to role-specific dashboard

### Runtime Role Checking
```javascript
import { getUserRole, hasPermission } from './auth.js';

// Check current user role
const userRole = getUserRole(); // Returns 'fm', 'hq', 'agency', etc.

// Check specific permission
if (hasPermission('create_form')) {
  // Show form creation button
}

// Check page access
if (roleManager.canAccessPage('AgencyView.html')) {
  // Allow navigation to agency view
}
```

### Dashboard Navigation
```javascript
// Get user's dashboard
const dashboardUrl = getUserDashboardUrl();

// Navigate to appropriate dashboard
if (window.etdRouter) {
  const dashboardFile = dashboardUrl.split('/').pop();
  window.etdRouter.navigateTo(dashboardFile);
}
```

## API Integration

### Backend API Response Format
```json
{
  "success": true,
  "token": "jwt-token-here",
  "data": {
    "role": "hq",
    "permissions": ["view_dashboard", "approve_applications"],
    "user_id": "123",
    "location_id": "hq"
  }
}
```

### Frontend Processing
The system automatically processes this response and:
1. Stores role and permission data
2. Determines appropriate dashboard URL
3. Redirects user to correct dashboard
4. Sets up runtime permission checking

## Access Control Flow

```
User Login
    ↓
Role Selection (FM/HQ/Agency/Admin)
    ↓
Authentication API Call
    ↓
Role & Permissions Retrieved
    ↓
Dashboard URL Determined
    ↓
User Redirected to Appropriate Dashboard
    ↓
Runtime: Page access validated against role permissions
```

## Security Features

### 1. Client-Side Validation
- Role-based page access control
- Permission checking for actions
- Automatic redirection from unauthorized pages

### 2. Server Integration
- Role verification through backend APIs
- Token-based authentication
- Permission validation on API calls

### 3. Session Management
- Role data stored in localStorage
- Automatic cleanup on logout
- Session timeout handling

## Testing

### Manual Testing
1. **Role Selection**: Test login with different roles
2. **Dashboard Routing**: Verify correct dashboard redirection
3. **Page Access**: Attempt to access unauthorized pages
4. **Permission Checks**: Test permission-based features

### Automated Testing
Run the test suite:
```javascript
import RoleBasedRoutingTest from './role-based-routing-test.js';

const testSuite = new RoleBasedRoutingTest();
testSuite.runAllTests().then(report => {
  console.log('Test Results:', report);
});
```

## Configuration

### Adding New Roles
1. Update `role-manager.js` with new role definition
2. Add role option to login form
3. Update backend API to handle new role
4. Test role permissions and routing

### Modifying Permissions
1. Update role definitions in `role-manager.js`
2. Update backend API role mappings
3. Test permission changes across system

## Troubleshooting

### Common Issues

1. **User redirected to wrong dashboard**
   - Check role stored in localStorage
   - Verify role mapping in `getDashboardForRole()`
   - Clear localStorage and login again

2. **Permission checks failing**
   - Verify permissions stored correctly
   - Check permission string matching
   - Ensure role has required permissions

3. **Page access denied**
   - Check `allowedPages` for user role
   - Verify page name matching
   - Test with admin role for debugging

### Debug Tools
```javascript
// Check current user data
console.log('User:', localStorage.getItem('etd_user'));
console.log('Role:', localStorage.getItem('etd_user_role'));
console.log('Permissions:', JSON.parse(localStorage.getItem('etd_user_permissions')));
console.log('Dashboard:', localStorage.getItem('etd_dashboard_url'));

// Test role manager
console.log('Role Info:', roleManager.getRoleInfo('fm'));
console.log('Can Access Page:', roleManager.canAccessPage('Citizen.html'));
```

## Migration from Previous System

### For Existing Users
- Default role assignment to 'fm' for backward compatibility
- Automatic role detection based on access patterns
- Graceful fallback to FM dashboard if role undefined

### For Developers
- Update login flows to use role-based routing
- Replace hardcoded dashboard URLs with role-based URLs
- Add permission checks to sensitive operations

## Future Enhancements

1. **Dynamic Role Management**: Admin interface for role modification
2. **Granular Permissions**: More specific permission controls
3. **Role Hierarchies**: Inheritance-based permission system
4. **Audit Logging**: Track role-based access attempts
5. **Multi-tenant Support**: Organization-based role separation

---

**Last Updated**: Current Date  
**Version**: 2.0.0  
**Status**: ✅ Complete and Ready for Use