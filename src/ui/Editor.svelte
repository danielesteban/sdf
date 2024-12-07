<script lang="ts">
  import Monaco from 'ui/Monaco.svelte';
  import {
    CPU,
    GPU,
    backgroundColor,
    isRenderingVideo,
    videoRenderingController,
    viewportSize,
  } from 'ui/State.svelte';

  const { width }: { width: number } = $props();

  let editor = $state<Monaco>(null!);

  $effect(() => {
    width;
    editor.resize();
  });

  const renderVideo = () => {
    if (isRenderingVideo.value) {
      videoRenderingController.value?.abort();
    } else {
      isRenderingVideo.value = true;
    }
  };

  let file = $state<'gpu' | 'cpu'>('gpu');

  const setFile = (name: typeof file) => () => {
    file = name;
  };

  const setSize = (width: number, height: number) => () => {
    viewportSize.value = { width, height };
  };

  const onkeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      editor.save();
    }
    if (e.altKey && e.key === 'Enter') {
      editor.save();
    }
  };

  let colorInput: HTMLInputElement;
  const toggleColorInput = () => (
    colorInput.click()
  );
</script>

<svelte:window onkeydown={onkeydown} />

<div class="editor" style="width: {width}px">
  <div class="topbar">
    <div class="tabs">
      <button class:active={file === 'gpu'} onclick={setFile('gpu')}>
        GPU
      </button>
      <button class:active={file === 'cpu'} onclick={setFile('cpu')}>
        CPU
      </button>
    </div>
    <div>
      <button onclick={editor.save}>
        Save
      </button>
    </div>
  </div>
  {#if file === 'cpu'}
    <Monaco bind:this={editor} file={CPU} />
  {:else if file === 'gpu'}
    <Monaco bind:this={editor} file={GPU} />
  {/if}
  <div class="tools">
    <div>
      <button
        aria-label="background"
        class="color"
        onclick={toggleColorInput}
        style="background: {backgroundColor.value}"
      >
        <input type="color" bind:this={colorInput} bind:value={backgroundColor.value} />
      </button>
    </div>
    <div>
      <button
        class:active={viewportSize.value.width === 1080 && viewportSize.value.height === 1080}
        onclick={setSize(1080, 1080)}
      >
        1:1
      </button>
      <button
        class:active={viewportSize.value.width === 1080 && viewportSize.value.height === 1920}
        onclick={setSize(1080, 1920)}
      >
        9:16
      </button>
      <button
        class:active={viewportSize.value.width === 1920 && viewportSize.value.height === 1080}
        onclick={setSize(1920, 1080)}
      >
        16:9
      </button>
    </div>
    <div>
      <button class:abort={isRenderingVideo.value} onclick={renderVideo}>
        {#if isRenderingVideo.value}
          Abort Rendering
        {:else}
          Render Video
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .editor {
    background-color: #000;
    display: grid;
    grid-template-rows: auto 1fr auto;
  }
  .topbar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .topbar > div:nth-child(2) {
    display: flex;
    padding: 0.5rem;
    justify-content: right;
  }
  .tabs {
    display: flex;
  }
  .tabs > button {
    background: transparent;
    position: relative;
    padding: 1rem;
  }
  .tabs > button.active {
    cursor: default;
  }
  .tabs > button.active::before {
    position: absolute;
    left: 0.5rem;
    right: 0.5rem;
    bottom: 0.5rem;
    height: 0.25rem;
    content: "";
    background: #393;
    cursor: default;
    border-radius: 0.25rem;
  }
  .tools {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
    padding: 0.5rem;
  }
  .tools > div {
    display: flex;
    gap: 0.5rem;
  }
  .tools > div:nth-child(2) {
    justify-content: center;
  }
  .tools > div:nth-child(2) > button {
    width: 2.125rem;
  }
  .tools > div:nth-child(3) {
    justify-content: right;
  }
  .tools > div > button.abort {
    background: #933;
  }
  .tools > div > button.active {
    border-color: #393;
  }
  .color {
    position: relative;
    padding: 0;
    width: 2.125rem;
    height: 2.125rem;
  }
  .color > input[type="color"] {
    position: absolute;
    top: 0;
    left: 0;
    visibility: hidden;
  }
</style>
