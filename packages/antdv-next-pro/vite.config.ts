import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import dts from 'vite-plugin-dts';

const entry = path.resolve(__dirname, 'src/index.ts');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), dts({ compilerOptions: { declarationMap: true } })],
  build: {
    target: 'modules',
    outDir: 'es',
    minify: false,
    sourcemap: true,
    lib: {
      entry,
      formats: ['es'],
    },
    rollupOptions: {
      // Externalize dependencies
      external: [
        'vue',
        'antdv-next',
        /^antdv-next\/.*/,
        '@qin-ui/pro-components-core',
      ],
      output: {
        format: 'es',
        dir: 'es',
        entryFileNames: '[name].js',
        intro: chunk => {
          if (chunk.name === 'index') {
            return `import "./antdv-next-pro.css";`;
          }
          return '';
        },
        globals: {
          vue: 'Vue',
          'antdv-next': 'AntdvNext',
        },
      },
    },
  },
});
