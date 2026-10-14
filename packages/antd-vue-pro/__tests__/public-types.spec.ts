/**
 * 公开类型面冒烟回归 —— 锁定 17 个包根类型导出可用
 *
 * @description 类型名一旦从 barrel 漏出，消费方引用即报 TS2305；
 * 本文件在 `vue-tsc --noEmit`（tsconfig include 覆盖 `__tests__`）下校验类型可解析与关键形状。
 */
import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  Column,
  Columns,
  ComponentMap,
  ComponentName,
  ComponentVars,
  Field,
  Fields,
  Form,
  ProFormInstance,
  ProFormItemInstance,
  ProFormItemProps,
  ProFormProps,
  ProLocale,
  ProTableInstance,
  ProTableProps,
  Table,
  UseFields,
} from '../src';

type User = { name: string; age: number; address: { city: string } };

describe('公开类型面冒烟 · antd-vue-pro', () => {
  // ----------------------------------------------------
  // SX-06 [判别]: 17 个包根类型导出可解析且关键形状成立
  // ----------------------------------------------------
  it('SX-06 [判别]: 包根类型导出可解析，字段/列类型按泛型推导', () => {
    // 字段与列：泛型可推导
    const field: Field = { path: 'name', label: '姓名', component: 'input' };
    const fields: Fields = [field];
    const columns: Columns<User> = [
      { dataIndex: 'name', title: '姓名' },
      { dataIndex: 'address.city', title: '城市' },
    ];
    const column: Column<User> = columns[0];
    expect(fields).toHaveLength(1);
    expect(column.title).toBe('姓名');

    // 列 hidden 支持布尔 / Ref / ComputedRef（类型面口径）
    const hiddenColumn: Column<User> = { dataIndex: 'age', hidden: false };
    expect(hiddenColumn.hidden).toBe(false);

    // 组件 props / 实例类型：形状可断言
    expectTypeOf<ProFormProps>().toHaveProperty('form');
    expectTypeOf<ProTableProps>().toHaveProperty('table');
    expectTypeOf<ProFormInstance>().not.toBeAny();
    expectTypeOf<ProFormItemInstance>().not.toBeAny();
    expectTypeOf<ProTableInstance>().not.toBeAny();
    expectTypeOf<ProFormItemProps>().not.toBeAny();

    // 表单与 hook 返回类型：可作显式标注
    const form = null as unknown as Form<{ name: string }>;
    const useFieldsReturn = null as unknown as UseFields<User>;
    const table = null as unknown as Table<{ name: string }>;
    expect(form).toBeNull();
    expect(useFieldsReturn).toBeNull();
    expect(table).toBeNull();

    // 全局配置与组件名
    const componentName: ComponentName = 'input';
    const componentMap: ComponentMap = {};
    const componentVars: ComponentVars = { 'pro-table': { size: 'small' } };
    expect(componentName).toBe('input');
    expect(Object.keys(componentMap)).toHaveLength(0);
    expect(componentVars['pro-table']?.size).toBe('small');

    // locale 文案类型：任意字符串取值
    const locale: Partial<ProLocale> = { 'table.query': '搜索' };
    expect(locale['table.query']).toBe('搜索');
  });
});
