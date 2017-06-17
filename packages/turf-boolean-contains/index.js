var inside = require('@turf/inside');
var invariant = require('@turf/invariant');
var getGeom = invariant.getGeom;
var getCoords = invariant.getCoords;
var getGeomType = invariant.getGeomType;

/**
 * Boolean-contains returns True if the second geometry is completely contained by the first geometry.
 * The interiors of both geometries must intersect and, the interior and boundary of the secondary (geometry b)
 * must not intersect the exterior of the primary (geometry a).
 * Boolean-contains returns the exact opposite result of the `@turf/boolean-within`.
 *
 * @name booleanContains
 * @param {Geometry|Feature<any>} feature1 GeoJSON Feature or Geometry
 * @param {Geometry|Feature<any>} feature2 GeoJSON Feature or Geometry
 * @returns {Boolean} true/false
 * @example
 * const point = {
 *   "type": "Feature",
 *   "properties": {},
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [1, 2]
 *   }
 * }
 * const line = {
 *   "type": "Feature",
 *   "properties": {},
 *   "geometry": {
 *     "type": "LineString",
 *     "coordinates": [[1, 1], [1, 2], [1, 3], [1, 4]]
 *   }
 * }
 * turf.booleanContains(line, point);
 * //=true
 */
module.exports = function (feature1, feature2) {
    var type1 = getGeomType(feature1);
    var type2 = getGeomType(feature2);
    var geom1 = getGeom(feature1);
    var geom2 = getGeom(feature2);
    var coords1 = getCoords(feature1);
    var coords2 = getCoords(feature2);

    switch (type1) {
    case 'Point':
        switch (type2) {
        case 'Point':
            return compareCoords(coords1, coords2);
        }
        throw new Error('feature2 ' + type2 + ' geometry not supported');
    case 'MultiPoint':
        switch (type2) {
        case 'Point':
            return isPointInMultiPoint(geom1, geom2);
        case 'MultiPoint':
            return isMultiPointInMultiPoint(geom1, geom2);
        }
        throw new Error('feature2 ' + type2 + ' geometry not supported');
    case 'LineString':
        switch (type2) {
        case 'Point':
            return isPointOnLine(geom1, geom2);
        case 'LineString':
            return isLineOnLine(geom1, geom2);
        case 'MultiPoint':
            return isMultiPointOnLine(geom1, geom2);
        }
        throw new Error('feature2 ' + type2 + ' geometry not supported');
    case 'Polygon':
        switch (type2) {
        case 'Point':
            return inside(geom2, geom1, true);
        case 'LineString':
            return isLineInPoly(geom1, geom2);
        case 'Polygon':
            return isPolyInPoly(feature2, feature1);
        case 'MultiPoint':
            return isMultiPointInPoly(geom1, geom2);
        }
        throw new Error('feature2 ' + type2 + ' geometry not supported');
    default:
        throw new Error('feature1 ' + type1 + ' geometry not supported');
    }
};

function isPointInMultiPoint(multiPoint, point) {
    var i;
    var output = false;
    for (i = 0; i < multiPoint.coordinates.length; i++) {
        if (compareCoords(multiPoint.coordinates[i], point.coordinates)) {
            output = true;
            break;
        }
    }
    return output;
}

function isMultiPointInMultiPoint(multiPoint1, multiPoint2) {
    var foundAMatch = 0;
    for (var i = 0; i < multiPoint2.coordinates.length; i++) {
        var anyMatch = false;
        for (var i2 = 0; i2 < multiPoint1.coordinates.length; i2++) {
            if (compareCoords(multiPoint2.coordinates[i], multiPoint1.coordinates[i2])) {
                foundAMatch++;
                anyMatch = true;
                break;
            }
        }
        if (!anyMatch) {
            return false;
        }
    }
    return foundAMatch > 0;
}

// http://stackoverflow.com/a/11908158/1979085
function isPointOnLine(lineString, point) {
    var output = false;
    for (var i = 0; i < lineString.coordinates.length - 1; i++) {
        var incEndVertices = true;
        if (i === 0 || i === lineString.coordinates.length - 2) {
            incEndVertices = false;
        }
        if (isPointOnLineSegment(lineString.coordinates[i], lineString.coordinates[i + 1], point.coordinates, incEndVertices)) {
            output = true;
            break;
        }
    }
    return output;
}

function isMultiPointOnLine(lineString, multiPoint) {
    var output = true;
    for (var i = 0; i < multiPoint.coordinates.length; i++) {
        var pointIsOnLine = false;
        for (var i2 = 0; i2 < lineString.coordinates.length - 1; i2++) {
            var incEndVertices = true;
            if (i2 === 0 || i2 === lineString.coordinates.length - 2) {
                incEndVertices = false;
            }
            if (isPointOnLineSegment(lineString.coordinates[i2], lineString.coordinates[i2 + 1], multiPoint.coordinates[i], incEndVertices)) {
                pointIsOnLine = true;
                break;
            }
        }
        if (!pointIsOnLine) {
            output = false;
            break;
        }
    }
    return output;
}

function isMultiPointInPoly(polygon, multiPoint) {
    var output = true;
    for (var i = 0; i < multiPoint.coordinates.length; i++) {
        var isInside = inside(multiPoint.coordinates[1], polygon);
        if (!isInside) {
            output = false;
            break;
        }
    }
    return output;
}

function isLineOnLine(lineString1, lineString2) {
    var output = true;
    for (var i = 0; i < lineString2.coordinates.length; i++) {
        var checkLineCoords = isPointOnLine(lineString1, {type: 'Point', coordinates: lineString2.coordinates[i]});
        if (!checkLineCoords) {
            output = false;
            break;
        }
    }
    if (output) {
        if (compareCoords(lineString1.coordinates[0], lineString2.coordinates[0]) ||
            compareCoords(lineString1.coordinates[lineString1.coordinates.length - 1], lineString2.coordinates[lineString2.coordinates.length - 1])) {
            output = false;
        }
    }
    return output;
}

function isLineInPoly(polygon, linestring) {
    var output = true;
    var foundInternalPoint = false;
    for (var i = 0; i < linestring.coordinates.length; i++) {
        var isInside = null;
        if (!foundInternalPoint) {
            isInside = inside(linestring.coordinates[i], polygon);
        } else {
            isInside = inside(linestring.coordinates[i], polygon, true);
        }
        if (isInside) {
            foundInternalPoint = true;
        }
        if (!isInside) {
            output = false;
            break;
        }
    }
    return output;
}

/**
 * Is Polygon (geom1) in Polygon (geom2)
 * Only takes into account outer rings
 * See http://stackoverflow.com/a/4833823/1979085
 *
 * @private
 * @param {Geometry|Feature<Polygon>} feature1 Polygon1
 * @param {Geometry|Feature<Polygon>} feature2 Polygon2
 * @returns {Boolean} true/false
 */
function isPolyInPoly(feature1, feature2) {
    var coords = getCoords(feature1)[0];
    var ring = getCoords(feature2)[0];
    var bbox = feature2.bbox;

    // check if outer coordinates is inside outer ring
    for (var i = 0; i < coords.length; i++) {
        // 3x performance increase if BBox is present
        if (bbox && !inBBox(coords[i], bbox)) return false;
        if (!inRing(coords[i], ring)) return false;
    }
    return true;
}


/**
 * Is a point on a line segment
 * Only takes into account outer rings
 * See http://stackoverflow.com/a/4833823/1979085
 *
 * @private
 * @param {Array} lineSegmentStart coord pair of start of line
 * @param {Array} lineSegmentEnd coord pair of end of line
 * @param {Array} point coord pair of point to check
 * @param {Boolean} incEnd whether the point is allowed to fall on the line ends
 * @returns {Boolean} true/false
 */
function isPointOnLineSegment(lineSegmentStart, lineSegmentEnd, point, incEnd) {
    var dxc = point[0] - lineSegmentStart[0];
    var dyc = point[1] - lineSegmentStart[1];
    var dxl = lineSegmentEnd[0] - lineSegmentStart[0];
    var dyl = lineSegmentEnd[1] - lineSegmentStart[1];
    var cross = dxc * dyl - dyc * dxl;
    if (cross !== 0) {
        return false;
    }
    if (incEnd) {
        if (Math.abs(dxl) >= Math.abs(dyl)) {
            return dxl > 0 ? lineSegmentStart[0] <= point[0] && point[0] <= lineSegmentEnd[0] : lineSegmentEnd[0] <= point[0] && point[0] <= lineSegmentStart[0];
        }
        return dyl > 0 ? lineSegmentStart[1] <= point[1] && point[1] <= lineSegmentEnd[1] : lineSegmentEnd[1] <= point[1] && point[1] <= lineSegmentStart[1];
    } else {
        if (Math.abs(dxl) >= Math.abs(dyl)) {
            return dxl > 0 ? lineSegmentStart[0] < point[0] && point[0] < lineSegmentEnd[0] : lineSegmentEnd[0] < point[0] && point[0] < lineSegmentStart[0];
        }
        return dyl > 0 ? lineSegmentStart[1] < point[1] && point[1] < lineSegmentEnd[1] : lineSegmentEnd[1] < point[1] && point[1] < lineSegmentStart[1];
    }
}

/**
 * inRing - @turf/inside
 *
 * @private
 * @param {[number, number]} pt [x,y]
 * @param {Array<[number, number]>} ring [[x,y], [x,y],..]
 * @param {boolean} ignoreBoundary ignoreBoundary
 * @returns {boolean} inRing
 */
function inRing(pt, ring, ignoreBoundary) {
    var isInside = false;
    if (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) ring = ring.slice(0, ring.length - 1);

    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var xi = ring[i][0], yi = ring[i][1];
        var xj = ring[j][0], yj = ring[j][1];
        var onBoundary = (pt[1] * (xi - xj) + yi * (xj - pt[0]) + yj * (pt[0] - xi) === 0) &&
            ((xi - pt[0]) * (xj - pt[0]) <= 0) && ((yi - pt[1]) * (yj - pt[1]) <= 0);
        if (onBoundary) return !ignoreBoundary;
        var intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
        (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
}

/**
 * inBBox - @turf/inside
 *
 * @private
 * @param {[number, number]} pt point [x,y]
 * @param {[number, number, number, number]} bbox BBox [west, south, east, north]
 * @returns {boolean} true/false if point is inside BBox
 */
function inBBox(pt, bbox) {
    return bbox[0] <= pt[0] &&
           bbox[1] <= pt[1] &&
           bbox[2] >= pt[0] &&
           bbox[3] >= pt[1];
}

/**
 * compareCoords
 *
 * @private
 * @param {[number, number]} pair1 point [x,y]
 * @param {[number, number]} pair2 point [x,y]
 * @returns {boolean} true/false if coord pairs match
 */
function compareCoords(pair1, pair2) {
    return pair1[0] === pair2[0] && pair1[1] === pair2[1];
}
