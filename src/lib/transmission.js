export const GEARS = [1, 2, 3, 4, 5, 'R'];

const limits = {
  1: { speed: 9, acceleration: 12 },
  2: { speed: 15, acceleration: 10 },
  3: { speed: 22, acceleration: 8 },
  4: { speed: 29, acceleration: 6 },
  5: { speed: 36, acceleration: 4.5 },
  R: { speed: 9, acceleration: 8 }
};
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const approach = (value, target, amount) => value + clamp(target - value, -amount, amount);

export function gearDrive(gear, speed, throttle, onRoad) {
  if (!GEARS.includes(gear)) return { targetSpeed: 0, acceleration: 7, rpm: 850 };
  speed = Number.isFinite(speed) ? Math.abs(speed) : 0;
  throttle = Number.isFinite(throttle) ? clamp(throttle, 0, 1) : 0;
  const limit = limits[gear];
  const launchPull = gear === 'R' ? 1 : 1 / gear;
  // ponytail: arcade torque keeps five gears distinct; add a measured engine curve for simulation-level handling.
  const pull = launchPull + (1 - launchPull) * clamp(speed / (limit.speed * 0.45), 0, 1);
  return {
    targetSpeed: throttle === 0 ? 0 : (gear === 'R' ? -1 : 1) * Math.min(limit.speed, onRoad ? limit.speed : 15) * throttle,
    acceleration: throttle === 0 ? 7 : limit.acceleration * pull * throttle,
    rpm: Math.round(850 + clamp(speed / limit.speed, 0, 1) * 6150)
  };
}

export function createTransmission() {
  return { gear: 'N', rpm: 850, engine: 'running', clutch: false, coupling: 0, stallTime: 0, event: '', eventTime: 0 };
}

function validState(state) {
  return state && [...GEARS, 'N'].includes(state.gear) && ['running', 'stalled', 'damaged'].includes(state.engine)
    && ['rpm', 'coupling', 'stallTime', 'eventTime'].every(key => Number.isFinite(state[key]));
}

export function selectTransmissionGear(state, requested, speed, clutch = false) {
  if (!validState(state)) state = createTransmission();
  if (![...GEARS, 'N'].includes(requested) || !Number.isFinite(speed) || requested === state.gear) return { ...state };
  const wrongDirection = requested === 'R' ? speed > 1.5 : requested !== 'N' && speed < -1.5;
  if (requested !== 'N' && (clutch !== true || wrongDirection)) {
    return { ...state, event: 'grind', eventTime: .65 };
  }
  return { ...state, gear: requested, clutch: clutch === true, coupling: 0, stallTime: 0,
    event: state.engine === 'running' ? '' : state.event, eventTime: 0 };
}

export function stepTransmission(state, input = {}, speed, dt) {
  if (!validState(state)) state = createTransmission();
  if (!Number.isFinite(dt) || dt <= 0) return { ...state };
  dt = Math.min(dt, .05);
  speed = Number.isFinite(speed) ? speed : 0;
  const throttle = Number.isFinite(input?.throttle) ? clamp(input.throttle, 0, 1) : 0;
  const clutch = input?.clutch === true;
  let { rpm, engine, coupling, stallTime, event, eventTime } = state;
  eventTime = Math.max(0, eventTime - dt);
  if (event === 'grind' && eventTime === 0) event = '';
  if (engine !== 'running') {
    return { ...state, clutch, coupling: 0, rpm: approach(rpm, 0, 7000 * dt), event, eventTime };
  }
  const disengaged = clutch || state.gear === 'N';
  // ponytail: a short automatic bite-point ramp makes a binary keyboard clutch playable.
  coupling = disengaged ? 0 : Math.min(1, coupling + dt / .5);
  const wheelRPM = state.gear === 'N' ? 0 : Math.abs(speed) / limits[state.gear].speed * 7000;
  if (!disengaged && coupling > .25 && wheelRPM > 8000) {
    return { ...state, clutch, coupling: 0, rpm: Math.min(10000, wheelRPM), engine: 'damaged',
      event: 'money-shift', eventTime: 1.2, stallTime: 0 };
  }
  const freeRPM = 850 + throttle * 6150;
  const targetRPM = freeRPM * (1 - coupling) + wheelRPM * coupling;
  rpm = approach(rpm, targetRPM, (rpm < targetRPM ? 9000 : 12000) * dt);
  stallTime = coupling > .9 && rpm < 600 ? stallTime + dt : 0;
  if (stallTime > .22) {
    engine = 'stalled';
    coupling = 0;
    event = 'stall';
    eventTime = .35;
  }
  return { ...state, clutch, coupling, rpm: Math.round(rpm), engine, stallTime, event, eventTime };
}

export function restartTransmission(state, speed, clutch = false) {
  if (!validState(state)) return createTransmission();
  if (state.engine !== 'stalled' || !Number.isFinite(speed) || (clutch !== true && state.gear !== 'N')) return { ...state };
  return { ...state, engine: 'running', rpm: 850, clutch: clutch === true, coupling: 0, stallTime: 0, event: '', eventTime: 0 };
}
