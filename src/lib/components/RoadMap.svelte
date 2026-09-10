<script>
  import { createEventDispatcher } from 'svelte';

  export let stops = [];
  export let current = 'home';
  const dispatch = createEventDispatcher();
  let dialog;

  export function show() {
    if (dialog && !dialog.open) dialog.showModal();
  }

  function choose(id) {
    dispatch('choose', { id });
    dialog.close();
  }
</script>

<dialog bind:this={dialog} aria-labelledby="road-map-title" aria-describedby="road-map-note" on:close={() => dispatch('close')}>
  <div class="map-heading">
    <span class="eyebrow">Sunday drive / Road map</span>
    <button class="close" type="button" on:click={() => dialog.close()}>Close <span aria-hidden="true">×</span></button>
  </div>
  <h2 id="road-map-title">Pick your next stop.</h2>
  <p id="road-map-note">Choose any stop. The whole portfolio is open.</p>
  <ol>
    {#each stops as stop, index (stop.id)}
      <li>
        <button class="destination" type="button" aria-current={current === stop.id ? 'location' : undefined} on:click={() => choose(stop.id)}>
          <span class="marker" aria-hidden="true">{index + 1}</span>
          <span class="stop-copy"><strong>{stop.label}</strong><span>{stop.description}</span></span>
          <span class="arrow" aria-hidden="true">↗</span>
        </button>
      </li>
    {/each}
  </ol>
</dialog>

<style>
  dialog { width: calc(100% - 2rem); max-width: 540px; max-height: 85dvh; overflow-y: auto; margin: auto; padding: clamp(1.25rem, 4vw, 2rem); border: 1px solid var(--border); background: var(--bg); color: var(--text); }
  dialog::backdrop { background: #10201799; }
  .map-heading { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-bottom: 1.5rem; }
  .eyebrow { font-size: .7rem; letter-spacing: .03em; color: var(--text-muted); }
  button { color: inherit; }
  .close { display: flex; align-items: center; gap: .6rem; min-height: 44px; padding: .4rem .6rem; border: 1px solid var(--border); background: transparent; font-size: .8rem; }
  .close span { font-size: 1.25rem; }
  h2 { font-family: var(--font-display); font-size: clamp(2.2rem, 6vw, 3rem); font-weight: 500; margin-bottom: .75rem; }
  p { font-size: .85rem; color: var(--text-muted); }
  ol { position: relative; list-style: none; margin: 1.75rem 0 0; padding: 0; }
  ol::before { content: ''; position: absolute; top: 2.5rem; bottom: 2.5rem; left: 24px; border-left: 1px dashed var(--text-muted); }
  li { position: relative; }
  .destination { display: grid; grid-template-columns: 36px minmax(0, 1fr) 16px; align-items: center; gap: .8rem; width: 100%; min-height: 90px; padding: .8rem .4rem; border: 0; background: transparent; text-align: left; }
  .destination:hover, .destination[aria-current] { background: var(--accent-dim); }
  .marker { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid var(--accent); border-radius: 50%; background: var(--bg); font-size: .8rem; font-variant-numeric: tabular-nums; }
  .destination[aria-current] .marker { background: var(--accent); color: var(--bg); }
  .stop-copy { display: grid; gap: .25rem; }
  strong { font-size: 1rem; font-weight: 600; }
  .stop-copy > span { font-size: .8rem; line-height: 1.5; color: var(--text-muted); }
  .arrow { font-size: 1rem; }
</style>
