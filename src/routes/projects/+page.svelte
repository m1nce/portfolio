<script>
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  import { projects } from '$lib/data/projects.js';
</script>

<svelte:head>
  <title>Projects — Minchan Kim</title>
</svelte:head>

<div>
  <h1>Projects</h1>
  <p class="subtitle">A selection of research, tools, and experiments.</p>

  <div class="projects-grid">
    {#each projects as project}
      <ProjectCard
        title={project.title}
        description={project.description}
        tags={project.tags}
        link={project.link}
        image={project.image}
        sparkline={project.sparkline}
      />
    {/each}
  </div>
</div>

<style>
  .subtitle {
    opacity: 0.7;
    font-family: var(--font-mono);
    font-size: 0.9rem;
    margin-bottom: 0;
    letter-spacing: 0.03em;
  }
</style>
