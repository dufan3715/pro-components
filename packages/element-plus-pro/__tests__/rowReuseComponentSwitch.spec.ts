import { describe, it, expect } from 'vitest';
import { h } from 'vue';
import { mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { flushPromises } from './helpers/mount';
import { Select } from '../src/shared/ui';

describe('数据行复用组件切换 (element-plus-pro)', () => {
  // ----------------------------------------------------
  // BI-A27 [判别]: 行复用下切换 component 后重新解析 placeholder 与 Provider 默认值
  // ----------------------------------------------------
  it('BI-A27 [判别]: input 切 select 后旧 placeholder 不残留，FormItem 实例保持', async () => {
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

    expect(wrapper.find('.el-select').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="旧输入占位"]').exists()).toBe(
      false
    );
    expect(wrapper.findComponent(Select).props('placeholder')).toBe('请选择');
    expect(wrapper.find('.el-select').attributes('data-from-provider')).toBe(
      'select'
    );
    expect(field.getFormItemRef?.()).toBe(formItemBefore);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A27c [判别]: type 变化后重新解析 Provider 默认值
  // ----------------------------------------------------
  it('BI-A27c [判别]: date-picker 切换 type 后按新子类型解析 Provider 默认值，FormItem 实例保持', async () => {
    const form = useForm({ date: '' }, [
      { path: 'date', component: 'date-picker', type: 'date' } as any,
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

    form.setField('date', { type: 'month' } as any);
    await flushPromises();

    expect(field.getComponentComputedProps?.()['data-tag']).toBe('month');
    expect(field.getFormItemRef?.()).toBe(formItemBefore);

    wrapper.unmount();
  });
});
