<script>
  import ResearchDemo from '$lib/components/ResearchDemo.svelte';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  import { projects } from '$lib/data/projects.js';
</script>

<svelte:head>
  <title>Work | Minchan Kim</title>
</svelte:head>

<div>
  <h1>Work</h1>
  <p class="subtitle">Research, teaching tools, and interactive data stories.</p>

  <div class="projects-grid">
    {#each projects as project, index}
      <section class:featured={index === 0} id={index === 0 ? 'chatsight' : index === 1 ? 'babypandas' : undefined} aria-label={project.title}>
        <ProjectCard {...project} />
        {#if index === 0}
          <div class="project-exploration">
            <ResearchDemo />
            <a href="https://dstl.ucsd.edu/blog/expanding-chatsight-into-simulated-students/">Read our research update</a>
          </div>
        {/if}
      </section>
    {/each}
  </div>
</div>

<style>
  .subtitle { color: var(--text-muted); margin-bottom: 0; }
  .projects-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 56px 40px; margin-top: 40px; }
  .projects-grid > section { min-width: 0; }
  .featured { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px; align-items: start; padding-bottom: 40px; border-bottom: 1px solid var(--border); }
  .project-exploration { min-width: 0; }
  .project-exploration :global(.research-demo) { margin: 0 0 16px; }
  .project-exploration > a { font-size: .875rem; }
  @media (max-width: 760px) {
    .projects-grid, .featured { grid-template-columns: 1fr; gap: 36px; }
  }
</style>
