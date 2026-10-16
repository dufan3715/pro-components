import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, inject, ref } from 'vue';
import { mount } from '@vue/test-utils';
import ProTable from '../src/components/table/components/ProTable.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import { useTable } from '../src/components/table/hooks/useTable';
import { expectWarn, flushPromises, mountProTable } from './helpers/mount';
import { createBasicColumns } from './helpers/fixtures';
import { ElPagination, ElTable } from 'element-plus';
import SearchForm from '../src/components/table/components/SearchForm.vue';
import SizeControl from '../src/components/table/components/SizeControl.vue';
import type { Column } from '../src/components/table/types';
import type { ComponentVars } from '../src/components/component-provider';
import { INJECT_CONFIG } from '../src/components/component-provider/constants';

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
  // PT-03: 翻页（ElPagination current-change）驱动 pageParam 更新与查询
  // ----------------------------------------------------
  it('PT-03: 分页 current-change 驱动 pageParam 更新并按次触发查询', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: [],
      pageParam: { current: 1, pageSize: 10, total: 40 },
    });
    const searchSpy = vi.fn().mockResolvedValue(undefined);

    const { wrapper } = mountProTable({ table, search: searchSpy as any });

    try {
      await flushPromises();
      const pagination = wrapper.findComponent(ElPagination);
      expect(pagination.exists()).toBe(true);
      expect(pagination.props('currentPage')).toBe(1);
      expect(pagination.props('total')).toBe(40);
      expect(searchSpy).not.toHaveBeenCalled();

      // 真实事件链：ElPagination 派发 current-change → setPageParam + 查询
      pagination.vm.$emit('current-change', 3);
      await flushPromises();
      expect(table.pageParam.current).toBe(3);
      expect(searchSpy).toHaveBeenCalledTimes(1);
      // 分页 props 由 pageParam 派生，随页码更新
      expect(wrapper.findComponent(ElPagination).props('currentPage')).toBe(3);
    } finally {
      wrapper.unmount();
    }
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
    const searchSpy = vi.fn(asyncSearch);
    const { wrapper } = mountProTable({
      table,
      search: searchSpy as any,
      attachTo: document.body,
      props: {
        loading: loadingModel.value,
        'onUpdate:loading': (val: boolean) => {
          loadingModel.value = val;
        },
      },
    });

    try {
      await flushPromises();

      // 真实点击路径：查询按钮为 native-type=submit，点击经原生提交触发 1 次查询
      const searchBtn = wrapper.find('.pro-table_search-form_search-button');
      expect(searchBtn.exists()).toBe(true);
      expect(searchBtn.attributes('type')).toBe('submit');
      expect(searchSpy).not.toHaveBeenCalled();
      await searchBtn.trigger('click');
      await flushPromises();
      expect(searchSpy).toHaveBeenCalledTimes(1);
      expect(loadingModel.value).toBe(true);

      resolveSearch?.();
      await flushPromises();
      expect(loadingModel.value).toBe(false);
    } finally {
      wrapper.unmount();
      document.body.innerHTML = '';
    }
  });

  it('PT-A10: search 返回非 Promise 时不触发 loading 接管', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
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
    const searchSpy = vi.fn(syncSearch);
    const { wrapper } = mountProTable({
      table,
      search: searchSpy as any,
      attachTo: document.body,
      props: {
        loading: loadingModel.value,
        'onUpdate:loading': (val: boolean) => {
          loadingModel.value = val;
        },
      },
    });

    try {
      await flushPromises();
      const searchBtn = wrapper.find('.pro-table_search-form_search-button');
      expect(searchBtn.exists()).toBe(true);
      await searchBtn.trigger('click');
      await flushPromises();
      expect(searchSpy).toHaveBeenCalledTimes(1);
      expect(called).toBe(true);
      expect(loadingModel.value).toBe(false);
      // 判别点：非 Promise 查询输出一次「未参与 loading 竞态」提示
      expectWarn(warnSpy, 'search 未返回 Promise');
    } finally {
      warnSpy.mockRestore();
      wrapper.unmount();
      document.body.innerHTML = '';
    }
  });

  it('PT-A10b [判别]: 异步查询在途时发起同步查询，loading 不悬挂（异步完成后正常复位）', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
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
    const asyncSpy = vi.fn(asyncSearch);
    const syncSpy = vi.fn(syncSearch);
    const { wrapper } = mountProTable({
      table,
      search: asyncSpy as any,
      attachTo: document.body,
      props: {
        loading: loadingModel.value,
        'onUpdate:loading': (val: boolean) => {
          loadingModel.value = val;
        },
      },
    });

    try {
      await flushPromises();
      const searchBtn = wrapper.find('.pro-table_search-form_search-button');

      // 第一步：点击触发异步查询，loading 置位
      expect(searchBtn.exists()).toBe(true);
      await searchBtn.trigger('click');
      await flushPromises();
      expect(asyncSpy).toHaveBeenCalledTimes(1);
      expect(loadingModel.value).toBe(true);

      // 第二步：异步在途时替换为同步查询并点击——同步查询不推进竞态序号
      await wrapper.setProps({ search: syncSpy });
      await searchBtn.trigger('click');
      await flushPromises();
      expect(syncSpy).toHaveBeenCalledTimes(1);
      expect(syncCalled).toBe(true);
      // 判别点：同步查询不清除也不冻结在途异步请求的 loading
      expect(loadingModel.value).toBe(true);
      // 同一实例内「未返回 Promise」提示只输出一次
      expect(
        warnSpy.mock.calls.filter(call =>
          String(call[0]).includes('search 未返回 Promise')
        )
      ).toHaveLength(1);

      // 第三步：最初的异步请求 resolve，loading 正常复位（不悬挂）
      resolveSearch?.();
      await flushPromises();
      expect(loadingModel.value).toBe(false);
    } finally {
      warnSpy.mockRestore();
      wrapper.unmount();
      document.body.innerHTML = '';
    }
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
  // PT-07 [判别]: Provider 关闭 control 默认后 prop 传 true 仍生效
  // ----------------------------------------------------
  it('PT-07 [判别]: Provider 关闭 control 默认时，prop 传 true 仍渲染控制栏', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: [],
    });

    const wrapper = mount(ProComponentProvider, {
      props: {
        componentVars: {
          'pro-table': {
            control: false,
          },
        },
      },
      slots: {
        default: () => h(ProTable as any, { table, control: true }),
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    // prop 通道优先于 Provider 默认值
    expect(wrapper.find('.pro-table_header_size-control').exists()).toBe(true);
    expect(wrapper.find('.pro-table_header_column-control').exists()).toBe(
      true
    );
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-07b [判别]: control 缺省按内置默认 true 渲染，显式 false 关闭
  // ----------------------------------------------------
  it('PT-07b [判别]: control 缺省时按内置默认 true 渲染控制栏，显式 false 时不渲染', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: [],
    });

    const defaultWrapper = mountProTable({ table }).wrapper;
    await flushPromises();
    expect(defaultWrapper.find('.pro-table_header_size-control').exists()).toBe(
      true
    );
    expect(
      defaultWrapper.find('.pro-table_header_column-control').exists()
    ).toBe(true);
    defaultWrapper.unmount();

    // 反向分支：显式 false 覆盖内置默认 true
    const offWrapper = mountProTable({
      table,
      props: { control: false },
    }).wrapper;
    await flushPromises();
    expect(offWrapper.find('.pro-table_header_size-control').exists()).toBe(
      false
    );
    expect(offWrapper.find('.pro-table_header_column-control').exists()).toBe(
      false
    );
    offWrapper.unmount();
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
  // PT-E1..E4 [判别]: 宿主表格事件经 attrs 透传至 ElTable 并回传原始负载
  // ----------------------------------------------------
  /* 事件透传参数表：[编号, 宿主事件名, 监听 prop 名, 额外 props, 列, 数据, 事件负载] */
  const tableEventCases: Array<
    [string, string, string, Record<string, any>, any[], any[], any[]]
  > = [
    [
      'PT-E1',
      'row-click',
      'onRowClick',
      {},
      [{ prop: 'id', label: 'ID' }],
      [
        { id: 1, name: '张三' },
        { id: 2, name: '李四' },
      ],
      [{ id: 1, name: '张三' }, { property: 'name' }],
    ],
    [
      'PT-E2',
      'selection-change',
      'onSelectionChange',
      {},
      [
        { type: 'selection', width: 55 },
        { prop: 'name', label: '姓名' },
      ],
      [
        { id: 1, name: '张三' },
        { id: 2, name: '李四' },
      ],
      [[{ id: 1, name: '张三' }]],
    ],
    [
      'PT-E3',
      'sort-change',
      'onSortChange',
      {},
      [{ prop: 'age', label: '年龄', sortable: true }],
      [{ age: 18 }, { age: 25 }],
      [{ column: {}, prop: 'age', order: 'descending' }],
    ],
    [
      'PT-E4',
      'current-change',
      'onCurrentChange',
      { highlightCurrentRow: true },
      [{ prop: 'name', label: '姓名' }],
      [{ name: '王五' }],
      [{ name: '王五' }, null],
    ],
  ];

  it.each(tableEventCases)(
    '%s [判别]: ProTable 透传 @%s 事件并回传宿主原始负载',
    async (_id, eventName, listener, extraProps, columns, data, payload) => {
      const handler = vi.fn();

      const table = useTable({ columns: columns as any, data: data as any });
      const wrapper = mount(ProTable as any, {
        props: { table, [listener]: handler, ...extraProps } as any,
        global: { stubs: { transition: false } },
      });

      try {
        await flushPromises();

        const elTable = wrapper.findComponent({ name: 'ElTable' });
        expect(elTable.exists()).toBe(true);

        elTable.vm.$emit(eventName, ...payload);
        await flushPromises();

        // 判别点：宿主事件恰好触发一次且原样回传全部负载
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(...payload);
      } finally {
        wrapper.unmount();
      }
    }
  );

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

    // Provider 关闭默认后 prop 传 true：prop 通道生效，序号列仍渲染
    const providedWrapper = mount(ProComponentProvider, {
      props: {
        componentVars: {
          'pro-table': {
            addIndexColumn: false,
          },
        },
      },
      slots: {
        default: () => h(ProTable as any, { table, addIndexColumn: true }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(providedWrapper.text()).toContain('序号');
    providedWrapper.unmount();
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
    try {
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

      try {
        // 列与数据仍由 TableColumnRenderer 渲染
        const headerCells = wrapper.findAll('.el-table__header th');
        expect(headerCells).toHaveLength(1);
        expect(headerCells[0].text()).toContain('姓名');
        expect(wrapper.find('tbody').text()).toContain('甲');
        // 用户 default 内容不透传宿主表格（否则会顶掉列渲染器）
        expect(wrapper.find('.user-default-slot').exists()).toBe(false);
        // 一次性提示，便于定位
        expect(
          warnSpy.mock.calls.some(c =>
            String(c[0]).includes('default 插槽保留')
          )
        ).toBe(true);
      } finally {
        wrapper.unmount();
      }
    } finally {
      warnSpy.mockRestore();
    }
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
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
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
    expect((elTable.element as HTMLElement).getAttribute('columns')).toBeNull();
    // columns 非宿主表格 prop，注入层静默剔除且不产生告警
    expect(warnSpy).not.toHaveBeenCalled();

    wrapper.unmount();
    warnSpy.mockRestore();
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

    try {
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
      expect(
        messages.filter(msg => msg.includes('未返回 Promise'))
      ).toHaveLength(1);
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
    } finally {
      warnSpy.mockRestore();
    }
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

  // ----------------------------------------------------
  // PT-A32 [判别]: size-change 重置回第 1 页并按次查询，change 透传宿主回调
  // ----------------------------------------------------
  it('PT-A32 [判别]: size-change 重置回第 1 页并按次查询，change 与搜索提交各自独立计数', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: [],
      pageParam: { current: 3, pageSize: 10, total: 40 },
      searchFields: [{ path: 'name', label: '姓名', component: 'input' }],
    });
    const searchSpy = vi.fn().mockResolvedValue(undefined);
    const onChange = vi.fn();

    const { wrapper } = mountProTable({
      table,
      search: searchSpy as any,
      props: { onChange },
    });

    try {
      await flushPromises();
      const pagination = wrapper.findComponent(ElPagination);
      expect(pagination.props('currentPage')).toBe(3);
      expect(pagination.props('pageSize')).toBe(10);
      expect(searchSpy).not.toHaveBeenCalled();

      // size-change：pageSize 更新且 current 重置回 1，查询 +1
      pagination.vm.$emit('size-change', 20);
      await flushPromises();
      expect(table.pageParam.pageSize).toBe(20);
      expect(table.pageParam.current).toBe(1);
      expect(searchSpy).toHaveBeenCalledTimes(1);
      expect(wrapper.findComponent(ElPagination).props('pageSize')).toBe(20);
      // 宿主依据新 props 自行派发 change(1, 20)，经 onPaginationChange 透传重置后的页码
      expect(onChange).toHaveBeenLastCalledWith(1, 20);

      // change：显式派发仅透传宿主回调，不产生额外查询
      onChange.mockClear();
      pagination.vm.$emit('change', 2, 20);
      await flushPromises();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(2, 20);
      expect(searchSpy).toHaveBeenCalledTimes(1);

      // 搜索提交：同样重置回第 1 页并查询（与 size-change 同一重置语义）
      table.setPageParam({ current: 4 });
      await flushPromises();
      wrapper.findComponent(SearchForm).vm.$emit('search');
      await flushPromises();
      expect(table.pageParam.current).toBe(1);
      expect(searchSpy).toHaveBeenCalledTimes(2);
    } finally {
      wrapper.unmount();
    }
  });

  // ----------------------------------------------------
  // PT-A33 [判别]: 表级 pagination 对象 × Provider × pageParam 合并优先级与兜底
  // ----------------------------------------------------
  it('PT-A33 [判别]: pagination 合并优先级与 pageParam 兜底在分页 props 上逐项生效', async () => {
    const wrappers: any[] = [];
    const mountCase = (options: any) => {
      const wrapper = mount(options.component, options.mountOptions);
      wrappers.push(wrapper);
      return wrapper;
    };

    try {
      // 场景一：表级对象覆盖 Provider 同名键，未声明键由 Provider 合并；
      // total/currentPage/pageSize 由 pageParam 兜底覆盖表级对象
      const table1 = useTable({
        columns: createBasicColumns(),
        data: [],
        pageParam: { current: 2, pageSize: 20, total: 55 },
      });
      const merged = mountCase({
        component: ProComponentProvider as any,
        mountOptions: {
          props: {
            componentVars: {
              'pro-table': {
                pagination: {
                  layout: 'prev, pager, next',
                  pageSizes: [5, 15],
                  background: true,
                  hideOnSinglePage: true,
                },
              },
            },
          },
          slots: {
            default: () =>
              h(ProTable as any, {
                table: table1,
                pagination: {
                  layout: 'total, prev, pager, next',
                },
              }),
          },
          global: { stubs: { transition: false } },
        },
      });
      await flushPromises();
      const mergedPagination = merged.findComponent(ElPagination);
      expect(mergedPagination.props('layout')).toBe('total, prev, pager, next');
      // 未在表级声明的键由 Provider 合并下发
      expect(mergedPagination.props('pageSizes')).toEqual([5, 15]);
      expect(mergedPagination.props('background')).toBe(true);
      expect(mergedPagination.props('hideOnSinglePage')).toBe(true);
      expect(mergedPagination.props('total')).toBe(55);
      expect(mergedPagination.props('currentPage')).toBe(2);
      expect(mergedPagination.props('pageSize')).toBe(20);

      // 场景二：无表级对象时 Provider 对象整体生效，pageParam 覆盖分页三元组
      const table2 = useTable({
        columns: createBasicColumns(),
        data: [],
        pageParam: { current: 3, pageSize: 30, total: 80 },
      });
      const providerOnly = mountCase({
        component: ProComponentProvider as any,
        mountOptions: {
          props: {
            componentVars: {
              'pro-table': {
                pagination: {
                  layout: 'prev, pager, next',
                  pageSizes: [5, 15],
                  background: true,
                },
              },
            },
          },
          slots: { default: () => h(ProTable as any, { table: table2 }) },
          global: { stubs: { transition: false } },
        },
      });
      await flushPromises();
      const providerPagination = providerOnly.findComponent(ElPagination);
      expect(providerPagination.props('layout')).toBe('prev, pager, next');
      expect(providerPagination.props('pageSizes')).toEqual([5, 15]);
      expect(providerPagination.props('total')).toBe(80);
      expect(providerPagination.props('currentPage')).toBe(3);
      expect(providerPagination.props('pageSize')).toBe(30);

      // 场景三：无 table 时表级对象的 currentPage/pageSize/total 兜底生效
      const noTable = mountCase({
        component: ProTable as any,
        mountOptions: {
          props: {
            pagination: { currentPage: 5, pageSize: 30, total: 60 },
          },
          global: { stubs: { transition: false } },
        },
      });
      await flushPromises();
      const fallbackPagination = noTable.findComponent(ElPagination);
      expect(fallbackPagination.props('currentPage')).toBe(5);
      expect(fallbackPagination.props('pageSize')).toBe(30);
      expect(fallbackPagination.props('total')).toBe(60);

      // 场景四：Provider pagination=false 时表级对象仍生效，Provider 键不下发
      const table4 = useTable({
        columns: createBasicColumns(),
        data: [],
        pageParam: { current: 1, pageSize: 10, total: 12 },
      });
      const providerOff = mountCase({
        component: ProComponentProvider as any,
        mountOptions: {
          props: {
            componentVars: {
              'pro-table': {
                pagination: false,
              },
            },
          },
          slots: {
            default: () =>
              h(ProTable as any, {
                table: table4,
                pagination: {
                  layout: 'total, prev, pager, next',
                  background: true,
                },
              }),
          },
          global: { stubs: { transition: false } },
        },
      });
      await flushPromises();
      const offPagination = providerOff.findComponent(ElPagination);
      expect(offPagination.exists()).toBe(true);
      expect(offPagination.props('layout')).toBe('total, prev, pager, next');
      expect(offPagination.props('background')).toBe(true);
      // Provider 的 pageSizes 未下发，回退宿主默认
      expect(offPagination.props('pageSizes')).toEqual([
        10, 20, 30, 40, 50, 100,
      ]);
    } finally {
      wrappers.forEach(wrapper => wrapper.unmount());
    }
  });

  // ----------------------------------------------------
  // PT-A34 [判别]: 列 hidden 的类型面支持 Ref/ComputedRef，渲染期按 toValue 过滤（含分组子列）
  // ----------------------------------------------------
  it('PT-A34 [判别]: 列 hidden 支持 Ref 形态并在渲染期过滤，分组子列递归生效', async () => {
    const hiddenRef = ref(false);
    // 类型面：列 hidden 现为 MaybeRefOrComputedRef<boolean>，传 Ref 无需断言
    const columns: Column[] = [
      { prop: 'name', label: '姓名', hidden: hiddenRef },
      { prop: 'age', label: '年龄' },
    ];
    const table = useTable({
      columns,
      data: [{ name: '甲', age: 18 }],
    });

    const { wrapper } = mountProTable({ table, props: { control: false } });
    await flushPromises();

    try {
      // Ref(false)：列正常渲染
      expect(wrapper.findAll('thead th').map(th => th.text())).toContain(
        '姓名'
      );

      // 外部 ref 翻转驱动列显隐
      hiddenRef.value = true;
      await flushPromises();
      expect(wrapper.findAll('thead th').map(th => th.text())).not.toContain(
        '姓名'
      );
      expect(wrapper.findAll('thead th').map(th => th.text())).toContain(
        '年龄'
      );
    } finally {
      wrapper.unmount();
    }
  });

  // ----------------------------------------------------
  // PT-A35 [判别]: Provider 注入的 data 在注入层静默剔除，运行期新增同样被剔除
  // ----------------------------------------------------
  it('PT-A35 [判别]: 不可注入键 data 经注入层静默剔除，运行期新增同样被剔除且不产生告警', async () => {
    const table = useTable({
      columns: [{ prop: 'name', label: '实例列' }],
      data: [{ name: '实例数据' }],
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // 注入面探针：直接读取 Provider 下发的注入配置引用，判别不可注入键是否已剔除
    let injectedConfig: any;
    const Probe = defineComponent({
      setup() {
        injectedConfig = inject(INJECT_CONFIG['pro-table'].injectionKey, null);
        return () => h('div');
      },
    });
    const componentVars = ref<any>({ 'pro-table': { size: 'small' } });

    const Host = defineComponent({
      setup() {
        return () =>
          h(
            ProComponentProvider,
            { componentVars: componentVars.value },
            {
              default: () => [
                h(ProTable as any, { table, control: false }),
                h(Probe),
              ],
            }
          );
      },
    });
    const wrapper = mount(Host, { global: { stubs: { transition: false } } });
    await flushPromises();

    // 未配置不可注入键：Provider 注入的 size 正常生效
    expect(wrapper.findComponent({ name: 'ElTable' }).props('size')).toBe(
      'small'
    );
    expect(injectedConfig.value).not.toHaveProperty('data');
    expect(injectedConfig.value).not.toHaveProperty('columns');
    expect(injectedConfig.value).not.toHaveProperty('loading');

    // 运行期新增 data：注入被静默剔除（数据源仍取 table 实例）
    componentVars.value = {
      'pro-table': {
        size: 'small',
        data: [{ name: '注入数据' }],
        columns: [{ prop: 'injected', label: '注入列' }],
        loading: true,
      },
    };
    await flushPromises();
    expect(wrapper.text()).toContain('实例数据');
    expect(wrapper.text()).not.toContain('注入数据');
    // 注入面已剔除三个不可注入键，其余键（size）照常下发
    expect(injectedConfig.value?.size).toBe('small');
    expect(injectedConfig.value).not.toHaveProperty('columns');
    expect(injectedConfig.value).not.toHaveProperty('loading');

    // 静默：不可注入键不产生任何告警
    expect(warnSpy).not.toHaveBeenCalled();

    // 运行期再次变更：同样静默剔除
    componentVars.value = {
      'pro-table': { size: 'large', data: [{ name: '注入数据2' }] },
    };
    await flushPromises();
    expect(injectedConfig.value).not.toHaveProperty('data');
    expect(warnSpy).not.toHaveBeenCalled();
    expect(wrapper.findComponent({ name: 'ElTable' }).props('size')).toBe(
      'large'
    );
    wrapper.unmount();
    warnSpy.mockRestore();

    // 类型面契约：data 不在 componentVars.pro-table 的可配置面内
    // @ts-expect-error data 不参与 ProTable 全局注入
    const providerVars: ComponentVars = { 'pro-table': { data: [] } };
    expect(Object.keys(providerVars['pro-table'] ?? {})).toEqual(['data']);

    // 默认值不含不可注入键
    expect(Object.keys(INJECT_CONFIG['pro-table'].default)).not.toContain(
      'data'
    );
    expect(Object.keys(INJECT_CONFIG['pro-form'].default)).not.toContain(
      'form'
    );
  });
});
