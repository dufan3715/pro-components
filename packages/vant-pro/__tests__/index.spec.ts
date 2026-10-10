import { describe, it, expect } from 'vitest';
import { createApp } from 'vue';
import Entry, {
  ProForm,
  ProComponentProvider,
  useForm,
  useFormPopup,
  useLocale,
} from '../src/index';

describe('入口导出测试 (vant-pro)', () => {
  it('EXP-01: 正确导出所有组件、Hooks 与安装插件', () => {
    expect(ProForm).toBeDefined();
    expect(ProComponentProvider).toBeDefined();
    expect(useForm).toBeDefined();
    expect(useFormPopup).toBeDefined();
    expect(useLocale).toBeDefined();
    expect(Entry.install).toBeTypeOf('function');
  });

  // ----------------------------------------------------
  // VP-F19 [判别]: Provider 无静态 name 时以兜底名注册
  // ----------------------------------------------------
  it('VP-F19 [判别]: install() 在 Provider 无静态 name 时以兜底名注册组件', () => {
    const app = createApp({ render: () => null });
    const nameDescriptor = Object.getOwnPropertyDescriptor(
      ProComponentProvider,
      'name'
    );
    Object.defineProperty(ProComponentProvider, 'name', {
      value: undefined,
      configurable: true,
    });
    try {
      app.use(Entry);
      // 判别点：以兜底名注册（旧实现传 undefined，注册键为字符串 "undefined"）
      expect(app.component('ProComponentProvider')).toBe(ProComponentProvider);
    } finally {
      if (nameDescriptor) {
        Object.defineProperty(ProComponentProvider, 'name', nameDescriptor);
      }
    }
  });
});
