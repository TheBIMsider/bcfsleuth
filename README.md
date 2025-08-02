# BCFSleuth

A modern web-based BCF (Building Collaboration Format) file analyzer and CSV/Excel converter with intelligent field discovery.

## 🤖 AI-Assisted Development

This project demonstrates the power of human-AI collaboration in modern software development:

- **🧠 AI Assistant**: Claude (Anthropic) provided architecture guidance, code generation, and debugging support
- **⚡ Live Vibe Coding Sessions**: Built live using AI pair programming and systematic debugging
- **🏗️ Domain Expertise**: AECO/BIM industry knowledge and project direction by [The BIMsider](https://bio.link/thebimsider)
- **🎯 Systematic Approach**: Maintained code quality through structured debugging and iterative refinement

**Why this matters**: Shows how AI tools can empower domain experts to create sophisticated applications while maintaining professional development standards, even without traditional programming backgrounds.

# 📱 Screen Shot

<img width="1030" height="813" alt="BCFSleuth_V01_Phase3b" src="https://github.com/user-attachments/assets/29cf8efc-bb7b-4d6a-8d64-04548fc5fc8b" />

## Live Demo [HERE](https://thebimsider.github.io/bcfsleuth/V01/)

## Overview

BCFSleuth is an intelligent, client-side web application that extracts and converts BCF file data into hierarchical CSV and professional Excel formats. Features dynamic field discovery that adapts to actual BCF content and automatically detects project-specific customizations. Built with modern web technologies for fast, secure, browser-based processing.

## ✅ Current Features (Phases 1, 2, 3a & 3b Complete)

### 🧠 Intelligent Field Discovery (Phase 3b)
- **Dynamic Field Detection**: UI adapts to actual BCF file content - only shows fields containing data
- **Version Awareness**: Automatically detects BCF 2.0 (20 fields) vs BCF 2.1 (22 fields) capabilities
- **Extensions.xsd Integration**: Parses custom field definitions and project-specific taxonomies
- **Custom Value Detection**: Identifies and displays non-standard status, type, and priority values
- **Vendor Field Support**: Discovers custom XML elements and attributes from any BCF authoring tool

### 📊 Smart Export System (Phases 1 & 2)
- **CSV Export**: Hierarchical structure perfect for data analysis and filtering
- **Excel Export**: Professional RFI-style reports with formatting, headers, and styling
- **Dynamic Field Selection**: Export any combination of discovered fields
- **Custom Field Export**: Include vendor-specific data in exports

### 🔍 Advanced BCF Analysis
- **Multi-Version Support**: BCF 2.0 and 2.1 formats with intelligent adaptation
- **Comprehensive Data Extraction**: Topics, comments, viewpoints, and complete metadata
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
4. Select which fields to export using the dynamic field selection interface
5. Choose your export format:
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
├── index.html          # Main application page
├── css/
│   └── style.css       # Modern design system with CSS custom properties
├── js/
│   ├── app.js         # Enhanced application logic (800+ lines)
│   ├── bcf-parser.js  # Advanced BCF parsing with extensions support (450+ lines)
│   ├── csv-exporter.js # CSV export with dynamic field support (300+ lines)
│   └── excel-exporter.js # Excel export with professional formatting (250+ lines)
└── README.md          # This file
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
- **Excel Generation**: < 3 seconds for multi-topic files with complex comments
- **UI Updates**: < 500ms for dynamic interface rebuilding
- **File Size Support**: Tested up to 50MB BCF files
- **Memory Efficient**: Client-side processing with optimized algorithms

## Contributing

We welcome contributions! Please feel free to submit pull requests, report issues, or suggest improvements.

### Development Phases
- **✅ Phase 1**: Core BCF parsing and hierarchical CSV export **COMPLETE**
- **✅ Phase 2**: Excel export with professional formatting **COMPLETE**
- **✅ Phase 3a**: Modern UI design and export field customization **COMPLETE**
- **✅ Phase 3b**: Dynamic field detection and intelligent adaptation **COMPLETE**
- **🚀 Phase 3c**: Advanced data preview with filtering and search **CURRENT**
- **📋 Phase 3d**: Configuration management and session persistence **PLANNED**
- **🔮 Phase 4**: BCF 3.0 support and advanced analytics **FUTURE**

### Current Status (Phase 3b Complete)
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

**Phase 3c Goals (Advanced Data Preview):**
- Enhanced data preview table with search and filtering
- Column sorting and advanced table interactions
- Pagination for large datasets (1000+ topics)
- Real-time filtering integration with export field selection
- Data statistics and summary information

## Testing

**BCFSleuth has been successfully tested with:**

- ✅ BCF 2.0 and BCF 2.1 formats from multiple authoring tools
- ✅ Files with extensive comment threads (50+ comments per topic)
- ✅ Large files with 100+ topics (tested up to 103 topics)
- ✅ Multiple project.bcfp structures (ProjectExtension, ProjectInfo, direct Project)
- ✅ Custom status taxonomies and non-standard BCF variations
- ✅ Files with extensions.xsd custom field definitions
- ✅ Mixed BCF versions in batch processing scenarios

**BCFSleuth intelligent adaptation:**

- **Version Detection**: Automatically adapts to BCF 2.0 vs BCF 2.1
- **Custom Taxonomies**: Discovers and displays project-specific status, type, priority schemes
- **Vendor Extensions**: Finds and exports custom XML elements from any BCF authoring tool
- **Field Intelligence**: Only shows fields that contain actual data in loaded files
- **Export Flexibility**: Users can export any combination of discovered fields
- **Professional Output**: Excel and CSV exports suitable for stakeholder presentations

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
*Phases 1, 2, 3a & 3b Complete | Phase 3c (Advanced Preview) Coming Soon*
