<script lang="ts">
  import { untrack } from 'svelte';
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
  import {
    animationDuration,
    backgroundColor,
    CPUCode,
    GPUCode,
    GPUErrors,
    hasLoadedFFmpeg,
    isRenderingVideo,
    videoRenderingController,
    videoRenderingProgress,
    viewportSize,
  } from 'ui/State.svelte';
  import Environment from 'textures/venice_sunset_1k.jpg';

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
  });

  $effect(() => {
    if (!raymarcher) return;
    raymarcher.setCPUCode(CPUCode.value);
  });

  $effect(() => {
    if (!raymarcher) return;
    raymarcher.setGPUCode(GPUCode.value);
  });

  $effect(() => {
    if (!hasLoadedFFmpeg.value || !raymarcher) {
      return;
    }
    if (!isRenderingVideo.value) {
      renderer.setAnimationLoop(() => {
        raymarcher.render((performance.now() / 1000) % animationDuration.value);
      });
      return;
    }
    renderer.setAnimationLoop(null);
    untrack(() => videoRenderingController.value?.abort());
    (async () => {
      const controller = new AbortController();
      const duration = untrack(() => animationDuration.value);
      videoRenderingController.value = controller;
      let blob: Blob | undefined;
      try {
        blob = await encodeVideo(controller, duration, 60, (time) => {
          raymarcher.render(time);
          return renderer.domElement.toDataURL();
        }, (stage, progress) => {
          videoRenderingProgress.value = { stage, progress };
        });
      } catch (e) {
        if (!(e instanceof Error && e.name === 'AbortError')) {
          throw e;
        }
      }
      isRenderingVideo.value = false;
      videoRenderingProgress.value = { stage: 'render', progress: 0 };
      if (!blob) {
        return;
      }
      const downloader = document.createElement('a');
      downloader.href = URL.createObjectURL(blob);
      downloader.download = `sdf.mp4`;
      downloader.click();
    })();
  });

  const videoRenderingStages = {
    render: 'Rendering video...',
    encode: 'Encoding video...',
  };
</script>

<div class="viewport" bind:this={viewport}>
  {#if isRenderingVideo.value}
    <div class="video">
      <div>{videoRenderingStages[videoRenderingProgress.value.stage]}</div>
      <div>
        <progress value={videoRenderingProgress.value.progress}></progress>
      </div>
    </div>
  {/if}
</div>

<style>
  .viewport {
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .video {
    position: absolute;
    bottom: 1rem;
    background: #000;
    border-radius: 0.25rem;
    padding: 0.5rem;
    width: 25%;
  }

  .video > div > progress {
    width: 100%;
  }
</style>
