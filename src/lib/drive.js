export function driveState(scrollY, scrollableHeight, paused = false, previous = { progress: 0, distance: 0 }) {
  if (paused) return previous;
  const distance = Math.max(0, Math.min(scrollY, scrollableHeight));
  return { progress: scrollableHeight > 0 ? distance / scrollableHeight : 0, distance };
}

// Both the road and car use document-space Y, so the car stays on every bend.
export function roadPosition(y, width) {
  const roadWidth = Math.min(126, Math.max(52, width * 0.24));
  const amplitude = Math.max(0, Math.min(width * 0.23, (width - roadWidth) / 2 - 16));
  const bend = Math.max(160, width * 0.32);
  const phase = y / bend - 0.65;
  const slope = amplitude / bend * Math.cos(phase);
  return { x: width * 0.5 + amplitude * Math.sin(phase), angle: -Math.atan(slope) * 180 / Math.PI, roadWidth };
}

// Match screen directions: positive Y drives downhill, negative Y brakes.
export function joystickInput(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { x: 0, y: 0, throttle: 0, brake: false, steering: 0 };
  const radius = Math.max(1, Math.hypot(x, y));
  x /= radius;
  y /= radius;
  const deadzone = 0.12;
  return { x, y, throttle: Math.max(0, (y - deadzone) / (1 - deadzone)), brake: y < -deadzone,
    steering: Math.abs(x) > deadzone ? Math.sign(x) * (Math.abs(x) - deadzone) / (1 - deadzone) : 0 };
}

// Heading is radians from downhill: positive turns right, negative turns left.
export function advanceCar(car, input, dt, width, maxY) {
  if (!Number.isFinite(dt) || dt <= 0) return { ...car };
  dt = Math.min(dt, 0.05);
  const throttle = input.throttle === true ? 1 : Number.isFinite(input.throttle) ? Math.max(0, Math.min(1, input.throttle)) : 0;
  const acceleration = input.brake ? -500 : throttle > 0 ? 180 * throttle : -100;
  let speed = Math.max(0, Math.min(260, car.speed + acceleration * dt));
  const travelSpeed = (car.speed + speed) / 2;
  // A held joystick points in screen space; keyboard steering turns incrementally.
  const direct = Number.isFinite(input.heading);
  let heading = Math.max(-1.1, Math.min(1.1, direct ? input.heading : car.heading + input.steering * 1.5 * Math.min(1, travelSpeed / 80) * dt));
  const direction = direct ? heading : (car.heading + heading) / 2;
  const y = Math.max(0, Math.min(maxY, car.y + Math.cos(direction) * travelSpeed * dt));
  let x = car.x + Math.sin(direction) * travelSpeed * dt;
  const road = roadPosition(y, width);
  const lane = road.roadWidth * 0.27;
  if (Math.abs(x - road.x) > lane) {
    x = Math.max(road.x - lane, Math.min(road.x + lane, x));
    if (direct && (x - car.x) * direction < 0) return { ...car, heading, speed: 0 };
    if (!direct) heading += (-road.angle * Math.PI / 180 - heading) * (1 - Math.exp(-4 * dt));
    speed *= Math.exp(-3 * dt);
  }
  return { x, y, heading, speed: y >= maxY ? 0 : speed };
}
