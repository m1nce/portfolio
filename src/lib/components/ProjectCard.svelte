<script>
  import { onMount } from 'svelte';

  export let title = '';
  export let description = '';
  export let tags = [];
  export let link = '';
  export let image = '';
  export let sparkline = null; // optional array of numbers for decoration

  let polylineEl;
  let dashLen = 0;
  let drawn = false;

  onMount(() => {
    if (!polylineEl) return;
    dashLen = polylineEl.getTotalLength();

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        requestAnimationFrame(() => { drawn = true; });
        observer.disconnect();
      }
    }, { threshold: 0.2 });

    requestAnimationFrame(() => {
      observer.observe(polylineEl.closest('article'));
    });

    return () => observer.disconnect();
  });
</script>

<article class="project-card">
  {#if image}
    <img src={image} alt={title} loading="lazy" />
  {:else}
    <div class="image-placeholder" aria-hidden="true">
      {#if sparkline && sparkline.length > 1}
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" class="sparkline">
          <polyline
            bind:this={polylineEl}
            points={sparkline.map((v, i) => `${(i / (sparkline.length - 1)) * 100},${40 - v * 38}`).join(' ')}
            style:stroke-dasharray={dashLen || undefined}
            style:stroke-dashoffset={dashLen ? (drawn ? 0 : dashLen) : undefined}
          />
        </svg>
      {:else}
        <span class="mono-placeholder">[ ] no image</span>
      {/if}
    </div>
  {/if}

  <div class="card-body">
    <h2>{title}</h2>
    <p>{description}</p>
    {#if tags.length}
      <ul class="tags">
        {#each tags as tag}
          <li>{tag}</li>
        {/each}
      </ul>
    {/if}
    {#if link}
      <a href={link} target="_blank" rel="noopener noreferrer" class="card-link">View →</a>
    {/if}
  </div>
</article>

<style>
  .project-card {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .project-card:hover {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }

  img {
    width: 100%;
    height: 10em;
    object-fit: cover;
    display: block;
  }

  .image-placeholder {
    width: 100%;
    height: 10em;
    background: oklch(20% 0.02 200);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .sparkline {
    width: 100%;
    height: 100%;
    stroke: var(--color-signal);
    stroke-width: 2;
    fill: none;
    vector-effect: non-scaling-stroke;
  }

  .sparkline polyline {
    transition: stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mono-placeholder {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    opacity: 0.4;
    color: var(--accent);
  }

  .card-body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  h2 {
    font-size: 1rem;
    margin: 0;
    line-height: 1.3;
  }

  p {
    font-size: 0.875rem;
    margin: 0;
    opacity: 0.8;
    flex: 1;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .tags li {
    display: inline;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    padding: 0.2em 0.5em;
    border: 1px solid var(--border);
    border-radius: 2px;
    color: var(--accent);
    opacity: 0.85;
  }

  .card-link {
    align-self: flex-start;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--accent);
    text-decoration: none;
    letter-spacing: 0.05em;
  }

  .card-link:hover {
    text-decoration: underline;
  }
</style>
