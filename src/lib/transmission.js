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

export function shiftGear(current, requested, speed) {
  if (!GEARS.includes(requested) || !Number.isFinite(speed)) return current;
  if ((current === 'R') !== (requested === 'R') && Math.abs(speed) > 1.5) return current;
  return requested;
}

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
