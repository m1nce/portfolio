<script>
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';

  let sidebarOpen = false;

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function closeSidebar() {
    sidebarOpen = false;
  }
</script>

<button class="hamburger" on:click={toggleSidebar} aria-label="Toggle navigation">
  {sidebarOpen ? '✕' : '☰'}
</button>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="sidebar-backdrop" class:open={sidebarOpen} on:click={closeSidebar}></div>

<Sidebar bind:open={sidebarOpen} />

<main class="content">
  <slot />
</main>
