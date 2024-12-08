import { type editor } from 'monaco-editor/esm/vs/editor/editor.api';
import { loadFFmpeg } from 'core/Video';
import * as Environments from 'textures/Environments';

const defaultScene = {
  CPUCode: /* js */`spherical.phi = Math.PI * 0.5;
spherical.theta = Math.sin(time) * Math.PI * 0.5;
spherical.radius = 10;
camera.position.setFromSpherical(spherical);
camera.lookAt(0, 0, 0);
`,
  GPUCode: /* glsl */`SDF map(const in vec3 p) {
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
`,
  animationDuration: Math.PI * 4,
  backgroundColor: '#FFDBAC',
  environment: 'Sunset',
  environmentIntensity: 0.5,
  viewportSize: { width: 1080, height: 1080 },
};

export type Errors = { line?: number; start?: number; end?: number; message: string }[];
export type File = {
  code: { value: string };
  context: {
    model: editor.ITextModel;
    view: editor.ICodeEditorViewState;
  } | null;
  errors: { value: Errors };
  hasModified: { value: boolean };
  lang: string;
};

const CPUCode = $state({ value: defaultScene.CPUCode });
const CPUErrors = $state<{ value: Errors }>({ value: [] });
const CPUHasModified = $state({ value: false });
export const CPU: File = {
  code: CPUCode,
  context: null,
  errors: CPUErrors,
  hasModified: CPUHasModified,
  lang: 'javascript',
};

const GPUCode = $state({ value: defaultScene.GPUCode });
const GPUErrors = $state<{ value: Errors }>({ value: [] });
const GPUHasModified = $state({ value: false });
export const GPU: File = {
  code: GPUCode,
  context: null,
  errors: GPUErrors,
  hasModified: GPUHasModified,
  lang: 'glsl',
};

export const animationDuration = $state({
  value: defaultScene.animationDuration,
});

export const backgroundColor = $state({
  value: defaultScene.backgroundColor,
});

export const environment = $state<{ value: keyof typeof Environments }>({
  value: 'Sunset',
});

export const environmentIntensity = $state({
  value: defaultScene.environmentIntensity,
});

export const hasLoadedFFmpeg = $state({
  value: false,
});

export const isRenderingVideo = $state({
  value: false,
});

export const videoRenderingController = $state<{ value: AbortController | null }>({
  value: null,
});

export const videoRenderingProgress = $state<{ value: { stage: 'encode' | 'render'; progress: number } }>({
  value: { stage: 'render', progress: 0 },
});

export const viewportSize = $state({
  value: defaultScene.viewportSize,
});

const serialize = () => JSON.stringify({
  version: 1,
  CPUCode: CPU.code.value,
  GPUCode: GPU.code.value,
  animationDuration: animationDuration.value,
  backgroundColor: backgroundColor.value,
  environment: environment.value,
  environmentIntensity: environmentIntensity.value,
  viewportSize: viewportSize.value,
});

const deserialize = (json: string) => {
  let data;
  try {
    data = JSON.parse(json);
  } catch (e) {
    return;
  }
  CPU.code.value = data.CPUCode;
  CPU.context = null;
  CPU.errors.value = [];
  CPU.hasModified.value = false;
  GPU.code.value = data.GPUCode;
  GPU.context = null;
  GPU.errors.value = [];
  GPU.hasModified.value = false;
  animationDuration.value = data.animationDuration;
  backgroundColor.value = data.backgroundColor;
  environment.value = data.environment;
  environmentIntensity.value = data.environmentIntensity;
  viewportSize.value = data.viewportSize;
};

const loadFile = (file: Blob) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => deserialize(reader.result as string));
  reader.readAsText(file);
};

export const load = () => {
  const loader = document.createElement('input');
  loader.type = 'file';
  loader.accept = '.json';
  loader.addEventListener('change', () => {
    const file = loader.files?.[0];
    file && loadFile(file);
  });
  loader.click();
};

export const save = () => {
  const downloader = document.createElement('a');
  downloader.href = URL.createObjectURL(new Blob([serialize()], { type: 'application/json' }));
  downloader.download = 'scene.json';
  downloader.click();
};

export const reset = () => {
  confirm('Are you sure?') && deserialize(JSON.stringify(defaultScene));
};

export const store = () => {
  localStorage.setItem('sdf:scene', serialize());
};

const stored = localStorage.getItem('sdf:scene');
if (stored) {
  deserialize(stored);
}

document.addEventListener('dragenter', (e) => e.preventDefault());
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
  e.preventDefault();
  if (!e.dataTransfer) return;
  const [file] = e.dataTransfer.files;
  if (!file || file.type.indexOf('application/json') !== 0) {
    return;
  }
  loadFile(file);
});

loadFFmpeg().then(() => {
  hasLoadedFFmpeg.value = true;
});
