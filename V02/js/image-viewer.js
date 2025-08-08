// BCFSleuth Image Viewer - Version 2.0
class ImageViewer {
  constructor(bcfApp) {
    this.app = bcfApp; // Reference to main BCFSleuthApp
    this.allImages = []; // Flattened array of all images with topic data
    this.filteredImages = [];
    this.currentPage = 1;
    this.pageSize = 12; // Images per page
    this.filters = {
      project: '',
      title: '',
      status: '',
      priority: '',
      author: '',
      created: '',
      search: '',
    };
    this.sortBy = 'date'; // date, title, status, author
    this.isInitialized = false;

    // Lightbox state
    this.currentLightboxIndex = 0;
    this.lightboxImages = [];
  }

  /**
   * Initialize the Image Viewer with event listeners
   */
  initialize() {
    if (this.isInitialized) return;

    this.setupEventListeners();
    this.createLightbox();
    this.isInitialized = true;
    console.log('📸 Image Viewer initialized');
  }

  /**
   * Set up event listeners for controls and interactions
   */
  setupEventListeners() {
    // Filter controls - Enhanced with all filter types
    const filterControls = {
      'image-project-filter': 'project',
      'image-title-filter': 'title',
      'image-status-filter': 'status',
      'image-priority-filter': 'priority',
      'image-author-filter': 'author',
      'image-created-filter': 'created',
    };

    // Set up all dropdown filters
    Object.entries(filterControls).forEach(([elementId, filterKey]) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.addEventListener('change', (e) => {
          this.filters[filterKey] = e.target.value;
          this.applyFilters();
        });
      }
    });

    // Search input with debounce
    const searchInput = document.getElementById('image-search');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.applyFilters();
        }, 300);
      });
    }

    // Sort dropdown
    const sortSelect = document.getElementById('image-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.sortImages();
      });
    }

    // Pagination controls
    const firstPage = document.getElementById('images-first-page');
    const prevPage = document.getElementById('images-prev-page');
    const nextPage = document.getElementById('images-next-page');
    const lastPage = document.getElementById('images-last-page');

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

  /**
   * Update Image Viewer with parsed BCF data
   * Now includes lazy image extraction
   */
  async updateData(parsedData) {
    console.log('🔄 Updating Image Viewer with BCF data...');

    // Show loading state
    this.showLoadingState();

    try {
      // Perform lazy image extraction for all topics
      await this.performLazyImageExtraction(parsedData);

      // Extract images from BCF data
      this.allImages = this.extractImagesFromBCFData(parsedData);
      this.populateFilterOptions();
      this.updateStats();
      this.applyFilters();

      console.log(
        `📊 Image Viewer updated: ${this.allImages.length} total images found`
      );
    } catch (error) {
      console.error('Error during image extraction:', error);
      this.showErrorState(error.message);
    } finally {
      this.hideLoadingState();
    }
  }

  /**
   * Perform lazy image extraction for all topics
   */
  async performLazyImageExtraction(parsedData) {
    // Debug: Check if BCFParser methods are available
    console.log('🔍 Checking BCFParser availability:');
    console.log('- typeof BCFParser:', typeof BCFParser);
    console.log('- window.BCFParser:', !!window.BCFParser);
    console.log(
      '- BCFParser.extractImagesForTopics:',
      !!(typeof BCFParser !== 'undefined' && BCFParser.extractImagesForTopics)
    );
    console.log(
      '- BCFParser.extractViewpointImages:',
      !!(typeof BCFParser !== 'undefined' && BCFParser.extractViewpointImages)
    );

    const allTopics = [];

    // Collect all topics from all BCF files
    parsedData.forEach((bcfData) => {
      if (bcfData.topics) {
        allTopics.push(...bcfData.topics);
      }
    });

    // Filter topics that haven't had images extracted yet
    const topicsNeedingExtraction = allTopics.filter(
      (topic) => !topic._imagesExtracted
    );

    if (topicsNeedingExtraction.length > 0) {
      console.log(
        `🖼️ Extracting images for ${topicsNeedingExtraction.length} topics...`
      );

      // Use the BCFParser's lazy extraction method with proper class access
      try {
        if (
          typeof BCFParser !== 'undefined' &&
          BCFParser.extractImagesForTopics
        ) {
          console.log('🖼️ Using BCFParser.extractImagesForTopics method');
          await BCFParser.extractImagesForTopics(topicsNeedingExtraction);
        } else if (
          window.BCFParser &&
          window.BCFParser.extractImagesForTopics
        ) {
          console.log(
            '🖼️ Using window.BCFParser.extractImagesForTopics method'
          );
          await window.BCFParser.extractImagesForTopics(
            topicsNeedingExtraction
          );
        } else {
          // The method exists but may be a static method - try direct access
          console.log('🖼️ Attempting direct BCFParser method access...');

          // Try to call the static method directly
          if (typeof BCFParser !== 'undefined') {
            // Call the individual extraction method that we know exists
            for (const topic of topicsNeedingExtraction) {
              if (
                !topic._imagesExtracted &&
                topic._zipReference &&
                topic._topicGuid
              ) {
                try {
                  await BCFParser.extractViewpointImages(
                    topic._zipReference,
                    topic._topicGuid,
                    topic
                  );
                  topic._imagesExtracted = true;
                } catch (error) {
                  console.warn(
                    `Error extracting images for topic ${topic.title}:`,
                    error
                  );
                }
              }
            }
            console.log(
              '✅ Individual image extraction completed successfully'
            );
          } else {
            throw new Error('BCFParser not available');
          }
        }
      } catch (error) {
        console.warn('Error in lazy image extraction, using fallback:', error);
        await this.fallbackImageExtraction(topicsNeedingExtraction);
      }
    } else {
      console.log('✅ All topics already have images extracted');
    }
  }

  /**
   * Fallback image extraction method if BCFParser method isn't available
   */
  async fallbackImageExtraction(topics) {
    let totalImagesExtracted = 0;

    for (const topic of topics) {
      if (!topic._imagesExtracted && topic._zipReference && topic._topicGuid) {
        try {
          // Call the image extraction method directly if available
          if (
            typeof BCFParser !== 'undefined' &&
            BCFParser.extractViewpointImages
          ) {
            await BCFParser.extractViewpointImages(
              topic._zipReference,
              topic._topicGuid,
              topic
            );
            topic._imagesExtracted = true;
            totalImagesExtracted += topic.imageCount || 0;
          }
        } catch (error) {
          console.warn(
            `Error extracting images for topic ${topic.title}:`,
            error
          );
        }
      }
    }

    console.log(
      `✅ Fallback extraction complete: ${totalImagesExtracted} images extracted`
    );
  }

  /**
   * Show loading state while extracting images
   */
  showLoadingState() {
    const container = document.getElementById('image-cards-container');
    const noImagesMessage = document.getElementById('no-images-message');

    if (noImagesMessage) noImagesMessage.style.display = 'none';

    if (container) {
      container.style.display = 'grid';
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto;"></div>
          <h3>Extracting Images...</h3>
          <p>Please wait while we extract images from your BCF files.</p>
          <p><em>This only happens once per session.</em></p>
        </div>
      `;
    }
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    // Loading state will be replaced by actual images or no images message
  }

  /**
   * Show error state if image extraction fails
   */
  showErrorState(errorMessage) {
    const container = document.getElementById('image-cards-container');
    const noImagesMessage = document.getElementById('no-images-message');

    if (noImagesMessage) noImagesMessage.style.display = 'none';

    if (container) {
      container.style.display = 'grid';
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--danger);">
          <h3>⚠️ Image Extraction Error</h3>
          <p>There was an error extracting images from your BCF files:</p>
          <p><code>${errorMessage}</code></p>
          <p><em>You can still use the other features of BCFSleuth.</em></p>
        </div>
      `;
    }
  }

  /**
   * Extract and flatten all images from BCF data
   */
  extractImagesFromBCFData(parsedData) {
    const images = [];

    parsedData.forEach((bcfFile) => {
      bcfFile.topics.forEach((topic) => {
        if (topic.viewpoints && topic.viewpoints.length > 0) {
          topic.viewpoints.forEach((viewpoint, index) => {
            if (viewpoint.hasImage && viewpoint.imageData) {
              images.push({
                // Image-specific data
                imageData: viewpoint.imageData,
                imageType: viewpoint.imageType,
                viewpointGuid: viewpoint.guid,
                snapshotName: viewpoint.snapshot,
                viewpointIndex: index + 1,

                // Topic data for display
                topicGuid: topic.guid,
                title: topic.title || 'Untitled Topic',
                description: topic.description || '',
                status: topic.topicStatus || 'Unknown',
                priority: topic.priority || 'Normal',
                author: topic.creationAuthor || 'Unknown',
                creationDate: topic.creationDate || '',
                assignedTo: topic.assignedTo || '',

                // Project data
                projectName: bcfFile.project.name || 'Unknown Project',
                sourceFile: bcfFile.filename || 'Unknown File',
                bcfVersion: bcfFile.version || 'Unknown',

                // Computed fields
                isOverdue: this.isOverdue(topic.dueDate),
                hasComments: topic.comments && topic.comments.length > 0,
                commentsCount: topic.comments ? topic.comments.length : 0,
              });
            }
          });
        }
      });
    });

    return images;
  }

  /**
   * Populate filter dropdown options based on actual data
   */
  populateFilterOptions() {
    // Collect all unique values for each filter type
    const filterData = {
      projects: new Set(),
      titles: new Set(),
      statuses: new Set(),
      priorities: new Set(),
      authors: new Set(),
      createdDates: new Set(),
    };

    this.allImages.forEach((image) => {
      filterData.projects.add(image.projectName);
      filterData.titles.add(image.title);
      filterData.statuses.add(image.status);
      filterData.priorities.add(image.priority);
      filterData.authors.add(image.author);

      // Extract creation date for filtering (month/year format)
      if (image.creationDate) {
        const date = new Date(image.creationDate);
        const monthYear = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
        });
        filterData.createdDates.add(monthYear);
      }
    });

    // Update project filter
    this.updateSelectOptions(
      'image-project-filter',
      Array.from(filterData.projects).sort()
    );

    // Update title filter (limit to reasonable number, sorted alphabetically)
    const sortedTitles = Array.from(filterData.titles)
      .filter((title) => title && title.trim())
      .sort()
      .slice(0, 50); // Limit to first 50 titles to prevent overwhelming dropdown
    this.updateSelectOptions('image-title-filter', sortedTitles);

    // Update status filter with logical order
    const statusOrder = [
      'Open',
      'In Progress',
      'Under Review',
      'Closed',
      'Rejected',
    ];
    const sortedStatuses = Array.from(filterData.statuses).sort((a, b) => {
      const aIndex = statusOrder.indexOf(a);
      const bIndex = statusOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    this.updateSelectOptions('image-status-filter', sortedStatuses);

    // Update priority filter with logical order
    const priorityOrder = ['Low', 'Normal', 'Medium', 'High', 'Critical'];
    const sortedPriorities = Array.from(filterData.priorities)
      .filter((priority) => priority && priority.trim())
      .sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a);
        const bIndex = priorityOrder.indexOf(b);
        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    this.updateSelectOptions('image-priority-filter', sortedPriorities);

    // Update author filter
    this.updateSelectOptions(
      'image-author-filter',
      Array.from(filterData.authors)
        .filter((author) => author && author.trim())
        .sort()
    );

    // Update created date filter
    const sortedDates = Array.from(filterData.createdDates)
      .sort((a, b) => {
        return new Date(a) - new Date(b);
      })
      .reverse(); // Most recent first
    this.updateSelectOptions('image-created-filter', sortedDates, true); // true = append to existing options
  }
  /**
   * Update select dropdown options
   */
  updateSelectOptions(selectId, options, appendToExisting = false) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const currentValue = select.value;

    if (!appendToExisting) {
      // Clear and rebuild (default behavior)
      const firstOption = select.querySelector('option');
      select.innerHTML = '';
      select.appendChild(firstOption); // Re-add "All" option
    }

    // Add new options
    options.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      select.appendChild(optionElement);
    });

    // Restore selection if it still exists
    if (currentValue && (options.includes(currentValue) || !appendToExisting)) {
      select.value = currentValue;
    }
  }

  /**
   * Update statistics display
   */
  updateStats() {
    const totalImages = this.allImages.length;
    const topicsWithImages = new Set(this.allImages.map((img) => img.topicGuid))
      .size;
    const uniqueProjects = new Set(this.allImages.map((img) => img.projectName))
      .size;

    // Update stat display elements
    document.getElementById('total-images').textContent = totalImages;
    document.getElementById('total-topics-with-images').textContent =
      topicsWithImages;
    document.getElementById('unique-projects-images').textContent =
      uniqueProjects;
  }

  /**
   * Apply current filters to image list
   */
  applyFilters() {
    this.filteredImages = this.allImages.filter((image) => {
      // Project filter
      if (this.filters.project && image.projectName !== this.filters.project) {
        return false;
      }

      // Title filter
      if (this.filters.title && image.title !== this.filters.title) {
        return false;
      }

      // Status filter
      if (this.filters.status && image.status !== this.filters.status) {
        return false;
      }

      // Priority filter
      if (this.filters.priority && image.priority !== this.filters.priority) {
        return false;
      }

      // Author filter
      if (this.filters.author && image.author !== this.filters.author) {
        return false;
      }

      // Created date filter
      if (
        this.filters.created &&
        !this.matchesDateFilter(image, this.filters.created)
      ) {
        return false;
      }

      // Search filter (search across title, description, author)
      if (this.filters.search) {
        const searchTerm = this.filters.search.toLowerCase();
        const searchableText = [
          image.title,
          image.description,
          image.author,
          image.projectName,
        ]
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });

    this.currentPage = 1; // Reset to first page when filters change
    this.sortImages();
    this.renderImages();
    this.updatePaginationInfo();
  }

  /**
   * Check if image matches the selected date filter
   * @param {Object} image - Image data object
   * @param {string} filterValue - Selected filter value
   * @returns {boolean} - True if image matches filter
   */
  matchesDateFilter(image, filterValue) {
    if (!image.creationDate) return false;

    const imageDate = new Date(image.creationDate);
    const today = new Date();

    switch (filterValue) {
      case 'today':
        return imageDate.toDateString() === today.toDateString();

      case 'this-week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        return imageDate >= weekStart && imageDate <= today;

      case 'this-month':
        return (
          imageDate.getMonth() === today.getMonth() &&
          imageDate.getFullYear() === today.getFullYear()
        );

      case 'last-30-days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return imageDate >= thirtyDaysAgo && imageDate <= today;

      default:
        // Check if it's a month/year format (e.g., "January 2024")
        if (filterValue.includes(' ')) {
          const imageMonthYear = imageDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
          });
          return imageMonthYear === filterValue;
        }
        return false;
    }
  }

  /**
   * Sort images based on current sort criteria
   */
  sortImages() {
    this.filteredImages.sort((a, b) => {
      let aVal, bVal;

      switch (this.sortBy) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'status':
          aVal = a.status.toLowerCase();
          bVal = b.status.toLowerCase();
          break;
        case 'author':
          aVal = a.author.toLowerCase();
          bVal = b.author.toLowerCase();
          break;
        case 'date':
        default:
          aVal = new Date(a.creationDate || '1970-01-01');
          bVal = new Date(b.creationDate || '1970-01-01');
          break;
      }

      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });
  }

  /**
   * Render images as cards
   */
  renderImages() {
    const container = document.getElementById('image-cards-container');
    const noImagesMessage = document.getElementById('no-images-message');
    const pagination = document.getElementById('image-pagination');

    if (!container) return;

    if (this.filteredImages.length === 0) {
      // Show no images message
      noImagesMessage.style.display = 'block';
      container.style.display = 'none';
      pagination.style.display = 'none';
      return;
    }

    // Hide no images message and show grid
    noImagesMessage.style.display = 'none';
    container.style.display = 'grid';
    pagination.style.display = 'flex';

    // Show bulk actions if images are available
    this.updateBulkActions();

    // Get current page images
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(
      startIndex + this.pageSize,
      this.filteredImages.length
    );
    const pageImages = this.filteredImages.slice(startIndex, endIndex);

    // Render image cards
    container.innerHTML = pageImages
      .map((image, index) => this.createImageCard(image, startIndex + index))
      .join('');

    this.updatePaginationInfo();
    this.renderPaginationControls();
  }

  /**
   * Update bulk download actions visibility and count
   */
  updateBulkActions() {
    const bulkActions = document.getElementById('image-bulk-actions');
    const bulkCount = document.getElementById('bulk-download-count');

    if (!bulkActions || !bulkCount) return;

    if (this.filteredImages.length > 0) {
      bulkActions.style.display = 'block';
      bulkCount.textContent = `${this.filteredImages.length} images available`;
    } else {
      bulkActions.style.display = 'none';
    }
  }

  /**
   * Create HTML for a single image card
   */
  createImageCard(image, globalIndex) {
    const imageUrl = `data:${image.imageType};base64,${image.imageData}`;
    const statusClass = image.status.toLowerCase().replace(/\s+/g, '-');
    const formattedDate = this.formatDate(image.creationDate);

    return `
      <div class="image-card" data-image-index="${globalIndex}">
        <!-- Card Header -->
        <div class="card-header">
          <div class="card-title" title="${this.escapeHtml(image.title)}">
            ${this.escapeHtml(image.title)}
          </div>
          <div class="card-meta">
            <span class="card-status status-${statusClass}">${
      image.status
    }</span>
            <span class="card-author">${this.escapeHtml(image.author)}</span>
            <span class="card-date">${formattedDate}</span>
          </div>
        </div>

        <!-- Card Image -->
        <div class="card-image-section" onclick="window.bcfApp.imageViewer.openLightbox(${globalIndex})">
          <img 
            src="${imageUrl}" 
            alt="BCF Viewpoint: ${this.escapeHtml(image.title)}"
            class="card-image"
            loading="lazy"
          />
          <div class="image-count-badge">
            View ${image.viewpointIndex}
          </div>
        </div>

        <!-- Card Footer -->
        <div class="card-footer">
          <div class="card-description" title="${this.escapeHtml(
            image.description
          )}">
            ${this.escapeHtml(image.description || 'No description available')}
          </div>
          <div class="card-actions">
            <button class="card-button primary" onclick="window.bcfApp.imageViewer.openLightbox(${globalIndex})">
              🔍 View Full Size
            </button>
            <button class="card-button" onclick="window.bcfApp.imageViewer.downloadImage(${globalIndex})">
              💾 Download
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Utility methods and lightbox functionality will be added in the next step

  formatDate(dateString) {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid Date';
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

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text.toString();
    return div.innerHTML;
  }

  /**
   * Truncate text to specified length with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} - Truncated text
   */
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

  getTotalPages() {
    return Math.ceil(this.filteredImages.length / this.pageSize);
  }

  goToPage(page) {
    const totalPages = this.getTotalPages();
    this.currentPage = Math.max(1, Math.min(page, totalPages));
    this.renderImages();
  }

  updatePaginationInfo() {
    const startIndex =
      this.filteredImages.length > 0
        ? (this.currentPage - 1) * this.pageSize + 1
        : 0;
    const endIndex = Math.min(
      this.currentPage * this.pageSize,
      this.filteredImages.length
    );

    document.getElementById('images-showing-start').textContent = startIndex;
    document.getElementById('images-showing-end').textContent = endIndex;
    document.getElementById('images-total-filtered').textContent =
      this.filteredImages.length;
  }

  renderPaginationControls() {
    // Simplified pagination for now - full implementation in next step
    const totalPages = this.getTotalPages();
    const pageNumbers = document.getElementById('images-page-numbers');

    if (pageNumbers) {
      pageNumbers.innerHTML = `Page ${this.currentPage} of ${totalPages}`;
    }
  }

  /**
   * Create and setup the lightbox modal for full-size image viewing
   * Includes zoom functionality and keyboard navigation
   */
  createLightbox() {
    // Check if lightbox already exists
    if (document.getElementById('bcf-image-lightbox')) {
      console.log('Lightbox already exists');
      return;
    }

    console.log('🖼️ Creating image lightbox modal...');

    // Create lightbox HTML structure
    const lightboxHTML = `
      <div id="bcf-image-lightbox" class="image-lightbox">
        <div class="lightbox-overlay" onclick="window.bcfApp.imageViewer.closeLightbox()"></div>
        <div class="lightbox-content">
          <!-- Lightbox Header -->
          <div class="lightbox-header">
            <div class="lightbox-info">
              <h3 class="lightbox-title" id="lightbox-title">Image Title</h3>
              <div class="lightbox-meta" id="lightbox-meta">
                <span class="lightbox-status" id="lightbox-status">Status</span>
                <span class="lightbox-author" id="lightbox-author">Author</span>
                <span class="lightbox-date" id="lightbox-date">Date</span>
              </div>
            </div>
            <button class="lightbox-close" onclick="window.bcfApp.imageViewer.closeLightbox()" title="Close (Esc)">
              ✕
            </button>
          </div>

          <!-- Image Container -->
          <div class="lightbox-image-container">
            <img id="lightbox-image" class="lightbox-image" alt="BCF Image" />
            
            <!-- Navigation Arrows -->
            <button class="lightbox-nav lightbox-prev" onclick="window.bcfApp.imageViewer.navigateLightbox(-1)" title="Previous (←)">
              ‹
            </button>
            <button class="lightbox-nav lightbox-next" onclick="window.bcfApp.imageViewer.navigateLightbox(1)" title="Next (→)">
              ›
            </button>

            <!-- Zoom Controls -->
            <div class="lightbox-zoom-controls">
              <button onclick="window.bcfApp.imageViewer.zoomImage('in')" title="Zoom In (+)">🔍+</button>
              <button onclick="window.bcfApp.imageViewer.zoomImage('out')" title="Zoom Out (-)">🔍-</button>
              <button onclick="window.bcfApp.imageViewer.resetZoom()" title="Reset Zoom (0)">⌂</button>
              <button onclick="window.bcfApp.imageViewer.fitToScreen()" title="Fit to Screen (F)">⊞</button>
            </div>
          </div>

          <!-- Image Actions -->
          <div class="lightbox-actions">
            <button class="lightbox-action-btn" onclick="window.bcfApp.imageViewer.downloadCurrentImage()" title="Download Image">
              💾 Download
            </button>
            <button class="lightbox-action-btn" onclick="window.bcfApp.imageViewer.showImageInfo()" title="Show Image Details">
              ℹ️ Details
            </button>
            <div class="lightbox-counter" id="lightbox-counter">
              1 of 1
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert lightbox into DOM
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);

    // Setup keyboard navigation
    this.setupLightboxKeyboard();

    // Initialize zoom properties
    this.currentZoom = 1;
    this.minZoom = 0.1;
    this.maxZoom = 5;
    this.zoomStep = 0.2;

    console.log('✅ Lightbox created successfully');
  }

  /**
   * Setup keyboard navigation and mouse wheel zoom for the lightbox
   * Supports: Esc (close), Arrow keys (navigate), +/- (zoom), F (fit), 0 (reset), Mouse wheel (zoom)
   */
  setupLightboxKeyboard() {
    // Keyboard event handler
    document.addEventListener('keydown', (e) => {
      // Only handle keys when lightbox is open
      const lightbox = document.getElementById('bcf-image-lightbox');
      if (!lightbox || !lightbox.classList.contains('active')) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          this.closeLightbox();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.navigateLightbox(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.navigateLightbox(1);
          break;
        case '+':
        case '=':
          e.preventDefault();
          this.zoomImage('in');
          break;
        case '-':
          e.preventDefault();
          this.zoomImage('out');
          break;
        case '0':
          e.preventDefault();
          this.resetZoom();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          this.fitToScreen();
          break;
      }
    });

    // Mouse wheel zoom handler
    document.addEventListener(
      'wheel',
      (e) => {
        // Only handle wheel events when lightbox is open and over the image
        const lightbox = document.getElementById('bcf-image-lightbox');
        if (!lightbox || !lightbox.classList.contains('active')) {
          return;
        }

        // Check if mouse is over the image container
        const imageContainer = document.querySelector(
          '.lightbox-image-container'
        );
        if (!imageContainer) return;

        const rect = imageContainer.getBoundingClientRect();
        const isOverImage =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        if (!isOverImage) return;

        e.preventDefault();

        // Determine zoom direction (deltaY is negative for wheel up, positive for wheel down)
        if (e.deltaY < 0) {
          // Wheel up = zoom in
          this.zoomImage('in');
        } else {
          // Wheel down = zoom out
          this.zoomImage('out');
        }
      },
      { passive: false }
    ); // passive: false allows preventDefault()

    console.log('✅ Lightbox keyboard and mouse wheel controls setup complete');
  }

  /**
   * Open lightbox with specific image
   * @param {number} imageIndex - Index of image in filteredImages array
   */
  openLightbox(imageIndex) {
    console.log('🖼️ Opening lightbox for image index:', imageIndex);

    // Validate image index
    if (imageIndex < 0 || imageIndex >= this.filteredImages.length) {
      console.warn('Invalid image index:', imageIndex);
      return;
    }

    const lightbox = document.getElementById('bcf-image-lightbox');
    if (!lightbox) {
      console.error('Lightbox not found - creating it now');
      this.createLightbox();
      // Try again after creating
      setTimeout(() => this.openLightbox(imageIndex), 100);
      return;
    }

    // Store current image index and setup navigation array
    this.currentLightboxIndex = imageIndex;
    this.lightboxImages = this.filteredImages; // Use filtered images for navigation

    // Load and display the image
    this.displayLightboxImage(imageIndex);

    // Show lightbox
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    console.log('✅ Lightbox opened successfully');
  }

  /**
   * Display image in lightbox with metadata
   * @param {number} imageIndex - Index of image to display
   */
  displayLightboxImage(imageIndex) {
    const image = this.lightboxImages[imageIndex];
    if (!image) {
      console.error('Image not found at index:', imageIndex);
      return;
    }

    // Update image source
    const lightboxImage = document.getElementById('lightbox-image');
    const imageUrl = `data:${image.imageType};base64,${image.imageData}`;
    lightboxImage.src = imageUrl;
    lightboxImage.alt = `BCF Image: ${image.title}`;

    // Update title and metadata
    document.getElementById('lightbox-title').textContent = image.title;

    // Update status with styling
    const statusElement = document.getElementById('lightbox-status');
    statusElement.textContent = image.status;
    statusElement.className = `lightbox-status status-${image.status
      .toLowerCase()
      .replace(/\s+/g, '-')}`;

    document.getElementById('lightbox-author').textContent = image.author;
    document.getElementById('lightbox-date').textContent = this.formatDate(
      image.creationDate
    );

    // Update counter
    document.getElementById('lightbox-counter').textContent = `${
      imageIndex + 1
    } of ${this.lightboxImages.length}`;

    // Reset zoom when changing images
    this.resetZoom();

    // Update navigation button states
    this.updateNavigationButtons();

    console.log('📷 Displayed image:', image.title);
  }

  /**
   * Navigate between images in lightbox
   * @param {number} direction - -1 for previous, 1 for next
   */
  navigateLightbox(direction) {
    if (!this.lightboxImages || this.lightboxImages.length === 0) {
      return;
    }

    const newIndex = this.currentLightboxIndex + direction;

    // Handle wrapping (cycle through images)
    let targetIndex;
    if (newIndex < 0) {
      targetIndex = this.lightboxImages.length - 1; // Go to last image
    } else if (newIndex >= this.lightboxImages.length) {
      targetIndex = 0; // Go to first image
    } else {
      targetIndex = newIndex;
    }

    this.currentLightboxIndex = targetIndex;
    this.displayLightboxImage(targetIndex);

    console.log(
      `🔄 Navigated to image ${targetIndex + 1} of ${
        this.lightboxImages.length
      }`
    );
  }

  /**
   * Update navigation button states based on current image
   */
  updateNavigationButtons() {
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');

    if (!prevBtn || !nextBtn) return;

    // Always enable navigation buttons for cycling
    prevBtn.style.opacity = '1';
    nextBtn.style.opacity = '1';
    prevBtn.disabled = false;
    nextBtn.disabled = false;

    // Hide navigation if only one image
    if (this.lightboxImages.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }
  }

  /**
   * Close the lightbox
   */
  closeLightbox() {
    console.log('🚪 Closing lightbox');

    const lightbox = document.getElementById('bcf-image-lightbox');
    if (lightbox) {
      lightbox.classList.remove('active');
    }

    // Restore background scrolling
    document.body.style.overflow = '';

    // Reset zoom
    this.resetZoom();

    console.log('✅ Lightbox closed');
  }

  /**
   * Zoom image in lightbox
   * @param {string} direction - 'in' or 'out'
   */
  zoomImage(direction) {
    const lightboxImage = document.getElementById('lightbox-image');
    if (!lightboxImage) return;

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

    lightboxImage.style.transform = `scale(${this.currentZoom})`;
    lightboxImage.style.cursor = this.currentZoom > 1 ? 'grab' : 'default';

    console.log(`🔍 Zoom level: ${Math.round(this.currentZoom * 100)}%`);
  }

  /**
   * Reset zoom to 100%
   */
  resetZoom() {
    const lightboxImage = document.getElementById('lightbox-image');
    if (!lightboxImage) return;

    this.currentZoom = 1;
    lightboxImage.style.transform = 'scale(1)';
    lightboxImage.style.cursor = 'default';

    console.log('🎯 Zoom reset to 100%');
  }

  /**
   * Fit image to screen
   */
  fitToScreen() {
    const lightboxImage = document.getElementById('lightbox-image');
    const container = document.querySelector('.lightbox-image-container');
    if (!lightboxImage || !container) return;

    // Calculate zoom to fit
    const containerRect = container.getBoundingClientRect();
    const imageRect = lightboxImage.getBoundingClientRect();

    const scaleX = (containerRect.width * 0.9) / imageRect.width;
    const scaleY = (containerRect.height * 0.9) / imageRect.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom beyond 100%

    this.currentZoom = scale;
    lightboxImage.style.transform = `scale(${scale})`;
    lightboxImage.style.cursor = scale > 1 ? 'grab' : 'default';

    console.log(`📐 Fit to screen: ${Math.round(scale * 100)}%`);
  }

  /**
   * Download the currently displayed image
   */
  downloadCurrentImage() {
    if (this.currentLightboxIndex < 0 || !this.lightboxImages) {
      console.warn('No current image to download');
      return;
    }

    const image = this.lightboxImages[this.currentLightboxIndex];
    this.downloadImage(this.currentLightboxIndex);
  }

  /**
   * Show detailed information about current image
   */
  showImageInfo() {
    if (this.currentLightboxIndex < 0 || !this.lightboxImages) {
      return;
    }

    const image = this.lightboxImages[this.currentLightboxIndex];

    const info = [
      `Topic: ${image.title}`,
      `Status: ${image.status}`,
      `Priority: ${image.priority}`,
      `Author: ${image.author}`,
      `Created: ${this.formatDate(image.creationDate)}`,
      `Project: ${image.projectName}`,
      `Source: ${image.sourceFile}`,
      `BCF Version: ${image.bcfVersion}`,
      `Topic GUID: ${image.topicGuid}`,
      `Viewpoint: ${image.viewpointIndex}`,
      `Comments: ${image.commentsCount}`,
    ].join('\n');

    alert(info);
  }

  // This method is now implemented above in the complete lightbox section
  // Remove this placeholder method entirely

  /**
   * Download individual image with intelligent filename
   * @param {number} imageIndex - Index of image in filteredImages array
   */
  downloadImage(imageIndex) {
    console.log('💾 Starting download for image index:', imageIndex);

    // Validate image index
    if (imageIndex < 0 || imageIndex >= this.filteredImages.length) {
      console.error('Invalid image index for download:', imageIndex);
      alert('Error: Invalid image selected for download');
      return;
    }

    const image = this.filteredImages[imageIndex];

    try {
      // Generate intelligent filename
      const filename = this.generateImageFilename(image);

      // Create download blob from base64 data
      const byteCharacters = atob(image.imageData);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: image.imageType });

      // Create and trigger download
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

      console.log('✅ Download triggered:', filename);

      // Show success feedback
      this.showDownloadFeedback(`Downloaded: ${filename}`);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Error downloading image: ' + error.message);
    }
  }

  /**
   * Generate intelligent filename for image download
   * Format: ProjectName_TopicTitle_ViewpointN_Date.extension
   * @param {Object} image - Image data object
   * @returns {string} - Generated filename
   */
  generateImageFilename(image) {
    // Clean and format components
    const projectName = this.sanitizeFilename(image.projectName || 'BCF');
    const topicTitle = this.sanitizeFilename(image.title || 'Topic');
    const viewpointIndex = image.viewpointIndex || '1';
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Determine file extension from MIME type
    const extension = this.getFileExtensionFromMimeType(image.imageType);

    // Construct filename with intelligent truncation
    let filename = `${projectName}_${topicTitle}_View${viewpointIndex}_${date}.${extension}`;

    // Ensure filename isn't too long (Windows has 260 char limit for full path)
    if (filename.length > 100) {
      const truncatedTitle = this.sanitizeFilename(
        image.title.substring(0, 30) || 'Topic'
      );
      filename = `${projectName}_${truncatedTitle}_View${viewpointIndex}_${date}.${extension}`;
    }

    console.log('📝 Generated filename:', filename);
    return filename;
  }

  /**
   * Sanitize string for use in filename
   * @param {string} str - Input string
   * @returns {string} - Sanitized filename-safe string
   */
  sanitizeFilename(str) {
    if (!str) return 'Unknown';

    return str
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid filename characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .substring(0, 50); // Limit length
  }

  /**
   * Get file extension from MIME type
   * @param {string} mimeType - MIME type (e.g., 'image/png')
   * @returns {string} - File extension (e.g., 'png')
   */
  getFileExtensionFromMimeType(mimeType) {
    const mimeToExt = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'image/webp': 'webp',
    };

    return mimeToExt[mimeType] || 'png';
  }

  /**
   * Download all filtered images as individual files
   */
  downloadAllImages() {
    console.log('💾 Starting bulk download of all filtered images...');

    if (this.filteredImages.length === 0) {
      alert('No images to download. Please check your filters.');
      return;
    }

    // Confirm bulk download with time warning
    let timeEstimate = '';
    if (this.filteredImages.length > 50) {
      const estimatedMinutes = Math.ceil(this.filteredImages.length / 60); // Roughly 1 image per second
      timeEstimate = `\n⏱️ Estimated time: ${estimatedMinutes}+ minutes`;
    }

    const confirmMessage =
      `Download ${this.filteredImages.length} images as separate files?` +
      `\n\n⚠️ This downloads each image individually and may take a while for large collections.` +
      timeEstimate +
      `\n\n💡 Tip: Use "Download as ZIP" for faster bulk downloads.` +
      `\n\nContinue with individual downloads?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    // Show progress feedback
    this.showDownloadProgress(0, this.filteredImages.length);

    // Download images with delay to prevent browser blocking
    this.downloadImagesSequentially(0);
  }

  /**
   * Download images one by one with progress feedback
   * @param {number} currentIndex - Current image index being downloaded
   */
  downloadImagesSequentially(currentIndex) {
    if (currentIndex >= this.filteredImages.length) {
      // All downloads complete
      this.hideDownloadProgress();
      this.showDownloadFeedback(
        `✅ Downloaded ${this.filteredImages.length} images successfully!`
      );
      console.log('✅ Bulk download complete');
      return;
    }

    // Update progress
    this.updateDownloadProgress(currentIndex + 1, this.filteredImages.length);

    try {
      // Download current image
      this.downloadImage(currentIndex);

      // Continue with next image after short delay
      setTimeout(() => {
        this.downloadImagesSequentially(currentIndex + 1);
      }, 500); // 500ms delay between downloads
    } catch (error) {
      console.error(`Error downloading image ${currentIndex + 1}:`, error);
      // Continue with next image even if one fails
      setTimeout(() => {
        this.downloadImagesSequentially(currentIndex + 1);
      }, 500);
    }
  }

  /**
   * Download filtered images as ZIP archive
   */
  async downloadImagesAsZip() {
    console.log('📦 Starting ZIP download of filtered images...');

    if (this.filteredImages.length === 0) {
      alert('No images to download. Please check your filters.');
      return;
    }

    // Check if JSZip is available
    if (typeof JSZip === 'undefined') {
      alert(
        'ZIP functionality requires JSZip library. Please ensure it is loaded.'
      );
      return;
    }

    // Confirm ZIP download
    const zipSizeMB = Math.ceil((this.filteredImages.length * 500) / 1024); // Rough estimate: 500KB per image
    const confirmMessage =
      `Create ZIP archive with ${this.filteredImages.length} images?` +
      `\n\n📦 This will create a single ZIP file (estimated size: ~${zipSizeMB}MB)` +
      `\n✅ Much faster than downloading individual files` +
      `\n\nProceed with ZIP creation?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Show progress
      this.showDownloadProgress(
        0,
        this.filteredImages.length,
        'Creating ZIP archive...'
      );

      // Create new ZIP archive
      const zip = new JSZip();
      const imagesFolder = zip.folder('BCF_Images');

      // Add each image to ZIP
      for (let i = 0; i < this.filteredImages.length; i++) {
        const image = this.filteredImages[i];

        // Update progress
        this.updateDownloadProgress(
          i + 1,
          this.filteredImages.length,
          'Adding images to ZIP...'
        );

        // Generate filename and add to ZIP
        const filename = this.generateImageFilename(image);

        // Convert base64 to binary for ZIP
        const binaryData = atob(image.imageData);
        imagesFolder.file(filename, binaryData, { binary: true });

        // Small delay to keep UI responsive
        if (i % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      // Update progress
      this.updateDownloadProgress(
        this.filteredImages.length,
        this.filteredImages.length,
        'Generating ZIP file...'
      );

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      // Generate ZIP filename
      const projectName = this.getCommonProjectName();
      const date = new Date().toISOString().split('T')[0];
      const zipFilename = `${projectName}_BCF_Images_${date}.zip`;

      // Trigger download
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFilename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      // Hide progress and show success
      this.hideDownloadProgress();
      this.showDownloadFeedback(`✅ ZIP archive downloaded: ${zipFilename}`);

      console.log('✅ ZIP download complete:', zipFilename);
    } catch (error) {
      console.error('Error creating ZIP archive:', error);
      this.hideDownloadProgress();
      alert('Error creating ZIP archive: ' + error.message);
    }
  }

  /**
   * Get common project name for ZIP filename
   * @returns {string} - Project name or 'Mixed_Projects'
   */
  getCommonProjectName() {
    const projectNames = [
      ...new Set(this.filteredImages.map((img) => img.projectName)),
    ];

    if (projectNames.length === 1) {
      return this.sanitizeFilename(projectNames[0]);
    } else {
      return 'Mixed_Projects';
    }
  }

  /**
   * Show download progress indicator
   * @param {number} current - Current progress count
   * @param {number} total - Total items
   * @param {string} message - Progress message
   */
  showDownloadProgress(current, total, message = 'Downloading...') {
    // Remove existing progress if any
    this.hideDownloadProgress();

    const progressHTML = `
      <div id="download-progress" class="download-progress-overlay">
        <div class="download-progress-modal">
          <h3>Download Progress</h3>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${
              (current / total) * 100
            }%"></div>
          </div>
          <div class="progress-text">
            ${message} (${current}/${total})
          </div>
          <button onclick="window.bcfApp.imageViewer.cancelDownload()" class="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', progressHTML);
  }

  /**
   * Update download progress
   * @param {number} current - Current progress count
   * @param {number} total - Total items
   * @param {string} message - Progress message
   */
  updateDownloadProgress(current, total, message = 'Downloading...') {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    if (progressFill) {
      progressFill.style.width = `${(current / total) * 100}%`;
    }

    if (progressText) {
      progressText.textContent = `${message} (${current}/${total})`;
    }
  }

  /**
   * Hide download progress indicator
   */
  hideDownloadProgress() {
    const progress = document.getElementById('download-progress');
    if (progress) {
      progress.remove();
    }
  }

  /**
   * Cancel ongoing download process
   */
  cancelDownload() {
    this.downloadCancelled = true;
    this.hideDownloadProgress();
    console.log('📛 Download cancelled by user');
  }

  /**
   * Show temporary download feedback message
   * @param {string} message - Feedback message
   */
  showDownloadFeedback(message) {
    // Remove existing feedback
    const existing = document.getElementById('download-feedback');
    if (existing) {
      existing.remove();
    }

    const feedbackHTML = `
      <div id="download-feedback" class="download-feedback">
        ${message}
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', feedbackHTML);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      const feedback = document.getElementById('download-feedback');
      if (feedback) {
        feedback.style.opacity = '0';
        setTimeout(() => feedback.remove(), 300);
      }
    }, 3000);
  }

  /**
   * Generate PDF report with images and metadata - Simplified Version
   */
  async generatePDFReport() {
    console.log('📄 Starting PDF report generation...');

    if (this.filteredImages.length === 0) {
      alert('No images to include in PDF report. Please check your filters.');
      return;
    }

    // Check if jsPDF constructor is available (same as analytics)
    if (
      typeof window.jspdf === 'undefined' ||
      typeof window.jspdf.jsPDF !== 'function'
    ) {
      console.error('jsPDF library not found');
      alert(
        'PDF functionality requires jsPDF library. Please refresh the page and try again.'
      );
      return;
    }

    // Show simplified layout options (without grouping checkboxes)
    const layout = await this.showSimplePDFLayoutDialog();
    if (!layout) {
      return; // User cancelled
    }

    try {
      // Show progress
      this.showDownloadProgress(
        0,
        this.filteredImages.length,
        'Generating PDF report...'
      );

      // Generate PDF based on chosen layout
      let pdf;
      switch (layout) {
        case 'grid':
          pdf = await this.generateGridPDFReport();
          break;
        case 'detailed':
          pdf = await this.generateDetailedPDFReport();
          break;
        case 'summary':
          pdf = await this.generateSummaryPDFReport();
          break;
        default:
          throw new Error('Invalid layout choice');
      }

      // Generate filename and download
      const filename = this.generatePDFFilename(layout);
      pdf.save(filename);

      // Hide progress and show success
      this.hideDownloadProgress();
      this.showDownloadFeedback(`✅ PDF report generated: ${filename}`);

      console.log('✅ PDF report generated successfully:', filename);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      this.hideDownloadProgress();
      alert('Error generating PDF report: ' + error.message);
    }
  }

  /**
   * Generate Word document report with images and metadata
   * Enhanced with better library loading detection
   */
  async generateWordReport() {
    console.log('📝 Starting Word document report generation...');

    if (this.filteredImages.length === 0) {
      alert('No images to include in Word report. Please check your filters.');
      return;
    }

    // ENHANCED: Wait for library to be ready
    console.log('🔍 Checking if DOCX library is ready...');

    // Wait up to 15 seconds for library to load
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts × 500ms = 15 seconds

    while (attempts < maxAttempts) {
      if (window.docxReady === true && typeof window.docx !== 'undefined') {
        console.log('✅ DOCX library is ready!');
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

    // Final verification
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
      '✅ DOCX library verification complete - proceeding with document generation'
    );

    // Show layout options
    const layout = await this.showWordLayoutDialog();
    if (!layout) {
      return; // User cancelled
    }

    try {
      // Show progress
      this.showDownloadProgress(
        0,
        this.filteredImages.length,
        'Generating Word document...'
      );

      // Generate Word document based on chosen layout
      let wordDoc;
      switch (layout) {
        case 'grid':
          wordDoc = await this.generateGridWordReport();
          break;
        case 'detailed':
          wordDoc = await this.generateDetailedWordReport();
          break;
        case 'summary':
          wordDoc = await this.generateSummaryWordReport();
          break;
        default:
          throw new Error('Invalid layout choice');
      }

      // Generate filename and download
      const filename = this.generateWordFilename(layout);
      await this.downloadWordDocument(wordDoc, filename);

      // Hide progress and show success
      this.hideDownloadProgress();
      this.showDownloadFeedback(`✅ Word document generated: ${filename}`);

      console.log('✅ Word document generated successfully:', filename);
    } catch (error) {
      console.error('Error generating Word document:', error);
      this.hideDownloadProgress();
      alert('Error generating Word document: ' + error.message);
    }
  }

  /**
   * Show Word document layout selection dialog
   * Similar to PDF dialog but tailored for Word document features
   * @returns {Promise<string|null>} - Selected layout or null if cancelled
   */
  showWordLayoutDialog() {
    return new Promise((resolve) => {
      const dialogHTML = `
      <div id="word-layout-dialog" class="pdf-layout-dialog">
        <div class="pdf-dialog-overlay" onclick="document.getElementById('word-layout-dialog').remove(); resolve(null);"></div>
        <div class="pdf-dialog-content">
          <div class="pdf-dialog-header">
            <h3>Word Document Layout</h3>
            <button class="pdf-dialog-close" onclick="document.getElementById('word-layout-dialog').remove(); resolve(null);">✕</button>
          </div>
          
          <div class="pdf-layout-options">
            <div class="pdf-layout-option" onclick="window.bcfApp.imageViewer.selectWordLayout('grid')">
              <div class="pdf-option-icon">📋</div>
              <h4>Image Grid Table</h4>
              <p>Images in a structured table format with metadata. Easy to edit and reformat.</p>
              <div class="pdf-option-details">Best for: Editable project documentation</div>
            </div>
            
            <div class="pdf-layout-option" onclick="window.bcfApp.imageViewer.selectWordLayout('detailed')">
              <div class="pdf-option-icon">📖</div>
              <h4>Detailed Report</h4>
              <p>Each image with comprehensive topic information in separate sections.</p>
              <div class="pdf-option-details">Best for: Detailed analysis and editing</div>
            </div>
            
            <div class="pdf-layout-option" onclick="window.bcfApp.imageViewer.selectWordLayout('summary')">
              <div class="pdf-option-icon">📊</div>
              <h4>Executive Summary</h4>
              <p>Cover page with statistics plus streamlined image presentation.</p>
              <div class="pdf-option-details">Best for: Management presentations</div>
            </div>
          </div>

          <div class="pdf-dialog-footer">
            <div class="pdf-image-count">${this.filteredImages.length} images will be included</div>
            <button class="btn btn-secondary" onclick="document.getElementById('word-layout-dialog').remove(); resolve(null);">Cancel</button>
          </div>
        </div>
      </div>
    `;

      document.body.insertAdjacentHTML('beforeend', dialogHTML);

      // Store resolve function for layout selection
      window.wordLayoutResolve = resolve;
    });
  }

  /**
   * Handle Word layout selection
   * @param {string} layout - Selected layout type
   */
  selectWordLayout(layout) {
    console.log('✅ Word Layout Selected:', layout);

    const dialog = document.getElementById('word-layout-dialog');
    if (dialog) {
      dialog.remove();
    }

    if (window.wordLayoutResolve) {
      window.wordLayoutResolve(layout);
      delete window.wordLayoutResolve;
    }
  }

  /**
   * Generate grid layout Word document (images in table format)
   * Updated for DOCX 9.5.1 API
   * @returns {Object} - Word document object
   */
  async generateGridWordReport() {
    console.log('📋 Generating Word grid layout document...');

    // UPDATED: DOCX 9.5.1 API structure
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      ImageRun,
      AlignmentType,
      HeadingLevel,
      WidthType,
    } = window.docx;

    // Create document with enhanced metadata for DOCX 9.5.1
    const doc = new Document({
      title: `BCF Image Grid Report - ${this.getCommonProjectName()}`,
      description: `Generated by BCFSleuth - ${this.filteredImages.length} images`,
      creator: 'BCFSleuth',
      sections: [
        {
          properties: {},
          children: await this.createWordGridContent(),
        },
      ],
    });

    return doc;
  }

  /**
   * Generate detailed layout Word document (one image per section)
   * Updated for DOCX 9.5.1 API
   * @returns {Object} - Word document object
   */
  async generateDetailedWordReport() {
    console.log('📖 Generating Word detailed layout document...');

    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      ImageRun,
      AlignmentType,
      HeadingLevel,
    } = window.docx;

    const doc = new Document({
      title: `BCF Detailed Image Report - ${this.getCommonProjectName()}`,
      description: `Generated by BCFSleuth - ${this.filteredImages.length} images`,
      creator: 'BCFSleuth',
      sections: [
        {
          properties: {},
          children: await this.createWordDetailedContent(),
        },
      ],
    });

    return doc;
  }

  /**
   * Generate summary layout Word document (executive summary format)
   * Updated for DOCX 9.5.1 API
   * @returns {Object} - Word document object
   */
  async generateSummaryWordReport() {
    console.log('📊 Generating Word summary layout document...');

    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      ImageRun,
      AlignmentType,
      HeadingLevel,
    } = window.docx;

    const doc = new Document({
      title: `BCF Executive Summary - ${this.getCommonProjectName()}`,
      description: `Generated by BCFSleuth - ${this.filteredImages.length} images`,
      creator: 'BCFSleuth',
      sections: [
        {
          properties: {},
          children: await this.createWordSummaryContent(),
        },
      ],
    });

    return doc;
  }

  /**
   * Generate detailed layout Word document (one image per section)
   * @returns {Object} - Word document object
   */
  async generateDetailedWordReport() {
    console.log('📖 Generating Word detailed layout document...');

    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      ImageRun,
      AlignmentType,
      HeadingLevel,
    } = window.docx;

    const doc = new Document({
      title: `BCF Detailed Image Report - ${this.getCommonProjectName()}`,
      description: `Generated by BCFSleuth - ${this.filteredImages.length} images`,
      creator: 'BCFSleuth',
      sections: [
        {
          children: await this.createWordDetailedContent(),
        },
      ],
    });

    return doc;
  }

  /**
   * Generate summary layout Word document (executive summary format)
   * @returns {Object} - Word document object
   */
  async generateSummaryWordReport() {
    console.log('📊 Generating Word summary layout document...');

    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      ImageRun,
      AlignmentType,
      HeadingLevel,
    } = window.docx;

    const doc = new Document({
      title: `BCF Executive Summary - ${this.getCommonProjectName()}`,
      description: `Generated by BCFSleuth - ${this.filteredImages.length} images`,
      creator: 'BCFSleuth',
      sections: [
        {
          children: await this.createWordSummaryContent(),
        },
      ],
    });

    return doc;
  }

  /**
   * Create Word document content for grid layout
   * @returns {Array} - Array of Word document elements
   */
  async createWordGridContent() {
    const {
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      ImageRun,
      AlignmentType,
      HeadingLevel,
      WidthType,
    } = window.docx;

    const elements = [];

    // Add title and header
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `BCF Image Grid Report`,
            bold: true,
            size: 32,
          }),
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      })
    );

    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Project: ${this.getCommonProjectName()}`,
            size: 24,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );

    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${new Date().toLocaleDateString()} | Total Images: ${
              this.filteredImages.length
            }`,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );

    // Add spacing
    elements.push(new Paragraph({ text: '' }));

    // Create table with images (2 columns)
    const tableRows = [];

    for (let i = 0; i < this.filteredImages.length; i += 2) {
      const leftImage = this.filteredImages[i];
      const rightImage = this.filteredImages[i + 1];

      const row = new TableRow({
        children: [
          new TableCell({
            children: await this.createWordImageCell(leftImage),
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: rightImage
              ? await this.createWordImageCell(rightImage)
              : [new Paragraph({ text: '' })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      });

      tableRows.push(row);

      // Update progress
      this.updateDownloadProgress(
        i + 1,
        this.filteredImages.length,
        'Creating Word table...'
      );
    }

    const table = new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });

    elements.push(table);

    return elements;
  }

  /**
   * Create Word image cell content for grid layout
   * Updated for DOCX 9.5.1 API with improved image handling
   * @param {Object} image - Image data
   * @returns {Array} - Array of paragraph elements
   */
  async createWordImageCell(image) {
    const { Paragraph, TextRun, ImageRun, AlignmentType } = window.docx;

    const elements = [];

    try {
      // UPDATED: Convert base64 to buffer for DOCX 9.5.1
      const base64Data = image.imageData;
      const binaryString = atob(base64Data);
      const imageBuffer = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        imageBuffer[i] = binaryString.charCodeAt(i);
      }

      // UPDATED: DOCX 9.5.1 ImageRun API
      elements.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imageBuffer,
              transformation: {
                width: 200,
                height: 150,
              },
              type: image.imageType.includes('png') ? 'png' : 'jpg', // Specify image type
            }),
          ],
          alignment: AlignmentType.CENTER,
        })
      );
    } catch (error) {
      console.warn('Error adding image to Word cell:', error);
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '[Image not available]',
              italics: true,
              color: '999999',
            }),
          ],
          alignment: AlignmentType.CENTER,
        })
      );
    }

    // Add image metadata with enhanced styling
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: image.title || 'Untitled',
            bold: true,
            size: 18,
            color: '2563eb', // Primary blue color
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 }, // Add spacing
      })
    );

    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${image.status} | ${image.priority} | ${image.author}`,
            size: 16,
            color: '64748b', // Secondary gray color
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    return elements;
  }

  /**
   * Create Word document content for detailed layout
   * Updated for DOCX 9.5.1 with enhanced formatting
   * @returns {Array} - Array of Word document elements
   */
  async createWordDetailedContent() {
    const {
      Paragraph,
      TextRun,
      ImageRun,
      AlignmentType,
      HeadingLevel,
      PageBreak,
    } = window.docx;

    const elements = [];

    // Add title with enhanced styling
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `BCF Detailed Image Report`,
            bold: true,
            size: 32,
            color: '2563eb',
          }),
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Add project info
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Project: ${this.getCommonProjectName()}`,
            size: 24,
            color: '475569',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${new Date().toLocaleDateString()} | Total Images: ${
              this.filteredImages.length
            }`,
            size: 20,
            color: '64748b',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      })
    );

    // Add each image as a separate section
    for (let i = 0; i < this.filteredImages.length; i++) {
      const image = this.filteredImages[i];

      // Update progress
      this.updateDownloadProgress(
        i + 1,
        this.filteredImages.length,
        'Creating detailed sections...'
      );

      // Add page break (except for first image)
      if (i > 0) {
        elements.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }

      // Add image title
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${i + 1}. ${image.title || 'Untitled'}`,
              bold: true,
              size: 24,
              color: '2563eb',
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 300 },
        })
      );

      // Add image
      try {
        const binaryString = atob(image.imageData);
        const imageBuffer = new Uint8Array(binaryString.length);

        for (let j = 0; j < binaryString.length; j++) {
          imageBuffer[j] = binaryString.charCodeAt(j);
        }

        elements.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 400,
                  height: 300,
                },
                type: image.imageType.includes('png') ? 'png' : 'jpg',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 300 },
          })
        );
      } catch (error) {
        console.warn('Error adding image to Word document:', error);
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '[Image not available]',
                italics: true,
                color: '999999',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 300 },
          })
        );
      }

      // Add metadata section
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Topic Details',
              bold: true,
              size: 20,
              color: '374151',
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );

      const metadata = [
        `Status: ${image.status}`,
        `Priority: ${image.priority}`,
        `Author: ${image.author}`,
        `Created: ${this.formatDate(image.creationDate)}`,
        `Project: ${image.projectName}`,
        `Description: ${image.description || 'No description available'}`,
      ];

      metadata.forEach((item) => {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: item,
                size: 20,
                color: '1f2937',
              }),
            ],
            spacing: { after: 100 },
          })
        );
      });

      // Add spacing before next section
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: { after: 300 },
        })
      );
    }

    return elements;
  }

  /**
   * Create Word document content for summary layout
   * @returns {Array} - Array of Word document elements
   */
  async createWordSummaryContent() {
    const {
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      ImageRun,
      AlignmentType,
      HeadingLevel,
    } = window.docx;

    const elements = [];

    // Add cover content
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `BCF Executive Summary`,
            bold: true,
            size: 32,
          }),
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      })
    );

    // Add statistics
    const stats = this.calculateImageStatistics();
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Project Statistics',
            bold: true,
            size: 24,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
      })
    );

    const statLines = [
      `Total Images: ${this.filteredImages.length}`,
      `Projects: ${stats.projects.join(', ')}`,
      `Status Breakdown: ${Object.entries(stats.statusCount)
        .map(([status, count]) => `${status} (${count})`)
        .join(', ')}`,
    ];

    statLines.forEach((line) => {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 20,
            }),
          ],
        })
      );
    });

    // Add page break
    elements.push(new Paragraph({ pageBreakBefore: true }));

    // Add images in summary format (similar to grid but with more spacing)
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Image Overview',
            bold: true,
            size: 24,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
      })
    );

    // Add first 10 images in pairs
    const maxImages = Math.min(10, this.filteredImages.length);
    for (let i = 0; i < maxImages; i += 2) {
      const leftImage = this.filteredImages[i];
      const rightImage = this.filteredImages[i + 1];

      // Create simplified image cells for summary
      const leftCell = await this.createWordImageCell(leftImage);
      const rightCell = rightImage
        ? await this.createWordImageCell(rightImage)
        : [new Paragraph({ text: '' })];

      const row = new TableRow({
        children: [
          new TableCell({ children: leftCell }),
          new TableCell({ children: rightCell }),
        ],
      });

      const table = new Table({
        rows: [row],
      });

      elements.push(table);
      elements.push(new Paragraph({ text: '' })); // Add spacing

      // Update progress
      this.updateDownloadProgress(
        i + 1,
        maxImages,
        'Creating summary sections...'
      );
    }

    if (this.filteredImages.length > 10) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `... and ${
                this.filteredImages.length - 10
              } additional images`,
              italics: true,
              size: 18,
            }),
          ],
          alignment: AlignmentType.CENTER,
        })
      );
    }

    return elements;
  }

  /**
   * Download Word document - Fixed for browser environment
   * @param {Object} doc - Word document object
   * @param {string} filename - Output filename
   */
  async downloadWordDocument(doc, filename) {
    try {
      const { Packer } = window.docx;

      console.log('🔄 Generating Word document buffer for browser...');

      // FIXED: Use toBlob instead of toBuffer for browser compatibility
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

      // Try fallback method if toBlob fails
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
   * Generate Word document filename
   * @param {string} layout - Layout type
   * @returns {string} - Word document filename
   */
  generateWordFilename(layout) {
    const projectName = this.sanitizeFilename(this.getCommonProjectName());
    const date = new Date().toISOString().split('T')[0];
    const layoutName = layout.charAt(0).toUpperCase() + layout.slice(1);

    return `${projectName}_BCF_${layoutName}_Report_${date}.docx`;
  }

  /**
   * Show simplified PDF layout selection dialog (no grouping options)
   * @returns {Promise<string|null>} - Selected layout or null if cancelled
   */
  showSimplePDFLayoutDialog() {
    return new Promise((resolve) => {
      const dialogHTML = `
      <div id="pdf-layout-dialog" class="pdf-layout-dialog">
        <div class="pdf-dialog-overlay" onclick="document.getElementById('pdf-layout-dialog').remove(); resolve(null);"></div>
        <div class="pdf-dialog-content">
          <div class="pdf-dialog-header">
            <h3>PDF Report Layout</h3>
            <button class="pdf-dialog-close" onclick="document.getElementById('pdf-layout-dialog').remove(); resolve(null);">✕</button>
          </div>
          
          <div class="pdf-layout-options">
            <div class="pdf-layout-option" onclick="window.bcfApp.imageViewer.selectSimplePDFLayout('grid')">
              <div class="pdf-option-icon">📋</div>
              <h4>Image Grid</h4>
              <p>4 images per page with basic metadata. Compact overview format.</p>
              <div class="pdf-option-details">Best for: Quick visual reference</div>
            </div>
            
            <div class="pdf-layout-option" onclick="window.bcfApp.imageViewer.selectSimplePDFLayout('detailed')">
              <div class="pdf-option-icon">📖</div>
              <h4>Detailed Report</h4>
              <p>1 image per page with complete topic information and metadata.</p>
              <div class="pdf-option-details">Best for: Professional documentation</div>
            </div>
            
            <div class="pdf-layout-option" onclick="window.bcfApp.imageViewer.selectSimplePDFLayout('summary')">
              <div class="pdf-option-icon">📊</div>
              <h4>Executive Summary</h4>
              <p>Cover page with statistics plus 2 images per page with key details.</p>
              <div class="pdf-option-details">Best for: Management reporting</div>
            </div>
          </div>

          <div class="pdf-dialog-footer">
            <div class="pdf-image-count">${this.filteredImages.length} images will be included</div>
            <button class="btn btn-secondary" onclick="document.getElementById('pdf-layout-dialog').remove(); resolve(null);">Cancel</button>
          </div>
        </div>
      </div>
    `;

      document.body.insertAdjacentHTML('beforeend', dialogHTML);

      // Store resolve function for layout selection
      window.pdfLayoutResolve = resolve;
    });
  }

  /**
   * Handle PDF layout selection
   * @param {string} layout - Selected layout type
   */
  selectPDFLayout(layout) {
    // Capture grouping options
    const groupByTopic =
      document.getElementById('pdf-group-by-topic')?.checked || false;
    const separatePages =
      document.getElementById('pdf-separate-pages')?.checked || false;

    // DEBUG: Log what checkboxes were selected
    console.log('✅ PDF Layout Selected:', {
      layout: layout,
      groupByTopic: groupByTopic,
      separatePages: separatePages,
    });

    const dialog = document.getElementById('pdf-layout-dialog');
    if (dialog) {
      dialog.remove();
    }

    if (window.pdfLayoutResolve) {
      // Pass layout and grouping options
      window.pdfLayoutResolve({
        layout: layout,
        groupByTopic: groupByTopic,
        separatePages: separatePages,
      });
      delete window.pdfLayoutResolve;
    }
  }

  /**
   * Handle simplified PDF layout selection (no grouping options)
   * @param {string} layout - Selected layout type
   */
  selectSimplePDFLayout(layout) {
    console.log('✅ PDF Layout Selected:', layout);

    const dialog = document.getElementById('pdf-layout-dialog');
    if (dialog) {
      dialog.remove();
    }

    if (window.pdfLayoutResolve) {
      window.pdfLayoutResolve(layout);
      delete window.pdfLayoutResolve;
    }
  }

  /**
   * Generate grid layout PDF (4 images per page) - Clean Working Version
   * @returns {jsPDF} - PDF document
   */
  async generateGridPDFReport() {
    console.log('📋 Generating grid layout PDF...');

    const jsPDF = window.jspdf.jsPDF;
    const pdf = new jsPDF('portrait', 'mm', 'a4');

    // Use filtered images directly
    const imagesToUse = this.filteredImages;

    console.log(`📊 Processing ${imagesToUse.length} images for grid PDF`);

    // Add standardized cover page
    this.addStandardizedCoverPage(pdf, 'Grid');

    // Page setup for grid layout
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Grid layout configuration
    const margin = 15;
    const usableWidth = pageWidth - 2 * margin;
    const usableHeight = pageHeight - 2 * margin;

    const imagesPerRow = 2;
    const imagesPerCol = 2;
    const imagesPerPage = imagesPerRow * imagesPerCol; // 4 images per page

    const imageWidth = (usableWidth - 10) / imagesPerRow; // 10mm gap between images
    const imageHeight = (usableHeight - 40) / imagesPerCol; // Reserve space for page header

    // Process images in 2x2 grid pages
    for (let i = 0; i < imagesToUse.length; i += imagesPerPage) {
      // Add new page for each set of images
      pdf.addPage();

      // Update progress
      this.updateDownloadProgress(
        i + 1,
        imagesToUse.length,
        'Creating grid pages...'
      );

      // Add page header
      const currentPageNumber = Math.floor(i / imagesPerPage) + 1;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Images Page ${currentPageNumber}`, pageWidth / 2, margin + 10, {
        align: 'center',
      });

      // Add separator line under header
      pdf.setLineWidth(0.5);
      pdf.line(margin, margin + 15, pageWidth - margin, margin + 15);

      // Add images in 2x2 grid
      for (let j = 0; j < imagesPerPage && i + j < imagesToUse.length; j++) {
        const image = imagesToUse[i + j];
        const row = Math.floor(j / imagesPerRow);
        const col = j % imagesPerRow;

        // Calculate position
        const x = margin + col * (imageWidth + 10);
        const y = margin + 25 + row * (imageHeight + 15);

        console.log(`📷 Adding image ${i + j + 1}: ${image.title}`);

        await this.addImageToPDF(
          pdf,
          image,
          x,
          y,
          imageWidth,
          imageHeight - 20, // Reserve space for metadata text
          true // Use compact metadata for grid layout
        );
      }

      // Small delay to keep UI responsive
      if (i % (imagesPerPage * 3) === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    console.log('✅ Grid PDF generation complete');
    return pdf;
  }

  /**
   * Generate detailed layout PDF (1 image per page) - Simplified Version
   * @returns {jsPDF} - PDF document
   */
  async generateDetailedPDFReport() {
    // SIMPLIFIED: Use filtered images directly
    const imagesToUse = this.filteredImages;
    console.log('📖 Generating detailed layout PDF...');

    const jsPDF = window.jspdf.jsPDF;
    const pdf = new jsPDF('portrait', 'mm', 'a4');

    // Add standardized cover page
    this.addStandardizedCoverPage(pdf, 'Detailed');

    for (let i = 0; i < imagesToUse.length; i++) {
      pdf.addPage();

      // Update progress
      this.updateDownloadProgress(
        i + 1,
        imagesToUse.length,
        'Adding detailed pages...'
      );

      const image = imagesToUse[i];
      await this.addDetailedImagePage(pdf, image, i + 1);

      // Small delay every 10 images
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    console.log('✅ Detailed PDF generation complete');
    return pdf;
  }

  /**
   * Generate summary layout PDF (executive summary + 2 images per page) - Simplified Version
   * @returns {jsPDF} - PDF document
   */
  async generateSummaryPDFReport() {
    // SIMPLIFIED: Use filtered images directly
    const imagesToUse = this.filteredImages;
    console.log('📊 Generating summary layout PDF...');

    const jsPDF = window.jspdf.jsPDF;
    const pdf = new jsPDF('portrait', 'mm', 'a4');

    // Add standardized cover page
    this.addStandardizedCoverPage(pdf, 'Executive');

    const margin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const usableWidth = pageWidth - 2 * margin;
    const imageWidth = usableWidth;
    const imageHeight = (pageHeight - 60) / 2; // Two images per page

    for (let i = 0; i < imagesToUse.length; i += 2) {
      pdf.addPage();

      // Update progress
      this.updateDownloadProgress(
        i + 1,
        imagesToUse.length,
        'Creating summary pages...'
      );

      // Add page header
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(
        `Images ${i + 1}-${Math.min(i + 2, imagesToUse.length)}`,
        margin,
        margin
      );

      // First image
      const image1 = imagesToUse[i];
      const maxImageWidth = usableWidth * 0.9;
      const maxImageHeight = (pageHeight - 80) / 2 - 30;

      await this.addImageToPDF(
        pdf,
        image1,
        margin,
        margin + 10,
        maxImageWidth,
        maxImageHeight,
        false
      );

      // Second image (if exists)
      if (i + 1 < imagesToUse.length) {
        const image2 = imagesToUse[i + 1];
        const secondImageY = margin + 10 + maxImageHeight + 40;

        await this.addImageToPDF(
          pdf,
          image2,
          margin,
          secondImageY,
          maxImageWidth,
          maxImageHeight,
          false
        );
      }

      // Small delay every 10 images
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    console.log('✅ Summary PDF generation complete');
    return pdf;
  }

  /**
   * Add title page to PDF
   * @param {jsPDF} pdf - PDF document
   * @param {string} title - Report title
   */
  addPDFTitlePage(pdf, title) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, pageWidth / 2, 60, { align: 'center' });

    // Subtitle
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    const projectName = this.getCommonProjectName();
    pdf.text(`Project: ${projectName}`, pageWidth / 2, 80, { align: 'center' });

    // Date and stats
    pdf.setFontSize(12);
    const date = new Date().toLocaleDateString();
    pdf.text(`Generated: ${date}`, pageWidth / 2, 100, { align: 'center' });
    pdf.text(
      `Total Images: ${this.filteredImages.length}`,
      pageWidth / 2,
      115,
      { align: 'center' }
    );

    // Generated by
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Generated by BCFSleuth', pageWidth / 2, pageHeight - 20, {
      align: 'center',
    });
  }

  /**
   * Add detailed image page with full metadata and proper text wrapping
   * @param {jsPDF} pdf - PDF document
   * @param {Object} image - Image data
   * @param {number} pageNumber - Page number
   */
  async addDetailedImagePage(pdf, image, pageNumber) {
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const lineHeight = 6;
    const maxLineWidth = pageWidth - 2 * margin;

    // Page header with text wrapping for long titles
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');

    const titleText = `Image ${pageNumber}: ${image.title}`;
    const wrappedTitle = this.wrapTextForPDF(pdf, titleText, maxLineWidth);
    let currentY = margin;

    wrappedTitle.forEach((line, index) => {
      pdf.text(line, margin, currentY + index * 12);
    });

    currentY += wrappedTitle.length * 12 + 15;

    // Image with proper sizing
    const maxImageHeight = 120;
    const actualImageHeight = Math.min(
      maxImageHeight,
      pageHeight - currentY - 180
    ); // Reserve more space for metadata

    await this.addImageToPDF(
      pdf,
      image,
      margin,
      currentY,
      maxLineWidth,
      actualImageHeight,
      false
    );

    currentY += actualImageHeight + 20;

    // Metadata section with proper text wrapping
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Topic Details', margin, currentY);
    currentY += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Metadata with proper wrapping and page break handling
    const metadataItems = [
      { label: 'Status:', value: image.status || 'Unknown' },
      { label: 'Priority:', value: image.priority || 'Normal' },
      { label: 'Author:', value: image.author || 'Unknown' },
      {
        label: 'Created:',
        value: this.formatDate(image.creationDate) || 'Unknown',
      },
      { label: 'Project:', value: image.projectName || 'Unknown' },
      { label: 'Source File:', value: image.sourceFile || 'Unknown' },
      { label: 'BCF Version:', value: image.bcfVersion || 'Unknown' },
      { label: 'Topic GUID:', value: image.topicGuid || 'Unknown' },
      {
        label: 'Description:',
        value: image.description || 'No description available',
      },
    ];

    metadataItems.forEach((item, itemIndex) => {
      // Check if we need a new page
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = margin + 20;

        // Add continuation header
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(
          `Image ${pageNumber} Details (continued)`,
          margin,
          margin + 10
        );
        currentY = margin + 30;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
      }

      // Special handling for description (longest field)
      if (item.label === 'Description:') {
        // Add label
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.label, margin, currentY);
        currentY += lineHeight + 3;

        // Wrap description text
        pdf.setFont('helvetica', 'normal');
        const wrappedDescription = this.wrapTextForPDF(
          pdf,
          item.value,
          maxLineWidth - 10
        );

        wrappedDescription.forEach((line, lineIndex) => {
          // Check for page break
          if (currentY > pageHeight - 20) {
            pdf.addPage();
            currentY = margin + 20;
          }

          pdf.text(line, margin + 10, currentY); // Indent description
          currentY += lineHeight;
        });

        currentY += 5; // Extra space after description
      } else {
        // Regular metadata items
        const labelWidth = pdf.getTextWidth(item.label);
        const valueStartX = margin + labelWidth + 5;
        const availableWidth = maxLineWidth - labelWidth - 5;

        // Add label
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.label, margin, currentY);

        // Wrap and add value
        pdf.setFont('helvetica', 'normal');
        const wrappedValue = this.wrapTextForPDF(
          pdf,
          item.value,
          availableWidth
        );

        wrappedValue.forEach((line, lineIndex) => {
          if (lineIndex === 0) {
            // First line goes next to label
            pdf.text(line, valueStartX, currentY);
          } else {
            // Check for page break
            if (currentY + lineHeight > pageHeight - 20) {
              pdf.addPage();
              currentY = margin + 20;
            } else {
              currentY += lineHeight;
            }
            pdf.text(line, valueStartX, currentY);
          }
        });

        currentY += lineHeight + 3; // Move to next item
      }
    });
  }

  /**
   * Wrap text to fit within specified width for PDF
   * @param {jsPDF} pdf - PDF document
   * @param {string} text - Text to wrap
   * @param {number} maxWidth - Maximum width in mm
   * @returns {string[]} - Array of wrapped lines
   */
  wrapTextForPDF(pdf, text, maxWidth) {
    if (!text || text.trim() === '') {
      return [''];
    }

    const words = text.toString().trim().split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      try {
        const testWidth = pdf.getTextWidth(testLine);

        if (testWidth <= maxWidth || currentLine === '') {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = word;
        }
      } catch (error) {
        // Fallback if getTextWidth fails
        if (testLine.length <= 80 || currentLine === '') {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = word;
        }
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  }

  /**
   * Add image to PDF with proper aspect ratio preservation
   * @param {jsPDF} pdf - PDF document
   * @param {Object} image - Image data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} maxWidth - Maximum image width
   * @param {number} maxHeight - Maximum image height
   * @param {boolean} compact - Whether to use compact metadata
   */
  async addImageToPDF(pdf, image, x, y, maxWidth, maxHeight, compact = true) {
    try {
      console.log('Adding image to PDF:', image.title);

      // Prepare image data
      const imageData = image.imageData;
      const imageType = image.imageType;

      // Determine format for jsPDF
      let format = 'JPEG';
      if (imageType.includes('png')) {
        format = 'PNG';
      } else if (imageType.includes('gif')) {
        format = 'GIF';
      } else if (imageType.includes('webp')) {
        format = 'WEBP';
      }

      // Reserve space for text below image
      const textSpace = compact ? 25 : 35;
      const availableImageHeight = maxHeight - textSpace;

      // Create temporary image to get dimensions for aspect ratio calculation
      const img = new Image();

      const imageDimensions = await new Promise((resolve) => {
        img.onload = () => {
          const originalWidth = img.width;
          const originalHeight = img.height;

          if (originalWidth === 0 || originalHeight === 0) {
            // Fallback if dimensions can't be determined
            resolve({
              width: maxWidth * 0.8,
              height: availableImageHeight * 0.8,
            });
            return;
          }

          // Calculate aspect ratio
          const aspectRatio = originalWidth / originalHeight;

          let finalWidth, finalHeight;

          // Calculate dimensions that fit within bounds while preserving aspect ratio
          if (aspectRatio > maxWidth / availableImageHeight) {
            // Width-constrained
            finalWidth = Math.min(maxWidth, maxWidth * 0.95);
            finalHeight = finalWidth / aspectRatio;
          } else {
            // Height-constrained
            finalHeight = Math.min(
              availableImageHeight,
              availableImageHeight * 0.95
            );
            finalWidth = finalHeight * aspectRatio;
          }

          // Ensure minimum readable size
          const minSize = 20;
          if (finalWidth < minSize) finalWidth = minSize;
          if (finalHeight < minSize) finalHeight = minSize;

          console.log(
            `Image aspect ratio preserved: ${originalWidth}x${originalHeight} -> ${finalWidth.toFixed(
              1
            )}x${finalHeight.toFixed(1)}mm`
          );

          resolve({
            width: finalWidth,
            height: finalHeight,
          });
        };

        img.onerror = () => {
          console.warn('Could not load image for dimension calculation');
          resolve({
            width: maxWidth * 0.8,
            height: availableImageHeight * 0.8,
          });
        };

        img.src = `data:${imageType};base64,${imageData}`;
      });

      // Center the image if it's smaller than available space
      const imageX = x + (maxWidth - imageDimensions.width) / 2;
      const imageY = y + (availableImageHeight - imageDimensions.height) / 2;

      // Add image to PDF with calculated dimensions
      pdf.addImage(
        `data:${imageType};base64,${imageData}`,
        format,
        imageX,
        imageY,
        imageDimensions.width,
        imageDimensions.height
      );

      console.log(
        `✅ Image added: ${
          image.title
        } (${format}) - ${imageDimensions.width.toFixed(
          1
        )}x${imageDimensions.height.toFixed(1)}mm`
      );
    } catch (error) {
      console.warn('Error adding image to PDF:', error);

      // Add placeholder rectangle if image fails
      pdf.setFillColor(240, 240, 240);
      pdf.rect(x, y, maxWidth, maxHeight - (compact ? 25 : 35), 'F');

      // Add error text
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        'Image not available',
        x + maxWidth / 2,
        y + (maxHeight - (compact ? 25 : 35)) / 2,
        {
          align: 'center',
          baseline: 'middle',
        }
      );
      pdf.setTextColor(0, 0, 0); // Reset text color
    }

    // Add metadata below image (existing logic with null check)
    try {
      pdf.setFontSize(compact ? 8 : 10);
      pdf.setFont('helvetica', 'bold');

      const titleText = this.truncateText(image.title, compact ? 30 : 50);
      pdf.text(titleText, x, y + maxHeight - (compact ? 20 : 30));

      if (!compact) {
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `${image.status} | ${image.priority} | ${image.author}`,
          x,
          y + maxHeight - 20
        );
        pdf.text(
          `${this.formatDate(image.creationDate)}`,
          x,
          y + maxHeight - 10
        );
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${image.status} | ${image.author}`, x, y + maxHeight - 15);
      }
    } catch (textError) {
      console.warn('Error adding text to PDF:', textError);
    }
  }

  /**
   * Calculate statistics for summary report
   * @returns {Object} - Statistics object
   */
  calculateImageStatistics() {
    const stats = {
      projects: [...new Set(this.filteredImages.map((img) => img.projectName))],
      statusCount: {},
      priorityCount: {},
      authorCount: {},
    };

    this.filteredImages.forEach((image) => {
      // Count statuses
      const status = image.status || 'Unknown';
      stats.statusCount[status] = (stats.statusCount[status] || 0) + 1;

      // Count priorities
      const priority = image.priority || 'Normal';
      stats.priorityCount[priority] = (stats.priorityCount[priority] || 0) + 1;

      // Count authors
      const author = image.author || 'Unknown';
      stats.authorCount[author] = (stats.authorCount[author] || 0) + 1;
    });

    return stats;
  }

  /**
   * Generate PDF filename
   * @param {string} layout - Layout type
   * @returns {string} - PDF filename
   */
  generatePDFFilename(layout) {
    const projectName = this.sanitizeFilename(this.getCommonProjectName());
    const date = new Date().toISOString().split('T')[0];
    const layoutName = layout.charAt(0).toUpperCase() + layout.slice(1);

    return `${projectName}_BCF_${layoutName}_Report_${date}.pdf`;
  }

  /**
   * Create standardized cover page for all PDF reports
   * Uses the Executive Summary layout as template for consistency
   * @param {jsPDF} pdf - PDF document instance
   * @param {string} reportType - Type of report (Grid, Detailed, Executive Summary)
   */
  addStandardizedCoverPage(pdf, reportType) {
    console.log(`📄 Creating standardized cover page for ${reportType} report`);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    // Main title - consistent across all reports
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');

    // Determine report title based on type
    let reportTitle = '';
    switch (reportType.toLowerCase()) {
      case 'grid':
        reportTitle = 'BCF Image Grid Report';
        break;
      case 'detailed':
        reportTitle = 'BCF Detailed Image Report';
        break;
      case 'summary':
      case 'executive':
        reportTitle = 'BCF Executive Summary';
        break;
      default:
        reportTitle = 'BCF Image Report';
    }

    pdf.text(reportTitle, pageWidth / 2, 60, { align: 'center' });

    // Project name - consistent formatting
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    const projectName = this.getCommonProjectName();
    pdf.text(`Project: ${projectName}`, pageWidth / 2, 85, { align: 'center' });

    // Generation date - consistent positioning
    pdf.setFontSize(12);
    const today = new Date().toLocaleDateString();
    pdf.text(`Generated: ${today}`, pageWidth / 2, 105, { align: 'center' });

    // Image count - consistent across all reports
    pdf.text(
      `Total Images: ${this.filteredImages.length}`,
      pageWidth / 2,
      125,
      { align: 'center' }
    );

    // Project Statistics section - enhanced for all report types
    try {
      const stats = this.calculateImageStatistics();
      if (Object.keys(stats.statusCount).length > 0) {
        let currentY = 160;

        // Section header
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Project Statistics', pageWidth / 2, currentY, {
          align: 'center',
        });
        currentY += 25;

        // Statistics content
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);

        // Project and status info
        const statLines = [
          `Total Images: ${this.filteredImages.length}`,
          `Projects: ${stats.projects.join(', ')}`,
          `Status Breakdown: ${Object.entries(stats.statusCount)
            .map(([status, count]) => `${status} (${count})`)
            .join(', ')}`,
          `Priority Breakdown: ${Object.entries(stats.priorityCount)
            .map(([priority, count]) => `${priority} (${count})`)
            .join(', ')}`,
          `Top Authors: ${Object.entries(stats.authorCount)
            .slice(0, 3)
            .map(([author, count]) => `${author} (${count})`)
            .join(', ')}`,
        ];

        // Add each statistic line with proper spacing
        statLines.forEach((line) => {
          pdf.text(line, pageWidth / 2, currentY, { align: 'center' });
          currentY += 15;
        });
      }
    } catch (error) {
      console.log('📊 Statistics not available for cover page:', error.message);

      // Fallback: just show basic info if stats calculation fails
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${reportType} Layout Report`, pageWidth / 2, 160, {
        align: 'center',
      });
    }

    // Footer - consistent across all reports
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Generated by BCFSleuth', pageWidth / 2, pageHeight - 30, {
      align: 'center',
    });

    console.log(`✅ Standardized cover page created for ${reportType} report`);
  }

  /**
   * Prepare images for PDF generation based on grouping options
   * @param {Object} options - Grouping options {groupByTopic, separatePages}
   * @returns {Object} - Prepared image data with grouping information
   */
  prepareImagesForPDF(options) {
    console.log(
      `🔧 Preparing ${this.filteredImages.length} images for PDF:`,
      options
    );

    // Use this.filteredImages as the source
    const images = this.filteredImages;
    const { groupByTopic, separatePages } = options;

    let processedImages = [...images];
    let topicBreaks = []; // Track where each topic starts for page breaks

    if (groupByTopic) {
      // Group images by topic GUID, maintaining topic order
      const topicGroups = new Map();
      const topicOrder = [];

      // First pass: identify unique topics in order
      images.forEach((image) => {
        const topicGuid = image.topicGuid;
        if (!topicGroups.has(topicGuid)) {
          topicGroups.set(topicGuid, {
            topicTitle: image.title,
            topicGuid: topicGuid,
            images: [],
          });
          topicOrder.push(topicGuid);
        }
        topicGroups.get(topicGuid).images.push(image);
      });

      // Second pass: flatten back to array grouped by topic
      processedImages = [];
      topicOrder.forEach((topicGuid, topicIndex) => {
        const group = topicGroups.get(topicGuid);

        // Mark where this topic starts (for page breaks)
        topicBreaks.push({
          startIndex: processedImages.length,
          topicTitle: group.topicTitle,
          topicGuid: topicGuid,
          imageCount: group.images.length,
        });

        processedImages.push(...group.images);
      });

      console.log(
        `📋 Grouped ${images.length} images into ${topicOrder.length} topics:`,
        topicBreaks.map((t) => `${t.topicTitle} (${t.imageCount} images)`)
      );
    } else {
      console.log(`📋 Using original image order (no grouping)`);
    }

    // Log first few images after processing for debugging
    if (processedImages.length > 0) {
      console.log('📋 First 5 images after processing:');
      processedImages.slice(0, 5).forEach((img, idx) => {
        console.log(`  ${idx + 1}. ${img.title} (Topic: ${img.topicGuid})`);
      });
    }

    return {
      images: processedImages,
      groupByTopic: groupByTopic,
      separatePages: separatePages,
      topicBreaks: topicBreaks, // Information about where topics start
      originalCount: images.length,
    };
  }

  /**
   * Cancel PDF dialog
   */
  cancelPDFDialog() {
    const dialog = document.getElementById('pdf-layout-dialog');
    if (dialog) {
      dialog.remove();
    }

    if (window.pdfLayoutResolve) {
      window.pdfLayoutResolve(null);
      delete window.pdfLayoutResolve;
    }
  }
}
