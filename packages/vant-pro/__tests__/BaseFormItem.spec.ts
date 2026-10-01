import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import BaseFormItem from '../src/components/form/components/BaseFormItem/index.vue';
import { Field as VanField } from '../src/shared/ui';
import { useForm } from '../src/components/form/hooks/useForm';
import { InjectionFormKey } from '../src/components/form/constants';
import type { Field } from '../src/components/form/types';

describe('BaseFormItem 组件测试 (vant-pro)', () => {
  it('BFI-01: 正确渲染字段列表', async () => {
    const form = useForm({ name: 'Alice', age: 18 });
    const wrapper = mount(BaseFormItem, {
      props: {
        fields: [
          { path: 'name', label: '姓名', component: 'field' },
          { path: 'age', label: '年龄', component: 'field' },
        ],
      },
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
        },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    const fields = wrapper.findAllComponents(VanField);
    expect(fields.length).toBe(2);
    expect(fields[0].props('label')).toBe('姓名');
    expect(fields[1].props('label')).toBe('年龄');
    wrapper.unmount();
  });

  it('BFI-02: 正确过滤 hidden: true 的字段', async () => {
    const form = useForm({});
    const wrapper = mount(BaseFormItem, {
      props: {
        fields: [
          { path: 'visibleField', label: '可见字段', component: 'field' },
          {
            path: 'hiddenField',
            label: '隐藏字段',
            component: 'field',
            hidden: true,
          },
        ],
      },
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
        },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    const fields = wrapper.findAllComponents(VanField);
    expect(fields.length).toBe(1);
    expect(fields[0].props('label')).toBe('可见字段');
    wrapper.unmount();
  });

  it('BFI-03: 支持嵌套 fields 递归渲染', async () => {
    const form = useForm({ info: { title: 'Test' } });
    const wrapper = mount(BaseFormItem, {
      props: {
        fields: [
          {
            path: 'info',
            fields: [{ path: 'info.title', label: '标题', component: 'field' }],
          },
        ],
      },
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
        },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    const fields = wrapper.findAllComponents(VanField);
    expect(fields.length).toBe(1);
    expect(fields[0].props('label')).toBe('标题');
    wrapper.unmount();
  });

  it('BFI-04 [判别]: 无 path 字段以稳定对象 key 渲染，头部插入新分组后原字段组件不复用错位', async () => {
    const form = useForm({});
    const fields: Field[] = [
      {
        label: '分组1',
        fields: [{ path: 'a', label: 'A', component: 'field' }],
      },
      {
        label: '分组2',
        fields: [{ path: 'b', label: 'B', component: 'field' }],
      },
    ];
    const wrapper = mount(BaseFormItem, {
      props: { fields },
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
        },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    // 挂载时 DOM 顺序：分组1 的 A → 分组2 的 B
    const before = wrapper.findAllComponents(VanField);
    expect(before.map((f: any) => f.props('label'))).toEqual(['A', 'B']);
    const bInputBefore = before[1].element.querySelector('input');

    // 头部插入新的无 path 分组：若 key 退化为数组索引，B 所在分组组件会被错位复用
    (fields as any).unshift({
      label: '分组0',
      fields: [{ path: 'c', label: 'C', component: 'field' }],
    });
    await wrapper.setProps({ fields: [...(fields as any)] });
    await flushPromises();

    const after = wrapper.findAllComponents(VanField);
    expect(after.map((f: any) => f.props('label'))).toEqual(['C', 'A', 'B']);
    // 判别点：B 字段的 input 元素随组件实例保留（非受控状态不漂移到 A）
    const bField = after.find((f: any) => f.props('label') === 'B')!;
    expect(bField.element.querySelector('input')).toBe(bInputBefore);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A15 [判别]: fields 中的 null / undefined 项被忽略（不抛错、不影响合法字段）
  // ----------------------------------------------------
  it('BI-A15 [判别]: fields 含 null/undefined 项时不抛错，合法字段照常渲染', async () => {
    const form = useForm({ a: '' }, [
      null,
      undefined,
      { path: 'a', label: 'A', component: 'field' },
    ] as any);

    const wrapper = mount(BaseFormItem, {
      props: { fields: form.fields.value } as any,
      global: {
        provide: { [InjectionFormKey as symbol]: form },
        stubs: { transition: false },
      },
    });
    await flushPromises();

    expect(wrapper.findAll('input')).toHaveLength(1);
    await wrapper.find('input').setValue('x');
    await flushPromises();
    expect(form.getFormData('a')).toBe('x');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A15b [判别]: 原始值项仍走兜底分支，渲染 key 不抛 WeakMap 错误
  // ----------------------------------------------------
  it('BI-A15b [判别]: fields 含原始值项时渲染不抛错（key 走非对象回退）', async () => {
    const form = useForm({ a: '' }, [
      'not-a-field',
      { path: 'a', label: 'A', component: 'field' },
    ] as any);

    const wrapper = mount(BaseFormItem, {
      props: { fields: form.fields.value } as any,
      global: {
        provide: { [InjectionFormKey as symbol]: form },
        stubs: { transition: false },
      },
    });
    await flushPromises();

    // 原始值项被忽略：仅 1 个字段容器、1 个输入框，且合法字段可用
    expect(wrapper.findAll('.van-field')).toHaveLength(1);
    const inputs = wrapper.findAll('input');
    expect(inputs).toHaveLength(1);
    await inputs[0].setValue('y');
    await flushPromises();
    expect(form.getFormData('a')).toBe('y');

    wrapper.unmount();
  });
});
