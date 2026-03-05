import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

const entry = path.resolve(__dirname, 'src/index.ts');

export default defineConfig({
  plugins: [dts({ rollupTypes: true })],
  build: {
    target: 'modules',
    outDir: 'es',
    minify: false,
    lib: {
      entry,
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['vue', 'lodash-es'],
      output: {
        format: 'es',
        dir: 'es',
        entryFileNames: '[name].js',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
});
