// Excel Exporter - Handles Excel (.xlsx) generation from BCF data
class ExcelExporter {
  static export(bcfDataArray) {
    if (!bcfDataArray || bcfDataArray.length === 0) {
      throw new Error('No BCF data to export');
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Build the professional Excel structure similar to RFI report
    const worksheetData = this.buildWorksheetData(bcfDataArray);

    // Create worksheet from the structured data
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Apply professional formatting
    this.formatWorksheet(worksheet, worksheetData.length);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BCF Report');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    return excelBuffer;
  }

  static buildWorksheetData(bcfDataArray) {
    const data = [];
    const today = new Date().toLocaleDateString();

    // Title row
    data.push([
      `BCF Analysis Report ${today}`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
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
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
    data.push([
      'Project(s):',
      projectNames.size === 1
        ? Array.from(projectNames)[0]
        : `${projectNames.size} projects`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
    data.push([
      'BCF Version(s):',
      Array.from(bcfVersions).join(', '),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
    data.push(['Total Topics:', totalTopics, '', '', '', '', '', '', '', '']);
    data.push([
      'Total Comments:',
      totalComments,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
    data.push([]); // Empty row

    // Main table headers
    data.push([
      'Topic #',
      'Title',
      'Status',
      'Priority',
      'Type',
      'Creation Date',
      'Author',
      'Assigned To',
      'Description',
      'Comments',
    ]);

    // Process each topic with professional spacing
    let topicNumber = 1;
    bcfDataArray.forEach((bcfData) => {
      bcfData.topics.forEach((topic) => {
        // Main topic row
        data.push([
          topicNumber,
          topic.title || 'Untitled',
          topic.topicStatus || 'Unknown',
          topic.priority || 'Normal',
          topic.topicType || 'Issue',
          this.formatDate(topic.creationDate),
          topic.creationAuthor || 'Unknown',
          topic.assignedTo || '',
          this.cleanDescription(topic.description || ''),
          topic.comments ? topic.comments.length : 0,
        ]);

        // Comments section (if any)
        if (topic.comments && topic.comments.length > 0) {
          // Comments header
          data.push([
            '',
            'Comments',
            'Author',
            'Date',
            'Comment Text',
            '',
            '',
            '',
            '',
            '',
          ]);

          // Sort comments by date
          const sortedComments = topic.comments.sort(
            (a, b) =>
              new Date(a.date || '1970-01-01') -
              new Date(b.date || '1970-01-01')
          );

          sortedComments.forEach((comment, index) => {
            data.push([
              '',
              `${index + 1}`,
              comment.author || 'Unknown',
              this.formatDate(comment.date) || 'No Date',
              this.cleanDescription(comment.comment || ''),
              '',
              '',
              '',
              '',
              '',
            ]);
          });
        }

        // Empty row for spacing between topics
        data.push([]);
        topicNumber++;
      });
    });

    return data;
  }

  static formatWorksheet(worksheet, rowCount) {
    // Set professional column widths similar to RFI report
    worksheet['!cols'] = [
      { wch: 12 }, // Topic #
      { wch: 35 }, // Title
      { wch: 15 }, // Status
      { wch: 12 }, // Priority
      { wch: 15 }, // Type
      { wch: 15 }, // Creation Date
      { wch: 25 }, // Author
      { wch: 20 }, // Assigned To
      { wch: 50 }, // Description
      { wch: 10 }, // Comments Count
    ];

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
      for (let c = 0; c < 10; c++) {
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
        for (let c = 2; c < 5; c++) {
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
      e: { c: 9, r: rowCount - 1 },
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
}
