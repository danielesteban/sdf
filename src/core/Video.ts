import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

export const loadFFmpeg = async () => {
  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm';
  ffmpeg.on('log', ({ message }) => {
    console.log(message);
  });
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
  });
};

export const encodeVideo = async (
  duration: number,
  fps: number,
  render: (time: number) => string
) => {
  const frames = duration * fps;
  for (let frame = 0; frame < frames; frame++) {
    await ffmpeg.writeFile(`${String(frame).padStart(5, '0')}.png`, await fetchFile(render(duration / frames * frame)));
  }
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
  ]);
  const data = await ffmpeg.readFile('out.mp4');
  const blob = new Blob([(data as any).buffer], { type: 'video/mp4' });
  for (let frame = 0; frame < frames; frame++) {
    await ffmpeg.deleteFile(`${String(frame).padStart(5, '0')}.png`);
  }
  await ffmpeg.deleteFile('out.mp4');
  return blob;
};
