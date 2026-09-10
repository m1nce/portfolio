export const GEARS = [1, 2, 3, 4, 5, 'R'];

export const CAR_MASS = 1100;
const ratios = { 1: 3.136, 2: 1.888, 3: 1.33, 4: 1, 5: .814, R: 3.758 };
const finalDrive = 4.1, wheelRadius = .322, efficiency = .82;
const torqueCurve = [[850, 110], [1500, 140], [3000, 158], [4500, 162], [6000, 148], [6800, 130], [7100, 0]];
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const approach = (value, target, amount) => value + clamp(target - value, -amount, amount);
const wheelRPM = (gear, speed) => Math.abs(speed) * (ratios[gear] || 0) * finalDrive * 60 / (2 * Math.PI * wheelRadius);

export function automaticGear(speed, grade = 0) {
  if (!Number.isFinite(speed)) return 1;
  if (speed < -.1) return 'R';
  return [1, 2, 3, 4].find(gear => wheelRPM(gear, speed) < (grade > .06 ? 5200 : 4000)) || 5;
}

export function gearDrive(gear, speed, throttle) {
  if (!GEARS.includes(gear)) return { driveForce: 0, engineBrake: 0, rpm: 850 };
  speed = Number.isFinite(speed) ? Math.abs(speed) : 0;
  throttle = Number.isFinite(throttle) ? clamp(throttle, 0, 1) : 0;
  const rpm = wheelRPM(gear, speed);
  const torqueRPM = Math.max(1400, rpm);
  const point = torqueCurve.findIndex(point => point[0] >= torqueRPM);
  const torque = point <= 0 ? 0 : torqueCurve[point - 1][1] + (torqueCurve[point][1] - torqueCurve[point - 1][1])
    * (torqueRPM - torqueCurve[point - 1][0]) / (torqueCurve[point][0] - torqueCurve[point - 1][0]);
  const axle = ratios[gear] * finalDrive * efficiency / wheelRadius;
  const limited = rpm > (gear === 'R' ? 3500 : 7000);
  return {
    driveForce: limited || throttle === 0 ? 0 : (gear === 'R' ? -1 : 1) * Math.min(gear === 'R' ? CAR_MASS * 3 : Infinity, torque * axle) * throttle,
    engineBrake: (18 + Math.min(rpm, 10000) * .012) * axle * (limited ? 1 : 1 - throttle) * clamp((rpm - 650) / 550, 0, 1),
    rpm: clamp(rpm, 850, 7000)
  };
}

export function getDriveForces(speed, gear, throttle, grade = 0, onRoad = true, coupling = 1) {
  speed = Number.isFinite(speed) ? speed : 0;
  grade = Number.isFinite(grade) ? grade : 0;
  coupling = Number.isFinite(coupling) ? clamp(coupling, 0, 1) : 0;
  const engine = gearDrive(gear, speed, throttle);
  const slopeLength = Math.hypot(1, grade);
  return {
    drive: engine.driveForce * coupling,
    gravity: grade === 0 ? 0 : -CAR_MASS * 9.81 * (grade / slopeLength),
    drag: -.43 * speed * Math.abs(speed),
    rolling: CAR_MASS * 9.81 * (onRoad ? .015 : .06) / slopeLength,
    engineBrake: engine.engineBrake * coupling
  };
}

export function createTransmission() {
  return { gear: 1, rpm: 850, coupling: 1, engine: 'running', stallArmed: false, stoppedTime: 0, startTime: 0, event: '', eventTime: 0 };
}

function validState(state) {
  return state && [...GEARS, 'N'].includes(state.gear)
    && ['running', 'stalled', 'starting'].includes(state.engine) && typeof state.stallArmed === 'boolean'
    && ['rpm', 'coupling', 'eventTime', 'stoppedTime', 'startTime'].every(key => Number.isFinite(state[key]) && state[key] >= 0)
    && state.rpm <= 7000 && state.coupling <= 1;
}

export function selectTransmissionGear(state, requested, speed) {
  if (!validState(state)) state = createTransmission();
  if (![...GEARS, 'N'].includes(requested) || !Number.isFinite(speed) || requested === state.gear) return { ...state };
  const wrongDirection = requested === 'R' ? speed > 1.5 : requested !== 'N' && speed < -1.5;
  if (wrongDirection) return { ...state, event: 'direction-blocked', eventTime: 2 };
  if (requested !== 'N' && wheelRPM(requested, speed) > 7600) {
    return { ...state, event: 'downshift-blocked', eventTime: 2 };
  }
  return { ...state, gear: requested, coupling: 0, event: '', eventTime: 0 };
}

export function restartTransmission(state, speed) {
  if (!validState(state)) state = createTransmission();
  if (state.engine !== 'stalled' || !Number.isFinite(speed) || Math.abs(speed) >= .5) return { ...state };
  return { ...state, engine: 'starting', rpm: 0, coupling: 0, stallArmed: false, stoppedTime: 0, startTime: 1.1, event: '', eventTime: 0 };
}

export function stepTransmission(state, input = {}, speed, dt) {
  if (!validState(state)) state = createTransmission();
  if (!Number.isFinite(dt) || dt <= 0) return { ...state };
  dt = Math.min(dt, .05);
  speed = Number.isFinite(speed) ? speed : 0;
  const throttle = Number.isFinite(input?.throttle) ? clamp(input.throttle, 0, 1) : 0;
  let { rpm, coupling, engine, stallArmed, stoppedTime, startTime, event, eventTime } = state;
  eventTime = Math.max(0, eventTime - dt);
  if (eventTime === 0) event = '';
  if (input?.automatic === true) {
    engine = 'running';
    stallArmed = false;
    stoppedTime = startTime = 0;
  } else if (engine === 'running') {
    // Only stopping after movement stalls: arrival, a neutral stop and a fresh restart remain ready to launch.
    if (Math.abs(speed) > .5) stallArmed = true;
    if (state.gear === 'N' && Math.abs(speed) < .08) stallArmed = false;
    stoppedTime = stallArmed && state.gear !== 'N' && Math.abs(speed) < .08 ? stoppedTime + dt : 0;
    if (stoppedTime >= .2) {
      engine = 'stalled';
      event = '';
      eventTime = 0;
    }
  } else if (engine === 'starting') {
    startTime = Math.max(0, startTime - dt);
    if (startTime < 1e-9) engine = 'running';
  }
  if (engine !== 'running') {
    rpm = approach(rpm, engine === 'starting' ? 300 : 0, 2500 * dt);
    return { ...state, engine, stallArmed, stoppedTime, startTime, coupling: 0, rpm, event, eventTime };
  }
  coupling = state.gear === 'N' ? 0 : Math.min(1, coupling + dt / .18);
  // Automatic launch slip avoids a clutch control; wheel torque still determines whether the car can climb.
  const launchRPM = 850 + throttle * 1200 * (1 - clamp(Math.abs(speed) / 4, 0, 1));
  const targetRPM = state.gear === 'N' ? 850 + throttle * 6150
    : Math.max(launchRPM, gearDrive(state.gear, speed, throttle).rpm);
  rpm = approach(rpm, targetRPM, (rpm < targetRPM ? 2200 : 1500) * dt);
  return { ...state, engine, stallArmed, stoppedTime, startTime, coupling, rpm, event, eventTime };
}
