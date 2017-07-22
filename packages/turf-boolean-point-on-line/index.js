var getCoords = require('@turf/invariant').getCoords;

/**
 * Returns true if a point is on a line. Accepts a optional parameter to ignore the start and end vertices of the linestring.
 *
 * @name booleanPointOnLine
 * @param {Geometry|Feature<Point>} point GeoJSON Feature or Geometry
 * @param {Geometry|Feature<LineString>} linestring GeoJSON Feature or Geometry
 * @param {Boolean} [ignoreEndVertices=false] whether to ignore the start and end vertices.
 * @returns {Boolean} true/false
 * @example
 * var pt = turf.point([0, 0]);
 * var line = turf.lineString([[-1, -1],[1, 1],[1.5, 2.2]]);
 * var isPointOnLine = turf.booleanPointOnLine(pt, line);
 * //=true
 */
module.exports = function (point, linestring, ignoreEndVertices) {
    var pointCoords = getCoords(point);
    var lineCoords = getCoords(linestring);
    for (var i = 0; i < lineCoords.length - 1; i++) {
        var ignoreFinal = false;
        if (ignoreEndVertices) {
            if (i === 0) ignoreFinal = 'start';
            if (i === lineCoords.length - 2) ignoreFinal = 'end';
        }
        if (isPointOnLineSegment(lineCoords[i], lineCoords[i + 1], pointCoords, ignoreFinal)) return true;
    }
    return false;
};

// See http://stackoverflow.com/a/4833823/1979085
/**
 * @private
 * @param {Array} lineSegmentStart coord pair of start of line
 * @param {Array} lineSegmentEnd coord pair of end of line
 * @param {Array} point coord pair of point to check
 * @param {Boolean} ignoreEnd whether the point is allowed to fall on the line ends
 * @returns {Boolean} true/false
 */
function isPointOnLineSegment(lineSegmentStart, lineSegmentEnd, point, ignoreEnd) {
    var dxc = point[0] - lineSegmentStart[0];
    var dyc = point[1] - lineSegmentStart[1];
    var dxl = lineSegmentEnd[0] - lineSegmentStart[0];
    var dyl = lineSegmentEnd[1] - lineSegmentStart[1];
    var cross = dxc * dyl - dyc * dxl;
    if (cross !== 0) {
        return false;
    }
    if (ignoreEnd === 'start') {
        if (Math.abs(dxl) >= Math.abs(dyl)) {
            return dxl > 0 ? lineSegmentStart[0] < point[0] && point[0] <= lineSegmentEnd[0] : lineSegmentEnd[0] <= point[0] && point[0] < lineSegmentStart[0];
        }
        return dyl > 0 ? lineSegmentStart[1] < point[1] && point[1] <= lineSegmentEnd[1] : lineSegmentEnd[1] <= point[1] && point[1] < lineSegmentStart[1];
    } else if (ignoreEnd === 'end') {
        if (Math.abs(dxl) >= Math.abs(dyl)) {
            return dxl > 0 ? lineSegmentStart[0] <= point[0] && point[0] < lineSegmentEnd[0] : lineSegmentEnd[0] < point[0] && point[0] <= lineSegmentStart[0];
        }
        return dyl > 0 ? lineSegmentStart[1] <= point[1] && point[1] < lineSegmentEnd[1] : lineSegmentEnd[1] < point[1] && point[1] <= lineSegmentStart[1];
    } else {
        if (Math.abs(dxl) >= Math.abs(dyl)) {
            return dxl > 0 ? lineSegmentStart[0] <= point[0] && point[0] <= lineSegmentEnd[0] : lineSegmentEnd[0] <= point[0] && point[0] <= lineSegmentStart[0];
        }
        return dyl > 0 ? lineSegmentStart[1] <= point[1] && point[1] <= lineSegmentEnd[1] : lineSegmentEnd[1] <= point[1] && point[1] <= lineSegmentStart[1];
    }
}
