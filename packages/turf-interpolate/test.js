const fs = require('fs');
const test = require('tape');
const path = require('path');
const load = require('load-json-file');
const write = require('write-json-file');
const {round, featureCollection, point} = require('@turf/helpers');
const truncate = require('@turf/truncate');
const chromatism = require('chromatism');
const {featureEach, propEach} = require('@turf/meta');
const interpolate = require('./');

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

test('turf-interpolate', t => {
    for (const {filename, name, geojson}  of fixtures) {
        let {property, cellSize, units, weight} = geojson.properties;
        property = property || 'elevation';

        // Truncate coordinates & elevation (property) to 6 precision
        let grid = truncate(interpolate(geojson, cellSize, property, units, weight));
        propEach(grid, props => { props[property] = round(props[property]); });
        const result = colorize(grid, property);

        if (process.env.REGEN) write.sync(directories.out + filename, result);
        t.deepEquals(result, load.sync(directories.out + filename), name);
    }
    t.end();
});



test('turf-interpolate -- throws errors', t => {
    const cellSize = 1;
    const property = 'pressure';
    const weight = 0.5;
    const units = 'miles';
    const points = featureCollection([
        point([1, 2], {pressure: 2}),
        point([2, 1], {pressure: 3}),
        point([1.5, 1.5], {pressure: 4})
    ]);
    interpolate(points, cellSize, property, units, weight);
    t.throws(() => interpolate(points, undefined, property, units, weight), /cellSize is required/);
    t.throws(() => interpolate(undefined, cellSize, property, units, weight), /points is required/);
    t.throws(() => interpolate(points, cellSize, property, 'foo', weight), 'invalid units');
    t.throws(() => interpolate(points, cellSize, property, units, 'foo'), /weight must be a number/);
    t.end();
});


// style result
function colorize(grid, property) {
    property = property || 'elevation';
    let max = -Infinity;
    let min = Infinity;
    featureEach(grid, function (point) {
        const value = point.properties[property];
        if (value > max) max = value;
        if (value < min) min = value;
    });
    const delta = (max - min) * 1.1; // extend range to enhance color shade

    featureEach(grid, function (point) {
        const value = point.properties[property];
        const percent = round((value - min) / delta * 100);
        const color = chromatism.brightness(percent, '#002c56').hex;
        point.properties['marker-color'] = color;
    });

    return grid;
}
