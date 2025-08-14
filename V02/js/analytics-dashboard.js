// BCFSleuth Analytics Dashboard - Version 2.0 Phase 2
class AnalyticsDashboard {
  constructor(bcfApp) {
    this.app = bcfApp; // Reference to main BCFSleuthApp
    this.allData = []; // All BCF data for analysis
    this.filteredData = []; // Filtered data based on controls
    this.charts = {}; // Store chart instances
    this.filters = {
      project: '',
      dateRange: 'all',
    };
    this.isInitialized = false;

    // Verify ColorManager is available
    if (typeof ColorManager === 'undefined') {
      console.error(
        '❌ ColorManager not available - color consistency may be affected'
      );
    } else {
      console.log('✅ ColorManager ready for analytics dashboard');
    }

    // Chart.js default configuration for all charts
    this.chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            usePointStyle: true,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          cornerRadius: 6,
          displayColors: true,
          padding: 12,
        },
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart',
      },
    };
    // Color management now handled by ColorManager utility
    // No need for local color palette storage
  }

  /**
   * Initialize the Analytics Dashboard
   * Sets up event listeners and prepares the interface
   */
  initialize() {
    if (this.isInitialized) return;

    console.log('📊 Initializing Analytics Dashboard...');

    this.setupEventListeners();
    this.isInitialized = true;

    console.log('✅ Analytics Dashboard initialized');
  }

  /**
   * Set up all event listeners for the analytics dashboard
   */
  setupEventListeners() {
    // Filter controls
    const projectFilter = document.getElementById('analytics-project-filter');
    const dateRangeFilter = document.getElementById('analytics-date-range');

    if (projectFilter) {
      projectFilter.addEventListener('change', (e) => {
        this.filters.project = e.target.value;
        this.applyFilters();
      });
    }

    if (dateRangeFilter) {
      dateRangeFilter.addEventListener('change', (e) => {
        this.filters.dateRange = e.target.value;
        this.applyFilters();
      });
    }

    // Action buttons
    const exportChartsBtn = document.getElementById('export-charts-btn');
    const customReportBtn = document.getElementById('custom-report-btn');

    // PDF Charts Export button
    const exportChartsPdfBtn = document.getElementById('export-charts-pdf-btn');
    if (exportChartsPdfBtn) {
      exportChartsPdfBtn.addEventListener('click', () =>
        this.exportChartsToPDF()
      );
    }

    if (customReportBtn) {
      customReportBtn.addEventListener('click', () =>
        this.showCustomReportBuilder()
      );
    }

    // Custom report builder controls
    const generateReportBtn = document.getElementById('generate-report-btn');
    const exportCustomReportBtn = document.getElementById(
      'export-custom-report-btn'
    );
    const closeReportBuilderBtn = document.getElementById(
      'close-report-builder-btn'
    );

    if (generateReportBtn) {
      generateReportBtn.addEventListener('click', () =>
        this.generateCustomReport()
      );
    }

    if (exportCustomReportBtn) {
      exportCustomReportBtn.addEventListener('click', () =>
        this.exportCustomReport()
      );
    }

    if (closeReportBuilderBtn) {
      closeReportBuilderBtn.addEventListener('click', () =>
        this.hideCustomReportBuilder()
      );
    }

    console.log('📊 Analytics event listeners configured');
  }

  /**
   * Update analytics with new BCF data
   * This is called when BCF files are processed
   * @param {Array} parsedData - Array of parsed BCF data
   */
  async updateData(parsedData) {
    console.log('📊 Updating Analytics Dashboard with BCF data...');

    if (!parsedData || parsedData.length === 0) {
      this.showNoDataMessage();
      return;
    }

    try {
      // Store the data for analysis
      this.allData = parsedData;

      // Extract and flatten all topics for analysis
      this.extractTopicsData();

      // Populate filter options
      this.populateFilterOptions();

      // Apply initial filters and generate charts
      this.applyFilters();

      // Show the analytics interface
      this.showAnalyticsInterface();

      console.log(
        `✅ Analytics updated: ${this.filteredData.length} topics analyzed`
      );
    } catch (error) {
      console.error('❌ Error updating analytics:', error);
      this.showErrorState('Error processing analytics data: ' + error.message);
    }
  }

  /**
   * Extract and flatten topics data for analysis
   * Creates a normalized data structure for chart generation
   */
  extractTopicsData() {
    const topics = [];

    this.allData.forEach((bcfFile) => {
      bcfFile.topics.forEach((topic) => {
        const topicData = {
          // Basic topic info
          guid: topic.guid,
          title: topic.title || 'Untitled',
          description: topic.description || '',

          // Status and classification
          status: topic.topicStatus || 'Unknown',
          priority: topic.priority || 'Normal',
          type: topic.topicType || 'Issue',
          stage: topic.stage || '',

          // People and dates
          author: topic.creationAuthor || 'Unknown',
          assignedTo: topic.assignedTo || '',
          creationDate: this.parseDate(topic.creationDate),
          modifiedDate: this.parseDate(topic.modifiedDate),
          dueDate: this.parseDate(topic.dueDate),

          // Project context
          projectName: bcfFile.project.name || 'Unknown Project',
          sourceFile: bcfFile.filename || 'Unknown File',
          bcfVersion: bcfFile.version || 'Unknown',

          // Comments and engagement
          commentsCount: topic.comments ? topic.comments.length : 0,
          hasComments: topic.comments && topic.comments.length > 0,
          viewpointsCount: topic.viewpoints ? topic.viewpoints.length : 0,
          hasViewpoints: topic.viewpoints && topic.viewpoints.length > 0,

          // BCF 3.0 fields (if available)
          serverAssignedId: topic.serverAssignedId || '',
          referenceLinks: topic.referenceLinks || [],

          // Calculated fields
          isOverdue: this.isOverdue(topic.dueDate),
          ageInDays: this.getAgeInDays(topic.creationDate),

          // Store original topic for detailed analysis
          _originalTopic: topic,
        };

        topics.push(topicData);
      });
    });

    this.allTopics = topics;
    console.log(`📋 Extracted ${topics.length} topics for analysis`);
  }

  /**
   * Populate filter dropdown options based on actual data
   */
  populateFilterOptions() {
    const projects = new Set();

    this.allTopics.forEach((topic) => {
      projects.add(topic.projectName);
    });

    // Update project filter
    this.updateSelectOptions(
      'analytics-project-filter',
      Array.from(projects).sort()
    );
  }

  /**
   * Update select dropdown options
   * @param {string} selectId - ID of the select element
   * @param {Array} options - Array of option values
   */
  updateSelectOptions(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select) return;

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

  /**
   * Apply current filters and regenerate charts
   * This is called whenever filters change
   */
  applyFilters() {
    if (!this.allTopics || this.allTopics.length === 0) {
      this.filteredData = [];
      return;
    }

    // Start with all topics
    this.filteredData = this.allTopics.filter((topic) => {
      // Project filter
      if (this.filters.project && topic.projectName !== this.filters.project) {
        return false;
      }

      // Date range filter
      if (this.filters.dateRange !== 'all') {
        const daysAgo = parseInt(this.filters.dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

        if (!topic.creationDate || topic.creationDate < cutoffDate) {
          return false;
        }
      }

      return true;
    });

    console.log(
      `📊 Applied filters: ${this.filteredData.length} topics match criteria`
    );

    // Update statistics
    this.updateStatistics();

    // Regenerate all charts with debouncing for performance
    this.debounceChartUpdate();
  }

  /**
   * Debounced chart update for better performance
   * Prevents excessive chart regeneration during rapid filter changes
   */
  debounceChartUpdate() {
    if (this.chartUpdateTimeout) {
      clearTimeout(this.chartUpdateTimeout);
    }

    this.chartUpdateTimeout = setTimeout(async () => {
      await this.generateAllCharts();
    }, 300); // 300ms delay matches the app's search debounce
  }

  /**
   * Update the statistics display at the top of the dashboard
   */
  updateStatistics() {
    const stats = this.calculateStatistics();

    // Update stat display elements
    document.getElementById('analytics-total-topics').textContent =
      stats.totalTopics;
    document.getElementById('analytics-total-comments').textContent =
      stats.totalComments;
    document.getElementById('analytics-total-projects').textContent =
      stats.totalProjects;
    document.getElementById('analytics-avg-comments').textContent =
      stats.avgComments;
  }

  /**
   * Calculate key statistics from filtered data
   * @returns {Object} Statistics object
   */
  calculateStatistics() {
    const totalTopics = this.filteredData.length;
    const totalComments = this.filteredData.reduce(
      (sum, topic) => sum + topic.commentsCount,
      0
    );
    const uniqueProjects = new Set(
      this.filteredData.map((topic) => topic.projectName)
    ).size;
    const avgComments =
      totalTopics > 0 ? (totalComments / totalTopics).toFixed(1) : '0';

    return {
      totalTopics: totalTopics.toLocaleString(),
      totalComments: totalComments.toLocaleString(),
      totalProjects: uniqueProjects.toLocaleString(),
      avgComments: avgComments,
    };
  }

  /**
   * Generate all charts with current filtered data
   * This is the main chart generation orchestrator
   */
  async generateAllCharts() {
    if (!this.filteredData || this.filteredData.length === 0) {
      this.showNoDataMessage();
      return;
    }

    console.log('📊 Generating analytics charts...');

    // Wait for Chart.js to be ready
    const chartReady = await this.waitForChartJS();
    if (!chartReady) {
      this.showErrorState(
        'Chart.js library failed to load. Please refresh the page and try again.'
      );
      return;
    }

    try {
      // Destroy existing charts to prevent memory leaks
      this.destroyExistingCharts();

      // Generate each chart type
      this.generateStatusChart();
      this.generatePriorityChart();
      this.generateTimelineChart();
      this.generateAuthorChart();
      this.generateCommentsChart();

      // Add click handlers to all charts for lightbox functionality
      this.addChartClickHandlers();

      console.log('✅ All analytics charts generated successfully');
    } catch (error) {
      console.error('❌ Error generating charts:', error);
      this.showErrorState('Error generating charts: ' + error.message);
    }
  }

  /**
   * Wait for Chart.js library to be ready
   * @returns {Promise<boolean>} - True if Chart.js is ready
   */
  async waitForChartJS() {
    // Check if Chart.js is already available
    if (typeof Chart !== 'undefined') {
      console.log('✅ Chart.js is already available');
      return true;
    }

    // Wait up to 15 seconds for Chart.js to load
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts × 500ms = 15 seconds

    while (attempts < maxAttempts) {
      if (window.chartJSReady === true && typeof Chart !== 'undefined') {
        console.log('✅ Chart.js is now ready!');
        return true;
      }

      if (window.chartJSReady === false) {
        console.error('❌ Chart.js failed to load');
        return false;
      }

      console.log(
        `⏳ Waiting for Chart.js... (${attempts + 1}/${maxAttempts})`
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    }

    console.error('❌ Timeout waiting for Chart.js to load');
    return false;
  }

  /**
   * Destroy existing Chart.js instances to prevent memory leaks
   */
  destroyExistingCharts() {
    Object.keys(this.charts).forEach((chartKey) => {
      if (
        this.charts[chartKey] &&
        typeof this.charts[chartKey].destroy === 'function'
      ) {
        this.charts[chartKey].destroy();
      }
    });
    this.charts = {};
  }

  /**
   * Generate Status Distribution Donut Chart
   * Shows breakdown of topic statuses
   */
  generateStatusChart() {
    const canvas = document.getElementById('status-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Calculate status distribution
    const statusCounts = {};
    this.filteredData.forEach((topic) => {
      const status = topic.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Prepare chart data
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);

    // Use ColorManager for consistent status colors
    const statusColorMap = ColorManager.getStatusColors(labels);
    const backgroundColors = labels.map((label) => statusColorMap[label]);

    console.log(
      `🎨 Status Chart: Generated ${backgroundColors.length} colors for ${labels.length} statuses via ColorManager`
    );

    this.charts.status = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        ...this.chartDefaults,
        plugins: {
          ...this.chartDefaults.plugins,
          title: {
            display: false,
          },
          tooltip: {
            ...this.chartDefaults.plugins.tooltip,
            callbacks: {
              label: (context) => {
                const percentage = (
                  (context.raw / this.filteredData.length) *
                  100
                ).toFixed(1);
                return `${context.label}: ${context.raw} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  /**
   * Generate Priority Distribution Bar Chart
   * Shows breakdown of topic priorities
   */
  generatePriorityChart() {
    const canvas = document.getElementById('priority-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Calculate priority distribution with logical ordering
    const priorityOrder = ['Low', 'Normal', 'Medium', 'High', 'Critical'];
    const priorityCounts = {};

    // Initialize with zeros to ensure all priorities show
    priorityOrder.forEach((priority) => {
      priorityCounts[priority] = 0;
    });

    // Count actual priorities
    this.filteredData.forEach((topic) => {
      const priority = topic.priority || 'Normal';
      if (priorityCounts.hasOwnProperty(priority)) {
        priorityCounts[priority]++;
      } else {
        priorityCounts[priority] = 1;
      }
    });

    // Get all unique priorities and sort them logically
    const allPriorities = Object.keys(priorityCounts);
    const sortedPriorities = [];

    // Add standard priorities in order if they exist
    priorityOrder.forEach((priority) => {
      if (allPriorities.includes(priority)) {
        sortedPriorities.push(priority);
      }
    });

    // Add any custom priorities at the end, sorted alphabetically
    const customPriorities = allPriorities
      .filter((priority) => !priorityOrder.includes(priority))
      .sort();
    sortedPriorities.push(...customPriorities);

    // Prepare chart data in logical order
    const labels = sortedPriorities;
    const data = labels.map((priority) => priorityCounts[priority] || 0);

    // Use ColorManager for consistent priority colors
    const priorityColorMap = ColorManager.getPriorityColors(labels);
    const backgroundColors = labels.map((label) => priorityColorMap[label]);
    // Generate border colors by darkening the background colors
    const borderColors = backgroundColors.map((color) =>
      this.darkenColor(color)
    );

    console.log(
      `🎨 Priority Chart: Generated ${backgroundColors.length} colors for ${labels.length} priorities via ColorManager`
    );

    this.charts.priority = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Topics',
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 1,
            borderColor: borderColors,
          },
        ],
      },
      options: {
        ...this.chartDefaults,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
        plugins: {
          ...this.chartDefaults.plugins,
          legend: {
            display: false,
          },
        },
      },
    });
  }

  /**
   * Generate Timeline Chart
   * Shows topic creation over time
   */
  generateTimelineChart() {
    const canvas = document.getElementById('timeline-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Group topics by creation date (by month for better readability)
    const timelineData = this.groupTopicsByMonth();

    if (timelineData.length === 0) {
      this.showChartError(canvas, 'No date information available for timeline');
      return;
    }

    // Sort by date
    timelineData.sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = timelineData.map((item) => item.label);
    const data = timelineData.map((item) => item.count);

    this.charts.timeline = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Topics Created',
            data: data,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#2563eb',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
          },
        ],
      },
      options: {
        ...this.chartDefaults,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }

  /**
   * Generate Author Activity Chart
   * Shows topics created by each author
   */
  generateAuthorChart() {
    const canvas = document.getElementById('author-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Calculate author activity (limit to top 10 for readability)
    const authorCounts = {};
    this.filteredData.forEach((topic) => {
      const author = topic.author || 'Unknown';
      authorCounts[author] = (authorCounts[author] || 0) + 1;
    });

    // Sort and take top 10
    const sortedAuthors = Object.entries(authorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    if (sortedAuthors.length === 0) {
      this.showChartError(canvas, 'No author information available');
      return;
    }

    const labels = sortedAuthors.map(([author]) =>
      author.length > 15 ? author.substring(0, 15) + '...' : author
    );
    const data = sortedAuthors.map(([, count]) => count);

    this.charts.author = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Topics Created',
            data: data,
            backgroundColor: '#0ea5e9',
            borderWidth: 1,
            borderColor: '#0284c7',
          },
        ],
      },
      options: {
        ...this.chartDefaults,
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
        plugins: {
          ...this.chartDefaults.plugins,
          legend: {
            display: false,
          },
          tooltip: {
            ...this.chartDefaults.plugins.tooltip,
            callbacks: {
              title: (context) => {
                // Show full author name in tooltip
                const shortName = context[0].label;
                const fullName = sortedAuthors[context[0].dataIndex][0];
                return fullName;
              },
            },
          },
        },
      },
    });
  }

  /**
   * Generate Comments Analysis Chart
   * Shows distribution of comment counts per topic
   */
  generateCommentsChart() {
    const canvas = document.getElementById('comments-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Group topics by comment count ranges
    const commentRanges = {
      'No Comments': 0,
      '1-2 Comments': 0,
      '3-5 Comments': 0,
      '6-10 Comments': 0,
      '10+ Comments': 0,
    };

    this.filteredData.forEach((topic) => {
      const count = topic.commentsCount;
      if (count === 0) {
        commentRanges['No Comments']++;
      } else if (count <= 2) {
        commentRanges['1-2 Comments']++;
      } else if (count <= 5) {
        commentRanges['3-5 Comments']++;
      } else if (count <= 10) {
        commentRanges['6-10 Comments']++;
      } else {
        commentRanges['10+ Comments']++;
      }
    });

    const labels = Object.keys(commentRanges);
    const data = Object.values(commentRanges);
    // Use ColorManager for consistent comment range colors
    const backgroundColors = ColorManager.generateChartPalette(labels.length);

    this.charts.comments = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        ...this.chartDefaults,
        plugins: {
          ...this.chartDefaults.plugins,
          tooltip: {
            ...this.chartDefaults.plugins.tooltip,
            callbacks: {
              label: (context) => {
                const percentage = (
                  (context.raw / this.filteredData.length) *
                  100
                ).toFixed(1);
                return `${context.label}: ${context.raw} topics (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  /**
   * Group topics by month for timeline chart
   * @returns {Array} Array of {date, label, count} objects
   */
  groupTopicsByMonth() {
    const monthlyData = {};

    this.filteredData.forEach((topic) => {
      if (!topic.creationDate) return;

      const date = new Date(topic.creationDate);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          date: monthKey,
          label: monthLabel,
          count: 0,
        };
      }

      monthlyData[monthKey].count++;
    });

    return Object.values(monthlyData);
  }

  /**
   * Get chart colors using ColorManager
   * @param {Array} labels - Array of labels needing colors
   * @param {string} colorType - 'status', 'priority', or 'generic'
   * @returns {Array} - Array of hex colors
   */
  getChartColors(labels, colorType = 'generic') {
    console.log(
      `🎨 Getting ${labels.length} colors for ${colorType} chart via ColorManager`
    );

    switch (colorType) {
      case 'status':
        const statusColors = ColorManager.getStatusColors(labels);
        return labels.map((label) => statusColors[label]);
      case 'priority':
        const priorityColors = ColorManager.getPriorityColors(labels);
        return labels.map((label) => priorityColors[label]);
      default:
        return ColorManager.generateChartPalette(labels.length);
    }
  }

  /**
   * Darken a color for borders - ENHANCED with better color calculation
   * @param {string} color - Hex color
   * @returns {string} - Darkened hex color
   */
  darkenColor(color) {
    // Handle both 3 and 6 character hex codes
    const hex = color.replace('#', '');
    let r, g, b;

    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    }

    // Darken by 25% (more subtle than the original 32 reduction)
    r = Math.max(0, Math.floor(r * 0.75));
    g = Math.max(0, Math.floor(g * 0.75));
    b = Math.max(0, Math.floor(b * 0.75));

    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Show chart error in canvas
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {string} message - Error message
   */
  showChartError(canvas, message) {
    const wrapper = canvas.closest('.chart-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `
        <div class="chart-error">
          <div class="chart-error-icon">⚠️</div>
          <div class="chart-error-text">Chart Unavailable</div>
          <div class="chart-error-details">${message}</div>
        </div>
      `;
    }
  }

  /**
   * Show/hide analytics interface
   */
  showAnalyticsInterface() {
    const noMessage = document.getElementById('no-analytics-message');
    const chartsGrid = document.getElementById('analytics-charts-grid');

    if (noMessage) noMessage.style.display = 'none';
    if (chartsGrid) chartsGrid.style.display = 'grid';
  }

  showNoDataMessage() {
    const noMessage = document.getElementById('no-analytics-message');
    const chartsGrid = document.getElementById('analytics-charts-grid');

    if (noMessage) noMessage.style.display = 'block';
    if (chartsGrid) chartsGrid.style.display = 'none';
  }

  /**
   * Show error state
   * @param {string} message - Error message
   */
  showErrorState(message) {
    const chartsGrid = document.getElementById('analytics-charts-grid');
    if (chartsGrid) {
      chartsGrid.innerHTML = `
        <div class="chart-error" style="grid-column: 1 / -1;">
          <div class="chart-error-icon">❌</div>
          <div class="chart-error-text">Analytics Error</div>
          <div class="chart-error-details">${message}</div>
        </div>
      `;
      chartsGrid.style.display = 'grid';
    }
  }

  /**
   * Export all charts as images
   */
  async exportCharts() {
    console.log('📊 Exporting analytics charts...');

    try {
      const charts = Object.entries(this.charts);
      if (charts.length === 0) {
        alert('No charts available to export');
        return;
      }

      // Create a zip file with all chart images
      if (typeof JSZip === 'undefined') {
        // Fallback: download charts individually
        this.exportChartsIndividually();
        return;
      }

      const zip = new JSZip();
      const timestamp = new Date().toISOString().split('T')[0];

      // Export each chart as PNG
      for (const [chartKey, chart] of charts) {
        if (chart && chart.canvas) {
          try {
            const imageData = chart.canvas.toDataURL('image/png');
            const base64Data = imageData.split(',')[1];

            const filename = `${chartKey}-chart-${timestamp}.png`;
            zip.file(filename, base64Data, { base64: true });
          } catch (error) {
            console.warn(`Failed to export ${chartKey} chart:`, error);
          }
        }
      }

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `bcf-analytics-charts-${timestamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      console.log('✅ Charts exported successfully');
      alert(`Successfully exported ${charts.length} charts as ZIP file!`);
    } catch (error) {
      console.error('❌ Error exporting charts:', error);
      alert('Error exporting charts: ' + error.message);
    }
  }

  /**
   * Export charts individually (fallback method)
   */
  exportChartsIndividually() {
    const charts = Object.entries(this.charts);
    const timestamp = new Date().toISOString().split('T')[0];

    charts.forEach(([chartKey, chart], index) => {
      if (chart && chart.canvas) {
        setTimeout(() => {
          try {
            const link = document.createElement('a');
            link.download = `${chartKey}-chart-${timestamp}.png`;
            link.href = chart.canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (error) {
            console.warn(`Failed to export ${chartKey} chart:`, error);
          }
        }, index * 500); // Stagger downloads
      }
    });

    alert(`Downloading ${charts.length} chart images individually...`);
  }

  /**
   * Export all charts as a single PDF document
   */
  async exportChartsToPDF() {
    console.log('📄 Exporting charts as PDF...');

    try {
      const charts = Object.entries(this.charts);
      if (charts.length === 0) {
        alert('No charts available to export');
        return;
      }

      // Check if jsPDF is available
      if (
        typeof window.jspdf === 'undefined' ||
        typeof window.jspdf.jsPDF !== 'function'
      ) {
        alert(
          'PDF functionality requires jsPDF library. Please refresh the page and try again.'
        );
        return;
      }

      const pdf = new window.jspdf.jsPDF('portrait', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let currentY = margin;

      // Title page
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BCF Analytics Charts Report', pageWidth / 2, currentY, {
        align: 'center',
      });
      currentY += 15;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const chartsTimestamp = new Date().toLocaleDateString();
      pdf.text(`Generated: ${chartsTimestamp}`, pageWidth / 2, currentY, {
        align: 'center',
      });
      currentY += 20;

      // Add summary stats
      const stats = this.calculateStatistics();
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary Statistics', margin, currentY);
      currentY += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const summaryLines = [
        `Total Topics: ${stats.totalTopics}`,
        `Total Comments: ${stats.totalComments}`,
        `Total Projects: ${stats.totalProjects}`,
        `Average Comments per Topic: ${stats.avgComments}`,
      ];

      summaryLines.forEach((line) => {
        pdf.text(line, margin, currentY);
        currentY += 7;
      });

      currentY += 10;

      // Process each chart
      for (const [chartKey, chart] of charts) {
        if (chart && chart.canvas) {
          try {
            // Check if we need a new page
            if (currentY > pageHeight - 120) {
              pdf.addPage();
              currentY = margin;
            }

            // Chart title
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            const chartTitle = this.getChartTitle(chartKey);
            pdf.text(chartTitle, margin, currentY);
            currentY += 10;

            // Get chart image
            const imageData = chart.canvas.toDataURL('image/png');

            // Calculate dimensions (maintain aspect ratio)
            const maxWidth = pageWidth - 2 * margin;
            const maxHeight = 100; // Max height for each chart
            const aspectRatio = chart.canvas.width / chart.canvas.height;

            let imgWidth = maxWidth;
            let imgHeight = imgWidth / aspectRatio;

            if (imgHeight > maxHeight) {
              imgHeight = maxHeight;
              imgWidth = imgHeight * aspectRatio;
            }

            // Center the image
            const imgX = (pageWidth - imgWidth) / 2;

            // Add image to PDF
            pdf.addImage(imageData, 'PNG', imgX, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 15;
          } catch (error) {
            console.warn(`Failed to add ${chartKey} chart to PDF:`, error);
            // Add error note
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'italic');
            pdf.text(
              `[${chartKey} chart could not be exported]`,
              margin,
              currentY
            );
            currentY += 10;
          }
        }
      }

      // Footer on all pages
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text(
          'Generated by BCFSleuth Analytics Dashboard',
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Generate filename and download
      const chartsFileTimestamp = new Date().toISOString().split('T')[0];
      const filename = `BCF_Analytics_Charts_${chartsFileTimestamp}.pdf`;
      pdf.save(filename);

      console.log('✅ Charts PDF exported successfully');
      alert(`Charts PDF exported successfully!\nFilename: ${filename}`);
    } catch (error) {
      console.error('❌ Error exporting charts PDF:', error);
      alert('Error exporting charts PDF: ' + error.message);
    }
  }

  /**
   * Get user-friendly chart title
   * @param {string} chartKey - Chart key (status, priority, etc.)
   * @returns {string} - Formatted title
   */
  getChartTitle(chartKey) {
    const titles = {
      status: 'Status Distribution',
      priority: 'Priority Distribution',
      timeline: 'Topic Creation Timeline',
      author: 'Author Activity',
      comments: 'Comments Analysis',
    };

    return (
      titles[chartKey] || chartKey.charAt(0).toUpperCase() + chartKey.slice(1)
    );
  }

  /**
   * Get user-friendly chart title
   * @param {string} chartKey - Chart key (status, priority, etc.)
   * @returns {string} - Formatted title
   */
  getChartTitle(chartKey) {
    const titles = {
      status: 'Status Distribution',
      priority: 'Priority Distribution',
      timeline: 'Topic Creation Timeline',
      author: 'Author Activity',
      comments: 'Comments Analysis',
    };

    return (
      titles[chartKey] || chartKey.charAt(0).toUpperCase() + chartKey.slice(1)
    );
  }

  /**
   * Show custom report builder
   */
  showCustomReportBuilder() {
    console.log('📋 Opening custom report builder...');

    const container = document.getElementById('custom-report-container');
    if (container) {
      container.style.display = 'block';
      this.populateReportFields();

      // Scroll to the builder
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Hide custom report builder
   */
  hideCustomReportBuilder() {
    const container = document.getElementById('custom-report-container');
    if (container) {
      container.style.display = 'none';
    }
  }

  /**
   * Populate report builder with available fields
   */
  populateReportFields() {
    const grid = document.getElementById('report-field-grid');
    if (!grid) return;

    const availableFields = [
      { id: 'status', label: 'Status' },
      { id: 'priority', label: 'Priority' },
      { id: 'type', label: 'Type' },
      { id: 'stage', label: 'Stage' },
      { id: 'author', label: 'Author' },
      { id: 'assignedTo', label: 'Assigned To' },
      { id: 'projectName', label: 'Project' },
      { id: 'commentsCount', label: 'Comments Count' },
      { id: 'viewpointsCount', label: 'Viewpoints Count' },
      { id: 'isOverdue', label: 'Overdue Status' },
      { id: 'ageInDays', label: 'Age (Days)' },
    ];

    // Create field selection controls
    const controlsHTML = `
      <div class="report-field-controls">
        <button type="button" id="report-select-all" class="btn btn-secondary btn-sm">Select All</button>
        <button type="button" id="report-clear-all" class="btn btn-secondary btn-sm">Clear All</button>
      </div>
    `;

    const fieldsHTML = availableFields
      .map(
        (field) => `
      <div class="report-field-item">
        <input type="checkbox" id="report-field-${field.id}" value="${field.id}">
        <label for="report-field-${field.id}">${field.label}</label>
      </div>
    `
      )
      .join('');

    grid.innerHTML = controlsHTML + fieldsHTML;

    // Add event listeners for the control buttons
    this.setupReportFieldControls();
  }

  /**
   * Setup event listeners for report field selection controls
   */
  setupReportFieldControls() {
    const selectAllBtn = document.getElementById('report-select-all');
    const clearAllBtn = document.getElementById('report-clear-all');

    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        document
          .querySelectorAll('#report-field-grid input[type="checkbox"]')
          .forEach((checkbox) => {
            checkbox.checked = true;
          });
        console.log('📋 Selected all report fields');
      });
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        document
          .querySelectorAll('#report-field-grid input[type="checkbox"]')
          .forEach((checkbox) => {
            checkbox.checked = false;
          });
        console.log('📋 Cleared all report fields');
      });
    }
  }

  /**
   * Generate custom report based on selected fields
   */
  generateCustomReport() {
    console.log('📋 Generating custom report...');

    // Get selected fields
    const selectedFields = [];
    document
      .querySelectorAll('#report-field-grid input:checked')
      .forEach((checkbox) => {
        selectedFields.push(checkbox.value);
      });

    if (selectedFields.length === 0) {
      alert('Please select at least one field for analysis');
      return;
    }

    // Generate custom analysis
    const analysisResults = this.performCustomAnalysis(selectedFields);
    this.displayCustomReportResults(analysisResults);
  }

  /**
   * Perform custom analysis on selected fields
   * @param {Array} fields - Selected field names
   * @returns {Object} - Analysis results
   */
  performCustomAnalysis(fields) {
    const results = {
      totalItems: this.filteredData.length,
      fieldAnalysis: {},
      crossFieldAnalysis: [],
    };

    // Analyze each selected field
    fields.forEach((field) => {
      const fieldData = this.analyzeField(field);
      results.fieldAnalysis[field] = fieldData;
    });

    // Perform cross-field analysis if multiple fields selected
    if (fields.length > 1) {
      results.crossFieldAnalysis = this.performCrossFieldAnalysis(
        fields.slice(0, 2)
      ); // Limit to 2 fields for now
    }

    return results;
  }

  /**
   * Analyze a single field
   * @param {string} fieldName - Field to analyze
   * @returns {Object} - Field analysis results
   */
  analyzeField(fieldName) {
    const values = {};
    const numericValues = [];

    this.filteredData.forEach((topic) => {
      const value = topic[fieldName];

      if (
        fieldName === 'commentsCount' ||
        fieldName === 'viewpointsCount' ||
        fieldName === 'ageInDays'
      ) {
        // Numeric field
        if (typeof value === 'number') {
          numericValues.push(value);
        }
      } else if (fieldName === 'isOverdue') {
        // Boolean field
        const boolValue = value ? 'Yes' : 'No';
        values[boolValue] = (values[boolValue] || 0) + 1;
      } else {
        // Categorical field
        const strValue = String(value || 'Unknown');
        values[strValue] = (values[strValue] || 0) + 1;
      }
    });

    if (numericValues.length > 0) {
      // Numeric analysis
      numericValues.sort((a, b) => a - b);
      return {
        type: 'numeric',
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        average: (
          numericValues.reduce((a, b) => a + b, 0) / numericValues.length
        ).toFixed(2),
        median: numericValues[Math.floor(numericValues.length / 2)],
        distribution: this.createNumericDistribution(numericValues),
      };
    } else {
      // Categorical analysis
      const sortedValues = Object.entries(values).sort(([, a], [, b]) => b - a);
      return {
        type: 'categorical',
        uniqueValues: Object.keys(values).length,
        distribution: sortedValues,
        topValue: sortedValues[0] || ['None', 0],
      };
    }
  }

  /**
   * Create numeric distribution for visualization
   * @param {Array} values - Numeric values
   * @returns {Object} - Distribution data
   */
  createNumericDistribution(values) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const bucketCount = Math.min(10, Math.max(3, Math.ceil(range / 5)));
    const bucketSize = range / bucketCount;

    const buckets = {};
    for (let i = 0; i < bucketCount; i++) {
      const bucketMin = min + i * bucketSize;
      const bucketMax = min + (i + 1) * bucketSize;
      const bucketLabel = `${bucketMin.toFixed(0)}-${bucketMax.toFixed(0)}`;
      buckets[bucketLabel] = 0;
    }

    values.forEach((value) => {
      const bucketIndex = Math.min(
        bucketCount - 1,
        Math.floor((value - min) / bucketSize)
      );
      const bucketMin = min + bucketIndex * bucketSize;
      const bucketMax = min + (bucketIndex + 1) * bucketSize;
      const bucketLabel = `${bucketMin.toFixed(0)}-${bucketMax.toFixed(0)}`;
      buckets[bucketLabel]++;
    });

    return Object.entries(buckets);
  }

  /**
   * Perform cross-field analysis
   * @param {Array} fields - Two fields to analyze together
   * @returns {Array} - Cross-analysis results
   */
  performCrossFieldAnalysis(fields) {
    if (fields.length !== 2) return [];

    const [field1, field2] = fields;
    const crossData = {};

    this.filteredData.forEach((topic) => {
      const value1 = String(topic[field1] || 'Unknown');
      const value2 = String(topic[field2] || 'Unknown');
      const key = `${value1} × ${value2}`;

      crossData[key] = (crossData[key] || 0) + 1;
    });

    return Object.entries(crossData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 combinations
  }

  /**
   * Display custom report results
   * @param {Object} results - Analysis results
   */
  displayCustomReportResults(results) {
    const container = document.getElementById('custom-report-results');
    if (!container) return;

    let html = `
      <h6>Custom Analysis Results</h6>
      <p><strong>Total Topics Analyzed:</strong> ${results.totalItems}</p>
    `;

    // Display field analysis
    Object.entries(results.fieldAnalysis).forEach(([fieldName, analysis]) => {
      html += `<div class="field-analysis-section">`;
      html += `<h6>${this.getFieldLabel(fieldName)} Analysis</h6>`;

      if (analysis.type === 'numeric') {
        html += `
          <div class="numeric-analysis">
            <p><strong>Range:</strong> ${analysis.min} - ${analysis.max}</p>
            <p><strong>Average:</strong> ${analysis.average}</p>
            <p><strong>Median:</strong> ${analysis.median}</p>
            <div class="distribution">
              <strong>Distribution:</strong>
              <ul>
                ${analysis.distribution
                  .map(([range, count]) => `<li>${range}: ${count} topics</li>`)
                  .join('')}
              </ul>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="categorical-analysis">
            <p><strong>Unique Values:</strong> ${analysis.uniqueValues}</p>
            <p><strong>Most Common:</strong> ${analysis.topValue[0]} (${
          analysis.topValue[1]
        } topics)</p>
            <div class="distribution">
              <strong>Distribution:</strong>
              <ul>
                ${analysis.distribution
                  .slice(0, 5)
                  .map(([value, count]) => `<li>${value}: ${count} topics</li>`)
                  .join('')}
              </ul>
            </div>
          </div>
        `;
      }

      html += `</div>`;
    });

    // Display cross-field analysis
    if (results.crossFieldAnalysis.length > 0) {
      html += `
        <div class="cross-analysis-section">
          <h6>Cross-Field Analysis</h6>
          <p><strong>Top Combinations:</strong></p>
          <ul>
            ${results.crossFieldAnalysis
              .map(
                ([combination, count]) =>
                  `<li>${combination}: ${count} topics</li>`
              )
              .join('')}
          </ul>
        </div>
      `;
    }

    container.innerHTML = html;

    // Enable the export controls now that we have results
    const exportBtn = document.getElementById('export-custom-report-btn');
    const exportFormat = document.getElementById('report-export-format');
    if (exportBtn) {
      exportBtn.disabled = false;
    }
    if (exportFormat) {
      exportFormat.disabled = false;
    }
  }

  /**
   * Get user-friendly field label
   * @param {string} fieldName - Internal field name
   * @returns {string} - User-friendly label
   */
  getFieldLabel(fieldName) {
    const labels = {
      status: 'Status',
      priority: 'Priority',
      type: 'Type',
      stage: 'Stage',
      author: 'Author',
      assignedTo: 'Assigned To',
      projectName: 'Project',
      commentsCount: 'Comments Count',
      viewpointsCount: 'Viewpoints Count',
      isOverdue: 'Overdue Status',
      ageInDays: 'Age (Days)',
    };

    return labels[fieldName] || fieldName;
  }

  // Utility date methods
  parseDate(dateString) {
    if (!dateString) return null;
    try {
      return new Date(dateString);
    } catch {
      return null;
    }
  }

  isOverdue(dueDateString) {
    if (!dueDateString) return false;
    try {
      const dueDate = new Date(dueDateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate < today;
    } catch {
      return false;
    }
  }

  getAgeInDays(creationDateString) {
    if (!creationDateString) return 0;
    try {
      const creationDate = new Date(creationDateString);
      const today = new Date();
      const diffTime = Math.abs(today - creationDate);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }

  /**
   * Export custom analytics report in selected format
   * Supports text, PDF, and Word document formats
   */
  exportCustomReport() {
    console.log('📄 Exporting custom analytics report...');

    // Check if we have report content to export
    const reportContent = document.getElementById('custom-report-results');
    if (!reportContent || !reportContent.innerHTML.trim()) {
      alert('No report to export. Please generate a report first.');
      return;
    }

    // Get selected export format
    const formatSelect = document.getElementById('report-export-format');
    const exportFormat = formatSelect ? formatSelect.value : 'text';

    console.log(`📋 Export format selected: ${exportFormat}`);

    try {
      // Route to appropriate export method based on format
      switch (exportFormat) {
        case 'pdf':
          this.exportCustomReportAsPDF();
          break;
        case 'word':
          this.exportCustomReportAsWord();
          break;
        case 'text':
        default:
          this.exportCustomReportAsText();
          break;
      }
    } catch (error) {
      console.error('❌ Error exporting custom report:', error);
      alert('Error exporting report: ' + error.message);
    }
  }

  /**
   * Export custom report as text file (original functionality)
   */
  exportCustomReportAsText() {
    console.log('📄 Exporting as text file...');

    const reportContent = document.getElementById('custom-report-results');

    // Get the selected fields to include in metadata
    const selectedFields = [];
    document
      .querySelectorAll('#report-field-grid input:checked')
      .forEach((checkbox) => {
        const label =
          checkbox.nextElementSibling?.textContent || checkbox.value;
        selectedFields.push(label);
      });

    // Generate report metadata
    const timestamp = new Date().toISOString().split('T')[0];
    const timeGenerated = new Date().toLocaleString();
    const reportTitle = `BCF Custom Analytics Report - ${timestamp}`;

    // Get project information for context
    const projectNames = [
      ...new Set(this.filteredData.map((topic) => topic.projectName)),
    ];
    const projectInfo =
      projectNames.length === 1
        ? projectNames[0]
        : `${projectNames.length} Projects`;

    // Extract the text content from the results
    const resultsText = this.extractReportTextContent(reportContent);

    // Build the complete formatted report
    const exportContent = [
      reportTitle,
      '='.repeat(reportTitle.length),
      '',
      `Generated: ${timeGenerated}`,
      `Project(s): ${projectInfo}`,
      `Total Topics Analyzed: ${this.filteredData.length}`,
      `Analysis Fields: ${selectedFields.join(', ')}`,
      '',
      '--- ANALYSIS RESULTS ---',
      '',
      resultsText,
      '',
      '--- END REPORT ---',
      '',
      'Generated by BCFSleuth Analytics Dashboard',
    ];

    // Create the file content and download
    const fileContent = exportContent.join('\n');
    const projectPrefix =
      projectNames.length === 1
        ? this.sanitizeFilename(projectNames[0])
        : 'Multi_Project';
    const filename = `${projectPrefix}_Custom_Analytics_${timestamp}.txt`;

    this.downloadTextFile(fileContent, filename);

    console.log('✅ Text report exported:', filename);
    alert(`Text report exported successfully!\nFilename: ${filename}`);
  }

  /**
   * Export custom report as PDF document
   * Creates a professional PDF with formatted sections and styling
   */
  async exportCustomReportAsPDF() {
    console.log('📄 Exporting as PDF document...');

    // Check if jsPDF constructor is available
    if (
      typeof window.jspdf === 'undefined' ||
      typeof window.jspdf.jsPDF !== 'function'
    ) {
      console.error('jsPDF library not found');
      console.log('Window jsPDF:', window.jsPDF);
      console.log(
        'Available PDF-related properties:',
        Object.keys(window).filter((key) => key.toLowerCase().includes('pdf'))
      );

      // Wait a moment and try again (in case of loading timing)
      setTimeout(() => {
        if (typeof window.jsPDF !== 'undefined') {
          console.log('✅ jsPDF became available after delay');
          this.exportCustomReportAsPDF(); // Retry
        } else {
          alert(
            'PDF functionality requires jsPDF library. Please refresh the page and try again.'
          );
        }
      }, 1000);
      return;
    }

    console.log('✅ jsPDF available, proceeding with PDF generation');

    console.log(
      '✅ jsPDF check passed, typeof window.jsPDF:',
      typeof window.jsPDF
    );

    try {
      // Get report data
      const reportData = this.gatherReportData();

      // Create PDF document (using jspdf.jsPDF constructor)
      const pdf = new window.jspdf.jsPDF('portrait', 'mm', 'a4');

      // Generate PDF content
      this.createPDFContent(pdf, reportData);

      // Generate filename and download
      const filename = this.generateReportFilename(
        'pdf',
        reportData.projectInfo
      );
      pdf.save(filename);

      console.log('✅ PDF report exported:', filename);
      alert(`PDF report exported successfully!\nFilename: ${filename}`);
    } catch (error) {
      console.error('❌ Error creating PDF report:', error);
      alert('Error creating PDF report: ' + error.message);
    }
  }

  /**
   * Export custom analytics report as Word document
   * Creates a professional Word document with comprehensive formatting
   * Follows the same pattern as Image Viewer Word export for consistency
   */
  async exportCustomReportAsWord() {
    console.log('📝 Exporting analytics report as Word document...');

    // Check if we have report content to export
    const reportContent = document.getElementById('custom-report-results');
    if (!reportContent || !reportContent.innerHTML.trim()) {
      alert('No report to export. Please generate a report first.');
      return;
    }

    // Enhanced DOCX library availability check (matching Image Viewer pattern)
    console.log('🔍 Checking if DOCX library is ready...');

    // Wait up to 15 seconds for library to be ready
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts × 500ms = 15 seconds

    while (attempts < maxAttempts) {
      if (window.docxReady === true && typeof window.docx !== 'undefined') {
        console.log('✅ DOCX library is ready for analytics export!');
        break;
      }

      if (window.docxReady === false) {
        alert(
          'Word functionality is not available because the DOCX library failed to load.\n\n' +
            'This might be due to:\n' +
            '• Network connectivity issues\n' +
            '• Firewall/proxy blocking CDN access\n' +
            '• Browser extensions blocking scripts\n\n' +
            'Please check your internet connection and try refreshing the page.'
        );
        return;
      }

      console.log(
        `⏳ Waiting for DOCX library... (${attempts + 1}/${maxAttempts})`
      );
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms
      attempts++;
    }

    if (attempts >= maxAttempts) {
      alert(
        'Word functionality timed out waiting for the DOCX library to load.\n\n' +
          'Please refresh the page and try again. If the problem persists, ' +
          'check your internet connection and browser console for errors.'
      );
      return;
    }

    // Final verification (matching Image Viewer pattern)
    const requiredComponents = ['Document', 'Packer', 'Paragraph', 'TextRun'];
    const missingComponents = requiredComponents.filter(
      (comp) => !window.docx[comp]
    );

    if (missingComponents.length > 0) {
      console.error('❌ Missing docx components:', missingComponents);
      console.log('Available components:', Object.keys(window.docx));
      alert(
        `Word functionality is incomplete. Missing components: ${missingComponents.join(
          ', '
        )}`
      );
      return;
    }

    console.log(
      '✅ DOCX library verification complete - proceeding with analytics document generation'
    );

    try {
      // Get report data for document generation
      const reportData = this.gatherReportData();

      // Create Word document using DOCX 9.5.1 API
      const doc = await this.createAnalyticsWordDocument(reportData);

      // Generate filename and download
      const filename = this.generateReportFilename(
        'docx',
        reportData.projectInfo
      );
      await this.downloadWordDocument(doc, filename);

      console.log('✅ Analytics Word document exported:', filename);
      alert(`Word document exported successfully!\nFilename: ${filename}`);
    } catch (error) {
      console.error('❌ Error creating analytics Word document:', error);
      alert('Error creating Word document: ' + error.message);
    }
  }

  /**
   * Create comprehensive analytics Word document
   * Uses the same DOCX 9.5.1 API pattern as Image Viewer for consistency
   * @param {Object} reportData - Analytics report data
   * @returns {Object} - Word document instance
   */
  async createAnalyticsWordDocument(reportData) {
    console.log('📝 Creating analytics Word document...');

    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      AlignmentType,
      HeadingLevel,
      WidthType,
    } = window.docx;

    // Create document with professional metadata
    const doc = new Document({
      title: reportData.reportTitle,
      description: `Generated by BCFSleuth Analytics - ${reportData.totalTopics} topics analyzed`,
      creator: 'BCFSleuth Analytics Dashboard',
      sections: [
        {
          properties: {},
          children: await this.createAnalyticsWordContent(reportData),
        },
      ],
    });

    return doc;
  }

  /**
   * Create Word document content for analytics report
   * Follows professional document structure with enhanced formatting
   * @param {Object} reportData - Report data object
   * @returns {Array} - Array of Word document elements
   */
  async createAnalyticsWordContent(reportData) {
    const {
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      AlignmentType,
      HeadingLevel,
      WidthType,
    } = window.docx;

    const elements = [];

    // Document Title
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: reportData.reportTitle,
            bold: true,
            size: 32,
            color: '2563eb', // Primary blue
          }),
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Subtitle with generation info
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${reportData.timeGenerated}`,
            size: 24,
            color: '475569',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      })
    );

    // Executive Summary Section
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Executive Summary',
            bold: true,
            size: 24,
            color: '2563eb',
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    // Summary statistics table
    const summaryRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Metric', bold: true })],
              }),
            ],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Value', bold: true })],
              }),
            ],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Project(s)' })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: reportData.projectInfo })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Total Topics Analyzed' })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: reportData.totalTopics.toString() }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Analysis Fields' })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: reportData.selectedFields.join(', ') }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Export Date' })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: reportData.timeGenerated })],
              }),
            ],
          }),
        ],
      }),
    ];

    const summaryTable = new Table({
      rows: summaryRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });

    elements.push(summaryTable);

    // Analysis Results Section
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Detailed Analysis Results',
            bold: true,
            size: 20,
            color: '2563eb',
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 300 },
      })
    );

    // Add analysis results content with proper text formatting for Word
    const resultsLines = this.wrapTextForWord(reportData.resultsText, 100);
    resultsLines.forEach((line, index) => {
      if (line.trim()) {
        // Determine if this line is a header (contains dashes or is short and descriptive)
        const isHeader =
          line.includes('---') ||
          (line.length < 50 &&
            index < resultsLines.length - 1 &&
            resultsLines[index + 1].includes('---'));

        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.replace(/---+/g, ''), // Remove dash separators
                bold: isHeader,
                size: isHeader ? 16 : 20,
                color: isHeader ? '2563eb' : '1f2937',
              }),
            ],
            spacing: { after: isHeader ? 200 : 100 },
          })
        );
      } else {
        // Empty line for spacing
        elements.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
            spacing: { after: 100 },
          })
        );
      }
    });

    // Footer section
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Generated by BCFSleuth Analytics Dashboard',
            italics: true,
            size: 18,
            color: '64748b',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 800, after: 200 },
      })
    );

    console.log(`✅ Created Word document with ${elements.length} elements`);
    return elements;
  }

  /**
   * Word-specific text wrapping (simpler than PDF version)
   * @param {string} text - Text to wrap
   * @param {number} maxLength - Maximum characters per line
   * @returns {Array} - Array of wrapped lines
   */
  wrapTextForWord(text, maxLength = 100) {
    if (!text || typeof text !== 'string') {
      return [''];
    }

    const lines = [];
    const paragraphs = text.split('\n');

    paragraphs.forEach((paragraph) => {
      if (paragraph.trim() === '') {
        lines.push(''); // Preserve empty lines
        return;
      }

      // Simple word wrapping for Word documents
      const words = paragraph.split(' ');
      let currentLine = '';

      words.forEach((word) => {
        // Check if adding this word would exceed the limit
        if (currentLine.length + word.length + 1 <= maxLength) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          // Start a new line
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = word;
        }
      });

      // Add the remaining line
      if (currentLine) {
        lines.push(currentLine);
      }
    });

    return lines.length > 0 ? lines : [''];
  }

  /**
   * Download Word document using the same pattern as Image Viewer
   * @param {Object} doc - Word document instance
   * @param {string} filename - Output filename
   */
  async downloadWordDocument(doc, filename) {
    try {
      const { Packer } = window.docx;

      console.log('🔄 Generating Word document blob for browser...');

      // Use toBlob for browser compatibility (same as Image Viewer)
      const blob = await Packer.toBlob(doc);

      console.log('✅ Word document blob generated successfully');

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      console.log('✅ Word document download triggered:', filename);
    } catch (error) {
      console.error('Error downloading Word document:', error);

      // Try fallback method if toBlob fails (same as Image Viewer)
      try {
        console.log('🔄 Trying fallback download method...');
        const { Packer } = window.docx;

        // Alternative: Use base64 output
        const base64String = await Packer.toBase64String(doc);

        // Convert base64 to blob
        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        // Download the blob
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        console.log('✅ Fallback Word document download successful:', filename);
      } catch (fallbackError) {
        console.error(
          '❌ Fallback download method also failed:',
          fallbackError
        );
        throw new Error(`Word document generation failed: ${error.message}`);
      }
    }
  }

  /**
   * Gather all report data for export
   * Centralizes data collection for consistent formatting across formats
   */
  gatherReportData() {
    // Get selected fields
    const selectedFields = [];
    document
      .querySelectorAll('#report-field-grid input:checked')
      .forEach((checkbox) => {
        const label =
          checkbox.nextElementSibling?.textContent || checkbox.value;
        selectedFields.push(label);
      });

    // Get project information
    const projectNames = [
      ...new Set(this.filteredData.map((topic) => topic.projectName)),
    ];
    const projectInfo =
      projectNames.length === 1
        ? projectNames[0]
        : `${projectNames.length} Projects`;

    // Get timestamps
    const timestamp = new Date().toISOString().split('T')[0];
    const timeGenerated = new Date().toLocaleString();

    // Extract report content
    const reportContent = document.getElementById('custom-report-results');
    const resultsText = this.extractReportTextContent(reportContent);

    return {
      selectedFields,
      projectNames,
      projectInfo,
      timestamp,
      timeGenerated,
      resultsText,
      totalTopics: this.filteredData.length,
      reportTitle: `BCF Custom Analytics Report - ${timestamp}`,
    };
  }

  /**
   * Create PDF content with professional formatting
   * @param {jsPDF} pdf - PDF document instance
   * @param {Object} reportData - Report data object
   */
  createPDFContent(pdf, reportData) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = margin;

    // Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(reportData.reportTitle, pageWidth / 2, currentY, {
      align: 'center',
    });
    currentY += 15;

    // Subtitle
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Generated: ${reportData.timeGenerated}`,
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );
    currentY += 20;

    // Project Information Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Report Summary', margin, currentY);
    currentY += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    const summaryLines = [
      `Project(s): ${reportData.projectInfo}`,
      `Total Topics Analyzed: ${reportData.totalTopics}`,
      `Analysis Fields: ${reportData.selectedFields.join(', ')}`,
      `Export Date: ${reportData.timeGenerated}`,
    ];

    summaryLines.forEach((line) => {
      pdf.text(line, margin, currentY);
      currentY += 7;
    });

    currentY += 10;

    // Analysis Results Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Analysis Results', margin, currentY);
    currentY += 10;

    // Add results content with text wrapping
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const maxLineWidth = pageWidth - 2 * margin;
    const resultsLines = this.wrapTextForPDF(
      pdf,
      reportData.resultsText,
      maxLineWidth
    );

    resultsLines.forEach((line) => {
      // Check for page break
      if (currentY > pdf.internal.pageSize.getHeight() - 30) {
        pdf.addPage();
        currentY = margin;
      }

      pdf.text(line, margin, currentY);
      currentY += 5;
    });

    // Footer
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text(
        'Generated by BCFSleuth Analytics Dashboard',
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
  }

  /**
   * Wrap text to fit within PDF page width
   * @param {jsPDF} pdf - PDF document instance
   * @param {string} text - Text to wrap
   * @param {number} maxWidth - Maximum line width
   * @returns {Array} - Array of wrapped lines
   */
  wrapTextForPDF(pdf, text, maxWidth) {
    const lines = text.split('\n');
    const wrappedLines = [];

    lines.forEach((line) => {
      if (!line.trim()) {
        wrappedLines.push('');
        return;
      }

      const words = line.trim().split(' ');
      let currentLine = '';

      words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = pdf.getTextWidth(testLine);

        if (testWidth <= maxWidth || currentLine === '') {
          currentLine = testLine;
        } else {
          if (currentLine) {
            wrappedLines.push(currentLine);
          }
          currentLine = word;
        }
      });

      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    });

    return wrappedLines;
  }

  /**
   * Generate filename for report export
   * @param {string} format - Export format (text, pdf, docx)
   * @param {string} projectInfo - Project information
   * @returns {string} - Generated filename
   */
  generateReportFilename(format, projectInfo) {
    const timestamp = new Date().toISOString().split('T')[0];
    const projectPrefix = projectInfo.includes('Projects')
      ? 'Multi_Project'
      : this.sanitizeFilename(projectInfo);

    const extensions = {
      text: 'txt',
      pdf: 'pdf',
      docx: 'docx',
    };

    return `${projectPrefix}_Custom_Analytics_${timestamp}.${extensions[format]}`;
  }

  /**
   * Extract clean text content from HTML report results
   * Removes HTML tags and formats the content for text export
   * @param {HTMLElement} reportElement - The report results container
   * @returns {string} - Clean text content
   */
  extractReportTextContent(reportElement) {
    if (!reportElement) return '';

    // Clone the element to avoid modifying the original
    const clone = reportElement.cloneNode(true);

    // Replace common HTML elements with text formatting
    const headers = clone.querySelectorAll('h6');
    headers.forEach((header) => {
      const text = header.textContent;
      header.outerHTML = `\n${text}\n${'-'.repeat(text.length)}\n`;
    });

    // Format paragraphs with line breaks
    const paragraphs = clone.querySelectorAll('p');
    paragraphs.forEach((p) => {
      p.outerHTML = p.textContent + '\n';
    });

    // Format lists with bullet points
    const lists = clone.querySelectorAll('ul');
    lists.forEach((list) => {
      const items = list.querySelectorAll('li');
      let listText = '';
      items.forEach((item) => {
        listText += `  • ${item.textContent}\n`;
      });
      list.outerHTML = listText + '\n';
    });

    // Format divs with section breaks
    const sections = clone.querySelectorAll('div');
    sections.forEach((div) => {
      if (div.className.includes('analysis-section')) {
        div.outerHTML = `\n${div.textContent}\n`;
      }
    });

    // Get the final text content and clean it up
    const textContent = clone.textContent || clone.innerText || '';

    // Clean up extra whitespace but preserve intentional line breaks
    return textContent
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
      .trim(); // Remove leading/trailing whitespace
  }

  /**
   * Download text content as a file
   * @param {string} content - Text content to download
   * @param {string} filename - Name for the downloaded file
   */
  downloadTextFile(content, filename) {
    try {
      // Create blob with UTF-8 encoding for proper text handling
      const blob = new Blob([content], {
        type: 'text/plain;charset=utf-8',
      });

      // Create download URL
      const url = URL.createObjectURL(blob);

      // Create and trigger download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading text file:', error);
      throw new Error('Failed to download file: ' + error.message);
    }
  }

  /**
   * Sanitize text for use in filename
   * @param {string} text - Input text to sanitize
   * @returns {string} - Filename-safe text
   */
  sanitizeFilename(text) {
    if (!text) return 'Unknown';

    return text
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid filename characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .substring(0, 50); // Limit length
  }

  sanitizeFilename(text) {
    if (!text) return 'Unknown';

    return text
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid filename characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .substring(0, 50); // Limit length
  }

  /**
   * ====================================================================
   * CHART LIGHTBOX FUNCTIONALITY
   * Provides expandable chart viewing with zoom and navigation
   * Similar to Image Viewer lightbox but optimized for Chart.js charts
   * ====================================================================
   */

  /**
   * Add click handlers to all generated charts for lightbox functionality
   * This enables users to click any chart to view it in full-screen mode
   */
  addChartClickHandlers() {
    console.log(
      '🖱️ Adding click handlers to charts for lightbox functionality...'
    );

    // Define the chart order for navigation
    this.chartOrder = ['status', 'priority', 'timeline', 'author', 'comments'];
    this.currentChartIndex = 0;
    this.currentZoom = 1;
    this.minZoom = 0.5;
    this.maxZoom = 3;
    this.zoomStep = 0.2;

    // Add click event listeners to each chart canvas
    this.chartOrder.forEach((chartKey, index) => {
      const chart = this.charts[chartKey];
      if (chart && chart.canvas) {
        // Add click handler to canvas
        chart.canvas.style.cursor = 'pointer';
        chart.canvas.title = 'Click to expand chart';

        chart.canvas.addEventListener('click', (event) => {
          // Prevent event bubbling
          event.stopPropagation();
          this.openChartLightbox(index);
        });

        console.log(`✅ Added click handler to ${chartKey} chart`);
      }
    });

    // Set up keyboard navigation (similar to Image Viewer)
    this.setupChartKeyboardNavigation();
  }

  /**
   * Set up keyboard navigation for chart lightbox
   * Supports: Esc (close), Arrow keys (navigate), +/- (zoom), F (fit), 0 (reset)
   */
  setupChartKeyboardNavigation() {
    // Only set up once to avoid duplicate listeners
    if (this.chartKeyboardSetup) return;

    document.addEventListener('keydown', (e) => {
      // Only handle keys when chart lightbox is open
      const lightbox = document.getElementById('chart-lightbox');
      if (!lightbox || !lightbox.classList.contains('active')) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          this.closeChartLightbox();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.navigateChartLightbox(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.navigateChartLightbox(1);
          break;
        case '+':
        case '=':
          e.preventDefault();
          this.zoomChart('in');
          break;
        case '-':
          e.preventDefault();
          this.zoomChart('out');
          break;
        case '0':
          e.preventDefault();
          this.resetChartZoom();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          this.fitChartToScreen();
          break;
      }
    });

    this.chartKeyboardSetup = true;
    console.log('⌨️ Chart lightbox keyboard navigation configured');
  }

  /**
   * Open chart lightbox with specific chart
   * @param {number} chartIndex - Index of chart in chartOrder array
   */
  openChartLightbox(chartIndex) {
    console.log('📊 Opening chart lightbox for chart index:', chartIndex);

    // Validate chart index
    if (chartIndex < 0 || chartIndex >= this.chartOrder.length) {
      console.warn('Invalid chart index:', chartIndex);
      return;
    }

    const chartKey = this.chartOrder[chartIndex];
    const sourceChart = this.charts[chartKey];

    if (!sourceChart || !sourceChart.canvas) {
      console.error('Chart not found or has no canvas:', chartKey);
      return;
    }

    // Store current chart info
    this.currentChartIndex = chartIndex;

    // Show lightbox first
    const lightbox = document.getElementById('chart-lightbox');
    if (!lightbox) {
      console.error('Chart lightbox element not found');
      return;
    }

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Wait for lightbox to be fully rendered before measuring and creating chart
    setTimeout(() => {
      this.displayChartInLightbox(chartIndex);
    }, 50); // Small delay to ensure DOM is ready

    console.log('✅ Chart lightbox opened successfully');
  }
  /**
   * Display chart in lightbox with enhanced size and quality
   * @param {number} chartIndex - Index of chart to display
   */
  displayChartInLightbox(chartIndex) {
    const chartKey = this.chartOrder[chartIndex];
    const sourceChart = this.charts[chartKey];

    if (!sourceChart) {
      console.error('Chart not found for lightbox:', chartKey);
      return;
    }

    // Update lightbox header information
    const chartTitle = this.getChartTitle(chartKey);
    document.getElementById('chart-lightbox-title').textContent = chartTitle;

    // Update metadata
    const dataCount = this.getChartDataCount(chartKey);
    const chartType = this.getChartTypeDescription(chartKey);
    const filtersInfo = this.getAppliedFiltersDescription();

    document.getElementById('chart-lightbox-type').textContent = chartType;
    document.getElementById(
      'chart-lightbox-data-count'
    ).textContent = `${dataCount} items`;
    document.getElementById('chart-lightbox-filters').textContent = filtersInfo;

    // Update counter
    document.getElementById('chart-lightbox-counter').textContent = `${
      chartIndex + 1
    } of ${this.chartOrder.length} charts`;

    // Create enlarged chart in lightbox canvas
    this.renderChartInLightbox(chartKey, sourceChart);

    // Update navigation button states
    this.updateChartNavigationButtons();

    // Reset zoom
    this.resetChartZoom();

    console.log('📈 Displayed chart in lightbox:', chartTitle);
  }

  /**
   * Render chart in lightbox canvas - landscape optimized sizing
   * @param {string} chartKey - Chart type key
   * @param {Chart} sourceChart - Original Chart.js instance
   */
  renderChartInLightbox(chartKey, sourceChart) {
    const lightboxCanvas = document.getElementById('lightbox-chart-canvas');
    if (!lightboxCanvas) {
      console.error('Lightbox canvas not found');
      return;
    }

    // Destroy existing lightbox chart if it exists
    if (this.lightboxChart) {
      this.lightboxChart.destroy();
    }

    // Get the actual container size
    const container = lightboxCanvas.parentElement;
    const containerRect = container.getBoundingClientRect();

    console.log(
      'Container dimensions:',
      containerRect.width,
      'x',
      containerRect.height
    );

    if (containerRect.width === 0 || containerRect.height === 0) {
      console.warn('Container not ready, retrying...');
      setTimeout(() => this.renderChartInLightbox(chartKey, sourceChart), 100);
      return;
    }

    // Calculate target size with landscape preference
    const availableWidth = containerRect.width * 0.85;
    const availableHeight = containerRect.height * 0.75;

    // Prefer landscape orientation for charts (wider than tall)
    let targetWidth, targetHeight;

    if (availableWidth / availableHeight > 1.3) {
      // Container is wide - use landscape
      targetWidth = Math.floor(availableWidth);
      targetHeight = Math.floor(availableWidth / 1.4); // 1.4:1 aspect ratio

      // Ensure height fits
      if (targetHeight > availableHeight) {
        targetHeight = Math.floor(availableHeight);
        targetWidth = Math.floor(targetHeight * 1.4);
      }
    } else {
      // Container is more square - adjust accordingly
      targetHeight = Math.floor(availableHeight);
      targetWidth = Math.floor(targetHeight * 1.2); // Slightly wider than tall

      // Ensure width fits
      if (targetWidth > availableWidth) {
        targetWidth = Math.floor(availableWidth);
        targetHeight = Math.floor(targetWidth / 1.2);
      }
    }

    // Ensure minimum size
    targetWidth = Math.max(600, targetWidth);
    targetHeight = Math.max(400, targetHeight);

    console.log('Target chart size:', targetWidth, 'x', targetHeight);

    // Set canvas size
    lightboxCanvas.width = targetWidth;
    lightboxCanvas.height = targetHeight;
    lightboxCanvas.style.width = targetWidth + 'px';
    lightboxCanvas.style.height = targetHeight + 'px';
    lightboxCanvas.style.display = 'block';
    lightboxCanvas.style.margin = '0 auto';

    // Get source chart configuration
    const sourceConfig = sourceChart.config;

    // Create configuration optimized for lightbox
    const lightboxConfig = {
      type: sourceConfig.type,
      data: JSON.parse(JSON.stringify(sourceConfig.data)),
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false, // Disable animation for faster rendering
        layout: {
          padding: 30,
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { size: 16 },
              padding: 25,
              usePointStyle: true,
            },
          },
          tooltip: {
            titleFont: { size: 16 },
            bodyFont: { size: 14 },
            padding: 12,
          },
        },
      },
    };

    // Add scales for charts that support them
    if (['bar', 'line'].includes(sourceConfig.type)) {
      lightboxConfig.options.scales = {
        y: {
          beginAtZero: true,
          ticks: {
            font: { size: 14 },
            maxTicksLimit: 8,
          },
        },
        x: {
          ticks: {
            font: { size: 14 },
            maxTicksLimit: 10,
          },
        },
      };
    }

    // Create chart
    const ctx = lightboxCanvas.getContext('2d');
    this.lightboxChart = new Chart(ctx, lightboxConfig);

    console.log(
      '🎨 Chart rendered - landscape optimized:',
      targetWidth,
      'x',
      targetHeight
    );
  }

  /**
   * Navigate between charts in lightbox
   * @param {number} direction - -1 for previous, 1 for next
   */
  navigateChartLightbox(direction) {
    if (!this.chartOrder || this.chartOrder.length === 0) {
      return;
    }

    const newIndex = this.currentChartIndex + direction;

    // Handle wrapping (cycle through charts)
    let targetIndex;
    if (newIndex < 0) {
      targetIndex = this.chartOrder.length - 1; // Go to last chart
    } else if (newIndex >= this.chartOrder.length) {
      targetIndex = 0; // Go to first chart
    } else {
      targetIndex = newIndex;
    }

    this.currentChartIndex = targetIndex;
    this.displayChartInLightbox(targetIndex);

    console.log(
      `🔄 Navigated to chart ${targetIndex + 1} of ${this.chartOrder.length}: ${
        this.chartOrder[targetIndex]
      }`
    );
  }

  /**
   * Update navigation button states based on current chart
   */
  updateChartNavigationButtons() {
    const prevBtn = document.querySelector('#chart-lightbox .lightbox-prev');
    const nextBtn = document.querySelector('#chart-lightbox .lightbox-next');

    if (!prevBtn || !nextBtn) return;

    // Always enable navigation buttons for cycling
    prevBtn.style.opacity = '1';
    nextBtn.style.opacity = '1';
    prevBtn.disabled = false;
    nextBtn.disabled = false;

    // Hide navigation if only one chart
    if (this.chartOrder.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }
  }

  /**
   * Close the chart lightbox
   */
  closeChartLightbox() {
    console.log('🚪 Closing chart lightbox');

    const lightbox = document.getElementById('chart-lightbox');
    if (lightbox) {
      lightbox.classList.remove('active');
    }

    // Restore background scrolling
    document.body.style.overflow = '';

    // Destroy lightbox chart to free memory
    if (this.lightboxChart) {
      this.lightboxChart.destroy();
      this.lightboxChart = null;
    }

    // Reset zoom
    this.resetChartZoom();

    console.log('✅ Chart lightbox closed');
  }

  /**
   * Zoom chart in lightbox
   * @param {string} direction - 'in' or 'out'
   */
  zoomChart(direction) {
    const lightboxCanvas = document.getElementById('lightbox-chart-canvas');
    if (!lightboxCanvas) return;

    if (direction === 'in') {
      this.currentZoom = Math.min(
        this.maxZoom,
        this.currentZoom + this.zoomStep
      );
    } else if (direction === 'out') {
      this.currentZoom = Math.max(
        this.minZoom,
        this.currentZoom - this.zoomStep
      );
    }

    // Apply zoom with proper centering
    lightboxCanvas.style.transform = `scale(${this.currentZoom})`;
    lightboxCanvas.style.transformOrigin = 'center center';
    lightboxCanvas.style.cursor = this.currentZoom > 1 ? 'grab' : 'default';

    console.log(`🔍 Chart zoom level: ${Math.round(this.currentZoom * 100)}%`);
  }

  /**
   * Reset chart zoom to 100%
   */
  resetChartZoom() {
    const lightboxCanvas = document.getElementById('lightbox-chart-canvas');
    if (!lightboxCanvas) return;

    this.currentZoom = 1;
    lightboxCanvas.style.transform = 'scale(1)';
    lightboxCanvas.style.transformOrigin = 'center center';
    lightboxCanvas.style.cursor = 'default';

    console.log('🎯 Chart zoom reset to 100%');
  }

  /**
   * Fit chart to screen
   */
  fitChartToScreen() {
    const lightboxCanvas = document.getElementById('lightbox-chart-canvas');
    const container = document.querySelector(
      '#chart-lightbox .lightbox-image-container'
    );
    if (!lightboxCanvas || !container) return;

    // Calculate zoom to fit
    const containerRect = container.getBoundingClientRect();
    const canvasRect = lightboxCanvas.getBoundingClientRect();

    const scaleX = (containerRect.width * 0.9) / canvasRect.width;
    const scaleY = (containerRect.height * 0.9) / canvasRect.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom beyond 100%

    this.currentZoom = scale;
    lightboxCanvas.style.transform = `scale(${scale})`;
    lightboxCanvas.style.cursor = scale > 1 ? 'grab' : 'default';

    console.log(`📐 Chart fit to screen: ${Math.round(scale * 100)}%`);
  }

  /**
   * Export the currently displayed chart as PNG
   */
  exportCurrentChart() {
    if (!this.lightboxChart) {
      console.warn('No chart to export');
      return;
    }

    try {
      const chartKey = this.chartOrder[this.currentChartIndex];
      const chartTitle = this.getChartTitle(chartKey);

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const projectName = this.getCommonProjectName();
      const filename = `${projectName}_${chartTitle.replace(
        /\s+/g,
        '_'
      )}_${timestamp}.png`;

      // Get chart image data
      const imageData = this.lightboxChart.canvas.toDataURL('image/png');

      // Create download link
      const link = document.createElement('a');
      link.download = filename;
      link.href = imageData;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ Chart exported:', filename);

      // Show feedback
      this.showExportFeedback(`Chart exported: ${filename}`);
    } catch (error) {
      console.error('Error exporting chart:', error);
      alert('Error exporting chart: ' + error.message);
    }
  }

  /**
   * Show detailed information about current chart
   */
  showChartDetails() {
    if (this.currentChartIndex < 0 || !this.chartOrder) {
      return;
    }

    const chartKey = this.chartOrder[this.currentChartIndex];
    const chartTitle = this.getChartTitle(chartKey);
    const dataCount = this.getChartDataCount(chartKey);
    const chartType = this.getChartTypeDescription(chartKey);

    const info = [
      `Chart: ${chartTitle}`,
      `Type: ${chartType}`,
      `Data Points: ${dataCount}`,
      `Project Filter: ${this.filters.project || 'All Projects'}`,
      `Date Range: ${this.getDateRangeDescription()}`,
      `Total Topics Analyzed: ${this.filteredData.length}`,
      `Generated: ${new Date().toLocaleString()}`,
    ].join('\n');

    alert(info);
  }

  /**
   * Helper method to get chart data count
   * @param {string} chartKey - Chart type key
   * @returns {number} - Number of data points in chart
   */
  getChartDataCount(chartKey) {
    const chart = this.charts[chartKey];
    if (!chart || !chart.data || !chart.data.datasets) {
      return 0;
    }

    return chart.data.datasets.reduce((total, dataset) => {
      return total + (dataset.data ? dataset.data.length : 0);
    }, 0);
  }

  /**
   * Helper method to get chart type description
   * @param {string} chartKey - Chart type key
   * @returns {string} - User-friendly chart type description
   */
  getChartTypeDescription(chartKey) {
    const chartTypeMap = {
      status: 'Doughnut Chart',
      priority: 'Bar Chart',
      timeline: 'Line Chart',
      author: 'Horizontal Bar Chart',
      comments: 'Pie Chart',
    };

    return chartTypeMap[chartKey] || 'Chart';
  }

  /**
   * Helper method to get applied filters description
   * @returns {string} - Description of currently applied filters
   */
  getAppliedFiltersDescription() {
    const filterParts = [];

    if (this.filters.project) {
      filterParts.push(`Project: ${this.filters.project}`);
    }

    if (this.filters.dateRange && this.filters.dateRange !== 'all') {
      filterParts.push(`Date: ${this.getDateRangeDescription()}`);
    }

    return filterParts.length > 0 ? filterParts.join(', ') : 'No filters';
  }

  /**
   * Helper method to get date range description
   * @returns {string} - User-friendly date range description
   */
  getDateRangeDescription() {
    const dateRangeMap = {
      all: 'All Time',
      30: 'Last 30 Days',
      90: 'Last 90 Days',
      365: 'This Year',
    };

    return dateRangeMap[this.filters.dateRange] || 'Custom Range';
  }

  /**
   * Helper method to get common project name for exports
   * @returns {string} - Project name or 'Mixed_Projects'
   */
  getCommonProjectName() {
    if (!this.filteredData || this.filteredData.length === 0) {
      return 'BCF_Analytics';
    }

    const projectNames = [
      ...new Set(this.filteredData.map((topic) => topic.projectName)),
    ];

    if (projectNames.length === 1) {
      return this.sanitizeFilename(projectNames[0]);
    } else {
      return 'Mixed_Projects';
    }
  }

  /**
   * Show export feedback message
   * @param {string} message - Feedback message
   */
  showExportFeedback(message) {
    // Remove existing feedback
    const existing = document.getElementById('chart-export-feedback');
    if (existing) {
      existing.remove();
    }

    const feedbackHTML = `
      <div id="chart-export-feedback" class="download-feedback">
        ${message}
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', feedbackHTML);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      const feedback = document.getElementById('chart-export-feedback');
      if (feedback) {
        feedback.style.opacity = '0';
        setTimeout(() => feedback.remove(), 300);
      }
    }, 3000);
  }
}
