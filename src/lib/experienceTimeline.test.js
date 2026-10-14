import assert from 'node:assert/strict';
import { experienceTimeline } from './experienceTimeline.js';
import { experiences } from './data/experience.js';
const timeline = experienceTimeline(experiences, new Date('2026-10-13T12:00:00Z'));
assert.equal(timeline.startYear, 2022);
assert.equal(timeline.endYear, 2027);
const research = timeline.entries.find(entry => entry.type === 'research');
assert.ok(Math.abs(research.width - 13 / 72 * 100) < 0.0001);
const later = experienceTimeline(experiences, new Date('2028-01-01T00:00:00Z'));
assert.equal(later.endYear, 2028);
for (const entry of later.entries) {
  assert.ok(Number.isFinite(entry.left) && entry.left >= 0);
  assert.ok(entry.width > 0 && entry.left + entry.width <= 100.0001);
}
const oneMonth = experienceTimeline([{ dates: 'March 2026 - Mar 2026' }]);
assert.ok(Math.abs(oneMonth.entries[0].width - 100 / 12) < 0.0001);
console.log('Timeline bounds, current roles, future dates and same-month roles checked.');
