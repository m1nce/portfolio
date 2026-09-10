const clamp = (value, low, high) => Math.max(low, Math.min(high, Number.isFinite(value) ? value : low));

export function createEngineAudio() {
  let context, master, tone, rumble, filter, engineGain;
  let nodes = [], sources = [];
  let muted = true, destroyed = false;

  function silence() {
    if (!context || !master) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(0, context.currentTime);
  }

  function release() {
    for (const source of sources) { try { source.stop(); } catch {} }
    for (const node of nodes) node.disconnect();
    if (context && context.state !== 'closed') context.close().catch(() => {});
    nodes = []; sources = []; context = undefined;
  }

  return {
    async start() {
      if (destroyed) return;
      const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContext) return;
      try {
        if (!context) {
          context = new AudioContext();
          master = context.createGain();
          master.gain.value = 0;
          master.connect(context.destination);
          engineGain = context.createGain();
          engineGain.gain.value = 0;
          engineGain.connect(master);
          filter = context.createBiquadFilter();
          filter.type = 'lowpass';
          filter.Q.value = 0.7;
          filter.connect(engineGain);
          tone = context.createOscillator();
          tone.type = 'sawtooth';
          tone.connect(filter);
          rumble = context.createOscillator();
          rumble.type = 'sine';
          const rumbleGain = context.createGain();
          rumbleGain.gain.value = 0.35;
          rumble.connect(rumbleGain).connect(filter);
          nodes = [master, engineGain, filter, tone, rumble, rumbleGain];
          sources = [tone, rumble];
          for (const source of sources) source.start();
        }
        if (context.state === 'suspended') await context.resume();
      } catch {
        // Audio permission/device failures must never interrupt driving.
        release();
      }
    },

    update({ rpm = 850, throttle = 0, enabled = false, paused = false } = {}) {
      if (destroyed || muted || !enabled || paused || !context || context.state !== 'running') {
        silence();
        return;
      }
      const target = (param, value, time = 0.035) => param.setTargetAtTime(value, context.currentTime, time);
      const frequency = clamp(rpm, 0, 7000) / 30; // Two firings per revolution.
      const volume = 0.085 + clamp(throttle, 0, 1) * 0.065;
      target(tone.frequency, Math.max(10, frequency));
      target(rumble.frequency, Math.max(5, frequency / 2));
      target(filter.frequency, 230 + frequency * 4 + clamp(throttle, 0, 1) * 500);
      target(engineGain.gain, volume, 0.025);
      target(master.gain, 0.35);
    },

    setMuted(value) {
      muted = Boolean(value);
      if (muted) silence();
    },

    destroy() {
      destroyed = true;
      silence();
      release();
    }
  };
}
