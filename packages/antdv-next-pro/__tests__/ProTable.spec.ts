import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, inject, markRaw, ref, toRaw } from 'vue';
import { mount } from '@vue/test-utils';
import { Pagination } from 'antdv-next';
import ProTable from '../src/components/table/components/ProTable.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import SizeControl from '../src/components/table/components/SizeControl.vue';
import { useTable } from '../src/components/table/hooks/useTable';
import { tableProps } from '../src/shared/ui';
import { INJECT_CONFIG } from '../src/components/component-provider/constants';
import type { ComponentVars } from '../src/components/component-provider';
import { expectWarn, flushPromises, mountProTable } from './helpers/mount';
import { createBasicColumns } from './helpers/fixtures';
import type { Column } from '../src/components/table/types';

describe('ProTable 组件测试', () => {
  // ----------------------------------------------------
  // PT-A6 [判别]: 运行期替换 :table 实例，列与数据源无缝跟随新实例
  // ----------------------------------------------------
  it('PT-A6 [判别]: 运行期替换 :table prop 时，表格列与数据源立即切换至新实例', async () => {
    const table1 = useTable({
      columns: [{ dataIndex: 'col1', title: '列1' }],
      dataSource: [{ col1: 'data-1' }],
    });
    const table2 = useTable({
      columns: [{ dataIndex: 'col2', title: '列2' }],
      dataSource: [{ col2: 'data-2' }],
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
    // 1. 默认链路：宿主 Pagination 真实渲染，读取 table.pageParam 与 Provider 预设
    const table0 = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [{ id: 1 }],
    });
    table0.setPageParam({ current: 3, pageSize: 20, total: 42 });
    const wrapper0 = mountProTable({ table: table0 });
    await flushPromises();
    const pagination = wrapper0.wrapper.findComponent(Pagination);
    expect(pagination.exists()).toBe(true);
    expect(pagination.props('current')).toBe(3);
    expect(pagination.props('pageSize')).toBe(20);
    expect(pagination.props('total')).toBe(42);
    expect(pagination.props('showSizeChanger')).toBe(true);
    expect(pagination.props('showQuickJumper')).toBe(true);
    expect(pagination.props('pageSizeOptions')).toEqual([
      '10',
      '20',
      '30',
      '40',
      '50',
      '100',
    ]);
    wrapper0.wrapper.unmount();

    // 2. tableAttrs.pagination === false 优先关闭分页
    const table1 = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [{ id: 1 }],
    });
    const wrapper1 = mount(ProTable, {
      props: {
        table: table1,
        pagination: false,
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper1.findComponent(Pagination).exists()).toBe(false);
    expect(wrapper1.findComponent({ name: 'ATable' }).props('pagination')).toBe(
      false
    );
    wrapper1.unmount();

    // 3. Provider 设置 pagination: false 时，表级无分页配置则不渲染分页
    const table2 = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [{ id: 1 }],
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
    expect(wrapper2.findComponent(Pagination).exists()).toBe(false);
    wrapper2.unmount();

    // 4. Provider 预设、table.pageParam、表级 pagination 三方合并
    const table3 = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [{ id: 1 }],
    });
    table3.setPageParam({ pageSize: 10, total: 100 });
    const wrapper3 = mount(ProComponentProvider, {
      props: {
        componentVars: {
          'pro-table': {
            pagination: { showSizeChanger: false, showQuickJumper: true },
          },
        },
      },
      slots: {
        default: () =>
          h(ProTable, { table: table3, pagination: { current: 4 } }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    const aTable3 = wrapper3.findComponent({ name: 'ATable' });
    // 表级 pagination 覆盖 pageParam 的 current；pageParam 提供 pageSize/total；Provider 预设补齐其余键
    expect(aTable3.props('pagination')).toMatchObject({
      current: 4,
      pageSize: 10,
      total: 100,
      showSizeChanger: false,
      showQuickJumper: true,
    });
    const renderedPagination = wrapper3.findComponent(Pagination);
    expect(renderedPagination.exists()).toBe(true);
    expect(renderedPagination.props('current')).toBe(4);
    expect(renderedPagination.props('pageSize')).toBe(10);
    expect(renderedPagination.props('total')).toBe(100);

    // pageParam 的运行期写入即时反映到宿主分页；表级显式 current 优先级更高，保持 4
    table3.setPageParam({ pageSize: 20, current: 2 });
    await flushPromises();
    expect(aTable3.props('pagination')).toMatchObject({
      current: 4,
      pageSize: 20,
      showSizeChanger: false,
      total: 100,
    });
    wrapper3.unmount();
  });

  // ----------------------------------------------------
  // PT-01: 列渲染与数据源行数
  // ----------------------------------------------------
  it('PT-01: 正确渲染列标题与数据行', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [
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
  // PT-03: 翻页触发查询与 pageParam 更新
  // ----------------------------------------------------
  it('PT-03: 表格翻页触发 pageParam 更新', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      dataSource: new Array(20)
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
      dataSource: [],
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
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });

    const loadingModel = ref(false);
    const { wrapper, cleanup } = mountProTable({
      table,
      search: asyncSearch,
      attachToBody: true,
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
    expect(searchBtn.attributes('type')).toBe('submit');
    await searchBtn.trigger('click');
    await flushPromises();
    expect(loadingModel.value).toBe(true);

    resolveSearch?.();
    await flushPromises();
    expect(loadingModel.value).toBe(false);
    wrapper.unmount();
    cleanup();
  });

  it('PT-A10 [判别]: search 返回非 Promise 时不接管 loading 并输出告警', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let called = false;
    const syncSearch = () => {
      called = true;
      return 'sync-result';
    };

    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });

    const loadingModel = ref(false);
    const { wrapper, cleanup } = mountProTable({
      table,
      search: syncSearch as unknown as () => Promise<unknown>,
      attachToBody: true,
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
      expect(called).toBe(true);
      // 判别点：非 Promise 查询不接管 loading，且运行期告警可被断言
      expect(loadingModel.value).toBe(false);
      expectWarn(warnSpy, '[ProTable] search 未返回 Promise');
    } finally {
      warnSpy.mockRestore();
      wrapper.unmount();
      cleanup();
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
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });

    const loadingModel = ref(false);
    const { wrapper, cleanup } = mountProTable({
      table,
      search: asyncSearch,
      attachToBody: true,
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

      // 第一步：触发异步查询，loading 置位
      expect(searchBtn.exists()).toBe(true);
      await searchBtn.trigger('click');
      await flushPromises();
      expect(loadingModel.value).toBe(true);

      // 第二步：异步在途时替换为同步查询并触发——同步查询不推进竞态序号
      await wrapper.setProps({ search: syncSearch });
      await searchBtn.trigger('click');
      await flushPromises();
      expect(syncCalled).toBe(true);
      // 判别点：同步查询不清除也不冻结在途异步请求的 loading
      expect(loadingModel.value).toBe(true);
      expectWarn(warnSpy, '[ProTable] search 未返回 Promise');

      // 第三步：最初的异步请求 resolve，loading 正常复位（不悬挂）
      resolveSearch?.();
      await flushPromises();
      expect(loadingModel.value).toBe(false);
    } finally {
      warnSpy.mockRestore();
      wrapper.unmount();
      cleanup();
    }
  });

  // ----------------------------------------------------
  // PT-06: 搜索区显隐控制
  // ----------------------------------------------------
  it('PT-06: searchFormConfig.hidden: true 时隐藏搜索区域', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
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
      dataSource: [],
    });

    const { wrapper } = mountProTable({
      table,
      props: {
        control: true,
      },
    });

    await flushPromises();
    expect(wrapper.find('.pro-table_size-control_button').exists()).toBe(true);
    expect(wrapper.find('.pro-table_column-control_button').exists()).toBe(
      true
    );
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-08 [判别]: 插槽 button-bar / toolbar / search-form / table 渲染与作用域参数
  // ----------------------------------------------------
  it('PT-08 [判别]: button-bar / toolbar 渲染，search-form 与 table 插槽接收作用域参数', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [{ id: 1, name: '甲', status: 'normal' }],
      searchParam: {},
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });

    const searchFormScoped: any[] = [];
    const tableScoped: any[] = [];
    const { wrapper } = mountProTable({
      table,
      slots: {
        'button-bar': () => h('button', { class: 'custom-add-btn' }, '新增'),
        toolbar: () => h('div', { class: 'custom-toolbar' }, '工具'),
        'search-form': (scoped: any) => {
          searchFormScoped.push(scoped);
          return h('div', { class: 'custom-search-form' }, '搜索区');
        },
        table: (scoped: any) => {
          tableScoped.push(scoped);
          return h('div', { class: 'custom-table-area' }, '自定义表格');
        },
      },
    });

    await flushPromises();

    // ① button-bar / toolbar 各自渲染
    const btn = wrapper.find('.custom-add-btn');
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toBe('新增');
    expect(wrapper.find('.custom-toolbar').exists()).toBe(true);

    // ② search-form 插槽接收 form / search / reset 作用域参数，且替换默认搜索表单
    expect(wrapper.find('.custom-search-form').exists()).toBe(true);
    expect(wrapper.find('.pro-table_search-form').exists()).toBe(false);
    expect(searchFormScoped).toHaveLength(1);
    expect(searchFormScoped[0].form).toBe(table.searchForm);
    expect(typeof searchFormScoped[0].search).toBe('function');
    expect(typeof searchFormScoped[0].reset).toBe('function');

    // ③ table 插槽接收 columns / dataSource / pagination / loading / size / onChange，且替换默认表格
    expect(wrapper.find('.custom-table-area').exists()).toBe(true);
    expect(wrapper.find('.pro-table_content').exists()).toBe(false);
    expect(tableScoped).toHaveLength(1);
    expect(tableScoped[0].columns).toEqual(
      expect.arrayContaining([expect.objectContaining({ dataIndex: 'id' })])
    );
    expect(tableScoped[0].dataSource).toEqual([
      { id: 1, name: '甲', status: 'normal' },
    ]);
    expect(tableScoped[0].pagination).toMatchObject({ current: 1 });
    expect(tableScoped[0].loading).toBe(false);
    expect(tableScoped[0].size).toBeUndefined();
    expect(typeof tableScoped[0].onChange).toBe('function');

    // 作用域 onChange 改写分页参数并回放查询链路
    tableScoped[0].onChange({ current: 2, pageSize: 10 });
    await flushPromises();
    expect(table.pageParam.current).toBe(2);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-09 [判别]: 现状锁定（2.5 搜索竞态不处理）：连续查询逐次调用 search，不做在途去重
  // ----------------------------------------------------
  it('PT-09 [判别]: 现状锁定（2.5 搜索竞态不处理）：每次点击各触发一次 search，在途查询不去重', async () => {
    const resolvers: Array<() => void> = [];
    const callArgs: unknown[][] = [];
    const asyncSearch = (...args: unknown[]) => {
      callArgs.push(args);
      return new Promise<void>(resolve => resolvers.push(resolve));
    };

    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });

    const { wrapper, cleanup } = mountProTable({
      table,
      search: asyncSearch,
      attachToBody: true,
    });

    await flushPromises();
    const searchBtn = wrapper.find('.pro-table_search-form_search-button');
    expect(searchBtn.exists()).toBe(true);
    expect(resolvers).toHaveLength(0);

    // 第一次查询在途时再次点击：不做去重，第二次查询照样发起
    await searchBtn.trigger('click');
    await flushPromises();
    expect(resolvers).toHaveLength(1);

    await searchBtn.trigger('click');
    await flushPromises();
    expect(resolvers).toHaveLength(2);

    // 判别点：search 以无参形式逐次调用，调用次数与点击次数一一对应
    expect(callArgs).toEqual([[], []]);

    resolvers.forEach(resolve => resolve());
    await flushPromises();
    wrapper.unmount();
    cleanup();
  });

  // ----------------------------------------------------
  // PT-A8: isSlotRenderable 守卫 bodyCell 插槽 column 参数
  // ----------------------------------------------------
  it('PT-A8 [判别]: isSlotRenderable 在 bodyCell 存在 column 时正常渲染，并在解构 column 属性时不抛出异常', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [{ id: 1, name: 'Alice', age: 20 }],
    });

    let renderedCount = 0;
    const { wrapper } = mountProTable({
      table,
      slots: {
        bodyCell: ({ column, record }: any) => {
          renderedCount++;
          // 直接访问 column 属性
          const key = column.key;
          const dataIndex = column.dataIndex;
          return h(
            'span',
            { class: 'custom-body-cell' },
            `${key || dataIndex}-${record.name}`
          );
        },
      },
    });

    await flushPromises();
    // 默认 addIndexColumn 为 true：序号列 + 3 个数据列各渲染一次 bodyCell
    const cells = wrapper.findAll('.custom-body-cell');
    expect(cells.map(cell => cell.text())).toEqual([
      '__INDEX__-Alice',
      'id-Alice',
      'name-Alice',
      'status-Alice',
    ]);
    expect(renderedCount).toBe(4);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A11 [判别]: 仅 Provider 配置 onChange 时，表格 change 回放 Provider 监听器
  // ----------------------------------------------------
  it('PT-A11 [判别]: 仅 Provider 配置 onChange 时，表格 change 触发 Provider 监听器', async () => {
    const received: any[] = [];
    const table = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [{ id: 1 }],
    });

    const componentVars = {
      'pro-table': {
        onChange: (...args: any[]) => {
          received.push(args[0]);
        },
      },
    };

    const wrapper = mount(ProComponentProvider, {
      props: { componentVars },
      slots: {
        default: () => h(ProTable, { table }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const aTable = wrapper.findComponent({ name: 'ATable' });
    expect(aTable.exists()).toBe(true);
    aTable.vm.$emit('change', { current: 2, pageSize: 10 });
    await flushPromises();

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ current: 2, pageSize: 10 });
    // 原有分页链路不回归
    expect(table.pageParam.current).toBe(2);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A12 [判别]: 模板 @change 与 Provider onChange 同时存在时，模板监听器优先（覆盖语义）
  // ----------------------------------------------------
  it('PT-A12 [判别]: 模板 @change 与 Provider onChange 同时存在时，仅模板监听器触发', async () => {
    const calls: string[] = [];
    const table = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [{ id: 1 }],
    });

    const componentVars = {
      'pro-table': {
        onChange: () => {
          calls.push('provider');
        },
      },
    };

    const wrapper = mount(ProComponentProvider, {
      props: { componentVars },
      slots: {
        default: () =>
          h(ProTable, {
            table,
            onChange: () => {
              calls.push('attrs');
            },
          }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const aTable = wrapper.findComponent({ name: 'ATable' });
    expect(aTable.exists()).toBe(true);
    aTable.vm.$emit('change', { current: 2, pageSize: 10 });
    await flushPromises();

    expect(calls).toEqual(['attrs']);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A13 [判别]: search 无参调用契约（签名 () => Promise<unknown> 与运行时一致）
  // ----------------------------------------------------
  it('PT-A13 [判别]: search 以无参形式被调用，类型签名与运行时契约一致', async () => {
    const callArgs: unknown[][] = [];
    const searchSpy = (...args: unknown[]) => {
      callArgs.push(args);
      return Promise.resolve();
    };

    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
    });

    const { wrapper } = mountProTable({
      table,
      search: searchSpy,
      props: { immediateSearch: true },
    });
    await flushPromises();

    // immediateSearch 挂载后恰好触发一次，且以无参形式调用
    expect(callArgs).toEqual([[]]);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-02c [判别]: addIndexColumn 默认渲染序号列，显式 false 关闭，显式 true 覆盖 Provider 关闭的默认
  // ----------------------------------------------------
  it('PT-02c [判别]: addIndexColumn 缺省时按默认 true 渲染序号列，显式 false 时不渲染，显式 true 反向覆盖 Provider 关闭默认', async () => {
    const buildTable = () =>
      useTable({
        columns: [{ dataIndex: 'name', title: '姓名' }],
        dataSource: [{ name: '王五' }, { name: '赵六' }],
      });
    const headerTexts = (wrapper: any) =>
      wrapper.findAll('thead th').map((th: any) => th.text());
    const indexCells = (wrapper: any) =>
      wrapper
        .findAll('tbody tr')
        .map((row: any) => row.findAll('td')[0]?.text());

    // ① 缺省：走内置默认 true
    const defaultWrapper = mountProTable({ table: buildTable() }).wrapper;
    await flushPromises();
    expect(headerTexts(defaultWrapper)).toEqual(['序号', '姓名']);
    expect(indexCells(defaultWrapper)).toEqual(['1', '2']);
    defaultWrapper.unmount();

    // ② 显式 false：关闭序号列
    const offWrapper = mountProTable({
      table: buildTable(),
      props: { addIndexColumn: false },
    }).wrapper;
    await flushPromises();
    expect(headerTexts(offWrapper)).toEqual(['姓名']);
    offWrapper.unmount();

    // ③ Provider 关闭默认 + 显式 true：序号列出现，证明 prop 通道而非默认值生效
    const propTable = buildTable();
    const viaProp = mount(ProComponentProvider, {
      props: { componentVars: { 'pro-table': { addIndexColumn: false } } },
      slots: {
        default: () => h(ProTable, { table: propTable, addIndexColumn: true }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(headerTexts(viaProp)).toEqual(['序号', '姓名']);
    viaProp.unmount();

    // ④ Provider 关闭默认且未显式传 prop：序号列不渲染
    const providerTable = buildTable();
    const byProvider = mount(ProComponentProvider, {
      props: { componentVars: { 'pro-table': { addIndexColumn: false } } },
      slots: { default: () => h(ProTable, { table: providerTable }) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(headerTexts(byProvider)).toEqual(['姓名']);
    byProvider.unmount();
  });

  // ----------------------------------------------------
  // PT-A14 [判别]: Provider 注入的 size 生效，显式绑定优先；loading 不可经 componentVars 注入
  // ----------------------------------------------------
  it('PT-A14 [判别]: Provider 注入 size 生效且显式绑定优先，loading 不可注入', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'name', title: '姓名' }],
      dataSource: [],
    });

    // 不可注入键：注入层静默剔除
    const injectedWrapper = mount(ProComponentProvider, {
      props: {
        componentVars: {
          'pro-table': { size: 'small', loading: true },
        } as any,
      },
      slots: { default: () => h(ProTable, { table }) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    const injectedTable = injectedWrapper.findComponent({ name: 'ATable' });
    expect(injectedTable.props('size')).toBe('small');
    // loading 由组件自身状态驱动：Provider 注入值不生效
    expect(injectedTable.props('loading')).toBe(false);
    injectedWrapper.unmount();

    const localSize = ref<any>('large');
    const localWrapper = mount(ProComponentProvider, {
      props: { componentVars: { 'pro-table': { size: 'small' } } },
      slots: {
        default: () =>
          h(ProTable, {
            table,
            size: localSize.value,
            'onUpdate:size': (val: any) => {
              localSize.value = val;
            },
          }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(localWrapper.findComponent({ name: 'ATable' }).props('size')).toBe(
      'large'
    );
    localWrapper.unmount();

    // 编译期契约：loading 不在 componentVars.pro-table 的可配置面内
    // @ts-expect-error loading 已从 componentVars.pro-table 契约中移除
    const invalidVars: ComponentVars = { 'pro-table': { loading: true } };
    expect(invalidVars['pro-table']).toHaveProperty('loading', true);
  });

  // ----------------------------------------------------
  // PT-A16 [判别]: searchFields 含 null / 原始值项时不抛错，搜索区按合法字段渲染
  // ----------------------------------------------------
  it('PT-A16 [判别]: searchFields 含 null/原始值项时不抛错，搜索区正常渲染', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'name', title: '姓名' }],
      dataSource: [],
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
    // 仅合法字段挂载控件，null 与原始值项不产生输入框
    expect(wrapper.findAll('.pro-table_search-form input')).toHaveLength(1);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A17 [判别]: columns 含 null / 原始值项时不抛错，仅渲染合法列
  // ----------------------------------------------------
  it('PT-A17 [判别]: columns 含 null/原始值项时不抛错，仅渲染合法列', async () => {
    const table = useTable({
      columns: [null, 'not-a-column', { dataIndex: 'name', title: '姓名' }],
      dataSource: [{ name: '甲' }],
    } as any);

    const wrapper = mount(ProTable, {
      props: { table, addIndexColumn: false },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const headerCells = wrapper.findAll('thead th');
    expect(headerCells).toHaveLength(1);
    expect(headerCells[0].text()).toContain('姓名');
    expect(wrapper.find('tbody').text()).toContain('甲');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A19 [判别]: 分组子列 hidden 递归过滤（含响应式与引用保持）
  // ----------------------------------------------------
  it('PT-A19 [判别]: 分组列的子列 hidden 参与过滤，未变动列保持原引用', async () => {
    const hiddenRef = ref(true);
    const plainColumn = { dataIndex: 'plain', title: '普通列' };
    const table = useTable({
      columns: [
        plainColumn,
        {
          title: '分组',
          children: [
            { dataIndex: 'a', title: '子列甲', hidden: true },
            { dataIndex: 'b', title: '子列乙' },
            { dataIndex: 'c', title: '子列丙', hidden: hiddenRef },
          ],
        },
      ],
      dataSource: [{ a: 'A', b: 'B', c: 'C' }],
    });

    const wrapper = mount(ProTable, {
      props: { table, addIndexColumn: false },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 表头不含被过滤的子列；表体不含其数据
    const headerText = wrapper
      .findAll('thead th')
      .map(th => th.text())
      .join(' ');
    expect(headerText).toContain('子列乙');
    expect(headerText).not.toContain('子列甲');
    expect(headerText).not.toContain('子列丙');
    expect(wrapper.find('tbody').text()).toContain('B');
    expect(wrapper.find('tbody').text()).not.toContain('A');

    // 未发生变动的普通列保持原对象引用（仅含被过滤子列的列生成浅拷贝）
    const passed = wrapper
      .findComponent({ name: 'ATable' })
      .props('columns') as any[];
    expect(toRaw(passed[0])).toBe(plainColumn);

    // 下发给宿主表格的列中，被过滤的子列已被移除（与宿主是否自行过滤 hidden 无关）
    const groupColumn = passed.find((c: any) => c.title === '分组');
    expect(groupColumn.children.map((c: any) => c.title)).toEqual(['子列乙']);

    // 响应式形态：ref(true) → ref(false) 后子列丙出现
    hiddenRef.value = false;
    await flushPromises();
    expect(
      wrapper
        .findAll('thead th')
        .map(th => th.text())
        .join(' ')
    ).toContain('子列丙');

    wrapper.unmount();
  });
  // ----------------------------------------------------
  // PT-A20 [判别]: tableContainer 默认容器 / false 关闭 / 自定义容器
  // ----------------------------------------------------
  it('PT-A20 [判别]: tableContainer 默认包裹、false 关闭包裹、自定义组件包裹表格', async () => {
    const buildTable = () =>
      useTable({
        columns: [{ dataIndex: 'name', title: '姓名' }],
        dataSource: [{ name: '甲' }],
      });
    const CustomContainer = defineComponent({
      name: 'CustomTableContainer',
      setup(_, { slots }) {
        return () =>
          h('div', { class: 'custom-table-container' }, slots.default?.());
      },
    });

    // ① 默认：使用 DefaultTableContainer 包裹
    const def = mountProTable({ table: buildTable() });
    await flushPromises();
    const defContainer = def.wrapper.find('.pro-table_table-container');
    expect(defContainer.exists()).toBe(true);
    expect(defContainer.find('.pro-table_content').exists()).toBe(true);
    def.wrapper.unmount();

    // ② false：不包裹容器，表格内容仍渲染
    const none = mountProTable({
      table: buildTable(),
      props: { tableContainer: false },
    });
    await flushPromises();
    expect(none.wrapper.find('.pro-table_table-container').exists()).toBe(
      false
    );
    expect(none.wrapper.find('.pro-table_content').exists()).toBe(true);
    none.wrapper.unmount();

    // ③ 自定义容器：包裹表格内容
    const custom = mountProTable({
      table: buildTable(),
      props: { tableContainer: markRaw(CustomContainer) },
    });
    await flushPromises();
    const box = custom.wrapper.find('.custom-table-container');
    expect(box.exists()).toBe(true);
    expect(box.find('.pro-table_content').exists()).toBe(true);
    custom.wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A21 [判别]: searchFormConfig.container 默认容器 / false 关闭 / 自定义容器
  // ----------------------------------------------------
  it('PT-A21 [判别]: searchFormConfig.container 默认包裹、false 关闭包裹、自定义组件包裹搜索表单', async () => {
    const buildTable = () =>
      useTable({
        columns: [{ dataIndex: 'name', title: '姓名' }],
        dataSource: [{ name: '甲' }],
        searchParam: {},
        searchFields: [{ path: 'name', label: '姓名', component: 'input' }],
      });
    const CustomContainer = defineComponent({
      name: 'CustomSearchFormContainer',
      setup(_, { slots }) {
        return () =>
          h('div', { class: 'custom-search-container' }, slots.default?.());
      },
    });

    // ① 默认：使用 DefaultSearchFormContainer 包裹搜索表单
    const def = mountProTable({ table: buildTable() });
    await flushPromises();
    const defContainer = def.wrapper.find('.pro-table_search-form-container');
    expect(defContainer.exists()).toBe(true);
    expect(defContainer.find('.pro-table_search-form').exists()).toBe(true);
    def.wrapper.unmount();

    // ② container: false：不包裹容器，搜索表单仍渲染
    const none = mountProTable({
      table: buildTable(),
      props: { searchFormConfig: { container: false } },
    });
    await flushPromises();
    expect(none.wrapper.find('.pro-table_search-form-container').exists()).toBe(
      false
    );
    expect(none.wrapper.find('.pro-table_search-form').exists()).toBe(true);
    none.wrapper.unmount();

    // ③ 自定义容器：包裹搜索表单
    const custom = mountProTable({
      table: buildTable(),
      props: { searchFormConfig: { container: markRaw(CustomContainer) } },
    });
    await flushPromises();
    const box = custom.wrapper.find('.custom-search-container');
    expect(box.exists()).toBe(true);
    expect(box.find('.pro-table_search-form').exists()).toBe(true);
    custom.wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A22 [判别]: control 的 false / true / 对象三种形态
  // ----------------------------------------------------
  it('PT-A22 [判别]: control 三形态分别控制尺寸与列控制，对象形态的 disabledKeys 生效', async () => {
    const buildTable = () =>
      useTable({
        columns: [
          { dataIndex: 'name', title: '姓名', hidden: true },
          { dataIndex: 'age', title: '年龄' },
        ],
        dataSource: [{ name: '甲', age: 18 }],
      });

    // ① control: false → 尺寸控制与列控制都不渲染
    const off = mountProTable({
      table: buildTable(),
      props: { control: false },
    });
    await flushPromises();
    expect(off.wrapper.find('.pro-table_header_size-control').exists()).toBe(
      false
    );
    expect(off.wrapper.find('.pro-table_header_column-control').exists()).toBe(
      false
    );
    off.wrapper.unmount();

    // ② control: true → 两者都渲染
    const on = mountProTable({ table: buildTable(), props: { control: true } });
    await flushPromises();
    expect(on.wrapper.find('.pro-table_header_size-control').exists()).toBe(
      true
    );
    expect(on.wrapper.find('.pro-table_header_column-control').exists()).toBe(
      true
    );
    on.wrapper.unmount();

    // ③ 对象形态：仅开启 sizeControl，列控制禁用 name（disabledKeys 同时强制该列展示）
    const table = buildTable();
    const partial = mountProTable({
      table,
      props: {
        control: {
          sizeControl: true,
          columnControl: { disabledKeys: ['name'] },
        },
      },
    });
    await flushPromises();
    expect(
      partial.wrapper.find('.pro-table_header_size-control').exists()
    ).toBe(true);
    expect(
      partial.wrapper.find('.pro-table_header_column-control').exists()
    ).toBe(true);
    // disabledKeys 的即时 watch 把该列强制置为展示
    const hiddenValues = table.columns.value.map((c: any) => c.hidden);
    expect(hiddenValues).toEqual([false, undefined]);
    partial.wrapper.unmount();

    // ④ 对象形态未声明的开关默认关闭
    const blank = mountProTable({
      table: buildTable(),
      props: { control: {} },
    });
    await flushPromises();
    expect(blank.wrapper.find('.pro-table_header_size-control').exists()).toBe(
      false
    );
    expect(
      blank.wrapper.find('.pro-table_header_column-control').exists()
    ).toBe(false);
    blank.wrapper.unmount();

    // ⑤ Provider 关闭 control + 显式 control: true：两个控制区均渲染，证明 prop 通道而非默认值生效
    const propTable = buildTable();
    const viaProp = mount(ProComponentProvider, {
      props: { componentVars: { 'pro-table': { control: false } } },
      slots: {
        default: () => h(ProTable, { table: propTable, control: true }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(viaProp.find('.pro-table_header_size-control').exists()).toBe(true);
    expect(viaProp.find('.pro-table_header_column-control').exists()).toBe(
      true
    );
    viaProp.unmount();

    // ⑥ Provider 关闭 control 且未显式传 prop：两个控制区均不渲染
    const providerTable = buildTable();
    const offByProvider = mount(ProComponentProvider, {
      props: { componentVars: { 'pro-table': { control: false } } },
      slots: { default: () => h(ProTable, { table: providerTable }) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(offByProvider.find('.pro-table_header_size-control').exists()).toBe(
      false
    );
    offByProvider.unmount();
  });

  // ----------------------------------------------------
  // PT-A23 [判别]: 序号偏移取有效分页（attrs.pagination.pageSize 优先于 table.pageParam）
  // ----------------------------------------------------
  it('PT-A23 [判别]: attrs 传入 pageSize 时序号按有效分页偏移', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: Array.from({ length: 12 }, (_, i) => ({
        id: `row-${i + 1}`,
      })),
    });

    const { wrapper } = mountProTable({
      table,
      props: {
        addIndexColumn: true,
        pagination: { current: 2, pageSize: 5 },
      },
    });
    await flushPromises();

    // 有效分页 current=2 / pageSize=5 → 首行序号 (2-1)*5+1 = 6
    const indexCells = wrapper
      .findAll('tbody tr')
      .map(row => row.findAll('td')[0]?.text());
    expect(indexCells).toEqual(['6', '7', '8', '9', '10']);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A24 [判别]: search 告警按原因分键去重，且未配置 search 时不误报
  // ----------------------------------------------------
  it('PT-A24 [判别]: 两类 search 告警按原因分别输出，未配置 search 时不告警', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const proTableWarns = () =>
      warnSpy.mock.calls
        .map(args => String(args[0]))
        .filter(msg => msg.startsWith('[ProTable]'));

    // ① 同时配置 :search 与 @search，且 search 返回非 Promise → 两条告警互不静音
    const table1 = useTable({
      columns: createBasicColumns(),
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });
    const wrapper1 = mount(ProTable, {
      props: {
        table: table1,
        search: () => 'sync-result',
        onSearch: () => {},
      } as any,
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    const searchBtn1 = wrapper1.find('.pro-table_search-form_search-button');
    expect(searchBtn1.exists()).toBe(true);
    await searchBtn1.trigger('click');
    await flushPromises();

    expect(proTableWarns()).toHaveLength(2);
    expect(
      proTableWarns().some(msg =>
        msg.includes('同时配置了 :search prop 与 @search 监听')
      )
    ).toBe(true);
    expect(
      proTableWarns().some(msg => msg.includes('search 未返回 Promise'))
    ).toBe(true);

    // 同一原因重复触发不重复告警
    await searchBtn1.trigger('click');
    await flushPromises();
    expect(proTableWarns()).toHaveLength(2);
    wrapper1.unmount();
    document.body.innerHTML = '';

    // ② 未配置 search 与 @search 时不产生「未返回 Promise」误报
    const table2 = useTable({
      columns: createBasicColumns(),
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });
    const wrapper2 = mount(ProTable, {
      props: { table: table2 },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    await wrapper2
      .find('.pro-table_search-form_search-button')
      .trigger('click');
    await flushPromises();
    expect(proTableWarns()).toHaveLength(2);
    wrapper2.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // PT-A25 [判别]: emit 型 attrs（@scroll / v-model:expanded-row-keys）透传至宿主表格
  // ----------------------------------------------------
  it('PT-A25 [判别]: @scroll 与 v-model:expanded-row-keys 真正到达宿主表格', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [{ id: 1 }],
    });
    const expandedKeys = ref<any[]>([]);
    const scrollEvents: any[] = [];
    const Parent = defineComponent({
      components: { ProTable },
      setup() {
        return {
          table,
          expandedKeys,
          onScroll: (event: any) => scrollEvents.push(event),
        };
      },
      template: `
        <ProTable
          :table="table"
          v-model:expanded-row-keys="expandedKeys"
          @scroll="onScroll"
        />
      `,
    });

    const wrapper = mount(Parent, { global: { stubs: { transition: false } } });
    await flushPromises();

    const hostTable = wrapper.findComponent({ name: 'ATable' });
    expect(hostTable.exists()).toBe(true);
    expect(hostTable.props('expandedRowKeys')).toEqual([]);

    hostTable.vm.$emit('update:expandedRowKeys', ['1']);
    hostTable.vm.$emit('scroll', { type: 'scroll' });
    await flushPromises();

    expect(expandedKeys.value).toEqual(['1']);
    expect(scrollEvents).toEqual([{ type: 'scroll' }]);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A26 [判别]: 宿主静态 props 可用时按宿主导出的键名限定透传；缺失时全量透传并仅告警一次
  // ----------------------------------------------------
  it('PT-A26 [判别]: 宿主静态 props 缺失时全量透传 attrs 并仅告警一次', async () => {
    const { Table } = await import('antdv-next');
    const hostTable = Table as any;
    const snapshot = hostTable.props;
    const hostKeys = Object.keys(snapshot || {});
    expect(hostKeys).toContain('dataSource');
    expect(hostKeys).toContain('columns');
    expect(hostKeys).toContain('pagination');

    const table = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [{ id: 1 }],
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const hostWarns = () =>
      warnSpy.mock.calls
        .map(args => String(args[0]))
        .filter(msg => msg.includes('宿主 Table'));

    // ① 静态 props 可用：透传键取自宿主导出，未被宿主导出的 attrs 不向宿主表格转发
    const usable = mount(ProTable, {
      props: { table },
      attrs: { 'data-probe': 'filtered-out' },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(usable.find('.pro-table_content').exists()).toBe(true);
    expect(usable.find('.pro-table_content').html()).not.toContain(
      'filtered-out'
    );
    expect(hostWarns()).toHaveLength(0);
    usable.unmount();

    // ② 静态 props 缺失：不做键名限定，attrs 全量透传至宿主表格
    hostTable.props = undefined;
    try {
      const passed = mount(ProTable, {
        props: { table },
        attrs: { 'data-probe': 'pass-through' },
        global: { stubs: { transition: false } },
      });
      await flushPromises();
      expect(passed.find('.pro-table_content').exists()).toBe(true);
      expect(passed.find('.pro-table_content').html()).toContain(
        'pass-through'
      );

      // 空记录即不限定键名，宿主 emits 键仍向调用方开放
      const emptyKeys = Object.keys(tableProps());
      expect(emptyKeys).toHaveLength(0);

      // 再次挂载不重复告警
      const again = mount(ProTable, {
        props: { table },
        global: { stubs: { transition: false } },
      });
      await flushPromises();
      again.unmount();
      passed.unmount();
      expect(hostWarns()).toHaveLength(1);

      // ③ 快照非空即视为可用：仅补齐宿主 emits 键，不合并任何内置 props 键
      hostTable.props = { size: { type: String } };
      const partialKeys = Object.keys(tableProps());
      expect(partialKeys).toContain('size');
      expect(partialKeys).toContain('onChange');
      expect(partialKeys).toContain('onUpdate:expandedRowKeys');
      expect(partialKeys).not.toContain('dataSource');
    } finally {
      hostTable.props = snapshot;
    }
  });

  // ----------------------------------------------------
  // PT-A27 [判别]: v-model:size 双向绑定回写父级并同步宿主表格
  // ----------------------------------------------------
  it('PT-A27 [判别]: v-model:size 双向绑定回写父级并同步宿主表格', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'name', title: '姓名' }],
      dataSource: [],
    });
    const sizeModel = ref<any>('large');
    const Parent = defineComponent({
      components: { ProTable },
      setup() {
        return { table, sizeModel };
      },
      template: `
        <ProTable
          :table="table"
          v-model:size="sizeModel"
          :control="{ sizeControl: true }"
        />
      `,
    });

    const wrapper = mount(Parent, { global: { stubs: { transition: false } } });
    await flushPromises();

    const hostTable = wrapper.findComponent({ name: 'ATable' });
    expect(hostTable.props('size')).toBe('large');

    const sizeControl = wrapper.findComponent(SizeControl);
    expect(sizeControl.exists()).toBe(true);
    sizeControl.vm.$emit('update:size', 'small');
    await flushPromises();

    expect(sizeModel.value).toBe('small');
    expect(hostTable.props('size')).toBe('small');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A28 [判别]: filterDropdown / filterIcon 插槽经宿主表格渲染并随列可见性收敛
  // ----------------------------------------------------
  it('PT-A28 [判别]: filterDropdown/filterIcon 插槽转发至宿主表格并随列可见性收敛', async () => {
    const hidden = ref(false);
    const table = useTable({
      columns: [
        {
          dataIndex: 'name',
          title: '姓名',
          filters: [{ text: '甲', value: '甲' }],
          hidden,
        },
      ],
      dataSource: [{ name: '甲' }],
    } as any);

    const scopedColumns: any[] = [];
    const wrapper = mount(ProTable, {
      props: { table, addIndexColumn: false },
      slots: {
        filterIcon: (scoped: any) => {
          scopedColumns.push(scoped?.column);
          return h('span', { class: 'custom-filter-icon' }, 'F');
        },
        filterDropdown: (scoped: any) => {
          scopedColumns.push(scoped?.column);
          return h('div', { class: 'custom-filter-dropdown' }, 'FD');
        },
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // ① filterIcon 经宿主表格渲染
    expect(wrapper.find('.custom-filter-icon').exists()).toBe(true);
    // ② 展开筛选弹层后 filterDropdown 渲染（弹层 Teleport 到 body）
    await wrapper.find('.ant-table-filter-trigger').trigger('click');
    await new Promise(resolve => setTimeout(resolve, 300));
    await flushPromises();
    expect(document.querySelectorAll('.custom-filter-dropdown')).toHaveLength(
      1
    );
    // ③ 插槽作用域始终携带有效 column
    expect(scopedColumns.some(column => column?.dataIndex === 'name')).toBe(
      true
    );
    expect(scopedColumns.every(column => Boolean(column))).toBe(true);

    // ④ 列隐藏后两个插槽均不再渲染
    hidden.value = true;
    await new Promise(resolve => setTimeout(resolve, 300));
    await flushPromises();
    expect(wrapper.find('.custom-filter-icon').exists()).toBe(false);
    expect(document.querySelectorAll('.custom-filter-dropdown')).toHaveLength(
      0
    );

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A29 [判别]: 列依赖插槽守卫阻断 column 缺失或全部列隐藏时的调用
  // ----------------------------------------------------
  it('PT-A29 [判别]: 列依赖插槽守卫阻断 column 缺失或全部列隐藏时的调用', async () => {
    const hidden = ref(false);
    const table = useTable({
      columns: [{ dataIndex: 'name', title: '姓名', hidden }],
      dataSource: [{ name: '甲' }],
    } as any);

    const captured: Record<string, any> = {};
    const ATableStub = defineComponent({
      name: 'ATable',
      setup(_, { slots }) {
        captured.slots = slots;
        return () => h('div', { class: 'a-table-stub' });
      },
    });

    const calls: any[] = [];
    const wrapper = mount(ProTable, {
      props: { table, addIndexColumn: false },
      slots: {
        filterDropdown: (scoped: any) => {
          calls.push(scoped?.column);
          return h('div', 'FD');
        },
        filterIcon: (scoped: any) => {
          calls.push(scoped?.column);
          return h('span', 'F');
        },
      },
      global: { stubs: { ATable: ATableStub, transition: false } },
    });
    await flushPromises();
    expect(wrapper.find('.a-table-stub').exists()).toBe(true);
    expect(calls).toHaveLength(0);

    // ① 作用域携带有效 column 时透传
    captured.slots.filterDropdown({ column: { dataIndex: 'name' } });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ dataIndex: 'name' });

    // ② column 缺失时守卫阻断
    captured.slots.filterDropdown({ column: undefined });
    captured.slots.filterIcon({ column: undefined });
    expect(calls).toHaveLength(1);

    // ③ 全部列隐藏时守卫阻断（作用域仍携带 column）
    hidden.value = true;
    await flushPromises();
    captured.slots.filterDropdown({ column: { dataIndex: 'name' } });
    expect(calls).toHaveLength(1);

    wrapper.unmount();
  });
  // ----------------------------------------------------
  // PT-A35 [判别]: 分组列 children 在类型面可直接构造（无需断言）并参与递归过滤
  // ----------------------------------------------------
  it('PT-A35 [判别]: 分组列 children 经公开类型直接构造，嵌套子列 hidden 递归生效', async () => {
    const hiddenRef = ref(false);
    // 类型面：分组列与嵌套分组均无需 as any
    const columns: Column[] = [
      {
        title: '分组',
        children: [
          { dataIndex: 'name', title: '姓名', hidden: hiddenRef },
          {
            title: '嵌套',
            children: [{ dataIndex: 'age', title: '年龄' }],
          },
        ],
      },
    ];
    const table = useTable({ columns, dataSource: [{ name: '甲', age: 18 }] });

    const { wrapper } = mountProTable({
      table,
      props: { addIndexColumn: false },
    });
    await flushPromises();

    const headers = () => wrapper.findAll('thead th').map(th => th.text());
    expect(headers()).toContain('姓名');
    expect(headers()).toContain('年龄');

    // 外部 ref 翻转驱动分组内子列显隐
    hiddenRef.value = true;
    await flushPromises();
    expect(headers()).not.toContain('姓名');
    expect(headers()).toContain('年龄');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A36 [判别]: searchFormConfig 的 container / hidden 由 ProTable 自身消费，不下发 SearchForm
  // ----------------------------------------------------
  it('PT-A36 [判别]: searchFormConfig 的 container / hidden 不落 SearchForm 根 DOM，隐藏语义仍生效', async () => {
    const ContainerProbe = markRaw(
      defineComponent({
        name: 'ContainerProbe',
        setup(_, { slots }) {
          return () =>
            h(
              'div',
              { class: 'search-form-container-probe' },
              slots.default?.()
            );
        },
      })
    );
    const table = useTable({
      columns: [{ dataIndex: 'name', title: '姓名' }],
      dataSource: [{ name: '甲' }],
      searchFields: [{ path: 'kw', label: '关键词', component: 'input' }],
    });

    const wrapper = mount(ProTable, {
      props: {
        table,
        addIndexColumn: false,
        searchFormConfig: { container: ContainerProbe, hidden: false },
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 自定义容器接管包裹，SearchForm 经由容器 default 插槽渲染
    const container = wrapper.find('.search-form-container-probe');
    expect(container.exists()).toBe(true);
    const form = container.find('form');
    expect(form.exists()).toBe(true);
    // 判别点：两个键均为 ProTable 自身消费，不落为原生 form 的 DOM 属性
    expect(form.attributes('container')).toBeUndefined();
    expect(form.attributes('hidden')).toBeUndefined();
    expect(wrapper.find('[container]').exists()).toBe(false);
    wrapper.unmount();

    // hidden: true 仍隐藏搜索区域
    const hiddenTable = useTable({
      columns: [{ dataIndex: 'name', title: '姓名' }],
      dataSource: [{ name: '甲' }],
      searchFields: [{ path: 'kw', label: '关键词', component: 'input' }],
    });
    const hiddenWrapper = mount(ProTable, {
      props: {
        table: hiddenTable,
        addIndexColumn: false,
        searchFormConfig: { hidden: true },
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(hiddenWrapper.find('form').exists()).toBe(false);
    expect(
      hiddenWrapper.find('.pro-table_search-form-container').exists()
    ).toBe(false);
    hiddenWrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A37 [判别]: Provider 注入的 columns / dataSource 不参与表格渲染（来源为 table 实例）
  // ----------------------------------------------------
  it('PT-A37 [判别]: Provider 注入的 columns / dataSource 不生效，列与数据源取自 table 实例', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'name', title: '实例列', key: 'name' }],
      dataSource: [{ name: '实例数据' }],
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(ProComponentProvider, {
      props: {
        componentVars: {
          'pro-table': {
            columns: [
              { dataIndex: 'injected', title: '注入列', key: 'injected' },
            ],
            dataSource: [{ name: '注入数据' }],
          },
        } as any,
      },
      slots: { default: () => h(ProTable, { table, addIndexColumn: false }) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 列与数据源均取自 table 实例，注入值既不渲染也不落为宿主表格元素属性
    expect(wrapper.text()).toContain('实例列');
    expect(wrapper.text()).toContain('实例数据');
    expect(wrapper.text()).not.toContain('注入列');
    expect(wrapper.text()).not.toContain('注入数据');

    const hostTable = wrapper.findComponent({ name: 'ATable' });
    expect(
      hostTable.props('columns').map((column: any) => column.title)
    ).toEqual(['实例列']);
    expect(hostTable.props('dataSource')).toEqual([{ name: '实例数据' }]);
    const hostElement = hostTable.element as HTMLElement;
    expect(hostElement.getAttribute('columns')).toBeNull();
    expect(hostElement.getAttribute('data-source')).toBeNull();
    // 两个不可注入键均在注入层静默剔除，不产生告警
    expect(warnSpy).not.toHaveBeenCalled();
    wrapper.unmount();
    warnSpy.mockRestore();

    // 类型面契约：注入面不含 columns / dataSource
    const providerVars: ComponentVars = {
      'pro-table': {
        size: 'small',
        // @ts-expect-error columns 不参与 ProTable 全局注入
        columns: [{ dataIndex: 'injected' }],
        dataSource: [],
      },
    };
    // 运行期仍可携带被类型面排除的键，故以键集合对照锁定类型面收口
    expect(Object.keys(providerVars['pro-table'] ?? {})).toEqual([
      'size',
      'columns',
      'dataSource',
    ]);
  });

  // ----------------------------------------------------
  // PT-A38 [判别]: table 插槽作用域 size 与表格实际使用的尺寸一致
  // ----------------------------------------------------
  it('PT-A38 [判别]: table 插槽作用域 size 下发有效值（Provider 注入优先于未绑定的本地模型）', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'name', title: '姓名' }],
      dataSource: [{ name: '甲' }],
    });
    const slotScope: Record<string, any> = {};
    const tableSlot = (scope: any) => {
      Object.assign(slotScope, scope);
      return h('div', { class: 'scope-marker' });
    };

    const injected = mount(ProComponentProvider, {
      props: { componentVars: { 'pro-table': { size: 'small' } } },
      slots: {
        default: () =>
          h(ProTable, { table, addIndexColumn: false }, { table: tableSlot }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(slotScope.size).toBe('small');
    injected.unmount();

    // 显式绑定 size 时插槽收到本地绑定值
    const local = mount(ProTable, {
      props: { table, size: 'large', addIndexColumn: false },
      slots: { table: tableSlot },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(slotScope.size).toBe('large');
    local.unmount();
  });

  // ----------------------------------------------------
  // PT-A39 [判别]: 不可注入键在注入层静默剔除，运行期新增同样被剔除
  // ----------------------------------------------------
  it('PT-A39 [判别]: 不可注入键经注入层静默剔除，运行期新增同样被剔除且不产生告警', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'name', title: '实例列', key: 'name' }],
      dataSource: [{ name: '实例数据' }],
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
                h(ProTable, { table, addIndexColumn: false }),
                h(Probe),
              ],
            }
          );
      },
    });
    const wrapper = mount(Host, { global: { stubs: { transition: false } } });
    await flushPromises();

    // 未配置不可注入键：Provider 注入的 size 正常生效
    expect(wrapper.findComponent({ name: 'ATable' }).props('size')).toBe(
      'small'
    );
    expect(injectedConfig.value).not.toHaveProperty('columns');
    expect(injectedConfig.value).not.toHaveProperty('dataSource');
    expect(injectedConfig.value).not.toHaveProperty('loading');

    // 运行期新增不可注入键：注入被静默剔除（既有列/数据源不受影响）
    componentVars.value = {
      'pro-table': {
        size: 'small',
        columns: [{ dataIndex: 'injected', title: '注入列' }],
        dataSource: [{ name: '注入数据' }],
        loading: true,
      },
    };
    await flushPromises();
    const hostTable = wrapper.findComponent({ name: 'ATable' });
    expect(
      hostTable.props('columns').map((column: any) => column.title)
    ).toEqual(['实例列']);
    expect(hostTable.props('dataSource')).toEqual([{ name: '实例数据' }]);
    expect(hostTable.props('loading')).toBe(false);
    // 注入面已剔除三个不可注入键，其余键（size）照常下发
    expect(injectedConfig.value).not.toHaveProperty('columns');
    expect(injectedConfig.value).not.toHaveProperty('dataSource');
    expect(injectedConfig.value).not.toHaveProperty('loading');
    expect(injectedConfig.value?.size).toBe('small');

    // 静默：不可注入键不产生任何告警
    expect(warnSpy).not.toHaveBeenCalled();

    // 运行期再次变更：同样静默剔除
    componentVars.value = {
      'pro-table': {
        size: 'middle',
        columns: [{ dataIndex: 'injected-2', title: '注入列2' }],
      },
    };
    await flushPromises();
    expect(injectedConfig.value).not.toHaveProperty('columns');
    expect(warnSpy).not.toHaveBeenCalled();
    expect(wrapper.findComponent({ name: 'ATable' }).props('size')).toBe(
      'middle'
    );

    wrapper.unmount();
    warnSpy.mockRestore();

    // 默认值不含不可注入键（未挂 Provider 时 consumer 取 default 也不会拿到失效配置）
    expect(Object.keys(INJECT_CONFIG['pro-table'].default)).not.toContain(
      'columns'
    );
    expect(Object.keys(INJECT_CONFIG['pro-table'].default)).not.toContain(
      'dataSource'
    );
    expect(Object.keys(INJECT_CONFIG['pro-table'].default)).not.toContain(
      'loading'
    );
    expect(Object.keys(INJECT_CONFIG['pro-form'].default)).not.toContain(
      'form'
    );
  });
});
