import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), dts({ rollupTypes: true })],
  build: {
    target: 'modules',
    outDir: 'es',
    minify: false,
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['naive-ui', 'vue'],
      output: {
        dir: 'es',
        inlineDynamicImports: true,
        intro: 'import "./style.css";',
      },
    },
  },
});
