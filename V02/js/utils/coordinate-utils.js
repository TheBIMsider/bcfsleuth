/**
 * BCFSleuth Coordinate Utilities
 * Centralized coordinate handling for all BCF camera data across exporters and viewers
 *
 * This module provides:
 * - Unified coordinate formatting with 3 decimal precision
 * - Primary viewpoint selection logic with multiple fallbacks
 * - Consistent coordinate access methods for all BCF versions
 * - Null/undefined handling for missing coordinate data
 *
 * Usage:
 *   import { CoordinateUtils } from './js/utils/coordinate-utils.js';
 *   const formattedX = CoordinateUtils.formatCoordinate(value);
 *   const primaryVP = CoordinateUtils.getPrimaryViewpoint(topic);
 */

class CoordinateUtils {
  /**
   * Format coordinate value with consistent precision
   * Handles null, undefined, empty string, and invalid numbers
   * @param {number|string|null|undefined} value - Raw coordinate value
   * @returns {string} - Formatted coordinate (3 decimal places) or empty string
   */
  static formatCoordinate(value) {
    // Handle null, undefined, or empty values
    if (value === null || value === undefined || value === '') {
      return '';
    }

    // Convert to number and validate
    const num = parseFloat(value);
    if (isNaN(num)) {
      return '';
    }

    // Return formatted number with 3 decimal places
    return num.toFixed(3);
  }

  /**
   * Get primary viewpoint from topic using intelligent selection logic
   * Priority order:
   * 1. Main viewpoint.bcfv file (BCF standard naming)
   * 2. Viewpoint with "viewpoint-generic" GUID
   * 3. First viewpoint with camera coordinate data
   * 4. Any available viewpoint as fallback
   *
   * @param {Object} topic - BCF topic object with viewpoints array
   * @returns {Object|null} - Primary viewpoint object or null if none available
   */
  static getPrimaryViewpoint(topic) {
    // Validate input
    if (
      !topic ||
      !topic.viewpoints ||
      !Array.isArray(topic.viewpoints) ||
      topic.viewpoints.length === 0
    ) {
      return null;
    }

    console.log(
      `🎯 Selecting primary viewpoint from ${topic.viewpoints.length} available viewpoints`
    );

    // Priority 1: Look for main viewpoint.bcfv file (BCF standard)
    let primaryViewpoint = topic.viewpoints.find((vp) => {
      return (
        vp.viewpointFile === 'viewpoint.bcfv' ||
        vp.guid === 'viewpoint-generic' ||
        (vp.viewpointFile &&
          vp.viewpointFile.toLowerCase().includes('viewpoint.bcfv'))
      );
    });

    if (primaryViewpoint) {
      console.log('✅ Primary viewpoint found: Standard viewpoint.bcfv file');
      return primaryViewpoint;
    }

    // Priority 2: First viewpoint with camera coordinate data
    primaryViewpoint = topic.viewpoints.find((vp) => {
      const hasCoordinates =
        vp.cameraType ||
        vp.CameraViewPoint ||
        vp.cameraPosition ||
        (vp.cameraPosition &&
          (vp.cameraPosition.x !== null ||
            vp.cameraPosition.y !== null ||
            vp.cameraPosition.z !== null)) ||
        (vp.cameraTarget &&
          (vp.cameraTarget.x !== null ||
            vp.cameraTarget.y !== null ||
            vp.cameraTarget.z !== null));
      return hasCoordinates;
    });

    if (primaryViewpoint) {
      console.log(
        '✅ Primary viewpoint found: First viewpoint with camera data'
      );
      return primaryViewpoint;
    }

    // Priority 3: Any available viewpoint (fallback)
    primaryViewpoint = topic.viewpoints[0];
    console.log(
      'ℹ️ Primary viewpoint: Using first available viewpoint as fallback'
    );

    return primaryViewpoint;
  }

  /**
   * Get formatted coordinate from primary viewpoint
   * @param {Object} topic - BCF topic object
   * @param {string} coordinateType - Type of coordinate (e.g., 'CameraViewPoint', 'CameraDirection', 'cameraPosition')
   * @param {string} axis - Coordinate axis ('x', 'y', 'z')
   * @returns {string} - Formatted coordinate value or empty string
   */
  static getPrimaryViewpointCoordinate(topic, coordinateType, axis) {
    const primaryViewpoint = this.getPrimaryViewpoint(topic);

    if (!primaryViewpoint) {
      return '';
    }

    // Check if the coordinate type exists on the viewpoint
    if (!primaryViewpoint[coordinateType]) {
      return '';
    }

    // Get the specific axis value
    const value = primaryViewpoint[coordinateType][axis];
    return this.formatCoordinate(value);
  }

  /**
   * Get formatted BCF coordinate using standard BCF field names
   * Supports both BCF 2.x and BCF 3.0 coordinate naming conventions
   * @param {Object} topic - BCF topic object
   * @param {string} coordinateType - BCF coordinate type ('CameraViewPoint', 'CameraDirection', 'CameraUpVector')
   * @param {string} axis - Coordinate axis ('x', 'y', 'z')
   * @returns {string} - Formatted coordinate value or empty string
   */
  static getPrimaryViewpointBCFCoordinate(topic, coordinateType, axis) {
    const primaryViewpoint = this.getPrimaryViewpoint(topic);

    if (!primaryViewpoint) {
      return '';
    }

    // Try standard BCF coordinate naming first
    if (
      primaryViewpoint[coordinateType] &&
      primaryViewpoint[coordinateType][axis] !== undefined
    ) {
      const value = primaryViewpoint[coordinateType][axis];
      return this.formatCoordinate(value);
    }

    // Fallback to legacy naming conventions for backwards compatibility
    const legacyMappings = {
      CameraViewPoint: ['cameraPosition', 'viewPoint'],
      CameraDirection: ['cameraDirection', 'direction'],
      CameraUpVector: ['cameraUpVector', 'upVector'],
    };

    if (legacyMappings[coordinateType]) {
      for (const legacyName of legacyMappings[coordinateType]) {
        if (
          primaryViewpoint[legacyName] &&
          primaryViewpoint[legacyName][axis] !== undefined
        ) {
          const value = primaryViewpoint[legacyName][axis];
          return this.formatCoordinate(value);
        }
      }
    }

    return '';
  }

  /**
   * Get camera type from primary viewpoint
   * @param {Object} topic - BCF topic object
   * @returns {string} - Camera type or empty string
   */
  static getPrimaryCameraType(topic) {
    const primaryViewpoint = this.getPrimaryViewpoint(topic);

    if (!primaryViewpoint) {
      return '';
    }

    return primaryViewpoint.cameraType || '';
  }

  /**
   * Get FieldOfView from primary viewpoint (perspective cameras)
   * @param {Object} topic - BCF topic object
   * @returns {string} - Formatted FieldOfView value or empty string
   */
  static getPrimaryFieldOfView(topic) {
    const primaryViewpoint = this.getPrimaryViewpoint(topic);

    if (!primaryViewpoint) {
      return '';
    }

    const fieldOfView =
      primaryViewpoint.FieldOfView || primaryViewpoint.fieldOfView;
    return this.formatCoordinate(fieldOfView);
  }

  /**
   * Get ViewToWorldScale from primary viewpoint (orthogonal cameras)
   * @param {Object} topic - BCF topic object
   * @returns {string} - Formatted ViewToWorldScale value or empty string
   */
  static getPrimaryViewToWorldScale(topic) {
    const primaryViewpoint = this.getPrimaryViewpoint(topic);

    if (!primaryViewpoint) {
      return '';
    }

    const scale =
      primaryViewpoint.ViewToWorldScale || primaryViewpoint.viewToWorldScale;
    return this.formatCoordinate(scale);
  }

  /**
   * Check if topic has any coordinate data in its viewpoints
   * @param {Object} topic - BCF topic object
   * @returns {boolean} - True if coordinate data is available
   */
  static hasCoordinateData(topic) {
    const primaryViewpoint = this.getPrimaryViewpoint(topic);

    if (!primaryViewpoint) {
      return false;
    }

    // Check for any coordinate-related fields
    const coordinateFields = [
      'cameraType',
      'CameraViewPoint',
      'CameraDirection',
      'CameraUpVector',
      'cameraPosition',
      'cameraTarget',
      'cameraDirection',
      'cameraUpVector',
      'FieldOfView',
      'ViewToWorldScale',
    ];

    return coordinateFields.some((field) => {
      const fieldValue = primaryViewpoint[field];
      if (!fieldValue) return false;

      // For objects with x,y,z properties
      if (typeof fieldValue === 'object' && fieldValue !== null) {
        return (
          fieldValue.x !== undefined ||
          fieldValue.y !== undefined ||
          fieldValue.z !== undefined
        );
      }

      // For scalar values
      return (
        fieldValue !== null && fieldValue !== undefined && fieldValue !== ''
      );
    });
  }

  /**
   * Get comprehensive coordinate summary for a topic
   * Useful for debugging and validation
   * @param {Object} topic - BCF topic object
   * @returns {Object} - Complete coordinate data summary
   */
  static getCoordinateSummary(topic) {
    const primaryViewpoint = this.getPrimaryViewpoint(topic);

    if (!primaryViewpoint) {
      return {
        hasCoordinates: false,
        viewpointCount: topic.viewpoints ? topic.viewpoints.length : 0,
        primaryViewpoint: null,
        coordinates: {},
      };
    }

    return {
      hasCoordinates: this.hasCoordinateData(topic),
      viewpointCount: topic.viewpoints.length,
      primaryViewpoint: {
        guid: primaryViewpoint.guid,
        file: primaryViewpoint.viewpointFile,
        cameraType: primaryViewpoint.cameraType,
      },
      coordinates: {
        cameraType: this.getPrimaryCameraType(topic),
        CameraViewPointX: this.getPrimaryViewpointBCFCoordinate(
          topic,
          'CameraViewPoint',
          'x'
        ),
        CameraViewPointY: this.getPrimaryViewpointBCFCoordinate(
          topic,
          'CameraViewPoint',
          'y'
        ),
        CameraViewPointZ: this.getPrimaryViewpointBCFCoordinate(
          topic,
          'CameraViewPoint',
          'z'
        ),
        CameraDirectionX: this.getPrimaryViewpointBCFCoordinate(
          topic,
          'CameraDirection',
          'x'
        ),
        CameraDirectionY: this.getPrimaryViewpointBCFCoordinate(
          topic,
          'CameraDirection',
          'y'
        ),
        CameraDirectionZ: this.getPrimaryViewpointBCFCoordinate(
          topic,
          'CameraDirection',
          'z'
        ),
        CameraUpVectorX: this.getPrimaryViewpointBCFCoordinate(
          topic,
          'CameraUpVector',
          'x'
        ),
        CameraUpVectorY: this.getPrimaryViewpointBCFCoordinate(
          topic,
          'CameraUpVector',
          'y'
        ),
        CameraUpVectorZ: this.getPrimaryViewpointBCFCoordinate(
          topic,
          'CameraUpVector',
          'z'
        ),
        FieldOfView: this.getPrimaryFieldOfView(topic),
        ViewToWorldScale: this.getPrimaryViewToWorldScale(topic),
      },
    };
  }
}

// Export for use in other modules
window.CoordinateUtils = CoordinateUtils;

// Also support ES6 module exports if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CoordinateUtils };
}
