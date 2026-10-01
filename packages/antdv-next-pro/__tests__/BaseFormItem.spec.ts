import { describe, it, expect, vi } from 'vitest';
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
  // BI-A6 [判别]: frozen 字段对象不抛错，访问器挂载失败输出一次性告警
  // ----------------------------------------------------
  it('BI-A6 [判别]: Object.freeze 的字段对象渲染不抛错，访问器挂载失败仅告警一次', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const frozenField: Field = Object.freeze({
        path: 'frozen',
        label: '冻结字段',
        component: 'input',
      });
      const normalField: Field = {
        path: 'normal',
        label: '普通字段',
        component: 'input',
      };

      const form = useForm({}, [frozenField, normalField]);
      const wrapper = mount(ProForm, {
        props: { form },
        global: { stubs: { transition: false } },
      });
      await flushPromises();

      // 判别点 1：渲染不崩溃，两个字段都正常渲染
      expect(wrapper.html()).toContain('冻结字段');
      expect(wrapper.html()).toContain('普通字段');

      // 判别点 2：frozen 字段访问器静默缺失（WeakMap 注册不受影响，但对象不可写故访问器无法挂载）
      expect((frozenField as any).getFormItemRef).toBeUndefined();
      // 普通字段访问器正常挂载
      expect(typeof (normalField as any).getFormItemRef).toBe('function');

      // 判别点 3：告警输出且去重（setFormItemRef + setComponentRef 两轮挂载仅一条）
      const warnCalls = warnSpy.mock.calls
        .map(c => String(c[0]))
        .filter(msg => msg.includes('字段配置对象不可写'));
      expect(warnCalls.length).toBe(1);
      wrapper.unmount();
    } finally {
      warnSpy.mockRestore();
    }
  });
  // ----------------------------------------------------
  // BI-A5 [判别]: 无 path 字段插删后组件实例按对象身份复用，不随数组索引错位
  // ----------------------------------------------------
  it('BI-A5 [判别]: 无 path 字段以稳定对象 key 渲染，头部插入新字段后原字段实例不复用错位', async () => {
    const g1: Field = { label: '分组1', fields: [] };
    const g2: Field = { label: '分组2', fields: [] };

    const form = useForm({}, [g1, g2]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const g1Ref = (g1 as any).getFormItemRef?.();
    const g2Ref = (g2 as any).getFormItemRef?.();
    expect(g1Ref).toBeDefined();
    expect(g2Ref).toBeDefined();

    // 头部插入新的无 path 字段：若 key 退化为数组索引，g2 的组件实例会被 g1 复用错位
    const g0: Field = { label: '分组0', fields: [] };
    form.fields.value.unshift(g0);
    await flushPromises();

    // 判别点：实例与字段对象身份保持绑定，g2 移位后仍持有自身实例而非 g1 的
    expect((g1 as any).getFormItemRef?.()).toBe(g1Ref);
    expect((g2 as any).getFormItemRef?.()).toBe(g2Ref);

    // 中部删除同样不引起错位
    form.fields.value.splice(1, 1); // 删除 g1
    await flushPromises();
    expect((g2 as any).getFormItemRef?.()).toBe(g2Ref);
    wrapper.unmount();
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
  // ----------------------------------------------------
  // BI-07 [判别]: 分组字段默认整行 span 24，显式 span 优先，栅格属性透传
  // ----------------------------------------------------
  it('BI-07 [判别]: 分组字段默认整行 span=24，显式 span/offset 正确透传至栅格容器', async () => {
    const form = useForm({}, [
      {
        label: '默认分组',
        fields: [{ path: 'a', label: 'A', component: 'input' }],
      },
      {
        label: '半宽分组',
        span: 12,
        fields: [{ path: 'b', label: 'B', component: 'input' }],
      },
      {
        label: '带偏移分组',
        span: 8,
        offset: 4,
        fields: [{ path: 'c', label: 'C', component: 'input' }],
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form, grid: true },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    // 默认分组占满 24 栅格
    expect(wrapper.find('.ant-col-24').exists()).toBe(true);
    // 显式 span 12 的分组
    expect(wrapper.find('.ant-col-12').exists()).toBe(true);
    // 显式 offset 4 的分组（此前分组分支会静默丢弃 offset）
    expect(wrapper.find('.ant-col-offset-4').exists()).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A15 [判别]: fields 中的 null / undefined 项被忽略（不抛错、不影响合法字段）
  // ----------------------------------------------------
  it('BI-A15 [判别]: fields 含 null/undefined 项时不抛错，合法字段照常渲染', async () => {
    const form = useForm({ a: '' }, [
      null,
      undefined,
      { path: 'a', label: 'A', component: 'input' },
    ] as any);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 仅合法字段被渲染
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
      { path: 'a', label: 'A', component: 'input' },
    ] as any);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 原始值项被忽略：仅 1 个表单项、1 个输入框，且合法字段可用
    expect(wrapper.findAll('.ant-form-item')).toHaveLength(1);
    const inputs = wrapper.findAll('input');
    expect(inputs).toHaveLength(1);
    await inputs[0].setValue('y');
    await flushPromises();
    expect(form.getFormData('a')).toBe('y');

    wrapper.unmount();
  });
});
