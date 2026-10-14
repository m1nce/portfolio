<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';

  let theme = 'light';
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

<header class="site-header" class:wide-header={['/', '/projects', '/about'].includes($page.route.id)}>
  <a class="wordmark" href="{base}/" aria-label="Minchan Kim, home">Minchan Kim</a>
  <nav aria-label="Main navigation">
    <a href="{base}/projects/" aria-current={$page.route.id === '/projects' ? 'page' : undefined}>Work</a>
    <a href="{base}/about/" aria-current={$page.route.id === '/about' ? 'page' : undefined}>About</a>
    <a href="{base}/#contact">Contact</a>
  </nav>
  <label class="theme-select">
    <span class="sr-only">Color theme</span>
    <select bind:value={theme} on:change={changeTheme}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="auto">System</option>
    </select>
  </label>
</header>

<style>
  .wide-header { max-width: 1008px; }
</style>
