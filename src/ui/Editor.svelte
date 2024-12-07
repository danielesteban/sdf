<script module lang="ts">
  import * as monaco from 'monaco-editor';
  import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
  import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
  self.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'typescript' || label === 'javascript') {
        return new tsWorker();
      }
      return new editorWorker();
    },
  };
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import {
    // animationDuration,
    code,
    // backgroundColor,
    viewportSize,
  } from './State.svelte';

  let { renderVideo }: { renderVideo: () => Promise<void> } = $props();

  const recompile = () => {
    code.value = editor.getValue();
  };

  // const setBackground = () => {
  //   backgroundColor.value = '#778800';
  // };

  // const setDuration = () => {
  //   animationDuration.value = 1;
  // };

  const setSize = (width: number, height: number) => () => {
    viewportSize.value = { width, height };
  };

  let editor: monaco.editor.IStandaloneCodeEditor;
  let editorElement: HTMLDivElement;
  $effect(() => {
    editor = monaco.editor.create(editorElement, {
      minimap: { enabled: false },
      theme: 'vs-dark',
      value: untrack(() => code.value),
      language: 'c',
    });
    const resizeEditor = () => editor.layout();
    window.addEventListener('resize', resizeEditor);
    return () => {
      window.addEventListener('resize', resizeEditor);
    };
  });

  const onkeydown = (e: KeyboardEvent) => (
    e.altKey && e.key === 'Enter' && recompile()
  );
</script>

<svelte:window onkeydown={onkeydown} />

<div class="editor">
  <div class="tabs">
    <button class="active">
      Shader
    </button>
    <button>
      Camera
    </button>
  </div>
  <div bind:this={editorElement}></div>
  <div class="tools">
    <div>
      <button onclick={recompile}>
        Recompile
      </button>
    </div>
    <div>
      <!-- <button onclick={setBackground}>
        Background
      </button> -->
      <!-- <button onclick={setDuration}>
        Duration
      </button> -->
      <button onclick={setSize(1080, 1080)}>
        1:1
      </button>
      <button onclick={setSize(1080, 1920)}>
        9:16
      </button>
      <button onclick={setSize(1920, 1080)}>
        16:9
      </button>
    </div>
    <div>
      <button onclick={renderVideo}>
        Render Video
      </button>
    </div>
  </div>
</div>

<style>
  .editor {
    min-height: 0;
    width: 700px;
    background-color: #000;
    display: grid;
    grid-template-rows: auto 1fr auto;
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
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem;
  }
  .tools > div {
    display: flex;
    gap: 0.5rem;
  }
</style>
