import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { flushPromises } from './helpers/mount';

describe('FormItem 实时属性', () => {
  // ----------------------------------------------------
  // BI-A29 [判别]: setField 后 getFormItemComputedProps 返回最新值
  // ----------------------------------------------------
  it('BI-A29 [判别]: setField 后 getFormItemComputedProps 立即返回最新 FormItem 属性', async () => {
    const form = useForm({ a: '' }, [
      { path: 'a', label: 'A', component: 'input' },
    ]);
    const wrapper = mount(ProForm as any, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const field = form.fields.value[0] as any;
    expect(field.getFormItemComputedProps?.().label).toBe('A');

    form.setField('a', { label: 'B' });
    expect(field.getFormItemComputedProps?.().label).toBe('B');
    await flushPromises();
    expect(field.getFormItemComputedProps?.().label).toBe('B');

    wrapper.unmount();
  });
});
