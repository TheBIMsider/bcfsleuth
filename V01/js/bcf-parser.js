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

      // Method 1: ProjectExtension/Project/Name (your BCF structure)
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
      // For now, just store the raw XML - could be parsed further in future phases
      bcfData.extensions = extensionsXml;
    } catch (error) {
      console.warn('Error parsing extensions file:', error);
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
        title: this.getElementText(doc, 'Title'),
        topicStatus: topicElement?.getAttribute('TopicStatus') || '',
        topicType: topicElement?.getAttribute('TopicType') || '',
        priority: this.getElementText(doc, 'Priority'),
        description: this.getElementText(doc, 'Description'),
        creationDate: this.getElementText(doc, 'CreationDate'),
        creationAuthor: this.getElementText(doc, 'CreationAuthor'),
        modifiedDate: this.getElementText(doc, 'ModifiedDate'),
        modifiedAuthor: this.getElementText(doc, 'ModifiedAuthor'),
        dueDate: this.getElementText(doc, 'DueDate'),
        assignedTo: this.getElementText(doc, 'AssignedTo'),
        stage: this.getElementText(doc, 'Stage'),
        labels: [],
        comments: [],
        viewpoints: [],
      };

      // Extract labels
      const labelElements = doc.querySelectorAll('Labels Label');
      labelElements.forEach((label) => {
        topic.labels.push(label.textContent?.trim() || '');
      });

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
      const commentElements = markupDoc.querySelectorAll('Comment');
      commentElements.forEach((commentEl) => {
        const commentGuid = commentEl.getAttribute('Guid');
        if (!existingCommentGuids.has(commentGuid)) {
          const comment = {
            guid: commentGuid,
            date: this.getElementText(commentEl, 'Date'),
            author: this.getElementText(commentEl, 'Author'),
            comment: this.getElementText(commentEl, 'Comment'),
            modifiedDate: this.getElementText(commentEl, 'ModifiedDate'),
            modifiedAuthor: this.getElementText(commentEl, 'ModifiedAuthor'),
          };
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

      const commentElements = doc.querySelectorAll('Comment');
      commentElements.forEach((commentEl) => {
        const comment = {
          guid: commentEl.getAttribute('Guid'),
          date: this.getElementText(commentEl, 'Date'),
          author: this.getElementText(commentEl, 'Author'),
          comment: this.getElementText(commentEl, 'Comment'),
          modifiedDate: this.getElementText(commentEl, 'ModifiedDate'),
          modifiedAuthor: this.getElementText(commentEl, 'ModifiedAuthor'),
        };
        topic.comments.push(comment);
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

  static isGuid(str) {
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return guidRegex.test(str);
  }
}
