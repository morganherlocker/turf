const {orientationIndex} = require('./util');

class Node {
    static buildId(coordinates) {
        return coordinates.join(',');
    }

    constructor(coordinates) {
        this.id = Node.buildId(coordinates);
        this.coordinates = coordinates; //< Number[]
        this.innerEdges = []; //< Edge[]

        // We wil store to (out) edges in an CCW order as geos::planargraph::DirectedEdgeStar does
        this.outerEdges = []; //< Edge[]
    }

    removeInnerEdge(edge) {
        this.innerEdges = this.innerEdges.filter(e => e.from.id !== edge.from.id);
    }

    removeOuterEdge(edge) {
        this.outerEdges = this.outerEdges.filter(e => e.to.id !== edge.to.id);
    }

    /** Outer edges are stored CCW order.
     * XXX: on each add we are ordering, this could be optimized
     * @param {Edge} edge - Edge to add as an outerEdge.
     */
    addOuterEdge(edge) {
        this.outerEdges.push(edge);
        //this.outerEdges.sort((a, b) => a.compareTo(b));
        // Using this comparator in order to be deterministic
        this.outerEdges.sort((a, b) => {
            const aNode = a.to,
                bNode = b.to;

            if (aNode.coordinates[0] - this.coordinates[0] >= 0 && bNode.coordinates[0] - this.coordinates[0] < 0)
                return 1;
            if (aNode.coordinates[0] - this.coordinates[0] < 0 && bNode.coordinates[0] - this.coordinates[0] >= 0)
                return -1;

            if (aNode.coordinates[0] - this.coordinates[0] === 0 && bNode.coordinates[0] - this.coordinates[0] === 0) {
                if (aNode.coordinates[1] - this.coordinates[1] >= 0 || bNode.coordinates[1] - this.coordinates[1] >= 0)
                    return aNode.coordinates[1] - bNode.coordinates[1];
                return bNode.coordinates[1] - aNode.coordinates[1];
            }

            const det = orientationIndex(this.coordinates, aNode.coordinates, bNode.coordinates);
            if (det < 0)
                return 1;
            if (det > 0)
                return -1;

            const d1 = Math.pow(aNode.coordinates[0] - this.coordinates[0], 2) + Math.pow(aNode.coordinates[1] - this.coordinates[1], 2),
                d2 = Math.pow(bNode.coordinates[0] - this.coordinates[0], 2) + Math.pow(bNode.coordinates[1] - this.coordinates[1], 2);

            return d1 - d2;
        });
    }

    addInnerEdge(edge) {
        this.innerEdges.push(edge);
    }
}

module.exports = Node;
