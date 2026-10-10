import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 每个用例前自动还原 vi.spyOn 创建的替身，避免跨用例泄漏
    restoreMocks: true,
    environment: 'happy-dom',
    include: ['__tests__/**/*.spec.ts'],
  },
});
