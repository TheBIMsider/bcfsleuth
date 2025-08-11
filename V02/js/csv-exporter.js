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

    let topicNumber = 1; // Add topic counter

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

        // Add main topic row with primary viewpoint's BCF data (same logic as comments)
        const topicRow = {
          rowType: 'topic',
          topicNumber: topicNumber,
          sourceFile: bcfData.filename,
          projectName: bcfData.project.name || 'Unknown',
          bcfVersion: bcfData.version || 'Unknown',
          topicGuid: topic.guid,
          ...topic,
        };

        // Add primary viewpoint's BCF camera data to topic row
        // Priority: 1) viewpoint.bcfv, 2) first viewpoint with coordinates
        if (topic.viewpoints && topic.viewpoints.length > 0) {
          console.log(`🎯 Finding primary viewpoint for topic: ${topic.title}`);

          // Method 1: Look for the main viewpoint.bcfv file (highest priority)
          let primaryViewpoint = topic.viewpoints.find((vp) => {
            return (
              vp.viewpointFile === 'viewpoint.bcfv' ||
              vp.guid === 'viewpoint-generic' ||
              (vp.viewpointFile &&
                vp.viewpointFile.toLowerCase().includes('viewpoint.bcfv'))
            );
          });

          // Method 2: If no main viewpoint.bcfv, use first viewpoint with camera data
          if (!primaryViewpoint) {
            primaryViewpoint = topic.viewpoints.find((vp) => {
              return vp.cameraType || vp.CameraViewPoint || vp.cameraPosition;
            });
          }

          // Method 3: Last resort - use any viewpoint
          if (!primaryViewpoint && topic.viewpoints.length > 0) {
            primaryViewpoint = topic.viewpoints[0];
          }

          if (primaryViewpoint) {
            console.log(
              `📍 Using primary viewpoint: ${primaryViewpoint.guid} (${
                primaryViewpoint.viewpointFile || 'no file'
              })`
            );

            // Add ALL BCF camera data to the main topic row
            topicRow.cameraType = primaryViewpoint.cameraType || '';
            topicRow.CameraViewPointX =
              primaryViewpoint.CameraViewPoint?.X ?? null;
            topicRow.CameraViewPointY =
              primaryViewpoint.CameraViewPoint?.Y ?? null;
            topicRow.CameraViewPointZ =
              primaryViewpoint.CameraViewPoint?.Z ?? null;
            topicRow.CameraDirectionX =
              primaryViewpoint.CameraDirection?.X ?? null;
            topicRow.CameraDirectionY =
              primaryViewpoint.CameraDirection?.Y ?? null;
            topicRow.CameraDirectionZ =
              primaryViewpoint.CameraDirection?.Z ?? null;
            topicRow.CameraUpVectorX =
              primaryViewpoint.CameraUpVector?.X ?? null;
            topicRow.CameraUpVectorY =
              primaryViewpoint.CameraUpVector?.Y ?? null;
            topicRow.CameraUpVectorZ =
              primaryViewpoint.CameraUpVector?.Z ?? null;
            topicRow.FieldOfView = primaryViewpoint.FieldOfView ?? null;
            topicRow.ViewToWorldScale =
              primaryViewpoint.ViewToWorldScale ?? null;

            // Add legacy coordinate data for backward compatibility
            topicRow.cameraPosX = primaryViewpoint.cameraPosition?.x ?? null;
            topicRow.cameraPosY = primaryViewpoint.cameraPosition?.y ?? null;
            topicRow.cameraPosZ = primaryViewpoint.cameraPosition?.z ?? null;
            topicRow.cameraTargetX = primaryViewpoint.cameraTarget?.x ?? null;
            topicRow.cameraTargetY = primaryViewpoint.cameraTarget?.y ?? null;
            topicRow.cameraTargetZ = primaryViewpoint.cameraTarget?.z ?? null;

            console.log('📍 Added complete BCF camera data to topic row:', {
              topicGuid: topic.guid,
              cameraType: topicRow.cameraType,
              CameraViewPointX: topicRow.CameraViewPointX,
              CameraViewPointY: topicRow.CameraViewPointY,
              CameraViewPointZ: topicRow.CameraViewPointZ,
              hasLegacyCoords: topicRow.cameraPosX !== null,
            });
          }
        }

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
              topicNumber: `${topicNumber}.${index + 1}`, // Add comment numbering
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

        // Add viewpoint coordinate rows (only if coordinate fields are selected)
        // This works exactly like comments - create separate rows for each viewpoint
        const coordinateFields = [
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
        ];
        const hasCoordinateFields = selectedFields.some((field) =>
          coordinateFields.includes(field)
        );

        console.log('🔍 CSV Export Debug:', {
          topicTitle: topic.title,
          selectedFields: selectedFields.length,
          hasCoordinateFields: hasCoordinateFields,
          viewpointCount: topic.viewpoints ? topic.viewpoints.length : 0,
          selectedCoordinateFields: selectedFields.filter((field) =>
            coordinateFields.includes(field)
          ),
        });

        // Create viewpoint rows for ALL viewpoints with coordinate data (like multiple comments)
        if (
          hasCoordinateFields &&
          topic.viewpoints &&
          topic.viewpoints.length > 0
        ) {
          // Filter viewpoints that have ANY coordinate data (more comprehensive check)
          const coordinateViewpoints = topic.viewpoints.filter((viewpoint) => {
            return (
              // Check for BCF camera data
              viewpoint.cameraType ||
              (viewpoint.CameraViewPoint &&
                (viewpoint.CameraViewPoint.X !== null ||
                  viewpoint.CameraViewPoint.Y !== null ||
                  viewpoint.CameraViewPoint.Z !== null)) ||
              (viewpoint.CameraDirection &&
                (viewpoint.CameraDirection.X !== null ||
                  viewpoint.CameraDirection.Y !== null ||
                  viewpoint.CameraDirection.Z !== null)) ||
              (viewpoint.CameraUpVector &&
                (viewpoint.CameraUpVector.X !== null ||
                  viewpoint.CameraUpVector.Y !== null ||
                  viewpoint.CameraUpVector.Z !== null)) ||
              viewpoint.FieldOfView !== null ||
              viewpoint.ViewToWorldScale !== null ||
              // Check for legacy coordinate data
              (viewpoint.cameraPosition &&
                (viewpoint.cameraPosition.x !== null ||
                  viewpoint.cameraPosition.y !== null ||
                  viewpoint.cameraPosition.z !== null)) ||
              (viewpoint.cameraTarget &&
                (viewpoint.cameraTarget.x !== null ||
                  viewpoint.cameraTarget.y !== null ||
                  viewpoint.cameraTarget.z !== null))
            );
          });

          console.log(
            `📍 Found ${coordinateViewpoints.length} viewpoints with coordinate data for topic: ${topic.title}`
          );

          coordinateViewpoints.forEach((viewpoint, index) => {
            const viewpointRow = {
              rowType: 'viewpoint',
              topicNumber: `${topicNumber}.V${index + 1}`,
              sourceFile: bcfData.filename,
              projectName: bcfData.project.name || 'Unknown',
              bcfVersion: bcfData.version || 'Unknown',
              topicGuid: topic.guid,
              viewpointNumber: index + 1,
              viewpointGuid: viewpoint.guid || '',

              // Add complete BCF camera data
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

            allRows.push(viewpointRow);

            console.log(
              `📍 Added viewpoint row ${index + 1}/${
                coordinateViewpoints.length
              }:`,
              {
                topicNumber: viewpointRow.topicNumber,
                viewpointGuid: viewpointRow.viewpointGuid,
                cameraType: viewpointRow.cameraType,
                hasCoordinates: !!(
                  viewpointRow.CameraViewPointX || viewpointRow.cameraPosX
                ),
                viewpointFile: viewpoint.viewpointFile || 'unknown',
              }
            );
          });
        }

        topicNumber++; // Increment topic counter after each topic
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
      // Existing BCF 2.x fields
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

      // Complete BCF camera field mappings
      cameraType: row.cameraType || '',
      CameraViewPointX: this.formatCoordinate(row.CameraViewPointX),
      CameraViewPointY: this.formatCoordinate(row.CameraViewPointY),
      CameraViewPointZ: this.formatCoordinate(row.CameraViewPointZ),
      CameraDirectionX: this.formatCoordinate(row.CameraDirectionX),
      CameraDirectionY: this.formatCoordinate(row.CameraDirectionY),
      CameraDirectionZ: this.formatCoordinate(row.CameraDirectionZ),
      CameraUpVectorX: this.formatCoordinate(row.CameraUpVectorX),
      CameraUpVectorY: this.formatCoordinate(row.CameraUpVectorY),
      CameraUpVectorZ: this.formatCoordinate(row.CameraUpVectorZ),
      FieldOfView: this.formatCoordinate(row.FieldOfView),
      ViewToWorldScale: this.formatCoordinate(row.ViewToWorldScale),

      // Legacy coordinate field mappings
      cameraPosX: this.formatCoordinate(row.cameraPosX),
      cameraPosY: this.formatCoordinate(row.cameraPosY),
      cameraPosZ: this.formatCoordinate(row.cameraPosZ),
      cameraTargetX: this.formatCoordinate(row.cameraTargetX),
      cameraTargetY: this.formatCoordinate(row.cameraTargetY),
      cameraTargetZ: this.formatCoordinate(row.cameraTargetZ),
    };

    // Start with row type and topic number
    let rowTypeDisplay = 'Topic';
    if (row.rowType === 'comment') {
      rowTypeDisplay = 'Comment';
    } else if (row.rowType === 'viewpoint') {
      rowTypeDisplay = 'Viewpoint';
    }

    const csvRow = [
      rowTypeDisplay,
      row.topicNumber || '', // Add topic number as second column
    ];

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
      } else if (row.rowType === 'comment') {
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
            'cameraPosX',
            'cameraPosY',
            'cameraPosZ',
            'cameraTargetX',
            'cameraTargetY',
            'cameraTargetZ',
          ].includes(field)
        ) {
          csvRow.push('');
        } else {
          csvRow.push(fieldMap[field] || '');
        }
      } else if (row.rowType === 'viewpoint') {
        // For viewpoint rows, show coordinate data and basic metadata only
        const coordinateFields = [
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
        ];
        const metadataFields = [
          'sourceFile',
          'projectName',
          'bcfVersion',
          'topicGuid',
        ];
        const viewpointSpecificFields = [
          'viewpointsCount', // Show this for viewpoint rows
        ];

        if (
          coordinateFields.includes(field) ||
          metadataFields.includes(field) ||
          viewpointSpecificFields.includes(field)
        ) {
          csvRow.push(fieldMap[field] || '');
        } else {
          csvRow.push(''); // Empty for topic/comment specific fields
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

    console.log(
      '📄 Formatting document references for CSV:',
      documentReferences.length
    );

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

  /**
   * Format coordinate values for CSV export
   * Handles null/undefined values and rounds to 3 decimal places
   */
  static formatCoordinate(value) {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return '';
    }

    // Round to 3 decimal places for reasonable precision
    return numValue.toFixed(3);
  }
}
