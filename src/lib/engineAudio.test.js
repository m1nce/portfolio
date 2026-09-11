import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEngineAudio } from './engineAudio.js';

// A short rev ramp used to repeat a nearly fourfold volume surge at steady RPM.
const revLoop = await readFile(new URL('../../static/audio/mx5-high.wav', import.meta.url));
assert.equal(revLoop.toString('ascii', 36, 40), 'data');
const samples = Array.from({ length: revLoop.readUInt32LE(40) / 2 }, (_, index) => revLoop.readInt16LE(44 + index * 2) / 32768);
const windowSize = Math.round(revLoop.readUInt32LE(24) * 0.1);
const levels = [];
for (let start = 0; start + windowSize <= samples.length; start += windowSize) {
  levels.push(Math.sqrt(samples.slice(start, start + windowSize).reduce((sum, value) => sum + value * value, 0) / windowSize));
}
assert.ok(Math.max(...levels) / Math.min(...levels) < 2, 'steady revs must not repeat a large volume surge');
assert.ok(samples.length / revLoop.readUInt32LE(24) >= 2, 'use a sustained recording instead of a fraction of a rev ramp');

let context, contexts = 0, requests = [];
const originalFetch = globalThis.fetch;
class AudioContext {
  constructor() {
    contexts++;
    context = this;
    this.nodes = [];
    this.currentTime = 1;
    this.state = 'suspended';
    this.destination = {};
  }
  node(kind) {
    const param = () => ({ value: 0, setTargetAtTime(value) { this.value = value; }, setValueAtTime(value) { this.value = value; }, cancelScheduledValues() {} });
    const node = { kind, gain: param(), frequency: param(), Q: param(), playbackRate: param(), connections: [], connect(target) { this.connections.push(target); return target; }, disconnect() { this.disconnected = true; }, start() { this.started = true; }, stop() { this.stopped = true; this.onended?.(); } };
    this.nodes.push(node);
    return node;
  }
  createGain() { return this.node('gain'); }
  createBufferSource() { return this.node('sample'); }
  createBiquadFilter() { return this.node('filter'); }
  async decodeAudioData(data) {
    const bytes = Buffer.from(data);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', 'samples are browser-compatible PCM WAV files');
    assert.equal(bytes.readUInt16LE(22), 1);
    assert.equal(bytes.readUInt32LE(24), 22050);
    assert.ok(bytes.length > 15000 && bytes.length < 160000, 'short local samples keep loading light');
    return { duration: (bytes.length - 44) / 44100 };
  }
  async resume() { this.state = 'running'; }
  async close() { this.state = 'closed'; }
}

const unsupported = createEngineAudio();
await unsupported.start();
unsupported.update({ rpm: 2000, enabled: true });
unsupported.destroy();
globalThis.AudioContext = AudioContext;
globalThis.fetch = async url => {
  requests.push(url);
  assert.ok(url.startsWith('/portfolio/audio/'), 'honor the GitHub Pages base path');
  const bytes = await readFile(new URL('../../static/audio/' + url.split('/').at(-1), import.meta.url));
  return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
};
const audio = createEngineAudio('/portfolio');
const state = { rpm: 850, throttle: 0, engine: 'running', enabled: true };
audio.update(state);
assert.equal(contexts, 0, 'render updates must not create an audio context');
assert.equal(requests.length, 0, 'samples load only after opting into audio');
await Promise.all([audio.start(), audio.start()]);
await audio.start();
assert.equal(contexts, 1, 'concurrent gestures reuse one audio context');
assert.equal(requests.length, 4, 'each recording is fetched only once');
const output = context.nodes.find(node => node.connections.includes(context.destination));
const loops = context.nodes.filter(node => node.kind === 'sample' && node.loop);
assert.equal(loops.length, 2, 'idle and sustained stock rev recordings cover the engine');
assert.ok(loops.every(node => node.started && node.buffer));
audio.update(state);
assert.equal(output.gain.value, 0, 'audio stays muted by default');
audio.setMuted(false);
audio.update(state);
const idlePitch = loops[0].playbackRate.value;
assert.ok(output.gain.value > 0);
assert.ok(loops[0].connections[0].gain.value > loops[1].connections[0].gain.value);
audio.update({ ...state, rpm: 6000, throttle: 1 });
assert.ok(loops[0].playbackRate.value > idlePitch, 'sample pitch follows revs');
assert.ok(loops[1].connections[0].gain.value > loops[0].connections[0].gain.value, 'high revs crossfade into the stock recording');
for (let rpm = 850; rpm <= 7500; rpm += 50) {
  audio.update({ ...state, rpm, throttle: 1 });
  const power = loops.reduce((sum, node) => sum + node.connections[0].gain.value ** 2, 0);
  assert.ok(Math.abs(power - 0.6 ** 2) < 1e-9, 'the RPM transition must not introduce a volume hole or boost');
}
audio.update({ ...state, rpm: 4360 });
assert.equal(loops[1].playbackRate.value, 1, 'the measured stock recording plays at its native pitch near 4360 RPM');
audio.update({ ...state, engine: 'stalled', rpm: 0 });
assert.ok(loops.every(node => node.connections[0].gain.value === 0), 'a stalled engine has no running loop');
let shots = context.nodes.filter(node => node.kind === 'sample' && !node.loop);
assert.equal(shots.length, 1, 'stall plays the real engine shutoff once');
assert.ok(Math.abs(shots[0].buffer.duration - 0.65) < 0.01, 'stall selects the shutoff recording');
audio.update({ ...state, engine: 'stalled', rpm: 0 });
assert.equal(context.nodes.filter(node => node.kind === 'sample' && !node.loop).length, 1);
audio.update({ ...state, engine: 'starting', rpm: 250 });
audio.update({ ...state, engine: 'starting', rpm: 250 });
assert.equal(context.nodes.filter(node => node.kind === 'sample' && !node.loop).length, 2, 'ignition plays once per state transition');
assert.ok(Math.abs(context.nodes.filter(node => node.kind === 'sample' && !node.loop)[1].buffer.duration - 1.1) < 0.01, 'ignition selects the starter recording');
audio.update({ ...state, paused: true });
assert.equal(output.gain.value, 0, 'pausing silences output');
assert.ok(context.nodes.filter(node => node.kind === 'sample' && !node.loop).every(node => node.stopped), 'pause cancels transient sounds');
audio.update(state);
assert.ok(output.gain.value > 0, 'resuming restores the running loops');
audio.setMuted(true);
assert.equal(output.gain.value, 0);
audio.destroy();
assert.equal(context.state, 'closed');
assert.ok(context.nodes.every(node => node.disconnected), 'disconnect the whole graph');
assert.ok(context.nodes.filter(node => node.kind === 'sample').every(node => node.stopped), 'stop all audio sources');
await audio.start();
assert.equal(contexts, 1, 'destroyed instances cannot reopen audio');

const finishFetch = [];
globalThis.fetch = () => new Promise(resolve => { finishFetch.push(resolve); });
const pending = createEngineAudio();
const starting = pending.start();
await Promise.resolve();
pending.destroy();
for (const finish of finishFetch) finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
await starting;
assert.equal(context.state, 'closed');
assert.equal(context.nodes.filter(node => node.kind === 'sample').length, 0, 'a late download cannot create sources after destroy');
globalThis.fetch = async () => ({ ok: false });
const failed = createEngineAudio();
await failed.start();
failed.setMuted(false);
assert.doesNotThrow(() => failed.update(state), 'network failures cannot interrupt driving');
failed.destroy();
delete globalThis.AudioContext;
globalThis.fetch = originalFetch;
console.log('Sampled engine audio: local assets, RPM/load blending, ignition/stall transitions, mute/pause and cleanup passed.');
