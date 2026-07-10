import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

const entry = path.resolve(__dirname, 'src/index.ts');

export default defineConfig({
  plugins: [dts({ compilerOptions: { declarationMap: true } })],
  build: {
    target: 'modules',
    outDir: 'es',
    minify: false,
    sourcemap: true,
    lib: {
      entry,
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // lodash-es 不作为 external，直接打包进产物，避免消费者需额外安装
      external: ['vue'],
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
