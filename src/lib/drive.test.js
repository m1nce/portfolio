import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { advanceCar, driveState, roadPosition } from './drive.js';

assert.deepEqual(driveState(0, 1000), { progress: 0, distance: 0 });
assert.deepEqual(driveState(500, 1000), { progress: 0.5, distance: 500 });
assert.deepEqual(driveState(2000, 1000), { progress: 1, distance: 1000 });
assert.deepEqual(driveState(-20, 1000), { progress: 0, distance: 0 });
assert.deepEqual(driveState(100, 0), { progress: 0, distance: 0 });
assert.deepEqual(driveState(500, 1000, true), { progress: 0, distance: 0 });
assert.deepEqual(driveState(900, 1000, true, driveState(500, 1000)), { progress: 0.5, distance: 500 });
assert.ok(driveState(300, 1000).distance < driveState(500, 1000).distance);
console.log('Journey checks passed: scroll bounds, reverse travel, and reduced motion.');

for (const width of [86, 105, 550, 900]) {
  for (let y = 0; y <= 6000; y += 20) {
    const point = roadPosition(y, width);
    assert.ok(point.x >= width * 0.27 && point.x <= width * 0.73, 'Road must stay within the left landscape');
    assert.ok(point.x - point.roadWidth / 2 - 11 >= 0 && point.x + point.roadWidth / 2 + 11 <= width, 'Both road shoulders must fit even on narrow phones');
    const slope = (roadPosition(y + 0.01, width).x - roadPosition(y - 0.01, width).x) / 0.02;
    assert.ok(Math.abs(point.angle + Math.atan(slope) * 180 / Math.PI) < 0.00001, 'Car heading must follow the rendered road at every viewport width');
  }
}
console.log('Road checks passed: lane bounds and car heading through every bend on phone and desktop.');

const idle = { throttle: false, brake: false, steering: 0 };
const gas = { ...idle, throttle: true };
const start = { x: roadPosition(1000, 550).x, y: 1000, heading: 0, speed: 0 };
const moving = advanceCar(start, gas, 0.05, 550, 6000);
assert.ok(moving.speed > 0 && moving.y > start.y, 'Throttle must accelerate and travel forward');
assert.equal(start.speed, 0, 'Movement must not mutate its input');
assert.ok(advanceCar(moving, idle, 0.05, 550, 6000).speed < moving.speed, 'Releasing throttle must coast to a stop');
assert.equal(advanceCar(moving, { ...gas, brake: true }, 0.05, 550, 6000).speed, 0, 'Braking must take priority over throttle');
for (const steering of [-1, 1]) {
  const turned = advanceCar({ ...start, speed: 100 }, { ...gas, steering }, 0.05, 550, 6000);
  assert.ok(turned.heading * steering > 0 && (turned.x - start.x) * steering > 0, 'Steering must change both heading and lateral position');
}
for (const dt of [0, -1, NaN, Infinity]) assert.deepEqual(advanceCar(moving, gas, dt, 550, 6000), moving, 'Invalid time steps must not move the car');
assert.deepEqual(advanceCar(moving, gas, 10, 550, 6000), advanceCar(moving, gas, 0.05, 550, 6000), 'Resuming a hidden tab must not jump along the road');
const finished = advanceCar({ ...moving, y: 5999, speed: 260 }, gas, 0.05, 550, 6000);
assert.equal(finished.y, 6000, 'The car must not travel past the route end');
assert.equal(finished.speed, 0, 'The car must stop at the route end');

for (const width of [86, 105, 550, 900]) {
  for (const steering of [-1, 0, 1]) {
    let car = { x: roadPosition(0, width).x, y: 0, heading: 0, speed: 0 };
    for (let frame = 0; frame < 3600; frame++) {
      car = advanceCar(car, { ...gas, steering }, 1 / 60, width, 6000);
      const road = roadPosition(car.y, width);
      assert.ok(Object.values(car).every(Number.isFinite), 'Repeated driving must remain finite');
      assert.ok(car.y >= 0 && car.y <= 6000 && car.speed >= 0 && car.speed <= 260, 'Travel and speed must stay bounded');
      assert.ok(Math.abs(car.x - road.x) <= road.roadWidth * 0.27 + 1e-8, 'Shoulder assistance must keep the car on the road');
    }
  }
}
const journeys = [60, 120].map((fps) => {
  let car = { x: roadPosition(0, 550).x, y: 0, heading: 0, speed: 0 };
  for (let frame = 0; frame < fps * 12; frame++) car = advanceCar(car, gas, 1 / fps, 550, 6000);
  return car;
});
assert.ok(Math.abs(journeys[0].y - journeys[1].y) < 30, 'Driving distance must be similar on 60 Hz and 120 Hz displays');
assert.ok(Math.abs(journeys[0].x - journeys[1].x) < 20, 'Handling must be similar on 60 Hz and 120 Hz displays');
console.log('Driving checks passed: acceleration, coasting, braking, steering, lane limits, route end, and frame-rate stability.');

const home = readFileSync(new URL('../../build/index.html', import.meta.url), 'utf8');
assert.doesNotMatch(home.match(/<main[^>]*>/)[0], /inner-page/, 'Prerendered home must use the immersive layout before hydration');
for (const id of ['work', 'about', 'contact']) assert.ok(home.includes('id="' + id + '"'), 'Missing navigation destination: ' + id);
assert.equal((home.match(/data-landmark=/g) || []).length, 4, 'All four sections must connect to the mountain pass');
assert.doesNotMatch(home, /nb2-cockpit|windshield-world/, 'The homepage must use the exterior journey');
for (const match of home.matchAll(/<img[^>]*src="([^"]+)"/g)) {
  assert.ok(existsSync(new URL(match[1], new URL('../../build/index.html', import.meta.url))), 'Missing built image: ' + match[1]);
}
console.log('Static build checks passed: homepage layout, navigation destinations, and image paths.');
