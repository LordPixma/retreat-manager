// frontend/public/js/utils.js - Enhanced version with loading states and validation
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
     * Show global loading overlay for long operations
     */
    showGlobalLoading(message = 'Loading...') {
        this.hideGlobalLoading(); // Remove any existing overlay

        const overlay = document.createElement('div');
        overlay.id = 'global-loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-message">${this.escapeHtml(message)}</div>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(2px);
        `;

        const style = document.createElement('style');
        style.id = 'global-loading-styles';
        style.textContent = `
            .loading-content {
                background: var(--bg-card, #1e1e2e);
                padding: 2rem 3rem;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            }
            .loading-spinner {
                width: 48px;
                height: 48px;
                border: 4px solid rgba(102, 126, 234, 0.2);
                border-top-color: #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            .loading-message {
                color: var(--text-primary, #fff);
                font-size: 1rem;
                font-weight: 500;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;

        if (!document.getElementById('global-loading-styles')) {
            document.head.appendChild(style);
        }
        document.body.appendChild(overlay);
    },

    /**
     * Hide global loading overlay
     */
    hideGlobalLoading() {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) overlay.remove();
    },

    /**
     * Show section loading state (for tables/cards)
     */
    showSectionLoading(containerId, message = 'Loading...') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.dataset.previousContent = container.innerHTML;
        container.innerHTML = `
            <tr>
                <td colspan="20" style="text-align: center; padding: 3rem;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
                        <span style="color: var(--text-secondary);">${this.escapeHtml(message)}</span>
                    </div>
                </td>
            </tr>
        `;
    },

    /**
     * Show section error with retry button
     */
    showSectionError(containerId, message, retryCallback) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const retryId = 'retry-' + this.generateId();
        container.innerHTML = `
            <tr>
                <td colspan="20" style="text-align: center; padding: 3rem;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--error);"></i>
                        <span style="color: var(--error);">${this.escapeHtml(message)}</span>
                        ${retryCallback ? `
                            <button class="btn btn-primary btn-sm" id="${retryId}">
                                <i class="fas fa-redo"></i> Retry
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;

        if (retryCallback) {
            setTimeout(() => {
                const retryBtn = document.getElementById(retryId);
                if (retryBtn) {
                    retryBtn.addEventListener('click', retryCallback);
                }
            }, 0);
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
        alert.innerHTML = `
            <i class="fas fa-${this.getAlertIcon(type)}"></i>
            <span>${this.escapeHtml(message)}</span>
            <button class="alert-close" style="background: none; border: none; cursor: pointer; margin-left: 1rem; opacity: 0.7;">
                <i class="fas fa-times"></i>
            </button>
        `;
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
            max-width: 500px;
            display: flex;
            align-items: center;
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
            case 'info':
                alert.style.cssText += `
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                    border: 1px solid rgba(59, 130, 246, 0.2);
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

        // Close button handler
        const closeBtn = alert.querySelector('.alert-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => alert.remove());
        }

        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => alert.remove(), 300);
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
     * Generate unique ID
     */
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Form validation utilities
     */
    validators: {
        required: (value) => value && value.toString().trim().length > 0,
        email: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        minLength: (min) => (value) => !value || value.length >= min,
        maxLength: (max) => (value) => !value || value.length <= max,
        number: (value) => !value || !isNaN(parseFloat(value)),
        positiveNumber: (value) => !value || (parseFloat(value) >= 0)
    },

    /**
     * Validate a form and show inline errors
     */
    validateForm(formElement, rules) {
        const errors = {};
        let isValid = true;

        // Clear previous errors
        formElement.querySelectorAll('.field-error').forEach(el => el.remove());
        formElement.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

        for (const [fieldName, fieldRules] of Object.entries(rules)) {
            const field = formElement.querySelector(`[name="${fieldName}"]`);
            if (!field) continue;

            const value = field.value;

            for (const rule of fieldRules) {
                const { validator, message } = rule;
                const validatorFn = typeof validator === 'string'
                    ? this.validators[validator]
                    : validator;

                if (validatorFn && !validatorFn(value)) {
                    errors[fieldName] = message;
                    isValid = false;

                    // Show inline error
                    field.classList.add('input-error');
                    const errorEl = document.createElement('div');
                    errorEl.className = 'field-error';
                    errorEl.style.cssText = 'color: var(--error); font-size: 0.8rem; margin-top: 0.25rem;';
                    errorEl.textContent = message;
                    field.parentNode.appendChild(errorEl);
                    break; // Stop at first error for this field
                }
            }
        }

        return { isValid, errors };
    },

    /**
     * Add input validation styles
     */
    initFormStyles() {
        if (document.getElementById('form-validation-styles')) return;

        const style = document.createElement('style');
        style.id = 'form-validation-styles';
        style.textContent = `
            .input-error {
                border-color: var(--error) !important;
                box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
            }
            .input-error:focus {
                border-color: var(--error) !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3) !important;
            }
            .field-error {
                color: var(--error);
                font-size: 0.8rem;
                margin-top: 0.25rem;
            }
            @keyframes slideOutRight {
                to {
                    transform: translateX(120%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Retry async operation with exponential backoff
     */
    async retry(fn, { maxAttempts = 3, delay = 1000, backoff = 2 } = {}) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (attempt < maxAttempts) {
                    await new Promise(r => setTimeout(r, delay * Math.pow(backoff, attempt - 1)));
                }
            }
        }
        throw lastError;
    },

    /**
     * Format relative time (e.g., "2 hours ago")
     */
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'just now';
        if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
        if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
        if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    }
};

// Initialize form styles on load
document.addEventListener('DOMContentLoaded', () => Utils.initFormStyles());

// Make Utils globally available
window.Utils = Utils;
