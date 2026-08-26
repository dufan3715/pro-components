import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [{ find: /^ant-design-vue$/, replacement: 'ant-design-vue/es' }],
  },
  test: {
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
