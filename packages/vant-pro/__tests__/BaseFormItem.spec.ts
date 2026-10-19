import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
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

  // ----------------------------------------------------
  // BI-A16 [判别]: 字段实例访问器经公开类型可直接访问（无需 as any）
  // ----------------------------------------------------
  it('BI-A16 [判别]: 字段实例访问器在公开类型面可直接访问且运行时可用', async () => {
    const form = useForm({ a: '' }, [
      { path: 'a', label: 'A', component: 'field' },
    ] as any);

    const wrapper = mount(BaseFormItem as any, {
      props: { fields: form.fields.value } as any,
      global: {
        provide: { [InjectionFormKey as symbol]: form },
        stubs: { transition: false },
      },
    });
    await flushPromises();

    // 类型层：字段公开类型已声明访问器，以下访问无需断言
    const field: Field = form.fields.value[0] as Field;
    expect(typeof field.getComponentRef).toBe('function');
    // 运行时：控件实例已挂载（vant 不挂载表单项级访问器）
    expect(field.getComponentRef?.()).toBeTruthy();
    expect(field.getComponentComputedProps?.()).toBeDefined();

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A17 [判别]: 同 path 兄弟字段渲染 key 唯一（交换后节点随 key 迁移）
  // ----------------------------------------------------
  it('BI-A17 [判别]: 同 path 兄弟字段渲染 key 唯一，交换后节点随 key 迁移', async () => {
    const form = useForm({ date: '' }, [
      { path: 'date', label: 'A', component: 'field' },
      { path: 'date', label: 'B', component: 'field' },
    ] as any);

    const wrapper = mount(BaseFormItem as any, {
      props: { fields: form.fields.value } as any,
      global: {
        provide: { [InjectionFormKey as symbol]: form },
        stubs: { transition: false },
      },
    });
    await flushPromises();

    const before = wrapper.findAll('.van-field');
    expect(before).toHaveLength(2);
    const elA = before[0].element as HTMLElement;
    const elB = before[1].element as HTMLElement;
    expect(before[0].text()).toContain('A');
    expect(before[1].text()).toContain('B');

    const arr = form.fields.value as any[];
    [arr[0], arr[1]] = [arr[1], arr[0]];
    await flushPromises();

    const after = wrapper.findAll('.van-field');
    expect(after).toHaveLength(2);
    expect(after[0].element).toBe(elB);
    expect(after[1].element).toBe(elA);
    expect(after[0].text()).toContain('B');
    expect(after[1].text()).toContain('A');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A18 [判别]: hidden 的类型面口径为 Ref/ComputedRef，渲染期按 toValue 过滤
  // ----------------------------------------------------
  it('BI-A18 [判别]: hidden 支持 Ref 形态并在渲染期按 toValue 过滤，getter 不入类型面', async () => {
    const hiddenRef = ref(false);
    const fields: Field[] = [
      { path: 'a', label: 'A', component: 'field', hidden: hiddenRef },
      // 类型面：getter 形态不属于 hidden 契约（四包统一为 Ref / ComputedRef）
      // @ts-expect-error hidden 不接受 getter 形式
      { path: 'b', label: 'B', component: 'field', hidden: () => true },
    ];
    const form = useForm({ a: '', b: '' }, fields);

    const wrapper = mount(BaseFormItem, {
      props: { fields: form.fields.value },
      global: {
        provide: { [InjectionFormKey as symbol]: form },
        stubs: { transition: false },
      },
    });
    await flushPromises();

    // 判别点：Ref(false) 的字段渲染，getter 返回 true 的字段在运行期同样被过滤
    expect(wrapper.findAll('input')).toHaveLength(1);
    hiddenRef.value = true;
    await flushPromises();
    expect(wrapper.findAll('input')).toHaveLength(0);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A20 [判别]: slots 组件对象经 <component :is> 渲染，原始值仍走文本插值
  // ----------------------------------------------------
  it('BI-A20 [判别]: slots 传入组件对象时渲染组件本体，传入字符串时按文本渲染', async () => {
    const CustomInput = defineComponent({
      setup() {
        return () =>
          h('span', { class: 'slot-comp-input' }, 'INPUT-FROM-COMPONENT');
      },
    });

    const form = useForm({ email: '', phone: '' });
    const wrapper = mount(BaseFormItem as any, {
      props: {
        fields: [
          {
            path: 'email',
            label: '邮箱',
            component: 'field',
            slots: { input: CustomInput as any },
          },
          {
            path: 'phone',
            label: '手机号',
            component: 'field',
            slots: { input: '纯文本提示' as any },
          },
        ],
      } as any,
      global: {
        provide: { [InjectionFormKey as symbol]: form },
        stubs: { transition: false },
      },
    });
    await flushPromises();

    // 组件对象：渲染组件本体，而非组件对象的序列化文本
    expect(wrapper.find('.slot-comp-input').exists()).toBe(true);
    expect(wrapper.find('.slot-comp-input').text()).toBe(
      'INPUT-FROM-COMPONENT'
    );
    expect(wrapper.text()).not.toContain('[object Object]');
    // 原始值：保持文本插值
    expect(wrapper.text()).toContain('纯文本提示');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A21 [判别]: componentContainer / fieldContainer 分别在控件层与分组层生效
  // ----------------------------------------------------
  it('BI-A21 [判别]: componentContainer 包裹内层控件，fieldContainer 包裹分组子字段', async () => {
    const ControlBox = defineComponent({
      name: 'ControlBox',
      setup(_, { slots }) {
        return () => h('div', { class: 'control-box' }, slots.default?.());
      },
    });
    const GroupBox = defineComponent({
      name: 'GroupBox',
      setup(_, { slots }) {
        return () => h('section', { class: 'group-box' }, slots.default?.());
      },
    });

    const form = useForm({ name: '', address: { city: '' } });
    const wrapper = mount(BaseFormItem as any, {
      props: {
        fields: [
          {
            path: 'name',
            label: '姓名',
            component: 'field',
            componentContainer: ControlBox,
          },
          {
            path: 'address',
            label: '地址',
            fieldContainer: GroupBox,
            fields: [
              { path: 'address.city', label: '城市', component: 'field' },
            ],
          },
        ],
      } as any,
      global: {
        provide: { [InjectionFormKey as symbol]: form },
        stubs: { transition: false },
      },
    });
    await flushPromises();

    // 判别点：容器组件成为实际包裹层，而非被忽略；且各自只包裹自己的子树
    expect(wrapper.find('.control-box input').attributes('name')).toBe('name');
    expect(wrapper.find('.group-box input').attributes('name')).toBe(
      'address.city'
    );
    expect(wrapper.find('.control-box input').element).not.toBe(
      wrapper.find('.group-box input').element
    );

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A22 [判别]: 字段样式类名/样式按宿主 ClassValue / StyleValue 复用
  // ----------------------------------------------------
  it('BI-A22 [判别]: 样式类名与样式按宿主类型复用，数组/对象/字符串形态照常绑定', async () => {
    // 类型面：数字不属于宿主 ClassValue / StyleValue 契约
    const invalidField: Field = {
      path: 'invalid',
      component: 'field',
      // @ts-expect-error ClassValue 不接受数字
      componentClass: 1,
    };
    expect(invalidField.componentClass).toBe(1);

    const form = useForm({ name: 'Alice' }, [
      {
        path: 'name',
        label: '姓名',
        component: 'field',
        componentClass: ['custom-cls', { active: true }],
        componentStyle: ['color: red', { fontSize: '12px' }],
        fieldClass: { 'field-cls': true },
        fieldStyle: 'font-weight: bold',
      },
    ]);
    const wrapper = mount(BaseFormItem as any, {
      props: { fields: form.fields.value } as any,
      global: {
        provide: { [InjectionFormKey as symbol]: form },
        stubs: { transition: false },
      },
    });
    await flushPromises();

    // 判别点：数组/对象形态落到内层控件与外层 van-field 的 class 上
    const customControl = wrapper.find('.custom-cls');
    expect(customControl.exists()).toBe(true);
    expect(customControl.classes()).toContain('active');
    expect(wrapper.find('.field-cls').exists()).toBe(true);

    // 判别点：样式数组 / 字符串形态经宿主归一后落到各自节点
    const controlStyle = customControl.attributes('style') ?? '';
    expect(controlStyle).toContain('color: red');
    expect(controlStyle).toContain('font-size: 12px');
    expect(wrapper.find('.field-cls').attributes('style')).toContain(
      'font-weight: bold'
    );

    wrapper.unmount();
  });
});
