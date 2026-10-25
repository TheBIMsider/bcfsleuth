/**
 * BCFSleuth Word Utilities
 * Shared helpers for building Word (docx) report content
 *
 * This module provides:
 * - Single-run text paragraph construction
 * - Base64 image data to byte array conversion
 * - Centered image paragraphs with an "[Image not available]" fallback
 *
 * Usage:
 *   WordUtils.createTextParagraph('Title', { bold: true, size: 32 }, { spacing: { after: 400 } });
 *   WordUtils.createImageParagraphWithFallback(image, { width: 400, height: 300 }, { before: 200, after: 300 }, 'Word document');
 *
 * Requires the docx library (window.docx) to be loaded when a helper is called.
 */

class WordUtils {
  /**
   * Create a paragraph holding a single text run
   * @param {string} text - Run text
   * @param {Object} [runOptions] - Extra TextRun options (bold, size, color, ...)
   * @param {Object} [paragraphOptions] - Extra Paragraph options (heading, alignment, spacing, ...)
   * @returns {Paragraph} - docx Paragraph
   */
  static createTextParagraph(text, runOptions = {}, paragraphOptions = {}) {
    const { Paragraph, TextRun } = window.docx;

    return new Paragraph({
      children: [new TextRun({ text, ...runOptions })],
      ...paragraphOptions,
    });
  }

  /**
   * Convert base64 image data to a byte array for ImageRun
   * @param {string} base64Data - Base64 encoded image data
   * @returns {Uint8Array} - Decoded bytes
   * @throws {Error} - If the data is not valid base64
   */
  static base64ToBytes(base64Data) {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
  }

  /**
   * Create a centered paragraph for an image, or an "[Image not available]"
   * paragraph if the image cannot be decoded
   * @param {Object} image - Image data ({imageData, imageType})
   * @param {{width: number, height: number}} size - Image size in the document
   * @param {Object|null} [spacing] - Paragraph spacing, omitted when null
   * @param {string} [context] - Where the image is going, used in the warning message
   * @returns {Paragraph} - docx Paragraph
   */
  static createImageParagraphWithFallback(
    image,
    size,
    spacing = null,
    context = 'Word document'
  ) {
    const { Paragraph, TextRun, ImageRun, AlignmentType } = window.docx;
    const spacingOptions = spacing ? { spacing } : {};

    try {
      const imageBuffer = WordUtils.base64ToBytes(image.imageData);

      return new Paragraph({
        children: [
          new ImageRun({
            data: imageBuffer,
            transformation: {
              width: size.width,
              height: size.height,
            },
            type: image.imageType.includes('png') ? 'png' : 'jpg',
          }),
        ],
        alignment: AlignmentType.CENTER,
        ...spacingOptions,
      });
    } catch (error) {
      console.warn(`Error adding image to ${context}:`, error);

      return new Paragraph({
        children: [
          new TextRun({
            text: '[Image not available]',
            italics: true,
            color: '999999',
          }),
        ],
        alignment: AlignmentType.CENTER,
        ...spacingOptions,
      });
    }
  }
}

// Export for use in other modules
window.WordUtils = WordUtils;

// Also support ES6 module exports if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WordUtils };
}
