<script lang="ts">
  import {
    EquirectangularReflectionMapping,
    HalfFloatType,
    PerspectiveCamera,
    PMREMGenerator,
    type Texture,
    WebGLRenderer,
  } from 'three';
  import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
  import { Background } from 'core/Background';
  import { Raymarcher } from 'core/Raymarcher';
  import { encodeVideo } from 'core/Video';
  import { animationDuration, backgroundColor, CPUCode, GPUCode, GPUErrors, ffmpegIsLoaded, viewportSize } from 'ui/State.svelte';
  import Environment from 'textures/venice_sunset_1k.jpg';

  let {
    renderVideo = $bindable(),
  } = $props();

  let isRendering = false;
  renderVideo = async () => {
    if (!ffmpegIsLoaded.value || !raymarcher || isRendering) {
      return;
    }
    isRendering = true;
    renderer.setAnimationLoop(null);
    const blob = await encodeVideo(animationDuration.value, 60, (time) => {
      raymarcher.render(time);
      return renderer.domElement.toDataURL();
    });
    const downloader = document.createElement('a');
    downloader.href = URL.createObjectURL(blob);
    downloader.download = `sdf.mp4`;
    downloader.click();
    isRendering = false;
  };

  const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
  const renderer = new WebGLRenderer();

  renderer.autoClear = false;
  renderer.sortObjects = false;
  renderer.domElement.style.maxWidth = renderer.domElement.style.maxHeight = '100%';

  let viewport: HTMLDivElement;
  $effect(() => {
    viewport.appendChild(renderer.domElement);
  });

  let environment = $state<Texture>(null!);
  {
    const pmrem = new PMREMGenerator(renderer);
    const loader = new UltraHDRLoader();
    loader.setDataType(HalfFloatType);
    loader.load(Environment, (texture) => {
      texture.mapping = EquirectangularReflectionMapping;
      environment = pmrem.fromEquirectangular(texture).texture;
    });
  }

  const background = new Background(renderer.capabilities.precision);
  $effect(() => {
    background.setColor(backgroundColor.value);
  });

  $effect(() => {
    const { width, height } = viewportSize.value;
    const aspect = width / height;
    background.setSize(width, height);
    renderer.setSize(width, height, false);
    renderer.domElement.style.aspectRatio = String(width / height);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  });

  let raymarcher = $state<Raymarcher>(null!);
  $effect(() => {
    if (!environment) return;
    raymarcher = new Raymarcher(
      background,
      camera,
      environment,
      renderer,
      (errors) => {
        GPUErrors.value = errors;
      },
    );
    renderer.setAnimationLoop(() => {
      raymarcher.render((performance.now() / 1000) % animationDuration.value);
    });
  });

  $effect(() => {
    if (!raymarcher) return;
    raymarcher.setCPUCode(CPUCode.value);
  });

  $effect(() => {
    if (!raymarcher) return;
    raymarcher.setGPUCode(GPUCode.value);
  });
</script>

<div class="viewport" bind:this={viewport}></div>

<style>
  .viewport {
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
