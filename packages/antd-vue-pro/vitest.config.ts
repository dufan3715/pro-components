import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^@qin-ui\/pro-components-core$/,
        replacement: fileURLToPath(
          new URL('../core/src/index.ts', import.meta.url)
        ),
      },
      { find: /^ant-design-vue$/, replacement: 'ant-design-vue/es' },
    ],
  },
  test: {
    // 每个用例前自动还原 vi.spyOn 创建的替身，避免跨用例泄漏
    restoreMocks: true,
    environment: 'happy-dom',
    setupFiles: ['__tests__/setup.ts'],
    include: ['__tests__/**/*.spec.ts'],
    // 组件测试涉及真实 antd 渲染，超时放宽
    testTimeout: 10000,
    hookTimeout: 10000,
    server: {
      deps: {
        inline: [/ant-design-vue/, /dayjs/],
      },
    },
  },
});
