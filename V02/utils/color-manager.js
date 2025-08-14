/**
 * BCFSleuth Color Manager
 * Unified color generation and management for charts, status indicators, and visualizations
 *
 * This module provides:
 * - Consistent color palettes across all components
 * - Smart color generation for any number of categories
 * - Status-specific color schemes (Open, Closed, In Progress, etc.)
 * - Priority-based color schemes (Low, Normal, High, Critical)
 * - Accessible color combinations with good contrast
 *
 * Usage:
 *   const statusColors = ColorManager.getStatusColors(['Open', 'Closed', 'In Progress']);
 *   const chartColors = ColorManager.getDistinctColors(dataArray);
 */

class ColorManager {
  /**
   * Base color palette - professional, accessible colors
   * Designed for good contrast and visual distinction
   */
  static BASE_PALETTE = [
    '#2563eb', // Blue
    '#dc2626', // Red
    '#16a34a', // Green
    '#ca8a04', // Amber
    '#9333ea', // Purple
    '#c2410c', // Orange
    '#0891b2', // Cyan
    '#be123c', // Rose
    '#65a30d', // Lime
    '#7c2d12', // Brown
    '#1f2937', // Gray
    '#831843', // Pink
    '#374151', // Slate
    '#0f766e', // Teal
    '#a21caf', // Fuchsia
    '#166534', // Emerald
    '#92400e', // Yellow
    '#1e40af', // Indigo
    '#b91c1c', // Red-600
    '#059669', // Green-600
    '#d97706', // Amber-600
    '#7c3aed', // Violet
    '#dc2626', // Red-600
    '#ea580c', // Orange-600
    '#0284c7', // Sky
  ];

  /**
   * Status-specific color mappings
   * Maps common BCF status values to appropriate colors
   */
  static STATUS_COLORS = {
    open: '#dc2626', // Red - needs attention
    closed: '#16a34a', // Green - completed
    'in progress': '#2563eb', // Blue - active work
    'under review': '#ca8a04', // Amber - pending
    resolved: '#16a34a', // Green - completed
    rejected: '#7f1d1d', // Dark red - declined
    'on hold': '#6b7280', // Gray - paused
    pending: '#ca8a04', // Amber - waiting
    active: '#2563eb', // Blue - current
    inactive: '#6b7280', // Gray - dormant
    new: '#9333ea', // Purple - fresh
    assigned: '#0891b2', // Cyan - allocated
    reopened: '#dc2626', // Red - returned
  };

  /**
   * Priority-specific color mappings
   * Maps priority levels to appropriate urgency colors
   */
  static PRIORITY_COLORS = {
    low: '#16a34a', // Green - low urgency
    normal: '#2563eb', // Blue - standard
    medium: '#ca8a04', // Amber - moderate
    high: '#dc2626', // Red - urgent
    critical: '#7f1d1d', // Dark red - emergency
    none: '#6b7280', // Gray - unspecified
  };

  /**
   * Get distinct colors for any array of values
   * Automatically assigns colors based on value type (status, priority, or generic)
   * @param {Array} values - Array of values to assign colors to
   * @param {string} context - Optional context hint ('status', 'priority', 'generic')
   * @returns {Object} - Map of value -> color
   */
  static getDistinctColors(values, context = 'auto') {
    if (!Array.isArray(values) || values.length === 0) {
      return {};
    }

    const uniqueValues = [...new Set(values)];
    const colorMap = {};

    // Auto-detect context if not specified
    if (context === 'auto') {
      context = this.detectContext(uniqueValues);
    }

    uniqueValues.forEach((value, index) => {
      const normalizedValue = value
        ? value.toString().toLowerCase().trim()
        : 'unknown';

      let color;

      // Use specific color mappings when available
      if (context === 'status' && this.STATUS_COLORS[normalizedValue]) {
        color = this.STATUS_COLORS[normalizedValue];
      } else if (
        context === 'priority' &&
        this.PRIORITY_COLORS[normalizedValue]
      ) {
        color = this.PRIORITY_COLORS[normalizedValue];
      } else {
        // Fall back to base palette with cycling
        color = this.BASE_PALETTE[index % this.BASE_PALETTE.length];
      }

      colorMap[value] = color;
    });

    console.log(
      `🎨 Generated ${uniqueValues.length} colors for ${context} context:`,
      colorMap
    );
    return colorMap;
  }

  /**
   * Get colors specifically for status values
   * @param {Array} statuses - Array of status values
   * @returns {Object} - Map of status -> color
   */
  static getStatusColors(statuses) {
    return this.getDistinctColors(statuses, 'status');
  }

  /**
   * Get colors specifically for priority values
   * @param {Array} priorities - Array of priority values
   * @returns {Object} - Map of priority -> color
   */
  static getPriorityColors(priorities) {
    return this.getDistinctColors(priorities, 'priority');
  }

  /**
   * Generate a color palette for charts
   * Returns an array of colors suitable for Chart.js or similar libraries
   * @param {number} count - Number of colors needed
   * @param {number} alpha - Opacity (0-1), default 1
   * @returns {Array} - Array of color strings
   */
  static generateChartPalette(count, alpha = 1) {
    const colors = [];

    for (let i = 0; i < count; i++) {
      const baseColor = this.BASE_PALETTE[i % this.BASE_PALETTE.length];

      if (alpha < 1) {
        // Convert hex to rgba for transparency
        const rgba = this.hexToRgba(baseColor, alpha);
        colors.push(rgba);
      } else {
        colors.push(baseColor);
      }
    }

    return colors;
  }

  /**
   * Auto-detect context based on common value patterns
   * @param {Array} values - Array of values to analyze
   * @returns {string} - Detected context ('status', 'priority', or 'generic')
   */
  static detectContext(values) {
    const allValues = values
      .map((v) => (v ? v.toString().toLowerCase() : ''))
      .join(' ');

    // Check for status keywords
    const statusKeywords = [
      'open',
      'closed',
      'progress',
      'review',
      'resolved',
      'pending',
      'active',
    ];
    const hasStatusKeywords = statusKeywords.some((keyword) =>
      allValues.includes(keyword)
    );

    // Check for priority keywords
    const priorityKeywords = ['low', 'normal', 'high', 'critical', 'medium'];
    const hasPriorityKeywords = priorityKeywords.some((keyword) =>
      allValues.includes(keyword)
    );

    if (hasStatusKeywords) return 'status';
    if (hasPriorityKeywords) return 'priority';
    return 'generic';
  }

  /**
   * Convert hex color to RGBA
   * @param {string} hex - Hex color (e.g., '#2563eb')
   * @param {number} alpha - Alpha value (0-1)
   * @returns {string} - RGBA color string
   */
  static hexToRgba(hex, alpha) {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse hex values
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Get a single color for a specific value
   * @param {string} value - Value to get color for
   * @param {string} context - Context ('status', 'priority', 'generic')
   * @param {Array} allValues - All values in the dataset (for consistent color assignment)
   * @returns {string} - Hex color
   */
  static getColorForValue(value, context = 'auto', allValues = []) {
    if (allValues.length > 0) {
      const colorMap = this.getDistinctColors(allValues, context);
      return colorMap[value] || this.BASE_PALETTE[0];
    }

    const normalizedValue = value
      ? value.toString().toLowerCase().trim()
      : 'unknown';

    if (context === 'auto') {
      context = this.detectContext([value]);
    }

    if (context === 'status' && this.STATUS_COLORS[normalizedValue]) {
      return this.STATUS_COLORS[normalizedValue];
    }

    if (context === 'priority' && this.PRIORITY_COLORS[normalizedValue]) {
      return this.PRIORITY_COLORS[normalizedValue];
    }

    return this.BASE_PALETTE[0];
  }

  /**
   * Generate gradient colors between two colors
   * Useful for heat maps or progressive indicators
   * @param {string} startColor - Starting hex color
   * @param {string} endColor - Ending hex color
   * @param {number} steps - Number of steps in gradient
   * @returns {Array} - Array of gradient colors
   */
  static generateGradient(startColor, endColor, steps) {
    const start = this.hexToRgb(startColor);
    const end = this.hexToRgb(endColor);
    const gradient = [];

    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      const r = Math.round(start.r + (end.r - start.r) * ratio);
      const g = Math.round(start.g + (end.g - start.g) * ratio);
      const b = Math.round(start.b + (end.b - start.b) * ratio);

      gradient.push(this.rgbToHex(r, g, b));
    }

    return gradient;
  }

  /**
   * Convert hex to RGB object
   * @param {string} hex - Hex color
   * @returns {Object} - {r, g, b} values
   */
  static hexToRgb(hex) {
    hex = hex.replace('#', '');
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16),
    };
  }

  /**
   * Convert RGB to hex
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)
   * @param {number} b - Blue value (0-255)
   * @returns {string} - Hex color
   */
  static rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Get high contrast text color (black or white) for a background color
   * @param {string} backgroundColor - Background hex color
   * @returns {string} - '#000000' or '#ffffff'
   */
  static getContrastTextColor(backgroundColor) {
    const rgb = this.hexToRgb(backgroundColor);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }
}

// Export for use in other modules
window.ColorManager = ColorManager;

// Also support ES6 module exports if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ColorManager };
}
