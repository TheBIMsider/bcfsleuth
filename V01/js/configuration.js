// BCFSleuth Configuration Management - Phase 3d
class ConfigurationManager {
  constructor(bcfApp) {
    this.app = bcfApp; // Reference to main app
    this.templates = [];
    this.preferences = {};
    this.processingHistory = [];
    this.currentTab = 'simple';

    // Default preferences
    this.defaultPreferences = {
      defaultExportFormat: 'excel',
      defaultPageSize: 25,
      rememberFieldSelections: true,
      showTooltips: true,
      autoSaveSession: true,
      theme: 'auto',
    };

    this.init();
  }

  init() {
    this.loadFromStorage();
    this.setupEventListeners();
    this.applyStoredPreferences();
    console.log('Configuration Manager initialized');
  }

  setupEventListeners() {
    // Template management buttons
    const saveTemplateBtn = document.getElementById('save-template-btn');
    const saveFromCurrentBtn = document.getElementById('save-from-current-btn');

    if (saveTemplateBtn) {
      saveTemplateBtn.addEventListener('click', () => this.saveNewTemplate());
    }

    if (saveFromCurrentBtn) {
      saveFromCurrentBtn.addEventListener('click', () =>
        this.saveFromCurrentSelection()
      );
    }

    // Preferences buttons
    const savePreferencesBtn = document.getElementById('save-preferences-btn');
    const resetPreferencesBtn = document.getElementById(
      'reset-preferences-btn'
    );

    if (savePreferencesBtn) {
      savePreferencesBtn.addEventListener('click', () =>
        this.savePreferences()
      );
    }

    if (resetPreferencesBtn) {
      resetPreferencesBtn.addEventListener('click', () =>
        this.resetPreferences()
      );
    }

    // History management buttons
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const exportHistoryBtn = document.getElementById('export-history-btn');

    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    if (exportHistoryBtn) {
      exportHistoryBtn.addEventListener('click', () => this.exportHistory());
    }

    // Tab switching support
    document.querySelectorAll('.tab-button').forEach((button) => {
      button.addEventListener('click', (e) => {
        if (e.target.dataset.tab === 'configuration') {
          this.refreshConfigurationDisplay();
        }
      });
    });
  }

  // ==========================================
  // TEMPLATE MANAGEMENT
  // ==========================================

  saveNewTemplate() {
    const saveBtn = document.getElementById('save-template-btn');
    const isEditing = saveBtn && saveBtn.dataset.editingId;

    if (isEditing) {
      this.updateExistingTemplate(saveBtn.dataset.editingId);
    } else {
      this.createNewTemplate();
    }
  }

  createNewTemplate() {
    const name = document.getElementById('template-name').value.trim();
    const description = document
      .getElementById('template-description')
      .value.trim();
    const filename = document.getElementById('template-filename').value.trim();

    if (!name) {
      alert('Please enter a template name');
      return;
    }

    // Check for duplicate names
    const existingTemplate = this.templates.find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );
    if (existingTemplate) {
      alert(
        'A template with this name already exists. Please choose a different name.'
      );
      return;
    }

    // Get currently selected fields
    const selectedFields = this.app.getSelectedFieldNames();
    if (!selectedFields || selectedFields.length === 0) {
      alert('Please select some fields before saving a template');
      return;
    }

    const template = {
      id: this.generateId(),
      name: name,
      description: description || '',
      selectedFields: selectedFields,
      customFilename: filename || '{project_name}_BCF_Export_{date}',
      createdDate: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      exportFormat: this.getCurrentExportFormat(),
    };

    this.templates.push(template);
    this.saveToStorage();
    this.displayTemplates();
    this.clearTemplateForm();

    console.log('Template created:', template);
    alert(`Template "${name}" saved successfully!`);
  }

  updateExistingTemplate(templateId) {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) {
      alert('Template not found');
      return;
    }

    const name = document.getElementById('template-name').value.trim();
    const description = document
      .getElementById('template-description')
      .value.trim();
    const filename = document.getElementById('template-filename').value.trim();

    if (!name) {
      alert('Please enter a template name');
      return;
    }

    // Check for duplicate names (excluding current template)
    const existingTemplate = this.templates.find(
      (t) => t.id !== templateId && t.name.toLowerCase() === name.toLowerCase()
    );
    if (existingTemplate) {
      alert(
        'A template with this name already exists. Please choose a different name.'
      );
      return;
    }

    // Get currently selected fields
    const selectedFields = this.app.getSelectedFieldNames();
    if (!selectedFields || selectedFields.length === 0) {
      alert('Please select some fields before updating the template');
      return;
    }

    // Update template properties
    template.name = name;
    template.description = description || '';
    template.selectedFields = selectedFields;
    template.customFilename = filename || '{project_name}_BCF_Export_{date}';
    template.lastUsed = new Date().toISOString();
    template.exportFormat = this.getCurrentExportFormat();

    this.saveToStorage();
    this.displayTemplates();
    this.exitEditMode();

    console.log('Template updated:', template);
    alert(`Template "${name}" updated successfully!`);
  }

  saveFromCurrentSelection() {
    const selectedFields = this.app.getSelectedFieldNames();
    if (!selectedFields || selectedFields.length === 0) {
      alert('Please select some fields first');
      return;
    }

    // Auto-generate template name based on selection
    const fieldCount = selectedFields.length;
    const hasComments = selectedFields.some((field) =>
      field.includes('comment')
    );
    const hasEssentials = ['title', 'status', 'priority'].every((field) =>
      selectedFields.includes(field)
    );

    let autoName = '';
    if (hasEssentials && hasComments) {
      autoName = `Full BCF Export (${fieldCount} fields)`;
    } else if (hasEssentials) {
      autoName = `Essential BCF Export (${fieldCount} fields)`;
    } else if (hasComments) {
      autoName = `BCF with Comments (${fieldCount} fields)`;
    } else {
      autoName = `Custom BCF Export (${fieldCount} fields)`;
    }

    // Fill the form with auto-generated values
    document.getElementById('template-name').value = autoName;
    document.getElementById(
      'template-description'
    ).value = `Auto-generated template with ${fieldCount} selected fields`;
    document.getElementById('template-filename').value =
      '{project_name}_BCF_Export_{date}';

    // Focus on the name field for easy editing
    document.getElementById('template-name').focus();
    document.getElementById('template-name').select();
  }

  applyTemplate(templateId) {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) {
      alert('Template not found');
      return;
    }

    // Clear all current selections
    this.app.clearAllFields();

    // Apply template field selections
    const fieldMapping = this.app.getFieldMapping();
    const reverseMapping = {};
    Object.entries(fieldMapping).forEach(([checkboxId, fieldName]) => {
      reverseMapping[fieldName] = checkboxId;
    });

    template.selectedFields.forEach((fieldName) => {
      const checkboxId = reverseMapping[fieldName];
      if (checkboxId) {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) {
          checkbox.checked = true;
        }
      }
    });

    // Update field selection
    this.app.updateFieldSelection();

    // Apply template's custom filename to current session
    this.preferences.customFilename = template.customFilename;

    // Update last used timestamp
    template.lastUsed = new Date().toISOString();
    this.saveToStorage();
    this.displayTemplates();

    alert(
      `Template "${template.name}" applied successfully!\nFields: ${template.selectedFields.length} selected\nFilename: ${template.customFilename}`
    );
    console.log('Template applied:', template);
  }

  deleteTemplate(templateId) {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) return;

    if (
      confirm(
        `Are you sure you want to delete the template "${template.name}"?`
      )
    ) {
      this.templates = this.templates.filter((t) => t.id !== templateId);
      this.saveToStorage();
      this.displayTemplates();
      console.log('Template deleted:', template.name);
    }
  }

  displayTemplates() {
    const templatesList = document.getElementById('templates-list');
    if (!templatesList) return;

    if (this.templates.length === 0) {
      templatesList.innerHTML = `
        <div class="empty-state">
          <p>No templates saved yet. Create your first template below.</p>
        </div>
      `;
      return;
    }

    const templatesHtml = this.templates
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .map(
        (template) => `
        <div class="template-item" data-template-id="${template.id}">
          <div class="template-info">
            <div class="template-name">${this.escapeHtml(template.name)}</div>
            <div class="template-description">${this.escapeHtml(
              template.description || 'No description'
            )}</div>
            <div class="template-meta">
              <span class="field-count">${
                template.selectedFields.length
              } fields</span>
              <span class="last-used">Last used: ${this.formatDate(
                template.lastUsed
              )}</span>
              <span class="export-format">${
                template.exportFormat || 'excel'
              }</span>
            </div>
          </div>
          <div class="template-actions">
            <button class="btn btn-primary btn-sm" onclick="window.bcfApp.configManager.applyTemplate('${
              template.id
            }')">
              Apply
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.bcfApp.configManager.editTemplate('${
              template.id
            }')">
              Edit
            </button>
            <button class="btn btn-secondary btn-sm btn-danger" onclick="window.bcfApp.configManager.deleteTemplate('${
              template.id
            }')">
              Delete
            </button>
          </div>
        </div>
      `
      )
      .join('');

    templatesList.innerHTML = templatesHtml;
  }

  // ==========================================
  // PREFERENCES MANAGEMENT
  // ==========================================

  savePreferences() {
    const preferences = {
      defaultExportFormat: document.getElementById('default-export-format')
        .value,
      defaultPageSize: parseInt(
        document.getElementById('default-page-size').value
      ),
      rememberFieldSelections: document.getElementById(
        'remember-field-selections'
      ).checked,
      showTooltips: document.getElementById('show-tooltips').checked,
      autoSaveSession: document.getElementById('auto-save-session').checked,
    };

    this.preferences = { ...this.defaultPreferences, ...preferences };
    this.saveToStorage();
    this.applyStoredPreferences();

    alert('Preferences saved successfully!');
    console.log('Preferences saved:', this.preferences);
  }

  resetPreferences() {
    if (
      confirm('Are you sure you want to reset all preferences to defaults?')
    ) {
      this.preferences = { ...this.defaultPreferences };
      this.saveToStorage();
      this.loadPreferencesIntoUI();
      this.applyStoredPreferences();
      alert('Preferences reset to defaults');
    }
  }

  applyStoredPreferences() {
    // Apply default page size
    if (this.app.advancedPreview && this.preferences.defaultPageSize) {
      this.app.advancedPreview.pageSize = this.preferences.defaultPageSize;
      const pageSizeSelect = document.getElementById('page-size');
      if (pageSizeSelect) {
        pageSizeSelect.value = this.preferences.defaultPageSize.toString();
      }
    }

    // Apply other preferences as needed
    console.log('Preferences applied:', this.preferences);
  }

  loadPreferencesIntoUI() {
    const prefs = { ...this.defaultPreferences, ...this.preferences };

    const defaultExportFormat = document.getElementById(
      'default-export-format'
    );
    const defaultPageSize = document.getElementById('default-page-size');
    const rememberFieldSelections = document.getElementById(
      'remember-field-selections'
    );
    const showTooltips = document.getElementById('show-tooltips');
    const autoSaveSession = document.getElementById('auto-save-session');

    if (defaultExportFormat)
      defaultExportFormat.value = prefs.defaultExportFormat;
    if (defaultPageSize)
      defaultPageSize.value = prefs.defaultPageSize.toString();
    if (rememberFieldSelections)
      rememberFieldSelections.checked = prefs.rememberFieldSelections;
    if (showTooltips) showTooltips.checked = prefs.showTooltips;
    if (autoSaveSession) autoSaveSession.checked = prefs.autoSaveSession;
  }

  // ==========================================
  // PROCESSING HISTORY
  // ==========================================

  addToHistory(sessionData) {
    const historyItem = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      filename: sessionData.filename || 'Unknown file',
      projectName: sessionData.projectName || 'Unknown project',
      topicCount: sessionData.topicCount || 0,
      commentCount: sessionData.commentCount || 0,
      fieldsSelected: sessionData.fieldsSelected || 0,
      exportFormat: sessionData.exportFormat || 'unknown',
      templateUsed: sessionData.templateUsed || 'Manual selection',
    };

    this.processingHistory.unshift(historyItem); // Add to beginning

    // Keep only last 50 items
    if (this.processingHistory.length > 50) {
      this.processingHistory = this.processingHistory.slice(0, 50);
    }

    this.saveToStorage();
    this.displayHistory();
    console.log('Added to history:', historyItem);
  }

  displayHistory() {
    const historyContainer = document.getElementById('processing-history');
    if (!historyContainer) return;

    if (this.processingHistory.length === 0) {
      historyContainer.innerHTML = `
        <div class="empty-state">
          <p>No processing history yet. Process some BCF files to see history.</p>
        </div>
      `;
      return;
    }

    const historyHtml = this.processingHistory
      .slice(0, 10) // Show only last 10 items
      .map(
        (item) => `
        <div class="history-item">
          <div class="history-info">
            <div class="history-filename">${this.escapeHtml(
              item.filename
            )}</div>
            <div class="history-meta">
              <span>${item.topicCount} topics, ${
          item.commentCount
        } comments</span>
              <span>${item.fieldsSelected} fields exported as ${
          item.exportFormat
        }</span>
              <span>${this.formatDate(item.timestamp)}</span>
            </div>
            <div class="history-template">Template: ${this.escapeHtml(
              item.templateUsed
            )}</div>
          </div>
          <div class="history-actions">
            <button class="btn btn-secondary btn-sm" onclick="window.bcfApp.configManager.reprocessFromHistory('${
              item.id
            }')">
              Reprocess
            </button>
          </div>
        </div>
      `
      )
      .join('');

    historyContainer.innerHTML = historyHtml;
  }

  clearHistory() {
    if (confirm('Are you sure you want to clear all processing history?')) {
      this.processingHistory = [];
      this.saveToStorage();
      this.displayHistory();
      console.log('Processing history cleared');
    }
  }

  exportHistory() {
    if (this.processingHistory.length === 0) {
      alert('No history to export');
      return;
    }

    const csvData = this.generateHistoryCSV();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `bcfsleuth_history_${
      new Date().toISOString().split('T')[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ==========================================
  // STORAGE MANAGEMENT
  // ==========================================

  saveToStorage() {
    const configData = {
      templates: this.templates,
      preferences: this.preferences,
      processingHistory: this.processingHistory,
      version: '3d.1',
    };

    try {
      localStorage.setItem('bcfsleuth_config', JSON.stringify(configData));
    } catch (error) {
      console.warn('Could not save to localStorage:', error);
    }
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('bcfsleuth_config');
      if (stored) {
        const configData = JSON.parse(stored);
        this.templates = configData.templates || [];
        this.preferences = {
          ...this.defaultPreferences,
          ...(configData.preferences || {}),
        };
        this.processingHistory = configData.processingHistory || [];
        console.log('Configuration loaded from storage');
      }
    } catch (error) {
      console.warn('Could not load from localStorage:', error);
      this.templates = [];
      this.preferences = { ...this.defaultPreferences };
      this.processingHistory = [];
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  refreshConfigurationDisplay() {
    this.displayTemplates();
    this.displayHistory();
    this.loadPreferencesIntoUI();
  }

  getCurrentExportFormat() {
    // Try to determine current export format preference
    const defaultFormat = document.getElementById('default-export-format');
    if (defaultFormat) {
      return defaultFormat.value;
    }
    return this.preferences.defaultExportFormat || 'excel';
  }

  clearTemplateForm() {
    document.getElementById('template-name').value = '';
    document.getElementById('template-description').value = '';
    document.getElementById('template-filename').value = '';
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return 'Unknown date';
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  generateHistoryCSV() {
    const headers = [
      'Timestamp',
      'Filename',
      'Project',
      'Topics',
      'Comments',
      'Fields',
      'Format',
      'Template',
    ];
    const rows = this.processingHistory.map((item) => [
      item.timestamp,
      item.filename,
      item.projectName,
      item.topicCount,
      item.commentCount,
      item.fieldsSelected,
      item.exportFormat,
      item.templateUsed,
    ]);

    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');
  }

  editTemplate(templateId) {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) {
      alert('Template not found');
      return;
    }

    // Populate the form with template data
    document.getElementById('template-name').value = template.name;
    document.getElementById('template-description').value =
      template.description || '';
    document.getElementById('template-filename').value =
      template.customFilename || '{project_name}_BCF_Export_{date}';

    // Apply the template's field selections to show what's included
    this.applyTemplateFieldsToUI(template);

    // Change the save button to "Update Template" mode
    this.enterEditMode(templateId);

    // Scroll to the form
    const templateForm = document.querySelector('.template-creation');
    if (templateForm) {
      templateForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    console.log('Editing template:', template.name);
  }

  applyTemplateFieldsToUI(template) {
    // Clear all current selections
    this.app.clearAllFields();

    // Apply template field selections to UI
    const fieldMapping = this.app.getFieldMapping();
    const reverseMapping = {};
    Object.entries(fieldMapping).forEach(([checkboxId, fieldName]) => {
      reverseMapping[fieldName] = checkboxId;
    });

    template.selectedFields.forEach((fieldName) => {
      const checkboxId = reverseMapping[fieldName];
      if (checkboxId) {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) {
          checkbox.checked = true;
        }
      }
    });

    // Update field selection display
    this.app.updateFieldSelection();
  }

  enterEditMode(templateId) {
    const saveBtn = document.getElementById('save-template-btn');
    const saveFromCurrentBtn = document.getElementById('save-from-current-btn');

    if (saveBtn) {
      saveBtn.textContent = 'Update Template';
      saveBtn.dataset.editingId = templateId;
      saveBtn.classList.add('btn-warning');
      saveBtn.classList.remove('btn-primary');
    }

    if (saveFromCurrentBtn) {
      saveFromCurrentBtn.style.display = 'none';
    }

    // Highlight the form
    const templateForm = document.querySelector('.template-form');
    if (templateForm) {
      templateForm.classList.add('editing');
    }

    // Highlight the template being edited
    const templateItem = document.querySelector(
      `[data-template-id="${templateId}"]`
    );
    if (templateItem) {
      templateItem.classList.add('editing');
    }

    // Add cancel button
    this.addCancelEditButton();
  }

  exitEditMode() {
    const saveBtn = document.getElementById('save-template-btn');
    const saveFromCurrentBtn = document.getElementById('save-from-current-btn');

    if (saveBtn) {
      saveBtn.textContent = 'Save Template';
      delete saveBtn.dataset.editingId;
      saveBtn.classList.remove('btn-warning');
      saveBtn.classList.add('btn-primary');
    }

    if (saveFromCurrentBtn) {
      saveFromCurrentBtn.style.display = 'inline-flex';
    }

    // Remove form highlighting
    const templateForm = document.querySelector('.template-form');
    if (templateForm) {
      templateForm.classList.remove('editing');
    }

    // Remove template highlighting
    document.querySelectorAll('.template-item.editing').forEach((item) => {
      item.classList.remove('editing');
    });

    // Remove cancel button
    this.removeCancelEditButton();

    // Clear form
    this.clearTemplateForm();
  }

  addCancelEditButton() {
    // Remove existing cancel button if present
    this.removeCancelEditButton();

    const formActions = document.querySelector('.template-form .form-actions');
    if (formActions) {
      const cancelBtn = document.createElement('button');
      cancelBtn.id = 'cancel-edit-btn';
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.textContent = 'Cancel Edit';
      cancelBtn.onclick = () => this.cancelEdit();

      formActions.appendChild(cancelBtn);
    }
  }

  removeCancelEditButton() {
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) {
      cancelBtn.remove();
    }
  }

  cancelEdit() {
    if (
      confirm(
        'Are you sure you want to cancel editing? Any changes will be lost.'
      )
    ) {
      this.exitEditMode();
    }
  }

  reprocessFromHistory(historyId) {
    alert('Reprocessing from history will be implemented in a future update');
  }
}
