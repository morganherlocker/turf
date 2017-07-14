const fs = require('fs');
const test = require('tape');
const path = require('path');
const load = require('load-json-file');
const write = require('write-json-file');
const chromatism = require('chromatism');
const {featureEach, featureReduce} = require('@turf/meta');
const {featureCollection, point, polygon} = require('@turf/helpers');
const clustersDistance = require('./');

const directories = {
    in: path.join(__dirname, 'test', 'in') + path.sep,
    out: path.join(__dirname, 'test', 'out') + path.sep
};

const fixtures = fs.readdirSync(directories.in).map(filename => {
    return {
        filename,
        name: path.parse(filename).name,
        geojson: load.sync(directories.in + filename)
    };
});

test('clusters-distance', t => {
    fixtures.forEach(({name, filename, geojson}) => {
        let {distance, minPoints, units} = geojson.properties || {};
        distance = distance || 100;

        // console.log(geojson.features.length);
        const clustered = clustersDistance(geojson, distance, units, minPoints);
        // console.log(clustered.points.features.length);
        const result = featureCollection(colorize(clustered));

        if (process.env.REGEN) write.sync(directories.out + filename, result);
        t.deepEqual(result, load.sync(directories.out + filename), name);
    });

    t.end();
});

const points = featureCollection([
    point([0, 0], {foo: 'bar'}),
    point([2, 4], {foo: 'bar'}),
    point([3, 6], {foo: 'bar'})
]);

test('clusters -- throws', t => {
    const poly = polygon([[[0, 0], [10, 10], [0, 10], [0, 0]]]);
    t.throws(() => clustersDistance(poly, 1), /Input must contain Points/);
    t.throws(() => clustersDistance(points), /maxDistance is required/);
    t.throws(() => clustersDistance(points, -4), /Invalid maxDistance/);
    t.throws(() => clustersDistance(points, 'foo'), /Invalid maxDistance/);
    t.throws(() => clustersDistance(points, 1, 'nanometers'), /units is invalid/);
    t.throws(() => clustersDistance(points, 1, null, 0), /Invalid minPoints/);
    t.throws(() => clustersDistance(points, 1, 'miles', 'baz'), /Invalid minPoints/);
    t.end();
});

test('clusters -- prevent input mutation', t => {
    clustersDistance(points, 2, 'kilometers', 1);
    t.true(points.features[0].properties.cluster === undefined, 'cluster properties should be undefined');
    t.end();
});

test('clusters -- translate properties', t => {
    t.equal(clustersDistance(points, 2, 'kilometers', 1).points.features[0].properties.foo, 'bar');
    t.end();
});

// style result
function colorize(clustered) {
    let count = featureReduce(clustered.points, (count, point) => Math.max(count, point.properties.cluster || 0), 1) + 1;
    const colours = chromatism.adjacent(360 / count, count, '#0000FF').hex;
    const points = [];

    featureEach(clustered.points, function (point) {
        const color = colours[point.properties.cluster];
        point.properties['marker-color'] = color;
        point.properties['marker-size'] = 'small';
        points.push(point);
    });
    featureEach(clustered.centroids, function (centroid) {
        const color = chromatism.brightness(-25, colours[centroid.properties.cluster]).hex;
        centroid.properties['marker-color'] = color;
        centroid.properties['marker-symbol'] = 'star';
        centroid.properties['marker-size'] = 'large';
        points.push(centroid);
    });
    featureEach(clustered.noise, function (point) {
        point.properties['marker-color'] = '#AEAEAE';
        point.properties['marker-symbol'] = 'circle-stroked';
        point.properties['marker-size'] = 'medium';
        points.push(point);
    });

    return points;
}
