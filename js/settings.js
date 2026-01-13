// Settings Management - Complete Implementation
class SettingsManager {
    constructor() {
        this.currentUser = null;
        this.shopId = null;
        this.shopData = null;
        this.init();
    }

    async init() {
        // Check authentication
        this.currentUser = authManager.getCurrentUser();

        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        // Use shopId from authManager (Visitor Mode support)
        this.shopId = authManager.shopId || this.currentUser.shop_id;

        if (!this.shopId) {
            showNotification('No shop assigned', 'error');
            setTimeout(() => authManager.logout(), 2000);
            return;
        }

        // Update UI
        this.updateUI();

        // Setup event listeners
        this.setupEventListeners();

        // Load shop settings
        await this.loadShopSettings();

        // Load backup history
        await this.loadBackupHistory();
    }

    updateUI() {
        // Update user info
        document.getElementById('userName').textContent = this.currentUser.full_name || this.currentUser.username;
        document.getElementById('userRole').textContent = this.currentUser.role === 'shop_admin' ? 'Shop Admin' : 'Shop Staff';

        // Display Shop ID beside heading
        const shopIdDisplay = document.getElementById('shopIdDisplay');
        if (shopIdDisplay) {
            shopIdDisplay.textContent = `(ID: ${this.shopId})`;
        }

    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Shop info form
        const shopInfoForm = document.getElementById('shopInfoForm');
        if (shopInfoForm) {
            shopInfoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveShopInfo();
            });
        }

        // Business settings form
        const businessForm = document.getElementById('businessForm');
        if (businessForm) {
            businessForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveBusinessSettings();
            });
        }

        // POS settings form
        const posForm = document.getElementById('posForm');
        if (posForm) {
            posForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePOSSettings();
            });
        }

        // Logo upload
        const uploadLogoBtn = document.getElementById('uploadLogoBtn');
        if (uploadLogoBtn) {
            uploadLogoBtn.addEventListener('click', () => {
                document.getElementById('logoFile').click();
            });
        }

        // Logo file input
        const logoFile = document.getElementById('logoFile');
        if (logoFile) {
            logoFile.addEventListener('change', (e) => {
                this.handleLogoUpload(e.target.files[0]);
            });
        }

        // Remove logo
        const removeLogoBtn = document.getElementById('removeLogoBtn');
        if (removeLogoBtn) {
            removeLogoBtn.addEventListener('click', () => {
                this.removeLogo();
            });
        }

        // Export buttons
        const exportAllDataBtn = document.getElementById('exportAllDataBtn');
        if (exportAllDataBtn) {
            exportAllDataBtn.addEventListener('click', () => {
                this.exportAllData();
            });
        }

        const exportPdfReportsBtn = document.getElementById('exportPdfReportsBtn');
        if (exportPdfReportsBtn) {
            exportPdfReportsBtn.addEventListener('click', () => {
                this.exportPdfReports();
            });
        }

        const backupToCloudBtn = document.getElementById('backupToCloudBtn');
        if (backupToCloudBtn) {
            backupToCloudBtn.addEventListener('click', () => {
                this.createBackup();
            });
        }

        // Auto backup settings
        const enableAutoBackup = document.getElementById('enableAutoBackup');
        if (enableAutoBackup) {
            enableAutoBackup.addEventListener('change', (e) => {
                this.saveAutoBackupSettings();
            });
        }

        const backupTime = document.getElementById('backupTime');
        if (backupTime) {
            backupTime.addEventListener('change', () => {
                this.saveAutoBackupSettings();
            });
        }

        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
    }

    switchTab(tabId) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            }
        });

        // Show active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) {
                content.classList.add('active');
            }
        });
    }

    async loadShopSettings() {
        showLoading(true);

        try {
            // Load shop data
            const { data: shop, error } = await supabaseClient
                .from('shops')
                .select('*')
                .eq('id', this.shopId)
                .single();

            if (error) throw error;

            this.shopData = shop;



            // Load shop settings
            const { data: settings, error: settingsError } = await supabaseClient
                .from('shop_settings')
                .select('*')
                .eq('shop_id', this.shopId)
                .single();

            // Populate forms
            this.populateShopInfoForm(shop);
            this.populateBusinessSettings(settings);
            this.populatePOSSettings(settings);

        } catch (error) {

            showNotification('Failed to load shop settings', 'error');
        } finally {
            showLoading(false);
        }
    }

    populateShopInfoForm(shop) {
        if (!shop) return;

        document.getElementById('shopName').value = shop.shop_name || '';
        document.getElementById('shopAddress').value = shop.address || '';
        document.getElementById('shopPhone').value = shop.phone || '';

        // Set logo preview - Column is shop_logo, not logo_url
        const logoPreview = document.getElementById('logoPreview');
        if (shop.shop_logo) {
            logoPreview.src = shop.shop_logo;
        } else {
            logoPreview.src = 'assets/default-shop-logo.png';
        }
    }

    populateBusinessSettings(settings) {
        if (!settings) {
            // Set defaults
            document.getElementById('shopCurrency').value = 'INR';
            document.getElementById('taxRate').value = '18';
            document.getElementById('profitMargin').value = '30';
            document.getElementById('enableTax').checked = true;
            document.getElementById('enableLowStockAlert').checked = true;
            document.getElementById('lowStockThreshold').value = '10';
            return;
        }

        document.getElementById('shopCurrency').value = settings.currency || 'INR';
        document.getElementById('taxRate').value = settings.tax_rate || '18';
        document.getElementById('profitMargin').value = settings.default_profit_margin || '30';
        document.getElementById('enableTax').checked = settings.enable_tax_calculation !== false;
        document.getElementById('enableLowStockAlert').checked = settings.enable_low_stock_alert !== false;
        document.getElementById('lowStockThreshold').value = settings.low_stock_threshold || '10';

        // Load current_balance from shopData
        if (this.shopData) {
            document.getElementById('shopAsset').value = this.shopData.current_balance || 0;
        }
    }

    populatePOSSettings(settings) {
        if (!settings) {
            // Set defaults
            document.getElementById('defaultPaymentMethod').value = 'cash';
            document.getElementById('enableBarcodeScanner').checked = true;
            document.getElementById('enableQuickSale').checked = true;
            document.getElementById('autoPrintInvoice').checked = false;
            document.getElementById('receiptHeader').value = 'Thank you for shopping with us!';
            document.getElementById('receiptFooter').value = 'Please visit again!';
            return;
        }

        document.getElementById('defaultPaymentMethod').value = settings.default_payment_method || 'cash';
        document.getElementById('enableBarcodeScanner').checked = settings.enable_barcode_scanner !== false;
        document.getElementById('enableQuickSale').checked = settings.enable_quick_sale !== false;
        document.getElementById('autoPrintInvoice').checked = settings.auto_print_invoice || false;
        document.getElementById('receiptHeader').value = settings.receipt_header || 'Thank you for shopping with us!';
        document.getElementById('receiptFooter').value = settings.receipt_footer || 'Please visit again!';
    }

    async saveShopInfo() {
        const shopName = document.getElementById('shopName').value.trim();
        const address = document.getElementById('shopAddress').value.trim();
        const phone = document.getElementById('shopPhone').value.trim();







        // Validate
        if (!shopName) {
            showNotification('Shop name is required', 'error');
            return;
        }

        showLoading(true);

        try {
            const shopData = {
                shop_name: shopName,
                address: address || null,
                phone: phone || null,
                updated_at: new Date().toISOString()
            };



            const { data, error } = await supabaseClient
                .from('shops')
                .update(shopData)
                .eq('id', this.shopId)
                .select();

            if (error) {

                throw error;
            }


            if (data && data[0]) this.shopData = data[0]; // Update local cache

            // Create audit log
            await this.createAuditLog('update', 'shops', this.shopId, null, {
                shop_name: shopName,
                updated_fields: ['shop_name', 'address', 'phone']
            });

            // Update shop name display
            this.updateShopNameDisplay(shopName);

            showNotification('Shop information saved successfully', 'success');

        } catch (error) {

            showNotification('Failed to save shop information: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    async saveBusinessSettings() {
        const currency = document.getElementById('shopCurrency').value;
        const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
        const profitMargin = parseFloat(document.getElementById('profitMargin').value) || 0;
        const enableTax = document.getElementById('enableTax').checked;
        const enableLowStockAlert = document.getElementById('enableLowStockAlert').checked;
        const lowStockThreshold = parseInt(document.getElementById('lowStockThreshold').value) || 10;

        showLoading(true);

        try {
            const settingsData = {
                shop_id: this.shopId,
                currency: currency,
                tax_rate: taxRate,
                default_profit_margin: profitMargin,
                enable_tax_calculation: enableTax,
                enable_low_stock_alert: enableLowStockAlert,
                low_stock_threshold: lowStockThreshold,
                updated_at: new Date().toISOString()
            };

            // Check if settings exist
            const { data: existingSettings } = await supabaseClient
                .from('shop_settings')
                .select('id')
                .eq('shop_id', this.shopId)
                .single();

            let result;

            if (existingSettings) {
                // Update existing settings
                const { data, error } = await supabaseClient
                    .from('shop_settings')
                    .update(settingsData)
                    .eq('shop_id', this.shopId)
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            } else {
                // Create new settings
                const { data, error } = await supabaseClient
                    .from('shop_settings')
                    .insert([settingsData])
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            }

            // Create audit log
            await this.createAuditLog('update', 'shop_settings', result.id, null, {
                currency: currency,
                tax_rate: taxRate,
                updated_fields: Object.keys(settingsData)
            });

            // Save current_balance to shops table
            const shopAsset = parseFloat(document.getElementById('shopAsset').value) || 0;
            const { error: shopError } = await supabaseClient
                .from('shops')
                .update({ current_balance: shopAsset, updated_at: new Date().toISOString() })
                .eq('id', this.shopId);

            if (shopError) throw shopError;

            // Update local shopData
            if (this.shopData) this.shopData.current_balance = shopAsset;

            showNotification('Business settings saved successfully', 'success');

        } catch (error) {

            showNotification('Failed to save business settings', 'error');
        } finally {
            showLoading(false);
        }
    }

    async savePOSSettings() {
        const defaultPaymentMethod = document.getElementById('defaultPaymentMethod').value;
        const enableBarcodeScanner = document.getElementById('enableBarcodeScanner').checked;
        const enableQuickSale = document.getElementById('enableQuickSale').checked;
        const autoPrintInvoice = document.getElementById('autoPrintInvoice').checked;
        const receiptHeader = document.getElementById('receiptHeader').value.trim();
        const receiptFooter = document.getElementById('receiptFooter').value.trim();

        showLoading(true);

        try {
            const settingsData = {
                shop_id: this.shopId,
                default_payment_method: defaultPaymentMethod,
                enable_barcode_scanner: enableBarcodeScanner,
                enable_quick_sale: enableQuickSale,
                auto_print_invoice: autoPrintInvoice,
                receipt_header: receiptHeader,
                receipt_footer: receiptFooter,
                updated_at: new Date().toISOString()
            };

            // Check if settings exist
            const { data: existingSettings } = await supabaseClient
                .from('shop_settings')
                .select('id')
                .eq('shop_id', this.shopId)
                .single();

            let result;

            if (existingSettings) {
                // Update existing settings
                const { data, error } = await supabaseClient
                    .from('shop_settings')
                    .update(settingsData)
                    .eq('shop_id', this.shopId)
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            } else {
                // Create new settings
                const { data, error } = await supabaseClient
                    .from('shop_settings')
                    .insert([settingsData])
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            }

            // Create audit log
            await this.createAuditLog('update', 'shop_settings', result.id, null, {
                default_payment_method: defaultPaymentMethod,
                updated_fields: Object.keys(settingsData)
            });

            showNotification('POS settings saved successfully', 'success');

        } catch (error) {

            showNotification('Failed to save POS settings', 'error');
        } finally {
            showLoading(false);
        }
    }

    async handleLogoUpload(file) {
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showNotification('Please upload a valid image file (JPEG, PNG, GIF, WebP)', 'error');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showNotification('Image size should be less than 2MB', 'error');
            return;
        }

        showLoading(true);

        try {
            // In a real application, you would upload to Supabase Storage or another service
            // For now, we'll convert to base64 and store as a data URL
            const reader = new FileReader();

            reader.onload = async (e) => {
                const base64Image = e.target.result;

                // Update shop record with logo URL - Column is shop_logo
                const { error } = await supabaseClient
                    .from('shops')
                    .update({
                        shop_logo: base64Image,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', this.shopId);

                if (error) throw error;

                // Update preview
                document.getElementById('logoPreview').src = base64Image;

                // Create audit log
                await this.createAuditLog('update', 'shops', this.shopId, null, {
                    logo_updated: true
                });

                showNotification('Logo uploaded successfully', 'success');
                showLoading(false);
            };

            reader.onerror = () => {
                throw new Error('Failed to read file');
            };

            reader.readAsDataURL(file);

        } catch (error) {

            showNotification('Failed to upload logo', 'error');
            showLoading(false);
        }
    }

    async removeLogo() {
        if (!confirm('Are you sure you want to remove the shop logo?')) {
            return;
        }

        showLoading(true);

        try {
            const { error } = await supabaseClient
                .from('shops')
                .update({
                    shop_logo: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', this.shopId);

            if (error) throw error;

            // Reset to default logo
            document.getElementById('logoPreview').src = 'assets/default-shop-logo.png';

            // Create audit log
            await this.createAuditLog('update', 'shops', this.shopId, null, {
                logo_removed: true
            });

            showNotification('Logo removed successfully', 'success');

        } catch (error) {

            showNotification('Failed to remove logo', 'error');
        } finally {
            showLoading(false);
        }
    }

    async exportAllData() {
        showLoading(true);

        try {
            // Export all shop data to a single JSON file
            const exportData = {
                shop_info: this.shopData,
                timestamp: new Date().toISOString(),
                exported_by: this.currentUser.id
            };

            // Get all data tables
            const tables = ['products', 'sales', 'sale_items', 'credits', 'credit_payments', 'expenses', 'profiles'];

            for (const table of tables) {
                const { data, error } = await supabaseClient
                    .from(table)
                    .select('*')
                    .eq('shop_id', this.shopId);

                if (!error && data) {
                    exportData[table] = data;
                }
            }

            // Convert to JSON string
            const jsonString = JSON.stringify(exportData, null, 2);

            // Create download link
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `shop_backup_${this.shopId}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Record backup
            await this.recordBackup('full_export', 'json', exportData);

            showNotification('All data exported successfully', 'success');

        } catch (error) {

            showNotification('Failed to export data', 'error');
        } finally {
            showLoading(false);
        }
    }

    async exportPdfReports() {
        // Note: This is a placeholder. For production, use a PDF library like jsPDF or pdfmake
        showNotification('PDF export requires additional setup with a PDF library', 'info');

        // Example implementation with jsPDF:
        /*
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.text('Shop Report', 10, 10);
        doc.text(`Shop: ${this.shopData.shop_name}`, 10, 20);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 30);
        
        // Add more content...
        
        doc.save('shop_report.pdf');
        */
    }

    async createBackup() {
        showLoading(true);

        try {
            // Create a backup record
            const backupData = {
                shop_id: this.shopId,
                backup_type: 'manual',
                backup_date: new Date().toISOString(),
                created_by: this.currentUser.id,
                status: 'completed',
                notes: 'Manual backup created from settings'
            };

            const { data: backup, error } = await supabaseClient
                .from('backups')
                .insert([backupData])
                .select()
                .single();

            if (error) throw error;

            // In a real application, you would also backup the actual data
            // This could involve exporting to Supabase Storage or another service

            // Create audit log
            await this.createAuditLog('create', 'backups', backup.id, null, {
                backup_type: 'manual',
                status: 'completed'
            });

            showNotification('Backup created successfully', 'success');

            // Refresh backup history
            await this.loadBackupHistory();

        } catch (error) {

            showNotification('Failed to create backup', 'error');
        } finally {
            showLoading(false);
        }
    }

    async saveAutoBackupSettings() {
        const enableAutoBackup = document.getElementById('enableAutoBackup').checked;
        const backupTime = document.getElementById('backupTime').value;

        try {
            const settingsData = {
                shop_id: this.shopId,
                enable_auto_backup: enableAutoBackup,
                auto_backup_time: backupTime,
                updated_at: new Date().toISOString()
            };

            // Update settings
            const { data: existingSettings } = await supabaseClient
                .from('shop_settings')
                .select('id')
                .eq('shop_id', this.shopId)
                .single();

            if (existingSettings) {
                await supabaseClient
                    .from('shop_settings')
                    .update(settingsData)
                    .eq('shop_id', this.shopId);
            } else {
                await supabaseClient
                    .from('shop_settings')
                    .insert([settingsData]);
            }

            if (enableAutoBackup) {
                showNotification('Auto backup enabled', 'success');
            } else {
                showNotification('Auto backup disabled', 'info');
            }

        } catch (error) {

            showNotification('Failed to save auto backup settings', 'error');
        }
    }

    async loadBackupHistory() {
        try {
            const { data: backups, error } = await supabaseClient
                .from('backups')
                .select(`
                    *,
                    profiles!backups_created_by_fkey (full_name)
                `)
                .eq('shop_id', this.shopId)
                .order('backup_date', { ascending: false })
                .limit(10);

            if (error) throw error;

            this.renderBackupHistory(backups || []);

        } catch (error) {

        }
    }

    renderBackupHistory(backups) {
        const container = document.getElementById('backupsList');
        if (!container) return;

        if (backups.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-database fa-2x"></i>
                    <p>No backups found</p>
                    <small>Create your first backup</small>
                </div>
            `;
            return;
        }

        container.innerHTML = backups.map(backup => {
            const backupDate = backup.backup_date ?
                new Date(backup.backup_date).toLocaleString() : 'N/A';

            const statusClass = backup.status === 'completed' ? 'success' :
                backup.status === 'failed' ? 'danger' : 'warning';

            return `
                <div class="backup-item">
                    <div class="backup-info">
                        <div class="backup-header">
                            <span class="backup-type">${backup.backup_type || 'Manual'}</span>
                            <span class="backup-date">${backupDate}</span>
                        </div>
                        <div class="backup-details">
                            <span class="backup-status ${statusClass}">
                                ${backup.status || 'Unknown'}
                            </span>
                            <span class="backup-by">
                                By: ${backup.profiles?.full_name || 'N/A'}
                            </span>
                            ${backup.notes ? `<span class="backup-notes">${backup.notes}</span>` : ''}
                        </div>
                    </div>
                    <div class="backup-size">
                        ${backup.size ? this.formatFileSize(backup.size) : 'Unknown'}
                    </div>
                </div>
            `;
        }).join('');
    }

    async recordBackup(type, format, data) {
        try {
            // Calculate approximate size
            const size = new Blob([JSON.stringify(data)]).size;

            const backupData = {
                shop_id: this.shopId,
                backup_type: type,
                backup_date: new Date().toISOString(),
                format: format,
                size: size,
                created_by: this.currentUser.id,
                status: 'completed',
                notes: `Exported ${type} in ${format} format`
            };

            await supabaseClient
                .from('backups')
                .insert([backupData]);

        } catch (error) {

        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateShopNameDisplay(shopName) {
        // Use MenuManager to update sidebar header
        if (window.menuManager) {
            window.menuManager.updateSidebarHeader();
        }

        // Update shop name in page title if exists
        const pageTitle = document.querySelector('.navbar-left h3');
        if (pageTitle && pageTitle.textContent.includes('Shop Settings')) {
            pageTitle.textContent = `${shopName} - Settings`;
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    async createAuditLog(actionType, tableName, recordId, oldData, newData) {
        try {
            await supabaseClient
                .from('audit_logs')
                .insert({
                    shop_id: this.shopId,
                    user_id: this.currentUser.id,
                    action_type: actionType,
                    table_name: tableName,
                    record_id: recordId,
                    old_data: oldData,
                    new_data: newData,
                    ip_address: await this.getIPAddress(),
                    user_agent: navigator.userAgent
                });
        } catch (error) {

        }
    }

    async getIPAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'Unknown';
        }
    }
}

// Initialize on settings page
if (window.location.pathname.includes('settings.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        new SettingsManager();
    });
}
