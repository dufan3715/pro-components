import { describe, it, expect } from 'vitest';
import { computed } from 'vue';
import { getInitProps } from '../src/components/form/components/BaseField/utils';
import { useGroupFieldAttrs } from '../src/components/form/hooks/useGroupFieldAttrs';
import { getFieldKey } from '../src/components/form/utils/fieldKey';
import { dispatchListeners } from '../src/components/form/utils/listeners';

describe('BaseField utils 与字段属性分组测试 (vant-pro)', () => {
  // ----------------------------------------------------
  // VP-F14 [判别]: getInitProps 占位符映射表
  // ----------------------------------------------------
  it('VP-F14 [判别]: getInitProps 按组件映射表兜底 placeholder，显式占位符优先且非映射组件不注入', () => {
    const requestedKeys: string[] = [];
    const t = (key: string) => {
      requestedKeys.push(key);
      return `i18n:${key}`;
    };

    // 映射表命中：field → input.placeholder，locale 以映射键查询
    expect(getInitProps({ component: 'field' } as any, {}, t)).toEqual({
      placeholder: 'i18n:input.placeholder',
    });
    expect(requestedKeys).toEqual(['input.placeholder']);

    // 注入属性原样透传；已显式声明占位符时不查询 locale、不覆盖
    requestedKeys.length = 0;
    expect(
      getInitProps(
        { component: 'field' } as any,
        { placeholder: '显式占位', disabled: true },
        t
      )
    ).toEqual({ placeholder: '显式占位', disabled: true });
    expect(requestedKeys).toEqual([]);

    // 映射表未登记的组件：仅透传注入属性
    expect(
      getInitProps({ component: 'stepper' } as any, { min: 1 }, t)
    ).toEqual({ min: 1 });
    expect(requestedKeys).toEqual([]);

    // 非字符串组件（自定义组件对象）：不注入任何默认属性
    expect(
      getInitProps({ component: { name: 'Custom' } } as any, { min: 1 }, t)
    ).toEqual({});
  });

  // ----------------------------------------------------
  // VP-F15 [判别]: useGroupFieldAttrs 分组
  // ----------------------------------------------------
  it('VP-F15 [判别]: useGroupFieldAttrs 解析字段标识、剥离容器属性并绑定字段渲染 key', () => {
    const container = { name: 'Section' };
    const childField = {
      path: 'user.child',
      label: '子项',
      component: 'field',
    };
    const firstField = {
      path: 'user.name',
      label: '用户名',
      placeholder: '请输入用户名',
      span: 12,
      extraProps: { internal: true },
      fieldContainer: container,
      hidden: false,
      fields: [childField],
      component: 'field',
    };
    const secondField = { name: 'nickname', label: '昵称', component: 'field' };

    const grouped = useGroupFieldAttrs(
      computed(() => [firstField, secondField]) as any
    ).value;

    // 标识解析：name 优先于 path；仅声明 path 的字段取 path
    expect(grouped.map(item => item.path)).toEqual(['user.name', 'nickname']);

    // 容器属性全部从 componentProps 剥离，其余字段属性原样下发
    expect(grouped[0].componentProps).toEqual({
      label: '用户名',
      placeholder: '请输入用户名',
      span: 12,
      component: 'field',
    });
    expect(grouped[1].componentProps).toEqual({
      label: '昵称',
      component: 'field',
    });
    expect(grouped[0].fieldContainer).toBe(container);

    // 原始字段引用与稳定渲染 key（以字段对象身份分配，非路径字面量）
    expect(grouped[0].rawField).toBe(firstField);
    expect(grouped[0].renderKey).toBe(getFieldKey(firstField));
    expect(typeof grouped[0].renderKey).toBe('number');
    expect(grouped[0].renderKey).not.toBe(grouped[1].renderKey);
  });

  // ----------------------------------------------------
  // VP-F20 [判别]: dispatchListeners 三种入参形态
  // ----------------------------------------------------
  it('VP-F20 [判别]: dispatchListeners 按函数 / 数组派发，数组跳过非函数项，其余形态不调用不抛错', () => {
    const calls: string[] = [];
    const first = (val: string) => calls.push(`first:${val}`);
    const second = (val: string) => calls.push(`second:${val}`);

    // 单函数直接调用，参数原样透传
    dispatchListeners(first, 'a');
    expect(calls).toEqual(['first:a']);

    // 数组合并按声明顺序派发，非函数项跳过
    dispatchListeners([first, 'not-a-function' as any, second, {} as any], 'b');
    expect(calls.slice(1)).toEqual(['first:b', 'second:b']);

    // 其余形态（字符串 / 普通对象 / 未提供）不调用且不抛错
    const callsBefore = calls.length;
    expect(() => dispatchListeners('x' as any, 'c')).not.toThrow();
    expect(() => dispatchListeners({} as any, 'c')).not.toThrow();
    expect(() => dispatchListeners(undefined, 'c')).not.toThrow();
    expect(calls.length).toBe(callsBefore);
  });
});
