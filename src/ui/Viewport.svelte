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
  import { animationDuration, backgroundColor, code, errors, ffmpegIsLoaded, viewportSize } from 'ui/State.svelte';
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
      (_time) => {
        camera.position.set(0, 0, 10);
        // spherical.radius = 13;
        // spherical.phi = Math.PI * 0.5;
        // spherical.theta = Math.sin(time) * Math.PI * 0.25;
        // camera.position.setFromSpherical(spherical);
        // camera.lookAt(0, 0, 0);
      },
      (e) => {
        errors.value = e;
      },
    );
    renderer.setAnimationLoop(() => {
      raymarcher.render((performance.now() / 1000) % animationDuration.value);
    });
  });

  $effect(() => {
    if (!raymarcher) return;
    raymarcher.setCode(code.value);
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
