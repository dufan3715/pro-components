import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, inject, ref } from 'vue';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import ProComponentProvider from '../src/components/component-provider';
import {
  getInjectConfig,
  ensureInjectConfig,
  INJECT_CONFIG,
} from '../src/components/component-provider/constants';
import type { ComponentVars } from '../src/components/component-provider';
import { flushPromises } from '@vue/test-utils';

describe('component-provider 注入配置', () => {
  // ----------------------------------------------------
  // VP-PC1 [判别]: getInjectConfig 未知 key 命中即缓存，多次调用返回同一 entry
  // ----------------------------------------------------
  it('VP-PC1 [判别]: getInjectConfig 未知 key 命中即缓存，多次调用返回同一 entry', () => {
    const first = getInjectConfig('widget-a');
    const second = getInjectConfig('widget-a');
    expect(second).toBe(first);
    expect(second.injectionKey).toBe(first.injectionKey);
    // 与 ensureInjectConfig 共享同一动态缓存
    expect(ensureInjectConfig('widget-a')).toBe(first);
  });

  // ----------------------------------------------------
  // VP-PC2 [判别]: 非字符串 component 共享同一 anonymous entry
  // ----------------------------------------------------
  it('VP-PC2 [判别]: 非字符串 component 共享同一 anonymous entry', () => {
    expect(getInjectConfig(undefined)).toBe(getInjectConfig(undefined));
    expect(getInjectConfig(123)).toBe(getInjectConfig(null));
    expect(getInjectConfig(null)).toBe(getInjectConfig(undefined));
  });

  // ----------------------------------------------------
  // VP-PC3 [判别]: Provider 自定义 componentVars key 的 provide 通道可被 getInjectConfig 命中
  // ----------------------------------------------------
  it('VP-PC3 [判别]: Provider 自定义 componentVars key 的 provide 通道可被 getInjectConfig 命中', () => {
    let injected: any;
    const Probe = defineComponent({
      setup() {
        const config = getInjectConfig('widget-b');
        injected = inject(config.injectionKey, null);
        return () => h('div');
      },
    });
    mount(ProComponentProvider, {
      props: { componentVars: { 'widget-b': { width: '120px' } } } as any,
      slots: { default: () => h(Probe) },
    });
    expect(injected).not.toBeNull();
    expect(injected.value).toEqual({ width: '120px' });
  });

  // ----------------------------------------------------
  // VP-PC4 [判别]: 不可注入键 form 在注入层静默剔除，运行期新增同样被剔除
  // ----------------------------------------------------
  it('VP-PC4 [判别]: 不可注入键 form 经注入层静默剔除，运行期新增同样被剔除且不产生告警', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let injected: any;
    const Probe = defineComponent({
      setup() {
        const config = INJECT_CONFIG['pro-form'];
        injected = inject(config.injectionKey, null);
        return () => h('div');
      },
    });
    const componentVars = ref<any>({
      'pro-form': { form: { marker: 'injected-form' }, inputAlign: 'left' },
    });
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            ProComponentProvider,
            { componentVars: componentVars.value },
            { default: () => h(Probe) }
          );
      },
    });
    const wrapper = mount(Host);
    await flushPromises();

    // form 被剔除，同项其余键照常注入
    expect(injected.value).not.toHaveProperty('form');
    expect(injected.value.inputAlign).toBe('left');
    // 静默：不可注入键不产生任何告警
    expect(warnSpy).not.toHaveBeenCalled();

    // 运行期再次变更：同样静默剔除
    componentVars.value = {
      'pro-form': { form: { marker: 'injected-form-2' }, inputAlign: 'right' },
    };
    await flushPromises();
    expect(injected.value).not.toHaveProperty('form');
    expect(injected.value.inputAlign).toBe('right');
    expect(warnSpy).not.toHaveBeenCalled();
    wrapper.unmount();
    warnSpy.mockRestore();

    // 类型面契约：form 不在 componentVars['pro-form'] 的可配置面内
    // @ts-expect-error form 不参与 ProForm 全局注入
    const providerVars: ComponentVars = { 'pro-form': { form: {} } };
    expect(Object.keys(providerVars['pro-form'] ?? {})).toEqual(['form']);

    // 默认值不含不可注入键
    expect(Object.keys(INJECT_CONFIG['pro-form'].default)).not.toContain(
      'form'
    );
  });

  // ----------------------------------------------------
  // CP-05 [判别]: 运行期新增的自定义组件 componentVars 键生效
  // ----------------------------------------------------
  it('CP-05 [判别]: 运行期新增 Custom 组件键的 componentVars 被子字段读取', async () => {
    const Probe = defineComponent({
      name: 'RuntimeVarsProbe',
      props: { placeholder: { type: String, default: '' } },
      setup(props) {
        return () =>
          h('div', {
            class: 'runtime-vars-probe',
            'data-placeholder': props.placeholder,
          });
      },
    });
    const form = useForm({ custom: '' }, [
      { path: 'custom', component: 'runtime-custom' },
    ] as any);
    const vars = ref<any>({});

    const Parent = defineComponent({
      setup: () => () =>
        h(
          ProComponentProvider,
          {
            componentVars: vars.value,
            componentMap: { 'runtime-custom': Probe },
          },
          { default: () => h(ProForm, { form }) }
        ),
    });

    const wrapper = mount(Parent, {
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(
      wrapper.find('.runtime-vars-probe').attributes('data-placeholder')
    ).toBe('');

    // 判别点：setup 期之后新增的自定义组件键同样下发到字段
    vars.value = { 'runtime-custom': { placeholder: '动态占位' } };
    await flushPromises();
    expect(
      wrapper.find('.runtime-vars-probe').attributes('data-placeholder')
    ).toBe('动态占位');

    wrapper.unmount();
  });
});
