# Contributing to BCFSleuth

Thank you for your interest in contributing to BCFSleuth! This guide will help you get started with contributing to our open source BCF analysis tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project follows a simple principle: **Be respectful and constructive**. We welcome contributions from developers of all skill levels and backgrounds. Help create a positive environment where everyone can learn and contribute effectively.

## Getting Started

### Prerequisites

- Basic knowledge of HTML, CSS, and JavaScript
- Familiarity with BCF (Building Collaboration Format) files is helpful but not required
- Git for version control
- A modern web browser for testing

### Project Structure

```
BCFSleuth/
├── index.html              # Main application
├── css/
│   └── style.css           # Application styles
├── js/
│   ├── app.js              # Core application logic
│   ├── bcf-parser.js       # BCF file processing
│   ├── advanced-preview.js # Data preview and filtering
│   ├── image-viewer.js     # Image management
│   ├── analytics-dashboard.js # Charts and analytics
│   ├── configuration.js    # Settings and templates
│   ├── csv-exporter.js     # CSV export functionality
│   └── excel-exporter.js   # Excel export functionality
├── docs/                   # Documentation
├── Landing/                # Landing page
└── README.md
```

## Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/BCFSleuth.git
   cd BCFSleuth
   ```
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Open `index.html`** in your browser to run the application locally
5. **Make your changes** and test thoroughly

## How to Contribute

### Areas Where We Need Help

**High Priority:**
- BCF format compatibility improvements
- Performance optimizations
- Mobile responsiveness enhancements
- Accessibility improvements
- Browser compatibility fixes

**Medium Priority:**
- New export formats
- Additional chart types for analytics
- UI/UX improvements
- Documentation updates
- Translation support

**Good for Beginners:**
- Bug fixes
- Code comments and documentation
- CSS styling improvements
- Test file creation
- Documentation examples

### Types of Contributions

**Bug Reports:**
- Use clear, descriptive titles
- Include steps to reproduce
- Specify browser and version
- Attach sample BCF files if relevant (ensure no sensitive data)

**Feature Requests:**
- Describe the problem you're trying to solve
- Explain how your suggestion would help BCF workflows
- Consider backward compatibility

**Code Contributions:**
- Follow the coding standards below
- Include tests for new functionality
- Update documentation as needed
- Ensure changes work across supported browsers

## Submitting Changes

### Pull Request Process

1. **Update your branch** with the latest main:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git merge main
   ```

2. **Test your changes** thoroughly:
   - Test with different BCF file versions (2.0, 2.1, 3.0)
   - Verify all existing functionality still works
   - Check browser compatibility

3. **Create a pull request** with:
   - Clear title describing the change
   - Detailed description of what was changed and why
   - Screenshots for UI changes
   - Links to related issues

4. **Respond to feedback** promptly and make requested changes

### Pull Request Guidelines

- **Keep changes focused** - one feature or fix per PR
- **Write clear commit messages** using present tense
- **Include relevant tests** for new functionality
- **Update documentation** if you're changing APIs or adding features
- **Ensure backward compatibility** unless explicitly breaking changes

## Coding Standards

### JavaScript

```javascript
// Use clear, descriptive variable names
const processingStatus = 'completed';
const bcfTopicCount = topics.length;

// Add JSDoc comments for functions
/**
 * Parse BCF topic data and extract key information
 * @param {Object} topicData - Raw topic data from BCF file
 * @param {string} bcfVersion - BCF format version (2.0, 2.1, 3.0)
 * @returns {Object} Processed topic object
 */
function parseTopicData(topicData, bcfVersion) {
    // Implementation here
}

// Use consistent error handling
try {
    const result = processBCFFile(file);
    displayResults(result);
} catch (error) {
    console.error('BCF processing failed:', error);
    showUserFeedback('Error processing BCF file', 'error');
}
```

### CSS

```css
/* Use meaningful class names */
.bcf-topic-card {
    /* Properties */
}

/* Group related styles */
.export-button,
.download-button,
.share-button {
    /* Shared button styles */
}

/* Use CSS custom properties for themes */
:root {
    --primary-color: #06b6d4;
    --text-color: #1a1a1a;
}
```

### HTML

```html
<!-- Use semantic HTML -->
<section class="analytics-dashboard">
    <header class="dashboard-header">
        <h2>BCF Analytics</h2>
    </header>
    <main class="dashboard-content">
        <!-- Content -->
    </main>
</section>

<!-- Include proper accessibility attributes -->
<button aria-label="Export BCF data as CSV" class="export-csv-btn">
    Export CSV
</button>
```

## Testing

### Manual Testing Checklist

Before submitting a pull request, test:

- [ ] Upload and process BCF 2.0, 2.1, and 3.0 files
- [ ] All export formats (CSV, Excel, PDF, Word)
- [ ] Image viewer functionality
- [ ] Analytics charts display correctly
- [ ] Mobile responsiveness
- [ ] Keyboard navigation
- [ ] Error handling with invalid files

### Browser Compatibility

Test your changes in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Performance Testing

- Test with large BCF files (1000+ topics)
- Verify memory usage remains reasonable
- Check for console errors or warnings

## Documentation

### Updating Documentation

When making changes that affect users:

1. **Update README.md** for new features or changed workflows
2. **Add code comments** for complex logic
3. **Update JSDoc** for modified functions
4. **Create examples** for new functionality

### Documentation Style

- Use clear, concise language
- Include practical examples
- Assume readers have basic BCF knowledge but may be new to the tool
- Test all code examples before submitting

## Community

### Getting Help

- **GitHub Discussions** - Ask questions and share ideas
- **Issues** - Report bugs or request features
- **Email** - Contact maintainers for security issues

### Communication Guidelines

- **Be specific** about BCF versions, browsers, and error messages
- **Stay focused** on BCF-related functionality
- **Be patient** - maintainers contribute in their spare time
- **Help others** when you can

### Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- README.md acknowledgments

## Development Tips

### Working with BCF Files

- BCF files are ZIP archives containing XML and image files
- Use browser developer tools to inspect BCF structure
- Test with files from different authoring tools (Revit, ArchiCAD, etc.)
- Respect BCF schema requirements for different versions

### Performance Considerations

- BCFSleuth processes everything client-side for data privacy
- Large files with many images can impact performance
- Use efficient DOM manipulation techniques
- Consider lazy loading for large datasets

### Common Pitfalls

- **File paths** - BCF files may have inconsistent internal structure
- **Image formats** - Support various formats (PNG, JPG, etc.)
- **Character encoding** - Handle international characters properly
- **Browser differences** - File API behavior varies between browsers

## License

By contributing to BCFSleuth, you agree that your contributions will be licensed under the same license as the project (BSD 3-Clause License).

---

**Ready to contribute?** Fork the repository and start exploring the codebase. Look for issues labeled "good first issue" to get started, or reach out in GitHub Discussions if you have questions.

Thank you for helping make BCF analysis better for the AECO community!