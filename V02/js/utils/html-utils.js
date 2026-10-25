/**
 * BCFSleuth HTML Utilities
 * Shared escaping helpers for any BCF-derived text that is rendered via innerHTML.
 *
 * Usage:
 *   element.innerHTML = `<td title="${HtmlUtils.escape(value)}">${HtmlUtils.escape(value)}</td>`;
 */

class HtmlUtils {
  /**
   * Escape text for safe use in HTML content and quoted attribute values.
   * @param {*} text - Value to escape (null/undefined become '')
   * @returns {string} Escaped string
   */
  static escape(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
