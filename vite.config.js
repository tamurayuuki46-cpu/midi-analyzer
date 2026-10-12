import { defineConfig } from 'vite';

export default defineConfig({
  // Keep built asset URLs relative so the same bundle works on
  // GitHub Pages project paths, preview hosts, and local static servers.
  base: './',
});
