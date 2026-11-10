import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  root: fileURLToPath(new URL('..', import.meta.url)),
  plugins: [vue()],
  resolve: {
    alias: {
      '@qin-ui/pro-components-core': fileURLToPath(
        new URL('../../packages/core/src/index.ts', import.meta.url)
      ),
    },
  },
  optimizeDeps: {
    entries: ['e2e/fixtures/search-form-lab.html'],
  },
});
