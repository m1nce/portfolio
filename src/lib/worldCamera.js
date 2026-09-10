import { LANDMARKS, terrainHeight } from './world.js';

export const CAMERA_VIEWS = [
  { id: 'overhead', label: 'Overhead' },
  { id: 'high-chase', label: 'High chase' },
  { id: 'chase', label: 'Chase' }
];

export const cameraTerrainHeight = terrainHeight;

export function cameraPose(state, aspect, view = 'overhead') {
  const phone = aspect < 0.8;
  const h = terrainHeight(state.x, state.z);
  const target = { x: state.x, y: h + 0.9, z: state.z };
  let heading = 0, height = phone ? 51 : 42, distance = phone ? 8 : 6.5;
  let fov = phone ? 48 : 43;
  if (view === 'high-chase' || view === 'chase') {
    heading = state.heading;
    const high = view === 'high-chase';
    height = high ? (phone ? 32 : 29) : (phone ? 12 : 9);
    distance = high ? (phone ? 27 : 23) : (phone ? 27 : 22);
    fov = phone ? 52 : 46;
    target.x += Math.sin(heading) * 5;
    target.z -= Math.cos(heading) * 5;
  } else if (phone) {
    let nearby, distance = 20;
    for (const landmark of LANDMARKS) {
      const candidate = Math.hypot(landmark.x - state.x, landmark.z - state.z);
      if (candidate < distance) { nearby = landmark; distance = candidate; }
    }
    if (nearby) {
      target.x += Math.max(-4, Math.min(4, (nearby.x - state.x) * 0.35));
      target.z += Math.max(-3, Math.min(3, (nearby.z - state.z) * 0.25));
    }
  }
  const position = {
    x: target.x - Math.sin(heading) * distance,
    y: h + height,
    z: target.z + Math.cos(heading) * distance
  };
  position.y = Math.max(position.y, cameraTerrainHeight(position.x, position.z) + 6);
  return { position, target, fov };
}
