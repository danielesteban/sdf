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
  private readonly animate: (time: number) => void;
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
    animate: (time: number) => void
  ) {
    this.animate = animate;
    this.background = background;
    this.camera = camera;
    this.environment = environment;
    this.renderer = renderer;
  
    const mesh = new Mesh(new PlaneGeometry(2, 2, 1, 1), null!);
    mesh.matrixAutoUpdate = false;
    mesh.frustumCulled = false;
    mesh.updateMatrixWorld();
    this.mesh = mesh;
  }

  render(time: number) {
    const { animate, background, camera, mesh, renderer } = this;
    const { material: { uniforms } } = mesh;
    animate(time);
    camera.getWorldDirection(uniforms.cameraDirection.value);
    uniforms.cameraFar.value = camera.far;
    uniforms.cameraFov.value = MathUtils.degToRad(camera.fov);
    uniforms.cameraNear.value = camera.near;
    renderer.getDrawingBufferSize(uniforms.resolution.value);
    uniforms.time.value = time;
    renderer.clear();
    background.render(renderer);
    renderer.render(mesh, camera);
  }

  setCode(code: string) {
    const { environment, mesh, renderer } = this;
    const maxMip = Math.log2(environment.image.height) - 2;
    const texelWidth = 1.0 / (3 * Math.max(Math.pow(2, maxMip), 7 * 16));
    const texelHeight = 1.0 / environment.image.height;
    const precision = `precision ${renderer.capabilities.precision} float;\n`;
    const material = new RawShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: precision + raymarcherVertex,
      fragmentShader: precision + raymarcherFragment.replace('SDF map(const in vec3 p);', code),
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
    mesh.material?.dispose();
    mesh.material = material;
  }
}
