<script>
  import { base } from '$app/paths';
  export let title = '';
  export let description = '';
  export let tags = [];
  export let link = '';
  export let image = '';
</script>

<article class="project-card">
  {#if image}
    <a class="project-image" href={link} target="_blank" rel="noopener noreferrer" aria-label={'View ' + title}>
      <img src="{base}{image}" alt={title === 'Portfolio Site' ? 'Illustrated Southern California mountain terrain' : 'BabyPandas documentation website'} loading="lazy" />
      <span class="image-link" aria-hidden="true">↗</span>
    </a>
  {/if}
  <div class="card-body">
    <h3><a href={link} target="_blank" rel="noopener noreferrer">{title}</a></h3>
    <p>{description}</p>
    {#if tags.length}
      <ul class="tags">{#each tags as tag}<li>{tag}</li>{/each}</ul>
    {/if}
  </div>
</article>

<style>
  .project-card { min-width: 0; }
  .project-image { display: block; position: relative; overflow: hidden; background: var(--bg-elevated); }
  img { display: block; width: 100%; aspect-ratio: 2.6; object-fit: cover; object-position: center 40%; }
  .image-link { position: absolute; right: 0.6rem; bottom: 0.6rem; display: grid; place-items: center; width: 30px; height: 30px; background: var(--bg); color: var(--text); font-size: 1.1rem; }
  .card-body { padding-top: 1rem; }
  h3 { font-size: 1.1rem; font-weight: 600; line-height: 1.3; margin: 0 0 0.6rem; }
  h3 a { text-decoration: none; }
  h3 a:hover { text-decoration: underline; }
  p { font-size: 0.85rem; line-height: 1.65; color: var(--text-muted); margin: 0 0 0.85rem; }
  .tags { display: flex; flex-wrap: wrap; gap: 0.3rem 0.9rem; list-style: none; padding: 0; margin: 0; }
  .tags li { font-size: 0.68rem; color: var(--text-muted); }
</style>
