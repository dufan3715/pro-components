import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import BaseField from '../src/components/form/components/BaseField/index.vue';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { Field as VanField, Switch } from '../src/shared/ui';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import {
  INJECT_COMPONENTS,
  INJECT_CONFIG,
} from '../src/components/component-provider/constants';
import { InjectionFormKey } from '../src/components/form/constants';

describe('BaseField 组件测试 (vant-pro)', () => {
  // ----------------------------------------------------
  // VP-B4 [判别]: ValueFormatter 双参/单参旧值读取契约
  // ----------------------------------------------------
  it('VP-B4 [判别]: 双参 formatter 接收写入前 formData 当前旧值；单参 formatter 不读取旧值', async () => {
    let capturedOldValInTwoArg: any = null;
    let singleArgFormatterCalledWith: any = null;

    const twoArgFormatter = vi.fn((newVal: any, oldVal: any) => {
      capturedOldValInTwoArg = oldVal;
      return `formatted_${newVal}`;
    });

    const singleArgFormatter = vi.fn((newVal: any) => {
      singleArgFormatterCalledWith = newVal;
      return `single_${newVal}`;
    });

    const form = useForm({
      twoArgField: 'initialTwo',
      singleArgField: 'initialSingle',
    });

    // 1. 测试双参 formatter
    const wrapper1 = mount(BaseField, {
      props: {
        path: 'twoArgField',
        component: 'field',
      },
      attrs: {
        valueFormatter: twoArgFormatter,
      },
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
        },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    const input1 = wrapper1.find('input');
    await input1.setValue('updatedTwo');
    await flushPromises();

    expect(twoArgFormatter).toHaveBeenCalled();
    expect(twoArgFormatter.length).toBe(2);
    expect(capturedOldValInTwoArg).toBe('initialTwo');
    expect(form.getFormData('twoArgField')).toBe('formatted_updatedTwo');
    wrapper1.unmount();

    // 2. 测试单参 formatter
    const wrapper2 = mount(BaseField, {
      props: {
        path: 'singleArgField',
        component: 'field',
      },
      attrs: {
        valueFormatter: singleArgFormatter,
      },
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
        },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    const input2 = wrapper2.find('input');
    await input2.setValue('updatedSingle');
    await flushPromises();

    expect(singleArgFormatter).toHaveBeenCalled();
    expect(singleArgFormatter.length).toBe(1);
    expect(singleArgFormatterCalledWith).toBe('updatedSingle');
    expect(form.getFormData('singleArgField')).toBe('single_updatedSingle');
    wrapper2.unmount();
  });

  // ----------------------------------------------------
  // VP-A14 [判别]: 未识别组件 warn
  // ----------------------------------------------------
  it('VP-A14 [判别]: 未识别组件名时输出 console.warn 提示并渲染为原生元素', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const form = useForm({ testKey: 'val' });

    const wrapper = mount(BaseField, {
      props: {
        path: 'testKey',
        component: 'unknown-vant-widget',
      },
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
        },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '[pro-components] 未识别的组件类型 "unknown-vant-widget"'
      )
    );
    expect(wrapper.find('unknown-vant-widget').exists()).toBe(true);

    warnSpy.mockRestore();
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-01: 组件解析优先级
  // ----------------------------------------------------
  it('BF-01: 组件解析优先级：插槽 > 自定义 componentMap > 内置组件', async () => {
    const CustomComponent = defineComponent({
      name: 'CustomVantComp',
      template: '<div class="custom-vant-rendered">CustomVant</div>',
    });

    const form = useForm({ field1: 'val' });

    const wrapper = mount(BaseField, {
      props: {
        path: 'field1',
        component: 'custom-type',
      },
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
          [INJECT_COMPONENTS as symbol]: {
            'custom-type': CustomComponent,
          },
        },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    expect(wrapper.find('.custom-vant-rendered').exists()).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-02: 深路径双向绑定与初始值回显
  // ----------------------------------------------------
  it('BF-02: 支持深路径双向绑定与初始值回显', async () => {
    const form = useForm({
      deep: { nested: { title: 'Deep Title' } },
    });

    const wrapper = mount(BaseField, {
      props: {
        path: 'deep.nested.title',
        component: 'field',
      },
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
        },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    const input = wrapper.find('input');
    expect((input.element as HTMLInputElement).value).toBe('Deep Title');

    await input.setValue('New Deep Title');
    await flushPromises();
    expect(form.getFormData('deep.nested.title')).toBe('New Deep Title');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-03: valueFormatter.get
  // ----------------------------------------------------
  it('BF-03: valueFormatter.get 正确转换展示值', async () => {
    const form = useForm({ price: 100 });

    const wrapper = mount(BaseField, {
      props: {
        path: 'price',
        component: 'field',
      },
      attrs: {
        valueFormatter: {
          get: (val: number) => `¥${val}`,
          set: (val: string) => Number(val.replace('¥', '')),
        },
      },
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
        },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    const input = wrapper.find('input');
    expect((input.element as HTMLInputElement).value).toBe('¥100');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-04: 字段显式 disabled 支持
  // ----------------------------------------------------
  it('BF-04: 字段支持显式配置 disabled', async () => {
    const form = useForm({}, [
      { path: 'fieldDisabled', component: 'field', disabled: true },
      { path: 'fieldEnabled', component: 'field', disabled: false },
    ]);

    const wrapper = mount(ProForm, {
      props: {
        form,
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const fields = wrapper.findAllComponents(VanField);
    expect(fields[0].props('disabled')).toBe(true);
    expect(fields[1].props('disabled')).toBe(false);
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
  // BF-15 [判别]: 字段级 disabled 的字符串形态与宿主 Boolean prop 真值一致
  // ----------------------------------------------------
  it('BF-15 [判别]: 字段级 disabled 按宿主规则归一，null/undefined 回落 Provider 注入值', async () => {
    const form = useForm({ count: 1 });
    const mountField = (disabled: unknown) =>
      mount(BaseField, {
        props: { path: 'count', component: 'stepper', disabled } as any,
        global: {
          provide: {
            [InjectionFormKey as symbol]: form,
            [INJECT_CONFIG.stepper.injectionKey as symbol]: { disabled: true },
          },
          stubs: { transition: false },
        },
      });

    const cases: Array<[unknown, boolean]> = [
      // 裸属性形态（''）与同名属性形态按宿主规则为 true
      ['', true],
      ['disabled', true],
      // 其余字符串取真值（与宿主 Boolean prop 一致）
      ['false', true],
      ['0', true],
      [true, true],
      [false, false],
      // 未提供时回落 Provider 注入值
      [undefined, true],
      [null, true],
    ];

    for (const [input, expected] of cases) {
      const wrapper = mountField(input);
      await flushPromises();
      expect(
        wrapper.findComponent({ name: 'VanStepper' }).props('disabled'),
        `disabled=${String(input)}`
      ).toBe(expected);
      wrapper.unmount();
    }
  });

  // ----------------------------------------------------
  // BF-16 [判别]: 原生元素回退可按 value 回显并回写
  // ----------------------------------------------------
  it('BF-16 [判别]: component 为原生元素时回显 formData 并回写输入值', async () => {
    const form = useForm({ keyword: 'abc' });
    const wrapper = mount(BaseField, {
      props: {
        path: 'keyword',
        component: 'input',
        placeholder: '请输入关键字',
      } as any,
      global: {
        provide: { [InjectionFormKey as symbol]: form },
        stubs: { transition: false },
      },
    });
    await flushPromises();

    const input = wrapper.find('input');
    // 判别点：原生元素分支按 value 回显，而非生成 modelvalue 属性
    expect((input.element as HTMLInputElement).value).toBe('abc');
    expect(input.attributes('modelvalue')).toBeUndefined();

    await input.setValue('def');
    await flushPromises();
    expect(form.getFormData('keyword')).toBe('def');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-05: 占位符兜底
  // ----------------------------------------------------
  it('BF-05: field 字段未配置 placeholder 时自动兜底「请输入」提示', async () => {
    const form = useForm({});
    const wrapper = mount(BaseField, {
      props: {
        path: 'testInput',
        component: 'field',
      },
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
        },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    const fieldComp = wrapper.findComponent(VanField);
    expect(fieldComp.props('placeholder')).toBe('请输入');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-V7 [判别]: 弹层选择器打开时，向 open 传递与内联分支一致的控件侧取值（已应用 valueFormatter.get）
  // ----------------------------------------------------
  it('VP-V7 [判别]: 弹层选择器打开时，向 open 传递与内联分支一致的控件侧取值', async () => {
    const form = useForm(
      {
        tags: 'a,b',
      },
      [
        {
          path: 'tags',
          component: 'picker',
          popup: true,
          columns: [
            { text: 'A', value: 'a' },
            { text: 'B', value: 'b' },
            { text: 'C', value: 'c' },
          ],
          displayFormatter: (val: string[]) => val.join('、'),
          valueFormatter: {
            get: (val: string) => val.split(','),
            set: (val: string[]) => val.join(','),
          },
        },
      ]
    );

    const wrapper = mount(ProForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    const field = wrapper.findComponent(VanField);
    // 内联展示值取自 get 变换后的数组
    expect(field.props('modelValue')).toBe('a、b');

    // 触发点击打开弹层
    await field.trigger('click');
    await flushPromises();

    // 判别断言：弹层初值同样为 get 变换后的数组，而非 formData 中的原始字符串 'a,b'
    expect(form.formPopup.popupFieldValue.value).toEqual(['a', 'b']);
    expect(
      wrapper.findComponent({ name: 'VanPicker' }).props('modelValue')
    ).toEqual(['a', 'b']);

    // 往返对称：弹层确认值经 value setter 还原为 formData 原始形态
    form.formPopup.popupFieldValue.value = ['a', 'b', 'c'];
    const computedProps = (
      wrapper.findComponent({ name: 'BaseField' }).vm as any
    ).getComponentComputedProps();
    computedProps.onConfirm?.();
    await flushPromises();
    expect(form.getFormData('tags')).toBe('a,b,c');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-V9 [判别]: Signature 组件的取消事件正确映射为 onClear
  // ----------------------------------------------------
  it('VP-V9 [判别]: Signature 组件的取消事件正确映射为 onClear', async () => {
    const form = useForm(
      {
        sign: '',
      },
      [
        {
          path: 'sign',
          component: 'signature',
          popup: true,
        },
      ]
    );

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false, teleport: true } },
    });

    await flushPromises();

    form.formPopup.open('sign', '');
    expect(form.formPopup.visible.value).toBe(true);

    const fieldComp = wrapper.findComponent({ name: 'BaseField' });
    const computedProps = (fieldComp.vm as any).getComponentComputedProps();

    // 触发 onClear 应关闭弹层
    computedProps.onClear?.();
    await flushPromises();

    expect(form.formPopup.visible.value).toBe(false);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-B5 [判别]: 字段配置传入的 onUpdate:modelValue 监听器与内部写值组合回放
  // ----------------------------------------------------
  it('VP-B5 [判别]: onUpdate:modelValue 监听器在内部写值后回放，接收组件原始 emit 值', async () => {
    const received: any[] = [];
    const form = useForm({ name: '' }, [
      {
        path: 'name',
        component: 'field',
        'onUpdate:modelValue': (val: any) => {
          received.push(val);
        },
      } as any,
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    await wrapper.find('input').setValue('张三');
    await flushPromises();

    // 内部写值成功（组合而非替换）
    expect(form.getFormData('name')).toBe('张三');
    // 监听器回放组件原始 emit 值
    expect(received).toEqual(['张三']);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-B6 [判别]: popup 字段可被 vant Form 按 name 寻址校验
  // ----------------------------------------------------
  it('VP-B6 [判别]: popup 字段支持 formRef.validate(path) 按名校验与 resetValidation(path) 重置', async () => {
    const form = useForm({ city: '' }, [
      {
        path: 'city',
        component: 'cascader',
        popup: true,
        rules: [{ required: true, message: '请选择城市' }],
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 判别点：popup 字段以 name 参与 vant Form 寻址，validate('city') 按名命中并以 { name, message } 拒绝
    await expect(form.formRef.value?.validate('city')).rejects.toMatchObject({
      message: '请选择城市',
    });
    await flushPromises();
    // 校验错误信息回显在该字段上
    expect(wrapper.text()).toContain('请选择城市');

    // 按名重置校验状态
    form.formRef.value?.resetValidation('city');
    await flushPromises();
    expect(wrapper.text()).not.toContain('请选择城市');

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
        component: 'field',
        valueFormatter: (val: any, oldVal: any) => {
          noteOlds.push(oldVal);
          return val;
        },
      },
      {
        path: 'count',
        component: 'field',
        valueFormatter: (val: any, oldVal: any) => {
          countCalls.push({ val, oldVal });
          // 原样写回，避免换算结果回写触发的额外更新
          return val;
        },
      },
      {
        path: 'obj',
        component: 'field',
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
  // VP-F13a [判别]: Signature 弹层确认时经 submit 事件载荷把签名图写入 formData
  // ----------------------------------------------------
  it('VP-F13a [判别]: Signature 弹层确认后，签名图数据经 submit 载荷写入 formData（非弹层初值）', async () => {
    const form = useForm({ sign: '' }, [
      { path: 'sign', component: 'signature', popup: true },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false, teleport: true } },
    });
    await flushPromises();

    // 打开弹层（模拟业务点击字段）
    form.formPopup.open('sign', 'old-base64');
    await flushPromises();

    const fieldComp = wrapper.findComponent({ name: 'BaseField' });
    const computedProps = (fieldComp.vm as any).getComponentComputedProps();

    // 模拟 Signature emit submit：{ image, canvas } 载荷
    computedProps.onSubmit?.({ image: 'NEW-SIGN-BASE64', canvas: {} });
    await flushPromises();

    // 判别点：formData 收到 submit 载荷的 image，而非弹层初值（旧实现恒写回初值）
    expect(form.getFormData('sign')).toBe('NEW-SIGN-BASE64');
    expect(form.formPopup.visible.value).toBe(false);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-F13b [判别]: 内联（非弹层）Picker 类字段绑定 model-value 供 VanField 校验取值
  // ----------------------------------------------------
  it('VP-F13b [判别]: 内联选择器字段的 VanField 收到 model-value，校验可取到真实值', async () => {
    // vant DatePicker 的 modelValue 为列值数组
    const form = useForm({ date: ['2026', '9', '4'] }, [
      { path: 'date', component: 'date-picker' },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const vanField = wrapper.findComponent(VanField);
    // 判别点：VanField 收到 model-value（vant DatePicker 归一为补零列值）
    expect(vanField.props('modelValue')).toEqual(['2026', '09', '04']);

    const newDate = ['2027', '01', '02'];
    form.setFormData('date', newDate);
    await flushPromises();
    expect(vanField.props('modelValue')).toEqual(newDate);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-F13c [判别]: 字段配置的事件监听仅绑内层组件，外层 VanField 不重复绑定
  // ----------------------------------------------------
  it('VP-F13c [判别]: on 开头的字段事件不进入外层 VanField，避免冒泡类事件双触发', async () => {
    let clickCount = 0;
    const form = useForm({ flag: false }, [
      {
        path: 'flag',
        component: 'switch',
        onClick: () => {
          clickCount++;
        },
      } as any,
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const vanField = wrapper.findComponent(VanField);
    // 判别点：onClick 只绑内层 Switch，外层 VanField 不携带
    expect((vanField.props() as any).onClick).toBeUndefined();
    expect((vanField.vm as any).$.attrs.onClick).toBeUndefined();

    // 内层组件的事件仍然生效
    const switchComp = wrapper.findComponent({ name: 'VanSwitch' });
    await switchComp.trigger('click');
    expect(clickCount).toBe(1);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-06 [判别]: componentClass / componentStyle 落到内层组件且不作为 attrs 泄漏
  // ----------------------------------------------------
  it('BF-06 [判别]: componentClass / componentStyle 作用于内层组件且不透传为 DOM 属性', async () => {
    const CustomComponent = defineComponent({
      name: 'CustomStyledComp',
      props: { modelValue: { type: String, default: '' } },
      emits: ['update:modelValue'],
      setup() {
        return () => h('div', { class: 'styled-root' }, 'styled');
      },
    });
    const form = useForm({ testKey: '' });

    const wrapper = mount(BaseField, {
      props: {
        path: 'testKey',
        component: CustomComponent,
        componentClass: 'custom-cls',
        componentStyle: { color: 'red' },
      },
      global: {
        provide: { [InjectionFormKey as symbol]: form },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    const root = wrapper.find('.styled-root');
    expect(root.exists()).toBe(true);
    expect(root.classes()).toContain('custom-cls');
    expect(root.attributes('style')).toContain('color: red');
    expect(root.attributes()).not.toHaveProperty('componentclass');
    expect(root.attributes()).not.toHaveProperty('componentstyle');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-07 [判别]: component 为 field 时 fieldClass / fieldStyle 作用于 van-field 根节点
  // ----------------------------------------------------
  it('BF-07 [判别]: component 为 field 时 fieldClass / fieldStyle 生效，与 VanField 分支一致', async () => {
    const form = useForm({ testKey: '' });

    const wrapper = mount(BaseField, {
      props: {
        path: 'testKey',
        component: 'field',
        fieldClass: 'field-cls',
        fieldStyle: { color: 'blue' },
      },
      global: {
        provide: { [InjectionFormKey as symbol]: form },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    const fieldEl = wrapper.findComponent(VanField).element as HTMLElement;
    expect(fieldEl.classList.contains('field-cls')).toBe(true);
    expect(fieldEl.getAttribute('style')).toContain('color: blue');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-08 [判别]: 四类 class/style 分别落到外层 van-field 与内层控件
  // ----------------------------------------------------
  it('BF-08 [判别]: fieldClass/fieldStyle 落外层 van-field，componentClass/componentStyle 落内层控件', async () => {
    const form = useForm({ count: 2 }, [
      {
        path: 'count',
        component: 'stepper',
        fieldClass: 'field-cls',
        fieldStyle: { color: 'red' },
        componentClass: 'comp-cls',
        componentStyle: { margin: '4px' },
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const vanField = wrapper.findComponent(VanField);
    expect(vanField.classes()).toContain('field-cls');
    expect(vanField.attributes('style')).toContain('color: red');

    const stepper = wrapper.findComponent({ name: 'VanStepper' });
    expect(stepper.exists()).toBe(true);
    expect(stepper.classes()).toContain('comp-cls');
    expect(stepper.attributes('style')).toContain('margin: 4px');

    // 判别点：两类 class/style 各归其位，不互相串层
    expect(vanField.classes()).not.toContain('comp-cls');
    expect(stepper.classes()).not.toContain('field-cls');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-09 [判别]: Field 层专有键不下发内层控件 DOM
  // ----------------------------------------------------
  it('BF-09 [判别]: Field 层专有键不降级为内层控件 DOM 属性，控件声明的键仍按 prop 保留', async () => {
    const form = useForm({ city: ['Hangzhou'], count: 1 }, [
      {
        path: 'city',
        component: 'picker',
        label: '城市',
        rules: [{ required: true, message: '请选择城市' }],
        columns: [{ text: '杭州', value: 'Hangzhou' }],
        popup: true,
      },
      {
        path: 'count',
        component: 'stepper',
        label: '数量',
        placeholder: '请输入数量',
        max: 9,
        disabled: true,
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const fieldList = wrapper.findAllComponents(VanField);
    // Field 层承接 label / rules
    expect(fieldList[0].props('label')).toBe('城市');
    expect(fieldList[0].props('rules')).toEqual([
      { required: true, message: '请选择城市' },
    ]);

    // 打开弹层后检查内层 Picker 根节点
    await fieldList[0].trigger('click');
    await flushPromises();
    const pickerEl = wrapper.findComponent({ name: 'VanPicker' })
      .element as HTMLElement;
    expect(pickerEl.classList.contains('van-picker')).toBe(true);
    // 判别点：Field 层专有键不落为控件根节点属性
    expect(pickerEl.hasAttribute('label')).toBe(false);
    expect(pickerEl.hasAttribute('rules')).toBe(false);
    expect(pickerEl.hasAttribute('disabled')).toBe(false);

    // 反向约束：控件同样声明的键仍以 prop 形式保留，且不落为 DOM 属性
    const stepper = wrapper.findComponent({ name: 'VanStepper' });
    expect(stepper.props('placeholder')).toBe('请输入数量');
    expect(stepper.props('max')).toBe(9);
    expect(stepper.props('disabled')).toBe(true);
    const stepperEl = stepper.element as HTMLElement;
    expect(stepperEl.hasAttribute('label')).toBe(false);
    expect(stepperEl.hasAttribute('placeholder')).toBe(false);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-10 [判别]: 数组式 props 声明的控件保留自己声明的 Field 层同名键
  // ----------------------------------------------------
  it('BF-10 [判别]: 数组式 props 声明的控件仍按 prop 收到自己声明的键', async () => {
    const ArrayPropsComp = defineComponent({
      name: 'ArrayPropsComp',
      props: ['modelValue', 'disabled', 'placeholder'],
      setup() {
        return () => h('div', { class: 'arr-props-root' });
      },
    });

    const form = useForm({ count: 2 });
    const wrapper = mount(BaseField, {
      props: {
        path: 'count',
        component: ArrayPropsComp,
        disabled: true,
        placeholder: '请输入数量',
        label: '数量',
        rules: [{ required: true, message: '请填写数量' }],
      },
      global: {
        provide: { [InjectionFormKey as symbol]: form },
        stubs: { transition: false },
      },
    });
    await flushPromises();

    const comp = wrapper.findComponent(ArrayPropsComp);
    // 判别点：数组式声明面同样生效（旧实现按 Object.keys(['disabled']) 取到 ['0'] 而全删）
    expect(comp.props('modelValue')).toBe(2);
    expect(comp.props('disabled')).toBe(true);
    expect(comp.props('placeholder')).toBe('请输入数量');
    // 契约：控件未声明的 label / rules 以 attrs 落到根节点，由控件自行消费
    const root = wrapper.find('.arr-props-root');
    expect(root.attributes('label')).toBe('数量');
    expect(root.attributes('rules')).toBeDefined();

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-11 [判别]: 原生元素回退路径保留 DOM 属性，字段层专有键不外泄
  // ----------------------------------------------------
  it('BF-11 [判别]: 未注册字符串组件回退为原生元素时保留 placeholder/disabled/type', async () => {
    const form = useForm({ keyword: 'abc' });
    const wrapper = mount(BaseField, {
      props: {
        path: 'keyword',
        component: 'input',
        type: 'tel',
        placeholder: '请输入关键字',
        disabled: true,
        label: '关键字',
        rules: [{ required: true, message: '请填写关键字' }],
      },
      global: {
        provide: { [InjectionFormKey as symbol]: form },
        stubs: { transition: false },
      },
    });
    await flushPromises();

    const input = wrapper.find('input');
    // 判别点：原生元素无 props 声明面，DOM 属性仍下发（旧实现被当作 Field 专有键剔除）
    expect(input.attributes('type')).toBe('tel');
    expect(input.attributes('placeholder')).toBe('请输入关键字');
    expect(input.attributes('disabled')).toBeDefined();
    // 反向约束：字段层专有键不外泄为原生元素属性
    expect(input.attributes('label')).toBeUndefined();
    expect(input.attributes('rules')).toBeUndefined();

    // 外层 van-field 仍按 Field 层承接 label / rules
    const vanField = wrapper.findComponent(VanField);
    expect(vanField.props('label')).toBe('关键字');
    expect(vanField.props('rules')).toEqual([
      { required: true, message: '请填写关键字' },
    ]);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-12 [判别]: type 例外收窄——控件未声明的 type 不下发内层控件
  // ----------------------------------------------------
  it('BF-12 [判别]: 内层控件未声明的 type 不下发，field 组件的 type 仍生效', async () => {
    const form = useForm({ city: ['Hangzhou'], keyword: '' }, [
      {
        path: 'city',
        component: 'picker',
        popup: true,
        type: 'tel',
        columns: [{ text: '杭州', value: 'Hangzhou' }],
      } as any,
      { path: 'keyword', component: 'field', type: 'tel' },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    await wrapper.findAllComponents(VanField)[0].trigger('click');
    await flushPromises();
    const pickerEl = wrapper.findComponent({ name: 'VanPicker' })
      .element as HTMLElement;
    expect(pickerEl.classList.contains('van-picker')).toBe(true);
    // 判别点：Picker 未声明 type，Field 层的 type 不得泄漏为内层控件 DOM 属性
    expect(pickerEl.hasAttribute('type')).toBe(false);

    // 反向约束：component 为 field 时 type 仍按 VanField 的 prop 生效
    const fieldInput = wrapper.findAllComponents(VanField)[1].find('input');
    expect(fieldInput.attributes('type')).toBe('tel');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-13 [判别]: 无 props 声明面的自定义控件整体接收 Field 层属性
  // ----------------------------------------------------
  it('BF-13 [判别]: 无声明面的自定义控件接收 disabled/readonly/placeholder/label/rules', async () => {
    const NoPropsComponent = defineComponent({
      name: 'NoPropsComponent',
      setup(_, { attrs }) {
        return () =>
          h('div', {
            class: 'no-props-root',
            'data-disabled': String(attrs.disabled),
            'data-readonly': String(attrs.readonly),
            'data-placeholder': String(attrs.placeholder),
            'data-maxlength': String(attrs.maxlength),
            'data-label': String(attrs.label),
            'data-has-rules': String(Array.isArray(attrs.rules)),
          });
      },
    });

    const form = useForm({ custom: 'abc' });
    const wrapper = mount(BaseField, {
      props: {
        path: 'custom',
        component: NoPropsComponent,
        disabled: true,
        readonly: true,
        placeholder: '请输入自定义值',
        maxlength: 8,
        label: '自定义',
        rules: [{ required: true, message: '必填' }],
      } as any,
      global: {
        provide: { [InjectionFormKey as symbol]: form },
        stubs: { transition: false },
      },
    });
    await flushPromises();

    // 判别点：无声明面控件不再被当作 Field 专有键剔除
    const root = wrapper.find('.no-props-root');
    expect(root.attributes('data-disabled')).toBe('true');
    expect(root.attributes('data-readonly')).toBe('true');
    expect(root.attributes('data-placeholder')).toBe('请输入自定义值');
    expect(root.attributes('data-maxlength')).toBe('8');
    // 契约：Field 层属性（label / rules）整体透传，由控件自行渲染
    expect(root.attributes('data-label')).toBe('自定义');
    expect(root.attributes('data-has-rules')).toBe('true');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-17 [判别]: ProForm 自定义字段下发 label/rules，由控件自行渲染
  // ----------------------------------------------------
  it('BF-17 [判别]: ProForm 自定义字段把 label/rules 透传给控件，不额外渲染 label', async () => {
    const Probe = defineComponent({
      name: 'ProFormCustomProbe',
      props: {
        modelValue: { default: undefined },
        path: { type: String, default: 'MISSING' },
      },
      setup(props, { attrs }) {
        return () =>
          h('div', {
            class: 'proform-custom-probe',
            'data-label': String(attrs.label),
            'data-has-rules': String(Array.isArray(attrs.rules)),
            'data-path': props.path,
          });
      },
    });

    const form = useForm({ code: '' }, [
      {
        path: 'code',
        label: '验证码',
        rules: [{ required: true, message: '请输入验证码' }],
        component: Probe,
      } as any,
    ]);
    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const probe = wrapper.find('.proform-custom-probe');
    // 判别点：Field 层属性透传到自定义控件
    expect(probe.attributes('data-label')).toBe('验证码');
    expect(probe.attributes('data-has-rules')).toBe('true');
    // 契约：自定义组件收到字段路径
    expect(probe.attributes('data-path')).toBe('code');
    // 标签由自定义控件负责渲染，ProForm 不再额外生成 label 元素
    expect(wrapper.findAll('label')).toHaveLength(0);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-18 [判别]: 原生回退合并用户事件监听器
  // ----------------------------------------------------
  it('BF-18 [判别]: 原生回退保留用户 onInput/onChange，同时正常回写字段值', async () => {
    const userInput = vi.fn();
    const userChange = vi.fn();
    const form = useForm({ keyword: '' }, [
      {
        path: 'keyword',
        component: 'input',
        onInput: userInput,
        onChange: userChange,
      } as any,
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const input = wrapper.find('input');
    const inputEl = input.element as HTMLInputElement;
    inputEl.value = 'ab';
    await input.trigger('input');

    // 判别点：用户监听器与内部写值并存，不再被覆盖
    expect(userInput).toHaveBeenCalledTimes(1);
    expect(userInput.mock.calls[0][0]).toBeInstanceOf(Event);
    expect(form.getFormData('keyword')).toBe('ab');

    inputEl.value = 'abc';
    await input.trigger('change');
    expect(userChange).toHaveBeenCalledTimes(1);
    // 反身约束：change 不重复触发用户的 input 监听器
    expect(userInput).toHaveBeenCalledTimes(1);
    expect(form.getFormData('keyword')).toBe('abc');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BF-14 [判别]: componentMap 覆盖与 ProForm 插槽同样保留 Field 层属性
  // ----------------------------------------------------
  it('BF-14 [判别]: componentMap 覆盖项与 ProForm 插槽保留 Field 层属性', async () => {
    const OverrideComponent = defineComponent({
      name: 'OverrideComponent',
      setup(_, { attrs }) {
        return () =>
          h('div', {
            class: 'override-root',
            'data-disabled': String(attrs.disabled),
            'data-placeholder': String(attrs.placeholder),
          });
      },
    });

    const form = useForm({ custom: 'abc' });
    const wrapper = mount(BaseField, {
      props: {
        path: 'custom',
        component: 'custom-control',
        disabled: true,
        placeholder: '覆盖组件占位',
      } as any,
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
          [INJECT_COMPONENTS as symbol]: {
            'custom-control': OverrideComponent,
          },
        },
        stubs: { transition: false },
      },
    });
    await flushPromises();

    const overrideRoot = wrapper.find('.override-root');
    expect(overrideRoot.attributes('data-disabled')).toBe('true');
    expect(overrideRoot.attributes('data-placeholder')).toBe('覆盖组件占位');
    wrapper.unmount();

    const slotForm = useForm({ slotField: 'x' }, [
      { path: 'slotField', component: 'field' },
    ]);
    const slotWrapper = mount(ProForm, {
      props: { form: slotForm, disabled: true },
      slots: {
        slotField: (slotProps: any) =>
          h('div', {
            class: 'slot-root',
            'data-disabled': String(slotProps.disabled),
            'data-placeholder': String(slotProps.placeholder),
            'data-path': String(slotProps.path),
          }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const slotRoot = slotWrapper.find('.slot-root');
    expect(slotRoot.attributes('data-disabled')).toBe('true');
    expect(slotRoot.attributes('data-placeholder')).toBe('请输入');
    // 契约：teleport 插槽作用域参数同样带字段路径
    expect(slotRoot.attributes('data-path')).toBe('slotField');
    slotWrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-B7 [判别]: 弹层打开期间字段被隐藏/删除时弹层随之关闭
  // ----------------------------------------------------
  it('VP-B7 [判别]: 弹层打开期间字段被隐藏或删除时，弹层随之关闭', async () => {
    const form = useForm({ city: ['Hangzhou'], area: ['Zhejiang'] }, [
      {
        path: 'city',
        label: '城市',
        component: 'picker',
        popup: true,
        columns: [{ text: '杭州', value: 'Hangzhou' }],
      },
      {
        path: 'area',
        label: '地区',
        component: 'picker',
        popup: true,
        columns: [{ text: '浙江', value: 'Zhejiang' }],
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false, teleport: true } },
    });
    await flushPromises();

    await wrapper.findAllComponents(VanField)[0].trigger('click');
    await flushPromises();
    expect(form.formPopup.visible.value).toBe(true);
    // 判别前置：弹层组件收到展开状态
    const popupShow = () =>
      wrapper.findComponent({ name: 'VanPopup' }).props('show');
    expect(popupShow()).toBe(true);

    // 隐藏承载弹层的字段
    form.setField('city', { hidden: true } as any);
    await flushPromises();
    expect(form.formPopup.visible.value).toBe(false);
    expect(form.formPopup.activeFieldId.value).toBeUndefined();
    expect(popupShow()).toBe(false);

    // 删除承载弹层的字段
    const rest = wrapper.findAllComponents(VanField);
    expect(rest.length).toBe(1);
    await rest[0].trigger('click');
    await flushPromises();
    expect(form.formPopup.popupFieldPath.value).toBe('area');
    expect(popupShow()).toBe(true);

    form.deleteField('area');
    await flushPromises();
    expect(wrapper.findAllComponents(VanField).length).toBe(0);
    expect(form.formPopup.visible.value).toBe(false);
    expect(popupShow()).toBe(false);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-B8 [判别]: 合并为数组的 confirm/cancel/onUpdate 监听器逐一派发
  // ----------------------------------------------------
  it('VP-B8 [判别]: 字段与 Provider 的同名 confirm/cancel/onUpdate 监听器合并为数组后逐一派发', async () => {
    const calls: string[] = [];
    const form = useForm({ city: ['Hangzhou'] }, [
      {
        path: 'city',
        component: 'picker',
        popup: true,
        columns: [{ text: '杭州', value: 'Hangzhou' }],
        onConfirm: () => calls.push('field-confirm'),
        onCancel: () => calls.push('field-cancel'),
        'onUpdate:modelValue': () => calls.push('field-update'),
      } as any,
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: {
        provide: {
          [INJECT_CONFIG.picker.injectionKey as symbol]: {
            onConfirm: () => calls.push('provider-confirm'),
            onCancel: () => calls.push('provider-cancel'),
            'onUpdate:modelValue': () => calls.push('provider-update'),
          },
        },
        stubs: { transition: false, teleport: true },
      },
    });
    await flushPromises();

    form.formPopup.open('city', ['Hangzhou']);
    await flushPromises();

    const computedProps = (
      wrapper.findComponent({ name: 'BaseField' }).vm as any
    ).getComponentComputedProps();

    // 判别点：数组形态逐一派发（Provider 在字段之前），而非抛 confirmEvent is not a function
    computedProps.onConfirm('payload');
    expect(calls).toEqual([
      // 先经 value setter 回放 onUpdate 监听器，再派发 confirm 监听器
      'provider-update',
      'field-update',
      'provider-confirm',
      'field-confirm',
    ]);
    expect(form.formPopup.visible.value).toBe(false);

    calls.length = 0;
    form.formPopup.open('city', ['Hangzhou'], undefined, 'other-field');
    computedProps.onCancel();
    expect(calls).toEqual(['provider-cancel', 'field-cancel']);
    expect(form.formPopup.visible.value).toBe(false);

    wrapper.unmount();
  });
});
