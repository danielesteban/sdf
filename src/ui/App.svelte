<script lang="ts">
  import Editor from 'ui/Editor.svelte';
  import Viewport from 'ui/Viewport.svelte';

  let renderVideo: () => Promise<void>;

  const onkeydown = (e: KeyboardEvent) => (
    e.key === ' '
    && !['input', 'textarea', 'select'].includes((e.target as HTMLElement).tagName.toLowerCase())
    && e.preventDefault()
  );
  const onwheel = (e: WheelEvent) => (
    e.ctrlKey && e.preventDefault()
  );
</script>

<svelte:window 
  on:contextmenu|preventDefault
  on:keydown={onkeydown}
  on:touchstart|nonpassive|preventDefault
  on:wheel|nonpassive={onwheel}
/>

<div class="app">
  <Editor renderVideo={renderVideo} />
  <Viewport bind:renderVideo={renderVideo} />
</div>

<style>
  .app {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: auto 1fr;
  }
</style>
