<script lang="ts">
  import Editor from 'ui/Editor.svelte';
  import Viewport from 'ui/Viewport.svelte';

  const onkeydown = (e: KeyboardEvent) => (
    e.key === ' '
    && !['input', 'textarea', 'select'].includes((e.target as HTMLElement).tagName.toLowerCase())
    && e.preventDefault()
  );
  const onwheel = (e: WheelEvent) => (
    e.ctrlKey && e.preventDefault()
  );

  let editorWidth = $state(800);
  let isDragging = $state(false);
  const drag = {
    initial: 0,
    offset: 0,
  };
  const onpointerdown = (e: PointerEvent) => {
    isDragging = true;
    drag.initial = editorWidth;
    drag.offset = e.clientX;
  };
  const onpointermove = (e: PointerEvent) => {
    if (isDragging) {
      editorWidth = Math.max(Math.floor(drag.initial + e.clientX - drag.offset), 380);
    }
  };
  const onpointerup = () => {
    if (isDragging) {
      isDragging = false;
    }
  };
</script>

<svelte:window 
  on:contextmenu|preventDefault
  on:keydown={onkeydown}
  on:pointermove={onpointermove}
  on:pointerup={onpointerup}
  on:touchstart|nonpassive|preventDefault
  on:wheel|nonpassive={onwheel}
/>

<div class="app">
  <Editor width={editorWidth} />
  <div
    class="divider"
    onpointerdown={onpointerdown}
    style={isDragging ? 'background: #393' : ''}
  >
  </div>
  <Viewport />
</div>

<style>
  .app {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: auto auto 1fr;
  }

  .divider {
    width: 0.5rem;
    border-color: #222;
    border-style: solid;
    border-width: 0px;
    border-left-width: 1px;
    border-right-width: 1px;
    background-color: #111;
    cursor: ew-resize;
  }
</style>
