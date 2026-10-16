/**
 * 跨包行为一致性回归用例 —— antdv-next-pro 子集
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { computed, defineComponent, h, markRaw, ref } from 'vue';
import { mount } from '@vue/test-utils';
import {
  expectWarn,
  flushPromises,
  mountProTable,
  waitForRaf,
} from './helpers/mount';
import { useForm } from '../src/components/form';
import type { Field } from '../src/components/form/types';
import { useTable } from '../src/components/table/hooks/useTable';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import ProTable from '../src/components/table/components/ProTable.vue';
import SearchForm from '../src/components/table/components/SearchForm.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import { activeIntersectionObservers, triggerResize } from './setup';

import { INJECT_CONFIG } from '../src/components/component-provider/constants';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('跨包一致性 · antdv-next-pro', () => {
  it('5.4 input-number 默认配置 min/max 保持对称', () => {
    const config = INJECT_CONFIG['input-number'].default;
    expect(config.max).toBe(10 ** 15 - 1);
    expect(config.min).toBe(-(10 ** 15 - 1));
  });
  it('索引列序号随分页偏移', async () => {
    const dataSource = Array.from({ length: 12 }, (_, i) => ({
      id: `row-${i + 1}`,
    }));
    const { wrapper, table } = await mountProTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource,
      props: { addIndexColumn: true },
    });
    table.setPageParam({ current: 2, pageSize: 10 });
    await flushPromises();
    const firstRowFirstCell = wrapper.findAll('tbody tr')[0]?.findAll('td')[0];
    expect(firstRowFirstCell?.text()).toBe('11');
    wrapper.unmount();
  });

  it('全部搜索字段隐藏时不渲染搜索区', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [{ id: 1 }],
      searchParam: {},
      searchFields: [
        { path: 'kw', label: '关键词', component: 'input', hidden: true },
        { path: 'st', label: '状态', component: 'select', hidden: true },
      ] as any,
    });
    const wrapper = mount(ProTable, {
      props: { table },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.find('.pro-table_search-form').exists()).toBe(false);
    // 字段恢复可见后搜索区应出现
    table.searchForm.setField('kw' as any, { hidden: false });
    await flushPromises();
    expect(wrapper.find('.pro-table_search-form').exists()).toBe(true);
    wrapper.unmount();
  });

  it('注入级 formItemContainer 生效且不泄漏 DOM 属性', async () => {
    const InjectedContainer = defineComponent({
      name: 'InjectedContainerNext',
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

  it('disabledKeys 原地 push 即时生效（deep watch）', async () => {
    const config = ref<any>({ disabledKeys: ['name'] });
    const columns = [
      { dataIndex: 'name', title: '姓名', hidden: true },
      { dataIndex: 'age', title: '年龄', hidden: true },
    ];
    const table = useTable({ columns, dataSource: [] } as any);
    const Host = defineComponent({
      setup() {
        return () =>
          h(ProTable, {
            table,
            control: { columnControl: config.value },
          });
      },
    });
    const wrapper = mount(Host, {
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    // 原地 push 新的 disabledKey：deep watch 应强制 age 列显示
    config.value.disabledKeys.push('age');
    await flushPromises();
    const ageCol = table.columns.value.find((c: any) => c.dataIndex === 'age');
    expect(ageCol?.hidden).toBe(false);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PC-A7 [判别]: 字段 hidden 的类型面为 Ref / ComputedRef，渲染期按 toValue 过滤
  // ----------------------------------------------------
  it('PC-A7 [判别]: 字段 hidden 支持 Ref / ComputedRef 形态，翻转驱动字段显隐', async () => {
    const hiddenRef = ref(true);
    const hiddenComputed = computed(() => hiddenRef.value);
    const fields: Field[] = [
      { path: 'a', label: '甲', component: 'input' },
      { path: 'b', label: '乙', component: 'input', hidden: hiddenRef },
      { path: 'c', label: '丙', component: 'input', hidden: hiddenComputed },
      // 类型面：getter 形态不属于 hidden 契约（四包统一为 Ref / ComputedRef）
      // @ts-expect-error hidden 不接受 getter 形式
      { path: 'd', label: '丁', component: 'input', hidden: () => true },
    ];
    const form = useForm({ a: '', b: '', c: '', d: '' }, fields);
    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    // Ref(true) 与 ComputedRef(true) 的字段均不渲染；getter 项运行期经 toValue 同样被过滤
    expect(wrapper.text()).toContain('甲');
    expect(wrapper.text()).not.toContain('乙');
    expect(wrapper.text()).not.toContain('丙');
    expect(wrapper.text()).not.toContain('丁');

    hiddenRef.value = false;
    await flushPromises();
    // 翻转外部 ref：两个响应式形态同时随取值出现，getter 项仍不进入渲染
    expect(wrapper.text()).toContain('乙');
    expect(wrapper.text()).toContain('丙');
    expect(wrapper.text()).not.toContain('丁');
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
    (wrapper.vm as any).search();
    (wrapper.vm as any).search();
    await flushPromises();

    resolvers[0]();
    await flushPromises();
    expect((wrapper.findComponent(ProTable) as any).vm.loading).toBe(true);

    resolvers[1]();
    await flushPromises();
    expect((wrapper.findComponent(ProTable) as any).vm.loading).toBe(false);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PC-A5 [判别]: 字段 componentStyle 覆盖 Provider 注入的预设 style
  // ----------------------------------------------------
  it('PC-A5 [判别]: 字段 componentStyle 覆盖 Provider 注入的预设样式', async () => {
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

    // 字段级 componentStyle 生效，注入预设不覆盖
    expect(wrapper.html()).toContain('width: 80%');
    expect(wrapper.html()).not.toContain('width: 100%');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PC-A6 [判别]: 运行期替换 Provider 的 componentMap 后解析结果即时切换
  // ----------------------------------------------------
  it('PC-A6 [判别]: 运行期替换 componentMap 后自定义组件即时生效', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const CustomComp = markRaw(
      defineComponent({
        name: 'CustomCompForReplace',
        setup: () => () => h('div', { class: 'component-map-replaced' }),
      })
    );
    const compMap = ref<Record<string, any>>({});
    const form = useForm({}, [
      { path: 'name', label: '姓名', component: 'comp-for-replace' },
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
    try {
      await flushPromises();

      // 未注册时降级渲染原生元素并告警一次
      expect(wrapper.find('.component-map-replaced').exists()).toBe(false);
      expectWarn(warnSpy, '未识别的组件类型 "comp-for-replace"');
      const warnCountBefore = warnSpy.mock.calls.length;

      // 运行期替换 componentMap：命中新映射并渲染自定义组件，不再产生未识别告警
      compMap.value = { 'comp-for-replace': CustomComp };
      await flushPromises();
      expect(wrapper.find('.component-map-replaced').exists()).toBe(true);
      expect(warnSpy.mock.calls.length).toBe(warnCountBefore);
    } finally {
      warnSpy.mockRestore();
      wrapper.unmount();
    }
  });

  // ----------------------------------------------------
  // PT-A30 [判别]: 条件插槽运行期出现与消失
  // ----------------------------------------------------
  it('PT-A30 [判别]: toolbar 条件插槽运行期出现与消失', async () => {
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
                ? {
                    toolbar: () =>
                      h('div', { class: 'dyn-toolbar' }, 'TOOLBAR'),
                  }
                : {}),
            }
          );
      },
    });
    const wrapper = mount(Host, {
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.find('.dyn-toolbar').exists()).toBe(false);

    // 运行期出现：ProForm 的插槽映射经 onUpdated 通知下游
    showToolbar.value = true;
    await flushPromises();
    expect(wrapper.find('.dyn-toolbar').exists()).toBe(true);

    // 运行期消失
    showToolbar.value = false;
    await flushPromises();
    expect(wrapper.find('.dyn-toolbar').exists()).toBe(false);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SF-A17 [判别]: labelCol 经 SearchForm → ProForm 透传链路到达宿主 Form
  // ----------------------------------------------------
  it('SF-A17 [判别]: labelCol 经透传链路到达宿主 Form', async () => {
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

  // ----------------------------------------------------
  // SF-A18 [判别]: 展开检测选择器在真实 DOM 中命中全部字段元素
  // ----------------------------------------------------
  it('SF-A18 [判别]: 展开检测选择器在真实 DOM 中命中字段元素', async () => {
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(100);
    let wrapper: ReturnType<typeof mount> | undefined;

    try {
      const form = useForm({}, [
        { path: 'visibleField', label: '第一行', component: 'input' },
        { path: 'hiddenField', label: '隐藏行', component: 'input' },
      ]);
      wrapper = mount(SearchForm, {
        props: {
          form,
          expand: { minExpandRows: 1, expandStatus: false },
        },
        attachTo: document.body,
        global: { stubs: { transition: false } },
      });
      await flushPromises();

      const formEl = (form.formRef.value as any)?.$el as HTMLElement;
      expect(formEl).toBeTruthy();
      triggerResize(formEl);
      await waitForRaf();
      await flushPromises();

      // 展开按钮出现后注册观察器：展开检测选择器必须命中真实 DOM 中的字段元素
      expect(
        wrapper.find('.pro-table_search-form_expand-toggle-button').exists()
      ).toBe(true);
      const observedPaths = [
        ...new Set(
          [...activeIntersectionObservers].flatMap(entry =>
            [...entry.elements].map(el => el.getAttribute('path'))
          )
        ),
      ];
      expect(observedPaths.sort()).toEqual(['hiddenField', 'visibleField']);
    } finally {
      scrollHeightSpy.mockRestore();
      wrapper?.unmount();
      document.body.innerHTML = '';
    }
  });

  // ----------------------------------------------------
  // BF-A16 [判别]: 未知组件名告警按名称去重，全生命周期仅一次
  // ----------------------------------------------------
  it('BF-A16 [判别]: 未识别组件名告警按名称去重且不同名称各自告警一次', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const makeForm = (component: string) =>
        useForm({ v: '' }, [{ path: 'v', label: '字段', component }] as any);
      const w1 = mount(ProForm, {
        props: { form: makeForm('no-such-comp-a16') },
        global: { stubs: { transition: false } },
      });
      const w2 = mount(ProForm, {
        props: { form: makeForm('no-such-comp-a16') },
        global: { stubs: { transition: false } },
      });
      const w3 = mount(ProForm, {
        props: { form: makeForm('no-such-comp-b16') },
        global: { stubs: { transition: false } },
      });
      await flushPromises();

      const hits = (name: string) =>
        warnSpy.mock.calls
          .flat()
          .map(String)
          .filter(msg => msg.includes(name));
      // 同一名称挂载两次仅告警一次；不同名称独立告警
      expect(hits('no-such-comp-a16')).toHaveLength(1);
      expect(hits('no-such-comp-b16')).toHaveLength(1);
      w1.unmount();
      w2.unmount();
      w3.unmount();
    } finally {
      warnSpy.mockRestore();
    }
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
