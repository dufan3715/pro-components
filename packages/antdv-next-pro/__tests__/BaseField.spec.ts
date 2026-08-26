import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { flushPromises } from './helpers/mount';
import { Input, Switch } from '../src/shared/ui';

describe('BaseField 组件测试', () => {
  // ----------------------------------------------------
  // BF-B4 [判别]: ValueFormatter 旧值契约与形参探测
  // ----------------------------------------------------
  it('BF-B4 [判别]: 双参 formatter 接收写入前 formData 当前旧值；单参 formatter 不读取旧值', async () => {
    const capturedOldVals: any[] = [];
    let singleParamCalled = false;

    const form = useForm(
      {
        score: 80,
        name: 'alice',
      },
      [
        {
          path: 'score',
          component: 'input',
          valueFormatter: (val: any, oldVal: any) => {
            capturedOldVals.push(oldVal);
            return Number(val);
          },
        },
        {
          path: 'name',
          component: 'input',
          valueFormatter: (val: any) => {
            singleParamCalled = true;
            return String(val).trim();
          },
        },
      ]
    );

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    const inputs = wrapper.findAll('input');

    // 1. 测试双参 formatter：通过输入事件触发 set
    await inputs[0].setValue('95');
    await flushPromises();
    // 首次写操作捕获到的 oldVal 必须为输入前 formData 的真实旧值 80
    expect(capturedOldVals[0]).toBe(80);
    // 最终 formData 成功写入 95
    expect(form.getFormData('score')).toBe(95);

    // 2. 测试单参 formatter
    await inputs[1].setValue(' bob ');
    await flushPromises();
    expect(singleParamCalled).toBe(true);
    expect(form.getFormData('name')).toBe('bob');

    // 3. 测试引用类型：验证 oldVal 获得的是深拷贝副本，formatter 内部篡改不污染原数据
    const originalConfig = { mode: 'dark' };
    const formWithObj = useForm({ config: originalConfig }, [
      {
        path: 'config',
        component: 'input',
        valueFormatter: (val: any, oldVal: any) => {
          if (typeof oldVal === 'object' && oldVal !== null) {
            oldVal.mode = 'polluted'; // 故意修改 oldVal 副本
          }
          return val;
        },
      },
    ]);
    const wrapperObj = mount(ProForm, {
      props: { form: formWithObj },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    const inputObj = wrapperObj.find('input');
    await inputObj.setValue('new-val');
    await flushPromises();
    // 原始对象属性不受 formatter 内部变异影响
    expect(originalConfig.mode).toBe('dark');

    wrapper.unmount();
    wrapperObj.unmount();
  });

  // ----------------------------------------------------
  // BF-A14 [判别]: 未识别组件告警并降级为原生元素
  // ----------------------------------------------------
  it('BF-A14 [判别]: 未识别组件名时输出 console.warn 提示并渲染为原生元素', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const form = useForm({}, [
      { path: 'unknownField', component: 'unknown-custom-widget' as any },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // 关键判别点：捕获到了未识别组件警告
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('未识别的组件类型 "unknown-custom-widget"')
    );

    // 并且降级渲染了原生元素 <unknown-custom-widget>
    const fallbackEl = wrapper.find('unknown-custom-widget');
    expect(fallbackEl.exists()).toBe(true);

    warnSpy.mockRestore();
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-01: 组件解析优先级
  // ----------------------------------------------------
  it('BF-01: 组件解析优先级：插槽 > 自定义 componentMap > 内置组件', async () => {
    const CustomComponent = defineComponent({
      props: ['value'],
      setup: () => () =>
        h('div', { class: 'custom-provider-input' }, 'custom-comp'),
    });

    const form = useForm({ f1: 'slot-val', f2: 'custom-val' }, [
      { path: 'f1', component: 'input' },
      { path: 'f2', component: 'custom-alias' as any },
    ]);

    const wrapper = mount(ProComponentProvider, {
      props: {
        componentMap: { 'custom-alias': CustomComponent } as any,
      },
      slots: {
        default: () =>
          h(
            ProForm,
            { form },
            {
              f1: () => h('div', { class: 'teleport-slot-f1' }, 'slot-comp'),
            }
          ),
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // f1 命中插槽（优先级最高）
    expect(wrapper.find('.teleport-slot-f1').exists()).toBe(true);
    // f2 命中 ProComponentProvider 的自定义 componentMap
    expect(wrapper.find('.custom-provider-input').exists()).toBe(true);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-02: v-model 深路径绑定与回显
  // ----------------------------------------------------
  it('BF-02: 支持深路径双向绑定与初始值回显', async () => {
    const form = useForm({ info: { user: { age: 18 } } }, [
      { path: 'info.user.age', component: 'input-number' },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    expect(form.getFormData('info.user.age')).toBe(18);

    form.setFormData('info.user.age', 25);
    await flushPromises();
    expect(form.getFormData('info.user.age')).toBe(25);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-03: valueFormatter.get 转换
  // ----------------------------------------------------
  it('BF-03: valueFormatter.get 正确转换展示值', async () => {
    const form = useForm({ dateTimestamp: 1609459200000 }, [
      {
        path: 'dateTimestamp',
        component: 'input',
        valueFormatter: {
          get: (val: number) => `Formatted:${val}`,
          set: (val: string) => Number(val.replace('Formatted:', '')),
        },
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const input = wrapper.find('input');
    expect((input.element as HTMLInputElement).value).toBe(
      'Formatted:1609459200000'
    );
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-04: switch 组件绑定 checked 而非 value
  // ----------------------------------------------------
  it('BF-04: component="switch" 时绑定 checked 属性', async () => {
    const form = useForm({ enabled: true }, [
      { path: 'enabled', component: 'switch' },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const switchComp = wrapper.findComponent(Switch);
    expect(switchComp.props('checked')).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-05: disabled 优先级 (attrs.disabled > parentDisabled > initProps)
  // ----------------------------------------------------
  it('BF-05: 字段显式 disabled 优先级高于表单级 disabled', async () => {
    const form = useForm({}, [
      { path: 'fieldDisabledFalse', component: 'input', disabled: false },
      { path: 'fieldDefault', component: 'input' },
    ]);

    const wrapper = mount(ProForm, {
      props: {
        form,
        disabled: true, // 表单级全局禁用
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const inputs = wrapper.findAllComponents(Input);
    // fieldDisabledFalse 显式声明 disabled: false，应覆盖父级的 true
    expect(inputs[0].props('disabled')).toBe(false);
    // fieldDefault 跟随父级的全局禁用
    expect(inputs[1].props('disabled')).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-06: 占位符兜底
  // ----------------------------------------------------
  it('BF-06: input 字段未配置 placeholder 时自动兜底「请输入」提示', async () => {
    const form = useForm({}, [
      { path: 'nickName', label: '昵称', component: 'input' },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const inputComp = wrapper.findComponent(Input);
    expect(inputComp.props('placeholder')).toBe('请输入');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-07: 属性剥离 (extraProps 不落入 DOM)
  // ----------------------------------------------------
  it('BF-07: extraProps 与非 DOM 属性被干净剥离，不落入 HTML 属性', async () => {
    const form = useForm({}, [
      {
        path: 'account',
        component: 'input',
        extraProps: { internalTag: 'test-123', secret: true },
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const inputEl = wrapper.find('input');
    expect(inputEl.attributes('extraprops')).toBeUndefined();
    expect(inputEl.attributes('internaltag')).toBeUndefined();
    wrapper.unmount();
  });
});
