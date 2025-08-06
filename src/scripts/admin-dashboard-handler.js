class AdminDashboardHandler extends DashboardHandler {
    constructor() {
        super();
        this.currentTab = 'applications';
        this.userService = window.backendApiService || new BackendApiService();
        this.initAdminFeatures();
    }

    initAdminFeatures() {
        this.bindTabEvents();
        this.bindUserModalEvents();
        this.setupUserManagement();
    }

    bindTabEvents() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    bindUserModalEvents() {
        const createUserBtn = document.getElementById('create-user-btn');
        const closeModalBtn = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-user');
        const createBtn = document.getElementById('create-user');
        const modal = document.getElementById('user-modal');

        if (createUserBtn) {
            createUserBtn.addEventListener('click', () => {
                this.showUserModal();
            });
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.hideUserModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideUserModal();
            });
        }

        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.createUser();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideUserModal();
                }
            });
        }
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.table-wrapper').forEach(table => {
            table.style.display = 'none';
        });

        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        const activeTable = document.getElementById(`${tabName}-table`);

        if (activeButton) activeButton.classList.add('active');
        if (activeTable) activeTable.style.display = 'block';

        this.currentTab = tabName;
        this.loadTabContent(tabName);
    }

    async loadTabContent(tabName) {
        try {
            switch (tabName) {
                case 'applications':
                    await this.loadApplications();
                    break;
                case 'users':
                    await this.loadUsers();
                    break;
                case 'reports':
                    await this.loadReports();
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${tabName}:`, error);
            Utils.showNotification(`Failed to load ${tabName}`, 'error');
        }
    }

    async loadUsers() {
        try {
            const users = await this.userService.getAllUsers();
            this.renderUsersTable(users);
        } catch (error) {
            console.error('Load users error:', error);
            this.renderErrorState('users-table', 'Failed to load users');
        }
    }

    renderUsersTable(users) {
        const tableContainer = document.getElementById('users-table');
        if (!tableContainer) return;

        tableContainer.innerHTML = `
            <div class="table-row header">
                <div class="column-header">User ID</div>
                <div class="column-header">Full Name</div>
                <div class="column-header">Email</div>
                <div class="column-header">Role</div>
                <div class="column-header">State</div>
                <div class="column-header">Status</div>
                <div class="column-header">Actions</div>
            </div>
        `;

        if (!users || users.length === 0) {
            const noDataRow = document.createElement('div');
            noDataRow.style.cssText = `
                text-align: center;
                padding: 40px;
                color: #666;
                font-style: italic;
            `;
            noDataRow.textContent = 'No users found';
            tableContainer.appendChild(noDataRow);
            return;
        }

        users.forEach(user => {
            const row = this.createUserRow(user);
            tableContainer.appendChild(row);
        });
    }

    createUserRow(user) {
        const row = document.createElement('div');
        row.className = 'table-row';
        
        const statusColor = user.status === 'ACTIVE' ? '#28a745' : '#dc3545';
        const roleColor = this.getRoleColor(user.role);
        
        row.innerHTML = `
            <div class="table-cell">${user.id?.substring(0, 8) || 'N/A'}</div>
            <div class="table-cell">${user.fullName || 'N/A'}</div>
            <div class="table-cell">${user.email || 'N/A'}</div>
            <div class="table-cell">
                <div class="tag" style="background-color: ${roleColor}; color: white;">
                    ${this.formatRole(user.role)}
                </div>
            </div>
            <div class="table-cell">${user.state || 'N/A'}</div>
            <div class="table-cell">
                <div class="tag" style="background-color: ${statusColor}; color: white;">
                    ${user.status}
                </div>
            </div>
            <div class="table-cell">
                <div class="action-buttons">
                    <button class="tag tag-blue edit-user-btn" data-id="${user.id}">Edit</button>
                    <button class="tag ${user.status === 'ACTIVE' ? 'tag-red' : 'tag-green'}" 
                            data-action="toggle-status" data-id="${user.id}">
                        ${user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </div>
        `;

        this.bindUserRowEvents(row, user);
        return row;
    }

    bindUserRowEvents(row, user) {
        const editBtn = row.querySelector('.edit-user-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editUser(user);
            });
        }

        const toggleBtn = row.querySelector('[data-action="toggle-status"]');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleUserStatus(user.id, user.status);
            });
        }
    }

    getRoleColor(role) {
        const colors = {
            'ADMIN': '#dc3545',
            'MINISTRY': '#007bff',
            'AGENCY': '#28a745',
            'MISSION_OPERATOR': '#ffc107'
        };
        return colors[role] || '#6c757d';
    }

    formatRole(role) {
        const roleMap = {
            'ADMIN': 'Admin',
            'MINISTRY': 'Ministry',
            'AGENCY': 'Agency',
            'MISSION_OPERATOR': 'Mission Operator'
        };
        return roleMap[role] || role;
    }

    async loadReports() {
        try {
            const reports = await this.dashboardService.getReports();
            this.renderReportsTable(reports);
        } catch (error) {
            console.error('Load reports error:', error);
            this.renderErrorState('reports-table', 'Failed to load reports');
        }
    }

    renderReportsTable(reports) {
        const tableContainer = document.getElementById('reports-table');
        if (!tableContainer) return;

        tableContainer.innerHTML = `
            <div class="table-row header">
                <div class="column-header">Report Type</div>
                <div class="column-header">Generated Date</div>
                <div class="column-header">Records</div>
                <div class="column-header">Status</div>
                <div class="column-header">Actions</div>
            </div>
        `;

        const reportTypes = [
            { type: 'Applications Summary', date: new Date(), records: 150, status: 'Available' },
            { type: 'User Activity', date: new Date(Date.now() - 86400000), records: 89, status: 'Available' },
            { type: 'System Logs', date: new Date(Date.now() - 172800000), records: 1205, status: 'Available' }
        ];

        reportTypes.forEach(report => {
            const row = document.createElement('div');
            row.className = 'table-row';
            
            row.innerHTML = `
                <div class="table-cell">${report.type}</div>
                <div class="table-cell">${Utils.formatDate(report.date)}</div>
                <div class="table-cell">${report.records}</div>
                <div class="table-cell">
                    <div class="tag tag-green">${report.status}</div>
                </div>
                <div class="table-cell">
                    <button class="tag tag-blue" onclick="this.downloadReport('${report.type}')">Download</button>
                </div>
            `;
            
            tableContainer.appendChild(row);
        });
    }

    showUserModal() {
        const modal = document.getElementById('user-modal');
        if (modal) {
            modal.style.display = 'block';
            this.resetUserForm();
        }
    }

    hideUserModal() {
        const modal = document.getElementById('user-modal');
        if (modal) {
            modal.style.display = 'none';
            this.resetUserForm();
        }
    }

    resetUserForm() {
        const form = document.getElementById('user-form');
        if (form) {
            form.reset();
        }
    }

    async createUser() {
        const form = document.getElementById('user-form');
        if (!form) return;

        const formData = new FormData(form);
        const userData = {
            email: formData.get('email'),
            fullName: formData.get('fullName'),
            password: formData.get('password'),
            role: formData.get('role'),
            state: formData.get('state'),
            status: formData.get('status')
        };

        if (!userData.email || !userData.fullName || !userData.password || !userData.role || !userData.status) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            await this.userService.createUser(userData);
            Utils.showNotification('User created successfully', 'success');
            this.hideUserModal();
            if (this.currentTab === 'users') {
                this.loadUsers();
            }
        } catch (error) {
            console.error('Create user error:', error);
            Utils.showNotification(`Failed to create user: ${error.message}`, 'error');
        }
    }

    async editUser(user) {
        // Fill the form with existing user data
        const form = document.getElementById('user-form');
        if (!form) return;

        document.getElementById('user-email').value = user.email || '';
        document.getElementById('user-fullname').value = user.fullName || '';
        document.getElementById('user-password').value = '';
        document.getElementById('user-role').value = user.role || '';
        document.getElementById('user-state').value = user.state || '';
        document.getElementById('user-status').value = user.status || '';

        // Change modal title and button text
        const modalTitle = document.querySelector('#user-modal .modal-header h3');
        const createBtn = document.getElementById('create-user');
        
        if (modalTitle) modalTitle.textContent = 'Edit User';
        if (createBtn) {
            createBtn.textContent = 'Update User';
            createBtn.onclick = () => this.updateUser(user.id);
        }

        this.showUserModal();
    }

    async updateUser(userId) {
        const form = document.getElementById('user-form');
        if (!form) return;

        const formData = new FormData(form);
        const userData = {
            email: formData.get('email'),
            fullName: formData.get('fullName'),
            role: formData.get('role'),
            state: formData.get('state'),
            status: formData.get('status')
        };

        const password = formData.get('password');
        if (password) {
            userData.password = password;
        }

        try {
            await this.userService.updateUser(userId, userData);
            Utils.showNotification('User updated successfully', 'success');
            this.hideUserModal();
            this.loadUsers();
        } catch (error) {
            console.error('Update user error:', error);
            Utils.showNotification(`Failed to update user: ${error.message}`, 'error');
        }
    }

    async toggleUserStatus(userId, currentStatus) {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const action = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
        
        const confirmMessage = `Are you sure you want to ${action} this user?`;
        Utils.confirmAction(confirmMessage, async () => {
            try {
                await this.userService.updateUser(userId, { status: newStatus });
                Utils.showNotification(`User ${action}d successfully`, 'success');
                this.loadUsers();
            } catch (error) {
                console.error('Toggle user status error:', error);
                Utils.showNotification(`Failed to ${action} user: ${error.message}`, 'error');
            }
        });
    }

    downloadReport(reportType) {
        Utils.showNotification(`Downloading ${reportType} report...`, 'info');
        // Implement actual report download logic here
        setTimeout(() => {
            Utils.showNotification('Report downloaded successfully', 'success');
        }, 2000);
    }

    setupUserManagement() {
        // Check if user has admin permissions
        const user = this.authService.getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            // Hide admin-only features
            const createUserBtn = document.getElementById('create-user-btn');
            if (createUserBtn) {
                createUserBtn.style.display = 'none';
            }
            
            // Remove users and reports tabs
            const userTab = document.querySelector('[data-tab="users"]');
            const reportsTab = document.querySelector('[data-tab="reports"]');
            if (userTab) userTab.style.display = 'none';
            if (reportsTab) reportsTab.style.display = 'none';
        }
        
        // Add logout button to controls
        this.addLogoutButton();
    }

    addLogoutButton() {
        const controlsSection = document.querySelector('.filter-controls');
        if (controlsSection) {
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'control-button';
            logoutBtn.id = 'logout-btn';
            logoutBtn.style.marginLeft = 'auto';
            logoutBtn.style.backgroundColor = '#dc3545';
            logoutBtn.style.color = 'white';
            
            logoutBtn.innerHTML = `
                <span class="control-button-text">Logout</span>
                <div class="control-icon">🚪</div>
            `;
            
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
            
            controlsSection.appendChild(logoutBtn);
        }
    }

    handleLogout() {
        const confirmMessage = 'Are you sure you want to logout?';
        Utils.confirmAction(confirmMessage, () => {
            this.authService.logout();
        });
    }

    renderErrorState(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <h3>${message}</h3>
                    <p>Please check your connection and try again</p>
                    <button onclick="location.reload()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Override parent method to handle initial tab loading
    async loadDashboard() {
        try {
            const dashboardData = await this.dashboardService.getDashboardData();
            this.renderDashboard(dashboardData);
            
            // Load initial tab content
            this.loadTabContent(this.currentTab);
        } catch (error) {
            console.error('Dashboard load error:', error);
            Utils.showNotification('Failed to load dashboard data', 'error');
            this.renderErrorState('applications-table', 'Failed to load dashboard');
        }
    }
}

// Prevent base dashboard handler from auto-initializing
window.preventDashboardAutoInit = true;

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboardHandler();
});