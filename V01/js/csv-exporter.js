// CSV Exporter - Handles CSV generation from BCF data
class CSVExporter {
  static export(bcfDataArray, selectedFields = null) {
    if (!bcfDataArray || bcfDataArray.length === 0) {
      throw new Error('No BCF data to export');
    }

    // Use all fields if none selected
    if (!selectedFields || selectedFields.length === 0) {
      selectedFields = this.getAllFieldNames();
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
          topicGuid: topic.guid,
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
              commentDate: comment.date,
              commentAuthor: comment.author,
              commentText: comment.comment,
              commentStatus: comment.status,
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

    // Generate CSV content with selected fields only
    const headers = this.getCSVHeaders(selectedFields);
    const rows = allRows.map((row) => this.rowToCSVRow(row, selectedFields));

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => this.escapeCsvField(field)).join(','))
      .join('\n');

    return csvContent;
  }

  static getAllFieldNames() {
    return [
      'title',
      'description',
      'status',
      'type',
      'priority',
      'stage',
      'labels',
      'assignedTo',
      'creationDate',
      'creationAuthor',
      'modifiedDate',
      'modifiedAuthor',
      'dueDate',
      'sourceFile',
      'projectName',
      'bcfVersion',
      'topicGuid',
      'commentsCount',
      'viewpointsCount',
      'commentNumber',
      'commentDate',
      'commentAuthor',
      'commentText',
      'commentStatus',
    ];
  }

  static getCSVHeaders(selectedFields) {
    const fieldHeaderMap = {
      title: 'Title',
      description: 'Description',
      status: 'Status',
      type: 'Type',
      priority: 'Priority',
      stage: 'Stage',
      labels: 'Labels',
      assignedTo: 'Assigned To',
      creationDate: 'Creation Date',
      creationAuthor: 'Creation Author',
      modifiedDate: 'Modified Date',
      modifiedAuthor: 'Modified Author',
      dueDate: 'Due Date',
      sourceFile: 'Source File',
      projectName: 'Project Name',
      bcfVersion: 'BCF Version',
      topicGuid: 'Topic GUID',
      commentsCount: 'Comments Count',
      viewpointsCount: 'Viewpoints Count',
      commentNumber: 'Comment Number',
      commentDate: 'Comment Date',
      commentAuthor: 'Comment Author',
      commentText: 'Comment Text',
      commentStatus: 'Comment Status',
    };

    // Always include Row Type as first column
    const headers = ['Row Type'];

    selectedFields.forEach((field) => {
      if (fieldHeaderMap[field]) {
        headers.push(fieldHeaderMap[field]);
      }
    });

    return headers;
  }

  static rowToCSVRow(row, selectedFields) {
    const fieldMap = {
      title: row.title || '',
      description: this.cleanDescription(row.description || ''),
      status: row.topicStatus || '',
      type: row.topicType || '',
      priority: row.priority || '',
      stage: row.stage || '',
      labels: this.formatLabels(row.labels),
      assignedTo: row.assignedTo || '',
      creationDate: this.formatDate(row.creationDate),
      creationAuthor: row.creationAuthor || '',
      modifiedDate: this.formatDate(row.modifiedDate),
      modifiedAuthor: row.modifiedAuthor || '',
      dueDate: this.formatDate(row.dueDate),
      sourceFile: row.sourceFile || '',
      projectName: row.projectName || '',
      bcfVersion: row.bcfVersion || '',
      topicGuid: row.topicGuid || '',
      commentsCount: row.comments ? row.comments.length : 0,
      viewpointsCount: row.viewpoints ? row.viewpoints.length : 0,
      commentNumber: row.commentNumber || '',
      commentDate: this.formatDate(row.commentDate) || 'No Date',
      commentAuthor: row.commentAuthor || 'Unknown Author',
      commentText:
        this.cleanDescription(row.commentText || '') || 'No Comment Text',
      commentStatus: row.commentStatus || 'Unknown',
    };

    // Start with row type
    const csvRow = [row.rowType === 'topic' ? 'Topic' : 'Comment'];

    // Add selected fields in order
    selectedFields.forEach((field) => {
      if (row.rowType === 'topic') {
        // For topic rows, show topic data or empty for comment-specific fields
        if (
          [
            'commentNumber',
            'commentDate',
            'commentAuthor',
            'commentText',
            'commentStatus',
          ].includes(field)
        ) {
          csvRow.push('');
        } else {
          csvRow.push(fieldMap[field] || '');
        }
      } else {
        // For comment rows, show comment data or empty for topic-specific fields
        if (
          [
            'title',
            'description',
            'status',
            'type',
            'priority',
            'stage',
            'labels',
            'assignedTo',
            'creationDate',
            'creationAuthor',
            'modifiedDate',
            'modifiedAuthor',
            'dueDate',
            'sourceFile',
            'projectName',
            'bcfVersion',
            'commentsCount',
            'viewpointsCount',
          ].includes(field)
        ) {
          csvRow.push('');
        } else {
          csvRow.push(fieldMap[field] || '');
        }
      }
    });

    return csvRow;
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
