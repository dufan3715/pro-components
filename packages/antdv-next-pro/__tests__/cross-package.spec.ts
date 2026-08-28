/**
 * 跨包行为一致性回归用例 —— antdv-next-pro 子集
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { flushPromises, mountProTable } from './helpers/mount';
import { useForm } from '../src/components/form';
import { useTable } from '../src/components/table/useTable';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import ProTable from '../src/components/table/components/ProTable.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';

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

  it('getter 形式 hidden 随取值动态生效', async () => {
    const flag = ref(true);
    const form = useForm({}, [
      { path: 'a', label: '甲', component: 'input' },
      { path: 'b', label: '乙', component: 'input', hidden: () => flag.value },
    ] as any);
    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.text()).not.toContain('乙');
    flag.value = false;
    await flushPromises();
    expect(wrapper.text()).toContain('乙');
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
});
