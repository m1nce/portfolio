import assert from 'node:assert/strict';
import { WORLD_SIZE, SPAWN, WATER, ROAD_WIDTH, LANDMARKS, OBSTACLES, roadDistance, stepWorldCar, joystickInput, nearestLandmark } from './world.js';
import * as mechanics from './transmission.js';

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
const clear = { x: 0, z: 0, heading: 0, speed: 0 };
outer: for (let x = -WORLD_SIZE / 2 + 45; x < WORLD_SIZE / 2 - 45; x += 30) {
  for (let z = -WORLD_SIZE / 2 + 45; z < WORLD_SIZE / 2 - 45; z += 30) {
    if (roadDistance(x, z) < 35 || OBSTACLES.some(o => Math.hypot(x - o.x, z - o.z) < o.radius + 35)
      || WATER.some(w => Math.hypot((x - w.x) / (w.rx + 35), (z - w.z) / (w.rz + 35)) < 1)) continue;
    Object.assign(clear, { x, z }); break outer;
  }
}
const original = { ...clear };
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
  assert.ok(roaming.speed >= -9 && roaming.speed <= 26);
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
assert.ok(first.speed <= 9, 'First gear must hold its own speed limit');
const manualReverse = drive(clear, { ...gas, gear: 'R' }, 1);
assert.ok(manualReverse.speed < 0 && manualReverse.z > clear.z, 'Accelerating in R backs up');
assert.equal(drive({ ...clear, speed: 5 }, { ...gas, gear: 1, brake: true }, 2).speed, 0, 'Manual brake must never auto-reverse');
assert.equal(drive(clear, { ...gas, gear: 1, throttle: -1 }, 1).speed, 0, 'Negative throttle must not reverse a manual forward gear');
assert.equal(drive(clear, { ...gas, gear: 1, drivePower: 0 }, 1).speed, 0, 'A disconnected or stopped engine cannot accelerate despite held throttle');
const powerless = stepWorldCar({ ...clear, speed: 8 }, { ...gas, gear: 1, drivePower: 0, clutch: true }, .05);
assert.ok(powerless.speed > 7 && powerless.speed < 8, 'A clutch or engine power cut must coast gradually, not stop the car instantly');
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

function driveManual(car, transmission, controls, seconds) {
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    transmission = mechanics.stepTransmission(transmission, controls, car.speed, 1 / 60);
    car = stepWorldCar(car, { ...controls, gear: transmission.gear,
      drivePower: transmission.engine === 'running' && transmission.event !== 'grind' ? transmission.coupling : 0,
      engineBrake: transmission.engine === 'damaged' }, 1 / 60);
  }
  return { car, transmission };
}
const ready = driveManual(clear, mechanics.selectTransmissionGear(mechanics.createTransmission(), 1, 0, true), { throttle: .5, clutch: true }, .5);
assert.equal(ready.car.speed, 0, 'Revving with the clutch held must not move the car');
const launched = driveManual(ready.car, ready.transmission, { throttle: 1, clutch: false }, 1.2);
assert.equal(launched.transmission.engine, 'running', 'A revved first-gear clutch release must launch successfully');
assert.ok(launched.car.speed > 5, 'A successful launch must actually move through the world');
const wrongLaunch = driveManual(clear, mechanics.selectTransmissionGear(mechanics.createTransmission(), 5, 0, true), { throttle: 1 }, 2);
assert.equal(wrongLaunch.transmission.engine, 'stalled', 'Launching in fifth must bog down and stall');
const stoppedInGear = driveManual(launched.car, launched.transmission, { brake: true }, 2);
assert.equal(stoppedInGear.transmission.engine, 'stalled', 'Braking to a stop without the clutch must stall');
assert.equal(stoppedInGear.car.speed, 0);
const clutchStop = driveManual(launched.car, launched.transmission, { brake: true, clutch: true }, 2);
assert.equal(clutchStop.transmission.engine, 'running', 'Braking with the clutch held must preserve idle');
const interrupted = mechanics.selectTransmissionGear(launched.transmission, 2, launched.car.speed, false);
const grindingCar = driveManual(launched.car, interrupted, { throttle: 1 }, .2);
assert.ok(grindingCar.car.speed < launched.car.speed, 'A grinding shift must interrupt power in the world');
assert.ok(grindingCar.car.speed > launched.car.speed - 2, 'Grinding cannot instantly erase momentum');
const reverseLaunch = driveManual(clear, mechanics.selectTransmissionGear(mechanics.createTransmission(), 'R', 0, true), { throttle: 1 }, 1.2);
assert.equal(reverseLaunch.transmission.engine, 'running', 'Reverse must support a clutch launch');
assert.ok(reverseLaunch.car.speed < -4 && reverseLaunch.car.z > clear.z, 'Reverse must drive backward with the engine engaged');
const unsafe = mechanics.selectTransmissionGear({ ...launched.transmission, gear: 5 }, 1, 25, true);
const moneyShifted = driveManual({ ...clear, speed: 25 }, unsafe, { throttle: 1 }, .3);
assert.equal(moneyShifted.transmission.engine, 'damaged', 'The world must retain actual engine damage after an unsafe clutch release');
assert.ok(moneyShifted.car.speed < 25 && moneyShifted.car.speed > 19, 'Mechanical overrev must remove power and slow the car without teleporting it');
const deadEngine = driveManual(clear, moneyShifted.transmission, { throttle: 1 }, 1);
assert.equal(deadEngine.car.speed, 0, 'A moneyshifted engine cannot drive away until repaired');
console.log('Manual driving integration passed: clutch launches in forward/reverse, grinding power interruption, high-gear stall, clutch braking, and mechanical overrev damage.');
