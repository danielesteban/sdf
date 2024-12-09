<script lang="ts">
  import {
    CPU,
    GPU,
    isRenderingVideo,
    videoRenderingController,
    load,
    save,
    reset,
  } from 'core/Scene.svelte';
  import Monaco from 'ui/Monaco.svelte';
  import Reference from 'ui/Reference.svelte';
  import Settings from 'ui/Settings.svelte';

  const { width }: { width: number } = $props();

  let editor = $state<Monaco | null>(null);

  $effect(() => {
    width;
    editor?.resize();
  });

  let tab = $state<'cpu' | 'gpu' | 'reference' | 'settings'>('gpu');

  const setTab = (name: typeof tab) => () => {
    tab = name;
  };

  const renderVideo = () => {
    if (isRenderingVideo.value) {
      videoRenderingController.value?.abort();
    } else {
      isRenderingVideo.value = true;
    }
  };
</script>

<div class="editor" style="width: {width}px">
  <div class="tabs">
    <button
      class:active={tab === 'gpu'}
      class:modified={GPU.hasModified.value}
      onclick={setTab('gpu')}
    >
      GPU
    </button>
    <button
      class:active={tab === 'cpu'}
      class:modified={CPU.hasModified.value}
      onclick={setTab('cpu')}
    >
      CPU
    </button>
    <button class:active={tab === 'settings'} onclick={setTab('settings')}>
      Settings
    </button>
    <button class:active={tab === 'reference'} onclick={setTab('reference')}>
      Reference
    </button>
  </div>
  {#if tab === 'cpu'}
    <Monaco bind:this={editor} file={CPU} />
  {:else if tab === 'gpu'}
    <Monaco bind:this={editor} file={GPU} />
  {:else if tab === 'reference'}
    <Reference />
  {:else if tab === 'settings'}
    <Settings />
  {/if}
  <div class="actions">
    <div>
      <button onclick={load}>
        Import
      </button>
      <button onclick={save}>
        Export
      </button>
      <button onclick={reset}>
        Reset
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
    min-height: 0;
    background-color: #000;
    display: grid;
    grid-template-rows: auto 1fr auto;
  }
  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 0.5rem;
  }
  .actions > div {
    display: flex;
    gap: 0.5rem;
  }
  .actions > div:nth-child(2) {
    justify-content: right;
  }
  .actions > div > button.abort {
    background: #933;
  }
  .tabs {
    display: flex;
  }
  .tabs > button {
    background: transparent;
    position: relative;
    border: 0;
    padding: 0;
    width: 5rem;
    height: 3.125rem;
  }
  .tabs > button.active {
    cursor: default;
  }
  .tabs > button.active::after {
    position: absolute;
    left: 0.5rem;
    right: 0.5rem;
    bottom: 0.5rem;
    height: 0.25rem;
    content: "";
    background: #393;
    border-radius: 0.25rem;
  }
  .tabs > button.modified::before {
    position: absolute;
    top: 50%;
    right: 0.75rem;
    transform: translate(0, -50%);
    content: "";
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 0.25rem;
    background: #393;
    border-radius: 0.25rem;
  }
</style>
