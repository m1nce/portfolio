<script>
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { page } from '$app/stores';
  $: home = $page.route.id === '/';
</script>

<a class="skip-link" href="#main-content">Skip to content</a>
<Sidebar />
<main id="main-content" class:inner-page={!home}>
  <slot />
</main>
