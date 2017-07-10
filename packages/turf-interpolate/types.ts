import * as interpolate from './';
import {point, featureCollection, Points} from '@turf/helpers';

const cellSize = 1;
const property = 'pressure';
const weight = 0.5;
const units = 'miles';
const points: Points = featureCollection([
  point([1, 2]),
  point([12, 13]),
  point([23, 22]),
]);

const grid = interpolate(points, cellSize, property, units, weight);
grid.features[0].properties.pressure;

// Optional properties
interpolate(points, cellSize, property, units);
interpolate(points, cellSize, property);
interpolate(points, cellSize);
