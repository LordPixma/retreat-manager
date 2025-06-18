// frontend/public/js/utils.js - Clean version
const Utils = {
    /**
     * Load HTML template from server
     */
    async loadTemplate(templatePath) {
        try {
            const response = await fetch(templatePath);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${templatePath}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Template loading error:', error);
            return '<div class="error">Error loading template</div>';
        }
    },

    /**
     * Show alert notification
     */
    showAlert(message, type = 'error', duration = 5000) {
        // Remove existing alerts
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `<i class="fas fa-${this.getAlertIcon(type)}"></i> ${message}`;
        alert.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            padding: 1rem;
            border-radius: var(--border-radius, 8px);
            font-size: 0.9rem;
            font-weight: 500;
            z-index: 1001;
            min-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Add alert styles based on type
        switch(type) {
            case 'success':
                alert.style.cssText += `
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                `;
                break;
            case 'warning':
                alert.style.cssText += `
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                `;
                break;
            default: // error
                alert.style.cssText += `
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                `;
        }
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, duration);
    },

    /**
     * Get icon for alert type
     */
    getAlertIcon(type) {
        const icons = {
            error: 'exclamation-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    /**
     * Show loading state on element
     */
    showLoading(element) {
        if (element) {
            element.classList.add('loading');
            if (element.tagName === 'BUTTON') {
                element.disabled = true;
                const originalText = element.textContent;
                element.dataset.originalText = originalText;
                element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            }
        }
    },

    /**
     * Hide loading state on element
     */
    hideLoading(element) {
        if (element) {
            element.classList.remove('loading');
            if (element.tagName === 'BUTTON') {
                element.disabled = false;
                if (element.dataset.originalText) {
                    element.textContent = element.dataset.originalText;
                    delete element.dataset.originalText;
                }
            }
        }
    },

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return `£${parseFloat(amount || 0).toFixed(2)}`;
    },

    /**
     * Debounce function calls
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Get initials from a name
     */
    getInitials(name) {
        if (!name) return '';
        return name.split(' ').map(part => part[0]).slice(0,2).join('').toUpperCase();
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }
};

// Make Utils globally available
window.Utils = Utils;
