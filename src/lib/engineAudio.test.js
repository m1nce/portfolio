import assert from 'node:assert/strict';
import { createEngineAudio } from './engineAudio.js';

// Web Audio is browser-only; a tiny graph records the output controls and cleanup.
let context;
let contexts = 0;
class AudioContext {
  constructor() {
    contexts++;
    context = this;
    this.nodes = [];
    this.currentTime = 1;
    this.sampleRate = 8000;
    this.state = 'suspended';
    this.destination = {};
  }
  node(kind) {
    const param = () => ({ value: 0, setTargetAtTime(value) { this.value = value; }, setValueAtTime(value) { this.value = value; }, cancelScheduledValues() {} });
    const node = { kind, gain: param(), frequency: param(), Q: param(), connections: [], connect(target) { this.connections.push(target); return target; }, disconnect() { this.disconnected = true; }, start() {}, stop() { this.stopped = true; } };
    this.nodes.push(node);
    return node;
  }
  createGain() { return this.node('gain'); }
  createOscillator() { return this.node('oscillator'); }
  createBiquadFilter() { return this.node('filter'); }
  createBufferSource() { return this.node('noise'); }
  createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
  async resume() { this.state = 'running'; }
  async close() { this.state = 'closed'; }
}

const unsupported = createEngineAudio();
await unsupported.start();
unsupported.update({ engine: 'running', rpm: 2000, enabled: true });
unsupported.destroy();

globalThis.AudioContext = AudioContext;
const audio = createEngineAudio();
const state = { engine: 'running', rpm: 850, throttle: 0, enabled: true, paused: false, event: '', eventTime: 0 };
audio.update(state, 0.016);
assert.equal(contexts, 0, 'render updates must not create an audio context');
await audio.start();
await audio.start();
assert.equal(contexts, 1, 'reuse one audio context across gestures');
const output = context.nodes.find(node => node.connections.includes(context.destination));
audio.setMuted(false);
audio.update(state, 0.016);
assert.ok(output.gain.value > 0, 'enabled engine reaches the speaker');
const oscillator = context.nodes.find(node => node.kind === 'oscillator');
const idlePitch = oscillator.frequency.value;
audio.update({ ...state, rpm: 6000, throttle: 1 }, 0.016);
assert.ok(oscillator.frequency.value > idlePitch * 3, 'revs change engine pitch');
audio.update({ ...state, paused: true, event: 'grind', eventTime: 0.5 }, 0.016);
assert.equal(output.gain.value, 0, 'pausing silences output');
const noise = context.nodes.find(node => node.kind === 'noise');
const noiseGain = noise.connections[0].connections[0];
audio.update({ ...state, event: 'grind', eventTime: 0.4 }, 0.016);
assert.equal(noiseGain.gain.value, 0, 'resuming does not replay a stale grind');
audio.update({ ...state, event: 'grind', eventTime: 0.8 }, 0.016);
assert.ok(noiseGain.gain.value > 0, 'a fresh grind produces a scrape');
const engineGain = oscillator.connections[0].connections[0];
audio.update({ ...state, engine: 'stalled', rpm: 0, event: 'stall', eventTime: 1 }, 0.016);
assert.ok(engineGain.gain.value > 0, 'stall has a brief engine sputter');
for (let i = 1; i <= 8; i++) audio.update({ ...state, engine: 'stalled', rpm: 0, event: 'stall', eventTime: 1 - i * 0.05 }, 0.05);
assert.equal(engineGain.gain.value, 0, 'a stalled engine stops making engine sound');
audio.update({ ...state, engine: 'damaged', event: 'money-shift', eventTime: 1 }, 0.016);
assert.ok(noiseGain.gain.value > 0, 'overrev damage has a mechanical cut');
for (let i = 1; i <= 5; i++) audio.update({ ...state, engine: 'damaged', event: 'money-shift', eventTime: 1 - i * 0.05 }, 0.05);
assert.equal(engineGain.gain.value, 0, 'damaged engine falls silent after the cut');
assert.equal(noiseGain.gain.value, 0);
audio.setMuted(true);
assert.equal(output.gain.value, 0, 'mute silences immediately without waiting for a frame');
audio.destroy();
assert.equal(context.state, 'closed');
assert.ok(context.nodes.every(node => node.disconnected), 'disconnect the entire graph');
assert.ok(context.nodes.filter(node => ['oscillator', 'noise'].includes(node.kind)).every(node => node.stopped), 'stop looping sources');
await audio.start();
assert.equal(contexts, 1, 'destroyed instances cannot reopen audio');
delete globalThis.AudioContext;
console.log('Engine audio: gesture activation, RPM pitch, mute/pause, event freshness, cleanup passed.');
