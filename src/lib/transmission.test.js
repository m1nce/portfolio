import assert from 'node:assert/strict';
import { GEARS, gearDrive } from './transmission.js';
import * as mechanics from './transmission.js';
const { getDriveForces, CAR_MASS } = mechanics;
assert.equal(typeof getDriveForces, 'function', 'Driving must integrate physical forces instead of forcing a target speed');

const netAcceleration = force => (force.drive + force.gravity + force.drag - force.rolling - force.engineBrake) / CAR_MASS;
for (const gear of GEARS) {
  assert.ok(gearDrive(gear, 0, 1).driveForce * (gear === 'R' ? -1 : 1) > 0, 'Throttle must generate force in the selected direction');
  assert.equal(gearDrive(gear, 8, 0).driveForce, 0, 'Closed throttle must not propel the car');
}
for (let gear = 2; gear <= 5; gear++) {
  assert.ok(gearDrive(gear, 0, 1).driveForce < gearDrive(gear - 1, 0, 1).driveForce, 'Higher ratios must have less launch torque at the wheels');
  assert.ok(gearDrive(gear, 12, 0).engineBrake < gearDrive(gear - 1, 12, 0).engineBrake, 'Lower gears must provide stronger engine braking');
  assert.ok(gearDrive(gear, 12, 1).rpm < gearDrive(gear - 1, 12, 1).rpm, 'Road speed and gear ratio must determine revs');
}
const uphillThird = getDriveForces(12, 3, 1, .15);
const uphillFifth = getDriveForces(12, 5, 1, .15);
assert.ok(netAcceleration(uphillThird) > 0, 'Third must have enough wheel torque to climb a moderate hill');
assert.ok(netAcceleration(uphillFifth) < 0, 'Fifth must lose speed when gravity exceeds available wheel torque');
assert.ok(netAcceleration(getDriveForces(12, 3, 0, -.06)) < 0, 'Third must engine-brake on a moderate descent');
assert.ok(netAcceleration(getDriveForces(12, 5, 0, -.06)) > 0, 'The same descent must accelerate the taller fifth gear');
assert.ok(netAcceleration(getDriveForces(12, 'N', 0, -.06)) > netAcceleration(getDriveForces(12, 5, 0, -.06)), 'Neutral must coast faster without engine braking');
const neutralForces = getDriveForces(0, 'N', 1, .15);
assert.equal(neutralForces.drive, 0);
assert.equal(neutralForces.engineBrake, 0);
assert.ok(neutralForces.gravity < -1500, 'Neutral must retain actual gravity even from rest');
assert.equal(getDriveForces(12, 3, 1, 0).gravity, 0);
assert.equal(getDriveForces(12, 3, 1, .1).gravity, -getDriveForces(12, 3, 1, -.1).gravity, 'Facing downhill must reverse the signed gravity force');
assert.equal(getDriveForces(-12, 3, 1, .1).gravity, getDriveForces(12, 3, 1, .1).gravity, 'Rolling backward must not reverse physical gravity');
assert.ok(getDriveForces(12, 'N', 0, 0, false).rolling > getDriveForces(12, 'N', 0, 0).rolling, 'Rough ground must create more rolling resistance');
assert.ok(Math.abs(getDriveForces(24, 'N', 0, 0).drag) > Math.abs(getDriveForces(12, 'N', 0, 0).drag) * 3.9, 'Aerodynamic drag must grow with speed squared');
assert.equal(getDriveForces(12, 3, 1, 0, true, 0).drive, 0, 'Automatic gear engagement must control wheel torque');
assert.equal(getDriveForces(12, 3, 0, 0, true, 0).engineBrake, 0, 'Disconnected drive cannot supply engine braking');
assert.equal(mechanics.automaticGear(12, 0), 2, 'Automatic mode must upshift at a useful engine speed');
assert.equal(mechanics.automaticGear(12, .15), 1, 'Automatic mode must hold a lower gear when climbing');
assert.equal(mechanics.automaticGear(-4), 'R');
for (const gear of [0, 6, '1', 'r', null, undefined, NaN]) assert.equal(gearDrive(gear, 8, 1).driveForce, 0, 'Invalid gears must not drive');
for (const bad of [NaN, Infinity, -Infinity, undefined, null, '1']) {
  assert.equal(gearDrive(2, 8, bad).driveForce, 0, 'Invalid throttle must fail neutral');
  assert.ok(Object.values(getDriveForces(bad, 2, bad, bad)).every(Number.isFinite), 'Invalid telemetry cannot poison force integration');
  assert.equal(mechanics.automaticGear(bad), 1, 'Missing automatic telemetry must recover in first gear');
}
assert.equal(gearDrive(2, 0, -1).driveForce, 0, 'Manual negative throttle cannot reverse a forward gear');
assert.equal(gearDrive(1, 0, 0).rpm, 850);
assert.equal(gearDrive(1, 1000, 1).rpm, 7000);
assert.equal(gearDrive(1, 1000, 1).driveForce, 0, 'The rev limiter must cut engine torque, not clamp vehicle momentum');
assert.deepEqual(gearDrive(2, 0, 20), gearDrive(2, 0, 1), 'Throttle must stay bounded');
console.log('Force checks passed: torque ratios, hill gravity, downhill engine braking, neutral coasting, rolling resistance, aerodynamic drag, and finite input.');

const { createTransmission, selectTransmissionGear, stepTransmission } = mechanics;
function runEngine(state, input, speed, seconds = 1, fps = 60) {
  for (let i = 0; i < Math.round(seconds * fps); i++) state = stepTransmission(state, input, speed, 1 / fps);
  return state;
}
const ready = createTransmission();
assert.equal(ready.gear, 1, 'Arrival must be ready to drive with throttle alone');
assert.equal(ready.coupling, 1);
assert.equal(runEngine(ready, {}, 0, 4).rpm, 850, 'Stopping in first must preserve idle');
assert.equal(runEngine(ready, {}, 0, 4).coupling, 1, 'Stopping must not require a restart');
const neutral = selectTransmissionGear(ready, 'N', 0);
const revved = runEngine(neutral, { throttle: 1 }, 0, 4);
assert.ok(revved.rpm > 6000 && revved.rpm <= 7000, 'Neutral must rev freely up to the limiter');
assert.equal(revved.coupling, 0, 'Neutral must disconnect drive');
const rolling = runEngine(selectTransmissionGear(ready, 3, 12), { throttle: 0.5 }, 12, 2);
for (const [gear, next, speed] of [[3, 4, 12], [4, 3, 12], [2, 1, 7]]) {
  const shifted = selectTransmissionGear({ ...rolling, gear }, next, speed);
  assert.equal(shifted.gear, next, 'One gear selection must engage without a clutch control');
  assert.equal(shifted.event, '');
  const partial = stepTransmission(shifted, { throttle: .3 }, speed, .05);
  assert.ok(partial.coupling > 0 && partial.coupling < 1, 'Automatic engagement must ramp power smoothly');
  const engaged = runEngine(shifted, { throttle: .3 }, speed, .25);
  assert.equal(engaged.gear, next);
  assert.equal(engaged.coupling, 1, 'A shift must finish promptly without extra input');
  assert.ok(engaged.rpm > 850 && engaged.rpm < 7000, 'Engaged revs must follow gear and road speed');
}
const upshifted = runEngine(selectTransmissionGear(rolling, 4, 12), { throttle: 1 }, 12, .25);
assert.ok(upshifted.rpm < rolling.rpm, 'An upshift must lower revs even with the accelerator held');
const downshifted = runEngine(selectTransmissionGear(rolling, 2, 12), { throttle: 0 }, 12, .25);
assert.ok(downshifted.rpm > rolling.rpm, 'A safe downshift must raise revs');
assert.ok(stepTransmission(neutral, { throttle: 1 }, 0, .05).rpm - neutral.rpm <= 110, 'A throttle tap must not send the tachometer jumping');
assert.ok(revved.rpm - stepTransmission(revved, {}, 0, .05).rpm <= 75, 'Released throttle must let revs fall gradually');
for (const [gear, requested, speed, event] of [[3, 'R', 12, 'direction-blocked'], ['N', 1, -12, 'direction-blocked'], [5, 1, 25, 'downshift-blocked'], ['N', 1, 25, 'downshift-blocked']]) {
  const before = { ...rolling, gear };
  const blocked = selectTransmissionGear(before, requested, speed);
  assert.equal(blocked.gear, gear, 'Unsafe selections must retain the current gear');
  assert.equal(blocked.coupling, before.coupling, 'A blocked selection must not interrupt power');
  assert.equal(blocked.rpm, before.rpm, 'A blocked selection must not spike revs');
  assert.equal(blocked.event, event);
  assert.ok(blocked.eventTime >= 1.5, 'Feedback must remain readable');
  assert.equal(runEngine(blocked, {}, speed, 3).event, '', 'Shift feedback must clear automatically');
}
assert.equal(selectTransmissionGear(ready, 'R', 0).gear, 'R', 'Reverse must engage at rest');
for (const gear of [...GEARS, 'N']) {
  const stopped = runEngine(selectTransmissionGear(ready, gear, 0), {}, 0, 5);
  assert.equal(stopped.rpm, 850, 'Every stopped gear must retain idle');
  assert.equal(stopped.event, '', 'Ordinary stopping cannot trigger failure states');
  const driven = runEngine(stopped, { throttle: 1 }, 0, 2);
  assert.equal(driven.coupling, gear === 'N' ? 0 : 1, 'Every driving gear remains available after a stop');
  assert.equal(driven.event, '');
  assert.equal('engine' in driven, false, 'The simplified transmission cannot retain damage or stall state');
}

for (const dt of [0, -1, NaN, Infinity]) assert.deepEqual(stepTransmission(rolling, { throttle: 1 }, 12, dt), rolling, 'Pause and invalid frame time must freeze engine state');
assert.deepEqual(stepTransmission(neutral, { throttle: 1 }, 0, 2), stepTransmission(neutral, { throttle: 1 }, 0, .05), 'Long frames must be bounded');
for (const bad of [NaN, Infinity, undefined, null, '1']) {
  const result = stepTransmission(neutral, { throttle: bad }, bad, .05);
  assert.ok(['rpm', 'coupling', 'eventTime'].every(key => Number.isFinite(result[key])), 'Invalid controls or speed cannot poison engine state');
  assert.equal(selectTransmissionGear(rolling, 1, bad).gear, rolling.gear, 'Invalid speed must not permit a gear change');
}
assert.equal(selectTransmissionGear(rolling, 8, 12).gear, 3);
assert.deepEqual(ready, createTransmission(), 'Engine simulation must not mutate its input');
assert.deepEqual(stepTransmission({ gear: 1, rpm: NaN }, {}, 0, 0), ready, 'Invalid state must recover ready to drive');
const frameRates = [30, 60, 120].map(fps => runEngine(selectTransmissionGear(rolling, 4, 12), { throttle: 1 }, 12, .5, fps));
assert.ok(Math.max(...frameRates.map(s => s.rpm)) - Math.min(...frameRates.map(s => s.rpm)) < 5, 'Shift revs must remain stable across refresh rates');
console.log('Assisted manual checks passed: ready first gear, single-input shifts, automatic engagement, neutral revs, safe shift protection, and no stall or damage lockouts.');
