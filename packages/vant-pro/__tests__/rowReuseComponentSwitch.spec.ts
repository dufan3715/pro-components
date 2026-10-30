import { describe, it, expect } from 'vitest';
import { defineComponent, h, markRaw } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import BaseFormItem from '../src/components/form/components/BaseFormItem/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';

const Probe = markRaw(
  defineComponent({
    name: 'ReuseProbe',
    setup: () => () => h('div', { class: 'reuse-probe' }),
  })
);

describe('数据行复用组件切换 (vant-pro)', () => {
  // ----------------------------------------------------
  // BI-A27 [判别]: 行复用下切换 component 后重新解析 Provider 默认值
  // ----------------------------------------------------
  it('BI-A27 [判别]: 自定义组件切换 key 后旧 Provider 默认值不残留，行实例保持', async () => {
    const form = useForm({ value: '' }, [
      { path: 'value', component: 'custom-a' as any },
    ]);
    const wrapper = mount(ProComponentProvider as any, {
      props: {
        componentMap: { 'custom-a': Probe, 'custom-b': Probe },
        componentVars: {
          'custom-a': { 'data-only-a': 'a' },
          'custom-b': {},
        },
      },
      slots: { default: () => h(ProForm as any, { form }) },
    });
    await flushPromises();

    expect(wrapper.find('.reuse-probe').attributes('data-only-a')).toBe('a');
    const rowBefore = wrapper.findComponent(BaseFormItem).vm;

    form.setField('value', { component: 'custom-b' } as any);
    await flushPromises();

    expect(wrapper.find('.reuse-probe').exists()).toBe(true);
    expect(
      wrapper.find('.reuse-probe').attributes('data-only-a')
    ).toBeUndefined();
    expect(wrapper.findComponent(BaseFormItem).vm).toBe(rowBefore);

    wrapper.unmount();
  });
});
