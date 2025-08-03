# BCFSleuth

A modern web-based BCF (Building Collaboration Format) file analyzer and CSV/Excel converter with universal format support, intelligent field discovery, advanced data exploration, and comprehensive configuration management.

## 🚀 **Universal BCF Support - All Formats Supported**

**BCFSleuth now supports ALL BCF formats with intelligent adaptation:**
- ✅ **BCF 2.0** - Full compatibility with legacy BCF files
- ✅ **BCF 2.1** - Enhanced support with extensions integration  
- ✅ **BCF 3.0** - Complete support for latest BCF specification
- ✅ **Smart Detection** - Automatic format detection with 100% accuracy
- ✅ **Intelligent UI** - BCF 3.0 fields only appear when relevant

## 🤖 AI-Assisted Development

This project demonstrates the power of human-AI collaboration in modern software development:

- **🧠 AI Assistant**: Claude (Anthropic) provided architecture guidance, code generation, and debugging support
- **⚡ Live Development**: Built using AI pair programming and systematic debugging
- **🏗️ Domain Expertise**: AECO/BIM industry knowledge and project direction by [The BIMsider](https://bio.link/thebimsider)
- **🎯 Systematic Approach**: Maintained production quality through structured development and iterative refinement

**Why this matters**: Shows how AI tools can empower domain experts to create sophisticated applications while maintaining professional development standards, even without traditional programming backgrounds.

## 📱 Screenshots

<table>
  <tr>
    <td width="50%">
      <h3>🔄 Easy Upload & Universal BCF Processing</h3>
      <a href="https://github.com/user-attachments/assets/29cf8efc-bb7b-4d6a-8d64-04548fc5fc8b">
        <img src="https://github.com/user-attachments/assets/29cf8efc-bb7b-4d6a-8d64-04548fc5fc8b" alt="BCFSleuth Universal BCF Upload" width="100%"/>
      </a>
      <p><em>Drag & drop any BCF format with intelligent field discovery</em></p>
    </td>
    <td width="50%">
      <h3>📊 Simple Preview</h3>
      <a href="https://github.com/user-attachments/assets/c5244e3a-7f53-4958-901d-c2f25e6c188a">
        <img src="https://github.com/user-attachments/assets/c5244e3a-7f53-4958-901d-c2f25e6c188a" alt="Simple Preview with BCF 3.0 Support" width="100%"/>
      </a>
      <p><em>Quick overview with format-aware display</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔍 Advanced Preview with Universal Filtering</h3>
      <a href="https://github.com/user-attachments/assets/152c08b9-fc4b-4c03-bc80-b58609057227">
        <img src="https://github.com/user-attachments/assets/152c08b9-fc4b-4c03-bc80-b58609057227" alt="Advanced Preview with BCF 3.0 Fields" width="100%"/>
      </a>
      <p><em>Professional data exploration across all BCF formats</em></p>
    </td>
    <td width="50%">
      <h3>⚙️ Configuration Management</h3>
      <a href="https://github.com/user-attachments/assets/6499579b-08e1-4826-84fc-630605ad60d5">
        <img src="https://github.com/user-attachments/assets/6499579b-08e1-4826-84fc-630605ad60d5" alt="Configuration with BCF 3.0 Template Support" width="100%"/>
      </a>
      <p><em>Export templates work seamlessly across all BCF versions</em></p>
    </td>
  </tr>
</table>

> 💡 **Click any screenshot to view full size**

## 🌟 **Live Demo** 
**[Try BCFSleuth HERE](https://thebimsider.github.io/bcfsleuth/V01/)**

## Overview

BCFSleuth is an intelligent, client-side web application that extracts and converts BCF file data into hierarchical CSV and professional Excel formats. Features universal BCF format support (2.0/2.1/3.0), dynamic field discovery that adapts to actual BCF content, automatically detects project-specific customizations, provides advanced data exploration capabilities, and includes comprehensive configuration management for professional workflows. Built with modern web technologies for fast, secure, browser-based processing.

## ✅ **Current Features - Phase 4 Complete (Universal BCF Support)**

### 🌐 **Universal BCF Format Support (Phase 4 - NEW)**
- **🔍 Intelligent Format Detection**: Automatic BCF version detection with multi-layer validation
- **📋 BCF 2.0 Support**: Complete backward compatibility with legacy BCF files
- **📈 BCF 2.1 Support**: Enhanced reliability with extensions.xsd integration
- **🆔 BCF 3.0 Support**: Full support for latest BCF specification including:
  - **ServerAssignedId**: Server-controlled topic identification
  - **Multiple ReferenceLinks**: Support for multiple reference links per topic
  - **DocumentReferences**: New BCF 3.0 document reference structure
  - **Documents.xml**: Complete document management system parsing
  - **Enhanced Header Files**: Improved file reference structure
- **🎯 Smart UI Adaptation**: BCF 3.0 fields only appear when BCF 3.0 content is detected
- **🔄 Seamless Transition**: BCF 2.x users see no changes, BCF 3.0 users get enhanced features

### 🧠 **Intelligent Field Discovery (Phase 3b)**
- **Dynamic Field Detection**: UI adapts completely to actual BCF file content
- **Version Awareness**: Automatically detects BCF 2.0 (20 fields) vs BCF 2.1 (22 fields) vs BCF 3.0 (25+ fields)
- **Extensions.xsd Integration**: Parses custom field definitions and project-specific taxonomies
- **Custom Value Detection**: Identifies and displays non-standard status, type, and priority values
- **Vendor Field Support**: Discovers custom XML elements and attributes from any BCF authoring tool

### 🔍 **Advanced Data Preview & Filtering (Phase 3c)**
- **Professional Tabbed Interface**: Simple Preview | Advanced Preview | Configuration
- **Advanced Data Table**: Sortable columns, intelligent pagination, responsive design across all BCF formats
- **Expandable Comments**: Click blue arrows (▶) to expand/collapse topic comments individually
- **Multi-Criteria Filtering**: Search, Status, Priority, Assigned To, Due Date with real-time results
- **Universal Search**: Global text search across all displayed fields with instant filtering
- **Summary Dashboard**: Real-time statistics (Total Topics, Comments, Open Issues, High Priority, Overdue)
- **Professional Tooltips**: Full-text display for truncated content with intelligent positioning

### ⚙️ **Configuration Management (Phase 3d)**
- **Export Templates**: Save and manage field selection combinations for quick reuse across all BCF formats
- **Template Operations**: Create, edit, apply, and delete export configurations with full CRUD operations
- **Template Import/Export**: Share templates via JSON files - backup locally or share with team members
- **BCF Format Compatibility**: Templates work seamlessly across BCF 2.0, 2.1, and 3.0 files
- **Session Persistence**: User preferences and templates saved between browser sessions
- **Smart Export Filenames**: Template-based filename generation with variable substitution
- **Processing History**: Automatic tracking of BCF analysis sessions with detailed metrics
- **User Preferences**: Customizable defaults for export format, page size, tooltips, and session behavior

### 📊 **Enhanced Export System (Phases 1 & 2)**
- **CSV Export**: Hierarchical structure perfect for data analysis and filtering across all BCF formats
- **Excel Export**: Professional RFI-style reports with formatting, headers, and styling
- **BCF 3.0 Field Support**: Complete export of ServerAssignedId, DocumentReferences, ReferenceLinks, HeaderFiles
- **Dynamic Field Selection**: Export any combination of discovered fields across all BCF versions
- **Custom Field Export**: Include vendor-specific data in exports
- **Export Preview**: Advanced table shows exactly what will be exported
- **Template Integration**: Export using saved template configurations with custom filenames

### 🔍 **Comprehensive BCF Analysis**
- **Universal Format Support**: BCF 2.0, 2.1, and 3.0 formats with intelligent adaptation
- **Complete Data Extraction**: Topics, comments, viewpoints, and comprehensive metadata across all formats
- **Enhanced Project Parsing**: Handles ProjectExtension (BCF 2.x) and ProjectInfo (BCF 3.0) structures
- **Custom Taxonomy Recognition**: Detects project-specific status, type, and priority schemes
- **Cross-Version Batch Processing**: Handle multiple BCF files of different versions simultaneously

### 🎨 **Modern User Interface (Phase 3a)**
- **Contemporary Design**: Modern color scheme with CSS custom properties and dark mode support
- **Smart Field Selection**: Organized categories with usage indicators and format-aware field display
- **Drag & Drop Interface**: Intuitive file handling with real-time feedback for all BCF formats
- **Responsive Design**: Optimized experience across desktop, tablet, and mobile devices
- **Export Customization**: Complete control over which fields to include in exports

## **New in Phase 4: BCF 3.0 Features**

### **🆔 BCF 3.0 Enhanced Fields**
When BCF 3.0 content is detected, BCFSleuth automatically reveals:

- **Server Assigned ID**: Server-controlled topic identification for enterprise workflows
- **Multiple Reference Links**: Support for multiple reference links per topic (vs single in BCF 2.x)
- **Document References**: New DocumentGuid/Url structure with enhanced document management
- **Header Files**: Enhanced file reference structure with IFC project integration
- **Viewpoint Index**: Improved viewpoint organization and referencing

### **🎯 Intelligent UI Enhancement**
- **Format-Aware Display**: BCF 3.0 fields only appear when BCF 3.0 content is actually present
- **Zero Learning Curve**: BCF 2.x users see identical interface, no training required
- **Smart Category Creation**: "BCF 3.0 Fields" category appears automatically when relevant
- **Enhanced Export Options**: Templates seamlessly handle BCF 3.0 field combinations

### **🔄 Seamless Compatibility**
- **Mixed File Processing**: Process BCF 2.x and 3.0 files together in same session
- **Template Universality**: Saved templates work across all BCF formats
- **Export Consistency**: Professional formatting maintained across all BCF versions
- **Performance Maintained**: Sub-2-second processing maintained across all formats

## Getting Started

### Quick Start (Use Live Demo)
1. Open [BCFSleuth Live Demo](https://thebimsider.github.io/bcfsleuth/V01/)
2. Drag and drop your BCF file(s) onto the upload area (any BCF format: 2.0, 2.1, or 3.0)
3. Review the intelligently discovered fields with format-aware indicators
4. **Simple Preview**: Quick 5-topic overview with enhanced styling
5. **Advanced Preview**: Switch tabs for full data exploration with:
   - Search across all fields and BCF versions
   - Filter by Status, Priority, Assigned To, Due Date
   - Sort any column (click headers)
   - Expand/collapse topic comments (click blue ▶ arrows)
   - Paginate through large datasets (25/50/100 rows)
   - View full content with professional tooltips
6. **Configuration**: Switch to Configuration tab for:
   - Creating export templates from current field selections (works across all BCF formats)
   - Managing saved templates (create, edit, apply, delete)
   - Import/export templates as JSON files for backup or team sharing
   - Setting user preferences and defaults
   - Viewing processing history
7. Select which fields to export using the format-aware field selection interface
8. Choose your export format:
   - **Download CSV**: For data analysis, filtering, and pivot tables
   - **Download Excel**: For professional reports and stakeholder presentations

### Self-Hosted Setup (Fork or Download)

#### Option 1: Fork the Repository
```bash
# Fork the repo on GitHub (click "Fork" button), then clone your fork
git clone https://github.com/[your-username]/bcfsleuth.git
cd bcfsleuth

# No build process needed - it's pure HTML/CSS/JavaScript
# Serve the files using any web server
```

#### Option 2: Download and Host
```bash
# Download the latest release
wget https://github.com/TheBIMsider/bcfsleuth/archive/refs/heads/main.zip
unzip main.zip
cd bcfsleuth-main

# Or clone directly
git clone https://github.com/TheBIMsider/bcfsleuth.git
cd bcfsleuth
```

#### Hosting Options

**Local Development Server:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

**Production Hosting:**
- **GitHub Pages**: Fork repo, enable Pages in Settings
- **Netlify**: Drag folder to netlify.com or connect GitHub repo
- **Vercel**: Import GitHub repo at vercel.com
- **Traditional Web Host**: Upload files to any web server (Apache, Nginx, IIS)
- **Static Hosting**: Works with any static file hosting service

**Requirements:**
- ✅ No server-side processing needed
- ✅ No database required
- ✅ No build process necessary
- ✅ Just serve the static files
- ✅ HTTPS recommended (required for some modern browser features)

## 🔒 Data Privacy & Storage

### **Complete Client-Side Privacy**
BCFSleuth prioritizes your data privacy by storing everything locally in your browser:

- **🏠 Local Storage Only**: All templates, preferences, and processing history stored in your browser's localStorage
- **🔐 No Data Transmission**: Your BCF data and configurations never leave your device
- **👤 User Isolation**: Each browser/device maintains completely separate data
- **🚫 No Accounts Required**: No logins, registrations, or server-side storage
- **🌐 Universal Format Privacy**: Consistent privacy protection across all BCF formats

### **What This Means For You:**
✅ **Complete Privacy**: Your BCF analysis data remains 100% private across all formats  
✅ **No Sharing Risk**: Other users cannot access your templates or history  
✅ **Works Offline**: Once loaded, works without internet connection  
✅ **GDPR Compliant**: No personal data collection or transmission  

### **Multi-Device Considerations:**
❌ **No Cross-Device Sync**: Templates and preferences don't transfer between devices  
❌ **Browser-Specific**: Chrome and Firefox maintain separate data  
❌ **Incognito Limitations**: Private browsing sessions don't persist data  
❌ **Browser Data Clearing**: Will remove all saved templates and preferences  

### **For Teams & Organizations:**
- Each team member maintains their own templates and preferences
- **Template Sharing**: Templates can be shared via JSON export/import feature
- Export your templates and share the JSON file with team members
- Import templates from colleagues to maintain consistency across projects
- Templates work seamlessly across all BCF formats (2.0, 2.1, 3.0)

## **Advanced Data Exploration (Phase 3c)**

### **Professional Data Table Features**
- **Universal Column Support**: All BCF formats integrated into unified table display
- **Column Sorting**: Click any header to sort (Title, Status, Priority, Author, Date, etc.)
- **Expandable Comments**: Click blue triangles (▶) next to topics to show/hide comment rows
- **Expand/Collapse All**: Quick controls to expand or collapse all topic comments at once
- **Multi-Criteria Filtering**: Combine search with Status, Priority, Assignee, and Due Date filters
- **Flexible Pagination**: Choose 25, 50, or 100 rows per page with smart navigation
- **Topic/Comment Hierarchy**: Comments nested under topics with visual indicators (↳)
- **Professional Tooltips**: Hover over truncated text to see full content
- **Export Integration**: Table displays exactly the fields selected for export

### **Smart Filtering System**
- **Universal Search**: Search across all visible fields simultaneously (works with all BCF formats)
- **Status Filtering**: Filter by Open, In Progress, Under Review, Closed, Rejected + custom statuses
- **Priority Filtering**: Filter by Low, Medium, High, Critical + custom priority levels
- **Assignee Filtering**: Filter by any team member found in the BCF data
- **Due Date Filtering**: Show Overdue, This Week, Next Week, or No Due Date items
- **Active Filter Display**: Visual tags show applied filters with easy removal

### **Real-Time Statistics Dashboard**
- **Total Topics**: Count of all topics in current filter view (across all BCF formats)
- **Total Comments**: Sum of all comments across filtered topics
- **Open Issues**: Count of topics with Open/In Progress/Under Review status
- **High Priority**: Count of High and Critical priority items
- **Overdue**: Count of topics past their due date

## **Configuration Management (Phase 3d)**

### **Export Template System**
- **Universal Template Support**: Templates work seamlessly across BCF 2.0, 2.1, and 3.0 files
- **Template Creation**: Save current field selections as reusable templates
- **Smart Templates**: "Save From Current Selection" automatically suggests template names
- **Template Editing**: Full edit capability with visual feedback and form pre-population
- **Template Application**: One-click application of saved field combinations
- **Template Metadata**: Name, description, custom filename template, and usage tracking
- **Template Library**: Organized display with last-used dates and field counts

### **Template Import/Export**
- **Export Templates**: Download all your templates as a JSON file for backup
- **Import Templates**: Upload template JSON files to restore or share with team members
- **Conflict Resolution**: Smart handling when importing templates with duplicate names
- **Team Collaboration**: Share standardized field selections across your organization
- **Cross-Format Compatibility**: Templates adapt intelligently to different BCF versions

**Template Sharing Workflow:**
1. Create and save your export templates
2. Click "Export Templates" to download a JSON file
3. Share the JSON file with team members via email, shared drives, etc.
4. Team members click "Import Templates" and upload the JSON file
5. Templates are added to their configuration with conflict handling
6. Templates work automatically with any BCF format (2.0, 2.1, 3.0)

### **Template Features**
**Custom Filename Templates:**
- `{project_name}`: Automatically extracted from BCF project data
- `{date}`: Current date in YYYY-MM-DD format
- `{time}`: Current time in HH-MM-SS format
- `{template_name}`: Template name for file identification

**Example Generated Filenames:**
```
Project_ABC_BCF_Export_2025-08-02.xlsx
Site_Review_Essential_Export_2025-08-02.csv
Building_123_RFI_Template_2025-08-02.xlsx
```

### **Session Persistence**
- **User Preferences**: Default export format, page size, tooltip settings, auto-save behavior
- **Template Storage**: All saved templates persist between browser sessions and work across BCF formats
- **Processing History**: Automatic tracking of analysis sessions with detailed metrics
- **Preference Restoration**: Settings automatically applied when application loads
- **Reset Functionality**: Easy reset to factory defaults when needed

### **Processing History**
- **Automatic Tracking**: Every export operation logged with comprehensive metrics
- **Session Details**: Filename, project name, topic/comment counts, field selections
- **Export Information**: Format used, template applied, timestamp, BCF version, and processing efficiency
- **History Management**: View recent sessions, clear history, export history as CSV
- **Audit Trail**: Complete record for compliance and project tracking

## **Intelligent Field Discovery**

### **Universal BCF Data Support (25+ Fields Discovered Dynamically)**
BCFSleuth automatically discovers and displays only the fields that contain actual data in your BCF files across all formats:

- **Topic Information**: Title, Description, Status, Priority, Type, Stage, Labels, Assignments
- **Dates & Authors**: Creation/Modified authors and timestamps, due dates
- **Project Metadata**: BCF version, project names, source files, topic GUIDs
- **Comments & Counts**: Full comment threads with authors, dates, content, and viewpoint counts
- **BCF 3.0 Enhanced Fields** (when relevant):
  - **Server Assigned ID**: Server-controlled topic identification
  - **Reference Links**: Multiple reference links support
  - **Document References**: Enhanced document reference structure
  - **Header Files**: Improved file reference system
  - **Viewpoint Index**: Enhanced viewpoint organization
- **Custom Fields**: Any vendor-specific XML elements or attributes discovered in BCF files

### **Smart Field Indicators**
- **Custom Value Counts**: "Status (11 custom)" shows project-specific taxonomies
- **Usage Statistics**: "(4 found)" indicates how many unique values exist
- **Format-Aware Display**: BCF 2.0 vs 2.1 vs 3.0 field availability automatically detected
- **Extensions Integration**: Custom fields from extensions.xsd files displayed with definitions
- **BCF 3.0 Enhancement**: "BCF 3.0 Fields (5 enhanced fields)" category appears when relevant

### **Export Formats**

#### **CSV Export (Data Analysis)**
Hierarchical CSV structure optimized for Excel analysis across all BCF formats:
```
Row Type | Topic Data...                    | Comment Data...           | BCF 3.0 Data...
Topic    | HVAC Issue, High Priority, etc. | [empty]                   | ServerAssignedId, DocumentRefs...
Comment  | [empty]                         | Comment 1, Author, Date   | [empty]
Comment  | [empty]                         | Comment 2, Author, Date   | [empty]
```

#### **Excel Export (Professional Reports)**
Formatted reports with universal BCF format support and dynamic field selection:
```
BCF Analysis Report [Date]

Files processed: 2
Project(s): C9 Truck Shop
BCF Version(s): 2.1, 3.0
Total Topics: 15
Total Comments: 47

Topic # | Title        | Status      | Priority | Type  | Creation Date | Author        | Server ID
--------|--------------|-------------|----------|-------|---------------|---------------|----------
1       | HVAC & BEAM  | In Progress | Medium   | Issue | 2018-04-14   | john.dog      | BCF-001

        | Comments     | Author      | Date      | Comment Text
        |--------------|-------------|-----------|-------------
        | 1            | john.dog   | 2018-04-14| Initial issue report
        | 2            | carl.bimsider | 2018-04-15| Reviewing with team
```

**Enhanced Excel Features:**
- Professional title and summary sections with BCF version information
- Bold headers with background colors and borders
- Dynamic column widths based on selected fields (includes BCF 3.0 fields)
- Comment subsections nested under each topic
- Clean spacing and visual hierarchy
- Support for any combination of discovered fields across all BCF formats
- Template-based filename generation

## **Development**

### **Local Development Setup**
```bash
# Clone the repository
git clone https://github.com/TheBIMsider/bcfsleuth.git
cd bcfsleuth

# Open in VS Code
code .

# Start a local server (optional)
python -m http.server 8000
# or
npx serve .
```

### **Project Structure**
```
bcfsleuth/
├── index.html              # Main application with tabbed interface and configuration
├── css/
│   └── style.css           # Modern design system with universal BCF support styling
├── js/
│   ├── app.js              # Enhanced application logic with BCF 3.0 integration
│   ├── advanced-preview.js # Advanced data table with BCF 3.0 field support
│   ├── configuration.js    # Complete configuration management system
│   ├── bcf-parser.js       # Universal BCF parsing (2.0/2.1/3.0) with intelligent detection
│   ├── csv-exporter.js     # CSV export with BCF 3.0 field formatting
│   └── excel-exporter.js   # Excel export with BCF 3.0 professional formatting
└── README.md               # This file
```

### **Dependencies**
- **JSZip 3.10.1**: BCF file extraction (BCF files are ZIP archives)
- **SheetJS 0.18.5**: Excel file generation with professional formatting
- **Vanilla JavaScript**: No framework dependencies for maximum compatibility

## **Browser Compatibility**

Tested and working on:
- ✅ Chrome 80+ (Recommended for BCF 3.0 features)
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## **Performance**

- **BCF Processing**: < 2 seconds for typical BCF files (all formats: 2.0, 2.1, 3.0)
- **Field Discovery**: < 1 second for dynamic field detection across all formats
- **Advanced Table Rendering**: < 1 second for 50-row pages with BCF 3.0 field support
- **Filter Response**: < 200ms for typical filtering operations across all BCF versions
- **Template Operations**: < 100ms for create, edit, apply, delete operations (BCF format agnostic)
- **Excel Generation**: < 3 seconds for multi-topic files with BCF 3.0 enhanced formatting
- **UI Updates**: < 500ms for dynamic interface rebuilding with format detection
- **Configuration Storage**: < 50ms for save/load from localStorage
- **File Size Support**: Tested up to 50MB BCF files, optimized for 1000+ topics
- **Memory Efficient**: Client-side processing with optimized algorithms for all BCF formats

## **Contributing**

We welcome contributions! Please feel free to submit pull requests, report issues, or suggest improvements.

### **Development Phases**
- **✅ Phase 1**: Core BCF parsing and hierarchical CSV export **COMPLETE**
- **✅ Phase 2**: Excel export with professional formatting **COMPLETE**
- **✅ Phase 3a**: Modern UI design and export field customization **COMPLETE**
- **✅ Phase 3b**: Dynamic field detection and intelligent adaptation **COMPLETE**
- **✅ Phase 3c**: Advanced data preview with filtering and search **COMPLETE**
- **✅ Phase 3d**: Configuration management and session persistence **COMPLETE**
- **✅ Phase 4**: Universal BCF format support (2.0/2.1/3.0) **COMPLETE**
- **🚀 Version 2.0**: Visual analysis & advanced analytics **FUTURE**

### **Current Status: Version 1.0 COMPLETE - Universal BCF Support**

**Phase 4 Major Achievements:**
- ✅ **Universal BCF Format Support**: Complete compatibility with BCF 2.0, 2.1, and 3.0
- ✅ **Intelligent Enhancement**: BCF 3.0 features only appear when relevant content is detected
- ✅ **Zero Regression**: Perfect backward compatibility maintained for all BCF 2.x functionality
- ✅ **Smart Field Discovery**: Automatic detection and display of BCF 3.0 enhanced fields
- ✅ **Professional Export Integration**: BCF 3.0 fields seamlessly integrated into CSV and Excel exports
- ✅ **Template System Enhancement**: Saved templates work across all BCF formats automatically

**Advanced Data Exploration Achievements:**
- ✅ Professional data table with sorting, filtering, and pagination for datasets up to 1000+ topics
- ✅ Expandable comment system with individual topic control and expand/collapse all functionality
- ✅ Multi-criteria filtering system with real-time statistics and visual feedback
- ✅ Tabbed interface supporting both quick preview and comprehensive data exploration
- ✅ Professional tooltip system with intelligent positioning for truncated content
- ✅ Export preview integration showing exactly what will be exported

**Intelligence & Adaptation Achievements:**
- ✅ Dynamic field discovery based on actual BCF file content across all formats
- ✅ Automatic BCF version detection (2.0 vs 2.1 vs 3.0) with appropriate field presentation
- ✅ Extensions.xsd parsing for project-specific custom field definitions
- ✅ Custom value detection with usage statistics
- ✅ Smart export field selection with unlimited field combinations
- ✅ Production deployment with comprehensive intelligent features

**Core Functionality Achievements:**
- ✅ 100% success rate parsing BCF 2.0/2.1/3.0 files across multiple authoring tools
- ✅ Complete topic and comment extraction with enhanced project parsing
- ✅ Dual export formats: CSV for analysis, Excel for professional reports
- ✅ Professional Excel formatting with headers, styling, and spacing
- ✅ Modern responsive web interface with intelligent field selection
- ✅ Comprehensive error handling and user feedback

**Future Roadmap: Version 2.0 Goals**
- Visual BCF analysis with 3D viewpoint integration
- Advanced analytics and statistical analysis of BCF data  
- Enhanced collaboration features with cloud template sharing
- Workflow automation and batch processing capabilities
- Integration APIs for external project management systems

## **Testing**

**BCFSleuth has been successfully tested with:**

- ✅ **Universal BCF Format Compatibility**: BCF 2.0, 2.1, and 3.0 formats from multiple authoring tools
- ✅ **BCF 3.0 Specific Features**: ServerAssignedId, DocumentReferences, ReferenceLinks, HeaderFiles
- ✅ Files with extensive comment threads (50+ comments per topic) across all formats
- ✅ Large files with 100+ topics (tested up to 103 topics with 247 comments)
- ✅ Multiple project structures (ProjectExtension, ProjectInfo, direct Project)
- ✅ Custom status taxonomies and non-standard BCF variations
- ✅ Files with extensions.xsd custom field definitions
- ✅ Mixed BCF versions in batch processing scenarios (2.x + 3.0 together)
- ✅ Advanced table performance with large datasets and complex filtering
- ✅ Mobile and tablet interaction with responsive table design
- ✅ Template creation, editing, and application across different BCF formats
- ✅ Template import/export functionality with conflict resolution
- ✅ Session persistence and preference restoration across browser restarts
- ✅ Processing history tracking through multiple analysis sessions

**BCFSleuth intelligent adaptation:**

- **Universal Format Detection**: Automatically adapts to BCF 2.0 vs BCF 2.1 vs BCF 3.0
- **Custom Taxonomies**: Discovers and displays project-specific status, type, priority schemes
- **Vendor Extensions**: Finds and exports custom XML elements from any BCF authoring tool
- **Field Intelligence**: Only shows fields that contain actual data in loaded files
- **Export Flexibility**: Users can export any combination of discovered fields with template support
- **Professional Output**: Excel and CSV exports suitable for stakeholder presentations
- **Data Exploration**: Advanced filtering and search capabilities for large BCF datasets
- **Workflow Integration**: Configuration management enables efficient repeated processing
- **Session Continuity**: Persistent templates and preferences for seamless user experience
- **Team Collaboration**: Template sharing enables standardized workflows across teams

## **License**

This project is licensed under the BSD-3-Clause License - see the [LICENSE](LICENSE) file for details.

## **Acknowledgments**

BCFSleuth is inspired by the original [Sloth](https://www.bim42.com/products/sloth.html) application created by **[Simon Moreau](https://www.linkedin.com/in/moreausimon/)** at **[BIM42](https://www.bim42.com/)**. We're grateful for his pioneering work in BCF processing and his open-source contributions to the AECO community.

- Original Sloth project: [GitHub Repository](https://github.com/simonmoreau/Sloth)
- BIM42 website: [bim42.com](https://www.bim42.com)

## About BCF

The Building Collaboration Format (BCF) is an open file format supporting workflow communication in BIM processes. Learn more at [buildingSMART International](https://www.buildingsmart.org/standards/bsi-standards/bim-collaboration-format/).

## Support & Feedback

- 🐛 **Issues**: Report bugs or request features via GitHub Issues
- 💡 **Ideas**: Suggest improvements or new features
- 📧 **Contact**: Reach out via GitHub for questions or collaboration

---

*Built with ❤️ & 🤖 AI assistance for the AECO community*  
*Phases 1, 2, 3a, 3b, 3c, 3d and 4 Complete | Version 2.0 (Visual Analysis & Advanced Analytics) Next*
