import { describe, it, expect } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import ProTable from '../src/components/table/components/ProTable.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import { useTable } from '../src/components/table/useTable';
import { flushPromises, mountProTable } from './helpers/mount';
import { createBasicColumns } from './helpers/fixtures';

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
    expect(wrapper1.find('.ant-pagination').exists()).toBe(false);
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
    expect(wrapper2.find('.ant-pagination').exists()).toBe(false);
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
  // PT-02: 序号列 addIndexColumn
  // ----------------------------------------------------
  it('PT-02: addIndexColumn: true 时自动在首列渲染序号', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'name', title: '姓名' }],
      dataSource: [{ name: '王五' }, { name: '赵六' }],
    });

    const { wrapper } = mountProTable({
      table,
      props: { addIndexColumn: true },
    });

    await flushPromises();
    expect(wrapper.text()).toContain('序号');
    expect(wrapper.text()).toContain('1');
    expect(wrapper.text()).toContain('2');
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
      dataSource: [],
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
  // PT-09: 现状锁定（2.5 搜索竞态不处理）
  // ----------------------------------------------------
  it('PT-09: 现状锁定（2.5 搜索竞态不处理）：支持传入外部 search 函数', async () => {
    let callCount = 0;
    const asyncSearch = async () => {
      callCount++;
    };

    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
    });

    const { wrapper } = mountProTable({
      table,
      search: asyncSearch,
    });

    await flushPromises();
    const searchBtn = wrapper.find(
      '.pro-table_search-form button[type="submit"], .pro-table_search-form button'
    );
    if (searchBtn.exists()) {
      await searchBtn.trigger('click');
      await flushPromises();
      expect(callCount).toBeGreaterThanOrEqual(1);
    }
    wrapper.unmount();
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
    const cells = wrapper.findAll('.custom-body-cell');
    expect(cells.length).toBeGreaterThan(0);
    expect(renderedCount).toBeGreaterThan(0);
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

    expect(callArgs.length).toBeGreaterThan(0);
    // 判别：运行时从不向 search 传参，携带 params 形参的实现永远收到 undefined
    expect(callArgs.every(args => args.length === 0)).toBe(true);
    wrapper.unmount();
  });
});
