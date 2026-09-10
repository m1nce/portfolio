import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const home = readFileSync(new URL('../../build/index.html', import.meta.url), 'utf8');
for (const id of ['work', 'about', 'contact']) assert.ok(home.includes(`id="${id}"`), `Missing portfolio section: ${id}`);
assert.match(home, /href="[^\"]*\/world\/"/, 'The portfolio must link to the playable world');
const worldPath = new URL('../../build/world/index.html', import.meta.url);
assert.ok(existsSync(worldPath), 'Free driving must have a separately accessible route');
const world = readFileSync(worldPath, 'utf8');
assert.match(world, /<canvas/, 'The world must contain a real rendering surface');
assert.doesNotMatch(world, /<header class="site-header/, 'The portfolio header must not obscure the game');
for (const label of ['Valley map', 'Pause', 'Driving joystick', 'Change camera']) assert.ok(world.includes(label), `Missing accessible game control: ${label}`);
assert.ok(world.includes('data-camera="overhead"'), 'The world must open in the overhead view');
for (const match of home.matchAll(/<img[^>]*src="([^"]+)"/g)) {
  const relative = match[1].replace(/^\/portfolio\//, '/').replace(/^\//, '');
  assert.ok(existsSync(new URL(`../../build/${relative}`, import.meta.url)), `Missing built image: ${match[1]}`);
}
console.log('Static routes checked: complete portfolio, playable world, controls and assets.');
