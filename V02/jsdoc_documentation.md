# JSDoc Documentation for BCFSleuth Utilities

This document provides comprehensive JSDoc comments for all utility modules and optimized methods in BCFSleuth. Add these comments to their respective files to maintain professional documentation standards.

## js/utils/coordinate-utils.js

```javascript
/**
 * @fileoverview Centralized coordinate handling utilities for BCF files
 * Provides unified coordinate extraction, formatting, and processing across all BCF versions
 * @author BCFSleuth Development Team
 * @version 2.0.0
 */

/**
 * Coordinate utilities for BCF file processing
 * Handles all coordinate operations including extraction, formatting, and validation
 * @namespace CoordinateUtils
 */
const CoordinateUtils = {

    /**
     * Formats a coordinate value to 3 decimal places
     * @param {number|string} value - The coordinate value to format
     * @returns {string} Formatted coordinate value with 3 decimal precision
     * @example
     * CoordinateUtils.formatCoordinate(123.456789) // Returns "123.457"
     */
    formatCoordinate(value) {
        // Implementation...
    },

    /**
     * Gets the primary viewpoint from a topic's viewpoint collection
     * Uses intelligent selection based on availability and BCF version
     * @param {Object} topic - BCF topic object containing viewpoints
     * @returns {Object|null} Primary viewpoint object or null if none found
     */
    getPrimaryViewpoint(topic) {
        // Implementation...
    },

    /**
     * Extracts specific BCF coordinate value from primary viewpoint
     * @param {Object} topic - BCF topic object
     * @param {string} type - Coordinate type (camera_world_position, camera_direction, etc.)
     * @param {string} axis - Coordinate axis (x, y, z)
     * @returns {string} Formatted coordinate value or empty string
     * @example
     * CoordinateUtils.getPrimaryViewpointBCFCoordinate(topic, 'camera_world_position', 'x')
     */
    getPrimaryViewpointBCFCoordinate(topic, type, axis) {
        // Implementation...
    },

    /**
     * Checks if a topic contains any coordinate data
     * @param {Object} topic - BCF topic object to check
     * @returns {boolean} True if coordinate data is available
     */
    hasCoordinateData(topic) {
        // Implementation...
    }
};
```

## js/utils/pdf-utils.js

```javascript
/**
 * @fileoverview Centralized PDF generation utilities for BCFSleuth
 * Provides consistent PDF creation, formatting, and content management
 * @author BCFSleuth Development Team
 * @version 2.0.0
 */

/**
 * PDF generation utilities for report creation
 * Handles standardized PDF formatting, cover pages, and content layout
 * @namespace PDFUtils
 */
const PDFUtils = {

    /**
     * Adds a standardized cover page to PDF document
     * @param {Object} pdf - jsPDF document instance
     * @param {string} reportType - Type of report (Grid, Detailed, Summary)
     * @param {number} imageCount - Total number of images in report
     * @param {string} projectName - Name of the project
     * @param {Object} stats - Project statistics object
     * @returns {Object} Modified PDF document with cover page
     */
    addStandardizedCoverPage(pdf, reportType, imageCount, projectName, stats) {
        // Implementation...
    },

    /**
     * Wraps text to fit within specified width in PDF
     * @param {Object} pdf - jsPDF document instance
     * @param {string} text - Text to wrap
     * @param {number} maxWidth - Maximum width for text wrapping
     * @returns {Array<string>} Array of text lines that fit within width
     */
    wrapTextForPDF(pdf, text, maxWidth) {
        // Implementation...
    },

    /**
     * Generates consistent PDF filename based on project and report type
     * @param {string} projectName - Project name for filename
     * @param {string} reportType - Type of report being generated
     * @param {Date} date - Date for filename timestamp
     * @returns {string} Formatted filename string
     * @example
     * PDFUtils.generatePDFFilename("Project ABC", "Detailed", new Date())
     * // Returns "Project_ABC_Detailed_Report_2025-08-14.pdf"
     */
    generatePDFFilename(projectName, reportType, date) {
        // Implementation...
    },

    /**
     * Safely adds image to PDF with error handling
     * @param {Object} pdf - jsPDF document instance
     * @param {string} imageData - Base64 image data
     * @param {number} x - X position for image placement
     * @param {number} y - Y position for image placement
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {boolean} True if image was successfully added
     */
    addImageToPDF(pdf, imageData, x, y, width, height) {
        // Implementation...
    },

    /**
     * Truncates text to specified length with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum character length
     * @returns {string} Truncated text with ellipsis if needed
     */
    truncateText(text, maxLength) {
        // Implementation...
    },

    /**
     * Sanitizes filename by removing invalid characters
     * @param {string} filename - Filename to sanitize
     * @returns {string} Sanitized filename safe for file system
     */
    sanitizeFilename(filename) {
        // Implementation...
    }
};
```

## js/utils/color-manager.js

```javascript
/**
 * @fileoverview Centralized color management system for BCFSleuth
 * Provides consistent, accessible colors across charts, analytics, and UI elements
 * @author BCFSleuth Development Team
 * @version 2.0.0
 */

/**
 * Color management system for consistent application theming
 * Handles status colors, priority colors, and chart palette generation
 * @namespace ColorManager
 */
const ColorManager = {

    /**
     * Gets distinct colors for a set of values with context awareness
     * @param {Array} values - Array of values needing color assignment
     * @param {string} context - Context for color selection (status, priority, generic)
     * @returns {Array<string>} Array of color values in same order as input values
     * @example
     * ColorManager.getDistinctColors(['Open', 'Closed'], 'status')
     * // Returns ['#e74c3c', '#27ae60'] - red for open, green for closed
     */
    getDistinctColors(values, context) {
        // Implementation...
    },

    /**
     * Gets status-specific colors for BCF status values
     * @param {Array<string>} statuses - Array of status strings
     * @returns {Array<string>} Array of colors optimized for status visualization
     */
    getStatusColors(statuses) {
        // Implementation...
    },

    /**
     * Gets priority-specific colors for BCF priority values
     * @param {Array<string>} priorities - Array of priority strings
     * @returns {Array<string>} Array of colors optimized for priority visualization
     */
    getPriorityColors(priorities) {
        // Implementation...
    },

    /**
     * Generates Chart.js compatible color palette
     * @param {number} count - Number of colors needed
     * @param {number} alpha - Alpha transparency value (0-1)
     * @returns {Array<string>} Array of rgba color strings for Chart.js
     * @example
     * ColorManager.generateChartPalette(3, 0.8)
     * // Returns ['rgba(231, 76, 60, 0.8)', 'rgba(52, 152, 219, 0.8)', ...]
     */
    generateChartPalette(count, alpha) {
        // Implementation...
    }
};
```

## js/bcf-parser.js - Optimized Methods

```javascript
/**
 * Extracts and processes topic labels from BCF data
 * @param {Object} topicData - Raw topic data from BCF parsing
 * @param {Object} topic - Topic object to populate with label data
 * @returns {void} Modifies topic object in place
 * @private
 */
function extractTopicLabels(topicData, topic) {
    // Implementation...
}

/**
 * Processes custom fields for a BCF topic
 * @param {Object} topicData - Raw topic data containing custom fields
 * @param {Object} topic - Topic object to populate
 * @returns {void} Modifies topic object in place
 * @private
 */
function processTopicCustomFields(topicData, topic) {
    // Implementation...
}

/**
 * Processes viewpoint coordinate data for a topic
 * @param {Object} topic - Topic object to process
 * @param {Object} zip - JSZip instance containing BCF data
 * @returns {Promise<void>} Async processing of viewpoint coordinates
 * @private
 */
async function processTopicViewpoints(topic, zip) {
    // Implementation...
}

/**
 * Initializes topic data structure with basic BCF information
 * @param {Object} topicData - Raw topic data from BCF file
 * @returns {Object} Initialized topic object with basic data
 * @private
 */
function initializeTopicData(topicData) {
    // Implementation...
}

/**
 * Discovers image files associated with a BCF topic
 * @param {string} topicId - Unique identifier for the topic
 * @param {Object} zip - JSZip instance containing BCF data
 * @returns {Array<string>} Array of image file paths found for topic
 * @private
 */
function discoverTopicImageFiles(topicId, zip) {
    // Implementation...
}

/**
 * Matches viewpoints to their corresponding image files
 * @param {Array} viewpoints - Array of viewpoint objects
 * @param {Array<string>} imageFiles - Array of discovered image file paths
 * @returns {Array} Enhanced viewpoints with matched image references
 * @private
 */
function matchViewpointsToImages(viewpoints, imageFiles) {
    // Implementation...
}

/**
 * Extracts and stores image data for a topic
 * @param {Object} topic - Topic object to populate with image data
 * @param {Array<string>} imageFiles - Array of image file paths
 * @param {Object} zip - JSZip instance for file access
 * @returns {Promise<void>} Async extraction and storage of image data
 * @private
 */
async function extractAndStoreImageData(topic, imageFiles, zip) {
    // Implementation...
}

/**
 * Discovers viewpoint files (.bcfv) in topic folders
 * @param {Object} zip - JSZip instance containing BCF data
 * @returns {Array<Object>} Array of viewpoint file objects with topic associations
 * @private
 */
function discoverViewpointFiles(zip) {
    // Implementation...
}

/**
 * Processes viewpoint files and extracts coordinate data
 * @param {Array<Object>} viewpointFiles - Array of viewpoint file objects
 * @param {Object} zip - JSZip instance for file access
 * @returns {Promise<Object>} Object mapping topics to their coordinate data
 * @private
 */
async function processViewpointFiles(viewpointFiles, zip) {
    // Implementation...
}

/**
 * Logs comprehensive summary of coordinate extraction process
 * @param {Object} coordinateData - Extracted coordinate data by topic
 * @param {Array<Object>} viewpointFiles - Array of processed viewpoint files
 * @returns {void} Outputs detailed logging information
 * @private
 */
function logCoordinateExtractionSummary(coordinateData, viewpointFiles) {
    // Implementation...
}

/**
 * Finds camera element in viewpoint XML data
 * @param {Document} xmlDoc - Parsed XML document from viewpoint file
 * @returns {Object|null} Camera element and type information
 * @private
 */
function findCameraElement(xmlDoc) {
    // Implementation...
}

/**
 * Extracts X,Y,Z coordinates from camera elements
 * @param {Element} cameraElement - Camera XML element
 * @param {string} cameraType - Type of camera (perspective, orthogonal)
 * @returns {Object} Object containing extracted coordinate values
 * @private
 */
function extractCameraCoordinates(cameraElement, cameraType) {
    // Implementation...
}

/**
 * Extracts camera-specific properties like field of view
 * @param {Element} cameraElement - Camera XML element
 * @param {string} cameraType - Type of camera element
 * @returns {Object} Object containing camera properties
 * @private
 */
function extractCameraProperties(cameraElement, cameraType) {
    // Implementation...
}

/**
 * Creates backward compatibility coordinate structure
 * @param {Object} coordinates - Extracted coordinate data
 * @returns {Object} Coordinate data with legacy field support
 * @private
 */
function createBackwardCompatibilityCoordinates(coordinates) {
    // Implementation...
}
```

## js/image-viewer.js - Optimized Methods

```javascript
/**
 * Validates ZIP download request and confirms with user
 * @param {Array} selectedImages - Array of selected image objects
 * @returns {boolean} True if validation passes and user confirms
 * @private
 */
function validateZipDownload(selectedImages) {
    // Implementation...
}

/**
 * Creates ZIP archive with selected images
 * @param {Array} selectedImages - Array of image objects to include
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Blob>} ZIP file blob ready for download
 * @private
 */
async function createZipWithImages(selectedImages, progressCallback) {
    // Implementation...
}

/**
 * Generates and initiates ZIP file download
 * @param {Blob} zipBlob - ZIP file blob to download
 * @param {string} filename - Filename for the ZIP download
 * @returns {void} Initiates browser download
 * @private
 */
function generateAndDownloadZip(zipBlob, filename) {
    // Implementation...
}

/**
 * Initializes PDF document with setup and cover page
 * @param {string} reportType - Type of PDF report being generated
 * @param {Object} projectStats - Project statistics for cover page
 * @returns {Object} Initialized jsPDF document instance
 * @private
 */
function initializePDFDocument(reportType, projectStats) {
    // Implementation...
}

/**
 * Adds detailed pages to PDF with progress tracking
 * @param {Object} pdf - jsPDF document instance
 * @param {Array} imagesToExport - Array of images for detailed pages
 * @param {Function} progressCallback - Progress update callback
 * @returns {Promise<Object>} Updated PDF document
 * @private
 */
async function addDetailedPagesWithProgress(pdf, imagesToExport, progressCallback) {
    // Implementation...
}

/**
 * Adds summary pages to PDF with progress tracking
 * @param {Object} pdf - jsPDF document instance
 * @param {Array} imagesToExport - Array of images for summary layout
 * @param {number} imagesPerPage - Number of images per summary page
 * @param {Function} progressCallback - Progress update callback
 * @returns {Promise<Object>} Updated PDF document
 * @private
 */
async function addSummaryPagesWithProgress(pdf, imagesToExport, imagesPerPage, progressCallback) {
    // Implementation...
}

/**
 * Adds summary images to a single PDF page
 * @param {Object} pdf - jsPDF document instance
 * @param {Array} pageImages - Array of images for this page
 * @param {number} imagesPerPage - Images per page configuration
 * @returns {void} Adds images to current PDF page
 * @private
 */
function addSummaryImagesToPage(pdf, pageImages, imagesPerPage) {
    // Implementation...
}

/**
 * Adds header section to detailed PDF page
 * @param {Object} pdf - jsPDF document instance
 * @param {Object} image - Image object with metadata
 * @returns {number} Y position after header addition
 * @private
 */
function addDetailedPageHeader(pdf, image) {
    // Implementation...
}

/**
 * Adds metadata section to detailed PDF page
 * @param {Object} pdf - jsPDF document instance
 * @param {Object} image - Image object with metadata
 * @param {number} startY - Starting Y position for metadata
 * @returns {number} Y position after metadata addition
 * @private
 */
function addDetailedPageMetadata(pdf, image, startY) {
    // Implementation...
}

/**
 * Adds individual metadata item to PDF page
 * @param {Object} pdf - jsPDF document instance
 * @param {string} label - Metadata field label
 * @param {string} value - Metadata field value
 * @param {number} x - X position for metadata item
 * @param {number} y - Y position for metadata item
 * @returns {number} Updated Y position after item addition
 * @private
 */
function addMetadataItem(pdf, label, value, x, y) {
    // Implementation...
}
```

## Usage Instructions

### Adding JSDoc Comments to Files

1. **Copy the appropriate JSDoc comments** for each file from this guide
2. **Add comments above each function/method** in the respective JavaScript files
3. **Maintain consistent formatting** with proper indentation and spacing
4. **Update @version tags** when making changes to methods

### JSDoc Generation (Optional)

To generate HTML documentation from these comments:

```bash
# Install JSDoc globally
npm install -g jsdoc

# Generate documentation
jsdoc js/utils/*.js js/*.js -d docs/jsdoc

# Or with configuration file
jsdoc -c jsdoc.conf.json
```

### Documentation Standards

- **Use `@param`** for all method parameters with type and description
- **Use `@returns`** for return values with type and description
- **Use `@example`** for complex methods to show usage
- **Use `@private`** for internal helper methods
- **Use `@namespace`** for utility object collections
- **Keep descriptions concise** but comprehensive
- **Update comments** when modifying method signatures

### Benefits

- **IDE Support**: Enhanced autocomplete and parameter hints
- **Code Documentation**: Automatic documentation generation
- **Team Collaboration**: Clear method contracts and usage examples
- **Maintenance**: Easier understanding of method purpose and usage
- **Professional Standards**: Industry-standard documentation practices

This JSDoc documentation provides comprehensive coverage of all optimized methods and utility modules, enabling professional development practices and easier maintenance of the BCFSleuth codebase.