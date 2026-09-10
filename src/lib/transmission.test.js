import assert from 'node:assert/strict';
import { GEARS, gearDrive } from './transmission.js';
import * as mechanics from './transmission.js';

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
for (const gear of [0, 6, '1', 'r', null, undefined, NaN]) {
  assert.equal(gearDrive(gear, 8, 1, true).targetSpeed, 0, 'An invalid gear must not accelerate');
}
for (const value of [NaN, Infinity, -Infinity, undefined, null, '1']) {
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
console.log('Gear drive checks passed: five ratios, reverse drive, RPM, off-road limits, and neutral invalid input.');

assert.equal(typeof mechanics.createTransmission, 'function', 'Manual driving must have running, stalled, and damaged engine state');
const { createTransmission, selectTransmissionGear, stepTransmission, restartTransmission } = mechanics;
function runEngine(state, input, speed, seconds = 1, fps = 60) {
  for (let i = 0; i < Math.round(seconds * fps); i++) state = stepTransmission(state, input, speed, 1 / fps);
  return state;
}
const neutral = createTransmission();
assert.equal(neutral.gear, 'N');
assert.equal(runEngine(neutral, {}, 0, 4).engine, 'running', 'Neutral idle cannot stall');
const revved = runEngine(neutral, { throttle: 1 }, 0, 2);
assert.ok(revved.rpm > 6000 && revved.rpm <= 7000, 'Neutral must rev freely up to the limiter');
const firstGear = selectTransmissionGear(neutral, 1, 0, true);
assert.equal(firstGear.gear, 1);
const heldClutch = runEngine(firstGear, { clutch: true }, 0, 4);
assert.equal(heldClutch.engine, 'running', 'Holding the clutch must keep a stopped engine alive');
assert.equal(heldClutch.coupling, 0);
const stalled = runEngine(firstGear, {}, 0, 3);
assert.equal(stalled.engine, 'stalled', 'Releasing the clutch in gear at rest without gas must stall');
assert.equal(stalled.rpm, 0);
assert.equal(stalled.event, 'stall');
let stallOnset = firstGear;
for (let frame = 0; frame < 180 && stallOnset.engine === 'running'; frame++) stallOnset = stepTransmission(stallOnset, {}, 0, 1 / 60);
assert.ok(stallOnset.eventTime > .25, 'A new stall must leave enough active event time for the audible sputter');
assert.equal(stalled.eventTime, 0, 'The stall sound must end while its recovery state stays visible');
assert.equal(runEngine(stalled, { throttle: 1 }, 0, 1).engine, 'stalled', 'Throttle cannot restart a stalled engine');
assert.equal(restartTransmission(stalled, 0).engine, 'stalled', 'An in-gear restart requires the clutch');
assert.equal(restartTransmission(stalled, 0, true).engine, 'running');
assert.equal(restartTransmission(selectTransmissionGear(stalled, 'N', 0), 0).engine, 'running', 'Neutral permits a restart');

const rolling = runEngine(selectTransmissionGear(neutral, 3, 12, true), { throttle: 0.5 }, 12);
assert.equal(rolling.engine, 'running');
const grinding = selectTransmissionGear(rolling, 4, 12, false);
assert.equal(grinding.gear, 3, 'Without clutch, the requested gear must not engage');
assert.equal(grinding.event, 'grind');
assert.ok(grinding.eventTime > 0, 'Grinding must produce a temporary power interruption');
assert.equal(runEngine(grinding, { throttle: 0.5 }, 12, 1).event, '', 'Grinding must recover without a statistic');
for (const [gear, next, speed] of [[3, 4, 12], [4, 3, 12], [2, 1, 7]]) {
  const shifted = selectTransmissionGear({ ...rolling, gear }, next, speed, true);
  const engaged = runEngine(shifted, { throttle: .3 }, speed);
  assert.equal(engaged.gear, next);
  assert.equal(engaged.engine, 'running', 'A safe upshift or downshift must remain driveable');
  assert.ok(engaged.rpm > 850 && engaged.rpm < 7000, 'Engaged revs must follow gear and road speed');
}
assert.equal(selectTransmissionGear(rolling, 'R', 12, true).event, 'grind', 'Reverse cannot engage while moving forward');
assert.equal(selectTransmissionGear({ ...rolling, gear: 'N' }, 1, -12, true).event, 'grind', 'Neutral cannot bypass the direction lock');
const badDownshift = selectTransmissionGear({ ...rolling, gear: 5 }, 1, 25, true);
assert.equal(runEngine(badDownshift, { clutch: true }, 25).engine, 'running', 'Selecting a low gear with clutch down cannot overrev the engine yet');
const overrevved = runEngine(badDownshift, { throttle: 0 }, 25, .2);
assert.equal(overrevved.engine, 'damaged', 'Releasing the clutch into a mechanically unsafe downshift must damage the engine');
assert.equal(overrevved.event, 'money-shift');
assert.ok(overrevved.rpm > 8000, 'The tachometer must show mechanical overrev beyond the normal limiter');
assert.equal(overrevved.coupling, 0, 'A damaged engine cannot deliver drive');
assert.equal(restartTransmission(overrevved, 0, true).engine, 'damaged', 'An ignition restart cannot repair a moneyshift');
assert.equal(runEngine(overrevved, { throttle: 1 }, 0, 3).rpm, 0);

for (const dt of [0, -1, NaN, Infinity]) assert.deepEqual(stepTransmission(rolling, { throttle: 1 }, 12, dt), rolling, 'Pause and invalid frame time must freeze engine state');
assert.deepEqual(stepTransmission(neutral, { throttle: 1 }, 0, 2), stepTransmission(neutral, { throttle: 1 }, 0, .05), 'Long frames must be bounded');
for (const bad of [NaN, Infinity, undefined, null, '1']) {
  const result = stepTransmission(neutral, { throttle: bad, clutch: false }, bad, .05);
  assert.ok(['rpm', 'coupling', 'stallTime', 'eventTime'].every(key => Number.isFinite(result[key])), 'Invalid controls or speed cannot poison engine state');
  assert.equal(selectTransmissionGear(rolling, 1, bad, true).gear, rolling.gear, 'Invalid speed must not permit a gear change');
}
assert.equal(selectTransmissionGear(rolling, 8, 12, true).gear, 3);
assert.deepEqual(neutral, createTransmission(), 'Engine simulation must not mutate its input');
console.log('Manual engine checks passed: neutral revs, clutch shifts, grinding, overrev damage, stalling, restart, and finite paused state.');
