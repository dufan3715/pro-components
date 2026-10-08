import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, shallowRef, nextTick, ref } from 'vue';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { Field as VanField, Form as VanForm } from '../src/shared/ui';
import { createBasicFields, createNestedFields } from './helpers/fixtures';
import { mountProForm } from './helpers/mount';

describe('ProForm 组件测试 (vant-pro)', () => {
  // ----------------------------------------------------
  // VP-A2 [判别]: fallbackForm
  // ----------------------------------------------------
  it('VP-A2 [判别]: 未传 form 时自建表单实例，下游 useForm(false) 可正常读写数据', async () => {
    const wrapper = mount(ProForm, {
      props: {},
      slots: {
        default: () =>
          h({
            setup() {
              const innerForm = useForm(false);
              innerForm.setFormData('autoField', 'autoVal');
              return () =>
                h(
                  'div',
                  { class: 'inner-probe' },
                  innerForm.getFormData('autoField')
                );
            },
          }),
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    expect(wrapper.find('.inner-probe').text()).toBe('autoVal');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-B1 [判别]: Proxy 动态转发
  // ----------------------------------------------------
  it('VP-B1 [判别]: 运行期替换 :form prop 时，子组件读写始终代理至最新 form 实例', async () => {
    const form1 = useForm({ username: 'Alice' }, [
      { path: 'username', component: 'field' },
    ]);
    const form2 = useForm({ username: 'Bob' }, [
      { path: 'username', component: 'field' },
    ]);

    const currentFormRef = shallowRef(form1);

    const wrapper = mount(
      {
        setup() {
          return () => h(ProForm, { form: currentFormRef.value });
        },
      },
      {
        global: { stubs: { transition: false } },
      }
    );

    await flushPromises();
    const inputEl = wrapper.find('input');
    expect((inputEl.element as HTMLInputElement).value).toBe('Alice');

    // 运行期动态替换为 form2
    currentFormRef.value = form2;
    await nextTick();
    await flushPromises();

    const updatedInputEl = wrapper.find('input');
    expect((updatedInputEl.element as HTMLInputElement).value).toBe('Bob');
    expect(form2.formRef.value).toBeTruthy();
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-B2 [判别]: 运行期 :form 置空时回退内部表单，不崩溃且可读写
  // ----------------------------------------------------
  it('VP-B2 [判别]: 运行期 :form 置空时回退内部表单实例，渲染不中断', async () => {
    const form1 = useForm({ username: 'Alice' }, [
      { path: 'username', component: 'field' },
    ]);

    const currentFormRef = shallowRef<any>(form1);

    const wrapper = mount(
      {
        setup() {
          return () => h(ProForm, { form: currentFormRef.value });
        },
      },
      {
        global: { stubs: { transition: false } },
      }
    );

    await flushPromises();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe(
      'Alice'
    );

    // 运行期置空 :form（条件清空表单场景）
    currentFormRef.value = undefined;
    await nextTick();
    await flushPromises();

    // 渲染不中断，子树以回退的内部表单渲染（回退表单字段列表为空）
    expect(wrapper.find('form').exists()).toBe(true);
    wrapper.unmount();
  });

  it('VP-B2b [判别]: :form 置空后，子组件经注入代理读写回退的内部表单', async () => {
    let probe: any;
    const ChildComponent = {
      setup() {
        probe = useForm(false);
        return () => h('div', { class: 'child-form' }, 'child');
      },
    };

    const form1 = useForm({ username: 'Alice' }, [
      { path: 'username', component: 'field' },
    ]);
    const currentFormRef = shallowRef<any>(form1);

    const wrapper = mount(
      {
        setup() {
          return () =>
            h(
              ProForm,
              { form: currentFormRef.value },
              { default: () => h(ChildComponent) }
            );
        },
      },
      {
        global: { stubs: { transition: false } },
      }
    );

    await flushPromises();
    expect(probe.getFormData('username')).toBe('Alice');

    currentFormRef.value = undefined;
    await nextTick();
    await flushPromises();

    // 回退内部表单：可写可读，且旧实例数据不被污染
    probe.setFormData('username', 'written-to-fallback');
    expect(probe.getFormData('username')).toBe('written-to-fallback');
    expect(form1.getFormData('username')).toBe('Alice');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-H1 [判别]: 嵌套路径
  // ----------------------------------------------------
  it('VP-H1 [判别]: 嵌套路径字段生成正确的点分字符串 name 属性', async () => {
    const { wrapper } = mountProForm({
      fields: createNestedFields(),
      initialData: {
        user: {
          name: 'Charlie',
          address: { city: 'Hangzhou' },
        },
      },
    });

    await flushPromises();
    const fields = wrapper.findAllComponents(VanField);
    expect(fields.length).toBe(2);
    expect(fields[0].props('name')).toBe('user.name');
    expect(fields[1].props('name')).toBe('user.address.city');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-01: 动态插槽自定义字段
  // ----------------------------------------------------
  it('VP-01: 支持通过以 path 命名的插槽自定义渲染字段', async () => {
    const { wrapper } = mountProForm({
      fields: [{ path: 'customField', component: 'field' }],
      slots: {
        customField: ({ value, onUpdateValue }: any) =>
          h('input', {
            class: 'custom-slot-input',
            value,
            onInput: (e: any) => onUpdateValue(e.target.value),
          }),
      },
    });

    await flushPromises();
    expect(wrapper.find('.custom-slot-input').exists()).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-02: 递归 fields
  // ----------------------------------------------------
  it('VP-02: 支持 fields 递归字段配置', async () => {
    const { wrapper } = mountProForm({
      fields: [
        {
          path: 'group',
          fields: [
            { path: 'group.child1', label: '子项1', component: 'field' },
            { path: 'group.child2', label: '子项2', component: 'field' },
          ],
        },
      ],
      initialData: { group: { child1: 'val1', child2: 'val2' } },
    });

    await flushPromises();
    const fields = wrapper.findAllComponents(VanField);
    expect(fields.length).toBe(2);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-03: disabled 传递
  // ----------------------------------------------------
  it('VP-03: ProForm 的 disabled 属性正确透传至底层 VanForm', async () => {
    const { wrapper } = mountProForm({
      fields: createBasicFields(),
      props: { disabled: true },
    });

    await flushPromises();
    const formComp = wrapper.findComponent(VanForm);
    expect(formComp.props('disabled')).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-04: formRef 绑定
  // ----------------------------------------------------
  it('VP-04: form.formRef.value 正确绑定到底层 vant Form 实例', async () => {
    const { wrapper, form } = mountProForm({
      fields: createBasicFields(),
    });

    await flushPromises();
    expect(form.formRef.value).toBeTruthy();
    expect(wrapper.findComponent(VanForm).exists()).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-05: VanForm 属性透传
  // ----------------------------------------------------
  it('VP-05: 支持透传 VanForm 属性与触发事件', async () => {
    const { wrapper } = mountProForm({
      fields: [{ path: 'title', component: 'field' }],
      props: {
        labelWidth: '120px',
        inputAlign: 'center',
      },
    });

    await flushPromises();
    const vanForm = wrapper.findComponent(VanForm);
    expect(vanForm.props('labelWidth')).toBe('120px');
    expect(vanForm.props('inputAlign')).toBe('center');
    wrapper.unmount();
  });
  // ----------------------------------------------------
  // VP-C1 [判别]: 运行期动态增删字段插槽可被 BaseField 感知
  // ----------------------------------------------------
  it('VP-C1 [判别]: 父组件运行期增/删以 path 命名的插槽后，字段渲染随之前后切换', async () => {
    const form = useForm({}, [
      { path: 'kw', label: '关键词', component: 'field' },
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
      { path: 'a', label: 'A', component: 'field' },
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
  // VP-V19 [判别]: 运行期替换 :form 实例触发整棵表单子树重挂载（formKey 契约）
  // ----------------------------------------------------
  it('VP-V19 [判别]: 运行期替换 :form 实例时表单子树重挂载，字段控件状态整体重置', async () => {
    let setupCount = 0;
    const CountingField = defineComponent({
      name: 'CountingField',
      props: { modelValue: { default: undefined } },
      setup(props) {
        setupCount++;
        return () =>
          h('input', { class: 'counting-field', value: props.modelValue });
      },
    });

    // 两个表单共用同一批字段对象：字段渲染 key 不随 :form 替换变化
    const sharedFields = [
      { path: 'username', component: CountingField as any },
    ] as any;

    const form1 = useForm({ username: 'Alice' }, sharedFields);
    const form2 = useForm({ username: 'Bob' }, sharedFields);

    const currentForm = shallowRef(form1);
    const wrapper = mount(
      {
        setup() {
          return () => h(ProForm, { form: currentForm.value });
        },
      },
      { global: { stubs: { transition: false } } }
    );

    await flushPromises();
    expect(setupCount).toBe(1);
    const inputBefore = wrapper.find('input.counting-field').element;
    expect((inputBefore as HTMLInputElement).value).toBe('Alice');

    // 运行期替换 :form 实例
    currentForm.value = form2;
    await nextTick();
    await flushPromises();

    // 判别点：字段控件随宿主表单重挂载（重新 setup），节点重建而非原位复用
    expect(setupCount).toBe(2);
    const inputAfter = wrapper.find('input.counting-field').element;
    expect(inputAfter).not.toBe(inputBefore);
    expect((inputAfter as HTMLInputElement).value).toBe('Bob');
    wrapper.unmount();
  });
});
