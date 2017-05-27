var meta = require('@turf/meta');
var center = require('@turf/center');
var helpers = require('@turf/helpers');
var centroid = require('@turf/centroid');
var turfBBox = require('@turf/bbox');
var invariant = require('@turf/invariant');
var rhumbBearing = require('@turf/rhumb-bearing');
var rhumbDistance = require('@turf/rhumb-distance');
var rhumbDestination = require('@turf/rhumb-destination');
var point = helpers.point;
var coordEach = meta.coordEach;
var getCoords = invariant.getCoords;


/**
 * Moves any geojson Feature or Geometry of a specified distance along a Rhumb Line
 * on the provided direction angle.
 *
 * @name scale
 * @param {GeoJSON} geojson object to be scaled
 * @param {number} factor of scaling, positive or negative values greater than 0
 * @param {string} [fromCorner="centroid"] BBox corner from which the scaling will occur (options: sw/se/nw/ne/center/centroid)
 * @param {boolean} [mutate=false] allows GeoJSON input to be mutated (significant performance increase if true)
 * @returns {GeoJSON} the scaled GeoJSON object
 * @example
 * var poly = turf.polygon([[[0,29],[3.5,29],[2.5,32],[0,29]]]);
 * var scaledPoly = turf.scale(poly, 3);
 *
 * //addToMap
 * scaledPoly.properties = {stroke: '#F00', 'stroke-width': 4};
 * var addToMap = [poly, scaledPoly];
 */
module.exports = function (geojson, factor, fromCorner, mutate) {
    // Input validation
    if (!geojson) throw new Error('geojson is required');
    if (typeof factor !== 'number' && factor === 0) throw new Error('invalid factor');
    if (!factor) throw new Error('factor is required');

    // Default params
    var isMutate = (mutate === false || mutate === undefined);
    var isPoint = (geojson.type === 'Point' || geojson.geometry && geojson.geometry.type === 'Point');
    var origin = defineOrigin(geojson, fromCorner);

    // Shortcut no-scaling
    if (factor === 1 || isPoint) return geojson;

    // Clone geojson to avoid side effects
    if (isMutate) geojson = JSON.parse(JSON.stringify(geojson));

    // Scale each coordinate
    coordEach(geojson, function (coord) {
        var originalDistance = rhumbDistance(origin, coord);
        var bearing = rhumbBearing(origin, coord);
        var newDistance = originalDistance * factor;
        var newCoord = getCoords(rhumbDestination(coord, newDistance, bearing));
        coord[0] = newCoord[0];
        coord[1] = newCoord[1];
        if (coord.length === 3) coord[2] *= factor;
    });

    return geojson;
};

/**
 * Define Origin
 *
 * @private
 * @param {GeoJSON} geojson GeoJSON
 * @param {string} [fromCorner] sw/se/nw/ne/center
 * @returns {Feature<Point>} Point origin
 */
function defineOrigin(geojson, fromCorner) {
    var bbox = (geojson.bbox) ? geojson.bbox : turfBBox(geojson);
    var west = bbox[0];
    var south = bbox[1];
    var east = bbox[2];
    var north = bbox[3];
    switch (fromCorner) {
    case 'sw':
    case 'southwest':
    case 'westsouth':
    case 'bottomleft':
        return point([west, south]);
    case 'se':
    case 'southeast':
    case 'eastsouth':
    case 'bottomright':
        return point([east, south]);
    case 'nw':
    case 'northwest':
    case 'westnorth':
    case 'topleft':
        return point([west, north]);
    case 'ne':
    case 'northeast':
    case 'eastnorth':
    case 'topright':
        return point([east, north]);
    case 'center':
        return center(geojson);
    default:
        return centroid(geojson);
    }
}
