// CSV Exporter - Handles CSV generation from BCF data
class CSVExporter {
  /** Comment-specific fields, blank on topic rows. */
  static COMMENT_FIELDS = [
    'commentNumber',
    'commentDate',
    'commentAuthor',
    'commentText',
    'commentStatus',
  ];

  /** Topic-level and legacy coordinate fields, blank on comment rows. */
  static COMMENT_ROW_HIDDEN_FIELDS = [
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
    'cameraPosX',
    'cameraPosY',
    'cameraPosZ',
    'cameraTargetX',
    'cameraTargetY',
    'cameraTargetZ',
  ];

  /** Metadata fields shown on viewpoint rows besides the coordinate fields. */
  static VIEWPOINT_ROW_FIELDS = [
    'sourceFile',
    'projectName',
    'bcfVersion',
    'topicGuid',
    'viewpointsCount',
  ];

  /**
   * Exports BCF data to CSV text: one row per topic, followed by its comment
   * rows and (when coordinate fields are selected) its viewpoint rows.
   * @param {Object[]} bcfDataArray - Parsed BCF files
   * @param {string[]|null} selectedFields - Field names to include (all if empty)
   * @returns {string} CSV content
   * @throws {Error} If there is no data or no topics
   */
  static export(bcfDataArray, selectedFields = null) {
    if (!bcfDataArray || bcfDataArray.length === 0) {
      throw new Error('No BCF data to export');
    }

    // Use all fields if none selected
    if (!selectedFields || selectedFields.length === 0) {
      selectedFields = this.getAllFieldNames();
    }

    const allRows = this.collectExportRows(bcfDataArray, selectedFields);

    if (allRows.length === 0) {
      throw new Error('No topics found in BCF files');
    }

    // Generate CSV content with selected fields only
    const headers = this.getCSVHeaders(selectedFields);
    const rows = allRows.map((row) => this.rowToCSVRow(row, selectedFields));

    // Combine headers and rows
    return [headers, ...rows]
      .map((row) => row.map((field) => this.escapeCsvField(field)).join(','))
      .join('\n');
  }

  /**
   * Flattens all topics into ordered export rows (topic, comments, viewpoints).
   * @param {Object[]} bcfDataArray - Parsed BCF files
   * @param {string[]} selectedFields - Selected field names
   * @returns {Object[]} Flat rows in output order
   */
  static collectExportRows(bcfDataArray, selectedFields) {
    const allRows = [];
    const includeViewpointRows = selectedFields.some((field) =>
      CoordinateUtils.COORDINATE_FIELDS.includes(field)
    );
    let topicNumber = 1;

    bcfDataArray.forEach((bcfData) => {
      bcfData.topics.forEach((topic) => {
        allRows.push(this.buildTopicRow(bcfData, topic, topicNumber));
        allRows.push(...this.buildCommentRows(bcfData, topic, topicNumber));
        if (includeViewpointRows) {
          allRows.push(...this.buildViewpointRows(bcfData, topic, topicNumber));
        }
        topicNumber++;
      });
    });

    return allRows;
  }

  /**
   * Builds the main topic row, including the primary viewpoint's camera data.
   * @param {Object} bcfData - Parsed BCF file the topic belongs to
   * @param {Object} topic - Topic to export
   * @param {number} topicNumber - 1-based topic counter
   * @returns {Object} Topic row
   */
  static buildTopicRow(bcfData, topic, topicNumber) {
    const topicRow = {
      rowType: 'topic',
      topicNumber: topicNumber,
      sourceFile: bcfData.filename,
      projectName: bcfData.project.name || 'Unknown',
      bcfVersion: bcfData.version || 'Unknown',
      topicGuid: topic.guid,
      ...topic,
    };

    const primaryViewpoint = CoordinateUtils.getPrimaryViewpoint(topic);
    if (primaryViewpoint) {
      Object.assign(topicRow, this.extractCameraFields(primaryViewpoint));
    }

    return topicRow;
  }

  /**
   * Extracts the complete BCF camera data plus legacy position/target from a viewpoint.
   * @param {Object} viewpoint - Parsed viewpoint
   * @returns {Object} Flat camera fields keyed by COORDINATE_FIELDS names
   */
  static extractCameraFields(viewpoint) {
    return {
      cameraType: viewpoint.cameraType || '',
      CameraViewPointX: viewpoint.CameraViewPoint?.X ?? null,
      CameraViewPointY: viewpoint.CameraViewPoint?.Y ?? null,
      CameraViewPointZ: viewpoint.CameraViewPoint?.Z ?? null,
      CameraDirectionX: viewpoint.CameraDirection?.X ?? null,
      CameraDirectionY: viewpoint.CameraDirection?.Y ?? null,
      CameraDirectionZ: viewpoint.CameraDirection?.Z ?? null,
      CameraUpVectorX: viewpoint.CameraUpVector?.X ?? null,
      CameraUpVectorY: viewpoint.CameraUpVector?.Y ?? null,
      CameraUpVectorZ: viewpoint.CameraUpVector?.Z ?? null,
      FieldOfView: viewpoint.FieldOfView ?? null,
      ViewToWorldScale: viewpoint.ViewToWorldScale ?? null,

      // Legacy coordinate data for backward compatibility
      cameraPosX: viewpoint.cameraPosition?.x ?? null,
      cameraPosY: viewpoint.cameraPosition?.y ?? null,
      cameraPosZ: viewpoint.cameraPosition?.z ?? null,
      cameraTargetX: viewpoint.cameraTarget?.x ?? null,
      cameraTargetY: viewpoint.cameraTarget?.y ?? null,
      cameraTargetZ: viewpoint.cameraTarget?.z ?? null,
    };
  }

  /**
   * Builds comment rows for a topic, sorted by date. Sorts topic.comments in place.
   * @param {Object} bcfData - Parsed BCF file the topic belongs to
   * @param {Object} topic - Topic whose comments to export
   * @param {number} topicNumber - 1-based topic counter
   * @returns {Object[]} Comment rows
   */
  static buildCommentRows(bcfData, topic, topicNumber) {
    if (!topic.comments || topic.comments.length === 0) {
      return [];
    }

    const sortedComments = topic.comments.sort(
      (a, b) =>
        new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01')
    );
    return sortedComments.map((comment, index) => ({
      rowType: 'comment',
      topicNumber: `${topicNumber}.${index + 1}`,
      sourceFile: bcfData.filename,
      topicGuid: topic.guid,
      commentNumber: index + 1,
      commentDate: comment.date,
      commentAuthor: comment.author,
      commentText: comment.comment,
      commentStatus: comment.status,
      ...comment,
    }));
  }

  /**
   * Builds one row per viewpoint that has coordinate data (like multiple comments).
   * @param {Object} bcfData - Parsed BCF file the topic belongs to
   * @param {Object} topic - Topic whose viewpoints to export
   * @param {number} topicNumber - 1-based topic counter
   * @returns {Object[]} Viewpoint rows
   */
  static buildViewpointRows(bcfData, topic, topicNumber) {
    if (!topic.viewpoints || topic.viewpoints.length === 0) {
      return [];
    }

    return topic.viewpoints
      .filter((viewpoint) => CoordinateUtils.viewpointHasCoordinateData(viewpoint))
      .map((viewpoint, index) => ({
        rowType: 'viewpoint',
        topicNumber: `${topicNumber}.V${index + 1}`,
        sourceFile: bcfData.filename,
        projectName: bcfData.project.name || 'Unknown',
        bcfVersion: bcfData.version || 'Unknown',
        topicGuid: topic.guid,
        viewpointNumber: index + 1,
        viewpointGuid: viewpoint.guid || '',
        ...this.extractCameraFields(viewpoint),
      }));
  }

  static getAllFieldNames() {
    return [
      // Existing BCF 2.x fields
      'title',
      'description',
      'status',
      'type',
      'topicIndex',
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

      // NEW: BCF 3.0 fields
      'serverAssignedId',
      'referenceLinks',
      'headerFiles',
      'viewpointIndex',

      // NEW: Viewpoint coordinate fields (all BCF versions)
      'cameraPosX',
      'cameraPosY',
      'cameraPosZ',
      'cameraTargetX',
      'cameraTargetY',
      'cameraTargetZ',

      // NEW: Complete BCF camera fields (all BCF versions)
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
    ];
  }

  static getCSVHeaders(selectedFields) {
    const fieldHeaderMap = {
      title: 'Title',
      description: 'Description',
      status: 'Status',
      type: 'Type',
      topicIndex: 'Topic Index',
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
      // Enhanced BCF 3.0 field header mappings
      serverAssignedId: 'Server Assigned ID',
      referenceLinks: 'Reference Links',
      documentReferences: 'Document References',
      headerFiles: 'Header Files',
      viewpointIndex: 'Viewpoint Index',
      // Complete BCF camera field headers
      cameraType: 'Camera Type',
      CameraViewPointX: 'CameraViewPoint X',
      CameraViewPointY: 'CameraViewPoint Y',
      CameraViewPointZ: 'CameraViewPoint Z',
      CameraDirectionX: 'CameraDirection X',
      CameraDirectionY: 'CameraDirection Y',
      CameraDirectionZ: 'CameraDirection Z',
      CameraUpVectorX: 'CameraUpVector X',
      CameraUpVectorY: 'CameraUpVector Y',
      CameraUpVectorZ: 'CameraUpVector Z',
      FieldOfView: 'FieldOfView',
      ViewToWorldScale: 'ViewToWorldScale',

      // Legacy coordinate field headers
      cameraPosX: 'Camera Position X (Legacy)',
      cameraPosY: 'Camera Position Y (Legacy)',
      cameraPosZ: 'Camera Position Z (Legacy)',
      cameraTargetX: 'Camera Target X (Legacy)',
      cameraTargetY: 'Camera Target Y (Legacy)',
      cameraTargetZ: 'Camera Target Z (Legacy)',
    };

    // Always include Row Type and Topic # as first columns
    const headers = ['Row Type', 'Topic #'];

    selectedFields.forEach((field) => {
      if (fieldHeaderMap[field]) {
        headers.push(fieldHeaderMap[field]);
      }
    });

    return headers;
  }

  /**
   * Builds the field-to-display-value lookup for the non-camera fields of a row.
   * @param {Object} row - Flat export row (topic, comment or viewpoint)
   * @returns {Object} Map of field name to formatted value
   */
  static buildTopicFieldMap(row) {
    return {
      title: row.title || '',
      description: this.cleanDescription(row.description || ''),
      status: row.topicStatus || '',
      type: row.topicType || '',
      topicIndex: row.topicIndex || '',
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
      // Enhanced BCF 3.0 field mappings with proper data extraction
      serverAssignedId: row.serverAssignedId || '',
      referenceLinks: this.formatReferenceLinks(
        row.referenceLinks || row._originalTopic?.referenceLinks
      ),
      documentReferences: this.formatDocumentReferences(
        row.documentReferences || row._originalTopic?.documentReferences
      ),
      headerFiles: this.formatHeaderFiles(
        row.headerFiles || row._originalTopic?.headerFiles
      ),
      viewpointIndex: row.viewpointIndex || '',
    };
  }

  /**
   * Builds the field-to-display-value lookup for the camera/coordinate fields.
   * @param {Object} row - Flat export row (topic, comment or viewpoint)
   * @returns {Object} Map of camera field name to formatted value
   */
  static buildCameraFieldMap(row) {
    const fieldMap = { cameraType: row.cameraType || '' };
    CoordinateUtils.COORDINATE_FIELDS.forEach((field) => {
      if (field !== 'cameraType') {
        fieldMap[field] = CoordinateUtils.formatCoordinate(row[field]);
      }
    });
    return fieldMap;
  }

  /**
   * Gets the display label for a row type in the "Row Type" column.
   * @param {string} rowType - 'topic', 'comment' or 'viewpoint'
   * @returns {string} 'Topic', 'Comment' or 'Viewpoint'
   */
  static getRowTypeLabel(rowType) {
    if (rowType === 'comment') {
      return 'Comment';
    }
    if (rowType === 'viewpoint') {
      return 'Viewpoint';
    }
    return 'Topic';
  }

  /**
   * Decides whether a field is blanked out for the given row type.
   * Topic rows hide comment fields, comment rows hide topic and legacy
   * coordinate fields, viewpoint rows show only coordinate/metadata fields.
   * @param {string} rowType - 'topic', 'comment' or 'viewpoint'
   * @param {string} field - Field name
   * @returns {boolean|null} True to blank the cell, null for an unknown row type
   */
  static isFieldHiddenForRow(rowType, field) {
    if (rowType === 'topic') {
      return this.COMMENT_FIELDS.includes(field);
    }
    if (rowType === 'comment') {
      return this.COMMENT_ROW_HIDDEN_FIELDS.includes(field);
    }
    if (rowType === 'viewpoint') {
      return !(
        CoordinateUtils.COORDINATE_FIELDS.includes(field) ||
        this.VIEWPOINT_ROW_FIELDS.includes(field)
      );
    }
    return null;
  }

  /**
   * Converts a flat export row into an array of CSV cell values.
   * @param {Object} row - Flat export row (topic, comment or viewpoint)
   * @param {string[]} selectedFields - Field names to include, in order
   * @returns {Array} Cell values starting with Row Type and Topic #
   */
  static rowToCSVRow(row, selectedFields) {
    const fieldMap = {
      ...this.buildTopicFieldMap(row),
      ...this.buildCameraFieldMap(row),
    };

    const csvRow = [this.getRowTypeLabel(row.rowType), row.topicNumber || ''];

    // Add selected fields in order
    selectedFields.forEach((field) => {
      const hidden = this.isFieldHiddenForRow(row.rowType, field);
      if (hidden === null) {
        return;
      }
      csvRow.push(hidden ? '' : fieldMap[field] || '');
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

  /**
   * Format reference links for CSV export
   * BCF 3.0 can have multiple reference links per topic
   */
  static formatReferenceLinks(referenceLinks) {
    if (!referenceLinks || referenceLinks.length === 0) {
      return '';
    }

    // Join multiple links with semicolon separator
    return referenceLinks
      .filter((link) => link && link.trim())
      .map((link) => link.trim())
      .join('; ');
  }

  /**
   * Format header files for CSV export
   * BCF 3.0 can have multiple files referenced in the header
   */
  static formatHeaderFiles(headerFiles) {
    if (!headerFiles || headerFiles.length === 0) {
      return '';
    }

    // Format each file as "filename (reference)"
    return headerFiles
      .filter((file) => file.filename || file.reference)
      .map((file) => {
        const filename = file.filename || 'Unknown';
        const reference = file.reference || '';
        return reference ? `${filename} (${reference})` : filename;
      })
      .join('; ');
  }

  /**
   * Format BCF 3.0 DocumentReferences for CSV export
   * Handles the new DocumentReferences structure with DocumentGuid vs Url
   */
  static formatDocumentReferences(documentReferences) {
    if (!documentReferences || documentReferences.length === 0) {
      return '';
    }

    // Format each document reference with its key information
    return documentReferences
      .filter((docRef) => docRef.guid || docRef.documentGuid || docRef.url)
      .map((docRef) => {
        const parts = [];

        // Add the main identifier (DocumentGuid or Url)
        if (docRef.documentGuid) {
          parts.push(`Doc: ${docRef.documentGuid}`);
        } else if (docRef.url) {
          parts.push(`URL: ${docRef.url}`);
        }

        // Add description if available
        if (docRef.description) {
          parts.push(`Desc: ${docRef.description}`);
        }

        // Add GUID if different from DocumentGuid
        if (docRef.guid && docRef.guid !== docRef.documentGuid) {
          parts.push(`ID: ${docRef.guid}`);
        }

        return parts.join(' | ');
      })
      .join('; ');
  }
}
