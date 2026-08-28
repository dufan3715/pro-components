import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, provide } from 'vue';
import { mount } from '@vue/test-utils';
import useForm, { createFormProxy } from '../src/form/useForm';
import useFormData from '../src/form/useFormData';
import { InjectionFormKey } from '../src/form/constants';

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
    // 修复后预期：formData.name === '张三'；当前实现单参被当作 root 处理，formData 为 {}
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
});
