import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import dts from 'vite-plugin-dts';
import fs from 'fs';

const entry = path.resolve(__dirname, 'src/index.ts');
const componentsDir = 'src/components';

const getComponentsName = () => {
  try {
    const fullPath = path.resolve(__dirname, componentsDir);
    if (!fs.existsSync(fullPath)) return [];
    return fs
      .readdirSync(fullPath)
      .filter(name =>
        fs.lstatSync(path.resolve(`${componentsDir}/${name}`)).isDirectory()
      );
  } catch {
    return [];
  }
};

const componentsName = getComponentsName();

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
      external: ['vue', 'element-plus', /^element-plus\/.*/],
      input: {
        index: entry,
        ...Object.fromEntries(
          componentsName.map(name => [
            `${name}/index`,
            `${componentsDir}/${name}/index.ts`,
          ])
        ),
      },
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
          if (componentsName.length > 0) {
            for (const name of componentsName) {
              if (id.includes(`${componentsDir}/${name}`)) {
                return `${name}/index`;
              }
            }
          }
          return null;
        },
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
        },
      },
    },
  },
});
