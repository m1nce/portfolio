import { WORLD_SIZE, SPAWN, ROAD_WIDTH, LANDMARKS, OBSTACLES, WATER, roadDistance, segmentDistance } from './worldMap.js';
import { gearDrive } from './transmission.js';
export { WORLD_SIZE, SPAWN, ROAD_WIDTH, ROADS, LANDMARKS, DISCOVERIES, OBSTACLES, WATER, terrainHeight, roadDistance } from './worldMap.js';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const wrapAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
const approach = (value, target, amount) => value + clamp(target - value, -amount, amount);

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
  const steering = Number.isFinite(input.steering) ? clamp(input.steering, -1, 1) : 0;
  const oldHeading = heading;
  if (Number.isFinite(input.targetHeading) && throttle > 0 && !input.brake) {
    const difference = wrapAngle(input.targetHeading - heading);
    // Screen-direction steering turns toward the thumb before accelerating away.
    heading += clamp(difference, -5.5 * dt, 5.5 * dt);
    throttle *= Math.max(0, Math.cos(wrapAngle(input.targetHeading - heading)));
  } else {
    heading += steering * 1.75 * clamp(speed / 8, -1, 1) * dt;
  }
  const onRoad = roadDistance(x, z) <= ROAD_WIDTH / 2;
  const manual = input.gear !== undefined ? gearDrive(input.gear, speed, throttle, onRoad) : null;
  const drivePower = input.drivePower === undefined ? 1 : Number.isFinite(input.drivePower) ? clamp(input.drivePower, 0, 1) : 0;
  const disconnected = manual && (drivePower === 0 || input.clutch || input.gear === 'N');
  const targetSpeed = input.brake || disconnected ? 0 : manual ? manual.targetSpeed : throttle * (throttle < 0 ? 9 : onRoad ? 26 : 15);
  const rate = input.brake ? 28 : disconnected ? (input.engineBrake && !input.clutch && input.gear !== 'N' ? 12 : 2)
    : speed * targetSpeed < 0 ? 26 : targetSpeed === 0 ? 7
      : manual ? (Math.abs(speed) > Math.abs(targetSpeed) ? 10 : manual.acceleration * drivePower) : 12;
  const nextSpeed = approach(speed, targetSpeed, rate * dt);
  const distance = (speed + nextSpeed) * 0.5 * dt;
  const travelHeading = oldHeading + wrapAngle(heading - oldHeading) * 0.5;
  const next = { x: x + Math.sin(travelHeading) * distance, z: z - Math.cos(travelHeading) * distance };
  // ponytail: circle colliders suit this small world; use mesh colliders for detailed interiors.
  const collision = OBSTACLES.some((obstacle) => segmentDistance(obstacle.x, obstacle.z, state, next) < obstacle.radius + 1.25)
    || WATER.some(water => {
      const normalized = point => ({ x: (point.x - water.x) / (water.rx + 1.25), z: (point.z - water.z) / (water.rz + 1.25) });
      return segmentDistance(0, 0, normalized(state), normalized(next)) < 1;
    });
  const limit = WORLD_SIZE / 2 - 1.5;
  if (collision) return { x, z, heading: wrapAngle(heading), speed: 0 };
  const boundedX = clamp(next.x, -limit, limit);
  const boundedZ = clamp(next.z, -limit, limit);
  return { x: boundedX, z: boundedZ, heading: wrapAngle(heading), speed: boundedX !== next.x || boundedZ !== next.z ? 0 : nextSpeed };
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
