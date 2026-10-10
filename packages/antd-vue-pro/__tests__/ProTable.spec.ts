import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, ref, toRaw } from 'vue';
import type { TableProps } from '../src/shared/ui';
import { mount } from '@vue/test-utils';
import ProTable from '../src/components/table/components/ProTable.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import { useTable } from '../src/components/table/hooks/useTable';
import type { ComponentVars } from '../src/components/component-provider';
import { flushPromises, mountProTable, expectWarn } from './helpers/mount';
import { createBasicColumns } from './helpers/fixtures';
import { Pagination } from 'ant-design-vue';

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

    // 编译期契约：loading 不在 componentVars.pro-table 的可配置面内
    // @ts-expect-error loading 已从 componentVars.pro-table 契约中移除
    const invalidVars: ComponentVars = { 'pro-table': { loading: true } };
    expect(invalidVars).toBeTruthy();
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
    } as any);

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
  });
});
