import assert from 'node:assert/strict';
import { WORLD_SIZE, SPAWN, WATER, ROAD_WIDTH, LANDMARKS, OBSTACLES, terrainHeight, roadDistance, stepWorldCar, joystickInput, nearestLandmark } from './world.js';
import * as mechanics from './transmission.js';

const idle = { throttle: 0, steering: 0, brake: false };
const gas = { ...idle, throttle: 1 };
function drive(start, input, seconds, fps = 60) {
  let state = { ...start };
  for (let frame = 0; frame < Math.round(seconds * fps); frame++) state = stepWorldCar(state, input, 1 / fps);
  return state;
}

const climb = { x: -300, z: -235, heading: .1533285185752802, speed: 12 };
const steepClimb = { x: -30.9375, z: 33.75, heading: .703382159783903, speed: 12 };
const descent = { ...climb, heading: climb.heading + Math.PI };
assert.ok(drive(climb, { throttle: 1, gear: 3 }, .5).speed > drive(climb, { throttle: 1, gear: 5 }, .5).speed, 'On a real road incline, third must pull harder than fifth');
assert.ok(drive(steepClimb, { throttle: 1, gear: 5 }, .5).speed < steepClimb.speed, 'Fifth must lose speed when a real steep road exceeds engine force');
const downhillThird = drive(descent, { throttle: 0, gear: 3 }, .5);
const downhillFifth = drive(descent, { throttle: 0, gear: 5 }, .5);
const downhillNeutral = drive(descent, { throttle: 0, gear: 'N' }, .5);
assert.ok(downhillThird.speed < downhillFifth.speed && downhillFifth.speed < downhillNeutral.speed, 'Real downhill engine braking must depend on gear and disappear in neutral');
const rolled = drive({ ...steepClimb, speed: 0 }, { gear: 'N' }, .5);
assert.ok(rolled.speed < 0 && terrainHeight(rolled.x, rolled.z) < terrainHeight(steepClimb.x, steepClimb.z), 'Neutral must roll down the actual hill from rest');
const bogged = drive({ ...steepClimb, speed: 0 }, { gear: 5, throttle: 1 }, .5);
assert.ok(bogged.speed < 0, 'Full throttle in fifth cannot manufacture uphill traction when wheel torque is insufficient');
const parked = drive(SPAWN, { gear: 1 }, 5);
assert.equal(parked.speed, 0, 'Automatic hill hold must keep the unattended arrival parked');
assert.equal(parked.x, SPAWN.x);
assert.equal(parked.z, SPAWN.z);
for (const state of [climb, descent, { ...steepClimb, speed: -8 }]) {
  const braked = drive(state, { gear: 'N', brake: true }, 2);
  assert.equal(braked.speed, 0, 'Brakes must stop in either direction on a hill');
  assert.equal(drive(braked, { gear: 'N', brake: true }, 2).speed, 0, 'Held brakes must hold a slope without sign-flip jitter');
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

// This shallow clearing has room for free-roaming controls without a road or obstacle constraining travel.
const clear = { x: -75, z: -340, heading: 0, speed: 0 };
const original = { ...clear };
assert.ok(roadDistance(clear.x, clear.z) > ROAD_WIDTH);
for (const [heading, dx, dz] of [[0, 0, -1], [Math.PI / 2, 1, 0], [Math.PI, 0, 1], [-Math.PI / 2, -1, 0]]) {
  const moved = drive({ ...clear, heading }, gas, 1);
  assert.ok((moved.x - clear.x) * dx + (moved.z - clear.z) * dz > .4, 'The car must travel freely in every direction');
  const joyMoved = drive({ ...clear, heading: 0 }, joystickInput(dx, dz), 2);
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
assert.ok(drive({ ...clear, speed: 8 }, idle, 1).speed >= 6, 'Releasing the accelerator must preserve rolling momentum');
assert.ok(full.speed <= 5.1, 'Full throttle must build speed gently');
assert.ok(Math.hypot(full.x - clear.x, full.z - clear.z) > 1, 'Gentler acceleration must still pull away promptly');
assert.equal(drive(full, { ...gas, brake: true }, 1).speed, 0, 'Brake must win over throttle');
for (const direction of [-1, 1]) {
  assert.ok(stepWorldCar({ ...clear, speed: 8 }, { ...gas, steering: direction }, 0.05).heading * direction > 0);
  assert.ok(stepWorldCar({ ...clear, speed: -8 }, { ...gas, throttle: -1, steering: direction }, 0.05).heading * direction < 0, 'Reversing must reverse steering yaw');
}
const steeringTap = stepWorldCar({ ...clear, speed: 8 }, { ...gas, steering: 1 }, .05);
assert.ok(steeringTap.heading < .02, 'A short steering tap must ease in instead of snapping the heading');
const steadyTurn = stepWorldCar({ ...clear, speed: 8, steering: 1 }, { ...gas, steering: 1 }, .05);
const fastTurn = stepWorldCar({ ...clear, speed: 26, steering: 1 }, { ...gas, steering: 1 }, .05);
assert.ok(fastTurn.heading < steadyTurn.heading * .75, 'High-speed steering must be steadier than low-speed turns');
assert.ok(drive({ ...clear, speed: 8 }, { ...gas, steering: 1 }, .5).heading > .25, 'Holding a turn must remain responsive');
assert.deepEqual(clear, original, 'Driving must leave the caller’s state untouched');
for (const dt of [0, -1, NaN, Infinity]) assert.deepEqual(stepWorldCar(clear, gas, dt), clear);
assert.deepEqual(stepWorldCar(clear, gas, 10), stepWorldCar(clear, gas, 0.05), 'A stalled frame must not teleport the car');
assert.deepEqual(stepWorldCar({ ...clear, x: NaN }, gas, 0.05), SPAWN);
const [sixty, oneTwenty] = [60, 120].map((fps) => drive(clear, { ...gas, steering: 0.25 }, 2, fps));
assert.ok(Math.hypot(sixty.x - oneTwenty.x, sixty.z - oneTwenty.z) < 0.2, 'Handling must remain stable across refresh rates');

for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
  const edge = { x: Math.sin(heading) * (WORLD_SIZE / 2 - 2), z: -Math.cos(heading) * (WORLD_SIZE / 2 - 2), heading, speed: 26 };
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
  assert.ok(Math.abs(roaming.speed) < 80, 'Drag and engine forces must keep sustained driving bounded without speed snapping');
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

const first = drive(clear, { ...gas, gear: 1 }, 1);
const fifth = drive(clear, { ...gas, gear: 5 }, 1);
assert.ok(first.speed > fifth.speed * 2, 'First gear must launch harder than fifth');
assert.ok(first.speed < 5, 'First gear must pull away progressively');
const manualReverse = drive(clear, { ...gas, gear: 'R' }, 1);
assert.ok(manualReverse.speed < 0 && manualReverse.z > clear.z, 'Accelerating in R backs up');
assert.equal(drive({ ...clear, speed: 5 }, { ...gas, gear: 1, brake: true }, 2).speed, 0, 'Manual brake must never auto-reverse');
assert.equal(drive(clear, { ...gas, gear: 1, throttle: -1 }, 1).speed, 0, 'Negative throttle must not reverse a manual forward gear');
assert.equal(drive(clear, { ...gas, gear: 1, drivePower: 0 }, 1).speed, 0, 'Disconnected drive cannot accelerate despite held throttle');
const powerless = stepWorldCar({ ...clear, speed: 8 }, { ...gas, gear: 1, drivePower: 0 }, .05);
assert.ok(powerless.speed > 7 && powerless.speed < 8, 'A shift must preserve rolling momentum');
assert.ok(stepWorldCar({ ...clear, speed: 8 }, { ...gas, gear: 'N', drivePower: 0 }, .05).speed > 7, 'Neutral must let the car roll');
assert.equal(drive(clear, { ...gas, gear: 1, drivePower: NaN }, 1).speed, 0, 'Invalid engine power must fail disconnected');
const downshift = stepWorldCar({ ...clear, speed: 25 }, { ...gas, gear: 1 }, .05);
assert.ok(downshift.speed > 20 && downshift.speed < 25, 'Downshifting must slow gradually');
for (const water of WATER) {
  const before = { x: water.x, z: water.z + water.rz + 1.3, heading: 0, speed: 26 };
  const stopped = stepWorldCar(before, gas, .05);
  assert.equal(stopped.speed, 0, 'The water edge must stop the car');
  assert.equal(stopped.z, before.z, 'A fast step cannot tunnel into the reservoir');
  assert.ok(drive(stopped, { ...gas, gear: 'R' }, .25).z > stopped.z, 'Water collision allows reversing away');
}

console.log('Open-world checks passed: screen-direction steering, free roaming, reverse, analog input, frame stability, collision recovery, manual gears, water boundaries, and reachable encounters.');

function driveManual(car, transmission, controls, seconds, fps = 60) {
  for (let i = 0; i < Math.round(seconds * fps); i++) {
    transmission = mechanics.stepTransmission(transmission, controls, car.speed, 1 / fps);
    car = stepWorldCar(car, { ...controls, gear: transmission.gear, drivePower: transmission.coupling }, 1 / fps);
  }
  return { car, transmission };
}
const launched = driveManual(clear, mechanics.createTransmission(), { throttle: 1 }, 1.2);
assert.ok(launched.car.speed > 3, 'W alone must launch directly from arrival');
const highGear = driveManual(clear, mechanics.selectTransmissionGear(mechanics.createTransmission(), 5, 0), { throttle: 1 }, 2);
assert.ok(highGear.car.speed > 1 && highGear.car.speed < launched.car.speed, 'A high-gear launch must be slower, but remain driveable');
assert.equal(highGear.transmission.event, '');
const stoppedInGear = driveManual(launched.car, launched.transmission, { brake: true }, 3);
assert.equal(stoppedInGear.car.speed, 0);
assert.equal(stoppedInGear.transmission.rpm, 850, 'Braking must preserve idle');
assert.ok(driveManual(stoppedInGear.car, stoppedInGear.transmission, { throttle: 1 }, 1).car.speed > 2, 'Throttle must drive away again without any recovery control');
const shifted = mechanics.selectTransmissionGear(launched.transmission, 2, launched.car.speed);
const secondGear = driveManual(launched.car, shifted, { throttle: 1 }, .3);
assert.equal(secondGear.transmission.gear, 2);
assert.ok(secondGear.car.speed > launched.car.speed, 'A single gear selection must continue driving');
const reverseLaunch = driveManual(clear, mechanics.selectTransmissionGear(mechanics.createTransmission(), 'R', 0), { throttle: 1 }, 1.2);
assert.ok(reverseLaunch.car.speed < -2 && reverseLaunch.car.z > clear.z, 'R and throttle must back up without another control');
const cruise = { ...launched.transmission, gear: 5, rpm: 5000, coupling: 1 };
for (const request of [1, 'R']) {
  const protectedGear = mechanics.selectTransmissionGear(cruise, request, 25);
  const protectedCar = driveManual({ ...clear, speed: 25 }, protectedGear, { throttle: 1 }, .3);
  const unchangedCar = driveManual({ ...clear, speed: 25 }, cruise, { throttle: 1 }, .3);
  assert.deepEqual(protectedCar.car, unchangedCar.car, 'Blocked shifts must leave driving power and momentum unchanged');
  assert.equal(protectedCar.transmission.gear, 5);
}
const manualFrames = [30, 60, 120].map(fps => driveManual(clear, mechanics.selectTransmissionGear(mechanics.createTransmission(), 2, 0), { throttle: 1 }, 1.2, fps));
assert.ok(Math.max(...manualFrames.map(s => s.car.speed)) - Math.min(...manualFrames.map(s => s.car.speed)) < .2, 'Automatic engagement must remain stable across refresh rates');
console.log('Assisted manual integration passed: throttle-only launch, single-input shifts, stop/start, high-gear launch, protected downshifts/reverse, and frame stability.');
