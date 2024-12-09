import {
  GLSL3,
  MathUtils,
  Mesh,
  type PerspectiveCamera,
  PlaneGeometry,
  RawShaderMaterial,
  Spherical,
  type Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { type Background } from 'core/Background';
import { type Errors } from 'core/Scene.svelte';
import raymarcherFragment from './raymarcher.frag';
import raymarcherVertex from './raymarcher.vert';

export class Raymarcher {
  private animate?: (camera: PerspectiveCamera, spherical: Spherical, time: number) => void;
  private readonly onCPUErrors: (errors: Errors) => void;
  private readonly onGPUErrors: (errors: Errors) => void;
  private readonly status = {
    cpu: { hasErrors: false },
    gpu: { hasCompiled: false, hasErrors: false },
  };
  private readonly background: Background;
  private readonly camera: PerspectiveCamera;
  private readonly envMapIntensity = { value: 0.5 };
  private readonly mesh: Mesh<PlaneGeometry, RawShaderMaterial>;
  private readonly renderer: WebGLRenderer;

  constructor(
    background: Background,
    camera: PerspectiveCamera,
    renderer: WebGLRenderer,
    onCPUErrors: (errors: Errors) => void,
    onGPUErrors: (errors: Errors) => void
  ) {
    this.background = background;
    this.camera = camera;
    this.renderer = renderer;
    this.onCPUErrors = onCPUErrors;
    this.onGPUErrors = onGPUErrors;
  
    const mesh = new Mesh(new PlaneGeometry(2, 2, 1, 1), null!);
    mesh.matrixAutoUpdate = false;
    mesh.frustumCulled = false;
    mesh.updateMatrixWorld();
    this.mesh = mesh;
  }

  private static readonly spherical = new Spherical();

  render(time: number) {
    const { animate, background, camera, mesh, renderer, status } = this;
    const { spherical } = Raymarcher;
    if (!mesh.material) {
      return;
    }
    const { material: { uniforms } } = mesh;
    if (status.cpu.hasErrors || status.gpu.hasErrors) {
      return;
    }
    try {
      animate?.(camera, spherical, time);
    } catch (e) {
      status.cpu.hasErrors = true;
      if (e instanceof Error) {
        const matches = /<anonymous>:(\d+):(\d+)/.exec(e.stack || '');
        let line: number | undefined;
        let start: number | undefined;
        let end: number | undefined;
        if (matches) {
          line = parseInt(matches[1], 10);
          start = parseInt(matches[2], 10);
          end = start + 1;
        }
        this.onCPUErrors([{
          line,
          start,
          end,
          message: e.message,
        }]);
        return;
      }
      throw e;
    }
    camera.getWorldDirection(uniforms.cameraDirection.value);
    uniforms.cameraFar.value = camera.far;
    uniforms.cameraFov.value = MathUtils.degToRad(camera.fov);
    uniforms.cameraNear.value = camera.near;
    renderer.getDrawingBufferSize(uniforms.resolution.value);
    uniforms.time.value = time;
    renderer.clear();
    background.render(renderer);
    renderer.render(mesh, camera);
    if (!status.gpu.hasCompiled) {
      status.gpu.hasCompiled = true;
      const program = renderer.info.programs?.find(({ name }) => name === 'raymarcher');
      const errors: Errors = [];
      if ((program as any)?.diagnostics) {
        status.gpu.hasErrors = true;
        const { fragmentShader } = (program as any)?.diagnostics;
        if (fragmentShader.log !== '') {
          fragmentShader.log.split('\n').filter((message: string) => message !== '\x00').forEach((message: string) => {
            let matches = /ERROR: 0:(\d+)/.exec(message);
            if (matches) {
              const gl = renderer.getContext();
              const source = gl.getShaderSource(program!.fragmentShader)!.split('\n');
              const userCodeOffset = source.findIndex((line) => line === '// __USER_CODE__') + 1;
              const line = parseInt(matches[1], 10);
              message = message.slice(`ERROR: 0:${line}: `.length);
              let start = 0;
              let end = 0;
              matches = /'(.+)' :/.exec(message);
              const code = source[line - 1];
              if (matches) {
                const index = code.indexOf(matches[1]);
                if (index !== -1) {
                  start = index + 1;
                  end = 1 + index + matches[1].length;
                }
              }
              errors.push({
                line: line - userCodeOffset,
                start,
                end,
                message,
              });
            } else {
              errors.push({
                message,
              });
            }
          });
        }
      }
      this.onGPUErrors(errors);
    }
  }

  setEnvMapIntensity(intensity: number) {
    const { envMapIntensity } = this;
    envMapIntensity.value = intensity;
  }

  private static readonly globals = [
    ...Object.keys(window),
    'globalThis',
    'ServiceWorker',
    'ServiceWorkerContainer',
    'ServiceWorkerRegistration',
    'SharedWorker',
    'XMLHttpRequest', 
    'Worker',
  ];

  setCPUCode(code: string) {
    const { status } = this;
    const { globals } = Raymarcher;
    try {
      this.animate = (new Function('camera', 'spherical', 'time', ...globals, code) as typeof this.animate);
    } catch (e) {
      status.cpu.hasErrors = true;
      if (e instanceof Error) {
        this.onCPUErrors([{
          message: e.message,
        }]);
        return;
      }
      throw e;
    }
    status.cpu.hasErrors = false;
    this.onCPUErrors([]);
  }

  setGPUCode(code: string, envMap: Texture) {
    const { envMapIntensity, mesh, renderer, status } = this;
    const maxMip = Math.log2(envMap.image.height) - 2;
    const texelWidth = 1.0 / (3 * Math.max(Math.pow(2, maxMip), 7 * 16));
    const texelHeight = 1.0 / envMap.image.height;
    const precision = `precision ${renderer.capabilities.precision} float;\n`;
    const material = new RawShaderMaterial({
      name: 'raymarcher',
      glslVersion: GLSL3,
      transparent: true,
      defines: {
        CUBEUV_MAX_MIP: `${maxMip}.0`,
        CUBEUV_TEXEL_WIDTH: `${texelWidth}`,
        CUBEUV_TEXEL_HEIGHT: `${texelHeight}`,
        ENVMAP_TYPE_CUBE_UV: true,
        MAX_DISTANCE: '1000.0',
        MAX_ITERATIONS: '1000',
        MIN_COVERAGE: '0.02',
        MIN_DISTANCE: '0.01',
        NORMAL_OFFSET: '0.05',
      },
      uniforms: {
        cameraDirection: { value: new Vector3() },
        cameraFar: { value: 0 },
        cameraFov: { value: 0 },
        cameraNear: { value: 0 },
        envMap: { value: envMap },
        envMapIntensity: envMapIntensity,
        resolution: { value: new Vector2() },
        time: { value: 0 },
      },
      vertexShader: precision + raymarcherVertex,
      fragmentShader: precision + raymarcherFragment.replace('SDF map(const in vec3 p);', '// __USER_CODE__\n' + code),
    });
    status.gpu.hasCompiled = false;
    status.gpu.hasErrors = false;
    mesh.material?.dispose();
    mesh.material = material;
  }
}
