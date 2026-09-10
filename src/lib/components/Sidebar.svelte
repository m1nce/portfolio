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
  <a class="wordmark" href="{base}/" aria-label="Minchan Kim, home">mk<span class="wordmark-dot">.</span></a>
  <nav aria-label="Main navigation">
    {#each links as link}
      <a href="{base}/#{link.id}" aria-current={home && $page.url.hash === '#' + link.id ? 'location' : undefined}>{link.label}</a>
    {/each}
  </nav>
  <div class="header-tools">
    <a class="map-link" href="{base}/world/">Explore the valley ↗</a>
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
  .map-link { min-height: 44px; padding: 0; border: 0; background: none; color: var(--text); font-size: .8rem; }
  .map-link:hover { text-decoration: underline; }
  @media (max-width: 700px) { .map-link { display: none; } }
</style>
