import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, inject, provide, isRef, shallowRef } from 'vue';
import { mount } from '@vue/test-utils';
import useForm, { createFormProxy } from '../src/form/useForm';
import useFormData from '../src/form/useFormData';
import { InjectionFormKey, InjectionFormSlotsKey } from '../src/form/constants';

describe('useForm', () => {
  it('UF-01 三参初始化', () => {
    const form = useForm({ name: 'x' } as any, [{ path: 'name' }] as any, true);
    expect(form.formData.name).toBe('x');
    expect(form.fields.value.length).toBe(1);
    expect(form.formRef.value).toBeUndefined();
  });

  it('UF-02 两参 root 默认 true', () => {
    const form = useForm({ name: 'x' } as any, [] as any);
    expect(form.formData.name).toBe('x');
  });

  it('UF-03 单参布尔 true', () => {
    const form = useForm(true);
    expect(JSON.stringify(form.formData)).toBe('{}');
  });

  it('UF-04 单参布尔 false 无上下文创建独立表单并输出告警', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const form = useForm(false);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[useForm] root=false 但未找到注入的父表单实例')
    );
    expect(form.formData).toBeDefined();
    expect(typeof form.getFormData).toBe('function');
    warnSpy.mockRestore();
  });

  it('UF-05 单参 undefined 等同 false', () => {
    const form = useForm(undefined);
    expect(form.formData).toBeDefined();
    expect(typeof form.getFormData).toBe('function');
  });

  it('UF-06 [红] 单参对象初始化数据', () => {
    const form = useForm({ name: '张三' } as any);
    expect(form.formData.name).toBe('张三');
  });

  it('UF-07 [mount] useForm(false) 继承父表单实例', () => {
    let parentForm: any;
    let childForm: any;
    const Child = defineComponent({
      setup() {
        childForm = useForm(false);
        return () => h('div');
      },
    });
    const Parent = defineComponent({
      setup() {
        parentForm = useForm({ name: 'x' } as any, [] as any, true);
        provide(InjectionFormKey, parentForm);
        return () => h(Child);
      },
    });
    mount(Parent);
    expect(childForm).toBe(parentForm);
  });

  it('UF-08 [mount] 三参 root=false 继承', () => {
    let parentForm: any;
    let childForm: any;
    const Child = defineComponent({
      setup() {
        childForm = useForm({} as any, [] as any, false);
        return () => h('div');
      },
    });
    const Parent = defineComponent({
      setup() {
        parentForm = useForm({ name: 'x' } as any, [] as any, true);
        provide(InjectionFormKey, parentForm);
        return () => h(Child);
      },
    });
    mount(Parent);
    expect(childForm).toBe(parentForm);
  });

  it('UF-09 返回对象形状完整', () => {
    const form = useForm(true);
    expect(typeof form.getFormData).toBe('function');
    expect(typeof form.setFormData).toBe('function');
    expect(typeof form.getField).toBe('function');
    expect(typeof form.setField).toBe('function');
    expect(typeof form.deleteField).toBe('function');
    expect(typeof form.appendField).toBe('function');
    expect(typeof form.prependField).toBe('function');
    expect(typeof form.getParentField).toBe('function');
    expect(typeof form.setFormRef).toBe('function');
    expect(typeof form.formData).toBe('object');
    expect(form.fields).toHaveProperty('value');
    expect(form.formRef).toHaveProperty('value');
  });

  it('UF-10 [mount] useForm 链式 formData 继承', () => {
    let parentForm: any;
    let childFormDataStore: any;
    const Child = defineComponent({
      setup() {
        childFormDataStore = useFormData();
        return () => h('div');
      },
    });
    const Parent = defineComponent({
      setup() {
        parentForm = useForm({ name: 'x' } as any, [] as any, true);
        return () => h(Child);
      },
    });
    mount(Parent);
    expect(childFormDataStore.formData).toBe(parentForm.formData);
  });

  it('UF-11 [mount] useForm() 无参归一为空对象，不继承父级数据 store', () => {
    let parentForm: any;
    let childForm: any;
    const Child = defineComponent({
      setup() {
        childForm = useForm();
        return () => h('div');
      },
    });
    const Parent = defineComponent({
      setup() {
        parentForm = useForm({ name: 'x' } as any, [] as any, true);
        return () => h(Child);
      },
    });
    mount(Parent);

    // 判别点：无参调用不进入父 store 复用分支，得到独立空 store
    expect(childForm).not.toBe(parentForm);
    expect(childForm.formData).not.toBe(parentForm.formData);
    expect(JSON.stringify(childForm.formData)).toBe('{}');
    expect(childForm.getFormData('name')).toBeUndefined();

    childForm.setFormData('a', 1);
    expect(childForm.getFormData('a')).toBe(1);
    expect(parentForm.getFormData('a')).toBeUndefined();
  });

  describe('createFormProxy (T29 / S2 / 5.8)', () => {
    it('代理属性读写与反射 API 完整性', () => {
      const current = {
        formData: { count: 1 },
        setFormData: vi.fn(),
      };
      const proxy = createFormProxy(() => current);

      // 属性读取与 has 判定
      expect(proxy.formData.count).toBe(1);
      expect('formData' in proxy).toBe(true);
      expect('notExist' in proxy).toBe(false);

      // 属性写入
      (proxy as any).formData = { count: 2 };
      expect(current.formData.count).toBe(2);

      // ownKeys 与 getOwnPropertyDescriptor 反射
      expect(Object.keys(proxy)).toContain('formData');
      expect(Object.getOwnPropertyDescriptor(proxy, 'formData')).toBeDefined();
    });

    it('方法引用记忆化（解决 5.8 引用不稳定缺陷）', () => {
      const current = {
        setFormData: vi.fn((key: string, val: any) => ({ [key]: val })),
      };
      const proxy = createFormProxy(() => current);

      const fn1 = proxy.setFormData;
      const fn2 = proxy.setFormData;

      // 关键断言：多次读取同一个方法，必须返回完全恒等的函数引用
      expect(fn1).toBe(fn2);

      // 调用测试
      fn1('name', 'Antigravity');
      expect(current.setFormData).toHaveBeenCalledWith('name', 'Antigravity');
    });

    it('运行期切换目标实例时，代理实时路由至新实例', () => {
      const formA = {
        formData: { id: 'A' },
        getFormData: vi.fn(() => 'A'),
      };
      const formB = {
        formData: { id: 'B' },
        getFormData: vi.fn(() => 'B'),
      };

      let activeForm = formA;
      const proxy = createFormProxy(() => activeForm);

      expect(proxy.formData.id).toBe('A');
      expect(proxy.getFormData()).toBe('A');

      // 运行期动态切换实例
      activeForm = formB;
      expect(proxy.formData.id).toBe('B');
      expect(proxy.getFormData()).toBe('B');
      expect(formB.getFormData).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------
  // UF-XX [判别]: 代理 delete 转发到当前实例（不再静默吞掉）
  // ----------------------------------------------------
  it('代理 delete 转发当前实例：删除生效且 in 判定同步', () => {
    const form = useForm({ a: 1 } as any) as any;
    form.customKey = 'x';
    const proxy = createFormProxy(() => form) as any;

    // 初始可读、in 判定为真
    expect(proxy.customKey).toBe('x');
    expect('customKey' in proxy).toBe(true);

    // 删除转发到当前实例
    expect(delete proxy.customKey).toBe(true);
    expect('customKey' in proxy).toBe(false);
    expect('customKey' in form).toBe(false);
    expect(proxy.customKey).toBeUndefined();

    // 实例缺失时不抛错
    const orphan = createFormProxy(() => undefined as any) as any;
    expect(delete orphan.anything).toBe(true);
  });

  // ----------------------------------------------------
  // CR-028 [判别]: 插槽注入 key 的类型与实际注入形态（ShallowRef）一致
  // ----------------------------------------------------
  it('CR-028 [判别]: InjectionFormSlotsKey 的注入形态为 ShallowRef', async () => {
    // 形态契约：provide 的必须是 Ref（含 value），子组件经注入读取到同一引用
    const Child = defineComponent({
      setup() {
        const injected = inject(InjectionFormSlotsKey, undefined);
        return () => h('div', { 'data-has-value': String(isRef(injected)) });
      },
    });
    const slotsRef = shallowRef<Record<string, any>>({ default: () => null });
    const Host = defineComponent({
      setup() {
        provide(InjectionFormSlotsKey, slotsRef);
        return () => h(Child);
      },
    });
    const wrapper = mount(Host);
    expect(wrapper.find('[data-has-value]').attributes('data-has-value')).toBe(
      'true'
    );
    expect(isRef(slotsRef)).toBe(true);
    wrapper.unmount();
  });
});
