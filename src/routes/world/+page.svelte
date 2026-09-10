<script>
  import { onMount, tick } from 'svelte';
  import { base } from '$app/paths';
  import { SPAWN, LANDMARKS, DISCOVERIES, terrainHeight, terrainGrade, stepWorldCar, joystickInput, nearestLandmark } from '$lib/world.js';
  import { CAMERA_VIEWS } from '$lib/worldCamera.js';
  import { automaticGear, createTransmission, selectTransmissionGear, stepTransmission } from '$lib/transmission.js';
  import { createEngineAudio } from '$lib/engineAudio.js';
  import WorldMap from '$lib/components/WorldMap.svelte';
  import DrivingInstruments from '$lib/components/DrivingInstruments.svelte';

  let canvas;
  let panel;
  let car = { ...SPAWN };
  let ready = false;
  let error = '';
  let paused = false;
  let modal = '';
  let encounter = null;
  let topic = null;
  let destination = null;
  let visited = [];
  let found = [];
  let manualTransmission = false;
  let transmission = createTransmission();
  let soundEnabled = false;
  let engineAudio;
  let stick = { x: 0, y: 0 };
  let stickPointer = null;
  let stickElement;
  let braking = false;
  let cameraIndex = 0;
  const keys = new Set();
  $: nearby = nearestLandmark(car);
  $: nearbyScenic = DISCOVERIES.find(place => Math.hypot(place.x - car.x, place.z - car.z) < 18);
  $: distance = destination ? Math.round(Math.hypot(destination.x - car.x, destination.z - car.z)) : 0;
  $: stopped = paused || !!modal || !ready || !!error;
  $: cameraView = CAMERA_VIEWS[cameraIndex];
  $: gradePercent = Math.round(terrainGrade(car.x, car.z, car.heading) * 100);

  function cycleCamera() {
    if (!stopped) cameraIndex = (cameraIndex + 1) % CAMERA_VIEWS.length;
  }

  function selectGear(requested) {
    if (!manualTransmission || stopped) return;
    transmission = selectTransmissionGear(transmission, requested, car.speed);
  }
  function toggleSound() {
    soundEnabled = !soundEnabled;
    engineAudio?.setMuted(!soundEnabled);
    if (soundEnabled) engineAudio?.start();
  }

  function releaseControls() {
    keys.clear();
    if (stickPointer !== null && stickElement?.hasPointerCapture(stickPointer)) stickElement.releasePointerCapture(stickPointer);
    stickPointer = null;
    stick = { x: 0, y: 0 };
    braking = false;
  }
  function pauseDriving() {
    releaseControls();
    engineAudio?.setMuted(true);
  }
  async function openPanel(kind) {
    pauseDriving();
    if (kind === 'talk') {
      if (!nearby) return;
      encounter = nearby;
      topic = null;
      if (!visited.includes(encounter.id)) visited = [...visited, encounter.id];
    }
    modal = kind;
    await tick();
    if (!panel.open) panel.showModal();
  }
  function closePanel() {
    if (panel?.open) panel.close();
    modal = '';
    releaseControls();
    canvas?.focus({ preventScroll: true });
  }
  function resetCar() {
    car = { ...SPAWN };
    transmission = createTransmission();
    paused = false;
    closePanel();
  }
  function keyDown(event) {
    if (event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    if (event.altKey || event.ctrlKey || event.metaKey || modal) return;
    const key = event.key.toLowerCase();
    const digit = /^(Digit|Numpad)[1-5]$/.test(event.code) ? Number(event.code.slice(-1)) : /^[1-5]$/.test(key) ? Number(key) : null;
    if (manualTransmission && (digit || key === 'r' || key === 'n')) {
      event.preventDefault();
      if (!event.repeat) selectGear(digit || key.toUpperCase());
      if (soundEnabled) engineAudio?.start();
      return;
    }
    if (key === 'c' && !event.repeat) { event.preventDefault(); cycleCamera(); return; }
    if (key === 'm' && !event.repeat) { event.preventDefault(); openPanel('map'); return; }
    if ((key === 'escape' || key === 'p') && !event.repeat) { event.preventDefault(); openPanel('pause'); return; }
    if (key === 'e' && !event.repeat && nearby && !stopped) { event.preventDefault(); openPanel('talk'); return; }
    if (!['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(key)) return;
    if (key === ' ' && /^(BUTTON|A)$/.test(event.target?.tagName)) return;
    event.preventDefault();
    if (!stopped) {
      keys.add(key);
      if (soundEnabled) engineAudio?.start();
    }
  }
  function stickMove(event) {
    if (event.pointerId !== stickPointer) return;
    const bounds = stickElement.getBoundingClientRect();
    let x = (event.clientX - bounds.left - bounds.width / 2) / 43;
    let y = (event.clientY - bounds.top - bounds.height / 2) / 43;
    const length = Math.max(1, Math.hypot(x, y));
    stick = { x: x / length, y: y / length };
  }
  function stickStart(event) {
    if (stopped || stickPointer !== null) return;
    event.preventDefault();
    stickPointer = event.pointerId;
    stickElement.setPointerCapture(event.pointerId);
    stickMove(event);
  }
  function stickEnd(event) {
    if (event.pointerId !== stickPointer) return;
    stickPointer = null;
    stick = { x: 0, y: 0 };
  }
  const localLink = link => link?.startsWith('/') ? `${base}${link}` : link;

  onMount(() => {
    let scene;
    let frame;
    let disposed = false;
    let lastTime = 0;
    engineAudio = createEngineAudio();
    const desktop = window.matchMedia('(min-width: 901px) and (pointer: fine)');
    const updateTransmission = () => {
      manualTransmission = desktop.matches;
      transmission = createTransmission();
      releaseControls();
      car = { ...car, speed: 0, steering: 0, throttle: 0 };
    };
    updateTransmission();
    desktop.addEventListener('change', updateTransmission);
    const observer = new ResizeObserver(() => scene?.resize(canvas.clientWidth, canvas.clientHeight));
    observer.observe(canvas);
    function loseFocus() {
      pauseDriving();
      if (ready && !modal) paused = true;
    }
    const visibility = () => { if (document.hidden) loseFocus(); };
    const keyUp = event => keys.delete(event.key.toLowerCase());
    const contextLost = event => { event.preventDefault(); releaseControls(); error = 'The 3D view was interrupted. Reload to head back out.'; };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', loseFocus);
    document.addEventListener('visibilitychange', visibility);
    canvas.addEventListener('webglcontextlost', contextLost);
    import('$lib/worldScene.js').then(({ createWorldScene }) => {
      if (disposed) return;
      scene = createWorldScene(canvas);
      scene.resize(canvas.clientWidth, canvas.clientHeight);
      ready = true;
      function animate(time) {
        const dt = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
        lastTime = time;
        if (!stopped) {
          const input = stickPointer !== null ? joystickInput(stick.x, stick.y, scene.getCameraHeading()) : {
            throttle: Number(keys.has('arrowup') || keys.has('w')) - (manualTransmission ? 0 : Number(keys.has('arrowdown') || keys.has('s'))),
            steering: Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a'))
          };
          const brake = braking || keys.has(' ') || (manualTransmission && (keys.has('arrowdown') || keys.has('s')));
          if (manualTransmission) transmission = stepTransmission(transmission, { throttle: Math.abs(car.throttle || 0) }, car.speed, dt);
          car = stepWorldCar(car, {
            ...input,
            ...(manualTransmission ? {
              gear: transmission.gear,
              drivePower: transmission.coupling
            } : {}),
            brake
          }, dt);
          if (!manualTransmission) {
            const gear = car.throttle < 0 ? 'R' : automaticGear(Math.abs(car.speed), terrainGrade(car.x, car.z, car.heading));
            transmission = stepTransmission({ ...transmission, gear }, { throttle: Math.abs(car.throttle || 0) }, car.speed, dt);
          }
          const discovery = DISCOVERIES.find(place => !found.includes(place.id) && Math.hypot(place.x - car.x, place.z - car.z) < 18);
          if (discovery) found = [...found, discovery.id];
        }
        engineAudio.setMuted(!soundEnabled);
        engineAudio.update({ rpm: transmission.rpm, throttle: Math.abs(car.throttle || 0), enabled: soundEnabled && manualTransmission, paused: stopped });
        if (!error) scene.render(car, stopped ? 0 : dt, cameraView.id);
        frame = requestAnimationFrame(animate);
      }
      frame = requestAnimationFrame(animate);
    }).catch(() => { error = 'This browser could not start the 3D valley. You can still explore all my work in the portfolio.'; });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      desktop.removeEventListener('change', updateTransmission);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', loseFocus);
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('webglcontextlost', contextLost);
      scene?.destroy();
      engineAudio?.destroy();
    };
  });
</script>

<svelte:head>
  <title>The scenic route — Minchan Kim</title>
  <meta name="description" content="Drive a green MX-5 through Minchan's open valley. Meet pixel characters, discover his work, or take the direct route to his portfolio." />
  <meta name="theme-color" content="#233c2e" />
</svelte:head>

<div class="world" data-ready={ready} data-paused={stopped} data-camera={cameraView.id} data-transmission={manualTransmission ? 'manual' : 'automatic'} data-gear={manualTransmission ? transmission.gear : 'auto'} data-rpm={Math.round(transmission.rpm)} data-event={manualTransmission ? transmission.event : ''} data-x={car.x.toFixed(2)} data-z={car.z.toFixed(2)} data-speed={car.speed.toFixed(2)}>
  <canvas bind:this={canvas} tabindex="0" aria-label={manualTransmission ? 'Mountain driving world. W or Up to accelerate; A, D or Left, Right to steer. Press 1 through 5 to shift gears, R for reverse when stopped, or N for neutral. S, Down or Space to brake. E to talk, M for map, C for camera, P to pause.' : 'Mountain driving world. Point the joystick where you want to go. Automatic transmission. Tap a nearby character to talk, or use the map and camera buttons.'}></canvas>
  <header class="world-header">
    <a class="portfolio-link" href="{base}/"><span aria-hidden="true">↖</span> Portfolio</a>
    <div class="world-title"><span>MINCHAN'S WORLD</span><strong>The scenic route.</strong></div>
    <div class="header-actions">
      <button class="hud-button camera-button" on:click={cycleCamera} disabled={stopped} aria-label="Change camera. Current view: {cameraView.label}" aria-keyshortcuts="C" title="Change camera (C)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 5 6 8H3v12h18V8h-3l-2-3Z" /><circle cx="12" cy="13" r="3.5" /></svg><span class="camera-label">{cameraView.label}</span><kbd>C</kbd>
      </button>
      <button class="hud-button" on:click={() => openPanel('map')} aria-label="Valley map"><span aria-hidden="true">⌖</span><span class="button-word"> Map</span></button>
      <button class="hud-button pause-button" on:click={() => openPanel('pause')} aria-label="Pause"><span aria-hidden="true">Ⅱ</span></button>
    </div>
  </header>
  <span class="sr-only" role="status">Camera: {cameraView.label}</span>

  <aside class="location-card" aria-label="Your location">
    <span class="eyebrow">SOUTHERN CALIFORNIA · MOUNTAIN PASS</span>
    <h1>{nearby?.place || nearbyScenic?.place || 'Somewhere along the way.'}</h1>
    <p>{destination ? `${destination.place} · ${distance} m away` : nearbyScenic?.description || 'No itinerary. Take a turn that looks interesting.'}</p>
    <span class="elevation">{Math.round(terrainHeight(car.x, car.z))} m elevation · {gradePercent > 0 ? '+' : ''}{gradePercent}% grade · {found.length}/{DISCOVERIES.length} viewpoints</span>
    {#if destination}<button class="clear-pin" on:click={() => destination = null}>Clear destination ×</button>{/if}
  </aside>

  <button class="mini-map" on:click={() => openPanel('map')} aria-label="Open valley map and choose a destination">
    <WorldMap {car} destinationId={destination?.id} compact {found} />
    <span>N ↑ <span>{visited.length} / {LANDMARKS.length} met</span></span>
  </button>

  {#if !ready || error}
    <div class="loading-card" role="status">
      <span class="eyebrow">THE SCENIC ROUTE</span>
      <h2>{error ? 'A little detour.' : 'Opening the valley…'}</h2>
      <p>{error || 'Your green MX-5 is waiting at the garage.'}</p>
      {#if error}<a href="{base}/">Browse the portfolio ↗</a><button on:click={() => window.location.reload()}>Try again</button>{/if}
    </div>
  {:else if paused && !modal}
    <div class="resume-card"><p>Taking a breather.</p><button on:click={() => { releaseControls(); paused = false; canvas.focus(); }}>Resume driving →</button></div>
  {/if}

  {#if manualTransmission}
    <aside class="driving-notes" aria-label="Manual driving controls">
      <strong>MX-5 · NB2 <span>5-speed manual</span></strong>
      <p><kbd>W / ↑</kbd> Gas · <kbd>A D / ← →</kbd> Steer · <kbd>S / ↓</kbd> Brake</p>
      <p><kbd>1–5</kbd> Gears · <kbd>R</kbd> Reverse</p>
      <small>Pick a gear and drive. Use the keys or click the shifter.</small>
      <button class="sound-toggle" on:click={toggleSound} aria-pressed={soundEnabled}>Engine sound: {soundEnabled ? 'On' : 'Off'}</button>
    </aside>
    <div class="instrument-dock">
      <DrivingInstruments rpm={transmission.rpm} gear={transmission.gear} speed={car.speed} event={transmission.event} eventTime={transmission.eventTime} disabled={stopped} onGear={gear => { selectGear(gear); canvas.focus({ preventScroll: true }); }} />
    </div>
  {:else}
    <div class="automatic-gauge"><DrivingInstruments compact rpm={transmission.rpm} speed={car.speed} /></div>
  {/if}

  {#if nearby && ready && !stopped}
    <button class="talk-prompt" on:click={() => openPanel('talk')}><span class="talk-icon" aria-hidden="true">···</span><span><small>Someone has a story</small><strong>Talk to {nearby.name}</strong></span><kbd>E</kbd></button>
  {/if}

  <div class="touch-controls">
    <div class="joystick-wrap">
      <button bind:this={stickElement} class="joystick" aria-label="Driving joystick. Drag in the direction you want to go." disabled={stopped} on:pointerdown={stickStart} on:pointermove={stickMove} on:pointerup={stickEnd} on:pointercancel={stickEnd} on:lostpointercapture={stickEnd}>
        <span class="axis-v"></span><span class="axis-h"></span><span class="knob" style:transform="translate({stick.x * 43}px, {stick.y * 43}px)"></span>
      </button>
      <span>Point where you want to go</span>
    </div>
    <button class="brake" disabled={stopped} aria-label="Hold to brake" on:keydown={event => { if (event.key === ' ' || event.key === 'Enter') braking = true; }} on:keyup={() => braking = false} on:blur={() => braking = false} on:pointerdown={event => { event.currentTarget.setPointerCapture(event.pointerId); braking = true; }} on:pointerup={() => braking = false} on:pointercancel={() => braking = false} on:lostpointercapture={() => braking = false}><span aria-hidden="true">▰</span>BRAKE</button>
  </div>

  <dialog bind:this={panel} class:map-dialog={modal === 'map'} on:close={() => { modal = ''; releaseControls(); }} aria-labelledby="panel-title">
    <div class="panel-top"><span class="eyebrow">{modal === 'talk' ? encounter?.place : 'MINCHAN’S WORLD'}</span><button class="close" on:click={closePanel} aria-label="Close and return to the road">×</button></div>
    {#if modal === 'talk' && encounter}
      <span class="eyebrow">A CONVERSATION WITH</span>
      <h2 id="panel-title">{encounter.name}</h2>
      <p class="dialogue-copy">{topic?.text || encounter.description}</p>
      {#if topic}
        {#if topic.link}<a class="primary-link" href={localLink(topic.link)} target="_blank" rel="noopener noreferrer">{topic.linkLabel || 'Explore this work'} ↗</a>{/if}
        <button class="topic-option" on:click={() => topic = null}>Ask something else <span>↩</span></button>
      {:else}
        <div class="topic-list">{#each encounter.topics as choice}<button class="topic-option" on:click={() => topic = choice}>{choice.label}<span>↗</span></button>{/each}</div>
      {/if}
      <button class="text-button" on:click={closePanel}>Back to the road →</button>
      <p class="cast-note">Pixel guest · concept cast</p>
    {:else if modal === 'map'}
      <h2 id="panel-title">A valley of possibilities.</h2>
      <p>Pick a place to keep in view. The route is yours.</p>
      <div class="large-map"><WorldMap {car} destinationId={destination?.id} {found} /></div>
      <p class="map-legend">10 m contours · ◇ Scenic turnouts · {found.length}/{DISCOVERIES.length} discovered</p>
      <div class="map-places">
        {#each LANDMARKS as place, i}<button class="topic-option" on:click={() => { destination = place; closePanel(); }}><span class="place-number">{i + 1}</span><span><strong>{place.place}</strong><small>{place.name}{visited.includes(place.id) ? ' · Met' : ''}</small></span><span>↗</span></button>{/each}
        {#each DISCOVERIES as place}<button class="topic-option" on:click={() => { destination = place; closePanel(); }}><span class="place-number scenic">{found.includes(place.id) ? '◆' : '◇'}</span><span><strong>{place.place}</strong><small>{Math.round(terrainHeight(place.x, place.z))} m elevation{found.includes(place.id) ? ' · Discovered' : ''}</small></span><span>↗</span></button>{/each}
      </div>
      <p class="cast-note">Opening the map keeps your car exactly where you left it.</p>
    {:else}
      <h2 id="panel-title">Enjoy the pause.</h2>
      <p>A small open world. No timer, no required route.</p>
      <dl>{#if manualTransmission}<dt>Accelerate / steer</dt><dd>W / ↑ · A, D / ←, →</dd><dt>Gears</dt><dd>1–5 or click the shifter. R selects reverse when stopped; N selects neutral.</dd><dt>Pull away</dt><dd>First gear is ready when you arrive. Press W or Up to drive.</dd><dt>Shift assist</dt><dd>Shifts and stops are handled smoothly. Slow down if a lower gear is unavailable.</dd><dt>Brake</dt><dd>S / ↓</dd>{:else}<dt>Drive</dt><dd>Point the joystick in your intended direction. Gears change automatically.</dd>{/if}<dt>Stop</dt><dd>Space / brake button</dd><dt>Talk</dt><dd>E / tap a nearby character’s prompt</dd><dt>Map</dt><dd>M / map button</dd><dt>Camera</dt><dd>C / camera button · Overhead, High chase, Chase</dd><dt>On your phone</dt><dd>Point the joystick where you want to go.</dd></dl>
      <button class="primary-link" on:click={() => { paused = false; closePanel(); }}>Resume driving →</button>
      <button class="topic-option" on:click={resetCar}>Return to the garage <span>↩</span></button>
      <a class="text-button" href="{base}/">Take the direct route to my portfolio ↗</a>
    {/if}
  </dialog>
</div>

<style>
  .world { position: fixed; inset: 0; overflow: hidden; background: #c6d0b7; color: #243e2f; color-scheme: light; font-size: 14px; }
  canvas { display: block; width: 100%; height: 100%; touch-action: none; }
  button, a { -webkit-user-select: none; user-select: none; }
  button { color: inherit; }
  .world-header { position: absolute; inset: 24px 28px auto; display: flex; align-items: center; justify-content: space-between; gap: 12px; pointer-events: none; }
  .world-header > * { pointer-events: auto; }
  .portfolio-link, .hud-button { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; gap: 9px; padding: 0 18px; border: 1px solid #52644650; background: #faf8eceb; border-radius: 5px; text-decoration: none; font-size: 13px; }
  .portfolio-link:hover, .hud-button:hover { background: #fffdf1; }
  .world-title { position: absolute; left: 50%; transform: translateX(-50%); text-align: center; color: #273e2d; background: #faf8eceb; padding: 5px 16px; border: 1px solid #52644650; border-radius: 5px; }
  .world-title span { display: block; font-size: 9px; letter-spacing: .19em; }
  .world-title strong { font: 500 30px var(--font-display); }
  .header-actions { display: flex; gap: 8px; }
  .hud-button > span:first-child { font-size: 21px; }
  .pause-button { width: 48px; padding: 0; }
  .camera-button svg { width: 20px; height: 20px; }
  .camera-button .camera-label { font-size: 12px; }
  .camera-button:disabled { cursor: default; opacity: .65; }
  .location-card { position: absolute; top: 117px; left: 32px; padding: 17px 20px; max-width: 355px; border-left: 2px solid #476240; background: #f8f5e6e8; }
  .eyebrow { font-size: 9px; font-weight: 600; letter-spacing: .12em; }
  .location-card h1 { font: 500 28px var(--font-display); margin: 6px 0; }
  .location-card p { margin: 0; font-size: 11px; line-height: 1.6; }
  .clear-pin { min-height: 36px; border: 0; background: none; padding: 4px 0 0; font-size: 11px; text-decoration: underline; }
  .mini-map { position: absolute; top: 108px; right: 28px; width: 156px; padding: 7px; border: 1px solid #78856b; background: #faf8e8ed; border-radius: 5px; }
  .elevation { display: block; font-size: 9px; margin-top: 8px; color: #52654d; }
  .mini-map > span { display: flex; justify-content: space-between; padding: 5px 3px 0; font-size: 9px; font-weight: 600; }
  .driving-notes { position: absolute; left: 28px; bottom: 25px; width: 340px; padding: 15px 17px; border: 1px solid #73816866; border-radius: 5px; background: #f8f5e8ed; }
  .driving-notes > strong { display: block; font-size: 12px; margin-bottom: 9px; }
  .driving-notes > strong > span { font-size: 10px; font-weight: 400; margin-left: 8px; }
  .driving-notes p { font-size: 10px; margin: 6px 0; line-height: 1.8; }
  .driving-notes small { display: block; max-width: 290px; font-size: 10px; line-height: 1.6; }
  kbd { font: 10px 'DM Sans', sans-serif; padding: 2px 4px; border: 1px solid #73816866; border-radius: 2px; }
  .sound-toggle { display: block; min-height: 34px; margin: 7px 0 -5px; padding: 3px 0; background: none; border: 0; text-decoration: underline; text-underline-offset: 3px; font-size: 10px; }
  .instrument-dock { position: absolute; right: 28px; bottom: 25px; }
  .automatic-gauge { position: absolute; bottom: calc(18px + env(safe-area-inset-bottom)); right: 18px; pointer-events: none; }
  .map-legend { color: #5c6b60; font-size: 10px; margin: 7px 0 0; }
  .scenic { border-radius: 3px; }
  .talk-prompt { position: absolute; bottom: 217px; left: 28px; display: flex; align-items: center; gap: 17px; min-height: 72px; border: 1px solid #435e43; padding: 12px 18px; background: #faf8ecf5; border-radius: 4px; box-shadow: 0 5px 20px #233c2e1c; text-align: left; white-space: nowrap; }
  .talk-prompt small, .talk-prompt strong { display: block; }
  .talk-prompt small { font-size: 10px; opacity: .8; }
  .talk-prompt strong { font-size: 14px; font-weight: 500; }
  .talk-icon { font: bold 25px/1 monospace; border: 1px solid #75856a; border-radius: 3px; padding: 0 6px 8px; }
  .touch-controls { display: none; }
  .loading-card, .resume-card { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(420px, calc(100% - 40px)); background: #faf8ee; padding: 30px; border: 1px solid #78856b; border-radius: 5px; }
  .loading-card h2 { font: 500 40px var(--font-display); margin: 12px 0; }
  .loading-card p { font-size: 13px; }
  .loading-card button, .resume-card button { min-height: 48px; padding: 8px 18px; background: #274e36; color: #faf8ec; border: 0; border-radius: 3px; }
  .loading-card a { display: block; margin-bottom: 15px; }
  .resume-card { width: auto; text-align: center; }
  .resume-card p { margin-bottom: 12px; }
  dialog { position: fixed; inset: auto 28px 28px auto; width: min(470px, calc(100% - 32px)); max-height: calc(100dvh - 48px); margin: 0; overflow-y: auto; padding: 25px 28px; background: #faf8ed; color: #233c2e; border: 1px solid #617654; border-radius: 6px; box-shadow: 0 12px 60px #213c3033; }
  dialog::backdrop { background: #19372226; }
  .panel-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
  .close { width: 44px; min-height: 44px; border: 1px solid #a3ae9d80; background: none; font-size: 26px; border-radius: 3px; }
  dialog h2 { font: 500 46px/1 var(--font-display); margin: 4px 0 20px; }
  dialog p { font-size: 13px; line-height: 1.8; }
  .dialogue-copy { min-height: 60px; }
  .topic-list { margin: 24px 0 10px; }
  .topic-option { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 52px; gap: 16px; text-align: left; padding: 12px 0; border: 0; border-bottom: 1px solid #a3ae9d66; background: none; font-size: 13px; }
  .topic-option:hover, .text-button:hover { color: #8b5732; }
  .topic-option > span:last-child { margin-left: auto; }
  .text-button { display: inline-flex; align-items: center; min-height: 48px; padding: 10px 0; border: 0; background: none; text-decoration: none; font-size: 12px; }
  .primary-link { display: inline-flex; justify-content: center; align-items: center; min-height: 48px; padding: 10px 18px; border: 0; border-radius: 3px; background: #274e36; color: #faf8ec; text-decoration: none; font-size: 13px; margin: 8px 0; }
  .cast-note { margin: 10px 0 0; font-size: 10px; color: #5c6b60; }
  dl { display: grid; grid-template-columns: 125px 1fr; gap: 10px; margin: 25px 0; font-size: 12px; }
  dt { font-weight: 600; } dd { margin: 0; }
  .map-dialog { width: min(570px, calc(100% - 32px)); }
  .map-dialog h2 { font-size: 38px; margin-bottom: 10px; }
  .large-map { width: 100%; height: min(52vh, 390px); display: block; background: #e8e6cc; border: 1px solid #bac3a1; }
  .place-number { width: 28px; height: 28px; display: grid; place-items: center; border: 1px solid #a3ae9d; border-radius: 50%; }
  .map-places strong, .map-places small { display: block; }
  .map-places strong { font-size: 13px; font-weight: 500; }.map-places small { font-size: 11px; opacity: .8; }
  @media (max-width: 900px), (pointer: coarse) {
    .world-header { inset: max(15px, env(safe-area-inset-top)) 16px auto; }
    .world-title strong { font-size: 25px; }.world-title span { font-size: 8px; }
    .portfolio-link, .hud-button { padding: 0 12px; min-height: 46px; font-size: 12px; }.pause-button { width: 44px; }
    .camera-button { min-width: 77px; padding-inline: 10px; }.camera-button svg, .camera-button kbd { display: none; }.camera-button .camera-label { font-size: 11px; }
    .location-card { left: 18px; top: 89px; padding: 10px 13px; max-width: calc(100% - 147px); }
    .location-card .eyebrow { font-size: 7px; letter-spacing: .06em; }.location-card h1 { font-size: 24px; }.location-card p { font-size: 10px; }
    .mini-map { top: 89px; right: 16px; width: 105px; padding: 5px; }.mini-map > span { font-size: 8px; }
    .touch-controls { display: flex; position: absolute; inset: auto 20px calc(24px + env(safe-area-inset-bottom)); align-items: start; justify-content: space-between; pointer-events: none; }
    .joystick-wrap { text-align: center; }.joystick-wrap > span { display: block; font-size: 9px; margin-top: 10px; color: #243e2f; background: #f8f5e8df; padding: 3px 7px; border-radius: 2px; }
    .joystick { position: relative; width: 128px; height: 128px; padding: 0; border: 1px solid #38553a99; border-radius: 50%; background: #f4f1dc9e; box-shadow: inset 0 0 0 12px #faf8ea44; pointer-events: auto; touch-action: none; }
    .knob { position: absolute; top: 39px; left: 39px; width: 48px; height: 48px; border: 1px solid #274733; border-radius: 50%; background: #385b3ded; box-shadow: inset 0 0 0 5px #5d7c5277; }
    .axis-v, .axis-h { position: absolute; background: #48653b55; }.axis-v { top: 18px; bottom: 18px; width: 1px; left: 50%; }.axis-h { left: 18px; right: 18px; height: 1px; top: 50%; }
    .brake { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 65px; height: 65px; margin-top: -29px; border: 1px solid #527147; border-radius: 50%; background: #f8f5e8df; pointer-events: auto; touch-action: none; font-size: 8px; letter-spacing: .09em; }.brake span { font-size: 22px; line-height: 1.3; }
    .brake:active { background: #d6dec8; }
    .talk-prompt { left: 50%; transform: translateX(-50%); bottom: calc(204px + env(safe-area-inset-bottom)); min-height: 62px; padding: 8px 13px; gap: 12px; }.talk-prompt strong { font-size: 13px; }.talk-prompt kbd { display: none; }
    dialog { inset: auto 16px max(16px, env(safe-area-inset-bottom)) auto; padding: 18px 22px; max-height: calc(100dvh - 32px); }dialog h2 { font-size: 38px; }
  }
  @media (max-width: 700px) { .world-title { display: none; } }
  @media (max-width: 560px) {
    .location-card { top: 84px; max-width: calc(100% - 140px); }.mini-map { top: 84px; }
    .location-card h1 { font-size: 23px; }.location-card .eyebrow { display: none; }.location-card p { line-height: 1.6; }
    .button-word { display: none; }.header-actions { gap: 6px; }
    .map-dialog h2 { font-size: 34px; }.map-dialog > p { font-size: 12px; }
    .large-map { height: min(38vh, 300px); }dl { grid-template-columns: 105px 1fr; }
  }
  @media (max-height: 520px) {
    .location-card { display: none; }.mini-map { width: 89px; }.mini-map > span { display: none; }.talk-prompt { bottom: 28px; }
    .joystick { width: 112px; height: 112px; }.knob { top: 31px; left: 31px; }.joystick-wrap > span { display: none; }
    .touch-controls { bottom: 18px; }.brake { margin-top: -70px; }.automatic-gauge { bottom: 15px; }
  }
  @media (min-width: 901px) and (pointer: fine) and (max-height: 520px) { .talk-prompt { bottom: 218px; } }
</style>
