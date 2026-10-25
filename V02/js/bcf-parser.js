// BCF Parser - Handles BCF file extraction and parsing
class BCFParser {
  /**
   * Debug logging that respects the app's debug mode (silent unless enabled)
   * @param {string} message - Debug message
   * @param {any} data - Optional data to log
   */
  static debugLog(message, data = null) {
    window.bcfApp?.debugLog(message, data);
  }

  static async parse(file) {
    try {
      if (typeof JSZip === 'undefined') {
        throw new Error(
          'The ZIP library (JSZip) failed to load. Check your internet connection and refresh the page.'
        );
      }

      // Load the BCF file as a ZIP archive
      const zip = await JSZip.loadAsync(file);

      // Dump archive structure only when debug mode is on
      if (window.BCF_DEBUG_MODE) {
        await this.debugBCFStructure(zip, file.name);
      }

      // Parse BCF structure
      const bcfData = {
        filename: file.name,
        version: null,
        project: {},
        topics: [],
        extensions: null,
      };

      // Parse version file
      await this.parseVersion(zip, bcfData);

      // Parse project file
      await this.parseProject(zip, bcfData);

      // Parse extensions (if present)
      await this.parseExtensions(zip, bcfData);

      // Parse documents (BCF 3.0 feature, optional for BCF 2.x)
      await this.parseDocuments(zip, bcfData);

      // Parse all topics
      await this.parseTopics(zip, bcfData);

      return bcfData;
    } catch (error) {
      console.error('Error parsing BCF file:', error);
      throw new Error(`Failed to parse BCF file: ${error.message}`);
    }
  }

  /**
   * Enhanced version detection with BCF 3.0 support
   * This method analyzes multiple indicators to determine BCF version accurately
   * Priority: BCF 2.x compatibility is critical, BCF 3.0 is enhancement
   */
  static async parseVersion(zip, bcfData) {
    const versionFile = zip.file('bcf.version');
    if (!versionFile) {
      throw new Error('Invalid BCF file: missing bcf.version file');
    }

    try {
      const versionXml = await versionFile.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(versionXml, 'text/xml');

      const versionElement = doc.querySelector('Version');
      if (versionElement) {
        const versionId = versionElement.getAttribute('VersionId') || 'Unknown';
        bcfData.version = versionId;

        // Enhanced format detection with multiple validation methods
        if (versionId.startsWith('3.')) {
          // Verify BCF 3.0 with additional structure checks
          const confirmed3_0 = await this.confirmBCF30Format(zip);
          if (confirmed3_0) {
            bcfData.bcfFormat = '3.0';
            this.debugLog('✅ BCF 3.0 format confirmed:', versionId);
          } else {
            // Fallback if structure doesn't match BCF 3.0
            bcfData.bcfFormat = '2.1';
            console.warn('⚠️ Version claims 3.0 but structure suggests 2.1');
          }
        } else if (versionId.startsWith('2.1')) {
          bcfData.bcfFormat = '2.1';
          this.debugLog('✅ BCF 2.1 format detected:', versionId);
        } else if (versionId.startsWith('2.0')) {
          bcfData.bcfFormat = '2.0';
          this.debugLog('✅ BCF 2.0 format detected:', versionId);
        } else {
          // Unknown version - use intelligent detection
          bcfData.bcfFormat = await this.detectFormatFromStructure(zip);
          this.debugLog(
            '🔍 Unknown version detected, using structure analysis:',
            versionId
          );
        }
      } else {
        console.warn('⚠️ No Version element found in bcf.version');
        bcfData.version = 'Unknown';
        bcfData.bcfFormat = await this.detectFormatFromStructure(zip);
      }
    } catch (error) {
      console.warn('❌ Error parsing version file:', error);
      bcfData.version = 'Unknown';
      bcfData.bcfFormat = await this.detectFormatFromStructure(zip);
    }
  }

  /**
   * Parse project file with BCF 3.0 support
   * Handles both ProjectExtension (BCF 2.x) and ProjectInfo (BCF 3.0) formats
   */
  static async parseProject(zip, bcfData) {
    const projectFile = zip.file('project.bcfp');
    if (!projectFile) {
      console.warn('No project.bcfp file found');
      bcfData.project = {
        name: 'Unknown Project',
        projectId: '',
        bcfFormat: bcfData.bcfFormat || '2.1',
      };
      return;
    }

    try {
      const projectXml = await projectFile.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(projectXml, 'text/xml');

      let projectName = '';
      let projectId = '';
      let hasExtensionSchema = false;

      // Handle different BCF formats
      if (bcfData.bcfFormat === '3.0') {
        // BCF 3.0: ProjectInfo structure
        const result = this.parseBCF30Project(doc);
        projectName = result.name;
        projectId = result.id;
        hasExtensionSchema = false; // Removed in BCF 3.0
      } else {
        // BCF 2.x: ProjectExtension structure (your existing logic enhanced)
        const result = this.parseBCF2xProject(doc);
        projectName = result.name;
        projectId = result.id;
        hasExtensionSchema = result.hasExtensionSchema;
      }

      // Fallback: Try all methods if primary method failed
      if (!projectName) {
        this.debugLog('Primary parsing failed, trying fallback methods...');
        const fallbackResult = this.parseProjectFallback(doc);
        projectName = fallbackResult.name || projectName;
        projectId = fallbackResult.id || projectId;
      }

      this.debugLog('✅ Final parsed project name:', projectName);
      this.debugLog('✅ Final parsed project ID:', projectId);

      bcfData.project = {
        name: projectName || 'Unknown Project',
        projectId: projectId || '',
        bcfFormat: bcfData.bcfFormat || '2.1',
        hasExtensionSchema: hasExtensionSchema,
        // Add documents info for later reference
        hasDocuments: bcfData.documents && bcfData.documents.totalDocuments > 0,
      };
    } catch (error) {
      console.warn('Error parsing project file:', error);
      bcfData.project = {
        name: 'Unknown Project',
        projectId: '',
        bcfFormat: bcfData.bcfFormat || '2.1',
        hasExtensionSchema: false,
      };
    }
  }

  /**
   * Collect unique enumeration values from an extensions XSD whose enclosing
   * type name contains the given keyword (case-insensitive).
   * @param {Document} doc - Parsed extensions.xsd
   * @param {string} keyword - Lowercase keyword, e.g. 'status'
   * @returns {string[]} Unique enumeration values in document order
   */
  static extractEnumerationValues(doc, keyword) {
    const values = [];
    const elements = doc.querySelectorAll(
      'xs\\:enumeration[value], enumeration[value]'
    );

    elements.forEach((element) => {
      const parentName =
        element
          .closest('xs\\:restriction, restriction')
          ?.parentElement?.getAttribute('name') ||
        element.closest('xs\\:simpleType, simpleType')?.getAttribute('name');

      if (parentName && parentName.toLowerCase().includes(keyword)) {
        const value = element.getAttribute('value');
        if (value && !values.includes(value)) {
          values.push(value);
        }
      }
    });

    return values;
  }

  static async parseExtensions(zip, bcfData) {
    const extensionsFile = zip.file('extensions.xsd');
    if (!extensionsFile) {
      return; // Extensions are optional
    }

    try {
      const extensionsXml = await extensionsFile.async('text');

      // Parse the XSD to extract custom field definitions
      const parser = new DOMParser();
      const doc = parser.parseFromString(extensionsXml, 'text/xml');

      const extensions = {
        rawXml: extensionsXml,
        customFields: {
          topicStatus: [],
          topicType: [],
          priority: [],
          topicLabel: [],
          stage: [],
          userIdType: [],
        },
      };

      const fields = extensions.customFields;
      fields.topicStatus = this.extractEnumerationValues(doc, 'status');
      fields.topicType = this.extractEnumerationValues(doc, 'type');
      fields.priority = this.extractEnumerationValues(doc, 'priority');
      fields.topicLabel = this.extractEnumerationValues(doc, 'label');

      this.debugLog('Parsed extensions:', extensions.customFields);
      bcfData.extensions = extensions;
    } catch (error) {
      console.warn('Error parsing extensions file:', error);
      bcfData.extensions = { rawXml: '', customFields: {} };
    }
  }

  /**
   * Parse BCF 3.0 documents.xml file
   * This file contains document metadata and references introduced in BCF 3.0
   * For BCF 2.x files, this method will simply return (no documents.xml file)
   */
  static async parseDocuments(zip, bcfData) {
    const documentsFile = zip.file('documents.xml');
    if (!documentsFile) {
      // No documents.xml file - this is normal for BCF 2.x files
      bcfData.documents = null;
      return;
    }

    try {
      const documentsXml = await documentsFile.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(documentsXml, 'text/xml');

      const documents = {
        rawXml: documentsXml,
        documentList: [],
        totalDocuments: 0,
      };

      // Parse individual document entries
      const documentElements = doc.querySelectorAll('Document');
      documentElements.forEach((docElement) => {
        const document = {
          guid: docElement.getAttribute('Guid') || '',
          filename: '',
          description: '',
        };

        // Extract document details
        const filenameElement = docElement.querySelector('Filename');
        const descriptionElement = docElement.querySelector('Description');

        if (filenameElement) {
          document.filename = filenameElement.textContent?.trim() || '';
        }

        if (descriptionElement) {
          document.description = descriptionElement.textContent?.trim() || '';
        }

        // Only add documents with meaningful data
        if (document.guid || document.filename) {
          documents.documentList.push(document);
        }
      });

      documents.totalDocuments = documents.documentList.length;

      this.debugLog(
        `📄 Parsed ${documents.totalDocuments} documents from documents.xml`
      );
      bcfData.documents = documents;
    } catch (error) {
      console.warn('❌ Error parsing documents.xml:', error);
      bcfData.documents = {
        rawXml: '',
        documentList: [],
        totalDocuments: 0,
        error: error.message,
      };
    }
  }

  static async parseTopics(zip, bcfData) {
    const topics = [];

    // Find all topic folders (GUIDs) - improved detection
    const topicFolders = new Set();
    zip.forEach((relativePath, file) => {
      // Check if this is a file inside a GUID folder
      const pathParts = relativePath.split('/');
      if (pathParts.length >= 2) {
        const potentialGuid = pathParts[0];
        if (this.isGuid(potentialGuid)) {
          topicFolders.add(potentialGuid);
        }
      }
    });

    const topicFoldersArray = Array.from(topicFolders);
    this.debugLog('Found topic folders:', topicFoldersArray);

    // Parse each topic with BCF format information
    for (const topicGuid of topicFolders) {
      try {
        const topic = await this.parseTopic(zip, topicGuid, bcfData.bcfFormat);
        if (topic) {
          topics.push(topic);
        }
      } catch (error) {
        console.warn(`Error parsing topic ${topicGuid}:`, error);
      }
    }

    bcfData.topics = topics;
  }

  static async parseTopic(zip, topicGuid, bcfFormat = '2.1') {
    const markupFile = zip.file(`${topicGuid}/markup.bcf`);
    if (!markupFile) {
      console.warn(`No markup.bcf found for topic ${topicGuid}`);
      return null;
    }

    try {
      const markupXml = await markupFile.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(markupXml, 'text/xml');

      // Get the Topic element to read attributes
      const topicElement = doc.querySelector('Topic');

      // Initialize topic with all basic data
      const topic = this.initializeTopicData(
        topicElement,
        doc,
        topicGuid,
        markupXml,
        bcfFormat
      );

      // Extract topic labels using dedicated method
      this.extractTopicLabels(doc, topic);

      // Extract custom fields using dedicated method
      this.processTopicCustomFields(topicElement, doc, topic);

      // Parse comments (they might be in markup.bcf instead of separate comments.bcf)
      await this.parseComments(zip, topicGuid, topic, doc);

      // Process viewpoints and coordinates using dedicated method
      await this.processTopicViewpoints(zip, topicGuid, doc, topic);

      // Store ZIP reference for lazy image loading (don't extract images yet)
      topic._zipReference = zip;
      topic._topicGuid = topicGuid;
      topic._imagesExtracted = false;

      return topic;
    } catch (error) {
      console.error(`Error parsing topic ${topicGuid}:`, error);
      return null;
    }
  }

  /**
   * Extract topic labels with comprehensive BCF format support
   * Handles various BCF authoring tools and format differences
   * @param {Document} doc - The parsed markup XML document
   * @param {Object} topic - The topic object to populate with labels
   */
  static extractTopicLabels(doc, topic) {
    // Initialize labels array
    topic.labels = [];

    // Method 1: Extract from standard label elements
    const labelElements = doc.querySelectorAll(
      'Labels Label, Tags Tag, Categories Category, TopicLabels TopicLabel'
    );

    labelElements.forEach((label) => {
      const labelText = label.textContent?.trim();
      if (labelText && labelText.length > 0) {
        topic.labels.push(labelText);
      }
    });

    // Method 2: Check for Labels as direct children with different structures
    // Some BCF tools store labels differently
    const labelsContainer = doc.querySelector('Labels, TopicLabels');
    if (labelsContainer) {
      // Check for direct text content (some tools use this format)
      const directLabels = labelsContainer.textContent?.trim();
      if (directLabels && !topic.labels.length) {
        // Split by common delimiters and clean up
        const labelArray = directLabels
          .split(/[,;|]/)
          .map((label) => label.trim())
          .filter((label) => label.length > 0);

        if (labelArray.length > 0) {
          topic.labels.push(...labelArray);
        }
      }

      // Method 3: Check for attribute-based labels (some BCF variants)
      const labelValue =
        labelsContainer.getAttribute('value') ||
        labelsContainer.getAttribute('Label');
      if (labelValue && !topic.labels.length) {
        topic.labels.push(labelValue.trim());
      }
    }
  }

  /**
   * Process all custom fields for a topic
   * Extracts custom fields from topic element and scans for unknown elements
   * @param {Element} topicElement - The Topic XML element
   * @param {Document} doc - The complete markup XML document
   * @param {Object} topic - The topic object to populate with custom fields
   */
  static processTopicCustomFields(topicElement, doc, topic) {
    // Initialize custom fields storage
    topic._customFields = {};

    // Extract custom fields from Topic element attributes and children
    this.extractCustomFields(topicElement, topic._customFields, 'topic');

    // Scan entire document for any unrecognized elements
    this.scanForUnknownElements(doc, topic._customFields);
  }

  /**
   * Process all viewpoint data for a topic including coordinates
   * Handles viewpoint parsing and coordinate extraction with comprehensive logging
   * @param {JSZip} zip - The BCF ZIP file for coordinate extraction
   * @param {string} topicGuid - The topic GUID for file path construction
   * @param {Document} doc - The markup XML document for viewpoint parsing
   * @param {Object} topic - The topic object to populate with viewpoint data
   */
  static async processTopicViewpoints(zip, topicGuid, doc, topic) {
    // Parse basic viewpoint structure from markup
    this.parseViewpoints(doc, topic);

    // Extract detailed coordinate data from .bcfv files
    await this.extractViewpointCoordinatesFromZip(zip, topicGuid, topic);
  }

  /**
   * Initialize topic object with all basic data and metadata
   * Extracts all standard BCF fields and handles format-specific features
   * @param {Element} topicElement - The Topic XML element
   * @param {Document} doc - The complete markup XML document
   * @param {string} topicGuid - The topic GUID
   * @param {string} markupXml - The raw markup XML for storage
   * @param {string} bcfFormat - The BCF format version ('2.0', '2.1', '3.0')
   * @returns {Object} - Initialized topic object with all basic data
   */
  static initializeTopicData(
    topicElement,
    doc,
    topicGuid,
    markupXml,
    bcfFormat
  ) {
    const topic = {
      guid: topicGuid,
      title: this.getElementTextWithAliases(doc, ['Title', 'Subject', 'Name']),
      topicStatus: this.getTopicStatusWithAliases(topicElement, doc),
      topicType: this.getTopicTypeWithAliases(topicElement, doc),
      priority: this.getElementTextWithAliases(doc, [
        'Priority',
        'Importance',
        'Severity',
      ]),
      description: this.getElementTextWithAliases(doc, [
        'Description',
        'Details',
        'Notes',
      ]),
      creationDate: this.getElementTextWithAliases(doc, [
        'CreationDate',
        'Created',
        'DateCreated',
      ]),
      creationAuthor: this.getElementTextWithAliases(doc, [
        'CreationAuthor',
        'Author',
        'CreatedBy',
        'Creator',
      ]),
      modifiedDate: this.getElementTextWithAliases(doc, [
        'ModifiedDate',
        'Modified',
        'LastModified',
        'DateModified',
      ]),
      modifiedAuthor: this.getElementTextWithAliases(doc, [
        'ModifiedAuthor',
        'ModifiedBy',
        'LastModifiedBy',
      ]),
      dueDate: this.getElementTextWithAliases(doc, [
        'DueDate',
        'Due',
        'Deadline',
        'TargetDate',
      ]),
      assignedTo: this.getElementTextWithAliases(doc, [
        'AssignedTo',
        'Assigned',
        'Owner',
        'Responsible',
      ]),
      stage: this.getElementTextWithAliases(doc, [
        'Stage',
        'Phase',
        'Step',
        'Milestone',
      ]),
      topicIndex: this.getElementTextWithAliases(doc, [
        'Index',
        'TopicIndex',
        'Number',
      ]),
      labels: [],
      comments: [],
      viewpoints: [],

      // BCF 3.0 specific fields (will be empty for BCF 2.x)
      serverAssignedId: '',
      referenceLinks: [],
      headerFiles: [],

      // Store BCF format for processing decisions
      _bcfFormat: bcfFormat,

      // Existing fields for advanced analysis
      _rawXml: markupXml,
      _topicElement: topicElement,
      _customFields: {},
    };

    // Extract BCF 3.0 specific fields if format is 3.0
    if (bcfFormat === '3.0') {
      this.extractBCF30Fields(topicElement, doc, topic);
    }

    return topic;
  }

  /**
   * Discover all image files in a topic folder
   * Scans the BCF ZIP file for image files within the specified topic folder
   * @param {JSZip} zip - The BCF ZIP file
   * @param {string} topicGuid - The topic GUID to search within
   * @returns {Array} - Array of image file objects with filename, path, and file reference
   */
  static discoverTopicImageFiles(zip, topicGuid) {
    const topicImageFiles = [];

    zip.forEach((relativePath, file) => {
      const pathParts = relativePath.split('/');
      if (pathParts.length === 2 && pathParts[0] === topicGuid) {
        const filename = pathParts[1];
        if (this.isImageFile(filename)) {
          topicImageFiles.push({
            filename: filename,
            path: relativePath,
            file: file,
          });
        }
      }
    });

    return topicImageFiles;
  }

  /**
   * Match viewpoints to their corresponding image files using multiple strategies
   * Tries direct snapshot matching, GUID-based matching, and pattern matching
   * @param {JSZip} zip - The BCF ZIP file
   * @param {string} topicGuid - The topic GUID for path construction
   * @param {Object} topic - The topic object containing viewpoints
   * @param {Array} topicImageFiles - Array of discovered image files
   */
  static async matchViewpointsToImages(zip, topicGuid, topic, topicImageFiles) {
    for (const viewpoint of topic.viewpoints) {
      try {
        let imageFile = null;
        let matchedFilename = null;

        // Method 1: Direct snapshot name match
        const snapshotName = viewpoint.snapshot;
        if (snapshotName) {
          const directPath = `${topicGuid}/${snapshotName}`;
          imageFile = zip.file(directPath);
          if (imageFile) {
            matchedFilename = snapshotName;
          }
        }

        // Method 2: Try to find image by viewpoint GUID
        if (!imageFile && viewpoint.guid) {
          const guidBasedFiles = topicImageFiles.filter(
            (f) =>
              f.filename.toLowerCase().includes(viewpoint.guid.toLowerCase()) ||
              f.filename
                .toLowerCase()
                .includes(viewpoint.guid.toLowerCase().replace(/-/g, ''))
          );

          if (guidBasedFiles.length > 0) {
            imageFile = guidBasedFiles[0].file;
            matchedFilename = guidBasedFiles[0].filename;
          }
        }

        // Method 3: Try filename pattern matching (Snapshot_*, snapshot_*, etc.)
        if (!imageFile && snapshotName) {
          const baseSnapshotName = snapshotName.replace(/\.[^/.]+$/, ''); // Remove extension
          const patternMatches = topicImageFiles.filter((f) => {
            const fileBase = f.filename.replace(/\.[^/.]+$/, '');
            return (
              fileBase.toLowerCase().includes(baseSnapshotName.toLowerCase()) ||
              baseSnapshotName.toLowerCase().includes(fileBase.toLowerCase())
            );
          });

          if (patternMatches.length > 0) {
            imageFile = patternMatches[0].file;
            matchedFilename = patternMatches[0].filename;
          }
        }

        // Extract and store image data if match found
        if (imageFile && matchedFilename) {
          await this.extractAndStoreImageData(
            viewpoint,
            imageFile,
            matchedFilename
          );
        }
      } catch (error) {
        console.warn(
          `Error extracting image for viewpoint ${viewpoint.guid}:`,
          error
        );
      }
    }
  }

  /**
   * Extract image data and store it in the viewpoint object
   * @param {Object} viewpoint - The viewpoint object to update
   * @param {Object} imageFile - The JSZip file object containing the image
   * @param {string} matchedFilename - The filename that was matched
   */
  static async extractAndStoreImageData(viewpoint, imageFile, matchedFilename) {
    // Extract image data as base64
    const imageData = await imageFile.async('base64');

    // Determine image type from filename
    const imageType = this.getImageTypeFromFilename(matchedFilename);

    // Store image data in viewpoint
    viewpoint.imageData = imageData;
    viewpoint.imageType = imageType;
    viewpoint.hasImage = true;
    viewpoint.actualFilename = matchedFilename; // Store the actual filename used
  }

  /**
   * Parse comments for a topic from markup.bcf and, if present, a separate
   * comments.bcf file, skipping comments whose GUID was already collected.
   * @param {JSZip} zip - Loaded BCF archive
   * @param {string} topicGuid - Topic folder GUID
   * @param {Object} topic - Topic object; comments are pushed onto topic.comments
   * @param {Document|null} markupDoc - Parsed markup.bcf, if available
   */
  static async parseComments(zip, topicGuid, topic, markupDoc) {
    // Track comment GUIDs to prevent duplicates
    const existingCommentGuids = new Set();

    // Check comments from markup.bcf first (common in newer BCF versions)
    if (markupDoc) {
      this.collectComments(markupDoc, topic, existingCommentGuids, true);
    }

    // ALSO check separate comments.bcf file (some tools use this) - but avoid duplicates
    topic.comments.forEach((c) => existingCommentGuids.add(c.guid));
    const commentsFile = zip.file(`${topicGuid}/comments.bcf`);
    if (!commentsFile) {
      return; // No comments found
    }

    try {
      const commentsXml = await commentsFile.async('text');
      const doc = new DOMParser().parseFromString(commentsXml, 'text/xml');
      this.collectComments(doc, topic, existingCommentGuids, false);
    } catch (error) {
      console.warn(`Error parsing comments for topic ${topicGuid}:`, error);
    }
  }

  /**
   * Add every not-yet-seen comment element in a document to the topic.
   * @param {Document} doc - Markup or comments document
   * @param {Object} topic - Topic receiving the comments
   * @param {Set<string>} existingGuids - GUIDs already collected
   * @param {boolean} trackNewGuids - Add each new GUID to existingGuids
   */
  static collectComments(doc, topic, existingGuids, trackNewGuids) {
    doc.querySelectorAll('Comment, Note, Remark').forEach((commentEl) => {
      const commentGuid =
        commentEl.getAttribute('Guid') || commentEl.getAttribute('Id');
      if (existingGuids.has(commentGuid)) return;

      topic.comments.push(this.buildComment(commentEl, commentGuid));
      if (trackNewGuids) existingGuids.add(commentGuid);
    });
  }

  /**
   * Build a comment object from a Comment/Note/Remark element.
   * @param {Element} commentEl - Comment element
   * @param {string|null} commentGuid - Resolved comment GUID
   * @returns {Object} Comment with standard fields and _customFields
   */
  static buildComment(commentEl, commentGuid) {
    const comment = {
      guid: commentGuid,
      date: this.getElementTextWithAliases(commentEl, [
        'Date',
        'Created',
        'CreationDate',
        'Timestamp',
      ]),
      author: this.getElementTextWithAliases(commentEl, [
        'Author',
        'CreatedBy',
        'User',
        'Creator',
      ]),
      comment: this.getElementTextWithAliases(commentEl, [
        'Comment',
        'Text',
        'Description',
        'Content',
        'Message',
      ]),
      modifiedDate: this.getElementTextWithAliases(commentEl, [
        'ModifiedDate',
        'Modified',
        'LastModified',
      ]),
      modifiedAuthor: this.getElementTextWithAliases(commentEl, [
        'ModifiedAuthor',
        'ModifiedBy',
        'LastModifiedBy',
      ]),
      // Store custom fields for comments
      _customFields: {},
    };

    this.extractCustomFields(commentEl, comment._customFields, 'comment');
    return comment;
  }

  static parseViewpoints(doc, topic) {
    const viewpoints = doc.querySelectorAll('Viewpoint');
    topic.viewpoints = [];

    viewpoints.forEach((viewpointElement, index) => {
      // Try different ways to get the GUID
      let guid =
        viewpointElement.getAttribute('Guid') ||
        viewpointElement.getAttribute('guid') ||
        viewpointElement.getAttribute('ViewPointGuid');

      // If still no GUID, try to extract from child elements
      if (!guid) {
        // Some BCF files store the viewpoint reference as text content
        const viewpointText = viewpointElement.textContent.trim();
        if (viewpointText && viewpointText.includes('.bcfv')) {
          // Extract GUID from filename like "8d12438d-da94-4dce-a976-1b375cdd0b60.bcfv"
          guid = viewpointText.replace('.bcfv', '').replace(/^.*\//, '');
        }
      }

      // If still no GUID, generate one based on content
      if (!guid) {
        guid = `viewpoint-${topic.guid}-${index}`;
        console.warn(
          `⚠️ No GUID found for viewpoint ${index}, generated: ${guid}`
        );
      }

      const viewpoint = {
        guid: guid,
        viewpointFile: null,
        snapshot: null,
        index: index,
      };

      // Extract viewpoint file reference
      const viewpointFileElement = viewpointElement.querySelector('Viewpoint');
      if (viewpointFileElement) {
        viewpoint.viewpointFile = viewpointFileElement.textContent;
      } else {
        // Some BCF files store the viewpoint reference as direct text content
        const textContent = viewpointElement.textContent.trim();
        if (textContent && textContent.includes('.bcfv')) {
          viewpoint.viewpointFile = textContent;
        }
      }

      // Extract snapshot reference
      const snapshotElement = viewpointElement.querySelector('Snapshot');
      if (snapshotElement) {
        viewpoint.snapshot = snapshotElement.textContent;
      }

      // Initialize coordinate structures (will be populated later from .bcfv files)
      this.extractViewpointCoordinates(doc, viewpoint);

      topic.viewpoints.push(viewpoint);
    });
  }

  /**
   * Extract viewpoint coordinates from BCF files (supports BCF 2.0, 2.1, and 3.0)
   * BCF files store camera coordinates in the viewpoint.bcfv file for each viewpoint
   * @param {Document} doc - The markup document (we'll need to parse viewpoint files separately)
   * @param {Object} viewpoint - The viewpoint object to populate with coordinates
   */
  static extractViewpointCoordinates(doc, viewpoint) {
    // Initialize coordinate structures with null values
    viewpoint.cameraPosition = { x: null, y: null, z: null };
    viewpoint.cameraTarget = { x: null, y: null, z: null };
  }

  /**
   * Extract viewpoint coordinates from the ZIP file's .bcfv files
   * This method is called during topic parsing when ZIP access is available
   * Supports BCF 2.0, 2.1, and 3.0 coordinate formats
   * @param {JSZip} zip - The BCF ZIP file
   * @param {string} topicGuid - The topic GUID
   * @param {Object} topic - The topic object containing viewpoints
   */
  static async extractViewpointCoordinatesFromZip(zip, topicGuid, topic) {
    // Discover all .bcfv files in this topic folder
    const allBcfvFiles = this.discoverViewpointFiles(zip, topicGuid);

    if (allBcfvFiles.length === 0) {
      return;
    }

    // Process each .bcfv file and create/update viewpoints
    await this.processViewpointFiles(zip, topic, allBcfvFiles);

    // Generate final coordinate extraction summary
    this.logCoordinateExtractionSummary(topic);
  }

  /**
   * Discover all .bcfv viewpoint files in a topic folder
   * @param {JSZip} zip - The BCF ZIP file
   * @param {string} topicGuid - The topic GUID
   * @returns {Array} - Array of viewpoint file objects
   */
  static discoverViewpointFiles(zip, topicGuid) {
    const allBcfvFiles = [];

    zip.forEach((relativePath, file) => {
      if (
        relativePath.startsWith(topicGuid + '/') &&
        relativePath.endsWith('.bcfv')
      ) {
        const fileName = relativePath.split('/').pop();
        allBcfvFiles.push({
          path: relativePath,
          name: fileName,
          guid: this.extractGuidFromViewpointFilename(fileName),
        });
      }
    });

    return allBcfvFiles;
  }

  /**
   * Process all viewpoint files and extract coordinate data
   * @param {JSZip} zip - The BCF ZIP file
   * @param {Object} topic - The topic object
   * @param {Array} allBcfvFiles - Array of discovered .bcfv files
   */
  static async processViewpointFiles(zip, topic, allBcfvFiles) {
    for (const bcfvFile of allBcfvFiles) {
      try {
        // Find or create viewpoint object
        let viewpoint = topic.viewpoints.find(
          (vp) => vp.guid === bcfvFile.guid
        );

        if (!viewpoint) {
          // Create new viewpoint if not found in markup
          viewpoint = {
            guid: bcfvFile.guid,
            viewpointFile: bcfvFile.name,
            snapshot: null,
            index: topic.viewpoints.length,
            cameraPosition: { x: null, y: null, z: null },
            cameraTarget: { x: null, y: null, z: null },
          };
          topic.viewpoints.push(viewpoint);
        }

        // Parse the viewpoint XML file
        const viewpointFile = zip.file(bcfvFile.path);
        const viewpointXml = await viewpointFile.async('text');

        const parser = new DOMParser();
        const viewpointDoc = parser.parseFromString(viewpointXml, 'text/xml');

        // Check for parsing errors
        const parserError = viewpointDoc.querySelector('parsererror');
        if (parserError) {
          console.error(
            `❌ XML parsing error for ${bcfvFile.guid}:`,
            parserError.textContent
          );
          continue;
        }

        // Extract camera position and target coordinates
        this.parseViewpointCameraData(viewpointDoc, viewpoint);

        if (
          viewpoint.cameraPosition.x !== null ||
          viewpoint.cameraTarget.x !== null
        ) {
          this.debugLog(
            `✅ Successfully extracted coordinates for viewpoint ${viewpoint.guid}`
          );
        } else {
          this.debugLog(
            `❌ No coordinates extracted for viewpoint ${viewpoint.guid}`
          );
        }
      } catch (error) {
        console.error(
          `⚠️ Error extracting coordinates from ${bcfvFile.path}:`,
          error
        );
      }
    }
  }

  /**
   * Log comprehensive coordinate extraction summary
   * @param {Object} topic - The topic object with processed viewpoints
   */
  static logCoordinateExtractionSummary(topic) {
    const viewpointsWithCoordinates = topic.viewpoints.filter((vp) => {
      return (
        vp.cameraType ||
        vp.CameraViewPoint ||
        vp.CameraDirection ||
        vp.CameraUpVector ||
        vp.FieldOfView !== null ||
        vp.ViewToWorldScale !== null ||
        vp.cameraPosition ||
        vp.cameraTarget
      );
    });

    this.debugLog(`🎯 Coordinate extraction complete for topic: ${topic.title}`, {
      totalViewpoints: topic.viewpoints.length,
      viewpointsWithCoordinates: viewpointsWithCoordinates.length,
      coordinateBreakdown: viewpointsWithCoordinates.map((vp) => ({
        guid: vp.guid,
        file: vp.viewpointFile,
        cameraType: vp.cameraType,
        hasBCFCoords: !!(vp.CameraViewPoint || vp.CameraDirection),
        hasLegacyCoords: !!(vp.cameraPosition || vp.cameraTarget),
        isComplete: !!(
          vp.cameraType &&
          vp.CameraViewPoint &&
          vp.CameraDirection
        ),
      })),
    });
  }

  /**
   * Extract GUID from various viewpoint filename formats
   * Handles: viewpoint.bcfv, {guid}.bcfv, Viewpoint_{guid}.bcfv
   * @param {string} filename - The viewpoint filename
   * @returns {string} - The extracted GUID or generated identifier
   */
  static extractGuidFromViewpointFilename(filename) {
    // Remove .bcfv extension
    const nameWithoutExt = filename.replace(/\.bcfv$/, '');

    // Pattern 1: Viewpoint_{guid}.bcfv
    if (nameWithoutExt.startsWith('Viewpoint_')) {
      const guid = nameWithoutExt.replace('Viewpoint_', '');
      return guid;
    }

    // Pattern 2: {guid}.bcfv (direct GUID)
    if (nameWithoutExt.match(/^[0-9a-f-]{36}$/i)) {
      return nameWithoutExt;
    }

    // Pattern 3: viewpoint.bcfv (generic)
    if (nameWithoutExt === 'viewpoint') {
      const genericGuid = 'viewpoint-generic';
      return genericGuid;
    }

    // Pattern 4: Any other format - use the filename as identifier
    return nameWithoutExt;
  }

  /**
   * Find the camera element in viewpoint XML and determine camera type
   * @param {Document} viewpointDoc - The parsed viewpoint XML document
   * @returns {Object} - Camera element and type, or null if not found
   */
  static findCameraElement(viewpointDoc) {
    // Try PerspectiveCamera first
    let cameraElement = viewpointDoc.querySelector('PerspectiveCamera');
    let cameraType = 'Perspective';

    // Fallback to OrthogonalCamera if PerspectiveCamera not found
    if (!cameraElement) {
      cameraElement = viewpointDoc.querySelector('OrthogonalCamera');
      cameraType = 'Orthogonal';
    }

    if (!cameraElement) {
      return null;
    }

    return {
      element: cameraElement,
      type: cameraType,
    };
  }

  /**
   * Extract coordinate data from camera element
   * @param {Element} cameraElement - The camera XML element
   * @param {string} coordinateType - Type of coordinates ('CameraViewPoint', 'CameraDirection', 'CameraUpVector')
   * @returns {Object} - Coordinate object with X, Y, Z properties
   */
  static extractCameraCoordinates(cameraElement, coordinateType) {
    const coordinates = { X: null, Y: null, Z: null };

    const coordinateElement = cameraElement.querySelector(coordinateType);
    if (!coordinateElement) {
      return coordinates;
    }

    const xElement = coordinateElement.querySelector('X');
    const yElement = coordinateElement.querySelector('Y');
    const zElement = coordinateElement.querySelector('Z');

    if (xElement && yElement && zElement) {
      coordinates.X = parseFloat(xElement.textContent);
      coordinates.Y = parseFloat(yElement.textContent);
      coordinates.Z = parseFloat(zElement.textContent);
    }

    return coordinates;
  }

  /**
   * Extract camera-specific properties (FieldOfView or ViewToWorldScale)
   * @param {Element} cameraElement - The camera XML element
   * @param {string} cameraType - The camera type ('Perspective' or 'Orthogonal')
   * @returns {Object} - Object with FieldOfView and/or ViewToWorldScale properties
   */
  static extractCameraProperties(cameraElement, cameraType) {
    const properties = {
      FieldOfView: null,
      ViewToWorldScale: null,
    };

    if (cameraType === 'Perspective') {
      // Extract FieldOfView for perspective cameras
      const fieldOfView = cameraElement.querySelector('FieldOfView');
      if (fieldOfView) {
        properties.FieldOfView = parseFloat(fieldOfView.textContent);
      }
    } else if (cameraType === 'Orthogonal') {
      // Extract ViewToWorldScale for orthogonal cameras
      const viewToWorldScale = cameraElement.querySelector('ViewToWorldScale');
      if (viewToWorldScale) {
        properties.ViewToWorldScale = parseFloat(viewToWorldScale.textContent);
      }
    }

    return properties;
  }

  /**
   * Create backward compatibility coordinate formats
   * @param {Object} viewpoint - The viewpoint object to update
   */
  static createBackwardCompatibilityCoordinates(viewpoint) {
    // Keep the old format for backward compatibility
    viewpoint.cameraPosition = {
      x: viewpoint.CameraViewPoint.X,
      y: viewpoint.CameraViewPoint.Y,
      z: viewpoint.CameraViewPoint.Z,
    };

    // Calculate target for backward compatibility (optional)
    if (viewpoint.CameraDirection.X !== null) {
      const distance = 10.0;
      viewpoint.cameraTarget = {
        x: viewpoint.CameraViewPoint.X + viewpoint.CameraDirection.X * distance,
        y: viewpoint.CameraViewPoint.Y + viewpoint.CameraDirection.Y * distance,
        z: viewpoint.CameraViewPoint.Z + viewpoint.CameraDirection.Z * distance,
      };
    }
  }

  /**
   * Parse camera data from viewpoint XML document
   * Extracts complete camera information with BCF naming conventions
   * Handles both PerspectiveCamera and OrthogonalCamera elements
   * Works across BCF 2.0, 2.1, and 3.0 formats
   * @param {Document} viewpointDoc - The parsed viewpoint XML document
   * @param {Object} viewpoint - The viewpoint object to populate
   */
  static parseViewpointCameraData(viewpointDoc, viewpoint) {
    // Find camera element and determine type
    const cameraInfo = this.findCameraElement(viewpointDoc);

    if (!cameraInfo) {
      this.debugLog(`🔷 No camera element found in viewpoint ${viewpoint.guid}`);
      return;
    }

    const { element: cameraElement, type: cameraType } = cameraInfo;

    // Initialize viewpoint camera properties
    viewpoint.cameraType = cameraType;

    // Extract all coordinate data using helper methods
    viewpoint.CameraViewPoint = this.extractCameraCoordinates(
      cameraElement,
      'CameraViewPoint'
    );
    viewpoint.CameraDirection = this.extractCameraCoordinates(
      cameraElement,
      'CameraDirection'
    );
    viewpoint.CameraUpVector = this.extractCameraCoordinates(
      cameraElement,
      'CameraUpVector'
    );

    // Extract camera-specific properties
    const properties = this.extractCameraProperties(cameraElement, cameraType);
    viewpoint.FieldOfView = properties.FieldOfView;
    viewpoint.ViewToWorldScale = properties.ViewToWorldScale;

    // Create backward compatibility coordinates
    this.createBackwardCompatibilityCoordinates(viewpoint);

    // Log comprehensive extraction summary
  }

  static getElementText(parentOrDoc, tagName) {
    const element = parentOrDoc.querySelector
      ? parentOrDoc.querySelector(tagName)
      : parentOrDoc.getElementsByTagName(tagName)[0];
    return element?.textContent?.trim() || '';
  }

  static getElementTextWithAliases(parentOrDoc, fieldNames) {
    for (const fieldName of fieldNames) {
      const element = parentOrDoc.querySelector
        ? parentOrDoc.querySelector(fieldName)
        : parentOrDoc.getElementsByTagName(fieldName)[0];
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  static getTopicStatusWithAliases(topicElement, doc) {
    // Try attribute first (most common)
    if (topicElement) {
      const statusAttr =
        topicElement.getAttribute('TopicStatus') ||
        topicElement.getAttribute('Status') ||
        topicElement.getAttribute('State');
      if (statusAttr) return statusAttr;
    }

    // Try as elements
    return this.getElementTextWithAliases(doc, [
      'TopicStatus',
      'Status',
      'State',
      'CurrentStatus',
    ]);
  }

  static getTopicTypeWithAliases(topicElement, doc) {
    // Try attribute first (most common)
    if (topicElement) {
      const typeAttr =
        topicElement.getAttribute('TopicType') ||
        topicElement.getAttribute('Type') ||
        topicElement.getAttribute('Category') ||
        topicElement.getAttribute('Kind');
      if (typeAttr) return typeAttr;
    }

    // Try as elements
    return this.getElementTextWithAliases(doc, [
      'TopicType',
      'Type',
      'Category',
      'Kind',
      'IssueType',
    ]);
  }

  static isGuid(str) {
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return guidRegex.test(str);
  }

  static extractCustomFields(element, customFields, prefix = '') {
    if (!element) return;

    // Extract all attributes
    if (element.attributes) {
      for (let attr of element.attributes) {
        const fieldName = `${prefix}_attr_${attr.name}`;
        if (attr.value && attr.value.trim()) {
          customFields[fieldName] = attr.value.trim();
        }
      }
    }

    // Extract all child elements that aren't standard BCF fields
    const standardTopicElements = [
      'Title',
      'Description',
      'CreationDate',
      'CreationAuthor',
      'ModifiedDate',
      'ModifiedAuthor',
      'DueDate',
      'AssignedTo',
      'Priority',
      'Stage',
      'Labels',
      'Comments',
      'Viewpoints',
    ];

    const standardCommentElements = [
      'Date',
      'Author',
      'Comment',
      'ModifiedDate',
      'ModifiedAuthor',
    ];

    const standardElements = [
      ...standardTopicElements,
      ...standardCommentElements,
    ];

    Array.from(element.children).forEach((child) => {
      if (!standardElements.includes(child.tagName)) {
        const fieldName = `${prefix}_element_${child.tagName}`;
        const textContent = child.textContent?.trim();
        if (textContent) {
          customFields[fieldName] = textContent;
        }

        // Also check for attributes on custom elements
        if (child.attributes && child.attributes.length > 0) {
          for (let attr of child.attributes) {
            const attrFieldName = `${prefix}_element_${child.tagName}_attr_${attr.name}`;
            if (attr.value && attr.value.trim()) {
              customFields[attrFieldName] = attr.value.trim();
            }
          }
        }
      }
    });
  }

  static scanForUnknownElements(doc, customFields) {
    // Get all elements in the document
    const allElements = doc.querySelectorAll('*');

    // Look for elements with non-standard namespaces or unexpected names
    allElements.forEach((element) => {
      // Check for vendor-specific namespaces
      if (
        element.namespaceURI &&
        element.namespaceURI !== 'http://www.w3.org/1999/xhtml' &&
        element.namespaceURI !== 'http://www.w3.org/XML/1998/namespace'
      ) {
        const fieldName = `namespace_${element.namespaceURI}_${element.localName}`;
        const textContent = element.textContent?.trim();
        if (textContent) {
          customFields[fieldName] = textContent;
        }
      }

      // Look for elements with unexpected tag names that contain data
      const unexpectedTags = [
        'CustomField',
        'Extension',
        'UserDefined',
        'Extra',
        'Additional',
      ];
      if (unexpectedTags.some((tag) => element.tagName.includes(tag))) {
        const fieldName = `unknown_${element.tagName}`;
        const textContent = element.textContent?.trim();
        if (textContent) {
          customFields[fieldName] = textContent;
        }
      }
    });
  }

  /**
   * Enhanced fallback method to detect BCF format from file structure
   * Used when version file is unclear, missing, or inconsistent
   * Now includes comprehensive BCF 3.0 detection
   */
  static async detectFormatFromStructure(zip) {
    try {
      // Priority 1: Check for BCF 3.0 indicators first
      const bcf30Confirmed = await this.confirmBCF30Format(zip);
      if (bcf30Confirmed) {
        this.debugLog('✅ Structure analysis confirms BCF 3.0');
        return '3.0';
      }

      // Priority 2: Check project file structure for BCF 2.x variants
      const projectFile = zip.file('project.bcfp');
      if (projectFile) {
        const projectXml = await projectFile.async('text');
        const parser = new DOMParser();
        const doc = parser.parseFromString(projectXml, 'text/xml');

        // BCF 2.1: ProjectExtension with ExtensionSchema
        const projectExtension = doc.querySelector('ProjectExtension');
        if (projectExtension) {
          const extensionSchema = doc.querySelector('ExtensionSchema');
          if (extensionSchema) {
            this.debugLog(
              '✅ Structure analysis confirms BCF 2.1: ProjectExtension + ExtensionSchema'
            );
            return '2.1';
          } else {
            this.debugLog(
              '✅ Structure analysis confirms BCF 2.0: ProjectExtension without ExtensionSchema'
            );
            return '2.0';
          }
        }
      }

      // Priority 3: Check for extensions.xsd file (BCF 2.1+ feature)
      const extensionsFile = zip.file('extensions.xsd');
      if (extensionsFile) {
        this.debugLog('✅ Found extensions.xsd - indicates BCF 2.1+');
        return '2.1';
      }

      // Default fallback to most common stable format
      this.debugLog(
        '🎯 No clear format indicators - defaulting to BCF 2.1 (most common)'
      );
      return '2.1';
    } catch (error) {
      console.warn('❌ Error in enhanced structure detection:', error);
      return '2.1'; // Safe fallback to most compatible format
    }
  }

  /**
   * Confirm BCF 3.0 format by checking for BCF 3.0-specific structures
   * This prevents false positives when version file claims 3.0 but structure is 2.x
   *
   * BCF 3.0 Indicators:
   * - ProjectInfo instead of ProjectExtension
   * - documents.xml file presence
   * - Enhanced topic structures
   */
  static async confirmBCF30Format(zip) {
    try {
      // Indicator 1: Check for documents.xml (BCF 3.0 feature)
      const documentsFile = zip.file('documents.xml');
      if (documentsFile) {
        this.debugLog('📄 Found documents.xml - strong BCF 3.0 indicator');
        return true;
      }

      // Indicator 2: Check project structure
      const projectFile = zip.file('project.bcfp');
      if (projectFile) {
        const projectXml = await projectFile.async('text');
        const parser = new DOMParser();
        const doc = parser.parseFromString(projectXml, 'text/xml');

        // BCF 3.0 uses ProjectInfo, BCF 2.x uses ProjectExtension
        const projectInfo = doc.querySelector('ProjectInfo');
        const projectExtension = doc.querySelector('ProjectExtension');

        if (projectInfo && !projectExtension) {
          this.debugLog('🏗️ Found ProjectInfo structure - BCF 3.0 confirmed');
          return true;
        }

        if (projectExtension && !projectInfo) {
          this.debugLog('🏗️ Found ProjectExtension structure - this is BCF 2.x');
          return false;
        }
      }

      // Indicator 3: Check for BCF 3.0 topic features (ServerAssignedId)
      const topicIndicators = await this.checkForBCF30TopicFeatures(zip);
      if (topicIndicators) {
        this.debugLog('📋 Found BCF 3.0 topic features');
        return true;
      }

      // If no clear BCF 3.0 indicators found, it's likely BCF 2.x
      this.debugLog('📊 No clear BCF 3.0 indicators found, treating as BCF 2.x');
      return false;
    } catch (error) {
      console.warn('❌ Error during BCF 3.0 confirmation:', error);
      return false; // Safe fallback to BCF 2.x
    }
  }

  /**
   * Check for BCF 3.0-specific topic features
   * Looks for ServerAssignedId and other BCF 3.0 topic enhancements
   */
  static async checkForBCF30TopicFeatures(zip) {
    try {
      // Find first topic folder to examine
      let sampleTopicGuid = null;

      zip.forEach((relativePath, file) => {
        if (!sampleTopicGuid && relativePath.includes('/markup.bcf')) {
          const pathParts = relativePath.split('/');
          if (pathParts.length >= 2 && this.isGuid(pathParts[0])) {
            sampleTopicGuid = pathParts[0];
          }
        }
      });

      if (!sampleTopicGuid) {
        return false;
      }

      // Check the sample topic for BCF 3.0 features
      const markupFile = zip.file(`${sampleTopicGuid}/markup.bcf`);
      if (markupFile) {
        const markupXml = await markupFile.async('text');
        const parser = new DOMParser();
        const doc = parser.parseFromString(markupXml, 'text/xml');

        // Look for ServerAssignedId attribute (BCF 3.0 feature)
        const topicElement = doc.querySelector('Topic');
        if (topicElement && topicElement.hasAttribute('ServerAssignedId')) {
          this.debugLog(
            '🆔 Found ServerAssignedId attribute - BCF 3.0 feature detected'
          );
          return true;
        }

        // Look for multiple ReferenceLink elements (BCF 3.0 allows multiple)
        const referenceLinks = doc.querySelectorAll('Topic > ReferenceLink');
        if (referenceLinks.length > 1) {
          this.debugLog(
            '🔗 Found multiple ReferenceLink elements - BCF 3.0 feature'
          );
          return true;
        }
      }

      return false;
    } catch (error) {
      console.warn('❌ Error checking BCF 3.0 topic features:', error);
      return false;
    }
  }

  /**
   * Enhanced BCF 3.0 ProjectInfo structure parsing
   * BCF 3.0 uses ProjectInfo with Name as attribute, not element
   * Also handles additional BCF 3.0 project metadata
   */
  static parseBCF30Project(doc) {
    const projectInfo = doc.querySelector('ProjectInfo');
    if (!projectInfo) {
      console.warn('⚠️ BCF 3.0: ProjectInfo element not found');
      return { name: '', id: '', extensionSchema: null };
    }

    const project = projectInfo.querySelector('Project');
    if (!project) {
      console.warn('⚠️ BCF 3.0: Project element not found in ProjectInfo');
      return { name: '', id: '', extensionSchema: null };
    }

    // In BCF 3.0, Name and ProjectId are attributes of Project element
    const projectName = project.getAttribute('Name') || '';
    const projectId = project.getAttribute('ProjectId') || '';

    this.debugLog('✅ BCF 3.0 project parsed successfully:', {
      name: projectName,
      id: projectId,
    });

    return {
      name: projectName,
      id: projectId,
      extensionSchema: null, // BCF 3.0 doesn't use ExtensionSchema
    };
  }

  /**
   * Enhanced BCF 2.x ProjectExtension structure parsing
   * Handles both BCF 2.0 and 2.1 project structures with better reliability
   * Maintains compatibility with existing project parsing logic
   */
  static parseBCF2xProject(doc) {
    const projectExtension = doc.querySelector('ProjectExtension');
    if (!projectExtension) {
      console.warn('⚠️ BCF 2.x: ProjectExtension element not found');
      return { name: '', id: '', hasExtensionSchema: false };
    }

    const project = projectExtension.querySelector('Project');
    const extensionSchema = projectExtension.querySelector('ExtensionSchema');

    let projectName = '';
    let projectId = '';

    if (project) {
      // Try multiple methods to get project ID (different BCF tools use different approaches)
      projectId =
        project.getAttribute('ProjectId') ||
        project.getAttribute('Id') ||
        project.getAttribute('Guid') ||
        '';

      // Try multiple methods to get project name
      projectName =
        this.getElementText(project, 'Name') ||
        this.getElementText(project, 'n') ||
        project.getAttribute('Name') ||
        project.getAttribute('name') ||
        '';
    }

    const hasExtensionSchema = !!extensionSchema;
    const bcfVersion = hasExtensionSchema ? '2.1' : '2.0';

    this.debugLog(`✅ BCF ${bcfVersion} project parsed successfully:`, {
      name: projectName,
      id: projectId,
      hasExtensions: hasExtensionSchema,
    });

    return {
      name: projectName,
      id: projectId,
      hasExtensionSchema: hasExtensionSchema,
    };
  }

  /**
   * Fallback project parsing for edge cases
   * Uses your existing comprehensive approach as backup
   */
  static parseProjectFallback(doc) {
    let projectName = '';
    let projectId = '';

    // Method 1: ProjectExtension/Project/Name (BIMtrack, custom BCF tools)
    const projectExtensionElement = doc.querySelector(
      'ProjectExtension Project'
    );
    if (projectExtensionElement && !projectName) {
      projectName = this.getElementText(projectExtensionElement, 'Name');
      projectId = projectExtensionElement.getAttribute('ProjectId');
      this.debugLog('Fallback: Found ProjectExtension structure');
    }

    // Method 2: ProjectInfo/Name (standard BCF 2.1 structure)
    if (!projectName) {
      const projectInfoElement = doc.querySelector('ProjectInfo');
      if (projectInfoElement) {
        projectName =
          this.getElementText(projectInfoElement, 'Name') ||
          projectInfoElement.querySelector('Project')?.getAttribute('Name');
        projectId =
          projectInfoElement.getAttribute('ProjectId') ||
          projectInfoElement
            .querySelector('Project')
            ?.getAttribute('ProjectId');
        this.debugLog('Fallback: Found ProjectInfo structure');
      }
    }

    // Method 3: Direct Project/Name (some BCF variants)
    if (!projectName) {
      const projectElement = doc.querySelector('Project');
      if (projectElement) {
        projectName =
          this.getElementText(projectElement, 'Name') ||
          projectElement.getAttribute('Name');
        projectId =
          projectElement.getAttribute('ProjectId') ||
          projectElement.getAttribute('Id');
        this.debugLog('Fallback: Found direct Project structure');
      }
    }

    return {
      name: projectName,
      id: projectId,
    };
  }

  /**
   * Enhanced BCF 3.0 field extraction
   * Extracts all new BCF 3.0 topic features including ServerAssignedId,
   * multiple ReferenceLinks, and new DocumentReferences structure
   */
  static extractBCF30Fields(topicElement, doc, topic) {
    try {
      // Extract ServerAssignedId (BCF 3.0 new attribute)
      if (topicElement) {
        const serverAssignedId = topicElement.getAttribute('ServerAssignedId');
        if (serverAssignedId) {
          topic.serverAssignedId = serverAssignedId;
        }
      }

      // Extract multiple ReferenceLinks (BCF 3.0: now supports multiple vs single)
      const referenceLinks = doc.querySelectorAll('Topic > ReferenceLink');
      if (referenceLinks.length > 0) {
        topic.referenceLinks = Array.from(referenceLinks)
          .map((link) => link.textContent?.trim() || '')
          .filter((link) => link); // Remove empty links
      }

      // Extract BCF 3.0 DocumentReferences (new structure)
      const documentReferences = this.extractBCF30DocumentReferences(doc);
      if (documentReferences.length > 0) {
        topic.documentReferences = documentReferences;
      }

      // Extract Header Files (BCF 3.0: enhanced Files structure in Header)
      const headerFiles = this.extractBCF30HeaderFiles(doc);
      if (headerFiles.length > 0) {
        topic.headerFiles = headerFiles;
      }
    } catch (error) {
      console.warn('❌ Error extracting BCF 3.0 fields:', error);
    }
  }

  /**
   * Extract BCF 3.0 DocumentReferences structure
   * BCF 3.0 changes DocumentReference to DocumentReferences with new structure
   */
  static extractBCF30DocumentReferences(doc) {
    const documentReferences = [];

    try {
      // BCF 3.0: DocumentReferences > DocumentReference structure
      const documentRefElements = doc.querySelectorAll(
        'DocumentReferences > DocumentReference'
      );

      documentRefElements.forEach((docRefElement) => {
        const documentRef = {
          guid: docRefElement.getAttribute('Guid') || '',
          documentGuid: '', // BCF 3.0: mutually exclusive with Url
          url: '', // BCF 3.0: mutually exclusive with DocumentGuid
          description: '',
        };

        // Extract DocumentGuid or Url (mutually exclusive in BCF 3.0)
        const documentGuidAttr = docRefElement.getAttribute('DocumentGuid');
        const urlAttr = docRefElement.getAttribute('Url');

        if (documentGuidAttr) {
          documentRef.documentGuid = documentGuidAttr;
        } else if (urlAttr) {
          documentRef.url = urlAttr;
        }

        // Extract description
        const descriptionAttr = docRefElement.getAttribute('Description');
        if (descriptionAttr) {
          documentRef.description = descriptionAttr;
        }

        // Only add document references with meaningful data
        if (documentRef.guid || documentRef.documentGuid || documentRef.url) {
          documentReferences.push(documentRef);
        }
      });
    } catch (error) {
      console.warn('❌ Error parsing BCF 3.0 document references:', error);
    }

    return documentReferences;
  }

  /**
   * Extract BCF 3.0 Header Files structure
   * BCF 3.0 introduces a new Files element in the Header
   */
  static extractBCF30HeaderFiles(doc) {
    const headerFiles = [];

    try {
      // BCF 3.0: Header > Files > File structure
      const filesElement = doc.querySelector('Header > Files');
      if (!filesElement) {
        return headerFiles; // No files in BCF 3.0 format
      }

      const fileElements = filesElement.querySelectorAll('File');
      fileElements.forEach((fileElement) => {
        const fileInfo = {
          ifcProject: fileElement.getAttribute('IfcProject') || '',
          ifcSpatialStructureElement:
            fileElement.getAttribute('IfcSpatialStructureElement') || '',
          isExternal: fileElement.getAttribute('IsExternal') === 'true',
          filename: '',
          date: '',
          reference: '',
        };

        // Extract file details from child elements
        const filename = fileElement.querySelector('Filename');
        const date = fileElement.querySelector('Date');
        const reference = fileElement.querySelector('Reference');

        if (filename) fileInfo.filename = filename.textContent?.trim() || '';
        if (date) fileInfo.date = date.textContent?.trim() || '';
        if (reference) fileInfo.reference = reference.textContent?.trim() || '';

        // Only add files with meaningful data
        if (fileInfo.filename || fileInfo.reference) {
          headerFiles.push(fileInfo);
        }
      });
    } catch (error) {
      console.warn('Error parsing BCF 3.0 header files:', error);
    }

    return headerFiles;
  }

  /**
   * Parse BCF 3.0 comments from separate files
   */
  static async parseBCF30Comments(zip, topicGuid, topic, existingCommentGuids) {
    const commentsFile = zip.file(`${topicGuid}/comments.bcf`);
    if (commentsFile) {
      await this.parseCommentsFromFile(
        commentsFile,
        topic,
        existingCommentGuids
      );
    }
  }

  /**
   * Parse BCF 2.x comments file (existing logic extracted)
   */
  static async parseBCF2xCommentsFile(
    zip,
    topicGuid,
    topic,
    existingCommentGuids
  ) {
    const commentsFile = zip.file(`${topicGuid}/comments.bcf`);
    if (commentsFile) {
      await this.parseCommentsFromFile(
        commentsFile,
        topic,
        existingCommentGuids
      );
    }
  }

  /**
   * Parse comments from a comments file
   */
  static async parseCommentsFromFile(
    commentsFile,
    topic,
    existingCommentGuids
  ) {
    try {
      const commentsXml = await commentsFile.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(commentsXml, 'text/xml');

      const commentElements = doc.querySelectorAll('Comment, Note, Remark');
      commentElements.forEach((commentEl) => {
        const commentGuid =
          commentEl.getAttribute('Guid') || commentEl.getAttribute('Id');
        if (!existingCommentGuids.has(commentGuid)) {
          const comment = this.parseCommentElement(commentEl);
          topic.comments.push(comment);
          existingCommentGuids.add(commentGuid);
        }
      });
    } catch (error) {
      console.warn('Error parsing comments file:', error);
    }
  }

  /**
   * Parse individual comment element
   */
  static parseCommentElement(commentEl) {
    const comment = {
      guid: commentEl.getAttribute('Guid') || commentEl.getAttribute('Id'),
      date: this.getElementTextWithAliases(commentEl, [
        'Date',
        'Created',
        'CreationDate',
        'Timestamp',
      ]),
      author: this.getElementTextWithAliases(commentEl, [
        'Author',
        'CreatedBy',
        'User',
        'Creator',
      ]),
      comment: this.getElementTextWithAliases(commentEl, [
        'Comment',
        'Text',
        'Description',
        'Content',
        'Message',
      ]),
      modifiedDate: this.getElementTextWithAliases(commentEl, [
        'ModifiedDate',
        'Modified',
        'LastModified',
      ]),
      modifiedAuthor: this.getElementTextWithAliases(commentEl, [
        'ModifiedAuthor',
        'ModifiedBy',
        'LastModifiedBy',
      ]),
      _customFields: {},
    };

    // Extract custom fields from comment element
    this.extractCustomFields(commentEl, comment._customFields, 'comment');

    return comment;
  }

  /**
   * Determine image MIME type from filename extension
   */
  static getImageTypeFromFilename(filename) {
    if (!filename) return 'image/png'; // Default fallback

    const extension = filename.toLowerCase().split('.').pop();

    switch (extension) {
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'gif':
        return 'image/gif';
      case 'bmp':
        return 'image/bmp';
      case 'webp':
        return 'image/webp';
      default:
        console.warn(
          `Unknown image extension: ${extension}, defaulting to PNG`
        );
        return 'image/png';
    }
  }

  /**
   * Debug method to inspect BCF file structure
   * This helps us understand what's actually in the BCF file
   */
  static async debugBCFStructure(zip, filename) {
    this.debugLog(`🔍 DEBUGGING BCF Structure for: ${filename}`);
    this.debugLog('📁 All files in BCF archive:');

    const fileList = [];
    zip.forEach((relativePath, file) => {
      fileList.push({
        path: relativePath,
        isDirectory: file.dir,
        size: file.size || 0,
      });
    });

    // Group files by type for easier reading
    const structure = {
      rootFiles: [],
      topicFolders: {},
      imageFiles: [],
      otherFiles: [],
    };

    fileList.forEach((file) => {
      if (file.path.includes('/')) {
        // File inside a folder
        const parts = file.path.split('/');
        const folderName = parts[0];
        const fileName = parts[1];

        if (this.isGuid(folderName)) {
          // This is a topic folder
          if (!structure.topicFolders[folderName]) {
            structure.topicFolders[folderName] = [];
          }
          structure.topicFolders[folderName].push(fileName);

          // Check if this looks like an image file
          if (fileName && this.isImageFile(fileName)) {
            structure.imageFiles.push({
              topicGuid: folderName,
              filename: fileName,
              fullPath: file.path,
              size: file.size,
            });
          }
        } else {
          structure.otherFiles.push(file.path);
        }
      } else {
        // Root level file
        structure.rootFiles.push(file.path);
      }
    });

    this.debugLog('📊 BCF Structure Analysis:');
    this.debugLog('Root files:', structure.rootFiles);
    this.debugLog(
      'Topic folders found:',
      Object.keys(structure.topicFolders).length
    );
    this.debugLog('Image files found:', structure.imageFiles.length);

    // Log each topic folder contents
    Object.entries(structure.topicFolders).forEach(([guid, files]) => {
      this.debugLog(`📂 Topic ${guid}:`, files);
    });

    // Log image files specifically
    if (structure.imageFiles.length > 0) {
      this.debugLog('🖼️ Image files detected:');
      structure.imageFiles.forEach((img) => {
        this.debugLog(`  - ${img.fullPath} (${img.size} bytes)`);
      });
    } else {
      this.debugLog('❌ No image files found in BCF archive');
      this.debugLog('💡 This BCF file may not contain viewpoint snapshots');
    }

    return structure;
  }

  /**
   * Check if a filename appears to be an image file
   */
  static isImageFile(filename) {
    if (!filename) return false;
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
    const lowerFilename = filename.toLowerCase();
    return imageExtensions.some((ext) => lowerFilename.endsWith(ext));
  }
}
