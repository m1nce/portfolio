<script>
  import ExperienceTimeline from '$lib/components/ExperienceTimeline.svelte';
</script>

<svelte:head>
  <title>About — Minchan Kim</title>
</svelte:head>

<div class="about-layout">
  <div>
    <h1>About</h1>

    <section class="bio">
      <p>
        I'm Minchan Kim, a graduate student at UCSD studying Data Science with a 
        focus on Human-Computer Interaction (HCI) and Machine Learning (ML). 
      </p>
      <p>
        In research, I primarily focus on how HCI principles can be applied to the 
        present age of Generative Artificial Intelligence. This can be distinguished
        in many different ways, but my focus is on understanding the relationship 
        between users and AI. Due to the rapidly changing nature of our world, it 
        is imperative to analyze and uncover the ways that we as humans can beneficially 
        use AI, adapting to the shifting technological landscape we live in.
      </p>
      <p>
        Industry-wise, my experience is in analyzing cyclic time series data. From
        uncovering hidden trends using statistical analysis or optimizing a 
        machine learning model, I aim to communicate all aspects of the given data in 
        a variety of perspectives. 
      </p>
    </section>
  </div>

  <div class="timeline-col">
    <section class="experience-section">
      <h2>Experience</h2>
      <ExperienceTimeline />
    </section>
  </div>
</div>

<style>
  .about-layout {
    display: grid;
    grid-template-columns: minmax(0, 40ch) 1fr;
    gap: 4rem;
    align-items: start;
  }

  .bio {
    max-width: none;
    margin-bottom: 0;
  }

  .bio p {
    line-height: 1.7;
    margin-bottom: 1rem;
    opacity: 0.9;
  }

  .experience-section h2 {
    margin-bottom: 1.5rem;
  }

  @media (max-width: 900px) {
    .about-layout {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }
</style>
