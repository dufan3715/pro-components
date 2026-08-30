import { describe, it, expect } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { flushPromises } from './helpers/mount';
import { FormItem } from '../src/shared/ui';
import type { Field } from '../src/components/form/types';

describe('BaseFormItem 组件测试', () => {
  // ----------------------------------------------------
  // BI-A3 [判别]: WeakMap 实例绑定，直接变异 fields.value.splice 不发生索引错位
  // ----------------------------------------------------
  it('BI-A3 [判别]: 字段变异 splice/重排后，getFormItemRef 与 getComponentRef 精准绑定自身实例', async () => {
    const f1: Field = { path: 'field1', label: '字段1', component: 'input' };
    const f2: Field = { path: 'field2', label: '字段2', component: 'input' };
    const f3: Field = { path: 'field3', label: '字段3', component: 'input' };

    const form = useForm({}, [f1, f2, f3]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // 挂载后各字段获得 getFormItemRef
    const f1Ref = (f1 as any).getFormItemRef?.();
    const f2Ref = (f2 as any).getFormItemRef?.();
    const f3Ref = (f3 as any).getFormItemRef?.();

    expect(f1Ref).toBeDefined();
    expect(f2Ref).toBeDefined();
    expect(f3Ref).toBeDefined();
    expect(f1Ref).not.toBe(f2Ref);

    // 直接变异 fields: 删除头部 f1
    form.fields.value.splice(0, 1);
    await flushPromises();

    // 关键判别点：f2 虽移动到了索引 0，但 getFormItemRef 依然指向 f2Ref 自身实例，绝不发生索引错位变成 f1Ref
    expect((f2 as any).getFormItemRef?.()).toBe(f2Ref);
    expect((f3 as any).getFormItemRef?.()).toBe(f3Ref);

    // 字段重排：把 f3 移到 f2 前面
    form.fields.value = [f3, f2];
    await flushPromises();

    expect((f2 as any).getFormItemRef?.()).toBe(f2Ref);
    expect((f3 as any).getFormItemRef?.()).toBe(f3Ref);

    wrapper.unmount();
    await flushPromises();

    // 卸载后从 WeakMap 清理
    expect((f2 as any).getFormItemRef?.()).toBeUndefined();
  });

  // ----------------------------------------------------
  // BI-A4 [判别]: 卸载后字段对象上的注入访问器同步删除
  // ----------------------------------------------------
  it('BI-A4 [判别]: 字段卸载后 getFormItemRef 等注入访问器从字段对象上删除', async () => {
    const f1: Field = { path: 'field1', label: '字段1', component: 'input' };
    const f2: Field = { path: 'field2', label: '字段2', component: 'input' };

    const form = useForm({}, [f1, f2]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 挂载期字段对象携带注入访问器
    expect(typeof (f1 as any).getFormItemRef).toBe('function');
    expect(typeof (f1 as any).getFormItemComputedProps).toBe('function');
    expect(typeof (f1 as any).getComponentRef).toBe('function');
    expect(typeof (f1 as any).getComponentComputedProps).toBe('function');

    // 删除字段 f1：其 ref 回调以 null 触发清理
    form.fields.value.splice(0, 1);
    await flushPromises();

    // 判别点：访问器属性本身被删除（而非仅返回 undefined）
    expect((f1 as any).getFormItemRef).toBeUndefined();
    expect((f1 as any).getFormItemComputedProps).toBeUndefined();
    expect((f1 as any).getComponentRef).toBeUndefined();
    expect((f1 as any).getComponentComputedProps).toBeUndefined();
    // 在册字段不受影响
    expect(typeof (f2 as any).getFormItemRef).toBe('function');

    // 整体卸载同理
    wrapper.unmount();
    await flushPromises();
    expect((f2 as any).getFormItemRef).toBeUndefined();
    expect((f2 as any).getComponentComputedProps).toBeUndefined();
  });

  // ----------------------------------------------------
  // BI-01: hidden 过滤
  // ----------------------------------------------------
  it('BI-01: hidden: true 的字段不应被渲染', async () => {
    const form = useForm({}, [
      { path: 'visible1', label: '可见1', component: 'input' },
      { path: 'hidden1', label: '隐藏1', component: 'input', hidden: true },
      { path: 'visible2', label: '可见2', component: 'input' },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const items = wrapper.findAllComponents(FormItem);
    expect(items.length).toBe(2);
    expect(items.some(i => (i.props() as any).path === 'hidden1')).toBe(false);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-02: gridItemProps 属性落位
  // ----------------------------------------------------
  it('BI-02: 开启 grid 布局时，gridItemProps 正确生效', async () => {
    const form = useForm({}, [
      { path: 'name', label: '姓名', component: 'input', span: 12 },
    ]);

    const wrapper = mount(ProForm, {
      props: {
        form,
        grid: true,
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const col = wrapper.find('.ant-col-12');
    expect(col.exists()).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-03: FormItem 插槽透传 (extra / help)
  // ----------------------------------------------------
  it('BI-03: 支持通过字段配置 slots 透传 extra / help 插槽', async () => {
    const form = useForm({}, [
      {
        path: 'email',
        label: '邮箱',
        component: 'input',
        slots: {
          extra: (() =>
            h('span', { class: 'custom-extra-tip' }, '请输入工作邮箱')) as any,
        } as any,
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const extraEl = wrapper.find('.custom-extra-tip');
    expect(extraEl.exists()).toBe(true);
    expect(extraEl.text()).toBe('请输入工作邮箱');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-04: 自定义 componentContainer
  // ----------------------------------------------------
  it('BI-04: 支持自定义 componentContainer 包裹 FormItem', async () => {
    const CustomBox = defineComponent({
      props: ['path'],
      setup(props, { slots }) {
        return () =>
          h('div', { class: `custom-box-${props.path}` }, slots.default?.());
      },
    });

    const form = useForm({}, [
      {
        path: 'userPhone',
        label: '手机号',
        component: 'input',
        formItemContainer: CustomBox,
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const customContainer = wrapper.find('.custom-box-userPhone');
    expect(customContainer.exists()).toBe(true);
    wrapper.unmount();
  });
});
