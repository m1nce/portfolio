import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createNB2 } from './nb2Model.js';

const { car, wheels } = createNB2();
car.updateMatrixWorld(true);
const bounds = new THREE.Box3().setFromObject(car);
const size = bounds.getSize(new THREE.Vector3());
assert.ok(size.z > 3.8 && size.z < 4.3, 'Stock roadster length stays close to four metres');
assert.ok(size.x > 1.7 && size.x < 2.05, 'Body and mirrors retain narrow roadster proportions');
assert.ok(size.y > 1.1 && size.y < 1.4, 'Seats and windshield do not make a tall toy car');
assert.equal(wheels.length, 4);
assert.equal(wheels.filter(({ front }) => front).length, 2);
let triangles = 0, meshCount = 0;
car.traverse((object) => {
  if (!object.isMesh) return;
  meshCount++;
  const positions = object.geometry.attributes.position;
  assert.ok(Array.from(positions.array).every(Number.isFinite), 'Geometry must not contain NaN vertices');
  triangles += (object.geometry.index?.count ?? positions.count) / 3;
});
assert.ok(triangles < 40000, `Phone budget: ${triangles} triangles`);
assert.ok(meshCount < 35, 'Details are batched for phone rendering');
for (const { wheel, steering, front } of wheels) {
  assert.equal(wheel.parent, steering);
  assert.equal(front, steering.position.z < 0, 'Nose points toward local -Z');
  const tireBounds = new THREE.Box3().setFromObject(wheel).getSize(new THREE.Vector3());
  assert.ok(tireBounds.x < tireBounds.y * 0.6, 'Tires roll around the renderer’s X axis');
}
const ray = new THREE.Raycaster(new THREE.Vector3(-0.3, 2, -0.1), new THREE.Vector3(0, -1, 0));
const body = car.getObjectByName('NB2 body');
const bodyHits = ray.intersectObject(body, true);
assert.ok(bodyHits.every(({ point }) => point.y < 0.4), 'The cockpit is an actual opening in the body');
for (const z of [-1.13, 1.13]) {
  const archRay = new THREE.Raycaster(new THREE.Vector3(-2, 0.5, z), new THREE.Vector3(1, 0, 0));
  assert.equal(archRay.intersectObject(body, true).length, 0, 'Wheel arch openings do not cut through the tires');
}
console.log(`NB2 model checks passed (${Math.round(triangles).toLocaleString()} triangles).`);
