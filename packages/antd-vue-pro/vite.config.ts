import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import dts from 'vite-plugin-dts';
import fs from 'fs';

const entry = path.resolve(__dirname, 'src/index.ts');
const componentsDir = 'src/components';
const componentsName = fs
  .readdirSync(path.resolve(componentsDir))
  .filter(name =>
    fs.lstatSync(path.resolve(`${componentsDir}/${name}`)).isDirectory()
  );

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      rollupTypes: false,
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
    },
    rollupOptions: {
      external: [
        'vue',
        'ant-design-vue',
        /^ant-design-vue\/.*/,
        '@qin-ui/pro-components-core',
      ],
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
            return `import "./antd-vue-pro.css";`;
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

          for (const name of componentsName) {
            if (id.includes(`${componentsDir}/${name}`)) {
              return `${name}/index`;
            }
          }
          return null;
        },
        globals: {
          vue: 'Vue',
          'ant-design-vue': 'AntDesignVue',
        },
      },
    },
  },
});
