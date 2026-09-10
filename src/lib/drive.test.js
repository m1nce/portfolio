import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { driveState, roadPosition } from './drive.js';

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

const home = readFileSync(new URL('../../build/index.html', import.meta.url), 'utf8');
assert.doesNotMatch(home.match(/<main[^>]*>/)[0], /inner-page/, 'Prerendered home must use the immersive layout before hydration');
for (const id of ['work', 'about', 'contact']) assert.ok(home.includes('id="' + id + '"'), 'Missing navigation destination: ' + id);
assert.equal((home.match(/data-landmark=/g) || []).length, 4, 'All four sections must connect to the mountain pass');
assert.doesNotMatch(home, /nb2-cockpit|windshield-world/, 'The homepage must use the exterior journey');
for (const match of home.matchAll(/<img[^>]*src="([^"]+)"/g)) {
  assert.ok(existsSync(new URL(match[1], new URL('../../build/index.html', import.meta.url))), 'Missing built image: ' + match[1]);
}
console.log('Static build checks passed: homepage layout, navigation destinations, and image paths.');
