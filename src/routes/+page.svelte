<script>
  import Portrait from '$lib/components/Portrait.svelte';
  import { base } from '$app/paths';
  import { projects } from '$lib/data/projects.js';
</script>

<svelte:head>
  <title>Minchan Kim</title>
  <meta name="description" content="Minchan Kim studies how people learn, adapt, and make sense of new technology. Research, teaching tools, and interactive data stories." />
</svelte:head>

<div class="homepage" id="home">
  <section class="intro" aria-labelledby="intro-title">
    <div class="intro-copy">
      <h1 id="intro-title">Helping people learn<br /> as technology changes.</h1>
      <p>I’m Minchan, a Data Science master’s student at UC San Diego. I’m interested in how people learn, adapt, and make sense of new technology, and how we can design tools that support them.</p>
      <p>I explore these questions through human–computer interaction and machine learning at <a href="https://dstl.ucsd.edu/">dstl</a>.</p>
      <a class="about-link" href="{base}/about/">More about me</a>
    </div>
    <Portrait />
  </section>

  <section id="work" aria-labelledby="work-title">
    <div class="section-heading">
      <h2 id="work-title">Selected work</h2>
      <a href="{base}/projects/">See all work</a>
    </div>
    <div class="selected-grid">
      {#each projects.slice(0, 2) as project, index}
        <article>
          <a class="project-preview" href="{base}/projects/#{index === 0 ? 'chatsight' : 'babypandas'}">
            <div class="image-frame"><img src="{base}{project.image}" alt={project.imageAlt} width="1280" height="800" /></div>
            <h3>{project.title}</h3>
          </a>
          <p>{index === 0 ? 'Exploring how educators understand and support students working with AI.' : 'Making data science easier to learn through clear examples and documentation.'}</p>
          <span class="project-note">{index === 0 ? 'Research with dstl · Includes an interactive example' : 'Teaching tools · UC San Diego'}</span>
        </article>
      {/each}
    </div>
  </section>

  <footer id="contact">
    <a href="mailto:mcskim04@gmail.com">mcskim04@gmail.com</a>
    <div class="footer-links">
      <a href="https://github.com/m1nce" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="https://linkedin.com/in/minchankim" target="_blank" rel="noopener noreferrer">LinkedIn</a>
    </div>
  </footer>
</div>

<style>
  .homepage { max-width: 1008px; margin: auto; padding: 64px 24px 32px; }
  .intro { display: grid; grid-template-columns: minmax(0, 1fr) 240px; gap: 72px; align-items: center; margin-bottom: 64px; }
  h1 { font-size: clamp(2rem, 3.5vw, 2.6rem); line-height: 1.2; font-weight: 500; margin-bottom: 24px; }
  .intro-copy p { max-width: 59ch; margin-bottom: 16px; }
  .about-link { display: inline-flex; align-items: center; min-height: 44px; font-size: .9rem; }
  .section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
  h2 { margin: 0; }
  .section-heading a { font-size: .875rem; }
  .selected-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; }
  .project-preview { display: block; text-decoration: none; }
  .image-frame { aspect-ratio: 16 / 9; overflow: hidden; background: #fff; border: 1px solid var(--border); margin-bottom: 18px; }
  img { width: 100%; height: 100%; object-fit: contain; display: block; transition: transform 220ms ease; }
  .project-preview:hover img, .project-preview:focus-visible img { transform: scale(1.025); }
  .project-preview:hover h3, .project-preview:focus-visible h3 { text-decoration: underline; }
  h3 { font-size: 1rem; font-weight: 600; margin: 0 0 8px; }
  article p { font-size: .9rem; margin: 0 0 10px; }
  .project-note { font-size: .75rem; color: var(--text-muted); }
  footer { margin-top: 48px; border-top: 1px solid var(--border); padding-top: 20px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 24px; font-size: .875rem; }
  footer a { display: inline-flex; min-height: 44px; align-items: center; }
  .footer-links { display: flex; gap: 24px; }
  @media (max-width: 800px) { .intro { gap: 32px; grid-template-columns: minmax(0, 1fr) 180px; } h1 br { display: none; } }
  @media (max-width: 600px) {
    .homepage { padding-top: 36px; }
    .intro { grid-template-columns: 1fr; gap: 24px; margin-bottom: 40px; }
    .selected-grid { grid-template-columns: 1fr; gap: 32px; }
    footer { margin-top: 36px; }
  }
</style>
