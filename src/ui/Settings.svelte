<script lang="ts">
  import * as Environments from 'textures/Environments';
  import {
    animationDuration,
    backgroundColor,
    environment,
    environmentIntensity,
    viewportScale,
    viewportSize,
  } from 'core/Scene.svelte';

  const aspectRatios = [
    { name: '1:1', width: 1080, height: 1080 },
    { name: '9:16', width: 1080, height: 1920 },
    { name: '16:9', width: 1920, height: 1080 },
  ];

  const durations = [
    { name: '1x', value: Math.PI * 2 },
    { name: '2x', value: Math.PI * 4 },
    { name: '3x', value: Math.PI * 6 },
    { name: '4x', value: Math.PI * 8 },
  ];

  const scales = [
    { name: '1x', value: 1 },
    { name: '2x', value: 0.5 },
    { name: '3x', value: 0.25 },
    { name: '4x', value: 0.125 },
  ];

  const setDuration = (value: number) => () => {
    animationDuration.value = value;
  };

  const setScale = (value: number) => () => {
    viewportScale.value = value;
  };

  const setSize = (width: number, height: number) => () => {
    viewportSize.value = { width, height };
  };

  let colorInput: HTMLInputElement;
  const toggleColorInput = () => (
    colorInput.click()
  );
</script>

<div class="settings">
  <div>
    <label for="settingsAspectRatio">Aspect Ratio</label>
    <div class="options">
      {#each aspectRatios as { name, width, height }}
        <button
          class:active={viewportSize.value.width === width && viewportSize.value.height === height}
          onclick={setSize(width, height)}
        >
          {name}
        </button>
      {/each}
    </div>
  </div>
  <div>
    <label for="settingsBackgroundColor">Background Color</label>
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
    <label for="settingsEnvironment">Environment</label>
    <select id="settingsEnvironment" bind:value={environment.value}>
      {#each Object.keys(Environments) as id}
        <option value={id}>
          {id}
        </option>
      {/each}
    </select>
  </div>
  <div>
    <label for="settingsEnvironmentIntensity">Environment Intensity</label>
    <input
      id="settingsEnvironmentIntensity"
      type="range"
      min={0}
      max={1}
      step={0.01}
      bind:value={environmentIntensity.value}
    />
  </div>
  <div>
    <label for="settingsLoopDuration">
      Loop Duration <span class="time">({Math.floor(animationDuration.value)}s)</span>
    </label>
    <div class="options">
      {#each durations as { name, value }}
        <button
          class:active={animationDuration.value === value}
          onclick={setDuration(value)}
        >
          {name}
        </button>
      {/each}
    </div>
  </div>
  <div>
    <label for="settingsPreviewScale">Preview Downscaling</label>
    <div class="options">
      {#each scales as { name, value }}
        <button
          class:active={viewportScale.value === value}
          onclick={setScale(value)}
        >
          {name}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: #1e1e1e;
    padding: 1rem;
    overflow-y: auto;
  }
  .settings > div {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .settings > div > input[type="range"], .settings > div > select {
    max-width: 20rem;
  }
  .color {
    position: relative;
    padding: 0;
    width: 2.125rem;
    height: 2.125rem;
  }
  .color > input[type="color"] {
    position: absolute;
    bottom: 0;
    left: 0;
    visibility: hidden;
  }
  .options {
    display: flex;
    gap: 0.5rem;
  }
  .options > button {
    width: 2.125rem;
  }
  .options > button.active {
    border-color: #393;
  }
  .time {
    color: #999;
  }
</style>
