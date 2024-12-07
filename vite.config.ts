import fs from 'fs';
import path from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  esbuild: mode === 'production' ? {
    drop: ['console', 'debugger'],
    legalComments: 'none',
  } : {},
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  plugins: [
    svelte(),
    {
      name: 'shaders',
      transform(code, id) {
        if (/\.(frag|glsl|vert)$/g.test(id)) {
          return {
            code: `export default ${JSON.stringify(code)};`,
            map: null,
          };
        }
      },
    }
  ],
  resolve: {
    alias: fs.readdirSync(path.join(__dirname, 'src'), { withFileTypes: true })
      .filter((f) => f.isDirectory())
      .map(({ name }) => (
        { find: name, replacement: path.join(__dirname, 'src', name) }
      )),
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    port: 8080,
  },
}));
