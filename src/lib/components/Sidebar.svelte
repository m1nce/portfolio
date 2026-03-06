<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';

  export let open = false;

  const navLinks = [
    { href: `${base}/`,        label: 'Home' },
    { href: `${base}/about`,    label: 'About' },
    { href: `${base}/projects`, label: 'Projects' },
    { href: `${base}/terminal`, label: 'Terminal' },
  ];

  let theme = 'auto';

  function isActive(href) {
    const current = $page.url.pathname;
    if (href === `${base}/`) return current === `${base}/` || current === `${base}`;
    return current.startsWith(href);
  }

  function applyTheme(value) {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = value;
    }
  }

  function onThemeChange(e) {
    theme = e.target.value;
    localStorage.colorScheme = theme;
    applyTheme(theme);
  }

  onMount(() => {
    const saved = localStorage.colorScheme ?? 'auto';
    theme = saved;
    applyTheme(saved);
  });

  function closeOnNav() {
    open = false;
  }
</script>

<aside class="sidebar" class:open>
  <div class="sidebar-identity">
    <p class="site-name">Minchan Kim</p>
    <p class="site-sub">HCI · Time-Series ML</p>
  </div>

  <div class="sidebar-divider"></div>

  <ul class="sidebar-nav">
    {#each navLinks as link}
      <li>
        <a
          href={link.href}
          class:active={isActive(link.href)}
          on:click={closeOnNav}
        >{link.label}</a>
      </li>
    {/each}
  </ul>

  <div class="sidebar-spacer"></div>
  <div class="sidebar-divider"></div>

  <div class="sidebar-bottom">
    <a
      class="sidebar-linkedin"
      href="https://linkedin.com/in/minchankim"
      target="_blank"
      rel="noopener noreferrer"
    >↗ LinkedIn</a>
    <a
      class="sidebar-github"
      href="https://github.com/m1nce"
      target="_blank"
      rel="noopener noreferrer"
    >↗ GitHub</a>

    <label class="sidebar-theme">
      Theme
      <select bind:value={theme} on:change={onThemeChange}>
        <option value="auto">auto</option>
        <option value="light">light</option>
        <option value="dark">dark</option>
      </select>
    </label>
  </div>
</aside>
