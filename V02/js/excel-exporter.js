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

  static buildWorksheetData(bcfDataArray, selectedFields) {
    const data = [];
    const today = new Date().toLocaleDateString();

    // Title row
    data.push([
      `BCF Analysis Report ${today}`,
      ...Array(selectedFields.length).fill(''),
    ]);
    data.push([]); // Empty row

    // Project information section
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

    data.push([
      'Files processed:',
      bcfDataArray.length,
      ...Array(selectedFields.length - 1).fill(''),
    ]);
    data.push([
      'Project(s):',
      projectNames.size === 1
        ? Array.from(projectNames)[0]
        : `${projectNames.size} projects`,
      ...Array(selectedFields.length - 1).fill(''),
    ]);
    data.push([
      'BCF Version(s):',
      Array.from(bcfVersions).join(', '),
      ...Array(selectedFields.length - 1).fill(''),
    ]);
    data.push([
      'Total Topics:',
      totalTopics,
      ...Array(selectedFields.length - 1).fill(''),
    ]);
    data.push([
      'Total Comments:',
      totalComments,
      ...Array(selectedFields.length - 1).fill(''),
    ]);
    data.push([]); // Empty row

    // Main table headers
    const headers = this.getExcelHeaders(selectedFields);
    data.push(headers);

    // Process each topic with professional spacing
    let topicNumber = 1;
    bcfDataArray.forEach((bcfData) => {
      bcfData.topics.forEach((topic) => {
        // Main topic row
        const topicRow = this.buildTopicRow(
          topic,
          bcfData,
          selectedFields,
          topicNumber
        );
        data.push(topicRow);

        // Viewpoint coordinates section (if coordinate fields are selected and viewpoints exist)
        // This mirrors the CSV logic exactly for consistency
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

        console.log('📊 Excel viewpoint processing:', {
          topicTitle: topic.title,
          hasCoordinateFields: hasCoordinateFields,
          viewpointCount: topic.viewpoints ? topic.viewpoints.length : 0,
          selectedCoordinateFields: selectedFields.filter((field) =>
            coordinateFields.includes(field)
          ),
        });

        if (
          hasCoordinateFields &&
          topic.viewpoints &&
          topic.viewpoints.length > 0
        ) {
          // Use same comprehensive filtering as CSV (detect ANY coordinate data)
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
            `📊 Excel found ${coordinateViewpoints.length} viewpoints with coordinate data`
          );

          if (coordinateViewpoints.length > 0) {
            // Viewpoint coordinates header
            const viewpointHeaderRow = [
              'Viewpoint #',
              'Coordinates',
              'Camera Position',
              'Camera Target',
              'GUID',
            ];
            // Pad to match selected fields length
            while (viewpointHeaderRow.length < selectedFields.length + 1) {
              viewpointHeaderRow.push('');
            }
            data.push(viewpointHeaderRow);

            coordinateViewpoints.forEach((viewpoint, index) => {
              const viewpointRow = this.buildViewpointRow(
                viewpoint,
                selectedFields,
                index + 1,
                topicNumber
              );
              data.push(viewpointRow);
            });
          }
        }

        // Comments section (if commentNumber field is selected and comments exist)
        if (
          selectedFields.includes('commentNumber') &&
          topic.comments &&
          topic.comments.length > 0
        ) {
          // Comments header
          const commentHeaderRow = [
            'Comment #',
            'Comments',
            'Author',
            'Date',
            'Comment Text',
          ];
          // Pad to match selected fields length
          while (commentHeaderRow.length < selectedFields.length + 1) {
            commentHeaderRow.push('');
          }
          data.push(commentHeaderRow);

          // Sort comments by date
          const sortedComments = topic.comments.sort(
            (a, b) =>
              new Date(a.date || '1970-01-01') -
              new Date(b.date || '1970-01-01')
          );

          sortedComments.forEach((comment, index) => {
            const commentRow = this.buildCommentRow(
              comment,
              selectedFields,
              index + 1,
              topicNumber // Pass topic number for hierarchical numbering
            );
            data.push(commentRow);
          });
        }

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

  static buildTopicRow(topic, bcfData, selectedFields, topicNumber) {
    const fieldMap = {
      title: topic.title || 'Untitled',
      description: this.cleanDescription(topic.description || ''),
      status: topic.topicStatus || 'Unknown',
      type: topic.topicType || 'Issue',
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
      commentNumber: '', // Empty for topic rows
      commentDate: '', // Empty for topic rows
      commentAuthor: '', // Empty for topic rows
      commentText: '', // Empty for topic rows
      commentStatus: '', // Empty for topic rows
      // Enhanced BCF 3.0 field mappings with comprehensive data handling
      serverAssignedId: topic.serverAssignedId || '',
      referenceLinks: this.formatReferenceLinksExcel(topic.referenceLinks),
      documentReferences: this.formatDocumentReferencesExcel(
        topic.documentReferences
      ),
      headerFiles: this.formatHeaderFilesExcel(topic.headerFiles),
      viewpointIndex: '', // Empty for topic rows

      // Complete BCF camera field mappings (use primary viewpoint like comments)
      cameraType: this.getPrimaryViewpointProperty(topic, 'cameraType'),
      CameraViewPointX: CoordinateUtils.getPrimaryViewpointBCFCoordinate(
        topic,
        'CameraViewPoint',
        'X'
      ),
      CameraViewPointY: CoordinateUtils.getPrimaryViewpointBCFCoordinate(
        topic,
        'CameraViewPoint',
        'Y'
      ),
      CameraViewPointZ: CoordinateUtils.getPrimaryViewpointBCFCoordinate(
        topic,
        'CameraViewPoint',
        'Z'
      ),
      CameraDirectionX: CoordinateUtils.getPrimaryViewpointBCFCoordinate(
        topic,
        'CameraDirection',
        'X'
      ),
      CameraDirectionY: CoordinateUtils.getPrimaryViewpointBCFCoordinate(
        topic,
        'CameraDirection',
        'Y'
      ),
      CameraDirectionZ: CoordinateUtils.getPrimaryViewpointBCFCoordinate(
        topic,
        'CameraDirection',
        'Z'
      ),
      CameraUpVectorX: CoordinateUtils.getPrimaryViewpointBCFCoordinate(
        topic,
        'CameraUpVector',
        'X'
      ),
      CameraUpVectorY: CoordinateUtils.getPrimaryViewpointBCFCoordinate(
        topic,
        'CameraUpVector',
        'Y'
      ),
      CameraUpVectorZ: CoordinateUtils.getPrimaryViewpointBCFCoordinate(
        topic,
        'CameraUpVector',
        'Z'
      ),
      FieldOfView: this.getPrimaryViewpointProperty(topic, 'FieldOfView'),
      ViewToWorldScale: this.getPrimaryViewpointProperty(
        topic,
        'ViewToWorldScale'
      ),

      // Legacy coordinate field mappings (using new primary viewpoint logic)
      cameraPosX: CoordinateUtils.getPrimaryViewpointCoordinate(
        topic,
        'cameraPosition',
        'x'
      ),
      cameraPosY: CoordinateUtils.getPrimaryViewpointCoordinate(
        topic,
        'cameraPosition',
        'y'
      ),
      cameraPosZ: CoordinateUtils.getPrimaryViewpointCoordinate(
        topic,
        'cameraPosition',
        'z'
      ),
      cameraTargetX: CoordinateUtils.getPrimaryViewpointCoordinate(
        topic,
        'cameraTarget',
        'x'
      ),
      cameraTargetY: CoordinateUtils.getPrimaryViewpointCoordinate(
        topic,
        'cameraTarget',
        'y'
      ),
      cameraTargetZ: CoordinateUtils.getPrimaryViewpointCoordinate(
        topic,
        'cameraTarget',
        'z'
      ),
    };

    const row = [topicNumber.toString()]; // Convert to string to prevent auto-formatting
    selectedFields.forEach((field) => {
      row.push(fieldMap[field] || '');
    });

    return row;
  }

  static buildViewpointRow(
    viewpoint,
    selectedFields,
    viewpointNumber,
    topicNumber
  ) {
    const fieldMap = {
      title: '', // Empty for viewpoint rows
      description: '', // Empty for viewpoint rows
      status: '', // Empty for viewpoint rows
      type: '', // Empty for viewpoint rows
      priority: '', // Empty for viewpoint rows
      stage: '', // Empty for viewpoint rows
      labels: '', // Empty for viewpoint rows
      assignedTo: '', // Empty for viewpoint rows
      creationDate: '', // Empty for viewpoint rows
      creationAuthor: '', // Empty for viewpoint rows
      modifiedDate: '', // Empty for viewpoint rows
      modifiedAuthor: '', // Empty for viewpoint rows
      dueDate: '', // Empty for viewpoint rows
      sourceFile: '', // Empty for viewpoint rows
      projectName: '', // Empty for viewpoint rows
      bcfVersion: '', // Empty for viewpoint rows
      topicGuid: '', // Empty for viewpoint rows
      commentsCount: '', // Empty for viewpoint rows
      viewpointsCount: '', // Empty for viewpoint rows
      commentNumber: '', // Empty for viewpoint rows
      commentDate: '', // Empty for viewpoint rows
      commentAuthor: '', // Empty for viewpoint rows
      commentText: '', // Empty for viewpoint rows
      commentStatus: '', // Empty for viewpoint rows

      // BCF 3.0 fields (empty for viewpoint rows except viewpointIndex)
      serverAssignedId: '',
      referenceLinks: '',
      documentReferences: '',
      headerFiles: '',
      viewpointIndex: viewpoint.index || '',

      // Complete BCF camera field mappings - all 18 coordinate fields
      cameraType: viewpoint.cameraType || '',
      CameraViewPointX: CoordinateUtils.formatCoordinate(
        viewpoint.CameraViewPoint?.X
      ),
      CameraViewPointY: CoordinateUtils.formatCoordinate(
        viewpoint.CameraViewPoint?.Y
      ),
      CameraViewPointZ: CoordinateUtils.formatCoordinate(
        viewpoint.CameraViewPoint?.Z
      ),
      CameraDirectionX: CoordinateUtils.formatCoordinate(
        viewpoint.CameraDirection?.X
      ),
      CameraDirectionY: CoordinateUtils.formatCoordinate(
        viewpoint.CameraDirection?.Y
      ),
      CameraDirectionZ: CoordinateUtils.formatCoordinate(
        viewpoint.CameraDirection?.Z
      ),
      CameraUpVectorX: CoordinateUtils.formatCoordinate(
        viewpoint.CameraUpVector?.X
      ),
      CameraUpVectorY: CoordinateUtils.formatCoordinate(
        viewpoint.CameraUpVector?.Y
      ),
      CameraUpVectorZ: CoordinateUtils.formatCoordinate(
        viewpoint.CameraUpVector?.Z
      ),
      FieldOfView: CoordinateUtils.formatCoordinate(viewpoint.FieldOfView),
      ViewToWorldScale: CoordinateUtils.formatCoordinate(
        viewpoint.ViewToWorldScale
      ),

      // Legacy coordinate field mappings (for backward compatibility)
      cameraPosX: CoordinateUtils.formatCoordinate(viewpoint.cameraPosition?.x),
      cameraPosY: CoordinateUtils.formatCoordinate(viewpoint.cameraPosition?.y),
      cameraPosZ: CoordinateUtils.formatCoordinate(viewpoint.cameraPosition?.z),
      cameraTargetX: CoordinateUtils.formatCoordinate(
        viewpoint.cameraTarget?.x
      ),
      cameraTargetY: CoordinateUtils.formatCoordinate(
        viewpoint.cameraTarget?.y
      ),
      cameraTargetZ: CoordinateUtils.formatCoordinate(
        viewpoint.cameraTarget?.z
      ),
    };

    const row = [`${topicNumber}.V${viewpointNumber}`]; // V for viewpoint
    selectedFields.forEach((field) => {
      row.push(fieldMap[field] || '');
    });

    return row;
  }

  static buildCommentRow(comment, selectedFields, commentNumber, topicNumber) {
    const fieldMap = {
      title: '', // Empty for comment rows
      description: '', // Empty for comment rows
      status: '', // Empty for comment rows
      type: '', // Empty for comment rows
      priority: '', // Empty for comment rows
      stage: '', // Empty for comment rows
      labels: '', // Empty for comment rows
      assignedTo: '', // Empty for comment rows
      creationDate: '', // Empty for comment rows
      creationAuthor: '', // Empty for comment rows
      modifiedDate: '', // Empty for comment rows
      modifiedAuthor: '', // Empty for comment rows
      dueDate: '', // Empty for comment rows
      sourceFile: '', // Empty for comment rows
      projectName: '', // Empty for comment rows
      bcfVersion: '', // Empty for comment rows
      topicGuid: '', // Empty for comment rows
      commentsCount: '', // Empty for comment rows
      viewpointsCount: '', // Empty for comment rows
      commentNumber: commentNumber,
      commentDate: this.formatDate(comment.date),
      commentAuthor: comment.author || 'Unknown',
      commentText: this.cleanDescription(comment.comment || ''),
      commentStatus: comment.status || '',

      // BCF 3.0 fields (empty for comment rows)
      serverAssignedId: '',
      referenceLinks: '',
      headerFiles: '',
      viewpointIndex: '',

      // Viewpoint coordinate field mappings (empty for comment rows)
      cameraPosX: '',
      cameraPosY: '',
      cameraPosZ: '',
      cameraTargetX: '',
      cameraTargetY: '',
      cameraTargetZ: '',
    };

    const row = [`${topicNumber}.${commentNumber}`]; // Comment numbering
    selectedFields.forEach((field) => {
      row.push(fieldMap[field] || '');
    });

    return row;
  }

  static formatLabels(labels) {
    if (!labels || labels.length === 0) {
      return '';
    }
    return labels.filter((label) => label.trim()).join('; ');
  }

  static formatWorksheet(worksheet, rowCount, selectedFields) {
    // Set professional column widths
    const colWidths = [{ wch: 12 }]; // Topic # column

    selectedFields.forEach((field) => {
      switch (field) {
        case 'title':
        case 'description':
        case 'commentText':
          colWidths.push({ wch: 50 });
          break;
        case 'creationAuthor':
        case 'commentAuthor':
        case 'assignedTo':
          colWidths.push({ wch: 25 });
          break;
        case 'status':
        case 'type':
        case 'priority':
        case 'stage':
          colWidths.push({ wch: 15 });
          break;
        case 'creationDate':
        case 'modifiedDate':
        case 'dueDate':
        case 'commentDate':
          colWidths.push({ wch: 15 });
          break;
        case 'sourceFile':
        case 'projectName':
          colWidths.push({ wch: 30 });
          break;
        case 'topicGuid':
          colWidths.push({ wch: 40 });
          break;
        // Camera type field
        case 'cameraType':
          colWidths.push({ wch: 15 });
          break;
        // BCF coordinate fields - wider columns for precision
        case 'CameraViewPointX':
        case 'CameraViewPointY':
        case 'CameraViewPointZ':
        case 'CameraDirectionX':
        case 'CameraDirectionY':
        case 'CameraDirectionZ':
        case 'CameraUpVectorX':
        case 'CameraUpVectorY':
        case 'CameraUpVectorZ':
          colWidths.push({ wch: 18 });
          break;
        // Camera properties
        case 'FieldOfView':
        case 'ViewToWorldScale':
          colWidths.push({ wch: 15 });
          break;
        // Legacy coordinate fields
        case 'cameraPosX':
        case 'cameraPosY':
        case 'cameraPosZ':
        case 'cameraTargetX':
        case 'cameraTargetY':
        case 'cameraTargetZ':
          colWidths.push({ wch: 18 });
          break;
        default:
          colWidths.push({ wch: 12 });
      }
    });

    worksheet['!cols'] = colWidths;

    // Find title row, project info section, and main headers for styling
    let titleRowIndex = -1;
    let headerRowIndex = -1;

    // Scan for the title and header rows
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

    // Apply professional formatting
    if (titleRowIndex >= 0) {
      // Title row formatting - bold and larger
      const titleCell =
        worksheet[XLSX.utils.encode_cell({ r: titleRowIndex, c: 0 })];
      if (titleCell) {
        titleCell.s = {
          font: { bold: true, sz: 14 },
          alignment: { horizontal: 'left' },
        };
      }
    }

    // Format project info section (rows 3-7 typically)
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
        // Format label cells (column A)
        cellA.s = {
          font: { bold: true },
          alignment: { horizontal: 'left' },
        };

        // Format value cells (column B)
        if (cellB) {
          cellB.s = {
            alignment: { horizontal: 'left' },
          };
        }
      }
    }

    // Format main table headers
    if (headerRowIndex >= 0) {
      for (let c = 0; c < selectedFields.length + 1; c++) {
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

    // Format main table headers
    if (headerRowIndex >= 0) {
      for (let c = 0; c < selectedFields.length + 1; c++) {
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

    // ADDED: Format Topic # column (column A) to be left-aligned
    for (let r = headerRowIndex + 1; r < rowCount; r++) {
      const topicNumberCell = worksheet[XLSX.utils.encode_cell({ r, c: 0 })];
      if (topicNumberCell && topicNumberCell.v) {
        topicNumberCell.s = {
          alignment: { horizontal: 'left' }, // Left-align topic numbers
          font: { bold: false },
        };
      }
    }

    // Format comment section headers
    for (let r = headerRowIndex + 1; r < rowCount; r++) {
      const cellB = worksheet[XLSX.utils.encode_cell({ r, c: 1 })];
      if (cellB && cellB.v === 'Comments') {
        // Style comment section header
        cellB.s = {
          font: { bold: true, italic: true },
          alignment: { horizontal: 'left' },
        };

        // Style the other header cells in this row
        for (let c = 2; c < Math.min(5, selectedFields.length + 1); c++) {
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

    // Set the range to include all data
    const range = XLSX.utils.encode_range({
      s: { c: 0, r: 0 },
      e: { c: selectedFields.length, r: rowCount - 1 },
    });
    worksheet['!ref'] = range;
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

    console.log(
      '📄 Formatting document references for Excel:',
      documentReferences.length
    );

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
