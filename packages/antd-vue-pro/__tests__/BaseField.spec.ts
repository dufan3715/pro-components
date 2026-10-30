import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { flushPromises } from './helpers/mount';
import { Input, Switch } from 'ant-design-vue';

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
  // BF-D1 [判别]: 禁用优先级 字段 > 表单 > componentVars 默认值
  // ----------------------------------------------------
  it('BF-D1 [判别]: 表单未声明 disabled 时组件级默认值生效，表单/字段显式 false 可覆盖', async () => {
    const mountWithFormDisabled = (disabled?: boolean) => {
      const form = useForm({ enabled: true }, [
        { path: 'enabled', component: 'switch' },
      ]);
      return mount(ProComponentProvider, {
        props: { componentVars: { switch: { disabled: true } } as any },
        slots: {
          default: () =>
            h(ProForm, disabled === undefined ? { form } : { form, disabled }),
        },
        global: { stubs: { transition: false } },
      });
    };

    // ① 表单未声明 disabled：componentVars 的组件级默认值生效
    const inherited = mountWithFormDisabled();
    await flushPromises();
    expect(inherited.findComponent(Switch).props('disabled')).toBe(true);
    inherited.unmount();

    // ② 表单显式 disabled=false：覆盖组件级默认值
    const overridden = mountWithFormDisabled(false);
    await flushPromises();
    expect(overridden.findComponent(Switch).props('disabled')).toBe(false);
    overridden.unmount();

    // ③ 字段级 disabled=false：覆盖表单级禁用
    const fieldForm = useForm({ enabled: true }, [
      { path: 'enabled', component: 'switch', disabled: false },
    ]);
    const fieldWrapper = mount(ProForm, {
      props: { form: fieldForm, disabled: true },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(fieldWrapper.findComponent(Switch).props('disabled')).toBe(false);
    fieldWrapper.unmount();
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

  // ----------------------------------------------------
  // BF-B5 [判别]: 字段配置传入的 onUpdate:value 监听器与内部写值组合回放
  // ----------------------------------------------------
  it('BF-B5 [判别]: onUpdate:value 监听器在内部写值后回放，接收组件原始 emit 值', async () => {
    const received: any[] = [];
    const form = useForm({ name: '' }, [
      {
        path: 'name',
        component: 'input',
        'onUpdate:value': (val: any) => {
          received.push(val);
        },
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 直接从组件 emit 一次
    const aInput = wrapper.findComponent({ name: 'AInput' });
    expect(aInput.exists()).toBe(true);
    aInput.vm.$emit('update:value', '张三');
    await flushPromises();

    // 内部写值成功（组合而非替换）
    expect(form.getFormData('name')).toBe('张三');
    // 监听器回放组件原始 emit 值
    expect(received).toEqual(['张三']);

    wrapper.unmount();
  });
  // ----------------------------------------------------
  // BF-B10 [判别]: 旧值为原始类型时跳过深拷贝，直接引用传递
  // ----------------------------------------------------
  it('BF-B10 [判别]: 双参 formatter 旧值为原始类型（字符串/数字）时不触发 cloneDeep', async () => {
    // 大字符串：若仍走 cloneDeep（JSON 降级路径）则行为异常；原始值路径应为同引用传递
    const bigStr = 'x'.repeat(100000);
    const objOld = { deep: { n: 1 } };
    // 以 structuredClone 调用记录判定「是否发生深拷贝」，原始值不应出现在调用参数中
    const cloneSpy = vi.spyOn(globalThis, 'structuredClone');
    const noteOlds: any[] = [];
    const countCalls: Array<{ val: any; oldVal: any }> = [];
    const objOlds: any[] = [];
    const form = useForm({ note: bigStr, count: 3, obj: objOld }, [
      {
        path: 'note',
        component: 'input',
        valueFormatter: (val: any, oldVal: any) => {
          noteOlds.push(oldVal);
          return val;
        },
      },
      {
        path: 'count',
        component: 'input',
        valueFormatter: (val: any, oldVal: any) => {
          countCalls.push({ val, oldVal });
          // 原样写回，避免换算结果回写触发的额外更新
          return val;
        },
      },
      {
        path: 'obj',
        component: 'input',
        valueFormatter: (val: any, oldVal: any) => {
          objOlds.push(oldVal);
          // 原样写回入参，避免克隆结果回写触发的额外更新
          return val;
        },
      },
    ]);

    // 挂载期宿主控件可能把对象回写为字符串，故先取挂载前的对象代理引用作为「原引用」基线
    const objRaw = form.getFormData('obj');

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('typed');
    await flushPromises();

    // 判别点：首次写入拿到的旧值是原始大字符串本身，且未经 structuredClone 拷贝
    expect(noteOlds[0]).toBe(bigStr);
    expect(cloneSpy.mock.calls.some(call => Object.is(call[0], bigStr))).toBe(
      false
    );

    // 数字旧值同样零拷贝路径，且真实注入写入前的 formData 值
    const numericInput = inputs[1];
    await numericInput.setValue('7');
    await flushPromises();
    // 判别点：输入 '7' 的这次写入拿到写入前的旧值 3（旧的 `? 0 : 0` 死表达式无判别力）
    const typedCall = countCalls.find(call => String(call.val) === '7');
    expect({
      val: String(typedCall?.val),
      oldVal: Number(typedCall?.oldVal),
    }).toEqual({ val: '7', oldVal: 3 });

    // 判别点：引用类型旧值仍走深拷贝快照（反方向约束，防「一律不拷贝」的过度放松）
    await inputs[2].setValue('obj-typed');
    await flushPromises();
    expect(objOlds[0]).toEqual({ deep: { n: 1 } });
    expect(objOlds[0]).not.toBe(objRaw);
    expect(objOlds[0].deep).not.toBe((objRaw as any).deep);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-A15 [判别]: 控件 id 与 label[for] 关联，变更校验经 field-value-change 触发
  // ----------------------------------------------------
  it('BF-A15 [判别]: 输入控件 id 与 label[for] 关联，必填校验随值变更触发且无字段项收集告警', async () => {
    const warnSpy = vi.spyOn(console, 'warn');
    const form = useForm({ name: '' }, [
      {
        path: 'name',
        label: '姓名',
        component: 'input',
        rules: [{ required: true, message: '请输入姓名' }],
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const input = wrapper.find('input');
    const label = wrapper.find('label');
    expect(input.attributes('id')).toBeTruthy();
    expect(label.attributes('for')).toBe(input.attributes('id'));

    await input.setValue('x');
    await flushPromises();
    await input.setValue('');
    await flushPromises();
    await flushPromises();
    expect(wrapper.find('.ant-form-item-explain-error').exists()).toBe(true);
    expect(
      warnSpy.mock.calls.filter(args =>
        String(args[0]).includes('can only collect one field item')
      )
    ).toHaveLength(0);

    warnSpy.mockRestore();
    wrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // BF-A15b [判别]: 自定义控件同样经 field-value-change 触发校验；autoLink:false 时不自动校验
  // ----------------------------------------------------
  it('BF-A15b [判别]: 自定义控件变更校验经 field-value-change 触发，autoLink:false 时不自动校验', async () => {
    const CustomInput = defineComponent({
      name: 'CustomInput',
      props: { value: { type: String, default: '' } },
      emits: ['update:value'],
      setup(props, { emit }) {
        return () =>
          h('input', {
            class: 'custom-input',
            value: props.value,
            onInput: (e: any) => emit('update:value', e.target.value),
          });
      },
    });
    const fields = (extra: Record<string, any>) =>
      [
        {
          path: 'name',
          label: '姓名',
          component: CustomInput,
          rules: [{ required: true, message: '请输入姓名' }],
          ...extra,
        },
      ] as any;

    // 自定义控件不注入 FormItem 上下文，校验仍经字段事件回传触发
    const form = useForm({ name: '' }, fields({}));
    const wrapper = mount(ProForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    const input = wrapper.find('input.custom-input');
    expect(input.exists()).toBe(true);
    await input.setValue('x');
    await flushPromises();
    await input.setValue('');
    await flushPromises();
    await flushPromises();
    expect(wrapper.find('.ant-form-item-explain-error').exists()).toBe(true);
    wrapper.unmount();

    // autoLink: false 表示由用户自行校验，字段层不触发
    const noLinkForm = useForm({ name: '' }, fields({ autoLink: false }));
    const noLinkWrapper = mount(ProForm, {
      props: { form: noLinkForm },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    const noLinkInput = noLinkWrapper.find('input.custom-input');
    await noLinkInput.setValue('x');
    await flushPromises();
    await noLinkInput.setValue('');
    await flushPromises();
    expect(noLinkWrapper.find('.ant-form-item-explain-error').exists()).toBe(
      false
    );
    noLinkWrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // BF-A21 [判别]: 单次输入恰好触发一次校验（内置控件自报，不与字段事件通路叠加）
  // ----------------------------------------------------
  it('BF-A21 [判别]: 内置控件单次输入恰好校验一次，自定义控件仍由字段事件通路校验一次', async () => {
    let validators = 0;
    const rules = [
      {
        validator: () => {
          validators += 1;
          return Promise.resolve();
        },
      },
    ];

    const form = useForm({ name: '' }, [
      {
        path: 'name',
        label: '姓名',
        component: 'input',
        rules,
      },
    ]);
    const wrapper = mount(ProForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    validators = 0;
    const input = wrapper.find('input');
    (input.element as HTMLInputElement).value = 'x';
    await input.trigger('input');
    await flushPromises();
    // 判别点：内置控件自身向 FormItem 上报变更，字段事件通路不再重复回传
    expect(validators).toBe(1);
    expect(form.getFormData('name')).toBe('x');
    wrapper.unmount();

    // 反向约束：自定义控件不注入宿主上下文，仍由字段事件通路校验恰好一次
    const CustomInput = defineComponent({
      name: 'CustomInput',
      props: { value: { type: String, default: '' } },
      emits: ['update:value'],
      setup(props, { emit }) {
        return () =>
          h('input', {
            class: 'custom-input',
            value: props.value,
            onInput: (e: any) => emit('update:value', e.target.value),
          });
      },
    });
    const customForm = useForm({ name: '' }, [
      {
        path: 'name',
        label: '姓名',
        component: CustomInput,
        rules,
      },
    ] as any);
    const customWrapper = mount(ProForm, {
      props: { form: customForm },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    validators = 0;
    const customInput = customWrapper.find('input.custom-input');
    (customInput.element as HTMLInputElement).value = 'y';
    await customInput.trigger('input');
    await flushPromises();
    expect(validators).toBe(1);
    expect(customForm.getFormData('name')).toBe('y');
    customWrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // BF-A22 [判别]: 包装组件与 teleport 插槽内嵌宿主控件单次输入只校验一次
  // ----------------------------------------------------
  it('BF-A22 [判别]: 包装组件与插槽内的宿主控件单次输入各触发一次校验', async () => {
    let validators = 0;
    const rules = [
      {
        validator: () => {
          validators += 1;
          return Promise.resolve();
        },
      },
    ];

    const WrapperInput = defineComponent({
      name: 'WrapperInput',
      props: { value: { type: String, default: '' } },
      emits: ['update:value'],
      setup(props, { emit }) {
        return () =>
          h(Input, {
            class: 'wrapped-input',
            value: props.value,
            'onUpdate:value': (val: any) => emit('update:value', val),
          });
      },
    });

    const form = useForm({ name: '', slotField: '' }, [
      { path: 'name', label: '姓名', component: WrapperInput, rules },
      { path: 'slotField', label: '插槽', component: 'input', rules },
    ] as any);
    const wrapper = mount(ProForm, {
      props: { form },
      attachTo: document.body,
      slots: {
        slotField: (slotProps: any) =>
          h(Input, { ...slotProps, class: 'slot-input' }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    validators = 0;
    const wrapped = wrapper.find('input.wrapped-input');
    (wrapped.element as HTMLInputElement).value = 'a';
    await wrapped.trigger('input');
    await flushPromises();
    // 判别点：包装组件内部的 a-input 不再向宿主 FormItem 自报，仅字段事件通路校验一次
    expect(validators).toBe(1);
    expect(form.getFormData('name')).toBe('a');

    validators = 0;
    const slotted = wrapper.find('.slot-input input');
    (slotted.element as HTMLInputElement).value = 'b';
    await slotted.trigger('input');
    await flushPromises();
    expect(validators).toBe(1);
    expect(form.getFormData('slotField')).toBe('b');

    wrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // BF-A23 [判别]: formatter 归一化后存储值未变时不触发校验
  // ----------------------------------------------------
  it('BF-A23 [判别]: 尾空格 formatter 归一化回原值时跳过字段校验，实际变更才校验', async () => {
    let validators = 0;
    const form = useForm({ name: 'bob' }, [
      {
        path: 'name',
        label: '姓名',
        component: 'input',
        valueFormatter: (val: any) => String(val).trim(),
        rules: [
          {
            validator: () => {
              validators += 1;
              return Promise.resolve();
            },
          },
        ],
      },
    ]);
    const wrapper = mount(ProForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    validators = 0;
    const input = wrapper.find('input');
    await input.setValue('bob ');
    await flushPromises();
    // 判别点：格式化后仍为 bob，formData 未变，不应产生校验
    expect(validators).toBe(0);
    expect(form.getFormData('name')).toBe('bob');

    await input.setValue('alice');
    await flushPromises();
    expect(validators).toBe(1);
    expect(form.getFormData('name')).toBe('alice');

    wrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // BF-A24 [判别]: 同一 tick 多次值变更合并为一次校验，取最终值
  // ----------------------------------------------------
  it('BF-A24 [判别]: 同一 tick 连续两次写入合并为一次校验，校验取最终值', async () => {
    let validators = 0;
    const validatedValues: unknown[] = [];
    const EmitTwice = defineComponent({
      name: 'EmitTwice',
      props: { value: { type: String, default: '' } },
      emits: ['update:value'],
      setup(_, { emit }) {
        return () =>
          h(
            'button',
            {
              class: 'emit-twice',
              type: 'button',
              onClick: () => {
                emit('update:value', 'ab');
                emit('update:value', 'abc');
              },
            },
            'emit'
          );
      },
    });
    const form = useForm({ name: '' }, [
      {
        path: 'name',
        label: '姓名',
        component: EmitTwice,
        rules: [
          {
            validator: (_: any, value: unknown) => {
              validators += 1;
              validatedValues.push(value);
              return Promise.resolve();
            },
          },
        ],
      },
    ] as any);
    const wrapper = mount(ProForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    validators = 0;
    await wrapper.find('button.emit-twice').trigger('click');
    await flushPromises();
    expect(validators).toBe(1);
    expect(validatedValues).toEqual(['abc']);
    expect(form.getFormData('name')).toBe('abc');

    wrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // BF-A25 [判别]: 卸载后未发送的合并变更通知不再触发校验
  // ----------------------------------------------------
  it('BF-A25 [判别]: 输入后同一 tick 卸载，未发送的合并通知不再触发校验', async () => {
    let validators = 0;
    const CustomInput = defineComponent({
      name: 'UnmountValidationInput',
      props: { value: { type: String, default: '' } },
      emits: ['update:value'],
      setup(_, { emit }) {
        return () =>
          h('input', {
            class: 'unmount-validation-input',
            onInput: (event: Event) =>
              emit('update:value', (event.target as HTMLInputElement).value),
          });
      },
    });
    const form = useForm({ name: '' }, [
      {
        path: 'name',
        component: CustomInput,
        rules: [
          {
            validator: () => {
              validators += 1;
              return Promise.resolve();
            },
          },
        ],
      },
    ]);
    const wrapper = mount(ProForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    validators = 0;
    const input = wrapper.find('.unmount-validation-input');
    (input.element as HTMLInputElement).value = 'x';
    void input.trigger('input');
    wrapper.unmount();
    await flushPromises();

    expect(form.getFormData('name')).toBe('x');
    expect(validators).toBe(0);
    document.body.innerHTML = '';
  });
});
