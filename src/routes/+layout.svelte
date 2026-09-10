<script>
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { page } from '$app/stores';
  $: home = $page.route.id === '/';
  $: world = $page.route.id === '/world';
</script>

<a class="skip-link" href="#main-content">Skip to content</a>
{#if !world}<Sidebar />{/if}
<main id="main-content" class:inner-page={!home && !world}>
  <slot />
</main>
