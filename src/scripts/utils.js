class Utils {
    static formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            ${this.getNotificationStyles(type)}
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);

        return notification;
    }

    static getNotificationStyles(type) {
        const styles = {
            success: 'background-color: #28a745;',
            error: 'background-color: #dc3545;',
            warning: 'background-color: #ffc107; color: #212529;',
            info: 'background-color: #17a2b8;'
        };
        return styles[type] || styles.info;
    }

    static showLoading(container, message = 'Loading...') {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-overlay';
        loadingDiv.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
        `;

        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.cssText = `
            color: #666;
            font-size: 14px;
        `;

        if (!document.querySelector('style[data-loading-styles]')) {
            const style = document.createElement('style');
            style.setAttribute('data-loading-styles', 'true');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        loadingDiv.appendChild(spinner);
        loadingDiv.appendChild(messageElement);

        if (container) {
            container.style.position = 'relative';
            container.appendChild(loadingDiv);
        }

        return loadingDiv;
    }

    static hideLoading(container) {
        if (container) {
            const loadingOverlay = container.querySelector('.loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.remove();
            }
        }
    }

    static validateCNIC(cnic) {
        console.log(cnic,"cniccniccnic")
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
        const numericCnic = cnic.replace(/-/g, '');
         return numericCnic.length === 13;
    }

    static formatCNIC(cnic) {
        const cleaned = cnic.replace(/\D/g, '');
        if (cleaned.length === 13) {
            return `${cleaned.substring(0, 5)}-${cleaned.substring(5, 12)}-${cleaned.substring(12)}`;
        }
        return cnic;
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static parseURLParams() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    }

    static updateURLParams(params) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });
        window.history.replaceState({}, '', url);
    }

    static createPagination(container, currentPage, totalPages, onPageChange) {
        if (!container || totalPages <= 1) return;

        container.innerHTML = '';

        const nav = document.createElement('nav');
        nav.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 20px 0;
            gap: 5px;
        `;

        const prevButton = this.createPaginationButton('‹ Previous', currentPage > 1, () => {
            if (currentPage > 1) onPageChange(currentPage - 1);
        });

        nav.appendChild(prevButton);

        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            nav.appendChild(this.createPaginationButton('1', true, () => onPageChange(1)));
            if (startPage > 2) {
                nav.appendChild(this.createPaginationEllipsis());
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const button = this.createPaginationButton(i.toString(), true, () => onPageChange(i));
            if (i === currentPage) {
                button.style.backgroundColor = '#007bff';
                button.style.color = 'white';
            }
            nav.appendChild(button);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                nav.appendChild(this.createPaginationEllipsis());
            }
            nav.appendChild(this.createPaginationButton(totalPages.toString(), true, () => onPageChange(totalPages)));
        }

        const nextButton = this.createPaginationButton('Next ›', currentPage < totalPages, () => {
            if (currentPage < totalPages) onPageChange(currentPage + 1);
        });

        nav.appendChild(nextButton);
        container.appendChild(nav);
    }

    static createPaginationButton(text, enabled, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.disabled = !enabled;
        button.style.cssText = `
            padding: 8px 12px;
            border: 1px solid #dee2e6;
            background: ${enabled ? 'white' : '#f8f9fa'};
            color: ${enabled ? '#007bff' : '#6c757d'};
            cursor: ${enabled ? 'pointer' : 'not-allowed'};
            border-radius: 4px;
            font-size: 14px;
        `;

        if (enabled) {
            button.addEventListener('click', onClick);
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = '#e9ecef';
            });
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = 'white';
            });
        }

        return button;
    }

    static createPaginationEllipsis() {
        const span = document.createElement('span');
        span.textContent = '...';
        span.style.cssText = `
            padding: 8px 12px;
            color: #6c757d;
        `;
        return span;
    }

    static copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text).then(() => {
                this.showNotification('Copied to clipboard', 'success', 2000);
            });
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Copied to clipboard', 'success', 2000);
        }
    }

    static downloadFile(data, filename, type = 'application/octet-stream') {
        const blob = new Blob([data], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    static confirmAction(message, callback) {
        if (confirm(message)) {
            callback();
        }
    }

    static createModal(title, content, actions = []) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;

        const modalHeader = document.createElement('h3');
        modalHeader.textContent = title;
        modalHeader.style.cssText = 'margin: 0 0 15px 0; color: #333;';

        const modalBody = document.createElement('div');
        modalBody.innerHTML = content;
        modalBody.style.cssText = 'margin-bottom: 20px;';

        const modalFooter = document.createElement('div');
        modalFooter.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        `;

        actions.forEach(action => {
            const button = document.createElement('button');
            button.textContent = action.text;
            button.style.cssText = `
                padding: 8px 16px;
                border: 1px solid ${action.primary ? '#007bff' : '#6c757d'};
                background: ${action.primary ? '#007bff' : 'white'};
                color: ${action.primary ? 'white' : '#6c757d'};
                border-radius: 4px;
                cursor: pointer;
            `;
            button.addEventListener('click', () => {
                if (action.callback) action.callback();
                this.closeModal(modal);
            });
            modalFooter.appendChild(button);
        });

        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modal.appendChild(modalContent);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });

        document.body.appendChild(modal);
        return modal;
    }

    static closeModal(modal) {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}