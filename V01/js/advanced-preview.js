// BCFSleuth Advanced Preview - Phase 3c
class AdvancedPreview {
  constructor(bcfApp) {
    this.app = bcfApp; // Reference to main BCFSleuthApp
    this.currentTab = 'simple';
    this.currentPage = 1;
    this.pageSize = 50;
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

    parsedData.forEach((bcfFile) => {
      bcfFile.topics.forEach((topic) => {
        // Add topic row
        const topicRow = {
          type: 'Topic',
          rowType: 'topic',
          sourceFile: bcfFile.filename,
          projectName: bcfFile.project.name || 'Unknown',
          bcfVersion: bcfFile.version || 'Unknown',
          topicGuid: topic.guid,
          title: topic.title || 'Untitled',
          status: topic.topicStatus || '',
          priority: topic.priority || '',
          assignee: topic.assignedTo || '',
          author: topic.creationAuthor || '',
          created: this.formatDate(topic.creationDate),
          due: this.formatDate(topic.dueDate),
          comments: topic.comments ? topic.comments.length : 0,
          isOverdue: this.isOverdue(topic.dueDate),
          // Store original topic for reference
          _originalTopic: topic,
        };

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
              type: 'Comment',
              rowType: 'comment',
              sourceFile: bcfFile.filename,
              topicGuid: topic.guid,
              parentTitle: topic.title,
              title: `Comment ${index + 1}`,
              status: comment.status || '',
              priority: '',
              assignee: '',
              author: comment.author || '',
              created: this.formatDate(comment.date),
              due: '',
              comments: '',
              content: comment.comment || '',
              // Store original comment for reference
              _originalComment: comment,
            };

            tableData.push(commentRow);
          });
        }
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
    };
  }

  mapFieldToTableColumn(field) {
    // Map export field names to table data properties
    const mapping = {
      title: 'title',
      description: 'description',
      status: 'status',
      type: 'type',
      priority: 'priority',
      stage: 'stage',
      labels: 'labels',
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
      commentText: 'content',
      commentStatus: 'commentStatus',
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

      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.updateSortIndicators();
    this.renderAdvancedTable();
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
        const rowClass =
          row.rowType === 'comment' ? 'row-type-comment' : 'row-type-topic';

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

    // Special formatting for specific fields
    switch (originalField) {
      case 'status':
        return value
          ? `<span class="status-badge status-${value
              .toLowerCase()
              .replace(/\s+/g, '-')}">${value}</span>`
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
  // ADD THESE THREE NEW METHODS HERE:

  createTitleCell(row) {
    const title = row.title || '';
    const truncated = this.truncateText(title, 40);
    const needsTooltip = title.length > 40;

    if (needsTooltip) {
      return `<td class="cell-title expandable" data-full-text="${this.escapeHtml(
        title
      )}">${truncated}</td>`;
    } else {
      return `<td class="cell-title">${truncated}</td>`;
    }
  }

  createFormattedCell(row, columnField, originalField) {
    let value = row[columnField] || '';
    let cssClass = '';
    let needsTooltip = false;
    let fullText = '';

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

      case 'commentsCount':
      case 'viewpointsCount':
        if (row.rowType === 'topic') {
          value = value || 0;
        } else {
          value = '';
        }
        break;

      default:
        // Handle long text fields
        if (value && value.length > 30) {
          cssClass = 'expandable';
          fullText = value;
          value = this.truncateText(value, 30);
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
}
