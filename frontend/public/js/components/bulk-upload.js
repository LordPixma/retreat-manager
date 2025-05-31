// frontend/public/js/components/bulk-upload.js (FIXED VERSION)
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
        // Try to load template, fall back to inline HTML
        let modalHtml;
        try {
            modalHtml = await Utils.loadTemplate('templates/modals/bulk-upload.html');
        } catch (error) {
            console.warn('Template loading failed, using inline HTML');
            modalHtml = this.getInlineModalHTML();
        }
        
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
     * Get inline modal HTML (fallback)
     */
    getInlineModalHTML() {
        return `
            <div class="modal-overlay" id="bulk-upload-modal">
                <div class="modal" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3 class="modal-title">Bulk Upload Attendees</h3>
                        <button type="button" class="modal-close" id="close-bulk-upload-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="bulk-upload-alert" class="alert alert-error hidden"></div>
                        
                        <!-- Step 1: File Upload -->
                        <div id="upload-step" class="upload-step">
                            <div class="step-header">
                                <h4><i class="fas fa-upload"></i> Step 1: Upload CSV File</h4>
                                <p>Upload a CSV file containing attendee information</p>
                            </div>
                            
                            <div class="file-upload-area" id="file-upload-area">
                                <div class="file-upload-content">
                                    <i class="fas fa-file-csv fa-3x" style="color: var(--primary); margin-bottom: 1rem;"></i>
                                    <p><strong>Drag and drop your CSV file here</strong></p>
                                    <p>or</p>
                                    <input type="file" id="csv-file-input" accept=".csv" style="display: none;">
                                    <button type="button" class="btn btn-primary" id="browse-files-btn">
                                        <i class="fas fa-folder-open"></i> Browse Files
                                    </button>
                                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 1rem;">
                                        Accepted format: CSV (.csv) • Max size: 5MB
                                    </p>
                                </div>
                            </div>
                            
                            <!-- CSV Format Help -->
                            <div class="info-card" style="margin-top: 1.5rem; background: var(--background); padding: 1rem; border-radius: var(--border-radius); border: 1px solid var(--border);">
                                <h4><i class="fas fa-info-circle"></i> CSV Format Requirements</h4>
                                <p>Your CSV file should include the following columns (header names must match exactly):</p>
                                <div class="csv-format-example">
                                    <strong>Required columns:</strong>
                                    <ul>
                                        <li><code>name</code> - Full name of attendee</li>
                                        <li><code>ref_number</code> - Unique reference number</li>
                                        <li><code>password</code> - Login password</li>
                                    </ul>
                                    <strong>Optional columns:</strong>
                                    <ul>
                                        <li><code>email</code> - Email address</li>
                                        <li><code>room_number</code> - Room assignment (room must exist)</li>
                                        <li><code>group_name</code> - Group assignment (group must exist)</li>
                                        <li><code>payment_due</code> - Amount due (default: 0)</li>
                                    </ul>
                                </div>
                                <button type="button" class="btn btn-secondary btn-sm" id="download-template-btn">
                                    <i class="fas fa-download"></i> Download CSV Template
                                </button>
                            </div>
                        </div>
                        
                        <!-- Step 2: Preview Data -->
                        <div id="preview-step" class="upload-step" style="display: none;">
                            <div class="step-header">
                                <h4><i class="fas fa-table"></i> Step 2: Preview & Validate Data</h4>
                                <p>Review the data before importing</p>
                            </div>
                            
                            <div id="data-summary" class="data-summary">
                                <div class="stats-grid" style="margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                                    <div class="stat-card" style="background: var(--surface); padding: 1rem; border-radius: var(--border-radius); text-align: center; border-left: 4px solid var(--primary);">
                                        <div class="stat-value" id="total-rows" style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">0</div>
                                        <div class="stat-label" style="color: var(--text-secondary); font-size: 0.9rem;">Total Rows</div>
                                    </div>
                                    <div class="stat-card" style="background: var(--surface); padding: 1rem; border-radius: var(--border-radius); text-align: center; border-left: 4px solid var(--success);">
                                        <div class="stat-value" id="valid-rows" style="font-size: 1.5rem; font-weight: 700; color: var(--success);">0</div>
                                        <div class="stat-label" style="color: var(--text-secondary); font-size: 0.9rem;">Valid Rows</div>
                                    </div>
                                    <div class="stat-card" style="background: var(--surface); padding: 1rem; border-radius: var(--border-radius); text-align: center; border-left: 4px solid var(--error);">
                                        <div class="stat-value" id="error-rows" style="font-size: 1.5rem; font-weight: 700; color: var(--error);">0</div>
                                        <div class="stat-label" style="color: var(--text-secondary); font-size: 0.9rem;">Errors</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Data Preview Table -->
                            <div class="table-container" style="max-height: 300px; overflow-y: auto; margin-top: 1.5rem;">
                                <table class="table" id="preview-table">
                                    <thead id="preview-thead"></thead>
                                    <tbody id="preview-tbody"></tbody>
                                </table>
                            </div>
                            
                            <!-- Validation Errors -->
                            <div id="validation-errors" style="display: none; margin-top: 1rem;">
                                <h5 style="color: var(--error);">Validation Errors</h5>
                                <div id="error-list" class="error-list"></div>
                            </div>
                        </div>
                        
                        <!-- Step 3: Import Results -->
                        <div id="results-step" class="upload-step" style="display: none;">
                            <div class="step-header">
                                <h4><i class="fas fa-check-circle"></i> Step 3: Import Complete</h4>
                                <p>Import results summary</p>
                            </div>
                            
                            <div id="import-results" class="import-results">
                                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                                    <div class="stat-card" style="background: var(--surface); padding: 1rem; border-radius: var(--border-radius); text-align: center; border-left: 4px solid var(--success);">
                                        <div class="stat-value" id="imported-count" style="font-size: 1.5rem; font-weight: 700; color: var(--success);">0</div>
                                        <div class="stat-label" style="color: var(--text-secondary); font-size: 0.9rem;">Successfully Imported</div>
                                    </div>
                                    <div class="stat-card" style="background: var(--surface); padding: 1rem; border-radius: var(--border-radius); text-align: center; border-left: 4px solid var(--error);">
                                        <div class="stat-value" id="failed-count" style="font-size: 1.5rem; font-weight: 700; color: var(--error);">0</div>
                                        <div class="stat-label" style="color: var(--text-secondary); font-size: 0.9rem;">Failed</div>
                                    </div>
                                    <div class="stat-card" style="background: var(--surface); padding: 1rem; border-radius: var(--border-radius); text-align: center; border-left: 4px solid var(--warning);">
                                        <div class="stat-value" id="skipped-count" style="font-size: 1.5rem; font-weight: 700; color: var(--warning);">0</div>
                                        <div class="stat-label" style="color: var(--text-secondary); font-size: 0.9rem;">Skipped</div>
                                    </div>
                                </div>
                                
                                <div id="import-details" style="margin-top: 1.5rem;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-bulk-upload">Cancel</button>
                        <button type="button" class="btn btn-secondary" id="back-step-btn" style="display: none;">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        <button type="button" class="btn btn-primary" id="next-step-btn" style="display: none;">
                            Next <i class="fas fa-arrow-right"></i>
                        </button>
                        <button type="button" class="btn btn-success" id="import-data-btn" style="display: none;">
                            <i class="fas fa-upload"></i> Import Data
                        </button>
                        <button type="button" class="btn btn-primary" id="close-results-btn" style="display: none;">
                            <i class="fas fa-check"></i> Close
                        </button>
                    </div>
                </div>
            </div>
        `;
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
                } else {
                    this.showAlert('Please select a CSV file', 'error');
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

        // Escape key to close
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    },

    /**
     * Handle file selection
     */
    async handleFileSelect(file) {
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
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
            console.error('File read error:', error);
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
     * Parse CSV data (improved)
     */
    async parseCSV(csvText) {
        try {
            // Simple CSV parser with better handling
            const lines = csvText.trim().split('\n');
            if (lines.length < 2) {
                throw new Error('CSV must have at least a header row and one data row');
            }

            // Parse headers
            const headers = this.parseCSVLine(lines[0]);
            
            // Parse data rows
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) { // Skip empty lines
                    const values = this.parseCSVLine(lines[i]);
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    rows.push(row);
                }
            }

            this.csvData = { headers, rows };

            // Set up default column mapping
            this.setupColumnMapping();
            
            // Validate data
            this.validateData();
            
            console.log('Parsed CSV data:', this.csvData);
            console.log('Validation errors:', this.validationErrors);
            
        } catch (error) {
            throw new Error('Failed to parse CSV: ' + error.message);
        }
    },

    /**
     * Parse a single CSV line (handles quotes and commas)
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    },

    /**
     * Set up column mapping
     */
    setupColumnMapping() {
        const standardColumns = {
            'name': ['name', 'full_name', 'attendee_name', 'full name', 'attendee name'],
            'ref_number': ['ref_number', 'reference', 'ref', 'id', 'ref number'],
            'password': ['password', 'pwd', 'pass'],
            'email': ['email', 'email_address', 'email address'],
            'room_number': ['room_number', 'room', 'room_no', 'room number'],
            'group_name': ['group_name', 'group', 'group name'],
            'payment_due': ['payment_due', 'amount_due', 'balance', 'payment due', 'amount due']
        };

        this.columnMapping = {};
        
        // Auto-map columns based on header names
        this.csvData.headers.forEach(header => {
            const lowerHeader = header.toLowerCase().trim();
            
            for (const [standardCol, variations] of Object.entries(standardColumns)) {
                if (variations.includes(lowerHeader)) {
                    this.columnMapping[standardCol] = header;
                    break;
                }
            }
        });

        console.log('Column mapping:', this.columnMapping);
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
            if (!row[this.columnMapping.name]?.trim()) {
                rowErrors.push('Name is required');
            }

            if (!row[this.columnMapping.ref_number]?.trim()) {
                rowErrors.push('Reference number is required');
            } else {
                // Check for duplicate ref numbers
                const refNum = row[this.columnMapping.ref_number].trim();
                if (refNumbers.has(refNum)) {
                    rowErrors.push('Duplicate reference number');
                } else {
                    refNumbers.add(refNum);
                }
            }

            if (!row[this.columnMapping.password]?.trim()) {
                rowErrors.push('Password is required');
            }

            // Email validation (if provided)
            const email = row[this.columnMapping.email]?.trim();
            if (email && !this.isValidEmail(email)) {
                rowErrors.push('Invalid email format');
            }

            // Room validation
            const roomNumber = row[this.columnMapping.room_number]?.trim();
            if (roomNumber && !this.roomsData.find(r => r.number === roomNumber)) {
                rowErrors.push(`Room "${roomNumber}" not found`);
            }

            // Group validation
            const groupName = row[this.columnMapping.group_name]?.trim();
            if (groupName && !this.groupsData.find(g => g.name === groupName)) {
                rowErrors.push(`Group "${groupName}" not found`);
            }

            // Payment amount validation
            const paymentDue = row[this.columnMapping.payment_due]?.trim();
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
                    const validRows = this.csvData?.rows.length - this.validationErrors.length;
                    importBtn.disabled = validRows === 0;
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
            <div class="error-item" style="background: rgba(239, 68, 68, 0.1); padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem; border: 1px solid rgba(239, 68, 68, 0.2);">
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
                    console.log('Importing attendee:', attendeeData);
                    await API.post('/admin/attendees', attendeeData);
                    importedCount++;
                } catch (error) {
                    failedCount++;
                    const name = row[this.columnMapping.name] || 'Unknown';
                    importDetails.push(`Failed to import ${name}: ${error.message}`);
                    console.error('Import failed for:', name, error);
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
            console.error('Bulk import error:', error);
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
            name: row[this.columnMapping.name]?.trim(),
            ref_number: row[this.columnMapping.ref_number]?.trim(),
            password: row[this.columnMapping.password]?.trim(),
            email: row[this.columnMapping.email]?.trim() || null,
            payment_due: parseFloat(row[this.columnMapping.payment_due]?.trim()) || 0
        };

        // Find room ID
        const roomNumber = row[this.columnMapping.room_number]?.trim();
        if (roomNumber) {
            const room = this.roomsData.find(r => r.number === roomNumber);
            if (room) data.room_id = room.id;
        }

        // Find group ID
        const groupName = row[this.columnMapping.group_name]?.trim();
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
                        <div style="background: rgba(239, 68, 68, 0.1); padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem; border: 1px solid rgba(239, 68, 68, 0.2);">
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
            'Jane Doe,REF002,password456,jane@example.com,102,Workshop A,200.00',
            'Mike Johnson,REF003,mypassword,mike@example.com,,Family Group,0.00'
        ].join('\n');

        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendees_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.hideModal();
        }
    },

    hideModal() {
        const modal = document.getElementById('bulk-upload-modal');
        if (modal) {
            modal.remove();
        }
        
        // Remove event listener
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Reset state
        this.currentStep = 1;
        this.csvData = null;
        this.parsedData = null;
        this.validationErrors = [];
    }
};

// Make component globally available
window.BulkUpload = BulkUpload;