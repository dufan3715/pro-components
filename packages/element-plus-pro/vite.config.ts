import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import dts from 'vite-plugin-dts';

const entry = path.resolve(__dirname, 'src/index.ts');

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      include: ['src'],
      compilerOptions: { declarationMap: true },
    }),
  ],
  build: {
    target: 'modules',
    outDir: 'es',
    minify: false,
    sourcemap: true,
    lib: {
      entry,
      formats: ['es'],
      // 固定样式产物文件名：默认由 package.json 的 name 推导，改包名会让下方 intro 的引入路径失效
      cssFileName: 'element-plus-pro',
    },
    rollupOptions: {
      external: [
        'vue',
        'element-plus',
        /^element-plus\/.*/,
        '@element-plus/icons-vue',
        '@qin-ui/pro-components-core',
      ],
      output: {
        format: 'es',
        dir: 'es',
        entryFileNames: '[name].js',
        intro: chunk => {
          if (chunk.name === 'index') {
            return 'import "./element-plus-pro.css";';
          }
          return '';
        },
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
        },
      },
    },
  },
});
