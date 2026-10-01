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
    expect(searchBtn.exists()).toBe(true);
    await searchBtn.trigger('click');
    // submit 按钮点击会引发原生 form submit（模拟浏览器完整行为）
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(loadingModel.value).toBe(true);

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
    expect(searchBtn.exists()).toBe(true);
    await searchBtn.trigger('click');
    // submit 按钮点击会引发原生 form submit（模拟浏览器完整行为）
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(called).toBe(true);
    expect(loadingModel.value).toBe(false);
    wrapper.unmount();
  });

  it('PT-A10b [判别]: 异步查询在途时发起同步查询，loading 不悬挂（异步完成后正常复位）', async () => {
    let resolveSearch: any;
    const asyncSearch = () =>
      new Promise(resolve => {
        resolveSearch = resolve;
      });
    let syncCalled = false;
    const syncSearch = () => {
      syncCalled = true;
    };

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
    const searchBtn = wrapper.find('.pro-table_search-form_search-button');

    // 第一步：触发异步查询，loading 置位
    expect(searchBtn.exists()).toBe(true);
    await searchBtn.trigger('click');
    // submit 按钮点击会引发原生 form submit（模拟浏览器完整行为）
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(loadingModel.value).toBe(true);

    // 第二步：异步在途时替换为同步查询并触发——同步查询不推进竞态序号
    await wrapper.setProps({ search: syncSearch });
    await searchBtn.trigger('click');
    // submit 按钮点击会引发原生 form submit（模拟浏览器完整行为）
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(syncCalled).toBe(true);
    // 判别点：同步查询不清除也不冻结在途异步请求的 loading
    expect(loadingModel.value).toBe(true);

    // 第三步：最初的异步请求 resolve，loading 正常复位（不悬挂）
    resolveSearch?.();
    await flushPromises();
    expect(loadingModel.value).toBe(false);
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

  // ----------------------------------------------------
  // PT-E1 [判别]: ProTable 透传 @row-click 事件并在点击行时正确触发
  // ----------------------------------------------------
  it('PT-E1 [判别]: ProTable 透传 @row-click 事件并在点击行时正确触发', async () => {
    let clickedRow: any = null;
    let clickedColumn: any = null;
    const onRowClick = (row: any, column: any) => {
      clickedRow = row;
      clickedColumn = column;
    };

    const table = useTable({
      columns: [
        { prop: 'id', label: 'ID' },
        { prop: 'name', label: '姓名' },
      ],
      data: [
        { id: 1, name: '张三' },
        { id: 2, name: '李四' },
      ],
    });

    const wrapper = mount(ProTable, {
      props: {
        table,
        onRowClick,
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // 找到 ElTable 并触发 row-click 事件
    const elTable = wrapper.findComponent({ name: 'ElTable' });
    expect(elTable.exists()).toBe(true);

    const mockRow = { id: 1, name: '张三' };
    const mockCol = { property: 'name' };
    elTable.vm.$emit('row-click', mockRow, mockCol);
    await flushPromises();

    expect(clickedRow).toEqual(mockRow);
    expect(clickedColumn).toEqual(mockCol);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-E2 [判别]: ProTable 透传 @selection-change 事件并在勾选变化时正确触发
  // ----------------------------------------------------
  it('PT-E2 [判别]: ProTable 透传 @selection-change 事件并在勾选变化时正确触发', async () => {
    let selectionResult: any[] = [];
    const onSelectionChange = (selection: any[]) => {
      selectionResult = selection;
    };

    const table = useTable({
      columns: [
        { type: 'selection', width: 55 },
        { prop: 'name', label: '姓名' },
      ],
      data: [
        { id: 1, name: '张三' },
        { id: 2, name: '李四' },
      ],
    });

    const wrapper = mount(ProTable, {
      props: {
        table,
        onSelectionChange,
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    const elTable = wrapper.findComponent({ name: 'ElTable' });
    expect(elTable.exists()).toBe(true);

    const selectedRows = [{ id: 1, name: '张三' }];
    elTable.vm.$emit('selection-change', selectedRows);
    await flushPromises();

    expect(selectionResult).toEqual(selectedRows);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-E3 [判别]: ProTable 透传 @sort-change 事件并在排序变更时正确触发
  // ----------------------------------------------------
  it('PT-E3 [判别]: ProTable 透传 @sort-change 事件并在排序变更时正确触发', async () => {
    let sortPayload: any = null;
    const onSortChange = (payload: any) => {
      sortPayload = payload;
    };

    const table = useTable({
      columns: [{ prop: 'age', label: '年龄', sortable: true }],
      data: [{ age: 18 }, { age: 25 }],
    });

    const wrapper = mount(ProTable, {
      props: {
        table,
        onSortChange,
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    const elTable = wrapper.findComponent({ name: 'ElTable' });
    expect(elTable.exists()).toBe(true);

    const mockSort = { column: {}, prop: 'age', order: 'descending' };
    elTable.vm.$emit('sort-change', mockSort);
    await flushPromises();

    expect(sortPayload).toEqual(mockSort);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-E4 [判别]: ProTable 透传 @current-change 事件并在高亮行切换时正确触发
  // ----------------------------------------------------
  it('PT-E4 [判别]: ProTable 透传 @current-change 事件并在高亮行切换时正确触发', async () => {
    let currentRowResult: any = null;
    const onCurrentChange = (currentRow: any) => {
      currentRowResult = currentRow;
    };

    const table = useTable({
      columns: [{ prop: 'name', label: '姓名' }],
      data: [{ name: '王五' }],
    });

    const wrapper = mount(ProTable, {
      props: {
        table,
        highlightCurrentRow: true,
        onCurrentChange,
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    const elTable = wrapper.findComponent({ name: 'ElTable' });
    expect(elTable.exists()).toBe(true);

    const mockCurrent = { name: '王五' };
    elTable.vm.$emit('current-change', mockCurrent, null);
    await flushPromises();

    expect(currentRowResult).toEqual(mockCurrent);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-E5 [判别]: ProComponentProvider 全局注入的表格事件正确透传与生效
  // ----------------------------------------------------
  it('PT-E5 [判别]: ProComponentProvider 全局注入的表格事件正确透传与生效', async () => {
    let providerClickedRow: any = null;
    const onRowClick = (row: any) => {
      providerClickedRow = row;
    };

    const table = useTable({
      columns: [{ prop: 'name', label: '姓名' }],
      data: [{ name: '赵六' }],
    });

    const wrapper = mount(ProComponentProvider, {
      props: {
        componentVars: {
          'pro-table': {
            onRowClick,
            stripe: true,
          },
        },
      },
      slots: {
        default: () => h(ProTable, { table }),
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    const elTable = wrapper.findComponent({ name: 'ElTable' });
    expect(elTable.exists()).toBe(true);

    const mockRow = { name: '赵六' };
    elTable.vm.$emit('row-click', mockRow);
    await flushPromises();

    expect(providerClickedRow).toEqual(mockRow);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-E6 [判别]: 直接声明在 ProTable 上的原生 props (stripe/border/rowKey 等) 正确透传至 ElTable
  // ----------------------------------------------------
  it('PT-E6 [判别]: 直接声明在 ProTable 上的原生 props (stripe/border/rowKey 等) 正确透传至 ElTable', async () => {
    const table = useTable({
      columns: [{ prop: 'name', label: '姓名' }],
      data: [{ id: 'row-1', name: '张三' }],
    });

    const wrapper = mount(ProTable, {
      props: {
        table,
        stripe: true,
        border: true,
        rowKey: 'id',
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    const elTable = wrapper.findComponent({ name: 'ElTable' });
    expect(elTable.exists()).toBe(true);
    expect(elTable.props('stripe')).toBe(true);
    expect(elTable.props('border')).toBe(true);
    expect(elTable.props('rowKey')).toBe('id');

    wrapper.unmount();
  });
  // ----------------------------------------------------
  // PT-06 [判别]: 深层 prop 列（无 render）由 el-table lodash get 原生渲染
  // ----------------------------------------------------
  it('PT-A16 [判别]: prop 配置深层路径（如 address.city）的普通列正常渲染数据', async () => {
    const table = useTable({
      columns: [
        { prop: 'name', label: '姓名' },
        { prop: 'address.city', label: '城市' },
      ],
      data: [{ name: '张三', address: { city: '杭州' } }],
    });
    const wrapper = mount(ProTable, {
      props: { table },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const rows = wrapper.findAll('.el-table__row');
    expect(rows.length).toBe(1);
    // 深层 prop 列渲染嵌套数据（el-table defaultRenderCell 经 lodash get 取值）
    expect(rows[0].text()).toContain('杭州');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-02c [判别]: addIndexColumn 默认渲染序号列，显式 false 关闭
  // ----------------------------------------------------
  it('PT-02c [判别]: addIndexColumn 缺省时按默认 true 渲染序号列，显式 false 时不渲染', async () => {
    const table = useTable({
      columns: [{ prop: 'name', label: '姓名' }],
      data: [{ name: '王五' }],
    });

    const defaultWrapper = mountProTable({ table }).wrapper;
    await flushPromises();
    expect(defaultWrapper.text()).toContain('序号');
    defaultWrapper.unmount();

    const offWrapper = mountProTable({
      table,
      props: { addIndexColumn: false },
    }).wrapper;
    await flushPromises();
    expect(offWrapper.text()).not.toContain('序号');
    offWrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A17 [判别]: 分组列（children）渲染多级表头与子列数据，深层分组同样成立
  // ----------------------------------------------------
  it('PT-A17 [判别]: 分组列渲染多级表头与子列数据，深层分组同样成立', async () => {
    const { wrapper } = await mountProTable({
      table: useTable({
        columns: [
          {
            label: '一级分组',
            children: [
              { prop: 'c1', label: '子列1' },
              {
                label: '二级分组',
                children: [{ prop: 'c2', label: '深层子列' }],
              },
            ],
          },
          { prop: 'c3', label: '普通列' },
        ] as any,
        data: [{ c1: 'v1', c2: 'v2', c3: 'v3' }],
      }),
    });
    await flushPromises();

    const headerTexts = wrapper
      .findAll('.el-table__header th')
      .map(th => th.text());
    expect(headerTexts).toContain('一级分组');
    expect(headerTexts).toContain('子列1');
    expect(headerTexts).toContain('二级分组');
    expect(headerTexts).toContain('深层子列');
    expect(headerTexts).toContain('普通列');

    const bodyText = wrapper.find('.el-table__body').text();
    expect(bodyText).toContain('v1');
    expect(bodyText).toContain('v2');
    expect(bodyText).toContain('v3');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A18 [判别]: searchFields 含 null / 原始值项时不抛错，搜索区按合法字段渲染
  // ----------------------------------------------------
  it('PT-A18 [判别]: searchFields 含 null/原始值项时不抛错，搜索区正常渲染', async () => {
    const table = useTable({
      columns: [{ prop: 'name', label: '姓名' }],
      data: [],
      searchFields: [
        null,
        'not-a-field',
        { path: 'kw', label: '关键词', component: 'input' },
      ],
    } as any);

    const wrapper = mount(ProTable, {
      props: { table },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    expect(wrapper.find('.pro-table_search-form').exists()).toBe(true);
    expect(
      wrapper.findAll('.pro-table_search-form input').length
    ).toBeGreaterThanOrEqual(1);

    wrapper.unmount();
  });
});
