import { describe, it, expect } from 'vitest';
import * as AntdvNextPro from '../src/index';
import * as FormBarrel from '../src/components/form';
import * as TableBarrel from '../src/components/table';
import * as ProviderBarrel from '../src/components/component-provider';
import * as LocaleBarrel from '../src/locale';

describe('Public API Export Smoke Test (SX-01)', () => {
  it('SX-01 [判别]: 导出键集合与 src/index.ts 声明一致，barrel 再导出恒等且 default.install 注册三组件', () => {
    // 1. 导出键集合 = 三个组件 barrel + locale barrel 的全部再导出 + 三个显式组件 + default
    const barrelKeys = [
      ...Object.keys(FormBarrel),
      ...Object.keys(TableBarrel),
      ...Object.keys(ProviderBarrel),
      ...Object.keys(LocaleBarrel),
      'ProForm',
      'ProTable',
      'ProComponentProvider',
      'default',
    ];
    const expectedKeys = [...new Set(barrelKeys)].sort();
    expect(Object.keys(AntdvNextPro).sort()).toEqual(expectedKeys);

    // 2. 名单锁定：任一导出被移除或新增即失败
    expect(expectedKeys).toEqual(
      [
        'ContainerFragment',
        'LOCALE_INJECT_KEY',
        'ProComponentProvider',
        'ProForm',
        'ProTable',
        'SlotComponent',
        'default',
        'enUS',
        'useFields',
        'useForm',
        'useFormData',
        'useFormRef',
        'useLocale',
        'useTable',
        'zhCN',
        'zhTW',
      ].sort()
    );

    // 3. barrel 再导出恒等：三个组件与 Hooks 均非复制体
    expect(AntdvNextPro.ProForm).toBe(FormBarrel.default);
    expect(AntdvNextPro.ProTable).toBe(TableBarrel.default);
    expect(AntdvNextPro.ProComponentProvider).toBe(ProviderBarrel.default);
    expect(AntdvNextPro.useForm).toBe(FormBarrel.useForm);
    expect(AntdvNextPro.useFields).toBe(FormBarrel.useFields);
    expect(AntdvNextPro.useFormData).toBe(FormBarrel.useFormData);
    expect(AntdvNextPro.useFormRef).toBe(FormBarrel.useFormRef);
    expect(AntdvNextPro.useTable).toBe(TableBarrel.useTable);
    expect(AntdvNextPro.useLocale).toBe(LocaleBarrel.useLocale);
    expect(AntdvNextPro.LOCALE_INJECT_KEY).toBe(LocaleBarrel.LOCALE_INJECT_KEY);

    // 4. default.install 按组件名注册三个组件
    const registered: Record<string, any> = {};
    const fakeApp = {
      component: (name: string, component: any) => {
        registered[name] = component;
      },
    };
    AntdvNextPro.default.install(fakeApp as any);
    expect(Object.keys(registered).sort()).toEqual([
      'ProComponentProvider',
      'ProForm',
      'ProTable',
    ]);
    expect(registered.ProForm).toBe(AntdvNextPro.ProForm);
    expect(registered.ProTable).toBe(AntdvNextPro.ProTable);
    expect(registered.ProComponentProvider).toBe(
      AntdvNextPro.ProComponentProvider
    );

    // 5. 反向断言：已下沉 core 或私有内部常量绝对不能由 antdv-next-pro 重新导出
    expect((AntdvNextPro as any).INJECT_CONFIG).toBeUndefined();
    expect((AntdvNextPro as any).get).toBeUndefined();
    expect((AntdvNextPro as any).set).toBeUndefined();
    expect((AntdvNextPro as any).toPath).toBeUndefined();
    expect((AntdvNextPro as any).toPathSegments).toBeUndefined();
  });

  it('SX-02 [判别]: 表格模块导出面与同构包对齐，不额外导出 PageParam', async () => {
    // 类型面契约：PageParam 不再由表格 Hook 模块与表格模块导出
    /* eslint-disable @typescript-eslint/consistent-type-imports */
    // @ts-expect-error PageParam 已从表格 Hook 模块导出面移除
    type _HookPageParamFace = import('../src/components/table/hooks').PageParam;
    // @ts-expect-error PageParam 不属于表格模块导出面
    type _PageParamFace = import('../src/components/table').PageParam;
    /* eslint-enable @typescript-eslint/consistent-type-imports */

    // 运行时面契约：表格模块仅导出 useTable 与默认组件
    const tableModule: any = await import('../src/components/table');
    expect(Object.keys(tableModule).sort()).toEqual(['default', 'useTable']);
    expect(typeof tableModule.useTable).toBe('function');
    expect(typeof tableModule.default).toBe('object');
  });
});
