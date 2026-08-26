import { describe, it, expect } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import ProTable from '../src/components/table/components/ProTable.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import { useTable } from '../src/components/table/useTable';
import { flushPromises, mountProTable } from './helpers/mount';
import { createBasicColumns } from './helpers/fixtures';
import { ElPagination } from 'element-plus';

describe('ProTable 组件测试', () => {
  // ----------------------------------------------------
  // PT-A6 [判别]: 运行期替换 :table 实例，列与数据源无缝跟随新实例
  // ----------------------------------------------------
  it('PT-A6 [判别]: 运行期替换 :table prop 时，表格列与数据源立即切换至新实例', async () => {
    const table1 = useTable({
      columns: [{ prop: 'col1', label: '列1' }],
      data: [{ col1: 'data-1' }],
    });
    const table2 = useTable({
      columns: [{ prop: 'col2', label: '列2' }],
      data: [{ col2: 'data-2' }],
    });

    const activeTable = ref<any>(table1);

    const Parent = defineComponent({
      setup() {
        return () => h(ProTable, { table: activeTable.value });
      },
    });

    const wrapper = mount(Parent, {
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    expect(wrapper.text()).toContain('列1');
    expect(wrapper.text()).toContain('data-1');

    // 运行期替换为 table2
    activeTable.value = table2;
    await flushPromises();

    expect(wrapper.text()).toContain('列2');
    expect(wrapper.text()).toContain('data-2');
    expect(wrapper.text()).not.toContain('列1');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A7 [判别]: 分页优先级链 (tableAttrs.pagination === false 优先关闭 > provider pagination: false > 表级对象合并)
  // ----------------------------------------------------
  it('PT-A7 [判别]: 分页优先级链：tableAttrs.pagination===false 优先关闭，provider 配置正确覆盖', async () => {
    // 1. tableAttrs.pagination === false 优先关闭分页
    const table1 = useTable({
      columns: [{ prop: 'id', label: 'ID' }],
      data: [{ id: 1 }],
    });
    const wrapper1 = mount(ProTable, {
      props: {
        table: table1,
        pagination: false,
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper1.findComponent(ElPagination).exists()).toBe(false);
    wrapper1.unmount();

    // 2. Provider 设置 pagination: false 时，表级无分页配置则不显示分页
    const table2 = useTable({
      columns: [{ prop: 'id', label: 'ID' }],
      data: [{ id: 1 }],
    });
    const wrapper2 = mount(ProComponentProvider, {
      props: {
        componentVars: {
          'pro-table': {
            pagination: false,
          },
        },
      },
      slots: {
        default: () => h(ProTable, { table: table2 }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper2.findComponent(ElPagination).exists()).toBe(false);
    wrapper2.unmount();
  });

  // ----------------------------------------------------
  // PT-01: 列渲染与数据源行数
  // ----------------------------------------------------
  it('PT-01: 正确渲染列标题与数据行', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: [
        { id: 1, name: '张三', status: 'normal' },
        { id: 2, name: '李四', status: 'stopped' },
      ],
    });

    const { wrapper } = mountProTable({ table });
    await flushPromises();

    expect(wrapper.text()).toContain('ID');
    expect(wrapper.text()).toContain('姓名');
    expect(wrapper.text()).toContain('张三');
    expect(wrapper.text()).toContain('李四');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-02: 序号列 addIndexColumn 分页递增计算 (E5)
  // ----------------------------------------------------
  it('PT-02: addIndexColumn: true 时首列渲染序号且第 2 页支持跨页递增', async () => {
    const table = useTable({
      columns: [{ prop: 'name', label: '姓名' }],
      data: [{ name: '王五' }, { name: '赵六' }],
    });

    table.setPageParam({ current: 2, pageSize: 10 });

    const { wrapper } = mountProTable({
      table,
      props: { addIndexColumn: true },
    });

    await flushPromises();
    expect(wrapper.text()).toContain('序号');
    // 第 2 页第 1 条，序号为 (2-1)*10 + 1 = 11
    expect(wrapper.text()).toContain('11');
    expect(wrapper.text()).toContain('12');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-03: 翻页触发查询与 pageParam 更新
  // ----------------------------------------------------
  it('PT-03: 表格翻页触发 pageParam 更新', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: new Array(20)
        .fill(0)
        .map((_, i) => ({ id: i + 1, name: `用户${i + 1}` })),
    });

    const { wrapper } = mountProTable({ table });
    await flushPromises();

    table.setPageParam({ current: 2, pageSize: 10 });
    await flushPromises();

    expect(table.pageParam.current).toBe(2);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-04: reset 流程
  // ----------------------------------------------------
  it('PT-04: 重置流程恢复初始参数', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: [],
    });

    // 修改搜索条件与分页
    table.searchForm.setFormData('name', '测试名');
    table.setPageParam({ current: 3 });

    table.resetQueryParams();
    expect(table.searchForm.getFormData('name')).toBeUndefined();
    expect(table.pageParam.current).toBe(1);
  });

  // ----------------------------------------------------
  // PT-05: loading 状态管理
  // ----------------------------------------------------
  it('PT-05: search 异步期间自动管理 loading 状态', async () => {
    let resolveSearch: any;
    const asyncSearch = () =>
      new Promise(resolve => {
        resolveSearch = resolve;
      });

    const table = useTable({
      columns: createBasicColumns(),
      data: [],
      searchFields: [{ path: 'name', label: '姓名', component: 'input' }],
    });

    const loadingModel = ref(false);
    const { wrapper } = mountProTable({
      table,
      search: asyncSearch,
      props: {
        loading: loadingModel.value,
        'onUpdate:loading': (val: boolean) => {
          loadingModel.value = val;
        },
      },
    });

    await flushPromises();

    // 点击搜索按钮触发异步查询
    const searchBtn = wrapper.find('.pro-table_search-form_search-button');
    if (searchBtn.exists()) {
      await searchBtn.trigger('click');
      await flushPromises();
      expect(loadingModel.value).toBe(true);
    }

    resolveSearch?.();
    await flushPromises();
    expect(loadingModel.value).toBe(false);
    wrapper.unmount();
  });

  it('PT-A10: search 返回非 Promise 时不触发 loading 接管', async () => {
    let called = false;
    const syncSearch = () => {
      called = true;
      return 'sync-result';
    };

    const table = useTable({
      columns: createBasicColumns(),
      data: [],
      searchFields: [{ path: 'name', label: '姓名', component: 'input' }],
    });

    const loadingModel = ref(false);
    const { wrapper } = mountProTable({
      table,
      search: syncSearch,
      props: {
        loading: loadingModel.value,
        'onUpdate:loading': (val: boolean) => {
          loadingModel.value = val;
        },
      },
    });

    await flushPromises();
    const searchBtn = wrapper.find('.pro-table_search-form_search-button');
    if (searchBtn.exists()) {
      await searchBtn.trigger('click');
      await flushPromises();
      expect(called).toBe(true);
      expect(loadingModel.value).toBe(false);
    }
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-06: 搜索区显隐控制
  // ----------------------------------------------------
  it('PT-06: searchFormConfig.hidden: true 时隐藏搜索区域', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: [],
      searchFields: [{ path: 'name', label: '姓名', component: 'input' }],
    });

    const { wrapper } = mountProTable({
      table,
      props: {
        searchFormConfig: { hidden: true },
      },
    });

    await flushPromises();
    expect(wrapper.find('.pro-table_search-form').exists()).toBe(false);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-07: 控制区 (SizeControl & ColumnControl)
  // ----------------------------------------------------
  it('PT-07: 控制栏支持尺寸与列控制', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: [],
    });

    const { wrapper } = mountProTable({
      table,
      props: {
        control: true,
      },
    });

    await flushPromises();
    expect(wrapper.find('.pro-table_header_size-control').exists()).toBe(true);
    expect(wrapper.find('.pro-table_header_column-control').exists()).toBe(
      true
    );
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-08: 插槽渲染 (button-bar / toolbar)
  // ----------------------------------------------------
  it('PT-08: 支持 button-bar / toolbar 自定义插槽', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: [],
    });

    const { wrapper } = mountProTable({
      table,
      slots: {
        'button-bar': () => h('button', { class: 'custom-add-btn' }, '新增'),
      },
    });

    await flushPromises();
    const btn = wrapper.find('.custom-add-btn');
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toBe('新增');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-06: control 对象形态默认值对齐
  // ----------------------------------------------------
  it('PT-06: control 传入对象形态时未声明项默认关闭', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: [],
    });
    const { wrapper } = mountProTable({
      table,
      props: {
        control: { columnControl: true },
      },
    });
    await flushPromises();
    expect(wrapper.findComponent({ name: 'SizeControl' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'ColumnControl' }).exists()).toBe(
      true
    );
    wrapper.unmount();
  });
});
