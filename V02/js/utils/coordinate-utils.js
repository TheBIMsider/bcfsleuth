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
   * Camera/coordinate field names (BCF camera data plus legacy position/target).
   * Exporters use this to decide whether coordinate columns are selected.
   */
  static COORDINATE_FIELDS = [
    'cameraType',
    'CameraViewPointX',
    'CameraViewPointY',
    'CameraViewPointZ',
    'CameraDirectionX',
    'CameraDirectionY',
    'CameraDirectionZ',
    'CameraUpVectorX',
    'CameraUpVectorY',
    'CameraUpVectorZ',
    'FieldOfView',
    'ViewToWorldScale',
    'cameraPosX',
    'cameraPosY',
    'cameraPosZ',
    'cameraTargetX',
    'cameraTargetY',
    'cameraTargetZ',
  ];

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
      return primaryViewpoint;
    }

    // Priority 3: Any available viewpoint (fallback)
    primaryViewpoint = topic.viewpoints[0];

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
   * Check whether a point has any component that is not null
   * @param {Object} point - Object holding the components (e.g. {X, Y, Z})
   * @param {string[]} keys - Component keys to test
   * @returns {boolean} - True if the point exists and any component is not null
   */
  static hasAnyComponent(point, keys) {
    return !!point && keys.some((key) => point[key] !== null);
  }

  /**
   * Check whether a single viewpoint carries any BCF or legacy coordinate data.
   * Unlike hasCoordinateData (which inspects a topic's primary viewpoint), this
   * tests one viewpoint and decides whether it gets its own export row.
   * @param {Object} viewpoint - Parsed viewpoint
   * @returns {boolean} - True if the viewpoint has any camera/coordinate data
   */
  static viewpointHasCoordinateData(viewpoint) {
    const upper = ['X', 'Y', 'Z'];
    const lower = ['x', 'y', 'z'];
    return !!(
      viewpoint.cameraType ||
      this.hasAnyComponent(viewpoint.CameraViewPoint, upper) ||
      this.hasAnyComponent(viewpoint.CameraDirection, upper) ||
      this.hasAnyComponent(viewpoint.CameraUpVector, upper) ||
      viewpoint.FieldOfView !== null ||
      viewpoint.ViewToWorldScale !== null ||
      this.hasAnyComponent(viewpoint.cameraPosition, lower) ||
      this.hasAnyComponent(viewpoint.cameraTarget, lower)
    );
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
}

// Export for use in other modules
window.CoordinateUtils = CoordinateUtils;

// Also support ES6 module exports if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CoordinateUtils };
}
