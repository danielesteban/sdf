<script lang="ts">
  import * as Environments from 'textures/Environments';
  import {
    animationDuration,
    backgroundColor,
    environment,
    environmentIntensity,
    viewportSize,
  } from 'ui/State.svelte';

  const setDuration = (time: number) => () => {
    animationDuration.value = time;
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
    <label for="settingsDuration">
      Duration <span class="time">({Math.round(animationDuration.value)}s)</span>
    </label>
    <div class="options">
      <button
        class:active={animationDuration.value === Math.PI * 2}
        onclick={setDuration(Math.PI * 2)}
      >
        1x
      </button>
      <button
        class:active={animationDuration.value === Math.PI * 4}
        onclick={setDuration(Math.PI * 4)}
      >
        2x
      </button>
      <button
        class:active={animationDuration.value === Math.PI * 6}
        onclick={setDuration(Math.PI * 6)}
      >
        3x
      </button>
      <button
        class:active={animationDuration.value === Math.PI * 8}
        onclick={setDuration(Math.PI * 8)}
      >
        4x
      </button>
    </div>
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
