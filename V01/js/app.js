// BCFSleuth - Main Application Logic
class BCFSleuthApp {
  constructor() {
    this.selectedFiles = [];
    this.parsedData = [];
    this.selectedFields = new Set();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeFieldSelection();
    this.showSection('upload-section');
  }

  setupEventListeners() {
    // File input and drop zone
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    // Drag and drop events
    dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
    dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    dropZone.addEventListener('drop', this.handleDrop.bind(this));
    dropZone.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', this.handleFileSelect.bind(this));

    // Process button
    document
      .getElementById('process-btn')
      .addEventListener('click', this.processFiles.bind(this));

    // Export buttons
    document
      .getElementById('export-csv')
      .addEventListener('click', this.exportCSV.bind(this));
    document
      .getElementById('export-excel')
      .addEventListener('click', this.exportExcel.bind(this));

    // Field selection controls
    document
      .getElementById('select-all-fields')
      .addEventListener('click', this.selectAllFields.bind(this));
    document
      .getElementById('clear-all-fields')
      .addEventListener('click', this.clearAllFields.bind(this));
    document
      .getElementById('select-essential')
      .addEventListener('click', this.selectEssentialFields.bind(this));

    // Field checkboxes
    document
      .querySelectorAll('.field-item input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.addEventListener(
          'change',
          this.updateFieldSelection.bind(this)
        );
      });
  }

  initializeFieldSelection() {
    // Start with static field selection, will be updated after BCF processing
    this.updateFieldSelection();
  }

  updateFieldSelection() {
    this.selectedFields.clear();

    document
      .querySelectorAll('.field-item input[type="checkbox"]:checked')
      .forEach((checkbox) => {
        this.selectedFields.add(checkbox.id);
      });

    this.updateFieldCount();
    console.log('Selected fields updated:', Array.from(this.selectedFields)); // Debug log
  }

  updateFieldCount() {
    const total = document.querySelectorAll(
      '.field-item input[type="checkbox"]'
    ).length;
    const selected = this.selectedFields.size;

    const fieldCountElement = document.getElementById('field-count');
    if (fieldCountElement) {
      fieldCountElement.textContent = `${selected} of ${total} fields selected`;
    }

    // Enable/disable export buttons based on selection
    const hasFields = selected > 0;
    const csvButton = document.getElementById('export-csv');
    const excelButton = document.getElementById('export-excel');

    if (csvButton) {
      csvButton.disabled = !hasFields || this.parsedData.length === 0;
    }
    if (excelButton) {
      excelButton.disabled = !hasFields || this.parsedData.length === 0;
    }

    console.log(`Field count updated: ${selected}/${total} selected`); // Debug log
  }

  selectAllFields() {
    document
      .querySelectorAll('.field-item input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.checked = true;
      });
    this.updateFieldSelection();
  }

  clearAllFields() {
    document
      .querySelectorAll('.field-item input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.checked = false;
      });
    this.updateFieldSelection();
  }

  selectEssentialFields() {
    // Clear all first
    this.clearAllFields();

    // Select essential fields - these should match the IDs created in buildFieldCategory
    const essentialFields = [
      'field-title',
      'field-description',
      'field-status',
      'field-priority',
      'field-creationDate',
      'field-creationAuthor',
      'field-sourceFile',
      'field-projectName',
      'field-commentsCount',
      'field-commentNumber',
      'field-commentDate',
      'field-commentAuthor',
      'field-commentText',
    ];

    essentialFields.forEach((fieldId) => {
      const checkbox = document.getElementById(fieldId);
      if (checkbox) {
        checkbox.checked = true;
      }
    });

    this.updateFieldSelection();
    console.log('Essential fields selected'); // Debug log
  }

  updateFieldSelectionWithCustomData() {
    // Discover what fields are actually available in the loaded BCF data
    const discoveredFields = this.discoverAvailableFields();

    // Analyze all parsed BCF data to find custom values
    const customFieldData = this.analyzeCustomFieldUsage();

    // Discover custom fields from raw XML data
    const customFieldRegistry = this.discoverCustomFields();

    // Rebuild the entire field selection UI based on discovered data
    this.rebuildFieldSelectionUI(
      discoveredFields,
      customFieldData,
      customFieldRegistry
    );

    // Store custom data for potential future use
    this.customFieldData = customFieldData;
    this.discoveredFields = discoveredFields;

    console.log(
      `Dynamic field detection complete: ${discoveredFields.total} fields available`
    );
  }

  analyzeCustomFieldUsage() {
    const customData = {
      status: new Set(),
      type: new Set(),
      priority: new Set(),
      labels: new Set(),
      stage: new Set(),
      hasExtensions: false,
    };

    this.parsedData.forEach((bcfData) => {
      // Check for extensions data
      if (bcfData.extensions && bcfData.extensions.customFields) {
        customData.hasExtensions = true;

        // Add custom values from extensions.xsd
        if (bcfData.extensions.customFields.topicStatus) {
          bcfData.extensions.customFields.topicStatus.forEach((value) =>
            customData.status.add(value)
          );
        }
        if (bcfData.extensions.customFields.topicType) {
          bcfData.extensions.customFields.topicType.forEach((value) =>
            customData.type.add(value)
          );
        }
        if (bcfData.extensions.customFields.priority) {
          bcfData.extensions.customFields.priority.forEach((value) =>
            customData.priority.add(value)
          );
        }
        if (bcfData.extensions.customFields.topicLabel) {
          bcfData.extensions.customFields.topicLabel.forEach((value) =>
            customData.labels.add(value)
          );
        }
      }

      // Also analyze actual topic data for used values
      bcfData.topics.forEach((topic) => {
        if (topic.topicStatus) customData.status.add(topic.topicStatus);
        if (topic.topicType) customData.type.add(topic.topicType);
        if (topic.priority) customData.priority.add(topic.priority);
        if (topic.stage) customData.stage.add(topic.stage);
        if (topic.labels && topic.labels.length > 0) {
          topic.labels.forEach((label) => customData.labels.add(label));
        }
      });
    });

    // Convert Sets to Arrays and get counts
    return {
      status: {
        values: Array.from(customData.status),
        count: customData.status.size,
      },
      type: {
        values: Array.from(customData.type),
        count: customData.type.size,
      },
      priority: {
        values: Array.from(customData.priority),
        count: customData.priority.size,
      },
      labels: {
        values: Array.from(customData.labels),
        count: customData.labels.size,
      },
      stage: {
        values: Array.from(customData.stage),
        count: customData.stage.size,
      },
      hasExtensions: customData.hasExtensions,
    };
  }

  updateFieldLabelsWithCustomIndicators(customData) {
    // Define standard BCF values to identify custom ones
    const standardValues = {
      status: ['Open', 'In Progress', 'Closed', 'ReOpened'],
      type: ['Issue', 'Request', 'Question', 'Remark'],
      priority: ['Low', 'Normal', 'High', 'Critical'],
    };

    // Update Status field
    const statusLabel = document.querySelector('label[for="field-status"]');
    if (statusLabel && customData.status.count > 0) {
      const customStatusCount = customData.status.values.filter(
        (value) => !standardValues.status.includes(value)
      ).length;

      if (customStatusCount > 0) {
        statusLabel.innerHTML = `Status <span class="custom-indicator">(${customStatusCount} custom)</span>`;
      }
    }

    // Update Type field
    const typeLabel = document.querySelector('label[for="field-type"]');
    if (typeLabel && customData.type.count > 0) {
      const customTypeCount = customData.type.values.filter(
        (value) => !standardValues.type.includes(value)
      ).length;

      if (customTypeCount > 0) {
        typeLabel.innerHTML = `Type <span class="custom-indicator">(${customTypeCount} custom)</span>`;
      }
    }

    // Update Priority field
    const priorityLabel = document.querySelector('label[for="field-priority"]');
    if (priorityLabel && customData.priority.count > 0) {
      const customPriorityCount = customData.priority.values.filter(
        (value) => !standardValues.priority.includes(value)
      ).length;

      if (customPriorityCount > 0) {
        priorityLabel.innerHTML = `Priority <span class="custom-indicator">(${customPriorityCount} custom)</span>`;
      }
    }

    // Update Labels field (all labels are essentially custom)
    const labelsLabel = document.querySelector('label[for="field-labels"]');
    if (labelsLabel && customData.labels.count > 0) {
      labelsLabel.innerHTML = `Labels <span class="custom-indicator">(${customData.labels.count} found)</span>`;
    }

    // Update Stage field (all stages are custom)
    const stageLabel = document.querySelector('label[for="field-stage"]');
    if (stageLabel && customData.stage.count > 0) {
      stageLabel.innerHTML = `Stage <span class="custom-indicator">(${customData.stage.count} found)</span>`;
    }

    // Add extensions indicator if present
    if (customData.hasExtensions) {
      console.log('Extensions detected - custom field definitions available');
    }
  }

  discoverAvailableFields() {
    const discoveredFields = {
      topic: new Set(),
      comment: new Set(),
      metadata: new Set(['sourceFile', 'projectName', 'bcfVersion']), // Always available
    };

    // Scan all BCF data to discover what fields actually contain data
    this.parsedData.forEach((bcfData) => {
      bcfData.topics.forEach((topic) => {
        // Check topic fields
        if (topic.title) discoveredFields.topic.add('title');
        if (topic.description) discoveredFields.topic.add('description');
        if (topic.topicStatus) discoveredFields.topic.add('status');
        if (topic.topicType) discoveredFields.topic.add('type');
        if (topic.priority) discoveredFields.topic.add('priority');
        if (topic.stage) discoveredFields.topic.add('stage');
        if (topic.labels && topic.labels.length > 0)
          discoveredFields.topic.add('labels');
        if (topic.assignedTo) discoveredFields.topic.add('assignedTo');
        if (topic.creationDate) discoveredFields.topic.add('creationDate');
        if (topic.creationAuthor) discoveredFields.topic.add('creationAuthor');
        if (topic.modifiedDate) discoveredFields.topic.add('modifiedDate');
        if (topic.modifiedAuthor) discoveredFields.topic.add('modifiedAuthor');
        if (topic.dueDate) discoveredFields.topic.add('dueDate');
        if (topic.guid) discoveredFields.metadata.add('topicGuid');
        if (topic.viewpoints && topic.viewpoints.length > 0)
          discoveredFields.metadata.add('viewpointsCount');
        if (topic.comments && topic.comments.length > 0) {
          discoveredFields.metadata.add('commentsCount');

          // Check comment fields
          topic.comments.forEach((comment) => {
            if (comment.date) discoveredFields.comment.add('commentDate');
            if (comment.author) discoveredFields.comment.add('commentAuthor');
            if (comment.comment) discoveredFields.comment.add('commentText');
            if (comment.status) discoveredFields.comment.add('commentStatus');
            discoveredFields.comment.add('commentNumber'); // Always available when comments exist
          });
        }
      });
    });

    return {
      topic: Array.from(discoveredFields.topic),
      comment: Array.from(discoveredFields.comment),
      metadata: Array.from(discoveredFields.metadata),
      total:
        discoveredFields.topic.size +
        discoveredFields.comment.size +
        discoveredFields.metadata.size,
    };
  }

  discoverCustomFields() {
    const customFieldRegistry = {
      topicCustomFields: new Map(),
      commentCustomFields: new Map(),
      totalCustomFields: 0,
    };

    this.parsedData.forEach((bcfData) => {
      bcfData.topics.forEach((topic) => {
        // Analyze topic custom fields
        if (topic._customFields) {
          Object.entries(topic._customFields).forEach(([fieldName, value]) => {
            if (value && value.toString().trim()) {
              if (!customFieldRegistry.topicCustomFields.has(fieldName)) {
                customFieldRegistry.topicCustomFields.set(fieldName, {
                  values: new Set(),
                  count: 0,
                  displayName: this.makeDisplayName(fieldName),
                  category: this.categorizeCustomField(fieldName),
                });
              }
              const fieldData =
                customFieldRegistry.topicCustomFields.get(fieldName);
              fieldData.values.add(value.toString().trim());
              fieldData.count++;
            }
          });
        }

        // Analyze comment custom fields
        if (topic.comments) {
          topic.comments.forEach((comment) => {
            if (comment._customFields) {
              Object.entries(comment._customFields).forEach(
                ([fieldName, value]) => {
                  if (value && value.toString().trim()) {
                    if (
                      !customFieldRegistry.commentCustomFields.has(fieldName)
                    ) {
                      customFieldRegistry.commentCustomFields.set(fieldName, {
                        values: new Set(),
                        count: 0,
                        displayName: this.makeDisplayName(fieldName),
                        category: this.categorizeCustomField(fieldName),
                      });
                    }
                    const fieldData =
                      customFieldRegistry.commentCustomFields.get(fieldName);
                    fieldData.values.add(value.toString().trim());
                    fieldData.count++;
                  }
                }
              );
            }
          });
        }
      });
    });

    customFieldRegistry.totalCustomFields =
      customFieldRegistry.topicCustomFields.size +
      customFieldRegistry.commentCustomFields.size;

    console.log(
      `Discovered ${customFieldRegistry.totalCustomFields} custom fields:`,
      {
        topicFields: Array.from(customFieldRegistry.topicCustomFields.keys()),
        commentFields: Array.from(
          customFieldRegistry.commentCustomFields.keys()
        ),
      }
    );

    return customFieldRegistry;
  }

  makeDisplayName(fieldName) {
    // Convert technical field names to user-friendly display names
    return fieldName
      .replace(/^(topic|comment)_/, '') // Remove prefix
      .replace(/_(attr|element)_/, ' ') // Replace separators
      .replace(/_/g, ' ') // Replace remaining underscores
      .replace(/\b\w/g, (l) => l.toUpperCase()); // Title case
  }

  categorizeCustomField(fieldName) {
    // Categorize custom fields for better organization
    if (fieldName.includes('attr')) return 'Attributes';
    if (fieldName.includes('namespace')) return 'Vendor Extensions';
    if (fieldName.includes('element')) return 'Custom Elements';
    if (fieldName.includes('comment')) return 'Comment Extensions';
    return 'Other Custom Fields';
  }

  rebuildFieldSelectionUI(
    discoveredFields,
    customData,
    customFieldRegistry = null
  ) {
    const fieldSelection = document.querySelector('.field-selection');
    if (!fieldSelection) return;

    // Update the field count header
    const fieldCountHeader = document.getElementById('field-count');
    if (fieldCountHeader) {
      fieldCountHeader.textContent = `0 of ${discoveredFields.total} available fields selected`;
    }

    // Clear existing field categories
    const fieldCategories = fieldSelection.querySelector('.field-categories');
    if (!fieldCategories) return;

    fieldCategories.innerHTML = '';

    // Build Topic Information category
    if (discoveredFields.topic.length > 0) {
      const topicCategory = this.buildFieldCategory(
        'Topic Information',
        discoveredFields.topic,
        customData,
        [
          { id: 'title', label: 'Title' },
          { id: 'description', label: 'Description' },
          { id: 'status', label: 'Status' },
          { id: 'type', label: 'Type' },
          { id: 'priority', label: 'Priority' },
          { id: 'stage', label: 'Stage' },
          { id: 'labels', label: 'Labels' },
          { id: 'assignedTo', label: 'Assigned To' },
        ]
      );
      fieldCategories.appendChild(topicCategory);
    }

    // Build Dates & Authors category
    const dateAuthorFields = discoveredFields.topic.filter((field) =>
      [
        'creationDate',
        'creationAuthor',
        'modifiedDate',
        'modifiedAuthor',
        'dueDate',
      ].includes(field)
    );
    if (dateAuthorFields.length > 0) {
      const dateCategory = this.buildFieldCategory(
        'Dates & Authors',
        dateAuthorFields,
        customData,
        [
          { id: 'creationDate', label: 'Creation Date' },
          { id: 'creationAuthor', label: 'Creation Author' },
          { id: 'modifiedDate', label: 'Modified Date' },
          { id: 'modifiedAuthor', label: 'Modified Author' },
          { id: 'dueDate', label: 'Due Date' },
        ]
      );
      fieldCategories.appendChild(dateCategory);
    }

    // Build File & Project Info category
    if (discoveredFields.metadata.length > 0) {
      const metadataCategory = this.buildFieldCategory(
        'File & Project Info',
        discoveredFields.metadata,
        customData,
        [
          { id: 'sourceFile', label: 'Source File' },
          { id: 'projectName', label: 'Project Name' },
          { id: 'bcfVersion', label: 'BCF Version' },
          { id: 'topicGuid', label: 'Topic GUID' },
        ]
      );
      fieldCategories.appendChild(metadataCategory);
    }

    // Build Comments & Counts category
    const commentFields = [
      ...discoveredFields.comment,
      ...discoveredFields.metadata.filter((field) =>
        ['commentsCount', 'viewpointsCount'].includes(field)
      ),
    ];
    if (commentFields.length > 0) {
      const commentCategory = this.buildFieldCategory(
        'Comments & Counts',
        commentFields,
        customData,
        [
          { id: 'commentsCount', label: 'Comments Count' },
          { id: 'viewpointsCount', label: 'Viewpoints Count' },
          { id: 'commentNumber', label: 'Comment Number' },
          { id: 'commentDate', label: 'Comment Date' },
          { id: 'commentAuthor', label: 'Comment Author' },
          { id: 'commentText', label: 'Comment Text' },
          { id: 'commentStatus', label: 'Comment Status' },
        ]
      );
      fieldCategories.appendChild(commentCategory);
    }

    // Re-attach event listeners to new checkboxes
    this.attachFieldSelectionListeners();

    // Trigger initial update to count pre-selected essential fields
    this.updateFieldSelection();
  }

  buildFieldCategory(
    categoryName,
    availableFields,
    customData,
    fieldDefinitions
  ) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'field-category';

    const header = document.createElement('h6');
    header.textContent = categoryName;
    categoryDiv.appendChild(header);

    const gridDiv = document.createElement('div');
    gridDiv.className = 'field-grid';

    fieldDefinitions.forEach((fieldDef) => {
      if (availableFields.includes(fieldDef.id)) {
        const fieldItem = document.createElement('div');
        fieldItem.className = 'field-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `field-${fieldDef.id}`;

        // Check essential fields by default
        const essentialFields = [
          'title',
          'description',
          'status',
          'priority',
          'creationDate',
          'creationAuthor',
          'sourceFile',
          'projectName',
          'commentsCount',
          'commentNumber',
          'commentDate',
          'commentAuthor',
          'commentText',
        ];
        checkbox.checked = essentialFields.includes(fieldDef.id);

        const label = document.createElement('label');
        label.setAttribute('for', `field-${fieldDef.id}`);

        // Add custom indicators
        let labelText = fieldDef.label;
        if (customData) {
          const customIndicator = this.getCustomIndicator(
            fieldDef.id,
            customData
          );
          if (customIndicator) {
            labelText += ` ${customIndicator}`;
          }
        }
        label.innerHTML = labelText;

        fieldItem.appendChild(checkbox);
        fieldItem.appendChild(label);
        gridDiv.appendChild(fieldItem);
      }
    });

    categoryDiv.appendChild(gridDiv);
    return categoryDiv;
  }

  getCustomIndicator(fieldId, customData) {
    const standardValues = {
      status: ['Open', 'In Progress', 'Closed', 'ReOpened'],
      type: ['Issue', 'Request', 'Question', 'Remark'],
      priority: ['Low', 'Normal', 'High', 'Critical'],
    };

    switch (fieldId) {
      case 'status':
        if (customData.status && customData.status.count > 0) {
          const customCount = customData.status.values.filter(
            (value) => !standardValues.status.includes(value)
          ).length;
          return customCount > 0
            ? `<span class="custom-indicator">(${customCount} custom)</span>`
            : '';
        }
        break;
      case 'type':
        if (customData.type && customData.type.count > 0) {
          const customCount = customData.type.values.filter(
            (value) => !standardValues.type.includes(value)
          ).length;
          return customCount > 0
            ? `<span class="custom-indicator">(${customCount} custom)</span>`
            : '';
        }
        break;
      case 'priority':
        if (customData.priority && customData.priority.count > 0) {
          const customCount = customData.priority.values.filter(
            (value) => !standardValues.priority.includes(value)
          ).length;
          return customCount > 0
            ? `<span class="custom-indicator">(${customCount} custom)</span>`
            : '';
        }
        break;
      case 'labels':
        return customData.labels && customData.labels.count > 0
          ? `<span class="custom-indicator">(${customData.labels.count} found)</span>`
          : '';
      case 'stage':
        return customData.stage && customData.stage.count > 0
          ? `<span class="custom-indicator">(${customData.stage.count} found)</span>`
          : '';
    }
    return '';
    // Add custom fields section if any were discovered
    if (customFieldRegistry && customFieldRegistry.totalCustomFields > 0) {
      const customFieldsCategory =
        this.buildCustomFieldsCategory(customFieldRegistry);
      fieldCategories.appendChild(customFieldsCategory);
    }

    // Re-attach event listeners to new checkboxes
    this.attachFieldSelectionListeners();
  }

  attachFieldSelectionListeners() {
    // Re-attach event listeners for dynamically created checkboxes
    document
      .querySelectorAll('.field-item input[type="checkbox"]')
      .forEach((checkbox) => {
        // Create a bound function reference to avoid duplicate listeners
        const boundHandler = this.updateFieldSelection.bind(this);
        checkbox.removeEventListener('change', boundHandler);
        checkbox.addEventListener('change', boundHandler);
      });

    // Trigger initial field selection update to count the pre-checked essential fields
    this.updateFieldSelection();
    console.log(
      'Field selection listeners attached to',
      document.querySelectorAll('.field-item input[type="checkbox"]').length,
      'checkboxes'
    );
  }

  getFieldMapping() {
    // Map checkbox IDs to CSV/Excel field names - updated to match dynamic UI
    return {
      'field-title': 'title',
      'field-description': 'description',
      'field-status': 'status',
      'field-type': 'type',
      'field-priority': 'priority',
      'field-stage': 'stage',
      'field-labels': 'labels',
      'field-assignedTo': 'assignedTo',
      'field-creationDate': 'creationDate',
      'field-creationAuthor': 'creationAuthor',
      'field-modifiedDate': 'modifiedDate',
      'field-modifiedAuthor': 'modifiedAuthor',
      'field-dueDate': 'dueDate',
      'field-sourceFile': 'sourceFile',
      'field-projectName': 'projectName',
      'field-bcfVersion': 'bcfVersion',
      'field-topicGuid': 'topicGuid',
      'field-commentsCount': 'commentsCount',
      'field-viewpointsCount': 'viewpointsCount',
      'field-commentNumber': 'commentNumber',
      'field-commentDate': 'commentDate',
      'field-commentAuthor': 'commentAuthor',
      'field-commentText': 'commentText',
      'field-commentStatus': 'commentStatus',
    };
  }

  getSelectedFieldNames() {
    const mapping = this.getFieldMapping();
    const selectedFieldNames = [];

    this.selectedFields.forEach((fieldId) => {
      if (mapping[fieldId]) {
        selectedFieldNames.push(mapping[fieldId]);
      }
    });

    return selectedFieldNames;
  }

  handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
  }

  handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
  }

  handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');

    const files = Array.from(event.dataTransfer.files);
    this.handleFiles(files);
  }

  handleFileSelect(event) {
    const files = Array.from(event.target.files);
    this.handleFiles(files);
  }

  handleFiles(files) {
    // Filter for BCF files
    const bcfFiles = files.filter(
      (file) =>
        file.name.toLowerCase().endsWith('.bcf') ||
        file.name.toLowerCase().endsWith('.bcfzip') ||
        file.type === 'application/zip'
    );

    if (bcfFiles.length === 0) {
      this.showError('Please select valid BCF files (.bcf or .bcfzip)');
      return;
    }

    this.selectedFiles = bcfFiles;
    this.displaySelectedFiles();
  }

  displaySelectedFiles() {
    const fileList = document.getElementById('file-list');
    const selectedFilesList = document.getElementById('selected-files');

    selectedFilesList.innerHTML = '';

    this.selectedFiles.forEach((file) => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
                <span>${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
            `;
      selectedFilesList.appendChild(listItem);
    });

    fileList.classList.remove('hidden');
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async processFiles() {
    if (this.selectedFiles.length === 0) return;

    this.showSection('status-section');
    this.showProcessingStatus('Processing BCF files...', true);

    try {
      this.parsedData = [];

      for (let i = 0; i < this.selectedFiles.length; i++) {
        const file = this.selectedFiles[i];
        this.showProcessingStatus(
          `Processing ${file.name} (${i + 1}/${this.selectedFiles.length})...`,
          true
        );

        const bcfData = await BCFParser.parse(file);
        this.parsedData.push(bcfData);

        // Small delay to show progress
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      this.showProcessingStatus('Processing complete!', false);
      this.displayResults();
    } catch (error) {
      console.error('Error processing files:', error);
      this.showError(`Error processing files: ${error.message}`);
    }
  }

  showProcessingStatus(message, showSpinner) {
    const statusText = document.getElementById('status-text');
    const spinner = document.querySelector('.spinner');

    statusText.textContent = message;

    if (showSpinner) {
      spinner.classList.remove('hidden');
    } else {
      spinner.classList.add('hidden');
    }
  }

  displayResults() {
    if (this.parsedData.length === 0) return;

    // Calculate summary stats
    let totalTopics = 0;
    let projectNames = new Set();
    let bcfVersions = new Set();

    this.parsedData.forEach((data) => {
      totalTopics += data.topics.length;
      if (data.project.name) projectNames.add(data.project.name);
      if (data.version) bcfVersions.add(data.version);
    });

    // Update summary info
    document.getElementById('project-name').textContent =
      projectNames.size === 1
        ? Array.from(projectNames)[0]
        : `${projectNames.size} projects`;
    document.getElementById('bcf-version').textContent =
      bcfVersions.size === 1
        ? Array.from(bcfVersions)[0]
        : Array.from(bcfVersions).join(', ');
    document.getElementById('topic-count').textContent = totalTopics;
    document.getElementById('files-processed').textContent =
      this.selectedFiles.length;

    // Update field selection UI with discovered custom data
    this.updateFieldSelectionWithCustomData();

    // Enable export buttons (if fields are selected)
    this.updateFieldCount();

    // Update button text
    document.getElementById('export-excel').textContent = 'Download Excel';

    // Display preview data
    this.displayPreviewTable();

    this.showSection('results-section');
  }

  displayPreviewTable() {
    const tbody = document.getElementById('preview-tbody');
    tbody.innerHTML = '';

    // Get first 5 topics across all files
    let topicCount = 0;
    const maxPreview = 5;

    for (const data of this.parsedData) {
      for (const topic of data.topics) {
        if (topicCount >= maxPreview) break;

        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${this.escapeHtml(topic.title || 'Untitled')}</td>
                    <td>${this.escapeHtml(topic.topicStatus || 'Unknown')}</td>
                    <td>${this.escapeHtml(topic.priority || 'Normal')}</td>
                    <td>${this.escapeHtml(
                      topic.creationAuthor || 'Unknown'
                    )}</td>
                    <td>${this.formatDate(topic.creationDate)}</td>
                `;
        tbody.appendChild(row);
        topicCount++;
      }
      if (topicCount >= maxPreview) break;
    }
  }

  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  exportCSV() {
    try {
      const selectedFields = this.getSelectedFieldNames();
      if (selectedFields.length === 0) {
        this.showError('Please select at least one field to export');
        return;
      }

      const csvData = CSVExporter.export(this.parsedData, selectedFields);
      this.downloadFile(csvData, 'bcf-export.csv', 'text/csv');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      this.showError(`Error exporting CSV: ${error.message}`);
    }
  }

  exportExcel() {
    try {
      const selectedFields = this.getSelectedFieldNames();
      if (selectedFields.length === 0) {
        this.showError('Please select at least one field to export');
        return;
      }

      const excelBuffer = ExcelExporter.export(this.parsedData, selectedFields);
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-');
      const filename = `bcf-export-${timestamp}.xlsx`;
      this.downloadExcelFile(excelBuffer, filename);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      this.showError(`Error exporting Excel: ${error.message}`);
    }
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  downloadExcelFile(buffer, filename) {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('main .card').forEach((card) => {
      card.classList.add('hidden');
    });

    // Show target section
    document.getElementById(sectionId).classList.remove('hidden');
  }

  showError(message) {
    // Simple error display - could be enhanced with proper modal/toast
    alert(message);
  }
  buildCustomFieldsCategory(customFieldRegistry) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'field-category';

    const header = document.createElement('h6');
    header.textContent = `Custom Fields (${customFieldRegistry.totalCustomFields} discovered)`;
    categoryDiv.appendChild(header);

    const gridDiv = document.createElement('div');
    gridDiv.className = 'field-grid';

    // Add topic custom fields
    customFieldRegistry.topicCustomFields.forEach((fieldData, fieldName) => {
      const fieldItem = document.createElement('div');
      fieldItem.className = 'field-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `field-custom-${fieldName}`;
      checkbox.checked = false; // Custom fields not selected by default

      const label = document.createElement('label');
      label.setAttribute('for', `field-custom-${fieldName}`);
      label.innerHTML = `${fieldData.displayName} <span class="custom-indicator">(${fieldData.count} values)</span>`;

      fieldItem.appendChild(checkbox);
      fieldItem.appendChild(label);
      gridDiv.appendChild(fieldItem);
    });

    // Add comment custom fields
    customFieldRegistry.commentCustomFields.forEach((fieldData, fieldName) => {
      const fieldItem = document.createElement('div');
      fieldItem.className = 'field-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `field-custom-${fieldName}`;
      checkbox.checked = false; // Custom fields not selected by default

      const label = document.createElement('label');
      label.setAttribute('for', `field-custom-${fieldName}`);
      label.innerHTML = `${fieldData.displayName} <span class="custom-indicator">(${fieldData.count} values)</span>`;

      fieldItem.appendChild(checkbox);
      fieldItem.appendChild(label);
      gridDiv.appendChild(fieldItem);
    });

    categoryDiv.appendChild(gridDiv);
    return categoryDiv;
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new BCFSleuthApp();
});
