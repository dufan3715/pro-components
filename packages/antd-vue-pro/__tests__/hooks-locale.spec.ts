import { describe, it, expect } from 'vitest';
import { computed, defineComponent, h, provide, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { LOCALE_INJECT_KEY, useLocale } from '../src/locale';
import { useFormData } from '../src/components/form/hooks';
import { ConfigProvider as AConfigProvider } from 'ant-design-vue';
import { useGroupFieldAttrs } from '../src/components/form/hooks/useGroupFieldAttrs';
import { useFields } from '../src/components/form/hooks/useFields';
import { useFormRef } from '../src/components/form/hooks/useFormRef';
import { useForm } from '../src/components/form/hooks/useForm';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useProviderDisabled, useInjectDisabled } from '../src/shared/ui';
import { flushPromises } from './helpers/mount';

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
          extra: () => '提示说明',
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
    // extra 插槽归入 formItemSlots
    expect(typeof item.formItemSlots.extra).toBe('function');

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
  // PF-A3 [判别]: 适配层 useFields 的增删改查
  // ----------------------------------------------------
  it('PF-A3 [判别]: 经适配层 useFields 返回的字段配置可增删改查并保留初始字段', () => {
    const { fields, getField, setField, appendField, deleteField } = useFields([
      { path: 'name', label: '姓名', component: 'input' },
      { name: 'age', label: '年龄', component: 'input-number' },
    ] as any);

    // 初始字段经适配层透传
    expect(fields.value).toHaveLength(2);

    // 查：默认标识键序 ['name', 'path'] 下 path 与 name 均可检索
    expect(getField('name')?.label).toBe('姓名');
    expect((getField('age') as any)?.name).toBe('age');

    // 改：合并更新保留未声明的属性
    setField('name', { label: '用户名' } as any);
    expect(getField('name')?.label).toBe('用户名');
    expect((getField('name') as any)?.component).toBe('input');

    // 增
    appendField('age', {
      path: 'email',
      label: '邮箱',
      component: 'input',
    } as any);
    expect(
      fields.value.map(field => (field as any).path ?? (field as any).name)
    ).toEqual(['name', 'age', 'email']);

    // 删
    deleteField('age');
    expect(getField('age')).toBeUndefined();
    expect(
      fields.value.map(field => (field as any).path ?? (field as any).name)
    ).toEqual(['name', 'email']);
  });

  // ----------------------------------------------------
  // PF-A4 [判别]: 适配层 useFormRef 转发宿主表单方法
  // ----------------------------------------------------
  it('PF-A4 [判别]: 适配层 useFormRef 绑定宿主 Form 实例并经 formRef 调用其校验/重置方法', async () => {
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

    // 经适配层 formRef 调用宿主 validate：校验失败并经宿主表单项回显错误文案
    await expect(formRef.value!.validate()).rejects.toBeDefined();
    await flushPromises();
    expect(wrapper.text()).toContain('请输入姓名');

    // 经适配层 formRef 读取宿主表单值
    await wrapper.find('input').setValue('abc');
    await flushPromises();
    expect(formRef.value!.getFieldsValue()).toMatchObject({ name: 'abc' });

    // 经适配层 formRef 调用宿主 resetFields：宿主表单值、绑定数据与输入框一并复位
    await formRef.value!.resetFields();
    await flushPromises();
    expect(formRef.value!.getFieldsValue()).toMatchObject({ name: '' });
    expect(form.getFormData('name')).toBe('');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // LC-03 [判别]: locale 跟随宿主 a-config-provider 切换（zh-CN / zh-TW / en-US）
  // ----------------------------------------------------
  it('LC-03 [判别]: 语言跟随宿主 ConfigProvider 切换，繁体判定优先于 zh 前缀', async () => {
    const Probe = defineComponent({
      setup() {
        const { t, lang } = useLocale();
        return () =>
          h(
            'span',
            { class: 'lc03-probe' },
            `${lang.value}|${t('table.query')}|${t('pagination.total', { total: 3 })}`
          );
      },
    });

    const wrapper = mount(Probe, {
      global: {
        provide: {},
      },
    });
    // 未提供宿主 locale：回退 zh-CN
    expect(wrapper.find('.lc03-probe').text()).toBe('zh-CN|查询|共 3 条');
    wrapper.unmount();

    // 宿主 ConfigProvider 指定 zh-TW / en-US 时逐级切换
    const hostLocale = ref<any>({ locale: 'zh-TW' });
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            AConfigProvider,
            { locale: hostLocale.value },
            { default: () => h(Probe) }
          );
      },
    });
    const hostWrapper = mount(Host);
    await flushPromises();
    expect(hostWrapper.find('.lc03-probe').text()).toContain('zh-TW');

    hostLocale.value = { locale: 'en-US' };
    await flushPromises();
    expect(hostWrapper.find('.lc03-probe').text()).toContain('en-US');

    // zh-HK 归入繁体（zh-tw / zh-hk 判定须先于 zh 前缀判定）
    hostLocale.value = { locale: 'zh-HK' };
    await flushPromises();
    expect(hostWrapper.find('.lc03-probe').text()).toContain('zh-TW');
    hostWrapper.unmount();
  });

  // ----------------------------------------------------
  // LC-04 [判别]: LOCALE_INJECT_KEY 注入的局部覆盖优先于语言包，且随 ref 响应式更新
  // ----------------------------------------------------
  it('LC-04 [判别]: LOCALE_INJECT_KEY 覆盖文案优先于语言包并响应式生效', async () => {
    const override = ref<Record<string, string> | undefined>({
      'table.query': '局部查询',
    });
    const Probe = defineComponent({
      setup() {
        const { t } = useLocale();
        return () => h('span', { class: 'lc04-probe' }, t('table.query'));
      },
    });
    const Host = defineComponent({
      setup() {
        provide(LOCALE_INJECT_KEY, override);
        return () => h(Probe);
      },
    });

    const wrapper = mount(Host);
    expect(wrapper.find('.lc04-probe').text()).toBe('局部查询');

    // 覆盖集合移除该键时回落到语言包
    override.value = undefined;
    await flushPromises();
    expect(wrapper.find('.lc04-probe').text()).toBe('查询');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // HK-05 [判别]: 注入的表单代理路由到 :form 实例，useFormData() 取内部兜底 store
  // ----------------------------------------------------
  it('HK-05 [判别]: useForm(false) 路由到传入实例，useFormData() 取内部兜底 store', async () => {
    const form = useForm({ name: '甲' }, [
      { path: 'name', label: '姓名', component: 'input' },
    ]);
    let injectedForm: any;
    let injectedStore: any;

    const Probe = defineComponent({
      setup() {
        injectedForm = useForm(false) as any;
        injectedStore = useFormData();
        return () => h('span', { class: 'hk05-probe' });
      },
    });

    const wrapper = mount(ProForm as any, {
      props: { form },
      slots: { default: () => h(Probe) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 注入代理按 currentForm 路由：useForm(false) 拿到的是传入实例本体
    expect(injectedForm.formData).toBe(form.formData);
    expect(injectedForm.getFormData('name')).toBe('甲');

    // useFormData() 承接的是 ProForm 内部兜底实例的 store，与传入实例数据互不相通
    expect(injectedStore.formData).not.toBe(form.formData);
    expect(injectedStore.getFormData('name')).toBeUndefined();

    // 兜底 store 的写入不穿透到传入实例，也不影响表单渲染
    injectedStore.setFormData('name', '兜底');
    await flushPromises();
    expect(form.getFormData('name')).toBe('甲');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe(
      '甲'
    );
    wrapper.unmount();

    // 未传 :form 时两条通路指向同一实例
    const localWrapper = mount(ProForm as any, {
      global: { stubs: { transition: false } },
      slots: { default: () => h(Probe) },
    });
    await flushPromises();
    expect(injectedStore.formData).toBe(injectedForm.formData);
    localWrapper.unmount();
  });
});
