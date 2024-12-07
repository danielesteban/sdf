import { loadFFmpeg } from 'core/Video';

export const animationDuration = $state({
  value: Math.PI * 4,
});

export const backgroundColor = $state({
  value: '#FFDBAC',
});

export const CPUCode = $state({
  value: `camera.position.set(0, 0, 10);
`
});

export const GPUCode = $state({
  value: /* glsl */`SDF map(const in vec3 p) {
  vec3 q = p;
  q.x = abs(q.x) - 2.7;
  vec3 o = q - vec3(0.0, sin(time) * -2.5 * (p.x > 0.0 ? 1.0 : -1.0), 0.0);
  o *= rotateY(sin(time) * PI);
  float d = (
    sin(o.x * 10.0) * sin(o.y * 10.0) * sin(o.z * 10.0) * 0.05
  ) + (
    sin(o.x * 2.0) * sin(o.y * 2.0) * sin(o.z * 2.0) * max(sin(time * 2.0), 0.0) * 0.5
  );
  SDF scene = SDF(
    sdRoundedBox(o, vec3(1.0, 2.5, 1.0), 0.5) + d,
    vec3(1.0, 0.39, 0.11),
    0.0,
    0.1
  );
  o = q - vec3(0.0, sin(time) * 2.5 * (p.x > 0.0 ? 1.0 : -1.0), 0.0);
  d = sin(o.y * 10.0) * sin(time) * 0.05;
  scene = opSmoothUnion(
    scene,
    SDF(
      sdSphere(o, 2.0) + d,
      vec3(0.15, 0.78, 0.86),
      0.9,
      0.1
    ),
    2.5
  );
  return scene;
}
`
});

export const GPUErrors = $state<{ value: { line?: number; message: string }[] }>({
  value: [],
});

export const ffmpegIsLoaded = $state({
  value: false,
});

export const viewportSize = $state({
  value: {
    width: 1080,
    height: 1080,
  },
});

loadFFmpeg().then(() => {
  ffmpegIsLoaded.value = true;
});
