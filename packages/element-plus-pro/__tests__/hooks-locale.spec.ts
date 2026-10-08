import { describe, it, expect } from 'vitest';
import { computed, defineComponent, h, provide, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { LOCALE_INJECT_KEY, useLocale, type ProLocale } from '../src/locale';
import { useGroupFieldAttrs } from '../src/components/form/hooks/useGroupFieldAttrs';
import { useFields } from '../src/components/form/hooks/useFields';
import { useFormRef } from '../src/components/form/hooks/useFormRef';
import { useForm } from '../src/components/form/hooks/useForm';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useProviderDisabled, useInjectDisabled } from '../src/shared/ui';
import { flushPromises } from './helpers/mount';
import { ElConfigProvider } from 'element-plus';

describe('Hooks 与 Locale 基础能力测试', () => {
  // ----------------------------------------------------
  // HK-02: useProviderDisabled 与 useInjectDisabled 跨层级穿透
  // ----------------------------------------------------
  it('HK-02: useProviderDisabled 与 useInjectDisabled 支持跨层级响应式穿透', async () => {
    let childDisabledState: boolean | undefined = undefined;

    const ChildComponent = defineComponent({
      setup() {
        const disabled = useInjectDisabled();
        return () => {
          childDisabledState = disabled.value;
          return h('div', { class: 'child-box' });
        };
      },
    });

    const parentDisabled = ref(false);

    const ParentComponent = defineComponent({
      setup() {
        useProviderDisabled(computed(() => parentDisabled.value));
        return () => h(ChildComponent);
      },
    });

    const wrapper = mount(ParentComponent);
    await flushPromises();

    expect(childDisabledState).toBe(false);

    // 动态修改父级禁用状态
    parentDisabled.value = true;
    await flushPromises();
    expect(childDisabledState).toBe(true);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // HK-03: useGroupFieldAttrs 属性分离
  // ----------------------------------------------------
  it('HK-03: useGroupFieldAttrs 正确将字段属性分离为 grid / formItem / component / slots', () => {
    const fields = computed(() => [
      {
        path: 'user.name',
        label: '用户名',
        span: 12,
        component: 'input',
        placeholder: '请输入用户名',
        extraProps: { customTag: 'internal' },
        slots: {
          label: () => '自定义用户名',
        },
      },
    ]);

    const Parent = defineComponent({
      setup() {
        const grouped = useGroupFieldAttrs(fields as any);
        return { grouped };
      },
      template: '<div></div>',
    });

    const wrapper = mount(Parent);
    const item = (wrapper.vm as any).grouped[0];

    expect(item.path).toBe('user.name');
    expect(item.gridItemProps.span).toBe(12);
    expect(item.formItemProps.label).toBe('用户名');
    expect(item.componentProps.placeholder).toBe('请输入用户名');
    // extraProps 从 componentProps 剥离
    expect(item.componentProps.extraProps).toBeUndefined();
    // label 插槽归入 formItemSlots
    expect(typeof item.formItemSlots.label).toBe('function');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // HK-04 [判别]: 字段 disabled 归入 componentProps，不进入 formItemProps
  // ----------------------------------------------------
  it('HK-04 [判别]: 字段 disabled 归入 componentProps，不进入 formItemProps', () => {
    const fields = computed(() => [
      { path: 'name', label: '姓名', component: 'input', disabled: true },
    ]);

    const Parent = defineComponent({
      setup() {
        const grouped = useGroupFieldAttrs(fields as any);
        return { grouped };
      },
      template: '<div></div>',
    });

    const wrapper = mount(Parent);
    const item = (wrapper.vm as any).grouped[0];

    // 宿主 ElFormItem 无 disabled prop：该键属控件属性，由 BaseField 消费
    expect(item.componentProps.disabled).toBe(true);
    expect(item.formItemProps.disabled).toBeUndefined();

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // LC-01: useLocale 默认回退
  // ----------------------------------------------------
  it('LC-01: useLocale 默认回退为简体中文 zh-CN', () => {
    const Parent = defineComponent({
      setup() {
        const { t, lang } = useLocale();
        return { t, lang };
      },
      template: '<div></div>',
    });

    const wrapper = mount(Parent);
    const { t, lang } = wrapper.vm as any;

    expect(lang).toBe('zh-CN');
    expect(t('table.query')).toBe('查询');
    expect(t('table.reset')).toBe('重置');
    expect(t('table.index')).toBe('序号');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // LC-02: t 函数参数插值
  // ----------------------------------------------------
  it('LC-02: t 函数支持 {placeholder} 参数动态插值', () => {
    const Parent = defineComponent({
      setup() {
        const { t } = useLocale();
        return { t };
      },
      template: '<div></div>',
    });

    const wrapper = mount(Parent);
    const { t } = wrapper.vm as any;

    const totalText = t('pagination.total', { total: 100 });
    expect(totalText).toBe('共 100 条');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // LC-03 [判别]: locale 可覆盖任意文案（取值不受内置字面量约束）
  // ----------------------------------------------------
  it('LC-03 [判别]: locale 覆盖任意文案生效，取值类型不受内置文案字面量约束', () => {
    // 编译期契约：若 ProLocale 退回字面量类型，本行赋值将无法通过 vue-tsc
    const override: Partial<ProLocale> = { 'table.query': '搜索一下' };

    // 覆盖经注入通道生效：Provider 组件 provide，子组件 inject
    const Child = defineComponent({
      setup() {
        const { t } = useLocale();
        return { t };
      },
      template: '<div></div>',
    });
    const Parent = defineComponent({
      setup() {
        provide(LOCALE_INJECT_KEY, ref(override));
        return () => h(Child);
      },
    });

    const wrapper = mount(Parent);
    const { t } = (wrapper.findComponent(Child).vm as any) ?? {};

    expect(t('table.query')).toBe('搜索一下');
    // 未覆盖的键仍回退内置文案
    expect(t('table.reset')).toBe('重置');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // LC-04 [判别]: 是否包 ElConfigProvider 不影响语言判定（未传 locale 均回退 zh-CN）
  // ----------------------------------------------------
  it('LC-04 [判别]: 仅包 ElConfigProvider 未传 locale 时语言回退 zh-CN', async () => {
    let lang: string | undefined;
    const Child = defineComponent({
      setup() {
        const api = useLocale();
        return () => {
          lang = api.lang.value;
          return h('div');
        };
      },
    });

    // 包 provider 但未传 locale
    const wrapped = mount(ElConfigProvider as any, {
      slots: { default: () => h(Child) },
    });
    await flushPromises();
    expect(lang).toBe('zh-CN');
    wrapped.unmount();

    // 不包 provider：一致
    lang = undefined;
    const bare = mount(Child);
    await flushPromises();
    expect(lang).toBe('zh-CN');
    bare.unmount();

    // 显式传入英文 locale：仍按宿主语言判定
    lang = undefined;
    const english = mount(ElConfigProvider as any, {
      props: {
        locale: (await import('element-plus/es/locale/lang/en')).default,
      },
      slots: { default: () => h(Child) },
    });
    await flushPromises();
    expect(lang).toBe('en-US');
    english.unmount();
  });

  // ----------------------------------------------------
  // PF-A3 [判别]: 适配层 useFields 的增删改查与 prop 标识键序
  // ----------------------------------------------------
  it('PF-A3 [判别]: 经适配层 useFields 返回的字段配置可增删改查，且以 prop 作为字段标识', () => {
    const { fields, getField, setField, appendField, deleteField } = useFields([
      { prop: 'name', label: '姓名', component: 'input' },
      { prop: 'age', label: '年龄', component: 'input-number' },
    ] as any);

    expect(fields.value).toHaveLength(2);

    // 本包标识键序为 ['prop', 'path']：仅声明 prop 的字段仍可被路径检索
    expect(getField('name')?.label).toBe('姓名');
    expect((getField('age') as any)?.prop).toBe('age');

    // 改：合并更新保留未声明的属性
    setField('name', { label: '用户名' } as any);
    expect(getField('name')?.label).toBe('用户名');
    expect((getField('name') as any)?.component).toBe('input');

    // 增
    appendField('age', {
      prop: 'email',
      label: '邮箱',
      component: 'input',
    } as any);
    expect(fields.value.map(field => (field as any).prop)).toEqual([
      'name',
      'age',
      'email',
    ]);

    // 删
    deleteField('age');
    expect(getField('age')).toBeUndefined();
    expect(fields.value.map(field => (field as any).prop)).toEqual([
      'name',
      'email',
    ]);
  });

  // ----------------------------------------------------
  // PF-A4 [判别]: 适配层 useFormRef 转发宿主表单方法
  // ----------------------------------------------------
  it('PF-A4 [判别]: 适配层 useFormRef 绑定宿主 ElForm 实例并经 formRef 调用其校验/重置方法', async () => {
    const form = useForm({ name: '' }, [
      {
        path: 'name',
        label: '姓名',
        component: 'input',
        rules: [{ required: true, message: '请输入姓名' }],
      },
    ]);

    const wrapper = mount(ProForm as any, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const hostForm = form.formRef.value as any;
    expect(hostForm).toBeTruthy();
    expect(typeof hostForm.validate).toBe('function');

    const { formRef, setFormRef } = useFormRef();
    expect(formRef.value).toBeUndefined();

    // setFormRef 转发宿主实例
    setFormRef(hostForm);
    expect(formRef.value).toBe(hostForm);

    // 经适配层 formRef 调用宿主 validate：校验失败并置位宿主表单项错误态
    await expect(formRef.value!.validate()).rejects.toBeDefined();
    await flushPromises();
    expect(wrapper.find('.el-form-item').classes()).toContain('is-error');
    expect(form.getFormData('name')).toBe('');

    await wrapper.find('input').setValue('abc');
    await flushPromises();
    expect(form.getFormData('name')).toBe('abc');

    // 经适配层 formRef 调用宿主 resetFields：错误态与字段值一并复位
    await formRef.value!.resetFields();
    await flushPromises();
    expect(wrapper.find('.el-form-item').classes()).not.toContain('is-error');
    expect(form.getFormData('name')).toBe('');

    wrapper.unmount();
  });
});
