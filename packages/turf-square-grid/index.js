var featureCollection = require('@turf/helpers').featureCollection;
var point = require('@turf/helpers').point;
var polygon = require('@turf/helpers').polygon;
var distance = require('@turf/distance');

/**
 * Takes a bounding box and a cell depth and returns a set of square {@link Polygon|polygons} in a grid.
 *
 * @name squareGrid
 * @param {Array<number>} bbox extent in [minX, minY, maxX, maxY] order
 * @param {number} cellSize width of each cell
 * @param {string} [units=kilometers] used in calculating cellSize, can be degrees, radians, miles, or kilometers
 * @param {boolean} [completelyWithin=false] adjust width & height cellSize to fit exactly within bbox
 * @return {FeatureCollection<Polygon>} grid a grid of polygons
 * @example
 * var bbox = [-95, 30 ,-85, 40];
 * var cellSize = 50;
 * var units = 'miles';
 *
 * var squareGrid = turf.squareGrid(bbox, cellSize, units);
 * //=squareGrid
 */
module.exports = function squareGrid(bbox, cellSize, units, completelyWithin) {
    var results = [];
    var west = bbox[0];
    var south = bbox[1];
    var east = bbox[2];
    var north = bbox[3];
    var xCellSize = 0;
    var yCellSize = 0;
    xCellSize += cellSize;
    yCellSize += cellSize;

    // distance
    var xDistance = distance(point([west, south]), point([east, south]), units);
    var yDistance = distance(point([west, south]), point([west, north]), units);

    // rows & columns
    var columns = Math.ceil(xDistance / cellSize);
    var rows = Math.ceil(yDistance / cellSize);

    // columns | width | x
    var xFraction = xCellSize / xDistance;
    var cellWidth = xFraction * (east - west);
    if (completelyWithin === true) cellWidth = cellWidth * ((xDistance / cellSize) / columns);

    // rows | height | y
    var yFraction = yCellSize / yDistance;
    var cellHeight = yFraction * (north - south);
    if (completelyWithin === true) cellHeight = cellHeight * ((yDistance / cellSize) / rows);

    // iterate over columns & rows
    var currentX = west;
    for (var column = 0; column < columns; column++) {
        var currentY = south;
        for (var row = 0; row < rows; row++) {
            var cellPoly = polygon([[
                [currentX, currentY],
                [currentX, currentY + cellHeight],
                [currentX + cellWidth, currentY + cellHeight],
                [currentX + cellWidth, currentY],
                [currentX, currentY]
            ]]);
            results.push(cellPoly);

            currentY += cellHeight;
        }
        currentX += cellWidth;
    }
    return featureCollection(results);
};
