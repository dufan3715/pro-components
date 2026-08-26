import { describe, it, expect } from 'vitest';
import * as AntdvNextPro from '../src/index';

describe('Public API Export Smoke Test (SX-01)', () => {
  it('SX-01: 完整导出核心组件、Hooks 与工具函数，反向断言已下沉 Core 的私有工具不得重新导出', () => {
    // 1. 核心组件
    expect(AntdvNextPro.ProForm).toBeDefined();
    expect(AntdvNextPro.ProTable).toBeDefined();
    expect(AntdvNextPro.ProComponentProvider).toBeDefined();

    // 2. 表单与表格 Hooks
    expect(AntdvNextPro.useForm).toBeDefined();
    expect(AntdvNextPro.useTable).toBeDefined();
    expect(AntdvNextPro.useFields).toBeDefined();
    expect(AntdvNextPro.useLocale).toBeDefined();

    // 3. 国际化与 Provider 常量
    expect(AntdvNextPro.LOCALE_INJECT_KEY).toBeDefined();

    // 4. 反向断言：已下沉 core 或私有内部常量绝对不能由 antdv-next-pro 重新导出
    expect((AntdvNextPro as any).INJECT_CONFIG).toBeUndefined();
    expect((AntdvNextPro as any).get).toBeUndefined();
    expect((AntdvNextPro as any).set).toBeUndefined();
    expect((AntdvNextPro as any).toPath).toBeUndefined();
    expect((AntdvNextPro as any).toPathSegments).toBeUndefined();
  });
});
