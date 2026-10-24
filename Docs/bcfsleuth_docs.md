## BCFSleuth Docs

*Complete BCF Analytics Platform for AECO Professionals*

## Overview

BCFSleuth is a comprehensive web-based platform for analyzing Building Collaboration Format (BCF) files. Built specifically for AECO professionals, it provides universal BCF format support, advanced analytics, professional reporting, complete image management, and comprehensive viewpoint coordinate extraction - all running securely in your browser.

**🌐 Live Application**: [https://thebimsider.github.io/bcfsleuth/V02/](https://thebimsider.github.io/bcfsleuth/V02/)  
**📦 Source Code**: [https://github.com/TheBIMsider/bcfsleuth](https://github.com/TheBIMsider/bcfsleuth)

---

## Quick Start

1. **Upload BCF Files**: Drag and drop your BCF files (supports v2.0, 2.1, and 3.0)
2. **Explore Data**: Use the tabbed interface to navigate different views
3. **Configure Fields**: Select desired data fields including viewpoint coordinates
4. **Analyze**: Generate interactive charts and custom analytics
5. **Export**: Create professional reports in multiple formats with complete coordinate data
6. **Manage Images**: View, download, and include images in reports

No installation required - runs entirely in your browser with complete data privacy.

---

## Key Features

### 📊 Analytics Dashboard
- **Interactive Charts**: 5 chart types analyzing status, priority, timeline, authors, and comments
- **Full-Screen Viewing**: Click any chart for lightbox mode with zoom and navigation
- **Custom Analytics**: Build specialized reports with field selection
- **Export Charts**: Download as PNG or include in comprehensive reports

### 🔍 Advanced Data Explorer
- **Sortable Tables**: Click column headers to sort by any field
- **Multi-Criteria Filtering**: Search, status, priority, assignee, and date filters
- **Comment Expansion**: View full comment threads with expandable interface
- **Viewpoint Data**: Display complete camera coordinates and viewpoint information
- **Multiple Viewpoints**: Expandable rows showing all viewpoints per topic
- **Real-Time Search**: Instant filtering across all BCF data

### 📐 Viewpoint Coordinate Support
- **Complete Camera Data**: Extract all 18 BCF coordinate fields including camera positions, directions, and properties
- **Multi-Version Support**: Full compatibility with BCF 2.0, 2.1, and 3.0 coordinate standards
- **Primary Viewpoint Logic**: Intelligent selection of main viewpoint with fallback handling
- **Multiple Viewpoint Display**: Show additional viewpoints as expandable rows in Advanced Preview
- **Export Integration**: Include coordinate data in CSV and Excel exports
- **Visual Distinction**: Clearly marked viewpoint rows with distinctive styling

### 🖼️ Image Management
- **Professional Viewer**: Full-screen lightbox with zoom controls
- **Bulk Operations**: Download individual images or create ZIP archives
- **Smart Naming**: Automatic filename generation with project/topic context
- **Report Integration**: Embed images in PDF and Word documents

### 📄 Professional Reporting
- **Multiple Formats**: CSV, Excel, PDF, and Word document generation
- **Three Layout Options**: Grid, detailed, and executive summary formats
- **Embedded Content**: Include images and charts in reports
- **Template System**: Save and reuse export configurations
- **Coordinate Data**: Include viewpoint coordinates in all export formats

### 🌐 Universal BCF Support
- **All Versions**: Complete support for BCF 2.0, 2.1, and 3.0
- **Smart Detection**: Automatic version identification and field adaptation
- **Mixed Processing**: Handle multiple BCF versions in single session
- **Extension Support**: Custom fields and project-specific taxonomies
- **Camera Standards**: Full BCF camera specification compliance

---

## How to Use BCFSleuth

### Getting Started

#### Step 1: Access the Application
Navigate to [https://thebimsider.github.io/bcfsleuth/V02/](https://thebimsider.github.io/bcfsleuth/V02/) in your web browser. No installation or registration required.

#### Step 2: Upload Your BCF Files
1. **Drag and Drop**: Simply drag your BCF file(s) from your file explorer onto the upload area
2. **Click to Browse**: Click the upload area to open a file browser and select your BCF files
3. **Multiple Files**: You can upload multiple BCF files simultaneously for batch processing

*Supported formats: BCF 2.0, BCF 2.1, BCF 3.0*

#### Step 3: File Processing
Once uploaded, BCFSleuth automatically:
- Detects the BCF version
- Extracts all topics, comments, and images
- Processes viewpoint coordinate data
- Analyzes the data structure
- Prepares interactive visualizations

Processing typically takes less than 2 seconds per file.

### Working with Your Data

#### Basic Data Review (Simple Preview Tab)
1. **Project Overview**: View basic project information and statistics
2. **Topic Summary**: See total topics, comments, images, and viewpoints
3. **Quick Export**: Use the export button for immediate CSV or Excel download
4. **File Information**: Check BCF version and processing details

#### Detailed Analysis (Advanced Preview Tab)
1. **Browse All Data**: View complete topic information in a sortable table
2. **Sort Columns**: Click any column header to sort (click again to reverse)
3. **Search Everything**: Use the search box to find topics across all fields
4. **Apply Filters**: Use dropdown filters for Status, Priority, Assigned To, and Due Date
5. **Expand Comments**: Click blue ▶ arrows to read full comment threads
6. **View Viewpoints**: Click blue ▶ arrows next to topics with multiple viewpoints to see:
   - **Primary Viewpoint**: Coordinate data displayed in main topic row
   - **Additional Viewpoints**: Expandable rows showing all camera coordinates with distinctive orange background and green left border
   - **Visual Distinction**: Viewpoint rows clearly differentiated from white topic rows and light blue comment rows
7. **Coordinate Display**: When coordinate fields are selected, view:
   - Camera positions (X, Y, Z coordinates)
   - Camera directions and up vectors
   - Field of view and scale information
   - Camera type (Perspective/Orthogonal)
8. **Adjust View**: Change table pagination (25/50/100 rows per page)

#### Visual Analytics (Analytics Dashboard Tab)
1. **View Charts**: Five interactive charts automatically generate from your data:
   - **Status Distribution**: See how issues are distributed across statuses
   - **Priority Analysis**: Understand priority breakdown with percentages
   - **Timeline Creation**: View when issues were created over time
   - **Author Activity**: See who's contributing and how much
   - **Comments Volume**: Track comment engagement patterns

2. **Full-Screen Charts**: Click any chart to open in lightbox mode
   - Use mouse wheel to zoom in/out
   - Press arrow keys to navigate between charts
   - Press ESC to close lightbox
   - Click the download icon to save chart as PNG

3. **Custom Analytics**: Use the analytics builder to:
   - Select specific fields to analyze
   - Generate custom cross-field reports
   - Export custom analysis in multiple formats

#### Image Management (Image Viewer Tab)
1. **Browse Images**: View all extracted images in a grid layout
2. **Full-Screen Viewing**: Click any image to open in lightbox
   - Use arrow keys or click arrows to navigate
   - Mouse wheel or +/- keys to zoom
   - ESC to close
3. **Download Images**:
   - **Single**: Click download icon on any image
   - **Multiple**: Select images and use "Download Selected"
   - **All**: Use "Download All as ZIP" for complete collection
4. **Generate Reports**: Create professional documents with embedded images

### Configuring Viewpoint Coordinate Data

#### Field Selection (Configuration Tab)
1. **Viewpoint Coordinates Section**: Find the dedicated "Viewpoint Coordinates (18 fields)" section
2. **Section Control**: Use the section checkbox to select/deselect all coordinate fields at once
3. **Individual Fields**: Expand the section to select specific coordinate fields:

   **BCF Standard Coordinate Fields:**
   - Camera Type (Perspective/Orthogonal)
   - Camera Position (X, Y, Z coordinates)
   - Camera Direction (X, Y, Z vectors)
   - Camera Up Vector (X, Y, Z vectors)
   - Field of View (for perspective cameras)
   - View to World Scale (for orthogonal cameras)

   **Legacy Compatibility Fields:**
   - Legacy Camera Position (X, Y, Z)
   - Legacy Camera Target (X, Y, Z)

4. **Default Behavior**: Coordinate fields are unchecked by default to avoid overwhelming new users with additional data columns
5. **Template Integration**: Save coordinate field selections in templates for consistent use

#### Understanding Viewpoint Data
- **Primary Viewpoint**: Each topic shows coordinates from its main viewpoint
- **Multiple Viewpoints**: Topics with additional viewpoints show them as expandable rows
- **Coordinate Precision**: All coordinates displayed with 3-decimal precision
- **Camera Types**: Clear indication of Perspective vs Orthogonal camera properties
- **BCF Compliance**: Full support for all BCF coordinate specifications

### Creating Reports and Exports

#### Data Export Options with Coordinates
1. **Choose Export Format**:
   - **CSV**: Universal format with complete coordinate data
   - **Excel**: Professional formatted spreadsheets with coordinate columns

2. **Select Fields**: Use the Configuration tab to:
   - Choose standard BCF fields plus viewpoint coordinates
   - Select all 18 coordinate fields or specific subsets
   - Save coordinate selections as templates
   - Apply saved templates for consistent coordinate exports

3. **Coordinate Export Structure**:
   - **Topic Rows**: Include primary viewpoint coordinate data
   - **Viewpoint Rows**: Additional rows for each extra viewpoint with complete coordinates
   - **Field Consistency**: Same coordinate data across Advanced Preview and exports

4. **Export Process**:
   - Click "Export" button in any tab
   - Choose your saved template or use default
   - Select file format
   - Download automatically starts with coordinate data included

#### Professional Reports
1. **PDF Reports**: Three layout options available
   - **Grid Layout**: Multiple images per page, compact format
   - **Detailed Report**: One image per page with full topic information  
   - **Executive Summary**: Cover page with statistics plus layout

2. **Word Documents**: Fully editable reports in three matching layouts
   - Perfect for stakeholder collaboration
   - Embedded images maintain quality
   - Professional formatting with headers and styles

3. **Custom Analytics Reports**: Include charts and analysis in your reports
   - Text format for quick review
   - PDF format for formal presentation
   - Word format for collaborative editing

### Advanced Features

#### Template Management (Configuration Tab)
1. **Create Templates**:
   - Select desired export fields including coordinates
   - Click "Save as Template"
   - Name your template for easy identification

2. **Coordinate Templates**:
   - Save different coordinate field combinations
   - Create templates for different use cases (basic position, complete camera data, etc.)
   - Share coordinate templates across team projects

3. **Manage Templates**:
   - Apply existing templates to any project
   - Edit template field selections
   - Delete unused templates
   - Export templates as JSON files for team sharing

4. **Import Team Templates**:
   - Receive JSON template files from colleagues
   - Import via Configuration tab
   - Apply standardized field selections across projects

#### Processing History
1. **Track Activity**: View all processed files and export operations
2. **Review Metrics**: See processing times, file sizes, and export counts
3. **Export History**: Download your processing history as CSV
4. **Manage Sessions**: Clear history or manage storage as needed

### Tips for Best Results

#### Working with Coordinate Data
- **Camera Analysis**: Use coordinate exports for camera position analysis and clash detection workflows
- **Survey Integration**: Export precise coordinates for integration with survey data and site positioning
- **Model Validation**: Compare viewpoint positions against design intent and construction progress
- **Spatial Quality Control**: Verify issue locations using precise camera coordinates for field verification
- **Cross-Platform Coordination**: Share exact viewpoint positions between different BIM software platforms
- **Progress Documentation**: Track spatial context of issues over time using coordinate-based analysis
- **Viewpoint Management**: Review multiple viewpoints to understand different perspectives on the same issue

#### Performance with Coordinates
- **Large Datasets**: Coordinate processing adds minimal overhead to file processing
- **Export Size**: Coordinate fields increase export file sizes - consider field selection
- **Mobile Use**: All coordinate features work on mobile devices with responsive design

#### Data Quality
- **Field Selection**: Review available coordinate fields in Configuration tab before exporting
- **Custom Fields**: BCFSleuth automatically detects project-specific coordinate extensions
- **Version Differences**: BCF 3.0 coordinate fields only appear when relevant content is detected
- **Coordinate Validation**: Check coordinate values in Advanced Preview before exporting

#### Report Preparation
- **Template Strategy**: Create templates for different report types (internal review, client presentation, compliance, coordinate analysis)
- **Image Planning**: Review images before generating reports to ensure relevant content
- **Format Selection**: Use PDF for final distribution, Word for collaborative editing
- **Coordinate Integration**: Include relevant coordinate data based on report purpose

#### Team Workflows
- **Standardization**: Share export templates including coordinate selections for consistent reporting
- **Processing History**: Use history tracking for project documentation
- **Multi-Format Output**: Provide different report formats for different stakeholders
- **Coordinate Standards**: Establish team standards for coordinate field selection and usage

---

## User Interface Guide

### Main Interface Tabs

**Simple Preview**
- Basic BCF information and topic overview
- Quick export functionality with coordinate options
- Project statistics and summary including viewpoint counts

**Advanced Preview**
- Sortable data table with all BCF fields including coordinates
- Multi-criteria filtering and search
- Comment expansion and detailed view
- Viewpoint expansion showing multiple camera positions
- Visual distinction between topic, comment, and viewpoint rows
- Export preview integration with coordinate data

**Image Viewer**
- Gallery view of all extracted images
- Professional lightbox with navigation
- Bulk download and ZIP creation
- Report generation with embedded images

**Analytics Dashboard**
- Interactive chart suite with 5 visualization types
- Chart lightbox for full-screen analysis
- Custom analytics builder
- Chart export and report integration

**Configuration**
- Export template management including coordinate field selection
- Viewpoint coordinate section with 18 field options
- User preferences and defaults
- Processing history and tracking
- Team collaboration features

---

## Export Options

### Data Export Formats

**CSV Export**
- Hierarchical structure with all BCF fields plus coordinates
- Complete viewpoint coordinate data in dedicated columns
- Customizable field selection including all 18 coordinate fields
- Template-based configuration with coordinate options
- Universal compatibility for CAD and analysis software

**Excel Reports**
- Professional formatting with headers and coordinate styling
- Multi-sheet organization for complex projects with viewpoint data
- RFI-style layouts for stakeholder review including camera information
- Embedded formulas and calculations
- Coordinate precision formatting (3 decimal places)

**PDF Documents**
- Three professional layouts: Grid, Detailed, Executive
- Embedded images with proper scaling
- Comprehensive project statistics including viewpoint counts
- Standardized cover pages

**Word Documents**
- Fully editable reports for collaboration
- Professional formatting with styles and headers
- Embedded images and charts
- Template compatibility for organization standards

### Chart and Image Export

**Individual Charts**
- High-resolution PNG format
- Suitable for presentations and reports
- Direct download from analytics dashboard
- Lightbox export capability

**Bulk Image Operations**
- Sequential downloads with progress tracking
- ZIP archives with organized structure
- Smart filename generation
- Cancellation support for large collections

### Coordinate Data Export

**Comprehensive Coordinate Fields**
- All 18 BCF coordinate fields available for export
- Primary viewpoint data in main topic rows
- Additional viewpoint rows for complete camera information
- 3-decimal precision for professional accuracy
- Both current BCF standards and legacy compatibility fields

**Export Integration**
- Coordinate data included in both CSV and Excel formats
- Consistent field naming across all export types
- Template-based coordinate field selection
- Professional formatting suitable for CAD import

---

## Data Privacy & Security

BCFSleuth operates with complete client-side processing:

- **Local Processing**: All data including coordinate information remains in your browser
- **Zero Transmission**: No coordinate or project data sent to external servers
- **No Registration**: No accounts or logins required
- **Complete Privacy**: Charts, analytics, and coordinate analysis generated locally
- **Secure Storage**: Templates and coordinate preferences stored locally only

---

## Technical Specifications

### Browser Compatibility
- **Chrome 90+** (Recommended)
- **Firefox 85+**
- **Safari 14+**
- **Edge 90+**

### Performance Metrics
- **BCF Processing**: < 2 seconds for all formats including coordinate extraction
- **Chart Generation**: < 1 second for normal datasets
- **Image Operations**: Handles 300+ images efficiently
- **Export Generation**: < 10 seconds for comprehensive reports with coordinates
- **Coordinate Processing**: Minimal performance impact for coordinate extraction

### Dependencies
- Chart.js 4.4.0 (Analytics)
- JSZip 3.10.1 (File processing)
- SheetJS 0.18.5 (Excel generation)
- jsPDF 3.0.1 (PDF creation)
- docx 7.8.2 (Word documents)

### BCF Coordinate Support
- **BCF 2.0**: Full coordinate extraction and display
- **BCF 2.1**: Enhanced viewpoint support with complete camera data
- **BCF 3.0**: Latest coordinate specifications and extensions
- **Legacy Support**: Backward compatibility with older coordinate formats

---

## Advanced Features

### Template Management
- **Create Templates**: Save field selection configurations including coordinates
- **Team Sharing**: Export/import templates via JSON with coordinate selections
- **Version Control**: Track template changes and coordinate field usage
- **Smart Defaults**: Automatic template application with coordinate preferences

### Custom Analytics
- **Field Selection**: Choose any combination of BCF fields including coordinates
- **Cross-Field Analysis**: Discover relationships between coordinate and issue data
- **Dynamic Updates**: Real-time analysis as you modify coordinate field selection
- **Multi-Format Export**: Text, PDF, and Word output options with coordinate data

### Processing History
- **Comprehensive Tracking**: All file processing including coordinate extraction recorded
- **Detailed Metrics**: File sizes, processing times, export counts, coordinate field usage
- **Export Capability**: History available as CSV with coordinate processing details
- **Session Persistence**: Maintains coordinate preferences between browser sessions

### Viewpoint Coordinate Features
- **Primary Viewpoint Logic**: Intelligent selection of main camera view with fallback
- **Multiple Viewpoint Support**: Handle topics with 3+ viewpoints efficiently
- **Visual Organization**: Clear distinction between topic, comment, and viewpoint data
- **Coordinate Validation**: Automatic validation of coordinate data completeness
- **Export Consistency**: Same coordinate logic across all export formats

---

## Common Use Cases

### Project Managers
- Generate executive summaries with status distribution charts
- Create comprehensive reports including camera position analysis for stakeholder meetings
- Track issue resolution progress over time with spatial context
- Export coordinate data for project management and CAD integration tools

### BIM Coordinators
- Analyze issue patterns with spatial coordinate context
- Create detailed reports with embedded images and camera positions
- Manage large BCF collections with complete viewpoint information
- Coordinate team responses with exported coordinate data for clash detection workflows

### Quality Assurance
- Review comment trends with spatial context from coordinate data
- Generate compliance reports with embedded evidence and camera positions
- Track author activity with location-based analysis
- Create audit trails with comprehensive documentation including viewpoint verification

### Consultants
- Process client BCF files including sensitive coordinate data without privacy concerns
- Generate professional reports with complete camera information in client-preferred formats
- Analyze project data patterns including spatial relationships for recommendations
- Create standardized reporting templates with coordinate field specifications

### Surveyors and CAD Professionals
- Extract precise camera coordinates for survey integration
- Analyze viewpoint positions for model validation
- Export coordinate data for CAD software import
- Validate spatial accuracy with 3-decimal precision coordinate data

---

## Troubleshooting

### Common Issues

**File Upload Problems**
- Ensure BCF files are valid ZIP archives with viewpoint data
- Check file size limits (browser dependent)
- Verify BCF version compatibility (2.0, 2.1, 3.0) for coordinate support

**Coordinate Display Issues**
- Verify coordinate fields are selected in Configuration tab
- Check that BCF files contain viewpoint data (.bcfv files)
- Ensure proper BCF format with camera information

**Performance Issues**
- Large datasets with coordinates may require pagination adjustment
- Close unused browser tabs for better performance with coordinate processing
- Consider processing files individually for very large coordinate collections

**Export Problems**
- Ensure popup blockers allow coordinate data downloads
- Check available disk space for large coordinate exports
- Verify browser supports coordinate data in required file formats

### Browser-Specific Notes

**Chrome**: Best performance and coordinate feature support  
**Firefox**: Excellent compatibility, may be slower for large coordinate datasets  
**Safari**: Full coordinate functionality, some export dialogs differ  
**Edge**: Complete coordinate compatibility with Chrome-like performance

### Coordinate-Specific Troubleshooting

**Missing Coordinate Data**
- Verify BCF file contains .bcfv viewpoint files
- Check BCF version compatibility for coordinate standards
- Ensure viewpoint files are properly formatted XML

**Coordinate Precision Issues**
- All coordinates displayed with 3-decimal precision as standard
- Original precision maintained in exports
- Coordinate validation checks for reasonable value ranges

---

## Development & Contribution

BCFSleuth is developed using AI-assisted methodologies, combining AECO domain expertise with advanced implementation capabilities.

### Architecture
- Pure HTML/CSS/JavaScript (no framework dependencies)
- Modular design with clear separation of concerns including coordinate processing
- Comprehensive error handling and user feedback for coordinate operations
- Mobile-first responsive design supporting coordinate display

### Contributing
- Report issues via GitHub including coordinate-related bugs
- Suggest coordinate features through discussions
- Submit pull requests for coordinate processing improvements
- Improve documentation and coordinate usage examples

---

## About BCF and Coordinates

The Building Collaboration Format (BCF) is an open file format that supports workflow communication in BIM processes. It enables issue tracking, coordination, and quality management across different software platforms. BCF viewpoint coordinates provide precise camera positioning information enabling spatial context for issues and comments.

**BCF Coordinate Standards:**
- **Camera Position**: 3D coordinates (X, Y, Z) of camera location
- **Camera Direction**: Vector indicating camera viewing direction
- **Camera Up Vector**: Vector defining camera orientation
- **Field of View**: Perspective camera viewing angle
- **View to World Scale**: Orthogonal camera scaling factor

**Learn More**: [buildingSMART International](https://www.buildingsmart.org/standards/bsi-standards/bim-collaboration-format/)

---

## Support

- **GitHub Issues**: Bug reports and feature requests including coordinate functionality
- **Documentation**: This guide and inline help with coordinate examples
- **Community**: AECO professional forums and coordinate workflow discussions

---

## Acknowledgments

BCFSleuth is inspired by the original Sloth application by Simon Moreau (BIM42). We're grateful for his pioneering work in BCF processing and contributions to the AECO open-source community. The coordinate feature implementation builds upon BCF standards developed by buildingSMART International.

---

*Version 2.0 | Complete BCF Analytics Platform with Coordinate Support*  
*Built for AECO professionals by The BIMsider*  
*AI-Assisted Development with Claude (Anthropic)*