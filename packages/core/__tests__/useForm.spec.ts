import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, provide } from 'vue';
import { mount } from '@vue/test-utils';
import useForm from '../src/form/useForm';
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
});
