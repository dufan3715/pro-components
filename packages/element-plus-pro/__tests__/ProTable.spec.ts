import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import ProTable from '../src/components/table/components/ProTable.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import { useTable } from '../src/components/table/hooks/useTable';
import { flushPromises, mountProTable } from './helpers/mount';
import { createBasicColumns } from './helpers/fixtures';
import { ElPagination, ElTable } from 'element-plus';
import SearchForm from '../src/components/table/components/SearchForm.vue';
import SizeControl from '../src/components/table/components/SizeControl.vue';

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
  // PT-A7 [判别]: 分页来源链 (props.pagination === false 优先关闭 > provider pagination: false > 默认合成)
  // ----------------------------------------------------
  it('PT-A7 [判别]: 分页来源链：props.pagination===false 优先关闭，provider 配置正确覆盖', async () => {
    // 1. props.pagination === false 优先关闭分页
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
  // PT-09: control 对象形态默认值对齐
  // ----------------------------------------------------
  it('PT-09: control 传入对象形态时未声明项默认关闭', async () => {
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

  // ----------------------------------------------------
  // PT-A19 [判别]: columns 含 null / 原始值项时不抛错，仅渲染合法列
  // ----------------------------------------------------
  it('PT-A19 [判别]: columns 含 null/原始值项时不抛错，仅渲染合法列', async () => {
    const table = useTable({
      columns: [null, 'not-a-column', { prop: 'name', label: '姓名' }],
      data: [{ name: '甲' }],
    } as any);

    const wrapper = mount(ProTable, {
      props: { table, addIndexColumn: false },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const headerCells = wrapper.findAll('.el-table__header th');
    expect(headerCells).toHaveLength(1);
    expect(headerCells[0].text()).toContain('姓名');
    expect(wrapper.find('tbody').text()).toContain('甲');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A20 [判别]: 用户 default 插槽不覆盖列渲染器，列照常渲染
  // ----------------------------------------------------
  it('PT-A20 [判别]: 传入 default 插槽时列渲染器不被顶掉，列与数据照常渲染', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const table = useTable({
      columns: [{ prop: 'name', label: '姓名' }],
      data: [{ name: '甲' }],
    } as any);

    const wrapper = mount(ProTable, {
      props: { table, addIndexColumn: false },
      slots: {
        default: () => h('div', { class: 'user-default-slot' }, '用户内容'),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 列与数据仍由 TableColumnRenderer 渲染
    const headerCells = wrapper.findAll('.el-table__header th');
    expect(headerCells).toHaveLength(1);
    expect(headerCells[0].text()).toContain('姓名');
    expect(wrapper.find('tbody').text()).toContain('甲');
    // 用户 default 内容不透传宿主表格（否则会顶掉列渲染器）
    expect(wrapper.find('.user-default-slot').exists()).toBe(false);
    // 一次性提示，便于定位
    expect(
      warnSpy.mock.calls.some(c => String(c[0]).includes('default 插槽保留'))
    ).toBe(true);

    warnSpy.mockRestore();
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A28 [判别]: 分页 / 数据 / 列 / 尺寸仅从对应 prop 派生，同名键不进入 attrs 面
  // ----------------------------------------------------
  it('PT-A28 [判别]: 分页与数据源仅取自 prop，同名键不进入 attrs 面', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: [{ id: 1, name: 'table-data', status: 'normal' }],
    });
    const rowData = [{ id: 99, name: 'prop-data', status: 'normal' }];

    const Probe = defineComponent({
      setup() {
        return () =>
          h(ProTable as any, {
            table,
            data: rowData,
            columns: createBasicColumns(),
            pagination: { layout: 'prev, next' },
            size: 'large',
            tableContainer: false,
          });
      },
    });

    const wrapper = mount(Probe, { global: { stubs: { transition: false } } });
    await flushPromises();

    // 这些键均为组件自身声明的 prop，编译后不可能进入 attrs
    const ownedKeys = [
      'pagination',
      'data',
      'columns',
      'size',
      'tableContainer',
    ];
    const proTablePropKeys = Object.keys((ProTable as any).props ?? {});
    const attrs = wrapper.findComponent(ProTable as any).vm.$attrs;
    for (const key of ownedKeys) {
      expect(proTablePropKeys).toContain(key);
      expect(Object.keys(attrs)).not.toContain(key);
    }

    // prop 为唯一来源：分页、数据、尺寸均按 prop 生效
    expect(wrapper.findComponent(ElPagination).props('layout')).toBe(
      'prev, next'
    );
    const elTable = wrapper.findComponent({ name: 'ElTable' });
    expect(elTable.props('data')).toEqual(rowData);
    expect(elTable.props('size')).toBe('large');
    expect(wrapper.text()).toContain('prop-data');
    expect(wrapper.text()).not.toContain('table-data');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A28b [判别]: provider 注入的宿主表格属性仍透传，props 键不落表格 DOM
  // ----------------------------------------------------
  it('PT-A28b [判别]: provider 注入的宿主表格属性仍透传，props 键经 provider 注入不落表格 DOM', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: [{ id: 1, name: 'a', status: 'normal' }],
    });
    const wrapper = mount(ProComponentProvider, {
      props: {
        componentVars: {
          'pro-table': {
            size: 'small',
            stripe: true,
            columns: [{ prop: 'injected' }],
          },
        } as any,
      },
      slots: { default: () => h(ProTable as any, { table }) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const elTable = wrapper.findComponent({ name: 'ElTable' });
    expect(elTable.props('size')).toBe('small');
    expect(elTable.props('stripe')).toBe(true);
    // columns 非宿主表格 prop，不得落为原生属性
    expect((elTable.element as HTMLElement).getAttribute('columns')).toBeNull();

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A29 [判别]: searchFormConfig.container 由 ProTable 消费，不下发 SearchForm 与原生 form
  // ----------------------------------------------------
  it('PT-A29 [判别]: searchFormConfig.container 由 ProTable 消费，不下发 SearchForm 与原生的 form', async () => {
    const CustomContainer = defineComponent({
      name: 'PTA29Container',
      setup(_, { slots }) {
        return () =>
          h('section', { class: 'pta29-container' }, slots.default?.());
      },
    });
    const table = useTable({
      columns: createBasicColumns(),
      data: [],
      searchFields: [{ path: 'name', label: '姓名', component: 'input' }],
    });
    const wrapper = mount(ProTable, {
      props: {
        table,
        searchFormConfig: { container: CustomContainer as any, hidden: false },
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 自定义容器确实参与渲染
    expect(wrapper.find('.pta29-container').exists()).toBe(true);

    // 容器与显隐键不下发 SearchForm
    const searchForm = wrapper.findComponent(SearchForm);
    const searchFormAttrs = Object.keys(searchForm.vm.$attrs);
    expect(searchFormAttrs).not.toContain('container');
    expect(searchFormAttrs).not.toContain('hidden');

    // 原生 form 上无 container / hidden 非法属性
    const form = wrapper.find('form');
    expect(form.exists()).toBe(true);
    expect(form.attributes('container')).toBeUndefined();
    expect(form.attributes('hidden')).toBeUndefined();

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A30 [判别]: 两类搜索告警按原因独立去重，未配置 search 时不告警
  // ----------------------------------------------------
  it('PT-A30 [判别]: 两类搜索告警分别出现且同原因不重复，未配置 search 时零告警', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // 同时命中两类原因：冲突提示与「未返回 Promise」提示都要出现
    const both = mount(ProTable, {
      props: {
        table: useTable({ columns: createBasicColumns(), data: [] }),
        search: () => 'not-promise',
      } as any,
      attrs: { onSearch: () => {} },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    await (both.vm as any).search();
    await (both.vm as any).search();

    const messages = warnSpy.mock.calls.map(call => String(call[0]));
    expect(messages.filter(msg => msg.includes('请仅保留其一'))).toHaveLength(
      1
    );
    expect(messages.filter(msg => msg.includes('未返回 Promise'))).toHaveLength(
      1
    );
    both.unmount();
    warnSpy.mockClear();

    // prop 与 @search 均缺省：不产生任何告警
    const none = mount(ProTable, {
      props: { table: useTable({ columns: createBasicColumns(), data: [] }) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    await (none.vm as any).search();
    expect(warnSpy).not.toHaveBeenCalled();
    none.unmount();
  });

  // ----------------------------------------------------
  // PT-A31 [判别]: 宿主表格事件不入运行时 emits 且经 attrs 可用，模型事件照常触发
  // ----------------------------------------------------
  it('PT-A31 [判别]: 宿主表格事件不入运行时 emits 且经 attrs 透传可用，模型事件照常触发', async () => {
    const hostEmits = ((ElTable as any).emits ?? []) as
      | string[]
      | Record<string, any>;
    const hostEmitNames = Array.isArray(hostEmits)
      ? hostEmits
      : Object.keys(hostEmits);
    const ownEmitNames = (((ProTable as any).emits ?? []) as string[]).slice();

    // 宿主事件名进入运行时 emits 会把同名 onXxx 从 attrs 中剔除，监听入口因此消失
    expect(hostEmitNames.length).toBeGreaterThan(0);
    expect(ownEmitNames.sort()).toEqual(['update:loading', 'update:size']);
    for (const name of hostEmitNames) {
      expect(ownEmitNames).not.toContain(name);
    }

    const table = useTable({
      columns: createBasicColumns(),
      data: [{ id: 1, name: 'a', status: 'normal' }],
    });
    const onRowClick = vi.fn();
    const onChange = vi.fn();
    const onUpdateSize = vi.fn();

    const wrapper = mount(ProTable, {
      props: { table, control: true, 'onUpdate:size': onUpdateSize } as any,
      attrs: { onRowClick, onChange },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 表格事件经 attrs 到达 ElTable
    wrapper
      .findComponent({ name: 'ElTable' })
      .vm.$emit('row-click', { id: 1 }, null);
    await flushPromises();
    expect(onRowClick).toHaveBeenCalledTimes(1);

    // 分页 change 事件经 attrs 消费
    wrapper.findComponent(ElPagination).vm.$emit('change', 2, 20);
    await flushPromises();
    expect(onChange).toHaveBeenCalledWith(2, 20);

    // update:size 模型事件仍工作并驱动表格尺寸
    wrapper.findComponent(SizeControl).vm.$emit('update:size', 'small');
    await flushPromises();
    expect(onUpdateSize).toHaveBeenCalledWith('small');
    expect(wrapper.findComponent({ name: 'ElTable' }).props('size')).toBe(
      'small'
    );

    wrapper.unmount();
  });
});
