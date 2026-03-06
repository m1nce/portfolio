<script>
  import { base } from '$app/paths';
  import SignalCanvas from '$lib/components/SignalCanvas.svelte';
</script>

<svelte:head>
  <title>Minchan Kim</title>
</svelte:head>

<div class="home-layout">
  <div class="intro">
    <header>
      <h1>Minchan Kim</h1>
      <p class="role">HCI Researcher · Time-Series ML</p>
    </header>

    <p class="bio">
      Graduate student at UCSD studying Data Science with a focus in Human-Computer Interaction (HCI)
      and Machine Learning. My research looks into how we can use HCI principles to understand 
      the complex interactions between Generative Artificial Intelligence and people. I'm especially 
      interested in annotation interfaces where domain experts and ML models collaborate to build 
      more reliable ground truth. 
    </p>

    <ul class="quick-links">
      <li><a href="{base}/about">About →</a></li>
      <li><a href="{base}/projects">Projects →</a></li>
      <li><a href="{base}/terminal">Terminal →</a></li>
    </ul>
  </div>

  <aside class="info-panel">
    <div class="signal-wrap">
      <SignalCanvas />
    </div>
    <div class="panel-section">
      <h3 class="panel-label">currently</h3>
      <ul class="panel-list">
        <li>@ UCSD</li>
        <li>researching HCI</li>
        <li>building my PhD application</li>
      </ul>
    </div>
    <div class="panel-section">
      <h3 class="panel-label">contact</h3>
      <p class="panel-skills">mcskim04@gmail.com</p>
    </div>
    <div class="panel-section">
      <h3 class="panel-label">interests</h3>
      <p class="panel-skills">NBA, Formula 1, Science Based Lifting, Chicken and rice</p>
    </div>
  </aside>
</div>

<style>
  .home-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
  }

  .intro {
    max-width: 55ch;
  }

  h1 {
    font-size: clamp(2rem, 4vw, 3rem);
    margin-bottom: 0.25rem;
  }

  .role {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0 0 2rem;
    letter-spacing: 0.04em;
  }

  .bio {
    line-height: 1.75;
    color: var(--text);
    opacity: 0.88;
    margin-bottom: 2.5rem;
  }

  .quick-links {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .quick-links a {
    font-family: var(--font-mono);
    font-size: 0.88rem;
    color: var(--accent);
    text-decoration: none;
    letter-spacing: 0.02em;
  }

  .quick-links a:hover {
    text-decoration: underline;
  }

  .info-panel {
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0 1.75rem 1.5rem;
    background: var(--bg-elevated);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    overflow: hidden;
  }

  .signal-wrap {
    margin: 0 -1.75rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 0;
  }

  .panel-label {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin: 0 0 0.6rem;
  }

  .panel-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.875rem;
    color: var(--text);
    opacity: 0.85;
  }

  .panel-skills {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--text);
    opacity: 0.8;
    margin: 0;
    line-height: 1.8;
  }

  @media (max-width: 900px) {
    .home-layout {
      grid-template-columns: 1fr;
      min-height: auto;
      gap: 2rem;
    }
    .intro {
      padding-top: 1rem;
    }
  }
</style>
