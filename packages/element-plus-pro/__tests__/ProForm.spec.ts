import { describe, it, expect } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { useFormData } from '../src';
import { flushPromises, mountProForm } from './helpers/mount';
import { createBasicFields, createNestedFields } from './helpers/fixtures';
import { ElForm, ElFormItem, ElInput, ElRow } from 'element-plus';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';

describe('ProForm 组件测试', () => {
  // ----------------------------------------------------
  // PF-A2 [判别]: 未传 form prop 挂载时，内部自建表单实例
  // ----------------------------------------------------
  it('PF-A2 [判别]: 未传 form 时自建表单实例，下游 useForm(false) 可正常读写数据', async () => {
    let childForm: any;
    const ChildComponent = defineComponent({
      setup() {
        childForm = useForm(false);
        return () => h('div', { class: 'child-form' }, 'child');
      },
    });

    const wrapper = mount(ProForm, {
      slots: {
        default: () => h(ChildComponent),
      },
    });

    expect(childForm).toBeDefined();
    expect(typeof childForm.getFormData).toBe('function');

    // 验证写入和读取在自建 store 中正常生效
    childForm.setFormData('testKey', 'hello-auto-form');
    expect(childForm.getFormData('testKey')).toBe('hello-auto-form');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-B1 [判别]: 运行期替换 :form 实例，子组件通过 Proxy 动态代理响应新实例
  // ----------------------------------------------------
  it('PF-B1 [判别]: 运行期替换 :form prop 时，子组件读写始终代理至最新 form 实例', async () => {
    const form1 = useForm({ username: 'user-one' }, [
      { path: 'username', component: 'input' },
    ]);
    const form2 = useForm({ username: 'user-two' }, [
      { path: 'username', component: 'input' },
    ]);

    const activeForm = ref<any>(form1);

    const Parent = defineComponent({
      setup() {
        return () => h(ProForm, { form: activeForm.value });
      },
    });

    const wrapper = mount(Parent, {
      global: {
        stubs: {
          transition: false,
        },
      },
    });
    await flushPromises();

    const inputEl1 = wrapper.find('input');
    expect((inputEl1.element as HTMLInputElement).value).toBe('user-one');

    // 运行期响应式替换为 form2
    activeForm.value = form2;
    await flushPromises();

    const inputEl2 = wrapper.find('input');
    expect((inputEl2.element as HTMLInputElement).value).toBe('user-two');

    // 向新实例写数据，验证旧实例不受影响
    form2.setFormData('username', 'user-two-updated');
    await flushPromises();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe(
      'user-two-updated'
    );
    expect(form1.getFormData('username')).toBe('user-one');
    // 验证新实例成功绑定底层 FormInstance
    expect(form2.formRef.value).toBeTruthy();
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-B2 [判别]: 运行期 :form 置空时回退内部表单，不崩溃且可读写
  // ----------------------------------------------------
  it('PF-B2 [判别]: 运行期 :form 置空时回退内部表单实例，渲染不中断', async () => {
    const form1 = useForm({ username: 'user-one' }, [
      { path: 'username', component: 'input' },
    ]);

    const activeForm = ref<any>(form1);

    const Parent = defineComponent({
      setup() {
        return () => h(ProForm, { form: activeForm.value });
      },
    });

    const wrapper = mount(Parent, {
      global: {
        stubs: {
          transition: false,
        },
      },
    });
    await flushPromises();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe(
      'user-one'
    );

    // 运行期置空 :form（条件清空表单场景）
    activeForm.value = undefined;
    await flushPromises();

    // 渲染不中断，子树以回退的内部表单渲染（回退表单字段列表为空）
    expect(wrapper.find('form').exists()).toBe(true);
    wrapper.unmount();
  });

  it('PF-B2b [判别]: :form 置空后，子组件经注入代理读写回退的内部表单', async () => {
    let probe: any;
    const ChildComponent = defineComponent({
      setup() {
        probe = useForm(false);
        return () => h('div', { class: 'child-form' }, 'child');
      },
    });

    const form1 = useForm({ username: 'user-one' }, [
      { path: 'username', component: 'input' },
    ]);
    const activeForm = ref<any>(form1);

    const Parent = defineComponent({
      setup() {
        return () =>
          h(
            ProForm,
            { form: activeForm.value },
            { default: () => h(ChildComponent) }
          );
      },
    });

    const wrapper = mount(Parent, {
      global: {
        stubs: {
          transition: false,
        },
      },
    });
    await flushPromises();
    expect(probe.getFormData('username')).toBe('user-one');

    activeForm.value = undefined;
    await flushPromises();

    // 回退内部表单：可写可读，且旧实例数据不被污染
    probe.setFormData('username', 'written-to-fallback');
    expect(probe.getFormData('username')).toBe('written-to-fallback');
    expect(form1.getFormData('username')).toBe('user-one');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-H1 [判别]: 嵌套路径 'user.address.city' 生成点分字符串 prop
  // ----------------------------------------------------
  it('PF-H1 [判别]: 嵌套路径字段生成正确的点分字符串 prop 属性', async () => {
    const { wrapper } = mountProForm({
      fields: createNestedFields(),
      initialData: { user: { name: '张三', address: { city: '北京' } } },
    });

    await flushPromises();
    const formItems = wrapper.findAllComponents(ElFormItem);
    expect(formItems.length).toBe(2);

    // 断言 FormItem 的 prop 被转换为点分字符串
    expect(formItems[0].props('prop')).toBe('user.name');
    expect(formItems[1].props('prop')).toBe('user.address.city');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-01: 动态插槽 teleport
  // ----------------------------------------------------
  it('PF-01: 支持通过以 path 命名的插槽自定义渲染字段', async () => {
    const { wrapper } = mountProForm({
      fields: [{ path: 'customField', label: '自定义' }],
      slots: {
        customField: (slotProps: any) =>
          h('span', { class: 'custom-slot-content' }, `Slot:${slotProps.path}`),
      },
    });

    await flushPromises();
    const slotEl = wrapper.find('.custom-slot-content');
    expect(slotEl.exists()).toBe(true);
    expect(slotEl.text()).toBe('Slot:customField');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-02: 嵌套字段递归渲染
  // ----------------------------------------------------
  it('PF-02: 支持 fields 递归字段配置', async () => {
    const { wrapper } = mountProForm({
      fields: [
        {
          path: 'group',
          label: '分组',
          fields: [
            { path: 'group.child1', label: '子项1', component: 'input' },
            { path: 'group.child2', label: '子项2', component: 'input' },
          ],
        },
      ],
    });

    await flushPromises();
    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(2);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-03: disabled 传递
  // ----------------------------------------------------
  it('PF-03: ProForm 的 :disabled prop 正确传递至子组件', async () => {
    const { wrapper } = mountProForm({
      fields: createBasicFields(),
      props: { disabled: true },
    });

    await flushPromises();
    const inputComp = wrapper.findComponent(ElInput);
    expect(inputComp.props('disabled')).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-U3 [判别]: 挂载后新增 disabled
  // ----------------------------------------------------
  it('PF-U3 [判别]: 挂载后新增 disabled 立即下发子控件', async () => {
    const { wrapper } = mountProForm({ fields: createBasicFields() });
    await flushPromises();
    expect(wrapper.findComponent(ElInput).props('disabled')).toBeFalsy();

    await wrapper.setProps({ disabled: true } as any);
    await flushPromises();
    expect(wrapper.findComponent(ElInput).props('disabled')).toBe(true);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-04: formRef 绑定
  // ----------------------------------------------------
  it('PF-04: form.formRef.value 正确绑定到底层 element-plus Form 实例', async () => {
    const form = useForm({}, createBasicFields());
    const { wrapper } = mountProForm({ form });

    await flushPromises();
    expect(form.formRef.value).toBeDefined();
    expect(typeof (form.formRef.value as any)?.validate).toBe('function');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-05: 提交与 ElForm 属性透传
  // ----------------------------------------------------
  it('PF-05: 支持透传 ElForm 属性与触发事件', async () => {
    const { wrapper } = mountProForm({
      fields: [{ path: 'title', label: '标题', component: 'input' }],
      props: {
        inline: true,
      },
    });

    await flushPromises();
    const formComp = wrapper.find('.pro-form');
    expect(formComp.classes()).toContain('el-form--inline');
    wrapper.unmount();
  });
  // ----------------------------------------------------
  // PF-C1 [判别]: 运行期动态增删字段插槽可被 BaseField 感知
  // ----------------------------------------------------
  it('PF-C1 [判别]: 父组件运行期增/删以 path 命名的插槽后，字段渲染随之前后切换', async () => {
    const form = useForm({}, [
      { path: 'kw', label: '关键词', component: 'input' },
    ]);
    const showSlot = ref(true);
    const Parent = defineComponent({
      setup() {
        return () =>
          h(
            ProForm,
            { form },
            {
              ...(showSlot.value
                ? {
                    kw: () => h('span', { class: 'kw-slot-on' }, 'SLOT-RENDER'),
                  }
                : {}),
            }
          );
      },
    });
    const wrapper = mount(Parent, {
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.find('.kw-slot-on').exists()).toBe(true);

    // 运行期移除插槽：字段回退为内置组件渲染
    showSlot.value = false;
    await flushPromises();
    expect(wrapper.find('.kw-slot-on').exists()).toBe(false);
    expect(wrapper.find('input').exists()).toBe(true);

    // 运行期恢复插槽：字段再次切换为插槽渲染
    showSlot.value = true;
    await flushPromises();
    expect(wrapper.find('.kw-slot-on').exists()).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-D1 [判别]: data-* / aria-* 属性名保持原样下发宿主 Form
  // ----------------------------------------------------
  it('PF-D1 [判别]: data-*/aria-* 属性名保持原样下发宿主 Form', async () => {
    const form = useForm({ a: '' }, [
      { path: 'a', label: 'A', component: 'input' },
    ] as any);

    const wrapper = mount(ProForm as any, {
      props: { form },
      attrs: { 'data-testid': 'form-x', 'aria-label': '表单' },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const formEl = wrapper.find('form');
    expect(formEl.exists()).toBe(true);
    expect(formEl.attributes('data-testid')).toBe('form-x');
    expect(formEl.attributes('aria-label')).toBe('表单');
    expect(formEl.attributes('datatestid')).toBeUndefined();
    expect(formEl.attributes('arialabel')).toBeUndefined();

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-E1 [判别]: 嵌套 ProForm 内层不传 :form 时创建独立表单实例
  // ----------------------------------------------------
  it('PF-E1 [判别]: 嵌套 ProForm 内层不传 :form 时创建独立实例，数据不与父表单互串', async () => {
    const outerForm = useForm({ outer: 'O' }, [
      { path: 'outer', label: '外层', component: 'input' },
    ] as any);

    let innerForm: any;
    const InnerProbe = defineComponent({
      setup() {
        // 取最近一层 ProForm 注入的表单实例（即内层兜底实例）
        innerForm = useForm(false);
        return () => h('div', { class: 'pf-e1-probe' });
      },
    });

    const wrapper = mount(ProForm as any, {
      props: { form: outerForm },
      slots: {
        default: () =>
          h(ProForm as any, null, { default: () => h(InnerProbe) }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    try {
      // 两层 ProForm 均真实挂载
      expect(wrapper.findAll('form.pro-form')).toHaveLength(2);
      expect(wrapper.find('.pf-e1-probe').exists()).toBe(true);

      // 判别点：内层实例与父实例非同体，数据 store 亦不共享（父子 store 复用分支未经由嵌套 ProForm 进入）
      expect(innerForm).toBeTruthy();
      expect(innerForm).not.toBe(outerForm);
      expect(innerForm.formData).not.toBe(outerForm.formData);
      expect(innerForm.getFormData('outer')).toBeUndefined();

      innerForm.setFormData('inner', 'I');
      expect(innerForm.getFormData('inner')).toBe('I');
      expect(outerForm.getFormData('inner')).toBeUndefined();

      outerForm.setFormData('outer', 'O2');
      expect(outerForm.getFormData('outer')).toBe('O2');
      expect(innerForm.getFormData('outer')).toBeUndefined();
    } finally {
      wrapper.unmount();
    }
  });

  // ----------------------------------------------------
  // PF-E2 [判别]: 子树内公开 useFormData() 无参调用复用最近一层表单的数据 store
  // ----------------------------------------------------
  it('PF-E2 [判别]: ProForm 子树内以公开 useFormData() 无参调用复用最近一层 useForm 的数据 store', async () => {
    let injectedForm: any;
    let childStore: any;
    const StoreProbe = defineComponent({
      setup() {
        injectedForm = useForm(false);
        childStore = useFormData();
        return () => h('div', { class: 'pf-e2-probe' });
      },
    });

    const wrapper = mount(ProForm as any, {
      slots: { default: () => h(StoreProbe) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    try {
      expect(wrapper.find('.pf-e2-probe').exists()).toBe(true);
      // 判别点 1：无参调用命中父 store 复用分支，取到与注入实例同一份 formData
      expect(childStore).toBeTruthy();
      expect(childStore.formData).toBe(injectedForm.formData);

      // 判别点 2：子侧写入即父侧数据，父侧写入子侧实时可见
      childStore.setFormData('fromChild', 'C');
      expect(injectedForm.getFormData('fromChild')).toBe('C');
      injectedForm.setFormData('fromParent', 'P');
      expect(childStore.getFormData('fromParent')).toBe('P');
    } finally {
      wrapper.unmount();
    }
  });

  // ----------------------------------------------------
  // PF-E3 [判别]: :form prop 与内部兜底实例的数据 store 分离
  // ----------------------------------------------------
  it('PF-E3 [判别]: 传入 :form 时注入代理指向 prop 实例，而 useFormData() 取内部兜底实例的 store', async () => {
    const form = useForm({ outer: 'O' }, [
      { path: 'outer', label: '外层', component: 'input' },
    ] as any);

    let injectedForm: any;
    let childStore: any;
    const StoreProbe = defineComponent({
      setup() {
        injectedForm = useForm(false);
        childStore = useFormData();
        return () => h('div', { class: 'pf-e3-probe' });
      },
    });

    const wrapper = mount(ProForm as any, {
      props: { form },
      slots: { default: () => h(StoreProbe) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    try {
      // 判别点 1：注入代理按 currentForm 路由到 :form prop 实例
      expect(injectedForm.formData).toBe(form.formData);
      expect(injectedForm.getFormData('outer')).toBe('O');

      // 判别点 2：useFormData() 复用的是 ProForm 内部兜底实例的 store，与 prop 实例数据互不相通
      expect(childStore.formData).not.toBe(form.formData);
      expect(childStore.getFormData('outer')).toBeUndefined();
      childStore.setFormData('fromFallbackStore', 'F');
      expect(form.getFormData('fromFallbackStore')).toBeUndefined();
    } finally {
      wrapper.unmount();
    }
  });

  // ----------------------------------------------------
  // PF-U1 [判别]: 显式 undefined 绑定不冲掉 Provider 注入
  // ----------------------------------------------------
  it('PF-U1 [判别]: 显式 :disabled="undefined" 保留下发的 Provider 注入值', async () => {
    const form = useForm({ name: '' }, [
      { prop: 'name', label: '姓名', component: 'input' },
    ] as any);
    const wrapper = mount(ProComponentProvider as any, {
      props: { componentVars: { 'pro-form': { disabled: true } } },
      slots: {
        default: () =>
          h(ProForm, {
            form,
            // 判别的关键：绑定键存在但值为 undefined
            disabled: undefined,
          } as any),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 判别点：未显式指定时该键不下发，Provider 注入的禁用态保持生效
    expect(wrapper.findComponent(ElForm).props('disabled')).toBe(true);
    expect(wrapper.find('input').attributes('disabled')).toBeDefined();

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-U4 [判别]: 字段级 disabled 形态归一
  // ----------------------------------------------------
  it('PF-U4 [判别]: 字段 disabled="" / "disabled" 为 true，null 回退 Provider', async () => {
    const mountWithFieldDisabled = (
      disabled: unknown,
      providerDisabled?: boolean
    ) => {
      const form = useForm({ name: '' }, [
        { path: 'name', component: 'input', disabled } as any,
      ]);
      return mount(ProComponentProvider as any, {
        props: {
          componentVars:
            providerDisabled === undefined
              ? {}
              : { 'pro-form': { disabled: providerDisabled } },
        },
        slots: {
          default: () => h(ProForm, { form } as any),
        },
        global: { stubs: { transition: false } },
      });
    };

    // 裸属性形态与同名属性形态均为 true
    const empty = mountWithFieldDisabled('');
    await flushPromises();
    expect(empty.findComponent(ElInput).props('disabled')).toBe(true);
    empty.unmount();

    const named = mountWithFieldDisabled('disabled');
    await flushPromises();
    expect(named.findComponent(ElInput).props('disabled')).toBe(true);
    named.unmount();

    // null 回退 Provider；显式 false 覆盖 Provider
    const fallback = mountWithFieldDisabled(null, true);
    await flushPromises();
    expect(fallback.findComponent(ElInput).props('disabled')).toBe(true);
    fallback.unmount();

    const explicitFalse = mountWithFieldDisabled(false, true);
    await flushPromises();
    expect(explicitFalse.findComponent(ElInput).props('disabled')).toBe(false);
    explicitFalse.unmount();
  });

  // ----------------------------------------------------
  // PF-U5 [判别]: 未传 grid 且无 Provider 配置时默认关闭网格
  // ----------------------------------------------------
  it('PF-U5 [判别]: 未传 grid 时默认不启用网格布局', async () => {
    const form = useForm({ name: '' }, [
      { path: 'name', label: '姓名', component: 'input', span: 12 },
    ] as any);
    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.find('.el-col-12').exists()).toBe(false);
    expect(wrapper.findComponent(ElInput).exists()).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-U6 [判别]: grid:true 时使用内置默认栅格间距
  // ----------------------------------------------------
  it('PF-U6 [判别]: grid:true 使用内置默认 gutter', async () => {
    const form = useForm({ name: '' }, [
      { path: 'name', label: '姓名', component: 'input', span: 12 },
    ] as any);
    const wrapper = mount(ProForm, {
      props: { form, grid: true },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.find('.el-col-12').exists()).toBe(true);
    expect(wrapper.findComponent(ElRow).props('gutter')).toEqual(24);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-U2 [判别]: Provider 的 grid 只提供启用时的参数，不单独开启网格
  // ----------------------------------------------------
  it('PF-U2 [判别]: Provider grid 仅配置参数，不单独开启网格', async () => {
    const form = useForm({ name: '' }, [
      { path: 'name', label: '姓名', component: 'input', span: 12 },
    ] as any);
    const mountInProvider = (grid?: boolean) =>
      mount(ProComponentProvider as any, {
        props: { componentVars: { 'pro-form': { grid: { gutter: 24 } } } },
        slots: {
          default: () =>
            h(ProForm, {
              form,
              ...(grid === undefined ? {} : { grid }),
            } as any),
        },
        global: { stubs: { transition: false } },
      });

    // 未传 grid：Provider 参数不构成开启开关
    const wrapper = mountInProvider();
    await flushPromises();
    expect(wrapper.find('.el-col-12').exists()).toBe(false);
    wrapper.unmount();

    // grid:true：开启网格，并采用 Provider 提供的 gutter
    const enabled = mountInProvider(true);
    await flushPromises();
    expect(enabled.find('.el-col-12').exists()).toBe(true);
    expect(enabled.findComponent(ElRow).props('gutter')).toEqual(24);
    enabled.unmount();

    // 显式 grid=false：关闭网格
    const disabled = mountInProvider(false);
    await flushPromises();
    expect(disabled.find('.el-col-12').exists()).toBe(false);
    disabled.unmount();
  });
});
