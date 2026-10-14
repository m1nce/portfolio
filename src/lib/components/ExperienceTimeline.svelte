<script>
  import { onMount } from 'svelte';
  import { experienceTimeline } from '$lib/experienceTimeline.js';
  import { base } from '$app/paths';
  import { experiences } from '$lib/data/experience.js';

  const types = ['all', 'research', 'industry', 'teaching', 'education'];
  let activeFilter = 'all';

  let now = new Date();
  onMount(() => { now = new Date(); });
  $: timeline = experienceTimeline(experiences, now);
  $: filtered = activeFilter === 'all'
    ? timeline.entries
    : timeline.entries.filter(entry => entry.type === activeFilter);

</script>

<section class="timeline-section">
  <div class="filters" role="group" aria-label="Filter by type">
    {#each types as t}
      <button
        class:active={activeFilter === t}
        aria-pressed={activeFilter === t}
        on:click={() => activeFilter = t}
      >{t}</button>
    {/each}
  </div>

  <div class="timeline-scale" aria-label="Experience timeline scale">
    <span>{timeline.startYear}</span><span>{timeline.endYear}</span>
  </div>
  <ul class="entries">
    {#each filtered as entry (entry.role + entry.org)}
      <li class="entry">
        <div class="entry-meta">
          <span class="organization-logo" class:dark-logo-bg={entry.logo.endsWith('ucsd.png') || entry.logo.endsWith('sce.svg')}>
            <img src="{base}{entry.logo}" alt="" width="64" height="32" loading="lazy" />
          </span>
          <span class="dates">{entry.dates}</span>
        </div>
        <div class="entry-details">
          <strong class="role">{entry.role}</strong>
          <div class="org">{entry.org}</div>
          {#if entry.description}<p class="desc">{entry.description}</p>{/if}
          <div class="gantt-track" aria-hidden="true">
            <div class="gantt-bar" style="left:{entry.left}%;width:{entry.width}%"></div>
          </div>
        </div>
      </li>
    {/each}
  </ul>
</section>

<style>
  .filters { display: flex; flex-wrap: wrap; gap: 4px 20px; margin-bottom: 8px; }
  .filters button { border: 0; background: none; color: var(--text-muted); padding: 8px 0; min-height: 44px; font-size: .875rem; text-transform: capitalize; }
  .filters button:hover, .filters button.active { color: var(--text); text-decoration: underline; text-underline-offset: 5px; }
  .timeline-scale { display: flex; justify-content: space-between; color: var(--text-muted); font-size: .7rem; margin: 0 0 12px 224px; }
  .entries { list-style: none; padding: 0; margin: 0; display: grid; gap: 20px; }
  .entry { display: grid; grid-template-columns: 192px minmax(0, 1fr); gap: 32px; min-width: 0; }
  .entry-meta { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
  .entry-details { min-width: 0; }
  .organization-logo { display: flex; align-items: center; justify-content: center; width: 76px; height: 44px; padding: 6px; background: #fff; border: 1px solid var(--border); border-radius: 4px; }
  .organization-logo.dark-logo-bg { background: #182b49; border-color: #182b49; }
  .organization-logo img { display: block; width: 100%; height: 100%; object-fit: contain; }
  .role { display: block; font-size: .95rem; line-height: 1.4; font-weight: 600; }
  .org { font-size: .825rem; line-height: 1.5; }
  .dates { display: block; font-size: .75rem; color: var(--text-muted); line-height: 1.5; margin-top: 2px; }
  .desc { font-size: .825rem; line-height: 1.55; margin: 8px 0 10px; }
  .gantt-track { position: relative; height: 3px; background: var(--border); overflow: hidden; border-radius: 2px; }
  .gantt-bar { position: absolute; height: 100%; background: var(--accent); border-radius: 2px; }
  @media (max-width: 600px) {
    .entry { grid-template-columns: 1fr; gap: 10px; }
    .entry-meta { flex-direction: row; align-items: center; gap: 12px; }
    .timeline-scale { margin-left: 0; }
  }
</style>
