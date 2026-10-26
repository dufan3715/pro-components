import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { computed, defineComponent, h, nextTick, ref } from 'vue';
import { useReactiveAttrs } from '../src/shared/useReactiveAttrs';

const Probe = defineComponent({
  name: 'ReactiveAttrsProbe',
  setup() {
    const attrs = useReactiveAttrs();
    const keys = computed(() => Object.keys(attrs).sort());
    return () =>
      h('div', { class: 'probe', 'data-keys': keys.value.join(',') });
  },
});

describe('useReactiveAttrs', () => {
  it('RA-01 [判别]: 新增 / 删除 attrs key 触发派生更新', async () => {
    const withFoo = ref(false);
    const Host = defineComponent({
      name: 'ReactiveAttrsHost',
      setup() {
        return () =>
          h(
            Probe,
            withFoo.value ? { foo: 'bar', 'data-x': 1 } : { 'data-x': 1 }
          );
      },
    });

    const wrapper = mount(Host);
    expect(wrapper.find('.probe').attributes('data-keys')).toBe('data-x');

    // 新增 key：迭代派生需要失效重算
    withFoo.value = true;
    await nextTick();
    expect(wrapper.find('.probe').attributes('data-keys')).toBe('data-x,foo');

    // 删除 key
    withFoo.value = false;
    await nextTick();
    expect(wrapper.find('.probe').attributes('data-keys')).toBe('data-x');

    wrapper.unmount();
  });
});
