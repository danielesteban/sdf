<script lang="ts">
  import { untrack } from 'svelte';
  import {
    CubeReflectionMapping,
    EquirectangularReflectionMapping,
    HalfFloatType,
    PerspectiveCamera,
    PMREMGenerator,
    type Texture,
    WebGLRenderer,
  } from 'three';
  import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
  import { Raymarcher } from 'core/Raymarcher';
  import {
    CPU,
    GPU,
    Settings,
    Video,
  } from 'core/Scene.svelte';
  import { encodeVideo } from 'core/Video';
  import * as Environments from 'textures/Environments';

  const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
  const renderer = new WebGLRenderer({ depth: false });
  renderer.domElement.style.maxWidth = renderer.domElement.style.maxHeight = '100%';
  renderer.domElement.style.minWidth = renderer.domElement.style.minHeight = '100%';
  renderer.domElement.style.objectFit = 'contain';
  renderer.sortObjects = false;

  let viewport: HTMLDivElement;
  $effect(() => {
    viewport.appendChild(renderer.domElement);
  });

  $effect(() => {
    const { width, height } = Settings.viewportSize;
    const aspect = width / height;
    const scale = Video.isRendering ? 1.0 : Settings.viewportScale;
    renderer.setSize(width * scale, height * scale, false);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  });

  const envLoader = new UltraHDRLoader();
  envLoader.setDataType(HalfFloatType);
  const pmrem = new PMREMGenerator(renderer);
  let envMap = $state<Texture | null>(null);
  $effect(() => {
    envLoader.load(Environments[Settings.environment], (texture) => {
      texture.mapping = EquirectangularReflectionMapping;
      envMap = pmrem.fromEquirectangular(texture).texture;
      envMap.mapping = CubeReflectionMapping;
    });
  });

  const raymarcher = new Raymarcher(
    camera,
    renderer,
    (errors) => {
      CPU.errors = errors;
    },
    (errors) => {
      GPU.errors = errors;
    },
  );

  $effect(() => {
    raymarcher.setBackgroundColor(Settings.backgroundColor);
  });

  $effect(() => {
    raymarcher.setDuration(Settings.animationDuration);
  });

  $effect(() => {
    raymarcher.setEnvMapIntensity(Settings.environmentIntensity);
  });

  $effect(() => {
    raymarcher.setCPUCode(CPU.code);
  });

  $effect(() => {
    if (!envMap) return;
    raymarcher.setGPUCode(GPU.code, envMap);
  });

  $effect(() => {
    if (Video.isRendering) return;
    renderer.setAnimationLoop(() => (
      raymarcher.render((performance.now() / 1000) % Settings.animationDuration)
    ));
  });

  $effect(() => {
    if (!Video.isRendering || !Video.hasLoadedFFmpeg) return;
    renderer.setAnimationLoop(null);
    untrack(() => Video.renderingController?.abort());
    (async () => {
      const controller = new AbortController();
      const duration = untrack(() => Settings.animationDuration);
      Video.renderingController = controller;
      let blob: Blob | undefined;
      try {
        blob = await encodeVideo(controller, duration, 60, (time) => {
          raymarcher.render(time);
          return renderer.domElement.toDataURL();
        }, (stage, progress) => {
          Video.renderingProgress = { stage, progress };
        });
      } catch (e) {
        if (!(e instanceof Error && e.name === 'AbortError')) {
          throw e;
        }
      }
      Video.isRendering = false;
      Video.renderingProgress = { stage: 'render', progress: 0 };
      if (!blob) {
        return;
      }
      const downloader = document.createElement('a');
      downloader.href = URL.createObjectURL(blob);
      downloader.download = 'scene.mp4';
      downloader.click();
    })();
  });

  const videoRenderingStages = {
    render: 'Rendering video...',
    encode: 'Encoding video...',
  };
</script>

<div class="viewport" bind:this={viewport}>
  {#if Video.isRendering}
    <div class="video">
      <div>{videoRenderingStages[Video.renderingProgress.stage]}</div>
      <div>
        <progress value={Video.renderingProgress.progress}></progress>
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
