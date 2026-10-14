<script>
  import Portrait from '$lib/components/Portrait.svelte';
  import { base } from '$app/paths';
  import ExperienceTimeline from '$lib/components/ExperienceTimeline.svelte';
</script>

<svelte:head>
  <title>About | Minchan Kim</title>
</svelte:head>

<h1>About</h1>
<div class="about-layout">
  <div>

    <section class="bio">
      <p>
        I’m Minchan Kim, a Data Science master’s student at UC San Diego,
        where I also earned my B.S. in 2025.
      </p>
      <p>
        My research asks how we can help people learn and adapt as technology
        changes. At <a href="https://dstl.ucsd.edu/">dstl</a>, I explore this
        through human–computer interaction and machine learning, building tools
        that help educators understand and support learners.
      </p>
      <p>
        Outside of research, I’m into basketball, Formula 1, lifting, and cars.
        You can even <a href="{base}/world/">take an MX-5 for a drive</a> on this site.
      </p>
    </section>
  </div>

  <Portrait />
</div>

<section class="experience-section" aria-labelledby="experience-title">
  <h2 id="experience-title">Experience</h2>
  <ExperienceTimeline />
</section>

<style>
  .about-layout { display: grid; grid-template-columns: minmax(0, 1fr) 240px; gap: 72px; align-items: center; margin-bottom: 48px; }
  .bio { max-width: 60ch; }
  .bio p { margin-bottom: 16px; }
  .bio p:last-child { margin-bottom: 0; }
  .experience-section { border-top: 1px solid var(--border); padding-top: 32px; }
  .experience-section h2 { margin-bottom: 12px; }
  @media (max-width: 800px) { .about-layout { grid-template-columns: minmax(0, 1fr) 180px; gap: 32px; } }
  @media (max-width: 600px) { .about-layout { grid-template-columns: 1fr; gap: 24px; margin-bottom: 32px; } }
</style>
