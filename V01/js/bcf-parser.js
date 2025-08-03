// BCF Parser - Handles BCF file extraction and parsing
class BCFParser {
  static async parse(file) {
    try {
      // Load the BCF file as a ZIP archive
      const zip = await JSZip.loadAsync(file);

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
            console.log('✅ BCF 3.0 format confirmed:', versionId);
          } else {
            // Fallback if structure doesn't match BCF 3.0
            bcfData.bcfFormat = '2.1';
            console.warn('⚠️ Version claims 3.0 but structure suggests 2.1');
          }
        } else if (versionId.startsWith('2.1')) {
          bcfData.bcfFormat = '2.1';
          console.log('✅ BCF 2.1 format detected:', versionId);
        } else if (versionId.startsWith('2.0')) {
          bcfData.bcfFormat = '2.0';
          console.log('✅ BCF 2.0 format detected:', versionId);
        } else {
          // Unknown version - use intelligent detection
          bcfData.bcfFormat = await this.detectFormatFromStructure(zip);
          console.log(
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

      console.log(
        'Project XML found, format:',
        bcfData.bcfFormat || 'detecting...'
      );

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
        console.log('Parsed BCF 3.0 project structure');
      } else {
        // BCF 2.x: ProjectExtension structure (your existing logic enhanced)
        const result = this.parseBCF2xProject(doc);
        projectName = result.name;
        projectId = result.id;
        hasExtensionSchema = result.hasExtensionSchema;
        console.log('Parsed BCF 2.x project structure');
      }

      // Fallback: Try all methods if primary method failed
      if (!projectName) {
        console.log('Primary parsing failed, trying fallback methods...');
        const fallbackResult = this.parseProjectFallback(doc);
        projectName = fallbackResult.name || projectName;
        projectId = fallbackResult.id || projectId;
      }

      console.log('✅ Final parsed project name:', projectName);
      console.log('✅ Final parsed project ID:', projectId);

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

      // Extract TopicStatus values
      const topicStatusElements = doc.querySelectorAll(
        'xs\\:enumeration[value], enumeration[value]'
      );
      topicStatusElements.forEach((element) => {
        const parentName =
          element
            .closest('xs\\:restriction, restriction')
            ?.parentElement?.getAttribute('name') ||
          element.closest('xs\\:simpleType, simpleType')?.getAttribute('name');

        if (parentName && parentName.toLowerCase().includes('status')) {
          const value = element.getAttribute('value');
          if (value && !extensions.customFields.topicStatus.includes(value)) {
            extensions.customFields.topicStatus.push(value);
          }
        }
      });

      // Extract TopicType values
      const topicTypeElements = doc.querySelectorAll(
        'xs\\:enumeration[value], enumeration[value]'
      );
      topicTypeElements.forEach((element) => {
        const parentName =
          element
            .closest('xs\\:restriction, restriction')
            ?.parentElement?.getAttribute('name') ||
          element.closest('xs\\:simpleType, simpleType')?.getAttribute('name');

        if (parentName && parentName.toLowerCase().includes('type')) {
          const value = element.getAttribute('value');
          if (value && !extensions.customFields.topicType.includes(value)) {
            extensions.customFields.topicType.push(value);
          }
        }
      });

      // Extract Priority values
      const priorityElements = doc.querySelectorAll(
        'xs\\:enumeration[value], enumeration[value]'
      );
      priorityElements.forEach((element) => {
        const parentName =
          element
            .closest('xs\\:restriction, restriction')
            ?.parentElement?.getAttribute('name') ||
          element.closest('xs\\:simpleType, simpleType')?.getAttribute('name');

        if (parentName && parentName.toLowerCase().includes('priority')) {
          const value = element.getAttribute('value');
          if (value && !extensions.customFields.priority.includes(value)) {
            extensions.customFields.priority.push(value);
          }
        }
      });

      // Extract TopicLabel values
      const labelElements = doc.querySelectorAll(
        'xs\\:enumeration[value], enumeration[value]'
      );
      labelElements.forEach((element) => {
        const parentName =
          element
            .closest('xs\\:restriction, restriction')
            ?.parentElement?.getAttribute('name') ||
          element.closest('xs\\:simpleType, simpleType')?.getAttribute('name');

        if (parentName && parentName.toLowerCase().includes('label')) {
          const value = element.getAttribute('value');
          if (value && !extensions.customFields.topicLabel.includes(value)) {
            extensions.customFields.topicLabel.push(value);
          }
        }
      });

      console.log('Parsed extensions:', extensions.customFields);
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
      console.log('📄 No documents.xml found (normal for BCF 2.x)');
      bcfData.documents = null;
      return;
    }

    try {
      console.log(
        '📄 Found documents.xml - parsing BCF 3.0 document structure...'
      );
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

      console.log(
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
    console.log('Found topic folders:', topicFoldersArray);
    console.log('All file paths:', Object.keys(zip.files));

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

      const topic = {
        guid: topicGuid,
        title: this.getElementTextWithAliases(doc, [
          'Title',
          'Subject',
          'Name',
        ]),
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
        console.log(
          '🔍 Checking BCF 3.0 specific fields for topic:',
          topic.title
        );
        this.extractBCF30Fields(topicElement, doc, topic);
      }

      // Extract labels with aliases
      const labelElements = doc.querySelectorAll(
        'Labels Label, Tags Tag, Categories Category'
      );
      labelElements.forEach((label) => {
        topic.labels.push(label.textContent?.trim() || '');
      });

      // Discover and extract custom fields from Topic element
      this.extractCustomFields(topicElement, topic._customFields, 'topic');

      // Scan entire document for any unrecognized elements
      this.scanForUnknownElements(doc, topic._customFields);

      // Parse comments (they might be in markup.bcf instead of separate comments.bcf)
      await this.parseCommentsEnhanced(zip, topicGuid, topic, doc, bcfFormat);

      // Debug: log actual comment count after parsing
      console.log(
        `Topic ${topic.title} parsed with ${topic.comments.length} comments`
      );

      // Parse viewpoints
      this.parseViewpoints(doc, topic);

      return topic;
    } catch (error) {
      console.error(`Error parsing topic ${topicGuid}:`, error);
      return null;
    }
  }

  static async parseComments(zip, topicGuid, topic, markupDoc) {
    // Track comment GUIDs to prevent duplicates
    const existingCommentGuids = new Set();

    // Check comments from markup.bcf first (common in newer BCF versions)
    if (markupDoc) {
      const commentElements = markupDoc.querySelectorAll(
        'Comment, Note, Remark'
      );
      commentElements.forEach((commentEl) => {
        const commentGuid =
          commentEl.getAttribute('Guid') || commentEl.getAttribute('Id');
        if (!existingCommentGuids.has(commentGuid)) {
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

          // Extract custom fields from comment element
          this.extractCustomFields(commentEl, comment._customFields, 'comment');

          topic.comments.push(comment);
          existingCommentGuids.add(commentGuid);
        }
      });
    }

    // ALSO check separate comments.bcf file (some tools use this) - but avoid duplicates
    // Update existing GUIDs from markup comments
    topic.comments.forEach((c) => existingCommentGuids.add(c.guid));
    const commentsFile = zip.file(`${topicGuid}/comments.bcf`);
    if (!commentsFile) {
      return; // No comments found
    }

    try {
      const commentsXml = await commentsFile.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(commentsXml, 'text/xml');

      const commentElements = doc.querySelectorAll('Comment, Note, Remark');
      commentElements.forEach((commentEl) => {
        const commentGuid =
          commentEl.getAttribute('Guid') || commentEl.getAttribute('Id');
        if (!existingCommentGuids.has(commentGuid)) {
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

          // Extract custom fields from comment element
          this.extractCustomFields(commentEl, comment._customFields, 'comment');

          topic.comments.push(comment);
        }
      });
    } catch (error) {
      console.warn(`Error parsing comments for topic ${topicGuid}:`, error);
    }
  }

  static parseViewpoints(doc, topic) {
    const viewpointElements = doc.querySelectorAll('Viewpoints Viewpoint');
    viewpointElements.forEach((viewpointEl) => {
      const viewpoint = {
        guid: viewpointEl.getAttribute('Guid'),
        viewpoint: viewpointEl.getAttribute('Viewpoint'),
        snapshot: viewpointEl.getAttribute('Snapshot'),
        index: viewpointEl.getAttribute('Index'),
      };
      topic.viewpoints.push(viewpoint);
    });
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
      console.log('🔍 Running enhanced structure-based format detection...');

      // Priority 1: Check for BCF 3.0 indicators first
      const bcf30Confirmed = await this.confirmBCF30Format(zip);
      if (bcf30Confirmed) {
        console.log('✅ Structure analysis confirms BCF 3.0');
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
            console.log(
              '✅ Structure analysis confirms BCF 2.1: ProjectExtension + ExtensionSchema'
            );
            return '2.1';
          } else {
            console.log(
              '✅ Structure analysis confirms BCF 2.0: ProjectExtension without ExtensionSchema'
            );
            return '2.0';
          }
        }
      }

      // Priority 3: Check for extensions.xsd file (BCF 2.1+ feature)
      const extensionsFile = zip.file('extensions.xsd');
      if (extensionsFile) {
        console.log('✅ Found extensions.xsd - indicates BCF 2.1+');
        return '2.1';
      }

      // Default fallback to most common stable format
      console.log(
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
      console.log('🔍 Verifying BCF 3.0 format indicators...');

      // Indicator 1: Check for documents.xml (BCF 3.0 feature)
      const documentsFile = zip.file('documents.xml');
      if (documentsFile) {
        console.log('📄 Found documents.xml - strong BCF 3.0 indicator');
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
          console.log('🏗️ Found ProjectInfo structure - BCF 3.0 confirmed');
          return true;
        }

        if (projectExtension && !projectInfo) {
          console.log('🏗️ Found ProjectExtension structure - this is BCF 2.x');
          return false;
        }
      }

      // Indicator 3: Check for BCF 3.0 topic features (ServerAssignedId)
      const topicIndicators = await this.checkForBCF30TopicFeatures(zip);
      if (topicIndicators) {
        console.log('📋 Found BCF 3.0 topic features');
        return true;
      }

      // If no clear BCF 3.0 indicators found, it's likely BCF 2.x
      console.log('📊 No clear BCF 3.0 indicators found, treating as BCF 2.x');
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
        console.log('🔍 No topics found for BCF 3.0 feature detection');
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
          console.log(
            '🆔 Found ServerAssignedId attribute - BCF 3.0 feature detected'
          );
          return true;
        }

        // Look for multiple ReferenceLink elements (BCF 3.0 allows multiple)
        const referenceLinks = doc.querySelectorAll('Topic > ReferenceLink');
        if (referenceLinks.length > 1) {
          console.log(
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
    console.log('🏗️ Parsing BCF 3.0 ProjectInfo structure...');

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

    console.log('✅ BCF 3.0 project parsed successfully:', {
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
    console.log('🏗️ Parsing BCF 2.x ProjectExtension structure...');

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

    console.log(`✅ BCF ${bcfVersion} project parsed successfully:`, {
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
      console.log('Fallback: Found ProjectExtension structure');
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
        console.log('Fallback: Found ProjectInfo structure');
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
        console.log('Fallback: Found direct Project structure');
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
      console.log('🆔 Extracting BCF 3.0 fields for topic:', topic.title);

      // Extract ServerAssignedId (BCF 3.0 new attribute)
      if (topicElement) {
        const serverAssignedId = topicElement.getAttribute('ServerAssignedId');
        if (serverAssignedId) {
          topic.serverAssignedId = serverAssignedId;
          console.log('✅ Found ServerAssignedId:', serverAssignedId);
        }
      }

      // Extract multiple ReferenceLinks (BCF 3.0: now supports multiple vs single)
      const referenceLinks = doc.querySelectorAll('Topic > ReferenceLink');
      if (referenceLinks.length > 0) {
        topic.referenceLinks = Array.from(referenceLinks)
          .map((link) => link.textContent?.trim() || '')
          .filter((link) => link); // Remove empty links

        console.log(
          '🔗 Found multiple reference links:',
          topic.referenceLinks.length
        );
      }

      // Extract BCF 3.0 DocumentReferences (new structure)
      const documentReferences = this.extractBCF30DocumentReferences(doc);
      if (documentReferences.length > 0) {
        topic.documentReferences = documentReferences;
        console.log('📄 Found document references:', documentReferences.length);
      }

      // Extract Header Files (BCF 3.0: enhanced Files structure in Header)
      const headerFiles = this.extractBCF30HeaderFiles(doc);
      if (headerFiles.length > 0) {
        topic.headerFiles = headerFiles;
        console.log('📂 Found header files:', headerFiles.length);
      }

      console.log(
        '✅ BCF 3.0 fields extraction complete for topic:',
        topic.title
      );
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

      console.log(
        '📄 BCF 3.0: Parsed document references:',
        documentReferences
      );
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

      console.log('BCF 3.0: Parsed header files:', headerFiles);
    } catch (error) {
      console.warn('Error parsing BCF 3.0 header files:', error);
    }

    return headerFiles;
  }

  /**
   * Enhanced comment parsing with BCF 3.0 support
   * This replaces the old parseComments method
   */
  static async parseCommentsEnhanced(
    zip,
    topicGuid,
    topic,
    markupDoc,
    bcfFormat
  ) {
    // Track comment GUIDs to prevent duplicates (your existing logic)
    const existingCommentGuids = new Set();

    if (bcfFormat === '3.0') {
      // BCF 3.0: Comments are in separate files, not inline
      console.log('BCF 3.0: Looking for separate comments file');
      await this.parseBCF30Comments(
        zip,
        topicGuid,
        topic,
        existingCommentGuids
      );
    } else {
      // BCF 2.x: Comments might be inline in markup OR separate files
      console.log('BCF 2.x: Checking for inline comments first');

      // Check inline comments first (your existing logic)
      if (markupDoc) {
        const commentElements = markupDoc.querySelectorAll(
          'Comment, Note, Remark'
        );
        commentElements.forEach((commentEl) => {
          const commentGuid =
            commentEl.getAttribute('Guid') || commentEl.getAttribute('Id');
          if (!existingCommentGuids.has(commentGuid)) {
            const comment = this.parseCommentElement(commentEl);
            topic.comments.push(comment);
            existingCommentGuids.add(commentGuid);
          }
        });
      }

      // Then check separate comments file as fallback (your existing logic)
      await this.parseBCF2xCommentsFile(
        zip,
        topicGuid,
        topic,
        existingCommentGuids
      );
    }

    console.log(
      `Topic ${topic.title} parsed with ${topic.comments.length} comments`
    );
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
}
