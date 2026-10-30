import { describe, it, expect } from 'vitest';
import { defineComponent, h, markRaw, ref } from 'vue';
import { mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { flushPromises } from './helpers/mount';

const FallbackControl = markRaw(
  defineComponent({
    name: 'FallbackControl',
    setup: () => () => h('i', { class: 'fallback-control' }),
  })
);

describe('ProForm 插槽刷新', () => {
  // ----------------------------------------------------
  // PF-S3 [判别]: 同名 slot 更换实现后立即渲染新组件
  // ----------------------------------------------------
  it('PF-S3 [判别]: 同名 slot 更换实现后立即渲染新组件', async () => {
    const form = useForm({ f1: 'x' }, [{ path: 'f1', component: 'input' }]);
    const mode = ref<'a' | 'b'>('a');

    const Wrapper = defineComponent({
      setup() {
        return () =>
          h(
            ProForm,
            { form },
            {
              f1: (() => {
                const cls = mode.value === 'a' ? 'slot-a' : 'slot-b';
                return () => h('div', { class: cls }, 'slot');
              })(),
            }
          );
      },
    });

    const wrapper = mount(Wrapper, {
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.find('.slot-a').exists()).toBe(true);

    mode.value = 'b';
    await flushPromises();
    expect(wrapper.find('.slot-b').exists()).toBe(true);
    expect(wrapper.find('.slot-a').exists()).toBe(false);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-S4 [判别]: 插槽 key 增删后在插槽与内置控件间切换
  // ----------------------------------------------------
  it('PF-S4 [判别]: 插槽 key 增删后在插槽与内置控件间切换', async () => {
    const form = useForm({ f1: 'x' }, [
      { path: 'f1', component: FallbackControl },
    ]);
    const showSlot = ref(true);

    const Wrapper = defineComponent({
      setup() {
        return () =>
          h(
            ProForm,
            { form },
            {
              ...(showSlot.value
                ? { f1: () => h('div', { class: 'slot-a' }, 'slot') }
                : {}),
            }
          );
      },
    });

    const wrapper = mount(Wrapper, {
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.find('.slot-a').exists()).toBe(true);
    expect(wrapper.find('.fallback-control').exists()).toBe(false);

    showSlot.value = false;
    await flushPromises();
    expect(wrapper.find('.slot-a').exists()).toBe(false);
    expect(wrapper.find('.fallback-control').exists()).toBe(true);

    showSlot.value = true;
    await flushPromises();
    expect(wrapper.find('.slot-a').exists()).toBe(true);
    expect(wrapper.find('.fallback-control').exists()).toBe(false);

    showSlot.value = false;
    await flushPromises();
    expect(wrapper.find('.slot-a').exists()).toBe(false);
    expect(wrapper.find('.fallback-control').exists()).toBe(true);

    showSlot.value = true;
    await flushPromises();
    expect(wrapper.find('.slot-a').exists()).toBe(true);
    expect(wrapper.find('.fallback-control').exists()).toBe(false);

    wrapper.unmount();
  });
});
