<script>
  import { base } from '$app/paths';
  import DrivingScene from '$lib/components/DrivingScene.svelte';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  import ProjectDemo from '$lib/components/ProjectDemo.svelte';
  import { projects } from '$lib/data/projects.js';
  let drivingScene;
  let parked = null;
  let demoOpen = false;
  $: if (parked === 'work') demoOpen = true;
</script>

<svelte:head>
  <title>Minchan Kim — HCI, machine learning & the scenic route</title>
  <meta name="description" content="Minchan Kim is a Data Science graduate student at UC San Diego exploring human-computer interaction and machine learning. Take the scenic route through his work." />
  <meta name="theme-color" content="#233c2e" />
</svelte:head>

<div class="mountain-journey">
  <DrivingScene bind:this={drivingScene} bind:parked />

  <section class="hero landmark-section" id="home" aria-labelledby="intro-title">
    <div class="landmark-content">
      <p class="landmark" data-landmark="Trailhead"><span>01</span> The trailhead</p>
      <p class="role">HCI researcher &amp; data scientist</p>
      <h1 id="intro-title" tabindex="-1">Minchan<br />Kim<span>.</span></h1>
      <p class="intro-copy">I explore how people and AI<br class="desktop-break" /> can work better together.</p>
      <p class="intro-detail">Graduate student at UC San Diego.<br />Usually taking the scenic route.</p>
      <div class="journey-actions">
        <button class="drive-button" on:click={() => drivingScene.startDrive()}>Start the drive <span aria-hidden="true">↑</span></button>
        <button class="text-link" on:click={() => drivingScene.openMap()}>Browse road map ↗</button>
      </div>
      <p class="driving-hint">Use the arrow keys to drive. Pull over to explore.<br />Or simply scroll — every stop is open.</p>
    </div>
  </section>

  <section class="landmark-section" id="work" aria-labelledby="work-title">
    <div class="landmark-content">
      <p class="landmark" data-landmark="The overlook"><span>02</span> The overlook</p>
      <div class="section-heading">
        <h2 id="work-title" tabindex="-1">Selected work</h2>
        <a class="text-link" href="https://github.com/m1nce" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
      </div>
      <p class="section-intro">A few things I've built along the way.</p>
      <div class="project-demo"><ProjectDemo bind:open={demoOpen} /></div>
      <div class="projects-grid">
        {#each projects as project}<ProjectCard {...project} />{/each}
      </div>
    </div>
  </section>

  <section class="landmark-section" id="about" aria-labelledby="about-title">
    <div class="landmark-content">
      <p class="landmark" data-landmark="A little background"><span>03</span> A little background</p>
      <h2 id="about-title" tabindex="-1">Behind the wheel.</h2>
      <div class="about-copy">
        <p>I study Data Science at UC San Diego, with a focus on human-computer interaction and machine learning.</p>
        <p>I'm especially interested in annotation interfaces: places where domain experts and AI models collaborate to make data more reliable.</p>
        <p class="off-road">Away from the screen: basketball, Formula 1, lifting, and an appreciation for a good driver's car.</p>
      </div>
      <a class="text-link" href="{base}/about/">Background &amp; experience <span aria-hidden="true">↗</span></a>
    </div>
  </section>

  <section class="landmark-section contact-section" id="contact" aria-labelledby="contact-title">
    <div class="landmark-content">
      <p class="landmark" data-landmark="Until the next drive"><span>04</span> Until the next drive</p>
      <h2 id="contact-title" tabindex="-1">A good place<br />to say hello.</h2>
      <p class="contact-copy">About research, something you're building,<br class="desktop-break" /> or your favorite stretch of road.</p>
      <a class="email-link" href="mailto:mcskim04@gmail.com">mcskim04@gmail.com <span aria-hidden="true">↗</span></a>
      <div class="social-links">
        <a href="https://github.com/m1nce" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        <a href="https://linkedin.com/in/minchankim" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        <a href="{base}/terminal/">Terminal</a>
      </div>
      <a class="back-to-start" href="#home">Back to the trailhead ↑</a>
    </div>
  </section>
</div>

<style>
  .mountain-journey { position: relative; isolation: isolate; background: var(--bg); }
  .landmark-section { position: relative; min-height: 112svh; padding: 25svh 5.5vw 22svh 56%; }
  .landmark-content { position: relative; max-width: 560px; }
  .hero { min-height: 118svh; padding-top: 24svh; }
  .landmark { display: flex; align-items: center; gap: .65rem; margin-bottom: 2.25rem; color: var(--text-muted); font-size: .75rem; line-height: 32px; }
  .landmark > span { display: grid; place-items: center; width: 30px; height: 32px; border: 1px solid var(--border); border-radius: 2px 2px 10px 10px; font: 500 .9rem var(--font-display); color: var(--accent); background: var(--bg); flex-shrink: 0; }
  .role { margin-bottom: .8rem; font-size: .8rem; color: var(--text-muted); }
  h1 { font: 500 clamp(5rem, 8.3vw, 8.5rem)/.82 var(--font-display); letter-spacing: -.025em; margin-bottom: 1.8rem; }
  h1 > span { color: #9a884e; }
  .intro-copy { font-size: clamp(1.1rem, 1.8vw, 1.55rem); line-height: 1.45; margin-bottom: 1.2rem; letter-spacing: -.015em; }
  .intro-detail { color: var(--text-muted); font-size: .9rem; line-height: 1.7; margin-bottom: 1.8rem; }
  .text-link { display: inline-flex; align-items: center; min-height: 44px; gap: 1rem; font-size: .82rem; font-weight: 550; text-decoration: none; border-bottom: 1px solid var(--border); }
  .text-link:hover { border-color: currentColor; }
  .text-link span { font-size: 1.2rem; }
  .journey-actions { display: flex; align-items: center; flex-wrap: wrap; gap: .5rem 1.5rem; }
  .journey-actions button { cursor: pointer; }
  .journey-actions .text-link { background: none; border: 0; border-bottom: 1px solid var(--border); padding: 0; color: var(--text); }
  .drive-button { display: inline-flex; align-items: center; gap: 1.5rem; min-height: 48px; padding: .7rem 1rem; border: 1px solid var(--accent); background: var(--accent); color: var(--bg); font-size: .85rem; }
  .drive-button:hover { background: var(--text); }
  .driving-hint { margin: 1rem 0 0; font-size: .72rem; line-height: 1.7; color: var(--text-muted); }
  .project-demo { margin-block: 2rem; }
  h2 { font: 500 clamp(2.5rem, 4.5vw, 4.5rem)/1 var(--font-display); letter-spacing: -.02em; margin: 0; }
  .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
  .section-heading .text-link { font-size: .75rem; }
  .section-intro { margin: 1rem 0 2rem; font-size: .9rem; color: var(--text-muted); }
  .projects-grid { grid-template-columns: 1fr; gap: 2rem; margin: 0; }
  .projects-grid :global(.project-card) { display: grid; grid-template-columns: 120px 1fr; gap: 1.15rem; }
  .projects-grid :global(.card-body) { padding: 0; }
  .projects-grid :global(.project-image img) { height: 100%; min-height: 140px; object-position: 25%; }
  .projects-grid :global(.project-image) { align-self: start; }
  .projects-grid :global(.card-body h3) { font-size: 1rem; }
  .projects-grid :global(.card-body p) { font-size: .85rem; }
  .about-copy { margin-top: 1.75rem; font-size: 1rem; line-height: 1.8; }
  .off-road { color: var(--text-muted); }
  .contact-section { min-height: 105svh; padding-bottom: 30svh; }
  .contact-section h2 { font-size: clamp(3.5rem, 5.4vw, 5.5rem); }
  .contact-copy { margin: 1.75rem 0; color: var(--text-muted); font-size: .95rem; }
  .email-link { display: inline-flex; align-items: center; gap: 1rem; min-height: 44px; font-size: clamp(.9rem, 1.7vw, 1.2rem); text-decoration: none; border-bottom: 1px solid var(--border); }
  .social-links { display: flex; flex-wrap: wrap; gap: 1.5rem; margin: 2rem 0 3.5rem; font-size: .8rem; }
  .social-links a { display: inline-flex; align-items: center; min-height: 44px; text-decoration: none; }
  .social-links a:hover { text-decoration: underline; }
  .back-to-start { color: var(--text-muted); font-size: .75rem; text-decoration: none; }
  @media (min-width: 1400px) { .landmark-section { padding-left: 55%; } }
  @media (max-width: 1000px) {
    .landmark-section { padding-right: 4vw; padding-left: 54%; }
    .projects-grid :global(.project-card) { display: block; }
    .projects-grid :global(.project-image) { display: none; }
  }
  @media (max-width: 700px) {
    .landmark-section { padding: 20svh 1.25rem 20svh 33%; min-height: 108svh; }
    .hero { padding-top: 22svh; }
    .landmark { font-size: .68rem; gap: .5rem; margin-bottom: 2rem; }
    .landmark > span { width: 26px; height: 30px; }
    .role { font-size: .72rem; line-height: 1.5; }
    h1 { font-size: clamp(4rem, 16vw, 6rem); line-height: .88; }
    h2 { font-size: clamp(2.3rem, 9vw, 3.7rem); }
    .intro-copy { font-size: 1.1rem; }
    .intro-detail, .section-intro { font-size: .84rem; }
    .desktop-break { display: none; }
    .section-heading > .text-link { display: none; }
    .about-copy { font-size: .94rem; line-height: 1.75; }
    .contact-section h2 { font-size: 2.9rem; }
    .email-link { gap: .35rem; font-size: clamp(.73rem, 3.1vw, 1rem); white-space: nowrap; }
    .contact-copy { font-size: .9rem; }
    .social-links { gap: 0 1.15rem; margin: 1.5rem 0 2.5rem; }
    .text-link { font-size: .78rem; gap: .5rem; }
  }
</style>
