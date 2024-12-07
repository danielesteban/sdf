import {
  GLSL3,
  MathUtils,
  Mesh,
  type PerspectiveCamera,
  PlaneGeometry,
  RawShaderMaterial,
  type Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { type Background } from 'core/Background';
import raymarcherFragment from './raymarcher.frag';
import raymarcherVertex from './raymarcher.vert';

export class Raymarcher {
  private animate?: (camera: PerspectiveCamera, time: number) => void;
  private readonly onGPUError: (errors: { line?: number; message: string }[]) => void;
  private readonly background: Background;
  private readonly camera: PerspectiveCamera;
  private readonly environment: Texture;
  private readonly mesh: Mesh<PlaneGeometry, RawShaderMaterial>;
  private readonly renderer: WebGLRenderer;

  constructor(
    background: Background,
    camera: PerspectiveCamera,
    environment: Texture,
    renderer: WebGLRenderer,
    onGPUError: (errors: { line?: number; message: string }[]) => void
  ) {
    this.background = background;
    this.camera = camera;
    this.environment = environment;
    this.renderer = renderer;
    this.onGPUError = onGPUError;
  
    const mesh = new Mesh(new PlaneGeometry(2, 2, 1, 1), null!);
    mesh.matrixAutoUpdate = false;
    mesh.frustumCulled = false;
    mesh.updateMatrixWorld();
    this.mesh = mesh;
  }

  render(time: number) {
    const { animate, background, camera, mesh, renderer } = this;
    const { material: { uniforms, userData: { hasCompiled, hasErrors } } } = mesh;
    if (hasErrors) {
      return;
    }
    animate?.(camera, time);
    camera.getWorldDirection(uniforms.cameraDirection.value);
    uniforms.cameraFar.value = camera.far;
    uniforms.cameraFov.value = MathUtils.degToRad(camera.fov);
    uniforms.cameraNear.value = camera.near;
    renderer.getDrawingBufferSize(uniforms.resolution.value);
    uniforms.time.value = time;
    renderer.clear();
    background.render(renderer);
    renderer.render(mesh, camera);
    if (!hasCompiled) {
      mesh.material.userData.hasCompiled = true;
      const program = renderer.info.programs?.find(({ name }) => name === 'raymarcher');
      const errors: { line?: number; message: string }[] = [];
      if ((program as any)?.diagnostics) {
        mesh.material.userData.hasErrors = true;
        const { fragmentShader } = (program as any)?.diagnostics;
        if (fragmentShader.log !== '') {
          fragmentShader.log.split('\n').filter((message: string) => message !== '\x00').forEach((message: string) => {
            const matches = /ERROR: 0:(\d+)/.exec(message);
            if (matches) {
              const gl = renderer.getContext();
              const source = gl.getShaderSource(program!.fragmentShader)!;
              const userCodeOffset = source.split('\n').findIndex((line) => line === '// __USER_CODE__') + 1;
              const line = parseInt(matches[1]);
              errors.push({
                line: line - userCodeOffset,
                message: message.slice(`ERROR: 0:${line}: `.length),
              });
            } else {
              errors.push({
                message,
              });
            }
          });
        }
      }
      this.onGPUError(errors);
    }
  }

  setCPUCode(code: string) {
    this.animate = (new Function('camera', 'time', code) as (camera: PerspectiveCamera, time: number) => void);
  }

  setGPUCode(code: string) {
    const { environment, mesh, renderer } = this;
    const maxMip = Math.log2(environment.image.height) - 2;
    const texelWidth = 1.0 / (3 * Math.max(Math.pow(2, maxMip), 7 * 16));
    const texelHeight = 1.0 / environment.image.height;
    const precision = `precision ${renderer.capabilities.precision} float;\n`;
    const material = new RawShaderMaterial({
      name: 'raymarcher',
      glslVersion: GLSL3,
      vertexShader: precision + raymarcherVertex,
      fragmentShader: precision + raymarcherFragment.replace('SDF map(const in vec3 p);', '// __USER_CODE__\n' + code),
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
        envMap: { value: environment },
        envMapIntensity: { value: 0.5 },
        resolution: { value: new Vector2() },
        time: { value: 0 },
      },
    });
    material.userData.hasCompiled = false;
    material.userData.hasErrors = false;
    mesh.material?.dispose();
    mesh.material = material;
  }
}
