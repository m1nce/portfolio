<script>
  import { onMount, tick } from 'svelte';
  import { base } from '$app/paths';
  import { SPAWN, WORLD_SIZE, ROADS, LANDMARKS, stepWorldCar, joystickInput, nearestLandmark } from '$lib/world.js';

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
  let stick = { x: 0, y: 0 };
  let stickPointer = null;
  let stickElement;
  let braking = false;
  const keys = new Set();
  const roadPaths = ROADS.map(points => points.map(p => `${p.x},${p.z}`).join(' '));
  $: nearby = nearestLandmark(car);
  $: distance = destination ? Math.round(Math.hypot(destination.x - car.x, destination.z - car.z)) : 0;
  $: stopped = paused || !!modal || !ready || !!error;

  function releaseControls() {
    keys.clear();
    if (stickPointer !== null && stickElement?.hasPointerCapture(stickPointer)) stickElement.releasePointerCapture(stickPointer);
    stickPointer = null;
    stick = { x: 0, y: 0 };
    braking = false;
  }
  async function openPanel(kind) {
    releaseControls();
    car = { ...car, speed: 0 };
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
    panel.close();
    modal = '';
    releaseControls();
    canvas?.focus({ preventScroll: true });
  }
  function resetCar() {
    car = { ...SPAWN };
    paused = false;
    closePanel();
  }
  function keyDown(event) {
    if (event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    if (event.altKey || event.ctrlKey || event.metaKey || modal) return;
    const key = event.key.toLowerCase();
    if (key === 'm' && !event.repeat) { event.preventDefault(); openPanel('map'); return; }
    if ((key === 'escape' || key === 'p') && !event.repeat) { event.preventDefault(); openPanel('pause'); return; }
    if (key === 'e' && !event.repeat && nearby && !stopped) { event.preventDefault(); openPanel('talk'); return; }
    if (!['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(key)) return;
    if (key === ' ' && /^(BUTTON|A)$/.test(event.target?.tagName)) return;
    event.preventDefault();
    if (!stopped) keys.add(key);
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
    const observer = new ResizeObserver(() => scene?.resize(canvas.clientWidth, canvas.clientHeight));
    observer.observe(canvas);
    function loseFocus() {
      releaseControls();
      car = { ...car, speed: 0 };
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
          const input = stickPointer !== null ? joystickInput(stick.x, stick.y) : {
            throttle: Number(keys.has('arrowup') || keys.has('w')) - Number(keys.has('arrowdown') || keys.has('s')),
            steering: Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a'))
          };
          car = stepWorldCar(car, { ...input, brake: braking || keys.has(' ') }, dt);
        }
        if (!error) scene.render(car, stopped ? 0 : dt);
        frame = requestAnimationFrame(animate);
      }
      frame = requestAnimationFrame(animate);
    }).catch(() => { error = 'This browser could not start the 3D valley. You can still explore all my work in the portfolio.'; });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', loseFocus);
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('webglcontextlost', contextLost);
      scene?.destroy();
    };
  });
</script>

<svelte:head>
  <title>The scenic route — Minchan Kim</title>
  <meta name="description" content="Drive a green MX-5 through Minchan's open valley. Meet pixel characters, discover his work, or take the direct route to his portfolio." />
  <meta name="theme-color" content="#233c2e" />
</svelte:head>

<div class="world" data-ready={ready} data-paused={stopped} data-x={car.x.toFixed(2)} data-z={car.z.toFixed(2)} data-speed={car.speed.toFixed(2)}>
  <canvas bind:this={canvas} tabindex="0" aria-label="Open valley driving world. Arrow keys or WASD to drive, Space to brake, E to talk, M for map, P to pause."></canvas>
  <header class="world-header">
    <a class="portfolio-link" href="{base}/"><span aria-hidden="true">↖</span> Portfolio</a>
    <div class="world-title"><span>MINCHAN'S WORLD</span><strong>The scenic route.</strong></div>
    <div class="header-actions">
      <button class="hud-button" on:click={() => openPanel('map')} aria-label="Valley map"><span aria-hidden="true">⌖</span><span class="button-word"> Map</span></button>
      <button class="hud-button pause-button" on:click={() => openPanel('pause')} aria-label="Pause"><span aria-hidden="true">Ⅱ</span></button>
    </div>
  </header>

  <aside class="location-card" aria-label="Your location">
    <span class="eyebrow">SOUTHERN CALIFORNIA · OPEN VALLEY</span>
    <h1>{nearby?.place || 'Somewhere along the way.'}</h1>
    <p>{destination ? `${destination.place} · ${distance} m away` : 'No itinerary. Take a turn that looks interesting.'}</p>
    {#if destination}<button class="clear-pin" on:click={() => destination = null}>Clear destination ×</button>{/if}
  </aside>

  <button class="mini-map" on:click={() => openPanel('map')} aria-label="Open valley map and choose a destination">
    <svg viewBox="-180 -180 360 360" aria-hidden="true">
      <rect x="-180" y="-180" width="360" height="360" rx="24" fill="#e8e6cc" />
      <path d="M-180-80Q-85-155 15-125T180-60M-180-50Q-80-125 25-95T180-30M-180 100Q-55 10 30 80T180 125" fill="none" stroke="#c3c8a9" stroke-width="13" />
      {#each roadPaths as points}<polyline {points} fill="none" stroke="#8a866d" stroke-width="6" stroke-linejoin="round" />{/each}
      {#each LANDMARKS as place}<circle cx={place.x} cy={place.z} r="8" fill={place.id === destination?.id ? '#b45e39' : '#f9f8ed'} stroke="#335341" stroke-width="3" />{/each}
      <g transform="translate({car.x} {car.z}) rotate({car.heading * 180 / Math.PI})"><path d="M0-12 8 8 0 4-8 8Z" fill="#214c35" stroke="#fffced" stroke-width="2" /></g>
    </svg>
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

  <div class="driving-bar">
    <div class="car-caption"><span class="car-dot"></span><div><strong>MX-5 · NB2</strong><span>British racing green. Factory stock.</span></div></div>
    <div class="keyboard-help"><span><kbd>W A S D</kbd> / arrows to drive</span><span><kbd>↓</kbd> Brake / reverse · <kbd>Space</kbd> Stop</span></div>
    <div class="speed"><strong>{Math.round(Math.abs(car.speed) * 3.6)}</strong><span>{car.speed < -.1 ? 'REVERSE' : 'KM/H'}</span></div>
  </div>

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
      <svg class="large-map" viewBox="{-WORLD_SIZE / 2} {-WORLD_SIZE / 2} {WORLD_SIZE} {WORLD_SIZE}" role="img" aria-label="Connected loop roads with the garage, field station and lookout pavilion. Your position is the green arrow.">
        <rect x="-180" y="-180" width="360" height="360" fill="#e8e6cc" />
        <path d="M-180-80Q-85-155 15-125T180-60M-180-50Q-80-125 25-95T180-30M-180 100Q-55 10 30 80T180 125" fill="none" stroke="#c3c8a9" stroke-width="12" />
        {#each roadPaths as points}<polyline {points} fill="none" stroke="#8c8b73" stroke-width="8" stroke-linejoin="round" /><polyline {points} fill="none" stroke="#eee9cd" stroke-width="2" stroke-dasharray="4 5" />{/each}
        {#each LANDMARKS as place, i}<circle cx={place.x} cy={place.z} r="12" fill="#faf8e9" stroke="#335341" stroke-width="2" /><text x={place.x} y={place.z + 4} text-anchor="middle" fill="#233c2e" font-size="12" font-weight="700">{i + 1}</text>{/each}
        <g transform="translate({car.x} {car.z}) rotate({car.heading * 180 / Math.PI})"><path d="M0-12 8 8 0 4-8 8Z" fill="#214c35" stroke="#fffced" stroke-width="2" /></g>
        <text x="150" y="-150" fill="#335341" font-size="14">N ↑</text>
      </svg>
      <div class="map-places">{#each LANDMARKS as place, i}<button class="topic-option" on:click={() => { destination = place; closePanel(); }}><span class="place-number">{i + 1}</span><span><strong>{place.place}</strong><small>{place.name}{visited.includes(place.id) ? ' · Met' : ''}</small></span><span>↗</span></button>{/each}</div>
      <p class="cast-note">Opening the map keeps your car exactly where you left it.</p>
    {:else}
      <h2 id="panel-title">Enjoy the pause.</h2>
      <p>A small open world. No timer, no required route.</p>
      <dl><dt>Drive</dt><dd>WASD / arrow keys</dd><dt>Brake / reverse</dt><dd>Down / S</dd><dt>Stop</dt><dd>Space / brake button</dd><dt>Talk</dt><dd>E / tap a nearby character’s prompt</dd><dt>Map</dt><dd>M / map button</dd><dt>On your phone</dt><dd>Point the joystick where you want to go.</dd></dl>
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
  .world-title { position: absolute; left: 50%; transform: translateX(-50%); text-align: center; color: #273e2d; text-shadow: 0 1px #f5f0d588; }
  .world-title span { display: block; font-size: 9px; letter-spacing: .19em; }
  .world-title strong { font: 500 30px var(--font-display); }
  .header-actions { display: flex; gap: 8px; }
  .hud-button > span:first-child { font-size: 21px; }
  .pause-button { width: 48px; padding: 0; }
  .location-card { position: absolute; top: 117px; left: 32px; padding: 17px 20px; max-width: 355px; border-left: 2px solid #476240; background: #f8f5e6e8; }
  .eyebrow { font-size: 9px; font-weight: 600; letter-spacing: .12em; }
  .location-card h1 { font: 500 28px var(--font-display); margin: 6px 0; }
  .location-card p { margin: 0; font-size: 11px; line-height: 1.6; }
  .clear-pin { min-height: 36px; border: 0; background: none; padding: 4px 0 0; font-size: 11px; text-decoration: underline; }
  .mini-map { position: absolute; top: 108px; right: 28px; width: 156px; padding: 7px; border: 1px solid #78856b; background: #faf8e8ed; border-radius: 5px; }
  .mini-map svg { display: block; width: 100%; border-radius: 2px; }
  .mini-map > span { display: flex; justify-content: space-between; padding: 5px 3px 0; font-size: 9px; font-weight: 600; }
  .driving-bar { position: absolute; bottom: 25px; left: 30px; right: 30px; display: flex; gap: 32px; align-items: center; padding: 16px 19px; border: 1px solid #73816866; border-radius: 5px; background: #f8f5e8ed; pointer-events: none; }
  .car-caption { display: flex; gap: 13px; align-items: center; }
  .car-dot { width: 13px; height: 27px; border: 2px solid #dee2d1; border-radius: 5px; background: #174b33; box-shadow: 0 0 0 1px #52674b; }
  .car-caption strong, .car-caption span, .keyboard-help span { display: block; }
  .car-caption strong { font-size: 12px; letter-spacing: .03em; }
  .car-caption div > span { font-size: 10px; opacity: .8; }
  .keyboard-help { margin-left: auto; font-size: 10px; line-height: 1.9; }
  kbd { font: 10px 'DM Sans', sans-serif; padding: 2px 5px; border: 1px solid #73816866; border-radius: 2px; }
  .speed { min-width: 55px; padding-left: 24px; border-left: 1px solid #73816866; }
  .speed strong { display: block; font: 500 32px/1 var(--font-display); }
  .speed span { font-size: 8px; letter-spacing: .1em; }
  .talk-prompt { position: absolute; bottom: 133px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 17px; min-height: 72px; border: 1px solid #435e43; padding: 12px 18px; background: #faf8ecf5; border-radius: 4px; box-shadow: 0 5px 20px #233c2e1c; text-align: left; white-space: nowrap; }
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
  .large-map { width: 100%; height: min(31vh, 280px); display: block; background: #e8e6cc; border: 1px solid #bac3a1; }
  .place-number { width: 28px; height: 28px; display: grid; place-items: center; border: 1px solid #a3ae9d; border-radius: 50%; }
  .map-places strong, .map-places small { display: block; }
  .map-places strong { font-size: 13px; font-weight: 500; }.map-places small { font-size: 11px; opacity: .8; }
  @media (max-width: 900px), (pointer: coarse) {
    .world-header { inset: max(15px, env(safe-area-inset-top)) 16px auto; }
    .world-title strong { font-size: 25px; }.world-title span { font-size: 8px; }
    .portfolio-link, .hud-button { padding: 0 12px; min-height: 46px; font-size: 12px; }.pause-button { width: 44px; }
    .location-card { left: 18px; top: 89px; padding: 10px 13px; max-width: calc(100% - 147px); }
    .location-card .eyebrow { font-size: 7px; letter-spacing: .06em; }.location-card h1 { font-size: 24px; }.location-card p { font-size: 10px; }
    .mini-map { top: 89px; right: 16px; width: 105px; padding: 5px; }.mini-map > span { font-size: 8px; }
    .driving-bar { bottom: calc(18px + env(safe-area-inset-bottom)); left: auto; right: 18px; padding: 0; background: none; border: 0; gap: 10px; }
    .car-caption { display: none; }.keyboard-help { display: none; }.speed { border: 0; padding: 9px 14px; background: #f8f5e8df; border-radius: 3px; }
    .speed strong { font-size: 27px; }
    .touch-controls { display: flex; position: absolute; inset: auto 20px calc(24px + env(safe-area-inset-bottom)); align-items: start; justify-content: space-between; pointer-events: none; }
    .joystick-wrap { text-align: center; }.joystick-wrap > span { display: block; font-size: 9px; margin-top: 10px; color: #243e2f; background: #f8f5e8df; padding: 3px 7px; border-radius: 2px; }
    .joystick { position: relative; width: 128px; height: 128px; padding: 0; border: 1px solid #38553a99; border-radius: 50%; background: #f4f1dc9e; box-shadow: inset 0 0 0 12px #faf8ea44; pointer-events: auto; touch-action: none; }
    .knob { position: absolute; top: 39px; left: 39px; width: 48px; height: 48px; border: 1px solid #274733; border-radius: 50%; background: #385b3ded; box-shadow: inset 0 0 0 5px #5d7c5277; }
    .axis-v, .axis-h { position: absolute; background: #48653b55; }.axis-v { top: 18px; bottom: 18px; width: 1px; left: 50%; }.axis-h { left: 18px; right: 18px; height: 1px; top: 50%; }
    .brake { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 65px; height: 65px; margin-top: 10px; border: 1px solid #527147; border-radius: 50%; background: #f8f5e8df; pointer-events: auto; touch-action: none; font-size: 8px; letter-spacing: .09em; }.brake span { font-size: 22px; line-height: 1.3; }
    .brake:active { background: #d6dec8; }
    .talk-prompt { bottom: calc(204px + env(safe-area-inset-bottom)); min-height: 62px; padding: 8px 13px; gap: 12px; }.talk-prompt strong { font-size: 13px; }.talk-prompt kbd { display: none; }
    dialog { inset: auto 16px max(16px, env(safe-area-inset-bottom)) auto; padding: 18px 22px; max-height: calc(100dvh - 32px); }dialog h2 { font-size: 38px; }
  }
  @media (max-width: 560px) {
    .world-title { display: none; }.location-card { top: 84px; max-width: calc(100% - 140px); }.mini-map { top: 84px; }
    .location-card h1 { font-size: 23px; }.location-card .eyebrow { display: none; }.location-card p { line-height: 1.6; }
    .button-word { display: inline; }.header-actions { gap: 6px; }
    .map-dialog h2 { font-size: 34px; }.map-dialog > p { font-size: 12px; }
    .large-map { height: min(30vh, 245px); }dl { grid-template-columns: 105px 1fr; }
  }
  @media (max-height: 520px) {
    .location-card { display: none; }.mini-map { width: 89px; }.mini-map > span { display: none; }.talk-prompt { bottom: 28px; }
    .joystick { width: 112px; height: 112px; }.knob { top: 31px; left: 31px; }.joystick-wrap > span { display: none; }
    .touch-controls { bottom: 18px; }.driving-bar { bottom: 15px; }.brake { margin-top: -16px; }.speed { margin-top: 70px; }
  }
</style>
