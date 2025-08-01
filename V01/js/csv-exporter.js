// CSV Exporter - Handles CSV generation from BCF data
class CSVExporter {
  static export(bcfDataArray) {
    if (!bcfDataArray || bcfDataArray.length === 0) {
      throw new Error('No BCF data to export');
    }

    // Collect all rows (topics + their comments)
    const allRows = [];

    bcfDataArray.forEach((bcfData) => {
      console.log(
        'Processing file:',
        bcfData.filename,
        'with',
        bcfData.topics.length,
        'topics'
      );
      bcfData.topics.forEach((topic) => {
        console.log(
          'Topic:',
          topic.title,
          'has',
          topic.comments ? topic.comments.length : 0,
          'comments'
        );

        // Add main topic row
        const topicRow = {
          rowType: 'topic',
          sourceFile: bcfData.filename,
          projectName: bcfData.project.name || 'Unknown',
          bcfVersion: bcfData.version || 'Unknown',
          ...topic,
        };
        allRows.push(topicRow);

        // Add comment rows underneath (sorted by date)
        if (topic.comments && topic.comments.length > 0) {
          const sortedComments = topic.comments.sort(
            (a, b) =>
              new Date(a.date || '1970-01-01') -
              new Date(b.date || '1970-01-01')
          );
          sortedComments.forEach((comment, index) => {
            const commentRow = {
              rowType: 'comment',
              sourceFile: bcfData.filename,
              topicGuid: topic.guid,
              commentNumber: index + 1,
              ...comment,
            };
            allRows.push(commentRow);
          });
        }
      });
    });

    if (allRows.length === 0) {
      throw new Error('No topics found in BCF files');
    }

    // Generate CSV content
    const headers = this.getCSVHeaders();
    const rows = allRows.map((row) => this.rowToCSVRow(row));

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => this.escapeCsvField(field)).join(','))
      .join('\n');

    return csvContent;
  }

  static getCSVHeaders() {
    return [
      'Row Type',
      'Source File',
      'Project Name',
      'BCF Version',
      'Topic GUID',
      'Title',
      'Description',
      'Status',
      'Type',
      'Priority',
      'Stage',
      'Labels',
      'Assigned To',
      'Creation Date',
      'Creation Author',
      'Modified Date',
      'Modified Author',
      'Due Date',
      'Comments Count',
      'Viewpoints Count',
      'Comment Number',
      'Comment Date',
      'Comment Author',
      'Comment Text',
      'Comment Status',
    ];
  }

  static rowToCSVRow(row) {
    if (row.rowType === 'topic') {
      return [
        'Topic',
        row.sourceFile || '',
        row.projectName || '',
        row.bcfVersion || '',
        row.guid || '',
        row.title || '',
        this.cleanDescription(row.description || ''),
        row.topicStatus || '',
        row.topicType || '',
        row.priority || '',
        row.stage || '',
        this.formatLabels(row.labels),
        row.assignedTo || '',
        this.formatDate(row.creationDate),
        row.creationAuthor || '',
        this.formatDate(row.modifiedDate),
        row.modifiedAuthor || '',
        this.formatDate(row.dueDate),
        row.comments ? row.comments.length : 0,
        row.viewpoints ? row.viewpoints.length : 0,
        '',
        '',
        '',
        '',
        '', // Empty comment fields for topic row
      ];
    } else if (row.rowType === 'comment') {
      return [
        'Comment', // Clean comment indicator
        '', // Empty source file for comments
        '', // Empty project name
        '', // Empty BCF version
        '', // Empty Topic GUID for visual hierarchy
        '', // Empty title
        '', // Empty description
        '', // Empty status
        '', // Empty type
        '', // Empty priority
        '', // Empty stage
        '', // Empty labels
        '', // Empty assigned to
        '', // Empty creation date
        '', // Empty creation author
        '', // Empty modified date
        '', // Empty modified author
        '', // Empty due date
        '', // Empty comments count
        '', // Empty viewpoints count
        row.commentNumber || '',
        this.formatDate(row.date) || 'No Date',
        row.author || 'Unknown Author',
        this.cleanDescription(row.comment || '') || 'No Comment Text',
        row.status || 'Unknown',
      ];
    }
  }

  static getLatestComment(comments) {
    if (!comments || comments.length === 0) {
      return null;
    }

    // Sort comments by date (most recent first)
    const sortedComments = comments
      .filter((comment) => comment.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return sortedComments.length > 0
      ? sortedComments[0]
      : comments[comments.length - 1];
  }

  static formatLabels(labels) {
    if (!labels || labels.length === 0) {
      return '';
    }
    return labels.filter((label) => label.trim()).join('; ');
  }

  static formatDate(dateString) {
    if (!dateString) {
      return '';
    }

    try {
      const date = new Date(dateString);
      // Return ISO date format (YYYY-MM-DD) for better compatibility
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return dateString; // Return original if can't parse
    }
  }

  static cleanDescription(description) {
    if (!description) {
      return '';
    }

    // Remove line breaks and extra whitespace for CSV compatibility
    return description.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  }

  static escapeCsvField(field) {
    // Convert to string and handle null/undefined
    const str = field === null || field === undefined ? '' : String(field);

    // If field contains comma, newline, or quote, wrap in quotes and escape quotes
    if (
      str.includes(',') ||
      str.includes('\n') ||
      str.includes('\r') ||
      str.includes('"')
    ) {
      return '"' + str.replace(/"/g, '""') + '"';
    }

    return str;
  }

  // Future method for generating summary statistics
  static generateSummary(bcfDataArray) {
    const summary = {
      totalFiles: bcfDataArray.length,
      totalTopics: 0,
      totalComments: 0,
      statusBreakdown: {},
      priorityBreakdown: {},
      authorBreakdown: {},
    };

    bcfDataArray.forEach((bcfData) => {
      bcfData.topics.forEach((topic) => {
        summary.totalTopics++;
        summary.totalComments += topic.comments ? topic.comments.length : 0;

        // Count statuses
        const status = topic.topicStatus || 'Unknown';
        summary.statusBreakdown[status] =
          (summary.statusBreakdown[status] || 0) + 1;

        // Count priorities
        const priority = topic.priority || 'Unknown';
        summary.priorityBreakdown[priority] =
          (summary.priorityBreakdown[priority] || 0) + 1;

        // Count authors
        const author = topic.creationAuthor || 'Unknown';
        summary.authorBreakdown[author] =
          (summary.authorBreakdown[author] || 0) + 1;
      });
    });

    return summary;
  }
}
