import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

export const loadFFmpeg = async () => {
  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
  });
};

export const encodeVideo = async (
  controller: AbortController,
  duration: number,
  fps: number,
  render: (time: number) => string,
  onprogress: (stage: 'encode' | 'render', progress: number) => void
) => {
  const frames = Math.floor(duration * fps);
  for (let frame = 0; frame < frames; frame++) {
    onprogress('render', frame / frames);
    await ffmpeg.writeFile(`${String(frame).padStart(5, '0')}.png`, await fetchFile(render(frame / fps)));
    if (controller.signal.aborted) {
      const error = new Error();
      error.name = 'AbortError';
      throw error;
    }
  }
  onprogress('render', 1);
  const ffmpegProgress = ({ progress }: { progress: number; }) => onprogress('encode', progress);
  ffmpeg.on('progress', ffmpegProgress);
  await ffmpeg.exec([
    '-framerate',
    String(fps),
    '-pattern_type',
    'glob',
    '-i',
    '*.png',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-preset',
    'slow',
    '-crf',
    String(5),
    'out.mp4',
  ], undefined, { signal: controller.signal });
  ffmpeg.off('progress', ffmpegProgress);
  onprogress('encode', 1);
  const data = await ffmpeg.readFile('out.mp4');
  const blob = new Blob([(data as any).buffer], { type: 'video/mp4' });
  for (let frame = 0; frame < frames; frame++) {
    await ffmpeg.deleteFile(`${String(frame).padStart(5, '0')}.png`);
  }
  await ffmpeg.deleteFile('out.mp4');
  return blob;
};
