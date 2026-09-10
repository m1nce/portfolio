import assert from 'node:assert/strict';
import { WORLD_SIZE, SPAWN, ROADS, ROAD_WIDTH, LANDMARKS, OBSTACLES, terrainHeight, roadDistance, stepWorldCar, joystickInput, nearestLandmark } from './world.js';

const idle = { throttle: 0, steering: 0, brake: false };
const gas = { ...idle, throttle: 1 };
function drive(start, input, seconds, fps = 60) {
  let state = { ...start };
  for (let frame = 0; frame < Math.round(seconds * fps); frame++) state = stepWorldCar(state, input, 1 / fps);
  return state;
}

assert.deepEqual(joystickInput(0, 0), idle);
assert.deepEqual(joystickInput(0.1, -0.1), idle, 'Thumb drift must remain neutral');
for (const invalid of [NaN, Infinity, undefined, null, '1']) {
  assert.deepEqual(joystickInput(invalid, 1), idle);
  assert.deepEqual(joystickInput(1, invalid), idle);
}
for (const [x, y, heading] of [[0, -1, 0], [1, 0, Math.PI / 2], [0, 1, Math.PI], [-1, 0, -Math.PI / 2]]) {
  const input = joystickInput(x, y);
  assert.equal(input.targetHeading, heading, 'The joystick must map screen coordinates to world direction');
  assert.equal(input.throttle, 1);
}
assert.equal(joystickInput(3, 4).throttle, 1, 'Dragging outside the pad must cap throttle');
assert.ok(joystickInput(0, -0.5).throttle > 0 && joystickInput(0, -0.5).throttle < 1);
for (const cameraHeading of [-Math.PI, -Math.PI / 2, -.4, 0, .4, Math.PI / 2, Math.PI]) {
  for (const [x, y] of [[1, 0], [-1, 0], [0, -1], [0, 1]]) {
    const { targetHeading } = joystickInput(x, y, cameraHeading);
    const worldX = Math.sin(targetHeading), worldZ = -Math.cos(targetHeading);
    const screenX = worldX * Math.cos(cameraHeading) + worldZ * Math.sin(cameraHeading);
    const screenY = -worldX * Math.sin(cameraHeading) + worldZ * Math.cos(cameraHeading);
    assert.ok(screenX * x + screenY * y > .999, 'Joystick travel must match the visible screen direction in every camera view');
  }
}
assert.deepEqual(joystickInput(1, 0, NaN), idle, 'An invalid camera heading must fail neutral');

// Pick a clear patch away from roads: free roaming must not snap back to a lane.
const clear = { x: 55, z: 50, heading: 0, speed: 0 };
assert.ok(roadDistance(clear.x, clear.z) > ROAD_WIDTH);
for (const [heading, dx, dz] of [[0, 0, -1], [Math.PI / 2, 1, 0], [Math.PI, 0, 1], [-Math.PI / 2, -1, 0]]) {
  const moved = drive({ ...clear, heading }, gas, 0.5);
  assert.ok((moved.x - clear.x) * dx + (moved.z - clear.z) * dz > 1, 'The car must travel freely in every direction');
  const joyMoved = drive({ ...clear, heading: 0 }, joystickInput(dx, dz), 1);
  assert.ok((joyMoved.x - clear.x) * dx + (joyMoved.z - clear.z) * dz > 1, 'The car must turn toward every screen-direction joystick input');
}
const reverse = drive(clear, { ...gas, throttle: -1 }, 1);
assert.ok(reverse.speed < 0 && reverse.z > clear.z, 'Holding down must reverse the car');
const backedUp = drive({ ...clear, speed: 6 }, { ...gas, throttle: -1 }, 2);
assert.ok(backedUp.speed < 0 && backedUp.z > clear.z, 'Down must brake forward movement before reversing');
const light = drive(clear, joystickInput(0, -0.4), 1);
const full = drive(clear, gas, 1);
assert.ok(light.speed > 0 && light.speed < full.speed, 'Joystick pressure must affect speed');
assert.ok(drive(full, idle, 0.5).speed < full.speed, 'Releasing controls must coast');
assert.equal(drive(full, { ...gas, brake: true }, 1).speed, 0, 'Brake must win over throttle');
for (const direction of [-1, 1]) {
  assert.ok(stepWorldCar({ ...clear, speed: 8 }, { ...gas, steering: direction }, 0.05).heading * direction > 0);
  assert.ok(stepWorldCar({ ...clear, speed: -8 }, { ...gas, throttle: -1, steering: direction }, 0.05).heading * direction < 0, 'Reversing must reverse steering yaw');
}
assert.deepEqual(clear, { x: 55, z: 50, heading: 0, speed: 0 }, 'Driving must leave the caller’s state untouched');
for (const dt of [0, -1, NaN, Infinity]) assert.deepEqual(stepWorldCar(clear, gas, dt), clear);
assert.deepEqual(stepWorldCar(clear, gas, 10), stepWorldCar(clear, gas, 0.05), 'A stalled frame must not teleport the car');
assert.deepEqual(stepWorldCar({ ...clear, x: NaN }, gas, 0.05), SPAWN);
const [sixty, oneTwenty] = [60, 120].map((fps) => drive(clear, { ...gas, steering: 0.25 }, 2, fps));
assert.ok(Math.hypot(sixty.x - oneTwenty.x, sixty.z - oneTwenty.z) < 0.2, 'Handling must remain stable across refresh rates');

for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
  const edge = { x: Math.sin(heading) * 178, z: -Math.cos(heading) * 178, heading, speed: 26 };
  const stopped = stepWorldCar(edge, gas, 0.05);
  assert.ok(Math.abs(stopped.x) < WORLD_SIZE / 2 && Math.abs(stopped.z) < WORLD_SIZE / 2);
  assert.equal(stopped.speed, 0, 'Map boundaries must stop the car');
}
for (const obstacle of [...OBSTACLES.filter((item) => item.kind !== 'tree'), OBSTACLES.find((item) => item.kind === 'tree')]) {
  const before = { x: obstacle.x, z: obstacle.z + obstacle.radius + 1.3, heading: 0, speed: 26 };
  const stopped = stepWorldCar(before, gas, 0.05);
  assert.equal(stopped.x, before.x);
  assert.equal(stopped.z, before.z);
  assert.equal(stopped.speed, 0, 'Swept collisions must stop before a building or rock');
  assert.ok(drive(stopped, { ...gas, throttle: -1 }, 0.25).z > stopped.z, 'A collision must allow reversing away');
}
let roaming = { ...SPAWN };
for (let frame = 0; frame < 3600; frame++) {
  roaming = stepWorldCar(roaming, { throttle: frame % 300 < 220 ? 1 : -1, steering: Math.sin(frame / 170) }, 1 / 60);
  assert.ok(Object.values(roaming).every(Number.isFinite), 'Repeated turns and collisions must leave the world finite');
  assert.ok(Math.abs(roaming.x) < WORLD_SIZE / 2 && Math.abs(roaming.z) < WORLD_SIZE / 2);
  assert.ok(roaming.speed >= -9 && roaming.speed <= 26);
}

assert.deepEqual(ROADS[0][0], ROADS[0].at(-1), 'The valley road must form a continuous loop');
for (const branch of ROADS.slice(1)) {
  for (const endpoint of [branch[0], branch.at(-1)]) {
    assert.ok(ROADS.some((other) => other !== branch && other.some((point) => Math.hypot(point.x - endpoint.x, point.z - endpoint.z) < 0.001)), 'Every branch must connect to another road');
  }
}
for (const points of ROADS) {
  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    assert.ok(Math.abs(point.x) < 170 && Math.abs(point.z) < 170);
    assert.ok(Number.isFinite(terrainHeight(point.x, point.z)));
    assert.equal(roadDistance(point.x, point.z), 0, 'Map and renderer points must describe the driving surface');
    if (index) assert.ok(Math.hypot(point.x - points[index - 1].x, point.z - points[index - 1].z) < 4.5, 'Road samples must stay dense around bends');
    assert.ok(OBSTACLES.every((obstacle) => Math.hypot(point.x - obstacle.x, point.z - obstacle.z) > obstacle.radius + ROAD_WIDTH / 2), 'Roads must remain clear of scenery colliders');
  }
}
assert.equal(nearestLandmark(SPAWN)?.id, 'takumi', 'The garage encounter must be available on arrival');
for (const landmark of LANDMARKS) {
  const state = { x: landmark.x, z: landmark.z, heading: 0, speed: 0 };
  assert.equal(nearestLandmark(state), landmark);
  assert.equal(nearestLandmark({ ...state, speed: 3 }), null);
  assert.equal(nearestLandmark({ ...state, speed: -3 }), null);
  assert.ok(OBSTACLES.every((obstacle) => Math.hypot(landmark.x - obstacle.x, landmark.z - obstacle.z) > obstacle.radius + 1.25), 'NPCs must stand in reachable clearings');
}
assert.equal(nearestLandmark({ ...SPAWN, x: 170, z: 170 }), null);
console.log('Open-world checks passed: screen-direction steering, free roaming, reverse, analog input, frame stability, collision recovery, connected roads, and reachable encounters.');
