import { copyFileSync, createReadStream, existsSync, mkdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { defineConfig } from 'vite';

const MODEL_FILES = ['model.json', 'group1-shard1of1.bin'];

function basicPitchModelAssets() {
  const sourceDir = resolve('node_modules/@spotify/basic-pitch/model');
  const outputDir = resolve('dist/basic-pitch-model');

  return {
    name: 'basic-pitch-model-assets',
    configureServer(server) {
      server.middlewares.use('/basic-pitch-model', (request, response, next) => {
        const name = String(request.url || '/').replace(/^\/+/, '').split(/[?#]/)[0];
        if (!MODEL_FILES.includes(name)) return next();
        const source = resolve(sourceDir, name);
        if (!existsSync(source)) return next();
        response.setHeader('Content-Type', extname(name) === '.json' ? 'application/json' : 'application/octet-stream');
        response.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        createReadStream(source).pipe(response);
      });
    },
    closeBundle() {
      mkdirSync(outputDir, { recursive: true });
      for (const name of MODEL_FILES) copyFileSync(resolve(sourceDir, name), resolve(outputDir, name));
    },
  };
}

export default defineConfig({
  // Keep built asset URLs relative so the same bundle works on
  // GitHub Pages project paths, preview hosts, and local static servers.
  base: './',
  plugins: [basicPitchModelAssets()],
});
