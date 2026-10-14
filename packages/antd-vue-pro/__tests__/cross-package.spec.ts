/**
 * 跨包行为一致性回归用例 —— 覆盖四包同构行为点，防移植漂移
 * 四个 UI 包使用同名规格文件；本文件覆盖 antd-vue-pro 的适用子集。
 */
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { flushPromises, mountProTable } from './helpers/mount';
import { useForm } from '../src/components/form';
import { useTable } from '../src/components/table/hooks/useTable';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import ProTable from '../src/components/table/components/ProTable.vue';
import SearchForm from '../src/components/table/components/SearchForm.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';

import { INJECT_CONFIG } from '../src/components/component-provider/constants';

describe('跨包一致性 · antd-vue-pro', () => {
  it('5.4 input-number 默认配置 min/max 保持对称', () => {
    const config = INJECT_CONFIG['input-number'].default;
    expect(config.max).toBe(10 ** 15 - 1);
    expect(config.min).toBe(-(10 ** 15 - 1));
  });
  it('索引列序号随分页偏移', async () => {
    const dataSource = Array.from({ length: 12 }, (_, i) => ({ id: i + 1 }));
    const { wrapper, table } = await mountProTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource,
      props: { addIndexColumn: true },
    });
    table.setPageParam({ current: 2, pageSize: 10 });
    await flushPromises();
    // 第二页首个数据行的序号列应为 11
    const firstRowFirstCell = wrapper.findAll('tbody tr')[0]?.findAll('td')[0];
    expect(firstRowFirstCell?.text()).toBe('11');
    wrapper.unmount();
  });

  it('用户 componentStyle 覆盖注入预设样式', async () => {
    const form = useForm({ name: '' }, [
      {
        path: 'name',
        label: '姓名',
        component: 'input',
        componentStyle: { width: '80%' },
      } as any,
    ]);
    const Host = defineComponent({
      setup(_, { slots }) {
        return () =>
          h(
            ProComponentProvider,
            { componentVars: { input: { style: { width: '100%' } } } },
            slots
          );
      },
    });
    const wrapper = mount(Host, {
      slots: { default: () => h(ProForm, { form }) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.html()).toContain('width: 80%');
    wrapper.unmount();
  });

  it('注入级 formItemContainer 生效且不再泄漏 DOM 属性', async () => {
    const InjectedContainer = defineComponent({
      name: 'InjectedContainer',
      setup(_, { slots }) {
        return () =>
          h(
            'section',
            { class: 'injected-formitem-container' },
            slots.default?.()
          );
      },
    });
    const form = useForm({ name: '' }, [
      { path: 'name', label: '姓名', component: 'input' },
    ]);
    const Host = defineComponent({
      setup(_, { slots }) {
        return () =>
          h(
            ProComponentProvider,
            {
              componentVars: {
                'pro-form-item': { formItemContainer: InjectedContainer },
              },
            },
            slots
          );
      },
    });
    const wrapper = mount(Host, {
      slots: { default: () => h(ProForm, { form }) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.find('section.injected-formitem-container').exists()).toBe(
      true
    );
    expect(/formitemcontainer/i.test(wrapper.html())).toBe(false);
    wrapper.unmount();
  });

  it('运行期替换 componentMap 后自定义组件生效', async () => {
    const CustomComp = defineComponent({
      name: 'CustomCompForC8',
      setup: () => () => h('div', { class: 'c8-custom-marker' }),
    });
    const compMap = ref<Record<string, any>>({});
    const form = useForm({}, [
      { path: 'name', label: '姓名', component: 'comp-for-c8' },
    ] as any);
    const Host = defineComponent({
      setup(_, { slots }) {
        return () =>
          h(ProComponentProvider, { componentMap: compMap.value }, slots);
      },
    });
    const wrapper = mount(Host, {
      slots: { default: () => h(ProForm, { form }) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.find('.c8-custom-marker').exists()).toBe(false);

    compMap.value = { 'comp-for-c8': CustomComp };
    await flushPromises();
    expect(wrapper.find('.c8-custom-marker').exists()).toBe(true);
    wrapper.unmount();
  });

  it('响应式 hidden —— getter 函数形式随取值动态隐藏', async () => {
    const flag = ref(true);
    const form = useForm({}, [
      { path: 'name', label: '姓名', component: 'input' },
      {
        path: 'age',
        label: '年龄',
        component: 'input-number',
        hidden: () => flag.value,
      },
    ] as any);
    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.text()).not.toContain('年龄');
    flag.value = false;
    await flushPromises();
    expect(wrapper.text()).toContain('年龄');
    wrapper.unmount();
  });

  it('条件插槽动态出现与消失', async () => {
    const showToolbar = ref(false);
    const table = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [],
    });
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            ProTable,
            { table },
            {
              ...(showToolbar.value
                ? { toolbar: () => h('div', { class: 'r5-dyn-toolbar' }, 'T') }
                : {}),
            }
          );
      },
    });
    const wrapper = mount(Host, {
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.find('.r5-dyn-toolbar').exists()).toBe(false);

    showToolbar.value = true;
    await flushPromises();
    expect(wrapper.find('.r5-dyn-toolbar').exists()).toBe(true);

    showToolbar.value = false;
    await flushPromises();
    expect(wrapper.find('.r5-dyn-toolbar').exists()).toBe(false);
    wrapper.unmount();
  });

  it('先结束的旧请求不会熄灭新请求的 loading', async () => {
    const resolvers: Array<() => void> = [];
    const search = vi
      .fn()
      .mockImplementation(() => new Promise<void>(r => resolvers.push(r)));
    const { wrapper } = await mountProTable({
      search,
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [],
    });

    const vm = wrapper.vm as any;
    vm.search();
    vm.search();
    await flushPromises();

    // 结束第一个（较旧）请求：loading 必须保持
    resolvers[0]();
    await flushPromises();
    expectLoadingHolds(wrapper, true);

    // 结束最新请求：loading 关闭
    resolvers[1]();
    await flushPromises();
    expectLoadingHolds(wrapper, false);
    wrapper.unmount();

    function expectLoadingHolds(w: any, expected: boolean) {
      const tableVm = w.findComponent(ProTable).vm as any;
      expect(tableVm.loading).toBe(expected);
    }
  });

  it('labelCol 经透传链路到达 AForm（防回归）', async () => {
    const form = useForm({ keyword: '' }, [
      { path: 'keyword', label: '关键词', component: 'input' },
    ]);
    const wrapper = mount(SearchForm, {
      props: { form, labelCol: { span: 9 } } as any,
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.html()).toContain('ant-col-9');
    wrapper.unmount();
  });

  it('展开检测选择器在真实 DOM 中命中（防回归）', async () => {
    const form = useForm({ keyword: '' }, [
      { path: 'keyword', label: '关键词', component: 'input' },
    ]);
    const wrapper = mount(ProForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(
      document.querySelectorAll("[class*='-form-item'] > [path]").length
    ).toBeGreaterThan(0);
    wrapper.unmount();
    document.body.innerHTML = '';
  });

  it('未知组件名的告警全生命周期仅一次', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const makeForm = () =>
      useForm({ v: '' }, [
        { path: 'v', label: '字段', component: 'no-such-comp-m4' },
      ] as any);
    const w1 = mount(ProForm, {
      props: { form: makeForm() },
      global: { stubs: { transition: false } },
    });
    const w2 = mount(ProForm, {
      props: { form: makeForm() },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    const calls = spy.mock.calls.flat().map(String);
    const hits = calls.filter(c => c.includes('no-such-comp-m4'));
    expect(hits.length).toBe(1);
    w1.unmount();
    w2.unmount();
  });

  // ----------------------------------------------------
  // [判别] 宿主标识键优先于 path：name 覆盖 path 作为字段标识
  // ----------------------------------------------------
  it('[判别] 宿主标识键优先于 path：name 覆盖 path，值绑定与字段查找共用同一标识', async () => {
    const form = useForm({ a: '', b: '' }, [
      { name: 'a', path: 'b', component: 'input' },
    ] as any);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    await wrapper.find('input').setValue('x');
    await flushPromises();

    // 渲染与取值按 name 解析出的标识
    expect(form.getFormData('a')).toBe('x');
    expect(form.getFormData('b')).toBe('');
    // 字段查找 API 与渲染标识一致
    expect(!!form.getField('a')).toBe(true);
    expect(!!form.getField('b')).toBe(false);

    wrapper.unmount();
  });
});
