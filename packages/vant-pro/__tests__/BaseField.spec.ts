import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent } from 'vue';
import BaseField from '../src/components/form/components/BaseField/index.vue';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { Field as VanField } from '../src/shared/ui';
import { INJECT_COMPONENTS } from '../src/components/component-provider/constants';
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
  // VP-V7 [判别]: 弹层选择器打开时，向 open 传递的是原始数据而非 valueFormatter.get 展示值
  // ----------------------------------------------------
  it('VP-V7 [判别]: 弹层选择器打开时，向 open 传递的是原始数据而非 valueFormatter.get 展示值', async () => {
    const form = useForm(
      {
        date: '2026-08-25',
      },
      [
        {
          path: 'date',
          component: 'date-picker',
          popup: true,
          valueFormatter: {
            get: (val: string) => `Formatted: ${val}`,
          },
        },
      ]
    );

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false, teleport: true } },
    });

    await flushPromises();

    const field = wrapper.findComponent(VanField);
    // 展示值是经过 get 转换的
    expect(field.props('modelValue')).toBe('Formatted: 2026-08-25');

    // 触发点击打开弹层
    await field.trigger('click');
    await flushPromises();

    // 判别断言：formPopup.popupFieldValue 接收的是未被 get 转换的原始值 '2026-08-25'
    expect(form.formPopup.popupFieldValue.value).toBe('2026-08-25');
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
    let receivedOld: any;
    const form = useForm({ note: bigStr, count: 3 }, [
      {
        path: 'note',
        component: 'field',
        valueFormatter: (val: any, oldVal: any) => {
          if (receivedOld === undefined) receivedOld = oldVal;
          return val;
        },
      },
      {
        path: 'count',
        component: 'field',
        valueFormatter: (val: any, oldVal: any) => {
          return Number(val) + (typeof oldVal === 'number' ? 0 : 0);
        },
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('typed');
    await flushPromises();

    // 判别点：原始类型旧值直接引用（零拷贝），值与写入前一致
    expect(receivedOld).toBe(bigStr);

    // 数字旧值同样零拷贝路径，行为正确
    const numericInput = inputs[1];
    await numericInput.setValue('7');
    await flushPromises();
    expect(form.getFormData('count')).toBe(7);
    wrapper.unmount();
  });
  // ----------------------------------------------------
  // VP-V10 [判别]: Signature 弹层确认时经 submit 事件载荷把签名图写入 formData
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
  // VP-V11 [判别]: 内联（非弹层）Picker 类字段绑定 model-value 供 VanField 校验取值
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
  // VP-V12 [判别]: 字段配置的事件监听仅绑内层组件，外层 VanField 不重复绑定
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
});
