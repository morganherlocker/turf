const { Graph } = require('./util');

/** Implementation of GEOSPolygonizel function (geos::operation::polygonize::Polygonizer)
 *
 * Polygonizes a set of lines that represents edges in a planar graph. Edges must be correctly
 * noded, i.e., they must only meet at their endpoints.
 *
 * LineStrings must only have to coordinate points.
 *
 * @param geoJson [FeatureCollection<LineString>]: Lines in order to polygonize
 * @return [FeatureCollection<Polygon>]
 */
module.export = function polygonize(geoJson) {
  const graph = Graph.fromGeoJson(geoJson);

  // 1. Remove dangle node
  graph.deleteDangles();

  // 2. Remove cut-edges (bridge edges)
  graph.deleteCutEdges();

  // 3. Get all holes and shells
  const holes = [],
    shells = [];

  graph.getEdgeRings().forEach(edgeRing => {
    if (edgeRing.isHole())
      holes.push(edgeRing);
    else
      shells.push(edgeRing);
  });

  // 4. Assign Holes to Shells

  // 5. EdgeRings to Polygons
};
