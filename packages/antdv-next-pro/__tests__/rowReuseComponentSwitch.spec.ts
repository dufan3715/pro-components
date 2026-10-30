import { describe, it, expect } from 'vitest';
import { defineComponent, h, markRaw } from 'vue';
import { mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { flushPromises } from './helpers/mount';
import { Select } from '../src/shared/ui';

const Probe = markRaw(
  defineComponent({
    name: 'ReuseProbe',
    props: { value: { type: null, default: undefined } },
    setup: () => () => h('i', { class: 'probe' }),
  })
);

describe('数据行复用组件切换', () => {
  // ----------------------------------------------------
  // BI-A27 [判别]: 行复用下切换 component 后按新组件解析 modelProp
  // ----------------------------------------------------
  it('BI-A27 [判别]: 行/FormItem 保持，切换为 switch 后按 checked 绑定并写值', async () => {
    const form = useForm({ rows: [{ id: 'a', enabled: false }] }, [
      { path: 'rows', fields: [] },
    ]);
    form.setField('rows', {
      fields: [{ path: 'rows.0.enabled', component: Probe }],
    } as any);

    const wrapper = mount(ProForm as any, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.find('.probe').exists()).toBe(true);

    const group = form.fields.value.find(
      (field: any) => field.path === 'rows'
    ) as any;
    const oldField = group.fields[0];
    const formItemBefore = oldField.getFormItemRef?.();
    expect(formItemBefore).toBeTruthy();

    form.setField('rows', {
      fields: [{ path: 'rows.0.enabled', component: 'switch' }],
    } as any);
    await flushPromises();

    const newField = group.fields[0];
    expect(newField).not.toBe(oldField);
    expect(newField.getFormItemRef?.()).toBe(formItemBefore);

    const toggle = wrapper.find('.ant-switch');
    expect(toggle.exists()).toBe(true);
    await toggle.trigger('click');
    await flushPromises();
    expect(form.getFormData('rows.0.enabled')).toBe(true);

    wrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // BI-A27b [判别]: 切换 component 后重新解析 placeholder 与 Provider 默认值
  // ----------------------------------------------------
  it('BI-A27b [判别]: input 切 select 后旧 placeholder 不残留，Provider 默认值按新组件生效', async () => {
    const form = useForm({ value: '' }, [
      { path: 'value', component: 'input' },
    ]);
    const wrapper = mount(ProComponentProvider as any, {
      props: {
        componentVars: {
          input: { placeholder: '旧输入占位' },
          select: { 'data-from-provider': 'select' },
        },
      },
      slots: { default: () => h(ProForm as any, { form }) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    expect(wrapper.find('input').attributes('placeholder')).toBe('旧输入占位');
    const field = form.fields.value[0] as any;
    const formItemBefore = field.getFormItemRef?.();
    expect(formItemBefore).toBeTruthy();

    form.setField('value', { component: 'select' } as any);
    await flushPromises();

    expect(wrapper.find('.ant-select').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="旧输入占位"]').exists()).toBe(
      false
    );
    expect(wrapper.findComponent(Select).props('placeholder')).toBe('请选择');
    expect(wrapper.find('.ant-select').attributes('data-from-provider')).toBe(
      'select'
    );
    expect(field.getFormItemRef?.()).toBe(formItemBefore);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A27c [判别]: picker 变化后重新解析 Provider 默认值
  // ----------------------------------------------------
  it('BI-A27c [判别]: date-picker 切换 picker 后按新子类型解析 Provider 默认值，FormItem 实例保持', async () => {
    const form = useForm({ date: '' }, [
      { path: 'date', component: 'date-picker', picker: 'date' } as any,
    ]);
    const wrapper = mount(ProComponentProvider as any, {
      props: {
        componentVars: {
          'date-picker.date': { 'data-tag': 'date' },
          'date-picker.month': { 'data-tag': 'month' },
        },
      },
      slots: { default: () => h(ProForm as any, { form }) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const field = form.fields.value[0] as any;
    expect(field.getComponentComputedProps?.()['data-tag']).toBe('date');
    const formItemBefore = field.getFormItemRef?.();

    form.setField('date', { picker: 'month' } as any);
    await flushPromises();

    expect(field.getComponentComputedProps?.()['data-tag']).toBe('month');
    expect(field.getFormItemRef?.()).toBe(formItemBefore);

    wrapper.unmount();
  });
});
