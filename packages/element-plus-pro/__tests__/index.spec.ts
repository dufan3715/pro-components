import { describe, it, expect, vi } from 'vitest';
import * as ElementPlusPro from '../src';
import * as FormBarrel from '../src/components/form';
import * as TableBarrel from '../src/components/table';
import * as ProviderBarrel from '../src/components/component-provider';
import * as LocaleBarrel from '../src/locale';

describe('SX: 公共导出冒烟测试', () => {
  // ----------------------------------------------------
  // SX-01 [判别]: 顶层导出键集合完整，四个 barrel 再导出与 default.install 生效
  // ----------------------------------------------------
  it('SX-01 [判别]: 顶层导出键集合与四个 barrel 再导出一致，且 default.install 注册三组件', () => {
    // 判别点 1：导出面精确锁定（缺失/新增任一名字即转红）
    expect(Object.keys(ElementPlusPro).sort()).toEqual([
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
    ]);

    // 判别点 2：四个 barrel 的具名导出逐个可从顶层取得，组件默认导出与顶层同名导出同引用
    const barrels = [FormBarrel, TableBarrel, ProviderBarrel, LocaleBarrel];
    const barrelKeys = [
      ...new Set(barrels.flatMap(barrel => Object.keys(barrel))),
    ].filter(key => key !== 'default');
    expect(barrelKeys.length).toBeGreaterThan(0);
    for (const key of barrelKeys) {
      expect(Object.keys(ElementPlusPro)).toContain(key);
    }
    expect((ElementPlusPro as any).ProForm).toBe((FormBarrel as any).default);
    expect((ElementPlusPro as any).ProTable).toBe((TableBarrel as any).default);
    expect((ElementPlusPro as any).ProComponentProvider).toBe(
      (ProviderBarrel as any).default
    );
    expect((ElementPlusPro as any).useTable).toBe(
      (TableBarrel as any).useTable
    );
    expect((ElementPlusPro as any).useLocale).toBe(
      (LocaleBarrel as any).useLocale
    );
    expect((ElementPlusPro as any).LOCALE_INJECT_KEY).toBe(
      (LocaleBarrel as any).LOCALE_INJECT_KEY
    );

    // 判别点 3：default.install 以组件名注册三个顶层组件
    const app = { component: vi.fn() };
    (ElementPlusPro.default as any).install(app);
    expect(app.component).toHaveBeenCalledTimes(3);
    expect(app.component.mock.calls.map(call => call[0])).toEqual([
      'ProForm',
      'ProTable',
      'ProComponentProvider',
    ]);
    expect(app.component.mock.calls.map(call => call[1])).toEqual([
      (ElementPlusPro as any).ProForm,
      (ElementPlusPro as any).ProTable,
      (ElementPlusPro as any).ProComponentProvider,
    ]);

    // 废弃/移除的 lodash 路径操作方法不应导出
    for (const key of ['get', 'set', 'toPath']) {
      expect(Object.keys(ElementPlusPro)).not.toContain(key);
    }
  });

  it('SX-02 [判别]: 表格 Hook 由 hooks 桶导出，表格模块导出面与同构包一致', async () => {
    // 运行时面契约：表格模块仅导出 useTable 与默认组件
    const tableModule: any = await import('../src/components/table');
    expect(Object.keys(tableModule).sort()).toEqual(['default', 'useTable']);
    expect(typeof tableModule.useTable).toBe('function');

    // 运行时面契约：hooks 桶导出 useTable
    const hooksModule: any = await import('../src/components/table/hooks');
    expect(typeof hooksModule.useTable).toBe('function');

    // 类型面契约：Table 与宿主 emits 类型仍从对应入口可用
    /* eslint-disable @typescript-eslint/consistent-type-imports */
    type _HookTableFace = import('../src/components/table/hooks').Table;
    type _TableEmitsFace = import('../src/components/table').TableEmits<any>;
    /* eslint-enable @typescript-eslint/consistent-type-imports */
    expect(typeof tableModule.useTable).toBe(typeof hooksModule.useTable);
  });
  // ----------------------------------------------------
  // SX-03 [判别]: 公开类型导出面
  // ----------------------------------------------------
  it('SX-03 [判别]: 文档承诺的公开类型可从包根导入', () => {
    /* eslint-disable @typescript-eslint/consistent-type-imports */
    type _ColumnControlConfigFace = import('../src').ColumnControlConfig;
    type _ColumnScopeFace = import('../src').ColumnScope;
    type _ValueFormatterFace = import('../src').ValueFormatter;
    type _PageParamFace = import('../src').PageParam;
    /* eslint-enable @typescript-eslint/consistent-type-imports */
    expect(true).toBe(true);
  });
});
