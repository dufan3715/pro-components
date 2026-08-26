import { describe, it, expect } from 'vitest';
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
});
