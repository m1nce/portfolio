const clamp = (value, low, high) => Math.max(low, Math.min(high, Number.isFinite(value) ? value : low));

export function createEngineAudio() {
  let context, master, tone, rumble, filter, engineGain, noiseGain, noiseFilter;
  let nodes = [], sources = [];
  let muted = true, destroyed = false;
  let lastEvent = '', lastEventTime = 0, effectActive = false, effectAge = 0;

  function silence() {
    effectActive = false;
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
          const noise = context.createBufferSource();
          const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
          const samples = buffer.getChannelData(0);
          for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
          noise.buffer = buffer;
          noise.loop = true;
          noiseFilter = context.createBiquadFilter();
          noiseFilter.type = 'bandpass';
          noiseFilter.Q.value = 0.8;
          noiseGain = context.createGain();
          noiseGain.gain.value = 0;
          noise.connect(noiseFilter).connect(noiseGain).connect(master);
          nodes = [master, engineGain, filter, tone, rumble, rumbleGain, noise, noiseFilter, noiseGain];
          sources = [tone, rumble, noise];
          for (const source of sources) source.start();
        }
        if (context.state === 'suspended') await context.resume();
      } catch {
        // Audio permission/device failures must never interrupt driving.
        release();
      }
    },

    update({ rpm = 0, throttle = 0, engine, event = '', eventTime = 0, enabled = false, paused = false } = {}, dt = 0.016) {
      const freshEvent = event && (event !== lastEvent || eventTime > lastEventTime + 0.025);
      lastEvent = event;
      lastEventTime = eventTime;
      if (destroyed || muted || !enabled || paused || !context || context.state !== 'running') {
        silence();
        return;
      }
      if (freshEvent) { effectActive = true; effectAge = 0; }
      else effectAge += clamp(dt, 0, 0.05);
      if (!event || eventTime <= 0) effectActive = false;

      const target = (param, value, time = 0.035) => param.setTargetAtTime(value, context.currentTime, time);
      const stall = effectActive && event === 'stall' && effectAge < 0.3;
      const moneyShift = effectActive && event === 'money-shift' && effectAge < 0.18;
      const grind = effectActive && event === 'grind' && effectAge < 0.35;
      const running = engine === 'running';
      let frequency = clamp(rpm, 0, 10000) / 30; // Four-cylinder, four-stroke: two firings per revolution.
      let volume = running ? 0.085 + clamp(throttle, 0, 1) * 0.065 : 0;
      if (stall) {
        frequency = 12 + 24 * (1 - effectAge / 0.3);
        volume = 0.08 * (1 - effectAge / 0.3) * (0.55 + 0.45 * Math.cos(effectAge * 85));
      } else if (moneyShift) {
        frequency = 40 + 290 * (1 - effectAge / 0.18);
        volume = 0.07 * (1 - effectAge / 0.18);
      }
      target(tone.frequency, Math.max(10, frequency));
      target(rumble.frequency, Math.max(5, frequency / 2));
      target(filter.frequency, 230 + frequency * 4 + clamp(throttle, 0, 1) * 500);
      target(engineGain.gain, volume, 0.025);
      target(noiseFilter.frequency, moneyShift ? 2200 : 1150);
      target(noiseGain.gain, grind ? 0.13 * (0.75 + 0.25 * Math.sin(effectAge * 110)) : moneyShift ? 0.18 * (1 - effectAge / 0.18) : 0, 0.008);
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
