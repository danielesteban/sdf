<script lang="ts">
  import { type PointerEventHandler } from 'svelte/elements';
  import Editor from 'ui/Editor.svelte';
  import Viewport from 'ui/Viewport.svelte';

  const onkeydown = (e: KeyboardEvent) => (
    ((
      e.key === ' '
      && !['input', 'textarea', 'select'].includes((e.target as HTMLElement).tagName.toLowerCase())
    ) || (
      (e.ctrlKey || e.metaKey)
      && ['=', '+', '-', '_'].includes(e.key)
    ))
    && e.preventDefault()
  );
  const onwheel = (e: WheelEvent) => (
    e.ctrlKey && e.preventDefault()
  );

  const drag = { initial: 0, offset: 0 };
  let editorWidth = $state(800);
  const onpointerdown: PointerEventHandler<HTMLDivElement> = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.addEventListener('pointermove', onpointermove);
    drag.initial = editorWidth;
    drag.offset = e.clientX;
  };
  const onpointerup: PointerEventHandler<HTMLDivElement> = (e) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    e.currentTarget.removeEventListener('pointermove', onpointermove);
  };
  const onpointermove = (e: PointerEvent) => {
    editorWidth = Math.max(Math.floor(drag.initial + e.clientX - drag.offset), 320);
  };
</script>

<svelte:window 
  on:contextmenu|preventDefault
  on:keydown={onkeydown}
  on:touchstart|nonpassive|preventDefault
  on:wheel|nonpassive={onwheel}
/>

<div class="app">
  <Editor width={editorWidth} />
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="divider"
    onpointerdown={onpointerdown}
    onpointerup={onpointerup}
    onlostpointercapture={onpointerup}
  >
  </div>
  <Viewport />
</div>

<div class="credits">
  <a href="https://dani.gatunes.com" rel="noopener noreferrer" target="_blank">dani@gatunes</a> © 2026
</div>

<style>
  .app {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: auto auto 1fr;
  }
  .credits {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  }
  .divider {
    width: 0.5rem;
    background-color: #111;
    border: 0 solid #2d2d2d;
    border-left-width: 1px;
    border-right-width: 1px;
    cursor: ew-resize;
  }
  .divider:hover {
    background-color: #4f4f4f;
  }
  .divider:active {
    background-color: #5e5e5e;
  }
</style>
