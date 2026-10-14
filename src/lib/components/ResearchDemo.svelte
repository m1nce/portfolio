<script>
  const examples = [
    { text: 'My code runs, but I don’t understand why the average changes when I remove this row.', note: 'A working answer can still leave a learner with questions. What would a label help an instructor notice?' },
    { text: 'I tried filtering the table, but I keep getting an empty result. Can you help me find what went wrong?', note: 'This message includes both an attempt and a request for help. One category may not tell the whole story.' },
    { text: 'Can you give me a hint about where to start without showing me the solution?', note: 'The kind of help a learner asks for matters, alongside the topic they are working on.' }
  ];
  const labels = ['Understanding a concept', 'Debugging', 'Asking for guidance'];
  let active = 0;
  let selections = examples.map(() => []);
  $: selected = selections[active];
  function toggle(label) {
    selections = selections.map((items, index) => index === active
      ? items.includes(label) ? items.filter(item => item !== label) : [...items, label]
      : items);
  }
</script>

<figure class="research-demo" aria-labelledby="demo-title">
  <div class="demo-heading">
    <span id="demo-title">A closer look at learning</span>
    <span class="demo-kind">Interactive example</span>
  </div>
  <div class="demo-body">
    <div class="example-picker" role="group" aria-label="Choose a sample message">
      {#each examples as example, index}
        <button class:current={active === index} aria-pressed={active === index} on:click={() => active = index}>Message {index + 1}</button>
      {/each}
    </div>
    <div class="message" aria-live="polite" aria-atomic="true">
      {#key active}
        <blockquote>{examples[active].text}</blockquote>
      {/key}
    </div>
    <fieldset>
      <legend>What is this learner asking for?</legend>
      <p class="hint">Choose any that fit. There isn’t a single right answer.</p>
      <div class="label-options">
        {#each labels as label}
          <button class:selected={selected.includes(label)} aria-pressed={selected.includes(label)} on:click={() => toggle(label)}>
            <span class="check" aria-hidden="true">{selected.includes(label) ? '✓' : '+'}</span>{label}
          </button>
        {/each}
      </div>
    </fieldset>
    <div class="reflection" role="status" aria-live="polite" aria-atomic="true">
      {#if selected.length}
        <p class="selection-summary">Your labels: {selected.join(', ')}.</p>
        <p>{examples[active].note}</p>
      {:else}
        <p>Select a label to explore how a short message can hold more than one meaning.</p>
      {/if}
    </div>
  </div>
  <figcaption>Inspired by Chatsight. Synthetic messages and illustrative labels, with no AI running. Your choices stay on this page.</figcaption>
</figure>

<style>
  .research-demo { margin: 28px -40px 24px; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .demo-heading { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px 16px; padding: 16px 24px; border-bottom: 1px solid var(--border); font-size: .875rem; font-weight: 600; }
  .demo-kind { font-size: .75rem; color: var(--text-muted); font-weight: 400; }
  .demo-body { padding: 12px 24px 24px; }
  .example-picker { display: flex; gap: 24px; }
  button { color: var(--text-muted); background: transparent; border: 0; min-height: 44px; font-size: .8rem; }
  .example-picker button { padding: 8px 0; border-bottom: 2px solid transparent; transition: color 160ms ease, border-color 160ms ease; }
  .example-picker button:hover, .example-picker button.current { color: var(--accent); }
  .example-picker button.current { border-bottom-color: var(--accent); }
  .message { display: grid; align-items: center; min-height: 144px; padding: 24px 0; }
  blockquote { font-size: 1.125rem; line-height: 1.6; margin: 0; max-width: 52ch; animation: appear 180ms ease-out; }
  fieldset { padding: 0; margin: 0; border: 0; min-width: 0; }
  legend { padding: 0; font-size: .875rem; font-weight: 600; }
  .hint { color: var(--text-muted); font-size: .8rem; margin: 4px 0 12px; }
  .label-options { display: flex; flex-wrap: wrap; gap: 8px; }
  .label-options button { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; color: var(--text); transition: background-color 160ms ease, border-color 160ms ease; }
  .label-options button:hover { border-color: var(--accent); }
  .label-options button.selected { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
  .check { width: 12px; text-align: center; }
  .reflection { min-height: 106px; margin-top: 20px; padding: 16px 20px; background: var(--bg-elevated); border-left: 2px solid var(--accent); font-size: .85rem; }
  .reflection p { margin: 0; }
  .selection-summary { color: var(--accent); font-size: .75rem; margin-bottom: 6px !important; }
  figcaption { padding: 12px 24px; border-top: 1px solid var(--border); color: var(--text-muted); font-size: .75rem; }
  @keyframes appear { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
  @media (max-width: 800px) { .research-demo { margin-inline: 0; } }
  @media (max-width: 480px) {
    .demo-heading, figcaption { padding-inline: 16px; }
    .demo-body { padding-inline: 16px; }
    .example-picker { gap: 16px; }
    .message { min-height: 190px; }
    blockquote { font-size: 1rem; }
    .reflection { padding: 12px; }
  }
  @media (prefers-reduced-motion: reduce) { blockquote { animation: none; } button { transition: none !important; } }
</style>
