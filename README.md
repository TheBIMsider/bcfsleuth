# BCFSleuth

A modern web-based BCF (Building Collaboration Format) file analyzer and CSV/Excel converter with intelligent field discovery, advanced data preview, and comprehensive configuration management.

## 🤖 AI-Assisted Development

This project demonstrates the power of human-AI collaboration in modern software development:

- **🧠 AI Assistant**: Claude (Anthropic) provided architecture guidance, code generation, and debugging support
- **⚡ Live Vibe Coding Sessions**: Built live using AI pair programming and systematic debugging
- **🏗️ Domain Expertise**: AECO/BIM industry knowledge and project direction by [The BIMsider](https://bio.link/thebimsider)
- **🎯 Systematic Approach**: Maintained code quality through structured debugging and iterative refinement

**Why this matters**: Shows how AI tools can empower domain experts to create sophisticated applications while maintaining professional development standards, even without traditional programming backgrounds.

# 📱 Screenshots

<table>
  <tr>
    <td width="50%">
      <h3>🔄 Easy Upload & Processing</h3>
      <a href="https://github.com/user-attachments/assets/29cf8efc-bb7b-4d6a-8d64-04548fc5fc8b">
        <img src="https://github.com/user-attachments/assets/29cf8efc-bb7b-4d6a-8d64-04548fc5fc8b" alt="BCFSleuth Easy Upload" width="100%"/>
      </a>
      <p><em>Drag & drop BCF files with intelligent field discovery</em></p>
    </td>
    <td width="50%">
      <h3>📊 Simple Preview</h3>
      <a href="https://github.com/user-attachments/assets/c5244e3a-7f53-4958-901d-c2f25e6c188a">
        <img src="https://github.com/user-attachments/assets/c5244e3a-7f53-4958-901d-c2f25e6c188a" alt="Simple Preview Phase 3c" width="100%"/>
      </a>
      <p><em>Quick 5-topic overview with professional styling</em></p>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <h3>🔍 Advanced Preview with Filtering</h3>
      <a href="https://github.com/user-attachments/assets/152c08b9-fc4b-4c03-bc80-b58609057227">
        <img src="https://github.com/user-attachments/assets/152c08b9-fc4b-4c03-bc80-b58609057227" alt="Advanced Preview with Filtering Phase 3c" width="70%"/>
      </a>
      <p><em>Professional data exploration with search, filtering, sorting, and pagination</em></p>
    </td>
  </tr>
</table>

> 💡 **Click any screenshot to view full size**

## Live Demo [HERE](https://thebimsider.github.io/bcfsleuth/V01/)

## Overview

BCFSleuth is an intelligent, client-side web application that extracts and converts BCF file data into hierarchical CSV and professional Excel formats. Features dynamic field discovery that adapts to actual BCF content, automatically detects project-specific customizations, provides advanced data exploration capabilities, and includes comprehensive configuration management for professional workflows. Built with modern web technologies for fast, secure, browser-based processing.

## ✅ Current Features (Phases 1, 2, 3a, 3b, 3c, 3d Complete)

### 🧠 Intelligent Field Discovery (Phase 3b)
- **Dynamic Field Detection**: UI adapts to actual BCF file content - only shows fields containing data
- **Version Awareness**: Automatically detects BCF 2.0 (20 fields) vs BCF 2.1 (22 fields) capabilities
- **Extensions.xsd Integration**: Parses custom field definitions and project-specific taxonomies
- **Custom Value Detection**: Identifies and displays non-standard status, type, and priority values
- **Vendor Field Support**: Discovers custom XML elements and attributes from any BCF authoring tool

### 🔍 Advanced Data Preview & Filtering (Phase 3c)
- **Tabbed Interface**: Simple Preview (5 topics) vs Advanced Preview (full dataset exploration)
- **Professional Data Table**: Sortable columns, intelligent pagination, and responsive design
- **Expandable Comments**: Click blue arrows (▶) to expand/collapse topic comments individually
- **Multi-Criteria Filtering**: Search, Status, Priority, Assigned To, Due Date with real-time results
- **Smart Search**: Global text search across all displayed fields with instant filtering
- **Summary Dashboard**: Real-time statistics (Total Topics, Comments, Open Issues, High Priority, Overdue)
- **Professional Tooltips**: Full-text display for truncated content with intelligent positioning

### ⚙️ Configuration Management (Phase 3d)
- **Export Templates**: Save and manage field selection combinations for quick reuse
- **Template Operations**: Create, edit, apply, and delete export configurations with full CRUD operations
- **Session Persistence**: User preferences and templates saved between browser sessions
- **Smart Export Filenames**: Template-based filename generation with variable substitution (`{project_name}`, `{date}`, `{time}`)
- **Processing History**: Automatic tracking of BCF analysis sessions with detailed metrics
- **User Preferences**: Customizable defaults for export format, page size, tooltips, and session behavior

### 📊 Smart Export System (Phases 1 & 2)
- **CSV Export**: Hierarchical structure perfect for data analysis and filtering
- **Excel Export**: Professional RFI-style reports with formatting, headers, and styling
- **Dynamic Field Selection**: Export any combination of discovered fields
- **Custom Field Export**: Include vendor-specific data in exports
- **Export Preview**: Advanced table shows exactly what will be exported
- **Template Integration**: Export using saved template configurations with custom filenames

### 🔍 Comprehensive BCF Analysis
- **Multi-Version Support**: BCF 2.0 and 2.1 formats with intelligent adaptation
- **Complete Data Extraction**: Topics, comments, viewpoints, and comprehensive metadata
- **Enhanced Project Parsing**: Handles multiple BCF project structures and naming variations
- **Custom Taxonomy Recognition**: Detects project-specific status, type, and priority schemes
- **Batch Processing**: Handle multiple BCF files simultaneously with consolidated analysis

### 🎨 Modern User Interface (Phase 3a)
- **Contemporary Design**: Modern color scheme with CSS custom properties and dark mode support
- **Smart Field Selection**: Organized categories with usage indicators and custom value counts
- **Drag & Drop Interface**: Intuitive file handling with real-time feedback
- **Responsive Design**: Optimized experience across desktop, tablet, and mobile devices
- **Export Customization**: Complete control over which fields to include in exports

## Getting Started

### Quick Start (Use Live Demo)
1. Open [BCFSleuth Live Demo](https://thebimsider.github.io/bcfsleuth/V01/)
2. Drag and drop your BCF file(s) onto the upload area
3. Review the intelligently discovered fields with custom value indicators
4. **Simple Preview**: Quick 5-topic overview with enhanced styling
5. **Advanced Preview**: Switch tabs for full data exploration with:
   - Search across all fields
   - Filter by Status, Priority, Assigned To, Due Date
   - Sort any column (click headers)
   - Expand/collapse topic comments (click blue ▶ arrows)
   - Paginate through large datasets (25/50/100 rows)
   - View full content with professional tooltips
6. **Configuration**: Switch to Configuration tab for:
   - Creating export templates from current field selections
   - Managing saved templates (create, edit, apply, delete)
   - Setting user preferences and defaults
   - Viewing processing history
7. Select which fields to export using the dynamic field selection interface
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

## Advanced Data Exploration (Phase 3c)

### Professional Data Table Features
- **Column Sorting**: Click any header to sort (Title, Status, Priority, Author, Date, etc.)
- **Expandable Comments**: Click blue triangles (▶) next to topics to show/hide comment rows
- **Expand/Collapse All**: Quick controls to expand or collapse all topic comments at once
- **Multi-Criteria Filtering**: Combine search with Status, Priority, Assignee, and Due Date filters
- **Flexible Pagination**: Choose 25, 50, or 100 rows per page with smart navigation
- **Topic/Comment Hierarchy**: Comments nested under topics with visual indicators (↳)
- **Professional Tooltips**: Hover over truncated text to see full content
- **Export Integration**: Table displays exactly the fields selected for export

### Smart Filtering System
- **Global Search**: Search across all visible fields simultaneously
- **Status Filtering**: Filter by Open, In Progress, Under Review, Closed, Rejected + custom statuses
- **Priority Filtering**: Filter by Low, Medium, High, Critical + custom priority levels
- **Assignee Filtering**: Filter by any team member found in the BCF data
- **Due Date Filtering**: Show Overdue, This Week, Next Week, or No Due Date items
- **Active Filter Display**: Visual tags show applied filters with easy removal

### Real-Time Statistics Dashboard
- **Total Topics**: Count of all topics in current filter view
- **Total Comments**: Sum of all comments across filtered topics
- **Open Issues**: Count of topics with Open/In Progress/Under Review status
- **High Priority**: Count of High and Critical priority items
- **Overdue**: Count of topics past their due date

## Configuration Management (Phase 3d)

### Export Template System
- **Template Creation**: Save current field selections as reusable templates
- **Smart Templates**: "Save From Current Selection" automatically suggests template names
- **Template Editing**: Full edit capability with visual feedback and form pre-population
- **Template Application**: One-click application of saved field combinations
- **Template Metadata**: Name, description, custom filename template, and usage tracking
- **Template Library**: Organized display with last-used dates and field counts

### Template Features
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

### Session Persistence
- **User Preferences**: Default export format, page size, tooltip settings, auto-save behavior
- **Template Storage**: All saved templates persist between browser sessions
- **Processing History**: Automatic tracking of analysis sessions with detailed metrics
- **Preference Restoration**: Settings automatically applied when application loads
- **Reset Functionality**: Easy reset to factory defaults when needed

### Processing History
- **Automatic Tracking**: Every export operation logged with comprehensive metrics
- **Session Details**: Filename, project name, topic/comment counts, field selections
- **Export Information**: Format used, template applied, timestamp, and processing efficiency
- **History Management**: View recent sessions, clear history, export history as CSV
- **Audit Trail**: Complete record for compliance and project tracking

## Intelligent Field Discovery

### Supported BCF Data (20-25+ Fields Discovered Dynamically)
BCFSleuth automatically discovers and displays only the fields that contain actual data in your BCF files:

- **Topic Information**: Title, Description, Status, Priority, Type, Stage, Labels, Assignments
- **Dates & Authors**: Creation/Modified authors and timestamps, due dates
- **Project Metadata**: BCF version, project names, source files, topic GUIDs
- **Comments & Counts**: Full comment threads with authors, dates, content, and viewpoint counts
- **Custom Fields**: Any vendor-specific XML elements or attributes discovered in BCF files

### Smart Field Indicators
- **Custom Value Counts**: "Status (11 custom)" shows project-specific taxonomies
- **Usage Statistics**: "(4 found)" indicates how many unique values exist
- **Version Adaptation**: BCF 2.0 vs 2.1 field availability automatically detected
- **Extensions Integration**: Custom fields from extensions.xsd files displayed with definitions

### Export Formats

#### CSV Export (Data Analysis)
Hierarchical CSV structure optimized for Excel analysis:
```
Row Type | Topic Data...                    | Comment Data...
Topic    | HVAC Issue, High Priority, etc. | [empty]
Comment  | [empty]                         | Comment 1, Author, Date, Text
Comment  | [empty]                         | Comment 2, Author, Date, Text
```

#### Excel Export (Professional Reports)
Formatted reports with dynamic field selection:
```
BCF Analysis Report [Date]

Files processed: 2
Project(s): C9 Truck Shop
Total Topics: 15
Total Comments: 47

Topic # | Title        | Status      | Priority | Type  | Creation Date | Author
--------|--------------|-------------|----------|-------|---------------|--------
1       | HVAC & BEAM  | In Progress | Medium   | Issue | 2018-04-14   | john.dog

        | Comments     | Author      | Date      | Comment Text
        |--------------|-------------|-----------|-------------
        | 1            | john.dog   | 2018-04-14| Initial issue report
        | 2            | carl.bimsider | 2018-04-15| Reviewing with team
```

**Enhanced Excel Features:**
- Professional title and summary sections
- Bold headers with background colors and borders
- Dynamic column widths based on selected fields
- Comment subsections nested under each topic
- Clean spacing and visual hierarchy
- Support for any combination of discovered fields
- Template-based filename generation

## Development

### Local Development Setup
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

### Project Structure
```
bcfsleuth/
├── index.html              # Main application with tabbed interface and configuration
├── css/
│   └── style.css           # Modern design system with Phase 3c+3d styling
├── js/
│   ├── app.js              # Enhanced application logic with config integration
│   ├── advanced-preview.js # Advanced data table with filtering, sorting, pagination
│   ├── configuration.js    # NEW: Complete configuration management system
│   ├── bcf-parser.js       # Advanced BCF parsing with extensions support
│   ├── csv-exporter.js     # CSV export with dynamic field support
│   └── excel-exporter.js   # Excel export with professional formatting
└── README.md               # This file
```

### Dependencies
- **JSZip 3.10.1**: BCF file extraction (BCF files are ZIP archives)
- **SheetJS 0.18.5**: Excel file generation with professional formatting
- **Vanilla JavaScript**: No framework dependencies for maximum compatibility

## Browser Compatibility

Tested and working on:
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## Performance

- **BCF Processing**: < 2 seconds for typical BCF files
- **Field Discovery**: < 1 second for dynamic field detection
- **Advanced Table Rendering**: < 1 second for 50-row pages
- **Filter Response**: < 200ms for typical filtering operations
- **Template Operations**: < 100ms for create, edit, apply, delete operations
- **Excel Generation**: < 3 seconds for multi-topic files with complex comments
- **UI Updates**: < 500ms for dynamic interface rebuilding
- **Configuration Storage**: < 50ms for save/load from localStorage
- **File Size Support**: Tested up to 50MB BCF files, optimized for 1000+ topics
- **Memory Efficient**: Client-side processing with optimized algorithms

## Contributing

We welcome contributions! Please feel free to submit pull requests, report issues, or suggest improvements.

### Development Phases
- **✅ Phase 1**: Core BCF parsing and hierarchical CSV export **COMPLETE**
- **✅ Phase 2**: Excel export with professional formatting **COMPLETE**
- **✅ Phase 3a**: Modern UI design and export field customization **COMPLETE**
- **✅ Phase 3b**: Dynamic field detection and intelligent adaptation **COMPLETE**
- **✅ Phase 3c**: Advanced data preview with filtering and search **COMPLETE**
- **✅ Phase 3d**: Configuration management and session persistence **COMPLETE**
- **🔮 Phase 4**: BCF 3.0 support and advanced analytics **FUTURE**

### Current Status (Phase 3d Complete)
**Configuration Management Achievements:**
- ✅ Complete export template system with create, edit, apply, and delete operations
- ✅ Session persistence with localStorage integration and error handling
- ✅ Smart export filename generation with template variable substitution
- ✅ Processing history with automatic session tracking and CSV export capability
- ✅ User preference management with customizable defaults and reset functionality
- ✅ Professional configuration interface with responsive design

**Advanced Data Exploration Achievements:**
- ✅ Professional data table with sorting, filtering, and pagination for datasets up to 1000+ topics
- ✅ Expandable comment system with individual topic control and expand/collapse all functionality
- ✅ Multi-criteria filtering system with real-time statistics and visual feedback
- ✅ Tabbed interface supporting both quick preview and comprehensive data exploration
- ✅ Professional tooltip system with intelligent positioning for truncated content
- ✅ Export preview integration showing exactly what will be exported

**Intelligence & Adaptation Achievements:**
- ✅ Dynamic field discovery based on actual BCF file content
- ✅ Automatic BCF version detection (2.0 vs 2.1) with appropriate field presentation
- ✅ Extensions.xsd parsing for project-specific custom field definitions
- ✅ Custom value detection with usage statistics
- ✅ Smart export field selection with unlimited field combinations
- ✅ Production deployment with comprehensive intelligent features

**Core Functionality Achievements:**
- ✅ 100% success rate parsing BCF 2.0/2.1 files across multiple authoring tools
- ✅ Complete topic and comment extraction with enhanced project parsing
- ✅ Dual export formats: CSV for analysis, Excel for professional reports
- ✅ Professional Excel formatting with headers, styling, and spacing
- ✅ Modern responsive web interface with intelligent field selection
- ✅ Comprehensive error handling and user feedback

**Phase 4 Goals (Advanced Features):**
- BCF 3.0 format support with enhanced field discovery
- Advanced analytics and statistical analysis of BCF data
- Template sharing and import/export capabilities
- Workflow automation and batch processing features
- Integration APIs for external project management systems

## Testing

**BCFSleuth has been successfully tested with:**

- ✅ BCF 2.0 and BCF 2.1 formats from multiple authoring tools
- ✅ Files with extensive comment threads (50+ comments per topic)
- ✅ Large files with 100+ topics (tested up to 103 topics with 247 comments)
- ✅ Multiple project.bcfp structures (ProjectExtension, ProjectInfo, direct Project)
- ✅ Custom status taxonomies and non-standard BCF variations
- ✅ Files with extensions.xsd custom field definitions
- ✅ Mixed BCF versions in batch processing scenarios
- ✅ Advanced table performance with large datasets and complex filtering
- ✅ Mobile and tablet interaction with responsive table design
- ✅ Template creation, editing, and application across different BCF files
- ✅ Session persistence and preference restoration across browser restarts
- ✅ Processing history tracking through multiple analysis sessions

**BCFSleuth intelligent adaptation:**

- **Version Detection**: Automatically adapts to BCF 2.0 vs BCF 2.1
- **Custom Taxonomies**: Discovers and displays project-specific status, type, priority schemes
- **Vendor Extensions**: Finds and exports custom XML elements from any BCF authoring tool
- **Field Intelligence**: Only shows fields that contain actual data in loaded files
- **Export Flexibility**: Users can export any combination of discovered fields with template support
- **Professional Output**: Excel and CSV exports suitable for stakeholder presentations
- **Data Exploration**: Advanced filtering and search capabilities for large BCF datasets
- **Workflow Integration**: Configuration management enables efficient repeated processing
- **Session Continuity**: Persistent templates and preferences for seamless user experience

## License

This project is licensed under the BSD-3-Clause License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

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
*Phases 1, 2, 3a, 3b, 3c & 3d Complete | Phase 4 (Advanced Features) Next*
