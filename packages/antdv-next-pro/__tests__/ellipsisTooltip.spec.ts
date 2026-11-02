import { describe, it, expect, vi } from 'vitest';
import { KeepAlive, defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { ConfigProvider } from 'antdv-next';
import { Tooltip } from '../src/shared/ui';
import ProTable from '../src/components/table/components/ProTable.vue';
import ProComponentProvider from '../src/components/component-provider';
import { flushPromises, mountProTable } from './helpers/mount';
import { useTable } from '../src/components/table/hooks/useTable';

/** 等待 Tooltip 延迟展示 */
const waitForOpenDelay = () => new Promise(resolve => setTimeout(resolve, 220));

/** 等待 Tooltip 延迟关闭 */
const waitForCloseDelay = () =>
  new Promise(resolve => setTimeout(resolve, 120));

/** 让单元格呈现横向溢出与有效尺寸 */
const mockOverflow = (cell: Element) => {
  Object.defineProperty(cell, 'clientWidth', {
    configurable: true,
    value: 100,
  });
  Object.defineProperty(cell, 'scrollWidth', {
    configurable: true,
    value: 200,
  });
  cell.getBoundingClientRect = () =>
    ({
      left: 10,
      top: 20,
      width: 100,
      height: 30,
      right: 110,
      bottom: 50,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    }) as DOMRect;
};

const mountWithEllipsis = (ellipsisTooltip?: any) => {
  const table = useTable({
    columns: [
      {
        dataIndex: 'name',
        title: '姓名',
        ellipsis: { showTooltip: true },
      },
      { dataIndex: 'age', title: '年龄' },
    ],
    dataSource: [
      { name: '张三', age: 18 },
      { name: '李四', age: 20 },
    ],
  });
  return mountProTable({
    table,
    attachToBody: true,
    props: {
      addIndexColumn: false,
      ...(ellipsisTooltip ? { ellipsisTooltip } : {}),
    },
  });
};

describe('ProTable 共享省略 Tooltip', () => {
  // ----------------------------------------------------
  // PT-A50 [判别]: 列转换只改写开启 showTooltip 的列
  // ----------------------------------------------------
  it('PT-A50 [判别]: showTooltip 列关闭原生 title 并写入单元格标记，其余列保持原样', async () => {
    const { wrapper } = mountWithEllipsis();
    await flushPromises();

    const aTable = wrapper.findComponent({ name: 'ATable' });
    const columns = aTable.props('columns') as any[];

    // 宿主不感知 showTooltip，原生 title 关闭
    expect(columns[0].ellipsis).toEqual({ showTitle: false });
    expect(columns[0].onCell).toBeTypeOf('function');
    expect(columns[0].onCell({ name: '张三' }, 0)).toMatchObject({
      'data-pro-table-ellipsis': '',
    });

    // 未开启的列保持原对象语义，不追加 onCell
    expect(columns[1].ellipsis).toBeUndefined();
    expect(columns[1].onCell).toBeUndefined();

    // 标记落到 body 单元格，且不输出原生 title
    const cells = wrapper.findAll('td[data-pro-table-ellipsis]');
    expect(cells).toHaveLength(2);
    expect(cells[0].attributes('title')).toBeUndefined();

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A51 [判别]: 多个溢出单元格共用同一个 Tooltip 实例
  // ----------------------------------------------------
  it('PT-A51 [判别]: 多个单元格溢出时只渲染一个 Tooltip，并按当前单元格更新文本', async () => {
    const { wrapper } = mountWithEllipsis();
    await flushPromises();

    const cells = wrapper.findAll('td[data-pro-table-ellipsis]');
    expect(cells).toHaveLength(2);
    expect(wrapper.findAllComponents(Tooltip)).toHaveLength(1);

    mockOverflow(cells[0].element);
    await cells[0].trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();

    const tooltip = wrapper.findComponent(Tooltip);
    expect(tooltip.props('open')).toBe(true);
    expect(tooltip.props('title')).toBe('张三');
    expect(document.body.querySelector('.ant-tooltip')).not.toBeNull();
    expect(document.querySelector('.ant-tooltip')!.textContent).toContain(
      '张三'
    );
    const anchor = document.body.querySelector(
      '.pro-table_ellipsis-tooltip-anchor'
    ) as HTMLElement;
    expect(anchor.style.position).toBe('fixed');
    expect(anchor.style.left).toBe('10px');
    expect(anchor.style.top).toBe('20px');

    // 移动到第二个单元格：实例不变，文本切换
    mockOverflow(cells[1].element);
    await cells[1].trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();

    expect(wrapper.findAllComponents(Tooltip)).toHaveLength(1);
    expect(wrapper.findComponent(Tooltip).props('title')).toBe('李四');
    expect(document.querySelector('.ant-tooltip')!.textContent).toContain(
      '李四'
    );

    // 离开单元格后关闭
    await cells[1].trigger('mouseout');
    await waitForCloseDelay();
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(false);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A52 [判别]: 未溢出单元格不展示 Tooltip
  // ----------------------------------------------------
  it('PT-A52 [判别]: 单元格文本未溢出时不展示共享 Tooltip', async () => {
    const { wrapper } = mountWithEllipsis();
    await flushPromises();

    const cell = wrapper.find('td[data-pro-table-ellipsis]');
    Object.defineProperty(cell.element, 'clientWidth', {
      configurable: true,
      value: 200,
    });
    Object.defineProperty(cell.element, 'scrollWidth', {
      configurable: true,
      value: 200,
    });
    cell.element.getBoundingClientRect = () =>
      ({
        left: 10,
        top: 20,
        width: 100,
        height: 30,
        right: 110,
        bottom: 50,
        x: 10,
        y: 20,
        toJSON: () => ({}),
      }) as DOMRect;

    await cell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();

    expect(wrapper.findComponent(Tooltip).props('open')).toBe(false);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A53 [判别]: 用户 onCell 与标记属性合并
  // ----------------------------------------------------
  it('PT-A53 [判别]: 列已有 onCell 时保留其返回值并追加标记属性', async () => {
    const table = useTable({
      columns: [
        {
          dataIndex: 'name',
          title: '姓名',
          ellipsis: { showTooltip: true },
          onCell: () => ({
            class: 'custom-cell',
            style: { color: 'red' },
          }),
        },
      ],
      dataSource: [{ name: '张三' }],
    });
    const { wrapper } = mountProTable({
      table,
      attachToBody: true,
      props: { addIndexColumn: false },
    });
    await flushPromises();

    const cell = wrapper.find('td.custom-cell');
    expect(cell.exists()).toBe(true);
    expect(cell.attributes('data-pro-table-ellipsis')).toBe('');
    expect(cell.attributes('style')).toContain('color: red');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A54 [判别]: 数据源变化关闭共享 Tooltip
  // ----------------------------------------------------
  it('PT-A54 [判别]: 数据源变化后关闭共享 Tooltip，避免锚点指向旧单元格', async () => {
    const { wrapper, table } = mountWithEllipsis();
    await flushPromises();

    const cell = wrapper.find('td[data-pro-table-ellipsis]');
    mockOverflow(cell.element);
    await cell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(true);

    table.dataSource.value = [{ name: '王五', age: 30 }];
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(false);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A63 [判别]: 锚点与浮层始终同容器，不随 ConfigProvider 漂移
  // ----------------------------------------------------
  it('PT-A63 [判别]: 锚点与浮层始终同容器，不随 ConfigProvider 漂移', async () => {
    const custom = document.createElement('div');
    custom.className = 'custom-popup-container';
    document.body.appendChild(custom);

    const table = useTable({
      columns: [
        { dataIndex: 'name', title: '姓名', ellipsis: { showTooltip: true } },
      ],
      dataSource: [{ name: '张三' }],
    } as any);

    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { getPopupContainer: () => custom }, () =>
            h(ProTable, { table, addIndexColumn: false })
          ),
      }),
      { attachTo: document.body }
    );
    await flushPromises();

    const cell = wrapper.find('td[data-pro-table-ellipsis]');
    mockOverflow(cell.element);
    await cell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();

    const anchor = document.querySelector(
      '.pro-table_ellipsis-tooltip-anchor'
    )!;
    const popup = document.querySelector('.ant-tooltip')!;
    expect(document.body.contains(anchor)).toBe(true);
    expect(document.body.contains(popup)).toBe(true);
    expect(anchor.closest('.custom-popup-container')).toBeNull();
    expect(popup.closest('.custom-popup-container')).toBeNull();

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A63b [判别]: 显式 ellipsisTooltip.getPopupContainer 时锚点与浮层都在该容器
  // ----------------------------------------------------
  it('PT-A63b [判别]: 显式 ellipsisTooltip.getPopupContainer 时锚点与浮层都在该容器', async () => {
    const custom = document.createElement('div');
    custom.className = 'custom-popup-container';
    document.body.appendChild(custom);

    const table = useTable({
      columns: [
        { dataIndex: 'name', title: '姓名', ellipsis: { showTooltip: true } },
      ],
      dataSource: [{ name: '张三' }],
    } as any);

    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { getPopupContainer: () => document.body }, () =>
            h(ProTable, {
              table,
              addIndexColumn: false,
              ellipsisTooltip: { getPopupContainer: () => custom },
            })
          ),
      }),
      { attachTo: document.body }
    );
    await flushPromises();

    const cell = wrapper.find('td[data-pro-table-ellipsis]');
    mockOverflow(cell.element);
    await cell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();

    const anchor = document.querySelector(
      '.pro-table_ellipsis-tooltip-anchor'
    )!;
    const popup = document.querySelector('.ant-tooltip')!;
    expect(anchor.closest('.custom-popup-container')).toBe(custom);
    expect(popup.closest('.custom-popup-container')).toBe(custom);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A60 [判别]: 无 showTooltip 列时不挂载共享 Tooltip
  // ----------------------------------------------------
  it('PT-A60 [判别]: 无 showTooltip 列时不挂载共享 Tooltip', async () => {
    const table = useTable({
      columns: [{ dataIndex: 'name', title: '姓名' }],
      dataSource: [{ name: '张三' }],
    });
    const { wrapper } = mountProTable({
      table,
      attachToBody: true,
      props: { addIndexColumn: false },
    });
    await flushPromises();

    expect(wrapper.findAllComponents(Tooltip)).toHaveLength(0);

    // 运行期出现 showTooltip 列时自动启用
    table.columns.value[0].ellipsis = { showTooltip: true };
    await flushPromises();
    expect(wrapper.findAllComponents(Tooltip)).toHaveLength(1);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A64 [判别]: 延迟内移出不打开，到期后打开
  // ----------------------------------------------------
  it('PT-A64 [判别]: 延迟内移出不打开，到期后打开', async () => {
    const { wrapper } = mountWithEllipsis();
    await flushPromises();

    const cell = wrapper.find('td[data-pro-table-ellipsis]');
    mockOverflow(cell.element);

    await cell.trigger('mouseover');
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(false);

    await cell.trigger('mouseout');
    await waitForOpenDelay();
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(false);

    await cell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(true);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A64b [判别]: ellipsisTooltip.mouseEnterDelay 为 0 时立即展示
  // ----------------------------------------------------
  it('PT-A64b [判别]: ellipsisTooltip.mouseEnterDelay 为 0 时立即展示', async () => {
    const table = useTable({
      columns: [
        { dataIndex: 'name', title: '姓名', ellipsis: { showTooltip: true } },
      ],
      dataSource: [{ name: '张三' }],
    });
    const { wrapper } = mountProTable({
      table,
      attachToBody: true,
      props: {
        addIndexColumn: false,
        ellipsisTooltip: { mouseEnterDelay: 0 },
      },
    });
    await flushPromises();

    const cell = wrapper.find('td[data-pro-table-ellipsis]');
    mockOverflow(cell.element);
    await cell.trigger('mouseover');
    await flushPromises();

    expect(wrapper.findComponent(Tooltip).props('open')).toBe(true);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A65 [判别]: 单次 hover 只读取一次单元格文本
  // ----------------------------------------------------
  it('PT-A65 [判别]: 单次 hover 只读取一次单元格文本', async () => {
    const { wrapper } = mountWithEllipsis();
    await flushPromises();

    const cell = wrapper.find('td[data-pro-table-ellipsis]');
    let reads = 0;
    Object.defineProperty(cell.element, 'innerText', {
      configurable: true,
      get() {
        reads += 1;
        return '张三';
      },
    });
    mockOverflow(cell.element);

    await cell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();

    expect(reads).toBe(1);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A59 [判别]: onChange 的 sorter.column 还原为原始列
  // ----------------------------------------------------
  it('PT-A59 [判别]: onChange 的 sorter.column 还原为原始列', async () => {
    const table = useTable({
      columns: [
        {
          dataIndex: 'name',
          title: '姓名',
          sorter: true,
          ellipsis: { showTooltip: true },
        },
      ],
      dataSource: [{ name: 'b' }, { name: 'a' }],
    });
    const onChange = vi.fn();
    const { wrapper } = mountProTable({
      table,
      attachToBody: true,
      props: { addIndexColumn: false, onChange },
    });
    await flushPromises();

    const sorters = wrapper.findAll('.ant-table-column-sorters');
    expect(sorters.length).toBeGreaterThan(0);
    await sorters[0].trigger('click');
    await flushPromises();

    expect(onChange).toHaveBeenCalled();
    const sorter = onChange.mock.calls[0][2];
    expect(sorter.column).toBe(table.columns.value[0]);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A59b [判别]: 多列排序时 sorter 数组元素也还原为原始列
  // ----------------------------------------------------
  it('PT-A59b [判别]: 多列排序时 sorter 数组元素也还原为原始列', async () => {
    const table = useTable({
      columns: [
        {
          dataIndex: 'name',
          title: '姓名',
          sorter: { multiple: 1 },
          ellipsis: { showTooltip: true },
        },
        {
          dataIndex: 'age',
          title: '年龄',
          sorter: { multiple: 2 },
          ellipsis: { showTooltip: true },
        },
      ],
      dataSource: [
        { name: 'b', age: 2 },
        { name: 'a', age: 1 },
      ],
    });
    const onChange = vi.fn();
    const { wrapper } = mountProTable({
      table,
      attachToBody: true,
      props: { addIndexColumn: false, onChange },
    });
    await flushPromises();

    const sorters = wrapper.findAll('.ant-table-column-sorters');
    expect(sorters.length).toBe(2);
    await sorters[0].trigger('click');
    await flushPromises();
    await sorters[1].trigger('click');
    await flushPromises();

    const sorter = onChange.mock.calls.at(-1)![2];
    expect(Array.isArray(sorter)).toBe(true);
    expect(sorter[0].column).toBe(table.columns.value[0]);
    expect(sorter[1].column).toBe(table.columns.value[1]);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A61 [判别]: scroll / resize 关闭浮层
  // ----------------------------------------------------
  it('PT-A61 [判别]: scroll / resize 关闭浮层', async () => {
    const { wrapper } = mountWithEllipsis();
    await flushPromises();

    const cell = wrapper.find('td[data-pro-table-ellipsis]');
    mockOverflow(cell.element);

    await cell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(true);

    window.dispatchEvent(new Event('scroll'));
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(false);

    await cell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(true);

    window.dispatchEvent(new Event('resize'));
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(false);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A62 [判别]: KeepAlive 停用关闭浮层
  // ----------------------------------------------------
  it('PT-A62 [判别]: KeepAlive 停用关闭浮层', async () => {
    const table = useTable({
      columns: [
        { dataIndex: 'name', title: '姓名', ellipsis: { showTooltip: true } },
      ],
      dataSource: [{ name: '张三' }],
    });
    const show = ref(true);
    const Host = defineComponent({
      setup: () => () =>
        h(KeepAlive, null, {
          default: () =>
            show.value
              ? h(ProTable, { table, addIndexColumn: false })
              : h('div'),
        }),
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await flushPromises();

    const cell = wrapper.find('td[data-pro-table-ellipsis]');
    mockOverflow(cell.element);
    await cell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(true);

    show.value = false;
    await flushPromises();
    // 停用期间组件被 KeepAlive 缓存，重新激活后仍应保持关闭
    show.value = true;
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(false);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A66 [判别]: mouseLeaveDelay 默认 0.1s 延迟关闭
  // ----------------------------------------------------
  it('PT-A66 [判别]: mouseLeaveDelay 默认 0.1s 延迟关闭', async () => {
    const { wrapper } = mountWithEllipsis();
    await flushPromises();

    const cell = wrapper.find('td[data-pro-table-ellipsis]');
    mockOverflow(cell.element);
    await cell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(true);

    await cell.trigger('mouseout');
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(true);

    await waitForCloseDelay();
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(false);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A66b [判别]: mouseLeaveDelay 为 0 时立即关闭
  // ----------------------------------------------------
  it('PT-A66b [判别]: mouseLeaveDelay 为 0 时立即关闭', async () => {
    const { wrapper } = mountWithEllipsis({ mouseLeaveDelay: 0 });
    await flushPromises();

    const cell = wrapper.find('td[data-pro-table-ellipsis]');
    mockOverflow(cell.element);
    await cell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(true);

    await cell.trigger('mouseout');
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(false);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A66c [判别]: 表内无关 mouseout 不重置关闭计时
  // ----------------------------------------------------
  it('PT-A66c [判别]: 表内无关 mouseout 不重置关闭计时', async () => {
    const { wrapper } = mountWithEllipsis();
    await flushPromises();

    const cell = wrapper.find('td[data-pro-table-ellipsis]');
    mockOverflow(cell.element);
    await cell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(true);

    await cell.trigger('mouseout');
    await new Promise(resolve => setTimeout(resolve, 50));
    await wrapper.find('thead').trigger('mouseout');
    await new Promise(resolve => setTimeout(resolve, 80));
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(false);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A67 [判别]: TooltipProps 展示字段透传到宿主 Tooltip
  // ----------------------------------------------------
  it('PT-A67 [判别]: TooltipProps 展示字段透传到宿主 Tooltip', async () => {
    const { wrapper } = mountWithEllipsis({
      placement: 'bottom',
      arrow: false,
      autoAdjustOverflow: false,
      color: 'red',
      rootClass: 'custom-tooltip',
      styles: {
        root: { color: 'red' },
        container: { padding: '2px' },
      },
    });
    await flushPromises();

    const cell = wrapper.find('td[data-pro-table-ellipsis]');
    mockOverflow(cell.element);
    await cell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();

    const tooltip = wrapper.findComponent(Tooltip);
    expect(tooltip.props('placement')).toBe('bottom');
    expect(tooltip.props('arrow')).toBe(false);
    expect(tooltip.props('autoAdjustOverflow')).toBe(false);
    expect(tooltip.props('color')).toBe('red');
    expect(tooltip.props('rootClass')).toBe('custom-tooltip');
    expect(tooltip.props('styles')).toEqual({
      root: { color: 'red' },
      container: { padding: '2px' },
    });

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A68 [判别]: setColumn 函数 key 为所有列开启 showTooltip
  // ----------------------------------------------------
  it('PT-A68 [判别]: setColumn 函数 key 为所有列开启 showTooltip', async () => {
    const table = useTable<any>({
      columns: [
        { dataIndex: 'name', title: '姓名' },
        { dataIndex: 'age', title: '年龄' },
      ],
      dataSource: [
        { name: '张三', age: 18 },
        { name: '李四', age: 20 },
      ],
    });
    const { wrapper } = mountProTable({
      table,
      attachToBody: true,
      props: { addIndexColumn: false },
    });
    await flushPromises();
    expect(wrapper.findAll('td[data-pro-table-ellipsis]').length).toBe(0);

    table.setColumn(() => true, { ellipsis: { showTooltip: true } });
    await flushPromises();

    expect(
      table.columns.value.every(
        (column: any) => column.ellipsis?.showTooltip === true
      )
    ).toBe(true);
    const cells = wrapper.findAll('td[data-pro-table-ellipsis]');
    expect(cells.length).toBe(4);

    mockOverflow(cells[0].element);
    await cells[0].trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(true);
    expect(wrapper.findComponent(Tooltip).props('title')).toBe('张三');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A68b [判别]: 嵌套 ProTable 只响应内层标记单元格
  // ----------------------------------------------------
  it('PT-A68b [判别]: 嵌套 ProTable 只响应内层标记单元格', async () => {
    const inner = useTable({
      columns: [
        { dataIndex: 'name', title: '内层', ellipsis: { showTooltip: true } },
      ],
      dataSource: [{ name: 'inner' }],
    });
    const outer = useTable({
      columns: [
        {
          dataIndex: 'name',
          title: '外层',
          ellipsis: { showTooltip: true },
        },
      ],
      dataSource: [
        { name: h(ProTable, { table: inner, addIndexColumn: false }) },
      ],
    });

    const wrapper = mount(ProTable as any, {
      props: { table: outer, addIndexColumn: false },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const roots = wrapper.findAll('[data-pro-table-root]');
    expect(roots.length).toBe(2);
    const innerCell = roots[1].find('td[data-pro-table-ellipsis]');
    expect(innerCell.exists()).toBe(true);

    mockOverflow(innerCell.element);
    await innerCell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();

    const openTooltips = wrapper
      .findAllComponents(Tooltip)
      .filter(tooltip => tooltip.props('open'));
    expect(openTooltips).toHaveLength(1);
    expect(openTooltips[0].props('title')).toBe('inner');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A68c [判别]: 外层打开后移入内层，外层关闭
  // ----------------------------------------------------
  it('PT-A68c [判别]: 外层打开后移入内层，外层关闭', async () => {
    const inner = useTable({
      columns: [
        { dataIndex: 'name', title: '内层', ellipsis: { showTooltip: true } },
      ],
      dataSource: [{ name: 'inner' }],
    });
    const outer = useTable({
      columns: [
        {
          dataIndex: 'name',
          title: '外层',
          ellipsis: { showTooltip: true },
        },
      ],
      dataSource: [
        { name: h(ProTable, { table: inner, addIndexColumn: false }) },
      ],
    });

    const wrapper = mount(ProTable as any, {
      props: { table: outer, addIndexColumn: false },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const roots = wrapper.findAll('[data-pro-table-root]');
    const outerCell = roots[0].find('td[data-pro-table-ellipsis]');
    const innerCell = roots[1].find('td[data-pro-table-ellipsis]');
    mockOverflow(outerCell.element);
    mockOverflow(innerCell.element);

    await outerCell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();
    expect(
      wrapper
        .findAllComponents(Tooltip)
        .filter(tooltip => tooltip.props('open'))
    ).toHaveLength(1);

    await outerCell.trigger('mouseout', {
      relatedTarget: innerCell.element,
    });
    await innerCell.trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();

    const openTooltips = wrapper
      .findAllComponents(Tooltip)
      .filter(tooltip => tooltip.props('open'));
    expect(openTooltips).toHaveLength(1);
    expect(openTooltips[0].props('title')).toBe('inner');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A69 [判别]: ellipsisTooltip: true 全局启用所有列
  // ----------------------------------------------------
  it('PT-A69 [判别]: ellipsisTooltip: true 全局启用所有列', async () => {
    const table = useTable({
      columns: [
        { dataIndex: 'name', title: '姓名' },
        { dataIndex: 'age', title: '年龄' },
      ],
      dataSource: [
        { name: '张三', age: 18 },
        { name: '李四', age: 20 },
      ],
    });
    const { wrapper } = mountProTable({
      table,
      attachToBody: true,
      props: { addIndexColumn: false, ellipsisTooltip: true },
    });
    await flushPromises();

    expect(
      table.columns.value.every((column: any) => column.ellipsis === undefined)
    ).toBe(true);
    const cells = wrapper.findAll('td[data-pro-table-ellipsis]');
    expect(cells.length).toBe(4);

    mockOverflow(cells[0].element);
    await cells[0].trigger('mouseover');
    await waitForOpenDelay();
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(true);
    expect(wrapper.findComponent(Tooltip).props('title')).toBe('张三');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A69b [判别]: 对象配置为 truthy 时同样全局启用
  // ----------------------------------------------------
  it('PT-A69b [判别]: 对象配置为 truthy 时同样全局启用', async () => {
    const table = useTable({
      columns: [
        { dataIndex: 'name', title: '姓名' },
        { dataIndex: 'age', title: '年龄' },
      ],
      dataSource: [{ name: '张三', age: 18 }],
    });
    const { wrapper } = mountProTable({
      table,
      attachToBody: true,
      props: {
        addIndexColumn: false,
        ellipsisTooltip: { mouseEnterDelay: 0 },
      },
    });
    await flushPromises();

    expect(wrapper.findAll('td[data-pro-table-ellipsis]').length).toBe(2);

    const cell = wrapper.find('td[data-pro-table-ellipsis]');
    mockOverflow(cell.element);
    await cell.trigger('mouseover');
    await flushPromises();
    expect(wrapper.findComponent(Tooltip).props('open')).toBe(true);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A69c [判别]: showTooltip: false 可退出全局启用
  // ----------------------------------------------------
  it('PT-A69c [判别]: showTooltip: false 可退出全局启用', async () => {
    const table = useTable({
      columns: [
        { dataIndex: 'name', title: '姓名' },
        {
          dataIndex: 'age',
          title: '年龄',
          ellipsis: { showTooltip: false },
        },
      ],
      dataSource: [
        { name: '张三', age: 18 },
        { name: '李四', age: 20 },
      ],
    });
    const { wrapper } = mountProTable({
      table,
      attachToBody: true,
      props: { addIndexColumn: false, ellipsisTooltip: true },
    });
    await flushPromises();

    const cells = wrapper.findAll('td[data-pro-table-ellipsis]');
    expect(cells.length).toBe(2);
    expect(
      cells.every(cell => cell.text() === '张三' || cell.text() === '李四')
    ).toBe(true);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A69d [判别]: ellipsis: false 可退出全局启用
  // ----------------------------------------------------
  it('PT-A69d [判别]: ellipsis: false 可退出全局启用', async () => {
    const table = useTable({
      columns: [
        { dataIndex: 'name', title: '姓名' },
        { dataIndex: 'age', title: '年龄', ellipsis: false },
      ],
      dataSource: [
        { name: '张三', age: 18 },
        { name: '李四', age: 20 },
      ],
    });
    const { wrapper } = mountProTable({
      table,
      attachToBody: true,
      props: { addIndexColumn: false, ellipsisTooltip: true },
    });
    await flushPromises();

    const cells = wrapper.findAll('td[data-pro-table-ellipsis]');
    expect(cells.length).toBe(2);
    expect(
      cells.every(cell => cell.text() === '张三' || cell.text() === '李四')
    ).toBe(true);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A69e [判别]: 运行期切换 ellipsisTooltip 同步增删标记
  // ----------------------------------------------------
  it('PT-A69e [判别]: 运行期切换 ellipsisTooltip 同步增删标记', async () => {
    const table = useTable({
      columns: [
        { dataIndex: 'name', title: '姓名' },
        { dataIndex: 'age', title: '年龄' },
      ],
      dataSource: [{ name: '张三', age: 18 }],
    });
    const { wrapper } = mountProTable({
      table,
      attachToBody: true,
      props: { addIndexColumn: false, ellipsisTooltip: true },
    });
    await flushPromises();
    expect(wrapper.findAll('td[data-pro-table-ellipsis]').length).toBe(2);

    await wrapper.setProps({ ellipsisTooltip: false });
    await flushPromises();
    expect(wrapper.findAll('td[data-pro-table-ellipsis]').length).toBe(0);

    await wrapper.setProps({ ellipsisTooltip: true });
    await flushPromises();
    expect(wrapper.findAll('td[data-pro-table-ellipsis]').length).toBe(2);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A69f [判别]: componentVars 可配置 ellipsisTooltip
  // ----------------------------------------------------
  it('PT-A69f [判别]: componentVars 可配置 ellipsisTooltip', async () => {
    const table = useTable({
      columns: [
        { dataIndex: 'name', title: '姓名' },
        { dataIndex: 'age', title: '年龄' },
      ],
      dataSource: [{ name: '张三', age: 18 }],
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ProComponentProvider,
            {
              componentVars: {
                'pro-table': { ellipsisTooltip: true },
              },
            },
            {
              default: () => h(ProTable, { table, addIndexColumn: false }),
            }
          ),
      }),
      { attachTo: document.body }
    );
    await flushPromises();

    expect(wrapper.findAll('td[data-pro-table-ellipsis]').length).toBe(2);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A69g [判别]: 本地 false 覆盖 Provider 的全局启用
  // ----------------------------------------------------
  it('PT-A69g [判别]: 本地 false 覆盖 Provider 的全局启用', async () => {
    const table = useTable({
      columns: [
        { dataIndex: 'name', title: '姓名' },
        { dataIndex: 'age', title: '年龄' },
      ],
      dataSource: [{ name: '张三', age: 18 }],
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ProComponentProvider,
            {
              componentVars: {
                'pro-table': { ellipsisTooltip: true },
              },
            },
            {
              default: () =>
                h(ProTable, {
                  table,
                  addIndexColumn: false,
                  ellipsisTooltip: false,
                }),
            }
          ),
      }),
      { attachTo: document.body }
    );
    await flushPromises();

    expect(wrapper.findAll('td[data-pro-table-ellipsis]').length).toBe(0);

    wrapper.unmount();
  });
});
