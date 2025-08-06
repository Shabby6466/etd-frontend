class DashboardService {
    constructor() {
        this.apiService = window.backendApiService || new BackendApiService();
        this.authService = window.authService || new AuthService();
    }

    async getDashboardData() {
        try {
            const user = this.authService.getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            switch (user.role) {
                case 'ADMIN':
                    return await this.getAdminDashboard();
                case 'AGENCY':
                    return await this.getAgencyDashboard();
                case 'MINISTRY':
                    return await this.getMinistryDashboard();
                case 'MISSION_OPERATOR':
                    return await this.getMissionOperatorDashboard();
                default:
                    throw new Error('Unknown user role');
            }
        } catch (error) {
            console.error('Dashboard data error:', error);
            throw error;
        }
    }

    async getAdminDashboard() {
        const stats = await this.apiService.getAdminDashboardStats();
        return {
            type: 'admin',
            data: stats,
            widgets: this.getAdminWidgets(stats)
        };
    }

    async getAgencyDashboard() {
        const applications = await this.apiService.getAgencyApplications();
        return {
            type: 'agency',
            data: applications,
            widgets: this.getAgencyWidgets(applications)
        };
    }

    async getMinistryDashboard() {
        const applications = await this.apiService.getMinistryApplications();
        return {
            type: 'ministry',
            data: applications,
            widgets: this.getMinistryWidgets(applications)
        };
    }

    async getMissionOperatorDashboard() {
        const summary = await this.apiService.getMissionOperatorSummary();
        return {
            type: 'mission_operator',
            data: summary,
            widgets: this.getMissionOperatorWidgets(summary)
        };
    }

    getAdminWidgets(stats) {
        return [
            {
                title: 'Total Applications',
                value: stats.totalApplications,
                icon: 'document',
                color: '#007bff'
            },
            {
                title: 'Total Users',
                value: stats.totalUsers,
                icon: 'users',
                color: '#28a745'
            },
            {
                title: 'Pending Review',
                value: stats.applicationsByStatus.submitted + stats.applicationsByStatus.underReview,
                icon: 'clock',
                color: '#ffc107'
            },
            {
                title: 'Approved Today',
                value: this.getTodayApprovals(stats.recentApplications),
                icon: 'check',
                color: '#28a745'
            }
        ];
    }

    getAgencyWidgets(applications) {
        return [
            {
                title: 'Pending Review',
                value: applications.pendingReview,
                icon: 'clock',
                color: '#ffc107'
            },
            {
                title: 'Total Applications',
                value: applications.applications.length,
                icon: 'document',
                color: '#007bff'
            },
            {
                title: 'Approved',
                value: this.countByStatus(applications.applications, 'APPROVED'),
                icon: 'check',
                color: '#28a745'
            },
            {
                title: 'Rejected',
                value: this.countByStatus(applications.applications, 'REJECTED'),
                icon: 'x',
                color: '#dc3545'
            }
        ];
    }

    getMinistryWidgets(applications) {
        return this.getAgencyWidgets(applications);
    }

    getMissionOperatorWidgets(summary) {
        return [
            {
                title: 'My Applications',
                value: summary.totalApplications,
                icon: 'document',
                color: '#007bff'
            },
            {
                title: 'Draft',
                value: summary.applicationsByStatus.draft,
                icon: 'edit',
                color: '#6c757d'
            },
            {
                title: 'Submitted',
                value: summary.applicationsByStatus.submitted,
                icon: 'upload',
                color: '#17a2b8'
            },
            {
                title: 'Approved',
                value: summary.applicationsByStatus.approved,
                icon: 'check',
                color: '#28a745'
            }
        ];
    }

    getTodayApprovals(recentApplications) {
        const today = new Date().toDateString();
        return recentApplications.filter(app => {
            return app.status === 'APPROVED' && 
                   new Date(app.createdAt).toDateString() === today;
        }).length;
    }

    countByStatus(applications, status) {
        return applications.filter(app => app.status === status).length;
    }

    renderDashboardWidgets(container, widgets) {
        if (!container) return;

        container.innerHTML = '';
        
        widgets.forEach(widget => {
            const widgetElement = this.createWidgetElement(widget);
            container.appendChild(widgetElement);
        });
    }

    createWidgetElement(widget) {
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'dashboard-widget';
        widgetDiv.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid ${widget.color};
            margin-bottom: 20px;
        `;

        widgetDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0; color: #333; font-size: 24px;">${widget.value}</h3>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${widget.title}</p>
                </div>
                <div style="color: ${widget.color}; font-size: 24px;">
                    ${this.getIcon(widget.icon)}
                </div>
            </div>
        `;

        return widgetDiv;
    }

    getIcon(iconName) {
        const icons = {
            document: '📄',
            users: '👥',
            clock: '⏰',
            check: '✅',
            x: '❌',
            edit: '✏️',
            upload: '📤'
        };
        
        return icons[iconName] || '📊';
    }

    createApplicationTable(applications, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;

        table.innerHTML = `
            <thead style="background: #f8f9fa;">
                <tr>
                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Name</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Citizen ID</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Status</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Created</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${applications.map(app => this.createApplicationRow(app)).join('')}
            </tbody>
        `;

        container.innerHTML = '';
        container.appendChild(table);
    }

    createApplicationRow(application) {
        const statusColor = this.getStatusColor(application.status);
        const createdDate = new Date(application.createdAt).toLocaleDateString();
        
        return `
            <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 12px;">${application.first_name} ${application.last_name}</td>
                <td style="padding: 12px;">${application.citizen_id}</td>
                <td style="padding: 12px;">
                    <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                        ${application.status}
                    </span>
                </td>
                <td style="padding: 12px;">${createdDate}</td>
                <td style="padding: 12px;">
                    <button onclick="viewApplication('${application.id}')" 
                            style="background: #007bff; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        View
                    </button>
                </td>
            </tr>
        `;
    }

    getStatusColor(status) {
        const statusColors = {
            'DRAFT': '#6c757d',
            'SUBMITTED': '#007bff',
            'UNDER_REVIEW': '#ffc107',
            'APPROVED': '#28a745',
            'REJECTED': '#dc3545',
            'COMPLETED': '#17a2b8'
        };
        
        return statusColors[status] || '#6c757d';
    }

    async refreshDashboard() {
        try {
            const dashboardData = await this.getDashboardData();
            this.updateDashboardUI(dashboardData);
            return dashboardData;
        } catch (error) {
            console.error('Failed to refresh dashboard:', error);
            this.showError('Failed to refresh dashboard data');
        }
    }

    updateDashboardUI(dashboardData) {
        const widgetsContainer = document.getElementById('dashboard-widgets');
        if (widgetsContainer && dashboardData.widgets) {
            this.renderDashboardWidgets(widgetsContainer, dashboardData.widgets);
        }

        if (dashboardData.data.applications) {
            this.createApplicationTable(dashboardData.data.applications, 'applications-table');
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 12px;
            border-radius: 4px;
            margin: 10px 0;
            border: 1px solid #f5c6cb;
        `;
        errorDiv.textContent = message;
        
        const container = document.getElementById('dashboard-content') || document.body;
        container.insertBefore(errorDiv, container.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

const dashboardService = new DashboardService();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardService;
} else {
    window.DashboardService = DashboardService;
    window.dashboardService = dashboardService;
}