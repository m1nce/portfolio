<script>
  import { base } from '$app/paths';
</script>

<svelte:head>
  <title>Minchan Kim — Data science & human–computer interaction</title>
  <meta name="description" content="Minchan Kim is a Data Science master's student at UC San Diego. Research, teaching, projects, and experience." />
  <meta name="theme-color" content="#e6e9e5" />
</svelte:head>

<div class="homepage">
  <section class="intro" id="home" aria-labelledby="intro-title">
    <div class="intro-inner">
      <div class="introduction">
        <h1 id="intro-title" tabindex="-1">Hi, I’m<br /> Minchan.</h1>
        <p class="lead">I’m a Data Science master’s student at UC San Diego.</p>
        <p class="intro-note">My research interests are human–computer interaction and machine learning.</p>
        <a class="work-link" href="#work">View my work <span aria-hidden="true">↓</span></a>
      </div>
      <figure class="garage">
        <a class="car-link" href="{base}/world/" aria-label="Play the MX-5 driving game">
          <img class="day-car" src="{base}/img/nb2-garage.jpg" alt="The game's stock British green NB2 Mazda MX-5, with tan seats and silver wheels, viewed from the front quarter." width="1280" height="720" fetchpriority="high" />
          <img class="night-car" src="{base}/img/nb2-garage-night.jpg" alt="The same green NB2 MX-5 against a dark garage backdrop." width="1280" height="720" />
        </a>
        <figcaption>
          <div class="car-caption">
            <div><span class="car-name">Mazda MX-5</span><span class="car-detail">Stock NB2 in British racing green</span></div>
            <a class="drive-link" href="{base}/world/">Drive the MX-5 <span aria-hidden="true">↗</span></a>
          </div>
          <p class="drive-note">Play with a keyboard or touch controls.</p>
        </figcaption>
      </figure>
    </div>
  </section>

  <div class="page-content">
    <section class="work-section" id="work" aria-labelledby="work-title">
      <div class="section-heading">
        <h2 id="work-title" tabindex="-1">Work</h2>
        <a href="https://github.com/m1nce" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
      <div class="work-layout">
        <article class="project">
          <a class="project-image" href="https://dsc-courses.github.io/bpd-reference/" target="_blank" rel="noopener noreferrer" aria-label="Open the BabyPandas documentation">
            <img src="{base}/img/babypandas-docs.jpg" alt="The live BabyPandas documentation, showing its topic navigation and a sample DataFrame." width="1280" height="720" loading="lazy" />
          </a>
          <p class="context">UCSD DSC 10</p>
          <h3>BabyPandas documentation</h3>
          <p>I built the babypandas documentation site for UCSD’s introductory data science course, DSC 10.</p>
          <div class="project-links">
            <a href="https://dsc-courses.github.io/bpd-reference/" target="_blank" rel="noopener noreferrer">Read the docs</a>
            <a href="https://github.com/dsc-courses/bpd-reference" target="_blank" rel="noopener noreferrer">View the source</a>
          </div>
        </article>
        <article class="research">
          <p class="context">dstl lab, UC San Diego</p>
          <h3>Labeling AI conversations</h3>
          <p>My research focuses on labeling conversations with generative AI in educational settings.</p>
          <p>I’m interested in the interfaces people use to review and label those conversations.</p>
          <a href="{base}/about/">Research &amp; experience</a>
          <div class="teaching-note">
            <h4>Teaching</h4>
            <p>As a TA for DSC 10, I held office hours, wrote exam and quiz questions, and tested assignments. I also worked on automated grading as an instructional assistant.</p>
          </div>
        </article>
      </div>
    </section>

    <section class="about-section" id="about" aria-labelledby="about-title">
      <div class="about-intro">
        <h2 id="about-title" tabindex="-1">About</h2>
        <p>I finished my B.S. in Data Science at UCSD in 2025 and stayed for my master’s.</p>
        <p>Outside of school, I’m into basketball, Formula 1, lifting, and cars.</p>
        <a href="{base}/about/">More about me</a>
      </div>
      <div class="experience">
        <h3>Experience</h3>
        <dl>
          <div><dt>Southern California Edison</dt><dd>Electrical-load forecasting</dd></div>
          <div><dt>EY</dt><dd>Document processing for LLM integration</dd></div>
          <div><dt>UC San Diego</dt><dd>Business intelligence, SQL, and dashboards</dd></div>
        </dl>
      </div>
    </section>

    <footer id="contact" aria-labelledby="contact-title">
      <div>
        <h2 id="contact-title" tabindex="-1">Contact</h2>
        <a class="email" href="mailto:mcskim04@gmail.com">mcskim04@gmail.com</a>
      </div>
      <div class="footer-links">
        <a href="https://github.com/m1nce" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="https://linkedin.com/in/minchankim" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href="#home">Back to top ↑</a>
      </div>
    </footer>
  </div>
</div>

<style>
  :global(html:has(.homepage)) {
    --bg: #f8f9f6; --bg-elevated: #ffffff; --text: #263c32; --text-muted: #58645d;
    --accent: #23553e; --border: #cbd2c9;
  }
  :global(html[data-theme='dark']:has(.homepage)) {
    --bg: #1c2923; --bg-elevated: #25362d; --text: #e6ece5; --text-muted: #b0beb2;
    --accent: #c0d7bb; --border: #435347;
  }
  .intro { --garage-bg: #e6e9e5; background: var(--garage-bg); color: var(--text); }
  :global(html[data-theme='dark']) .intro { --garage-bg: #24362c; }
  .intro-inner { max-width: 1440px; margin-inline: auto; padding: 44px 5.5vw 52px; display: grid; grid-template-columns: .85fr 1.35fr; gap: 32px; align-items: center; }
  .introduction { max-width: 430px; padding-block: 12px; }
  h1 { font-size: clamp(3.5rem, 5.3vw, 5.25rem); font-weight: 500; letter-spacing: -.065em; line-height: 1.02; margin: 0 0 28px; }
  .lead { font-size: clamp(1.12rem, 1.65vw, 1.4rem); line-height: 1.5; letter-spacing: -.02em; max-width: 31ch; margin-bottom: 20px; }
  .intro-note { max-width: 36ch; font-size: .95rem; line-height: 1.65; color: var(--text-muted); margin-bottom: 20px; }
  a { text-decoration-thickness: 1px; text-underline-offset: 5px; }
  a:hover { text-decoration-thickness: 2px; }
  .work-link { display: inline-flex; align-items: center; gap: 20px; min-height: 44px; font-size: .9rem; }
  .garage { margin: 0; min-width: 0; }
  .car-link { display: block; }
  .car-link img { display: block; width: 100%; height: auto; aspect-ratio: 16/9; object-fit: cover; }
  .car-link .night-car { display: none; }
  :global(html[data-theme='dark']) .car-link .day-car { display: none; }
  :global(html[data-theme='dark']) .car-link .night-car { display: block; }
  .car-caption { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 8px 16px 0; }
  .car-name { display: block; font-size: 1.35rem; font-weight: 550; letter-spacing: -.035em; }
  .car-detail { display: block; color: var(--text-muted); font-size: .78rem; margin-top: 2px; }
  .drive-link { display: inline-flex; gap: 16px; align-items: center; justify-content: center; min-height: 48px; padding: 10px 18px; background: #254b37; color: #f3f6ef; border-radius: 3px; font-size: .9rem; text-decoration: none; white-space: nowrap; }
  .drive-link:hover { background: #173723; }
  :global(html[data-theme='dark']) .drive-link { background: #d4e2ce; color: #233b2b; }
  :global(html[data-theme='dark']) .drive-link:hover { background: #e7efdf; }
  .drive-note { padding: 0 16px; margin: 14px 0 0; font-size: .75rem; color: var(--text-muted); }
  .page-content { max-width: 1440px; margin-inline: auto; padding: 0 5.5vw; }
  .work-section { padding-block: 72px 80px; }
  .section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 24px; margin-bottom: 36px; }
  h2 { font-size: clamp(1.5rem, 2.4vw, 2rem); font-weight: 500; letter-spacing: -.045em; line-height: 1.2; margin: 0; }
  .section-heading > a { font-size: .9rem; min-height: 44px; display: inline-flex; align-items: center; }
  .work-layout { display: grid; grid-template-columns: 1.35fr .85fr; gap: clamp(40px, 6vw, 88px); align-items: start; }
  .project-image { display: block; background: #e8ece8; padding: 24px; border-radius: 4px; }
  .project-image img { display: block; width: 100%; height: auto; border: 1px solid #d6dcd7; }
  .context { font-size: .8rem; color: var(--text-muted); margin: 24px 0 10px; }
  h3 { font-size: clamp(1.35rem, 2vw, 1.65rem); letter-spacing: -.035em; line-height: 1.25; font-weight: 550; margin: 0 0 16px; }
  .project > p:not(.context), .research > p:not(.context), .about-intro p { font-size: .95rem; line-height: 1.75; max-width: 60ch; margin-bottom: 16px; }
  .project-links { display: flex; flex-wrap: wrap; gap: 8px 28px; }
  .project-links a, .research > a, .about-intro > a { font-size: .9rem; display: inline-flex; align-items: center; min-height: 44px; }
  .research { padding-top: 8px; }
  .research .context { margin-top: 0; }
  .research h3 { font-size: clamp(1.7rem, 2.6vw, 2.25rem); max-width: 18ch; margin-block: 16px 24px; }
  .teaching-note { margin-top: 32px; padding-left: 20px; border-left: 2px solid var(--border); }
  h4 { font-size: .9rem; font-weight: 550; margin: 0 0 8px; }
  .teaching-note p { font-size: .85rem; color: var(--text-muted); line-height: 1.75; margin: 0; }
  .about-section { display: grid; grid-template-columns: 1.35fr .85fr; gap: clamp(40px, 6vw, 88px); padding-block: 56px 64px; border-top: 1px solid var(--border); }
  .about-intro h2 { margin-bottom: 24px; }
  .experience { padding-top: 5px; }
  .experience h3 { font-size: 1rem; letter-spacing: -.015em; margin-bottom: 24px; }
  dl { margin: 0; }
  dl > div { margin-bottom: 24px; }
  dt { font-size: .95rem; font-weight: 550; }
  dd { margin: 3px 0 0; font-size: .85rem; color: var(--text-muted); }
  footer { border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; gap: 32px; padding-block: 40px 48px; }
  footer h2 { font-size: 1rem; letter-spacing: 0; margin-bottom: 8px; }
  .email { display: inline-flex; align-items: center; min-height: 44px; font-size: clamp(1.15rem, 2vw, 1.5rem); letter-spacing: -.03em; }
  .footer-links { display: flex; flex-wrap: wrap; gap: 24px; font-size: .85rem; }
  .footer-links a { display: inline-flex; align-items: center; min-height: 44px; }
  @media (max-width: 900px) {
    .intro-inner { gap: 8px; grid-template-columns: 1fr 1.15fr; padding-top: 32px; }
    h1 { font-size: 3.5rem; }
    .car-caption { display: block; }
    .drive-link { margin-top: 16px; }
    .work-layout, .about-section { gap: 36px; grid-template-columns: 1.15fr 1fr; }
    .project-image { padding: 14px; }
  }
  @media (max-width: 640px) {
    .intro-inner { display: block; padding: 28px 24px 32px; }
    .introduction { max-width: 100%; padding: 0; }
    h1 { font-size: clamp(3.25rem, 12vw, 4rem); margin-bottom: 24px; }
    h1 br { display: none; }
    .lead { max-width: 33ch; font-size: 1.15rem; }
    .intro-note { max-width: 40ch; font-size: .9rem; margin-bottom: 12px; }
    .garage { margin: 12px -12px 0; }
    .car-caption { display: flex; gap: 12px; padding: 0 12px; }
    .car-name { font-size: 1.1rem; }
    .car-detail { max-width: 21ch; font-size: .7rem; }
    .drive-link { font-size: .8rem; padding: 8px 12px; gap: 10px; margin: 0; }
    .drive-note { padding-inline: 12px; font-size: .7rem; }
    .page-content { padding-inline: 24px; }
    .work-section { padding-block: 40px 48px; }
    .section-heading { gap: 16px; align-items: start; margin-bottom: 24px; }
    .section-heading h2 { max-width: 16ch; }
    .work-layout, .about-section { grid-template-columns: 1fr; gap: 40px; }
    .project-image { padding: 12px; }
    .research { padding: 0; }
    .research h3 { max-width: 22ch; font-size: 1.75rem; margin-bottom: 20px; }
    .teaching-note { margin-top: 20px; }
    .about-section { padding-block: 36px 24px; gap: 28px; }
    footer { display: block; padding-block: 28px; }
    .footer-links { gap: 24px; margin-top: 16px; }
  }
  @media (max-width: 360px) {
    .intro-inner, .page-content { padding-inline: 20px; }
    .car-caption { gap: 8px; }
    .drive-link { padding-inline: 10px; gap: 6px; }
  }
</style>
