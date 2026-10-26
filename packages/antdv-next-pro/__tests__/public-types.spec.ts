/**
 * 公开类型面冒烟回归 —— 锁定 17 个包根类型导出可用
 *
 * @description 类型名一旦从 barrel 漏出，消费方引用即报 TS2305；
 * 本文件在 `vue-tsc --noEmit`（tsconfig include 覆盖 `__tests__`）下校验类型可解析与关键形状。
 */
import { describe, it, expect, expectTypeOf } from 'vitest';
import { computed, ref } from 'vue';
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
  ProFormProps,
  ProLocale,
  ProTableInstance,
  ProTableProps,
  Table,
  UseFields,
} from '../src';

type User = { name: string; age: number; address: { city: string } };

describe('公开类型面冒烟 · antdv-next-pro', () => {
  // ----------------------------------------------------
  // SX-06 [判别]: 17 个包根类型导出可解析且关键形状成立
  // ----------------------------------------------------
  it('SX-06 [判别]: 包根类型导出可解析，字段/列类型按泛型推导', () => {
    // 字段：泛型可推导，hidden 支持布尔 / Ref / ComputedRef（类型面口径）
    const hiddenRef = ref(false);
    const hiddenComputed = computed(() => hiddenRef.value);
    const fields: Fields = [
      { path: 'name', label: '姓名', component: 'input' },
      { path: 'age', label: '年龄', component: 'input', hidden: hiddenRef },
      {
        path: 'nick',
        label: '昵称',
        component: 'input',
        hidden: hiddenComputed,
      },
      // 类型面：getter 形态不属于 hidden 契约（四包统一为 Ref / ComputedRef）
      // @ts-expect-error hidden 不接受 getter 形式
      { path: 'tag', label: '标签', component: 'input', hidden: () => true },
    ];
    const field: Field = fields[0];
    expect(fields).toHaveLength(4);
    expect(field.path).toBe('name');

    // 列：dataIndex 按泛型 D 推导路径
    const columns: Columns<User> = [
      { dataIndex: 'name', title: '姓名' },
      { dataIndex: 'address.city', title: '城市' },
      { dataIndex: 'age', title: '年龄', hidden: hiddenRef },
    ];
    const column: Column<User> = columns[0];
    expect(column.title).toBe('姓名');
    expect(hiddenRef.value).toBe(false);

    // 组件 props / 实例类型：形状可断言
    expectTypeOf<ProFormProps>().toHaveProperty('form');
    expectTypeOf<ProTableProps>().toHaveProperty('table');
    expectTypeOf<ProFormInstance>().not.toBeAny();
    expectTypeOf<ProTableInstance>().not.toBeAny();

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

  // ----------------------------------------------------
  // SX-07 [判别]: 字段类名/样式复用宿主 ClassValue / StyleValue
  // ----------------------------------------------------
  it('SX-07 [判别]: 字段类名与样式接受宿主 ClassValue / StyleValue 形态，非类名取值被拒', () => {
    const field: Field = {
      path: 'name',
      component: 'input',
      formItemClass: ['a', { b: true }],
      formItemStyle: ['padding: 0', { margin: 0 }],
      componentClass: { c: true },
      componentStyle: 'color: red',
    };
    expect(field.componentClass).toEqual({ c: true });
    expect(field.formItemStyle).toEqual(['padding: 0', { margin: 0 }]);

    // 类型面：数字不属于宿主 ClassValue 契约
    const invalid: Field = {
      path: 'invalid',
      component: 'input',
      // @ts-expect-error ClassValue 不接受数字
      componentClass: 1,
    };
    expect(invalid.componentClass).toBe(1);
  });
});
