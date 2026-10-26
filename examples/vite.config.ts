import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import VueRouter from 'vue-router/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const legacyCoreEntry = path.resolve(
  __dirname,
  'node_modules/legacy-pro-components-core/es/index.js'
);

/** 判断 importer 是否来自 legacy 包或其 pnpm 实体目录 */
function isLegacyImporter(importer?: string): boolean {
  if (!importer) return false;
  return (
    importer.includes('legacy-') ||
    /@qin-ui\+(antd-vue-pro|antdv-next-pro|element-plus-pro|vant-pro)@\d/.test(
      importer
    )
  );
}

/** 将 legacy 适配层引用的 core 指向其同版本实体，避免混入工作区 core */
function legacyCoreResolverPlugin(): Plugin {
  return {
    name: 'legacy-core-resolver',
    enforce: 'pre',
    resolveId(source, importer) {
      if (
        source === '@qin-ui/pro-components-core' &&
        isLegacyImporter(importer)
      ) {
        return legacyCoreEntry;
      }
    },
  };
}

export default defineConfig({
  plugins: [
    VueRouter({
      routesFolder: 'src/views',
      dts: 'src/typed-router.d.ts',
    }),
    vue(),
    legacyCoreResolverPlugin(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'legacy-core-esbuild-resolver',
          setup(build) {
            build.onResolve(
              { filter: /^@qin-ui\/pro-components-core$/ },
              args => {
                if (isLegacyImporter(args.importer)) {
                  return { path: legacyCoreEntry };
                }
              }
            );
          },
        },
      ],
    },
  },
});
