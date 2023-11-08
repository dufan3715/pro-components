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
    vue({
      script: {
        defineModel: true,
        propsDestructure: true,
      },
    }),
    dts({ rollupTypes: true }),
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
      external: ['ant-design-vue', 'vue'],
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
            return `import "./style.css";`;
          }
          return '';
        },
        manualChunks: id => {
          // eslint-disable-next-line no-restricted-syntax
          for (const name of componentsName) {
            if (id.includes(`${componentsDir}/${name}`)) {
              return `${name}/index`;
            }
          }
          return null;
        },
      },
    },
  },
});
