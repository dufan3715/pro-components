import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import dts from 'vite-plugin-dts';
import fs from 'fs';

const entry = path.resolve(__dirname, 'src/index.ts');
const componentsDir = 'src/components';
// 如果 components 目录还不存在，这里需要防御性处理
const getComponents = () => {
  try {
    return fs
      .readdirSync(path.resolve(__dirname, componentsDir))
      .filter(name =>
        fs
          .lstatSync(path.resolve(__dirname, `${componentsDir}/${name}`))
          .isDirectory()
      );
  } catch (e) {
    console.log('e: ', e);
    return [];
  }
};

const componentsName = getComponents();

export default defineConfig({
  plugins: [
    vue(),
    dts({ rollupTypes: true, bundledPackages: ['@qin-ui/core'] }),
  ],
  build: {
    target: 'modules',
    outDir: 'es',
    minify: false,
    lib: {
      entry,
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'vant', /^vant\/.*/],
      input: {
        index: entry,
        ...Object.fromEntries(
          componentsName.map(name => [
            `${name}/index`,
            path.resolve(__dirname, `${componentsDir}/${name}/index.ts`),
          ])
        ),
      },
      output: {
        format: 'es',
        dir: 'es',
        entryFileNames: '[name].js',
        // intro: chunk => {
        //   if (chunk.name === 'index') {
        //     return `import "./vant-pro.css";`;
        //   }
        //   return '';
        // },
        manualChunks: id => {
          if (id.includes('node_modules')) {
            if (id.includes('lodash-es')) {
              return 'vendor/utils/lodash-es';
            }
            return 'vendor';
          }
          if (id.includes('packages/core') || id.includes('@qin-ui/core')) {
            return 'core/index';
          }
          for (const name of componentsName) {
            if (id.includes(`${componentsDir}/${name}`)) {
              return `${name}/index`;
            }
          }
          return null;
        },
        globals: {
          vue: 'Vue',
          vant: 'vant',
        },
      },
    },
  },
});
