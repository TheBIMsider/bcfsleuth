// BCFSleuth - Main Application Logic
class BCFSleuthApp {
  constructor() {
    this.selectedFiles = [];
    this.parsedData = [];
    this.selectedFields = new Set();
    this.advancedPreview = null;
    this.imageViewer = null; // Add Image Viewer reference
    this.analyticsDashboard = null; // Add Analytics Dashboard reference
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeFieldSelection();
    this.showSection('upload-section');
    this.advancedPreview = new AdvancedPreview(this);
    this.configManager = new ConfigurationManager(this);
    this.imageViewer = new ImageViewer(this); // Initialize Image Viewer
    this.analyticsDashboard = new AnalyticsDashboard(this); // Initialize Analytics Dashboard
    window.bcfApp = this; // Make globally accessible for onclick handlers

    // Initialize debug mode control
    window.BCF_DEBUG_MODE = localStorage.getItem('bcf_debug') === 'true';
    console.log(
      '🔧 BCFSleuth initialized. Debug mode:',
      window.BCF_DEBUG_MODE ? 'ON' : 'OFF'
    );
  }

  setupEventListeners() {
    console.log('🔧 Setting up event listeners...');

    // File input and drop zone - with safety checks
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    if (dropZone && fileInput) {
      console.log('✅ Drop zone and file input found');

      // Drag and drop events
      dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
      dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
      dropZone.addEventListener('drop', this.handleDrop.bind(this));
      dropZone.addEventListener('click', () => fileInput.click());

      // File input change
      fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    } else {
      console.warn('⚠️ Drop zone or file input not found');
    }

    // Process button - with safety check
    const processBtn = document.getElementById('process-btn');
    if (processBtn) {
      processBtn.addEventListener('click', this.processFiles.bind(this));
      console.log('✅ Process button listener added');
    } else {
      console.warn('⚠️ Process button not found');
    }

    // Export buttons - with safety checks
    const exportCsvBtn = document.getElementById('export-csv');
    const exportExcelBtn = document.getElementById('export-excel');

    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', this.exportCSV.bind(this));
      console.log('✅ Export CSV button listener added');
    } else {
      console.warn('⚠️ Export CSV button not found');
    }

    if (exportExcelBtn) {
      exportExcelBtn.addEventListener('click', this.exportExcel.bind(this));
      console.log('✅ Export Excel button listener added');
    } else {
      console.warn('⚠️ Export Excel button not found');
    }

    // Field selection controls - with safety checks
    const selectAllBtn = document.getElementById('select-all-fields');
    const clearAllBtn = document.getElementById('clear-all-fields');
    const selectEssentialBtn = document.getElementById('select-essential');

    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', this.selectAllFields.bind(this));
      console.log('✅ Select all fields button listener added');
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', this.clearAllFields.bind(this));
      console.log('✅ Clear all fields button listener added');
    }

    if (selectEssentialBtn) {
      selectEssentialBtn.addEventListener(
        'click',
        this.selectEssentialFields.bind(this)
      );
      console.log('✅ Select essential fields button listener added');
    }

    // Field checkboxes - with safety check
    const fieldCheckboxes = document.querySelectorAll(
      '.field-item input[type="checkbox"]'
    );
    console.log(`📋 Found ${fieldCheckboxes.length} field checkboxes`);

    fieldCheckboxes.forEach((checkbox) => {
      if (checkbox) {
        checkbox.addEventListener(
          'change',
          this.updateFieldSelection.bind(this)
        );
      }
    });

    // Tab switching event listeners - enhanced with extensive safety checks
    const tabButtons = document.querySelectorAll('.preview-tabs .tab-button');
    console.log(`🔍 Found ${tabButtons.length} tab buttons`);

    if (tabButtons.length === 0) {
      // Try alternative selector
      const altTabButtons = document.querySelectorAll('.tab-button');
      console.log(
        `🔍 Alternative search found ${altTabButtons.length} tab buttons`
      );

      altTabButtons.forEach((button, index) => {
        if (button) {
          console.log(`📋 Tab button ${index}:`, button.dataset.tab);
          button.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = e.target.dataset.tab;
            console.log('🔄 Tab clicked:', tabName);
            if (tabName && this.switchToTab) {
              this.switchToTab(tabName);
            }
          });
        }
      });
    } else {
      tabButtons.forEach((button, index) => {
        if (button) {
          console.log(`📋 Tab button ${index}:`, button.dataset.tab);
          button.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = e.target.dataset.tab;
            console.log('🔄 Tab clicked:', tabName);
            if (tabName && this.switchToTab) {
              this.switchToTab(tabName);
            }
          });
        }
      });
    }

    console.log('✅ Event listeners setup complete');
  }

  initializeFieldSelection() {
    // Start with ALL fields selected for better UX
    this.selectAllFields();
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

    // Enhanced debug logging for coordinate fields
    const coordinateFieldsSelected = Array.from(this.selectedFields).filter(
      (field) =>
        field.includes('Camera') ||
        field.includes('FieldOfView') ||
        field.includes('ViewToWorldScale') ||
        field.includes('cameraPos') ||
        field.includes('cameraTarget')
    );

    console.log('Selected fields updated:', {
      totalSelected: this.selectedFields.size,
      coordinateFields: coordinateFieldsSelected.length,
      coordinateFieldList: coordinateFieldsSelected,
      allSelected: Array.from(this.selectedFields),
    });
    if (this.advancedPreview && this.parsedData.length > 0) {
      this.advancedPreview.buildAdvancedTableHeaders();
      if (this.advancedPreview.currentTab === 'advanced') {
        this.advancedPreview.renderAdvancedTable();
      }
    }
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

    // Enable/disable export buttons based on selection with safety checks
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
    // Select all individual field checkboxes
    document
      .querySelectorAll('.field-item input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.checked = true;
      });

    // Update all section checkboxes to checked state
    document
      .querySelectorAll('.section-checkbox')
      .forEach((sectionCheckbox) => {
        sectionCheckbox.checked = true;
        sectionCheckbox.indeterminate = false;
      });

    this.updateFieldSelection();
    console.log('📋 Selected all fields and updated section checkboxes');
  }

  clearAllFields() {
    // Clear all individual field checkboxes
    document
      .querySelectorAll('.field-item input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.checked = false;
      });

    // Update all section checkboxes to unchecked state
    document
      .querySelectorAll('.section-checkbox')
      .forEach((sectionCheckbox) => {
        sectionCheckbox.checked = false;
        sectionCheckbox.indeterminate = false;
      });

    this.updateFieldSelection();
    console.log('📋 Cleared all fields and updated section checkboxes');
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

    // Update section checkbox states after essential field selection
    setTimeout(() => {
      document
        .querySelectorAll('.section-checkbox')
        .forEach((sectionCheckbox) => {
          const categoryDiv = sectionCheckbox.closest('.field-category');
          const individualCheckboxes = categoryDiv.querySelectorAll(
            '.field-item input[type="checkbox"]'
          );
          this.updateSectionCheckboxState(
            sectionCheckbox,
            individualCheckboxes
          );
        });
    }, 100);

    console.log('📋 Essential fields selected and section states updated');
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

  /**
   * Enhanced field discovery with intelligent BCF 3.0 detection
   * Only shows BCF 3.0 fields when BCF 3.0 content is actually present
   * Maintains full compatibility with BCF 2.x files
   */
  discoverAvailableFields() {
    const discoveredFields = {
      topic: new Set(),
      comment: new Set(),
      metadata: new Set(['sourceFile', 'projectName', 'bcfVersion']), // Always available
      bcf30: new Set(), // BCF 3.0 specific fields (only populated when BCF 3.0 detected)
    };

    // Track BCF versions found in the data for intelligent UI adaptation
    const bcfVersionsFound = new Set();
    let hasBCF30Content = false;

    console.log('🔍 Starting enhanced field discovery...');

    // Scan all BCF data to discover what fields actually contain data
    this.parsedData.forEach((bcfData) => {
      // Track BCF format for version-aware field discovery
      const bcfFormat =
        bcfData.bcfFormat || bcfData.version?.substring(0, 3) || '2.1';
      bcfVersionsFound.add(bcfFormat);

      console.log(`📋 Analyzing ${bcfFormat} file: ${bcfData.filename}`);

      // Always add topicIndex for BCF 2.x files
      if (bcfFormat === '2.0' || bcfFormat === '2.1') {
        discoveredFields.topic.add('topicIndex');
        console.log(`📋 Added topicIndex field for ${bcfFormat} file`);
      }

      // Check if this file has BCF 3.0 content
      if (bcfFormat === '3.0') {
        hasBCF30Content = true;
        console.log('🆔 BCF 3.0 content detected - will enable BCF 3.0 fields');
      }

      bcfData.topics.forEach((topic) => {
        // Enhanced BCF field detection with better labels support
        if (topic.title) discoveredFields.topic.add('title');
        if (topic.description) discoveredFields.topic.add('description');
        if (topic.topicStatus) discoveredFields.topic.add('status');
        if (topic.topicType) discoveredFields.topic.add('type');
        if (topic.priority) discoveredFields.topic.add('priority');
        if (topic.stage) discoveredFields.topic.add('stage');

        // Enhanced labels detection - always add labels field if any topics exist
        // This ensures labels appear in field selection even if current topics don't have labels
        // (Users might have other BCF files with labels, or want to include empty label columns)
        discoveredFields.topic.add('labels');

        // Additional check: if labels actually contain data, log it for debugging
        if (topic.labels && topic.labels.length > 0) {
          console.log(
            `📋 Topic "${topic.title}" has ${topic.labels.length} labels:`,
            topic.labels
          );
        }

        if (topic.assignedTo) discoveredFields.topic.add('assignedTo');
        if (topic.creationDate) discoveredFields.topic.add('creationDate');
        if (topic.creationAuthor) discoveredFields.topic.add('creationAuthor');
        if (topic.modifiedDate) discoveredFields.topic.add('modifiedDate');
        if (topic.modifiedAuthor) discoveredFields.topic.add('modifiedAuthor');
        if (topic.dueDate) discoveredFields.topic.add('dueDate');
        if (topic.guid) discoveredFields.metadata.add('topicGuid');
        // BCF 3.0: ServerAssignedId detection (inside topic loop)
        if (bcfFormat === '3.0' && topic.serverAssignedId) {
          discoveredFields.bcf30.add('serverAssignedId');
          console.log(
            '✅ Found ServerAssignedId field:',
            topic.serverAssignedId
          );
        }

        // BCF 3.0 specific field detection (only when BCF 3.0 content is present)
        if (bcfFormat === '3.0' && hasBCF30Content) {
          console.log('🔍 Checking BCF 3.0 fields for topic:', topic.title);

          // ServerAssignedId detection
          if (topic.serverAssignedId) {
            discoveredFields.bcf30.add('serverAssignedId');
            console.log('✅ Found ServerAssignedId field');
          }

          // Multiple ReferenceLinks detection
          if (topic.referenceLinks && topic.referenceLinks.length > 0) {
            discoveredFields.bcf30.add('referenceLinks');
            console.log(
              '✅ Found ReferenceLinks field:',
              topic.referenceLinks.length,
              'links'
            );
          }

          // DocumentReferences detection
          if (topic.documentReferences && topic.documentReferences.length > 0) {
            discoveredFields.bcf30.add('documentReferences');
            console.log(
              '✅ Found DocumentReferences field:',
              topic.documentReferences.length,
              'refs'
            );
          }

          // Header Files detection
          if (topic.headerFiles && topic.headerFiles.length > 0) {
            discoveredFields.bcf30.add('headerFiles');
            console.log(
              '✅ Found HeaderFiles field:',
              topic.headerFiles.length,
              'files'
            );
          }
        }

        // Viewpoints and comments detection (existing logic)
        if (topic.viewpoints && topic.viewpoints.length > 0) {
          discoveredFields.metadata.add('viewpointsCount');

          // Check for viewpoint coordinates (available in all BCF versions)
          const hasCoordinates = topic.viewpoints.some(
            (vp) =>
              (vp.cameraPosition &&
                (vp.cameraPosition.x !== null ||
                  vp.cameraPosition.y !== null ||
                  vp.cameraPosition.z !== null)) ||
              (vp.cameraTarget &&
                (vp.cameraTarget.x !== null ||
                  vp.cameraTarget.y !== null ||
                  vp.cameraTarget.z !== null))
          );

          if (hasCoordinates) {
            // Add all BCF camera fields to metadata
            discoveredFields.metadata.add('cameraType');
            discoveredFields.metadata.add('CameraViewPointX');
            discoveredFields.metadata.add('CameraViewPointY');
            discoveredFields.metadata.add('CameraViewPointZ');
            discoveredFields.metadata.add('CameraDirectionX');
            discoveredFields.metadata.add('CameraDirectionY');
            discoveredFields.metadata.add('CameraDirectionZ');
            discoveredFields.metadata.add('CameraUpVectorX');
            discoveredFields.metadata.add('CameraUpVectorY');
            discoveredFields.metadata.add('CameraUpVectorZ');
            discoveredFields.metadata.add('FieldOfView');
            discoveredFields.metadata.add('ViewToWorldScale');

            // Keep old names for backward compatibility
            discoveredFields.metadata.add('cameraPosX');
            discoveredFields.metadata.add('cameraPosY');
            discoveredFields.metadata.add('cameraPosZ');
            discoveredFields.metadata.add('cameraTargetX');
            discoveredFields.metadata.add('cameraTargetY');
            discoveredFields.metadata.add('cameraTargetZ');
            console.log('✅ Found viewpoint coordinates in BCF data:', {
              topicTitle: topic.title,
              viewpointCount: topic.viewpoints.length,
              coordinateViewpoints: topic.viewpoints.filter(
                (vp) =>
                  (vp.cameraPosition && vp.cameraPosition.x !== null) ||
                  (vp.cameraTarget && vp.cameraTarget.x !== null)
              ).length,
            });
          }

          // BCF 3.0: Check for viewpoint index (if BCF 3.0 content present)
          if (bcfFormat === '3.0' && hasBCF30Content) {
            const hasViewpointIndex = topic.viewpoints.some(
              (vp) => vp.index !== undefined && vp.index !== null
            );
            if (hasViewpointIndex) {
              discoveredFields.bcf30.add('viewpointIndex');
              console.log('✅ Found ViewpointIndex field');
            }
          }
        }

        if (topic.comments && topic.comments.length > 0) {
          discoveredFields.metadata.add('commentsCount');

          // Check comment fields
          topic.comments.forEach((comment) => {
            if (comment.date) discoveredFields.comment.add('commentDate');
            if (comment.author) discoveredFields.comment.add('commentAuthor');
            if (comment.comment) discoveredFields.comment.add('commentText');

            // BCF 2.x only: comment status (removed in BCF 3.0)
            if (bcfFormat !== '3.0' && comment.status) {
              discoveredFields.comment.add('commentStatus');
            }

            discoveredFields.comment.add('commentNumber'); // Always available when comments exist
          });
        }
      });
    });

    // Calculate totals including BCF 3.0 fields when present
    const totalFields =
      discoveredFields.topic.size +
      discoveredFields.comment.size +
      discoveredFields.metadata.size +
      discoveredFields.bcf30.size;

    const result = {
      topic: Array.from(discoveredFields.topic),
      comment: Array.from(discoveredFields.comment),
      metadata: Array.from(discoveredFields.metadata),
      bcf30: Array.from(discoveredFields.bcf30),
      bcfVersionsFound: Array.from(bcfVersionsFound),
      hasBCF30Content: hasBCF30Content, // NEW: Flag for UI decisions
      total: totalFields,
    };

    console.log('✅ Enhanced field discovery complete:', {
      bcfVersions: result.bcfVersionsFound,
      bcf30FieldsFound: result.bcf30.length,
      totalFields: result.total,
      hasBCF30Content: result.hasBCF30Content,
    });

    return result;
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

    // Build Topic Information category with enhanced labels support
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
          { id: 'topicIndex', label: 'Topic Index (BCF 2.x)' },
          { id: 'labels', label: 'Labels' }, // This ensures labels always appear when topic data exists
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

    // Build BCF 3.0 Fields category (ONLY if BCF 3.0 content is actually present)
    if (discoveredFields.hasBCF30Content && discoveredFields.bcf30.length > 0) {
      console.log('🆔 Building BCF 3.0 fields category...');

      const bcf30Category = this.buildFieldCategory(
        'BCF 3.0 Fields',
        discoveredFields.bcf30,
        customData,
        [
          { id: 'serverAssignedId', label: 'Server Assigned ID' },
          { id: 'referenceLinks', label: 'Reference Links' },
          { id: 'documentReferences', label: 'Document References' },
          { id: 'headerFiles', label: 'Header Files' },
          { id: 'viewpointIndex', label: 'Viewpoint Index' },
        ]
      );
      fieldCategories.appendChild(bcf30Category);
      console.log(
        '✅ Added BCF 3.0 fields category with',
        discoveredFields.bcf30.length,
        'fields'
      );

      // Add visual indicator that BCF 3.0 features are active
      const bcf30Header = bcf30Category.querySelector('h6');
      if (bcf30Header) {
        bcf30Header.innerHTML = `BCF 3.0 Fields <span style="color: var(--primary); font-weight: bold;">(${discoveredFields.bcf30.length} enhanced fields)</span>`;
      }
    } else if (discoveredFields.bcfVersionsFound.includes('3.0')) {
      console.log(
        '🔍 BCF 3.0 file detected but no BCF 3.0 fields found in topics'
      );
    } else {
      console.log(
        '📋 No BCF 3.0 content detected - BCF 3.0 fields category not shown'
      );
    }

    // Build Viewpoint Coordinates section (new section at bottom)
    const coordinateFields = discoveredFields.metadata.filter((field) =>
      [
        'cameraType',
        'CameraViewPointX',
        'CameraViewPointY',
        'CameraViewPointZ',
        'CameraDirectionX',
        'CameraDirectionY',
        'CameraDirectionZ',
        'CameraUpVectorX',
        'CameraUpVectorY',
        'CameraUpVectorZ',
        'FieldOfView',
        'ViewToWorldScale',
        'cameraPosX',
        'cameraPosY',
        'cameraPosZ',
        'cameraTargetX',
        'cameraTargetY',
        'cameraTargetZ',
      ].includes(field)
    );

    console.log('🎯 Coordinate fields found:', coordinateFields);
    console.log('🎯 All metadata fields:', discoveredFields.metadata);

    if (coordinateFields.length > 0) {
      console.log('🎯 Building Viewpoint Coordinates section...');

      const coordinatesCategory = this.buildFieldCategory(
        'Viewpoint Coordinates',
        coordinateFields,
        customData,
        [
          { id: 'cameraType', label: 'Camera Type' },
          { id: 'CameraViewPointX', label: 'CameraViewPoint X' },
          { id: 'CameraViewPointY', label: 'CameraViewPoint Y' },
          { id: 'CameraViewPointZ', label: 'CameraViewPoint Z' },
          { id: 'CameraDirectionX', label: 'CameraDirection X' },
          { id: 'CameraDirectionY', label: 'CameraDirection Y' },
          { id: 'CameraDirectionZ', label: 'CameraDirection Z' },
          { id: 'CameraUpVectorX', label: 'CameraUpVector X' },
          { id: 'CameraUpVectorY', label: 'CameraUpVector Y' },
          { id: 'CameraUpVectorZ', label: 'CameraUpVector Z' },
          { id: 'FieldOfView', label: 'FieldOfView (Perspective)' },
          { id: 'ViewToWorldScale', label: 'ViewToWorldScale (Orthogonal)' },
          { id: 'cameraPosX', label: 'Camera Position X (Legacy)' },
          { id: 'cameraPosY', label: 'Camera Position Y (Legacy)' },
          { id: 'cameraPosZ', label: 'Camera Position Z (Legacy)' },
          { id: 'cameraTargetX', label: 'Camera Target X (Legacy)' },
          { id: 'cameraTargetY', label: 'Camera Target Y (Legacy)' },
          { id: 'cameraTargetZ', label: 'Camera Target Z (Legacy)' },
        ]
      );

      // Uncheck these by default (as requested)
      coordinatesCategory
        .querySelectorAll('input[type="checkbox"]')
        .forEach((checkbox) => {
          checkbox.checked = false;
        });

      fieldCategories.appendChild(coordinatesCategory);
      console.log(
        '✅ Added Viewpoint Coordinates section with',
        coordinateFields.length,
        'fields'
      );
    } else {
      console.log('❌ No coordinate fields detected in metadata');
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

    // Create header with section-level checkbox
    const headerDiv = document.createElement('div');
    headerDiv.className = 'category-header';
    headerDiv.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      padding: 0.5rem;
      background-color: #f8f9fa;
      border-radius: 0.375rem;
      border: 1px solid #e5e7eb;
    `;

    // Section checkbox
    const sectionCheckbox = document.createElement('input');
    sectionCheckbox.type = 'checkbox';
    sectionCheckbox.id = `section-${categoryName
      .toLowerCase()
      .replace(/\s+/g, '-')}`;
    sectionCheckbox.className = 'section-checkbox';
    sectionCheckbox.style.cssText = `
      width: 1.1rem;
      height: 1.1rem;
      cursor: pointer;
    `;

    // Section label
    const sectionLabel = document.createElement('label');
    sectionLabel.setAttribute('for', sectionCheckbox.id);
    sectionLabel.style.cssText = `
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      margin: 0;
      user-select: none;
    `;
    sectionLabel.textContent = categoryName;

    // Field count indicator
    const fieldCount = fieldDefinitions.filter((def) =>
      availableFields.includes(def.id)
    ).length;
    const countSpan = document.createElement('span');
    countSpan.className = 'section-field-count';
    countSpan.style.cssText = `
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: normal;
      margin-left: 0.25rem;
    `;
    countSpan.textContent = `(${fieldCount} fields)`;
    sectionLabel.appendChild(countSpan);

    headerDiv.appendChild(sectionCheckbox);
    headerDiv.appendChild(sectionLabel);
    categoryDiv.appendChild(headerDiv);

    const gridDiv = document.createElement('div');
    gridDiv.className = 'field-grid';

    fieldDefinitions.forEach((fieldDef) => {
      if (availableFields.includes(fieldDef.id)) {
        const fieldItem = document.createElement('div');
        fieldItem.className = 'field-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `field-${fieldDef.id}`;

        // Check ALL fields by default (changed from essential only)
        checkbox.checked = true;
        // Trigger initial field selection update to count the pre-checked essential fields
        this.updateFieldSelection();
        // Select all fields by default for better UX
        this.selectAllFields();

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

    // Add event listener for section-level checkbox
    sectionCheckbox.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const categoryCheckboxes = gridDiv.querySelectorAll(
        'input[type="checkbox"]'
      );

      console.log(
        `📋 Section "${categoryName}" ${
          isChecked ? 'checked' : 'unchecked'
        } - updating ${categoryCheckboxes.length} fields`
      );

      // Update all checkboxes in this category
      categoryCheckboxes.forEach((checkbox) => {
        checkbox.checked = isChecked;
      });

      // Update the main field selection
      this.updateFieldSelection();

      // Update the section checkbox state based on individual checkboxes
      this.updateSectionCheckboxState(sectionCheckbox, categoryCheckboxes);
    });

    // Add event listeners to individual checkboxes to update section state
    const individualCheckboxes = gridDiv.querySelectorAll(
      'input[type="checkbox"]'
    );
    individualCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        this.updateSectionCheckboxState(sectionCheckbox, individualCheckboxes);
      });
    });

    // Set initial section checkbox state
    setTimeout(() => {
      this.updateSectionCheckboxState(sectionCheckbox, individualCheckboxes);
    }, 100);

    return categoryDiv;
  }

  /**
   * Update section checkbox state based on individual field checkboxes
   * - Checked: if all individual checkboxes are checked
   * - Unchecked: if no individual checkboxes are checked
   * - Indeterminate: if some but not all individual checkboxes are checked
   */
  updateSectionCheckboxState(sectionCheckbox, individualCheckboxes) {
    const checkedCount = Array.from(individualCheckboxes).filter(
      (cb) => cb.checked
    ).length;
    const totalCount = individualCheckboxes.length;

    if (checkedCount === 0) {
      // No checkboxes checked
      sectionCheckbox.checked = false;
      sectionCheckbox.indeterminate = false;
    } else if (checkedCount === totalCount) {
      // All checkboxes checked
      sectionCheckbox.checked = true;
      sectionCheckbox.indeterminate = false;
    } else {
      // Some checkboxes checked (indeterminate state)
      sectionCheckbox.checked = false;
      sectionCheckbox.indeterminate = true;
    }

    console.log(
      `📋 Section checkbox state updated: ${checkedCount}/${totalCount} checked, indeterminate: ${sectionCheckbox.indeterminate}`
    );
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
      'field-labels': 'labels', // Ensure labels mapping exists for all BCF versions
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
      'field-topicIndex': 'topicIndex',
      'field-viewpointsCount': 'viewpointsCount',
      'field-commentNumber': 'commentNumber',
      'field-commentDate': 'commentDate',
      'field-commentAuthor': 'commentAuthor',
      'field-commentText': 'commentText',
      'field-commentStatus': 'commentStatus',
      // BCF 3.0 specific field mappings (only active when BCF 3.0 content is present)
      'field-serverAssignedId': 'serverAssignedId',
      'field-referenceLinks': 'referenceLinks',
      'field-documentReferences': 'documentReferences',
      'field-headerFiles': 'headerFiles',
      'field-viewpointIndex': 'viewpointIndex',
      // Complete BCF camera coordinate mappings (available in all BCF versions)
      'field-cameraType': 'cameraType',
      'field-CameraViewPointX': 'CameraViewPointX',
      'field-CameraViewPointY': 'CameraViewPointY',
      'field-CameraViewPointZ': 'CameraViewPointZ',
      'field-CameraDirectionX': 'CameraDirectionX',
      'field-CameraDirectionY': 'CameraDirectionY',
      'field-CameraDirectionZ': 'CameraDirectionZ',
      'field-CameraUpVectorX': 'CameraUpVectorX',
      'field-CameraUpVectorY': 'CameraUpVectorY',
      'field-CameraUpVectorZ': 'CameraUpVectorZ',
      'field-FieldOfView': 'FieldOfView',
      'field-ViewToWorldScale': 'ViewToWorldScale',

      // Legacy coordinate mappings (for backward compatibility)
      'field-cameraPosX': 'cameraPosX',
      'field-cameraPosY': 'cameraPosY',
      'field-cameraPosZ': 'cameraPosZ',
      'field-cameraTargetX': 'cameraTargetX',
      'field-cameraTargetY': 'cameraTargetY',
      'field-cameraTargetZ': 'cameraTargetZ',
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
      this.showUserFeedback(
        'Please select valid BCF files (.bcf or .bcfzip)',
        'error'
      );
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
      this.showUserFeedback(
        `Error processing files: ${error.message}`,
        'error'
      );
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

  async displayResults() {
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

    // Update summary info with safety checks
    const projectNameElement = document.getElementById('project-name');
    const bcfVersionElement = document.getElementById('bcf-version');
    const topicCountElement = document.getElementById('topic-count');
    const filesProcessedElement = document.getElementById('files-processed');

    if (projectNameElement) {
      projectNameElement.textContent =
        projectNames.size === 1
          ? Array.from(projectNames)[0]
          : `${projectNames.size} projects`;
    }

    if (bcfVersionElement) {
      bcfVersionElement.textContent =
        bcfVersions.size === 1
          ? Array.from(bcfVersions)[0]
          : Array.from(bcfVersions).join(', ');
    }

    if (topicCountElement) {
      topicCountElement.textContent = totalTopics;
    }

    if (filesProcessedElement) {
      filesProcessedElement.textContent = this.selectedFiles.length;
    }

    // Update field selection UI with discovered custom data
    this.updateFieldSelectionWithCustomData();

    // Enable export buttons (if fields are selected) with safety checks
    this.updateFieldCount();

    // Update button text with safety check
    const exportExcelButton = document.getElementById('export-excel');
    if (exportExcelButton) {
      exportExcelButton.textContent = 'Download Excel';
    }

    // Display preview data
    this.displayPreviewTable();
    if (this.advancedPreview) {
      this.advancedPreview.initialize();
      this.advancedPreview.updateData(this.parsedData);
    }

    // Store parsed data for lazy image loading
    // Don't extract images yet - this happens when Image Viewer tab is clicked
    if (this.imageViewer) {
      this.imageViewer.initialize();
      // Store data but don't extract images yet
      this.imageViewer.parsedData = this.parsedData;
    }

    // Initialize Analytics Dashboard with parsed data
    if (this.analyticsDashboard) {
      this.analyticsDashboard.initialize();
      await this.analyticsDashboard.updateData(this.parsedData);
    }

    this.showSection('results-section');

    // Attach export button listeners now that the UI is built
    this.attachExportListeners();

    // FINAL VALIDATION: Test coordinate field availability
    this.validateCoordinateFieldImplementation();
  }

  /**
   * Validate that coordinate fields are properly implemented
   * This helps debug any remaining issues
   */
  validateCoordinateFieldImplementation() {
    console.log('🔍 FINAL VALIDATION: Coordinate Field Implementation');

    // Check UI field discovery
    const coordinateCheckboxes = document.querySelectorAll(
      'input[id*="Camera"], input[id*="FieldOfView"], input[id*="ViewToWorldScale"], input[id*="cameraPos"], input[id*="cameraTarget"]'
    );
    console.log(
      `✅ Found ${coordinateCheckboxes.length} coordinate checkboxes in UI`
    );

    // Check parsed data
    let totalTopicsWithCoordinates = 0;
    let totalViewpointsWithCoordinates = 0;

    this.parsedData.forEach((bcfData) => {
      bcfData.topics.forEach((topic) => {
        if (topic.viewpoints && topic.viewpoints.length > 0) {
          const coordinateViewpoints = topic.viewpoints.filter(
            (vp) => vp.cameraType || vp.CameraViewPoint || vp.cameraPosition
          );

          if (coordinateViewpoints.length > 0) {
            totalTopicsWithCoordinates++;
            totalViewpointsWithCoordinates += coordinateViewpoints.length;
          }
        }
      });
    });

    console.log('✅ Coordinate data summary:', {
      topicsWithCoordinates: totalTopicsWithCoordinates,
      viewpointsWithCoordinates: totalViewpointsWithCoordinates,
      coordinateFieldsInUI: coordinateCheckboxes.length,
      implementationComplete:
        coordinateCheckboxes.length >= 18 && totalViewpointsWithCoordinates > 0,
    });

    // Test field mapping
    const mapping = this.getFieldMapping();
    const coordinateFieldMappings = Object.keys(mapping).filter(
      (key) =>
        key.includes('Camera') ||
        key.includes('FieldOfView') ||
        key.includes('ViewToWorldScale') ||
        key.includes('cameraPos') ||
        key.includes('cameraTarget')
    );

    console.log('✅ Field mapping validation:', {
      coordinateFieldMappings: coordinateFieldMappings.length,
      mappingComplete: coordinateFieldMappings.length >= 18,
    });

    if (
      coordinateCheckboxes.length >= 18 &&
      coordinateFieldMappings.length >= 18
    ) {
      console.log('🎉 COORDINATE FIELD IMPLEMENTATION COMPLETE!');
    } else {
      console.warn('⚠️ Coordinate field implementation may be incomplete');
    }
  }

  /**
   * Attach export button event listeners
   * Called after results are displayed to ensure buttons exist
   */
  attachExportListeners() {
    console.log('🔧 Attaching export listeners...');

    // Find the export controls container
    const exportControls = document.getElementById('main-export-controls');
    if (!exportControls) {
      console.error('❌ Export controls container not found');
      return;
    }

    // Check if buttons already exist
    let exportCsvBtn = document.getElementById('export-csv');
    let exportExcelBtn = document.getElementById('export-excel');

    if (!exportCsvBtn || !exportExcelBtn) {
      console.log('🔧 Export buttons not found, creating them...');

      // Create export buttons container if it doesn't exist
      let exportButtonsContainer =
        exportControls.querySelector('.export-buttons');
      if (!exportButtonsContainer) {
        exportButtonsContainer = document.createElement('div');
        exportButtonsContainer.className = 'export-buttons';
        exportButtonsContainer.style.cssText = `
          margin-top: 1rem;
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 1rem;
          justify-content: flex-start;
        `;
        exportControls.appendChild(exportButtonsContainer);
      }

      // Create CSV button if it doesn't exist
      if (!exportCsvBtn) {
        exportCsvBtn = document.createElement('button');
        exportCsvBtn.id = 'export-csv';
        exportCsvBtn.className = 'btn btn-secondary';
        exportCsvBtn.textContent = 'Download CSV';
        exportCsvBtn.style.cssText = `
          padding: 0.5rem 1rem;
          background-color: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          cursor: pointer;
        `;
        exportButtonsContainer.appendChild(exportCsvBtn);
      }

      // Create Excel button if it doesn't exist
      if (!exportExcelBtn) {
        exportExcelBtn = document.createElement('button');
        exportExcelBtn.id = 'export-excel';
        exportExcelBtn.className = 'btn btn-primary';
        exportExcelBtn.textContent = 'Download Excel';
        exportExcelBtn.disabled = false; // Enable by default after processing
        exportExcelBtn.style.cssText = `
          padding: 0.5rem 1rem;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
        `;
        exportButtonsContainer.appendChild(exportExcelBtn);
      }
    }

    // Now attach event listeners
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', this.exportCSV.bind(this));
      console.log('✅ Export CSV button listener attached');
    } else {
      console.error('❌ Export CSV button still not found');
    }

    if (exportExcelBtn) {
      exportExcelBtn.addEventListener('click', this.exportExcel.bind(this));
      console.log('✅ Export Excel button listener attached');
    } else {
      console.error('❌ Export Excel button still not found');
    }
  }

  displayPreviewTable() {
    const tbody = document.getElementById('preview-tbody');
    tbody.innerHTML = '';

    // Get first 5 topics across all files
    let topicCount = 0;
    const maxPreview = 5;
    let totalTopics = 0;
    let totalComments = 0;

    // Count totals
    for (const data of this.parsedData) {
      totalTopics += data.topics.length;
      for (const topic of data.topics) {
        totalComments += topic.comments ? topic.comments.length : 0;
      }
    }

    // Display first 5 topics
    for (const data of this.parsedData) {
      for (const topic of data.topics) {
        if (topicCount >= maxPreview) break;

        const row = document.createElement('tr');
        row.className = 'row-type-topic';
        row.innerHTML = `
        <td>${this.escapeHtml(topic.title || 'Untitled')}</td>
        <td><span class="status-badge status-${(topic.topicStatus || 'unknown')
          .toLowerCase()
          .replace(/\s+/g, '-')}">${this.escapeHtml(
          topic.topicStatus || 'Unknown'
        )}</span></td>
        <td><span class="priority-badge priority-${(
          topic.priority || 'normal'
        ).toLowerCase()}">${this.escapeHtml(
          topic.priority || 'Normal'
        )}</span></td>
        <td>${this.escapeHtml(topic.creationAuthor || 'Unknown')}</td>
        <td>${this.formatDate(topic.creationDate)}</td>
      `;
        tbody.appendChild(row);
        topicCount++;
      }
      if (topicCount >= maxPreview) break;
    }

    // Update simple preview summary
    const summaryElement = document.getElementById('simple-summary');
    if (summaryElement) {
      summaryElement.innerHTML = `
  Showing ${Math.min(
    5,
    totalTopics
  )} of ${totalTopics} topics, ${totalComments} total comments. 
  <strong>Switch to Advanced Preview for full functionality.</strong>
`;
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
        this.showUserFeedback(
          'Please select at least one field to export',
          'warning'
        );
        return;
      }

      const csvData = CSVExporter.export(this.parsedData, selectedFields);

      // Generate filename using template system
      const filename = this.generateExportFilename('csv');

      this.downloadFile(csvData, filename, 'text/csv');

      // Add to processing history
      this.addToProcessingHistory('csv', selectedFields.length);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      this.showUserFeedback(`Error exporting CSV: ${error.message}`, 'error');
    }
  }

  exportExcel() {
    try {
      const selectedFields = this.getSelectedFieldNames();
      if (selectedFields.length === 0) {
        this.showUserFeedback(
          'Please select at least one field to export',
          'warning'
        );
        return;
      }

      const excelBuffer = ExcelExporter.export(this.parsedData, selectedFields);

      // Generate filename using template system
      const filename = this.generateExportFilename('xlsx');

      this.downloadExcelFile(excelBuffer, filename);

      // Add to processing history
      this.addToProcessingHistory('excel', selectedFields.length);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      this.showUserFeedback(`Error exporting Excel: ${error.message}`, 'error');
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

  /**
   * Standardized error and feedback messaging
   * Provides consistent user feedback across the application
   * @param {string} message - The message to display
   * @param {string} type - Type of message: 'error', 'warning', 'success', 'info'
   * @param {number} duration - How long to show the message (milliseconds), 0 = permanent
   */
  showUserFeedback(message, type = 'error', duration = 5000) {
    console.log(`📢 User Feedback (${type}):`, message);

    // For now, use the existing simple alert for errors (we'll enhance this in future phases)
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else if (type === 'warning') {
      alert(`Warning: ${message}`);
    } else if (type === 'success') {
      // For success messages, we could show a brief toast notification
      console.log('✅ Success:', message);
      // Future enhancement: replace with toast notification
    } else {
      alert(message);
    }
  }

  /**
   * Debug logging that respects debug mode setting
   * @param {string} message - Debug message
   * @param {any} data - Optional data to log
   */
  debugLog(message, data = null) {
    if (window.BCF_DEBUG_MODE) {
      if (data !== null) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  }

  /**
   * Toggle debug mode on/off
   * Can be called from browser console: window.bcfApp.toggleDebugMode()
   */
  toggleDebugMode() {
    window.BCF_DEBUG_MODE = !window.BCF_DEBUG_MODE;
    localStorage.setItem('bcf_debug', window.BCF_DEBUG_MODE.toString());
    console.log(
      '🔧 Debug mode',
      window.BCF_DEBUG_MODE ? 'ENABLED' : 'DISABLED'
    );

    if (window.BCF_DEBUG_MODE) {
      console.log(
        '💡 Debug features active. Use window.bcfApp.debugLog() for conditional logging.'
      );
    }

    return window.BCF_DEBUG_MODE;
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
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  generateExportFilename(extension) {
    // Get current template filename or use default
    let template = '{project_name}_BCF_Export_{date}';

    // Try to get template from configuration if available
    if (this.configManager && this.configManager.preferences.customFilename) {
      template = this.configManager.preferences.customFilename;
    }

    // Get project name from parsed data
    let projectName = 'BCF_Export';
    if (this.parsedData && this.parsedData.length > 0) {
      const firstProject = this.parsedData[0].project;
      if (firstProject && firstProject.name) {
        projectName = firstProject.name.replace(/[^a-zA-Z0-9]/g, '_');
      }
    }

    // Get current date and time
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS

    // Replace template variables
    let filename = template
      .replace(/{project_name}/g, projectName)
      .replace(/{date}/g, date)
      .replace(/{time}/g, time)
      .replace(/{template_name}/g, 'Export');

    // Add extension
    filename += `.${extension}`;

    return filename;
  }

  addToProcessingHistory(exportFormat, fieldCount) {
    if (!this.configManager) return;

    // Calculate summary data
    let totalTopics = 0;
    let totalComments = 0;
    let projectName = 'Unknown';
    let filename = 'Unknown';

    if (this.parsedData && this.parsedData.length > 0) {
      this.parsedData.forEach((data) => {
        totalTopics += data.topics.length;
        data.topics.forEach((topic) => {
          totalComments += topic.comments ? topic.comments.length : 0;
        });
      });

      projectName = this.parsedData[0].project.name || 'Unknown';
      filename = this.parsedData[0].filename || 'Unknown';
    }

    const historyData = {
      filename: filename,
      projectName: projectName,
      topicCount: totalTopics,
      commentCount: totalComments,
      fieldsSelected: fieldCount,
      exportFormat: exportFormat,
      templateUsed: 'Manual selection', // Will be enhanced later for actual templates
    };

    this.configManager.addToHistory(historyData);
  }

  /**
   * Enhanced tab switching with Image Viewer support
   * This method handles the logic for switching between tabs
   */
  switchToTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach((button) => {
      button.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach((content) => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Show/hide export controls based on tab
    const exportControls = document.getElementById('main-export-controls');
    if (exportControls) {
      if (tabName === 'simple' || tabName === 'advanced') {
        exportControls.style.display = 'block';
      } else {
        exportControls.style.display = 'none';
      }
    }

    // Handle tab-specific initialization
    if (tabName === 'advanced' && this.advancedPreview) {
      this.advancedPreview.buildAdvancedTableHeaders();
      this.advancedPreview.renderAdvancedTable();
    } else if (tabName === 'image-viewer') {
      // Initialize image viewer when tab is first opened (async for lazy loading)
      this.initializeImageViewer().catch((error) => {
        console.error('Error initializing Image Viewer:', error);
      });
    } else if (tabName === 'analytics') {
      // Initialize analytics dashboard when tab is opened
      this.initializeAnalyticsDashboard().catch((error) => {
        console.error('Error initializing Analytics Dashboard:', error);
      });
    } else if (tabName === 'configuration' && this.configManager) {
      this.configManager.refreshConfigurationDisplay();
    }

    console.log(`Switched to ${tabName} tab`);
  }

  /**
   * Initialize the Image Viewer tab
   * This will be enhanced in the next step to show actual BCF images
   */
  async initializeImageViewer() {
    console.log('🖼️ Initializing Image Viewer...');

    if (this.parsedData && this.parsedData.length > 0 && this.imageViewer) {
      // BCF files are loaded - trigger lazy image extraction
      this.imageViewer.initialize();
      await this.imageViewer.updateData(this.parsedData);
    } else if (this.imageViewer && this.imageViewer.parsedData) {
      // Use stored data if available
      this.imageViewer.initialize();
      await this.imageViewer.updateData(this.imageViewer.parsedData);
    } else {
      // No BCF files loaded yet - show the no images message
      const noImagesMessage = document.getElementById('no-images-message');
      const imageCardsContainer = document.getElementById(
        'image-cards-container'
      );
      const imagePagination = document.getElementById('image-pagination');

      if (noImagesMessage) noImagesMessage.style.display = 'block';
      if (imageCardsContainer) imageCardsContainer.style.display = 'none';
      if (imagePagination) imagePagination.style.display = 'none';
    }
  }

  /**
   * Initialize the Analytics Dashboard tab
   * This handles real-time chart generation when the tab is accessed
   */
  async initializeAnalyticsDashboard() {
    console.log('📊 Initializing Analytics Dashboard...');

    if (
      this.parsedData &&
      this.parsedData.length > 0 &&
      this.analyticsDashboard
    ) {
      // BCF files are loaded - update analytics with current data
      this.analyticsDashboard.initialize();
      await this.analyticsDashboard.updateData(this.parsedData);
    } else if (this.analyticsDashboard) {
      // No BCF files loaded yet - show the no data message
      this.analyticsDashboard.initialize();
      this.analyticsDashboard.showNoDataMessage();
    } else {
      console.warn('Analytics Dashboard not available');
    }
  }

  /**
   * Helper method to count total topics across all parsed BCF files
   */
  getTotalTopics() {
    if (!this.parsedData || this.parsedData.length === 0) return 0;

    return this.parsedData.reduce((total, bcfData) => {
      return total + (bcfData.topics ? bcfData.topics.length : 0);
    }, 0);
  }
}

// Utility function for scrolling to export options
function scrollToExportOptions() {
  const exportSection = document.querySelector('.export-controls');
  if (exportSection) {
    exportSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    // Briefly highlight the export section
    exportSection.style.transition = 'background-color 0.3s ease';
    exportSection.style.backgroundColor = 'var(--primary)';
    exportSection.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';

    setTimeout(() => {
      exportSection.style.backgroundColor = '';
    }, 2000);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new BCFSleuthApp();
});
