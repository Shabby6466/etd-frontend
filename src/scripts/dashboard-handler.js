class DashboardHandler {
    constructor() {
        this.dashboardService = window.dashboardService || new DashboardService();
        this.authService = window.authService || new AuthService();
        this.applicationService = window.applicationService || new ApplicationService();
        
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchTerm = '';
        this.selectedStatus = '';
        
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.bindEvents();
        this.loadDashboard();
        this.setupUserProfile();
    }

    checkAuthentication() {
        if (!this.authService.requireAuth()) {
            return;
        }
    }

    bindEvents() {
        const searchInput = document.querySelector('.search-text');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchTerm = e.target.value;
                this.currentPage = 1;
                this.loadApplications();
            }, 300));
        }

        const filterButton = document.querySelector('.control-button');
        if (filterButton) {
            filterButton.addEventListener('click', () => {
                this.showFilterModal();
            });
        }

        const refreshButton = this.createRefreshButton();
        document.querySelector('.controls-section').appendChild(refreshButton);
    }

    async loadDashboard() {
        try {
            const dashboardData = await this.dashboardService.getDashboardData();
            console.log(dashboardData,"dashboardDatadashboardData")
            this.renderDashboard(dashboardData);
        } catch (error) {
            console.error('Dashboard load error:', error);
            Utils.showNotification('Failed to load dashboard data', 'error');
            this.renderErrorState();
        }
    }

    renderDashboard(dashboardData) {
        this.renderWidgets(dashboardData.widgets);
        this.renderApplicationsTable(dashboardData.data.applications || dashboardData.data.recentApplications);
        this.updatePageTitle(dashboardData.type);
    }

    renderWidgets(widgets) {
        const widgetsContainer = document.getElementById('dashboard-widgets');
        if (!widgetsContainer || !widgets) return;

        widgetsContainer.innerHTML = '';
        
        const widgetsGrid = document.createElement('div');
        widgetsGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        `;

        widgets.forEach(widget => {
            const widgetElement = this.createWidget(widget);
            widgetsGrid.appendChild(widgetElement);
        });

        widgetsContainer.appendChild(widgetsGrid);
    }

    createWidget(widget) {
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'dashboard-widget';
        widgetDiv.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid ${widget.color};
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        widgetDiv.innerHTML = `
            <div>
                <h3 style="margin: 0; color: #333; font-size: 28px; font-weight: bold;">${widget.value}</h3>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${widget.title}</p>
            </div>
            <div style="color: ${widget.color}; font-size: 32px;">
                ${widget.icon === 'clock' ? '⏰' : 
                  widget.icon === 'check' ? '✅' :
                  widget.icon === 'x' ? '❌' :
                  widget.icon === 'document' ? '📄' :
                  widget.icon === 'users' ? '👥' : '📊'}
            </div>
        `;

        return widgetDiv;
    }

    renderApplicationsTable(data) {
         const tableContainer = document.getElementById('applications-table');
        if (!tableContainer) return;

        const applications = data.recentApplications || data || [];
 
        tableContainer.innerHTML = `
            <!-- Header Row -->
            <div class="table-row header">
                <div class="column-header">Application ID</div>
                <div class="column-header">Applicant Name</div>
                <div class="column-header">CNIC</div>
                <div class="column-header">Status</div>
                <div class="column-header">Created Date</div>
                <div class="column-header">Actions</div>
            </div>
        `;

        if (applications.length === 0) {
            const noDataRow = document.createElement('div');
            noDataRow.style.cssText = `
                text-align: center;
                padding: 40px;
                color: #666;
                font-style: italic;
            `;
            noDataRow.textContent = 'No applications found';
            tableContainer.appendChild(noDataRow);
            return;
        }

        applications.forEach(app => {
            const row = this.createApplicationRow(app);
 
            tableContainer.appendChild(row);
        });

        this.renderPagination();
    }

    createApplicationRow(application) {
        const row = document.createElement('div');
        row.className = 'table-row';

        const statusColor = this.getStatusColor(application.status);
        const createdDate = Utils.formatDate(application.createdAt);
        
        row.innerHTML = `
            <div class="table-cell">${application.id?.substring(0, 8) || 'N/A'}</div>
            <div class="table-cell">${application.first_name || ''} ${application.last_name || ''}</div>
            <div class="table-cell table-cell-small">${this.formatCNIC(application.citizen_id)}</div>
            <div class="table-cell">
                <div class="tag" style="background-color: ${statusColor}; color: white;">
                    ${this.formatStatus(application.status)}
                </div>
            </div>
            <div class="table-cell">${createdDate}</div>
            <div class="table-cell">
                <div class="action-buttons">
                    <button class="tag tag-gray view-btn" data-id="${application.id}">View</button>
                    ${this.getActionButtons(application)}
                </div>
            </div>
        `;

        this.bindRowEvents(row, application);
        return row;
    }

    getActionButtons(application) {
        const user = this.authService.getCurrentUser();
        const userRole = user?.role;
        
        if ((userRole === 'AGENCY' || userRole === 'MINISTRY') && 
            (application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW')) {
            return `
                <button class="tag" style="background: #28a745; color: white; margin-left: 5px;" 
                        data-action="approve" data-id="${application.id}">Approve</button>
                <button class="tag" style="background: #dc3545; color: white; margin-left: 5px;" 
                        data-action="reject" data-id="${application.id}">Reject</button>
            `;
        }
        
        return '';
    }

    bindRowEvents(row, application) {
        const viewBtn = row.querySelector('.view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => {
                this.viewApplication(application.id);
            });
        }

        const approveBtn = row.querySelector('[data-action="approve"]');
        if (approveBtn) {
            approveBtn.addEventListener('click', () => {
                this.approveApplication(application.id);
            });
        }

        const rejectBtn = row.querySelector('[data-action="reject"]');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                this.rejectApplication(application.id);
            });
        }
    }

    async approveApplication(applicationId) {
        const confirmMessage = 'Are you sure you want to approve this application?';
        Utils.confirmAction(confirmMessage, async () => {
            try {
                await this.applicationService.approveApplication(applicationId);
                Utils.showNotification('Application approved successfully', 'success');
                this.loadDashboard(); // Reload dashboard
            } catch (error) {
                console.error('Approve error:', error);
                Utils.showNotification(`Failed to approve: ${error.message}`, 'error');
            }
        });
    }

    async rejectApplication(applicationId) {
        const confirmMessage = 'Are you sure you want to reject this application?';
        Utils.confirmAction(confirmMessage, async () => {
            try {
                await this.applicationService.rejectApplication(applicationId);
                Utils.showNotification('Application rejected', 'success');
                this.loadDashboard(); // Reload dashboard
            } catch (error) {
                console.error('Reject error:', error);
                Utils.showNotification(`Failed to reject: ${error.message}`, 'error');
            }
        });
    }

    viewApplication(applicationId) {
        window.location.href = `../views/application-view.html?id=${applicationId}`;
    }

    getStatusColor(status) {
        const colors = {
            'DRAFT': '#6c757d',
            'SUBMITTED': '#007bff',
            'UNDER_REVIEW': '#ffc107',
            'APPROVED': '#28a745',
            'REJECTED': '#dc3545',
            'COMPLETED': '#17a2b8'
        };
        return colors[status] || '#6c757d';
    }

    formatStatus(status) {
        const statusMap = {
            'SUBMITTED': 'Submitted',
            'UNDER_REVIEW': 'Under Review',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected',
            'DRAFT': 'Draft',
            'COMPLETED': 'Completed'
        };
        return statusMap[status] || status;
    }

    formatCNIC(cnic) {
        if (!cnic) return 'N/A';
        return Utils.formatCNIC(cnic);
    }

    renderPagination() {
        const paginationContainer = document.querySelector('.pagination-controls');
        if (paginationContainer) {
            // Add pagination logic here if needed
            // For now, keep existing pagination buttons
        }
    }

    setupUserProfile() {
        const user = this.authService.getCurrentUser();
        console.log(user)
        const userProfile = document.querySelector('.user-profile');
        
        if (userProfile && user) {
            const userInfo = userProfile.querySelector('.user-info');
            if (userInfo) {
                userInfo.innerHTML = `
                    <div class="user-avatar" title="${user.fullName}">
                        ${user.fullName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div style="margin-left: 10px;">
                        <div style="font-weight: 500; font-size: 14px;">${user.fullName}</div>
                        <div style="font-size: 12px; color: #666;">${user.role}</div>
                    </div>
                `;
            }
        }

        this.addLogoutFunctionality();
    }

    addLogoutFunctionality() {
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            userProfile.style.cursor = 'pointer';
            userProfile.addEventListener('click', () => {
                this.showUserMenu();
            });
        }
    }

    showUserMenu() {
        const userMenu = document.createElement('div');
        userMenu.style.cssText = `
            position: absolute;
            top: 60px;
            right: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            min-width: 150px;
        `;

        const user = this.authService.getCurrentUser();
        userMenu.innerHTML = `
            <div style="padding: 12px; border-bottom: 1px solid #eee;">
                <div style="font-weight: 500;">${user.fullName}</div>
                <div style="font-size: 12px; color: #666;">${user.email}</div>
            </div>
            ${user.role == 'MISSION_OPERATOR' ? 
                `<div class="menu-item" style="padding: 12px; cursor: pointer; hover:background: #f5f5f5;" 
                 onclick="window.location.href='../forms/Citizen.html'">
                New Application
            </div>` : ''}
            <div class="menu-item" style="padding: 12px; cursor: pointer; color: #dc3545;" id="logout-btn">
                Logout
            </div>
        `;

        document.body.appendChild(userMenu);

        const logoutBtn = userMenu.querySelector('#logout-btn');
        logoutBtn.addEventListener('click', () => {
            this.authService.logout();
        });

        // Close menu when clicking outside
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!userMenu.contains(e.target) && !document.querySelector('.user-profile').contains(e.target)) {
                    userMenu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    createRefreshButton() {
        const refreshBtn = document.createElement('button');
        refreshBtn.innerHTML = '🔄 Refresh';
        refreshBtn.className = 'control-button';
        refreshBtn.style.marginLeft = '10px';
        
        refreshBtn.addEventListener('click', () => {
            this.loadDashboard();
            Utils.showNotification('Dashboard refreshed', 'success', 2000);
        });
        
        return refreshBtn;
    }

    showFilterModal() {
        const filterContent = `
            <div style="margin: 10px 0;">
                <label style="display: block; margin-bottom: 5px;">Status:</label>
                <select id="status-filter" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="COMPLETED">Completed</option>
                </select>
            </div>
        `;

        Utils.createModal('Filter Applications', filterContent, [
            { text: 'Cancel' },
            { 
                text: 'Apply Filter', 
                primary: true, 
                callback: () => {
                    const statusFilter = document.getElementById('status-filter').value;
                    this.selectedStatus = statusFilter;
                    this.currentPage = 1;
                    this.loadApplications();
                }
            }
        ]);
    }

    async loadApplications() {
        const filters = {
            page: this.currentPage,
            limit: this.pageSize
        };

        if (this.searchTerm) {
            filters.search = this.searchTerm;
        }

        if (this.selectedStatus) {
            filters.status = this.selectedStatus;
        }

        try {
            const applications = await this.applicationService.getAllApplications(filters);
             
            this.renderApplicationsTable(applications);
        } catch (error) {
            console.error('Load applications error:', error);
            Utils.showNotification('Failed to load applications', 'error');
        }
    }

    updatePageTitle(dashboardType) {
        const titles = {
            'agency': 'Agency Dashboard - ETD',
            'ministry': 'Ministry Dashboard - ETD',
            'mission_operator': 'Mission Operator Dashboard - ETD',
            'admin': 'Admin Dashboard - ETD'
        };

        const titleElement = document.querySelector('title');
        const headerTitle = document.querySelector('.header-title');
        
        const title = titles[dashboardType] || 'Dashboard - ETD';
        
        if (titleElement) titleElement.textContent = title;
        if (headerTitle) headerTitle.textContent = title;
    }

    renderErrorState() {
        const container = document.getElementById('applications-table');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <h3>Failed to load dashboard</h3>
                    <p>Please check your connection and try again</p>
                    <button onclick="location.reload()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}

// Initialize dashboard when DOM is loaded (unless prevented by admin handler)
document.addEventListener('DOMContentLoaded', () => {
    if (!window.preventDashboardAutoInit) {
        new DashboardHandler();
    }
});