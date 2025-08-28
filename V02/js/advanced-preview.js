// BCFSleuth Advanced Preview - Phase 3c
class AdvancedPreview {
  constructor(bcfApp) {
    this.app = bcfApp; // Reference to main BCFSleuthApp
    this.currentTab = 'simple';
    this.currentPage = 1;
    this.pageSize = 25;
    this.sortField = 'created';
    this.sortDirection = 'desc';
    this.filters = {
      search: '',
      status: '',
      priority: '',
      assignee: '',
      dueDate: '',
    };

    this.allTableData = []; // Flattened topics + comments for table display
    this.filteredData = [];
    this.isInitialized = false;

    // Track which topics are expanded
    this.expandedTopics = new Set(); // Stores topic GUIDs that are expanded
  }

  initialize() {
    if (this.isInitialized) return;

    this.setupEventListeners();
    this.isInitialized = true;
    console.log('Advanced Preview initialized');
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach((button) => {
      button.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Search input with debounce
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.applyFilters();
        }, 300); // 300ms debounce
      });
    }

    // Filter dropdowns
    [
      'status-filter',
      'priority-filter',
      'assignee-filter',
      'due-date-filter',
    ].forEach((filterId) => {
      const element = document.getElementById(filterId);
      if (element) {
        element.addEventListener('change', (e) => {
          const filterType = filterId
            .replace('-filter', '')
            .replace('assignee', 'assignee');
          this.filters[filterType === 'assignee' ? 'assignee' : filterType] =
            e.target.value;
          this.applyFilters();
        });
      }
    });

    // Page size change
    const pageSizeSelect = document.getElementById('page-size');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e) => {
        this.pageSize = parseInt(e.target.value);
        this.currentPage = 1;
        this.renderAdvancedTable();
      });
    }

    // Pagination controls
    const firstPage = document.getElementById('first-page');
    const prevPage = document.getElementById('prev-page');
    const nextPage = document.getElementById('next-page');
    const lastPage = document.getElementById('last-page');

    if (firstPage) firstPage.addEventListener('click', () => this.goToPage(1));
    if (prevPage)
      prevPage.addEventListener('click', () =>
        this.goToPage(Math.max(1, this.currentPage - 1))
      );
    if (nextPage)
      nextPage.addEventListener('click', () =>
        this.goToPage(Math.min(this.getTotalPages(), this.currentPage + 1))
      );
    if (lastPage)
      lastPage.addEventListener('click', () =>
        this.goToPage(this.getTotalPages())
      );
  }

  // Update data from BCF parser
  updateData(parsedData) {
    this.allTableData = this.flattenBCFData(parsedData);
    this.populateFilterOptions();
    this.applyFilters();
    this.updateSummaryStats();
    console.log(
      `Advanced Preview updated with ${this.allTableData.length} rows`
    );
  }

  // Flatten BCF data into table rows
  flattenBCFData(parsedData) {
    const tableData = [];
    let topicNumber = 1;

    parsedData.forEach((bcfFile) => {
      bcfFile.topics.forEach((topic) => {
        // ✅ Get primary viewpoint data for coordinate integration
        const primaryViewpoint = this.getPrimaryViewpoint(topic);

        // ✅ Get coordinate data for this topic
        const coordinateData = this.getTopicCoordinateData(topic, bcfFile);

        // Add topic row with coordinate data
        const topicRow = {
          type: topicNumber,
          rowType: 'topic',
          sourceFile: bcfFile.filename,
          projectName: bcfFile.project.name || 'Unknown',
          bcfVersion: bcfFile.version || 'Unknown',
          topicGuid: topic.guid,
          title: topic.title || 'Untitled',
          description: topic.description || '',
          topicIndex: topic.topicIndex || '',
          serverAssignedId: topic.serverAssignedId || '',
          status: topic.topicStatus || '',
          topicType: topic.topicType || '',
          priority: topic.priority || '',
          stage: topic.stage || '',
          labels: topic.labels || [],
          assignee: topic.assignedTo || '',
          author: topic.creationAuthor || '',
          created: this.formatDate(topic.creationDate),
          modified: this.formatDate(topic.modifiedDate),
          modifiedAuthor: topic.modifiedAuthor || '',
          due: this.formatDate(topic.dueDate),
          comments: topic.comments ? topic.comments.length : 0,
          isOverdue: this.isOverdue(topic.dueDate),
          hasComments: topic.comments && topic.comments.length > 0,
          hasViewpoints:
            topic.viewpoints &&
            topic.viewpoints.filter((vp) => vp.CameraViewPoint || vp.cameraType)
              .length > 1, // More than 1 means additional viewpoints beyond primary

          // ✅ Include coordinate data from primary viewpoint
          ...coordinateData,

          _originalTopic: topic,
        };

        // 🎯 Debug: Log coordinate data inclusion
        if (coordinateData.cameraType || coordinateData.CameraViewPointX) {
          console.log('📍 Added BCF camera data to topic row:', {
            topicTitle: topic.title,
            cameraType: coordinateData.cameraType,
            hasCoordinates: !!coordinateData.CameraViewPointX,
          });
        }

        // 🎯 Debug: Log coordinate data inclusion
        if (primaryViewpoint) {
          console.log('📍 Added BCF camera data to topic row:', {
            topicTitle: topic.title,
            cameraType: primaryViewpoint.cameraType,
            hasCoordinates: !!primaryViewpoint.CameraViewPoint?.X,
          });
        }

        tableData.push(topicRow);

        // Add comment rows
        if (topic.comments && topic.comments.length > 0) {
          const sortedComments = topic.comments.sort(
            (a, b) =>
              new Date(a.date || '1970-01-01') -
              new Date(b.date || '1970-01-01')
          );

          sortedComments.forEach((comment, index) => {
            const commentRow = {
              type: `${topicNumber}.${index + 1}`,
              rowType: 'comment',
              sourceFile: bcfFile.filename,
              topicGuid: topic.guid,
              parentTopicGuid: topic.guid,
              parentTitle: topic.title,
              title: `Comment ${index + 1}`,
              status: comment.status || '',
              priority: '',
              assignee: '',
              author: comment.author || '',
              created: this.formatDate(comment.date),
              modified: '',
              modifiedAuthor: '',
              due: '',
              comments: '',
              content: comment.comment || '',
              commentNumber: index + 1,
              commentDate: this.formatDate(comment.date),
              commentAuthor: comment.author || 'No Author',
              commentText: comment.comment || 'No Comment Text',
              commentStatus: comment.status || '',
              _debug_comment: comment,
              _originalComment: comment,
            };

            tableData.push(commentRow);
          });
        }

        // ✅ Add viewpoint rows for multiple viewpoints (like comment rows)
        if (topic.viewpoints && topic.viewpoints.length > 1) {
          // Find viewpoints with coordinate data (excluding the primary one used in topic row)
          const viewpointsWithCoordinates = topic.viewpoints.filter(
            (vp) =>
              vp.CameraViewPoint ||
              vp.cameraType ||
              vp.ViewToWorldScale ||
              vp.FieldOfView
          );

          // Get the primary viewpoint that's already shown in the topic row
          const primaryViewpoint =
            viewpointsWithCoordinates.find((vp) => {
              return (
                vp.viewpointFile === 'viewpoint.bcfv' ||
                vp.guid === 'viewpoint-generic' ||
                (vp.viewpointFile &&
                  vp.viewpointFile.toLowerCase().includes('viewpoint.bcfv'))
              );
            }) || viewpointsWithCoordinates[0];

          // Add rows for additional viewpoints (excluding the primary one)
          const additionalViewpoints = viewpointsWithCoordinates.filter(
            (vp) => vp !== primaryViewpoint
          );

          additionalViewpoints.forEach((viewpoint, index) => {
            const viewpointCoordinates =
              this.extractViewpointCoordinates(viewpoint);

            const viewpointRow = {
              type: `${topicNumber}.V${index + 1}`,
              rowType: 'viewpoint',
              sourceFile: bcfFile.filename,
              topicGuid: topic.guid,
              parentTopicGuid: topic.guid,
              parentTitle: topic.title,
              title: `Viewpoint ${index + 1}: ${viewpoint.guid}`,
              status: '',
              priority: '',
              assignee: '',
              author: '',
              created: '',
              modified: '',
              modifiedAuthor: '',
              due: '',
              comments: '',

              // ✅ Include all coordinate data for this viewpoint
              ...viewpointCoordinates,

              // Viewpoint-specific metadata
              viewpointNumber: index + 1,
              viewpointGuid: viewpoint.guid,
              viewpointFile: viewpoint.viewpointFile,
              viewpointType: viewpoint.cameraType || '',

              _originalViewpoint: viewpoint,
            };

            tableData.push(viewpointRow);

            console.log('📍 Added viewpoint row:', {
              topicTitle: topic.title,
              viewpointGuid: viewpoint.guid,
              cameraType: viewpointCoordinates.cameraType,
              hasCoordinates: !!viewpointCoordinates.CameraViewPointX,
            });
          });
        }

        topicNumber++;
      });
    });

    return tableData;
  }

  // Populate filter dropdowns with actual data
  populateFilterOptions() {
    const statusValues = new Set();
    const priorityValues = new Set();
    const assigneeValues = new Set();

    this.allTableData.forEach((row) => {
      if (row.rowType === 'topic') {
        if (row.status) statusValues.add(row.status);
        if (row.priority) priorityValues.add(row.priority);
        if (row.assignee) assigneeValues.add(row.assignee);
      }
    });

    // Update status filter
    this.updateSelectOptions('status-filter', Array.from(statusValues).sort());

    // Update priority filter (with logical order)
    const priorityOrder = ['Low', 'Medium', 'High', 'Critical'];
    const sortedPriorities = Array.from(priorityValues).sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    this.updateSelectOptions('priority-filter', sortedPriorities);

    // Update assignee filter
    this.updateSelectOptions(
      'assignee-filter',
      Array.from(assigneeValues).sort()
    );
  }

  updateSelectOptions(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Keep the "All" option and current selection
    const currentValue = select.value;
    const firstOption = select.querySelector('option');

    select.innerHTML = '';
    select.appendChild(firstOption); // Re-add "All" option

    options.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      select.appendChild(optionElement);
    });

    // Restore selection if it still exists
    if (options.includes(currentValue)) {
      select.value = currentValue;
    }
  }

  switchTab(tabName) {
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

    this.currentTab = tabName;

    // If switching to advanced tab, ensure table headers are built
    if (tabName === 'advanced' && this.app) {
      this.buildAdvancedTableHeaders();
      this.renderAdvancedTable();
    }
  }

  // Build table headers based on selected export fields
  buildAdvancedTableHeaders() {
    const selectedFields = this.app.getSelectedFieldNames
      ? this.app.getSelectedFieldNames()
      : [];
    const headersRow = document.getElementById('advanced-table-headers');

    if (!headersRow) return;

    // Always include Type and Title columns, then add selected fields
    const baseColumns = [
      { field: 'type', label: 'Type', sortable: true },
      { field: 'title', label: 'Title', sortable: true },
    ];

    const fieldMapping = this.getFieldHeaderMapping();
    const additionalColumns = selectedFields
      .filter((field) => field !== 'title') // Don't duplicate title
      .map((field) => ({
        field: this.mapFieldToTableColumn(field),
        label: fieldMapping[field] || field,
        sortable: true,
      }));

    const allColumns = [...baseColumns, ...additionalColumns];

    headersRow.innerHTML = allColumns
      .map(
        (col) => `
      <th ${col.sortable ? `data-sort="${col.field}"` : ''} ${
          col.sortable ? 'style="cursor: pointer;"' : ''
        }>
        ${col.label}
        ${col.sortable ? '<span class="sort-indicator">↕</span>' : ''}
      </th>
    `
      )
      .join('');

    // Re-attach sort event listeners
    headersRow.querySelectorAll('th[data-sort]').forEach((header) => {
      header.addEventListener('click', (e) => {
        const field = e.currentTarget.dataset.sort;
        this.sortData(field);
      });
    });
  }

  getFieldHeaderMapping() {
    return {
      title: 'Title',
      description: 'Description',
      status: 'Status',
      type: 'Type',
      priority: 'Priority',
      stage: 'Stage',
      labels: 'Labels',
      assignedTo: 'Assigned To',
      creationDate: 'Created',
      creationAuthor: 'Author',
      modifiedDate: 'Modified',
      modifiedAuthor: 'Modified By',
      dueDate: 'Due Date',
      sourceFile: 'Source File',
      projectName: 'Project',
      bcfVersion: 'BCF Version',
      topicGuid: 'GUID',
      commentsCount: 'Comments',
      viewpointsCount: 'Viewpoints',
      commentNumber: 'Comment #',
      commentDate: 'Comment Date',
      commentAuthor: 'Comment Author',
      commentText: 'Comment Text',
      commentStatus: 'Comment Status',
      topicIndex: 'Topic Index',
      serverAssignedId: 'Server Assigned ID',

      // ✅ BCF Camera Coordinate Fields - Added for v2 coordinate support
      cameraType: 'Camera Type',
      CameraViewPointX: 'Camera X',
      CameraViewPointY: 'Camera Y',
      CameraViewPointZ: 'Camera Z',
      CameraDirectionX: 'Direction X',
      CameraDirectionY: 'Direction Y',
      CameraDirectionZ: 'Direction Z',
      CameraUpVectorX: 'Up Vector X',
      CameraUpVectorY: 'Up Vector Y',
      CameraUpVectorZ: 'Up Vector Z',
      FieldOfView: 'Field of View',
      ViewToWorldScale: 'View Scale',

      // Legacy coordinate support (maintain backward compatibility)
      cameraPosX: 'Camera Pos X',
      cameraPosY: 'Camera Pos Y',
      cameraPosZ: 'Camera Pos Z',
      cameraTargetX: 'Target X',
      cameraTargetY: 'Target Y',
      cameraTargetZ: 'Target Z',
    };
  }

  mapFieldToTableColumn(field) {
    // Map export field names to table data properties
    const mapping = {
      title: 'title',
      description: 'description',
      status: 'status',
      type: 'topicType', // FIXED: Map to correct field
      priority: 'priority',
      stage: 'stage',
      labels: 'labels', // Ensure labels mapping exists
      assignedTo: 'assignee',
      creationDate: 'created',
      creationAuthor: 'author',
      modifiedDate: 'modified',
      modifiedAuthor: 'modifiedAuthor',
      dueDate: 'due',
      sourceFile: 'sourceFile',
      projectName: 'projectName',
      bcfVersion: 'bcfVersion',
      topicGuid: 'topicGuid',
      commentsCount: 'comments',
      viewpointsCount: 'viewpoints',
      commentNumber: 'commentNumber',
      commentDate: 'commentDate',
      commentAuthor: 'commentAuthor',
      commentText: 'commentText', // FIXED: Was 'content', now 'commentText'
      commentStatus: 'commentStatus',
      topicIndex: 'topicIndex',
      serverAssignedId: 'serverAssignedId',

      // ✅ BCF Camera Coordinate Field Mappings - Direct mapping for coordinate fields
      cameraType: 'cameraType',
      CameraViewPointX: 'CameraViewPointX',
      CameraViewPointY: 'CameraViewPointY',
      CameraViewPointZ: 'CameraViewPointZ',
      CameraDirectionX: 'CameraDirectionX',
      CameraDirectionY: 'CameraDirectionY',
      CameraDirectionZ: 'CameraDirectionZ',
      CameraUpVectorX: 'CameraUpVectorX',
      CameraUpVectorY: 'CameraUpVectorY',
      CameraUpVectorZ: 'CameraUpVectorZ',
      FieldOfView: 'FieldOfView',
      ViewToWorldScale: 'ViewToWorldScale',

      // Legacy coordinate mappings (backward compatibility)
      cameraPosX: 'cameraPosX',
      cameraPosY: 'cameraPosY',
      cameraPosZ: 'cameraPosZ',
      cameraTargetX: 'cameraTargetX',
      cameraTargetY: 'cameraTargetY',
      cameraTargetZ: 'cameraTargetZ',
    };
    return mapping[field] || field;
  }

  applyFilters() {
    this.filteredData = this.allTableData.filter((row) => {
      // Search filter - search across multiple fields
      if (this.filters.search) {
        const searchTerm = this.filters.search.toLowerCase();
        const searchableText = [
          row.title,
          row.status,
          row.priority,
          row.assignee,
          row.author,
          row.content,
          row.projectName,
          row.sourceFile,
        ]
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Status filter (only apply to topics)
      if (
        this.filters.status &&
        row.rowType === 'topic' &&
        row.status !== this.filters.status
      ) {
        return false;
      }

      // Priority filter (only apply to topics)
      if (
        this.filters.priority &&
        row.rowType === 'topic' &&
        row.priority !== this.filters.priority
      ) {
        return false;
      }

      // Assignee filter (only apply to topics)
      if (
        this.filters.assignee &&
        row.rowType === 'topic' &&
        row.assignee !== this.filters.assignee
      ) {
        return false;
      }

      // Due date filter (only apply to topics)
      if (this.filters.dueDate && row.rowType === 'topic') {
        const today = new Date();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;

        switch (this.filters.dueDate) {
          case 'overdue':
            if (!row.due || !this.isOverdue(row.due)) return false;
            break;
          case 'this-week':
            if (!row.due) return false;
            const dueDate = new Date(row.due);
            const weekFromNow = new Date(today.getTime() + oneWeek);
            if (dueDate < today || dueDate > weekFromNow) return false;
            break;
          case 'next-week':
            if (!row.due) return false;
            const nextWeekStart = new Date(today.getTime() + oneWeek);
            const nextWeekEnd = new Date(today.getTime() + 2 * oneWeek);
            const dueDateNext = new Date(row.due);
            if (dueDateNext < nextWeekStart || dueDateNext > nextWeekEnd)
              return false;
            break;
          case 'no-due-date':
            if (row.due) return false;
            break;
        }
      }

      return true;
    });

    // Filter out collapsed comments and viewpoints
    this.filteredData = this.filteredData.filter((row) => {
      // Always show topics
      if (row.rowType === 'topic') {
        return true;
      }

      // For comments, only show if parent topic is expanded
      if (row.rowType === 'comment') {
        return this.expandedTopics.has(row.parentTopicGuid);
      }

      // ✅ For viewpoints, only show if parent topic is expanded
      if (row.rowType === 'viewpoint') {
        return this.expandedTopics.has(row.parentTopicGuid);
      }

      return true;
    });

    // Reset to first page when filters change
    this.currentPage = 1;
    this.renderAdvancedTable();
    this.updateActiveFilters();
    this.updateSummaryStats();
  }

  updateActiveFilters() {
    const activeFiltersContainer = document.getElementById('active-filters');
    if (!activeFiltersContainer) return;

    const activeFilters = [];

    // Collect active filters
    if (this.filters.search) {
      activeFilters.push({
        type: 'search',
        label: `Search: "${this.filters.search}"`,
      });
    }
    if (this.filters.status) {
      activeFilters.push({
        type: 'status',
        label: `Status: ${this.filters.status}`,
      });
    }
    if (this.filters.priority) {
      activeFilters.push({
        type: 'priority',
        label: `Priority: ${this.filters.priority}`,
      });
    }
    if (this.filters.assignee) {
      activeFilters.push({
        type: 'assignee',
        label: `Assigned to: ${this.filters.assignee}`,
      });
    }
    if (this.filters.dueDate) {
      const dueDateLabels = {
        overdue: 'Overdue',
        'this-week': 'Due This Week',
        'next-week': 'Due Next Week',
        'no-due-date': 'No Due Date',
      };
      activeFilters.push({
        type: 'dueDate',
        label: `Due: ${dueDateLabels[this.filters.dueDate]}`,
      });
    }

    // Render active filters
    if (activeFilters.length > 0) {
      activeFiltersContainer.innerHTML = activeFilters
        .map(
          (filter) => `
        <div class="filter-tag">
          ${filter.label}
          <button class="filter-remove" onclick="window.bcfApp.advancedPreview.removeFilter('${filter.type}')">&times;</button>
        </div>
      `
        )
        .join('');
      activeFiltersContainer.style.display = 'flex';
    } else {
      activeFiltersContainer.style.display = 'none';
    }
  }

  removeFilter(filterType) {
    this.filters[filterType] = '';

    // Update the corresponding form element
    const elementMap = {
      search: 'search-input',
      status: 'status-filter',
      priority: 'priority-filter',
      assignee: 'assignee-filter',
      dueDate: 'due-date-filter',
    };

    const element = document.getElementById(elementMap[filterType]);
    if (element) {
      element.value = '';
    }

    this.applyFilters();
  }

  sortData(field) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      let aVal = a[field] || '';
      let bVal = b[field] || '';

      // Handle different data types
      if (field === 'created' || field === 'due') {
        aVal = new Date(aVal || '1970-01-01');
        bVal = new Date(bVal || '1970-01-01');
      } else if (field === 'comments') {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      } else if (field === 'type') {
        // Handle numerical sorting for type field (e.g., "1", "2", "10", "1.1", "1.V1")
        aVal = this.parseTypeValue(aVal);
        bVal = this.parseTypeValue(bVal);
      } else if (field === 'topicIndex') {
        // Handle numerical sorting for topic index field
        aVal = this.parseNumericValue(aVal);
        bVal = this.parseNumericValue(bVal);
      } else if (field === 'priority') {
        const priorityOrder = {
          '': 0,
          Low: 1,
          Medium: 2,
          High: 3,
          Critical: 4,
        };
        aVal = priorityOrder[aVal] || 0;
        bVal = priorityOrder[bVal] || 0;
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }

      // Handle array comparison for type field
      if (field === 'type' && Array.isArray(aVal) && Array.isArray(bVal)) {
        const comparison = this.compareTypeArrays(aVal, bVal);
        return this.sortDirection === 'asc' ? comparison : -comparison;
      }

      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.updateSortIndicators();
    this.renderAdvancedTable();
  }

  parseTypeValue(typeString) {
    if (!typeString) return [0, 0, 0]; // Default for empty values
    
    const str = typeString.toString();
    
    // Parse patterns like "1", "10", "1.1", "1.V1", "12.3", "5.V2"
    const match = str.match(/^(\d+)(?:\.(\d+|V\d+))?$/);
    
    if (!match) {
      // If it doesn't match expected pattern, fall back to string comparison
      return [999999, 0, str]; // Put non-matching patterns at the end
    }
    
    const mainNumber = parseInt(match[1]) || 0;
    let subNumber = 0;
    let subType = 0; // 0 for numeric, 1 for viewpoint (V)
    
    if (match[2]) {
      if (match[2].startsWith('V')) {
        // Viewpoint like "V1", "V2"
        subType = 1; // Viewpoints come after comments
        subNumber = parseInt(match[2].substring(1)) || 0;
      } else {
        // Comment number like "1", "2"
        subType = 0;
        subNumber = parseInt(match[2]) || 0;
      }
    }
    
    // Return array for natural sorting: [mainNumber, subType, subNumber]
    // This ensures: 1 < 1.1 < 1.2 < 1.V1 < 1.V2 < 2 < 2.1 < 10
    return [mainNumber, subType, subNumber];
  }

  parseNumericValue(value) {
    if (!value) return 0;
    
    // Try to parse as integer first
    const intValue = parseInt(value);
    if (!isNaN(intValue)) {
      return intValue;
    }
    
    // If not a simple integer, try to extract numeric part
    const match = value.toString().match(/(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }
    
    // If no numeric part found, return a high number to sort at end
    return 999999;
  }

  compareTypeArrays(a, b) {
    // Compare arrays element by element
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const aVal = a[i] || 0;
      const bVal = b[i] || 0;
      
      // Handle string comparison for the last element if it exists
      if (i === 2 && typeof aVal === 'string' && typeof bVal === 'string') {
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      } else {
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      }
    }
    return 0; // Arrays are equal
  }

  updateSortIndicators() {
    document.querySelectorAll('.sort-indicator').forEach((indicator) => {
      indicator.classList.remove('active');
      indicator.textContent = '↕';
    });

    const activeHeader = document.querySelector(
      `[data-sort="${this.sortField}"] .sort-indicator`
    );
    if (activeHeader) {
      activeHeader.classList.add('active');
      activeHeader.textContent = this.sortDirection === 'asc' ? '↑' : '↓';
    }
  }

  renderAdvancedTable() {
    const tbody = document.getElementById('advanced-table-body');
    if (!tbody) return;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(
      startIndex + this.pageSize,
      this.filteredData.length
    );
    const pageData = this.filteredData.slice(startIndex, endIndex);

    if (pageData.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="100%" style="text-align: center; padding: 2rem; color: var(--text-muted);">No data matches the current filters</td></tr>';
      this.updatePaginationInfo();
      return;
    }

    // Get selected fields for column mapping
    const selectedFields =
      this.app && this.app.getSelectedFieldNames
        ? this.app.getSelectedFieldNames()
        : [];

    tbody.innerHTML = pageData
      .map((row) => {
        let rowClass = 'row-type-topic'; // default
        if (row.rowType === 'comment') {
          rowClass = 'row-type-comment';
        } else if (row.rowType === 'viewpoint') {
          rowClass = 'row-type-viewpoint';
        }

        // Build cells based on table headers
        const cells = this.buildTableCells(row, selectedFields);

        return `<tr class="${rowClass}">${cells}</tr>`;
      })
      .join('');

    this.updatePaginationInfo();
    this.renderPaginationControls();
    // Setup tooltips for expandable cells
    this.setupTooltips();
  }

  buildTableCells(row, selectedFields) {
    // Always start with Type and Title
    let cells = [
      `<td class="cell-type">${row.type}</td>`,
      this.createTitleCell(row),
    ];

    // Add cells for selected fields (excluding title which we already have)
    selectedFields
      .filter((field) => field !== 'title')
      .forEach((field) => {
        const columnField = this.mapFieldToTableColumn(field);
        const cell = this.createFormattedCell(row, columnField, field);
        cells.push(cell);
      });

    return cells.join('');
  }

  formatCellValue(row, columnField, originalField) {
    let value = row[columnField] || '';
    // Ensure value is converted to string for string operations
    const originalValue = value;
    if (typeof value !== 'string' && value !== null && value !== undefined) {
      value = String(value);
    }

    // Special formatting for specific fields
    switch (originalField) {
      case 'status':
        return value
          ? `<span class="status-badge status-${value
              .toLowerCase()
              .replace(/\s+/g, '-')}">${value}</span>`
          : '';

      case 'type':
      case 'topicType':
        return value
          ? `<span class="priority-badge priority-${value.toLowerCase()}">${value}</span>`
          : '';

      case 'priority':
        return value
          ? `<span class="priority-badge priority-${value.toLowerCase()}">${value}</span>`
          : '';

      case 'dueDate':
        if (!value) return '';
        const isOverdue = this.isOverdue(value);
        return isOverdue
          ? `<span style="color: var(--danger)">${value} (Overdue)</span>`
          : value;

      case 'creationDate':
      case 'modifiedDate':
      case 'commentDate':
        return value;

      case 'commentsCount':
      case 'viewpointsCount':
        return row.rowType === 'topic' ? value || 0 : '';

      default:
        return this.truncateText(value, 30);
    }
  }

  updatePaginationInfo() {
    const startIndex =
      this.filteredData.length > 0
        ? (this.currentPage - 1) * this.pageSize + 1
        : 0;
    const endIndex = Math.min(
      this.currentPage * this.pageSize,
      this.filteredData.length
    );

    const showingStart = document.getElementById('showing-start');
    const showingEnd = document.getElementById('showing-end');
    const totalFiltered = document.getElementById('total-filtered');

    if (showingStart) showingStart.textContent = startIndex.toLocaleString();
    if (showingEnd) showingEnd.textContent = endIndex.toLocaleString();
    if (totalFiltered)
      totalFiltered.textContent = this.filteredData.length.toLocaleString();
  }

  // Enhanced Pagination - Replace the renderPaginationControls method in advanced-preview.js

  renderPaginationControls() {
    const totalPages = this.getTotalPages();
    const pageNumbersContainer = document.getElementById('page-numbers');

    if (!pageNumbersContainer) return;

    // Clear existing page numbers
    pageNumbersContainer.innerHTML = '';

    if (totalPages <= 1) {
      // No pagination needed
      pageNumbersContainer.innerHTML = '';
    } else if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pageNumbersContainer.appendChild(this.createPageButton(i));
      }
    } else {
      // Smart pagination for many pages
      const current = this.currentPage;

      // Always show first page
      pageNumbersContainer.appendChild(this.createPageButton(1));

      if (current > 4) {
        // Add ellipsis if current page is far from start
        pageNumbersContainer.appendChild(this.createEllipsis());
      }

      // Show pages around current page
      const startPage = Math.max(2, current - 1);
      const endPage = Math.min(totalPages - 1, current + 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbersContainer.appendChild(this.createPageButton(i));
      }

      if (current < totalPages - 3) {
        // Add ellipsis if current page is far from end
        pageNumbersContainer.appendChild(this.createEllipsis());
      }

      // Always show last page (if not already shown)
      if (totalPages > 1) {
        pageNumbersContainer.appendChild(this.createPageButton(totalPages));
      }
    }

    // Update navigation buttons
    this.updateNavigationButtons(totalPages);
  }

  createPageButton(pageNumber) {
    const button = document.createElement('button');
    button.className = `pagination-button ${
      pageNumber === this.currentPage ? 'active' : ''
    }`;
    button.textContent = pageNumber;
    button.setAttribute('aria-label', `Go to page ${pageNumber}`);
    button.onclick = () => this.goToPage(pageNumber);
    return button;
  }

  createEllipsis() {
    const span = document.createElement('span');
    span.className = 'pagination-ellipsis';
    span.textContent = '…';
    span.style.cssText = `
    display: inline-flex;
    align-items: center;
    padding: 0 var(--space-xs);
    color: var(--text-muted);
    font-size: 0.875rem;
  `;
    return span;
  }

  updateNavigationButtons(totalPages) {
    const firstPage = document.getElementById('first-page');
    const prevPage = document.getElementById('prev-page');
    const nextPage = document.getElementById('next-page');
    const lastPage = document.getElementById('last-page');

    const isFirstPage = this.currentPage === 1;
    const isLastPage = this.currentPage === totalPages;
    const hasNoPages = totalPages === 0;

    if (firstPage) {
      firstPage.disabled = isFirstPage || hasNoPages;
      firstPage.setAttribute('aria-label', 'Go to first page');
    }

    if (prevPage) {
      prevPage.disabled = isFirstPage || hasNoPages;
      prevPage.setAttribute('aria-label', 'Go to previous page');
    }

    if (nextPage) {
      nextPage.disabled = isLastPage || hasNoPages;
      nextPage.setAttribute('aria-label', 'Go to next page');
    }

    if (lastPage) {
      lastPage.disabled = isLastPage || hasNoPages;
      lastPage.setAttribute('aria-label', 'Go to last page');
    }
  }

  getTotalPages() {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  goToPage(page) {
    const totalPages = this.getTotalPages();
    this.currentPage = Math.max(1, Math.min(page, totalPages));
    this.renderAdvancedTable();
  }

  updateSummaryStats() {
    // Calculate stats from filtered data (topics only)
    const topics = this.filteredData.filter((row) => row.rowType === 'topic');

    const stats = {
      totalTopics: topics.length,
      totalComments: topics.reduce(
        (sum, topic) => sum + (parseInt(topic.comments) || 0),
        0
      ),
      openIssues: topics.filter((topic) =>
        ['Open', 'In Progress', 'Under Review'].includes(topic.status)
      ).length,
      highPriority: topics.filter((topic) =>
        ['High', 'Critical'].includes(topic.priority)
      ).length,
      overdue: topics.filter((topic) => topic.isOverdue).length,
    };

    // Update summary elements
    const elements = {
      'summary-total-topics': stats.totalTopics,
      'summary-total-comments': stats.totalComments,
      'summary-open-issues': stats.openIssues,
      'summary-high-priority': stats.highPriority,
      'summary-overdue': stats.overdue,
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  }

  // Utility methods
  formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch {
      return dateString;
    }
  }

  isOverdue(dueDateString) {
    if (!dueDateString) return false;
    try {
      const dueDate = new Date(dueDateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for date-only comparison
      return dueDate < today;
    } catch {
      return false;
    }
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    const str = text.toString().trim();
    if (str.length <= maxLength) return str;

    // Try to break at word boundary near the limit
    const truncated = str.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength * 0.75) {
      return truncated.substring(0, lastSpace) + '...';
    } else {
      return truncated + '...';
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text.toString();
    return div.innerHTML;
  }

  createTitleCell(row) {
    const title = row.title || '';
    const truncated = this.truncateText(title, 40);
    const needsTooltip = title.length > 40 || truncated.includes('...');

    // ADD EXPAND/COLLAPSE FUNCTIONALITY FOR TOPICS
    if (row.rowType === 'topic' && (row.hasComments || row.hasViewpoints)) {
      const isExpanded = this.expandedTopics.has(row.topicGuid);
      const expandIcon = isExpanded ? '▼' : '▶';

      // Build description of what can be expanded
      const expandableItems = [];
      if (row.hasComments) expandableItems.push('comments');
      if (row.hasViewpoints) expandableItems.push('viewpoints');
      const expandableText = expandableItems.join(' & ');

      const expandButton = `<button class="expand-button" onclick="window.bcfApp.advancedPreview.toggleTopicComments('${
        row.topicGuid
      }')" title="${
        isExpanded ? 'Collapse' : 'Expand'
      } ${expandableText}">${expandIcon}</button>`;

      if (needsTooltip) {
        return `<td class="cell-title expandable" data-full-text="${this.escapeHtml(
          title
        )}">${expandButton} ${truncated}</td>`;
      } else {
        return `<td class="cell-title">${expandButton} ${truncated}</td>`;
      }
    } else if (row.rowType === 'topic') {
      // Topic with no comments or viewpoints - no expand button
      if (needsTooltip) {
        return `<td class="cell-title expandable" data-full-text="${this.escapeHtml(
          title
        )}">${truncated}</td>`;
      } else {
        return `<td class="cell-title">${truncated}</td>`;
      }
    } else if (row.rowType === 'comment') {
      // Comment row - add indentation
      if (needsTooltip) {
        return `<td class="cell-title cell-comment-title expandable" data-full-text="${this.escapeHtml(
          title
        )}">${truncated}</td>`;
      } else {
        return `<td class="cell-title cell-comment-title">${truncated}</td>`;
      }
    } else if (row.rowType === 'viewpoint') {
      // ✅ Viewpoint row - add indentation like comments
      if (needsTooltip) {
        return `<td class="cell-title cell-viewpoint-title expandable" data-full-text="${this.escapeHtml(
          title
        )}">${truncated}</td>`;
      } else {
        return `<td class="cell-title cell-viewpoint-title">${truncated}</td>`;
      }
    }
  }

  createFormattedCell(row, columnField, originalField) {
    let value = row[columnField] || '';
    let cssClass = '';
    let needsTooltip = false;
    let fullText = '';

    // DEBUG: Log comment fields to help troubleshoot
    if (originalField.includes('comment') && row.rowType === 'comment') {
      console.log(`Comment field debug:`, {
        originalField: originalField,
        columnField: columnField,
        rowType: row.rowType,
        value: value,
        rawRowData: row,
      });
    }

    // Format based on field type
    switch (originalField) {
      case 'status':
        if (value) {
          return `<td><span class="status-badge status-${value
            .toLowerCase()
            .replace(/\s+/g, '-')}">${value}</span></td>`;
        }
        return '<td></td>';

      case 'priority':
        if (value) {
          return `<td><span class="priority-badge priority-${value.toLowerCase()}">${value}</span></td>`;
        }
        return '<td></td>';

      case 'dueDate':
        if (!value) return '<td></td>';
        const isOverdue = this.isOverdue(value);
        cssClass = 'cell-date';
        value = isOverdue
          ? `<span style="color: var(--danger)">${value} (Overdue)</span>`
          : value;
        break;

      case 'creationDate':
      case 'modifiedDate':
      case 'commentDate':
        cssClass = 'cell-date';
        break;

      case 'creationAuthor':
      case 'modifiedAuthor':
      case 'commentAuthor':
      case 'assignedTo':
        cssClass = 'cell-author';
        break;

      case 'commentText':
        if (value && value.length > 50) {
          cssClass = 'cell-comment expandable';
          fullText = value;
          value = this.truncateText(value, 50);
          needsTooltip = true;
        } else {
          cssClass = 'cell-comment';
        }
        break;

      case 'commentText':
        if (value && value.length > 50) {
          cssClass = 'cell-comment expandable';
          fullText = value;
          value = this.truncateText(value, 50);
          needsTooltip = true;
        } else {
          cssClass = 'cell-comment';
        }
        break;

      case 'commentNumber':
        // Only show for comment rows, empty for topics
        if (row.rowType === 'comment') {
          value = row.commentNumber || '';
        } else {
          value = ''; // Empty for topic rows
        }
        break;

      case 'commentDate':
        // Only show for comment rows
        if (row.rowType === 'comment') {
          cssClass = 'cell-date';
          value = row.commentDate || '';
        } else {
          value = ''; // Empty for topic rows
        }
        break;

      case 'commentAuthor':
        // Only show for comment rows
        if (row.rowType === 'comment') {
          cssClass = 'cell-author';
          value = row.commentAuthor || '';
        } else {
          value = ''; // Empty for topic rows
        }
        break;

      case 'commentText':
        // Only show for comment rows
        if (row.rowType === 'comment') {
          value = row.commentText || '';
          if (value && value.length > 50) {
            cssClass = 'cell-comment expandable';
            fullText = value;
            value = this.truncateText(value, 50);
            needsTooltip = true;
          } else {
            cssClass = 'cell-comment';
          }
        } else {
          value = ''; // Empty for topic rows
        }
        break;

      case 'modifiedDate':
      case 'modifiedAuthor':
        // Only show for topic rows
        if (row.rowType === 'topic') {
          cssClass = field === 'modifiedAuthor' ? 'cell-author' : 'cell-date';
          value = value || '';
        } else {
          value = '';
        }
        break;

      case 'commentsCount':
      case 'viewpointsCount':
        if (row.rowType === 'topic') {
          value = value || 0;
        } else {
          value = '';
        }
        break;

      // ✅ BCF Camera Coordinate Fields - Format coordinate values
      case 'cameraType':
        cssClass = 'cell-camera-type';
        value = value || '';
        break;

      case 'CameraViewPointX':
      case 'CameraViewPointY':
      case 'CameraViewPointZ':
      case 'CameraDirectionX':
      case 'CameraDirectionY':
      case 'CameraDirectionZ':
      case 'CameraUpVectorX':
      case 'CameraUpVectorY':
      case 'CameraUpVectorZ':
      case 'FieldOfView':
      case 'ViewToWorldScale':
      case 'cameraPosX':
      case 'cameraPosY':
      case 'cameraPosZ':
      case 'cameraTargetX':
      case 'cameraTargetY':
      case 'cameraTargetZ':
        // ✅ Show coordinate data for both topic rows AND viewpoint rows
        if (row.rowType === 'topic' || row.rowType === 'viewpoint') {
          cssClass = 'cell-coordinate';
          value = value || '';
          // Add visual indicator for coordinate fields
          if (value) {
            value = `<span class="coordinate-value">${value}</span>`;
          }
        } else {
          value = ''; // Empty for comment rows only
        }
        break;

      default:
        // Handle long text fields and detect truncation
        const stringValue = String(value || '');
        if (stringValue && stringValue.length > 30) {
          cssClass = cssClass ? `${cssClass} expandable` : 'expandable';
          fullText = stringValue;
          value = this.truncateText(stringValue, 30);
          needsTooltip = true;
        }
        // Also check if truncateText added ellipsis (indicates truncation)
        else if (
          stringValue &&
          typeof value === 'string' &&
          value.includes('...')
        ) {
          cssClass = cssClass ? `${cssClass} expandable` : 'expandable';
          fullText = originalValue;
          needsTooltip = true;
        }
    }

    // Build the cell HTML
    if (needsTooltip && fullText) {
      return `<td class="${cssClass}" data-full-text="${this.escapeHtml(
        fullText
      )}">${value}</td>`;
    } else {
      return `<td class="${cssClass}">${value}</td>`;
    }
  }

  // Enhanced truncation detection
  needsTooltipForText(originalText, displayText, maxLength = 30) {
    if (!originalText || !displayText) return false;

    // Check if original text is longer than max length
    if (originalText.length > maxLength) return true;

    // Check if display text has ellipsis (indicates truncation)
    if (displayText.includes('...')) return true;

    // Check if display text is significantly shorter than original
    if (originalText.length - displayText.length > 5) return true;

    return false;
  }

  // Updated setupTooltips method
  setupTooltips() {
    // Remove any existing tooltip
    const existingTooltip = document.querySelector('.custom-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Create new tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    document.body.appendChild(tooltip);

    // Find all expandable cells with data
    const expandableCells = document.querySelectorAll(
      '.advanced-table .expandable[data-full-text]'
    );
    console.log('Setting up tooltips for', expandableCells.length, 'cells'); // Debug

    expandableCells.forEach((cell, index) => {
      console.log(`Cell ${index}:`, cell.getAttribute('data-full-text')); // Debug

      // Mouse enter - show tooltip
      cell.addEventListener('mouseenter', (e) => {
        const fullText = e.target.getAttribute('data-full-text');
        console.log('Mouse enter, fullText:', fullText); // Debug

        if (fullText && fullText.trim()) {
          tooltip.textContent = fullText;
          tooltip.classList.add('show');

          // Simple positioning - just below the cell
          const rect = e.target.getBoundingClientRect();
          tooltip.style.left = rect.left + 'px';
          tooltip.style.top = rect.bottom + 8 + 'px';

          console.log('Tooltip shown at:', rect.left, rect.bottom + 8); // Debug
        }
      });

      // Mouse leave - hide tooltip
      cell.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
        console.log('Tooltip hidden'); // Debug
      });
    });
  }

  // ADD THESE NEW METHODS at the end of the AdvancedPreview class

  toggleTopicComments(topicGuid) {
    if (this.expandedTopics.has(topicGuid)) {
      this.expandedTopics.delete(topicGuid);
    } else {
      this.expandedTopics.add(topicGuid);
    }

    // Re-apply filters to show/hide comments
    this.applyFilters();
  }

  expandAllTopics() {
    // Get all topic GUIDs that have comments
    const topicsWithComments = this.allTableData
      .filter((row) => row.rowType === 'topic' && row.hasComments)
      .map((row) => row.topicGuid);

    topicsWithComments.forEach((guid) => this.expandedTopics.add(guid));
    this.applyFilters();
  }

  collapseAllTopics() {
    this.expandedTopics.clear();
    this.applyFilters();
  }

  // ✅ BCF Coordinate Helper Methods - Added for v2 coordinate support

  /**
   * Get the primary viewpoint from a topic using the same logic as exports
   * Priority: 1) viewpoint.bcfv, 2) first with coordinates, 3) any viewpoint
   */
  getPrimaryViewpoint(topic) {
    if (!topic.viewpoints || topic.viewpoints.length === 0) {
      return null;
    }

    // Priority 1: Look for main viewpoint.bcfv file
    let primaryViewpoint = topic.viewpoints.find((vp) => {
      return (
        vp.viewpointFile === 'viewpoint.bcfv' ||
        vp.guid === 'viewpoint-generic' ||
        (vp.viewpointFile &&
          vp.viewpointFile.toLowerCase().includes('viewpoint.bcfv'))
      );
    });

    // Priority 2: First viewpoint with coordinate data
    if (!primaryViewpoint) {
      primaryViewpoint = topic.viewpoints.find((vp) => {
        return (
          vp.CameraViewPoint?.X !== undefined || vp.cameraPosX !== undefined
        );
      });
    }

    // Priority 3: Any available viewpoint as fallback
    if (!primaryViewpoint) {
      primaryViewpoint = topic.viewpoints[0];
    }

    return primaryViewpoint;
  }

  /**
   * Format coordinate values to 3 decimal places, handle null/undefined
   */
  formatCoordinate(value) {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const num = parseFloat(value);
    if (isNaN(num)) {
      return '';
    }

    return num.toFixed(3);
  }

  /**
   * Get coordinate data using the correct viewpoint with extracted coordinates
   */
  getTopicCoordinateData(topic, bcfFile) {
    console.log('🔍 getTopicCoordinateData called for topic:', topic.title);

    // Initialize coordinate data object
    const coordinateData = {
      cameraType: '',
      CameraViewPointX: '',
      CameraViewPointY: '',
      CameraViewPointZ: '',
      CameraDirectionX: '',
      CameraDirectionY: '',
      CameraDirectionZ: '',
      CameraUpVectorX: '',
      CameraUpVectorY: '',
      CameraUpVectorZ: '',
      FieldOfView: '',
      ViewToWorldScale: '',
      cameraPosX: '',
      cameraPosY: '',
      cameraPosZ: '',
      cameraTargetX: '',
      cameraTargetY: '',
      cameraTargetZ: '',
    };

    if (!topic.viewpoints || topic.viewpoints.length === 0) {
      console.log('📍 No viewpoints found');
      return coordinateData;
    }

    // 🎯 Find viewpoints with actual extracted coordinate data
    // These are the viewpoints that have CameraViewPoint, CameraDirection, etc.
    const viewpointsWithCoordinates = topic.viewpoints.filter(
      (vp) =>
        vp.CameraViewPoint ||
        vp.cameraType ||
        vp.ViewToWorldScale ||
        vp.FieldOfView
    );

    console.log('🔍 Found viewpoints with coordinates:', {
      totalViewpoints: topic.viewpoints.length,
      withCoordinates: viewpointsWithCoordinates.length,
      coordinateViewpoints: viewpointsWithCoordinates.map((vp) => ({
        guid: vp.guid,
        file: vp.viewpointFile,
        type: vp.cameraType,
      })),
    });

    if (viewpointsWithCoordinates.length === 0) {
      console.log('📍 No viewpoints with coordinate data found');
      return coordinateData;
    }

    // Priority 1: Look for main viewpoint.bcfv with coordinates
    let primaryViewpoint = viewpointsWithCoordinates.find((vp) => {
      return (
        vp.viewpointFile === 'viewpoint.bcfv' ||
        vp.guid === 'viewpoint-generic' ||
        (vp.viewpointFile &&
          vp.viewpointFile.toLowerCase().includes('viewpoint.bcfv'))
      );
    });

    // Priority 2: First viewpoint with coordinate data
    if (!primaryViewpoint) {
      primaryViewpoint = viewpointsWithCoordinates[0];
    }

    console.log('📍 Selected primary viewpoint:', {
      guid: primaryViewpoint.guid,
      file: primaryViewpoint.viewpointFile,
      type: primaryViewpoint.cameraType,
      hasCoordinates: !!primaryViewpoint.CameraViewPoint,
    });

    // Extract coordinate data
    coordinateData.cameraType = primaryViewpoint.cameraType || '';

    // BCF standard coordinates
    if (primaryViewpoint.CameraViewPoint) {
      coordinateData.CameraViewPointX = this.formatCoordinate(
        primaryViewpoint.CameraViewPoint.X
      );
      coordinateData.CameraViewPointY = this.formatCoordinate(
        primaryViewpoint.CameraViewPoint.Y
      );
      coordinateData.CameraViewPointZ = this.formatCoordinate(
        primaryViewpoint.CameraViewPoint.Z
      );
    }

    if (primaryViewpoint.CameraDirection) {
      coordinateData.CameraDirectionX = this.formatCoordinate(
        primaryViewpoint.CameraDirection.X
      );
      coordinateData.CameraDirectionY = this.formatCoordinate(
        primaryViewpoint.CameraDirection.Y
      );
      coordinateData.CameraDirectionZ = this.formatCoordinate(
        primaryViewpoint.CameraDirection.Z
      );
    }

    if (primaryViewpoint.CameraUpVector) {
      coordinateData.CameraUpVectorX = this.formatCoordinate(
        primaryViewpoint.CameraUpVector.X
      );
      coordinateData.CameraUpVectorY = this.formatCoordinate(
        primaryViewpoint.CameraUpVector.Y
      );
      coordinateData.CameraUpVectorZ = this.formatCoordinate(
        primaryViewpoint.CameraUpVector.Z
      );
    }

    coordinateData.FieldOfView = this.formatCoordinate(
      primaryViewpoint.FieldOfView
    );
    coordinateData.ViewToWorldScale = this.formatCoordinate(
      primaryViewpoint.ViewToWorldScale
    );

    // Legacy coordinates
    if (primaryViewpoint.cameraPosition) {
      coordinateData.cameraPosX = this.formatCoordinate(
        primaryViewpoint.cameraPosition.x
      );
      coordinateData.cameraPosY = this.formatCoordinate(
        primaryViewpoint.cameraPosition.y
      );
      coordinateData.cameraPosZ = this.formatCoordinate(
        primaryViewpoint.cameraPosition.z
      );
    }

    if (primaryViewpoint.cameraTarget) {
      coordinateData.cameraTargetX = this.formatCoordinate(
        primaryViewpoint.cameraTarget.x
      );
      coordinateData.cameraTargetY = this.formatCoordinate(
        primaryViewpoint.cameraTarget.y
      );
      coordinateData.cameraTargetZ = this.formatCoordinate(
        primaryViewpoint.cameraTarget.z
      );
    }

    console.log('📍 Successfully extracted coordinate data:', {
      cameraType: coordinateData.cameraType,
      CameraViewPointX: coordinateData.CameraViewPointX,
      CameraViewPointY: coordinateData.CameraViewPointY,
      CameraViewPointZ: coordinateData.CameraViewPointZ,
      ViewToWorldScale: coordinateData.ViewToWorldScale,
      cameraPosX: coordinateData.cameraPosX,
      hasCoordinates: !!(
        coordinateData.CameraViewPointX || coordinateData.cameraPosX
      ),
    });

    return coordinateData;
  }

  /**
   * Format coordinate values to 3 decimal places, handle null/undefined
   */
  formatCoordinate(value) {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const num = parseFloat(value);
    if (isNaN(num)) {
      return '';
    }

    return num.toFixed(3);
  }

  /**
   * Extract coordinate data from a single viewpoint object
   */
  extractViewpointCoordinates(viewpoint) {
    const coordinateData = {
      cameraType: viewpoint.cameraType || '',
      CameraViewPointX: this.formatCoordinate(viewpoint.CameraViewPoint?.X),
      CameraViewPointY: this.formatCoordinate(viewpoint.CameraViewPoint?.Y),
      CameraViewPointZ: this.formatCoordinate(viewpoint.CameraViewPoint?.Z),
      CameraDirectionX: this.formatCoordinate(viewpoint.CameraDirection?.X),
      CameraDirectionY: this.formatCoordinate(viewpoint.CameraDirection?.Y),
      CameraDirectionZ: this.formatCoordinate(viewpoint.CameraDirection?.Z),
      CameraUpVectorX: this.formatCoordinate(viewpoint.CameraUpVector?.X),
      CameraUpVectorY: this.formatCoordinate(viewpoint.CameraUpVector?.Y),
      CameraUpVectorZ: this.formatCoordinate(viewpoint.CameraUpVector?.Z),
      FieldOfView: this.formatCoordinate(viewpoint.FieldOfView),
      ViewToWorldScale: this.formatCoordinate(viewpoint.ViewToWorldScale),
      cameraPosX: this.formatCoordinate(viewpoint.cameraPosition?.x),
      cameraPosY: this.formatCoordinate(viewpoint.cameraPosition?.y),
      cameraPosZ: this.formatCoordinate(viewpoint.cameraPosition?.z),
      cameraTargetX: this.formatCoordinate(viewpoint.cameraTarget?.x),
      cameraTargetY: this.formatCoordinate(viewpoint.cameraTarget?.y),
      cameraTargetZ: this.formatCoordinate(viewpoint.cameraTarget?.z),
    };

    return coordinateData;
  }
}
