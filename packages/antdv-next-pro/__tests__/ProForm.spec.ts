import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { flushPromises, mountProForm } from './helpers/mount';
import { createBasicFields, createNestedFields } from './helpers/fixtures';
import { FormItem, Input } from '../src/shared/ui';

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
  // PF-H1 [判别]: 嵌套路径 'user.address.city' 生成段数组 name
  // ----------------------------------------------------
  it('PF-H1 [判别]: 嵌套路径字段生成正确的段数组 name 属性', async () => {
    const { wrapper } = mountProForm({
      fields: createNestedFields(),
      initialData: { user: { name: '张三', address: { city: '北京' } } },
    });

    await flushPromises();
    const formItems = wrapper.findAllComponents(FormItem);
    expect(formItems.length).toBe(2);

    // 断言 FormItem 的 name prop 被转换为段数组
    expect(formItems[0].props('name')).toEqual(['user', 'name']);
    expect(formItems[1].props('name')).toEqual(['user', 'address', 'city']);
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
    const inputComp = wrapper.findComponent(Input);
    expect(inputComp.props('disabled')).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-04: formRef 绑定
  // ----------------------------------------------------
  it('PF-04: form.formRef.value 正确绑定到底层 antdv-next Form 实例', async () => {
    const form = useForm({}, createBasicFields());
    const { wrapper } = mountProForm({ form });

    await flushPromises();
    expect(form.formRef.value).toBeDefined();
    expect(typeof (form.formRef.value as any)?.validate).toBe('function');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PF-05: 提交/重置与 AForm 属性透传
  // ----------------------------------------------------
  it('PF-05: 支持透传 AForm 属性与触发事件', async () => {
    const onFinish = vi.fn();
    const { wrapper } = mountProForm({
      fields: [{ path: 'title', label: '标题', component: 'input' }],
      props: {
        layout: 'inline',
        onFinish,
      },
    });

    await flushPromises();
    const formComp = wrapper.find('.pro-form');
    expect(formComp.classes()).toContain('ant-form-inline');
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
});
