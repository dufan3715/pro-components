import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import VueRouter from 'vue-router/vite';

const require = createRequire(import.meta.url);
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

// monaco worker 文件的物理路径（pnpm 实体目录）
const monacoRoot = path.dirname(
  path.dirname(path.dirname(require.resolve('monaco-editor')))
);

/** monaco 说明符 → 包内绝对路径 */
const MONACO_WORKER_MAP: Record<string, string> = {
  'monaco-editor/esm/vs/editor/editor.worker': path.join(
    monacoRoot,
    'esm/vs/editor/editor.worker.js'
  ),
  'monaco-editor/esm/vs/language/typescript/ts.worker': path.join(
    monacoRoot,
    'esm/vs/language/typescript/ts.worker.js'
  ),
  // exports 形式说明符映射为物理路径：与包内相对 import 解析到同一 URL，
  // 保证 editor.api 单实例（language contribution 的注册副作用可见）
  'monaco-editor/editor/editor.api.js': path.join(
    monacoRoot,
    'esm/vs/editor/editor.api.js'
  ),
  'monaco-editor/language/typescript/monaco.contribution.js': path.join(
    monacoRoot,
    'esm/vs/language/typescript/monaco.contribution.js'
  ),
};

function monacoWorkerResolverPlugin(): Plugin {
  return {
    name: 'monaco-worker-resolver',
    enforce: 'pre',
    resolveId(source) {
      const mapped = MONACO_WORKER_MAP[source];
      if (mapped) {
        return mapped;
      }
      // ?worker 说明符：剥 query 后命中映射，返回 绝对路径 + 原 query
      const qIndex = source.indexOf('?');
      if (qIndex !== -1) {
        const bare = source.slice(0, qIndex);
        const query = source.slice(qIndex);
        const workerPath = MONACO_WORKER_MAP[bare];
        if (workerPath) {
          return workerPath + query;
        }
      }
    },
  };
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
  plugins: [
    VueRouter({
      routesFolder: 'src/views',
      dts: 'src/typed-router.d.ts',
    }),
    vue(),
    monacoWorkerResolverPlugin(),
    legacyCoreResolverPlugin(),
  ],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: [
      // 预构建会拆分多 chunk 导致 contribution 与 api 各持一份实例，按源码直服保证单例
      'monaco-editor/editor/editor.api.js',
      'monaco-editor/language/typescript/monaco.contribution.js',
      'monaco-editor/language/typescript/ts.worker.js',
      'monaco-editor/editor/editor.worker.js',
    ],
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
