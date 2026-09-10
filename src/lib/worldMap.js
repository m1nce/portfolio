export const WORLD_SIZE = 800;
export const ROAD_WIDTH = 9;
export const SPAWN = { x: -190, z: 265, heading: -1.95, speed: 0 };
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const smooth = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };

// All three views use these same dense centerlines, including the scenic dead ends.
function road(checkpoints, closed = false) {
  const points = checkpoints.map(([x, z]) => ({ x, z }));
  const at = index => points[closed ? (index + points.length) % points.length : clamp(index, 0, points.length - 1)];
  const sampled = [];
  for (let segment = 0; segment < points.length - (closed ? 0 : 1); segment++) {
    const [a, b, c, d] = [at(segment - 1), at(segment), at(segment + 1), at(segment + 2)];
    const steps = Math.ceil(Math.hypot(c.x - b.x, c.z - b.z) / 2);
    for (let step = 0; step < steps; step++) {
      const t = step / steps, point = {};
      for (const axis of ['x', 'z']) point[axis] = 0.5 * (2 * b[axis] + (-a[axis] + c[axis]) * t
        + (2 * a[axis] - 5 * b[axis] + 4 * c[axis] - d[axis]) * t * t
        + (-a[axis] + 3 * b[axis] - 3 * c[axis] + d[axis]) * t * t * t);
      sampled.push(point);
    }
  }
  sampled.push({ ...points[closed ? 0 : points.length - 1] });
  return sampled;
}

export const ROADS = [
  road([[-190,265],[-290,220],[-320,150],[-295,50],[-225,-20],[-210,-105],[-270,-165],[-300,-235],[-250,-292],[-155,-315],[-110,-270],[-175,-220],[-120,-165],[-40,-190],[30,-250],[130,-280],[220,-225],[280,-140],[270,-50],[225,5],[283,70],[303,130],[300,185],[260,255],[130,275],[40,235],[-90,290]], true),
  road([[-225,-20],[-145,-50],[-105,-90],[-165,-118],[-145,-148],[-120,-165]]),
  road([[-225,-20],[-150,50],[-65,60],[-15,0],[-75,-50],[-40,-110],[25,-135],[85,-80],[150,-70],[185,-40],[225,5]]),
  road([[-190,265],[-120,220],[-70,145],[15,160],[40,115],[95,80],[155,115],[180,195],[130,275]]),
  road([[25,-135],[65,-185],[30,-250]]),
  road([[-300,-235],[-339,-253],[-350,-294]]),
  road([[130,-280],[169,-312],[181,-343]]),
  road([[180,195],[193,175],[194,148]]),
  road([[-70,145],[-100,120],[-130,128],[-149,153]])
];
export const DISCOVERIES = [
  { id: 'sunset', name: 'Sunset Point', place: 'Sunset Point', x: -350, z: -295, description: 'The road ends above the western ridge. A quiet turnout for the last light over the valley.' },
  { id: 'summit', name: 'Eagle Ridge', place: 'Eagle Ridge', x: 181, z: -345, description: 'A fire lookout above the switchbacks. Trace the roads you took to get here.' },
  { id: 'reservoir', name: 'Bluewater Overlook', place: 'Bluewater Overlook', x: 197, z: 146, description: 'A lakeside turnout tucked below the mountain pass. Take the canyon road for a slower way home.' },
  { id: 'picnic', name: 'Chaparral Hollow', place: 'Chaparral Hollow', x: -150, z: 155, description: 'A little picnic clearing at the end of an unmarked bend. No deadline, just a place to stop.' }
];
export const WATER = [{ x: 249, z: 153, rx: 31, rz: 47, level: 44 }];

export const LANDMARKS = [
  {
    id: 'takumi', name: 'Takumi', place: 'Sunday Garage', x: -199, z: 266, color: '#c7864b',
    description: 'Pull over for cars, side projects, and life outside the lab.',
    topics: [
      { label: 'The car', text: 'A stock NB2 Mazda MX-5 in British racing green is the starting point for this world. Minchan wanted visitors to explore his portfolio by taking the wheel.' },
      { label: 'Outside the lab', text: 'Outside of data science, Minchan enjoys basketball, Formula 1, lifting, and a good driver’s car.' },
      { label: 'This project', text: 'This portfolio brings together SvelteKit, interaction design, and an open world you can explore at your own pace.', link: 'https://github.com/m1nce/portfolio', linkLabel: 'View the source' }
    ]
  },
  {
    id: 'oak', name: 'Professor Oak', place: 'Field Station', x: -58, z: 68, color: '#718851',
    description: 'Ask about research, learning, and helping people work with AI.',
    topics: [
      { label: 'Research', text: 'Minchan studies Data Science at UC San Diego, focusing on human–computer interaction and machine learning. He explores how people and AI work together, including interfaces where experts help make data more reliable.' },
      { label: 'Teaching', text: 'At UC San Diego, Minchan has held office hours, created exam and quiz questions, beta-tested assignments, and improved automated grading for introductory data science.' },
      { label: 'BabyPandas', text: 'Minchan built approachable documentation for students learning data science with babypandas.', link: 'https://github.com/dsc-courses/bpd-reference', linkLabel: 'Explore BabyPandas' }
    ]
  },
  {
    id: 'hamilton', name: 'Hamilton', place: 'Lookout Pavilion', x: 129, z: -289, color: '#c4a257',
    description: 'A place to talk about work, experience, and what comes next.',
    topics: [
      { label: 'Experience', text: 'Minchan’s work spans industry, research, and teaching: electrical-load forecasting at Southern California Edison, document processing for LLM integration at EY, and business intelligence at UC San Diego.' },
      { label: 'Education', text: 'Minchan earned a B.S. in Data Science at UC San Diego and is pursuing an M.S. with a concentration in human–computer interaction and machine learning.' },
      { label: 'Say hello', text: 'Have an interesting problem, project, or road in mind? Get in touch with Minchan.', link: 'mailto:mcskim04@gmail.com', linkLabel: 'Write an email' }
    ]
  }
];

export function terrainHeight(x, z) {
  const hill = (cx, cz, height, width, depth) => height * Math.exp(-(((x - cx) / width) ** 2 + ((z - cz) / depth) ** 2));
  let height = 52 - z * 0.105
    + hill(-220, -220, 30, 220, 205) + hill(180, -200, 30, 200, 230)
    + hill(15, 30, 19, 125, 160) + hill(330, -60, 20, 140, 250)
    + 1.7 * Math.sin(x / 73) * Math.cos(z / 81);
  for (const water of WATER) {
    const radius = Math.hypot((x - water.x) / water.rx, (z - water.z) / water.rz);
    if (radius < 1.5) {
      const basin = water.level - 7 + smooth((radius - 0.65) / 0.35) * 7;
      height = basin + (height - basin) * smooth((radius - 1) / 0.5);
    }
  }
  const edge = Math.max(Math.abs(x), Math.abs(z));
  height += smooth((edge - WORLD_SIZE / 2 + 10) / 130) * (65 + 23 * Math.sin(x / 73) + 16 * Math.cos(z / 59));
  return height;
}

export function segmentDistance(x, z, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared ? clamp(((x - a.x) * dx + (z - a.z) * dz) / lengthSquared, 0, 1) : 0;
  return Math.hypot(x - a.x - dx * t, z - a.z - dz * t);
}
export function roadDistance(x, z) {
  let distance = Infinity;
  for (const points of ROADS) for (let i = 1; i < points.length; i++) distance = Math.min(distance, segmentDistance(x, z, points[i - 1], points[i]));
  return distance;
}

export const OBSTACLES = [
  { x: -211, z: 273, radius: 7, kind: 'garage' },
  { x: -53, z: 83, radius: 7, kind: 'field-station' },
  { x: 130, z: -307, radius: 8, kind: 'pavilion' },
  { x: -365, z: -278, radius: 7, kind: 'rock' },
  { x: -246, z: -220, radius: 9, kind: 'rock' },
  { x: -260, z: -60, radius: 8, kind: 'rock' },
  { x: 140, z: -185, radius: 11, kind: 'rock' },
  { x: 275, z: -215, radius: 8, kind: 'rock' },
  { x: 213, z: 141, radius: 3, kind: 'rock' },
  { x: 194, z: -350, radius: 4.5, kind: 'tower' },
  { x: -158, z: 166, radius: 2, kind: 'picnic-table' },
  { x: -357, z: -304, radius: 1.5, kind: 'bench' },
  { x: 205, z: 145, radius: 1.5, kind: 'bench' }
];
let seed = 231;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let attempts = 0; OBSTACLES.length < 440 && attempts < 3000; attempts++) {
  const tree = { x: (random() - .5) * (WORLD_SIZE - 45), z: (random() - .5) * (WORLD_SIZE - 45), radius: .65, kind: 'tree' };
  if (roadDistance(tree.x, tree.z) < 12) continue;
  if (WATER.some(water => Math.hypot((tree.x - water.x) / (water.rx + 6), (tree.z - water.z) / (water.rz + 6)) < 1)) continue;
  if ([SPAWN, ...LANDMARKS, ...DISCOVERIES].some(point => Math.hypot(point.x - tree.x, point.z - tree.z) < 20)) continue;
  if (OBSTACLES.some(point => Math.hypot(point.x - tree.x, point.z - tree.z) < point.radius + 5)) continue;
  OBSTACLES.push(tree);
}

// Sample the actual height field once. Compound paths keep both maps lightweight.
const cells = 80, cell = WORLD_SIZE / cells, half = WORLD_SIZE / 2;
const heights = Array.from({ length: cells + 1 }, (_, iz) => Array.from({ length: cells + 1 }, (_, ix) => terrainHeight(ix * cell - half, iz * cell - half)));
const palette = ['#c9c9a1', '#b8bf93', '#9fab80', '#889b76', '#748969', '#969079'];
export const MAP_TERRAIN = palette.map(fill => ({ fill, path: '' }));
for (let iz = 0; iz < cells; iz++) {
  let start = 0, band = 0;
  for (let ix = 0; ix <= cells; ix++) {
    const next = ix === cells ? -1 : clamp(Math.floor((heights[iz][ix] + heights[iz][ix + 1] + heights[iz + 1][ix] + heights[iz + 1][ix + 1]) / 4 / 22), 0, palette.length - 1);
    if (!ix) { band = next; continue; }
    if (next === band) continue;
    MAP_TERRAIN[band].path += `M${start * cell - half},${iz * cell - half}h${(ix - start) * cell}v${cell}h${-(ix - start) * cell}Z`;
    start = ix; band = next;
  }
}
export const MAP_CONTOURS = [];
for (let height = 20; height <= 160; height += 10) {
  let path = '';
  for (let iz = 0; iz < cells; iz++) for (let ix = 0; ix < cells; ix++) {
    const x = ix * cell - half, z = iz * cell - half;
    const corners = [[x,z,heights[iz][ix]], [x+cell,z,heights[iz][ix+1]], [x+cell,z+cell,heights[iz+1][ix+1]], [x,z+cell,heights[iz+1][ix]]];
    const crossings = [];
    for (let i = 0; i < 4; i++) {
      const a = corners[i], b = corners[(i + 1) % 4];
      if ((a[2] < height) === (b[2] < height)) continue;
      const t = (height - a[2]) / (b[2] - a[2]);
      crossings.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
    for (let i = 0; i + 1 < crossings.length; i += 2) path += `M${crossings[i][0].toFixed(1)},${crossings[i][1].toFixed(1)}L${crossings[i+1][0].toFixed(1)},${crossings[i+1][1].toFixed(1)}`;
  }
  if (path) MAP_CONTOURS.push({ height, path });
}
