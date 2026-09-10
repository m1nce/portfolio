<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { driveState, roadPosition } from '$lib/drive.js';

  let scene;
  let car;
  let road = '';
  let roadWidth = 110;
  let landmarks = [];
  let progress = 0;
  let currentStop = 'Trailhead';
  let paused = false;
  let reducedMotion = false;
  let updateScene = () => {};
  $: stationary = paused || reducedMotion;
  $: if (stationary !== undefined) updateScene();

  onMount(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sections = [...document.querySelectorAll('[data-landmark]')];
    let frame = 0;
    let previous;
    let width = 0;
    let height = 0;
    let measure = true;

    function draw() {
      frame = 0;
      const bounds = scene.getBoundingClientRect();
      const sceneTop = bounds.top + window.scrollY;
      if (measure) {
        width = scene.querySelector('.scenery').clientWidth;
        height = scene.clientHeight;
        roadWidth = roadPosition(0, width).roadWidth;
        const points = Array.from({ length: Math.ceil(height / 16) + 1 }, (_, index) => {
          const y = Math.min(index * 16, height);
          return roadPosition(y, width).x + ',' + y;
        });
        road = 'M' + points.join(' L');
        landmarks = sections.map(section => {
          const rect = section.getBoundingClientRect();
          const y = rect.top + window.scrollY - sceneTop + rect.height / 2;
          return { y, start: roadPosition(y, width).x + roadWidth / 2 + 9, end: rect.left - bounds.left - 14 };
        });
        measure = false;
      }

      const anchor = window.innerHeight * 0.55;
      const targetY = Math.max(0, Math.min(height - 90, window.scrollY + anchor - sceneTop));
      previous = driveState(targetY, height - 90, stationary, previous ?? driveState(targetY, height - 90));
      const y = Math.min(previous.distance, height - 90);
      const point = roadPosition(y, width);
      // Keep the stock car in the downhill lane, to the driver's right.
      const laneOffset = roadWidth * 0.23;
      const radians = point.angle * Math.PI / 180;
      car.style.transform = 'translate(' + (point.x - laneOffset * Math.cos(radians)) + 'px,' + (y - laneOffset * Math.sin(radians)) + 'px) translate(-50%, -50%) rotate(' + point.angle + 'deg)';
      car.style.width = roadWidth * 0.68 + 'px';
      progress = driveState(window.scrollY, document.documentElement.scrollHeight - window.innerHeight).progress;
      currentStop = 'Trailhead';
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= anchor) currentStop = section.dataset.landmark;
      }
    }

    updateScene = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const resize = () => { measure = true; updateScene(); };
    const setPreference = () => { reducedMotion = preference.matches; updateScene(); };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(scene);
    preference.addEventListener('change', setPreference);
    window.addEventListener('scroll', updateScene, { passive: true });
    window.addEventListener('resize', resize);
    setPreference();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      preference.removeEventListener('change', setPreference);
      window.removeEventListener('scroll', updateScene);
      window.removeEventListener('resize', resize);
      updateScene = () => {};
    };
  });
</script>

<div class="drive-scene" bind:this={scene} aria-hidden="true">
  <div class="scenery">
    <div class="terrain">
      {#each [0, 1, 2, 3] as tile}
        <img src="{base}/img/mountain-terrain.png" alt="" class:flipped={tile % 2 === 1} fetchpriority={tile === 0 ? 'high' : 'auto'} />
      {/each}
    </div>
  </div>
  <svg class="mountain-pass" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
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
    {#each landmarks as landmark}
      <path d={'M' + landmark.start + ',' + landmark.y + ' H' + landmark.end} fill="none" stroke="currentColor" stroke-opacity=".38" stroke-dasharray="2 5" />
      <circle cx={landmark.start} cy={landmark.y} r="4" fill="#e9e8d7" stroke="#59664c" stroke-width="2" />
    {/each}
  </svg>
  <img class="mx5" bind:this={car} src="{base}/img/green-nb2-overhead.png" alt="" fetchpriority="high" />
</div>

<div class="route-location" aria-hidden="true">
  <span class="route-shield">S1</span>
  <div>Laguna Mountains<span>Southern California</span></div>
</div>

<div class="journey-status">
  <div class="status-line"><span>{currentStop}</span><span>{Math.round(progress * 100)}%</span></div>
  <div class="trip-progress" role="progressbar" aria-label="Portfolio journey" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)}><span style:width={progress * 100 + '%'}></span></div>
  <div class="drive-controls">
    <span class="car-caption">Mazda MX-5 <span>NB2 / British racing green</span></span>
    <button aria-pressed={!stationary} aria-label="Driving animation" on:click={() => { paused = !stationary; reducedMotion = false; }}>
      <span aria-hidden="true">{stationary ? '▷' : 'Ⅱ'}</span> {stationary ? 'Motion off' : 'Motion on'}
    </button>
  </div>
</div>

<style>
  .drive-scene { position: absolute; inset: 0; pointer-events: none; overflow: hidden; color: var(--text); }
  .scenery { position: absolute; inset: 0 auto 0 0; width: 50%; overflow: hidden; background: #b7b794; }
  .terrain { display: flex; flex-direction: column; height: 100%; opacity: .9; }
  .terrain img { display: block; width: 100%; height: 25%; object-fit: cover; flex-shrink: 0; }
  .terrain img.flipped { transform: scaleY(-1); }
  .mountain-pass { position: absolute; inset: 0; overflow: visible; }
  .mx5 { position: absolute; top: 0; left: 0; width: 76px; max-width: none; transform-origin: center; filter: drop-shadow(5px 7px 3px #17231f65); will-change: transform; }
  .route-location { position: absolute; top: 120px; left: 3.5vw; display: flex; align-items: center; gap: .75rem; padding: .65rem .8rem; background: #e7e8d9ed; color: #2d422f; font-size: .9rem; line-height: 1.4; }
  .route-location div > span { display: block; font-size: .7rem; margin-top: .2rem; }
  .route-shield { padding: .25rem .4rem .4rem; border: 1.5px solid currentColor; border-radius: 3px 3px 12px 12px; font: 600 1rem var(--font-display); }
  .journey-status { position: fixed; z-index: 10; bottom: 0; left: 0; width: 50%; padding: 1rem 3.5vw 1.35rem; background: #e7e8d9f0; color: #324531; border-top: 1px solid #64715a33; }
  .status-line { display: flex; justify-content: space-between; font-size: .72rem; }
  .trip-progress { height: 2px; margin: .65rem 0 .8rem; background: #64715a33; }
  .trip-progress > span { display: block; height: 100%; background: #465d3b; }
  .drive-controls { display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
  .car-caption { font-size: .78rem; }
  .car-caption > span { color: #62705a; margin-left: .55rem; font-size: .65rem; }
  button { min-height: 32px; padding: 0; border: 0; color: inherit; background: none; font-size: .7rem; white-space: nowrap; }
  button > span { margin-right: .3rem; }
  :global(html[data-theme='dark']) .scenery { filter: brightness(.65) saturate(.65); }
  :global(html[data-theme='dark']) .mountain-pass { filter: brightness(.75); }
  :global(html[data-theme='dark']) .route-location { background: #253427ed; color: #e5e7cc; }
  :global(html[data-theme='dark']) .journey-status { background: #253427f5; color: #d8ddc7; }
  :global(html[data-theme='dark']) .car-caption > span { color: #b7c4ab; }
  @media (max-width: 1000px) { .car-caption > span { display: block; margin: .15rem 0 0; } }
  @media (max-width: 700px) {
    .scenery { width: 27%; }
    .route-location { top: 98px; left: .7rem; padding: .5rem; }
    .route-location div { display: none; }
    .journey-status { width: 27%; padding: .6rem .7rem .8rem; }
    .status-line { justify-content: center; font-size: .66rem; }
    .status-line > span:first-child, .car-caption { display: none; }
    .trip-progress { margin: .4rem 0; }
    .drive-controls { justify-content: center; }
    button { font-size: .6rem; min-height: 44px; }
    button > span { margin: 0; }
    .mx5 { filter: drop-shadow(2px 3px 2px #17231f65); }
  }
</style>
