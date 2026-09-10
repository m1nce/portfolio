<script>
  export let open = false;

  const trails = [
    { name: 'Cedar Loop', elevation: 640 },
    { name: 'Ridge Trail', elevation: 1180 },
    { name: 'Valley Walk', elevation: 320 }
  ];
  let highestFirst = false;
  $: rows = highestFirst ? [...trails].sort((a, b) => b.elevation - a.elevation) : trails;
</script>

<details bind:open>
  <summary>Try a small example</summary>
  <div class="demo-content">
    <h3>Small examples. Clearer learning.</h3>
    <p>BabyPandas Documentation helps students learn data science. Try sorting this sample table to see how a small example can make an idea clearer.</p>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to scroll the narrow table.) -->
    <div class="table-scroll" role="region" aria-label="Trail elevation table" tabindex="0">
      <table>
        <caption>Illustrative trail data</caption>
        <thead><tr><th scope="col">Trail</th><th scope="col">Elevation (m)</th></tr></thead>
        <tbody>
          {#each rows as trail (trail.name)}
            <tr><th scope="row">{trail.name}</th><td>{trail.elevation}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
    <button type="button" aria-pressed={highestFirst} on:click={() => highestFirst = !highestFirst}>
      Highest first
    </button>
    <p class="sort-status" role="status">{highestFirst ? 'Sorted from highest to lowest elevation.' : 'Showing the original trail order.'}</p>
    <a href="https://github.com/dsc-courses/bpd-reference" target="_blank" rel="noopener noreferrer">Explore the documentation <span aria-hidden="true">↗</span></a>
  </div>
</details>

<style>
  details { min-width: 0; border-block: 1px solid var(--border); }
  summary { min-height: 44px; padding-block: .8rem; cursor: pointer; font-size: .9rem; font-weight: 600; }
  summary:hover { color: var(--accent); }
  .demo-content { padding: .8rem 0 1.25rem; }
  h3 { font-family: var(--font-display); font-weight: 500; font-size: clamp(1.8rem, 3vw, 2.5rem); margin-bottom: .8rem; }
  p { font-size: .85rem; line-height: 1.6; color: var(--text-muted); }
  .table-scroll { max-width: 100%; overflow-x: auto; margin-block: 1.25rem; }
  table { width: 100%; min-width: 210px; border-collapse: collapse; font-size: .8rem; }
  caption { text-align: left; color: var(--text-muted); padding-bottom: .5rem; }
  th, td { padding: .6rem .3rem; border-bottom: 1px solid var(--border); text-align: left; }
  thead th { font-weight: 600; }
  tbody th { font-weight: 400; }
  td, th:last-child { text-align: right; font-variant-numeric: tabular-nums; }
  button { min-height: 44px; padding: .55rem .9rem; border: 1px solid var(--accent); background: var(--accent); color: var(--bg); font-size: .85rem; }
  button:hover { background: var(--text); }
  .sort-status { margin: .65rem 0 .8rem; font-size: .75rem; }
  a { display: inline-flex; align-items: center; gap: .4rem; min-height: 44px; font-size: .8rem; }
</style>
