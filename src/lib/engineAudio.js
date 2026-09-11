const clamp = (value, low, high) => Math.max(low, Math.min(high, Number.isFinite(value) ? value : low));
const recordings = ['mx5-idle.wav', 'mx5-high.wav', 'mx5-start.wav', 'mx5-stop.wav'];
// Approximate firing-rate references for the adapted recording bands.
const referenceRpm = [1250, 4360];

export function createEngineAudio(base = '') {
  let context, master, filter, buffers, loading;
  let loops = [], muted = true, destroyed = false, previousEngine = 'running';
  const nodes = new Set(), sources = new Set(), shots = new Set();
  const request = new AbortController();
  const remember = node => { nodes.add(node); return node; };

  function stopShots() {
    for (const source of shots) { try { source.stop(); } catch {} }
    shots.clear();
  }

  function silence() {
    if (context && master) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(0, context.currentTime);
    }
    stopShots();
  }

  function release() {
    request.abort();
    for (const source of sources) { try { source.stop(); } catch {} }
    for (const node of nodes) node.disconnect();
    if (context && context.state !== 'closed') context.close().catch(() => {});
    nodes.clear(); sources.clear(); shots.clear(); loops = [];
    context = master = filter = buffers = undefined;
  }

  function oneShot(buffer) {
    stopShots();
    const source = remember(context.createBufferSource());
    const gain = remember(context.createGain());
    source.buffer = buffer;
    gain.gain.value = 0.55;
    source.connect(gain).connect(master);
    source.onended = () => {
      source.disconnect(); gain.disconnect();
      nodes.delete(source); nodes.delete(gain); sources.delete(source); shots.delete(source);
    };
    sources.add(source); shots.add(source);
    source.start();
  }

  return {
    async start() {
      if (destroyed) return;
      const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContext) return;
      try {
        if (!loading) {
          context = new AudioContext();
          const audioContext = context;
          // Unlock during the gesture; downloads never create or resume a context.
          const resumed = audioContext.state === 'suspended' ? audioContext.resume() : Promise.resolve();
          loading = (async () => {
            await resumed;
            const samples = await Promise.all(recordings.map(async name => {
              const response = await fetch(`${base}/audio/${name}`, { signal: request.signal });
              if (!response.ok) throw new Error('Engine recording unavailable');
              const data = await response.arrayBuffer();
              if (destroyed) return;
              return audioContext.decodeAudioData(data);
            }));
            if (destroyed) return;
            buffers = samples;
            master = remember(audioContext.createGain());
            master.gain.value = 0;
            master.connect(audioContext.destination);
            filter = remember(audioContext.createBiquadFilter());
            filter.type = 'lowpass';
            filter.Q.value = 0.5;
            filter.connect(master);
            loops = samples.slice(0, 2).map(buffer => {
              const source = remember(audioContext.createBufferSource());
              const gain = remember(audioContext.createGain());
              source.buffer = buffer;
              source.loop = true;
              gain.gain.value = 0;
              source.connect(gain).connect(filter);
              sources.add(source);
              source.start();
              return { source, gain };
            });
          })().catch(() => { release(); });
        }
        await loading;
        if (!destroyed && context?.state === 'suspended') await context.resume();
      } catch {
        // Missing files, permissions or audio devices must never interrupt driving.
        release();
      }
    },

    update({ rpm = 850, throttle = 0, engine = 'running', enabled = false, paused = false } = {}) {
      if (destroyed || muted || !enabled || paused) {
        previousEngine = engine;
        silence();
        return;
      }
      if (!master || context?.state !== 'running') return;
      const changed = engine !== previousEngine;
      previousEngine = engine;
      const target = (param, value, time = 0.08) => param.setTargetAtTime(value, context.currentTime, time);
      const revs = clamp(rpm, 0, 7600), load = clamp(throttle, 0, 1);
      // ponytail: stock 1.6 NB revs approximate the 1.8 NB2; replace with matched RPM bands when available.
      const blend = clamp((revs - 1300) / 1700, 0, 1);
      const weights = [Math.cos(blend * Math.PI / 2), Math.sin(blend * Math.PI / 2)];
      loops.forEach(({ source, gain }, index) => {
        target(source.playbackRate, clamp(revs / referenceRpm[index], 0.25, 4), 0.12);
        const volume = (0.38 + load * 0.22) * weights[index];
        target(gain.gain, engine === 'running' ? volume : 0, engine === 'stalled' ? 0.025 : 0.08);
      });
      target(filter.frequency, 950 + revs * 0.3 + load * 1400);
      target(master.gain, 0.42, 0.03);
      if (changed && engine === 'starting') oneShot(buffers[2]);
      if (changed && engine === 'stalled') oneShot(buffers[3]);
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
