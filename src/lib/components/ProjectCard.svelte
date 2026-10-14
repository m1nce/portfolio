<script>
  import { base } from '$app/paths';
  export let title = '';
  export let description = '';
  export let tags = [];
  export let link = '';
  export let demo = '';
  export let demoLabel = 'View project';
  export let image = '';
  export let imageAlt = '';
  export let imageCaption = '';
  export let credit = '';
</script>

<article class="project-card">
  <h2>{title}</h2>
  {#if image}
    <figure>
      <a class="project-image" href={demo || link} target="_blank" rel="noopener noreferrer" aria-label={'Explore ' + title}>
        <img src="{base}{image}" alt={imageAlt} loading="lazy" />
      </a>
      <figcaption>{imageCaption}</figcaption>
    </figure>
  {/if}
  <p>{description}</p>
  <p class="credit">{credit}</p>
  <ul class="tags" aria-label="Project topics">{#each tags as tag}<li>{tag}</li>{/each}</ul>
  <div class="project-links">
    {#if demo}<a href={demo} target="_blank" rel="noopener noreferrer">{demoLabel}</a>{/if}
    <a href={link} target="_blank" rel="noopener noreferrer">Source code<span class="sr-only"> for {title}</span></a>
  </div>
</article>

<style>
  .project-card { min-width: 0; }
  h2 { font-size: 1.125rem; margin: 0 0 20px; }
  figure { margin: 0 0 20px; }
  .project-image { display: block; aspect-ratio: 16 / 10; background: #fff; border: 1px solid var(--border); }
  img { display: block; width: 100%; height: 100%; object-fit: contain; }
  figcaption { margin-top: 8px; color: var(--text-muted); font-size: .75rem; }
  p { margin-bottom: 12px; }
  .credit { color: var(--text-muted); font-size: .875rem; }
  .tags { display: flex; flex-wrap: wrap; gap: 4px 16px; list-style: none; padding: 0; margin: 16px 0 8px; color: var(--text-muted); font-size: .8rem; }
  .project-links { display: flex; flex-wrap: wrap; gap: 8px 24px; }
  .project-links a { display: inline-flex; align-items: center; min-height: 44px; font-size: .9rem; }
</style>
