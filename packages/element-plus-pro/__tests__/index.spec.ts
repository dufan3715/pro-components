import { describe, it, expect } from 'vitest';
import * as ElementPlusPro from '../src';

describe('SX: 公共导出冒烟测试', () => {
  it('SX-01: 核心组件与 API 必须齐全，且废弃 API 不应存在', () => {
    // 顶层核心组件导出
    expect(ElementPlusPro.ProForm).toBeDefined();
    expect(ElementPlusPro.ProTable).toBeDefined();
    expect(ElementPlusPro.ProComponentProvider).toBeDefined();

    // 核心 Hooks 导出
    expect(ElementPlusPro.useForm).toBeDefined();
    expect(ElementPlusPro.useTable).toBeDefined();
    expect(ElementPlusPro.useLocale).toBeDefined();

    // 废弃/移除的 lodash 路径操作方法不应导出
    expect((ElementPlusPro as any).get).toBeUndefined();
    expect((ElementPlusPro as any).set).toBeUndefined();
    expect((ElementPlusPro as any).toPath).toBeUndefined();
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
});
