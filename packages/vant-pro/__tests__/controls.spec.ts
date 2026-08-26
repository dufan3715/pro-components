import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { h, defineComponent, ref } from 'vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { Field as VanField } from '../src/shared/ui';

describe('ProComponentProvider 配置控制测试 (vant-pro)', () => {
  // ----------------------------------------------------
  // PC-A1 [判别]: componentVars 动态修改响应式生效
  // ----------------------------------------------------
  it('PC-A1 [判别]: 运行期动态修改 Provider 的 componentVars，子组件立即响应新配置', async () => {
    const form = useForm({}, [{ path: 'name', component: 'field' }]);
    const currentPlaceholder = ref('初始占位符');

    const Parent = defineComponent({
      setup() {
        return () =>
          h('div', { class: 'test-wrapper' }, [
            h(
              ProComponentProvider,
              {
                componentVars: {
                  field: {
                    placeholder: currentPlaceholder.value,
                  },
                },
              },
              {
                default: () => h(ProForm, { form }),
              }
            ),
          ]);
      },
    });

    const wrapper = mount(Parent, {
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const fieldComp = wrapper.findComponent(VanField);
    expect(fieldComp.props('placeholder')).toBe('初始占位符');

    // 动态修改
    currentPlaceholder.value = '更新后的占位符';
    await flushPromises();
    expect(fieldComp.props('placeholder')).toBe('更新后的占位符');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PC-02: componentMap 全局注册自定义组件
  // ----------------------------------------------------
  it('PC-02: componentMap 全局注册自定义组件', async () => {
    const BrandNewWidget = defineComponent({
      name: 'BrandNewWidget',
      template: '<div class="brand-new-vant-widget">Widget Content</div>',
    });

    const form = useForm({}, [
      { path: 'customItem', component: 'my-custom-widget' as any },
    ]);

    const Parent = defineComponent({
      setup() {
        return () =>
          h('div', { class: 'test-wrapper' }, [
            h(
              ProComponentProvider,
              {
                componentMap: {
                  'my-custom-widget': BrandNewWidget,
                },
              },
              {
                default: () => h(ProForm, { form }),
              }
            ),
          ]);
      },
    });

    const wrapper = mount(Parent, {
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    expect(wrapper.find('.brand-new-vant-widget').exists()).toBe(true);
    wrapper.unmount();
  });
});
