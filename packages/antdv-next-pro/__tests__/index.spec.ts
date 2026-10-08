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

  it('SX-02 [判别]: 表格模块导出面与同构包对齐，不额外导出 PageParam', async () => {
    // 类型面契约：PageParam 不再由表格 Hook 模块与表格模块导出
    // @ts-expect-error PageParam 已从表格 Hook 模块导出面移除
    type _HookPageParamFace = import('../src/components/table/hooks').PageParam;
    // @ts-expect-error PageParam 不属于表格模块导出面
    type _PageParamFace = import('../src/components/table').PageParam;

    // 运行时面契约：表格模块仅导出 useTable 与默认组件
    const tableModule: any = await import('../src/components/table');
    expect(Object.keys(tableModule).sort()).toEqual(['default', 'useTable']);
    expect(typeof tableModule.useTable).toBe('function');
    expect(typeof tableModule.default).toBe('object');
  });
});
