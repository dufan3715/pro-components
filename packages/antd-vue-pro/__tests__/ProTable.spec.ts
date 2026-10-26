import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, inject, ref, toRaw } from 'vue';
import type { TableProps } from '../src/shared/ui';
import type { Column } from '../src/components/table/types';
import { tableProps as hostTableProps } from '../src/shared/ui';
import { mount } from '@vue/test-utils';
import ProTable from '../src/components/table/components/ProTable.vue';
import SizeControl from '../src/components/table/components/SizeControl.vue';
import ColumnControl from '../src/components/table/components/ColumnControl.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import { useTable } from '../src/components/table/hooks/useTable';
import type { ComponentVars } from '../src/components/component-provider';
import { flushPromises, mountProTable, expectWarn } from './helpers/mount';
import { createBasicColumns } from './helpers/fixtures';
import { Pagination } from 'ant-design-vue';
import { INJECT_CONFIG } from '../src/components/component-provider/constants';

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
    // 1. tableAttrs.pagination === false 优先关闭分页
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
    wrapper1.unmount();

    // 2. Provider 设置 pagination: false 时，表级无分页配置则不显示分页
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
  });

  // ----------------------------------------------------
  // PT-A31 [判别]: 分页正向渲染与来源优先级（显式绑定 > Provider 全局配置）
  // ----------------------------------------------------
  it('PT-A31 [判别]: 显式绑定的分页配置覆盖 Provider 注入的同名键', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [{ id: 1 }],
    });
    const wrapper = mount(ProComponentProvider, {
      props: {
        componentVars: {
          'pro-table': {
            pagination: { current: 3, pageSize: 20, showQuickJumper: true },
          },
        },
      },
      slots: {
        default: () =>
          h(ProTable, {
            table,
            pagination: { current: 1, pageSize: 20, total: 42 },
          }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 正向对照：分页确实渲染
    const pagination = wrapper.findComponent(Pagination);
    expect(pagination.exists()).toBe(true);

    // 有效分页以显式绑定为准，Provider 的同名键不覆盖
    const tableProps = wrapper
      .findComponent({ name: 'ATable' })
      .props('pagination') as any;
    expect(tableProps.current).toBe(1);
    expect(tableProps.total).toBe(42);
    expect(tableProps.pageSize).toBe(20);

    // 宿主渲染结果与有效分页一致：显示当前第 1 页而非 Provider 的第 3 页
    expect(pagination.props('current')).toBe(1);
    expect(wrapper.find('.ant-pagination-item-active').text()).toBe('1');

    // Provider 未与显式绑定同名的键（showQuickJumper）仍作为基础配置生效
    expect(tableProps.showQuickJumper).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A32 [判别]: 分页对象形态下 table.pageParam 与显式绑定的合并顺序
  // ----------------------------------------------------
  it('PT-A32 [判别]: 分页对象形态与 table.pageParam 合并后按显式绑定取值', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [{ id: 1 }],
    });
    table.setPageParam({ current: 2, pageSize: 10, total: 7 });
    const { wrapper } = mountProTable({
      table,
      props: { pagination: { pageSize: 50 } },
    });
    await flushPromises();

    const paginationProps = wrapper
      .findComponent({ name: 'ATable' })
      .props('pagination') as any;
    // pageParam 提供 current/total，显式绑定覆盖 pageSize
    expect(paginationProps.current).toBe(2);
    expect(paginationProps.total).toBe(7);
    expect(paginationProps.pageSize).toBe(50);
    wrapper.unmount();
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
  // PT-02 [判别]: addIndexColumn 的 prop 通道覆盖 Provider 注入的 false
  // ----------------------------------------------------
  it('PT-02 [判别]: Provider 注入 addIndexColumn: false 时不渲染序号列，显式 prop true 覆盖注入值', async () => {
    const buildTable = () =>
      useTable({
        columns: [{ dataIndex: 'name', title: '姓名' }],
        dataSource: [{ name: '王五' }, { name: '赵六' }],
      });

    const mountWithProvider = (table: any, props: Record<string, any> = {}) =>
      mount(ProComponentProvider, {
        props: {
          componentVars: { 'pro-table': { addIndexColumn: false } },
        },
        slots: { default: () => h(ProTable, { table, ...props }) },
        global: { stubs: { transition: false } },
      });

    // ① 仅 Provider 注入 false：序号列不渲染
    const injected = mountWithProvider(buildTable());
    await flushPromises();
    expect(injected.text()).not.toContain('序号');
    injected.unmount();

    // ② Provider 注入 false + 显式 prop true：序号列渲染，证明 prop 通道生效
    const overridden = mountWithProvider(buildTable(), {
      addIndexColumn: true,
    });
    await flushPromises();
    expect(overridden.text()).toContain('序号');
    expect(overridden.text()).toContain('1');
    expect(overridden.text()).toContain('2');
    overridden.unmount();
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
    const { wrapper } = mountProTable({
      table,
      search: asyncSearch,
      attachTo: document.body,
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
    await flushPromises();
    expect(loadingModel.value).toBe(true);

    resolveSearch?.();
    await flushPromises();
    expect(loadingModel.value).toBe(false);
    wrapper.unmount();
    document.body.innerHTML = '';
  });

  it('PT-A10: search 返回非 Promise 时不触发 loading 接管', async () => {
    let called = false;
    const syncSearch = () => {
      called = true;
      return 'sync-result';
    };
    // 契约外输入：故意返回非 Promise，验证该分支不接管 loading
    const notPromiseSearch = syncSearch as unknown as () => Promise<unknown>;

    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const loadingModel = ref(false);
    const { wrapper } = mountProTable({
      table,
      search: notPromiseSearch,
      attachTo: document.body,
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
    await flushPromises();
    expect(called).toBe(true);
    expect(loadingModel.value).toBe(false);
    // 非 Promise 分支留下真实告警，锁定该分支确实被执行
    expectWarn(warnSpy, '[ProTable] search 未返回 Promise');
    wrapper.unmount();
    document.body.innerHTML = '';
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
    // 契约外输入：故意返回非 Promise，验证在途异步请求的 loading 不被其篡改
    const notPromiseSearch = syncSearch as unknown as () => Promise<unknown>;

    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });

    const loadingModel = ref(false);
    const { wrapper } = mountProTable({
      table,
      search: asyncSearch,
      attachTo: document.body,
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
    await flushPromises();
    expect(loadingModel.value).toBe(true);

    // 第二步：异步在途时替换为同步查询并触发——同步查询不推进竞态序号
    await wrapper.setProps({ search: notPromiseSearch });
    await searchBtn.trigger('click');
    await flushPromises();
    expect(syncCalled).toBe(true);
    // 判别点：同步查询不清除也不冻结在途异步请求的 loading
    expect(loadingModel.value).toBe(true);

    // 第三步：最初的异步请求 resolve，loading 正常复位（不悬挂）
    resolveSearch?.();
    await flushPromises();
    expect(loadingModel.value).toBe(false);
    wrapper.unmount();
    document.body.innerHTML = '';
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
  // PT-07 [判别]: control 的 prop 通道覆盖 Provider 注入的 false
  // ----------------------------------------------------
  it('PT-07 [判别]: Provider 注入 control: false 时不渲染控制栏，显式 prop true 覆盖注入值', async () => {
    const buildTable = () =>
      useTable({
        columns: createBasicColumns(),
        dataSource: [],
      });

    const mountWithProvider = (table: any, props: Record<string, any> = {}) =>
      mount(ProComponentProvider, {
        props: { componentVars: { 'pro-table': { control: false } } },
        slots: { default: () => h(ProTable, { table, ...props }) },
        global: { stubs: { transition: false } },
      });

    // ① 仅 Provider 注入 false：尺寸与列控制都不渲染
    const injected = mountWithProvider(buildTable());
    await flushPromises();
    expect(injected.find('.pro-table_header_size-control').exists()).toBe(
      false
    );
    expect(injected.find('.pro-table_header_column-control').exists()).toBe(
      false
    );
    injected.unmount();

    // ② Provider 注入 false + 显式 prop true：两者渲染，证明 prop 通道生效
    const overridden = mountWithProvider(buildTable(), { control: true });
    await flushPromises();
    expect(overridden.find('.pro-table_header_size-control').exists()).toBe(
      true
    );
    expect(overridden.find('.pro-table_header_column-control').exists()).toBe(
      true
    );
    overridden.unmount();
  });

  // ----------------------------------------------------
  // PT-08: 插槽渲染 (button-bar / toolbar / bodyCell)
  // ----------------------------------------------------
  it('PT-08: 支持 button-bar / toolbar 自定义插槽', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
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
  // PT-09 [判别]: 现状锁定（搜索竞态不处理）——查询按钮恰好触发一次外部 search
  // ----------------------------------------------------
  it('PT-09 [判别]: 现状锁定（搜索竞态不处理）：查询按钮对外部 search 函数恰好调用一次', async () => {
    let callCount = 0;
    const asyncSearch = async () => {
      callCount++;
    };

    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });

    const { wrapper } = mountProTable({
      table,
      search: asyncSearch,
      attachTo: document.body,
    });

    await flushPromises();
    const searchBtn = wrapper.find('.pro-table_search-form_search-button');
    expect(searchBtn.exists()).toBe(true);
    expect(searchBtn.attributes('type')).toBe('submit');
    await searchBtn.trigger('click');
    await flushPromises();
    expect(callCount).toBe(1);
    wrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // PT-A8: isSlotRenderable 守卫 bodyCell 插槽 column 参数
  // ----------------------------------------------------
  it('PT-A8 [判别]: isSlotRenderable 在 bodyCell 存在 column 时正常渲染，并在解构 column 属性时不抛出异常', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [{ id: 1, name: 'Alice', age: 20 }],
    });

    // 记录插槽收到的列 key（去重），不依赖渲染次数
    const seenKeys = new Set<string>();
    const { wrapper } = mountProTable({
      table,
      slots: {
        bodyCell: ({ column, record }: any) => {
          // 直接访问 column 属性
          const key = column.key;
          const dataIndex = column.dataIndex;
          seenKeys.add(String(key || dataIndex));
          return h(
            'span',
            { class: 'custom-body-cell' },
            `${key || dataIndex}-${record.name}`
          );
        },
      },
    });

    await flushPromises();
    const cells = wrapper.findAll('.custom-body-cell');
    // 判别点：序号列 + 3 数据列 × 1 行，单元格内容与插槽收到的列精确可数
    expect(cells.map(c => c.text())).toEqual([
      '__INDEX__-Alice',
      'id-Alice',
      'name-Alice',
      'status-Alice',
    ]);
    expect([...seenKeys].sort()).toEqual(['__INDEX__', 'id', 'name', 'status']);

    // 判别点：隐藏列后 bodyCell 仅对可见列调用（列过滤真实作用于插槽渲染）
    seenKeys.clear();
    table.setColumn('name', { hidden: true });
    await flushPromises();
    const visibleCells = wrapper.findAll('.custom-body-cell');
    expect(visibleCells.map(c => c.text())).toEqual([
      '__INDEX__-Alice',
      'id-Alice',
      'status-Alice',
    ]);
    expect([...seenKeys].sort()).toEqual(['__INDEX__', 'id', 'status']);
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

    const wrapper = mount(ProComponentProvider, {
      props: {
        componentVars: {
          'pro-table': {
            onChange: (...args: any[]) => {
              received.push(args[0]);
            },
          },
        },
      },
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

    const wrapper = mount(ProComponentProvider, {
      props: {
        componentVars: {
          'pro-table': {
            onChange: () => {
              calls.push('provider');
            },
          },
        },
      },
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
  // PT-02c [判别]: addIndexColumn 默认渲染序号列，显式 false 关闭
  // ----------------------------------------------------
  it('PT-02c [判别]: addIndexColumn 缺省时按默认 true 渲染序号列，显式 false 时不渲染', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'name', title: '姓名' }],
      dataSource: [{ name: '王五' }],
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
    expect(injectedTable.props('loading')).toBeFalsy();
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

    // 编译期契约：loading 不在 componentVars.pro-table 的可配置面内（由下面 @ts-expect-error 承担）
    // @ts-expect-error loading 已从 componentVars.pro-table 契约中移除
    const invalidVars: ComponentVars = { 'pro-table': { loading: true } };
    expect(Object.keys(invalidVars)).toEqual(['pro-table']);
  });

  // ----------------------------------------------------
  // PT-A15 [判别]: resizeColumn 式就地变异列对象，在 columns 读时规范化下保持元素引用与渲染更新（数组层为浅拷贝）
  // ----------------------------------------------------
  it('PT-A15 [判别]: resizeColumn 式就地变异列对象后元素引用不变、渲染宽度更新且数组层解耦', async () => {
    const rawColumns = [
      { dataIndex: 'name', title: '姓名', width: 100 },
    ] as any[];
    const table = useTable({
      columns: rawColumns,
      dataSource: [{ name: '甲' }],
    });

    const wrapper = mount(ProTable, {
      props: {
        table,
        onResizeColumn: (w: number, col: any) => {
          col.width = w;
        },
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const aTable = wrapper.findComponent({ name: 'ATable' });
    expect(aTable.exists()).toBe(true);

    // 模拟 antd 表头拖拽结束透出的列对象（与本包 columns 元素同一引用）
    const col = table.columns.value[0];
    aTable.vm.$emit('resizeColumn', 240, col);
    await flushPromises();

    // 写入可见；内部数组为调用方数组的浅拷贝（非本体），元素仍共享
    expect(table.columns.value[0].width).toBe(240);
    expect(table.columns.value[0]).toBe(col);
    expect(toRaw(table.columns.value)).not.toBe(rawColumns);
    expect(toRaw(table.columns.value)[0]).toBe(rawColumns[0]);
    // 元素级就地变异仍同步到调用方对象（浅拷贝语义）
    expect(rawColumns[0].width).toBe(240);
    // 渲染层随就地变异更新
    expect(wrapper.html()).toContain('240px');

    wrapper.unmount();
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
    // 判别点：三项 searchFields 中仅 1 个合法字段渲染为输入控件
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
  // PT-A20 / PT-A21 [判别]: container 三形态（默认容器 / false 关闭 / 自定义容器）
  // 编号随用例表逐行给出：PT-A20 → tableContainer，PT-A21 → searchFormConfig.container
  // ----------------------------------------------------
  const containerCases = [
    {
      id: 'PT-A20',
      label: 'tableContainer 默认包裹、false 关闭包裹、自定义组件包裹表格',
      containerSelector: '.pro-table_table-container',
      contentSelector: '.pro-table_content',
      customSelector: '.custom-table-container',
      customContainer: defineComponent({
        name: 'CustomTableContainer',
        setup(_, { slots }) {
          return () =>
            h('div', { class: 'custom-table-container' }, slots.default?.());
        },
      }),
      buildTable: () =>
        useTable({
          columns: [{ dataIndex: 'name', title: '姓名' }],
          dataSource: [{ name: '甲' }],
        }),
      buildProps: (container: any) => ({ tableContainer: container }),
    },
    {
      id: 'PT-A21',
      label:
        'searchFormConfig.container 默认包裹、false 关闭包裹、自定义组件包裹搜索表单',
      containerSelector: '.pro-table_search-form-container',
      contentSelector: '.pro-table_search-form',
      customSelector: '.custom-search-container',
      customContainer: defineComponent({
        name: 'CustomSearchFormContainer',
        setup(_, { slots }) {
          return () =>
            h('div', { class: 'custom-search-container' }, slots.default?.());
        },
      }),
      buildTable: () =>
        useTable({
          columns: [{ dataIndex: 'name', title: '姓名' }],
          dataSource: [{ name: '甲' }],
          searchParam: {},
          searchFields: [{ path: 'name', label: '姓名', component: 'input' }],
        }),
      buildProps: (container: any) => ({ searchFormConfig: { container } }),
    },
  ];

  it.each(containerCases)(
    '$id [判别]: $label',
    async ({
      containerSelector,
      contentSelector,
      customSelector,
      customContainer,
      buildTable,
      buildProps,
    }) => {
      // ① 默认：使用内置容器包裹内容
      const def = mountProTable({ table: buildTable() });
      await flushPromises();
      const defContainer = def.wrapper.find(containerSelector);
      expect(defContainer.exists()).toBe(true);
      expect(defContainer.find(contentSelector).exists()).toBe(true);
      def.wrapper.unmount();

      // ② false：不包裹容器，内容仍渲染
      const none = mountProTable({
        table: buildTable(),
        props: buildProps(false),
      });
      await flushPromises();
      expect(none.wrapper.find(containerSelector).exists()).toBe(false);
      expect(none.wrapper.find(contentSelector).exists()).toBe(true);
      none.wrapper.unmount();

      // ③ 自定义容器：包裹内容
      const custom = mountProTable({
        table: buildTable(),
        props: buildProps(customContainer),
      });
      await flushPromises();
      const box = custom.wrapper.find(customSelector);
      expect(box.exists()).toBe(true);
      expect(box.find(contentSelector).exists()).toBe(true);
      custom.wrapper.unmount();
    }
  );

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
  // PT-A24 [判别]: search 告警按原因分键去重，两类告警互不静音
  // ----------------------------------------------------
  it('PT-A24 [判别]: 两类 search 告警按原因分别输出，同一原因不重复告警', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const proTableWarns = () =>
      warnSpy.mock.calls
        .map(args => String(args[0]))
        .filter(msg => msg.startsWith('[ProTable]'));

    // 同时配置 :search 与 @search，且 search 返回非 Promise → 两条告警互不静音
    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });
    const wrapper = mount(ProTable, {
      props: {
        table,
        search: () => 'sync-result',
        onSearch: () => {},
      } as any,
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    const searchBtn = wrapper.find('.pro-table_search-form_search-button');
    expect(searchBtn.exists()).toBe(true);
    await searchBtn.trigger('click');
    await flushPromises();

    expect(proTableWarns()).toHaveLength(2);
    expectWarn(warnSpy, '同时配置了 :search prop 与 @search 监听');
    expectWarn(warnSpy, 'search 未返回 Promise');

    // 同一原因重复触发不重复告警
    await searchBtn.trigger('click');
    await flushPromises();
    expect(proTableWarns()).toHaveLength(2);
    wrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // PT-A24b [判别]: 未配置 search 与 @search 时点击搜索不产生告警
  // ----------------------------------------------------
  it('PT-A24b [判别]: 未配置 search 时点击搜索不产生「未返回 Promise」告警', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const proTableWarns = () =>
      warnSpy.mock.calls
        .map(args => String(args[0]))
        .filter(msg => msg.startsWith('[ProTable]'));

    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });
    const wrapper = mount(ProTable, {
      props: { table },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    await wrapper.find('.pro-table_search-form_search-button').trigger('click');
    await flushPromises();

    expect(proTableWarns()).toHaveLength(0);
    wrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // PT-A25 [判别]: search-form / table 插槽向调用方暴露作用域参数
  // ----------------------------------------------------
  it('PT-A25 [判别]: search-form 与 table 插槽收到作用域参数', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'name', title: '姓名' }],
      dataSource: [{ name: '甲' }],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });
    const Parent = defineComponent({
      components: { ProTable },
      setup() {
        return { table };
      },
      template: `
        <ProTable :table="table">
          <template #search-form="scope">
            <div class="scope-search">{{ scope.form ? 'form' : 'none' }}|{{ typeof scope.search }}|{{ typeof scope.reset }}</div>
          </template>
          <template #table="scope">
            <div class="scope-table">{{ scope.columns && scope.columns.length > 0 ? 'cols' : 'none' }}|{{ scope.dataSource ? scope.dataSource.length : 'none' }}|{{ scope.pagination === false ? 'off' : 'on' }}|{{ scope.loading }}|{{ scope.size ?? 'none' }}|{{ typeof scope.onChange }}</div>
          </template>
        </ProTable>
      `,
    });

    const wrapper = mount(Parent, { global: { stubs: { transition: false } } });
    await flushPromises();

    expect(wrapper.find('.scope-search').text()).toBe('form|function|function');
    expect(wrapper.find('.scope-table').text()).toBe(
      'cols|1|on|false|none|function'
    );
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A26 [判别]: emit 型 attrs 入口按宿主导出推导，宿主未暴露 scroll 事件面
  // ----------------------------------------------------
  it('PT-A26 [判别]: v-model:expanded-row-keys 到达宿主表格，组件属性面不含 scroll 事件', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [{ id: 1 }],
    });
    const expandedKeys = ref<any[]>([]);
    const Parent = defineComponent({
      components: { ProTable },
      setup() {
        return { table, expandedKeys };
      },
      template: `
        <ProTable :table="table" v-model:expanded-row-keys="expandedKeys" />
      `,
    });

    const wrapper = mount(Parent, { global: { stubs: { transition: false } } });
    await flushPromises();

    const hostTable = wrapper.findComponent({ name: 'ATable' });
    expect(hostTable.exists()).toBe(true);
    expect(hostTable.props('expandedRowKeys')).toEqual([]);

    hostTable.vm.$emit('update:expandedRowKeys', ['1']);
    await flushPromises();
    expect(expandedKeys.value).toEqual(['1']);
    wrapper.unmount();

    // 类型面契约：属性面补齐宿主导出的 emit 键，且不含宿主未暴露的 scroll 事件面
    const hostEmitProps: TableProps = {
      'onUpdate:expandedRowKeys': () => {},
    };
    expect(typeof hostEmitProps['onUpdate:expandedRowKeys']).toBe('function');

    const boundaryProps: TableProps = {
      // @ts-expect-error 宿主 ant-design-vue Table 未暴露 scroll 事件面
      onScroll: () => {},
    };
    expect(Object.keys(boundaryProps)).toEqual(['onScroll']);

    // 运行期属性面判别：宿主已声明的 onChange 在集合内，未声明的 onScroll 不在集合内
    const hostKeys = Object.keys(hostTableProps());
    expect(hostKeys).toContain('onChange');
    expect(hostKeys).not.toContain('onScroll');
  });

  // ----------------------------------------------------
  // PT-A27 [判别]: Provider 注入的 columns / dataSource 不参与表格渲染（来源为 table 实例）
  // 类型面判别由本节 `@ts-expect-error` 承担（vue-tsc 覆盖 __tests__）
  // ----------------------------------------------------
  it('PT-A27 [判别]: Provider 注入的 columns / dataSource 不生效，列与数据源取自 table 实例', async () => {
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
  // PT-A28 [判别]: table 插槽作用域 size 与表格实际使用的尺寸一致
  // ----------------------------------------------------
  it('PT-A28 [判别]: table 插槽作用域 size 下发有效值（Provider 注入值优先于本地未绑定）', async () => {
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
  // PT-A29 [判别]: searchFormConfig 的 container / hidden 由 ProTable 消费，不下发 SearchForm 与原生 form
  // ----------------------------------------------------
  it('PT-A29 [判别]: searchFormConfig 的 container / hidden 不下发 SearchForm 与原生 form', async () => {
    const CustomContainer = defineComponent({
      name: 'PTA29Container',
      setup(_, { slots }) {
        return () =>
          h('section', { class: 'pta29-container' }, slots.default?.());
      },
    });
    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
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

    // container / hidden 不透传给 SearchForm，也不落为原生 form 属性
    const searchForm = wrapper.findComponent({ name: 'SearchForm' });
    expect(searchForm.exists()).toBe(true);
    const searchFormProps = searchForm.props() as Record<string, any>;
    expect('container' in searchFormProps).toBe(false);
    expect('hidden' in searchFormProps).toBe(false);
    const formElement = wrapper.find('form');
    expect(formElement.exists()).toBe(true);
    expect(formElement.attributes('container')).toBeUndefined();
    expect(formElement.attributes('hidden')).toBeUndefined();
    wrapper.unmount();

    // hidden: true 仍隐藏搜索区域（显隐语义由 ProTable 自身承担）
    const hiddenWrapper = mount(ProTable, {
      props: {
        table,
        searchFormConfig: { hidden: true },
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(hiddenWrapper.find('.pro-table_search-form').exists()).toBe(false);
    hiddenWrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A30 [判别]: 列 hidden 的 Ref 形态经 ColumnControl 勾选后仍与外部 ref 保持绑定
  // ----------------------------------------------------
  it('PT-A30 [判别]: hidden 为 Ref 的列经列控制勾选后仍与外部 ref 保持绑定', async () => {
    const hiddenRef = ref(false);
    const table = useTable({
      columns: [
        { dataIndex: 'name', title: '姓名', hidden: hiddenRef },
        { dataIndex: 'age', title: '年龄' },
      ],
      dataSource: [{ name: '甲', age: 18 }],
    });
    const wrapper = mount(ProTable, {
      props: { table, control: { columnControl: true } },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 勾选控件读到的初始态来自 ref
    expect(wrapper.find('.pro-table_header_column-control').exists()).toBe(
      true
    );
    const rawColumn = toRaw(table.columns.value[0]);
    expect(rawColumn.hidden).toBe(hiddenRef);

    // 经 ColumnControl 反选该列：写回值应落到外部 ref，而非覆盖 ref 本身
    table.setColumn('name', { hidden: true });
    await flushPromises();
    expect(hiddenRef.value).toBe(true);
    expect(toRaw(table.columns.value[0]).hidden).toBe(hiddenRef);
    expect(wrapper.findAll('thead th').map(th => th.text())).not.toContain(
      '姓名'
    );

    // 外部 ref 仍是唯一来源：改回 false 后列重新渲染
    hiddenRef.value = false;
    await flushPromises();
    expect(wrapper.findAll('thead th').map(th => th.text())).toContain('姓名');
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
  // PT-A36 [判别]: 下发宿主的属性面只放行调用方的 v-model 通道，声明模型的回写通道不外泄
  // ----------------------------------------------------
  it('PT-A36 [判别]: computedTableProps 仅含调用方 v-model 通道，声明模型的回写通道不外泄', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [{ id: 1 }],
    });
    const size = ref<any>('small');
    const expandedKeys = ref<any[]>([]);
    const Parent = defineComponent({
      components: { ProTable },
      setup: () => ({ table, size, expandedKeys }),
      template: `
        <ProTable :table="table" v-model:size="size" v-model:expanded-row-keys="expandedKeys" />
      `,
    });
    const wrapper = mount(Parent, { global: { stubs: { transition: false } } });
    await flushPromises();

    const forwarded = (wrapper.findComponent(ProTable as any).vm as any)
      .computedTableProps;
    const updateKeys = Object.keys(forwarded)
      .filter(key => key.startsWith('onUpdate:'))
      .sort();

    // 调用方的 v-model 通道必须转交宿主表格（否则宿主 emit 无人接收，v-model 静默失效）
    expect(updateKeys).toContain('onUpdate:expandedRowKeys');
    // 声明模型（size / loading）的回写通道不进入 attrs，故不会随透传下发
    expect(
      Object.keys((wrapper.findComponent(ProTable as any).vm as any).$attrs)
    ).not.toContain('onUpdate:size');
    expect(updateKeys).not.toContain('onUpdate:size');
    expect(updateKeys).not.toContain('onUpdate:loading');
    // 宿主表格收不到这两个通道
    const hostAttrs = Object.keys(
      (wrapper.findComponent({ name: 'ATable' }).vm as any).$attrs
    );
    expect(hostAttrs).not.toContain('onUpdate:size');
    expect(hostAttrs).not.toContain('onUpdate:loading');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A37 [判别]: 模板中以 kebab-case 绑定 :data-source / :columns 时按显式绑定取值
  // ----------------------------------------------------
  it('PT-A37 [判别]: kebab-case 绑定的 :data-source / :columns 覆盖 table 实例同名数据', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'name', title: '实例列', key: 'name' }],
      dataSource: [{ name: '实例数据' }],
    });
    const rows = [{ age: 18 }];
    const columns = [{ dataIndex: 'age', title: '显式列', key: 'age' }];
    const Parent = defineComponent({
      components: { ProTable },
      setup: () => ({ table, rows, columns }),
      template: `
        <ProTable :table="table" :columns="columns" :data-source="rows" :add-index-column="false" />
      `,
    });
    const wrapper = mount(Parent, { global: { stubs: { transition: false } } });
    await flushPromises();

    const hostTable = wrapper.findComponent({ name: 'ATable' });
    // 显式绑定优先于 table 实例：列与数据源均按调用方传入值渲染
    expect(hostTable.props('dataSource')).toEqual(rows);
    expect(
      hostTable.props('columns').map((column: any) => column.title)
    ).toEqual(['显式列']);
    expect(wrapper.text()).toContain('18');
    expect(wrapper.text()).not.toContain('实例数据');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A38 [判别]: 不可注入键在注入层静默剔除，运行期新增同样被剔除
  // ----------------------------------------------------
  it('PT-A38 [判别]: 不可注入键经注入层静默剔除，运行期新增同样被剔除且不产生告警', async () => {
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

    // 默认值不含不可注入键（未挂 Provider 时消费侧取 default 也不会拿到失效配置）
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

  // ----------------------------------------------------
  // PT-U1 [判别]: 显式 undefined 绑定不冲掉 Provider 注入
  // ----------------------------------------------------
  it('PT-U1 [判别]: 显式 :bordered="undefined" 保留下发的 Provider 注入值', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [{ id: 1, name: '甲', status: 'normal' }],
    });
    const wrapper = mount(ProComponentProvider, {
      props: { componentVars: { 'pro-table': { bordered: true } } },
      slots: {
        default: () =>
          h(ProTable, {
            table,
            addIndexColumn: false,
            // 判别的关键：绑定键存在但值为 undefined
            bordered: undefined,
          }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 判别点：未显式指定时该键不下发，Provider 注入值保持生效
    expect(wrapper.findComponent({ name: 'ATable' }).props('bordered')).toBe(
      true
    );

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-U2 [判别]: v-model:size 初值为 undefined 时 Provider 尺寸不被短路
  // ----------------------------------------------------
  it('PT-U2 [判别]: v-model:size 未赋初值时 Provider 注入尺寸继续生效', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [{ id: 1, name: '甲', status: 'normal' }],
    });
    const sizeModel = ref<any>(undefined);
    const wrapper = mount(ProComponentProvider, {
      props: {
        componentVars: { 'pro-table': { size: 'small', control: true } },
      },
      slots: {
        default: () =>
          h(ProTable, {
            table,
            addIndexColumn: false,
            size: sizeModel.value,
            'onUpdate:size': (val: any) => {
              sizeModel.value = val;
            },
          }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 判别点：绑定通道存在但值为 undefined，不应短路 Provider 注入尺寸
    expect(wrapper.findComponent({ name: 'ATable' }).props('size')).toBe(
      'small'
    );
    expect(
      (wrapper.findComponent(SizeControl as any).vm as any).currentSize
    ).toBe('small');

    // 反向约束：控件回写后本地值优先
    (wrapper.findComponent(SizeControl as any).vm as any).size = 'middle';
    await flushPromises();
    expect(wrapper.findComponent({ name: 'ATable' }).props('size')).toBe(
      'middle'
    );
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-U3 [判别]: 显式 columns 模式下列控入口隐藏（无可写回列来源）
  // ----------------------------------------------------
  it('PT-U3 [判别]: 显式 :columns 时隐藏列控入口，table 列模式下正常展示', async () => {
    const columns = [{ dataIndex: 'name', title: '姓名' }];
    const explicit = mount(ProTable, {
      props: {
        columns,
        dataSource: [{ name: '甲' }],
        control: { columnControl: true },
        addIndexColumn: false,
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 判别点：显式列模式下渲染源不受 table.setColumn 影响，列控入口不渲染
    expect(explicit.findComponent(ColumnControl).exists()).toBe(false);
    explicit.unmount();

    // 反向约束：table 列模式下列控入口照常渲染
    const table = useTable({ columns, dataSource: [{ name: '甲' }] } as any);
    const byTable = mount(ProTable, {
      props: { table, control: { columnControl: true }, addIndexColumn: false },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(byTable.findComponent(ColumnControl).exists()).toBe(true);
    byTable.unmount();
  });

  // ----------------------------------------------------
  // PT-U4 [判别]: 环状分组列渲染不爆栈
  // ----------------------------------------------------
  it('PT-U4 [判别]: 环状分组列渲染不爆栈，重复祖先引用被剔除', async () => {
    const group: any = { key: 'group', title: '分组', children: [] as any[] };
    group.children.push(group);
    const table = useTable({
      columns: [group, { dataIndex: 'name', title: '姓名' }],
      dataSource: [{ name: '甲' }],
    });
    const wrapper = mount(ProTable, {
      props: { table, addIndexColumn: false },
      global: { stubs: { transition: false } },
    });
    try {
      await flushPromises();
      // 判别点：环状引用被剔除后正常渲染表头，而非 RangeError 爆栈
      expect(wrapper.text()).toContain('分组');
      expect(wrapper.text()).toContain('姓名');
    } finally {
      wrapper.unmount();
    }
  });

  // ----------------------------------------------------
  // PT-U7 [判别]: 双节点互引用分组列
  // ----------------------------------------------------
  it('PT-U7 [判别]: a→b→a 互引用分组列渲染终止，祖先引用不重复展开', async () => {
    const parent: any = { key: 'parent', title: '父' };
    const child: any = { key: 'child', title: '子' };
    parent.children = [child];
    child.children = [parent];

    const table = useTable({
      columns: [parent, { dataIndex: 'name', title: '姓名' }],
      dataSource: [{ name: '甲' }],
    });
    const wrapper = mount(ProTable, {
      props: { table, addIndexColumn: false },
      global: { stubs: { transition: false } },
    });
    try {
      await flushPromises();
      const headers = wrapper.findAll('thead th').map(th => th.text());
      expect(headers).toEqual(['父', '姓名', '子']);
    } finally {
      wrapper.unmount();
    }
  });

  // ----------------------------------------------------
  // PT-U8 [判别]: 挂载后新增 columns
  // ----------------------------------------------------
  it('PT-U8 [判别]: 初始未绑定 columns，挂载后新增立即切换渲染列', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'name', title: 'A' }],
      dataSource: [{ name: 'a' }],
    });
    const wrapper = mount(ProTable, {
      props: { table, addIndexColumn: false },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.findAll('thead th').map(th => th.text())).toEqual(['A']);

    await wrapper.setProps({
      columns: [{ dataIndex: 'age', title: 'B' }] as any,
    });
    await flushPromises();
    expect(wrapper.findAll('thead th').map(th => th.text())).toEqual(['B']);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-U6 [判别]: 无 table 实例时序号列随 :pagination 偏移
  // ----------------------------------------------------
  it('PT-U6 [判别]: 仅传 columns / dataSource 时序号列跟随分页偏移', async () => {
    const wrapper = mount(ProTable, {
      props: {
        columns: [{ dataIndex: 'name', title: '姓名' }],
        dataSource: [{ name: 'a' }, { name: 'b' }],
        pagination: { current: 2, pageSize: 5, total: 20 },
        addIndexColumn: true,
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 判别点：无 table 实例时不再退化为 index + 1，序号随有效分页偏移
    const indexCells = wrapper
      .findAll('tbody tr')
      .map(row => row.find('td').text());
    expect(indexCells).toEqual(['6', '7']);

    // 反向约束：分页关闭时序号从 1 开始
    const noPager = mount(ProTable, {
      props: {
        columns: [{ dataIndex: 'name', title: '姓名' }],
        dataSource: [{ name: 'a' }],
        pagination: false,
        addIndexColumn: true,
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(noPager.find('tbody tr td').text()).toBe('1');

    wrapper.unmount();
    noPager.unmount();
  });
});
