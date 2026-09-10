import assert from 'node:assert/strict';
import { GEARS, shiftGear, gearDrive } from './transmission.js';

const forward = GEARS.filter((gear) => typeof gear === 'number');
assert.equal(forward.length, 5);
assert.ok(GEARS.includes('R'));
for (const gear of GEARS) {
  const drive = gearDrive(gear, 0, 1, true);
  assert.ok(drive.targetSpeed * (gear === 'R' ? -1 : 1) > 0, 'Throttle must drive in the selected gear’s direction');
  assert.ok(drive.acceleration > 0);
  assert.equal(gearDrive(gear, 8, 0, true).targetSpeed, 0, 'Releasing throttle must coast in every gear');
  assert.ok(Math.abs(gearDrive(gear, 8, 1, false).targetSpeed) <= 15, 'Off-road driving must remain slower');
}
for (let gear = 2; gear <= 5; gear++) {
  assert.ok(gearDrive(gear, 0, 1, true).targetSpeed > gearDrive(gear - 1, 0, 1, true).targetSpeed, 'Higher gears must extend the speed range');
  assert.ok(gearDrive(gear, 0, 1, true).acceleration < gearDrive(gear - 1, 0, 1, true).acceleration, 'Higher gears must accelerate less strongly from rest');
  assert.ok(gearDrive(gear, 8, 1, true).rpm < gearDrive(gear - 1, 8, 1, true).rpm, 'Upshifts must lower engine RPM at the same road speed');
}
assert.equal(shiftGear(1, 5, 20), 5, 'Forward gears can be selected directly without automatic shifts');
assert.equal(shiftGear(5, 1, 30), 1, 'Downshifts must remain available');
for (const speed of [-20, -1.51, 1.51, 20]) {
  assert.equal(shiftGear(1, 'R', speed), 1, 'Stop before selecting reverse');
  assert.equal(shiftGear('R', 1, speed), 'R', 'Stop before selecting forward drive');
}
for (const speed of [-1.5, 0, 1.5]) {
  assert.equal(shiftGear(1, 'R', speed), 'R');
  assert.equal(shiftGear('R', 1, speed), 1);
}
for (const gear of [0, 6, '1', 'r', null, undefined, NaN]) {
  assert.equal(shiftGear(2, gear, 0), 2, 'Invalid requests must leave the gear unchanged');
  assert.equal(gearDrive(gear, 8, 1, true).targetSpeed, 0, 'An invalid gear must not accelerate');
}
for (const value of [NaN, Infinity, -Infinity, undefined, null, '1']) {
  assert.equal(shiftGear(2, 'R', value), 2, 'Unknown speed must not permit a direction change');
  assert.equal(gearDrive(2, 8, value, true).targetSpeed, 0, 'An invalid throttle must fail neutral');
  assert.ok(Object.values(gearDrive(2, value, 1, true)).every(Number.isFinite), 'Bad telemetry must not poison physics');
}
assert.equal(gearDrive(2, 0, -1, true).targetSpeed, 0, 'Manual reverse must require R, not negative throttle');
assert.deepEqual(gearDrive(2, 0, 20, true), gearDrive(2, 0, 1, true), 'Throttle must stay bounded');
assert.ok(gearDrive(2, 0, 0.5, true).targetSpeed < gearDrive(2, 0, 1, true).targetSpeed);
assert.equal(gearDrive(1, 0, 0, true).rpm, 850);
assert.equal(gearDrive(1, 1000, 1, true).rpm, 7000, 'Downshift RPM must remain within the tachometer range');
assert.equal(gearDrive('R', -1000, 1, true).rpm, 7000);
const state = Object.freeze({ x: 1, z: 2, heading: 0, speed: 30 });
const downshift = gearDrive(1, state.speed, 1, true);
assert.ok(downshift.targetSpeed < state.speed);
assert.deepEqual(state, { x: 1, z: 2, heading: 0, speed: 30 }, 'Selecting a target speed must not change position or clamp vehicle speed');
console.log('Transmission checks passed: five manual gears, reverse lock, RPM, off-road limits, and neutral invalid input.');
