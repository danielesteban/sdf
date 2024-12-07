import {
  BufferGeometry,
  Color,
  type ColorRepresentation,
  DataTexture,
  Float32BufferAttribute,
  FloatType,
  GLSL3,
  LinearFilter,
  Mesh,
  type NormalBufferAttributes,
  OrthographicCamera,
  RawShaderMaterial,
  RedFormat,
  RepeatWrapping,
  Vector2,
  WebGLRenderer,
} from 'three';

const Noise = (size = 256) => {
  const data = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    data[i] = Math.random();
  }
  const texture = new DataTexture(data, size, size, RedFormat, FloatType);
  texture.needsUpdate = true;
  texture.magFilter = texture.minFilter = LinearFilter;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  return texture;
};

class BackgroundGeometry extends BufferGeometry {
  constructor() {
    super();
    this.setAttribute('position', new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
    this.setAttribute('uv', new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
  }
}

class BackgroundMaterial extends RawShaderMaterial {
  private static readonly vertexShader = /* glsl */`
    uniform mat4 projectionMatrix;

    in vec3 position;
    in vec2 uv;

    out vec2 vUV;

    void main()	{
      vUV = uv;
      gl_Position = projectionMatrix * vec4(position, 1.0);
    }
  `;

  private static readonly fragmentShader = /* glsl */`
    #include <common>
    #include <colorspace_pars_fragment>

    uniform vec3 color;
    uniform sampler2D noise;
    uniform vec2 resolution;

    in vec2 vUV;

    out vec4 outputColor;

    void main()	{
      vec3 granularity = color * 0.03;
      outputColor = vec4(mix(color, color / 3.0, length(vUV - 0.5) * 1.5), 1.0);
      outputColor.rgb += mix(-granularity, granularity, texture(noise, vUV * resolution).r);
      outputColor = saturate(sRGBTransferOETF(outputColor));
    }
  `;

  constructor(precision: string) {
    precision = `precision ${precision} float;`;
    super({
      name: 'background',
      glslVersion: GLSL3,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        color: { value: new Color(0) },
        noise: { value: Noise() },
        resolution: { value: new Vector2() },
      },
      vertexShader:`${precision}\n${ BackgroundMaterial.vertexShader}`,
      fragmentShader: `${precision}\n${BackgroundMaterial.fragmentShader}`,
    });
  }
}

export class Background extends Mesh<
  BufferGeometry<NormalBufferAttributes>,
  BackgroundMaterial
> {
  private static readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private static readonly geometry = new BackgroundGeometry();

  constructor(precision: string) {
    super(
      Background.geometry,
      new BackgroundMaterial(precision)
    );
    this.matrixAutoUpdate = false;
    this.frustumCulled = false;
    this.updateMatrixWorld();
  }

  render(renderer: WebGLRenderer) {
    renderer.render(this, Background.camera);
  }

  setColor(color: ColorRepresentation) {
    const { material } = this;
    material.uniforms.color.value.set(color);
  }

  setSize(width: number, height: number) {
    const { material } = this;
    const noise = material.uniforms.noise.value.image;
    material.uniforms.resolution.value.set(width / noise.width, height / noise.height);
  }
}
