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
}

// Export for use in other modules
window.ColorManager = ColorManager;

// Also support ES6 module exports if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ColorManager };
}
