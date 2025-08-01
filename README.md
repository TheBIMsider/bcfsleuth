# BCFSleuth

A modern web-based BCF (Building Collaboration Format) file analyzer and Excel/CSV converter.

![BCFSleuth Interface](https://via.placeholder.com/800x400/2196F3/ffffff?text=BCFSleuth+Interface+Screenshot)

## Overview

BCFSleuth is a client-side web application that extracts and converts BCF file data into Excel or CSV formats for easy analysis and reporting. Built with modern web technologies for fast, secure, browser-based processing.

## Key Features

- **BCF File Analysis**: Support for BCF 2.0 and 2.1 formats
- **Multiple Export Formats**: Generate Excel (.xlsx) and CSV files
- **Client-Side Processing**: All file processing happens in your browser - no uploads to external servers
- **Batch Processing**: Handle multiple BCF files simultaneously
- **Drag & Drop Interface**: Simple, intuitive file handling
- **Cross-Platform**: Works in all modern browsers

## Getting Started

### Quick Start
1. Open `index.html` in your web browser
2. Drag and drop your BCF file(s) onto the upload area
3. Review the extracted data
4. Choose your export format (CSV or Excel)
5. Download your converted file

### Supported BCF Data
- Topic information (Title, Status, Priority, Author)
- Comments and annotations
- Creation and modification dates
- Project metadata
- Topic types and labels

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
│   └── style.css       # Application styles
├── js/
│   ├── app.js         # Main application logic
│   ├── bcf-parser.js  # BCF file parsing
│   └── csv-exporter.js # Export functionality
├── lib/               # External libraries
└── README.md
```

### Dependencies
- **JSZip**: BCF file extraction (BCF files are ZIP archives)
- **SheetJS**: Excel file generation
- **Vanilla JavaScript**: No framework dependencies

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

We welcome contributions! Please feel free to submit pull requests, report issues, or suggest improvements.

### Development Phases
- **Phase 1**: Core BCF parsing and CSV export ✨ *Current*
- **Phase 2**: Excel export and enhanced data extraction
- **Phase 3**: Improved UI and field selection
- **Phase 4**: Advanced features and BCF 3.0 support

## License

This project is licensed under the BSD-3-Clause License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

BCFSleuth is inspired by the original [Sloth](https://www.bim42.com/products/sloth.html) application created by **Simon Moreau** at BIM42. We're grateful for his pioneering work in BCF processing and his open-source contributions to the AECO community.

- Original Sloth project: [GitHub Repository](https://github.com/simonmoreau/Sloth)
- BIM42 website: [bim42.com](https://www.bim42.com)

## About BCF

The Building Collaboration Format (BCF) is an open file format supporting workflow communication in BIM processes. Learn more at [buildingSMART International](https://www.buildingsmart.org/standards/bsi-standards/building-collaboration-format-bcf/).

---

*Built with ❤️ for the AECO community*
