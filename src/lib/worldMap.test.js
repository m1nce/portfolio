import assert from 'node:assert/strict';
import * as map from './worldMap.js';

const { WORLD_SIZE, ROADS, ROAD_WIDTH, SPAWN, LANDMARKS, OBSTACLES, terrainHeight, roadDistance, DISCOVERIES, WATER, MAP_TERRAIN, MAP_CONTOURS } = map;
assert.ok(WORLD_SIZE >= 760, 'The mountain world must leave room for several distinct routes');
assert.ok(ROADS.length >= 7 && DISCOVERIES.length >= 4, 'Exploration needs route choices and scenic destinations');
const heights = [];
let length = 0, maximumGrade = 0;
for (const road of ROADS) {
  for (let i = 0; i < road.length; i++) {
    const point = road[i], height = terrainHeight(point.x, point.z);
    heights.push(height);
    assert.ok(Math.abs(point.x) < WORLD_SIZE / 2 - 30 && Math.abs(point.z) < WORLD_SIZE / 2 - 30);
    assert.equal(roadDistance(point.x, point.z), 0, 'The displayed road is the driving surface');
    assert.ok(WATER.every(water => Math.hypot((point.x - water.x) / (water.rx + ROAD_WIDTH), (point.z - water.z) / (water.rz + ROAD_WIDTH)) > 1), 'Roads must stay clear of the reservoir');
    assert.ok(OBSTACLES.every(obstacle => Math.hypot(point.x - obstacle.x, point.z - obstacle.z) > obstacle.radius + ROAD_WIDTH / 2), 'Roads must not run through trees or buildings');
    if (!i) continue;
    const before = road[i - 1], step = Math.hypot(point.x - before.x, point.z - before.z);
    assert.ok(step > 0 && step < 4.5, 'Dense road samples must follow hairpins');
    length += step;
    maximumGrade = Math.max(maximumGrade, Math.abs(height - terrainHeight(before.x, before.z)) / step);
  }
}
assert.ok(Math.max(...heights) - Math.min(...heights) >= 70, 'Driving must climb real elevation, not a flat road with hills beside it');
assert.ok(maximumGrade < 0.25, `Road grades must remain drivable, measured ${maximumGrade}`);
assert.ok(length > 3000, 'The road network should support a substantial drive');
// Every road must join the garage-connected network; a scenic spur may end freely.
const connected = new Set([0]);
for (let pass = 0; pass < ROADS.length; pass++) {
  ROADS.forEach((road, index) => {
    if (connected.has(index)) return;
    if ([...connected].some(other => ROADS[other].some(a => road.some(b => Math.hypot(a.x - b.x, a.z - b.z) < 0.01)))) connected.add(index);
  });
}
assert.equal(connected.size, ROADS.length, 'Every route must be continuously reachable from the garage');
for (const place of [SPAWN, ...LANDMARKS, ...DISCOVERIES]) {
  assert.ok(roadDistance(place.x, place.z) <= 14, `${place.id || 'spawn'} needs a roadside arrival point`);
  assert.ok(OBSTACLES.every(obstacle => Math.hypot(place.x - obstacle.x, place.z - obstacle.z) > obstacle.radius + 1.3), 'Destinations must be clear of colliders');
}
for (const water of WATER) assert.ok(terrainHeight(water.x, water.z) < water.level, 'Reservoir water needs a recessed basin');
assert.ok(MAP_TERRAIN.length >= 4 && MAP_TERRAIN.length < 12 && MAP_TERRAIN.every(band => band.path && band.fill), 'Map shading should use a handful of compound paths');
assert.ok(MAP_CONTOURS.length >= 5 && MAP_CONTOURS.every(contour => Number.isFinite(contour.height) && /^M/.test(contour.path)), 'Map contours must describe the actual terrain');
console.log(`Mountain map checks passed: ${Math.round(length)} m of connected roads, ${Math.round(Math.max(...heights) - Math.min(...heights))} m of climbing range, ${Math.round(maximumGrade * 100)}% maximum grade, reachable destinations and reservoir clearance.`);
