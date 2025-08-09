# BCFSleuth V2.0

<img width="512" height="512" alt="BCFSleuth_Logo_Color" src="https://github.com/user-attachments/assets/fdd735de-e809-4736-a01c-0c054071b8e9" />

A modern web-based BCF (Building Collaboration Format) platform with universal format support, analytics dashboard, and professional reporting capabilities.

# 🌟 **[Try BCFSleuth V2.0 Live Demo](https://thebimsider.github.io/bcfsleuth/V02/)**

## 🤖 AI-Assisted Development

BCFSleuth V2.0 is what happens when real-world AECO/BIM experience meets AI coding horsepower:

- **🧠 AI Assistant**: Claude (Anthropic) helped with architecture ideas, cranked out code, and tracked down bugs  
- **⚡ Fast Build**: Features that would’ve taken months the old way came together in days  
- **🏗️ Domain Expertise**: 25+ years in AECO/BIM guiding the direction and keeping it practical  
- **🔄 Iterative Workflow**: Build, test, tweak, repeat — until it was rock-solid and ready to use  

The result? A capable, ready-to-work BCF management platform built faster than I thought possible.

## What BCFSleuth Does

BCFSleuth is a modern, web-based evolution of BCF management tools like the original Sloth. It processes BCF files entirely in your browser - no uploads, no accounts, complete privacy. Drag in your BCF files and get instant access to data analysis, image management, and professional reports.

**Universal BCF Support**: Handles all BCF formats (2.0, 2.1, 3.0) with intelligent format detection and adaptation.

## Key Features

### 📊 **Analytics Dashboard**
- **Interactive Charts**: 5 visualization types analyzing status, priority, timeline, authors, and comments
- **Chart Lightbox**: Full-screen viewing with zoom, navigation, and export capabilities
- **Custom Analytics**: Build specialized reports with field selection and cross-analysis
- **Professional Export**: Charts integrated into PDF and Word reports

### 🔍 **Advanced Data Preview**
- **Smart Table**: Sortable columns with multi-criteria filtering (search, status, priority, assignee, dates)
- **Comment Expansion**: Click to view full comment threads without losing context
- **Real-time Search**: Instant filtering across all BCF fields
- **Export Preview**: See exactly what will be exported before generating reports

### 🖼️ **Professional Image Management**
- **Gallery View**: All BCF images with metadata in organized layout
- **Lightbox Viewer**: Full-screen viewing with zoom controls and navigation
- **Bulk Operations**: Download individual images or create ZIP archives with smart naming
- **Report Integration**: Embed images in professional PDF and Word documents

### 📄 **Multi-Format Reports**
- **PDF Reports**: Three layout options with project statistics and embedded images
- **Word Documents**: Fully editable reports perfect for stakeholder collaboration
- **Excel Export**: Formatted spreadsheets with headers and styling
- **CSV Export**: Clean data format for further analysis

### ⚙️ **Enterprise Configuration**
- **Template System**: Save field selection templates for consistent team exports
- **User Preferences**: Customize defaults for format, pagination, and interface settings
- **Processing History**: Track all BCF files processed with detailed metrics
- **Team Collaboration**: Import/export templates via JSON for standardization

## 📖 Read the Full [Documentation](https://thebimsider.github.io/bcfsleuth/Docs/)

## Screenshots

<table>
  <tr>
    <td width="50%">
      <h3>📊 Analytics Dashboard</h3>
      <a href="https://github.com/user-attachments/assets/049a2e19-ed1e-460f-aee7-8846d8d8eaf3">
        <img src="https://github.com/user-attachments/assets/049a2e19-ed1e-460f-aee7-8846d8d8eaf3" alt="BCFSleuth V2.0 Analytics Dashboard" width="100%"/>
      </a>
      <p><em>Interactive charts with full-screen lightbox viewing</em></p>
    </td>
    <td width="50%">
      <h3>🔍 Advanced Preview</h3>
      <a href="https://github.com/user-attachments/assets/7837fa86-5ad2-4990-8a8d-a88c6ffcba78">
        <img src="https://github.com/user-attachments/assets/7837fa86-5ad2-4990-8a8d-a88c6ffcba78" alt="Enhanced Advanced Preview System" width="100%"/>
      </a>
      <p><em>Sortable table with comment expansion and filtering</em></p>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <h3>🖼️ Professional Image Viewer</h3>
      <a href="https://github.com/user-attachments/assets/f520fac0-43ee-4a7f-b247-643b4fcee656">
        <img src="https://github.com/user-attachments/assets/f520fac0-43ee-4a7f-b247-643b4fcee656" alt="BCFSleuth V2.0 Image Lightbox" width="100%"/>
      </a>
      <p><em>Professional image gallery with lightbox viewing and bulk operations</em></p>
    </td>
  </tr>
</table>

## Quick Start

1. **[Open BCFSleuth V2.0](https://thebimsider.github.io/bcfsleuth/V02/)**
2. **Drag & Drop** your BCF file (supports all versions: 2.0, 2.1, 3.0)
3. **Explore Your Data**:
   - **Analytics tab**: View interactive charts and create custom analysis
   - **Advanced Preview**: Sort, filter, and expand comments in your BCF data
   - **Image Viewer**: Browse all images with professional lightbox viewing
   - **Configuration**: Set up templates and preferences for your workflow
4. **Generate Reports**: Export as CSV, Excel, PDF, or Word with embedded charts and images

## Privacy & Security

**Complete Client-Side Processing**: All BCF data, images, and analytics remain in your browser. No uploads, no accounts, no data transmission. Your project information never leaves your device.

## Self-Hosting

BCFSleuth is pure HTML/CSS/JavaScript - no build process required.

```bash
# Clone or download
git clone https://github.com/TheBIMsider/bcfsleuth.git
cd bcfsleuth

# Serve locally
python -m http.server 8000
# or upload to any web server
```

**Hosting Options**: GitHub Pages, Netlify, Vercel, or any traditional web hosting.

## Technical Details

- **Dependencies**: Chart.js, JSZip, SheetJS, jsPDF, docx
- **Browser Support**: Chrome 90+, Firefox 85+, Safari 14+, Edge 90+
- **Performance**: Handles 1000+ topics with 300+ images efficiently
- **Code Quality**: 8,000+ lines of production-quality JavaScript

## Development & Contributing

We welcome contributions from the AECO community:
- 🐛 Report bugs via GitHub Issues
- 💡 Suggest features for openBIM workflows
- 🔧 Submit pull requests
- 📝 Improve documentation

**Development Approach**: Human AECO expertise + AI implementation = rapid delivery of professional-grade tools.

## About BCF

The Building Collaboration Format (BCF) is an open file format supporting workflow communication in BIM processes. Learn more at [buildingSMART International](https://www.buildingsmart.org/standards/bsi-standards/bim-collaboration-format/).

## Acknowledgments

BCFSleuth is inspired by the original **[Sloth](https://www.bim42.com/products/sloth.html)** application created by **[Simon Moreau](https://github.com/simonmoreau/)** at **[BIM42](https://www.bim42.com/)**. We're grateful for his pioneering work in BCF processing and contributions to the AECO community.

## License

This project is licensed under the BSD-3-Clause License.

---

*Built with ❤️ & 🤖 AI assistance by The BIMsider for the AECO community*  
*A modern way to investigate your BCF files with precision*
