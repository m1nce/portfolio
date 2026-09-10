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
  async resume() { this.state = 'running'; }
  async close() { this.state = 'closed'; }
}

const unsupported = createEngineAudio();
await unsupported.start();
unsupported.update({ rpm: 2000, enabled: true });
unsupported.destroy();

globalThis.AudioContext = AudioContext;
const audio = createEngineAudio();
const state = { rpm: 850, throttle: 0, enabled: true, paused: false };
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
const engineGain = oscillator.connections[0].connections[0];
assert.ok(engineGain.gain.value > 0, 'Normal driving needs no engine-state or restart input to make sound');
audio.update({ ...state, paused: true });
assert.equal(output.gain.value, 0, 'Pausing silences output');
audio.update(state);
assert.ok(output.gain.value > 0, 'Resuming restores the engine tone');
audio.setMuted(true);
assert.equal(output.gain.value, 0, 'mute silences immediately without waiting for a frame');
audio.destroy();
assert.equal(context.state, 'closed');
assert.ok(context.nodes.every(node => node.disconnected), 'disconnect the entire graph');
assert.ok(context.nodes.filter(node => node.kind === 'oscillator').every(node => node.stopped), 'stop looping sources');
await audio.start();
assert.equal(contexts, 1, 'destroyed instances cannot reopen audio');
delete globalThis.AudioContext;
console.log('Engine audio: gesture activation, RPM pitch, mute/pause, cleanup passed.');
