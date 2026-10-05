<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';

  let theme = 'light';
  const links = [{ id: 'work', label: 'Work' }, { id: 'about', label: 'About' }, { id: 'contact', label: 'Contact' }];
  $: home = $page.route.id === '/';
  function applyTheme() {
    const dark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }
  function changeTheme() {
    applyTheme();
    try { localStorage.colorScheme = theme; } catch { /* The preference still works for this visit. */ }
  }
  onMount(() => {
    try { theme = localStorage.colorScheme || 'light'; } catch { /* Use daylight when storage is unavailable. */ }
    applyTheme();
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    preference.addEventListener('change', applyTheme);
    return () => preference.removeEventListener('change', applyTheme);
  });
</script>

<header class="site-header" class:journey-header={home}>
  <a class="wordmark" href="{base}/" aria-label="Minchan Kim, home">{#if home}Minchan Kim{:else}mk<span class="wordmark-dot">.</span>{/if}</a>
  <nav aria-label="Main navigation">
    {#each links as link}
      <a href="{base}/#{link.id}" aria-current={home && $page.url.hash === '#' + link.id ? 'location' : undefined}>{link.label}</a>
    {/each}
  </nav>
  <div class="header-tools">
    <a class="map-link" href="{base}/world/">{home ? 'Drive the MX-5' : 'Explore the valley ↗'}</a>
    <span class="home-base">Based in San Diego, CA</span>
    <label class="theme-select">
      <span class="sr-only">Color theme</span>
      <select bind:value={theme} on:change={changeTheme}>
        <option value="light">Daylight</option>
        <option value="dark">Nightfall</option>
        <option value="auto">System</option>
      </select>
    </label>
  </div>
</header>

<style>
  .journey-header { position: relative; height: 88px; background: #e6e9e5; border: 0; backdrop-filter: none; }
  :global(html[data-theme='dark']) .journey-header { background: #24362c; }
  .journey-header .wordmark { font-size: 1rem; font-weight: 600; letter-spacing: -.03em; white-space: nowrap; }
  .journey-header nav { gap: 28px; }
  .journey-header nav a { min-height: 44px; display: inline-flex; align-items: center; }
  .map-link { min-height: 44px; padding: 0; border: 0; background: none; color: var(--text); font-size: .8rem; }
  .map-link:hover { text-decoration: underline; }
  @media (max-width: 700px) { .map-link { display: none; } }
  @media (max-width: 640px) {
    .journey-header { height: auto; min-height: 80px; flex-wrap: wrap; padding: 16px 24px 4px; column-gap: 16px; row-gap: 4px; }
    .journey-header nav { order: 3; flex-basis: 100%; margin: 0; gap: 28px; }
    .journey-header .header-tools { margin-left: auto; }
    .journey-header .theme-select select { font-size: .7rem; }
  }
</style>
