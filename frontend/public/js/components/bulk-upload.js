// frontend/public/js/components/bulk-upload.js
const BulkUpload = {
    csvData: null,
    parsedData: null,
    currentStep: 1,
    validationErrors: [],
    columnMapping: {},
    roomsData: [],
    groupsData: [],

    /**
     * Show bulk upload modal
     */
    async showModal(rooms = [], groups = []) {
        this.roomsData = rooms;
        this.groupsData = groups;
        this.currentStep = 1;
        this.csvData = null;
        this.parsedData = null;
        this.validationErrors = [];

        try {
            await this.renderModal();
            this.bindEvents();
            this.updateStepDisplay();
        } catch (error) {
            console.error('Failed to show bulk upload modal:', error);
            Utils.showAlert('Failed to load bulk upload form', 'error');
        }
    },

    /**
     * Render modal template
     */
    async renderModal() {
        // For now, we'll create the modal HTML directly
        // Later you can move this to a template file
        const modalHtml = await Utils.loadTemplate('templates/modals/bulk-upload-modal.html');
        
        // Remove existing modal if present
        const existingModal = document.getElementById('bulk-upload-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        document.getElementById('bulk-upload-modal').classList.remove('hidden');
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // File upload events
        const fileInput = document.getElementById('csv-file-input');
        const browseBtn = document.getElementById('browse-files-btn');
        const uploadArea = document.getElementById('file-upload-area');

        if (browseBtn) {
            browseBtn.addEventListener('click', () => fileInput.click());
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
        }

        // Drag and drop
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file && file.type === 'text/csv') {
                    this.handleFileSelect(file);
                }
            });
        }

        // Navigation buttons
        document.getElementById('next-step-btn')?.addEventListener('click', () => this.nextStep());
        document.getElementById('back-step-btn')?.addEventListener('click', () => this.previousStep());
        document.getElementById('import-data-btn')?.addEventListener('click', () => this.importData());
        
        // Download template
        document.getElementById('download-template-btn')?.addEventListener('click', () => this.downloadTemplate());

        // Close buttons
        document.getElementById('close-bulk-upload-modal')?.addEventListener('click', () => this.hideModal());
        document.getElementById('cancel-bulk-upload')?.addEventListener('click', () => this.hideModal());
        document.getElementById('close-results-btn')?.addEventListener('click', () => this.hideModal());

        // Close on overlay click
        document.getElementById('bulk-upload-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'bulk-upload-modal') {
                this.hideModal();
            }
        });
    },

    /**
     * Handle file selection
     */
    async handleFileSelect(file) {
        if (!file) return;

        if (file.type !== 'text/csv') {
            this.showAlert('Please select a CSV file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showAlert('File size must be less than 5MB', 'error');
            return;
        }

        try {
            this.showAlert('Reading CSV file...', 'info');
            
            const text = await this.readFileAsText(file);
            await this.parseCSV(text);
            
            this.hideAlert();
            this.nextStep();
            
        } catch (error) {
            this.showAlert('Error reading file: ' + error.message, 'error');
        }
    },

    /**
     * Read file as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    },

    /**
     * Parse CSV data
     */
    async parseCSV(csvText) {
        try {
            // Simple CSV parser (you could use a library like Papa Parse for more robust parsing)
            const lines = csvText.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            this.csvData = {
                headers,
                rows: lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    return row;
                })
            };

            // Set up default column mapping
            this.setupColumnMapping();
            
            // Validate data
            this.validateData();
            
            console.log('Parsed CSV data:', this.csvData);
            
        } catch (error) {
            throw new Error('Failed to parse CSV: ' + error.message);
        }
    },

    /**
     * Set up column mapping
     */
    setupColumnMapping() {
        const standardColumns = {
            'name': ['name', 'full_name', 'attendee_name'],
            'ref_number': ['ref_number', 'reference', 'ref', 'id'],
            'password': ['password', 'pwd', 'pass'],
            'email': ['email', 'email_address'],
            'room_number': ['room_number', 'room', 'room_no'],
            'group_name': ['group_name', 'group'],
            'payment_due': ['payment_due', 'amount_due', 'balance']
        };

        this.columnMapping = {};
        
        // Auto-map columns based on header names
        this.csvData.headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            
            for (const [standardCol, variations] of Object.entries(standardColumns)) {
                if (variations.includes(lowerHeader)) {
                    this.columnMapping[standardCol] = header;
                    break;
                }
            }
        });
    },

    /**
     * Validate CSV data
     */
    validateData() {
        this.validationErrors = [];
        const refNumbers = new Set();

        this.csvData.rows.forEach((row, index) => {
            const rowErrors = [];
            const rowNum = index + 2; // Account for header row

            // Required field validation
            if (!row[this.columnMapping.name]) {
                rowErrors.push('Name is required');
            }

            if (!row[this.columnMapping.ref_number]) {
                rowErrors.push('Reference number is required');
            } else {
                // Check for duplicate ref numbers
                const refNum = row[this.columnMapping.ref_number];
                if (refNumbers.has(refNum)) {
                    rowErrors.push('Duplicate reference number');
                } else {
                    refNumbers.add(refNum);
                }
            }

            if (!row[this.columnMapping.password]) {
                rowErrors.push('Password is required');
            }

            // Email validation (if provided)
            const email = row[this.columnMapping.email];
            if (email && !this.isValidEmail(email)) {
                rowErrors.push('Invalid email format');
            }

            // Room validation
            const roomNumber = row[this.columnMapping.room_number];
            if (roomNumber && !this.roomsData.find(r => r.number === roomNumber)) {
                rowErrors.push('Room not found');
            }

            // Group validation
            const groupName = row[this.columnMapping.group_name];
            if (groupName && !this.groupsData.find(g => g.name === groupName)) {
                rowErrors.push('Group not found');
            }

            // Payment amount validation
            const paymentDue = row[this.columnMapping.payment_due];
            if (paymentDue && (isNaN(paymentDue) || parseFloat(paymentDue) < 0)) {
                rowErrors.push('Invalid payment amount');
            }

            if (rowErrors.length > 0) {
                this.validationErrors.push({
                    row: rowNum,
                    errors: rowErrors,
                    data: row
                });
            }
        });

        console.log('Validation errors:', this.validationErrors);
    },

    /**
     * Update step display
     */
    updateStepDisplay() {
        // Hide all steps
        document.querySelectorAll('.upload-step').forEach(step => {
            step.style.display = 'none';
        });

        // Show current step
        const steps = ['upload-step', 'preview-step', 'results-step'];
        const currentStepElement = document.getElementById(steps[this.currentStep - 1]);
        if (currentStepElement) {
            currentStepElement.style.display = 'block';
        }

        // Update navigation buttons
        this.updateNavigationButtons();

        // Update step-specific content
        if (this.currentStep === 2) {
            this.updatePreviewStep();
        }
    },

    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        const nextBtn = document.getElementById('next-step-btn');
        const backBtn = document.getElementById('back-step-btn');
        const importBtn = document.getElementById('import-data-btn');
        const closeBtn = document.getElementById('close-results-btn');

        // Hide all buttons first
        [nextBtn, backBtn, importBtn, closeBtn].forEach(btn => {
            if (btn) btn.style.display = 'none';
        });

        switch (this.currentStep) {
            case 1:
                if (nextBtn && this.csvData) {
                    nextBtn.style.display = 'inline-flex';
                    nextBtn.disabled = !this.csvData;
                }
                break;
            case 2:
                if (backBtn) backBtn.style.display = 'inline-flex';
                if (importBtn) {
                    importBtn.style.display = 'inline-flex';
                    importBtn.disabled = this.validationErrors.length === this.csvData?.rows.length;
                }
                break;
            case 3:
                if (closeBtn) closeBtn.style.display = 'inline-flex';
                break;
        }
    },

    /**
     * Update preview step
     */
    updatePreviewStep() {
        if (!this.csvData) return;

        // Update summary stats
        const totalRows = this.csvData.rows.length;
        const errorRows = this.validationErrors.length;
        const validRows = totalRows - errorRows;

        document.getElementById('total-rows').textContent = totalRows;
        document.getElementById('valid-rows').textContent = validRows;
        document.getElementById('error-rows').textContent = errorRows;

        // Update preview table
        this.updatePreviewTable();

        // Show validation errors if any
        if (this.validationErrors.length > 0) {
            this.showValidationErrors();
        }
    },

    /**
     * Update preview table
     */
    updatePreviewTable() {
        const thead = document.getElementById('preview-thead');
        const tbody = document.getElementById('preview-tbody');

        if (!thead || !tbody) return;

        // Create header
        thead.innerHTML = `
            <tr>
                <th>Row</th>
                <th>Name</th>
                <th>Ref Number</th>
                <th>Email</th>
                <th>Room</th>
                <th>Group</th>
                <th>Payment Due</th>
                <th>Status</th>
            </tr>
        `;

        // Create rows (show first 10 for preview)
        const previewRows = this.csvData.rows.slice(0, 10);
        tbody.innerHTML = previewRows.map((row, index) => {
            const hasError = this.validationErrors.find(e => e.row === index + 2);
            const statusClass = hasError ? 'badge-warning' : 'badge-success';
            const statusText = hasError ? 'Has Errors' : 'Valid';

            return `
                <tr ${hasError ? 'style="background: rgba(245, 158, 11, 0.1);"' : ''}>
                    <td>${index + 2}</td>
                    <td>${Utils.escapeHtml(row[this.columnMapping.name] || '')}</td>
                    <td>${Utils.escapeHtml(row[this.columnMapping.ref_number] || '')}</td>
                    <td>${Utils.escapeHtml(row[this.columnMapping.email] || '')}</td>
                    <td>${Utils.escapeHtml(row[this.columnMapping.room_number] || '')}</td>
                    <td>${Utils.escapeHtml(row[this.columnMapping.group_name] || '')}</td>
                    <td>${Utils.escapeHtml(row[this.columnMapping.payment_due] || '0')}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                </tr>
            `;
        }).join('');

        if (this.csvData.rows.length > 10) {
            tbody.innerHTML += `
                <tr>
                    <td colspan="8" style="text-align: center; font-style: italic; color: var(--text-secondary);">
                        ... and ${this.csvData.rows.length - 10} more rows
                    </td>
                </tr>
            `;
        }
    },

    /**
     * Show validation errors
     */
    showValidationErrors() {
        const errorsContainer = document.getElementById('validation-errors');
        const errorList = document.getElementById('error-list');

        if (!errorsContainer || !errorList) return;

        errorsContainer.style.display = 'block';
        
        errorList.innerHTML = this.validationErrors.slice(0, 5).map(error => `
            <div class="error-item" style="background: rgba(239, 68, 68, 0.1); padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem;">
                <strong>Row ${error.row}:</strong> ${error.errors.join(', ')}
            </div>
        `).join('');

        if (this.validationErrors.length > 5) {
            errorList.innerHTML += `
                <div style="text-align: center; color: var(--text-secondary); font-style: italic;">
                    ... and ${this.validationErrors.length - 5} more errors
                </div>
            `;
        }
    },

    /**
     * Navigate to next step
     */
    nextStep() {
        if (this.currentStep < 3) {
            this.currentStep++;
            this.updateStepDisplay();
        }
    },

    /**
     * Navigate to previous step
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    },

    /**
     * Import data
     */
    async importData() {
        if (!this.csvData) return;

        const importBtn = document.getElementById('import-data-btn');
        if (importBtn) {
            importBtn.disabled = true;
            importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
        }

        try {
            const validRows = this.csvData.rows.filter((row, index) => {
                return !this.validationErrors.find(e => e.row === index + 2);
            });

            let importedCount = 0;
            let failedCount = 0;
            const importDetails = [];

            for (const row of validRows) {
                try {
                    const attendeeData = this.formatAttendeeData(row);
                    await API.post('/admin/attendees', attendeeData);
                    importedCount++;
                } catch (error) {
                    failedCount++;
                    importDetails.push(`Failed to import ${row[this.columnMapping.name]}: ${error.message}`);
                }
            }

            // Show results
            this.showImportResults(importedCount, failedCount, this.validationErrors.length, importDetails);
            this.currentStep = 3;
            this.updateStepDisplay();

            // Refresh admin dashboard
            if (window.AdminDashboard) {
                await AdminDashboard.refresh();
            }

        } catch (error) {
            this.showAlert('Import failed: ' + error.message, 'error');
        } finally {
            if (importBtn) {
                importBtn.disabled = false;
                importBtn.innerHTML = '<i class="fas fa-upload"></i> Import Data';
            }
        }
    },

    /**
     * Format attendee data for API
     */
    formatAttendeeData(row) {
        const data = {
            name: row[this.columnMapping.name],
            ref_number: row[this.columnMapping.ref_number],
            password: row[this.columnMapping.password],
            email: row[this.columnMapping.email] || null,
            payment_due: parseFloat(row[this.columnMapping.payment_due]) || 0
        };

        // Find room ID
        const roomNumber = row[this.columnMapping.room_number];
        if (roomNumber) {
            const room = this.roomsData.find(r => r.number === roomNumber);
            if (room) data.room_id = room.id;
        }

        // Find group ID
        const groupName = row[this.columnMapping.group_name];
        if (groupName) {
            const group = this.groupsData.find(g => g.name === groupName);
            if (group) data.group_id = group.id;
        }

        return data;
    },

    /**
     * Show import results
     */
    showImportResults(imported, failed, skipped, details) {
        document.getElementById('imported-count').textContent = imported;
        document.getElementById('failed-count').textContent = failed;
        document.getElementById('skipped-count').textContent = skipped;

        const detailsContainer = document.getElementById('import-details');
        if (details.length > 0) {
            detailsContainer.innerHTML = `
                <h5>Import Details:</h5>
                <div class="error-list">
                    ${details.map(detail => `
                        <div style="background: rgba(239, 68, 68, 0.1); padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem;">
                            ${Utils.escapeHtml(detail)}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            detailsContainer.innerHTML = '<p style="color: var(--success);">All valid rows imported successfully!</p>';
        }
    },

    /**
     * Download CSV template
     */
    downloadTemplate() {
        const template = [
            'name,ref_number,password,email,room_number,group_name,payment_due',
            'John Smith,REF001,password123,john@example.com,101,VIP Group,150.00',
            'Jane Doe,REF002,password456,jane@example.com,102,Workshop A,200.00'
        ].join('\n');

        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendees_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Utility methods
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    showAlert(message, type = 'error') {
        const alert = document.getElementById('bulk-upload-alert');
        if (alert) {
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `<i class="fas fa-${this.getAlertIcon(type)}"></i> ${message}`;
            alert.classList.remove('hidden');
        }
    },

    hideAlert() {
        const alert = document.getElementById('bulk-upload-alert');
        if (alert) {
            alert.classList.add('hidden');
        }
    },

    getAlertIcon(type) {
        const icons = {
            error: 'exclamation-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    hideModal() {
        const modal = document.getElementById('bulk-upload-modal');
        if (modal) {
            modal.remove();
        }
    }
};

// Make component globally available
window.BulkUpload = BulkUpload;