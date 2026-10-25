// BCFSleuth Advanced Preview - sortable, filterable topic table with comment and viewpoint expansion
// Columns sorted as numbers (non-numeric values fall back to string order)
const NUMERIC_SORT_FIELDS = [
  'type',
  'topicIndex',
  'serverAssignedId',
  'index',
  'priority',
  'dueDate',
  'createdDate',
  'modifiedDate',
];

// Columns sorted as dates (invalid dates sort to the end)
const DATE_SORT_FIELDS = ['dueDate', 'createdDate', 'modifiedDate'];

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
    this.app.debugLog(
      `Advanced Preview updated with ${this.allTableData.length} rows`
    );
  }

  /**
   * Flatten BCF data into table rows (topic rows, followed by that topic's
   * comment rows and additional-viewpoint rows)
   * @param {Array} parsedData - Parsed BCF files
   * @returns {Array<Object>} Flat row objects for the preview table
   */
  flattenBCFData(parsedData) {
    const tableData = [];
    let topicNumber = 1;

    parsedData.forEach((bcfFile) => {
      bcfFile.topics.forEach((topic) => {
        const coordinateData = this.getTopicCoordinateData(topic, bcfFile);

        tableData.push(
          this.createTopicRow(bcfFile, topic, topicNumber, coordinateData)
        );
        tableData.push(...this.createCommentRows(bcfFile, topic, topicNumber));
        tableData.push(
          ...this.createViewpointRows(bcfFile, topic, topicNumber)
        );

        topicNumber++;
      });
    });

    return tableData;
  }

  /**
   * Build the table row for a topic, including primary viewpoint coordinates
   * @param {Object} bcfFile - Parsed BCF file the topic belongs to
   * @param {Object} topic - Parsed topic
   * @param {number} topicNumber - 1-based topic number across all files
   * @param {Object} coordinateData - Result of getTopicCoordinateData
   * @returns {Object} Topic row
   */
  createTopicRow(bcfFile, topic, topicNumber, coordinateData) {
    return {
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

      // Coordinate data from primary viewpoint
      ...coordinateData,

      _originalTopic: topic,
    };
  }

  /**
   * Build comment rows for a topic, oldest first. Sorts topic.comments in
   * place, as the original inline code did.
   * @param {Object} bcfFile - Parsed BCF file the topic belongs to
   * @param {Object} topic - Parsed topic
   * @param {number} topicNumber - 1-based topic number across all files
   * @returns {Array<Object>} Comment rows (empty if the topic has no comments)
   */
  createCommentRows(bcfFile, topic, topicNumber) {
    if (!topic.comments || topic.comments.length === 0) {
      return [];
    }

    const sortedComments = topic.comments.sort(
      (a, b) =>
        new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01')
    );

    return sortedComments.map((comment, index) =>
      this.createCommentRow(bcfFile, topic, topicNumber, comment, index)
    );
  }

  /**
   * Build a single comment row
   * @param {Object} bcfFile - Parsed BCF file the topic belongs to
   * @param {Object} topic - Parent topic
   * @param {number} topicNumber - 1-based topic number across all files
   * @param {Object} comment - Parsed comment
   * @param {number} index - 0-based position in the sorted comment list
   * @returns {Object} Comment row
   */
  createCommentRow(bcfFile, topic, topicNumber, comment, index) {
    return {
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
  }

  /**
   * Build rows for a topic's additional viewpoints (those beyond the primary
   * viewpoint already shown in the topic row)
   * @param {Object} bcfFile - Parsed BCF file the topic belongs to
   * @param {Object} topic - Parsed topic
   * @param {number} topicNumber - 1-based topic number across all files
   * @returns {Array<Object>} Viewpoint rows (empty unless topic has 2+ viewpoints)
   */
  createViewpointRows(bcfFile, topic, topicNumber) {
    if (!topic.viewpoints || topic.viewpoints.length <= 1) {
      return [];
    }

    const viewpointsWithCoordinates = this.getCoordinateViewpoints(topic);
    const primaryViewpoint = this.selectCoordinateViewpoint(
      viewpointsWithCoordinates
    );

    return viewpointsWithCoordinates
      .filter((vp) => vp !== primaryViewpoint)
      .map((viewpoint, index) =>
        this.createViewpointRow(bcfFile, topic, topicNumber, viewpoint, index)
      );
  }

  /**
   * Build a single additional-viewpoint row
   * @param {Object} bcfFile - Parsed BCF file the topic belongs to
   * @param {Object} topic - Parent topic
   * @param {number} topicNumber - 1-based topic number across all files
   * @param {Object} viewpoint - Parsed viewpoint
   * @param {number} index - 0-based position among the additional viewpoints
   * @returns {Object} Viewpoint row
   */
  createViewpointRow(bcfFile, topic, topicNumber, viewpoint, index) {
    return {
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

      // All coordinate data for this viewpoint
      ...this.extractViewpointCoordinates(viewpoint),

      // Viewpoint-specific metadata
      viewpointNumber: index + 1,
      viewpointGuid: viewpoint.guid,
      viewpointFile: viewpoint.viewpointFile,
      viewpointType: viewpoint.cameraType || '',

      _originalViewpoint: viewpoint,
    };
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
      <th ${col.sortable ? `data-sort="${this.escapeHtml(col.field)}"` : ''} ${
          col.sortable ? 'style="cursor: pointer;"' : ''
        }>
        ${this.escapeHtml(col.label)}
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

  /**
   * Re-filter the table rows from the current filter state, hide rows of
   * collapsed topics, reset to page 1 and re-render.
   */
  applyFilters() {
    this.filteredData = this.allTableData
      .filter((row) => this.rowMatchesFilters(row))
      .filter((row) => this.isRowVisibleByExpansion(row));

    // Reset to first page when filters change
    this.currentPage = 1;
    this.renderAdvancedTable();
    this.updateActiveFilters();
    this.updateSummaryStats();
  }

  /**
   * Check a row against the search box and the topic-level dropdown filters.
   * @param {Object} row - Flattened table row
   * @returns {boolean} True if the row passes every active filter
   */
  rowMatchesFilters(row) {
    if (this.filters.search && !this.matchesSearch(row)) return false;
    if (row.rowType !== 'topic') return true;
    if (!this.matchesTopicDropdowns(row)) return false;
    if (this.filters.dueDate && !this.matchesDueDateFilter(row)) return false;
    return true;
  }

  /**
   * Case-insensitive search across the main text columns of a row.
   * @param {Object} row - Flattened table row
   * @returns {boolean}
   */
  matchesSearch(row) {
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

    return searchableText.includes(searchTerm);
  }

  /**
   * Apply the status, priority and assignee filters (topic rows only).
   * @param {Object} row - Topic row
   * @returns {boolean}
   */
  matchesTopicDropdowns(row) {
    const { status, priority, assignee } = this.filters;
    if (status && row.status !== status) return false;
    if (priority && row.priority !== priority) return false;
    if (assignee && row.assignee !== assignee) return false;
    return true;
  }

  /**
   * Apply the due date filter (topic rows only).
   * @param {Object} row - Topic row
   * @returns {boolean}
   */
  matchesDueDateFilter(row) {
    const today = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    switch (this.filters.dueDate) {
      case 'overdue':
        return !!row.due && this.isOverdue(row.due);
      case 'this-week': {
        if (!row.due) return false;
        const dueDate = new Date(row.due);
        const weekFromNow = new Date(today.getTime() + oneWeek);
        return !(dueDate < today || dueDate > weekFromNow);
      }
      case 'next-week': {
        if (!row.due) return false;
        const nextWeekStart = new Date(today.getTime() + oneWeek);
        const nextWeekEnd = new Date(today.getTime() + 2 * oneWeek);
        const dueDateNext = new Date(row.due);
        return !(dueDateNext < nextWeekStart || dueDateNext > nextWeekEnd);
      }
      case 'no-due-date':
        return !row.due;
      default:
        return true;
    }
  }

  /**
   * Comments and viewpoints only show while their parent topic is expanded.
   * @param {Object} row - Flattened table row
   * @returns {boolean}
   */
  isRowVisibleByExpansion(row) {
    if (row.rowType === 'comment' || row.rowType === 'viewpoint') {
      return this.expandedTopics.has(row.parentTopicGuid);
    }
    return true;
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
          ${this.escapeHtml(filter.label)}
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

  /**
   * Sort the filtered rows by a column (toggling direction on repeat clicks)
   * and re-render.
   * @param {string} field - Row property to sort by
   */
  sortData(field) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) =>
      this.compareRows(a[this.sortField], b[this.sortField])
    );

    this.updateSortIndicators();
    this.renderAdvancedTable();
  }

  /**
   * Compare two cell values for the active sort field and direction.
   * Null/undefined values always sort to the end.
   * @param {*} aVal - First value
   * @param {*} bVal - Second value
   * @returns {number} Comparator result
   */
  compareRows(aVal, bVal) {
    const asc = this.sortDirection === 'asc';

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return asc ? 1 : -1;
    if (bVal == null) return asc ? -1 : 1;

    if (DATE_SORT_FIELDS.includes(this.sortField)) {
      return this.compareDates(aVal, bVal, asc);
    }

    if (NUMERIC_SORT_FIELDS.includes(this.sortField)) {
      const result = this.compareNumbers(aVal, bVal, asc);
      if (result !== null) return result;
    }

    return this.compareStrings(aVal, bVal, asc);
  }

  /**
   * Compare two date values; invalid dates sort to the end.
   * @param {*} aVal - First date value
   * @param {*} bVal - Second date value
   * @param {boolean} asc - True for ascending order
   * @returns {number}
   */
  compareDates(aVal, bVal, asc) {
    const timeA = new Date(aVal).getTime();
    const timeB = new Date(bVal).getTime();

    if (isNaN(timeA) && isNaN(timeB)) return 0;
    if (isNaN(timeA)) return asc ? 1 : -1;
    if (isNaN(timeB)) return asc ? -1 : 1;

    const comparison = timeA - timeB;
    return asc ? comparison : -comparison;
  }

  /**
   * Compare two values numerically; numbers sort before non-numbers.
   * @param {*} aVal - First value
   * @param {*} bVal - Second value
   * @param {boolean} asc - True for ascending order
   * @returns {number|null} Comparator result, or null if neither is numeric
   */
  compareNumbers(aVal, bVal, asc) {
    const numA = parseFloat(aVal);
    const numB = parseFloat(bVal);

    if (!isNaN(numA) && !isNaN(numB)) {
      const comparison = numA - numB;
      return asc ? comparison : -comparison;
    }
    if (!isNaN(numA)) return asc ? -1 : 1;
    if (!isNaN(numB)) return asc ? 1 : -1;
    return null;
  }

  /**
   * Case-insensitive, trimmed string comparison.
   * @param {*} aVal - First value
   * @param {*} bVal - Second value
   * @param {boolean} asc - True for ascending order
   * @returns {number}
   */
  compareStrings(aVal, bVal, asc) {
    const strA = String(aVal).toLowerCase().trim();
    const strB = String(bVal).toLowerCase().trim();

    if (strA < strB) return asc ? -1 : 1;
    if (strA > strB) return asc ? 1 : -1;
    return 0;
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
    return HtmlUtils.escape(text);
  }

  createTitleCell(row) {
    const title = row.title || '';
    const rawTruncated = this.truncateText(title, 40);
    const truncated = this.escapeHtml(rawTruncated);
    const needsTooltip = title.length > 40 || rawTruncated.includes('...');

    // ADD EXPAND/COLLAPSE FUNCTIONALITY FOR TOPICS
    if (row.rowType === 'topic' && (row.hasComments || row.hasViewpoints)) {
      const isExpanded = this.expandedTopics.has(row.topicGuid);
      const expandIcon = isExpanded ? '▼' : '▶';

      // Build description of what can be expanded
      const expandableItems = [];
      if (row.hasComments) expandableItems.push('comments');
      if (row.hasViewpoints) expandableItems.push('viewpoints');
      const expandableText = expandableItems.join(' & ');

      const expandButton = `<button class="expand-button" data-topic-guid="${this.escapeHtml(
        row.topicGuid
      )}" onclick="window.bcfApp.advancedPreview.toggleTopicComments(this.dataset.topicGuid)" title="${
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

  /**
   * Create the HTML for one table cell, formatted for its field type
   * @param {Object} row - Flattened table row
   * @param {string} columnField - Row property the column reads from
   * @param {string} originalField - Field ID that decides the formatting
   * @returns {string} `<td>` HTML
   */
  createFormattedCell(row, columnField, originalField) {
    const value = row[columnField] || '';
    const cell = this.formatCellByField(row, originalField, value);

    if (cell.html !== undefined) {
      return cell.html;
    }

    return this.buildCellHtml({
      value,
      cssClass: '',
      fullText: '',
      needsTooltip: false,
      ...cell,
    });
  }

  /**
   * Choose the formatter for a field. Returns either `{ html }` (a finished
   * cell) or a partial `{ value, cssClass, fullText, needsTooltip }` that
   * createFormattedCell completes with defaults.
   * @param {Object} row - Flattened table row
   * @param {string} field - Field ID
   * @param {*} value - Raw cell value (already defaulted to '')
   * @returns {Object} Formatted cell parts
   */
  formatCellByField(row, field, value) {
    switch (field) {
      case 'status':
        return this.formatStatusCell(value);

      case 'priority':
        return this.formatPriorityCell(value);

      case 'dueDate':
        return this.formatDueDateCell(value);

      case 'creationDate':
      case 'modifiedDate':
      case 'commentDate':
        return { cssClass: 'cell-date' };

      case 'creationAuthor':
      case 'modifiedAuthor':
      case 'commentAuthor':
      case 'assignedTo':
        return { cssClass: 'cell-author' };

      case 'commentText':
        return this.formatCommentTextCell(value);

      case 'commentNumber':
        // Only show for comment rows, empty for topics
        return { value: row.rowType === 'comment' ? row.commentNumber || '' : '' };

      case 'commentsCount':
      case 'viewpointsCount':
        return { value: row.rowType === 'topic' ? value || 0 : '' };

      case 'cameraType':
        return { cssClass: 'cell-camera-type', value: value || '' };

      default:
        if (CoordinateUtils.COORDINATE_FIELDS.includes(field)) {
          return this.formatCoordinateCell(row, value);
        }
        return this.formatDefaultCell(value);
    }
  }

  /**
   * Status badge cell
   * @param {string} value - Status text
   * @returns {{html: string}} Finished cell
   */
  formatStatusCell(value) {
    if (!value) return { html: '<td></td>' };
    return {
      html: `<td><span class="status-badge status-${this.escapeHtml(
        String(value)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
      )}">${this.escapeHtml(value)}</span></td>`,
    };
  }

  /**
   * Priority badge cell
   * @param {string} value - Priority text
   * @returns {{html: string}} Finished cell
   */
  formatPriorityCell(value) {
    if (!value) return { html: '<td></td>' };
    return {
      html: `<td><span class="priority-badge priority-${this.escapeHtml(
        String(value)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
      )}">${this.escapeHtml(value)}</span></td>`,
    };
  }

  /**
   * Due date cell, flagged when overdue
   * @param {string} value - Formatted due date
   * @returns {Object} Finished cell (empty) or cell parts
   */
  formatDueDateCell(value) {
    if (!value) return { html: '<td></td>' };
    return {
      cssClass: 'cell-date',
      rawHtml: true,
      value: this.isOverdue(value)
        ? `<span style="color: var(--danger)">${this.escapeHtml(
            value
          )} (Overdue)</span>`
        : this.escapeHtml(value),
    };
  }

  /**
   * Comment text cell, truncated with a tooltip when longer than 50 chars
   * @param {string} value - Comment text
   * @returns {Object} Cell parts
   */
  formatCommentTextCell(value) {
    if (value && value.length > 50) {
      return {
        cssClass: 'cell-comment expandable',
        fullText: value,
        value: this.truncateText(value, 50),
        needsTooltip: true,
      };
    }
    return { cssClass: 'cell-comment' };
  }

  /**
   * Camera coordinate cell, shown for topic and viewpoint rows only
   * @param {Object} row - Flattened table row
   * @param {string} value - Formatted coordinate
   * @returns {Object} Cell parts
   */
  formatCoordinateCell(row, value) {
    if (row.rowType !== 'topic' && row.rowType !== 'viewpoint') {
      return { value: '' }; // Empty for comment rows
    }
    return {
      cssClass: 'cell-coordinate',
      rawHtml: true,
      value: value
        ? `<span class="coordinate-value">${this.escapeHtml(value)}</span>`
        : '',
    };
  }

  /**
   * Cell for fields without special formatting: truncates long text and
   * flags it for a tooltip
   * @param {*} value - Raw cell value
   * @returns {Object} Cell parts
   */
  formatDefaultCell(value) {
    const stringValue = String(value || '');
    if (stringValue && stringValue.length > 30) {
      return {
        cssClass: 'expandable',
        fullText: stringValue,
        value: this.truncateText(stringValue, 30),
        needsTooltip: true,
      };
    }
    // Also check if truncateText added ellipsis (indicates truncation)
    if (stringValue && typeof value === 'string' && value.includes('...')) {
      return {
        cssClass: 'expandable',
        fullText: stringValue,
        needsTooltip: true,
      };
    }
    return {};
  }

  /**
   * Assemble the final `<td>`, adding a tooltip attribute when needed
   * @param {{value: *, cssClass: string, fullText: string, needsTooltip: boolean, rawHtml: boolean}} cell
   * @returns {string} `<td>` HTML
   */
  buildCellHtml({ value, cssClass, fullText, needsTooltip, rawHtml }) {
    // Cell values come from BCF files, so escape unless the formatter
    // already built (and escaped) its own markup
    if (!rawHtml) value = this.escapeHtml(value);
    if (needsTooltip && fullText) {
      return `<td class="${cssClass}" data-full-text="${this.escapeHtml(
        fullText
      )}">${value}</td>`;
    }
    return `<td class="${cssClass}">${value}</td>`;
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

    expandableCells.forEach((cell) => {

      // Mouse enter - show tooltip
      cell.addEventListener('mouseenter', (e) => {
        const fullText = e.target.getAttribute('data-full-text');

        if (fullText && fullText.trim()) {
          tooltip.textContent = fullText;
          tooltip.classList.add('show');

          // Simple positioning - just below the cell
          const rect = e.target.getBoundingClientRect();
          tooltip.style.left = rect.left + 'px';
          tooltip.style.top = rect.bottom + 8 + 'px';

        }
      });

      // Mouse leave - hide tooltip
      cell.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
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
   * Get the viewpoints of a topic that carry extracted coordinate data
   * (these have CameraViewPoint, cameraType, FieldOfView, etc.)
   * @param {Object} topic - Parsed topic
   * @returns {Array<Object>} Viewpoints with coordinate data, in original order
   */
  getCoordinateViewpoints(topic) {
    return (topic.viewpoints || []).filter(
      (vp) =>
        vp.CameraViewPoint ||
        vp.cameraType ||
        vp.ViewToWorldScale ||
        vp.FieldOfView
    );
  }

  /**
   * Pick the viewpoint shown in the topic row: the main viewpoint.bcfv if
   * present, otherwise the first viewpoint
   * @param {Array<Object>} viewpoints - Viewpoints with coordinate data
   * @returns {Object|undefined} Selected viewpoint (undefined if list is empty)
   */
  selectCoordinateViewpoint(viewpoints) {
    return (
      viewpoints.find(
        (vp) =>
          vp.viewpointFile === 'viewpoint.bcfv' ||
          vp.guid === 'viewpoint-generic' ||
          (vp.viewpointFile &&
            vp.viewpointFile.toLowerCase().includes('viewpoint.bcfv'))
      ) || viewpoints[0]
    );
  }

  /**
   * Get coordinate data using the correct viewpoint with extracted coordinates.
   * Returns all coordinate fields as empty strings when no viewpoint qualifies.
   * @param {Object} topic - Parsed topic
   * @param {Object} bcfFile - Parsed BCF file the topic belongs to
   * @returns {Object} Coordinate fields keyed as in CoordinateUtils.COORDINATE_FIELDS
   */
  getTopicCoordinateData(topic, bcfFile) {
    const primaryViewpoint = this.selectCoordinateViewpoint(
      this.getCoordinateViewpoints(topic)
    );

    if (!primaryViewpoint) {
      return Object.fromEntries(
        CoordinateUtils.COORDINATE_FIELDS.map((field) => [field, ''])
      );
    }

    return this.extractViewpointCoordinates(primaryViewpoint);
  }

  /**
   * Format coordinate values to 3 decimal places, handle null/undefined
   */
  formatCoordinate(value) {
    return CoordinateUtils.formatCoordinate(value);
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
