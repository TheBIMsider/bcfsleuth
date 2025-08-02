// BCFSleuth - Main Application Logic
class BCFSleuthApp {
  constructor() {
    this.selectedFiles = [];
    this.parsedData = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
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

    // Enable Excel export button
    document.getElementById('export-excel').disabled = false;
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
      const csvData = CSVExporter.export(this.parsedData);
      this.downloadFile(csvData, 'bcf-export.csv', 'text/csv');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      this.showError(`Error exporting CSV: ${error.message}`);
    }
  }

  exportExcel() {
    try {
      const excelBuffer = ExcelExporter.export(this.parsedData);
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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new BCFSleuthApp();
});
