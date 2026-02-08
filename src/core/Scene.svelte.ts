import { type editor } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { loadFFmpeg } from 'core/Video';
import * as Environments from 'textures/Environments';

const defaultScene = {
  CPUCode: /* js */`spherical.phi = Math.PI * 0.5;
spherical.theta = Math.PI * 0.5 + Math.sin(time) * Math.PI * 0.5;
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
  d = (
    sin(o.y * 10.0) * sin(time) * 0.05
  ) + (
    simplex(o + (time > duration * 0.5 ? duration - time : time)) * 0.1
  );
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
  environment: 'Warehouse' as keyof typeof Environments,
  environmentIntensity: 0.5,
  viewportSize: { width: 1080, height: 1080 },
};

export type Errors = { line?: number; start?: number; end?: number; message: string }[];
export type File = {
  code: string;
  context: {
    model: editor.ITextModel;
    view: editor.ICodeEditorViewState;
  } | null;
  errors: Errors;
  hasModified: boolean;
  lang: string;
};

let CPUCode = $state(defaultScene.CPUCode);
let CPUErrors = $state<Errors>([]);
let CPUHasModified = $state(false);
export const CPU: File = {
  get code() { return CPUCode },
  set code(value) { CPUCode = value },
  context: null,
  get errors() { return CPUErrors },
  set errors(value) { CPUErrors = value },
  get hasModified() { return CPUHasModified },
  set hasModified(value) { CPUHasModified = value },
  lang: 'javascript',
};

let GPUCode = $state(defaultScene.GPUCode);
let GPUErrors = $state<Errors>([]);
let GPUHasModified = $state(false);
export const GPU: File = {
  get code() { return GPUCode },
  set code(value) { GPUCode = value },
  context: null,
  get errors() { return GPUErrors },
  set errors(value) { GPUErrors = value },
  get hasModified() { return GPUHasModified },
  set hasModified(value) { GPUHasModified = value },
  lang: 'glsl',
};

let animationDuration = $state(defaultScene.animationDuration);
let backgroundColor = $state(defaultScene.backgroundColor);
let environment = $state<keyof typeof Environments>(defaultScene.environment);
let environmentIntensity = $state(defaultScene.environmentIntensity);
let viewportScale = $state(0.5);
let viewportSize = $state(defaultScene.viewportSize);
export const Settings = {
  get animationDuration() { return animationDuration },
  set animationDuration(value) { animationDuration = value },
  get backgroundColor() { return backgroundColor },
  set backgroundColor(value) { backgroundColor = value },
  get environment() { return environment },
  set environment(value) { environment = value },
  get environmentIntensity() { return environmentIntensity },
  set environmentIntensity(value) { environmentIntensity = value },
  get viewportScale() { return viewportScale },
  set viewportScale(value) { viewportScale = value },
  get viewportSize() { return viewportSize },
  set viewportSize(value) { viewportSize = value },
};

let hasLoadedFFmpeg = $state(false);
let videoIsRendering = $state(false);
let videoRenderingController = $state<AbortController | null>(null);
let videoRenderingProgress = $state<{ stage: 'encode' | 'render'; progress: number }>({ stage: 'render', progress: 0 });
export const Video = {
  get hasLoadedFFmpeg() { return hasLoadedFFmpeg },
  get isRendering() { return videoIsRendering },
  set isRendering(value) { videoIsRendering = value },
  get renderingController() { return videoRenderingController },
  set renderingController(value) { videoRenderingController = value },
  get renderingProgress() { return videoRenderingProgress },
  set renderingProgress(value) { videoRenderingProgress = value },
};

const serializeScene = () => JSON.stringify({
  version: 1,
  CPUCode: CPU.code,
  GPUCode: GPU.code,
  animationDuration: animationDuration,
  backgroundColor: backgroundColor,
  environment: environment,
  environmentIntensity: environmentIntensity,
  viewportSize: viewportSize,
});

const deserializeScene = (json: string) => {
  let data;
  try {
    data = JSON.parse(json);
  } catch (e) {
    return;
  }
  CPU.code = data.CPUCode;
  CPU.context = null;
  CPU.errors = [];
  CPU.hasModified = false;
  GPU.code = data.GPUCode;
  GPU.context = null;
  GPU.errors = [];
  GPU.hasModified = false;
  animationDuration = data.animationDuration;
  backgroundColor = data.backgroundColor;
  environment = data.environment;
  environmentIntensity = data.environmentIntensity;
  viewportSize = data.viewportSize;
};

const serializeSettings = () => JSON.stringify({
  version: 1,
  viewportScale,
});

const deserializeSettings = (json: string) => {
  let data;
  try {
    data = JSON.parse(json);
  } catch (e) {
    return;
  }
  viewportScale = data.viewportScale;
};

const loadFile = (file: Blob) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => deserializeScene(reader.result as string));
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
  downloader.href = URL.createObjectURL(new Blob([serializeScene()], { type: 'application/json' }));
  downloader.download = 'scene.json';
  downloader.click();
};

export const reset = () => {
  confirm('Are you sure?') && deserializeScene(JSON.stringify(defaultScene));
};

const storedScene = localStorage.getItem('sdf:scene');
if (storedScene) {
  deserializeScene(storedScene);
}

const storedSettings = localStorage.getItem('sdf:settings');
if (storedSettings) {
  deserializeSettings(storedSettings);
}

window.addEventListener('beforeunload', (e) => {
  if (CPU.hasModified || GPU.hasModified) {
    e.preventDefault();
    return;
  }
  localStorage.setItem('sdf:scene', serializeScene());
  localStorage.setItem('sdf:settings', serializeSettings());
});

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
  hasLoadedFFmpeg = true;
});
