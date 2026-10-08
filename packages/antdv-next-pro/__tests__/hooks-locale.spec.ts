import { describe, it, expect } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useLocale } from '../src/locale';
import { useGroupFieldAttrs } from '../src/components/form/hooks/useGroupFieldAttrs';
import { useFields } from '../src/components/form/hooks/useFields';
import { useFormRef } from '../src/components/form/hooks/useFormRef';
import { useForm } from '../src/components/form/hooks/useForm';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import {
  useDisabledContextProvider,
  useDisabledContext,
} from '../src/shared/ui';
import { flushPromises } from './helpers/mount';

describe('Hooks 与 Locale 基础能力测试', () => {
  // ----------------------------------------------------
  // HK-04 [判别]: shared/ui 以 useHostConfig 暴露宿主禁用/尺寸上下文
  // ----------------------------------------------------
  it('HK-04 [判别]: shared/ui 仅导出 useHostConfig 读取宿主组件上下文，不导出同名 useConfig', async () => {
    const ui: any = await import('../src/shared/ui');
    expect(typeof ui.useHostConfig).toBe('function');
    // 与 locale 模块读取 ConfigProvider locale 的宿主配置读取函数不再同名
    expect(ui.useConfig).toBeUndefined();

    // useHostConfig 读取宿主 ConfigProvider 的 componentSize 上下文
    const { ConfigProvider } = await import('antdv-next');
    const Probe = defineComponent({
      setup() {
        const hostConfig = ui.useHostConfig();
        return () =>
          h(
            'span',
            { class: 'host-size-probe' },
            hostConfig.componentSize.value
          );
      },
    });
    const wrapper = mount(ConfigProvider as any, {
      props: { componentSize: 'small' },
      slots: { default: () => h(Probe) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.find('.host-size-probe').text()).toBe('small');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // HK-02: useDisabledContextProvider 与 useDisabledContext 跨层级穿透
  // ----------------------------------------------------
  it('HK-02: useDisabledContextProvider 与 useDisabledContext 支持跨层级响应式穿透', async () => {
    let childDisabledState: boolean | undefined = undefined;

    const ChildComponent = defineComponent({
      setup() {
        const disabled = useDisabledContext();
        return () => {
          childDisabledState = disabled.value;
          return h('div', { class: 'child-box' });
        };
      },
    });

    const parentDisabled = ref(false);

    const ParentComponent = defineComponent({
      setup() {
        useDisabledContextProvider(computed(() => parentDisabled.value) as any);
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
});
