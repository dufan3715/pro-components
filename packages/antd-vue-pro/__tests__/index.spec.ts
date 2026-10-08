import { describe, it, expect, vi } from 'vitest';
import * as AntdVuePro from '../src';

/*
 * 公共导出键集合（对照 src/index.ts：三个组件 + locale barrel + 表单/表格 barrel 再导出 + default）
 * 集合断言同时锁定「该有的都有」与「废弃 lodash 路径方法（get / set / toPath）不得回流」
 */
const EXPECTED_EXPORT_KEYS = [
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
];

describe('SX: 公共导出冒烟测试', () => {
  // ----------------------------------------------------
  // SX-01 [判别]: 导出键集合与 src/index.ts 实际导出一致
  // ----------------------------------------------------
  it('SX-01 [判别]: 公共导出键集合与 src/index.ts 一致，废弃 API 不导出', () => {
    expect(Object.keys(AntdVuePro).sort()).toEqual(EXPECTED_EXPORT_KEYS);

    // barrel 再导出的组件与 hooks 可调用面
    expect(AntdVuePro.ProForm.name).toBe('ProForm');
    expect(AntdVuePro.ProTable.name).toBe('ProTable');
    expect(AntdVuePro.useForm).toBeTypeOf('function');
    expect(AntdVuePro.useTable).toBeTypeOf('function');
    expect(AntdVuePro.useLocale).toBeTypeOf('function');
    expect(AntdVuePro.useFields).toBeTypeOf('function');
    expect(AntdVuePro.useFormData).toBeTypeOf('function');
    expect(AntdVuePro.useFormRef).toBeTypeOf('function');

    // 废弃/移除的 lodash 路径操作方法不应导出
    expect((AntdVuePro as any).get).toBeUndefined();
    expect((AntdVuePro as any).set).toBeUndefined();
    expect((AntdVuePro as any).toPath).toBeUndefined();
  });

  // ----------------------------------------------------
  // SX-02 [判别]: default.install 注册三个组件到 app
  // ----------------------------------------------------
  it('SX-02 [判别]: default.install 将三个组件按 name 注册到应用实例', () => {
    const component = vi.fn();
    (AntdVuePro.default as any).install({ component } as any);

    expect(component).toHaveBeenCalledTimes(3);
    expect(component.mock.calls.map(call => call[0])).toEqual([
      'ProForm',
      'ProTable',
      'ProComponentProvider',
    ]);
    expect(component.mock.calls.map(call => call[1])).toEqual([
      AntdVuePro.ProForm,
      AntdVuePro.ProTable,
      AntdVuePro.ProComponentProvider,
    ]);
  });
});
