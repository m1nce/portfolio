<script>
  import { experiences } from '$lib/data/experience.js';

  const types = ['all', 'research', 'industry', 'teaching', 'education'];
  let activeFilter = 'all';

  $: filtered = activeFilter === 'all'
    ? experiences
    : experiences.filter(e => e.type === activeFilter);

  $: groups = (() => {
    const seen = new Map();
    for (const entry of filtered) {
      if (!seen.has(entry.period)) seen.set(entry.period, []);
      seen.get(entry.period).push(entry);
    }
    return [...seen.entries()].map(([period, entries]) => ({ period, entries }));
  })();

  // Gantt bar helpers
  const MON = { Jan:0, Feb:1, Mar:2, March:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  const SPAN_START = new Date(2022, 8); // Sep 2022
  const SPAN_END   = new Date(2027, 5); // Jun 2027

  function parseDate(s) {
    s = s.trim();
    if (s === 'Present') return new Date(2026, 2); // Mar 2026
    const [m, y] = s.split(' ');
    return new Date(parseInt(y), MON[m] ?? 0);
  }

  function gantt(dates) {
    const [s, e] = dates.split(' - ').map(parseDate);
    const total = SPAN_END - SPAN_START;
    const left  = Math.max(0, (s - SPAN_START) / total * 100);
    const width = Math.max(2, Math.min(100 - left, (e - s) / total * 100));
    return { left, width };
  }
</script>

<section class="timeline-section">
  <div class="filters" role="group" aria-label="Filter by type">
    {#each types as t}
      <button
        class:active={activeFilter === t}
        on:click={() => activeFilter = t}
      >{t}</button>
    {/each}
  </div>

  <div class="timeline">
    {#each groups as group}
      <div class="period-group">
        <div class="period-label">{group.period}</div>
        <ul class="entries">
          {#each group.entries as entry (entry.role + entry.org)}
            {@const g = gantt(entry.dates)}
            <li class="entry" data-type={entry.type}>
              <strong class="role">{entry.role}</strong>
              <div class="org">{entry.org}</div>
              {#if entry.description}
                <p class="desc">{entry.description}</p>
              {/if}
              <div class="gantt-track">
                <div class="gantt-bar" style="left:{g.left.toFixed(1)}%;width:{g.width.toFixed(1)}%"></div>
              </div>
              <span class="type-badge">{entry.type}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
</section>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }

  .filters button {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    padding: 0.3em 0.8em;
    border: 1px solid var(--border);
    border-radius: 2px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    letter-spacing: 0.05em;
    text-transform: lowercase;
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }

  .filters button:hover {
    border-color: var(--accent);
    background-color: var(--accent-dim);
  }

  .filters button.active {
    border-color: var(--accent);
    background-color: var(--accent);
    color: oklch(15% 0 0);
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .period-group {
    display: grid;
    grid-template-columns: 9rem 1fr;
    gap: 0 2.5rem;
    align-items: start;
  }

  .period-label {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--text-muted);
    letter-spacing: 0.04em;
    line-height: 1.5;
    padding-top: 0.2rem;
    text-align: right;
    opacity: 0.7;
  }

  .entries {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .entry {
    padding: 0.65rem 0.75rem 0.65rem 1rem;
    border-left: 2px solid var(--border);
  }

  [data-type="research"] { border-color: oklch(72% 0.15 200); }
  [data-type="industry"] { border-color: oklch(72% 0.15 50); }
  [data-type="teaching"] { border-color: oklch(72% 0.15 290); }
  [data-type="education"] { border-color: var(--color-signal); }

  .role {
    font-size: 1rem;
    display: block;
  }

  .org {
    font-size: 0.875rem;
    opacity: 0.7;
    margin-top: 0.1rem;
  }

  .desc {
    font-size: 0.85rem;
    opacity: 0.65;
    margin: 0.4rem 0 0.4rem;
    line-height: 1.5;
  }

  .gantt-track {
    position: relative;
    height: 2px;
    background: var(--border);
    border-radius: 1px;
    margin-top: 0.55rem;
    margin-bottom: 0.5rem;
    overflow: hidden;
  }

  .gantt-bar {
    position: absolute;
    top: 0;
    height: 100%;
    border-radius: 1px;
    opacity: 0.8;
  }

  [data-type="research"] .gantt-bar { background: oklch(72% 0.15 200); }
  [data-type="industry"] .gantt-bar { background: oklch(72% 0.15 50); }
  [data-type="teaching"] .gantt-bar { background: oklch(72% 0.15 290); }
  [data-type="education"] .gantt-bar { background: var(--color-signal); }

  .type-badge {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    padding: 0.15em 0.5em;
    border: 1px solid var(--border);
    border-radius: 2px;
    opacity: 0.55;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    display: inline-block;
  }

  @media (max-width: 540px) {
    .period-group {
      grid-template-columns: 1fr;
      gap: 0.4rem 0;
    }

    .period-label {
      text-align: left;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.3rem;
    }
  }
</style>
