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

  // ----------------------------------------------------
  // PC-A2 [判别]: 嵌套空 Provider 继承外层 componentVars、componentMap 与 locale
  // ----------------------------------------------------
  it('PC-A2 [判别]: 嵌套空 Provider 继承外层 componentVars、componentMap 与 locale', async () => {
    const CustomField = defineComponent({
      props: ['modelValue', 'placeholder'],
      setup(props) {
        return () =>
          h('input', {
            class: 'nested-brand-field',
            value: props.modelValue,
            placeholder: props.placeholder,
          });
      },
    });
    const Inner = defineComponent({
      setup:
        (_, { slots }) =>
        () =>
          h(ProComponentProvider, null, slots),
    });

    const form = useForm({}, [{ path: 'name', component: 'field' }]);
    const wrapper = mount(ProComponentProvider, {
      props: {
        componentMap: { field: CustomField },
        componentVars: { field: { placeholder: 'OUTER-PH' } },
      },
      slots: {
        default: () => h(Inner, null, { default: () => h(ProForm, { form }) }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const brandField = wrapper.find('.nested-brand-field');
    expect(brandField.exists()).toBe(true);
    expect(brandField.attributes('placeholder')).toBe('OUTER-PH');
    wrapper.unmount();

    // locale 通道：无 componentVars 占位符时按外层 locale 覆盖渲染
    const form2 = useForm({}, [{ path: 'name', component: 'field' }]);
    const wrapper2 = mount(ProComponentProvider, {
      props: { locale: { 'input.placeholder': 'OUTER-LOCALE' } },
      slots: {
        default: () =>
          h(Inner, null, { default: () => h(ProForm, { form: form2 }) }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper2.find('input').attributes('placeholder')).toBe(
      'OUTER-LOCALE'
    );
    wrapper2.unmount();
  });

  // ----------------------------------------------------
  // PC-A3 [判别]: 嵌套 Provider 同名键覆盖外层，外层 componentMap 继续生效
  // ----------------------------------------------------
  it('PC-A3 [判别]: 嵌套 Provider 覆盖同名键时保留外层 componentMap', async () => {
    const CustomField = defineComponent({
      props: ['modelValue', 'placeholder'],
      setup(props) {
        return () =>
          h('input', {
            class: 'nested-brand-field',
            value: props.modelValue,
            placeholder: props.placeholder,
          });
      },
    });
    const Inner = defineComponent({
      setup:
        (_, { slots }) =>
        () =>
          h(
            ProComponentProvider,
            { componentVars: { field: { placeholder: 'INNER-PH' } } },
            slots
          ),
    });

    const form = useForm({}, [{ path: 'name', component: 'field' }]);
    const wrapper = mount(ProComponentProvider, {
      props: {
        componentMap: { field: CustomField },
        componentVars: { field: { placeholder: 'OUTER-PH' } },
      },
      slots: {
        default: () => h(Inner, null, { default: () => h(ProForm, { form }) }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const brandField = wrapper.find('.nested-brand-field');
    expect(brandField.exists()).toBe(true);
    expect(brandField.attributes('placeholder')).toBe('INNER-PH');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PC-A4 [判别]: 嵌套 Provider 同一组件键的兄弟属性逐属性继承
  // ----------------------------------------------------
  it('PC-A4 [判别]: 嵌套 Provider 同一组件键的兄弟属性逐属性继承，同名属性内层覆盖', async () => {
    const mountNested = async (innerVars: Record<string, any>) => {
      const form = useForm({}, [{ path: 'a', component: 'field' }]);
      const wrapper = mount(ProComponentProvider, {
        props: {
          componentVars: { field: { placeholder: 'OUTER-PH' } } as any,
        },
        slots: {
          default: () =>
            h(
              ProComponentProvider,
              { componentVars: innerVars as any },
              { default: () => h(ProForm, { form }) }
            ),
        },
        global: { stubs: { transition: false } },
      });
      await flushPromises();
      const placeholder = wrapper.find('input').attributes('placeholder');
      wrapper.unmount();
      return placeholder;
    };

    // 内层只覆盖 clearable：外层的 placeholder 继续生效
    expect(await mountNested({ field: { clearable: false } })).toBe('OUTER-PH');

    // 内层同名属性覆盖外层
    expect(await mountNested({ field: { placeholder: 'INNER-PH' } })).toBe(
      'INNER-PH'
    );
  });
});
