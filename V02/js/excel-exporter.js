// Import shared coordinate utilities
// Note: Ensure coordinate-utils.js is loaded before this file
// Excel Exporter - Handles Excel (.xlsx) generation from BCF data
class ExcelExporter {
  static export(bcfDataArray, selectedFields = null) {
    if (!bcfDataArray || bcfDataArray.length === 0) {
      throw new Error('No BCF data to export');
    }

    // Use all fields if none selected
    if (!selectedFields || selectedFields.length === 0) {
      selectedFields = this.getAllFieldNames();
    }

    if (typeof XLSX === 'undefined') {
      throw new Error(
        'The Excel library (SheetJS) failed to load. Check your internet connection and refresh the page.'
      );
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Build the professional Excel structure similar to RFI report
    const worksheetData = this.buildWorksheetData(bcfDataArray, selectedFields);

    // Create worksheet from the structured data
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Apply professional formatting
    this.formatWorksheet(worksheet, worksheetData.length, selectedFields);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BCF Report');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    return excelBuffer;
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

      // Legacy coordinate fields
      'cameraPosX',
      'cameraPosY',
      'cameraPosZ',
      'cameraTargetX',
      'cameraTargetY',
      'cameraTargetZ',
    ];
  }

  /**
   * Pads a row with empty strings up to the given width.
   * @param {Array} values - Leading cell values
   * @param {number} width - Total number of cells
   * @returns {Array} Padded row
   */
  static padRow(values, width) {
    return [...values, ...Array(Math.max(0, width - values.length)).fill('')];
  }

  /**
   * Totals files, topics, comments, project names and BCF versions across all files.
   * @param {Object[]} bcfDataArray - Parsed BCF files
   * @returns {{totalTopics: number, totalComments: number, projectNames: Set<string>, bcfVersions: Set<string>}}
   */
  static summarizeBcfData(bcfDataArray) {
    let totalTopics = 0;
    let totalComments = 0;
    const projectNames = new Set();
    const bcfVersions = new Set();

    bcfDataArray.forEach((bcfData) => {
      totalTopics += bcfData.topics.length;
      bcfData.topics.forEach((topic) => {
        totalComments += topic.comments ? topic.comments.length : 0;
      });
      if (bcfData.project.name) projectNames.add(bcfData.project.name);
      if (bcfData.version) bcfVersions.add(bcfData.version);
    });

    return { totalTopics, totalComments, projectNames, bcfVersions };
  }

  /**
   * Builds the report title row followed by an empty row.
   * @param {string[]} selectedFields - Selected field names
   * @returns {Array[]} Title rows
   */
  static buildTitleRows(selectedFields) {
    const today = new Date().toLocaleDateString();
    return [
      this.padRow([`BCF Analysis Report ${today}`], selectedFields.length + 1),
      [],
    ];
  }

  /**
   * Builds the project information rows (files, projects, versions, totals)
   * followed by an empty row.
   * @param {Object[]} bcfDataArray - Parsed BCF files
   * @param {string[]} selectedFields - Selected field names
   * @returns {Array[]} Summary rows
   */
  static buildSummaryRows(bcfDataArray, selectedFields) {
    const { totalTopics, totalComments, projectNames, bcfVersions } =
      this.summarizeBcfData(bcfDataArray);
    const width = selectedFields.length + 1;

    return [
      this.padRow(['Files processed:', bcfDataArray.length], width),
      this.padRow(
        [
          'Project(s):',
          projectNames.size === 1
            ? Array.from(projectNames)[0]
            : `${projectNames.size} projects`,
        ],
        width
      ),
      this.padRow(
        ['BCF Version(s):', Array.from(bcfVersions).join(', ')],
        width
      ),
      this.padRow(['Total Topics:', totalTopics], width),
      this.padRow(['Total Comments:', totalComments], width),
      [],
    ];
  }

  /**
   * Builds the viewpoint section of a topic: a header row and one row per
   * viewpoint with coordinate data (same filtering as the CSV export).
   * @param {Object} topic - Parsed topic
   * @param {string[]} selectedFields - Selected field names
   * @param {number} topicNumber - 1-based topic counter
   * @returns {Array[]} Section rows, empty if no viewpoint has coordinate data
   */
  static buildViewpointSection(topic, selectedFields, topicNumber) {
    const coordinateViewpoints = (topic.viewpoints || []).filter((viewpoint) =>
      CoordinateUtils.viewpointHasCoordinateData(viewpoint)
    );
    if (coordinateViewpoints.length === 0) {
      return [];
    }

    const headerRow = this.padRow(
      ['Viewpoint #', 'Coordinates', 'Camera Position', 'Camera Target', 'GUID'],
      selectedFields.length + 1
    );
    return [
      headerRow,
      ...coordinateViewpoints.map((viewpoint, index) =>
        this.buildViewpointRow(viewpoint, selectedFields, index + 1, topicNumber)
      ),
    ];
  }

  /**
   * Builds the comment section of a topic: a header row and one row per comment,
   * sorted by date. Only included when the commentNumber field is selected.
   * Sorts topic.comments in place.
   * @param {Object} topic - Parsed topic
   * @param {string[]} selectedFields - Selected field names
   * @param {number} topicNumber - 1-based topic counter
   * @returns {Array[]} Section rows, empty if not applicable
   */
  static buildCommentSection(topic, selectedFields, topicNumber) {
    if (
      !selectedFields.includes('commentNumber') ||
      !topic.comments ||
      topic.comments.length === 0
    ) {
      return [];
    }

    const headerRow = this.padRow(
      ['Comment #', 'Comments', 'Author', 'Date', 'Comment Text'],
      selectedFields.length + 1
    );
    const sortedComments = topic.comments.sort(
      (a, b) =>
        new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01')
    );
    return [
      headerRow,
      ...sortedComments.map((comment, index) =>
        this.buildCommentRow(comment, selectedFields, index + 1, topicNumber)
      ),
    ];
  }

  /**
   * Builds the worksheet rows: title, project summary, main table header, then
   * per topic the topic row, viewpoint section, comment section and a spacer row.
   * @param {Object[]} bcfDataArray - Parsed BCF files
   * @param {string[]} selectedFields - Selected field names
   * @returns {Array[]} Worksheet rows (array of arrays)
   */
  static buildWorksheetData(bcfDataArray, selectedFields) {
    const data = [
      ...this.buildTitleRows(selectedFields),
      ...this.buildSummaryRows(bcfDataArray, selectedFields),
      this.getExcelHeaders(selectedFields),
    ];
    // Viewpoint sections only when coordinate fields are selected (mirrors CSV)
    const includeViewpoints = selectedFields.some((field) =>
      CoordinateUtils.COORDINATE_FIELDS.includes(field)
    );

    let topicNumber = 1;
    bcfDataArray.forEach((bcfData) => {
      bcfData.topics.forEach((topic) => {
        data.push(
          this.buildTopicRow(topic, bcfData, selectedFields, topicNumber)
        );
        if (includeViewpoints) {
          data.push(
            ...this.buildViewpointSection(topic, selectedFields, topicNumber)
          );
        }
        data.push(
          ...this.buildCommentSection(topic, selectedFields, topicNumber)
        );

        // Empty row for spacing between topics
        data.push(Array(selectedFields.length + 1).fill(''));
        topicNumber++;
      });
    });

    return data;
  }

  static getExcelHeaders(selectedFields) {
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
      commentNumber: 'Comment #',
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

    const headers = ['Topic #'];
    selectedFields.forEach((field) => {
      if (fieldHeaderMap[field]) {
        headers.push(fieldHeaderMap[field]);
      }
    });

    return headers;
  }

  /** BCF camera vector types, each with X/Y/Z components. */
  static CAMERA_VECTORS = ['CameraViewPoint', 'CameraDirection', 'CameraUpVector'];

  /** Axis suffixes of the camera fields. */
  static AXES = ['X', 'Y', 'Z'];

  /** Legacy camera points: field-name prefix and viewpoint property. */
  static LEGACY_POINTS = [
    { prefix: 'cameraPos', key: 'cameraPosition' },
    { prefix: 'cameraTarget', key: 'cameraTarget' },
  ];

  /**
   * Builds a row: the row label followed by one cell per selected field.
   * Fields missing from the map (or with a falsy value) render blank.
   * @param {string} label - First column value (Topic # / hierarchical number)
   * @param {Object} fieldMap - Map of field name to cell value
   * @param {string[]} selectedFields - Selected field names, in column order
   * @returns {Array} Row values
   */
  static buildRowFromFieldMap(label, fieldMap, selectedFields) {
    const row = [label];
    selectedFields.forEach((field) => {
      row.push(fieldMap[field] || '');
    });

    return row;
  }

  /**
   * Builds the topic-level (non-camera) field map. Comment and viewpoint
   * index fields are omitted so they render blank on topic rows.
   * @param {Object} topic - Parsed topic
   * @param {Object} bcfData - Parsed BCF file the topic belongs to
   * @returns {Object} Map of field name to display value
   */
  static buildTopicInfoFieldMap(topic, bcfData) {
    return {
      title: topic.title || 'Untitled',
      description: this.cleanDescription(topic.description || ''),
      status: topic.topicStatus || 'Unknown',
      type: topic.topicType || 'Issue',
      topicIndex: topic.topicIndex || '',
      priority: topic.priority || 'Normal',
      stage: topic.stage || '',
      labels: this.formatLabels(topic.labels),
      assignedTo: topic.assignedTo || '',
      creationDate: this.formatDate(topic.creationDate),
      creationAuthor: topic.creationAuthor || 'Unknown',
      modifiedDate: this.formatDate(topic.modifiedDate),
      modifiedAuthor: topic.modifiedAuthor || '',
      dueDate: this.formatDate(topic.dueDate),
      sourceFile: bcfData.filename || '',
      projectName: bcfData.project.name || 'Unknown',
      bcfVersion: bcfData.version || 'Unknown',
      topicGuid: topic.guid || '',
      commentsCount: topic.comments ? topic.comments.length : 0,
      viewpointsCount: topic.viewpoints ? topic.viewpoints.length : 0,
      // Enhanced BCF 3.0 field mappings with comprehensive data handling
      serverAssignedId: topic.serverAssignedId || '',
      referenceLinks: this.formatReferenceLinksExcel(topic.referenceLinks),
      documentReferences: this.formatDocumentReferencesExcel(
        topic.documentReferences
      ),
      headerFiles: this.formatHeaderFilesExcel(topic.headerFiles),
    };
  }

  /**
   * Builds the camera field map for a topic row from its primary viewpoint.
   * @param {Object} topic - Parsed topic
   * @returns {Object} Map of camera field name to formatted value
   */
  static buildTopicCameraFieldMap(topic) {
    const fieldMap = {
      cameraType: this.getPrimaryViewpointProperty(topic, 'cameraType'),
      FieldOfView: this.getPrimaryViewpointProperty(topic, 'FieldOfView'),
      ViewToWorldScale: this.getPrimaryViewpointProperty(
        topic,
        'ViewToWorldScale'
      ),
    };

    this.CAMERA_VECTORS.forEach((type) => {
      this.AXES.forEach((axis) => {
        fieldMap[`${type}${axis}`] =
          CoordinateUtils.getPrimaryViewpointBCFCoordinate(topic, type, axis);
      });
    });

    // Legacy coordinate fields (using primary viewpoint logic)
    this.LEGACY_POINTS.forEach(({ prefix, key }) => {
      this.AXES.forEach((axis) => {
        fieldMap[`${prefix}${axis}`] =
          CoordinateUtils.getPrimaryViewpointCoordinate(
            topic,
            key,
            axis.toLowerCase()
          );
      });
    });

    return fieldMap;
  }

  /**
   * Builds the main topic row.
   * @param {Object} topic - Parsed topic
   * @param {Object} bcfData - Parsed BCF file the topic belongs to
   * @param {string[]} selectedFields - Selected field names
   * @param {number} topicNumber - 1-based topic counter
   * @returns {Array} Row values
   */
  static buildTopicRow(topic, bcfData, selectedFields, topicNumber) {
    const fieldMap = {
      ...this.buildTopicInfoFieldMap(topic, bcfData),
      ...this.buildTopicCameraFieldMap(topic),
    };

    // Topic number as string to prevent auto-formatting
    return this.buildRowFromFieldMap(
      topicNumber.toString(),
      fieldMap,
      selectedFields
    );
  }

  /**
   * Builds the field map for a viewpoint row: only the viewpoint index and
   * camera fields have values, all other fields render blank.
   * @param {Object} viewpoint - Parsed viewpoint
   * @returns {Object} Map of field name to formatted value
   */
  static buildViewpointFieldMap(viewpoint) {
    const format = (value) => CoordinateUtils.formatCoordinate(value);
    const fieldMap = {
      viewpointIndex: viewpoint.index || '',
      cameraType: viewpoint.cameraType || '',
      FieldOfView: format(viewpoint.FieldOfView),
      ViewToWorldScale: format(viewpoint.ViewToWorldScale),
    };

    this.CAMERA_VECTORS.forEach((type) => {
      this.AXES.forEach((axis) => {
        fieldMap[`${type}${axis}`] = format(viewpoint[type]?.[axis]);
      });
    });

    // Legacy coordinate fields (for backward compatibility)
    this.LEGACY_POINTS.forEach(({ prefix, key }) => {
      this.AXES.forEach((axis) => {
        fieldMap[`${prefix}${axis}`] = format(
          viewpoint[key]?.[axis.toLowerCase()]
        );
      });
    });

    return fieldMap;
  }

  /**
   * Builds a viewpoint row (labelled "<topic>.V<viewpoint>") with camera data only.
   * @param {Object} viewpoint - Parsed viewpoint
   * @param {string[]} selectedFields - Selected field names
   * @param {number} viewpointNumber - 1-based viewpoint counter within the topic
   * @param {number} topicNumber - 1-based topic counter
   * @returns {Array} Row values
   */
  static buildViewpointRow(
    viewpoint,
    selectedFields,
    viewpointNumber,
    topicNumber
  ) {
    return this.buildRowFromFieldMap(
      `${topicNumber}.V${viewpointNumber}`,
      this.buildViewpointFieldMap(viewpoint),
      selectedFields
    );
  }

  /**
   * Builds a comment row (labelled "<topic>.<comment>"); only comment fields have values.
   * @param {Object} comment - Parsed comment
   * @param {string[]} selectedFields - Selected field names
   * @param {number} commentNumber - 1-based comment counter within the topic
   * @param {number} topicNumber - 1-based topic counter
   * @returns {Array} Row values
   */
  static buildCommentRow(comment, selectedFields, commentNumber, topicNumber) {
    const fieldMap = {
      commentNumber: commentNumber,
      commentDate: this.formatDate(comment.date),
      commentAuthor: comment.author || 'Unknown',
      commentText: this.cleanDescription(comment.comment || ''),
      commentStatus: comment.status || '',
    };

    return this.buildRowFromFieldMap(
      `${topicNumber}.${commentNumber}`,
      fieldMap,
      selectedFields
    );
  }

  static formatLabels(labels) {
    if (!labels || labels.length === 0) {
      return '';
    }
    return labels.filter((label) => label.trim()).join('; ');
  }

  /** Column widths (in characters) grouped by field name. */
  static COLUMN_WIDTH_GROUPS = [
    { wch: 50, fields: ['title', 'description', 'commentText'] },
    { wch: 25, fields: ['creationAuthor', 'commentAuthor', 'assignedTo'] },
    {
      wch: 15,
      fields: [
        'status',
        'type',
        'priority',
        'stage',
        'creationDate',
        'modifiedDate',
        'dueDate',
        'commentDate',
        'cameraType',
        'FieldOfView',
        'ViewToWorldScale',
      ],
    },
    { wch: 30, fields: ['sourceFile', 'projectName'] },
    { wch: 40, fields: ['topicGuid'] },
    {
      // BCF coordinate and legacy coordinate fields - wider for precision
      wch: 18,
      fields: [
        'CameraViewPointX',
        'CameraViewPointY',
        'CameraViewPointZ',
        'CameraDirectionX',
        'CameraDirectionY',
        'CameraDirectionZ',
        'CameraUpVectorX',
        'CameraUpVectorY',
        'CameraUpVectorZ',
        'cameraPosX',
        'cameraPosY',
        'cameraPosZ',
        'cameraTargetX',
        'cameraTargetY',
        'cameraTargetZ',
      ],
    },
  ];

  /** Width (in characters) for fields not listed in COLUMN_WIDTH_GROUPS. */
  static DEFAULT_COLUMN_WIDTH = 12;

  /**
   * Gets the column width setting for a field.
   * @param {string} field - Field name
   * @returns {{wch: number}} SheetJS column width object
   */
  static getColumnWidth(field) {
    const group = this.COLUMN_WIDTH_GROUPS.find((g) =>
      g.fields.includes(field)
    );
    return { wch: group ? group.wch : this.DEFAULT_COLUMN_WIDTH };
  }

  /**
   * Builds the worksheet column widths: Topic # column first, then one per field.
   * @param {string[]} selectedFields - Selected field names
   * @returns {Array<{wch: number}>} Column width settings
   */
  static buildColumnWidths(selectedFields) {
    return [
      { wch: 12 }, // Topic # column
      ...selectedFields.map((field) => this.getColumnWidth(field)),
    ];
  }

  /**
   * Scans the top rows of the sheet for the report title row and the main table header row.
   * @param {Object} worksheet - SheetJS worksheet
   * @param {number} rowCount - Total number of rows
   * @returns {{titleRowIndex: number, headerRowIndex: number}} Row indexes, -1 if not found
   */
  static findLayoutRows(worksheet, rowCount) {
    let titleRowIndex = -1;
    let headerRowIndex = -1;

    for (let r = 0; r < Math.min(15, rowCount); r++) {
      const cellA = worksheet[XLSX.utils.encode_cell({ r, c: 0 })];
      if (cellA && cellA.v && typeof cellA.v === 'string') {
        if (cellA.v.includes('BCF Analysis Report')) {
          titleRowIndex = r;
        } else if (cellA.v === 'Topic #') {
          headerRowIndex = r;
        }
      }
    }

    return { titleRowIndex, headerRowIndex };
  }

  /**
   * Styles the report title cell (bold, larger).
   * @param {Object} worksheet - SheetJS worksheet
   * @param {number} titleRowIndex - Title row index, -1 to skip
   */
  static styleTitleRow(worksheet, titleRowIndex) {
    if (titleRowIndex < 0) {
      return;
    }

    const titleCell =
      worksheet[XLSX.utils.encode_cell({ r: titleRowIndex, c: 0 })];
    if (titleCell) {
      titleCell.s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'left' },
      };
    }
  }

  /**
   * Styles the project information rows (label cells bold, value cells left-aligned).
   * @param {Object} worksheet - SheetJS worksheet
   * @param {number} rowCount - Total number of rows
   */
  static styleProjectInfoRows(worksheet, rowCount) {
    for (let r = 2; r < Math.min(8, rowCount); r++) {
      const cellA = worksheet[XLSX.utils.encode_cell({ r, c: 0 })];
      const cellB = worksheet[XLSX.utils.encode_cell({ r, c: 1 })];

      if (
        cellA &&
        cellA.v &&
        (cellA.v.includes(':') ||
          cellA.v.includes('processed') ||
          cellA.v.includes('Total'))
      ) {
        cellA.s = {
          font: { bold: true },
          alignment: { horizontal: 'left' },
        };

        if (cellB) {
          cellB.s = {
            alignment: { horizontal: 'left' },
          };
        }
      }
    }
  }

  /**
   * Styles the main table header row (bold, centered, shaded, bordered).
   * @param {Object} worksheet - SheetJS worksheet
   * @param {number} headerRowIndex - Header row index, -1 to skip
   * @param {number} fieldCount - Number of selected fields
   */
  static styleHeaderRow(worksheet, headerRowIndex, fieldCount) {
    if (headerRowIndex < 0) {
      return;
    }

    for (let c = 0; c < fieldCount + 1; c++) {
      const headerCell =
        worksheet[XLSX.utils.encode_cell({ r: headerRowIndex, c })];
      if (headerCell) {
        headerCell.s = {
          font: { bold: true },
          alignment: { horizontal: 'center' },
          fill: { fgColor: { rgb: 'E6E6FA' } }, // Light purple background
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
        };
      }
    }
  }

  /**
   * Left-aligns the Topic # column (column A) below the header row.
   * @param {Object} worksheet - SheetJS worksheet
   * @param {number} headerRowIndex - Header row index
   * @param {number} rowCount - Total number of rows
   */
  static styleTopicNumberColumn(worksheet, headerRowIndex, rowCount) {
    for (let r = headerRowIndex + 1; r < rowCount; r++) {
      const topicNumberCell = worksheet[XLSX.utils.encode_cell({ r, c: 0 })];
      if (topicNumberCell && topicNumberCell.v) {
        topicNumberCell.s = {
          alignment: { horizontal: 'left' },
          font: { bold: false },
        };
      }
    }
  }

  /**
   * Styles the "Comments" section header rows (bold italic).
   * @param {Object} worksheet - SheetJS worksheet
   * @param {number} headerRowIndex - Header row index
   * @param {number} rowCount - Total number of rows
   * @param {number} fieldCount - Number of selected fields
   */
  static styleCommentHeaderRows(
    worksheet,
    headerRowIndex,
    rowCount,
    fieldCount
  ) {
    for (let r = headerRowIndex + 1; r < rowCount; r++) {
      const cellB = worksheet[XLSX.utils.encode_cell({ r, c: 1 })];
      if (cellB && cellB.v === 'Comments') {
        cellB.s = {
          font: { bold: true, italic: true },
          alignment: { horizontal: 'left' },
        };

        // Style the other header cells in this row
        for (let c = 2; c < Math.min(5, fieldCount + 1); c++) {
          const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
          if (cell) {
            cell.s = {
              font: { bold: true, italic: true },
              alignment: { horizontal: 'left' },
            };
          }
        }
      }
    }
  }

  /**
   * Applies column widths, cell styles and the data range to the worksheet.
   * @param {Object} worksheet - SheetJS worksheet
   * @param {number} rowCount - Total number of rows
   * @param {string[]} selectedFields - Selected field names
   */
  static formatWorksheet(worksheet, rowCount, selectedFields) {
    worksheet['!cols'] = this.buildColumnWidths(selectedFields);

    const { titleRowIndex, headerRowIndex } = this.findLayoutRows(
      worksheet,
      rowCount
    );
    this.styleTitleRow(worksheet, titleRowIndex);
    this.styleProjectInfoRows(worksheet, rowCount);
    this.styleHeaderRow(worksheet, headerRowIndex, selectedFields.length);
    this.styleTopicNumberColumn(worksheet, headerRowIndex, rowCount);
    this.styleCommentHeaderRows(
      worksheet,
      headerRowIndex,
      rowCount,
      selectedFields.length
    );

    // Set the range to include all data
    worksheet['!ref'] = XLSX.utils.encode_range({
      s: { c: 0, r: 0 },
      e: { c: selectedFields.length, r: rowCount - 1 },
    });
  }

  // Utility methods for clean formatting
  static formatDate(dateString) {
    if (!dateString) {
      return '';
    }

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return dateString;
    }
  }

  static cleanDescription(description) {
    if (!description) {
      return '';
    }

    // Clean but preserve readability for Excel
    return description.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Format reference links for Excel export
   */
  static formatReferenceLinksExcel(referenceLinks) {
    if (!referenceLinks || referenceLinks.length === 0) {
      return '';
    }

    // For Excel, use line breaks between multiple links for better readability
    return referenceLinks
      .filter((link) => link && link.trim())
      .map((link) => link.trim())
      .join('\n');
  }

  /**
   * Format header files for Excel export
   */
  static formatHeaderFilesExcel(headerFiles) {
    if (!headerFiles || headerFiles.length === 0) {
      return '';
    }

    // Format each file with details for Excel readability
    return headerFiles
      .filter((file) => file.filename || file.reference)
      .map((file) => {
        const parts = [];
        if (file.filename) parts.push(`File: ${file.filename}`);
        if (file.reference) parts.push(`Ref: ${file.reference}`);
        if (file.ifcProject) parts.push(`IFC: ${file.ifcProject}`);
        return parts.join(' | ');
      })
      .join('\n');
  }

  /**
   * Format BCF 3.0 DocumentReferences for Excel export
   * Uses line breaks for better readability in Excel cells
   */
  static formatDocumentReferencesExcel(documentReferences) {
    if (!documentReferences || documentReferences.length === 0) {
      return '';
    }

    // Format each document reference with detailed information for Excel
    return documentReferences
      .filter((docRef) => docRef.guid || docRef.documentGuid || docRef.url)
      .map((docRef) => {
        const parts = [];

        // Add the main document identifier
        if (docRef.documentGuid) {
          parts.push(`Document GUID: ${docRef.documentGuid}`);
        } else if (docRef.url) {
          parts.push(`URL: ${docRef.url}`);
        }

        // Add description
        if (docRef.description) {
          parts.push(`Description: ${docRef.description}`);
        }

        // Add reference GUID if different
        if (docRef.guid && docRef.guid !== docRef.documentGuid) {
          parts.push(`Reference ID: ${docRef.guid}`);
        }

        return parts.join(' | ');
      })
      .join('\n'); // Use line breaks for Excel readability
  }

  /**
   * Get property value from primary viewpoint (replaces getFirstViewpointProperty)
   */
  static getPrimaryViewpointProperty(topic, propertyName) {
    const primaryViewpoint = CoordinateUtils.getPrimaryViewpoint(topic);
    if (!primaryViewpoint) {
      return '';
    }

    if (
      primaryViewpoint[propertyName] !== null &&
      primaryViewpoint[propertyName] !== undefined
    ) {
      return primaryViewpoint[propertyName];
    }

    return '';
  }
}
