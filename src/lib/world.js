export const WORLD_SIZE = 360;
export const ROAD_WIDTH = 9;
export const SPAWN = { x: -65, z: 80, heading: -0.78, speed: 0 };

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const wrapAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
const approach = (value, target, amount) => value + clamp(target - value, -amount, amount);

// Sample the road once so the renderer, map and driving surface share its bends.
function road(checkpoints, closed = false) {
  const points = checkpoints.map(([x, z]) => ({ x, z }));
  const at = (index) => points[closed ? (index + points.length) % points.length : clamp(index, 0, points.length - 1)];
  const sampled = [];
  for (let segment = 0; segment < points.length - (closed ? 0 : 1); segment++) {
    const [a, b, c, d] = [at(segment - 1), at(segment), at(segment + 1), at(segment + 2)];
    const steps = Math.ceil(Math.hypot(c.x - b.x, c.z - b.z) / 3);
    for (let step = 0; step < steps; step++) {
      const t = step / steps;
      const point = {};
      for (const axis of ['x', 'z']) {
        point[axis] = 0.5 * (2 * b[axis] + (-a[axis] + c[axis]) * t
          + (2 * a[axis] - 5 * b[axis] + 4 * c[axis] - d[axis]) * t * t
          + (-a[axis] + 3 * b[axis] - 3 * c[axis] + d[axis]) * t * t * t);
      }
      sampled.push(point);
    }
  }
  sampled.push({ ...points[closed ? 0 : points.length - 1] });
  return sampled;
}

export const ROADS = [
  road([[-65, 80], [-84, 35], [-92, -25], [-65, -90], [0, -115], [70, -88], [103, -28], [85, 45], [35, 95]], true),
  road([[-92, -25], [-32, -7], [15, 10], [85, 45]]),
  road([[15, 10], [30, -45], [0, -115]])
];

export const LANDMARKS = [
  {
    id: 'takumi', name: 'Takumi', place: 'Sunday Garage', x: -74, z: 81, color: '#c7864b',
    description: 'Pull over for cars, side projects, and life outside the lab.',
    topics: [
      { label: 'The car', text: 'A stock NB2 Mazda MX-5 in British racing green is the starting point for this world. Minchan wanted visitors to explore his portfolio by taking the wheel.' },
      { label: 'Outside the lab', text: 'Outside of data science, Minchan enjoys basketball, Formula 1, lifting, and a good driver’s car.' },
      { label: 'This project', text: 'This portfolio brings together SvelteKit, interaction design, and an open world you can explore at your own pace.', link: 'https://github.com/m1nce/portfolio', linkLabel: 'View the source' }
    ]
  },
  {
    id: 'oak', name: 'Professor Oak', place: 'Field Station', x: 25, z: -43, color: '#718851',
    description: 'Ask about research, learning, and helping people work with AI.',
    topics: [
      { label: 'Research', text: 'Minchan studies Data Science at UC San Diego, focusing on human–computer interaction and machine learning. He explores how people and AI work together, including interfaces where experts help make data more reliable.' },
      { label: 'Teaching', text: 'At UC San Diego, Minchan has held office hours, created exam and quiz questions, beta-tested assignments, and improved automated grading for introductory data science.' },
      { label: 'BabyPandas', text: 'Minchan built approachable documentation for students learning data science with babypandas.', link: 'https://github.com/dsc-courses/bpd-reference', linkLabel: 'Explore BabyPandas' }
    ]
  },
  {
    id: 'hamilton', name: 'Hamilton', place: 'Lookout Pavilion', x: 111, z: -22, color: '#c4a257',
    description: 'A place to talk about work, experience, and what comes next.',
    topics: [
      { label: 'Experience', text: 'Minchan’s work spans industry, research, and teaching: electrical-load forecasting at Southern California Edison, document processing for LLM integration at EY, and business intelligence at UC San Diego.' },
      { label: 'Education', text: 'Minchan earned a B.S. in Data Science at UC San Diego and is pursuing an M.S. with a concentration in human–computer interaction and machine learning.' },
      { label: 'Say hello', text: 'Have an interesting problem, project, or road in mind? Get in touch with Minchan.', link: 'mailto:mcskim04@gmail.com', linkLabel: 'Write an email' }
    ]
  }
];

export function terrainHeight(x, z) {
  const hill = (cx, cz, height, spread) => height * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / spread);
  return 3 + Math.sin(x * 0.026) * 1.3 + Math.cos(z * 0.021) * 1.2
    + hill(-142, -135, 19, 2100) + hill(145, -130, 16, 2700)
    + hill(-150, 125, 11, 1800) + hill(145, 135, 13, 2500);
}

function segmentDistance(x, z, a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared ? clamp(((x - a.x) * dx + (z - a.z) * dz) / lengthSquared, 0, 1) : 0;
  return Math.hypot(x - a.x - dx * t, z - a.z - dz * t);
}

export function roadDistance(x, z) {
  let distance = Infinity;
  for (const points of ROADS) {
    for (let index = 1; index < points.length; index++) {
      distance = Math.min(distance, segmentDistance(x, z, points[index - 1], points[index]));
    }
  }
  return distance;
}

export const OBSTACLES = [
  { x: -87, z: 84, radius: 7, kind: 'garage' },
  { x: 43, z: -43, radius: 7, kind: 'field-station' },
  { x: 127, z: -27, radius: 8, kind: 'pavilion' },
  { x: -135, z: -110, radius: 4, kind: 'rock' },
  { x: 145, z: 60, radius: 3.5, kind: 'rock' },
  { x: 58, z: 137, radius: 4.5, kind: 'rock' }
];
let treeSeed = 231;
const random = () => ((treeSeed = (treeSeed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let attempts = 0; OBSTACLES.length < 76 && attempts < 1000; attempts++) {
  const tree = { x: random() * 310 - 155, z: random() * 310 - 155, radius: 0.65, kind: 'tree' };
  if (roadDistance(tree.x, tree.z) < 10) continue;
  if ([SPAWN, ...LANDMARKS].some((point) => Math.hypot(point.x - tree.x, point.z - tree.z) < 18)) continue;
  if (OBSTACLES.some((point) => Math.hypot(point.x - tree.x, point.z - tree.z) < point.radius + 5)) continue;
  OBSTACLES.push(tree);
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
  const targetSpeed = input.brake ? 0 : throttle * (throttle < 0 ? 9 : onRoad ? 26 : 15);
  const rate = input.brake ? 28 : speed * throttle < 0 ? 26 : throttle === 0 ? 7 : 12;
  const nextSpeed = approach(speed, targetSpeed, rate * dt);
  const distance = (speed + nextSpeed) * 0.5 * dt;
  const travelHeading = oldHeading + wrapAngle(heading - oldHeading) * 0.5;
  const next = { x: x + Math.sin(travelHeading) * distance, z: z - Math.cos(travelHeading) * distance };
  // ponytail: circle colliders suit this small world; use mesh colliders for detailed interiors.
  const collision = OBSTACLES.some((obstacle) => segmentDistance(obstacle.x, obstacle.z, state, next) < obstacle.radius + 1.25);
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
