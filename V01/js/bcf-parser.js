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

      // Parse all topics
      await this.parseTopics(zip, bcfData);

      return bcfData;
    } catch (error) {
      console.error('Error parsing BCF file:', error);
      throw new Error(`Failed to parse BCF file: ${error.message}`);
    }
  }

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
        bcfData.version = versionElement.getAttribute('VersionId') || 'Unknown';
      }
    } catch (error) {
      console.warn('Error parsing version file:', error);
      bcfData.version = 'Unknown';
    }
  }

  static async parseProject(zip, bcfData) {
    const projectFile = zip.file('project.bcfp');
    if (!projectFile) {
      console.warn('No project.bcfp file found');
      return;
    }

    try {
      const projectXml = await projectFile.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(projectXml, 'text/xml');

      console.log('Project XML found'); // Debug log

      // Extract project information - handle multiple BCF structures
      let projectName = '';
      let projectId = '';

      // Method 1: ProjectExtension/Project/Name (BIMtrack, custom BCF tools)
      const projectExtensionElement = doc.querySelector(
        'ProjectExtension Project'
      );
      if (projectExtensionElement) {
        projectName = this.getElementText(projectExtensionElement, 'Name');
        projectId = projectExtensionElement.getAttribute('ProjectId');
        console.log('Found ProjectExtension structure');
      }

      // Method 2: ProjectInfo/Name (standard BCF 2.1 structure)
      if (!projectName) {
        const projectInfoElement = doc.querySelector('ProjectInfo');
        if (projectInfoElement) {
          projectName = this.getElementText(projectInfoElement, 'Name');
          projectId = projectInfoElement.getAttribute('ProjectId');
          console.log('Found ProjectInfo structure');
        }
      }

      // Method 3: Direct Project/Name (some BCF variants)
      if (!projectName) {
        const projectElement = doc.querySelector('Project');
        if (projectElement) {
          projectName = this.getElementText(projectElement, 'Name');
          projectId =
            projectElement.getAttribute('ProjectId') ||
            projectElement.getAttribute('Id');
          console.log('Found direct Project structure');
        }
      }

      console.log('Parsed project name:', projectName);
      console.log('Parsed project ID:', projectId);

      bcfData.project = {
        name: projectName || 'Unknown Project',
        projectId: projectId || '',
      };
    } catch (error) {
      console.warn('Error parsing project file:', error);
      bcfData.project = {
        name: 'Unknown Project',
        projectId: '',
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

    // Parse each topic
    for (const topicGuid of topicFolders) {
      try {
        const topic = await this.parseTopic(zip, topicGuid);
        if (topic) {
          topics.push(topic);
        }
      } catch (error) {
        console.warn(`Error parsing topic ${topicGuid}:`, error);
      }
    }

    bcfData.topics = topics;
  }

  static async parseTopic(zip, topicGuid) {
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
        // Store raw XML and discovered fields for advanced analysis
        _rawXml: markupXml,
        _topicElement: topicElement,
        _customFields: {},
      };

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
      await this.parseComments(zip, topicGuid, topic, doc);

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
}
