import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['__tests__/setup.ts'],
    include: ['__tests__/**/*.spec.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    server: {
      deps: {
        inline: [/element-plus/, /@element-plus/, /dayjs/],
      },
    },
  },
});
