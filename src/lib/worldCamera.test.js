import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CAMERA_VIEWS, cameraPose, cameraTerrainHeight } from './worldCamera.js';
import { WORLD_SIZE, SPAWN, LANDMARKS, terrainHeight } from './world.js';

const yaw = (pose) => Math.atan2(pose.target.x - pose.position.x, -(pose.target.z - pose.position.z));
const angleDifference = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const pitch = (pose) => Math.atan2(pose.position.y - pose.target.y, Math.hypot(pose.position.x - pose.target.x, pose.position.z - pose.target.z));
function project(pose, aspect, point) {
  const camera = new THREE.PerspectiveCamera(pose.fov, aspect, 0.2, 650);
  camera.position.set(pose.position.x, pose.position.y, pose.position.z);
  camera.lookAt(pose.target.x, pose.target.y, pose.target.z);
  camera.updateMatrixWorld();
  return new THREE.Vector3(point.x, terrainHeight(point.x, point.z) + 1.2, point.z).project(camera);
}

assert.deepEqual(CAMERA_VIEWS.map(({ id }) => id), ['overhead', 'high-chase', 'chase']);
const car = Object.freeze({ ...SPAWN });
assert.deepEqual(cameraPose(car, 16 / 9), cameraPose(car, 16 / 9, 'overhead'));
assert.deepEqual(cameraPose(car, 16 / 9, 'unknown'), cameraPose(car, 16 / 9));
for (const aspect of [0.4, 390 / 844, 1, 16 / 9, 2.3]) {
  for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    for (const view of CAMERA_VIEWS) {
      const pose = cameraPose({ ...car, heading }, aspect, view.id);
      assert.ok([...Object.values(pose.position), ...Object.values(pose.target), pose.fov].every(Number.isFinite));
      assert.ok(Math.abs(angleDifference(yaw(pose), view.id === 'overhead' ? 0 : heading)) < 1e-9, 'Camera direction matches its preset');
      if (view.id === 'overhead') assert.ok(pitch(pose) > 78 * Math.PI / 180, 'Overhead sees roofs, rather than a side view');
      const projectedCar = project(pose, aspect, car);
      assert.ok(Math.abs(projectedCar.x) < 0.65 && Math.abs(projectedCar.y) < 0.7, 'Car stays in the usable frame');
      const screenRight = project(pose, aspect, { x: pose.target.x + Math.cos(yaw(pose)), z: pose.target.z + Math.sin(yaw(pose)) });
      const center = project(pose, aspect, pose.target);
      assert.ok(screenRight.x > center.x, 'Camera yaw supports screen-relative joystick right');
    }
  }
}
for (const x of [-WORLD_SIZE / 2 + 2, 0, WORLD_SIZE / 2 - 2]) for (const z of [-WORLD_SIZE / 2 + 2, 0, WORLD_SIZE / 2 - 2]) for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) for (const view of CAMERA_VIEWS) {
  const pose = cameraPose({ x, z, heading, speed: 0 }, 390 / 844, view.id);
  assert.ok(pose.position.y >= cameraTerrainHeight(pose.position.x, pose.position.z) + 5, 'Camera clears valley terrain and perimeter ridges');
}
for (const npc of LANDMARKS) {
  const state = { x: npc.x + 9, z: npc.z, heading: 0, speed: 0 };
  const pose = cameraPose(state, 390 / 844);
  for (const point of [state, npc]) {
    const ndc = project(pose, 390 / 844, point);
    assert.ok(Math.abs(ndc.x) < 0.9 && Math.abs(ndc.y) < 0.8, 'Phone overhead includes car and nearby NPC');
  }
}
assert.ok(pitch(cameraPose(car, 16 / 9, 'high-chase')) > pitch(cameraPose(car, 16 / 9, 'chase')));
assert.deepEqual(car, SPAWN, 'Camera presets do not move the vehicle');
console.log('Camera preset and projection checks passed.');
