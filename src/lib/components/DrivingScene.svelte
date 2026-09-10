<script>
  import { onMount, tick } from 'svelte';
  import { base } from '$app/paths';
  import { advanceCar, driveState, joystickInput, roadPosition } from '$lib/drive.js';
  import RoadMap from './RoadMap.svelte';

  export let parked = null;
  let scene, world, car, controls, mobileControls, map;
  let road = '', roadWidth = 110, landscapeWidth = 0, landmarks = [];
  let progress = 0, speed = 0, current = 'home', nearby = null;
  let driving = false, motion = true, mapOpen = false;
  let mobile = false, stickPointer = null, stick = joystickInput(0, 0);
  let start = () => {}, stop = () => {}, park = () => {}, refresh = () => {};
  const held = new Set();
  const pointers = new Map();
  const stops = [
    { id: 'home', label: 'The trailhead', description: 'Meet Minchan.' },
    { id: 'work', label: 'The overlook', description: 'Projects and a hands-on example.' },
    { id: 'about', label: 'Behind the wheel', description: 'Research, background, and interests.' },
    { id: 'contact', label: 'Say hello', description: 'The start of another conversation.' }
  ];
  const arrows = [
    { key: 'ArrowUp', symbol: '↑', label: 'Accelerate' },
    { key: 'ArrowDown', symbol: '↓', label: 'Brake' },
    { key: 'ArrowLeft', symbol: '←', label: 'Steer left' },
    { key: 'ArrowRight', symbol: '→', label: 'Steer right' }
  ];
  export function startDrive() { start(); }
  export function openMap() { stop(); mapOpen = true; map.show(); }
  export function parkAt(id) { return park(id); }

  function press(event, key) {
    event.preventDefault();
    if (!driving) start();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, key);
  }
  function release(event) { pointers.delete(event.pointerId); }
  function moveStick(event) {
    if (event.pointerId !== stickPointer) return;
    const stickBounds = event.currentTarget.getBoundingClientRect();
    const radius = stickBounds.width * .28;
    stick = joystickInput((event.clientX - stickBounds.left - stickBounds.width / 2) / radius,
      (event.clientY - stickBounds.top - stickBounds.height / 2) / radius);
  }
  function pressStick(event) {
    if (stickPointer !== null || event.button !== 0) return;
    event.preventDefault();
    stickPointer = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveStick(event);
  }
  function releaseStick(event) {
    if (event && event.pointerId !== stickPointer) return;
    stickPointer = null;
    stick = joystickInput(0, 0);
  }

  onMount(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const phone = window.matchMedia('(max-width: 700px), (max-width: 1000px) and (max-height: 500px)');
    mobile = phone.matches;
    const markers = [...document.querySelectorAll('[data-landmark]')];
    let frame = 0, previousTime = 0, measure = true, state;
    let sceneTop = 0, height = 0, maxY = 0;
    const anchor = () => mobile ? scene.clientHeight * .55 : window.innerHeight * .52;
    const clear = () => { held.clear(); pointers.clear(); releaseStick(); if (state) state.speed = 0; speed = 0; };
    const onRoad = (y) => {
      const point = roadPosition(y, landscapeWidth);
      return { x: point.x - point.roadWidth * .2, y, heading: -point.angle * Math.PI / 180, speed: 0 };
    };
    function layout() {
      const bounds = scene.parentElement.getBoundingClientRect();
      sceneTop = bounds.top + window.scrollY;
      landscapeWidth = scene.querySelector('.scenery').clientWidth;
      height = scene.parentElement.clientHeight;
      world.style.height = height + 'px';
      maxY = document.documentElement.scrollHeight - window.innerHeight + anchor() - sceneTop;
      roadWidth = roadPosition(0, landscapeWidth).roadWidth;
      road = 'M' + Array.from({ length: Math.ceil(height / 16) + 1 }, (_, i) => {
        const y = Math.min(i * 16, height);
        return roadPosition(y, landscapeWidth).x + ',' + y;
      }).join(' L');
      const contentTop = mobile ? parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) : 0;
      landmarks = markers.map(marker => {
        const rect = marker.getBoundingClientRect();
        const y = rect.top + window.scrollY - sceneTop + rect.height / 2;
        const stopY = Math.max(0, Math.min(maxY, mobile ? y - contentTop - 16 + anchor() : y + Math.min(180, window.innerHeight * .25)));
        const point = roadPosition(stopY, landscapeWidth);
        const side = point.x > landscapeWidth / 2 ? -1 : 1;
        const parkX = Math.max(roadWidth * .38, Math.min(landscapeWidth - roadWidth * .38, point.x + side * roadWidth * .7));
        return { id: marker.closest('section').id, y, stopY, parkX, angle: point.angle,
          start: roadPosition(y, landscapeWidth).x + roadWidth / 2 + 9, end: rect.left - bounds.left - 14 };
      });
      measure = false;
    }
    function draw(time) {
      frame = 0;
      if (measure) layout();
      const target = Math.max(0, Math.min(maxY, window.scrollY + anchor() - sceneTop));
      if (!state || (!driving && !parked && motion)) state = onRoad(target);
      if (driving) {
        const pressed = key => held.has(key) || [...pointers.values()].includes(key);
        state = advanceCar(state, { throttle: pressed('ArrowUp') ? 1 : stick.throttle, brake: pressed('ArrowDown') || stick.brake,
          steering: Math.max(-1, Math.min(1, Number(pressed('ArrowRight')) - Number(pressed('ArrowLeft')) + stick.steering)) }, (time - previousTime) / 1000, landscapeWidth, maxY);
        window.scrollTo({ top: state.y - anchor() + sceneTop, behavior: 'instant' });
        speed = Math.round(state.speed / 6);
      }
      previousTime = time;
      world.style.transform = mobile ? `translateY(${-window.scrollY + sceneTop}px)` : '';
      const point = parked && landmarks.find(item => item.id === parked);
      const x = point ? point.parkX : state.x;
      const y = point ? point.stopY : state.y;
      const angle = point ? point.angle : -state.heading * 180 / Math.PI;
      car.style.transform = `translate(${x}px,${y}px) translate(-50%, -50%) rotate(${angle}deg)`;
      car.style.width = roadWidth * .68 + 'px';
      progress = driveState(window.scrollY, document.documentElement.scrollHeight - window.innerHeight).progress;
      current = 'home';
      nearby = null;
      let closest = Math.max(160, window.innerHeight * .28);
      for (const item of landmarks) {
        if ((mobile ? item.stopY : item.y) <= target + 2) current = item.id;
        const distance = Math.abs(item.stopY - state.y);
        if (distance < closest) { closest = distance; nearby = item; }
      }
      if (driving) refresh();
    }
    refresh = () => { if (!frame) frame = requestAnimationFrame(draw); };
    stop = () => { driving = false; clear(); refresh(); };
    start = () => {
      if (mapOpen) return;
      if (measure) layout();
      state = onRoad(Math.max(0, Math.min(maxY, window.scrollY + anchor() - sceneTop)));
      parked = null;
      clear();
      motion = true;
      driving = true;
      previousTime = performance.now();
      (mobile ? mobileControls : controls).focus({ preventScroll: true });
      refresh();
    };
    park = async id => {
      stop();
      parked = id;
      await tick();
      layout();
      const point = landmarks.find(item => item.id === id);
      if (!point) return;
      state = onRoad(point.stopY);
      window.scrollTo({ top: point.stopY - anchor() + sceneTop, behavior: 'instant' });
      document.querySelector('#' + id + ' h1, #' + id + ' h2')?.focus({ preventScroll: true });
      refresh();
    };
    const interactive = target => target instanceof Element && target.closest('a,button,input,textarea,select,summary,[contenteditable],dialog');
    function keydown(event) {
      if (mapOpen || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Escape') { if (driving) { event.preventDefault(); stop(); } return; }
      const arrowControl = event.target instanceof Element && event.target.matches('.arrow, .joystick');
      if (interactive(event.target) && !arrowControl) return;
      if (!driving) return;
      if (['PageUp', 'PageDown', 'Home', 'End'].includes(event.key) || (event.key === ' ' && !arrowControl)) { browse(); return; }
      if (event.key.startsWith('Arrow')) { event.preventDefault(); held.add(event.key); }
      if (event.key === 'Enter' && !arrowControl && nearby && !event.repeat) { event.preventDefault(); park(nearby.id); }
      if (event.key.toLowerCase() === 'm') { event.preventDefault(); openMap(); }
    }
    const keyup = event => held.delete(event.key);
    const scroll = () => { refresh(); };
    const browse = () => { stop(); parked = null; };
    const inControls = target => controls.contains(target) || mobileControls.contains(target);
    const touchmove = event => { if (!inControls(event.target)) browse(); };
    const navigate = event => { if (event.target instanceof Element && event.target.closest('a')) browse(); };
    let viewportWidth = window.innerWidth;
    const resize = () => {
      measure = true;
      // Mobile browser chrome changes height while driving; only a width change resets steering.
      if (viewportWidth !== window.innerWidth || mobile !== phone.matches) { viewportWidth = window.innerWidth; mobile = phone.matches; state = undefined; stop(); }
      if (parked) park(parked);
      refresh();
    };
    const setPreference = () => { motion = !preference.matches; stop(); };
    const visibility = () => { if (document.hidden) stop(); };
    const focus = event => { if (driving && interactive(event.target) && !inControls(event.target)) stop(); };
    const observer = new ResizeObserver(() => { measure = true; refresh(); });
    observer.observe(scene.parentElement);
    const events = [['keydown', keydown], ['keyup', keyup], ['scroll', scroll], ['resize', resize],
      ['blur', stop], ['wheel', browse], ['touchmove', touchmove], ['hashchange', browse],
      ['click', navigate], ['focusin', focus], ['open-road-map', openMap]];
    for (const [name, handler] of events) window.addEventListener(name, handler, name === 'wheel' || name === 'touchmove' || name === 'scroll' ? { passive: true } : undefined);
    document.addEventListener('visibilitychange', visibility);
    preference.addEventListener('change', setPreference);
    setPreference();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      for (const [name, handler] of events) window.removeEventListener(name, handler);
      document.removeEventListener('visibilitychange', visibility);
      preference.removeEventListener('change', setPreference);
      clear();
    };
  });
</script>

<div class="drive-scene" bind:this={scene} aria-hidden="true">
 <div class="drive-world" bind:this={world}>
  <div class="scenery"><div class="terrain">
    {#each [0, 1, 2, 3] as tile}
      <img src="{base}/img/mountain-terrain.png" alt="" class:flipped={tile % 2 === 1} fetchpriority={tile === 0 ? 'high' : 'auto'} />
    {/each}
  </div></div>
  <svg class="mountain-pass" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="landscape-clip"><rect width={landscapeWidth} height="100%" /></clipPath></defs>
    <g clip-path="url(#landscape-clip)">
      {#each landmarks as landmark}
        <ellipse cx={landmark.parkX} cy={landmark.stopY} rx={roadWidth * .54} ry={roadWidth * .8} fill="#777b70" stroke="#d2c6a5" stroke-width="9" transform="rotate({landmark.angle} {landmark.parkX} {landmark.stopY})" />
      {/each}
    </g>
    <g fill="none" stroke-linejoin="round" stroke-linecap="round">
      <path d={road} stroke="#424830" stroke-opacity=".2" stroke-width={roadWidth + 30} transform="translate(6 12)" />
      <path d={road} stroke="#baad85" stroke-width={roadWidth + 22} />
      <path d={road} stroke="#d2c6a5" stroke-width={roadWidth + 12} />
      <path d={road} stroke="#74786d" stroke-width={roadWidth} />
      <path d={road} stroke="#dad9c3" stroke-width={roadWidth - 9} />
      <path d={road} stroke="#777b70" stroke-width={roadWidth - 13} />
      <path d={road} stroke="#e6cf82" stroke-width="5" />
      <path d={road} stroke="#777b70" stroke-width="1.7" />
    </g>
    {#each mobile ? [] : landmarks as landmark}
      <path d={'M' + landmark.start + ',' + landmark.y + ' H' + landmark.end} fill="none" stroke="currentColor" stroke-opacity=".38" stroke-dasharray="2 5" />
      <circle cx={landmark.start} cy={landmark.y} r="4" fill="#e9e8d7" stroke="#59664c" stroke-width="2" />
    {/each}
  </svg>
  <img class="mx5" bind:this={car} src="{base}/img/green-nb2-overhead.png" alt="" fetchpriority="high" />
 </div>
</div>
<div class="route-location" aria-hidden="true"><span class="route-shield">S1</span><div>Laguna Mountains<span>Southern California</span></div></div>

<div class="journey-status" class:driving bind:this={controls} role="region" aria-label="Driving controls" tabindex="-1">
  <div class="status-line"><span>{stops.find(stop => stop.id === current)?.label}</span><span>{Math.round(progress * 100)}%</span></div>
  <div class="trip-progress" role="progressbar" aria-label="Portfolio journey" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)}><span style:width={progress * 100 + '%'}></span></div>
  <div class="drive-controls">
    <div class="drive-copy"><strong>Sunday drive</strong><span class="car-caption">Stock NB2 / British racing green</span><span class="key-guide">↑ Accelerate · ← → Steer · ↓ Brake</span></div>
    {#if driving}
      <div class="arrow-pad" aria-label="Hold to drive">
        {#each arrows as arrow}
          <button class="arrow" aria-label={arrow.label} title={arrow.label} on:pointerdown={event => press(event, arrow.key)} on:pointerup={release} on:pointercancel={release} on:lostpointercapture={release} on:keydown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); held.add(arrow.key); } }} on:keyup={event => { if (event.key === ' ' || event.key === 'Enter') held.delete(arrow.key); }} on:blur={() => held.delete(arrow.key)}>{arrow.symbol}</button>
        {/each}
      </div>
    {:else}<button class="start" on:click={startDrive}>{parked ? 'Continue' : 'Drive'} <span aria-hidden="true">↑</span></button>{/if}
  </div>
  <p class="drive-message" role="status">{parked ? 'Parked. Take your time.' : driving ? nearby ? 'Enter to pull over' : 'Follow the bends. Esc to browse.' : motion ? 'Drive, or scroll at your own pace.' : 'Motion off. Start driving to opt in.'}</p>
  <div class="utility-controls">
    <button on:click={openMap}>Map</button>
    {#if driving}<button on:click={() => park(nearby.id)} disabled={!nearby}>Park</button><button on:click={() => stop()}>Exit</button>
    {:else}<button aria-pressed={motion} on:click={() => { motion = !motion; refresh(); }}>Motion {motion ? 'on' : 'off'}</button>{/if}
    <span class="speed" aria-hidden="true">{driving ? speed + ' mph' : 'MX-5'}</span>
  </div>
</div>
<div class="mobile-controller" class:driving bind:this={mobileControls} role="region" aria-label="Phone driving controls" tabindex="-1">
  <div class="mobile-status"><strong>{stops.find(stop => stop.id === current)?.label}</strong><span>{parked ? 'Parked · ' : ''}{Math.round(progress * 100)}% of the route</span></div>
  {#if driving}
    <button class="joystick" class:held={stickPointer !== null} aria-label="Driving joystick" aria-describedby="joystick-instructions" on:pointerdown={pressStick} on:pointermove={moveStick} on:pointerup={releaseStick} on:pointercancel={event => { releaseStick(event); stop(); }} on:lostpointercapture={releaseStick} on:contextmenu={event => event.preventDefault()}>
      <span class="stick-up" aria-hidden="true">↑</span><span class="stick-down" aria-hidden="true">↓</span>
      <span class="stick-left" aria-hidden="true">←</span><span class="stick-right" aria-hidden="true">→</span>
      <span class="stick-thumb" style:left="{50 + stick.x * 28}%" style:top="{50 + stick.y * 28}%" aria-hidden="true"><span></span></span>
    </button>
    <div class="mobile-actions">
      <p id="joystick-instructions">Push up to drive.<br />Steer sideways. Pull down to brake.</p>
      <div class="mobile-action-row"><button class="pull-over" disabled={!nearby} on:click={() => park(nearby.id)}>Pull over</button><button on:click={openMap}>Map</button><button on:click={() => stop()}>Exit</button></div>
      <span class="mobile-message" role="status">{nearby ? 'A stop is nearby.' : 'Release to coast.'}</span>
    </div>
  {:else}
    <div class="mobile-action-row"><button class="start" on:click={startDrive}>{parked ? 'Continue' : 'Drive'}</button><button on:click={openMap}>Map</button><button class="motion-toggle" aria-label="Driving animation" aria-pressed={motion} on:click={() => { motion = !motion; refresh(); }}>{motion ? 'Ⅱ' : '▷'}</button></div>
  {/if}
</div>
<RoadMap bind:this={map} {stops} {current} on:choose={event => park(event.detail.id)} on:close={() => mapOpen = false} />

<style>
  .drive-scene { position: absolute; inset: 0; pointer-events: none; overflow: hidden; color: var(--text); }
  .drive-world { position: absolute; inset: 0 0 auto; width: 100%; }
  .mobile-controller { display: none; }
  .scenery { position: absolute; inset: 0 auto 0 0; width: 50%; overflow: hidden; background: #b7b794; }
  .terrain { display: flex; flex-direction: column; height: 100%; opacity: .9; }
  .terrain img { display: block; width: 100%; height: 25%; object-fit: cover; flex-shrink: 0; }
  .terrain img.flipped { transform: scaleY(-1); }
  .mountain-pass { position: absolute; inset: 0; overflow: visible; }
  .mx5 { position: absolute; top: 0; left: 0; width: 76px; max-width: none; transform-origin: center; filter: drop-shadow(5px 7px 3px #17231f65); will-change: transform; }
  .route-location { position: absolute; top: 120px; left: 3.5vw; display: flex; align-items: center; gap: .75rem; padding: .65rem .8rem; background: #e7e8d9ed; color: #2d422f; font-size: .9rem; line-height: 1.4; }
  .route-location div > span { display: block; font-size: .7rem; margin-top: .2rem; }
  .route-shield { padding: .25rem .4rem .4rem; border: 1.5px solid currentColor; border-radius: 3px 3px 12px 12px; font: 600 1rem var(--font-display); }
  .journey-status { position: fixed; z-index: 10; bottom: 0; left: 0; width: 50%; padding: 1rem 3.5vw; background: var(--bg); color: var(--text); border-top: 1px solid var(--border); }
  .journey-status:focus { outline: none; }
  .journey-status:focus-visible { outline: 2px solid var(--accent); outline-offset: -3px; }
  .status-line { display: flex; justify-content: space-between; font-size: .72rem; }
  .trip-progress { height: 2px; margin: .65rem 0 .8rem; background: var(--border); }
  .trip-progress > span { display: block; height: 100%; background: var(--accent); }
  .drive-controls { display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
  .drive-copy { display: grid; gap: .2rem; }
  .drive-copy strong { font: 500 1.5rem var(--font-display); }
  .car-caption, .key-guide { font-size: .65rem; color: var(--text-muted); }
  button { min-height: 44px; border: 1px solid var(--border); padding: .5rem .75rem; color: inherit; background: transparent; font-size: .75rem; }
  button:hover { background: var(--accent-dim); }
  button:disabled { opacity: .4; cursor: default; }
  .start { background: var(--accent); color: var(--bg); }
  .start:hover { background: var(--text); }
  .arrow-pad { display: grid; grid-template-columns: repeat(2, 44px); gap: 4px; }
  .arrow { touch-action: none; user-select: none; padding: 0; font-size: 1.2rem; }
  .arrow:active { background: var(--accent); color: var(--bg); }
  .drive-message { font-size: .7rem; color: var(--text-muted); margin: .6rem 0 .25rem; }
  .utility-controls { display: flex; align-items: center; gap: .5rem; }
  .utility-controls button { border: 0; padding-inline: .5rem; }
  .speed { margin-left: auto; font: .75rem var(--font-mono); white-space: nowrap; }
  :global(html[data-theme='dark']) .scenery { filter: brightness(.65) saturate(.65); }
  :global(html[data-theme='dark']) .mountain-pass { filter: brightness(.75); }
  :global(html[data-theme='dark']) .route-location { background: #253427ed; color: #e5e7cc; }
  @media (max-width: 1000px) { .key-guide { max-width: 160px; } }
  @media (max-width: 700px), (max-width: 1000px) and (max-height: 500px) {
    .drive-scene { position: fixed; top: 72px; bottom: auto; height: var(--mobile-road-height); z-index: 5; border-bottom: 1px solid var(--border); }
    .scenery { width: 100%; }
    .route-location { position: fixed; z-index: 6; top: 84px; left: 12px; padding: .35rem .5rem; gap: .5rem; font-size: .7rem; }
    .route-location div > span { display: none; }
    .route-shield { font-size: .75rem; }
    .journey-status { display: none; }
    .mobile-controller { position: fixed; z-index: 10; inset: auto 0 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px max(12px, env(safe-area-inset-bottom)); background: var(--bg); border-top: 1px solid var(--border); }
    .mobile-controller:focus { outline: none; }
    .mobile-controller:focus-visible { outline: 2px solid var(--accent); outline-offset: -3px; }
    .mobile-status { display: grid; min-width: 0; gap: 2px; }
    .mobile-status strong { font-size: .8rem; font-weight: 550; line-height: 1.3; }
    .mobile-status > span { color: var(--text-muted); font-size: .65rem; }
    .mobile-action-row { display: flex; align-items: center; gap: 6px; }
    .mobile-action-row button { font-size: .75rem; min-width: 44px; padding: .45rem .65rem; white-space: nowrap; }
    .motion-toggle { font-size: 1rem; }
    .mobile-controller.driving { display: grid; grid-template-columns: 128px minmax(0, 1fr); gap: 4px 16px; }
    .driving .mobile-status { grid-column: 2; }
    .joystick { position: relative; grid-column: 1; grid-row: 1 / 3; width: 128px; height: 128px; border-radius: 50%; border: 1px solid var(--border); background: var(--accent-dim); padding: 0; touch-action: none; user-select: none; -webkit-touch-callout: none; }
    .joystick > span { position: absolute; pointer-events: none; }
    .stick-up { top: 1px; left: 50%; transform: translateX(-50%); }
    .stick-down { bottom: 1px; left: 50%; transform: translateX(-50%); }
    .stick-left { left: 5px; top: 50%; transform: translateY(-50%); }
    .stick-right { right: 5px; top: 50%; transform: translateY(-50%); }
    .joystick .stick-thumb { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; background: var(--accent); border: 4px solid var(--bg); box-shadow: 0 2px 5px #17231f25; transform: translate(-50%, -50%); }
    .stick-thumb > span { width: 10px; height: 10px; border: 1px solid var(--bg); border-radius: 50%; opacity: .7; }
    .joystick.held { border-color: var(--accent); }
    .mobile-actions { grid-column: 2; }
    .mobile-actions p { color: var(--text-muted); font-size: .7rem; line-height: 1.45; margin: 3px 0 8px; }
    .mobile-actions .mobile-action-row { flex-wrap: wrap; gap: 4px; }
    .mobile-actions button { padding-inline: .45rem; font-size: .7rem; }
    .pull-over:not(:disabled) { background: var(--accent); color: var(--bg); }
    .mobile-message { display: block; margin-top: 5px; font-size: .65rem; color: var(--text-muted); }
    .mx5 { filter: drop-shadow(2px 3px 2px #17231f65); }
  }
  @media (max-width: 360px) {
    .mobile-controller { padding-inline: 12px; gap: 8px; }
    .mobile-controller.driving { grid-template-columns: 112px minmax(0, 1fr); gap: 4px 12px; }
    .joystick { width: 112px; height: 112px; }
    .joystick .stick-thumb { width: 46px; height: 46px; }
  }
  @media (min-width: 560px) and (max-width: 1000px) and (max-height: 500px) {
    .drive-scene { width: 45%; }
    .mobile-controller { right: auto; width: 45%; height: 116px; padding: 10px 12px; }
    .mobile-controller.driving { grid-template-columns: 92px minmax(0, 1fr); gap: 8px; }
    .driving .mobile-status, .mobile-message { display: none; }
    .joystick { width: 92px; height: 92px; grid-row: 1; }
    .joystick .stick-thumb { width: 38px; height: 38px; }
    .mobile-actions { grid-row: 1; }
    .mobile-actions p { font-size: .64rem; margin-bottom: 4px; }
    .mobile-actions .mobile-action-row { gap: 0; }
    .mobile-actions button { padding-inline: .25rem; min-width: 40px; }
    .mobile-controller:not(.driving) { flex-wrap: wrap; gap: 4px; }
    .mobile-controller:not(.driving) .mobile-status { flex: 1; }
    .mobile-controller:not(.driving) .mobile-action-row { gap: 4px; }
  }
</style>
