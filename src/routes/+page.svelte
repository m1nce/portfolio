<script>
  import { base } from '$app/paths';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  import { projects } from '$lib/data/projects.js';
</script>

<svelte:head>
  <title>Minchan Kim — HCI, machine learning & the scenic route</title>
  <meta name="description" content="Minchan Kim is a Data Science graduate student at UC San Diego exploring human–computer interaction and machine learning. Browse his work or explore his driving world." />
  <meta name="theme-color" content="#233c2e" />
</svelte:head>

<div class="portfolio">
  <section class="intro" id="home" aria-labelledby="intro-title">
    <div>
      <p class="role">HCI &amp; machine learning</p>
      <h1 id="intro-title" tabindex="-1">Minchan Kim<span>.</span></h1>
    </div>
    <div class="intro-copy">
      <p>I explore how people and AI can work better together.</p>
      <p class="muted">Data Science graduate student at UC San Diego.<br />Usually taking the scenic route.</p>
      <a class="text-link" href="#work">Browse my work <span aria-hidden="true">↓</span></a>
    </div>
  </section>

  <a class="world-gateway" href="{base}/world/" aria-labelledby="world-title" aria-describedby="world-description">
    <div class="valley-view">
      <img src="{base}/img/valley-concept.png" alt="A British green MX-5 overlooking a sunlit mountain valley, with winding roads connecting a garage, village, and field station." width="1536" height="1024" fetchpriority="high" />
      <span class="world-caption">Southern California, reimagined</span>
    </div>
    <div class="gateway-copy">
      <div>
        <h2 id="world-title">Take the scenic route.</h2>
        <p id="world-description">Drive freely. Meet a few familiar faces. Get to know me along the way.</p>
      </div>
      <span class="enter-world">Explore my world <span aria-hidden="true">↗</span></span>
    </div>
  </a>
  <p class="prototype-note">A playable open-world prototype. Keyboard or touch controls. Concept artwork shown above.</p>

  <section class="work-section" id="work" aria-labelledby="work-title">
    <div class="section-heading">
      <h2 id="work-title" tabindex="-1">Selected work</h2>
      <a class="text-link" href="https://github.com/m1nce" target="_blank" rel="noopener noreferrer">More on GitHub <span aria-hidden="true">↗</span></a>
    </div>
    <div class="projects-grid">
      {#each projects as project}
        <ProjectCard {...project} description={project.title === 'Portfolio Site' ? 'An interactive portfolio with a freely drivable mountain world, pixel-art characters, and a conventional place to browse my work.' : project.description} />
      {/each}
    </div>
  </section>

  <section class="about-section" id="about" aria-labelledby="about-title">
    <h2 id="about-title" tabindex="-1">A little background.</h2>
    <div class="about-copy">
      <p>I study Data Science at UC San Diego, with a focus on human–computer interaction and machine learning.</p>
      <p>I'm especially interested in annotation interfaces: places where domain experts and AI models collaborate to make data more reliable.</p>
      <p class="muted">Away from the screen: basketball, Formula 1, lifting, and an appreciation for a good driver's car.</p>
      <a class="text-link" href="{base}/about/">Background &amp; experience <span aria-hidden="true">↗</span></a>
    </div>
  </section>

  <section class="contact-section" id="contact" aria-labelledby="contact-title">
    <div>
      <h2 id="contact-title" tabindex="-1">Let's talk.</h2>
      <p>About research, something you're building,<br />or your favorite stretch of road.</p>
    </div>
    <div class="contact-links">
      <a class="email-link" href="mailto:mcskim04@gmail.com">mcskim04@gmail.com <span aria-hidden="true">↗</span></a>
      <div class="social-links">
        <a href="https://github.com/m1nce" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        <a href="https://linkedin.com/in/minchankim" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        <a href="{base}/terminal/">Terminal</a>
      </div>
    </div>
  </section>
  <footer><span>Minchan Kim</span><a href="#home">Back to top ↑</a></footer>
</div>

<style>
  .portfolio { max-width: 1380px; padding: 148px 5.5vw 24px; margin-inline: auto; }
  .intro { display: grid; grid-template-columns: 1.15fr 1fr; align-items: end; gap: 3rem; margin-bottom: 3rem; }
  .role { color: var(--text-muted); font-size: .85rem; margin-bottom: 1rem; }
  h1 { font: 500 clamp(4.5rem, 8.5vw, 8.25rem)/.9 var(--font-display); letter-spacing: -.025em; margin: 0; }
  h1 > span { color: #9a884e; }
  .intro-copy { max-width: 430px; padding-bottom: .1rem; }
  .intro-copy > p:first-child { font-size: clamp(1.1rem, 1.9vw, 1.5rem); line-height: 1.4; letter-spacing: -.015em; margin-bottom: .8rem; }
  .intro-copy .muted { margin-bottom: .45rem; font-size: .85rem; }
  .muted, .prototype-note { color: var(--text-muted); }
  .text-link { display: inline-flex; align-items: center; justify-content: space-between; min-height: 44px; gap: 1.25rem; font-size: .85rem; font-weight: 550; text-decoration: none; border-bottom: 1px solid var(--border); }
  .text-link:hover { border-color: currentColor; }
  .world-gateway { display: block; text-decoration: none; background: #233c2e; color: #f4f3ec; }
  .valley-view { position: relative; height: clamp(230px, 30vw, 370px); overflow: hidden; }
  .valley-view img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center 64%; }
  .world-caption { position: absolute; top: 1rem; left: 1rem; padding: .35rem .65rem; color: #233c2e; background: #f4f3ec; font-size: .7rem; }
  .gateway-copy { display: flex; justify-content: space-between; align-items: center; gap: 2rem; padding: 1.4rem 1.75rem; }
  .gateway-copy h2 { font: 500 2.2rem/1.1 var(--font-display); margin: 0 0 .35rem; }
  .gateway-copy p { font-size: .8rem; color: #d3dacc; margin: 0; }
  .enter-world { display: inline-flex; align-items: center; justify-content: space-between; gap: 1.75rem; min-height: 48px; padding: .6rem 1rem; border: 1px solid #bac7b4; font-size: .85rem; white-space: nowrap; }
  .world-gateway:hover .enter-world { background: #f4f3ec; color: #233c2e; }
  .prototype-note { margin: .65rem 0 0; font-size: .7rem; }
  .work-section { margin-block: 5.5rem; }
  .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; }
  section > h2, .section-heading > h2, .contact-section h2 { font: 500 clamp(2.75rem, 4vw, 4rem)/1 var(--font-display); letter-spacing: -.015em; margin: 0; }
  .projects-grid { gap: 3rem; margin: 2rem 0 0; }
  .projects-grid :global(.project-image img) { aspect-ratio: 2.5; }
  .projects-grid :global(.card-body h3) { font-size: 1.1rem; }
  .projects-grid :global(.card-body p) { max-width: 52ch; }
  .about-section { display: grid; grid-template-columns: 1fr 1.2fr; gap: 4rem; padding-block: 3rem 4rem; border-top: 1px solid var(--border); }
  .about-copy { max-width: 560px; }
  .about-copy p { margin-bottom: 1.2rem; font-size: .95rem; line-height: 1.8; }
  .contact-section { display: flex; justify-content: space-between; gap: 3rem; padding-block: 3rem 4rem; border-top: 1px solid var(--border); }
  .contact-section h2 { font-size: clamp(3.25rem, 5vw, 5rem); }
  .contact-section p { margin: 1rem 0 0; font-size: .9rem; color: var(--text-muted); }
  .contact-links { padding-top: .25rem; }
  .email-link { display: flex; justify-content: space-between; align-items: center; min-height: 48px; gap: 2rem; font-size: clamp(1rem, 1.7vw, 1.4rem); text-decoration: none; border-bottom: 1px solid var(--border); }
  .email-link:hover { border-color: currentColor; }
  .social-links { display: flex; flex-wrap: wrap; gap: 1.5rem; margin-top: .9rem; font-size: .8rem; }
  .social-links a, footer a { display: inline-flex; align-items: center; min-height: 44px; text-decoration: none; }
  .social-links a:hover, footer a:hover { text-decoration: underline; }
  footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); color: var(--text-muted); font-size: .75rem; padding-top: 1rem; }
  @media (max-width: 760px) {
    .portfolio { padding: 112px 20px 20px; }
    .intro { grid-template-columns: 1fr; gap: 1.65rem; margin-bottom: 2rem; }
    h1 { font-size: clamp(4.5rem, 15vw, 6.5rem); }
    .role { margin-bottom: .8rem; }
    .intro-copy { max-width: 460px; }
    .intro-copy > p:first-child { max-width: 29ch; font-size: 1.25rem; }
    .valley-view { height: 240px; }
    .valley-view img { object-position: 50% 70%; }
    .world-caption { top: .65rem; left: .65rem; font-size: .65rem; }
    .gateway-copy { display: block; padding: 1.25rem; }
    .gateway-copy h2 { font-size: 2rem; }
    .gateway-copy p { max-width: 40ch; font-size: .8rem; line-height: 1.6; }
    .enter-world { margin-top: 1rem; width: 100%; }
    .prototype-note { line-height: 1.6; }
    .work-section { margin-block: 3.5rem; }
    .section-heading { align-items: start; flex-wrap: wrap; gap: .5rem 1rem; }
    .section-heading h2 { font-size: 2.75rem; }
    .projects-grid { grid-template-columns: 1fr; gap: 2rem; margin-top: 1.25rem; }
    .about-section { grid-template-columns: 1fr; gap: 1.5rem; padding-block: 2.5rem 3rem; }
    .contact-section { display: block; padding-block: 2.5rem 3rem; }
    .contact-links { margin-top: 1.5rem; }
    .email-link { max-width: 430px; gap: .8rem; font-size: clamp(.95rem, 4vw, 1.2rem); }
    .social-links { margin-top: .65rem; }
  }
  @media (min-width: 761px) and (max-height: 500px) {
    .portfolio { padding-top: 112px; }
  }
</style>
