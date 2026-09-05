import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const legacyCoreEntry = path.resolve(
  __dirname,
  'node_modules/legacy-pro-components-core/es/index.js'
);

function isLegacyImporter(importer?: string): boolean {
  if (!importer) return false;
  return (
    importer.includes('legacy-') ||
    /@qin-ui\+(antd-vue-pro|antdv-next-pro|element-plus-pro|vant-pro)@\d/.test(
      importer
    )
  );
}

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

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), legacyCoreResolverPlugin()],
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
