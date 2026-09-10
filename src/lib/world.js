import { WORLD_SIZE, SPAWN, ROAD_WIDTH, LANDMARKS, OBSTACLES, WATER, terrainHeight, roadDistance, segmentDistance } from './worldMap.js';
import { automaticGear, getDriveForces, CAR_MASS } from './transmission.js';
export { WORLD_SIZE, SPAWN, ROAD_WIDTH, ROADS, LANDMARKS, DISCOVERIES, OBSTACLES, WATER, terrainHeight, roadDistance } from './worldMap.js';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const wrapAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
const approach = (value, target, amount) => value + clamp(target - value, -amount, amount);

export function terrainGrade(x, z, heading) {
  if (![x, z, heading].every(Number.isFinite)) return 0;
  const dx = Math.sin(heading) * 2, dz = -Math.cos(heading) * 2;
  return (terrainHeight(x + dx, z + dz) - terrainHeight(x - dx, z - dz)) / 4;
}

export function joystickInput(x, y, cameraHeading = 0) {
  const neutral = { throttle: 0, steering: 0, brake: false };
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(cameraHeading)) return neutral;
  const magnitude = Math.min(1, Math.hypot(x, y));
  if (magnitude <= 0.16) return neutral;
  return { ...neutral, throttle: (magnitude - 0.16) / 0.84, targetHeading: wrapAngle(Math.atan2(x, -y) + cameraHeading) };
}

export function stepWorldCar(state, input = {}, dt) {
  if (!state || !['x', 'z', 'heading', 'speed'].every((key) => Number.isFinite(state[key]))) return { ...SPAWN };
  if (!Number.isFinite(dt) || dt <= 0) return { ...state };
  dt = Math.min(dt, 0.05);
  let { x, z, heading, speed } = state;
  let throttle = Number.isFinite(input.throttle) ? clamp(input.throttle, -1, 1) : 0;
  const oldHeading = heading;
  const joystick = Number.isFinite(input.targetHeading) && throttle > 0 && !input.brake;
  const difference = joystick ? wrapAngle(input.targetHeading - heading) : 0;
  const steeringTarget = joystick ? clamp(difference / .7, -1, 1) : Number.isFinite(input.steering) ? clamp(input.steering, -1, 1) : 0;
  const oldSteering = Number.isFinite(state.steering) ? clamp(state.steering, -1, 1) : 0;
  const steering = approach(oldSteering, steeringTarget, 4 * dt);
  const averageSteering = (oldSteering + steering) / 2;
  if (joystick) {
    const turn = averageSteering * (2.8 - 1.5 * clamp(Math.abs(speed) / 15, 0, 1)) * dt;
    // Screen-direction steering turns toward the thumb before accelerating away.
    heading += Math.sign(turn) === Math.sign(difference) && Math.abs(turn) > Math.abs(difference) ? difference : turn;
    throttle *= Math.max(0, Math.cos(wrapAngle(input.targetHeading - heading)));
  } else {
    const turnRate = 1.1 / (1 + Math.max(0, Math.abs(speed) - 8) / 20);
    heading += averageSteering * turnRate * clamp(speed / 6, -1, 1) * dt;
  }
  const requestedThrottle = input.gear !== undefined ? Math.max(0, throttle) : throttle;
  const oldThrottle = Number.isFinite(state.throttle) ? clamp(state.throttle, -1, 1) : 0;
  throttle = input.brake ? 0 : approach(oldThrottle, requestedThrottle, (Math.abs(requestedThrottle) < Math.abs(oldThrottle) ? 6 : 3) * dt);
  const travelHeading = oldHeading + wrapAngle(heading - oldHeading) * 0.5;
  const grade = terrainGrade(x, z, travelHeading);
  const onRoad = roadDistance(x, z) <= ROAD_WIDTH / 2;
  const gear = input.gear !== undefined ? input.gear : throttle < 0 ? 'R' : automaticGear(Math.abs(speed), grade);
  const drivePower = input.drivePower === undefined ? 1 : Number.isFinite(input.drivePower) ? clamp(input.drivePower, 0, 1) : 0;
  const reversing = input.gear === undefined && requestedThrottle * speed < 0 && Math.abs(speed) > .15;
  // Automatic hill hold keeps an unattended car parked; pressing gas releases it, even when a high gear cannot climb.
  const hillHold = gear !== 'N' && requestedThrottle === 0 && Math.abs(throttle) < .02 && Math.abs(speed) < .08;
  const braking = input.brake || hillHold || reversing;
  const forces = getDriveForces(speed, gear, braking ? 0 : Math.abs(throttle), grade, onRoad, drivePower);
  const freeSpeed = speed + (forces.drive + forces.gravity + forces.drag) / CAR_MASS * dt;
  const resistance = (forces.rolling + forces.engineBrake) / CAR_MASS + (braking ? 14 : 0);
  const nextSpeed = approach(freeSpeed, 0, resistance * dt);
  const distance = (speed + nextSpeed) * .5 * dt / Math.hypot(1, grade);
  const next = { x: x + Math.sin(travelHeading) * distance, z: z - Math.cos(travelHeading) * distance };
  // ponytail: circle colliders suit this small world; use mesh colliders for detailed interiors.
  const collision = OBSTACLES.some((obstacle) => segmentDistance(obstacle.x, obstacle.z, state, next) < obstacle.radius + 1.25)
    || WATER.some(water => {
      const normalized = point => ({ x: (point.x - water.x) / (water.rx + 1.25), z: (point.z - water.z) / (water.rz + 1.25) });
      return segmentDistance(0, 0, normalized(state), normalized(next)) < 1;
    });
  const limit = WORLD_SIZE / 2 - 1.5;
  if (collision) return { x, z, heading: wrapAngle(heading), speed: 0, steering, throttle };
  const boundedX = clamp(next.x, -limit, limit);
  const boundedZ = clamp(next.z, -limit, limit);
  return { x: boundedX, z: boundedZ, heading: wrapAngle(heading), speed: boundedX !== next.x || boundedZ !== next.z ? 0 : nextSpeed, steering, throttle };
}

export function nearestLandmark(state) {
  if (!state || !Number.isFinite(state.x) || !Number.isFinite(state.z) || !Number.isFinite(state.speed) || Math.abs(state.speed) >= 3) return null;
  let nearest = null;
  let distance = 14;
  for (const landmark of LANDMARKS) {
    const candidate = Math.hypot(state.x - landmark.x, state.z - landmark.z);
    if (candidate <= distance) {
      nearest = landmark;
      distance = candidate;
    }
  }
  return nearest;
}
